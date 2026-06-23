"""
MCP PolicyRAG — Servidor y Cliente (mini-protocolo JSON-RPC sobre STDIO)
=========================================================================
Capa ②: implementación desde cero, solo stdlib, determinista.

Demuestra:
  - Servidor MCP que expone PolicyRAG y una tool sensible (apply_flight_change)
  - Cliente MCP que hace handshake, lista tools y las invoca
  - Aprobación de permisos para acciones financieras sensibles

Ejecutar: python3 solucion_scratch.py
Modo servidor (interno): python3 solucion_scratch.py --server
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Any

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_DATOS = os.path.join(_HERE, "datos")

PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "airline-policy-rag-mcp"
SERVER_VERSION = "1.0.0"


def _load(filename: str) -> Any:
    with open(os.path.join(_DATOS, filename), encoding="utf-8") as f:
        return json.load(f)


POLITICA = _load("politica.json")
RESERVAS = _load("reservas.json")
PERMISOS = _load("permisos.json")

# ---------------------------------------------------------------------------
# Definición de tools (metadatos MCP simplificados)
# ---------------------------------------------------------------------------
TOOL_DEFINITIONS = [
    {
        "name": "policy_rag",
        "description": (
            "Consulta reglas de tarifa y penalidades de cambio filtradas por "
            "fare_class y route_type. Úsala para determinar si aplican cargos."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "fare_class": {"type": "string"},
                "route_type": {"type": "string"},
                "query": {"type": "string"},
            },
            "required": ["fare_class", "route_type"],
        },
        "sensitive": False,
        "scope": "read_policy",
    },
    {
        "name": "apply_flight_change",
        "description": (
            "Ejecuta el cambio de vuelo y cobra el monto indicado. "
            "Acción irreversible — requiere aprobación explícita del usuario."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "pnr": {"type": "string"},
                "new_flight_id": {"type": "string"},
                "amount_usd": {"type": "number"},
            },
            "required": ["pnr", "new_flight_id", "amount_usd"],
        },
        "sensitive": True,
        "scope": "financial",
    },
]

SENSITIVE_TOOLS = {t["name"] for t in TOOL_DEFINITIONS if t.get("sensitive")}


# ---------------------------------------------------------------------------
# Implementación de tools (lógica de negocio)
# ---------------------------------------------------------------------------

def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """RAG simplificado: lookup determinista en politica.json."""
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            chunks = [
                {
                    "text": (
                        f"Tarifa {fare_class} ({route_type}): "
                        f"{'cambio permitido' if regla.get('cambio_permitido') else 'cambio NO permitido'}. "
                        f"Penalidad: USD {regla.get('penalidad_usd', 0)}. "
                        f"{regla.get('nota', '')}"
                    ),
                    "source": regla.get("fuente", "fare-rules"),
                    "metadata": {
                        "fare_class": fare_class,
                        "route_type": route_type,
                    },
                }
            ]
            return {
                "query": query or f"penalidad {fare_class} {route_type}",
                "chunks": chunks,
                "penalidad_usd": regla.get("penalidad_usd"),
                "cambio_permitido": regla.get("cambio_permitido", False),
            }
    return {"error": f"No hay política para {fare_class!r} / {route_type!r}"}


def apply_flight_change(pnr: str, new_flight_id: str, amount_usd: float) -> dict:
    """Ejecuta el cambio de vuelo (stub determinista)."""
    reserva = RESERVAS.get(pnr)
    if not reserva:
        return {"error": f"PNR {pnr!r} no encontrado"}
    return {
        "status": "captured",
        "pnr": pnr,
        "passenger": reserva["passenger"],
        "previous_flight": reserva["flight_id"],
        "new_flight_id": new_flight_id,
        "amount_usd": round(amount_usd, 2),
        "transaction_id": "txn-mcp-20260617-001",
    }


TOOL_HANDLERS = {
    "policy_rag": policy_rag,
    "apply_flight_change": apply_flight_change,
}


# ---------------------------------------------------------------------------
# JSON-RPC helpers
# ---------------------------------------------------------------------------

def _rpc_ok(req_id: Any, result: Any) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _rpc_err(req_id: Any, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}


# ---------------------------------------------------------------------------
# Servidor MCP (STDIO)
# ---------------------------------------------------------------------------

class MCPServer:
    """Servidor MCP mínimo: JSON-RPC 2.0, una línea JSON por mensaje."""

    def __init__(self):
        self.initialized = False
        self.approved_permissions: set[str] = set()

    def handle(self, request: dict) -> dict:
        method = request.get("method")
        req_id = request.get("id")
        params = request.get("params") or {}

        if method == "initialize":
            return self._initialize(req_id, params)
        if method == "tools/list":
            return self._tools_list(req_id)
        if method == "tools/call":
            return self._tools_call(req_id, params)
        if method == "permissions/respond":
            return self._permissions_respond(req_id, params)
        return _rpc_err(req_id, -32601, f"Método desconocido: {method}")

    def _initialize(self, req_id: Any, params: dict) -> dict:
        client_version = params.get("protocolVersion", "")
        if client_version and client_version != PROTOCOL_VERSION:
            return _rpc_err(
                req_id,
                -32000,
                f"Versión incompatible: cliente={client_version}, servidor={PROTOCOL_VERSION}",
            )
        self.initialized = True
        return _rpc_ok(
            req_id,
            {
                "protocolVersion": PROTOCOL_VERSION,
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
                "capabilities": {
                    "tools": {"listChanged": False},
                    "permissions": {"approvalRequired": True},
                },
            },
        )

    def _tools_list(self, req_id: Any) -> dict:
        if not self.initialized:
            return _rpc_err(req_id, -32002, "Cliente no inicializado — llama initialize primero")
        tools = [
            {
                "name": t["name"],
                "description": t["description"],
                "inputSchema": t["inputSchema"],
            }
            for t in TOOL_DEFINITIONS
        ]
        return _rpc_ok(req_id, {"tools": tools})

    def _tools_call(self, req_id: Any, params: dict) -> dict:
        if not self.initialized:
            return _rpc_err(req_id, -32002, "Cliente no inicializado")

        name = params.get("name")
        arguments = params.get("arguments") or {}
        permission_token = params.get("_permission_token")

        if name not in TOOL_HANDLERS:
            return _rpc_err(req_id, -32602, f"Tool desconocida: {name}")

        # Gate de permisos para tools sensibles
        if name in SENSITIVE_TOOLS:
            perm_id = f"perm-{name}-{arguments.get('pnr', 'unknown')}"
            if permission_token != "approved" or perm_id not in self.approved_permissions:
                amount = arguments.get("amount_usd", 0)
                return _rpc_ok(
                    req_id,
                    {
                        "isError": False,
                        "content": [],
                        "permission_required": True,
                        "permission": {
                            "id": perm_id,
                            "tool": name,
                            "scope": "financial",
                            "reason": (
                                f"Acción financiera: cobro de USD {amount:.2f} "
                                f"para PNR {arguments.get('pnr', '?')}"
                            ),
                            "arguments": arguments,
                        },
                    },
                )

        try:
            result = TOOL_HANDLERS[name](**arguments)
        except TypeError as exc:
            return _rpc_err(req_id, -32603, f"Argumentos inválidos para {name}: {exc}")

        return _rpc_ok(
            req_id,
            {
                "isError": "error" in result,
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}],
                "structuredContent": result,
            },
        )

    def _permissions_respond(self, req_id: Any, params: dict) -> dict:
        perm_id = params.get("permission_id")
        decision = params.get("decision")
        if decision == "approved":
            self.approved_permissions.add(perm_id)
            return _rpc_ok(req_id, {"status": "approved", "permission_id": perm_id})
        return _rpc_ok(req_id, {"status": "denied", "permission_id": perm_id})

    def serve_stdio(self) -> None:
        """Lee JSON-RPC línea a línea desde stdin, escribe respuestas en stdout."""
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                request = json.loads(line)
            except json.JSONDecodeError:
                response = _rpc_err(None, -32700, "JSON inválido")
            else:
                response = self.handle(request)
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()


# ---------------------------------------------------------------------------
# Cliente MCP (STDIO sobre subprocess)
# ---------------------------------------------------------------------------

class MCPStdioClient:
    """Cliente MCP que habla JSON-RPC con un servidor vía pipes."""

    def __init__(self, proc: subprocess.Popen):
        self.proc = proc
        self._next_id = 1
        self.initialized = False

    def _send(self, method: str, params: dict | None = None) -> dict:
        req_id = self._next_id
        self._next_id += 1
        request = {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params or {}}
        assert self.proc.stdin is not None
        assert self.proc.stdout is not None
        self.proc.stdin.write(json.dumps(request, ensure_ascii=False) + "\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        if not line:
            raise RuntimeError("El servidor MCP cerró la conexión")
        response = json.loads(line)
        if "error" in response:
            raise RuntimeError(f"RPC error: {response['error']}")
        return response["result"]

    def initialize(self) -> dict:
        result = self._send(
            "initialize",
            {
                "protocolVersion": PROTOCOL_VERSION,
                "clientInfo": {"name": "airline-agent-client", "version": "1.0.0"},
            },
        )
        self.initialized = True
        return result

    def list_tools(self) -> list[dict]:
        result = self._send("tools/list")
        return result["tools"]

    def call_tool(self, name: str, arguments: dict, permission_token: str | None = None) -> dict:
        params: dict[str, Any] = {"name": name, "arguments": arguments}
        if permission_token:
            params["_permission_token"] = permission_token
        return self._send("tools/call", params)

    def respond_permission(self, permission_id: str, decision: str) -> dict:
        return self._send(
            "permissions/respond",
            {"permission_id": permission_id, "decision": decision},
        )

    def close(self) -> None:
        if self.proc.stdin:
            self.proc.stdin.close()
        self.proc.terminate()
        self.proc.wait(timeout=5)


# ---------------------------------------------------------------------------
# Agente que consume el servidor MCP (determinista, sin LLM real)
# ---------------------------------------------------------------------------

class PolicyRAGAgent:
    """
    Agente determinista que usa el cliente MCP para:
      1. Descubrir tools
      2. Consultar política vía policy_rag
      3. Intentar apply_flight_change → aprobación → éxito
    """

    def __init__(self, client: MCPStdioClient):
        self.client = client
        self.tools: list[dict] = []
        self.policy_result: dict | None = None
        self.change_result: dict | None = None

    def run(self, pnr: str, fare_class: str, route_type: str,
            new_flight_id: str, amount_usd: float) -> None:
        # Paso 1: handshake
        init_result = self.client.initialize()
        print(f"[Cliente] Handshake OK — servidor: {init_result['serverInfo']['name']}")
        caps = init_result.get("capabilities", {})
        print(f"[Cliente] Capabilities: tools={caps.get('tools')}, permissions={caps.get('permissions')}")

        # Paso 2: descubrir tools
        self.tools = self.client.list_tools()
        tool_names = [t["name"] for t in self.tools]
        print(f"[Cliente] Tools descubiertas ({len(self.tools)}): {tool_names}")

        assert "policy_rag" in tool_names, "policy_rag debe estar registrada en el servidor"
        assert "apply_flight_change" in tool_names, "apply_flight_change debe estar registrada"

        # Paso 3: consultar política (sin aprobación)
        print(f"\n[Agente] Llamando policy_rag(fare_class={fare_class!r}, route_type={route_type!r})")
        policy_resp = self.client.call_tool(
            "policy_rag",
            {"fare_class": fare_class, "route_type": route_type,
             "query": f"penalidad cambio {fare_class} {route_type}"},
        )
        self.policy_result = policy_resp["structuredContent"]
        penalidad = self.policy_result.get("penalidad_usd")
        print(f"[Agente] Observation policy_rag: penalidad_usd={penalidad}, "
              f"cambio_permitido={self.policy_result.get('cambio_permitido')}")
        chunk = self.policy_result["chunks"][0]
        print(f"[Agente] Chunk: {chunk['text'][:80]}...")

        # Paso 4: intentar cambio de vuelo (acción sensible — bloqueada)
        print(f"\n[Agente] Llamando apply_flight_change(pnr={pnr!r}, "
              f"new_flight_id={new_flight_id!r}, amount_usd={amount_usd})")
        change_resp = self.client.call_tool(
            "apply_flight_change",
            {"pnr": pnr, "new_flight_id": new_flight_id, "amount_usd": amount_usd},
        )

        if change_resp.get("permission_required"):
            perm = change_resp["permission"]
            print(f"[Agente] PERMISO REQUERIDO — scope={perm['scope']!r}")
            print(f"[Agente] Razón: {perm['reason']}")
            print(f"[Agente] Solicitando aprobación al usuario (demo: auto-aprobado)...")

            # Simular UI de aprobación (determinista: siempre aprueba)
            approval = self._request_user_approval(perm)
            if not approval:
                print("[Agente] Usuario DENEGÓ el permiso. Abortando.")
                return

            self.client.respond_permission(perm["id"], "approved")
            print(f"[Agente] Permiso {perm['id']!r} APROBADO — reintentando tool...")

            change_resp = self.client.call_tool(
                "apply_flight_change",
                {"pnr": pnr, "new_flight_id": new_flight_id, "amount_usd": amount_usd},
                permission_token="approved",
            )

        self.change_result = change_resp["structuredContent"]
        print(f"[Agente] Observation apply_flight_change: status={self.change_result.get('status')}, "
              f"txn={self.change_result.get('transaction_id')}")

    @staticmethod
    def _request_user_approval(permission: dict) -> bool:
        """Gate de aprobación determinista (en producción: UI real o HITL)."""
        # Demo: auto-aprueba acciones financieras con monto conocido
        return permission.get("scope") == "financial"


# ---------------------------------------------------------------------------
# Demo principal
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 64)
    print("MCP — PolicyRAG Server + Agente Cliente (stdlib, determinista)")
    print("=" * 64)

    # Arrancar servidor MCP en subprocess STDIO
    server_cmd = [sys.executable, os.path.abspath(__file__), "--server"]
    proc = subprocess.Popen(
        server_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    client = MCPStdioClient(proc)
    agent = PolicyRAGAgent(client)

    try:
        # Escenario: cambio de vuelo SCL-BOG-001 (template 01)
        # Penalidad USD 50 + diferencial USD 80 = USD 130
        agent.run(
            pnr="SCL-BOG-001",
            fare_class="ECONOMY_FLEX",
            route_type="internacional",
            new_flight_id="FL305",
            amount_usd=130.00,
        )

        print("\n" + "-" * 64)
        print("RESUMEN")
        print("-" * 64)
        print(f"Tools descubiertas: {[t['name'] for t in agent.tools]}")
        print(f"Penalidad (policy_rag): USD {agent.policy_result.get('penalidad_usd')}")
        print(f"Cobro (apply_flight_change): USD {agent.change_result.get('amount_usd')} "
              f"— {agent.change_result.get('status')}")

        # Verificaciones automáticas
        assert len(agent.tools) == 2
        assert agent.policy_result["penalidad_usd"] == 50
        assert agent.change_result["status"] == "captured"
        assert agent.change_result["pnr"] == "SCL-BOG-001"
        assert agent.change_result["transaction_id"] == "txn-mcp-20260617-001"

        print("\nTodas las verificaciones pasaron.")
        print("=" * 64)

    finally:
        client.close()


def run_server() -> None:
    MCPServer().serve_stdio()


if __name__ == "__main__":
    if "--server" in sys.argv:
        run_server()
    else:
        main()

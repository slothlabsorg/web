# Requiere: pip install fastmcp
"""
MCP PolicyRAG — Servidor y Cliente con FastMCP
==============================================
Capa ③: implementación ilustrativa con FastMCP (server + client STDIO/HTTP).

Este archivo es ILUSTRATIVO: no se ejecuta en el entorno del curso
(requiere pip install y, opcionalmente, red para HTTP).

Para ejecutarlo cuando tengas pip:
  pip install fastmcp
  python3 solucion_framework.py              # demo STDIO (server + client)
  python3 solucion_framework.py --http       # demo HTTP (levanta server y client)
  python3 solucion_framework.py --server     # solo servidor STDIO (para Cursor/Claude)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Carga de datos (igual que solucion_scratch.py)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"


def _load(filename: str):
    return json.loads((_DATOS / filename).read_text(encoding="utf-8"))


POLITICA = _load("politica.json")
RESERVAS = _load("reservas.json")

# Estado de permisos aprobados (demo en memoria)
_APPROVED_PERMISSIONS: set[str] = set()


# ---------------------------------------------------------------------------
# SERVIDOR FastMCP
# Ver guia.md §8: @mcp.tool, @mcp.resource, @mcp.prompt
# ---------------------------------------------------------------------------
from fastmcp import FastMCP  # noqa: E402

mcp = FastMCP(
    name="airline-policy-rag-mcp",
    instructions=(
        "Servidor MCP de políticas tarifarias de la aerolínea. "
        "Expone PolicyRAG y herramientas de cambio de vuelo."
    ),
)


@mcp.tool(
    annotations={
        "title": "PolicyRAG — Consulta penalidades",
        "readOnlyHint": True,
        "openWorldHint": False,
    }
)
def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """
    Consulta reglas de tarifa y penalidades de cambio filtradas por
    fare_class y route_type. Úsala para determinar si aplican cargos.

    Args:
        fare_class: Clase tarifaria (ej: ECONOMY_FLEX)
        route_type: Tipo de ruta (nacional o internacional)
        query: Consulta opcional en lenguaje natural
    """
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            return {
                "query": query or f"penalidad {fare_class} {route_type}",
                "chunks": [
                    {
                        "text": (
                            f"Tarifa {fare_class} ({route_type}): "
                            f"penalidad USD {regla.get('penalidad_usd', 0)}. "
                            f"{regla.get('nota', '')}"
                        ),
                        "source": regla.get("fuente", "fare-rules"),
                    }
                ],
                "penalidad_usd": regla.get("penalidad_usd"),
                "cambio_permitido": regla.get("cambio_permitido", False),
            }
    return {"error": f"No hay política para {fare_class!r} / {route_type!r}"}


@mcp.tool(
    annotations={
        "title": "Aplicar cambio de vuelo",
        "readOnlyHint": False,
        "destructiveHint": True,
    }
)
def apply_flight_change(
    pnr: str,
    new_flight_id: str,
    amount_usd: float,
    permission_token: str = "",
) -> dict:
    """
    Ejecuta el cambio de vuelo y cobra el monto indicado.
    Acción irreversible — requiere permission_token='approved' tras aprobación del usuario.

    Args:
        pnr: Número de reserva
        new_flight_id: ID del vuelo destino (ej: FL305)
        amount_usd: Monto total a cobrar (penalidad + diferencial)
        permission_token: Token de aprobación ('approved' tras confirmación del usuario)
    """
    perm_id = f"perm-apply_flight_change-{pnr}"
    if permission_token != "approved" or perm_id not in _APPROVED_PERMISSIONS:
        return {
            "permission_required": True,
            "permission": {
                "id": perm_id,
                "scope": "financial",
                "reason": f"Acción financiera: cobro de USD {amount_usd:.2f} para PNR {pnr}",
            },
        }

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


@mcp.resource("policy://{fare_class}/{route_type}")
def policy_resource(fare_class: str, route_type: str) -> str:
    """Recurso estático: texto completo de la política para una tarifa y ruta."""
    result = policy_rag(fare_class, route_type)
    if "error" in result:
        return result["error"]
    return result["chunks"][0]["text"]


@mcp.prompt
def flight_change_analysis(fare_class: str, route_type: str) -> str:
    """
    Plantilla de prompt para que el LLM analice si un cambio de vuelo es viable.

    Args:
        fare_class: Clase tarifaria del pasajero
        route_type: Tipo de ruta
    """
    return (
        f"Analiza si un pasajero con tarifa {fare_class} en ruta {route_type} "
        f"puede cambiar su vuelo. Consulta policy_rag y explica penalidad, "
        f"restricciones y pasos siguientes."
    )


# ---------------------------------------------------------------------------
# CLIENTE FastMCP — demo STDIO
# Ver guia.md §8.5: Client, list_tools, call_tool, read_resource, get_prompt
# ---------------------------------------------------------------------------
from fastmcp import Client  # noqa: E402


async def demo_stdio_client() -> None:
    """Cliente STDIO: lanza el servidor como subprocess y consume sus tools."""
    server_script = str(_HERE / "solucion_framework.py")

    print("=" * 64)
    print("FastMCP — Cliente STDIO")
    print("=" * 64)

    async with Client(server_script) as client:
        # Descubrimiento dinámico (equivalente a tools/list del scratch)
        tools = await client.list_tools()
        tool_names = [t.name for t in tools]
        print(f"[Cliente] Tools: {tool_names}")

        # Leer recurso (equivalente a resources/read del protocolo MCP)
        policy_text = await client.read_resource("policy://ECONOMY_FLEX/internacional")
        print(f"[Cliente] Resource policy://... : {str(policy_text)[:70]}...")

        # Obtener prompt template
        prompt = await client.get_prompt(
            "flight_change_analysis",
            {"fare_class": "ECONOMY_FLEX", "route_type": "internacional"},
        )
        print(f"[Cliente] Prompt template: {str(prompt)[:70]}...")

        # Llamar policy_rag (sin aprobación)
        policy_result = await client.call_tool(
            "policy_rag",
            {
                "fare_class": "ECONOMY_FLEX",
                "route_type": "internacional",
                "query": "penalidad cambio internacional",
            },
        )
        print(f"[Cliente] policy_rag → penalidad_usd=50")

        # Llamar apply_flight_change — primera vez: permiso requerido
        change_result = await client.call_tool(
            "apply_flight_change",
            {"pnr": "SCL-BOG-001", "new_flight_id": "FL305", "amount_usd": 130.0},
        )
        data = _extract_tool_result(change_result)
        if data.get("permission_required"):
            perm = data["permission"]
            print(f"[Cliente] PERMISO REQUERIDO: {perm['reason']}")
            _APPROVED_PERMISSIONS.add(perm["id"])
            print(f"[Cliente] Usuario aprobó — reintentando con permission_token...")

            change_result = await client.call_tool(
                "apply_flight_change",
                {
                    "pnr": "SCL-BOG-001",
                    "new_flight_id": "FL305",
                    "amount_usd": 130.0,
                    "permission_token": "approved",
                },
            )
            data = _extract_tool_result(change_result)

        print(f"[Cliente] apply_flight_change → status={data.get('status')}, "
              f"txn={data.get('transaction_id')}")
        print("\nDemo STDIO completada.")


async def demo_http_client(host: str = "127.0.0.1", port: int = 8765) -> None:
    """
    Cliente Streamable HTTP: conecta a un servidor ya levantado.
    En producción, el server corre como servicio independiente (Docker/K8s).
    """
    url = f"http://{host}:{port}/mcp"
    print("=" * 64)
    print(f"FastMCP — Cliente HTTP ({url})")
    print("=" * 64)

    async with Client(url) as client:
        tools = await client.list_tools()
        print(f"[Cliente HTTP] Tools: {[t.name for t in tools]}")
        result = await client.call_tool(
            "policy_rag",
            {"fare_class": "ECONOMY_FLEX", "route_type": "internacional"},
        )
        data = _extract_tool_result(result)
        print(f"[Cliente HTTP] penalidad_usd={data.get('penalidad_usd')}")


def _extract_tool_result(result) -> dict:
    """Normaliza el resultado de call_tool a dict."""
    if hasattr(result, "data"):
        return result.data if isinstance(result.data, dict) else {"raw": result.data}
    if hasattr(result, "content") and result.content:
        text = result.content[0].text if hasattr(result.content[0], "text") else str(result.content[0])
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            return {"text": text}
    return {"raw": str(result)}


# ---------------------------------------------------------------------------
# Multi-server (conectar a varios MCP servers)
# ---------------------------------------------------------------------------
async def demo_multi_server() -> None:
    """
    Patrón multi-server: un agente puede conectar a varios MCP servers
    y prefijar tools por servidor (ej: policy_rag vs inventory_search).
    """
    server_script = str(_HERE / "solucion_framework.py")
    print("=" * 64)
    print("FastMCP — Multi-server (conceptual)")
    print("=" * 64)

    # En FastMCP 2.x puedes pasar varias fuentes al Client
    async with Client([server_script]) as client:
        tools = await client.list_tools()
        print(f"[Multi] {len(tools)} tools desde servidor(es) conectados")
        for t in tools:
            print(f"  - {t.name}: {t.description[:60]}...")


# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Demo FastMCP PolicyRAG")
    parser.add_argument("--server", action="store_true", help="Solo servidor STDIO")
    parser.add_argument("--http", action="store_true", help="Demo HTTP (server + client)")
    parser.add_argument("--multi", action="store_true", help="Demo multi-server")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    if args.server:
        mcp.run(transport="stdio")
        return

    if args.http:
        # Levantar server HTTP en background y conectar client
        import threading
        import time

        def run_http_server():
            mcp.run(transport="streamable-http", host="127.0.0.1", port=args.port)

        thread = threading.Thread(target=run_http_server, daemon=True)
        thread.start()
        time.sleep(1.5)  # esperar que el server arranque
        asyncio.run(demo_http_client(port=args.port))
        return

    if args.multi:
        asyncio.run(demo_multi_server())
        return

    asyncio.run(demo_stdio_client())


if __name__ == "__main__":
    main()

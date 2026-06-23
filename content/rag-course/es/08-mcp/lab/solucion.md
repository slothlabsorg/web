# Solución del Lab M8 — PolicyRAG como MCP Server

---

## Capa ② — Solución desde cero (`solucion_scratch.py`)

### Arquitectura general

```
[main()] ──spawn──▶ [MCPServer en subprocess STDIO]
       │
       └──▶ [MCPStdioClient] ──▶ [PolicyRAGAgent.run()]
                    │
                    ├─ initialize (handshake)
                    ├─ tools/list (descubrimiento)
                    ├─ tools/call → policy_rag
                    ├─ tools/call → apply_flight_change (bloqueado)
                    ├─ permissions/respond (aprobación)
                    └─ tools/call → apply_flight_change (éxito)
```

### Mini-protocolo JSON-RPC

Cada mensaje es una línea JSON (newline-delimited). El servidor implementa cuatro métodos:

| Método | Equivalente MCP real | Rol en el taller |
|--------|---------------------|------------------|
| `initialize` | Handshake | Negociar `protocolVersion` y capabilities |
| `tools/list` | Descubrimiento | El agente aprende qué tools existen |
| `tools/call` | Ejecución | Invocar `policy_rag` o `apply_flight_change` |
| `permissions/respond` | Aprobación | Registrar decisión del usuario |

### Gate de permisos

La lógica clave está en `MCPServer._tools_call`:

```python
if name in SENSITIVE_TOOLS:
    if permission_token != "approved" or perm_id not in self.approved_permissions:
        return permission_required_response  # NO ejecuta el handler
# Solo llega aquí con permiso válido
result = TOOL_HANDLERS[name](**arguments)
```

La primera llamada a `apply_flight_change` **nunca** llega a `TOOL_HANDLERS` — el cobro no ocurre hasta la segunda llamada con token.

### Por qué subprocess STDIO

Usar `subprocess.Popen` replica el modelo real de MCP (Cursor lanza `python server.py` como hijo). El cliente y el servidor son procesos aislados que solo se hablan por pipes — igual que en producción con Claude Desktop.

---

## Capa ③ — Solución con FastMCP (`solucion_framework.py`)

### Mapeo scratch → FastMCP

| Scratch | FastMCP |
|---------|---------|
| `MCPServer` + `serve_stdio()` | `FastMCP` + `mcp.run(transport="stdio")` |
| `TOOL_DEFINITIONS` manual | `@mcp.tool` automático |
| `MCPStdioClient._send()` | `Client(server_script)` |
| Sin resources/prompts | `@mcp.resource`, `@mcp.prompt` |
| HTTP no implementado | `mcp.run(transport="streamable-http")` |

### Lo que FastMCP no hace por ti

- **Permisos:** debes implementar `permission_required` dentro de la tool (igual que en scratch).
- **Lógica de negocio:** leer `politica.json`, validar PNR — es tu código.
- **Guardrails:** combina MCP permissions con `guardrail.confirm` en el grafo RAGorbit.

### Ejecutar cuando tengas pip

```bash
pip install fastmcp
python3 solucion_framework.py              # demo STDIO
python3 solucion_framework.py --server     # solo server (para Cursor)
python3 solucion_framework.py --http       # demo HTTP
```

---

## Conexión con el template 01

En `examples/01-airline-flight-change/flow.json`, el nodo `policy_tool` (`tool.retriever`) se reemplazaría por:

```json
{
  "id": "policy_mcp",
  "type": "tool.mcp",
  "config": {
    "server": "python mcp_servers/policy_rag.py",
    "transport": "stdio"
  }
}
```

El agente `orchestrator` sigue siendo `agent.react` — solo cambia de dónde vienen las tools. El cobro (`PaymentService`) podría ser otro server MCP con scope `financial`, envuelto además por `guardrail.confirm` e `guardrail.idempotency`.

---

## Errores comunes

1. **Olvidar `initialize`** antes de `tools/list` → error "Cliente no inicializado".
2. **No hacer `flush()`** tras escribir en stdin del subprocess → el servidor nunca recibe el mensaje.
3. **Ejecutar tool sensible sin gate** → cobros sin consentimiento del usuario.
4. **Confundir resource con tool** → usar `tools/call` para leer un archivo estático en vez de `resources/read`.
5. **Un server MCP con root `/`** → vector de exfiltración de datos.

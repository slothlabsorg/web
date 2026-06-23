# Lab M8 · PolicyRAG como MCP Server

## Brief de negocio

Eres ingeniero en la aerolínea del template `01-airline-flight-change`. El equipo de arquitectura quiere **desacoplar** PolicyRAG del agente ReAct: en lugar de que el retriever viva embebido en el grafo (`tool.retriever` → `agent.react`), debe exponerse como un **servidor MCP independiente** que cualquier cliente pueda descubrir y consumir — Cursor, Claude Desktop, otro agente interno, o el nodo `tool.mcp` de RAGorbit.

Además, las acciones financieras (`apply_flight_change`) deben pasar por un **gate de aprobación basado en permisos** antes de ejecutarse, igual que `guardrail.confirm` en el template pero a nivel de protocolo MCP.

## Datos disponibles

En `lab/datos/`:

| Archivo | Contenido |
|---------|-----------|
| `politica.json` | Penalidades por `fare_class` y `route_type` |
| `reservas.json` | Reserva mock `SCL-BOG-001` (Ana García, ECONOMY_FLEX) |
| `permisos.json` | Scopes de permisos (`financial`, `read_policy`) |

## Tools del servidor MCP

| Tool | Tipo | Qué hace |
|------|------|----------|
| `policy_rag` | Lectura | Consulta penalidades filtradas por tarifa y ruta |
| `apply_flight_change` | **Sensible** | Ejecuta cambio de vuelo y cobra USD 130.00 |

## Tarea

### Parte A — Mini-protocolo MCP desde cero (capa ②)

Implementa `lab/solucion_scratch.py` con:

1. **Servidor MCP** (`MCPServer`) que habla JSON-RPC 2.0 sobre STDIO (una línea JSON por mensaje).
2. Métodos: `initialize`, `tools/list`, `tools/call`, `permissions/respond`.
3. Tool `policy_rag` que lee `politica.json` (RAG simplificado: lookup determinista).
4. Tool `apply_flight_change` marcada como sensible — la primera llamada devuelve `permission_required` sin ejecutar el cobro.
5. **Cliente MCP** (`MCPStdioClient`) que lanza el servidor como subprocess y envía/recibe JSON-RPC.
6. **Agente** (`PolicyRAGAgent`) determinista que:
   - Hace handshake
   - Lista tools
   - Llama `policy_rag` para ECONOMY_FLEX internacional
   - Intenta `apply_flight_change` → recibe gate de permiso → aprueba → reintenta → éxito
7. Modo servidor: `python3 solucion_scratch.py --server` (usado internamente por el subprocess).

### Parte B — FastMCP (capa ③, tarea guiada)

> **Lee primero:** [guia.md §8 — La capa ③ explicada: FastMCP desde cero](../guia.md#8-la-capa--explicada-fastmcp-desde-cero).

**Requisitos de entorno** (fuera de la máquina del curso):

```bash
pip install fastmcp
```

#### Paso B.1 — Servidor con `@mcp.tool`, `@mcp.resource`, `@mcp.prompt`

1. Crea `FastMCP("airline-policy-rag-mcp")`.
2. Decora `policy_rag` y `apply_flight_change` con `@mcp.tool`.
3. Añade `@mcp.resource("policy://{fare_class}/{route_type}")`.
4. Añade `@mcp.prompt` para análisis de cambio de vuelo.

#### Paso B.2 — Cliente STDIO

1. Usa `Client(server_script)` de FastMCP.
2. `await client.list_tools()` — descubrimiento.
3. `await client.call_tool("policy_rag", {...})`.
4. Maneja `permission_required` en `apply_flight_change`.

#### Paso B.3 — Cliente HTTP (opcional)

1. `mcp.run(transport="streamable-http", port=8765)`.
2. `Client("http://127.0.0.1:8765/mcp")`.

#### Paso B.4 — Compara con `solucion_framework.py`

Abre bloque por bloque (guía §8.8) y anota diferencias.

## Pistas escalonadas

<details>
<summary>Pista 1 — Estructura JSON-RPC</summary>

Cada mensaje es una línea JSON:

```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
```

Respuesta:

```json
{"jsonrpc": "2.0", "id": 1, "result": {"tools": [...]}}
```
</details>

<details>
<summary>Pista 2 — Subprocess STDIO</summary>

```python
proc = subprocess.Popen(
    [sys.executable, __file__, "--server"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1
)
proc.stdin.write(json.dumps(request) + "\n")
proc.stdin.flush()
line = proc.stdout.readline()
```
</details>

<details>
<summary>Pista 3 — Gate de permisos</summary>

En `tools/call`, si la tool es sensible y no hay `_permission_token: "approved"`:

```python
return {"permission_required": True, "permission": {"id": "...", "scope": "financial", ...}}
```

El cliente llama `permissions/respond` con `decision: "approved"` y reintenta con el token.
</details>

<details>
<summary>Pista 4 — FastMCP @mcp.tool</summary>

El docstring de la función Python se convierte en la descripción que ve el LLM — igual que `@tool` en LangChain (M6 §8.3).
</details>

## Criterios de éxito

Tu `solucion_scratch.py` debe producir la salida de [`expected.md`](expected.md) y pasar todas las verificaciones `assert` al final.

## Conexión con RAGorbit

En el template `01-airline-flight-change`, reemplazarías:

```
tool.retriever "PolicyRAG" ──▶ agent.react
```

por:

```
tool.mcp "PolicyRAG MCP" ──▶ agent.react
```

El nodo `tool.mcp` se conecta al servidor MCP vía STDIO o HTTP y expone las tools descubiertas al agente. Ver [`flow.json`](../../../examples/01-airline-flight-change/flow.json) y [`catalogo-nodos.md`](../referencia/catalogo-nodos.md#toolmcp).

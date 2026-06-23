# Módulo 8 · Model Context Protocol (MCP) a fondo (`tool.mcp`)

> **Prerequisito:** haber completado M6 (agentes, tool calling) y entender el bucle ReAct.
>
> **Nodos RAGorbit:** `tool.mcp`, `agent.react` (como consumidor MCP)
>
> **Templates ancla:** `01-airline-flight-change` (PolicyRAG expuesto como MCP server en el taller)

---

## 1. Qué es MCP y por qué existe

### 1.1 El problema de las integraciones ad hoc

En M6 aprendiste *tool calling*: el LLM emite `{"tool": "ReservationService", "arguments": {...}}` y el framework ejecuta la función. Cada integración es **custom**:

```
Agente LangChain  ──▶  ReservationService (HTTP propio, schema manual)
Cursor IDE        ──▶  GitHub API (otro schema, otro auth)
Claude Desktop    ──▶  Filesystem (otro contrato)
```

Cada host (IDE, agente, copilot) reinventa cómo descubrir tools, pasar contexto, pedir permisos y transportar mensajes. El resultado: **N hosts × M servicios = N×M adaptadores**.

### 1.2 MCP como estándar abierto

El **Model Context Protocol** (MCP), iniciado por Anthropic y adoptado por el ecosistema (Cursor, Claude Desktop, VS Code, etc.), define un contrato único entre:

```
┌─────────────┐     MCP      ┌─────────────┐     API/biz    ┌─────────────┐
│  MCP Host   │ ◀──────────▶ │ MCP Server  │ ─────────────▶ │  Servicio   │
│ (IDE/agente)│   JSON-RPC   │ (PolicyRAG) │   HTTP/DB/...  │  real       │
└─────────────┘              └─────────────┘                └─────────────┘
       │
       │  orquesta
       ▼
┌─────────────┐
│ MCP Client  │  ← biblioteca dentro del host; habla el protocolo
└─────────────┘
```

- **Host:** la aplicación que el usuario usa (Cursor, tu agente FastAPI).
- **Client:** biblioteca que implementa MCP dentro del host.
- **Server:** proceso que expone capabilities (tools, resources, prompts).

Un servidor MCP construido una vez sirve a **todos** los hosts compatibles — sin reescribir integraciones.

### 1.3 MCP vs tool-calling tradicional

| Aspecto | Tool calling (M6) | MCP |
|---------|-------------------|-----|
| Contrato | JSON Schema por framework | Protocolo estándar (JSON-RPC) |
| Descubrimiento | Registras tools manualmente en el agente | Cliente llama `tools/list` dinámicamente |
| Transporte | In-process o HTTP ad hoc | STDIO o Streamable HTTP estandarizados |
| Primitivas | Solo tools (funciones) | Tools + **resources** (datos) + **prompts** (plantillas) |
| Seguridad | Guardrails del framework (`guardrail.confirm`) | **Sampling**, **roots**, **permisos** a nivel protocolo |
| Portabilidad | Lock-in al framework (LangChain, OpenAI) | Un server sirve a múltiples hosts |

**No son excluyentes:** en producción, un agente LangGraph puede consumir tools vía nodo `tool.mcp` — el LLM sigue haciendo tool calling, pero las tools vienen de un servidor MCP externo.

### 1.4 Cuándo usar MCP / cuándo NO

**Usa MCP cuando:**
- Quieres exponer capacidades a **múltiples clientes** (IDE + agente interno + otro equipo).
- Las tools viven en un **proceso separado** con su propio ciclo de vida (deploy independiente).
- Necesitas **descubrimiento dinámico** (el cliente no conoce las tools de antemano).
- Operas en entornos regulados donde los **permisos explícitos** son obligatorios.

**NO uses MCP cuando:**
- Tienes 2–3 funciones Python locales que solo usa un agente → `@tool` in-process basta (M6).
- La latencia de un subprocess/HTTP extra es inaceptable (hot path de microsegundos).
- El servicio ya expone una API REST madura y solo un cliente la consume → `tool.service` es más simple.
- Estás prototipando y la complejidad del protocolo no aporta valor aún.

---

## 2. Arquitectura del protocolo

### 2.1 Capas

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MCP                              │
│                                                                  │
│  Capa de aplicación                                              │
│  ──────────────────                                              │
│  Tools · Resources · Prompts · Sampling · Roots · Permisos         │
│                                                                  │
│  Capa de protocolo                                               │
│  ─────────────────                                               │
│  JSON-RPC 2.0 — métodos: initialize, tools/list, tools/call,     │
│                 resources/list, resources/read, prompts/list,    │
│                 prompts/get, sampling/createMessage, ...           │
│                                                                  │
│  Capa de transporte                                              │
│  ──────────────────                                              │
│  STDIO (subprocess local)  ·  Streamable HTTP (red)              │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Ciclo de vida de una sesión

```
Cliente                              Servidor
   │                                    │
   │──── initialize ──────────────────▶│  handshake + capabilities
   │◀─── {protocolVersion, serverInfo}─│
   │                                    │
   │──── tools/list ──────────────────▶│  descubrimiento
   │◀─── [{name, description, schema}]─│
   │                                    │
   │──── tools/call ──────────────────▶│  ejecución
   │◀─── {content, structuredContent}──│
   │                                    │
   │──── tools/call (sensible) ───────▶│  sin permiso → bloqueado
   │◀─── {permission_required: true}──│
   │                                    │
   │──── permissions/respond ─────────▶│  usuario aprueba
   │◀─── {status: approved}───────────│
   │                                    │
   │──── tools/call (con token) ──────▶│  ejecuta acción
   │◀─── {status: captured}───────────│
```

### 2.3 Las tres primitivas

| Primitiva | Analogía | Ejemplo aerolínea |
|-----------|----------|-------------------|
| **Tool** | Función invocable | `policy_rag(fare_class, route_type)` |
| **Resource** | Dato legible (URI) | `policy://ECONOMY_FLEX/internacional` → texto de la regla |
| **Prompt** | Plantilla de mensajes | `flight_change_analysis(fare_class)` → prompt para el LLM |

En RAGorbit:
- `tool.mcp` consume **tools** del servidor.
- Resources y prompts los usa el host directamente (Cursor los muestra al usuario/LLM).

---

## 3. Transporte: STDIO vs Streamable HTTP

### 3.1 STDIO — comunicación local

```
Host/Cliente
    │
    │ spawn subprocess
    ▼
┌─────────────────────────┐
│ python server.py        │
│   stdin  ◀── JSON-RPC   │
│   stdout ──▶ JSON-RPC   │
└─────────────────────────┘
```

- **Cuándo:** desarrollo local, Claude Desktop, Cursor, agentes que lanzan el server como hijo.
- **Ventaja:** sin puertos abiertos, aislamiento de proceso, simple.
- **En el taller:** `solucion_scratch.py` usa `subprocess.Popen` + pipes.

### 3.2 Streamable HTTP — comunicación en red

```
Cliente (agente en K8s)  ──HTTP POST/SSE──▶  Servidor MCP (Cloud Run)
                                              https://mcp.airline.internal/mcp
```

- **Cuándo:** servidor compartido por múltiples agentes, deploy en Docker/Cloud Run.
- **Ventaja:** escalable, un server para toda la organización.
- **Gotcha:** requiere auth (JWT, mTLS), rate limiting, y observabilidad.

### 3.3 Comparativa

| | STDIO | Streamable HTTP |
|---|-------|-----------------|
| Latencia | Baja (pipes locales) | Mayor (red) |
| Deploy | Subprocess del cliente | Servicio independiente |
| Seguridad | Aislamiento OS | Auth de red obligatorio |
| Multi-cliente | Un cliente por proceso | Muchos clientes concurrentes |
| Ejemplo | Cursor + server local | Agente K8s → MCP en Cloud Run |

---

## 4. Seguridad MCP

### 4.1 Sampling — el servidor pide al LLM

En MCP, el **servidor** puede pedirle al **cliente** que invoque el LLM (sampling). Caso de uso: el servidor necesita que el LLM resuma un documento antes de indexarlo.

```
Servidor ──sampling/createMessage──▶ Cliente ──▶ LLM ──▶ respuesta ──▶ Servidor
```

**Riesgo:** un servidor malicioso podría abusar del LLM del cliente (costo, fuga de contexto).
**Mitigación:** el cliente debe mostrar al usuario qué servidor pide sampling y permitir denegar.

### 4.2 Roots — límites de filesystem

Los **roots** definen qué directorios del filesystem puede leer/escribir un servidor MCP (p.ej. un server de archivos).

```
Cliente declara roots: ["/home/user/proyecto", "/tmp/shared"]
Servidor solo accede dentro de esos paths
```

**En producción:** nunca des `root: "/"` a un servidor no confiable.

### 4.3 Aprobación basada en permisos

El mecanismo central para acciones sensibles. Flujo del taller:

```
1. Agente llama apply_flight_change(amount=130)
2. Servidor responde: permission_required, scope=financial
3. Host muestra UI: "¿Autorizas cobro de USD 130.00?"
4. Usuario aprueba → permissions/respond(decision=approved)
5. Agente reintenta con permission_token → cobro ejecutado
```

Esto es el equivalente protocolar de `guardrail.confirm` en el template 01 — pero **independiente del framework del agente**.

| Guardrail RAGorbit | Equivalente MCP |
|--------------------|-----------------|
| `guardrail.pre-tool` | Validación en el server antes de ejecutar |
| `guardrail.confirm` | `permission_required` + UI de aprobación |
| `guardrail.idempotency` | Lógica en el server (clave compuesta) |
| `guardrail.resilience` | Retry/circuit breaker en el transporte HTTP |

### 4.4 Gotchas de seguridad

1. **Confía en el servidor como en código de terceros** — un MCP server puede exfiltrar datos vía tools o sampling.
2. **Lista blanca de servers** — en Cursor/Claude Desktop, solo conecta servers que audites.
3. **Scopes granulares** — separa `read_policy` (sin aprobación) de `financial` (con aprobación).
4. **No mezcles permisos** — un token de `read_policy` no debe autorizar `financial`.
5. **Audit trail** — registra cada `tools/call` con argumentos y resultado (como `observability.audit` en template 01).

---

## 5. MCP vs plugins y funciones propietarias

Ver comparativa completa en [`referencia/tecnologias-comparadas.md §10`](../referencia/tecnologias-comparadas.md#10-mcp-vs-plugins-y-funciones-propietarias).

```
                    MCP                    OpenAI Plugins / Assistants
                    ───                    ───────────────────────────
Estándar            Abierto                Cerrado por proveedor
Descubrimiento      tools/list dinámico    Definición manual
Portabilidad        Claude, Cursor, custom Solo ecosistema OpenAI
Seguridad           Permisos protocolares  Variable
```

**Regla práctica:** MCP envuelve tus APIs de negocio en un contrato portable. Las APIs (`tool.service`, `tool.http`) siguen siendo la capa de negocio; MCP es la capa de **presentación al LLM**.

---

## 6. Conectar a uno y varios servers

### 6.1 Un servidor

```
Agente ReAct
    │
    └── tool.mcp ──STDIO──▶ PolicyRAG Server
```

Configuración típica del nodo `tool.mcp` en RAGorbit:

```json
{
  "type": "tool.mcp",
  "config": {
    "server": "python /app/mcp/policy_server.py",
    "transport": "stdio"
  }
}
```

El agente descubre las tools del server en runtime y las usa como cualquier otra tool.

### 6.2 Varios servidores

```
Agente ReAct
    ├── tool.mcp ──▶ PolicyRAG Server    (tools: policy_rag)
    ├── tool.mcp ──▶ Inventory MCP       (tools: search_flights)
    └── tool.mcp ──▶ Payment MCP        (tools: charge_fee)
```

En FastMCP, el `Client` puede conectar a múltiples fuentes y **prefijar** tools por servidor (`policy_policy_rag`, `inventory_search_flights`) para evitar colisiones de nombres.

### 6.3 Template 01 — antes y después de MCP

**Antes (M6):** PolicyRAG embebido en el grafo.

```
store.pgvector ──▶ tool.retriever "policy_rag" ──▶ agent.react
```

**Después (M8):** PolicyRAG como servicio MCP desacoplado.

```
[MCP Server: policy-rag]
  @tool policy_rag
  @resource policy://{fare_class}/{route_type}
       ▲
       │ STDIO o HTTP
       │
tool.mcp ──▶ agent.react
```

Ventaja: el equipo de políticas despliega y versiona el server MCP sin tocar el grafo del agente. Ver [`examples/01-airline-flight-change/README.md`](../../examples/01-airline-flight-change/README.md).

---

## 7. Nodo RAGorbit `tool.mcp`

```json
{
  "id": "policy_mcp",
  "type": "tool.mcp",
  "config": {
    "server": "python mcp_servers/policy_rag.py",
    "transport": "stdio",
    "tool": "policy_rag"
  }
}
```

- **Puerto de salida:** `Tool` → se conecta a `agent.react`.
- El codegen genera código que lanza el subprocess MCP y traduce `tools/call` a invocaciones del agente.

Ficha completa: [`referencia/catalogo-nodos.md §tool.mcp`](../referencia/catalogo-nodos.md#toolmcp).

---

## 8. La capa ③ explicada: FastMCP desde cero

> **Prerrequisito:** haber implementado la capa ② del taller (`lab/solucion_scratch.py`) o entender cada pieza que escribiste a mano. **Lee esta sección completa** antes de intentar escribir `lab/solucion_framework.py`.
>
> **Entorno:** en la máquina de estudio del curso no hay `pip` ni red. No podrás ejecutar este código aquí. El objetivo es que, cuando tengas `pip install fastmcp`, puedas **escribir** la solución framework tú mismo.
>
> **Cross-link:** si dominaste tools y el bucle ReAct en M6, enlaza con [M6 §8 — La capa ③ explicada: LangGraph desde cero](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo). Allí aprendiste `@tool` y `create_react_agent`; aquí aprendes `@mcp.tool` y `Client`.

### 8.1 Recordatorio: qué ya sabes de M6

| Pieza M6 | Para qué sirve en M8 |
|----------|----------------------|
| `@tool` + docstring → descripción del LLM | `@mcp.tool` hace lo mismo para el protocolo MCP |
| `TOOLS = [...]` registro manual | `tools/list` descubre tools automáticamente del server |
| `fake_llm` decide qué tool llamar | El host (Cursor/agente) usa el LLM + tools MCP descubiertas |
| `guardrail.confirm` para acciones sensibles | `permission_required` + aprobación del usuario |

**Lo nuevo de M8** no es "tools" en general — es el **protocolo estándar** que transporta, descubre y protege esas tools entre procesos.

### 8.2 Tabla puente: tu scratch → FastMCP

| Lo que hiciste a mano (capa ②) | Pieza FastMCP (capa ③) | Dónde en el lab |
|--------------------------------|------------------------|-----------------|
| `TOOL_DEFINITIONS` — registro manual con schemas | `@mcp.tool` genera schema + descripción del docstring | `policy_rag`, `apply_flight_change` |
| `TOOL_HANDLERS` dict nombre→función | Las funciones decoradas **son** los handlers | Mismas funciones |
| `MCPServer.handle()` — router JSON-RPC | `FastMCP` + `mcp.run()` — protocolo completo | `mcp = FastMCP(...)` |
| `serve_stdio()` — lee stdin línea a línea | `mcp.run(transport="stdio")` | `--server` |
| `MCPStdioClient._send()` — escribe JSON-RPC | `Client(server_script)` — transporte automático | `demo_stdio_client()` |
| `initialize` handshake manual | Gestionado por `Client` al entrar en `async with` | `async with Client(...)` |
| `tools/list` manual | `await client.list_tools()` | Demo STDIO |
| `tools/call` manual | `await client.call_tool(name, args)` | Demo STDIO |
| Recurso como JSON en tool result | `@mcp.resource("policy://{fare_class}/{route_type}")` | `policy_resource` |
| System prompt hardcodeado | `@mcp.prompt` — plantilla reutilizable | `flight_change_analysis` |
| `permission_required` en tools/call | Misma lógica; FastMCP no la implementa por ti — tú la pones en la tool | `apply_flight_change` |
| `subprocess.Popen` + pipes | `Client` lanza subprocess STDIO automáticamente | `Client(server_script)` |
| HTTP no implementado en scratch | `mcp.run(transport="streamable-http")` + `Client(url)` | `--http` |

**Modelo mental:** en scratch tú eres el protocolo (JSON-RPC, transporte, handshake). En FastMCP el framework **es** el protocolo — tú solo declaras tools/resources/prompts como funciones Python.

### 8.3 `FastMCP` — crear el servidor

```python
from fastmcp import FastMCP

mcp = FastMCP(
    name="airline-policy-rag-mcp",
    instructions="Servidor MCP de políticas tarifarias de la aerolínea.",
)
```

- `name` → aparece en `serverInfo` del handshake (tu scratch: `SERVER_NAME`).
- `instructions` → contexto que reciben los clientes sobre el propósito del server.

**Ejecutar el servidor:**

```python
if __name__ == "__main__":
    mcp.run(transport="stdio")       # local — Cursor, Claude Desktop
    # mcp.run(transport="streamable-http", port=8765)  # red
```

### 8.4 `@mcp.tool` — de función Python a tool MCP

En scratch definiste schemas manualmente:

```python
TOOL_DEFINITIONS = [{
    "name": "policy_rag",
    "description": "Consulta reglas de tarifa...",
    "inputSchema": {"type": "object", "properties": {...}},
}]
```

En FastMCP:

```python
@mcp.tool(annotations={"readOnlyHint": True})
def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """
    Consulta reglas de tarifa y penalidades filtradas por
    fare_class y route_type. Úsala para determinar si aplican cargos.
    """
    ...
```

FastMCP hace automáticamente:
1. **Nombre** — de la función (`policy_rag`).
2. **Descripción** — del docstring (igual que `@tool` de LangChain en M6 §8.3).
3. **JSON Schema** — de los type hints.
4. **Registro** — la tool aparece en `tools/list` sin código extra.

**Anotaciones** (`readOnlyHint`, `destructiveHint`) ayudan al host a decidir si pedir permiso antes de ejecutar — similar a marcar `sensitive: True` en tu scratch.

### 8.5 `@mcp.resource` — datos legibles por URI

Los resources son datos que el cliente **lee** (no ejecuta):

```python
@mcp.resource("policy://{fare_class}/{route_type}")
def policy_resource(fare_class: str, route_type: str) -> str:
    """Texto completo de la política para una tarifa y ruta."""
    ...
```

El cliente accede con:

```python
text = await client.read_resource("policy://ECONOMY_FLEX/internacional")
```

**Cuándo usar resource vs tool:**
- **Resource:** el dato es idempotente y legible (política, config, estado). No tiene efectos secundarios.
- **Tool:** la operación puede tener efectos (cobrar, enviar email, modificar DB).

### 8.6 `@mcp.prompt` — plantillas de mensajes

```python
@mcp.prompt
def flight_change_analysis(fare_class: str, route_type: str) -> str:
    """Plantilla para analizar viabilidad de un cambio de vuelo."""
    return f"Analiza si un pasajero con tarifa {fare_class}..."
```

El cliente obtiene el prompt renderizado:

```python
prompt = await client.get_prompt("flight_change_analysis",
    {"fare_class": "ECONOMY_FLEX", "route_type": "internacional"})
```

Útil para que el host (Cursor) ofrezca acciones predefinidas al usuario sin que el LLM invente el prompt.

### 8.7 `Client` — consumir el servidor (STDIO)

```python
from fastmcp import Client

async with Client("solucion_framework.py") as client:
    tools = await client.list_tools()
    result = await client.call_tool("policy_rag", {
        "fare_class": "ECONOMY_FLEX",
        "route_type": "internacional",
    })
```

**Qué hace `Client` por ti** (lo que implementaste a mano en scratch):

| Tu scratch | FastMCP Client |
|------------|----------------|
| `subprocess.Popen([python, script, "--server"])` | Lanza el server automáticamente |
| `initialize` + verificar `protocolVersion` | Handshake al entrar en `async with` |
| `_send("tools/list")` | `list_tools()` |
| `_send("tools/call", params)` | `call_tool(name, args)` |
| Leer stdout línea a línea | Gestión de buffers y errores |

### 8.8 `Client` — consumir el servidor (HTTP)

```python
# Terminal 1: levantar server
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)

# Terminal 2: client
async with Client("http://127.0.0.1:8765/mcp") as client:
    result = await client.call_tool("policy_rag", {...})
```

Mismo API de client, distinto transporte — el cliente negocia automáticamente.

### 8.9 Multi-server

```python
async with Client(["policy_server.py", "inventory_server.py"]) as client:
    tools = await client.list_tools()
    # tools prefijadas: policy_policy_rag, inventory_search_flights
```

Patrón útil cuando cada dominio (políticas, inventario, pagos) es un server MCP independiente — como los `tool.service` separados del template 01.

### 8.10 Recorrido bloque a bloque de `lab/solucion_framework.py`

#### Bloque 1 — Carga de datos (líneas 17–34)

Idéntico a `solucion_scratch.py`. Sin sorpresas.

#### Bloque 2 — Servidor FastMCP (líneas 37–130)

```python
mcp = FastMCP(name="airline-policy-rag-mcp", ...)
@mcp.tool def policy_rag(...): ...
@mcp.tool def apply_flight_change(...): ...
@mcp.resource("policy://{fare_class}/{route_type}") def policy_resource(...): ...
@mcp.prompt def flight_change_analysis(...): ...
```

**Puente scratch:** `TOOL_DEFINITIONS` + `TOOL_HANDLERS` → cuatro decoradores. La lógica de negocio (leer `politica.json`) es la misma.

#### Bloque 3 — Gate de permisos en `apply_flight_change` (líneas 85–115)

La lógica de `permission_required` la implementas **tú** — FastMCP no tiene un `guardrail.confirm` built-in. Tu scratch ya lo hace en `MCPServer._tools_call`; aquí va dentro de la función tool.

#### Bloque 4 — Cliente STDIO demo (líneas 140–195)

```python
async with Client(server_script) as client:
    tools = await client.list_tools()
    await client.read_resource("policy://...")
    await client.get_prompt("flight_change_analysis", {...})
    await client.call_tool("policy_rag", {...})
    # manejar permission_required en apply_flight_change
```

**Puente scratch:** equivale a `PolicyRAGAgent.run()` pero con API async y sin JSON-RPC manual.

#### Bloque 5 — Cliente HTTP y multi-server (líneas 198–250)

Demuestra que el mismo server sirve por STDIO y HTTP — solo cambia `transport` en `mcp.run()` y la URL en `Client`.

### 8.11 Cuándo usar cada enfoque y gotchas finales

| Situación | Usa | Por qué |
|-----------|-----|---------|
| Prototipo local, un IDE | STDIO + FastMCP | `mcp.run(transport="stdio")` — 3 líneas |
| Server compartido en la org | Streamable HTTP | Un deploy, N agentes |
| Tool in-process, un solo agente | `@tool` LangChain (M6) | Sin overhead de protocolo |
| Integración REST puntual | `tool.service` / `tool.http` | No necesitas MCP |
| Acción sensible | Permisos + `guardrail.confirm` | Defensa en profundidad: protocolo + guardrail |

**Gotchas:**

1. **Docstrings pobres → tools mal usadas** (igual que M6 §8.9).
2. **Un server MCP es código arbitrario** — audítalo como cualquier dependencia.
3. **STDIO = un cliente por proceso** — para multi-cliente usa HTTP.
4. **FastMCP no reemplaza guardrails** — combina `permission_required` con `guardrail.confirm` en producción.
5. **Versionado del protocolo** — verifica `protocolVersion` en el handshake (tu scratch: `2024-11-05`).

### 8.12 Checklist antes de escribir tu `solucion_framework.py`

- [ ] ¿Tienes `@mcp.tool` con docstrings que explican **cuándo** usar cada tool?
- [ ] ¿`apply_flight_change` devuelve `permission_required` sin token?
- [ ] ¿Tienes al menos un `@mcp.resource` y un `@mcp.prompt`?
- [ ] ¿El `Client` STDIO lista tools, llama `policy_rag` y maneja permisos?
- [ ] *(Reto)* ¿Puedes levantar el server por HTTP y conectar un `Client` remoto?

**Siguiente paso:** abre `lab/enunciado.md` (Parte B) e intenta escribir el archivo tú mismo antes de mirar `solucion_framework.py`.

---

## 9. Checkpoint — Lo sabes si puedes…

- [ ] Explicar la diferencia entre MCP Host, Client y Server.
- [ ] Describir en qué se diferencia MCP del tool-calling de M6 (descubrimiento, transporte, primitivas).
- [ ] Nombrar las tres primitivas MCP (tools, resources, prompts) y dar un ejemplo de cada una.
- [ ] Explicar cuándo usar STDIO vs Streamable HTTP.
- [ ] Describir el flujo de aprobación de permisos para una acción sensible.
- [ ] Explicar qué es sampling y por qué puede ser un riesgo de seguridad.
- [ ] Explicar qué son roots y por qué importan para servers de filesystem.
- [ ] Dibujar el flujo del taller: handshake → tools/list → policy_rag → permission gate → apply_flight_change.
- [ ] Explicar qué hace `@mcp.tool` y cómo se relaciona con `@tool` de LangChain.
- [ ] Leer el `flow.json` del template 01 e identificar qué nodo reemplazarías por `tool.mcp`.
- [ ] Argumentar cuándo MCP es overkill y cuándo `tool.service` basta.

**Si no puedes:** repasa §1–§4 (concepto y seguridad), §8 (FastMCP) y el [lab/enunciado.md](lab/enunciado.md). Ejecuta `solucion_scratch.py` y sigue la traza línea a línea.

# M8 · Ejercicios — Model Context Protocol (MCP)

> **Instrucciones:** Responde sin mirar las soluciones. Para ejercicios de código, escribe tu respuesta antes de ejecutarla.
>
> Las respuestas razonadas están en `soluciones.md`.

---

## Ejercicio 1 · Opción múltiple — ¿MCP o integración directa?

Para cada escenario, indica si usarías MCP, `tool.service` (HTTP directo) o `@tool` in-process, y justifica en una frase.

**(a)** Un agente interno de aerolínea necesita PolicyRAG, y el mismo servidor debe servir a Cursor (IDE) y a un copilot web.

**(b)** Un script batch nocturno llama a una API de pricing con contrato OpenAPI fijo; solo un proceso lo consume.

**(c)** Prototipo de agente con 3 funciones Python locales; un solo desarrollador, sin despliegue separado.

**(d)** Equipo de datos expone un catálogo de métricas que consumen 4 agentes distintos en 2 organizaciones.

---

## Ejercicio 2 · Opción múltiple — Primitivas MCP

¿Qué primitiva MCP usarías en cada caso?

**(a)** Consultar el texto completo de una política tarifaria por URI, sin efectos secundarios.

**(b)** Cobrar USD 130 a un pasajero por cambio de vuelo.

**(c)** Ofrecer al usuario una plantilla predefinida "Analiza viabilidad de cambio para tarifa X".

**(d)** Listar los nombres y schemas de capacidades disponibles en un servidor recién conectado.

---

## Ejercicio 3 · Verdadero o falso

Indica V o F y corrige las falsas en una frase.

**(a)** MCP reemplaza las APIs REST de negocio — ya no necesitas `tool.service`.

**(b)** En transporte STDIO, el cliente lanza el servidor como subprocess y comunica por stdin/stdout.

**(c)** `tools/list` permite al cliente descubrir tools sin conocerlas de antemano.

**(d)** Un `@mcp.resource` puede modificar la base de datos si el servidor lo implementa así.

**(e)** Sampling permite que el servidor pida al cliente que invoque el LLM.

---

## Ejercicio 4 · "Dibuja el flujo"

Dibuja (ASCII o lista numerada) el flujo completo del taller M8 cuando el agente intenta `apply_flight_change` sin permiso previo. Incluye: `tools/call`, `permission_required`, `permissions/respond`, reintento con token.

---

## Ejercicio 5 · "Predice la salida"

Dado este fragmento del servidor scratch:

```python
SENSITIVE_TOOLS = {"apply_flight_change"}

def _tools_call(self, req_id, params):
    name = params.get("name")
    permission_token = params.get("_permission_token")
    if name in SENSITIVE_TOOLS and permission_token != "approved":
        return _rpc_ok(req_id, {
            "permission_required": True,
            "permission": {"id": "perm-001", "scope": "financial"}
        })
    result = TOOL_HANDLERS[name](**params.get("arguments", {}))
    return _rpc_ok(req_id, {"structuredContent": result})
```

El cliente envía:

```json
{"method": "tools/call", "params": {"name": "apply_flight_change",
  "arguments": {"pnr": "SCL-BOG-001", "amount_usd": 130}}}
```

**(a)** ¿La respuesta contiene `permission_required`? ¿Por qué?

**(b)** ¿Se ejecutó `apply_flight_change`? ¿Cómo lo sabes?

**(c)** ¿Qué debe enviar el cliente antes de reintentar?

---

## Ejercicio 6 · "Encuentra el bug"

Este cliente MCP tiene un bug de protocolo:

```python
def call_tool(self, name, arguments):
    request = {"jsonrpc": "2.0", "method": "tools/call",
               "params": {"name": name, "arguments": arguments}}
    self.proc.stdin.write(json.dumps(request) + "\n")
    self.proc.stdin.flush()
    return json.loads(self.proc.stdout.readline())
```

El servidor siempre responde `{"error": {"code": -32002, "message": "Cliente no inicializado"}}`.

**(a)** ¿Qué falta en el cliente?

**(b)** ¿Qué campo JSON-RPC falta en el request de `tools/call`?

---

## Ejercicio 7 · Opción múltiple — Transporte

**(a)** ¿Cuándo elegirías STDIO sobre Streamable HTTP?

**(b)** ¿Cuándo elegirías HTTP sobre STDIO?

**(c)** ¿Puede un mismo servidor FastMCP atender ambos transportes sin cambiar las tools?

---

## Ejercicio 8 · "Elige la tecnología"

Un banco quiere que su agente de soporte use:
- PolicyRAG (lectura)
- Transferencias (escritura, requiere aprobación)
- Consulta de saldo (lectura)

El agente corre en K8s; los servicios en VMs distintas. ¿Diseñarías 1 server MCP, 3 servers MCP, o `tool.service` HTTP? Justifica.

---

## Ejercicio 9 · Seguridad — Sampling

Un servidor MCP de documentos envía al cliente:

```json
{"method": "sampling/createMessage", "params": {
  "messages": [{"role": "user", "content": "Resume este PDF: [500 páginas de datos internos]"}]
}}
```

**(a)** ¿Qué riesgos hay para el cliente?

**(b)** ¿Qué debería hacer un host responsable antes de ejecutar el sampling?

---

## Ejercicio 10 · Seguridad — Roots

Un servidor MCP de filesystem declara `roots: ["/"]`.

**(a)** ¿Por qué es peligroso?

**(b)** ¿Qué roots propondrías para un proyecto en `/home/dev/airline-agent`?

---

## Ejercicio 11 · RAGorbit — Nodo `tool.mcp`

En el `flow.json` del template 01, el nodo `policy_tool` es `tool.retriever`.

**(a)** ¿Qué tipo de nodo lo reemplazarías en M8?

**(b)** ¿Qué campos de `config` necesita ese nodo?

**(c)** ¿El puerto de salida cambia? ¿A qué se conecta?

---

## Ejercicio 12 · Comparativa MCP vs OpenAI Plugins

Completa la tabla con una diferencia clave por fila:

| Aspecto | MCP | OpenAI Plugins |
|---------|-----|----------------|
| Estándar | ? | ? |
| Descubrimiento | ? | ? |
| Portabilidad | ? | ? |

---

## Ejercicio 13 · "Traza el handshake"

Escribe la secuencia exacta de mensajes JSON-RPC (método + resultado esperado) desde que el cliente arranca hasta que tiene la lista de tools. Mínimo 2 mensajes.

---

## Ejercicio 14 · FastMCP — Predice el schema

```python
@mcp.tool
def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """Consulta penalidades por tarifa y ruta."""
```

**(a)** ¿Qué campos tendrá el `inputSchema` generado automáticamente?

**(b)** ¿Cuál es `required`?

**(c)** ¿De dónde sale la `description` que ve el LLM?

---

## Ejercicio 15 · FastMCP — Resource vs Tool

¿Por qué `policy_rag` es mejor como `@mcp.tool` y el texto estático de una política como `@mcp.resource("policy://{fare_class}/{route_type}")`? Da un argumento técnico para cada uno.

---

## Ejercicio 16 · Multi-server

Tienes dos servers MCP:
- `policy_server.py` → tool `policy_rag`
- `payment_server.py` → tool `charge_fee`

Ambos conectados a un `Client` multi-server. ¿Qué problema puede ocurrir si ambos exponen una tool llamada `get_status`? ¿Cómo lo resuelve FastMCP?

---

## Ejercicio 17 · "Encuentra el bug" — Permisos

```python
@mcp.tool
def apply_flight_change(pnr: str, amount_usd: float) -> dict:
    if amount_usd > 0:
        return execute_charge(pnr, amount_usd)  # cobra directamente
    return {"status": "no_charge"}
```

**(a)** ¿Qué falta respecto al modelo de seguridad del taller?

**(b)** ¿Qué debería devolver la tool en la primera llamada sin aprobación?

---

## Ejercicio 18 · Integración con guardrails

En el template 01, `guardrail.confirm` envuelve `PaymentService`. Si migras el pago a un server MCP:

**(a)** ¿Dónde va la lógica de confirmación: en el server MCP, en el guardrail, o en ambos?

**(b)** ¿Por qué la defensa en profundidad recomienda ambos?

---

## Ejercicio 19 · Código — JSON-RPC mínimo

Escribe (en pseudocódigo o Python) la estructura de un mensaje `initialize` del cliente y la respuesta esperada del servidor. Incluye `protocolVersion` y `serverInfo`.

---

## Ejercicio 20 · Caso integrador

Diseña la arquitectura MCP para el template `01-airline-flight-change` completo:

- ¿Cuántos servers MCP propondrías (policy, reservation, inventory, payment)?
- ¿Cuáles requieren scope `financial`?
- ¿Qué transporte usarías en desarrollo vs producción?
- ¿Qué nodo RAGorbit conectarías con `tool.mcp`?

Responde en 8–12 líneas con diagrama ASCII opcional.

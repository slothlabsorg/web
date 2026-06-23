# M8 · Soluciones — Model Context Protocol (MCP)

---

## Ejercicio 1

**(a)** **MCP** — el mismo server debe servir a IDE y copilot; el protocolo estándar evita N adaptadores.

**(b)** **`tool.service`** — un solo consumidor batch con contrato fijo; no necesitas descubrimiento dinámico ni portabilidad entre hosts.

**(c)** **`@tool` in-process** — prototipo local sin overhead de protocolo ni subprocess.

**(d)** **MCP** — cuatro agentes en dos orgs se benefician de un server estándar con `tools/list` y deploy independiente.

---

## Ejercicio 2

**(a)** **Resource** — lectura idempotente por URI (`resources/read`).

**(b)** **Tool** — acción con efecto secundario (cobro).

**(c)** **Prompt** — plantilla reutilizable (`prompts/get`).

**(d)** Ninguna primitiva de las tres — es el método de protocolo **`tools/list`** (capa de descubrimiento).

---

## Ejercicio 3

**(a)** **F** — MCP envuelve APIs; las APIs REST de negocio siguen existiendo bajo el server.

**(b)** **V**

**(c)** **V**

**(d)** **V** — el protocolo define resources como lectura, pero la implementación del servidor determina el comportamiento; un server malicioso podría violar el contrato. En la práctica, resources deben ser read-only por diseño.

**(e)** **V**

---

## Ejercicio 4

```
1. Cliente → tools/call(apply_flight_change, {pnr, amount})
2. Servidor → {permission_required: true, permission: {id, scope: financial}}
   (NO ejecuta el cobro)
3. Host muestra UI al usuario
4. Cliente → permissions/respond({permission_id, decision: approved})
5. Servidor registra permiso aprobado
6. Cliente → tools/call(apply_flight_change, {..., _permission_token: approved})
7. Servidor → {structuredContent: {status: captured, ...}}
```

---

## Ejercicio 5

**(a)** **Sí** — `apply_flight_change` está en `SENSITIVE_TOOLS` y no hay `_permission_token: "approved"`.

**(b)** **No** — el handler solo se invoca tras pasar el gate; la respuesta es `permission_required`, no `structuredContent` con `status: captured`.

**(c)** Primero `permissions/respond` con `decision: "approved"`, luego reintentar `tools/call` con `_permission_token: "approved"`.

---

## Ejercicio 6

**(a)** Falta llamar **`initialize`** antes de `tools/call`. El servidor exige handshake previo.

**(b)** Falta el campo **`id`** en el request JSON-RPC (identificador de correlación). Sin `id`, el servidor puede rechazar o no emparejar respuesta.

---

## Ejercicio 7

**(a)** **STDIO** — desarrollo local, un IDE (Cursor/Claude Desktop), sin exponer puertos.

**(b)** **HTTP** — múltiples agentes en K8s, server compartido, deploy independiente.

**(c)** **Sí** — las tools son las mismas; solo cambia `mcp.run(transport=...)`. El cliente usa distinta URL/comando.

---

## Ejercicio 8

**3 servers MCP** (o 2: policy+saldo lectura, transferencias escritura):

- PolicyRAG y saldo: scope lectura, sin aprobación especial.
- Transferencias: scope `financial`, requiere permiso.

**Transporte:** STDIO en desarrollo; **Streamable HTTP** en producción (K8s → VMs).

`tool.service` HTTP funcionaría, pero perderías descubrimiento dinámico y portabilidad entre hosts MCP. Con 4 consumidores y acciones sensibles, MCP justifica la inversión.

---

## Ejercicio 9

**(a)** Riesgos: **costo** (500 páginas al LLM), **fuga de PII/datos internos** al contexto del LLM, **abuso** por servidor malicioso.

**(b)** El host debe: **mostrar al usuario** qué servidor pide sampling y con qué contenido; permitir **denegar**; **limitar** tamaño de contexto; **auditar** la solicitud.

---

## Ejercicio 10

**(a)** Con `root: "/"` el server puede leer **cualquier archivo** del sistema (claves SSH, `.env`, etc.) — vector de exfiltración.

**(b)** Roots acotados, p.ej.: `["/home/dev/airline-agent/data", "/home/dev/airline-agent/mocks"]` — solo lo necesario para el agente.

---

## Ejercicio 11

**(a)** **`tool.mcp`**

**(b)** `server` (comando o ruta al script MCP), `transport` (`stdio` o `http`), opcionalmente `tool` si filtras una tool específica.

**(c)** **No cambia** — puerto de salida `Tool` → se conecta a `agent.react` igual que `tool.retriever`.

---

## Ejercicio 12

| Aspecto | MCP | OpenAI Plugins |
|---------|-----|----------------|
| Estándar | Abierto (ecosistema Anthropic + comunidad) | Cerrado (OpenAI) |
| Descubrimiento | `tools/list` dinámico en runtime | Manifest estático por integración |
| Portabilidad | Claude, Cursor, VS Code, agentes custom | Solo ecosistema OpenAI |

---

## Ejercicio 13

```
1. Cliente → initialize({protocolVersion: "2024-11-05", clientInfo: {...}})
   Servidor → {protocolVersion, serverInfo: {name, version}, capabilities: {...}}

2. Cliente → tools/list({})
   Servidor → {tools: [{name, description, inputSchema}, ...]}
```

---

## Ejercicio 14

**(a)** `properties`: `fare_class` (string), `route_type` (string), `query` (string, opcional).

**(b)** `required`: `["fare_class", "route_type"]` — `query` tiene default, no es required.

**(c)** Del **docstring** de la función: `"Consulta penalidades por tarifa y ruta."`

---

## Ejercicio 15

- **`policy_rag` como tool:** la consulta puede incluir parámetros variables (`query`), filtros dinámicos y efectos de búsqueda — es una **operación** invocable con argumentos.
- **`policy_resource` como resource:** el texto estático de una política para una tarifa/ruta fija es un **dato** legible por URI, cacheable, sin efectos secundarios — semántica correcta del protocolo.

---

## Ejercicio 16

**Problema:** colisión de nombres — el cliente no sabe cuál `get_status` invocar.

**Solución FastMCP:** **prefija** tools por servidor (`policy_get_status`, `payment_get_status`) cuando usas multi-server `Client([...])`.

---

## Ejercicio 17

**(a)** Falta **gate de permisos** — cobra sin aprobación del usuario.

**(b)** Debe devolver `{permission_required: true, permission: {scope: "financial", reason: "..."}}` sin llamar a `execute_charge`.

---

## Ejercicio 18

**(a)** **En ambos** — el server MCP valida permisos protocolares; el guardrail valida umbrales de negocio (`amount > 500`).

**(b)** **Defensa en profundidad:** si el agente o el LLM eluden el prompt, el guardrail bloquea; si el transporte MCP falla, el server tiene su propio gate; dos capas independientes reducen riesgo de cobro no autorizado.

---

## Ejercicio 19

**Request cliente:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": {"name": "airline-agent", "version": "1.0.0"}
  }
}
```

**Response servidor:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {"name": "airline-policy-rag-mcp", "version": "1.0.0"},
    "capabilities": {"tools": {}, "permissions": {"approvalRequired": true}}
  }
}
```

---

## Ejercicio 20

**Propuesta: 4 servers MCP** — `policy`, `reservation`, `inventory`, `payment`.

- **Scope `financial`:** `payment` (y opcionalmente `apply_flight_change` si está en policy server).
- **Desarrollo:** STDIO (Cursor + `python server.py`).
- **Producción:** Streamable HTTP en Cloud Run/K8s, auth JWT.
- **RAGorbit:** un `tool.mcp` por server conectado a `agent.react`; `payment` además envuelto por `guardrail.confirm` + `guardrail.idempotency`.

```
agent.react ◀── tool.mcp (policy)     ── HTTP ──▶ policy-mcp-svc
            ◀── tool.mcp (reservation) ── HTTP ──▶ reservation-mcp-svc
            ◀── tool.mcp (inventory)   ── HTTP ──▶ inventory-mcp-svc
            ◀── guardrail.* ◀── tool.mcp (payment) ── HTTP ──▶ payment-mcp-svc
```

Lectura (policy, reservation, inventory): sin aprobación. Escritura (payment): `permission_required` + `guardrail.confirm` para montos > USD 500.

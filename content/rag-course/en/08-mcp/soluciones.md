# M8 · Solutions — Model Context Protocol (MCP)

---

## Exercise 1

**(a)** **MCP** — the same server must serve IDE and copilot; the standard protocol avoids N adapters.

**(b)** **`tool.service`** — a single batch consumer with a fixed contract; you do not need dynamic discovery or portability across hosts.

**(c)** **In-process `@tool`** — local prototype with no protocol overhead or subprocess.

**(d)** **MCP** — four agents in two orgs benefit from a standard server with `tools/list` and independent deploy.

---

## Exercise 2

**(a)** **Resource** — idempotent read by URI (`resources/read`).

**(b)** **Tool** — action with side effect (charge).

**(c)** **Prompt** — reusable template (`prompts/get`).

**(d)** None of the three primitives — it is the protocol method **`tools/list`** (discovery layer).

---

## Exercise 3

**(a)** **F** — MCP wraps APIs; business REST APIs still exist under the server.

**(b)** **T**

**(c)** **T**

**(d)** **T** — the protocol defines resources as read-only, but server implementation determines behavior; a malicious server could violate the contract. In practice, resources should be read-only by design.

**(e)** **T**

---

## Exercise 4

```
1. Client → tools/call(apply_flight_change, {pnr, amount})
2. Server → {permission_required: true, permission: {id, scope: financial}}
   (does NOT execute the charge)
3. Host shows UI to the user
4. Client → permissions/respond({permission_id, decision: approved})
5. Server records approved permission
6. Client → tools/call(apply_flight_change, {..., _permission_token: approved})
7. Server → {structuredContent: {status: captured, ...}}
```

---

## Exercise 5

**(a)** **Yes** — `apply_flight_change` is in `SENSITIVE_TOOLS` and there is no `_permission_token: "approved"`.

**(b)** **No** — the handler is only invoked after passing the gate; the response is `permission_required`, not `structuredContent` with `status: captured`.

**(c)** First `permissions/respond` with `decision: "approved"`, then retry `tools/call` with `_permission_token: "approved"`.

---

## Exercise 6

**(a)** Missing call to **`initialize`** before `tools/call`. The server requires a prior handshake.

**(b)** Missing **`id`** field in the JSON-RPC request (correlation identifier). Without `id`, the server may reject or fail to match the response.

---

## Exercise 7

**(a)** **STDIO** — local development, one IDE (Cursor/Claude Desktop), no exposed ports.

**(b)** **HTTP** — multiple agents in K8s, shared server, independent deploy.

**(c)** **Yes** — the tools are the same; only `mcp.run(transport=...)` changes. The client uses a different URL/command.

---

## Exercise 8

**3 MCP servers** (or 2: policy+balance read, transfers write):

- PolicyRAG and balance: read scope, no special approval.
- Transfers: scope `financial`, requires permission.

**Transport:** STDIO in development; **Streamable HTTP** in production (K8s → VMs).

HTTP `tool.service` would work, but you would lose dynamic discovery and portability across MCP hosts. With 4 consumers and sensitive actions, MCP justifies the investment.

---

## Exercise 9

**(a)** Risks: **cost** (500 pages to the LLM), **PII/internal data leakage** into LLM context, **abuse** by a malicious server.

**(b)** The host must: **show the user** which server requests sampling and with what content; allow **denial**; **limit** context size; **audit** the request.

---

## Exercise 10

**(a)** With `root: "/"` the server can read **any file** on the system (SSH keys, `.env`, etc.) — exfiltration vector.

**(b)** Scoped roots, e.g.: `["/home/dev/airline-agent/data", "/home/dev/airline-agent/mocks"]` — only what the agent needs.

---

## Exercise 11

**(a)** **`tool.mcp`**

**(b)** `server` (command or path to MCP script), `transport` (`stdio` or `http`), optionally `tool` if filtering a specific tool.

**(c)** **No change** — output port `Tool` → connects to `agent.react` same as `tool.retriever`.

---

## Exercise 12

| Aspect | MCP | OpenAI Plugins |
|---------|-----|----------------|
| Standard | Open (Anthropic ecosystem + community) | Closed (OpenAI) |
| Discovery | Dynamic `tools/list` at runtime | Static manifest per integration |
| Portability | Claude, Cursor, VS Code, custom agents | OpenAI ecosystem only |

---

## Exercise 13

```
1. Client → initialize({protocolVersion: "2024-11-05", clientInfo: {...}})
   Server → {protocolVersion, serverInfo: {name, version}, capabilities: {...}}

2. Client → tools/list({})
   Server → {tools: [{name, description, inputSchema}, ...]}
```

---

## Exercise 14

**(a)** `properties`: `fare_class` (string), `route_type` (string), `query` (string, optional).

**(b)** `required`: `["fare_class", "route_type"]` — `query` has a default, not required.

**(c)** From the function **docstring**: `"Consulta penalidades por tarifa y ruta."`

---

## Exercise 15

- **`policy_rag` as tool:** the query can include variable parameters (`query`), dynamic filters, and search effects — it is an invocable **operation** with arguments.
- **`policy_resource` as resource:** static policy text for a fixed fare/route is **data** readable by URI, cacheable, no side effects — correct protocol semantics.

---

## Exercise 16

**Problem:** name collision — the client does not know which `get_status` to invoke.

**FastMCP solution:** **prefixes** tools by server (`policy_get_status`, `payment_get_status`) when using multi-server `Client([...])`.

---

## Exercise 17

**(a)** Missing **permission gate** — charges without user approval.

**(b)** Should return `{permission_required: true, permission: {scope: "financial", reason: "..."}}` without calling `execute_charge`.

---

## Exercise 18

**(a)** **Both** — the MCP server validates protocol permissions; the guardrail validates business thresholds (`amount > 500`).

**(b)** **Defense in depth:** if the agent or LLM bypasses the prompt, the guardrail blocks; if MCP transport fails, the server has its own gate; two independent layers reduce unauthorized charge risk.

---

## Exercise 19

**Client request:**

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

**Server response:**

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

## Exercise 20

**Proposal: 4 MCP servers** — `policy`, `reservation`, `inventory`, `payment`.

- **Scope `financial`:** `payment` (and optionally `apply_flight_change` if on the policy server).
- **Development:** STDIO (Cursor + `python server.py`).
- **Production:** Streamable HTTP on Cloud Run/K8s, JWT auth.
- **RAGorbit:** one `tool.mcp` per server connected to `agent.react`; `payment` additionally wrapped by `guardrail.confirm` + `guardrail.idempotency`.

```
agent.react ◀── tool.mcp (policy)     ── HTTP ──▶ policy-mcp-svc
            ◀── tool.mcp (reservation) ── HTTP ──▶ reservation-mcp-svc
            ◀── tool.mcp (inventory)   ── HTTP ──▶ inventory-mcp-svc
            ◀── guardrail.* ◀── tool.mcp (payment) ── HTTP ──▶ payment-mcp-svc
```

Read (policy, reservation, inventory): no approval. Write (payment): `permission_required` + `guardrail.confirm` for amounts > USD 500.

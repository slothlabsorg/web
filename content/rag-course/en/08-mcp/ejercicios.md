# M8 · Exercises — Model Context Protocol (MCP)

> **Instructions:** Answer without looking at the solutions. For coding exercises, write your answer before running it.
>
> Reasoned answers are in `soluciones.md`.

---

## Exercise 1 · Multiple choice — MCP or direct integration?

For each scenario, indicate whether you would use MCP, `tool.service` (direct HTTP), or in-process `@tool`, and justify in one sentence.

**(a)** An internal airline agent needs PolicyRAG, and the same server must serve Cursor (IDE) and a web copilot.

**(b)** A nightly batch script calls a pricing API with a fixed OpenAPI contract; only one process consumes it.

**(c)** Agent prototype with 3 local Python functions; one developer, no separate deploy.

**(d)** A data team exposes a metrics catalog consumed by 4 different agents in 2 organizations.

---

## Exercise 2 · Multiple choice — MCP primitives

Which MCP primitive would you use in each case?

**(a)** Query the full text of a fare policy by URI, with no side effects.

**(b)** Charge a passenger USD 130 for a flight change.

**(c)** Offer the user a predefined template "Analyze change feasibility for fare X".

**(d)** List the names and schemas of capabilities available on a newly connected server.

---

## Exercise 3 · True or false

Indicate T or F and correct the false ones in one sentence.

**(a)** MCP replaces business REST APIs — you no longer need `tool.service`.

**(b)** With STDIO transport, the client launches the server as a subprocess and communicates via stdin/stdout.

**(c)** `tools/list` lets the client discover tools without knowing them in advance.

**(d)** An `@mcp.resource` can modify the database if the server implements it that way.

**(e)** Sampling lets the server ask the client to invoke the LLM.

---

## Exercise 4 · "Draw the flow"

Draw (ASCII or numbered list) the full M8 lab flow when the agent tries `apply_flight_change` without prior permission. Include: `tools/call`, `permission_required`, `permissions/respond`, retry with token.

---

## Exercise 5 · "Predict the output"

Given this fragment from the scratch server:

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

The client sends:

```json
{"method": "tools/call", "params": {"name": "apply_flight_change",
  "arguments": {"pnr": "SCL-BOG-001", "amount_usd": 130}}}
```

**(a)** Does the response contain `permission_required`? Why?

**(b)** Was `apply_flight_change` executed? How do you know?

**(c)** What must the client send before retrying?

---

## Exercise 6 · "Find the bug"

This MCP client has a protocol bug:

```python
def call_tool(self, name, arguments):
    request = {"jsonrpc": "2.0", "method": "tools/call",
               "params": {"name": name, "arguments": arguments}}
    self.proc.stdin.write(json.dumps(request) + "\n")
    self.proc.stdin.flush()
    return json.loads(self.proc.stdout.readline())
```

The server always responds `{"error": {"code": -32002, "message": "Client not initialized"}}`.

**(a)** What is missing in the client?

**(b)** What JSON-RPC field is missing in the `tools/call` request?

---

## Exercise 7 · Multiple choice — Transport

**(a)** When would you choose STDIO over Streamable HTTP?

**(b)** When would you choose HTTP over STDIO?

**(c)** Can the same FastMCP server serve both transports without changing the tools?

---

## Exercise 8 · "Choose the technology"

A bank wants its support agent to use:
- PolicyRAG (read)
- Transfers (write, requires approval)
- Balance inquiry (read)

The agent runs in K8s; services on different VMs. Would you design 1 MCP server, 3 MCP servers, or HTTP `tool.service`? Justify.

---

## Exercise 9 · Security — Sampling

An MCP document server sends the client:

```json
{"method": "sampling/createMessage", "params": {
  "messages": [{"role": "user", "content": "Summarize this PDF: [500 pages of internal data]"}]
}}
```

**(a)** What risks does this pose for the client?

**(b)** What should a responsible host do before executing sampling?

---

## Exercise 10 · Security — Roots

An MCP filesystem server declares `roots: ["/"]`.

**(a)** Why is this dangerous?

**(b)** What roots would you propose for a project in `/home/dev/airline-agent`?

---

## Exercise 11 · RAGorbit — `tool.mcp` node

In template 01's `flow.json`, the `policy_tool` node is `tool.retriever`.

**(a)** What node type would you replace it with in M8?

**(b)** What `config` fields does that node need?

**(c)** Does the output port change? What does it connect to?

---

## Exercise 12 · MCP vs OpenAI Plugins comparison

Complete the table with one key difference per row:

| Aspect | MCP | OpenAI Plugins |
|---------|-----|----------------|
| Standard | ? | ? |
| Discovery | ? | ? |
| Portability | ? | ? |

---

## Exercise 13 · "Trace the handshake"

Write the exact sequence of JSON-RPC messages (method + expected result) from client startup until it has the tool list. Minimum 2 messages.

---

## Exercise 14 · FastMCP — Predict the schema

```python
@mcp.tool
def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """Query penalties by fare and route."""
```

**(a)** What fields will the automatically generated `inputSchema` have?

**(b)** What is `required`?

**(c)** Where does the `description` the LLM sees come from?

---

## Exercise 15 · FastMCP — Resource vs Tool

Why is `policy_rag` better as `@mcp.tool` and static policy text as `@mcp.resource("policy://{fare_class}/{route_type}")`? Give one technical argument for each.

---

## Exercise 16 · Multi-server

You have two MCP servers:
- `policy_server.py` → tool `policy_rag`
- `payment_server.py` → tool `charge_fee`

Both connected to a multi-server `Client`. What problem can occur if both expose a tool named `get_status`? How does FastMCP resolve it?

---

## Exercise 17 · "Find the bug" — Permissions

```python
@mcp.tool
def apply_flight_change(pnr: str, amount_usd: float) -> dict:
    if amount_usd > 0:
        return execute_charge(pnr, amount_usd)  # charges directly
    return {"status": "no_charge"}
```

**(a)** What is missing relative to the lab security model?

**(b)** What should the tool return on the first call without approval?

---

## Exercise 18 · Integration with guardrails

In template 01, `guardrail.confirm` wraps `PaymentService`. If you migrate payment to an MCP server:

**(a)** Where does confirmation logic go: on the MCP server, on the guardrail, or both?

**(b)** Why does defense in depth recommend both?

---

## Exercise 19 · Code — Minimal JSON-RPC

Write (in pseudocode or Python) the structure of a client `initialize` message and the expected server response. Include `protocolVersion` and `serverInfo`.

---

## Exercise 20 · Integrative case

Design the MCP architecture for the full `01-airline-flight-change` template:

- How many MCP servers would you propose (policy, reservation, inventory, payment)?
- Which require scope `financial`?
- What transport would you use in development vs production?
- Which RAGorbit node would you connect with `tool.mcp`?

Answer in 8–12 lines with optional ASCII diagram.

# Module 8 · Model Context Protocol (MCP) in depth (`tool.mcp`)

> **Prerequisite:** complete M6 (agents, tool calling) and understand the ReAct loop.
>
> **RAGorbit nodes:** `tool.mcp`, `agent.react` (as MCP consumer)
>
> **Anchor templates:** `01-airline-flight-change` (PolicyRAG exposed as MCP server in the lab)

---

## 1. What MCP is and why it exists

### 1.1 The ad hoc integration problem

In M6 you learned *tool calling*: the LLM emits `{"tool": "ReservationService", "arguments": {...}}` and the framework runs the function. Each integration is **custom**:

```
LangChain Agent  ──▶  ReservationService (custom HTTP, manual schema)
Cursor IDE        ──▶  GitHub API (another schema, another auth)
Claude Desktop    ──▶  Filesystem (another contract)
```

Each host (IDE, agent, copilot) reinvents how to discover tools, pass context, request permissions, and transport messages. The result: **N hosts × M services = N×M adapters**.

### 1.2 MCP as an open standard

The **Model Context Protocol** (MCP), started by Anthropic and adopted by the ecosystem (Cursor, Claude Desktop, VS Code, etc.), defines a single contract between:

```
┌─────────────┐     MCP      ┌─────────────┐     API/biz    ┌─────────────┐
│  MCP Host   │ ◀──────────▶ │ MCP Server  │ ─────────────▶ │  Service    │
│ (IDE/agent) │   JSON-RPC   │ (PolicyRAG) │   HTTP/DB/...  │  real       │
└─────────────┘              └─────────────┘                └─────────────┘
       │
       │  orchestrates
       ▼
┌─────────────┐
│ MCP Client  │  ← library inside the host; speaks the protocol
└─────────────┘
```

- **Host:** the application the user runs (Cursor, your FastAPI agent).
- **Client:** library that implements MCP inside the host.
- **Server:** process that exposes capabilities (tools, resources, prompts).

An MCP server built once serves **all** compatible hosts — without rewriting integrations.

### 1.3 MCP vs traditional tool calling

| Aspect | Tool calling (M6) | MCP |
|---------|-------------------|-----|
| Contract | JSON Schema per framework | Standard protocol (JSON-RPC) |
| Discovery | You register tools manually in the agent | Client calls `tools/list` dynamically |
| Transport | In-process or ad hoc HTTP | Standardized STDIO or Streamable HTTP |
| Primitives | Tools only (functions) | Tools + **resources** (data) + **prompts** (templates) |
| Security | Framework guardrails (`guardrail.confirm`) | **Sampling**, **roots**, **permissions** at protocol level |
| Portability | Framework lock-in (LangChain, OpenAI) | One server serves multiple hosts |

**They are not mutually exclusive:** in production, a LangGraph agent can consume tools via the `tool.mcp` node — the LLM still does tool calling, but the tools come from an external MCP server.

### 1.4 When to use MCP / when NOT to

**Use MCP when:**
- You want to expose capabilities to **multiple clients** (IDE + internal agent + another team).
- Tools live in a **separate process** with its own lifecycle (independent deploy).
- You need **dynamic discovery** (the client does not know the tools in advance).
- You operate in regulated environments where **explicit permissions** are mandatory.

**Do NOT use MCP when:**
- You have 2–3 local Python functions used by a single agent → in-process `@tool` is enough (M6).
- The latency of an extra subprocess/HTTP is unacceptable (microsecond hot path).
- The service already exposes a mature REST API and only one client consumes it → `tool.service` is simpler.
- You are prototyping and the protocol complexity does not add value yet.

---

## 2. Protocol architecture

### 2.1 Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                    MCP ARCHITECTURE                              │
│                                                                  │
│  Application layer                                               │
│  ──────────────────                                              │
│  Tools · Resources · Prompts · Sampling · Roots · Permissions  │
│                                                                  │
│  Protocol layer                                                  │
│  ─────────────────                                               │
│  JSON-RPC 2.0 — methods: initialize, tools/list, tools/call,     │
│                 resources/list, resources/read, prompts/list,    │
│                 prompts/get, sampling/createMessage, ...           │
│                                                                  │
│  Transport layer                                                 │
│  ──────────────────                                              │
│  STDIO (local subprocess)  ·  Streamable HTTP (network)          │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Session lifecycle

```
Client                               Server
   │                                    │
   │──── initialize ──────────────────▶│  handshake + capabilities
   │◀─── {protocolVersion, serverInfo}─│
   │                                    │
   │──── tools/list ──────────────────▶│  discovery
   │◀─── [{name, description, schema}]─│
   │                                    │
   │──── tools/call ──────────────────▶│  execution
   │◀─── {content, structuredContent}──│
   │                                    │
   │──── tools/call (sensitive) ───────▶│  no permission → blocked
   │◀─── {permission_required: true}──│
   │                                    │
   │──── permissions/respond ─────────▶│  user approves
   │◀─── {status: approved}───────────│
   │                                    │
   │──── tools/call (with token) ──────▶│  executes action
   │◀─── {status: captured}───────────│
```

### 2.3 The three primitives

| Primitive | Analogy | Airline example |
|-----------|----------|-------------------|
| **Tool** | Callable function | `policy_rag(fare_class, route_type)` |
| **Resource** | Readable data (URI) | `policy://ECONOMY_FLEX/international` → rule text |
| **Prompt** | Message template | `flight_change_analysis(fare_class)` → prompt for the LLM |

In RAGorbit:
- `tool.mcp` consumes server **tools**.
- The host uses resources and prompts directly (Cursor shows them to the user/LLM).

---

## 3. Transport: STDIO vs Streamable HTTP

### 3.1 STDIO — local communication

```
Host/Client
    │
    │ spawn subprocess
    ▼
┌─────────────────────────┐
│ python server.py        │
│   stdin  ◀── JSON-RPC   │
│   stdout ──▶ JSON-RPC   │
└─────────────────────────┘
```

- **When:** local development, Claude Desktop, Cursor, agents that launch the server as a child process.
- **Advantage:** no open ports, process isolation, simple.
- **In the lab:** `solucion_scratch.py` uses `subprocess.Popen` + pipes.

### 3.2 Streamable HTTP — network communication

```
Client (agent in K8s)  ──HTTP POST/SSE──▶  MCP Server (Cloud Run)
                                              https://mcp.airline.internal/mcp
```

- **When:** server shared by multiple agents, deploy on Docker/Cloud Run.
- **Advantage:** scalable, one server for the whole organization.
- **Gotcha:** requires auth (JWT, mTLS), rate limiting, and observability.

### 3.3 Comparison

| | STDIO | Streamable HTTP |
|---|-------|-----------------|
| Latency | Low (local pipes) | Higher (network) |
| Deploy | Client subprocess | Independent service |
| Security | OS isolation | Network auth required |
| Multi-client | One client per process | Many concurrent clients |
| Example | Cursor + local server | K8s agent → MCP on Cloud Run |

---

## 4. MCP security

### 4.1 Sampling — the server asks the LLM

In MCP, the **server** can ask the **client** to invoke the LLM (sampling). Use case: the server needs the LLM to summarize a document before indexing it.

```
Server ──sampling/createMessage──▶ Client ──▶ LLM ──▶ response ──▶ Server
```

**Risk:** a malicious server could abuse the client's LLM (cost, context leakage).
**Mitigation:** the client must show the user which server is requesting sampling and allow denial.

### 4.2 Roots — filesystem boundaries

**Roots** define which filesystem directories an MCP server may read/write (e.g. a file server).

```
Client declares roots: ["/home/user/project", "/tmp/shared"]
Server only accesses paths within those roots
```

**In production:** never give `root: "/"` to an untrusted server.

### 4.3 Permission-based approval

The central mechanism for sensitive actions. Lab flow:

```
1. Agent calls apply_flight_change(amount=130)
2. Server responds: permission_required, scope=financial
3. Host shows UI: "Do you authorize a charge of USD 130.00?"
4. User approves → permissions/respond(decision=approved)
5. Agent retries with permission_token → charge executed
```

This is the protocol equivalent of `guardrail.confirm` in template 01 — but **independent of the agent framework**.

| RAGorbit guardrail | MCP equivalent |
|--------------------|-----------------|
| `guardrail.pre-tool` | Validation on the server before execution |
| `guardrail.confirm` | `permission_required` + approval UI |
| `guardrail.idempotency` | Logic on the server (composite key) |
| `guardrail.resilience` | Retry/circuit breaker on HTTP transport |

### 4.4 Security gotchas

1. **Trust the server like third-party code** — an MCP server can exfiltrate data via tools or sampling.
2. **Server allowlist** — in Cursor/Claude Desktop, only connect servers you audit.
3. **Granular scopes** — separate `read_policy` (no approval) from `financial` (with approval).
4. **Do not mix permissions** — a `read_policy` token must not authorize `financial`.
5. **Audit trail** — log every `tools/call` with arguments and result (like `observability.audit` in template 01).

---

## 5. MCP vs plugins and proprietary functions

See the full comparison in [`referencia/tecnologias-comparadas.md §10`](../referencia/tecnologias-comparadas.md#10-mcp-vs-plugins-y-funciones-propietarias).

```
                    MCP                    OpenAI Plugins / Assistants
                    ───                    ───────────────────────────
Standard            Open                   Vendor-locked
Discovery           Dynamic tools/list       Manual definition
Portability         Claude, Cursor, custom OpenAI ecosystem only
Security            Protocol permissions   Variable
```

**Practical rule:** MCP wraps your business APIs in a portable contract. The APIs (`tool.service`, `tool.http`) remain the business layer; MCP is the **presentation layer to the LLM**.

---

## 6. Connecting to one and many servers

### 6.1 One server

```
ReAct Agent
    │
    └── tool.mcp ──STDIO──▶ PolicyRAG Server
```

Typical `tool.mcp` node configuration in RAGorbit:

```json
{
  "type": "tool.mcp",
  "config": {
    "server": "python /app/mcp/policy_server.py",
    "transport": "stdio"
  }
}
```

The agent discovers the server's tools at runtime and uses them like any other tool.

### 6.2 Multiple servers

```
ReAct Agent
    ├── tool.mcp ──▶ PolicyRAG Server    (tools: policy_rag)
    ├── tool.mcp ──▶ Inventory MCP       (tools: search_flights)
    └── tool.mcp ──▶ Payment MCP        (tools: charge_fee)
```

In FastMCP, `Client` can connect to multiple sources and **prefix** tools by server (`policy_policy_rag`, `inventory_search_flights`) to avoid name collisions.

### 6.3 Template 01 — before and after MCP

**Before (M6):** PolicyRAG embedded in the graph.

```
store.pgvector ──▶ tool.retriever "policy_rag" ──▶ agent.react
```

**After (M8):** PolicyRAG as a decoupled MCP service.

```
[MCP Server: policy-rag]
  @tool policy_rag
  @resource policy://{fare_class}/{route_type}
       ▲
       │ STDIO or HTTP
       │
tool.mcp ──▶ agent.react
```

Advantage: the policy team deploys and versions the MCP server without touching the agent graph. See [`examples/01-airline-flight-change/README.md`](../../examples/01-airline-flight-change/README.md).

---

## 7. RAGorbit `tool.mcp` node

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

- **Output port:** `Tool` → connects to `agent.react`.
- Codegen generates code that launches the MCP subprocess and translates `tools/call` into agent invocations.

Full reference: [`referencia/catalogo-nodos.md §tool.mcp`](../referencia/catalogo-nodos.md#toolmcp).

---

## 8. Layer ③ explained: FastMCP from scratch

> **Prerequisite:** implement layer ② of the lab (`lab/solucion_scratch.py`) or understand each piece you wrote by hand. **Read this section in full** before attempting to write `lab/solucion_framework.py`.
>
> **Environment:** the course study machine has no `pip` or network. You will not be able to run this code here. The goal is that when you have `pip install fastmcp`, you can **write** the framework solution yourself.
>
> **Cross-link:** if you mastered tools and the ReAct loop in M6, connect with [M6 §8 — Layer ③ explained: LangGraph from scratch](../06-agentes-i/guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph). There you learned `@tool` and `create_react_agent`; here you learn `@mcp.tool` and `Client`.

### 8.1 Reminder: what you already know from M6

| M6 piece | What it is for in M8 |
|----------|----------------------|
| `@tool` + docstring → LLM description | `@mcp.tool` does the same for the MCP protocol |
| `TOOLS = [...]` manual registration | `tools/list` discovers tools automatically from the server |
| `fake_llm` decides which tool to call | The host (Cursor/agent) uses the LLM + discovered MCP tools |
| `guardrail.confirm` for sensitive actions | `permission_required` + user approval |

**What's new in M8** is not "tools" in general — it is the **standard protocol** that transports, discovers, and protects those tools across processes.

### 8.2 Bridge table: your scratch → FastMCP

| What you did by hand (layer ②) | FastMCP piece (layer ③) | Where in the lab |
|--------------------------------|------------------------|-----------------|
| `TOOL_DEFINITIONS` — manual registration with schemas | `@mcp.tool` generates schema + description from docstring | `policy_rag`, `apply_flight_change` |
| `TOOL_HANDLERS` dict name→function | Decorated functions **are** the handlers | Same functions |
| `MCPServer.handle()` — JSON-RPC router | `FastMCP` + `mcp.run()` — full protocol | `mcp = FastMCP(...)` |
| `serve_stdio()` — read stdin line by line | `mcp.run(transport="stdio")` | `--server` |
| `MCPStdioClient._send()` — write JSON-RPC | `Client(server_script)` — automatic transport | `demo_stdio_client()` |
| Manual `initialize` handshake | Handled by `Client` on entering `async with` | `async with Client(...)` |
| Manual `tools/list` | `await client.list_tools()` | STDIO demo |
| Manual `tools/call` | `await client.call_tool(name, args)` | STDIO demo |
| Resource as JSON in tool result | `@mcp.resource("policy://{fare_class}/{route_type}")` | `policy_resource` |
| Hardcoded system prompt | `@mcp.prompt` — reusable template | `flight_change_analysis` |
| `permission_required` in tools/call | Same logic; FastMCP does not implement it for you — you put it in the tool | `apply_flight_change` |
| `subprocess.Popen` + pipes | `Client` launches STDIO subprocess automatically | `Client(server_script)` |
| HTTP not implemented in scratch | `mcp.run(transport="streamable-http")` + `Client(url)` | `--http` |

**Mental model:** in scratch you are the protocol (JSON-RPC, transport, handshake). In FastMCP the framework **is** the protocol — you only declare tools/resources/prompts as Python functions.

### 8.3 `FastMCP` — create the server

```python
from fastmcp import FastMCP

mcp = FastMCP(
    name="airline-policy-rag-mcp",
    instructions="MCP server for airline fare policies.",
)
```

- `name` → appears in `serverInfo` during handshake (your scratch: `SERVER_NAME`).
- `instructions` → context clients receive about the server's purpose.

**Run the server:**

```python
if __name__ == "__main__":
    mcp.run(transport="stdio")       # local — Cursor, Claude Desktop
    # mcp.run(transport="streamable-http", port=8765)  # network
```

### 8.4 `@mcp.tool` — from Python function to MCP tool

In scratch you defined schemas manually:

```python
TOOL_DEFINITIONS = [{
    "name": "policy_rag",
    "description": "Queries fare rules and penalties...",
    "inputSchema": {"type": "object", "properties": {...}},
}]
```

In FastMCP:

```python
@mcp.tool(annotations={"readOnlyHint": True})
def policy_rag(fare_class: str, route_type: str, query: str = "") -> dict:
    """
    Queries fare rules and penalties filtered by
    fare_class and route_type. Use it to determine if charges apply.
    """
    ...
```

FastMCP automatically:
1. **Name** — from the function (`policy_rag`).
2. **Description** — from the docstring (same as LangChain `@tool` in M6 §8.3).
3. **JSON Schema** — from type hints.
4. **Registration** — the tool appears in `tools/list` with no extra code.

**Annotations** (`readOnlyHint`, `destructiveHint`) help the host decide whether to request permission before execution — similar to marking `sensitive: True` in your scratch.

### 8.5 `@mcp.resource` — data readable by URI

Resources are data the client **reads** (does not execute):

```python
@mcp.resource("policy://{fare_class}/{route_type}")
def policy_resource(fare_class: str, route_type: str) -> str:
    """Full text of the policy for a given fare and route."""
    ...
```

The client accesses with:

```python
text = await client.read_resource("policy://ECONOMY_FLEX/international")
```

**When to use resource vs tool:**
- **Resource:** the data is idempotent and readable (policy, config, state). No side effects.
- **Tool:** the operation may have effects (charge, send email, modify DB).

### 8.6 `@mcp.prompt` — message templates

```python
@mcp.prompt
def flight_change_analysis(fare_class: str, route_type: str) -> str:
    """Template for analyzing the feasibility of a flight change."""
    return f"Analyze whether a passenger with fare {fare_class}..."
```

The client gets the rendered prompt:

```python
prompt = await client.get_prompt("flight_change_analysis",
    {"fare_class": "ECONOMY_FLEX", "route_type": "international"})
```

Useful for the host (Cursor) to offer predefined actions to the user without the LLM inventing the prompt.

### 8.7 `Client` — consume the server (STDIO)

```python
from fastmcp import Client

async with Client("solucion_framework.py") as client:
    tools = await client.list_tools()
    result = await client.call_tool("policy_rag", {
        "fare_class": "ECONOMY_FLEX",
        "route_type": "international",
    })
```

**What `Client` does for you** (what you implemented by hand in scratch):

| Your scratch | FastMCP Client |
|------------|----------------|
| `subprocess.Popen([python, script, "--server"])` | Launches the server automatically |
| `initialize` + verify `protocolVersion` | Handshake on entering `async with` |
| `_send("tools/list")` | `list_tools()` |
| `_send("tools/call", params)` | `call_tool(name, args)` |
| Read stdout line by line | Buffer and error handling |

### 8.8 `Client` — consume the server (HTTP)

```python
# Terminal 1: start server
mcp.run(transport="streamable-http", host="127.0.0.1", port=8765)

# Terminal 2: client
async with Client("http://127.0.0.1:8765/mcp") as client:
    result = await client.call_tool("policy_rag", {...})
```

Same client API, different transport — the client negotiates automatically.

### 8.9 Multi-server

```python
async with Client(["policy_server.py", "inventory_server.py"]) as client:
    tools = await client.list_tools()
    # prefixed tools: policy_policy_rag, inventory_search_flights
```

Useful pattern when each domain (policies, inventory, payments) is an independent MCP server — like the separate `tool.service` nodes in template 01.

### 8.10 Block-by-block walkthrough of `lab/solucion_framework.py`

#### Block 1 — Data loading (lines 17–34)

Identical to `solucion_scratch.py`. No surprises.

#### Block 2 — FastMCP server (lines 37–130)

```python
mcp = FastMCP(name="airline-policy-rag-mcp", ...)
@mcp.tool def policy_rag(...): ...
@mcp.tool def apply_flight_change(...): ...
@mcp.resource("policy://{fare_class}/{route_type}") def policy_resource(...): ...
@mcp.prompt def flight_change_analysis(...): ...
```

**Scratch bridge:** `TOOL_DEFINITIONS` + `TOOL_HANDLERS` → four decorators. Business logic (read `politica.json`) is the same.

#### Block 3 — Permission gate in `apply_flight_change` (lines 85–115)

You implement the `permission_required` logic **yourself** — FastMCP has no built-in `guardrail.confirm`. Your scratch already does it in `MCPServer._tools_call`; here it goes inside the tool function.

#### Block 4 — STDIO client demo (lines 140–195)

```python
async with Client(server_script) as client:
    tools = await client.list_tools()
    await client.read_resource("policy://...")
    await client.get_prompt("flight_change_analysis", {...})
    await client.call_tool("policy_rag", {...})
    # handle permission_required in apply_flight_change
```

**Scratch bridge:** equivalent to `PolicyRAGAgent.run()` but with async API and no manual JSON-RPC.

#### Block 5 — HTTP client and multi-server (lines 198–250)

Demonstrates that the same server serves over STDIO and HTTP — only `transport` in `mcp.run()` and the URL in `Client` change.

### 8.11 When to use each approach and final gotchas

| Situation | Use | Why |
|-----------|-----|---------|
| Local prototype, one IDE | STDIO + FastMCP | `mcp.run(transport="stdio")` — 3 lines |
| Shared server in the org | Streamable HTTP | One deploy, N agents |
| In-process tool, single agent | LangChain `@tool` (M6) | No protocol overhead |
| Point REST integration | `tool.service` / `tool.http` | You do not need MCP |
| Sensitive action | Permissions + `guardrail.confirm` | Defense in depth: protocol + guardrail |

**Gotchas:**

1. **Poor docstrings → misused tools** (same as M6 §8.9).
2. **An MCP server is arbitrary code** — audit it like any dependency.
3. **STDIO = one client per process** — use HTTP for multi-client.
4. **FastMCP does not replace guardrails** — combine `permission_required` with `guardrail.confirm` in production.
5. **Protocol versioning** — verify `protocolVersion` in the handshake (your scratch: `2024-11-05`).

### 8.12 Checklist before writing your `solucion_framework.py`

- [ ] Do you have `@mcp.tool` with docstrings that explain **when** to use each tool?
- [ ] Does `apply_flight_change` return `permission_required` without a token?
- [ ] Do you have at least one `@mcp.resource` and one `@mcp.prompt`?
- [ ] Does the STDIO `Client` list tools, call `policy_rag`, and handle permissions?
- [ ] *(Challenge)* Can you start the server over HTTP and connect a remote `Client`?

**Next step:** open `lab/enunciado.md` (Part B) and try to write the file yourself before looking at `solucion_framework.py`.

---

## 9. Checkpoint — You know it if you can…

- [ ] Explain the difference between MCP Host, Client, and Server.
- [ ] Describe how MCP differs from M6 tool calling (discovery, transport, primitives).
- [ ] Name the three MCP primitives (tools, resources, prompts) and give an example of each.
- [ ] Explain when to use STDIO vs Streamable HTTP.
- [ ] Describe the permission approval flow for a sensitive action.
- [ ] Explain what sampling is and why it can be a security risk.
- [ ] Explain what roots are and why they matter for filesystem servers.
- [ ] Draw the lab flow: handshake → tools/list → policy_rag → permission gate → apply_flight_change.
- [ ] Explain what `@mcp.tool` does and how it relates to LangChain `@tool`.
- [ ] Read template 01's `flow.json` and identify which node you would replace with `tool.mcp`.
- [ ] Argue when MCP is overkill and when `tool.service` is enough.

**If you cannot:** review §1–§4 (concept and security), §8 (FastMCP), and [lab/enunciado.md](lab/enunciado.md). Run `solucion_scratch.py` and follow the trace line by line.

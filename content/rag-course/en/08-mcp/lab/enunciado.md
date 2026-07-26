# Lab M8 · PolicyRAG as MCP Server

## Business brief

You are an engineer at the airline from template `01-airline-flight-change`. The architecture team wants to **decouple** PolicyRAG from the ReAct agent: instead of the retriever living embedded in the graph (`tool.retriever` → `agent.react`), it must be exposed as an **independent MCP server** that any client can discover and consume — Cursor, Claude Desktop, another internal agent, or RAGorbit's `tool.mcp` node.

Additionally, financial actions (`apply_flight_change`) must go through a **permission-based approval gate** before execution, like `guardrail.confirm` in the template but at the MCP protocol level.

## Available data

In `lab/data/`:

| File | Content |
|---------|-----------|
| `policy.json` | Penalties by `fare_class` and `route_type` |
| `reservations.json` | Mock booking `SCL-BOG-001` (Ana García, ECONOMY_FLEX) |
| `permissions.json` | Permission scopes (`financial`, `read_policy`) |

## MCP server tools

| Tool | Type | What it does |
|------|------|----------|
| `policy_rag` | Read | Query penalties filtered by fare and route |
| `apply_flight_change` | **Sensitive** | Execute flight change and charge USD 130.00 |

## Task

### Part A — Mini MCP protocol from scratch (layer ②)

Implement `lab/solution_scratch.py` with:

1. **MCP server** (`MCPServer`) speaking JSON-RPC 2.0 over STDIO (one JSON line per message).
2. Methods: `initialize`, `tools/list`, `tools/call`, `permissions/respond`.
3. Tool `policy_rag` that reads `policy.json` (simplified RAG: deterministic lookup).
4. Tool `apply_flight_change` marked sensitive — the first call returns `permission_required` without executing the charge.
5. **MCP client** (`MCPStdioClient`) that launches the server as a subprocess and sends/receives JSON-RPC.
6. **Agent** (`PolicyRAGAgent`) deterministic that:
   - Performs handshake
   - Lists tools
   - Calls `policy_rag` for ECONOMY_FLEX international
   - Tries `apply_flight_change` → receives permission gate → approves → retries → success
7. Server mode: `python3 solution_scratch.py --server` (used internally by the subprocess).

### Part B — FastMCP (layer ③, guided task)

> **Read first:** [guide.md §8 — Layer ③ explained: FastMCP from scratch](../guide.md#8-layer--explained-fastmcp-from-scratch).

**Environment requirements** (outside the course machine):

```bash
pip install fastmcp
```

#### Step B.1 — Server with `@mcp.tool`, `@mcp.resource`, `@mcp.prompt`

1. Create `FastMCP("airline-policy-rag-mcp")`.
2. Decorate `policy_rag` and `apply_flight_change` with `@mcp.tool`.
3. Add `@mcp.resource("policy://{fare_class}/{route_type}")`.
4. Add `@mcp.prompt` for flight change analysis.

#### Step B.2 — STDIO client

1. Use FastMCP's `Client(server_script)`.
2. `await client.list_tools()` — discovery.
3. `await client.call_tool("policy_rag", {...})`.
4. Handle `permission_required` in `apply_flight_change`.

#### Step B.3 — HTTP client (optional)

1. `mcp.run(transport="streamable-http", port=8765)`.
2. `Client("http://127.0.0.1:8765/mcp")`.

#### Step B.4 — Compare with `solution_framework.py`

Open block by block (guide §8.8) and note differences.

## Staged hints

<details>
<summary>Hint 1 — JSON-RPC structure</summary>

Each message is one JSON line:

```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
```

Response:

```json
{"jsonrpc": "2.0", "id": 1, "result": {"tools": [...]}}
```
</details>

<details>
<summary>Hint 2 — STDIO subprocess</summary>

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
<summary>Hint 3 — Permission gate</summary>

In `tools/call`, if the tool is sensitive and there is no `_permission_token: "approved"`:

```python
return {"permission_required": True, "permission": {"id": "...", "scope": "financial", ...}}
```

The client calls `permissions/respond` with `decision: "approved"` and retries with the token.
</details>

<details>
<summary>Hint 4 — FastMCP @mcp.tool</summary>

The Python function docstring becomes the description the LLM sees — same as `@tool` in LangChain (M6 §8.3).
</details>

## Success criteria

Your `solution_scratch.py` must produce the output in [`expected.md`](expected.md) and pass all `assert` checks at the end.

## RAGorbit connection

In template `01-airline-flight-change`, you would replace:

```
tool.retriever "PolicyRAG" ──▶ agent.react
```

with:

```
tool.mcp "PolicyRAG MCP" ──▶ agent.react
```

The `tool.mcp` node connects to the MCP server via STDIO or HTTP and exposes discovered tools to the agent. See [`flow.json`](../../../examples/01-airline-flight-change/flow.json) and [`node-catalog.md`](../reference/node-catalog.md#toolmcp).

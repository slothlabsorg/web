# Lab M8 Solution — PolicyRAG as MCP Server

---

## Layer ② — From-scratch solution (`solucion_scratch.py`)

### Overall architecture

```
[main()] ──spawn──▶ [MCPServer on STDIO subprocess]
       │
       └──▶ [MCPStdioClient] ──▶ [PolicyRAGAgent.run()]
                    │
                    ├─ initialize (handshake)
                    ├─ tools/list (discovery)
                    ├─ tools/call → policy_rag
                    ├─ tools/call → apply_flight_change (blocked)
                    ├─ permissions/respond (approval)
                    └─ tools/call → apply_flight_change (success)
```

### Mini JSON-RPC protocol

Each message is one JSON line (newline-delimited). The server implements four methods:

| Method | Real MCP equivalent | Role in the lab |
|--------|---------------------|------------------|
| `initialize` | Handshake | Negotiate `protocolVersion` and capabilities |
| `tools/list` | Discovery | The agent learns which tools exist |
| `tools/call` | Execution | Invoke `policy_rag` or `apply_flight_change` |
| `permissions/respond` | Approval | Record user decision |

### Permission gate

The key logic is in `MCPServer._tools_call`:

```python
if name in SENSITIVE_TOOLS:
    if permission_token != "approved" or perm_id not in self.approved_permissions:
        return permission_required_response  # NO ejecuta el handler
# Solo llega aquí con permiso válido
result = TOOL_HANDLERS[name](**arguments)
```

The first call to `apply_flight_change` **never** reaches `TOOL_HANDLERS` — the charge does not occur until the second call with a token.

### Why subprocess STDIO

Using `subprocess.Popen` replicates the real MCP model (Cursor launches `python server.py` as a child). Client and server are isolated processes that communicate only via pipes — same as production with Claude Desktop.

---

## Layer ③ — FastMCP solution (`solucion_framework.py`)

### Scratch → FastMCP mapping

| Scratch | FastMCP |
|---------|---------|
| `MCPServer` + `serve_stdio()` | `FastMCP` + `mcp.run(transport="stdio")` |
| Manual `TOOL_DEFINITIONS` | Automatic `@mcp.tool` |
| `MCPStdioClient._send()` | `Client(server_script)` |
| No resources/prompts | `@mcp.resource`, `@mcp.prompt` |
| HTTP not implemented | `mcp.run(transport="streamable-http")` |

### What FastMCP does not do for you

- **Permissions:** you must implement `permission_required` inside the tool (same as in scratch).
- **Business logic:** read `politica.json`, validate PNR — that is your code.
- **Guardrails:** combine MCP permissions with `guardrail.confirm` in the RAGorbit graph.

### Run when you have pip

```bash
pip install fastmcp
python3 solucion_framework.py              # demo STDIO
python3 solucion_framework.py --server     # solo server (para Cursor)
python3 solucion_framework.py --http       # demo HTTP
```

---

## Connection with template 01

In `examples/01-airline-flight-change/flow.json`, the `policy_tool` node (`tool.retriever`) would be replaced by:

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

The `orchestrator` agent remains `agent.react` — only where the tools come from changes. The charge (`PaymentService`) could be another MCP server with scope `financial`, additionally wrapped by `guardrail.confirm` and `guardrail.idempotency`.

---

## Common mistakes

1. **Forgetting `initialize`** before `tools/list` → "Cliente no inicializado" error.
2. **Not calling `flush()`** after writing to subprocess stdin → the server never receives the message.
3. **Running sensitive tool without gate** → charges without user consent.
4. **Confusing resource with tool** → using `tools/call` to read a static file instead of `resources/read`.
5. **MCP server with root `/`** → data exfiltration vector.

# Lab M6 Solution — ReAct Agent with Memory

---

## Layer ② — From-scratch solution (`solucion_scratch.py`)

### Overall architecture

```
[Session.memory]  ← message list shared between turns
       ↓
[Session.chat(user_message)]
       ↓ appends message to memory
[react_loop(memory)]
       ↓ iterates MAX_STEPS=8 times
       ├─ [fake_llm(memory)]  → returns {"action":...} or {"final":...}
       │         ↓ if action
       │  [TOOLS[tool_name](**args)]  → executes the real tool
       │         ↓ result
       │  [memory.append(tool_result)]  → adds to history
       │         ↓ returns to start of loop
       └─ if final → returns text
```

### The deterministic fake LLM

The key to layer ② is `fake_llm`, which implements the reasoning logic without any real LLM. Its strategy is simple but effective:

1. **Inspects the history** to see which tools have already been called.
2. **Detects confirmation** (turn 2) by searching for keywords.
3. **Follows a sequential flow** based on what is missing:
   - Missing `get_reservation`? → call it.
   - Missing `get_policy`? → call it.
   - Have everything? → calculate and respond.

```python
def fake_llm(messages: list) -> dict:
    called = _tools_called(messages)
    is_confirm = any(w in last_user for w in CONFIRM_WORDS)

    if is_confirm:
        # Recover data from the previous turn in memory
        pnr = _find_in_memory(messages, "pnr")
        ...
        return {"final": f"Change confirmed for **{pnr}**..."}

    if "get_reservation" not in called:
        pnr = _extract_pnr(messages)
        return {"action": "get_reservation", "args": {"pnr": pnr}}

    if "get_policy" not in called:
        reservation = _tool_result(messages, "get_reservation")
        return {"action": "get_policy",
                "args": {"fare_class": reservation["fare_class"],
                         "route_type": reservation["route_type"]}}

    # Everything ready → calculate and respond
    ...
    return {"final": f"...Total: USD {total:.2f}..."}
```

### Memory as a message list

Memory is simply a list that grows with each turn:

```python
# Memory state after Turn 1 is complete:
[
  {"role": "system",    "content": "You are a flight change assistant..."},
  {"role": "user",      "content": "I want to change my flight SCL-BOG-001..."},
  {"role": "assistant", "content": "[tool_call: get_reservation({'pnr': 'SCL-BOG-001'})]"},
  {"role": "tool",      "name": "get_reservation",
                         "content": '{"pnr":"SCL-BOG-001","fare_class":"ECONOMY_FLEX",...}'},
  {"role": "assistant", "content": "[tool_call: get_policy(...)]"},
  {"role": "tool",      "name": "get_policy",
                         "content": '{"penalidad_usd":50,...}'},
  {"role": "assistant", "content": "I found your reservation SCL-BOG-001...Total: USD 130.00...\npnr:SCL-BOG-001\ntotal_usd:130.00"}
]
```

The persistence trick between turns: the **Turn 1 response includes state lines** (`pnr:...`, `total_usd:...`, `new_flight:...`) that `_find_in_memory` can recover on Turn 2. This minimally simulates agent state without a formal `TypedDict`.

On Turn 2:
1. The user message ("Yes, I confirm") is appended to the same list.
2. `fake_llm` detects confirmation and calls `_find_in_memory`.
3. It recovers PNR, flight, and total from the history.
4. It responds without calling any tool.

### Why PNR extraction works

```python
def _extract_pnr(messages: list) -> str:
    import re
    for m in messages:
        if m.get("role") == "user":
            match = re.search(r'\b([A-Z]{2,3}-[A-Z]{2,3}-\d{3})\b', m["content"])
            if match:
                return match.group(1)
    return ""
```

The regex `\b([A-Z]{2,3}-[A-Z]{2,3}-\d{3})\b` captures the airline's standard PNR format. If the user writes "SCL-BOG-001" anywhere in the message, it extracts it.

### Cost calculation

```python
candidate_flights = [
    v for v in FLIGHTS["vuelos_disponibles"]
    if v["origin"] == origin
    and v["destination"] == destination
    and (new_date in v["date"] if new_date else True)
    and v["available_seats"] > 0
    and reservation.get("fare_class") in v.get("fare_classes_available", [])
]

best_flight = min(candidate_flights, key=lambda v: v["price"])
differential = max(0.0, best_flight["price"] - base_price)
total = penalty + differential
# = 50 + (295 - 215) = 50 + 80 = 130
```

The `max(0.0, ...)` avoids a negative differential if the new flight is cheaper than the current one.

---

## Layer ③ — LangGraph solution (`solucion_framework.py`)

> **Before reading this section:** try writing `solucion_framework.py` yourself following [guia.md §8](../guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph) and [enunciado Part B](enunciado.md#part-b--agent-with-langgraph-layer--guided-task). This explanation confirms what you should have discovered.

### Key differences from layer ②

| Aspect | Scratch (②) | LangGraph (③) |
|---------|-------------|---------------|
| LLM | deterministic `fake_llm` | real Claude via API |
| Memory | manual list + `_find_in_memory` | automatic `MemorySaver` |
| Tool format | normal Python functions | decorated with `@tool` |
| Tool calling | manual dict parsing | LLM native JSON protocol |
| Loop | manual `while` | handled by `create_react_agent` |
| State between turns | `_find_in_memory` in text | checkpointer with `thread_id` |

### LangGraph's `create_react_agent`

```python
agent = create_react_agent(
    model=llm,          # any LangChain ChatModel
    tools=TOOLS,        # list of @tool
    prompt=system_prompt,
    checkpointer=checkpointer,  # MemorySaver for persistence
)
```

Internally, `create_react_agent` builds a `StateGraph` with:
- Node `agent`: the LLM with tools bound.
- Node `tools`: executes tool calls from the last message.
- Conditional edge: if there are tool calls → `tools`; if not → `END`.

### Memory with checkpointer

```python
config = {"configurable": {"thread_id": "demo-001"}}
# Turn 1:
agent.invoke({"messages": [HumanMessage("Change flight...")]}, config=config)
# Turn 2 — automatically recovers Turn 1 state:
agent.invoke({"messages": [HumanMessage("Yes, I confirm.")]}, config=config)
```

The `thread_id` identifies the session. LangGraph serializes the full state (message history, graph state) in `MemorySaver` (in memory) or in a persistent backend (SQLite, Postgres).

### Tool descriptions matter a lot

```python
@tool
def get_reservation(pnr: str) -> dict:
    """
    Gets the complete itinerary of a reservation given its PNR.
    Use it when the passenger provides their reservation number (PNR).
    ...
    """
```

The docstring **is the description the LLM receives**. Claude reads "Use it when the passenger provides their reservation number" and learns when to call it. A poor description leads to tools being used incorrectly.

### Block-by-block walkthrough

For the full line-by-line map, see guide §8.8. Summary:

| Block in `solucion_framework.py` | Scratch equivalent |
|-----------------------------------|---------------------|
| `@tool` + `TOOLS = [...]` | `TOOLS = {"name": fn}` |
| `build_agent()` + `create_react_agent` | `react_loop` + `fake_llm` + `while` |
| `config` with `thread_id` | `Session` with shared `memory` |
| `agent.invoke({"messages": [...]})` | `chat(session, message)` |
| Commented `StateGraph` section | `while` loop split into `agent`↔`tools` nodes |

### Explicit StateGraph (commented section)

The alternative at the end of the file decomposes the ReAct loop into visible nodes. See guide §8.7 for full anatomy. If you uncomment it, you also need `llm_with_tools = llm.bind_tools(TOOLS)` so the `agent` node emits `tool_calls`.

## Workshop lessons

1. **The ReAct loop is simple:** a `while` with an LLM that decides and tools that execute. Complexity appears in the LLM logic, not the framework.

2. **Conversational memory is a list:** passing the full history to the LLM on each call is the simplest and most effective implementation for short conversations (<50 messages). For long contexts, you need summarization or semantic retrieval.

3. **State between turns requires explicit design:** in scratch we embed data in the response text; in LangGraph the checkpointer handles it automatically. In production, always use a checkpointer.

4. **The fake_llm teaches the logic:** by implementing the LLM by hand, you understand exactly what decisions it makes at each step. This helps debug real agents when the LLM misbehaves.

5. **Tools are the interface to the real world:** their definition (name, description, schema) is as important as their implementation. A confusing name or incomplete description makes the LLM use them incorrectly.

---

## Connection with RAGorbit

The scratch agent from this workshop corresponds exactly to this RAGorbit subgraph:

```
model.llm ──(Model)──▶┐
                      │
io.input ──(Message)──▶ agent.react ──(Message)──▶ io.output
                      │  ↑ (loop)
tool.service "get_reservation" ──(Tool)──▶┘
tool.service "get_policy" ──(Tool)──▶┘
```

The difference from template 01 (airline) is that it adds:
- `tool.service "InventoryService"` and `"PricingService"` (which we calculate locally here).
- `tool.retriever "PolicyRAG"` (which we simulate here with `get_policy`).
- `guardrail.confirm` + `guardrail.idempotency` + `guardrail.resilience` on payment.
- `observability.audit` for Kafka traceability.

The principles of the ReAct loop and memory are identical.

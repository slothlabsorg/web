# Lab M6 Solution — ReAct Agent with Memory

---

## Layer ② — From-scratch solution (`solucion_scratch.py`)

### Overall architecture

```
[Session.memory]  ← message list shared between turns
       ↓
[Session.chat(mensaje_usuario)]
       ↓ agrega mensaje a memoria
[react_loop(memory)]
       ↓ itera MAX_STEPS=8 veces
       ├─ [fake_llm(memory)]  → devuelve {"action":...} o {"final":...}
       │         ↓ si action
       │  [TOOLS[tool_name](**args)]  → ejecuta la tool real
       │         ↓ resultado
       │  [memory.append(tool_result)]  → agrega a historial
       │         ↓ vuelve al inicio del loop
       └─ si final → devuelve texto
```

### The deterministic fake LLM

The key to layer ② is `fake_llm`, which implements the reasoning logic without any real LLM. Its strategy is simple but effective:

1. **Inspects the history** to see which tools have already been called.
2. **Detects confirmation** (turn 2) by searching for keywords.
3. **Follows a sequential flow** based on what is missing:
   - Missing `consultar_reserva`? → call it.
   - Missing `consultar_politica`? → call it.
   - Have everything? → calculate and respond.

```python
def fake_llm(messages: list) -> dict:
    called = _tools_called(messages)
    is_confirm = any(w in last_user for w in CONFIRM_WORDS)

    if is_confirm:
        # Recuperar datos del turno anterior de la memoria
        pnr = _find_in_memory(messages, "pnr")
        ...
        return {"final": f"Cambio confirmado para **{pnr}**..."}

    if "consultar_reserva" not in called:
        pnr = _extract_pnr(messages)
        return {"action": "consultar_reserva", "args": {"pnr": pnr}}

    if "consultar_politica" not in called:
        reserva = _tool_result(messages, "consultar_reserva")
        return {"action": "consultar_politica",
                "args": {"fare_class": reserva["fare_class"],
                         "route_type": reserva["route_type"]}}

    # Todo listo → calcular y responder
    ...
    return {"final": f"...Total: USD {total:.2f}..."}
```

### Memory as a message list

Memory is simply a list that grows with each turn:

```python
# Estado de la memoria después del Turno 1 completo:
[
  {"role": "system",    "content": "Eres asistente de cambio de vuelo..."},
  {"role": "user",      "content": "Quiero cambiar mi vuelo SCL-BOG-001..."},
  {"role": "assistant", "content": "[tool_call: consultar_reserva({'pnr': 'SCL-BOG-001'})]"},
  {"role": "tool",      "name": "consultar_reserva",
                         "content": '{"pnr":"SCL-BOG-001","fare_class":"ECONOMY_FLEX",...}'},
  {"role": "assistant", "content": "[tool_call: consultar_politica(...)]"},
  {"role": "tool",      "name": "consultar_politica",
                         "content": '{"penalidad_usd":50,...}'},
  {"role": "assistant", "content": "Encontré tu reserva SCL-BOG-001...Total: USD 130.00...\npnr:SCL-BOG-001\ntotal_usd:130.00"}
]
```

The persistence trick between turns: the **Turn 1 response includes state lines** (`pnr:...`, `total_usd:...`, `vuelo_nuevo:...`) that `_find_in_memory` can recover on Turn 2. This minimally simulates agent state without a formal `TypedDict`.

On Turn 2:
1. The user message ("Sí, confirmo") is appended to the same list.
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
vuelos_candidatos = [
    v for v in VUELOS["vuelos_disponibles"]
    if v["origin"] == origen
    and v["destination"] == destino
    and (fecha_nueva in v["date"] if fecha_nueva else True)
    and v["available_seats"] > 0
    and reserva.get("fare_class") in v.get("fare_classes_available", [])
]

mejor_vuelo = min(vuelos_candidatos, key=lambda v: v["price"])
diferencial = max(0.0, mejor_vuelo["price"] - precio_base)
total = penalidad + diferencial
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
    model=llm,          # cualquier ChatModel de LangChain
    tools=TOOLS,        # lista de @tool
    prompt=system_prompt,
    checkpointer=checkpointer,  # MemorySaver para persistencia
)
```

Internally, `create_react_agent` builds a `StateGraph` with:
- Node `agent`: the LLM with tools bound.
- Node `tools`: executes tool calls from the last message.
- Conditional edge: if there are tool calls → `tools`; if not → `END`.

### Memory with checkpointer

```python
config = {"configurable": {"thread_id": "demo-001"}}
# Turno 1:
agent.invoke({"messages": [HumanMessage("Cambiar vuelo...")]}, config=config)
# Turno 2 — recupera automáticamente el estado del Turno 1:
agent.invoke({"messages": [HumanMessage("Sí, confirmo.")]}, config=config)
```

The `thread_id` identifies the session. LangGraph serializes the full state (message history, graph state) in `MemorySaver` (in memory) or in a persistent backend (SQLite, Postgres).

### Tool descriptions matter a lot

```python
@tool
def consultar_reserva(pnr: str) -> dict:
    """
    Obtiene el itinerario completo de una reserva dado su PNR.
    Úsala cuando el pasajero proporcione su número de reserva (PNR).
    ...
    """
```

The docstring **is the description the LLM receives**. Claude reads "Úsala cuando el pasajero proporcione su número de reserva" and learns when to call it. A poor description leads to tools being used incorrectly.

### Block-by-block walkthrough

For the full line-by-line map, see guide §8.8. Summary:

| Block in `solucion_framework.py` | Scratch equivalent |
|-----------------------------------|---------------------|
| `@tool` + `TOOLS = [...]` | `TOOLS = {"nombre": fn}` |
| `build_agent()` + `create_react_agent` | `react_loop` + `fake_llm` + `while` |
| `config` with `thread_id` | `Session` with shared `memory` |
| `agent.invoke({"messages": [...]})` | `chat(session, mensaje)` |
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
tool.service "consultar_reserva" ──(Tool)──▶┘
tool.service "consultar_politica" ──(Tool)──▶┘
```

The difference from template 01 (airline) is that it adds:
- `tool.service "InventoryService"` and `"PricingService"` (which we calculate locally here).
- `tool.retriever "PolicyRAG"` (which we simulate here with `consultar_politica`).
- `guardrail.confirm` + `guardrail.idempotency` + `guardrail.resilience` on payment.
- `observability.audit` for Kafka traceability.

The principles of the ReAct loop and memory are identical.

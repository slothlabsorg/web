# Lab M6 · ReAct Agent with Memory — Flight Change

## Business brief

You are an engineer at a regional airline. The customer experience team wants a prototype of the conversational agent that will handle flight changes. The system must:

1. Receive the passenger's message.
2. Reason about what information it needs (itinerary, fare policy, change price).
3. Call the necessary tools in the correct order.
4. Respond to the passenger with a detailed breakdown of the change cost.
5. On a second turn, when the passenger confirms, **remember the context** from the previous turn (PNR, chosen flight, total cost) without calling all the tools again.

## Available data

In `lab/datos/` you will find:
- `reservas.json` — mock reservation database by PNR.
- `politica.json` — change penalties by fare class.
- `vuelos.json` — available flight inventory with prices.

## The two mock tools

| Tool | What it does | Arguments |
|------|----------|------------|
| `get_reservation(pnr)` | Returns the passenger's itinerary | `pnr: str` |
| `get_policy(fare_class, route_type)` | Returns the change penalty | `fare_class: str`, `route_type: str` |

> **Note:** The lab does not include separate `InventoryService` or `PricingService` — the new flight price comes from the `price` field in `vuelos.json` and the differential is calculated locally. The agent has direct access to flight data (a simplification for the workshop).

## Task

### Part A — Agent from scratch (layer ②)

Implement `lab/solucion_scratch.py` with:

1. A **deterministic fake LLM** (`fake_llm`) that, given the message history, decides the next action. It must be fully deterministic (no `random`, no network calls).

2. The tools `get_reservation` and `get_policy` as Python functions that read the JSON files from `datos/`.

3. The **ReAct loop**: a `while` that iterates until the LLM emits a final response or `MAX_STEPS = 8` is reached.

4. **Conversational memory**: a message list passed in full to the LLM on each iteration and kept between turns.

5. A `chat(session, user_message) -> str` function that:
   - Appends the user message to the session memory.
   - Runs the ReAct loop.
   - Appends the final response to memory.
   - Returns the response.

6. An `if __name__ == "__main__":` block that simulates a two-turn conversation:
   - **Turn 1:** the passenger asks to change flight with PNR `SCL-BOG-001` from the 15th to the 17th of June.
   - **Turn 2:** the passenger confirms ("Yes, I confirm the change.").

### Part B — Agent with LangGraph (layer ③, guided task)

> **Read first:** [guia.md §8 — Layer ③ Explained: LangGraph from Scratch](guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph). That section teaches each API you need. Do not copy `solucion_framework.py` wholesale — write it yourself following the hints.

**Goal:** reimplement the same agent from scratch using LangGraph + LangChain, with memory across two turns. When done, compare your file with `lab/solucion_framework.py`.

**Environment requirements** (outside the course machine):

```bash
pip install langgraph langchain langchain-anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### Step B.1 — Tools with `@tool`

1. Copy data loading from your scratch solution (or from `solucion_scratch.py`).
2. Convert `get_reservation` and `get_policy` into tools decorated with `@tool` from `langchain_core.tools`.
3. Write **rich docstrings**: they must tell the LLM **when** to use each tool (see §8.3 of the guide).
4. Create `TOOLS = [get_reservation, get_policy]`.

**Check:** can you invoke `get_reservation.invoke({"pnr": "SCL-BOG-001"})` and get the same dict as in scratch?

#### Step B.2 — `build_agent()` with `create_react_agent`

1. Instantiate `ChatAnthropic` (remember M1 §11.9).
2. Create `checkpointer = MemorySaver()`.
3. Write a `system_prompt` that guides the flow: reservation → policy → calculation → confirmation (as in scratch).
4. Call `create_react_agent(model=..., tools=TOOLS, prompt=..., checkpointer=...)`.

**Hint:** `create_react_agent` is your `react_loop` + `while` packaged. See the bridge table in guide §8.2.

#### Step B.3 — Two turns with `thread_id`

1. Define `config = {"configurable": {"thread_id": "demo-001"}}`.
2. **Turn 1:** `agent.invoke({"messages": [HumanMessage(content=turn1)]}, config=config)`.
3. **Turn 2:** same `config`, new `HumanMessage("Yes, I confirm the change.")`.
4. Print `result["messages"][-1].content` on each turn.

**Check:** on Turn 2, does the agent mention the PNR and USD 130 without calling `get_reservation` again?

#### Step B.4 — Compare with the solution

Open `lab/solucion_framework.py` block by block (guide §8.8). Note differences in docstrings, prompt, or structure.

#### Optional challenge — explicit `StateGraph`

If you have mastered the previous steps, uncomment and complete the section at the end of `solucion_framework.py`:

1. Define `FlightChangeState` with `Annotated[list, add_messages]`.
2. Implement `node_call_tools` and `should_continue`.
3. Build the graph: `agent → (conditional) → tools → agent → END`.
4. Compile with `checkpointer=MemorySaver()`.

**Closing question:** which line of your scratch `while` corresponds to each graph edge? (guide §8.7.4)

> This part is illustrative in the course environment (no pip/network). Write it even if you cannot run it here.

## Test scenario

**Passenger data:**
- PNR: `SCL-BOG-001`
- Passenger: Ana García
- Current flight: LA501 — SCL→BOG — 15 June 2026
- Fare class: `ECONOMY_FLEX`

**Available flights on 17 June:**
- FL301 — departure 08:30 — base price $320
- FL305 — departure 14:45 — base price $295

**ECONOMY_FLEX international policy:**
- Change penalty: $50

**Expected calculation:**
- The current flight had base price $215 (see `reservas.json`).
- The passenger chooses FL305 (cheaper than FL301).
- Differential: $295 - $215 = $80.
- Penalty: $50.
- **Total: $130**.

## Tiered hints

### Hint 1 — Structure of fake_llm

```python
def fake_llm(messages: list) -> dict:
    """
    Deterministic fake LLM. Reads the last message to decide what to do.
    Returns:
      {"action": "tool_name", "args": {...}}  — if it needs to call a tool
      {"final": "response text"}              — if it has all the info
    """
    # Inspect the history to see what has already been done
    tool_calls_done = [m["name"] for m in messages if m.get("role") == "tool"]
    last_user = next((m["content"] for m in reversed(messages)
                      if m["role"] == "user"), "")
    ...
```

### Hint 2 — ReAct loop structure

```python
def react_loop(memory: list) -> str:
    for step in range(MAX_STEPS):
        response = fake_llm(memory)
        if "final" in response:
            return response["final"]
        # execute tool and add to memory...
    return "Reached the step limit."
```

### Hint 3 — Confirmation detection on turn 2

The second turn must detect that the user confirmed and, instead of repeating all tool calls, use the state already stored in memory to perform the change action and respond.

```python
CONFIRM_WORDS = ("yes", "yeah", "confirm", "accept", "agreed")
is_confirm = any(w in last_user.lower() for w in CONFIRM_WORDS)
```

### Hint 4 — How to calculate the differential

```python
# The current flight has a base price stored in reservas.json
# The new flight's price is in vuelos.json
# differential = new_price - current_base_price
# total = penalty + differential
```

## Acceptance criteria

1. `python3 -m py_compile lab/solucion_scratch.py` produces no errors.
2. `python3 lab/solucion_scratch.py` prints the tool call sequence and the Turn 1 final response.
3. Turn 2 prints that it remembers the context (mentions the PNR and $130 cost) without calling `get_reservation` again.
4. The Turn 1 response mentions the total cost of **$130** (penalty $50 + differential $80).
5. Stdlib only: no imports of `langchain`, `openai`, `anthropic`, `requests`, or similar.

# Agents without LangGraph — the same flight-change assistant with competing technologies

> **Who this document is for:** you already completed layer ② of the M6 workshop (`06-agentes-i/lab/solucion_scratch.py`): hand-rolled ReAct loop, tool registry, conversational memory. You also saw LangGraph in M6 §8 and, if you reached M7, multi-agent frameworks in §9. Here we **do not repeat LangGraph** — we use it as the baseline and build the **same flight-change agent** (template 01 · airline, M6 workshop) with the alternatives the market offers in 2025–2026.
>
> **Fixed case across all approaches:** passenger with PNR `SCL-BOG-001` asks to change from June 15 to June 17; the agent calls `consultar_reserva` and `consultar_politica`, calculates **USD 130** (penalty USD 50 + differential USD 80), asks for confirmation, and **only on turn 2** confirms the charge. Two tools, memory between turns, confirmation before acting.
>
> **Environment:** on the course machine there is no `pip` or network. All code in this document is **illustrative** — run it when you have the dependencies and an API key. Required header: `# Requiere: pip install ...`.

---

## Introduction — why learn agents without LangGraph

LangGraph is the production framework of the course and RAGorbit: explicit graphs, checkpoints, guardrails as conditional edges. But a complete AI engineer must be able to **name and write** the same ReAct pattern with other tools — not just copy `create_react_agent`.

Concrete reasons to master the alternatives:

1. **Lower dependency** — an 80-line script with the Anthropic or OpenAI SDK may be all you need; no LangChain on top.
2. **Heterogeneous teams** — your company may standardize on CrewAI (declarative roles), Pydantic-AI (strict typing), or AG2 (conversational exploration).
3. **Interviews and design** — "why not AutoGen for payments?" requires comparing mental models, not memorizing one API.
4. **The mechanism does not change** — in all frameworks the same thing happens as in your scratch: the LLM reasons → chooses a tool → you observe the result → repeat until final response.

### Universal bridge table — layer ② → each framework

This table extends the one from M6 §8.8.2 to **all** technologies in this document. It is your mental map before reading each section.

| What you did by hand (layer ②) | Native loop (SDK) | LangGraph (M6 §8) | CrewAI | AutoGen / AG2 | Pydantic-AI |
|--------------------------------|-------------------|-------------------|--------|---------------|-------------|
| `TOOLS = {"consultar_reserva": fn, ...}` | List of JSON Schema dicts + `IMPLEMENTACIONES` dict | List of LangChain `@tool` | CrewAI `@tool` or functions in `Agent.tools` | `register_function` caller + executor | `@agent.tool` / `@agent.tool_plain` |
| Docstring + type hints → schema | `input_schema` on each tool (Anthropic) or `parameters` (OpenAI) | Docstring → automatic schema | Description in `@tool` or in `register_function` | `description` in `register_function` | Docstring + hints → Pydantic schema |
| `fake_llm(memory)` | `client.messages.create(...)` / `chat.completions.create(...)` | `ChatAnthropic.invoke` | LLM of `Agent` (e.g. `ChatAnthropic`) | `ConversableAgent` + `llm_config` | `Agent(model='anthropic:...')` |
| `while step < MAX_STEPS:` | `while response.stop_reason == "tool_use":` | `create_react_agent` or `StateGraph` | `Crew.kickoff` / chained tasks | `initiate_chat` / `GroupChat` | Internal loop of `Agent.run_sync` |
| `memory.append({"role": "tool", ...})` | Message `role: "user"` with `tool_result` (Anthropic) or `role: "tool"` (OpenAI) | Automatic `ToolMessage` | Task output → next task `context` | Executor response to caller | History in `result.all_messages()` |
| `session.memory` between turns | Same `messages` list reused | `MemorySaver` + `thread_id` | Crew memory / task history | Chat history between agents | `message_history` in `run_sync` |
| `_find_in_memory(messages, "pnr")` | LLM reads full history | Checkpointer restores state | `context=[previous_task]` | Messages accumulated in chat | `RunContext` + typed deps |
| Confirmation before charging | Instruction in system prompt + logic in your code | Conditional edge or prompt | `expected_output` + Task instructions | `human_input_mode` on UserProxy | `result_type` + Pydantic validators |

**Shared mental model:** the framework (or your `while`) implements the provider's **tool calling protocol**. You define what each tool does; the LLM decides when to call it.

---

## 1. Native loop with the provider SDK (no framework)

### 1.1 Do you need an agent framework?

**Short answer:** no, if you have **one agent**, **few tools** (2–5), **memory = message list**, and want **maximum control with minimum dependency**.

A framework adds value when you need:

- Durable checkpoints (Postgres, SQLite) across restarts
- Graphs with explicit conditional branches (HITL, fan-out)
- Standard integration with 15+ providers without rewriting the loop
- Plug-and-play observability (LangSmith, etc.)

For the M6 workshop — an airline chat with two tools — the native SDK **is enough**. It is layer ③ closest to your scratch: you are still the framework, but the LLM is real.

### 1.2 Bridge table — scratch → native SDK

| Scratch (`solucion_scratch.py`) | Native SDK |
|-----------------------------------|------------|
| `TOOLS[name](**args)` | Python function + entry in `IMPLEMENTACIONES` |
| `fake_llm` returns `{"action": ..., "args": ...}` | Model returns `tool_use` blocks (Anthropic) or `tool_calls` (OpenAI) |
| `memory.append({"role": "tool", "content": ...})` | You return `tool_result` to the model in the next request |
| `react_loop(memory)` | `while` that only ends when there are no more tool calls |
| `Session.memory` | Same `messages` list between `chat()` |

### 1.3 Tool-calling with Anthropic — APIs piece by piece

#### Define tools as JSON Schema

Anthropic expects a `tools` array with `name`, `description`, and `input_schema` (JSON Schema):

```python
TOOLS_SCHEMA = [
    {
        "name": "consultar_reserva",
        "description": (
            "Gets the itinerary of a reservation. "
            "Use it when the passenger provides their PNR (format XXX-XXX-NNN)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pnr": {
                    "type": "string",
                    "description": "Reservation number, e.g.: SCL-BOG-001",
                }
            },
            "required": ["pnr"],
        },
    },
    {
        "name": "consultar_politica",
        "description": (
            "Returns penalty and change conditions. "
            "Use it AFTER consultar_reserva, with fare_class and route_type from the itinerary."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "fare_class": {"type": "string"},
                "route_type": {"type": "string", "enum": ["nacional", "internacional"]},
            },
            "required": ["fare_class", "route_type"],
        },
    },
]
```

Equivalent to your manual registry `TOOLS = {...}` plus the metadata you previously put in docstrings.

#### The manual loop — reason → act → observe

```python
# Fragment of the pattern (not the full file)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=SYSTEM_PROMPT,
    tools=TOOLS_SCHEMA,
    messages=messages,  # accumulated history
)

while response.stop_reason == "tool_use":
    # 1. Extract tool_use blocks from response.content
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            fn = IMPLEMENTACIONES[block.name]
            result = fn(**block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False),
            })
    # 2. Add assistant response + results to history
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})
    # 3. Call the model again
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=TOOLS_SCHEMA,
        messages=messages,
    )
# response.stop_reason == "end_turn" → texto final en content
```

**Key difference from OpenAI:** in the Chat Completions API, results go in `role: "tool"` messages with `tool_call_id`, not in a `tool_result` block inside a `user` message. The loop is the same; the message format changes.

#### Memory = message list

There is no `MemorySaver`: you reuse the same `messages` list between user turns. Exactly equivalent to scratch `Session`.

### 1.4 Commented mini-implementation — flight change case

```python
# Requiere: pip install anthropic
"""
Flight change agent — native Anthropic loop (without LangChain/LangGraph).
Same case as 06-agentes-i/lab/solucion_scratch.py and solucion_framework.py.
"""

import json
import os
from pathlib import Path

import anthropic

# --- Mock data (same datos/ folder from M6 lab) ---
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"  # copy or symlink to 06-agentes-i/lab/datos/

RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))

# --- Tool implementations (layer ②: pure functions) ---

def consultar_reserva(pnr: str) -> dict:
    return RESERVAS.get(pnr, {"error": f"No reservation found with PNR {pnr!r}"})


def consultar_politica(fare_class: str, route_type: str) -> dict:
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            return regla
    return {"error": f"No policy for {fare_class!r} / {route_type!r}"}


IMPLEMENTACIONES = {
    "consultar_reserva": consultar_reserva,
    "consultar_politica": consultar_politica,
}

TOOLS_SCHEMA = [
    {
        "name": "consultar_reserva",
        "description": "Gets itinerary given the passenger's PNR.",
        "input_schema": {
            "type": "object",
            "properties": {"pnr": {"type": "string"}},
            "required": ["pnr"],
        },
    },
    {
        "name": "consultar_politica",
        "description": "Change penalty based on fare_class and route_type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fare_class": {"type": "string"},
                "route_type": {"type": "string"},
            },
            "required": ["fare_class", "route_type"],
        },
    },
]

SYSTEM_PROMPT = """You are a flight change assistant.
Flow: (1) consultar_reserva with the PNR, (2) consultar_politica with fare_class and route_type,
(3) calculate total = penalty + max(0, new_price - base_price). Cheapest alternative flight
on the same route for June 17, 2026: LA503 at USD 295 (assume this data
if you have no other source). (4) Present breakdown and ask for confirmation. (5) If the passenger
confirms in a subsequent message, confirm the change without calling the tools again."""

MAX_STEPS = 8


def _texto_final(content) -> str:
    """Extracts text from text blocks of the last response."""
    partes = []
    for block in content:
        if hasattr(block, "text"):
            partes.append(block.text)
        elif isinstance(block, dict) and block.get("type") == "text":
            partes.append(block["text"])
    return "\n".join(partes)


def react_loop_nativo(client: anthropic.Anthropic, messages: list) -> str:
    """
    ReAct loop — direct equivalent to react_loop() from scratch.
    Modifies messages in-place (memory between steps and between turns).
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=TOOLS_SCHEMA,
        messages=messages,
    )

    for step in range(MAX_STEPS):
        if response.stop_reason != "tool_use":
            texto = _texto_final(response.content)
            messages.append({"role": "assistant", "content": response.content})
            return texto

        # --- Act: execute each tool_use ---
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            fn = IMPLEMENTACIONES.get(block.name)
            if not fn:
                result = {"error": f"Unknown tool: {block.name}"}
            else:
                result = fn(**block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False),
            })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=messages,
        )

    return "Reached the step limit without being able to respond."


class Session:
    """Conversational memory — same idea as Session from scratch."""

    def __init__(self, client: anthropic.Anthropic):
        self.client = client
        self.messages: list = []

    def chat(self, user_message: str) -> str:
        self.messages.append({"role": "user", "content": user_message})
        return react_loop_nativo(self.client, self.messages)


def main():
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    session = Session(client)

    print(">>> TURN 1")
    r1 = session.chat(
        "I want to change my flight SCL-BOG-001 from June 15 to June 17."
    )
    print(r1)

    print("\n>>> TURN 2")
    r2 = session.chat("Yes, I confirm the change.")
    print(r2)


if __name__ == "__main__":
    main()
```

### 1.5 Block-by-block walkthrough

| Block | Scratch equivalent |
|--------|---------------------|
| `IMPLEMENTACIONES` + `TOOLS_SCHEMA` | `TOOLS` dict + docstrings |
| `react_loop_nativo` | `react_loop` |
| `while response.stop_reason == "tool_use"` | `while step < MAX_STEPS` without `"final"` |
| `tool_results` with `tool_use_id` | `memory.append({"role": "tool", ...})` |
| `Session.messages` | `Session.memory` |
| `SYSTEM_PROMPT` with mandatory flow | `Session.SYSTEM` |

### 1.6 When to use / when NOT to

| Use native loop | Avoid it if |
|-----------------|------------|
| 1 agent, 2–5 tools, one LLM provider | You need fan-out of thousands of events (template 10) |
| You want to debug each HTTP request/response | You require subgraphs, HITL as edges, Postgres checkpoints |
| Small project, few dependencies | The team already invested in LangGraph + LangSmith |
| Prototype before choosing a framework | You change provider every week without an abstraction layer |

**Gotchas:**

1. **Different message format per provider** — migrating from Anthropic to OpenAI means rewriting the message loop; LangChain abstracts that.
2. **No disk checkpoint** — if the process dies, you lose the session (like `MemorySaver` in RAM).
3. **The LLM may repeat tools** — in scratch you avoided it with `called = _tools_called(messages)`; here you depend on the prompt or add logic in your loop.
4. **SDK version** — Anthropic SDK ≥ 0.40 uses typed objects in `response.content`; older examples with plain dicts still work with `.model_dump()`.

---

## 2. CrewAI — teams by roles

### 2.1 What CrewAI is and why it exists

CrewAI models a **work team**: each member has `role`, `goal`, and `backstory` (fixed persona). `Task`s chain the work; `Crew` with `Process.sequential` or `Process.hierarchical` defines the order.

**Difference from LangGraph:** CrewAI is **declarative by roles** ("analyst", "calculator"); LangGraph is **declarative by graph** (nodes and edges). **Difference from M7:** in M7 §9 you already saw CrewAI applied to **logistics** (classifier → researcher → executor). Here we apply CrewAI to the **same airline case** from M6, with a different split: specialization by rebooking subtask, not event fan-out.

### 2.2 Bridge table — scratch → CrewAI (flight case)

| Scratch | CrewAI (this document) |
|---------|-------------------------|
| One `fake_llm` that does everything | Two agents: itinerary analyst + cost calculator |
| Implicit sequence in the loop | `Process.sequential`: task 1 → task 2 |
| `consultar_reserva` + `consultar_politica` | Analyst agent tools |
| Price calculation in the LLM | Calculator task with analyst context |
| Two turns with `Session.memory` | Turn 2 = new `kickoff` with memory via `context` or input with history |

### 2.3 APIs piece by piece

#### CrewAI `@tool`

Since CrewAI 0.7x+, the `@tool` decorator is recommended (previously `@tool` lived only in LangChain):

```python
from crewai.tools import tool

@tool("consultar_reserva")
def consultar_reserva(pnr: str) -> dict:
    """Gets the complete itinerary given the PNR."""
    ...
```

CrewAI also accepts LangChain tools (`langchain_core.tools.tool`) — as in `07-agentes-ii/lab/solucion_framework.py`.

#### `Agent` — role / goal / backstory

```python
from crewai import Agent

analista = Agent(
    role="Itinerary analyst",
    goal="Get the passenger's reservation and change policy",
    backstory="Specialist in PNR and international fare rules.",
    tools=[consultar_reserva, consultar_politica],
    llm=llm,
    verbose=True,
)
```

`role` + `goal` + `backstory` ≈ scratch `SYSTEM`, but **specialized** per agent.

#### `Task` — description + chained context

```python
from crewai import Task

task_itinerario = Task(
    description=(
        "The passenger says: '{solicitud}'. "
        "Use consultar_reserva with the PNR and consultar_politica with fare_class and route_type. "
        "Return JSON with pnr, passenger, fare_class, penalidad_usd, cambio_permitido."
    ),
    expected_output="JSON with reservation and policy data",
    agent=analista,
)

task_costos = Task(
    description=(
        "With the itinerary and policy from context, calculate the change to June 17, 2026. "
        "Flight LA503 at USD 295. base_price from JSON. "
        "total = penalty + max(0, 295 - base_price). "
        "Present breakdown and ask if they confirm. Do NOT charge without confirmation."
    ),
    expected_output="Proposal with USD breakdown and confirmation question",
    agent=calculador,
    context=[task_itinerario],  # recibe output de la task anterior
)
```

`context=[task_itinerario]` ≈ passing the `consultar_reserva` result to the next scratch step.

#### `Crew` and `Process`

```python
from crewai import Crew, Process

crew = Crew(
    agents=[analista, calculador],
    tasks=[task_itinerario, task_costos],
    process=Process.sequential,
    verbose=True,
)

resultado = crew.kickoff(inputs={"solicitud": "Change SCL-BOG-001 from June 15 to June 17"})
```

- `Process.sequential` — A finishes → B starts (fixed pipeline).
- `Process.hierarchical` — a "manager" agent delegates (useful if you add a compliance reviewer).

### 2.4 Case mini-crew — analyst + calculator

```python
# Requiere: pip install crewai langchain-anthropic
"""
Flight change with CrewAI — two roles, Process.sequential.
Complements M6 (single agent) and M7 §9 (CrewAI logistics, not duplicated here).
"""

import json
import os
from pathlib import Path

from crewai import Agent, Crew, Process, Task
from crewai.tools import tool
from langchain_anthropic import ChatAnthropic

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


@tool("consultar_reserva")
def consultar_reserva(pnr: str) -> dict:
    """Gets itinerary given the PNR (format XXX-XXX-NNN)."""
    return RESERVAS.get(pnr, {"error": f"PNR not found: {pnr}"})


@tool("consultar_politica")
def consultar_politica(fare_class: str, route_type: str) -> dict:
    """Penalty and change conditions for fare_class and route_type."""
    for r in POLITICA["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return r
    return {"error": "Policy not found"}


def build_crew():
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=0.1,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )

    analista = Agent(
        role="Itinerary analyst",
        goal="Retrieve reservation and change policy",
        backstory="Expert in PNR and LATAM fares.",
        tools=[consultar_reserva, consultar_politica],
        llm=llm,
    )

    calculador = Agent(
        role="Cost calculator",
        goal="Calculate rebooking total and ask for confirmation",
        backstory="Never charges without explicit passenger confirmation.",
        llm=llm,
    )

    t1 = Task(
        description="Passenger request: '{solicitud}'. Call the necessary tools.",
        expected_output="JSON: pnr, passenger, fare_class, base_price, penalidad_usd",
        agent=analista,
    )

    t2 = Task(
        description=(
            "Calculate change to 17-Jun-2026 with flight LA503 (USD 295). "
            "total = penalty + max(0, 295 - base_price). Breakdown and ask for confirmation."
        ),
        expected_output="Proposal with USD total and confirmation question",
        agent=calculador,
        context=[t1],
    )

    return Crew(
        agents=[analista, calculador],
        tasks=[t1, t2],
        process=Process.sequential,
        verbose=True,
    )


def main():
    crew = build_crew()

    # Turn 1 — quote
    r1 = crew.kickoff(inputs={
        "solicitud": "I want to change my flight SCL-BOG-001 from June 15 to June 17."
    })
    print("TURN 1:", r1)

    # Turn 2 — confirmation (new kickoff with history in the input)
    r2 = crew.kickoff(inputs={
        "solicitud": (
            "The passenger confirms the change. Previous context: " + str(r1) +
            ". Respond with confirmation of USD 130 charge and new flight LA503."
        )
    })
    print("TURN 2:", r2)


if __name__ == "__main__":
    main()
```

### 2.5 Block-by-block walkthrough

| Fragment | Role |
|-----------|-----|
| `@tool` consultar_* | Same interface as M6; shareable with LangGraph |
| `Agent` analista | Replaces the "call tools" phase of `fake_llm` |
| `Agent` calculador | Replaces the "calculate total and format" phase |
| `context=[t1]` | Chains observations like `memory.append` |
| Second `kickoff` | Simulates turn 2; in production you would use crew memory or structured input |

### 2.6 When to use / when NOT to

| Use CrewAI | Avoid it if |
|------------|------------|
| Fast prototype with roles readable for business | You need precise conditional edges (template 10) |
| Researcher → writer → reviewer pipeline | A single ReAct agent is enough (M6) |
| Non-technical team defines roles in YAML | Strict step-by-step audit (prefer LangGraph) |

**Gotchas:**

1. **Cost** — two LLM agents per query; for simple cases, a single agent (M6) is cheaper.
2. **Memory between turns** — not as direct as `thread_id`; you must pass context explicitly or use Crew memory.
3. **Duplicate tools** — extract `@tool` to a shared module (M7 `SHARED_TOOLS` pattern).
4. **Version** — CrewAI 0.7+ unified `@tool`; old examples with `from crewai_tools import tool` may fail.

---

## 3. AutoGen / AG2 — conversation between agents

### 3.1 What AG2 is (formerly AutoGen)

AG2 (PyPI package: `ag2`, import `autogen`) models agents that **talk to each other**. The flow **emerges from dialogue**: one agent proposes a tool, another executes it, another summarizes. There is no explicit graph like LangGraph nor a task pipeline like CrewAI.

**Package in 2025–2026:** Microsoft renamed the project to **AG2**. Install with `pip install ag2`; the import remains `from autogen import ...`. If you find tutorials with `pyautogen`, that is the previous generation — migrate to `ag2`.

### 3.2 Bridge table — scratch → AG2

| Scratch | AG2 |
|---------|-----|
| One process that does everything | `AssistantAgent` (reasons) + `UserProxyAgent` or second agent (executes tools) |
| `TOOLS[name](**args)` | Function registered with `register_function` |
| `react_loop` | `initiate_chat` — turns are messages between agents |
| Memory | Chat history between agents |
| Confirmation | `UserProxyAgent(human_input_mode="NEVER")` + instructions; or `ALWAYS` for real HITL |

### 3.3 APIs piece by piece

#### `ConversableAgent` / `AssistantAgent`

```python
from autogen import ConversableAgent, LLMConfig

llm_config = LLMConfig(
    config_list={"api_type": "anthropic", "model": "claude-sonnet-4-6",
                 "api_key": os.environ["ANTHROPIC_API_KEY"]},
)

asistente = ConversableAgent(
    name="flight_assistant",
    system_message="You are a flight change assistant. Delegate tool execution to the executor.",
    llm_config=llm_config,
)
```

`AssistantAgent` is a shortcut for LLM-oriented `ConversableAgent`; in recent AG2 many examples use `ConversableAgent` directly.

#### `register_function` — caller + executor

Central AG2 pattern: **one agent proposes** the tool (caller), **another executes** (executor):

```python
from autogen import register_function

ejecutor = ConversableAgent(name="executor", human_input_mode="NEVER")

register_function(
    consultar_reserva,
    caller=asistente,
    executor=ejecutor,
    description="Gets itinerary given the PNR",
)
```

Equivalent to separating decision (`fake_llm`) from execution (`TOOLS[name](**args)`) in scratch, but in **two agents** that chat.

#### `initiate_chat` — a ReAct dialogue

```python
ejecutor.initiate_chat(
    asistente,
    message="I want to change my flight SCL-BOG-001 from June 15 to June 17.",
    max_turns=10,
)
```

Each turn can include tool proposal, execution, and response — the ReAct loop emerges from the conversation.

#### `GroupChat` + `GroupChatManager` — more than two agents

```python
from autogen import GroupChat, GroupChatManager

groupchat = GroupChat(
    agents=[asistente, ejecutor, user_proxy],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",  # the manager chooses who speaks
)
manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)
user_proxy.initiate_chat(manager, message="...")
```

Useful if you add a "policy reviewer" agent or a human proxy. **Gotcha:** `speaker_selection_method="auto"` is unpredictable in production — hard to audit who decided what.

### 3.4 Mini-example — assistant + tool executor

```python
# Requiere: pip install ag2
"""
Flight change with AG2 — assistant ↔ tool executor dialogue.
"""

import json
import os
from pathlib import Path
from typing import Annotated

from autogen import ConversableAgent, LLMConfig, register_function

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


def consultar_reserva(pnr: Annotated[str, "PNR formato XXX-XXX-NNN"]) -> str:
    data = RESERVAS.get(pnr, {"error": f"PNR no encontrado: {pnr}"})
    return json.dumps(data, ensure_ascii=False)


def consultar_politica(
    fare_class: Annotated[str, "Fare class"],
    route_type: Annotated[str, "domestic or international"],
) -> str:
    for r in POLITICA["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return json.dumps(r, ensure_ascii=False)
    return json.dumps({"error": "Policy not found"})


def main():
    llm_config = LLMConfig(
        config_list={
            "api_type": "anthropic",
            "model": "claude-sonnet-4-6",
            "api_key": os.environ["ANTHROPIC_API_KEY"],
        }
    )

    asistente = ConversableAgent(
        name="flight_assistant",
        system_message=(
            "Flight change assistant. "
            "1) Ask the executor for consultar_reserva and consultar_politica. "
            "2) Calculate total with LA503 USD 295. "
            "3) Ask for confirmation before charging."
        ),
        llm_config=llm_config,
    )

    ejecutor = ConversableAgent(
        name="executor",
        human_input_mode="NEVER",
        llm_config=False,  # does not need LLM — only executes functions
    )

    register_function(consultar_reserva, caller=asistente, executor=ejecutor,
                      description="Gets itinerary by PNR")
    register_function(consultar_politica, caller=asistente, executor=ejecutor,
                      description="Change penalty by fare_class and route_type")

    # Turn 1
    ejecutor.initiate_chat(
        asistente,
        message="I want to change my flight SCL-BOG-001 from June 15 to June 17.",
        max_turns=8,
    )

    # Turn 2 — same pair of agents, new chat with context
    ejecutor.initiate_chat(
        asistente,
        message="Yes, I confirm the flight change.",
        max_turns=4,
    )


if __name__ == "__main__":
    main()
```

### 3.5 When to use / when NOT to

| Use AG2 | Avoid it if |
|---------|------------|
| Explore emergent multi-agent dynamics | Payments, PNR, charges — flow must be auditable |
| Coding agents, brainstorming, research | You need exactly-once or idempotency (template 01/10) |
| Fast prototype of "what if two LLMs negotiate?" | Compliance requires node-by-node trace (LangGraph) |

**Gotchas:**

1. **Emergent flow** — message order can vary between runs; hard to reproduce bugs.
2. **Two agents = more tokens** — executor and assistant exchange intermediate messages.
3. **`LLMConfig` changed in AG2** — old examples with `config_list=[{...}]` (list) vs flat dict; see [docs.ag2.ai](https://docs.ag2.ai) for your version.
4. **AutoGen → AG2 migration** — `pip install ag2`; the `autogen` namespace is kept for compatibility.

---

## 4. Pydantic-AI — type-safe agents ("anti-LangChain")

### 4.1 What Pydantic-AI is and why teams like it

[Pydantic-AI](https://ai.pydantic.dev) is the agent framework from the Pydantic team. Philosophy: **strict typing, little magic, no LangChain required**. Fits teams already using Pydantic for APIs and wanting validated `result_type` at the end of the run.

Do not confuse with **Pydantic** (data validation) or **instructor** (M5 §10) — Pydantic-AI is a **complete agent runtime** with tools, deps, and internal graphs.

### 4.2 Bridge table — scratch → Pydantic-AI

| Scratch | Pydantic-AI |
|---------|-------------|
| `TOOLS` dict | `@agent.tool` / `@agent.tool_plain` |
| `Session.SYSTEM` | `instructions=` in `Agent(...)` |
| State in memory (`pnr:`, `total_usd:`) | `deps_type` + `RunContext` + Pydantic `result_type` |
| `react_loop` | `agent.run_sync(...)` — internal loop |
| Validate final response | `result_type=CotizacionCambio` — fails if JSON does not match schema |

### 4.3 APIs piece by piece

#### `Agent(model, instructions, deps_type, result_type)`

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent

class FlightDeps(BaseModel):
    reservas: dict
    politica: dict

class CotizacionCambio(BaseModel):
    pnr: str
    vuelo_nuevo: str
    total_usd: float = Field(gt=0)
    requiere_confirmacion: bool = True
    mensaje: str

agent = Agent(
    'anthropic:claude-sonnet-4-6',
    deps_type=FlightDeps,
    output_type=CotizacionCambio,  # antes result_type; API 0.x usaba result_type
    instructions="You are a flight change assistant...",
)
```

> **Version note (2025–2026):** in Pydantic-AI ≥ 0.2 the parameter is called `output_type`; in 0.1x versions it was `result_type`. If your install fails, try the other name.

#### `@agent.tool` and `RunContext`

```python
from pydantic_ai import RunContext

@agent.tool
def consultar_reserva(ctx: RunContext[FlightDeps], pnr: str) -> dict:
    """Gets itinerary given the PNR."""
    return ctx.deps.reservas.get(pnr, {"error": f"PNR not found: {pnr}"})
```

- `@agent.tool` — **requires** `RunContext` as first argument (access to deps, usage, messages).
- `@agent.tool_plain` — without `RunContext`; for pure functions like calculators.

#### `agent.run_sync(...)` and memory

```python
from pydantic_ai import ModelMessage

historial: list[ModelMessage] = []

result1 = agent.run_sync(
    "Change SCL-BOG-001 from June 15 to June 17",
    deps=deps,
    message_history=historial,
)
historial = result1.all_messages()

result2 = agent.run_sync(
    "Yes, I confirm the change",
    deps=deps,
    message_history=historial,
)
cotizacion = result2.output  # CotizacionCambio validado
```

`message_history` ≈ `session.memory`; `result.output` ≈ final response **already validated** by Pydantic.

### 4.4 Case mini-agent — validated structured output

```python
# Requiere: pip install pydantic-ai
"""
Flight change with Pydantic-AI — typed tools + validated CotizacionCambio.
"""

import json
import os
from pathlib import Path

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


class FlightDeps(BaseModel):
    reservas: dict
    politica: dict


class CotizacionCambio(BaseModel):
    pnr: str
    vuelo_nuevo: str
    fecha_nueva: str
    penalidad_usd: float
    diferencial_usd: float
    total_usd: float = Field(gt=0)
    requiere_confirmacion: bool = True
    mensaje: str


agent = Agent(
    'anthropic:claude-sonnet-4-6',
    deps_type=FlightDeps,
    output_type=CotizacionCambio,
    instructions=(
        "Flight change assistant. "
        "Flow: consultar_reserva → consultar_politica → calculate with LA503 USD 295. "
        "total = penalty + max(0, 295 - base_price). "
        "requiere_confirmacion=True until the user confirms. "
        "After confirmation, requiere_confirmacion=False and confirm the charge."
    ),
)


@agent.tool
def consultar_reserva(ctx: RunContext[FlightDeps], pnr: str) -> dict:
    """Gets itinerary given the PNR."""
    return ctx.deps.reservas.get(pnr, {"error": f"PNR not found: {pnr}"})


@agent.tool
def consultar_politica(
    ctx: RunContext[FlightDeps], fare_class: str, route_type: str
) -> dict:
    """Penalty and change conditions."""
    for r in ctx.deps.politica["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return r
    return {"error": "Policy not found"}


def main():
    deps = FlightDeps(reservas=RESERVAS, politica=POLITICA)
    historial = []

    r1 = agent.run_sync(
        "I want to change my flight SCL-BOG-001 from June 15 to June 17.",
        deps=deps,
        message_history=historial,
    )
    historial = r1.all_messages()
    cot1 = r1.output
    print("TURN 1:", cot1.mensaje)
    print(f"  Total: USD {cot1.total_usd:.2f}, confirmar: {cot1.requiere_confirmacion}")

    r2 = agent.run_sync(
        "Yes, I confirm the change.",
        deps=deps,
        message_history=historial,
    )
    cot2 = r2.output
    print("TURN 2:", cot2.mensaje)


if __name__ == "__main__":
    main()
```

### 4.5 Why "anti-LangChain" teams like it

| Advantage | Detail |
|---------|---------|
| End-to-end typing | `deps_type`, `output_type`, tools with hints |
| Little magic | One `Agent`, no LCEL or optional graphs |
| Automatic validation | If the LLM returns `total_usd: -1`, Pydantic fails and you can retry |
| Unified model string | `'anthropic:claude-sonnet-4-6'`, `'openai:gpt-4o'` — change provider in one line |
| Logfire integration | Observability from the same Pydantic team (optional) |

### 4.6 When to use / when NOT to

| Use Pydantic-AI | Avoid it if |
|-----------------|------------|
| Agent with critical structured output (quote, diagnosis) | Massive fan-out with subgraphs (LangGraph) |
| Team already uses Pydantic/FastAPI everywhere | Need mature LangSmith/LangGraph ecosystem |
| Want to avoid LangChain but with ergonomics | Declarative multi-agent roles (CrewAI faster) |

**Gotchas:**

1. **`@agent.tool` vs `@agent.tool_plain`** — mixing them wrong causes runtime errors (the first requires `RunContext`).
2. **`output_type` vs `result_type`** — check installed version.
3. **Structured output + long conversation** — the model may exhaust tokens filling the schema; simplify `output_type` on intermediate turns.
4. **Fewer multi-agent examples** than LangGraph/CrewAI — for template 10 LangGraph still applies.

---

## 5. Final comparison table and decision rule

### 5.1 Comparison — same case, five approaches

| Criterion | Native loop (SDK) | LangGraph (M6) | CrewAI | AutoGen / AG2 | Pydantic-AI |
|----------|-------------------|----------------|--------|---------------|-------------|
| **Mental model** | You are the framework | State graph | Team by roles | Emergent conversation | Typed agent + validation |
| **Flow control** | Maximum (every line) | Maximum (explicit edges) | Medium (Process) | Low-medium | Medium-high |
| **Audit** | Logs you write | Nodes + LangSmith | Crew/task logs | Hard (variable turns) | Schema validation + traces |
| **Learning curve** | Low (if you know ②) | Medium-high | Low-medium | Medium | Medium |
| **Memory between turns** | `messages` list | `MemorySaver` + `thread_id` | Context / crew memory | Chat history | `message_history` |
| **Best for** | 1 agent, few tools, minimal deps | RAGorbit production, HITL, fan-out | Readable multi-role prototype | Exploration, coding agents | Structured output + typed APIs |
| **Avoid if** | You need complex graphs | You only want 30 lines without deps | Strict transactional flow | Charges, PNR, compliance | Massive multi-agent without clear plan |
| **Typical deps** | `anthropic` or `openai` | `langgraph` + `langchain-*` | `crewai` + LLM adapter | `ag2` | `pydantic-ai` |

### 5.2 Decision rule — single agent, framework, or multi-agent?

```
How many tools and how strict is the flow?
│
├─ 1 agent, 2–5 tools, chat with memory
│   ├─ Want minimal dependencies and line-by-line control?
│   │   → Native loop (SDK) — §1
│   ├─ Must final output satisfy Pydantic schema no matter what?
│   │   → Pydantic-AI — §4
│   └─ Checkpoints, LangSmith, same stack as RAGorbit?
│       → LangGraph — M6 §8
│
├─ Several roles readable for business (analyst + calculator)
│   └─ Prototype, not massive fan-out?
│       → CrewAI — §2 (this doc) or M7 §9 (logistics)
│
├─ Free dialogue between agents, exploration
│   └─ No charges or strict audit?
│       → AG2 — §3
│
└─ Thousands of events, simple/complex branches, idempotency
    → LangGraph multi-agent — M7 §9 (NOT CrewAI or AG2 in production)
```

**Course rules (consistent with `tecnologias-comparadas.md` §9):**

1. **Understand ② before choosing ③** — if you cannot write `react_loop` by hand, no framework will save you in production.
2. **A single ReAct agent is enough** for template 01 (conversational flight change) — multi-agent only if there is real parallelization (template 10) or strong specialization.
3. **LangGraph** when the flow has financial consequences and you need checkpoints + guardrails in the graph (M9).
4. **Native SDK or Pydantic-AI** when the team rejects LangChain but needs a lightweight production agent.
5. **CrewAI** for team prototypes; **AG2** for experimentation — migrate to LangGraph when audit matters.

### 5.3 Mapping to the RAGorbit node

Template 01 (airline) implements this flow with the [`agent.react`](./catalogo-nodos.md#agentreact) node: a ReAct orchestrator with tools `consultar_reserva`, `consultar_politica`, `PaymentService` wrapped in `guardrail.confirm`. Any framework in this document that implements the ReAct loop + tools is a candidate to generate that node; LangGraph is what RAGorbit codegen uses by default for checkpoints and composition with the rest of the graph.

---

> **Cross-links**
>
> - **M6 §8 — LangGraph from scratch:** [06-agentes-i/guia.md §8](../06-agentes-i/guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph) — course baseline; scratch → LangGraph bridge table.
> - **M7 §9 — Multi-agent frameworks:** [07-agentes-ii/guia.md §9](../07-agentes-ii/guia.md#9-layer--explained-multi-agent-frameworks-from-scratch) — CrewAI + LangGraph multi in logistics (complements §2 of this doc, does not duplicate it).
> - **Agent frameworks (table §9):** [tecnologias-comparadas.md §9](./tecnologias-comparadas.md#9-agent-and-multi-agent-frameworks)
> - **Nodes `agent.react` and `agent.fanout`:** [catalogo-nodos.md](./catalogo-nodos.md)
> - **Layer ② reference:** [06-agentes-i/lab/solucion_scratch.py](../06-agentes-i/lab/solucion_scratch.py)
> - **Template 01 airline:** [examples/01-airline-flight-change/](../../examples/01-airline-flight-change/)
> - **Authorship convention (layer ③):** [HANDOFF.md §3](../HANDOFF.md#3-mandatory-authorship-method-for-consistency)

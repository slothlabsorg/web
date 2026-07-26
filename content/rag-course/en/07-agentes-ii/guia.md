# Module 7 · Agents II — Multi-agent and Frameworks (`agent`, `tool`)

> **Prerequisite:** M6 (ReAct agent, tool calling, basic LangGraph).
>
> **RAGorbit nodes:** `agent.fanout`, `agent.react`, `tool.service`, `tool.retriever`
>
> **Anchor template:** `10-logistics-disruption-rebooking` (event-driven fan-out)

---

## Table of contents

1. [When multi-agent vs a single agent?](#1-when-multi-agent-vs-a-single-agent)
2. [Multi-agent patterns](#2-multi-agent-patterns)
3. [Orchestration and stateless fan-out](#3-orchestration-and-stateless-fan-out)
4. [LangGraph multi-agent (supervisor, conditional edges, checkpoints)](#4-langgraph-multi-agent)
5. [CrewAI (agents, tasks, crews, tools)](#5-crewai)
6. [AutoGen / AG2 (conversation between agents)](#6-autogen--ag2)
7. [BeeAI and Semantic Kernel (quick overview)](#7-beeai-and-semantic-kernel)
8. [Framework selection and combination](#8-framework-selection-and-combination)
9. [Layer ③ explained: multi-agent frameworks from scratch](#9-layer--explained-multi-agent-frameworks-from-scratch)
10. [RAGorbit nodes in this module](#10-ragorbit-nodes-in-this-module)
11. [Template 10 · Logistics](#11-template-10--logistics)
12. [Checkpoint — You know it if you can…](#12-checkpoint--you-know-it-if-you-can)

---

## 1. When multi-agent vs a single agent?

### 1.1 The limits of a single agent

In M6 you built a **ReAct agent** with several tools. That is enough when:

- A single conversational entity serves the user.
- The tools share the same session context.
- The flow is sequential (even if dynamic) toward **one** goal.

A **multi-agent system** adds value when:

| Signal | Why a single agent fails | Example (template 10) |
|-------|------------------------------|------------------------|
| **Massive parallelization** | 3,000 shipments do not fit in a sequential loop | Fan-out with `concurrency=16` |
| **Domain specialization** | One LLM with 15 tools confuses tool descriptions | ProfileAgent vs PolicyAgent vs AlternativesAgent |
| **Different routing policies** | Simple cases should not pay tokens for complex ones | `logic.rules` → auto-confirm vs LLM |
| **Stateless agents** | State lives in Kafka/DB, not in sub-agent memory | Re-process after crash without losing context |
| **Explicit supervision** | You need to audit *who* decided *what* | Supervisor + audit trail |

### 1.2 Golden rule

```
Does a single LLM with N tools solve 80% in < 10 steps?
  YES → agent.react (M6)
  NO → evaluate multi-agent

Do you need to process > 100 identical items in parallel?
  YES → agent.fanout (M7)

Do you need distinct cognitive roles (researcher vs reviewer)?
  YES → CrewAI or LangGraph multi-node

Does the flow emerge from free conversation between agents?
  YES → AutoGen (prototype); LangGraph (production)
```

### 1.3 When NOT to use multi-agent

- **Unnecessary overhead:** 2 tools and one user → ReAct is enough.
- **Critical audit without an explicit graph:** conversational AutoGen is hard to trace.
- **Strict latency:** each hop between agents adds an LLM call.
- **Cost:** N agents × M steps × tokens = explosion if you do not segment first (see `logic.rules` in template 10).

---

## 2. Multi-agent patterns

### 2.1 Supervisor (central orchestrator)

A **supervisor** agent receives the task, decides which specialist to invoke, and consolidates the result.

```
                    ┌──────────────┐
  Input ───────────▶│  SUPERVISOR  │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Agent A    │  │ Agent B    │  │ Agent C    │
    │ (profile)  │  │ (policy)   │  │ (routing)  │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┴───────────────┘
                           ▼
                    Consolidated response
```

**When to use:** transactional flows with known steps but branching (rebooking, legal research).

**In RAGorbit:** `agent.fanout` acts as the supervisor of the per-shipment sub-agent; internally the sub-agent follows a mini-graph.

### 2.2 Hierarchical

The supervisor delegates to **sub-supervisors** that in turn coordinate specialists.

```
CEO Agent
  ├── Research Manager → Web Agent, Doc Agent
  └── Writing Manager  → Drafter, Editor
```

**When to use:** large teams (> 5 roles), multi-section reports.

**Framework:** CrewAI `Process.hierarchical` with `manager_llm`.

### 2.3 Collaborative (peer-to-peer)

Agents converse with each other without a fixed supervisor; the flow **emerges** from dialogue.

```
Agent A ◄────────────────► Agent B
   │                           │
   └──────────► Agent C ◄─────┘
```

**When to use:** brainstorming, coding agents, exploration.

**Framework:** AutoGen/AG2. **Risk:** hard to audit; few native guardrails.

### 2.4 Stateless fan-out

The same sub-agent is instantiated **N times** in parallel, once per item. No shared memory between instances.

```
Kafka Event Batch (3000 shipments)
        │
        ▼
  ┌─────────────────────────────────┐
  │  agent.fanout (concurrency=16)  │
  │  ┌─────┐ ┌─────┐ ┌─────┐       │
  │  │Sub 1│ │Sub 2│ │Sub N│ ...   │
  │  └──┬──┘ └──┬──┘ └──┬──┘       │
  └─────┼───────┼───────┼───────────┘
        ▼       ▼       ▼
     notify  notify  notify
     audit   audit   audit
```

**When to use:** massive event-driven processing (logistics, fraud, alerts).

**State:** in event log + DB, not in agent heap. Kafka redelivery + DB idempotency = exactly-once.

### 2.5 Pattern comparison table

| Pattern | Control | Parallelism | Auditability | RAGorbit case |
|--------|---------|-------------|-----------|---------------|
| Supervisor | High | Medium | High | Rebooking sub-agent |
| Hierarchical | High | Medium | Medium-high | Multi-section reports |
| Collaborative | Low | Low | Low | AutoGen prototypes |
| Stateless fan-out | High (per item) | **Maximum** | High (per shipment_id) | Template 10 |

---

## 3. Orchestration and stateless fan-out

### 3.1 Template 10 pipeline

```
io.event-source ──▶ logic.rules ──▶ logic.router ──▶ agent.fanout
                              │                          │
                              │                    tool.service × 3
                              │                    tool.retriever
                              ▼                          ▼
                         P1/P2/P3                  io.notify
                         simple/complex             observability.audit
```

### 3.2 Segmentation before the LLM (cost control)

`logic.rules` classifies **without an LLM**:

- **P1 / complex:** premium, `connections_lost > 0`, `CRITICAL`.
- **P2 / simple:** `delivery_flexibility == flexible`.
- **P3 / simple:** everything else.

Only the `complex` track invokes the sub-agent LLM. In a typical weather disruption, **~70%** auto-confirm — 10–20× token savings.

### 3.3 Fan-out in code (concept)

```python
# Generated by RAGorbit codegen (simplified)
async def fanout(events, concurrency=16):
    sem = asyncio.Semaphore(concurrency)
    async def process_one(event):
        async with sem:
            return await sub_agent.invoke(event)
    return await asyncio.gather(*[process_one(e) for e in events])
```

In the scratch workshop, `SupervisorOrchestrator.fan_out` simulates this sequentially but respects the batch concept.

### 3.4 Idempotency + exactly-once

- Kafka `exactlyOnce: true` → atomic offset and audit.
- DB with key `shipment_id` → second processing returns cache.
- In scratch: `self._processed: set[str]`.

---

## 4. LangGraph multi-agent

### 4.1 From ReAct to multi-node graph (M6 → M7 recap)

M6: `agent ↔ tools` graph (one agent).

M7: graph with **several agent nodes** + **supervisor** + **conditional edges**:

```
ENTRY → supervisor → profile → policy → alternatives
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                        autoconfirm                    llm_specialist
                              │                               │
                             END                             END
```

### 4.2 Conditional edges

Router function returns the **name of the next node**:

```python
def route_after_alternatives(state) -> str:
    if state["track"] == "complex":
        return "llm"
    return "autoconfirm"

builder.add_conditional_edges(
    "alternatives",
    route_after_alternatives,
    {"autoconfirm": "autoconfirm", "llm": "llm_specialist"},
)
```

Scratch equivalent: `if track == "simple": autoconfirm else: llm_agent.analyze(...)`.

### 4.3 Checkpoints in fan-out

- **Conversational (M6):** `thread_id` = user session.
- **Fan-out (M7):** `thread_id` = `shipment_id` (one checkpoint per shipment).

```python
config = {"configurable": {"thread_id": event["shipment_id"]}}
graph.invoke(initial_state, config=config)
```

If the worker crashes, re-invoke with the same `shipment_id` and the checkpointer restores partial progress.

### 4.4 Subgraphs

A node can be **another compiled graph** — useful to encapsulate the fan-out sub-agent:

```python
sub_rebook_graph = build_rebook_subgraph()
builder.add_node("rebook", sub_rebook_graph)
```

---

## 5. CrewAI

### 5.1 Mental model

```
Crew = Agents + Tasks + Process
```

| Concept | What it is | Analogy |
|----------|--------|----------|
| `Agent` | Role with `goal`, `backstory`, optional tools | Specialized employee |
| `Task` | Concrete work + `expected_output` | Jira ticket |
| `Crew` | Team that executes tasks | Sprint |
| `Process` | Execution order | Kanban / hierarchy |

### 5.2 Process.sequential vs hierarchical

```python
# Sequential: task B receives context from task A
Crew(..., process=Process.sequential)

# Hierarchical: a manager delegates tasks to agents
Crew(..., process=Process.hierarchical, manager_llm=llm)
```

For per-shipment rebooking: **sequential** (classify → investigate → execute).

For massive fan-out: **external loop** `for event in events: crew.kickoff(...)`.

### 5.3 When to use CrewAI

**Yes:** multi-role prototypes, reports (researcher + writer + reviewer), teams with fixed roles.

**No:** massive fan-out with strict audit (LangGraph + Kafka is better), flows with fine financial guardrails.

### 5.4 Gotchas

1. **Vague tasks → vague outputs.** `expected_output` must be specific.
2. **Duplicate tools** across agents → confusion; centralize in one researcher agent.
3. **Cost:** 3 agents × 3 tasks = up to 9 LLM calls per shipment if you do not segment first.

---

## 6. AutoGen / AG2

### 6.1 Conversation between agents

AutoGen models agents that **send messages** to each other until they converge:

```python
user_proxy = UserProxyAgent(name="user")
assistant = AssistantAgent(name="assistant", llm_config=...)
user_proxy.initiate_chat(assistant, message="Design the rebook for SHP-001")
```

The flow **is not in a graph** — it emerges from dialogue.

### 6.2 When to use

- Coding agents (generate + execute + fix code).
- Design exploration with several simulated "experts".
- Quick prototypes without strict compliance.

### 6.3 When NOT to use

- Transactional services (payments, regulated rebooking).
- When you need **exactly-once** or an audit trail per step.
- Production without refactoring to LangGraph.

### 6.4 AG2 (AutoGen evolution)

AG2 adds better typing, agent groups, and explicit termination. The mental model remains conversational.

---

## 7. BeeAI and Semantic Kernel

### 7.1 BeeAI (IBM)

Modular framework oriented to **IBM/watsonx enterprise**:
- Agents with integrated governance and policies.
- Integration with watsonx.ai and Granite.
- Useful if your stack is already IBM; medium learning curve.

### 7.2 Semantic Kernel (Microsoft)

**Plugins + Planners** on .NET/Azure:
- Typed functions as plugins.
- Automatic planners that chain plugins.
- Ideal in Azure/OpenAI ecosystem; less common in pure Python.

### 7.3 Quick comparison (see also [technologies-compared.md §9](../referencia/tecnologias-comparadas.md#9-frameworks-de-agentes-y-multi-agente))

| Framework | Control | Fan-out | Enterprise |
|-----------|---------|---------|------------|
| LangGraph | ★★★★★ | ★★★★★ | Production |
| CrewAI | ★★★☆☆ | ★★☆☆☆ | Prototypes |
| AutoGen/AG2 | ★★☆☆☆ | ★★☆☆☆ | Exploration |
| BeeAI | ★★★☆☆ | ★★★☆☆ | IBM stack |
| Semantic Kernel | ★★★★☆ | ★★★☆☆ | Azure/.NET |

---

## 8. Framework selection and combination

### 8.1 Decision tree

```
Massive event-driven processing?
  └─ YES → LangGraph + Kafka fan-out (template 10)

Fixed roles like an "editorial team"?
  └─ YES → CrewAI sequential/hierarchical

Exploration / coding / free dialogue?
  └─ YES → AutoGen (prototype) → migrate to LangGraph

IBM watsonx stack?
  └─ YES → BeeAI

Azure/.NET stack?
  └─ YES → Semantic Kernel
```

### 8.2 Combining frameworks (hybrid pattern)

It is valid and common:
- **CrewAI** to generate offline report drafts.
- **LangGraph** for the transactional worker in production.
- **AutoGen** in the development sandbox.

What we **do not** recommend: two frameworks orchestrating the **same** flow in production — duplicates observability and failure points.

### 8.3 RAGorbit as a unifying layer

The `flow.json` abstracts the framework:
- `agent.react` → LangGraph ReAct (codegen).
- `agent.fanout` → asyncio + LangGraph subgraph.
- Tools → `@tool` / `tool.service` independent of the orchestration framework.

---

## 9. Layer ③ explained: multi-agent frameworks from scratch

> **Prerequisite:** you have implemented `lab/solucion_scratch.py` or understand each agent you wrote by hand. **Read this section in full** before `lab/solucion_framework.py`.
>
> **Environment:** no pip/network in the course. The goal is that, with `pip install crewai langgraph langchain langchain-anthropic`, you can **write** the framework solution yourself.

### 9.1 Recap and cross-links

| Module | What you learned | Link |
|--------|----------------|--------|
| M1 §11 | LangChain base: `ChatAnthropic`, messages, `invoke` | [M1 §11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch) |
| M6 §8 | `@tool`, `create_react_agent`, `StateGraph`, `MemorySaver` | [M6 §8](../06-agentes-i/guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph) |
| **M7** | Multi-agent: supervisor, fan-out, CrewAI, conditional edges | This section |

**What is new in M7:** not a single tool or a single ReAct loop — it is **orchestrating several agents** that pass state and branch with conditional edges.

### 9.2 Bridge table: scratch → CrewAI / LangGraph

| What you did by hand (layer ②) | CrewAI (layer ③) | LangGraph (layer ③) |
|--------------------------------|-----------------|---------------------|
| `PriorityRulesAgent.classify()` | Classifier Agent `Task` | `supervisor` node |
| `ProfileAgent`, `PolicyAgent`, … | Researcher `Agent` + `@tool` | `profile`, `policy`, `alternatives` nodes |
| `if track == "simple": autoconfirm else: llm` | Executor `Task` with instructions | `add_conditional_edges` after `alternatives` |
| `SupervisorOrchestrator.fan_out()` | `for event: crew.kickoff(...)` | `for event: graph.invoke(...)` |
| `FakeLLMAgent.analyze()` | Executor Agent with real LLM | `llm_specialist` node |
| `self._processed` (idempotency) | External cache / flag in task output | `checkpointer` + `thread_id=shipment_id` |
| Trace `[profile_agent]`, `[llm_agent]` | `verbose=True` in Crew | Node stream / LangSmith |

### 9.3 CrewAI from scratch — APIs used by `solucion_framework.py`

#### Agent

```python
from crewai import Agent

researcher = Agent(
    role="Rebook investigator",              # role title
    goal="Gather profile, policy, and alternatives",
    backstory="Knows PolicyRAG and routing services.",
    tools=[get_shipment_profile, get_alternatives],  # LangChain @tool
    llm=llm,
    verbose=True,
)
```

- `role` + `goal` + `backstory` ≈ specialized system prompt from scratch.
- `tools`: the same `@tool` from M6.

#### Task

```python
from crewai import Task

research_task = Task(
    description="For the shipment in {event_json}, call the necessary tools.",
    expected_output="JSON with profile, policy, and alternatives",
    agent=researcher,
    context=[classify_task],   # receives output from previous tasks
)
```

- `context` chains tasks like `memory.append` in scratch.
- `expected_output` guides the agent's internal evaluation.

#### Crew and Process

```python
from crewai import Crew, Process

crew = Crew(
    agents=[classifier, researcher, executor],
    tasks=[classify_task, research_task, execute_task],
    process=Process.sequential,
)
result = crew.kickoff(inputs={"event_json": json.dumps(event)})
```

- `Process.sequential` = fixed pipeline A → B → C (like your `process_event`).
- `Process.hierarchical` = manager LLM delegates (hierarchical pattern §2.2).

### 9.4 LangGraph multi-agent from scratch

#### Shared state

```python
class RebookState(TypedDict):
    messages: Annotated[list, add_messages]
    event: dict
    track: str
    profile: dict
    alternatives: list
    handler: str
```

All nodes read/write fields of `RebookState` — equivalent to the dict you passed between agents in scratch.

#### Specialist nodes

```python
def node_profile_agent(state: RebookState) -> RebookState:
    profile = get_shipment_profile.invoke({"shipment_id": state["event"]["shipment_id"]})
    return {"profile": profile, "messages": [AIMessage(content=f"Profile: {profile['tier']}")]}

builder.add_node("profile", node_profile_agent)
```

Each node = one scratch agent class.

#### Supervisor + conditional edges

```python
def route_after_alternatives(state) -> Literal["autoconfirm", "llm"]:
    return "llm" if state["track"] == "complex" else "autoconfirm"

builder.add_conditional_edges("alternatives", route_after_alternatives,
    {"autoconfirm": "autoconfirm", "llm": "llm_specialist"})
```

This **is** the `if track == "simple"` of `SupervisorOrchestrator.process_event`.

#### Compile and run

```python
graph = builder.compile()
final = graph.invoke({"event": event, "messages": [], ...})
```

### 9.5 Block-by-block walkthrough of `solucion_framework.py`

#### Block 1 — Data and shared `@tool` (lines 1–75)

Identical to scratch. Tools are the common interface between CrewAI and LangGraph.

#### Block 2 — CrewAI (lines 78–145)

| Fragment | Scratch equivalent |
|-----------|---------------------|
| Classifier `Agent` | `PriorityRulesAgent` |
| Researcher `Agent` + tools | `ProfileAgent` + `PolicyAgent` + `AlternativesAgent` |
| Executor `Agent` | `AutoConfirmAgent` + `FakeLLMAgent` |
| `Task` with `context=[...]` | Call order in `process_event` |
| `crew.kickoff(inputs={...})` | `orchestrator.process_event(event)` |
| Loop `for event in events` | `fan_out()` |

#### Block 3 — LangGraph multi-agent (lines 148–280)

| Fragment | Scratch equivalent |
|-----------|---------------------|
| `RebookState` | Local fields of `process_event` |
| `node_supervisor` | `PriorityRulesAgent.classify` |
| `node_profile_agent` … `node_alternatives_agent` | Specialist agents |
| `route_after_alternatives` | Auto-confirm vs LLM branch |
| `node_llm_specialist` | `FakeLLMAgent` (with real LLM) |
| `build_langgraph_multi_agent` | `SupervisorOrchestrator` |

#### Block 4 — Comparative demo (lines 283–end)

Runs both frameworks on the same 6 events and prints CrewAI vs LangGraph table.

### 9.6 When to use each framework and gotchas

| Situation | Use | Why |
|-----------|-----|---------|
| Fan-out 3000 shipments + Kafka + audit | LangGraph | Explicit graphs, checkpoints, LangSmith |
| Prototype "team" researcher+executor | CrewAI | Less boilerplate, declarative roles |
| Explore free dialogue between agents | AutoGen | Emergent; migrate to LangGraph afterward |
| IBM watsonx enterprise | BeeAI | Native governance |
| Same problem, compare in the lab | **Both** CrewAI + LangGraph | See trade-offs in practice |

**Gotchas:**

1. **CrewAI without prior segmentation** → 3 LLM agents per simple shipment = unnecessary cost. Replicate `logic.rules` before the crew.
2. **LangGraph without `thread_id` per shipment** → you mix state between shipments in fan-out.
3. **Misnamed conditional edge** → the graph ends without running `autoconfirm`. Dict keys must match exactly.
4. **AutoGen in transactional production** → unpredictable conversation; hard to meet exactly-once.
5. **Duplicating logic** between CrewAI and LangGraph → extract shared tools (`SHARED_TOOLS` in the lab).

### 9.7 Checklist before writing `solucion_framework.py`

- [ ] Shared tools with docstrings that indicate **when** to use them?
- [ ] CrewAI: 3 agents + 3 tasks + `Process.sequential`?
- [ ] LangGraph: one node per specialist + conditional edge after `alternatives`?
- [ ] Does `RebookState` include `track` for the router?
- [ ] External loop per event to simulate fan-out?
- [ ] CrewAI vs LangGraph trade-offs table at the end?

**Next step:** [lab/enunciado.md](lab/enunciado.md) Part B — write the file before looking at the solution.

---

> **Beyond Lang\*:** besides LangGraph and CrewAI, the rebooking/flight-change case is covered in **AutoGen/AG2**, **Pydantic-AI**, and a **native multi-agent loop (no framework)** in [`../referencia/agentes-sin-langchain.md`](../referencia/agentes-sin-langchain.md). And review the [critiques of the LangChain/LangGraph/LangSmith stack](../referencia/tecnologias-comparadas.md#críticas-al-stack-langchain--langgraph--langsmith-y-cuándo-no-usarlo) to decide multi-agent vs single agent vs native SDK.

---

## 10. RAGorbit nodes in this module

### `agent.fanout`

```
Ports:
  → Event (from io.event-source / logic.router)
  → Tool (n) — sub-agent tools
  ← Any — toward notify, audit, metrics

Config:
  concurrency: 16
  subAgentSystem: "stateless sub-agent instructions"
```

### `agent.react` (in conversational sub-agents)

Still the node for **one** user; in template 10 the fan-out sub-agent uses it internally for `complex` cases.

### `tool.service` + `tool.retriever`

Template 10 uses:
- `ShipmentProfileService`, `AlternativesService`, `AutoConfirmService`
- `policy_rag` (`tool.retriever` over `store.pgvector`)

See [catalogo-nodos.md §9–10](../referencia/catalogo-nodos.md).

---

## 11. Template 10 · Logistics

The most complete **multi-agent fan-out** template in RAGorbit.

**Flow summary:**
1. Kafka `shipment.disruption` → `logic.rules` (P1/P2/P3).
2. `logic.router` → `agent.fanout` (simple and complex to the same node).
3. Sub-agent per shipment: tools + selective LLM.
4. `io.notify` + `observability.audit` + OTLP metrics.

**Key metrics in a crisis:**
- `rebooking_autoconfirm_total / rebooking_processed_total` → efficiency.
- `rebooking_duration_seconds` by priority → P95 latency.

Full documentation: [`examples/10-logistics-disruption-rebooking/README.md`](../../examples/10-logistics-disruption-rebooking/README.md) and [`flow.json`](../../examples/10-logistics-disruption-rebooking/flow.json).

---

## 12. Checkpoint — You know it if you can…

- [ ] Explain when a single `agent.react` is enough and when you need multi-agent.
- [ ] Draw the 4 patterns (supervisor, hierarchical, collaborative, fan-out).
- [ ] Describe why `logic.rules` goes **before** the LLM in template 10.
- [ ] Build a `StateGraph` with supervisor and `add_conditional_edges`.
- [ ] Explain `Agent` / `Task` / `Crew` / `Process` in CrewAI.
- [ ] Compare AutoGen vs LangGraph for production auditability.
- [ ] Map each scratch class to its CrewAI and LangGraph node (table §9.2).
- [ ] Read template 10 `flow.json` and identify fan-out, rules, and tools.
- [ ] Complete the lab: 6 shipments, 3 auto-confirm, 3 LLM, idempotency.
- [ ] Justify framework choice for a new brief (tree §8.1).

**If you cannot:** review §2 (patterns), §9 (frameworks from scratch), and [lab/enunciado.md](lab/enunciado.md).

# Lab M7 · Multi-Agent — Logistics Disruption Rebooking

## Business brief

You are an engineer at the **Control Tower** of a logistics operator. A **MIA hub closure due to a storm** affects thousands of shipments. The manual process (one human agent per shipment) collapses within minutes.

Your system must:

1. Consume disruption events (`shipment.disruption` on Kafka).
2. **Segment** each shipment into P1/P2/P3 and track `simple`/`complex` (deterministic rules).
3. Dispatch a **sub-agent per shipment** in parallel (fan-out, `concurrency=16`).
4. For each shipment: profile → policy → alternatives → **auto-confirm** or **LLM**.
5. Notify the customer and audit each decision.

**Central guardrail:** 100% coverage (no shipment without rebook) + idempotency (no double rebook).

**Anchor template:** [`examples/10-logistics-disruption-rebooking/`](../../../examples/10-logistics-disruption-rebooking/README.md)

## Available data

In `lab/data/`:

| File | Content |
|---------|-----------|
| `disruption_events.json` | 6 disruption events (MIA hub, cause `weather`) |
| `shipment_profiles.json` | Profile per `shipment_id` (tier, email, preferences) |
| `rebook_policies.json` | Policies per `disruption_cause` + `tier` |
| `alternatives.json` | Alternative routes per shipment (48h window) |

## Target architecture (multi-agent)

```
                    ┌─────────────────────────────────────────┐
  Kafka Event ─────▶│  SupervisorOrchestrator (fan-out)       │
                    │       │                                 │
                    │       ├─ PriorityRulesAgent             │
                    │       ├─ ProfileAgent                   │
                    │       ├─ PolicyAgent                    │
                    │       ├─ AlternativesAgent              │
                    │       ├─ AutoConfirmAgent (simple)      │
                    │       └─ FakeLLMAgent (complex)         │
                    └─────────────────────────────────────────┘
```

## Task

### Part A — Multi-agent from scratch (layer ②)

Implement `lab/solucion_scratch.py`:

1. **Agents as classes/functions:** `PriorityRulesAgent`, `ProfileAgent`, `PolicyAgent`, `AlternativesAgent`, `AutoConfirmAgent`, `FakeLLMAgent`.
2. **`SupervisorOrchestrator`:** orchestrates the pipeline per shipment and fan-out over the event list.
3. **Deterministic fake LLM:** fixed templates for `track=complex` cases (premium multi-leg, CRITICAL).
4. **Auto-confirm rules:** `track=simple` + obvious option (single alt or ETA gap ≥ 4h).
5. **Idempotency:** a `set` of already processed `shipment_id`s.
6. **Output:** trace per agent, summary table, auto-confirm vs LLM metrics, trade-offs table.
7. **Final `assert`s:** 6 shipments, 3 auto-confirm, 3 LLM, idempotency.

Run: `python3 solucion_scratch.py` — must match [`expected.md`](expected.md).

### Part B — CrewAI + LangGraph (layer ③, guided task)

> **Read first:** [guide.md §9 — Layer ③ explained: multi-agent frameworks from scratch](../guia.md#9-layer--explained-multi-agent-frameworks-from-scratch). Also review [M6 §8](../06-agentes-i/guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph).

**Goal:** the **same problem** solved in **CrewAI** and **LangGraph multi-agent**; compare trade-offs.

```bash
pip install crewai langgraph langchain langchain-anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### Step B.1 — Shared tools (`@tool`)

Convert scratch services to `@tool`: `get_shipment_profile`, `get_rebook_policy`, `get_alternatives`, `auto_confirm_rebook`.

#### Step B.2 — CrewAI

1. Define 3 `Agent`s: classifier, researcher (with tools), executor.
2. Define 3 chained `Task`s with `context=[...]`.
3. Create `Crew(agents=..., tasks=..., process=Process.sequential)`.
4. External loop per event = fan-out.

**Question:** Why `Process.sequential` and not `hierarchical` for this case?

#### Step B.3 — LangGraph multi-agent

1. Define `RebookState` with `Annotated[list, add_messages]`.
2. Nodes: `supervisor`, `profile`, `policy`, `alternatives`, `autoconfirm`, `llm_specialist`.
3. **Conditional edge** after `alternatives`: `track=simple` → `autoconfirm`; `complex` → `llm_specialist`.
4. Compile with `builder.compile()`.

**Question:** Which graph node corresponds to scratch `SupervisorOrchestrator.process_event`?

#### Step B.4 — Compare

Open `lab/solucion_framework.py` block by block (guide §9.8). Complete the CrewAI vs LangGraph trade-offs table.

> Illustrative in the course environment (no pip). Write it even if you cannot run it.

## Test scenario

| shipment_id | tier | expected track | expected handler | expected alt |
|-------------|------|----------------|------------------|--------------|
| SHP-20240614-00742 | standard, flexible | simple | auto_confirm | ALT-881 |
| SHP-20240614-00815 | standard | simple | auto_confirm | ALT-902 |
| SHP-20240614-00189 | premium, multi-leg | complex | llm | ALT-715 |
| SHP-20240614-00331 | CRITICAL | complex | llm | ALT-640 |
| SHP-20240614-00556 | flexible, 2 alts | simple | auto_confirm | ALT-904 |
| SHP-20240614-00204 | premium, multi-leg | complex | llm | ALT-521 |

**Expected metrics:** 6 processed · 3 auto-confirm (50%) · 3 LLM (50%)

## Tiered hints

### Hint 1 — Priority rules (same as `flow.json`)

```python
def classify(event):
    if event.get("tier") == "premium" or event.get("connections_lost", 0) > 0:
        return {"priority": "P1", "track": "complex"}
    if event.get("delivery_flexibility") == "flexible":
        return {"priority": "P2", "track": "simple"}
    if event.get("disruption_severity") == "CRITICAL":
        return {"priority": "P1", "track": "complex"}
    return {"priority": "P3", "track": "simple"}
```

### Hint 2 — Auto-confirm vs LLM

```python
# Auto-confirm if:
#   track == "simple" AND (
#     len(alternatives) == 1
#     OR one alternative is >= 4h faster than the second
#   )
# LLM if:
#   track == "complex" (premium multi-leg, CRITICAL, etc.)
```

### Hint 3 — Simulated fan-out

```python
def fan_out(self, events, concurrency=16):
    for i in range(0, len(events), concurrency):
        batch = events[i : i + concurrency]
        for event in batch:
            yield self.process_event(event)
```

### Hint 4 — FakeLLMAgent by templates

```python
if is_multi_leg and tier == "premium":
    ranked = sorted(alts, key=lambda a: (a.get("connections", 99), a["eta_delta_hours"]))
    return {"proposal": ranked[0]["alternative_id"], ...}
```

## Acceptance criteria

1. `python3 -m py_compile lab/solucion_scratch.py` — no errors.
2. `python3 lab/solucion_scratch.py` — matches `expected.md`.
3. Stdlib only in scratch (no `langchain`, `crewai`, network).
4. `solucion_framework.py` compiles (`py_compile`) with CrewAI + LangGraph.
5. Auto-confirm vs LLM trade-offs table at the end of scratch.
6. Idempotency verified with `assert`.

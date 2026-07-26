# Lab M7 Solution — Multi-Agent Rebooking

---

## Layer ② — `solucion_scratch.py`

### Architecture

```
SupervisorOrchestrator
  ├── PriorityRulesAgent     → P1/P2/P3, simple/complex
  ├── ProfileAgent           → shipment_profiles.json
  ├── PolicyAgent            → rebook_policies.json (simulated PolicyRAG)
  ├── AlternativesAgent      → alternatives.json
  ├── AutoConfirmAgent       → simple branch
  └── FakeLLMAgent           → complex branch (templates)
```

`fan_out()` processes batches of up to `concurrency=16` events — in scratch it is sequential but respects the contract.

### Auto-confirm vs LLM branch

```python
if autoconfirm_agent.can_auto_confirm(track, policy, alternatives, profile):
    # track=simple + obvious option
    ...
else:
    llm_result = llm_agent.analyze(...)
```

**Obvious option** (deterministic):
- A single alternative, or
- Several but the fastest beats the second by ≥ 4h ETA.

### Idempotency

```python
if shipment_id in self._processed:
    return RebookResult(..., handler="deduplicated", ...)
...
self._processed.add(shipment_id)
```

### Verified metrics

- 6 shipments · 3 auto-confirm · 3 LLM · 50% each.

---

## Layer ③ — `solucion_framework.py`

### CrewAI

| Component | Role in rebooking |
|------------|------------------|
| Classifier Agent | `PriorityRulesAgent` |
| Researcher Agent | Profile + Policy + Alternatives via `@tool` |
| Executor Agent | Auto-confirm or LLM proposal |
| `Process.sequential` | Fixed pipeline per shipment |
| External loop | Simulated fan-out |

### LangGraph

| Node | Scratch equivalent |
|------|---------------------|
| `supervisor` | `PriorityRulesAgent` |
| `profile`, `policy`, `alternatives` | Specialist agents |
| `route_after_alternatives` | `if track == "complex"` |
| `autoconfirm` / `llm_specialist` | Final branches |

### CrewAI vs LangGraph trade-offs

| Criterion | CrewAI | LangGraph |
|----------|--------|-----------|
| Flow control | Declarative (tasks) | Explicit (edges) |
| Massive fan-out | External loop | Subgraphs + checkpointer |
| Auditability | Task logs | Trace per node |
| RAGorbit production | Prototype | **Preferred** |

---

## Lessons

1. **Segment before the LLM** — `logic.rules` saves 10–20× in tokens.
2. **Fan-out = stateless** — state in Kafka/DB, not in the agent.
3. **Idempotency is mandatory** — Kafka redelivers events.
4. **Multi-agent scratch** — specialist classes + orchestrator clarify the framework graph.
5. **Same problem, two frameworks** — CrewAI speeds prototyping; LangGraph wins in production.

---

## RAGorbit connection

The scratch maps to:

```
io.event-source → logic.rules → logic.router → agent.fanout
                                                    ├── tool.service × 3
                                                    ├── tool.retriever
                                                    ├── io.notify
                                                    └── observability.audit
```

See [`flow.json`](../../../examples/10-logistics-disruption-rebooking/flow.json).

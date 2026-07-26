# M7 · Solutions — Agents II

---

## Exercise 30

**(a)** Single ReAct agent — one user, conversational flow, few tools; multi-agent would add latency with no benefit.

**(b)** Multi-agent fan-out — 5,000 parallel items with the same logic; `agent.fanout` with stateless sub-agents.

**(c)** Hierarchical multi-agent or CrewAI sequential — distinct cognitive roles (search, summarize, review).

**(d)** Deterministic pipeline — no dynamic tool decision; fixed RAG is cheaper and more predictable.

**(e)** Single ReAct agent — one user; the 3 retrievers are tools of the same agent (agentic RAG, M6).

---

## Exercise 31

**(a)** Hierarchical — manager delegates to specialists.

**(b)** Stateless fan-out — N parallel instances without shared memory.

**(c)** Collaborative — peer-to-peer dialogue (AutoGen).

**(d)** Supervisor — central orchestrator with sequential pipeline of specialists.

---

## Exercise 32

**(a)** `{"priority": "P2", "track": "simple"}` — flexible matches before CRITICAL.

**(b)** `{"priority": "P1", "track": "complex"}` — premium on first rule.

**(c)** `{"priority": "P1", "track": "complex"}` — CRITICAL on third rule (flexible does not apply).

---

## Exercise 33

**(a)** Each sub-agent processes an independent shipment; they do not need context from other shipments; enables horizontal scaling and recovery from crashes.

**(b)** Kafka event log + transactional database (rebook decision by `shipment_id`).

**(c)** Kafka exactly-once (transactions) + DB idempotency by `shipment_id`.

---

## Exercise 34

**(a)** `shipment_id` is never added to `self.processed` after successful processing.

**(b)** `self.processed.append(shipment_id)` (or `self.processed.add(shipment_id)` if it is a set) just before `return result`, after successful `sub_agent`.

---

## Exercise 35

**(a)** `autoconfirm` node.

**(b)** The graph would fail or end without a valid route — dict keys (`"auto"`, `"llm"`) must match **exactly** what the router function returns.

**(c)** `if self.autoconfirm_agent.can_auto_confirm(...):` vs `llm_agent.analyze(...)` in `SupervisorOrchestrator.process_event`.

---

## Exercise 36

**(a)** `Agent` = persistent role with personality and tools; `Task` = concrete work with description and expected output assigned to an agent.

**(b)** Passes the result of previous tasks as context — chaining like memory between steps.

**(c)** Per-shipment rebooking is a linear pipeline (classify → investigate → execute), not a manager that delegates dynamically; hierarchical adds an unnecessary extra LLM.

---

## Exercise 37

**Answer: C — LangGraph fan-out + logic.rules.**

- **A discarded:** emergent conversation, no auditable graph, unreliable exactly-once.
- **B discarded:** hierarchical adds manager overhead; worse for 10k homogeneous items than fan-out.
- **D discarded:** sequential ReAct does not scale to 10k/h nor parallelize; mixes all shipments in one session.

**C wins:** deterministic rules for 60% without LLM, parallel fan-out, explicit edges for audit, checkpointer per `shipment_id`.

---

## Exercise 38

**(a)** Free dialogue between agents (coder + executor) converges iteratively without designing a graph upfront — ideal for exploration.

**(b)** Explicit flow, auditable conditional edges, checkpoints, integration with Kafka/guardrails — regulatory compliance.

**(c)** `add_conditional_edges` with deterministic routing by node name; or `MemorySaver`/checkpointer with `thread_id` per entity.

---

## Exercise 39

**(a)** 74 / 100 = **0.74 (74%)**.

**(b)** 26 × $0.05 = **$1.30**.

**(c)** 100 × $0.05 = $5.00. Savings: $5.00 − $1.30 = **$3.70 (74% of LLM cost avoided)**.

---

## Exercise 40

**(a)** IBM stack — watsonx, enterprise governance, Granite integration.

**(b)** **Plugins** (typed functions/skills that the planner invokes).

---

## Exercise 41

```
Event
  → PriorityRulesAgent (P1/P2/P3, track)
  → ProfileAgent
  → PolicyAgent
  → AlternativesAgent
  → track simple?
        YES → AutoConfirmAgent → notify
        NO → FakeLLMAgent → notify (options to customer)
```

Branch after `AlternativesAgent`, based on `track` and obvious-option rules.

---

## Exercise 42

The function returns `"llm_specialist"` but the routing dict only has key `"llm"`. LangGraph cannot find a route.

**Fix:**

```python
def route(state):
    if state["track"] == "complex":
        return "llm"
    return "autoconfirm"
```

Or change the dict to `{"llm_specialist": "llm_specialist", ...}` and return `"llm_specialist"`.

---

## Exercise 43

**(a)** `thread_id = shipment_id` (one checkpoint per shipment).

**(b)** Histories and state from two different shipments get mixed — incorrect decisions and data leakage between customers.

---

## Exercise 44

**(a)** Three: `ShipmentProfileService`, `AlternativesService`, `AutoConfirmService`.

**(b)** `priority_rules` (`logic.rules`).

**(c)** `16`.

---

## Exercise 45

| Criterion | Auto-confirm | LLM |
|----------|--------------|-----|
| Typical P2 latency | ~1.8–2.1 s | ~5–6 s (P1) |
| Token cost | $0 | ~$0.02–0.08 per shipment |
| SHP-00189 case | Does not apply (goes to LLM) | Proposes ALT-715, options to premium customer |

---

## Exercise 46

**In favor:** separation of concerns — batch reports do not compete with critical worker; different teams can maintain each piece.

**Against:** two observability stacks, duplication of tools/prompts, risk of business logic divergence. Mitigation: shared tools (`@tool`) and a single source of truth in `flow.json`.

---

## Exercise 47

**(a)** **Fan-out** — 50k items/day homogeneous, parallelizable, stateless per return.

**(b)** `logic.rules` (amount/risk), sub-agent with `OrderService`, `PolicyRAG`, `RefundService`, `EscalationService`, `io.notify`, `observability.audit`.

**(c)** Estimate ~65–75% auto-confirm (standard returns below threshold); ~25–35% LLM (high amounts, ambiguous cases, suspected fraud).

**(d)** **LangGraph fan-out** — audit, conditional edges, Kafka. Discard AutoGen — no explicit graph for regulated refunds.

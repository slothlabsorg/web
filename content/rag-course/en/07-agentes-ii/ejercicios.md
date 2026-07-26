# M7 · Exercises — Agents II (Multi-agent)

> **Instructions:** Answer without looking at the solutions. Answers are in `soluciones.md`.

---

## Exercise 30 · Multiple choice (A) — Multi-agent or single?

For each scenario, indicate whether you would use **a single ReAct agent**, **multi-agent**, or **deterministic pipeline**, and justify in one sentence.

**(a)** Airline bot that changes flights (1 user, 4 tools, conversation).

**(b)** Worker that processes 5,000 fraud alerts in parallel with the same logic per alert.

**(c)** Research report: one agent searches the web, another summarizes, another reviews quality.

**(d)** RAG pipeline that always retrieves policies and generates a response (no external tools).

**(e)** Call center copilot with one user and 3 vector indexes as tools.

---

## Exercise 31 · Patterns (A) — Identify the pattern

What multi-agent pattern does each architecture describe?

**(a)** An LLM manager assigns subtasks to researcher, writer, and reviewer.

**(b)** 16 identical sub-agents process Kafka shipments without shared memory.

**(c)** Three agents debate in chat until they agree on a code solution.

**(d)** An orchestrator sequentially calls ProfileService, PolicyRAG, and AutoConfirm.

---

## Exercise 32 · "Predict the output" (P)

Given this classifier (same as template 10):

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

What does it return for each event?

**(a)** `{tier: "standard", connections_lost: 0, delivery_flexibility: "flexible", disruption_severity: "HIGH"}`

**(b)** `{tier: "premium", connections_lost: 0, delivery_flexibility: "fixed", disruption_severity: "LOW"}`

**(c)** `{tier: "standard", connections_lost: 0, delivery_flexibility: "fixed", disruption_severity: "CRITICAL"}`

---

## Exercise 33 · Fan-out (A)

**(a)** Why are `agent.fanout` sub-agents **stateless**?

**(b)** Where does rebooking state persist in template 10?

**(c)** What combination guarantees exactly-once (no double rebook)?

---

## Exercise 34 · "Find the bug" (B)

```python
class FanOut:
    def __init__(self):
        self.processed = []

    def process(self, shipment_id, event):
        if shipment_id in self.processed:
            return "duplicate"
        result = sub_agent(event)
        return result  # Bug: missing something for idempotency

    def run(self, events):
        results = []
        for e in events:
            results.append(self.process(e["shipment_id"], e))
        return results
```

**(a)** What is missing so a Kafka retry does not run `sub_agent` twice?

**(b)** Write the line that would fix the bug.

---

## Exercise 35 · LangGraph (A) — Conditional edges

```python
builder.add_conditional_edges(
    "alternatives",
    lambda s: "llm" if s["track"] == "complex" else "auto",
    {"auto": "autoconfirm", "llm": "llm_specialist"},
)
```

**(a)** If `track="simple"`, which node runs after `alternatives`?

**(b)** If the routing dict used `"autoconfirm"` instead of `"auto"`, what would happen?

**(c)** What is the equivalent in the M7 lab scratch?

---

## Exercise 36 · CrewAI (A)

**(a)** What is the difference between `Agent` and `Task` in CrewAI?

**(b)** What is `context=[previous_task]` for in a Task?

**(c)** Why does the lab use `Process.sequential` and not `hierarchical` for per-shipment rebooking?

---

## Exercise 37 · "Choose the technology" (E)

Brief: Kafka worker that rebooks 10,000 shipments/hour with regulatory audit trail, 60% simple cases auto-confirm.

| Option | Framework |
|--------|-----------|
| A | Conversational AutoGen |
| B | CrewAI hierarchical |
| C | LangGraph fan-out + logic.rules |
| D | Single agent.react with 4 tools |

Choose one option and justify by discarding the other three.

---

## Exercise 38 · AutoGen vs LangGraph (A)

**(a)** Why is AutoGen better for coding agent prototypes?

**(b)** Why is LangGraph better for regulated transactional rebooking?

**(c)** Name one LangGraph mechanism that AutoGen does not offer natively with equal clarity.

---

## Exercise 39 · "Predict the output" (P) — Metrics

A fan-out processes 100 shipments: 74 auto-confirm, 26 LLM.

**(a)** What is the auto-confirm rate?

**(b)** If each LLM call costs $0.05 and auto-confirm $0, what is the total LLM cost?

**(c)** If you invoked LLM on all 100, how much would it cost? Savings vs selective?

---

## Exercise 40 · BeeAI / Semantic Kernel (D)

**(a)** In which enterprise stack does BeeAI make the most sense?

**(b)** Which Semantic Kernel concept roughly corresponds to LangChain `@tool`?

---

## Exercise 41 · Design (D) — Scratch supervisor

Draw (ASCII) the agent sequence in `SupervisorOrchestrator.process_event` from the lab:
from `PriorityRulesAgent` to `AutoConfirmAgent` or `FakeLLMAgent`.

Indicate at which step simple vs complex branches.

---

## Exercise 42 · "Find the bug" (B) — Conditional edge

```python
def route(state):
    if state["track"] == "complex":
        return "llm_specialist"
    return "autoconfirm"

builder.add_conditional_edges("alternatives", route,
    {"llm": "llm_specialist", "autoconfirm": "autoconfirm"})
```

Why does the graph fail when `track="complex"`? Write the fix.

---

## Exercise 43 · Checkpoints (A)

**(a)** In M6, `thread_id` identifies a conversational session. In M7 fan-out, what should `thread_id` be?

**(b)** What happens if two different shipments share the same `thread_id`?

---

## Exercise 44 · RAGorbit integration (A)

Open `examples/10-logistics-disruption-rebooking/flow.json`.

**(a)** How many `tool.service` nodes are there and what are they called?

**(b)** Which node classifies P1/P2/P3 without an LLM?

**(c)** What is the `concurrency` value in `agent.fanout`?

---

## Exercise 45 · Trade-offs (E)

Complete the table for the M7 lab (auto-confirm vs LLM):

| Criterion | Auto-confirm | LLM |
|----------|--------------|-----|
| Typical P2 latency | ? | ? |
| Token cost | ? | ? |
| SHP-00189 case (premium multi-leg) | ? | ? |

---

## Exercise 46 · Framework combination (D)

Is it reasonable to use CrewAI for offline report generation and LangGraph for the Kafka worker of the same product? Argue for and against.

---

## Exercise 47 · End-to-end design (D)

New brief: marketplace with 50,000 returns/day post-Black Friday. Each return: look up order, policy, calculate refund, confirm or escalate.

Design:
**(a)** Fan-out or single agent? Why?
**(b)** List of specialized agents/nodes.
**(c)** What percentage would you estimate auto-confirm vs LLM?
**(d)** Chosen framework and discarded alternative.

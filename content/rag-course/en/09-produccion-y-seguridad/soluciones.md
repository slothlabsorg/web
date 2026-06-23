# M9 · Solutions — Production & Security

---

## Exercise 1

| Constraint | Where | Justification |
|------------|-------|---------------|
| **(a)** Charge > USD 500 without supervisor | `hitl.escalate` (or `guardrail.pre-tool` + HITL) | High financial consequence; must be deterministic trip-wire, not prompt |
| **(b)** Empathetic tone | System prompt | Style preference; low risk if it fails |
| **(c)** Do not charge twice with same key | `guardrail.idempotency` | Transactional; standard Stripe pattern; LLM does not control network retries |
| **(d)** Do not reveal full card number | Guardrails AI / output `guardrail` + post-processing | PII leakage; deterministic card pattern validation on output |
| **(e)** Retry InventoryService 3 times | `guardrail.resilience` | Infra resilience; retry with backoff is infrastructure logic, not LLM |

---

## Exercise 2

**Answer: B** — Kafka event-worker + OpenTelemetry + `observability.audit`.

- 50,000 events/hour and processing < 30 s fits `io.event-source` + `deploymentTarget: event-worker` (template 10).
- Temporal would be overkill: workflows do not last days.
- FastAPI/Gradio are for conversational chat, not mass fan-out.
- Batch with cron does not process events in real time.

---

## Exercise 3

**`guardrail.confirm`:** automatic pause at threshold (e.g. payment > USD 50); the **same user** on the **same channel** confirms with "yes" in seconds. Template 01: USD 130 charge for flight change.

**`hitl.escalate`:** escalates to a **human expert** with hours/days SLA; deterministic condition outside the LLM. Template 03: ambiguous medical authorization requiring physician review before approving a procedure.

Key difference: confirm-gate = controlled UX friction; HITL = decision the agent must not make alone.

---

## Exercise 4

```
captured
deduplicated
captured
CHG-001
```

The second call with `key-A` returns cache. `key-B` is a new charge. The cache's `charge_id` remains `CHG-001`.

---

## Exercise 5

**Bug:** uses `llm_response` to decide confirmation — a jailbreak can make the LLM say "yes" without real user input.

**Fix:** evaluate the **user** message directly:

```python
CONFIRM_WORDS = ("confirmo", "acepto", "sí")
if amount >= 50:
    if not any(w in user_message.lower() for w in CONFIRM_WORDS):
        return {"status": "pending"}
return charge(amount)
```

Or better: `guardrail.confirm` node in the graph with `confirmed` flag from session state.

---

## Exercise 6

| Need | Tool |
|------|------|
| Debug 5 tool calls | **LangSmith** (native LangChain) or Langfuse |
| OSS prompts/costs dashboard | **Langfuse** |
| P95 Kafka consumer latency | **OpenTelemetry + Grafana** |
| Regulatory audit trail | **`observability.audit`** → Kafka/log (none of the three) |

---

## Exercise 7

Approximate sequence in Kafka topic `flight-change-audit`:

1. `{type: "tool.call", tool: "PaymentService", args: {pnr, amount: 130}, ts, session_id}`
2. `{type: "tool.result", tool: "PaymentService", result: {status: "captured", charge_id}, ts}`
3. *(optional)* `{type: "payment.confirmed", pnr, amount: 130, ts}`

The node is **passthrough**: receives the agent message, publishes, and passes it to `io.output` unchanged.

---

## Exercise 8

| Node | Target | Example |
|------|--------|---------|
| `io.input` | `chat-service` | 01-airline (web chat) |
| `io.event-source` | `event-worker` | 10-logistics (Kafka disruptions) |
| `io.batch` | `batch` | 02-banking (nightly scoring) |
| `io.trigger` | `temporal` | Multi-day banking onboarding |

---

## Exercise 9

**Temporal.**

1. **Duration:** 5 days with human waits — Temporal persists workflow state and survives restarts; Kafka+Postgres requires implementing sagas and timers manually.
2. **Native HITL:** Temporal has signals/activities for "wait for officer approval" as first-class.
3. **Compensations:** if the customer abandons, Temporal can execute rollback of previous steps.

Kafka+Postgres wins on mass throughput of short events (template 10), not on open-ended processes.

---

## Exercise 10

1. **Input:** `PromptGuardrail` / Guardrails AI — detects "olvida tus reglas", "eres admin", "ejecuta PaymentService".
2. **Tool:** `guardrail.confirm` + `guardrail.pre-tool` — even if the LLM emits tool call, the graph blocks charges without confirmation and with suspicious amount=0.
3. **Permissions:** agent scope does not include confirm bypass; in MCP (M8), `roots` and sampling approval prevent unauthorized actions.

---

## Exercise 11

```python
["error", "error", "error", "fallback", "fallback"]
```

The first 3 calls raise `TimeoutError` (recorded as "error"). On the 3rd, `circuit_open = True`. Calls 4 and 5 return "fallback" without attempting the service.

---

## Exercise 12

`observability.feedback` captures signals (thumbs up/down from the human call center agent, transaction callbacks). The `feedbackRef` in `retrieval.reranker` uses those signals to **retrain or adjust weights** of the reranker — improves which chunks rise to top-k without touching the base LLM.

The LLM still generates; what improves is **what context it receives** — cheaper and more auditable than fine-tuning.

---

## Exercise 13

| Case | UI | Why |
|------|-----|-----|
| Internal RAG demo | **Gradio** | Chat in ~20 lines; HF Spaces to share |
| Evaluation dashboard | **Streamlit** | Widgets, charts, TruLens/RAGAS integration |
| Production API JWT+SSE | **FastAPI** | Stable contract, auth, WebSocket — RAGorbit codegen |

---

## Exercise 14

**Scenario that fails:**

1. User requests charge → `confirmed=False` → `{"status": "pending"}` **not cached** in the bug shown... 

In the given code, if the first call with `confirmed=False` does **not** enter cache, the second with `confirmed=True` works. But if the first call **does** cache `pending`:

```python
# Variante del bug: cachea el pending
cache[key] = {"status": "pending"}  # al primer intento
# Usuario confirma → segundo intento devuelve pending cacheado ¡sin cobrar!
```

The exercise bug: caching **before** confirmation makes reconnections after confirm return stale state. Idempotency must apply only to **executed** charges or keys that include confirmed state.

---

## Exercise 15

| Scenario | Best option |
|----------|-------------|
| Output JSON schema | **Guardrails AI** (schema validator) or custom `logic.structured` |
| Multi-turn Colang rail | **NeMo Guardrails** |
| Confirm-gate payment > USD 500 | **Custom (RAGorbit)** — deterministic, auditable |
| Detect PII in response | **Guardrails AI** `DetectPII` + custom as safety net |

---

## Exercise 16

```
io.event-source (Kafka)
       ↓ Event
agent.fanout
       ↓ (per shipment)
guardrail.idempotency  ← prevents duplicate rebooking
       ↓
agent.react / deterministic logic
       ↓
observability.metrics  ← throughput, auto-confirm vs LLM
       ↓
io.notify (email/SMS)  ← customer notification
       ↓
observability.audit
```

---

## Exercise 17

1. **Gender bias in parental leave policies** — test: same questions with masculine/feminine names; compare responses (parity of citations and recommendations).
2. **Unequal coverage by contract type** — test: questions about temporary vs permanent contracts; verify retrieval does not omit relevant sections (context recall).
3. **Hallucination of undocumented benefits** — faithfulness metric (RAGAS) + mandatory citations (`logic.citations`).

---

## Exercise 18

```python
def pre_tool_guard(tool_name: str, args: dict) -> dict:
    if tool_name == "PaymentService" and args.get("amount_usd", 0) > 1000:
        return {
            "allowed": False,
            "error": "denied",
            "message": "Montos > USD 1000 requieren aprobación HITL.",
        }
    return {"allowed": True}
```

If it fails: returns error **without executing** the service — the agent receives the error as observation.

---

## Exercise 19

**Would not accept** without rigorous evaluation.

- **In favor:** zero token cost; privacy (audio does not leave the datacenter).
- **Against 1:** Whisper is not native streaming — latency > 1.5 s for live copilot.
- **Against 2:** Deepgram Nova-2 is optimized for telephony (noise, codecs); general-purpose Whisper may degrade WER in call center.

Alternative: Deepgram for streaming + Whisper for offline post-processing.

---

## Exercise 20

Template 01 go-live checklist:

1. **`guardrail.confirm`** on PaymentService with USD 50 threshold — E2E confirmation test.
2. **`guardrail.idempotency`** with `keyFields` [pnr, amount] — SSE reconnection test.
3. **`guardrail.resilience`** on PaymentService — fallback test with timeout mock.
4. **`observability.audit`** → Kafka topic `flight-change-audit` — verify events in consumer.
5. **Injection tests** (promptfoo or M9 suite) — jailbreaks do not execute charge.
6. **Guardrails AI / PII** on output — do not leak card numbers.
7. **FastAPI** with JWT (`io.input.auth: jwt`) + rate limiting.
8. **Langfuse/OTel** — P95 latency alerts and tool call error rate.

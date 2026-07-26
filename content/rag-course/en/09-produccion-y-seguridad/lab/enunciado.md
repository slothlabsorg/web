# Lab M9 · Payment with Guardrails — Production & Security

## Business brief

You are an engineer at the airline in template `01-airline-flight-change`. The M6 ReAct agent already calculates the flight change cost (USD 130) and asks the passenger for confirmation. The **production layer** wrapping `PaymentService` is missing before going to production:

1. **Confirm-gate** — no charge ≥ USD 50 without explicit user confirmation.
2. **Idempotency** — if the client reconnects (SSE/WebSocket) and resends the same charge, it is not charged twice.
3. **Audit** — each charge attempt is recorded on a bus (Kafka in production; in-memory list in the lab).
4. **Anti-injection** — an attacker cannot bypass confirm-gate with a malicious prompt.

This is the same pattern you see in template 01's `flow.json`:

```
tool.service "PaymentService"
  ← guardrail.idempotency
  ← guardrail.confirm
  ← guardrail.resilience
```

And in observability:

```
agent.react → observability.audit → io.output
```

## Available data

In `lab/data/`:

| File | Content |
|------|---------|
| `payment_requests.json` | Charge request for flight change SCL-BOG-001 (USD 130) + thresholds |
| `malicious_prompts.json` | Injection/jailbreak/PII leakage cases + legitimate confirmation input |

## Task

### Part A — Guardrails from scratch (layer ②)

Implement `lab/solution_scratch.py` with **stdlib only**:

1. **`AuditBus`** — in-memory list that publishes events with `type`, fixed `ts`, and payload. Prints `[AUDIT] type: {...}`.

2. **`PromptGuardrail`** — validates user input with deterministic regex patterns (injection, jailbreak, PII leakage). If blocked, publishes `guardrail.prompt_blocked` to the bus.

3. **`IdempotencyStore`** — dictionary `idempotency_key → result`. Second call with the same key returns cached result with `status=deduplicated`.

4. **`GuardedPaymentService`** — wraps a mock `PaymentGateway` with the chain:
   - prompt guard → confirm-gate (USD 50 threshold) → idempotency → charge → audit.

5. **`main()`** with 4 scenarios:
   - **Scenario 1:** request without confirmation → `pending_confirmation`
   - **Scenario 2:** explicit confirmation → `captured` (1st charge)
   - **Scenario 3:** same `idempotency_key` → `deduplicated`
   - **Scenario 4:** malicious prompt → `rejected`

6. **`assert`** at the end verifying properties from `expected.md`.

### Part B — Real frameworks (layer ③, guided task)

> **Read first:** [guide.md §12 — Layer ③ explained](guide.md#12-layer-explained-guardrails-observability-and-uis-with-frameworks-from-scratch).

**Goal:** reimplement the same flow with Guardrails AI, Langfuse, OpenTelemetry, Gradio, and FastAPI.

**Environment requirements** (outside the course machine):

```bash
pip install guardrails-ai langfuse gradio fastapi uvicorn \
            opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
```

**Pieces to implement** (see `solution_framework.py` as reference):

| Scratch piece | Framework |
|---------------|-----------|
| `PromptGuardrail` | Guardrails AI `Guard().use(DetectPII, ToxicLanguage)` |
| `AuditBus` | Langfuse `@observe` + OTel span |
| `IdempotencyStore` | Same dict (or Redis in production) |
| Console `main()` | Gradio `gr.ChatInterface` |
| — | `FastAPI` POST `/v1/payments` (deployment target `chat-service`) |

## Tiered hints

<details>
<summary>Hint 1 — Confirm-gate structure</summary>

Confirm-gate does NOT depend on the LLM. It evaluates a deterministic condition:

```python
needs_confirm = amount_usd >= CONFIRM_THRESHOLD
is_confirmed = req.confirmed or any(w in user_message.lower() for w in CONFIRM_WORDS)
if needs_confirm and not is_confirmed:
    return {"status": "pending_confirmation", ...}
```

</details>

<details>
<summary>Hint 2 — Guardrail chain order</summary>

Order matters. In template 01 the chain over PaymentService is:

```
idempotency → confirm → resilience → PaymentService
```

In the lab (without resilience), the recommended order is:

```
prompt_guard (input) → confirm_gate → idempotency → charge → audit
```

Idempotency goes **after** confirm-gate so unconfirmed attempts are not cached.

</details>

<details>
<summary>Hint 3 — Idempotency key</summary>

Use the `idempotency_key` field from JSON (`idem-SCL-BOG-001-130`). In production, the client sends `Idempotency-Key` in the HTTP header — same concept as Stripe.

</details>

<details>
<summary>Hint 4 — Injection patterns</summary>

You do not need an LLM to detect injection in the lab. A regex list is enough:

```python
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?instructions",
    r"without\s+confirmation",
    r"execute\s+paymentservice",
    ...
]
```

In production, combine regex + Guardrails AI + automated tests (promptfoo).

</details>

<details>
<summary>Hint 5 — Minimum audit events</summary>

Publish at least these types:

- `payment.request_received` — each attempt
- `guardrail.confirm_pending` — confirm-gate activated
- `tool.call` / `tool.result` — charge executed
- `payment.deduplicated` — idempotency activated
- `guardrail.prompt_blocked` — injection blocked

</details>

## Success criteria

See [`expected.md`](expected.md). Summary:

| Scenario | Expected `status` |
|----------|-------------------|
| Without confirmation | `pending_confirmation` |
| 1st confirmed charge | `captured` |
| Retry same key | `deduplicated` |
| Malicious prompt | `rejected` |

Also: exactly **1** `tool.call` (one real charge) and **≥ 1** total audit event.

## Verification

```bash
python3 -m py_compile solution_scratch.py
python3 solution_scratch.py
```

Output must match `expected.md`.

## Connection to RAGorbit

Open [`examples/01-airline-flight-change/flow.json`](../../examples/01-airline-flight-change/flow.json) and locate:

- `guardrail.idempotency`, `guardrail.confirm`, `guardrail.resilience` on `PaymentService`
- `observability.audit` with `sink: kafka`

After this lab, you will be able to explain **why** each guardrail is in that order and what would happen if any were missing.

# M9 Lab Solution — Payment with Guardrails

---

## Layer ② — From-scratch solution (`solution_scratch.py`)

### Overall architecture

```
User input
       ↓
[PromptGuardrail.validate]  → if blocked → rejected + audit
       ↓
[GuardedPaymentService.process]
       ├─ audit: payment.request_received
       ├─ [Confirm-gate]  → if amount ≥ threshold and not confirmed → pending_confirmation
       ├─ [IdempotencyStore.get]  → if exists → deduplicated + audit
       ├─ [PaymentGateway.charge]  → captured
       └─ audit: tool.call + tool.result + idempotency.put
```

### Why order matters

1. **Prompt guard first** — no point auditing or evaluating confirm-gate if input is already malicious.
2. **Confirm-gate before idempotency** — if you cache an unconfirmed attempt, a legitimate retry would return cached `pending_confirmation` instead of allowing charge after confirmation.
3. **Idempotency before charge** — avoids executing the gateway twice; it is the Stripe `Idempotency-Key` pattern.
4. **Audit at each step** — passthrough like RAGorbit's `observability.audit`: publishes and lets data through.

### Deterministic confirm-gate

```python
needs_confirm = req.amount_usd >= CONFIRM_THRESHOLD  # USD 50
is_confirmed = req.confirmed or self._user_confirmed(req.user_message)
```

The LLM does **not** decide whether the charge requires confirmation. The graph's `guardrail.confirm` node evaluates `amount_usd >= 50` deterministically — same as here.

### Idempotency

```python
cached = self.idempotency.get(req.idempotency_key)
if cached is not None:
    return {**cached, "status": "deduplicated", ...}
# ... real charge ...
self.idempotency.put(req.idempotency_key, result)
```

In production, this dict would be Redis with 24h TTL or a Postgres table with `UNIQUE(idempotency_key)` constraint.

### Anti-injection with regex

For the lab, regex patterns are sufficient and deterministic. In production:

- Regex for known patterns (fast, cheap).
- Guardrails AI / NeMo for toxicity, PII, and semantic jailbreaks.
- Automated tests with promptfoo or custom suite (like Scenario 4).

### Verified results

| Scenario | status | Real charge |
|----------|--------|-------------|
| Without confirmation | `pending_confirmation` | No |
| Confirmed | `captured` | Yes (once) |
| Retry | `deduplicated` | No |
| Injection | `rejected` | No |

---

## Layer ③ — Framework solution (`solution_framework.py`)

### Scratch → framework bridge table

| Scratch | Framework | Block in solution_framework.py |
|---------|-----------|--------------------------------|
| `PromptGuardrail` | Guardrails AI `Guard().use(DetectPII, ToxicLanguage)` | Block 1 |
| `AuditBus` | Langfuse `@observe` | Block 2 |
| Throughput metrics | OpenTelemetry `Counter` | Block 3 |
| Console `main()` | Gradio `ChatInterface` | Block 4 |
| — | FastAPI `POST /v1/payments` | Block 5 |

### Guardrails AI vs custom

- **Custom (scratch/RAGorbit):** financial business rules — confirm-gate, idempotency, thresholds. Deterministic, auditable.
- **Guardrails AI:** *content* validation — PII, toxicity, format. Complements, does not replace, graph guardrails.

### Langfuse vs AuditBus

`AuditBus` records business events (`payment.deduplicated`). Langfuse records *traces* of the `process_payment_framework` function — latency, tokens (if there were an LLM), metadata. In production you use both: regulatory audit in Kafka + Langfuse for debugging.

### Gradio vs FastAPI

- **Gradio:** prototype and internal demos (~20 lines for a chat).
- **FastAPI:** production with API contract, JWT auth, SSE/WebSocket — what RAGorbit generates with `deploymentTarget: chat-service`.

### What the framework does NOT do that scratch does

`solution_framework.py` does not implement `guardrail.resilience` (circuit breaker). That would be added with `tenacity` or at service mesh level (Istio). Template 01 has it on PaymentService for payment APIs with variable availability.

---

## Key lessons

1. **Financial constraints go in the graph, not the prompt.** "Do not charge without confirmation" in the system prompt is insufficient; a jailbreak ignores it.
2. **Idempotency is mandatory on channels with reconnection** (SSE, WebSocket, mobile).
3. **Audit is passthrough** — does not modify the flow, only observes. Critical for regulation (airlines, banking, healthcare).
4. **AI security has layers:** input (injection), tools (pre-tool, confirm), output (PII in response), permissions (MCP M8).

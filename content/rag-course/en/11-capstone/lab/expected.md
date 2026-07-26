# Expected — M11 · Capstone · Template 09 (scratch)

> Concrete result when running `python3 solution_scratch.py` from the `lab/` directory.
> Generated with the script's actual output — if your solution matches, you're on track.

---

## Test query

```
How many vacation days am I entitled to if I have been at the company for 3 years?
```

---

## Pipeline summary

| Stage | Expected result |
|-------|-------------------|
| Indexed chunks | 8 |
| Retrieved topK | 4 (template 09 uses topK=4) |
| Indices (0-based) | `1, 0, 7, 3` |
| Similarities | `0.5080, 0.4397, 0.3384, 0.3215` |
| `citations_ok` | `True` |
| Days in response | **18 business days** |
| Cited source | Vacation Policy §3 |

---

## Top-4 retrieved chunks

| Position | Index (0-based) | Similarity | Source |
|----------|-----------------|-----------|--------|
| 1 | 1 | 0.5080 | VACATION POLICY §4 — Additional vacation by seniority |
| 2 | 0 | 0.4397 | VACATION POLICY §3 — Accrual and usage |
| 3 | 7 | 0.3384 | TRAINING POLICY §1 — Professional development |
| 4 | 3 | 0.3215 | LEAVE POLICY §2 — Maternity and paternity leave |

**Exact printed lines:**
```
Retrieved indices (0-based): 1, 0, 7, 3
Similarities:                 0.5080, 0.4397, 0.3384, 0.3215
```

---

## Final response (fake_llm + logic.citations enforce)

```
After **3 full years of seniority** you are entitled to **18 business days** of annual vacation.

> Source: Vacation Policy §3 — Accrual and usage

citations_ok: True
citations:    ['VACATION POLICY §4 — Additional vacation by seniority', 'VACATION POLICY §3 — Accrual and usage', 'TRAINING POLICY §1 — Professional development']
```

---

## Acceptance criteria — Challenge 1 (template 09 scratch)

Your `solution_scratch.py` **passes** if:

1. Runs with `python3 solution_scratch.py` without external dependencies.
2. Indexes exactly **8** chunks from `data/hr_policies.txt`.
3. For the vacation/3 years query, retrieved indices are **`1, 0, 7, 3`** (order and values).
4. Similarities match to **4 decimal places**: `0.5080, 0.4397, 0.3384, 0.3215`.
5. Final response mentions **18 business days** and a **source** (§3 or equivalent).
6. `citations_ok` is `True`.

---

## Acceptance criteria — Challenge 1 (templates 02 and 01)

There is no executable reference script here (higher complexity). Your deliverable passes if:

### Template 02 (banking)

- Processes `data/applicants/applicant_001/` and emits JSON with `score`, `decision`, `factors`, `justification`.
- `logic.rules` overrides `decision`: score ≥ 70 → `"approve"` (deterministic, not delegated to LLM).
- Hard-filters by `doc_type`/`period` avoid mixing files.
- Each factor in `factors` references a document from the file.

### Template 01 (airline)

- ReAct agent with at least: `PolicyRAG`, `ReservationService`, `InventoryService`, `PricingService`, `PaymentService`.
- Guardrail chain on Payment: `idempotency → confirm → resilience`.
- Second charge with same `(pnr, session_id)` returns `deduplicated`.
- Charge > USD 500 requires confirmation before execution.
- At least one audit event per session with tool calls recorded.

---

## Acceptance criteria — Challenge 2 (new design)

Your `flow.json` + diagram + justification pass if:

1. **RAGorbit validation:** 0 contract errors when clicking Validate.
2. **Test with mocks:** answers at least 2 of the 3 questions in `data/brief_telemedicine.json`.
3. Includes: retrieval with hard-filters, mandatory citations, HITL escalation, and audit.
4. Justifies each node against an alternative from [`compared-technologies.md`](../../referencia/tecnologias-comparadas.md).

---

## Acceptance criteria — Challenge 3 (defense)

Expert rubric (detail in `solucion.md`):

| Dimension | Minimum to pass |
|-----------|---------------------|
| Technical correctness | Explains ports and nodes without contract errors |
| Justification | Each decision has explicit trade-off |
| Production | Mentions idempotency, audit, or latency as appropriate |
| Security | Identifies PHI/PII, hard filters, or guardrails |
| Clarity | Readable diagram + defense in < 15 minutes |

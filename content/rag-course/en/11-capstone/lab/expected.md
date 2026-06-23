# Expected — M11 · Capstone · Template 09 (scratch)

> Concrete result when running `python3 solucion_scratch.py` from the `lab/` directory.
> Generated with the script's actual output — if your solution matches, you're on track.

---

## Test query

```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
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
| Days in response | **18 días hábiles** |
| Cited source | Política de Vacaciones §3 |

---

## Top-4 retrieved chunks

| Position | Index (0-based) | Similarity | Source |
|----------|-----------------|-----------|--------|
| 1 | 1 | 0.5080 | POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad |
| 2 | 0 | 0.4397 | POLÍTICA DE VACACIONES §3 — Acumulación y disfrute |
| 3 | 7 | 0.3384 | POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional |
| 4 | 3 | 0.3215 | POLÍTICA DE PERMISOS §2 — Permiso por maternidad y paternidad |

**Exact printed lines:**
```
Índices recuperados (0-based): 1, 0, 7, 3
Similitudes:                   0.5080, 0.4397, 0.3384, 0.3215
```

---

## Final response (fake_llm + logic.citations enforce)

```
Después de **3 años completos de antigüedad** tienes derecho a **18 días hábiles** de vacaciones anuales.

> Fuente: Política de Vacaciones §3 — Acumulación y disfrute

citations_ok: True
citations:    ['POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad', 'POLÍTICA DE VACACIONES §3 — Acumulación y disfrute', 'POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional']
```

---

## Acceptance criteria — Challenge 1 (template 09 scratch)

Your `solucion_scratch.py` **passes** if:

1. Runs with `python3 solucion_scratch.py` without external dependencies.
2. Indexes exactly **8** chunks from `datos/politicas_rrhh.txt`.
3. For the vacation/3 years query, retrieved indices are **`1, 0, 7, 3`** (order and values).
4. Similarities match to **4 decimal places**: `0.5080, 0.4397, 0.3384, 0.3215`.
5. Final response mentions **18 días hábiles** and a **source** (§3 or equivalent).
6. `citations_ok` is `True`.

---

## Acceptance criteria — Challenge 1 (templates 02 and 01)

There is no executable reference script here (higher complexity). Your deliverable passes if:

### Template 02 (banking)

- Processes `datos/applicants/applicant_001/` and emits JSON with `score`, `decision`, `factores`, `justificacion`.
- `logic.rules` overrides `decision`: score ≥ 70 → `"aprobar"` (deterministic, not delegated to LLM).
- Hard-filters by `doc_type`/`period` avoid mixing files.
- Each factor in `factores` references a document from the file.

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
2. **Test with mocks:** answers at least 2 of the 3 questions in `datos/brief_telemedicina.json`.
3. Includes: retrieval with hard-filters, mandatory citations, HITL escalation, and audit.
4. Justifies each node against an alternative from [`tecnologias-comparadas.md`](../../referencia/tecnologias-comparadas.md).

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

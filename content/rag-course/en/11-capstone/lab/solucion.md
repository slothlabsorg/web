# M11 · Capstone lab solutions

> Explanation of the 09→02→01 path, scratch/framework reference solution, Challenge 2 reference design, and expert rubric.

---

## 1. Reconstruction path 09 → 02 → 01

### 1.1 Why this order

| Step | Template | New skill | Nodes added vs previous |
|------|----------|-----------------|-------------------------------------|
| 1 | 09 HR | Linear RAG + citations | io, loader, ingest, store, retrieval, model, logic |
| 2 | 02 Banking | Batch + metadata + rules | io.batch, loader.tabular, ingest.metadata, logic.structured, logic.rules, pgvector |
| 3 | 01 Airline | Agent + guardrails + RAG-tool | agent.react, tool.*, guardrail.*, observability.audit |

If 09 does not pass tests, do not advance: it is the **MV-RAG** everything depends on.

### 1.2 Dependency mental map

```
09:  embed → retrieve → prompt → cite
      ↓
02:  + metadata filter + structured JSON + rules (deterministic)
      ↓
01:  + agent loop + tools + PolicyRAG + guardrails + audit
```

---

## 2. Scratch solution — Template 09

### 2.1 Script architecture

`solucion_scratch.py` implements the full template 09 pipeline with stdlib:

| Block | Equivalent RAGorbit node |
|--------|---------------------------|
| `load_chunks()` | `loader.pdf` + `ingest.chunker` |
| `embed()` + `VectorStore` | `model.embedding` + `store.chroma` |
| `store.retrieve()` | `retrieval.vector` (topK=4) |
| `build_prompt()` | `logic.prompt` |
| `fake_llm()` | `model.llm` (deterministic stub) |
| `apply_citations()` | `logic.citations` enforce |

### 2.2 Why bag-of-words returns indices 1, 0, 7, 3

Chunk §4 (index 1) repeats "years" and "days" more often than §3 (index 0), even though §3 contains the exact answer ("18 days at 3 years"). This is **intentionally pedagogical**: it demonstrates the toy embedding limitation and justifies real `model.embedding` in production.

The `fake_llm` looks for the "3 years" + "18 days" pattern in chunks and produces the correct response with §3 citation.

### 2.3 Verification

```bash
cd lab && python3 solucion_scratch.py
```

Must match [`expected.md`](expected.md).

---

## 3. Framework solution — Template 09

See [`solucion_framework.py`](solucion_framework.py) block by block with [guide §12](../guia.md#12-layer--explained-how-to-rebuild-a-template-with-a-framework).

**Scratch → LangChain correspondence summary:**

| Scratch | Framework |
|---------|-----------|
| `load_chunks()` | `TextLoader` + `CharacterTextSplitter` |
| `embed()` | `OpenAIEmbeddings` |
| `VectorStore` | `Chroma.from_documents()` |
| `store.retrieve()` | `retriever.invoke()` |
| `build_prompt()` | `ChatPromptTemplate` |
| `fake_llm()` | `ChatOpenAI` / `ChatAnthropic` |
| `apply_citations()` | `enforce_citations()` post-chain |

---

## 4. Reconstruction guide — Template 02 (banking)

### 4.1 Scratch — additional pieces

1. **Multiple loaders:** read `declaracion_2023.txt`, `estado_cuenta_q3.txt`, `datos_financieros.csv` from `datos/applicants/applicant_001/`.
2. **Metadata:** each chunk carries `doc_type` and `period`.
3. **Hard-filter:** `retrieve(query, filters={"period": "2023"})`.
4. **Structured stub:**

```python
def fake_structured_llm(chunks) -> dict:
    return {
        "score": 72,
        "decision": "approve",  # will be overridden
        "factors": [
            "Income $85,000 [declaracion_2023.txt §Income]",
            "On-time payments 97% [estado_cuenta_q3.txt §History]",
            "Debt-to-income ratio 14% [datos_financieros.csv]",
        ],
        "justification": "Solid profile documented in file 001.",
    }
```

5. **Rules:**

```python
def apply_rules(result: dict) -> dict:
    s = result["score"]
    if s >= 70:
        result["decision"] = "approve"
    elif s >= 40:
        result["decision"] = "review"
    else:
        result["decision"] = "reject"
    return result
```

### 4.2 Framework

- `CSVLoader` + `TextLoader` → `RecursiveCharacterTextSplitter`
- `PGVector` with `filter` on retriever
- `llm.with_structured_output(CreditDecision)` (M5)
- `apply_rules()` after invoke

---

## 5. Reconstruction guide — Template 01 (airline)

### 5.1 Scratch — ReAct structure

Reuses patterns from [`06-agentes-i/lab/solucion_scratch.py`](../../06-agentes-i/lab/solucion_scratch.py):

```python
TOOLS = {
    "ReservationService": get_itinerary,
    "policy_rag": policy_rag,  # with hard-filters
    "InventoryService": search_flights,
    "PricingService": calculate_delta,
    "PaymentService": wrapped_payment,  # idempotency→confirm→resilience
}
```

**Turn 1:** user requests change → agent queries PNR → PolicyRAG → inventory → pricing → informs cost + asks for confirmation.

**Turn 2:** user confirms → PaymentService → `captured` → audit log.

**Turn 3 (same pnr+session):** PaymentService → `deduplicated`.

### 5.2 Framework

- LangGraph `StateGraph` (M6 §8)
- `@tool` for each service
- `MemorySaver` + `thread_id` for multi-turn
- Audit callback on each tool call

---

## 6. Reference design — Challenge 2 (telemedicine)

Brief: [`datos/brief_telemedicina.json`](datos/brief_telemedicina.json).

### 6.1 Proposed diagram

```
[INGESTION]
  loader.pdf (guidelines by plan)
    → ingest.chunker (by-section)
    → ingest.metadata (plan, condition, effective_date)
    → store.pgvector (clinical_guidelines)
    ← model.embedding (local: true)

[RUNTIME]
  io.stt ──Message──▶ model.intent ──Query──▶ query.rewrite
  io.input ──Message──┘                              │
                                                     ▼
  PatientHistoryService (tool.service) ◀── agent.react ──▶ tool.retriever (GuidelinesRAG)
                              │              ▲              hardFilters: plan, condition
                              │              └── model.llm
                              ▼
                        logic.citations (enforce)
                              ▼
                        hitl.escalate (high severity | no criteria)
                              ▼
                        io.panel (cite: true)
                              ▼
                        observability.audit (HIPAA-safe)
```

### 6.2 Key justifications

| Decision | Why | Discarded alternative |
|----------|---------|------------------------|
| `agent.react` | Unpredictable order: coverage → guideline → escalation | Fixed pipeline — does not combine EHR + guidelines dynamically |
| hardFilters plan/condition | PHI + clinical precision | Prompt "search only PPO" — anti-pattern |
| `model.embedding local: true` | PHI does not leave VPC | OpenAI embeddings — violates constraint |
| `io.panel` | Side copilot <2s (template 07) | `io.output` to patient — interrupts video call |
| `hitl.escalate` | Compliance for critical cases | LLM decides to escalate — anti-pattern |

### 6.3 Validation

Import `flow.json` in RAGorbit → Validate → Test with mocks using the 3 brief questions.

---

## 7. Expert rubric (Challenge 3)

### 7.1 Scale by dimension (1–4)

| Points | Correctness | Justification | Production | Security | Clarity |
|--------|-------------|---------------|------------|-----------|----------|
| 4 | 0 contract errors; correct nodes | Each node with trade-off and alternative | idempotency/audit/latency covered | PHI, hard-filters, guardrails | Impeccable diagram + defense |
| 3 | 1 minor error | Mostly justified | 2/3 aspects | 1 minor gap | Understandable with questions |
| 2 | Port errors | Vague justifications | Only mentions "production" | Omits PHI | Confusing in parts |
| 1 | Invalid graph | No alternatives | No ops consideration | No security | Not defensible |

### 7.2 Expert threshold

- **Challenge 1:** 3 templates with tests equivalent to codegen mocks.
- **Challenge 2:** valid flow + justification ≥ 3 on each dimension.
- **Challenge 3:** exam ≥ 40/50 + average defense ≥ 3.0/4.0.

### 7.3 Defense trap questions

1. "Why didn't you put `logic.rules` in telemedicine?" — Answer: there is no single numeric threshold; clinical decision is HITL escalation, not automatic approve/reject.
2. "Where is the filters-in-prompt anti-pattern?" — Point to hardFilters in GuidelinesRAG.
3. "What goes in CI vs nightly?" — rules/guardrails in CI; faithfulness RAGAS nightly.

---

## 8. Common errors and how to avoid them

| Error | Symptom | Fix |
|-------|---------|-----|
| No hard-filters in 02 | Chunks from another file | metadata + filter in retrieve |
| LLM decides approve/reject | decision inconsistent with score | `logic.rules` after |
| Payment without wrappers | double charge | idempotency→confirm chain |
| Citations only in prompt | hallucination without source | `logic.citations` enforce |
| Agent for 50k events | timeout/cost | fan-out + rules |

---

⬅️ [Brief](enunciado.md) · [Expected](expected.md) · [Guide](../guia.md)

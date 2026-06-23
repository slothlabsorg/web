# M11 · Capstone — Integrative lab brief

> **Estimated duration:** 24–32 hours (3–4 full-time days).
> **Prerequisite:** completed M0–M10 (or at least M1–M6 + M9 for challenges 1 and 3).
> **Tri-modal method:** each challenge requires design (①), scratch implementation (②), and framework version (③) where applicable.

---

## Context

You have completed the RAG & Agentic AI curriculum. This capstone validates that you can:

1. **Rebuild** real architectures from scratch (the 3 plan templates: 09 → 02 → 01).
2. **Design** a new architecture given a business brief.
3. **Defend** your decisions using the course expert rubric.

All reference material is in [`../../referencia/plantillas-mapeadas.md`](../../referencia/plantillas-mapeadas.md) and the `flow.json` files in [`../../examples/`](../../examples/).

---

## Challenge 1 · Rebuild 3 templates (09 → 02 → 01)

### Objective

Implement in **scratch (stdlib)** and **framework (LangChain/LangGraph)** the three templates in increasing difficulty order. The reference script `solucion_scratch.py` rebuilds **09** and should serve as your model; you complete 02 and 01.

### Mandatory order

```
09 HR (linear RAG)  →  02 Banking (batch + rules)  →  01 Airline (agent + guardrails)
```

### Part A — Template 09 (`examples/09-hr-policy-assistant/`)

**Read:** `flow.json` + template README.

**Your scratch deliverable (`tu_scratch_09.py` or extension of `solucion_scratch.py`):**

- Pipeline: loader → chunker → embed → store → retrieve → prompt → LLM stub → citations enforce.
- Data: `datos/politicas_rrhh.txt`.
- Must match [`expected.md`](expected.md) (indices, similarities, response with 18 days).

**Your framework deliverable (`tu_framework_09.py`):**

- LangChain + Chroma following [guide §12](../guia.md#12-layer--explained-how-to-rebuild-a-template-with-a-framework).
- Compare block by block with `solucion_framework.py`.

### Part B — Template 02 (`examples/02-banking-credit-scoring/`)

**Read:** `flow.json` + README. Mock data: `datos/applicants/applicant_001/`.

**Scratch:**

- Two loaders (PDF/txt + tabular CSV) converge in chunker.
- Metadata `doc_type` and `period` on each chunk.
- In-memory vector store with hard-filters.
- LLM stub that emits JSON with `score`, `factores`, `justificacion`.
- Deterministic `logic.rules`: ≥70 approve, 40–69 review, <40 reject.
- **The final decision is NOT made by the LLM** — `logic.rules` overrides it.

**Framework:**

- Structured output with Pydantic schema (M5).
- pgvector or Chroma with metadata filters (M3/M4).

**Criterion:** output JSON for `applicant_001` with `decision: "aprobar"` and score ≥ 70.

### Part C — Template 01 (`examples/01-airline-flight-change/`)

**Read:** `flow.json` + README. Reuse stubs from M6 (`06-agentes-i/lab/datos/`).

**Scratch:**

- ReAct agent with Thought → Action → Observation loop.
- Tools: PolicyRAG (retriever with hard-filters fare_class/route_type), Reservation, Inventory, Pricing, Payment.
- Guardrails on Payment: idempotency → confirm (>500) → resilience (stub).
- In-memory audit log (event list).
- Two turns: change request → confirmation → idempotent charge.

**Framework:**

- LangGraph `StateGraph` or `create_react_agent` (M6 §8).
- Same verifiable tool call sequence.

**Criterion:** see [`expected.md` § Template 01](expected.md#acceptance-criteria--challenge-1-templates-02-and-01).

### Tiered hints

<details>
<summary>Hint 1 — Where do I start with 09?</summary>

Open `solucion_scratch.py` and run `python3 solucion_scratch.py`. If the output matches `expected.md`, you understand the skeleton. Then rewrite it yourself without copying.
</details>

<details>
<summary>Hint 2 — 02 mixes files</summary>

Most common anti-pattern: retrieve chunks from another applicant. Solution: hard-filters in metadata (`doc_type`, `period`, `applicant_id`) **before** vector similarity — same as `retrieval.vector` with `hardFilters` in flow.json.
</details>

<details>
<summary>Hint 3 — The 01 agent charges twice</summary>

Implement `guardrail.idempotency` as a wrapper on the Payment tool: key `(pnr, session_id)`, TTL 24h, second call returns cached response with status `deduplicated`.
</details>

<details>
<summary>Hint 4 — Framework for 01</summary>

Start with the M6 graph (`06-agentes-i/lab/solucion_framework.py`) and add service tools + guardrail chain. PolicyRAG is `tool.retriever` — a retriever wrapped as an invocable function.
</details>

---

## Challenge 2 · Design new architecture

### Business brief

Read [`datos/brief_telemedicina.json`](datos/brief_telemedicina.json): telemedicine copilot for SaludPlus Seguros.

### Your deliverable

1. **ASCII diagram** of the flow (ingestion + runtime) with labeled ports.
2. **Valid `flow.json`** importable in RAGorbit (0 errors on Validate).
3. **Justification document** (1–2 pages) that for each node explains:
   - Why you chose it.
   - Which alternative you discarded and why (table from [`tecnologias-comparadas.md`](../../referencia/tecnologias-comparadas.md)).
   - How it meets brief constraints (PHI, latency, HITL, audit).

### Minimum expected nodes

| Category | At least one of |
|-----------|-----------------|
| Ingestion | `loader.pdf`, `ingest.chunker`, `ingest.metadata` |
| Store/Retrieval | `store.pgvector` or `store.multi-index`, `retrieval.vector` with hardFilters |
| Agent or pipeline | `agent.react` or pipeline with `query.rewrite` + `retrieval.router` |
| Logic | `logic.citations` enforce |
| Production | `hitl.escalate`, `observability.audit` |
| IO | `io.panel` or `io.input` + `io.stt` (optional) |

### Hints

<details>
<summary>Hint — Which templates to look at?</summary>

Combine patterns from:
- [03-healthcare-prior-auth](../../examples/03-healthcare-prior-auth/) — agentic RAG + HITL
- [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/) — side panel + low latency
- [08-manufacturing-maintenance-rag](../../examples/08-manufacturing-maintenance-rag/) — critical hard-filters
</details>

---

## Challenge 3 · Design defense + integrative exam

### Part A — Oral/written defense (15 minutes)

Present your Challenge 2 solution to a "technical committee" (peer, mentor, or yourself recording). Cover:

1. Diagram and walkthrough of `flow.json` node by node.
2. One anti-pattern you **avoided** and how you avoided it in the design.
3. How you would test the system in production (eval + system tests).
4. One security scenario (PHI, prompt injection) and your mitigation.

### Part B — Integrative exam

Answer all **50 questions** in [`ejercicios.md`](../ejercicios.md) without looking at [`soluciones.md`](../soluciones.md).

**Suggested passing threshold:** ≥ 40/50 (80%) with reasoned justification on open questions.

### Expert rubric

| Dimension | Weight | Excellence indicators |
|-----------|------|---------------------------|
| **Correctness** | 25% | Correct nodes, compatible ports, coherent pipeline |
| **Justification** | 25% | Explicit trade-offs; discarded alternatives with reason |
| **Production** | 20% | Idempotency, audit, latency, appropriate deployment target |
| **Security** | 15% | Hard filters, guardrails, PHI/PII, do not delegate thresholds to LLM |
| **Clarity** | 15% | Readable diagram, structured defense, maintainable documentation |

**Passed as expert:** Challenge 1 complete (3 templates) + Challenge 2 validated in RAGorbit + Challenge 3 ≥ 80% exam + satisfactory defense on all 5 dimensions.

---

## Deliverables

```
tu-capstone/
  reto1/
    scratch_09.py
    scratch_02.py
    scratch_01.py
    framework_09.py
    framework_02.py
    framework_01.py
  reto2/
    diagrama.txt
    flow.json
    justificacion.md
  reto3/
    defensa.md (or video/script)
    ejercicios_resueltos.md
```

---

## Checkpoint

**You know it if you can:**

- [ ] Run your 09 scratch and get the output from `expected.md`.
- [ ] Explain why `logic.rules` goes **after** `logic.structured` in 02.
- [ ] Draw the 01 guardrail chain without looking at the README.
- [ ] Validate your Challenge 2 `flow.json` in RAGorbit without errors.
- [ ] Answer ≥ 40/50 integrative exam questions.

⬅️ [Module guide](../guia.md) · [Reference solutions](solucion.md)

# Industry templates — pedagogical mapping

> The **10 templates** in `examples/` are complete business cases expressed as **Flow IR** (JSON). This document explains what problem each one solves, which nodes it uses, which course modules cover it, and what you learn by rebuilding it. Technical node sheets: [`catalogo-nodos.md`](./catalogo-nodos.md).

---

## What a template is and how to read it

A **template** in RAGorbit is an example project ready to open on the canvas: a `flow.json` file describing a node graph and its connections. That JSON is the **Flow IR** (Intermediate Representation): the source of truth that codegen translates to Python (`app/`, `mocks/`, `tests/`).

**How to read a `flow.json`:**

1. **`flow`** — metadata: `id`, `name`, `deploymentTarget` (chat-service, batch, event-worker…). The entry node is set automatically.
2. **`nodes[]`** — each entry has `id`, `type` (e.g. `retrieval.vector`), `label`, and `config`.
3. **`edges[]`** — connections between ports: `source` → `target` with `sourcePort` and `targetPort`. Port types (`Message`, `Chunks`, `Tool`, `Retriever`…) must be compatible.
4. **`secrets[]`** — required environment variable names (never values).

For the full port contract and deployment targets, see [`docs/01-concepts.md`](../../docs/01-concepts.md). For the 53 node types and their config fields, [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md).

**In the course:** each template anchors to one or more modules (M0–M11). Capstone difficulty order is **09 → 02 → 01** (see final section).

---

## Summary table

| # | Template | Industry | Business problem | Key nodes (`type`) | Modules where mastered | Main architectural pattern |
|---|----------|----------|------------------|-------------------|------------------------|---------------------------|
| 09 | [HR](../../examples/09-hr-policy-assistant/) | Human Resources | Employees ask repetitive policy questions; HR loses time | `io.input`, `loader.pdf`, `ingest.chunker`, `store.chroma`, `retrieval.vector`, `logic.prompt`, `logic.citations` | M1, M2, M3 | **Minimal conversational RAG** (one index, mandatory citations) |
| 02 | [Banking](../../examples/02-banking-credit-scoring/) | Banking / credit | Evaluate heterogeneous files (PDF + CSV) with auditable decision | `io.batch`, `loader.pdf`, `loader.tabular`, `store.pgvector`, `retrieval.vector`, `logic.structured`, `logic.rules` | M2, M3, M4, M5 | **Batch RAG + structured output + deterministic rules** |
| 04 | [Insurance](../../examples/04-insurance-claims/) | Insurance | Adjudicate claims (policy + photos) with cited clause | `io.batch`, `loader.multimodal`, `model.vision`, `logic.rules`, `logic.structured` | M2, M4, M5, M10 | **Multimodal ingestion + rules + JSON with citations** |
| 05 | [Legal](../../examples/05-legal-contract-review/) | Legal / compliance | Review contract vs playbook, regulations, and precedents | `store.multi-index`, `retrieval.router`, `retrieval.reranker`, `logic.structured`, `logic.citations` | M4 | **Multi-index routing + rerank + dual citations** |
| 08 | [Manufacturing](../../examples/08-manufacturing-maintenance-rag/) | Aerospace MRO | Query AMM with filters by aircraft/ATA chapter | `loader.multimodal`, `model.vision`, `retrieval.vector`, `logic.prompt`, `hitl.escalate` | M2, M4, M9, M10 | **Multimodal technical RAG + hard-filters + HITL** |
| 03 | [Healthcare](../../examples/03-healthcare-prior-auth/) | Healthcare / payers | Clinical prior authorization with plan-filtered guidelines | `retrieval.vector`, `tool.retriever`, `agent.react`, `logic.citations`, `hitl.escalate` | M4, M5, M6, M9 | **Agentic RAG + hard filters + citations + escalation** |
| 07 | [Telecom](../../examples/07-telecom-callcenter-copilot/) | Telecom / call center | Real-time copilot for human agent on call | `io.stt`, `model.intent`, `query.rewrite`, `retrieval.router`, `io.panel`, `observability.feedback` | M4, M6, M7, M9, M10 | **Voice pipeline + intent gate + multi-index + feedback loop** |
| 06 | [Retail](../../examples/06-retail-postsale-bot/) | E-commerce | Post-sale: orders, returns, recommendations | `agent.react`, `tool.service`, `guardrail.confirm`, `guardrail.idempotency`, `observability.audit` | M6, M9 | **Transactional ReAct agent** (no inline RAG; tools + guardrails) |
| 10 | [Logistics](../../examples/10-logistics-disruption-rebooking/) | Logistics / last mile | Mass rebooking on disruption (Kafka, thousands of shipments) | `io.event-source`, `logic.rules`, `logic.router`, `agent.fanout`, `tool.retriever`, `io.notify`, `observability.metrics` | M7, M9, M11 | **Event-driven fan-out + deterministic vs LLM** |
| 01 | [Airline](../../examples/01-airline-flight-change/) | Airlines | Transactional flight change with charge and audit | `agent.react`, `tool.retriever`, `tool.service`, `guardrail.idempotency`, `guardrail.confirm`, `guardrail.resilience`, `observability.audit` | M6, M8, M9, M11 | **Transactional agent + RAG-as-tool + guardrail chain** |

---

## 09 · HR policy assistant

**Folder:** [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)

### Business problem

Employees ask the same questions about vacation, benefits, and leave; manuals exist but nobody reads them. A bot is needed that answers in natural language citing the exact policy section, without inventing when there is no evidence.

### Flow diagram (per `flow.json`)

```
[INGESTION — offline]
  loader.pdf ──Documents──▶ ingest.chunker ──Documents──▶ store.chroma
  model.embedding ──Embeddings──▶ store.chroma (collection: hr_policies)
                                      │
                                      └── Retriever ──▶ retrieval.vector

[RUNTIME — chat-service]
  io.input ──Message──▶ retrieval.vector ◀── Retriever (hr_store)
       │                      │ Chunks
       │                      ▼
       └──Message──▶ logic.prompt ◀── Model (model.llm)
                          │ Message
                          ▼
                    logic.citations ◀── Chunks (retriever)
                          │ Message
                          ▼
                      io.output (markdown)
```

### Nodes it uses

| `type` | Role in flow |
|--------|--------------|
| `io.input` | Chat input (`auth: none`) |
| `loader.pdf` | HR policy PDFs |
| `ingest.chunker` | `by-section` chunking |
| `model.embedding` | Vectors for index |
| `store.chroma` | Local embedded store (`hr_policies`) |
| `retrieval.vector` | topK=4 search |
| `model.llm` | Synthesis |
| `logic.prompt` | HR response template |
| `logic.citations` | `mode: enforce` |
| `io.output` | Markdown streaming |

### RAG / agentic techniques illustrated

- **Linear** RAG pipeline (no agent): retrieve → prompt → cite → output.
- **Chroma** as prototype store (without Postgres).
- **Mandatory citations** as groundedness guardrail.
- Explicit "not determinable" response when evidence is missing (via prompt + citations).

### Course modules

| Module | What you practice with this template |
|--------|--------------------------------------|
| **M1** | Minimal RAG, `model.llm`, first contact with `flow.json` |
| **M2** | `loader.pdf`, `ingest.chunker` (`by-section`) |
| **M3** | `store.chroma`, `retrieval.vector`, embeddings |

### What you learn by rebuilding it

It is the **capstone starting point**: if you can rebuild 09 in ~40 lines (scratch) and then with LangChain, you master the RAG skeleton all other templates extend. You learn the port contract `Documents → Retriever → Chunks → Message` and why `logic.citations` goes *after* the LLM, not in the prompt.

---

## 02 · Credit potential evaluation (banking)

**Folder:** [`../../examples/02-banking-credit-scoring/`](../../examples/02-banking-credit-scoring/)

### Business problem

A credit officer receives batches of files (PDF statements, account statements, financial CSV). Manual process is slow and inconsistent. A batch job is needed that emits JSON with `score`, `decision`, `factors`, and `justification`, with document citations and **deterministic** approval thresholds (not delegated to the LLM).

### Flow diagram

```
io.batch ──Documents──▶ ingest.chunker ◀── loader.pdf
                              ▲              loader.tabular
                              │ Documents
                              ▼
                        ingest.metadata (doc_type, period)
                              │ Documents
  model.embedding ──Embeddings──▶ store.pgvector (credit_docs)
                                      │ Retriever
                                      ▼
                               retrieval.vector (topK:6, hardFilters)
                                      │ Chunks
  model.llm ──Model──▶ logic.structured (requireCitations: true)
                              │ Decision
                              ▼
                        logic.rules (≥70 approve, 40–69 review, else reject)
                              │ Decision
                              ▼
                          io.output (json)
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `io.batch` | Batch source (`deploymentTarget: batch`) |
| `loader.pdf` / `loader.tabular` | Heterogeneous sources |
| `ingest.chunker` | `by-section` |
| `ingest.metadata` | `doc_type`, `period` |
| `model.embedding` | Embeddings |
| `store.pgvector` | `credit_docs` index |
| `retrieval.vector` | Hard-filters per file |
| `model.llm` | Temperature 0.1 |
| `logic.structured` | Schema score/decision/factors/justification |
| `logic.rules` | Deterministic thresholds |
| `io.output` | JSON without streaming |

### Techniques illustrated

- **Batch RAG** with multiple loaders converging on one chunker.
- **Metadata + hardFilters** to scope retrieval to correct file.
- **Structured output** with `requireCitations: true`.
- **LLM / rules separation**: model scores and argues; `logic.rules` fixes final decision.

### Course modules

**M2 → M5** (ingestion, pgvector, retrieval with filters, structured generation and RAGAS evaluation).

### What you learn by rebuilding it

Capstone second step: combine multi-source ingestion, production store (pgvector), and the **"LLM reasons, rule decides"** pattern — critical in regulated domains. You learn to validate JSON against schema and not trust the `decision` field the LLM emits without passing through `logic.rules`.

---

## 04 · Insurance claims adjudication

**Folder:** [`../../examples/04-insurance-claims/`](../../examples/04-insurance-claims/)

### Business problem

An adjuster receives folders with policy PDF and damage photos. Manual review takes 20–45 minutes per case and decisions are hard to audit. JSON per claim is needed: `covered`, `estimated_amount`, `deductible_applied`, `clause_applied`, `reason` — with clause citation and deterministic rules for deductible, exclusions, and validity.

### Flow diagram

```
io.batch ──Documents──▶ ingest.chunker ◀── loader.multimodal
                              │              (extractTables, describeImages)
                              ▼
                        ingest.metadata (policy_type, coverage_section)
                              │ Documents
  model.embedding ──Embeddings──▶ store.pgvector (policies)
  model.vision ──Model──┐              │ Retriever
                        │              ▼
                        └──▶ logic.structured ◀── retrieval.vector (hardFilters: policy_type)
                                    ▲              ▲ Chunks
                                    │              │
                              logic.rules ◀────────┘ (Chunks → Any)
                              (deductible, exclusion, validity)
                                    │ Decision
                                    ▼
                              io.output (json)

model.llm ──Model──▶ logic.structured
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `io.batch` | S3 claims folder |
| `loader.multimodal` | Tables → JSON; images → description |
| `model.vision` | Describes damage in photos |
| `ingest.chunker` | `by-clause` (legal citability) |
| `ingest.metadata` | Policy type and section |
| `store.pgvector` | `policies` index |
| `retrieval.vector` | Hard filter by `policy_type` |
| `logic.rules` | Deterministic eligibility |
| `logic.structured` | Decision with citations |
| `model.llm` | Structured synthesis |

### Techniques illustrated

- **Multimodal ingestion** (structured tables + vision).
- **Rules before LLM** for financial thresholds.
- **Hard-filters** to avoid mixing policy types.
- Batch with **dual model** (LLM + vision) feeding `logic.structured`.

### Course modules

**M2, M4, M5, M10** (multimodal loaders, retrieval, structured output, vision).

### What you learn by rebuilding it

How to extend the 02 batch pipeline with **non-textual content** and why `logic.rules` must evaluate deductible/exclusion *without* invoking the LLM. Prepares for M10 (vision) and reinforces M5 (citations in JSON).

---

## 05 · Contract review against playbook (legal)

**Folder:** [`../../examples/05-legal-contract-review/`](../../examples/05-legal-contract-review/)

### Business problem

Legal teams must compare an incoming contract with internal playbook, current regulations, and precedents. High volume causes omissions. The user asks about risks in a clause and receives structured findings (`high`/`medium`/`low`) with **dual citations** (contract + reference source).

### Flow diagram

```
[Contract under review]
  loader.pdf → ingest.chunker → store.pgvector (contract) → retrieval.vector
       ▲                                                          │ Chunks
  chat_input ──Message──▶ Query ──────────────────────────────────┘
       │                                                          │
       │                    [KB — 3 indexes]                      │
       │  playbook/regulations/precedent: loader → chunker → store │
       │                          │ Retriever ×3                  │
       │                          ▼                               │
       │                   store.multi-index → retrieval.router ◀── Query
       │                                          │ Chunks
       │                                          ▼
       │                                   retrieval.reranker (topN:3)
       │                                          │ Chunks
       └──Message──▶ logic.citations ◀────────────┤
  model.llm ──Model──▶ logic.structured ◀─────────┘ (contract + KB Chunks)
                              │ Decision
                              ▼
                    chat_output (markdown) ◀── citations.Message
```

### Nodes it uses

| `type` | Count / role |
|--------|--------------|
| `io.input` | JWT input |
| `loader.pdf` | ×4 (contract + playbook + regulations + precedent) |
| `ingest.chunker` | ×4, `by-clause` |
| `store.pgvector` | ×4 named indexes |
| `store.multi-index` | Groups playbook, regulations, precedent |
| `retrieval.vector` | On contract |
| `retrieval.router` | Keyword → correct index |
| `retrieval.reranker` | `bge-reranker`, topN=3 |
| `logic.structured` | `findings` array with risk enum |
| `logic.citations` | `enforce` — dual citations |
| `model.embedding` / `model.llm` | Shared |

### Techniques illustrated

- **Multi-index routing** to avoid cross-category noise.
- Cross-encoder **reranking** in high-precision domain.
- **By-clause chunking** for legal citability.
- **Dual citations** verified outside the LLM.

### Course modules

**M4** (advanced retrieval: router, reranker, multi-index).

### What you learn by rebuilding it

Design systems with **several specialized indexes** instead of one vector monolith. You understand when keyword router suffices vs when you need intent classifier, and why reranker is almost mandatory in legal/medical.

---

## 08 · RAG on AMM maintenance manuals

**Folder:** [`../../examples/08-manufacturing-maintenance-rag/`](../../examples/08-manufacturing-maintenance-rag/)

### Business problem

Line technicians query the Aircraft Maintenance Manual (AMM): thousands of pages with ATA chapters, torque tables, and diagrams. Citing wrong chapter or revision is an FAA/EASA audit finding. The system must answer citing ATA section and escalate to certified inspector on CAUTION/WARNING.

### Flow diagram

```
[INGESTION]
  model.vision ──Model──▶ loader.multimodal (sectionScheme: ATA)
                               │ Documents
                               ▼
                         ingest.chunker (by-section)
                               ▼
                         ingest.metadata (ata_chapter, aircraft_type, …)
                               ▼
  model.embedding ──Embeddings──▶ store.pgvector (amm)
                                      │ Retriever
                                      ▼
[RUNTIME]                      retrieval.vector (hardFilters: aircraft_type, ata_chapter)
  io.input ──message──▶ query ──────────┘
       │                      │ chunks
       └──message──▶ logic.prompt ◀── model.llm
                          │ message
                          ▼
                    logic.citations ◀── chunks
                          │ message
                          ▼
                    hitl.escalate (WARNING|CAUTION)
                          │ any
                          ▼
                      io.output
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `loader.multimodal` | AMM with ATA scheme |
| `model.vision` | Technical diagrams → text |
| `ingest.chunker` | `by-section` (do not split procedures) |
| `ingest.metadata` | `ata_chapter`, `aircraft_type`, `revision_date` |
| `retrieval.vector` | Hard filters by aircraft and chapter |
| `logic.prompt` | Synthesis with CAUTION/WARNING notices |
| `logic.citations` | `enforce` |
| `hitl.escalate` | Certified inspector, 2h timeout |

### Techniques illustrated

- **GraphRAG-lite** via ATA metadata (without Neo4j, but same structured context principles).
- **Hard-filters** as safety guardrail (A320 ≠ 787).
- **Deterministic HITL** on critical procedures.
- **Multimodal** ingestion in technical domain.

### Course modules

**M2, M4, M9, M10** (multimodal ingestion, retrieval with filters, HITL, vision).

### What you learn by rebuilding it

Why in technical documents chunking and metadata matter as much as embedding. Practice the `hitl.escalate` trip-wire evaluated by the graph, not the LLM.

---

## 03 · Clinical prior authorization assistant (healthcare)

**Folder:** [`../../examples/03-healthcare-prior-auth/`](../../examples/03-healthcare-prior-auth/)

### Business problem

Insurers require prior authorization before costly procedures. Today it is manual: search PDF guidelines, verify patient history, decide, and escalate ambiguous cases. Flow must filter guidelines by patient **plan and condition**, always cite, and escalate to clinical reviewer on critical cases.

### Flow diagram

```
[INGESTION clinical guidelines]
  loader.pdf → ingest.chunker → ingest.metadata (plan, condition, effective_date)
       → store.pgvector → retrieval.vector (hardFilters: plan, condition)
              → tool.retriever (GuidelinesRAG)

[RUNTIME]
  io.input ──message──▶ agent.react ◀── model.llm
                              ▲    ├── tool: PatientHistoryService
                              │    └── tool: GuidelinesRAG
                              │ message
                              ▼
                        logic.citations ◀── chunks (guidelines_retrieval)
                              │ message
                              ▼
                        hitl.escalate (high severity | criterion_not_found)
                              │ any
                              ▼
                        io.output
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `retrieval.vector` | Hard filters plan + condition |
| `tool.retriever` | RAG invocable by agent |
| `tool.service` | PatientHistoryService (EHR) |
| `agent.react` | Multi-step orchestration |
| `logic.citations` | `enforce` post-processor |
| `hitl.escalate` | Clinical reviewer, 4h |

### Techniques illustrated

- **Agentic RAG**: agent decides when to consult guidelines and with which filters.
- **Hard-filters in SQL/pgvector** (not "suggestion" to LLM).
- **Citations + HITL** in post-agent chain.
- **tool.service** integration with sensitive data (PHI).

### Course modules

**M4 → M9** (retrieval, agents, production/security/HITL).

### What you learn by rebuilding it

How to combine ReAct agent with RAG as tool and guardrails **after** the agent (citations, escalate). Key anti-pattern: do not let the LLM decide whether to escalate — `hitl.escalate` is structural.

---

## 07 · Call center copilot (telecom)

**Folder:** [`../../examples/07-telecom-callcenter-copilot/`](../../examples/07-telecom-callcenter-copilot/)

### Business problem

A human agent handles calls about billing, outages, portability, etc. Searching manuals while the customer waits causes delays. The copilot transcribes audio, filters non-actionable fragments, routes to correct index (policy/procedure/faq), and shows a cited suggestion in a **side panel** in < 1.5 s.

### Flow diagram

```
io.stt ──Message──▶ model.intent ──Query──▶ query.rewrite ──Query──▶ retrieval.router
                                                                        ▲ Retriever
policy_loader  ──┐                                                      │
procedure_loader┼──Documents──▶ store.multi-index (policy/procedure/faq)┘
faq_loader (web)─┘
                                        │ Chunks
                                        ▼
                                 retrieval.reranker (feedbackRef)
                                        │ Chunks
  model.llm ──Model──▶ logic.prompt ──Message──▶ logic.citations
                                        │ Message
                                        ▼
                                   io.panel (cite: true)
                                        │ Any
                                        ▼
                              observability.feedback (thumbs)
                                        │ loop:true
                                        └──────────▶ reranker (Chunks)
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `io.stt` | Deepgram streaming |
| `model.intent` | Discards `non_actionable` |
| `query.rewrite` | Internal glossary → canonical terms |
| `loader.pdf` ×2 + `loader.web` | Three sources → multi-index |
| `retrieval.router` | Intent/keyword → index |
| `retrieval.reranker` | topN=3 + `feedbackRef` |
| `logic.prompt` | Suggestion ≤ 3 sentences |
| `io.panel` | Side output (does not interrupt call) |
| `observability.feedback` | Reranker improvement loop |

### Techniques illustrated

- **Streaming STT** as input (M10).
- **Intent gate** before RAG (latency savings).
- **Query rewriting** with domain glossary.
- Closed **feedback loop** to reranker.
- **Human-in-the-loop** copilot (human agent validates, not customer).

### Course modules

**M4, M6, M7, M9, M10** (advanced retrieval, agents, multi-agent concept, observability, multimodal/STT).

### What you learn by rebuilding it

Design **low-latency** pipelines with early gates (intent) and precise routing. The `feedback → reranker` loop is the continuous improvement pattern in production.

---

## 06 · Retail post-sale bot

**Folder:** [`../../examples/06-retail-postsale-bot/`](../../examples/06-retail-postsale-bot/)

### Business problem

After purchase, the customer asks about order status, returns, and recommendations. Human support is expensive. The bot must query orders, initiate returns with **confirmation** if refund exceeds $200, guarantee **idempotency**, and audit every tool call.

### Flow diagram

```
io.input ──Message──▶ agent.react ◀── model.llm
                         ▲   ├── Tool: OrderService
                         │   ├── Tool: RecommendationService
                         │   └── Tool: return_idempotency ◀── return_confirm ◀── ReturnService
                         │ message (loop: true)
                         ▼
                   observability.audit ──Any──▶ io.output
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `agent.react` | ReAct, maxSteps 8 |
| `tool.service` | Order, Return, Recommendation |
| `guardrail.confirm` | Threshold `amount > 200` |
| `guardrail.idempotency` | Key `order_id + session_id` |
| `observability.audit` | sink: log |

**Note:** This template **does not include inline RAG** — it is a purely transactional agent with APIs.

### Techniques illustrated

- **Tool calling** and ReAct chaining.
- **Guardrails wrapping tools** (confirm → idempotency).
- Agent action **audit trail**.
- Conversational memory via `Message → Message` loop.

### Course modules

**M6, M9** (Agents I, production and guardrails).

### What you learn by rebuilding it

The difference between a RAG bot and a **transactional agent**: guardrails go *around* the tool, not in the prompt. Direct preparation for the 01 payment pattern.

---

## 10 · Shipment rebooking on mass disruption (logistics)

**Folder:** [`../../examples/10-logistics-disruption-rebooking/`](../../examples/10-logistics-disruption-rebooking/)

### Business problem

A storm closes a hub and affects thousands of shipments. Manual rebooking collapses. A Kafka worker is needed that segments by priority (P1/P2/P3), processes in **parallel** (fan-out), auto-confirms simple cases with rules and uses LLM only on complex cases, notifying the customer and auditing everything.

### Flow diagram

```
io.event-source (Kafka, exactlyOnce)
       │ Event
       ▼
logic.rules (P1/P2/P3, track simple|complex)
       │ Decision
       ▼
logic.router (branches: simple, complex)
       │ Any → Event
       ▼
agent.fanout (concurrency: 16) ◀── Tool: ShipmentProfileService
       │                            ◀── Tool: PolicyRAG ← store.pgvector ← embedding_model
       │                            ◀── Tool: AlternativesService
       │                            ◀── Tool: AutoConfirmService
       ├──Any──▶ io.notify (email, sms, push)
       ├──Any──▶ observability.audit (kafka)
       └──Any──▶ observability.metrics (otlp)  [via audit]
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `io.event-source` | `shipment.disruption`, partitionKey, exactlyOnce |
| `logic.rules` | Deterministic segmentation |
| `logic.router` | Simple vs complex branch |
| `agent.fanout` | Stateless sub-agents in parallel |
| `tool.retriever` | PolicyRAG on `rebook_policies` |
| `tool.service` | Profile, alternatives, auto-confirm |
| `io.notify` | Outbound channels |
| `observability.audit` / `observability.metrics` | Traceability and OTLP |

**Note:** LLM is consumed via flow `defaults.llm` inside fan-out for `track == 'complex'` cases; no explicit `model.llm → fanout` edge.

### Techniques illustrated

- **Event-driven** with Kafka and exactly-once.
- Stateless multi-agent **fan-out** at scale.
- **Deterministic vs LLM**: rules classify; model only on ambiguity.
- **RAG-as-tool** in parallel sub-agents.
- Production observability (audit + metrics).

### Course modules

**M7, M9, M11** (multi-agent, production, architecture capstone).

### What you learn by rebuilding it

When **not** to use a conversational agent: fan-out pattern for high volume. How to combine `logic.rules` + `logic.router` + `agent.fanout` and measure auto-confirm vs LLM intervention.

---

## 01 · Flight change agent (airline)

**Folder:** [`../../examples/01-airline-flight-change/`](../../examples/01-airline-flight-change/)

### Business problem

A passenger wants to change flight in natural language. Process involves querying PNR, verifying fare policies, finding alternatives, calculating differential + penalty, and charging with confirmation. Requires regulatory traceability (Kafka audit) and financial protection (idempotency, confirm-gate, circuit breaker).

### Flow diagram

```
[INGESTION policies — offline]
  loader.pdf → ingest.chunker (by-clause) → ingest.metadata (fare_class, route_type)
       → store.pgvector (fare_rules) ← embedding_model
              → tool.retriever (PolicyRAG)

[RUNTIME]
  io.input ──Message──▶ agent.react ◀── model.llm
                            ▲   ├── PolicyRAG (tool.retriever)
                            │   ├── ReservationService, InventoryService, PricingService
                            │   └── payment_resilience ◀── payment_confirm ◀── payment_idempotency ◀── PaymentService
                            │ message (loop: true)
                            ▼
                      observability.audit (kafka: flight-change-audit)
                            │ Any
                            ▼
                        io.output
```

### Nodes it uses

| `type` | Role |
|--------|------|
| `agent.react` | Mandatory flow in system prompt |
| `tool.retriever` | PolicyRAG with fare_class/route_type filters |
| `tool.service` | Reservations, inventory, pricing, payment |
| `guardrail.idempotency` | PNR + session_id, TTL 24h |
| `guardrail.confirm` | amount > 500 USD |
| `guardrail.resilience` | Circuit breaker on payment |
| `observability.audit` | Kafka audit trail |
| `ingest.chunker` | `by-clause` on fare rules |

### Techniques illustrated

- **Agentic RAG** (policies as tool, not fixed pipeline).
- **Guardrail chain** on transactional tool.
- **Hard-filters** on fare metadata.
- **Regulatory audit** passthrough.
- Case study for **MCP** (PolicyRAG as MCP server in M8).

### Course modules

**M6, M8, M9, M11** (agents, MCP, production, capstone).

### What you learn by rebuilding it

**Third and hardest capstone step:** integrate everything — ingestion with metadata, RAG-as-tool, multiple APIs, three guardrails in series, audit, and chat-service deployment. If you rebuild 01, you are ready to design new architectures in M11.

---

## Rebuild path (capstone)

The course plan ([`PLAN.md` §6 M11](../PLAN.md)) requires rebuilding **three templates in increasing difficulty order**:

```
09 HR  →  02 Banking  →  01 Airline
  ↑            ↑              ↑
 ~10 nodes   ~12 nodes     ~18 nodes
 linear RAG  batch+rules    agent+guardrails+RAG-tool
```

### Why 09 first

| Criterion | 09 HR |
|-----------|-------|
| Complexity | Minimal: one Chroma index, no agent, no external APIs |
| New nodes | Only `io`, `loader`, `ingest`, `store`, `retrieval`, `model`, `logic` categories |
| Secrets | One (`ANTHROPIC_API_KEY`) |
| Deployment | Standard `chat-service` |
| Skill validated | You understand full RAG cycle and mandatory citations |

If 09 does not pass tests equivalent to generated artifact, advancing makes no sense: it is the **minimum viable RAG** all others depend on.

### Why 02 second

| Criterion | 02 Banking |
|-----------|------------|
| Jump from 09 | Batch (`io.batch`), two loaders, pgvector, hardFilters, structured output, `logic.rules` |
| Still no agent | Flow remains deterministic in graph — easier to debug than ReAct |
| Skill validated | Heterogeneous ingestion, metadata, auditable decision, **do not delegate thresholds to LLM** |
| Bridge to 01 | Same pgvector + metadata patterns as PolicyRAG in airline, but without tool calling |

02 teaches **batch production** and strong JSON contracts before introducing agent non-determinism.

### Why 01 last

| Criterion | 01 Airline |
|-----------|------------|
| Maximum complexity | ReAct agent + 5 tools + RAG-as-tool + 3 chained guardrails + Kafka audit |
| State and multi-turn | ReAct loop, user confirmation, session idempotency |
| Integrations | 4 business APIs + vector store + audit broker |
| Skill validated | **End-to-end** design of transactional agentic system ready for production |

Rebuilding 01 demonstrates you master agents, guardrails, observability, and integrated RAG — the course **expert** criterion.

### The other seven templates

Not part of mandatory capstone, but cover patterns appearing in integrative exam and new architecture design:

| Template | Unique pattern it contributes |
|----------|------------------------------|
| 04 Insurance | Vision + rules + structured in batch |
| 05 Legal | Multi-index + router + reranker |
| 03 Healthcare | Agent + citations + HITL |
| 08 Manufacturing | Multimodal ATA + HITL |
| 07 Telecom | STT + intent + panel + feedback loop |
| 06 Retail | Agent without RAG, transactional guardrails |
| 10 Logistics | Kafka fan-out, event-worker |

Studying them in corresponding modules ([`PLAN.md` §8](../PLAN.md)) completes coverage of **13 node categories** before M11 exam.

---

## Cross-references

- Course plan and modules: [`../PLAN.md`](../PLAN.md)
- Node sheets: [`./catalogo-nodos.md`](./catalogo-nodos.md)
- Glossary: [`./glosario.md`](./glosario.md)
- Compared technologies: [`./tecnologias-comparadas.md`](./tecnologias-comparadas.md)
- Flow IR contract: [`../../docs/01-concepts.md`](../../docs/01-concepts.md)
- Technical node catalog: [`../../docs/02-node-catalog.md`](../../docs/02-node-catalog.md)
- Examples index: [`../../examples/`](../../examples/)

---

*Last revision aligned with `flow.json` in `examples/` (irVersion 1.0). If a template changes in the repo, update edges and node table in its sheet.*

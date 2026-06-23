# M11 · Solutions — Integrative exam

> Reasoned answers for all 50 questions in `ejercicios.md`.

---

## Block 1 — Cross-cutting patterns

**Exercise 1 (A)** — **b)** A `tool.retriever` wraps the retriever for on-demand invocation by `agent.react`. The fixed pipeline (a) describes linear RAG of 09, not RAG-as-tool.

**Exercise 2 (A)** — **b)** Hard-filters are applied in the store/SQL query by metadata, not as an instruction to the LLM. They are a structural guardrail (M4, guide §1.2).

**Exercise 3 (A)** — **b)** `logic.rules` overrides `decision` according to deterministic thresholds. The LLM may emit any value in structured output; the rule is the auditable source of truth.

**Exercise 4 (E)** — **b)** `agent.fanout` + `logic.rules` (template 10). Massive independent volume does not use ReAct conversation.

**Exercise 5 (A)** — **b)** `enforce` verifies anchoring post-generation. The system prompt is insufficient (anti-pattern §4.3).

**Exercise 6 (D)** — **Deterministic pipeline**, not agent. Minimum nodes: `io.input` → `retrieval.vector` ← `store.chroma` ← ingestion (`loader.pdf`, `ingest.chunker`, `model.embedding`) → `logic.prompt` ← `model.llm` → `logic.citations` → `io.output`. Same pattern as template 09: question always about the same corpus, no transactional actions.

**Exercise 7 (A)** — **b)** The agent orchestrates when to retrieve and combines tools (template 01, 03).

**Exercise 8 (P)** — **b)** `"revisar"`. Score 45 falls in range 40–69. The LLM value `"aprobar"` is ignored/overridden by `logic.rules`.

**Exercise 9 (A)** — **b)** idempotency → confirm → resilience (see `flow.json` of 01: payment_service → idempotency → confirm → resilience → orchestrator).

**Exercise 10 (B)** — Anti-pattern: filter only in prompt. **Fix:** metadata `fare_class`/`route_type` in ingestion + `hardFilters` in PolicyRAG/`retrieval.vector`, or filters in `tool.retriever` when invoking with parameters the store applies as WHERE, not as text.

---

## Block 2 — Read and design flow.json

**Exercise 11 (A)** — **b)** Batch implies `io.batch`, batch processing, typically `io.output` without streaming.

**Exercise 12 (P)** — **b)** Chunks and Message are distinct types. `logic.prompt` accepts Chunks and Message separately, not Chunks→Message directly without an intermediate node.

**Exercise 13 (A)** — **b)** Env var names only; never values (security, HANDOFF §4).

**Exercise 14 (D)** — Model answer: `io.stt` or text entry → `model.intent` (discard non-actionable) → `query.rewrite` → `store.multi-index` (policy/procedure/faq) → `retrieval.router` → `retrieval.reranker` → `logic.prompt` + `logic.citations` → `io.panel`. Optional: `observability.feedback` loop to reranker. Based on template 07.

**Exercise 15 (A)** — **b)** ReAct cycle of the orchestrator (template 01, edge loop: true).

**Exercise 16 (B)** — **b)** Without retrieval or prompt template with chunks, there is no RAG. The LLM would respond only with parametric knowledge (hallucination).

**Exercise 17 (A)** — **b)** Router directs query to the correct index; avoids cross-category noise (template 05, 07).

**Exercise 18 (E)** — **b)** Local `store.chroma` — no Postgres, ideal intranet prototype (template 09).

**Exercise 19 (P)** — **b)** Two destinations: `prompt:Chunks` and `citations:Chunks`.

**Exercise 20 (D)** — Model:
```
loader.pdf:Documents → policy_chunker:Documents → policy_metadata:Documents → policy_store:Documents
embedding_model:Embeddings → policy_store:Embeddings
policy_store:Retriever → policy_tool:Retriever
```

---

## Block 3 — Anti-patterns and production

**Exercise 21 (A)** — **b)** Thresholds must be deterministic code (`logic.rules`) for auditability and compliance (template 02 §9).

**Exercise 22 (B)** — Missing: `guardrail.idempotency` (PNR+session), `guardrail.confirm` (>500 USD), `guardrail.resilience` (circuit breaker). Chain from template 01.

**Exercise 23 (A)** — **b)** Compliance requires guaranteed escalation; the LLM may omit it (anti-pattern §4.4).

**Exercise 24 (P)** — **b)** `deduplicated` — second call with same key returns cached response without re-charging.

**Exercise 25 (A)** — **b)** Regulatory audit trail (IATA, payments).

**Exercise 26 (E)** — **b)** LangSmith/Langfuse for traces + OTel metrics + audit bus (Kafka/log) for sensitive actions.

**Exercise 27 (B)** — Symptoms: irrelevant chunks in top-k (playbook mixed with regulations), responses with incorrect citations, low precision/recall, more wasted tokens. Fix: multi-index + router + reranker.

**Exercise 28 (A)** — **b)** Intercepts **before** executing the tool; pauses for user confirmation.

**Exercise 29 (D)** — Example: (1) local `model.embedding` / no external API; (2) deployment in VPC without egress; (3) `observability.audit` without PII in logs; (4) hard-filters by plan/patient; (5) `hitl.escalate` in critical cases. Any three coherent with the brief.

**Exercise 30 (A)** — **b)** ReAct is conversational and stateful per event; stateless fan-out scales horizontally (template 10).

---

## Block 4 — Rebuilding templates

**Exercise 31 (A)** — **b)** 09 → 02 → 01 (PLAN §6 M11, plantillas-mapeadas).

**Exercise 32 (P)** — **b)** `1, 0, 7, 3` — actual output of `solucion_scratch.py` / `expected.md`.

**Exercise 33 (A)** — **b)** Zero friction, no DB server (README 09 §9).

**Exercise 34 (B)** — Missing hard-filter by `applicant_id` (or equivalent) in metadata and in `retrieve()`. Chunks from another file share the index without SQL/metadata filter.

**Exercise 35 (A)** — **b)** Each factor anchored to fragments from the current file.

**Exercise 36 (P)** — **c)** `"aprobar"` — score 72 ≥ 70.

**Exercise 37 (A)** — **b)** Fare precision guardrail; semantic similarity can cross fares (README 01 §9).

**Exercise 38 (D)** — Sequence from the 01 system prompt: (1) ReservationService/getItinerary, (2) PolicyRAG penalties, (3) InventoryService/searchFlights, (4) PricingService/calculateDelta, (5) inform cost and ask for confirmation, (6) PaymentService only after confirmation.

**Exercise 39 (A)** — **b)** Citability at clause level (legal/fare).

**Exercise 40 (B)** — `guardrail.confirm` not wired, misconfigured (`threshold`), or the agent bypasses the chain calling `payment_service` directly without going through idempotency→confirm→resilience.

---

## Block 5 — System testing and eval

**Exercise 41 (A)** — **b)** Fast deterministic CI; eval with LLM in nightly/pre-release (guide §6).

**Exercise 42 (P)** — **b)** `logic.rules` — threshold 40–69 → revisar.

**Exercise 43 (A)** — **b)** Groundedness of the response in context.

**Exercise 44 (D)** — Example:
| Case | Assert |
|------|--------|
| "¿Vacaciones primer año?" | must_contain "12 días"; must_cite §3 |
| "¿Precio acciones?" | must_contain "no está disponible"; citations_ok or no invented claim |
| "¿Vacaciones 3 años?" | must_contain "18 días"; faithfulness ≥ 0.9 |

**Exercise 45 (E)** — **b)** promptfoo or RAGAS with versioned dataset in git.

---

## Block 6 — Other templates and global architecture

**Exercise 46 (A)** — **b)** Pure transactional case — tools + guardrails (template 06).

**Exercise 47 (A)** — **a)** Side copilot for human agent (template 07).

**Exercise 48 (E)** — **b)** Standard cross-app reuse with MCP permissions (M8).

**Exercise 49 (D)** — **LangGraph multi-agent:** fine-grained graph control, checkpoints, native fan-out, observability integration — ideal when you need explicit conditional routing and shared state (template 10). **CrewAI:** declarative agents/tasks/crews definition, lower learning curve, good for quick multi-role prototypes; less control over exact edges and exactly-once Kafka. For 10 (event-worker, fan-out, OTLP metrics), LangGraph is usually preferred in production; CrewAI to validate role logic quickly.

**Exercise 50 (D)** — Rebuilding in code forces understanding ports, contracts, and pieces that RAGorbit abstracts visually. The 09→02→01 order increases complexity gradually: first minimal RAG, then auditable batch with rules, finally full transactional agent. Without that depth, canvas design is fragile to changes, debugging, and production. The expert criterion is self-assessable: if you can rebuild and defend, you master the 13 node categories, not just drag boxes.

---

⬅️ [Exercises](ejercicios.md) · [Guide](guia.md)

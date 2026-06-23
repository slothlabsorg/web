# IBM "RAG and Agentic AI" (Coursera) Coverage ↔ This Course

> Detailed mapping of the IBM professional program on Coursera (**10 courses**) against this repository's own curriculum (**M0–M11**). The IBM syllabus was **coverage reference only** — we did not follow that course or replicate its labs. We built our own material, in Spanish, with a tri-modal approach (design + Python from scratch + real frameworks) and **go beyond it** in production, design, and industry cases. See [`PLAN.md §11`](../PLAN.md) and [`HANDOFF.md §2`](../HANDOFF.md).

---

## Index

1. [Context and scope](#1-context-and-scope)
2. [Main table: 10 IBM courses → modules](#2-main-table-10-ibm-courses--modules)
3. [IBM skills → where they are acquired](#3-ibm-skills--where-they-are-acquired)
4. [Extras this course adds (and the IBM program does not emphasize)](#4-extras-this-course-adds-and-the-ibm-program-does-not-emphasize)
5. [Checklist: if you come from the IBM program, start with…](#5-checklist-if-you-come-from-the-ibm-program-start-with)
6. [Conclusion](#6-conclusion)

---

## 1. Context and scope

The IBM **"RAG and Agentic AI"** program on Coursera consists of **10 courses** that progressively cover GenAI applications with LangChain, RAG, vector databases, advanced RAG, multimodal, agents, agentic frameworks (LangGraph, CrewAI, AutoGen, BeeAI), MCP, and an integrative capstone.

**What we did with that reference:**

| Aspect | IBM program | This course |
|---------|--------------|------------|
| Role of IBM syllabus | Course to follow | **Coverage checklist** — ensure no topic is missing |
| Material | Coursera labs | **Our own guides, exercises, workshops, and solutions** in `rag-training/` |
| Code | Mostly frameworks | **Tri-modal**: ① design → ② scratch (stdlib) → ③ real framework |
| Use cases | Generic / course datasets | **10 RAGorbit industry templates** (airline, banking, healthcare…) |
| Production | Minimal | **Full M9**: guardrails, HITL, Kafka, Temporal, AI Security |
| Final evaluation | Coursera project | **M11 Capstone**: rebuild 3 templates + design architecture + exam |

**RAGorbit node coverage:** all 13 categories (`model`, `loader`, `ingest`, `store`, `retrieval`, `query`, `logic`, `agent`, `tool`, `guardrail`, `hitl`, `observability`, `io`) are mapped to modules in [`PLAN.md §7`](../PLAN.md). This document cross-references that coverage with the IBM syllabus.

---

## 2. Main table: 10 IBM courses → modules

Each row breaks down **IBM course topics**, where they are covered in **this course** (module + folder), and **notes** on depth or differences.

### Course 1 · Develop GenAI Apps

**IBM topics:** basic LangChain, prompt patterns, JSON output, model evaluation, deployment with Flask.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| LLM fundamentals (tokens, context, temperature) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | + embedding intuition; model choice latency/cost/quality |
| Prompt patterns (system/user, few-shot, CoT, in-context learning) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | **Prompt Patterns** skill; Claude/OpenAI/Gemini/Llama comparison |
| Why RAG vs fine-tune vs prompting | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | Minimal RAG pattern ~40 lines (scratch) + LangChain (③) |
| LangChain / LCEL (basic chains) | **M1**, **M5** | M1 + [`../05-generacion-y-logic/`](../05-generacion-y-logic/) | Depth in M5: query engines, structured output |
| JSON output / structured output | **M5** | [`../05-generacion-y-logic/`](../05-generacion-y-logic/) | JSON Schema, `requireCitations`, instructor/outlines |
| Evaluation and model selection | **M1**, **M5** | M1 + M5 | RAGAS, TruLens, DeepEval, promptfoo in M5 |
| OpenAI APIs (and alternatives) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | **OpenAI API** skill; `provider:model` format without lock-in |
| Flask UI / lightweight deployment | **M9** | [`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/) | Flask + **Gradio/Streamlit**; FastAPI/SSE targets |

---

### Course 2 · Build RAG Apps

**IBM topics:** end-to-end RAG pipeline, Gradio, LlamaIndex vs LangChain comparison.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| RAG pattern (retrieve → synthesize) | **M1**, **M5** | M1 + M5 | Template [09-RRHH](../../examples/09-hr-policy-assistant/) |
| Loaders and document preparation | **M2** | [`../02-ingesta/`](../02-ingesta/) | PDF, tabular, web, SQL, S3; chunking and metadata |
| Embeddings and indexing | **M3** | [`../03-embeddings-y-stores/`](../03-embeddings-y-stores/) | Chroma, FAISS, pgvector; see course 3 |
| Retrieval and generation with context | **M4**, **M5** | M4 + M5 | Hybrid, rerank, mandatory citations |
| LlamaIndex (readers, query engines) | **M2**, **M4** | M2 + M4 | Hands-on: chunk legal PDF + LlamaIndex retriever |
| LangChain vs LlamaIndex (trade-offs) | **M2**, **M4**, **M5** | M2–M5 | Table in [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) |
| Gradio to prototype RAG | **M9** | [`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/) | Conversational UI; Streamlit too |

---

### Course 3 · Vector DBs for RAG

**IBM topics:** ChromaDB (CRUD operations), vector similarity, recommendation systems.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| Embeddings (dimensions, normalization, metrics) | **M3** | [`../03-embeddings-y-stores/`](../03-embeddings-y-stores/) | Cosine, dot, L2; OpenAI vs Cohere vs local BGE/E5 |
| Vector indexes (HNSW, IVF, flat) | **M3** | M3 | HNSW vs flat comparison in workshop |
| ChromaDB: add/update/delete/manage | **M3** | M3 | **Vector DBs** skill; `store.chroma` node |
| FAISS by hand | **M3** | M3 | Scratch implementation + comparison with Chroma |
| Vector store vs traditional DB | **M3** | M3 | pgvector, Qdrant, Pinecone, Weaviate, Milvus |
| Recommendation systems with embeddings | **M3** | M3 | Explicit IBM extra; item↔item and user↔item analogy |
| Persistence and collections | **M3** | M3 | Template 09 (Chroma), 02 (pgvector) |

---

### Course 4 · Advanced RAG

**IBM topics:** FAISS, HNSW, advanced retrievers, Gradio.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| FAISS / HNSW in depth | **M3**, **M4** | M3 + [`../04-retrieval-y-query/`](../04-retrieval-y-query/) | Indexes in M3; retrievers that consume them in M4 |
| BM25 / keyword search | **M4** | M4 | Dense vs keyword vs **hybrid** (`alpha`) |
| Reranking (cross-encoder) | **M4** | M4 | BGE-reranker, Cohere, ColBERT |
| LangChain and LlamaIndex retrievers | **M4** | M4 | EnsembleRetriever, VectorIndexRetriever, ParentDocument |
| Parent-child retrieval | **M4** | M4 | `retrieval.parent-child` node |
| Query rewriting and intent | **M4** | M4 | `query.rewrite`, `query.intent` / `model.intent` |
| Filters in retrieval | **M4**, **M9** | M4 + M9 | **Hard-filters** as business guardrail (deeper than IBM) |
| Multi-index routing | **M4** | M4 | `store.multi-index` + `retrieval.router`; template 07 telecom |
| GraphRAG (Neo4j) | **M4** | M4 | **Extra depth** vs IBM; `store.neo4j`, `retrieval.graph` |
| Gradio to evaluate retrieval | **M9** | M9 | UI to inspect retrieved chunks |

---

### Course 5 · Multimodal

**IBM topics:** Whisper, DALL·E, Sora, Hugging Face, watsonx, Granite.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| Multimodal concepts (text/voice/image/video) | **M10** | [`../10-multimodal/`](../10-multimodal/) | Challenges: alignment, cost, latency |
| STT / Whisper | **M10**, **M9** | M10 + M9 | `io.stt` node; template 07 call center |
| Vision (describe images, tables→JSON) | **M10**, **M2** | M10 + M2 | `model.vision`, `loader.multimodal`; templates 04, 08 |
| Image generation (DALL·E, SDXL) | **M10** | M10 | Conceptual + lab |
| Audio generation / TTS | **M10** | M10 | Sora mentioned as generative video reference |
| Open models (HF, watsonx, Granite, Llama) | **M10**, **M1** | M10 + M1 | Closed vs open-weights provider comparison |
| Multimodal embeddings and vector DB | **M10**, **M3** | M10 + M3 | Indexing visual descriptions in RAG pipeline |

---

### Course 6 · Fundamentals of AI Agents

**IBM topics:** tool calling, chaining, LangChain built-in agents, visualization and SQL.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| From RAG to agent (when to agentify) | **M6** | [`../06-agentes-i/`](../06-agentes-i/) | Agentic RAG: the agent decides when to retrieve |
| Tool calling and schemas | **M6** | M6 | **Tool Calling** skill; `tool.*` nodes |
| Tool chaining | **M6** | M6 | Multi-step sequences before responding |
| ReAct loop (reason → act → observe) | **M6** | M6 | `agent.react`; scratch + LangGraph |
| LangChain built-in agents (data, SQL) | **M6** | M6 | SQL and data agent in workshop |
| Data visualization agent | **M6** | M6 | Explicit lab (IBM mentions it; here with expected result) |
| RAG as tool (`tool.retriever`) | **M6** | M6 | PolicyRAG in template 01 airline |
| LangGraph `StateGraph` (intro) | **M6** | M6 | Conceptual; depth in M7 |

---

### Course 7 · Agentic AI with LangChain / LangGraph

**IBM topics:** memory, Reflection/Reflexion, ReAct, multi-agent, agentic RAG.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| Memory (short/long term, conversational) | **M6**, **M7** | M6 + [`../07-agentes-ii/`](../07-agentes-ii/) | State in LangGraph; checkpoints in M7 |
| Reflection / Reflexion (self-improvement) | **M6** | M6 | ReAct vs Plan-and-Execute vs Reflexion comparison |
| ReAct in depth | **M6** | M6 | Workshop: memory + 2 tools, expected sequence |
| Agentic RAG | **M6**, **M4** | M6 + M4 | Query routing by the agent, not fixed pipeline |
| LangGraph: graphs, edges, state | **M6**, **M7** | M6 + M7 | **LangChain/LangGraph** skill |
| Multi-agent (intro and patterns) | **M7** | M7 | Supervisor, hierarchical, collaborative |
| Conditional edges and checkpoints | **M7** | M7 | State persistence between steps |

---

### Course 8 · Agentic AI with CrewAI / AutoGen / BeeAI

**IBM topics:** alternative frameworks and multi-agent patterns.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| CrewAI (agents, tasks, crews, tools) | **M7** | [`../07-agentes-ii/`](../07-agentes-ii/) | Hands-on same problem in CrewAI and LangGraph |
| AutoGen / AG2 (conversation between agents) | **M7** | M7 | Multi-role dialogue pattern |
| BeeAI | **M7** | M7 | Fourth framework in the comparison |
| Multi-agent patterns (supervisor, fan-out) | **M7** | M7 | `agent.fanout`; template 10 logistics |
| When multi-agent vs single agent | **M7**, **M11** | M7 + M11 | Trade-offs table; anti-patterns in M11 |
| Framework selection and combination | **M7** | M7 | vs Semantic Kernel (reference) |
| **GenAI Agents** / **Agentic** skill | **M6**, **M7** | M6 + M7 | Simple agents → complex orchestration |

---

### Course 9 · Model Context Protocol (MCP)

**IBM topics:** FastMCP, server/client, STDIO/HTTP, security.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| MCP architecture vs traditional APIs | **M8** | [`../08-mcp/`](../08-mcp/) | **MCP** skill |
| FastMCP: build server (tools, resources, prompts) | **M8** | M8 | `tool.mcp` node |
| MCP client (STDIO and Streamable HTTP) | **M8** | M8 | Connect to one and multiple servers |
| MCP security (sampling, roots, permissions) | **M8**, **M9** | M8 + M9 | Permission-based approval; links to AI Security |
| MCP vs proprietary plugins | **M8** | M8 | Comparison in guide |
| Integrative workshop | **M8** | M8 | Airline PolicyRAG as MCP server |

---

### Course 10 · Capstone

**IBM topics:** data→deploy, unstructured→JSON, multimodal + multi-agent, MCP, testing.

| IBM topic | Module(s) | Folder | Notes |
|----------|-----------|---------|-------|
| Full data → production pipeline | **M11**, **M9** | [`../11-capstone/`](../11-capstone/) + M9 | 4 deployment targets: chat, Kafka worker, Temporal, batch |
| Unstructured → structured JSON | **M2**, **M5** | M2 + M5 | `loader.multimodal`, `logic.structured` |
| Integrated multimodal + multi-agent | **M10**, **M7**, **M11** | M10 + M7 + M11 | Real templates, not generic dataset |
| MCP in final project | **M8**, **M11** | M8 + M11 | Optional in capstone design |
| AI system testing | **M5**, **M11** | M5 + M11 | RAGAS as test; system testing in M11 |
| Capstone project | **M11** | M11 | **Beyond IBM:** 3 templates from scratch + new design + 50-question exam |
| The 10 industry templates | **M1–M11** | All | Map in [`plantillas-mapeadas.md`](./plantillas-mapeadas.md) and [`PLAN.md §8`](../PLAN.md) |

---

### Visual summary (IBM course → primary module)

| # | IBM course | Primary module(s) |
|---|-----------|-------------------------|
| 1 | Develop GenAI Apps | M1, M5, M9 |
| 2 | Build RAG Apps | M1, M2, M4, M9 |
| 3 | Vector DBs for RAG | M3 |
| 4 | Advanced RAG | M3, M4 |
| 5 | Multimodal | M10 |
| 6 | Fundamentals of AI Agents | M6 |
| 7 | Agentic AI LangChain/LangGraph | M6, M7 |
| 8 | Agentic AI CrewAI/AutoGen/BeeAI | M7 |
| 9 | MCP | M8 |
| 10 | Capstone | M11 (+ cross-cutting M9) |

---

## 3. IBM skills → where they are acquired

The IBM program certifies competencies in **11 areas**. This table indicates the **primary module**, reinforcement modules, and the **deliverable** where the skill is demonstrated.

| IBM skill | Primary module | Also in | How it is demonstrated |
|-----------|------------------|------------|-------------------|
| **RAG** | M1 → M5 | M2, M3, M4, M6 | M1 workshop (minimal RAG); full pipeline M2–M5; agentic RAG M6 |
| **Vector DBs** | M3 | M4 | Chroma + FAISS workshop; metadata filters; pgvector in template 02 |
| **Prompt Patterns** | M1 | M5, M6 | Few-shot, CoT, system prompts; agent prompts in M6 |
| **LangChain / LangGraph** | M5, M6, M7 | M1, M2, M4 | LCEL, ReAct, StateGraph, multi-agent, checkpoints |
| **OpenAI API** | M1 | M3, M5, M6 | Multi-provider interface; embeddings and chat completions |
| **Tool Calling** | M6 | M7, M8 | ReAct with tools; MCP as evolution of tool calling |
| **GenAI Agents** | M6 | M7 | ReAct agent + built-in SQL/viz |
| **Agentic** | M6, M7 | M11 | Reflection, memory, multi-agent, fan-out, capstone |
| **Multimodal** | M10 | M2, M9 | STT, vision, generation; `io.stt` in call center |
| **MCP** | M8 | M9, M11 | FastMCP server + client with permissions |
| **AI Security** | M9 | M6, M8 | Injection, jailbreak, PII, guardrails, MCP permissions |

**Cross-cutting skill not explicitly listed in IBM but covered here:**

| Additional skill | Module | Note |
|-----------------|--------|------|
| **LlamaIndex** | M2, M4, M5 | Readers, retrievers, query engines |
| **RAG/Agent evaluation** | M5, M11 | RAGAS, faithfulness, cost, latency |
| **Architecture design** | M11 | Flow IR, contracts, anti-patterns |
| **Production / SRE** | M9 | Idempotency, HITL, Kafka, Temporal, OTel |

---

## 4. Extras this course adds (and the IBM program does not emphasize)

IBM covers RAG and agent fundamentals well with frameworks. **This course adds** **production engineering** and **systematic design** capabilities that the Coursera program barely touches.

### Real production

| Topic | Module | RAGorbit node(s) | Why it matters |
|------|--------|------------------|-----------------|
| **Idempotency** | M9 | `guardrail.idempotency` | Payments and reservations are not charged twice (Stripe-like) |
| **Confirm-gate** | M9 | `guardrail.confirm` | Irreversible actions require user confirmation |
| **Circuit breaker** / retry / fallback | M9 | `guardrail.resilience` | Graceful degradation when external APIs fail |
| **HITL** (hardcoded, not LLM) | M9 | `hitl.escalate` | Deterministic escalation in healthcare, legal, maintenance |
| **Audit to Kafka** | M9 | `observability.audit` | Regulatory traceability of every tool call |
| **Feedback loop** | M9 | `observability.feedback` | Continuous reranker improvement |
| **Temporal** / exactly-once | M9 | `io.trigger`, `io.event-source` | Durable workflows; Kafka `exactlyOnce` |
| **4 deployment targets** | M9 | `io.*` | chat-service, event-worker, batch, temporal |
| **AI Security** | M9 | `guardrail.*` + guides | Injection, jailbreak, PII leakage, bias |
| **Production UIs** | M9 | — | Gradio, Streamlit, Flask to operate the system |

### Contract awareness and design

| Topic | Module | Reference |
|------|--------|------------|
| Which node can connect to which (Flow IR) | M0, M11 | [`docs/01-concepts.md`](../../docs/01-concepts.md) |
| 53 node types in 13 categories | All | [`catalogo-nodos.md`](./catalogo-nodos.md) |
| Anti-patterns and design checklist | M11 | [`../11-capstone/`](../11-capstone/) |
| Deterministic rules vs delegating to the LLM | M5, M9 | `logic.rules`, business thresholds |

### Ten complete industry cases

Templates in `examples/` — each spans several modules:

| Template | Industry | Dominant modules |
|----------|-----------|-------------------|
| [09-RRHH](../../examples/09-hr-policy-assistant/) | HR | M1 → M3 |
| [02-Banca](../../examples/02-banking-credit-scoring/) | Banking | M2 → M5 |
| [03-Salud](../../examples/03-healthcare-prior-auth/) | Healthcare | M4 → M9 |
| [04-Seguros](../../examples/04-insurance-claims/) | Insurance | M2 → M5, M10 |
| [05-Legal](../../examples/05-legal-contract-review/) | Legal | M4 |
| [06-Retail](../../examples/06-retail-postsale-bot/) | Retail | M6 |
| [07-Telecom](../../examples/07-telecom-callcenter-copilot/) | Telecom | M4 → M7, M10 |
| [08-Manufactura](../../examples/08-manufacturing-maintenance-rag/) | Manufacturing | M2 → M4, M10 |
| [01-Aerolínea](../../examples/01-airline-flight-change/) | Airline | M6 → M8, M9, M11 |
| [10-Logística](../../examples/10-logistics-disruption-rebooking/) | Logistics | M7 → M9, M11 |

### Rebuild from scratch (not just use frameworks)

| Layer | What it implies | Where |
|------|-------------|-------|
| ① Design | Why / when / alternatives | All guides |
| ② Scratch | Python stdlib, deterministic mocks | All `lab/solucion_scratch.py` |
| ③ Framework | LangChain, LangGraph, LlamaIndex, CrewAI… | `lab/solucion_framework.py` |
| Capstone | Rebuild 09 → 02 → 01 without looking at codegen | M11 |

### Advanced RAG with more depth than IBM

| Topic | Module | IBM | This course |
|------|--------|-----|------------|
| **GraphRAG / Neo4j** | M4 | Light mention | Workshop with `store.neo4j` + `retrieval.graph` |
| **Multi-index routing** | M4 | Basic | `store.multi-index` + `retrieval.router`; telecom template |
| **Hard-filters as guardrail** | M4, M9 | Optional filters | Mandatory WHERE clauses; no filter ⇒ noise demonstrated in lab |
| **Parent-child + rerank** | M4 | Partial | Legal/medical workshop with precision expected result |

---

## 5. Checklist: if you come from the IBM program, start with…

Quick equivalence map so you do not repeat what you already master and can find your place in this curriculum.

### You already completed IBM courses 1–2 (GenAI + basic RAG)

- [ ] Skip repeated M1 theory and go straight to the **workshop** in [`../01-fundamentos/lab/`](../01-fundamentos/lab/) — validate that you can do minimal RAG in scratch.
- [ ] Study M2 ([`../02-ingesta/`](../02-ingesta/)): chunking by clause and metadata — IBM does not go as deep on metadata for filters.
- [ ] Review [`catalogo-nodos.md`](./catalogo-nodos.md) §2–§3 to connect loaders/ingest with RAGorbit.

### You already completed IBM courses 3–4 (Vector DBs + Advanced RAG)

- [ ] M3 ([`../03-embeddings-y-stores/`](../03-embeddings-y-stores/)): confirm Chroma ops + FAISS scratch.
- [ ] **Prioritize M4** ([`../04-retrieval-y-query/`](../04-retrieval-y-query/)): hybrid, rerank, **hard-filters**, **multi-index**, **GraphRAG** — here we go beyond the IBM program.
- [ ] Open template [05-Legal](../../examples/05-legal-contract-review/) or [07-Telecom](../../examples/07-telecom-callcenter-copilot/) to see routing in action.

### You already completed IBM course 5 (Multimodal)

- [ ] M10 ([`../10-multimodal/`](../10-multimodal/)) — quick review if you already used Whisper.
- [ ] Connect with M2: `loader.multimodal` and template [08-Manufactura](../../examples/08-manufacturing-maintenance-rag/).

### You already completed IBM courses 6–8 (Agents)

- [ ] M6 ([`../06-agentes-i/`](../06-agentes-i/)): validate ReAct + memory + agentic RAG in scratch.
- [ ] **M7 is mandatory** ([`../07-agentes-ii/`](../07-agentes-ii/)): same problem in CrewAI **and** LangGraph — IBM separates frameworks; here we compare them in a single workshop.
- [ ] Template [01-Aerolínea](../../examples/01-airline-flight-change/) to see agent + tools + guardrails.

### You already completed IBM course 9 (MCP)

- [ ] M8 ([`../08-mcp/`](../08-mcp/)): server + client + **security/permissions** — goes deeper than the typical Coursera lab.
- [ ] Link with M9: MCP permissions + AI Security.

### You already completed IBM capstone 10

- [ ] **Do not skip M9** ([`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/)): idempotency, HITL, Kafka, Temporal — probably your biggest gap vs this course.
- [ ] M11 ([`../11-capstone/`](../11-capstone/)): rebuild templates 09, 02, 01 **without looking at solutions**; design new architecture; integrative exam.

### Quick table IBM → first module to open

| If you master IBM course… | Start in this module | If it is too easy, skip to… |
|------------------------|------------------------|----------------------------|
| 1 Develop GenAI Apps | M2 or M1 workshop | M5 (JSON/eval) |
| 2 Build RAG Apps | M3 | M4 |
| 3 Vector DBs | M4 | M5 |
| 4 Advanced RAG | M5 or M6 | M9 (hard-filters in prod) |
| 5 Multimodal | M6 | M9 |
| 6 Fundamentals Agents | M7 | M8 |
| 7 LangGraph Agentic | M7 (CrewAI/AutoGen) | M8 |
| 8 CrewAI/AutoGen/BeeAI | M8 | M9 |
| 9 MCP | M9 | M11 |
| 10 Capstone | M9 + M11 | — |

### Common setup (all profiles)

- [ ] M0 ([`../00-setup/`](../00-setup/)): environment, Python review, first `flow.json` in RAGorbit.
- [ ] Read [`HANDOFF.md §3`](../HANDOFF.md): tri-modal method and scratch/stdlib constraint.

---

## 6. Conclusion

| Criterion | IBM Coursera program | This course (M0–M11) |
|----------|----------------------|----------------------|
| RAG + Agents + MCP + Multimodal syllabus | ✅ 10 courses | ✅ **100% covered** (table §2) |
| IBM certifiable skills (11 areas) | ✅ | ✅ **All mapped** (table §3) |
| Frameworks (LangChain, LangGraph, LlamaIndex, CrewAI, AutoGen, BeeAI, MCP) | ✅ | ✅ + comparisons and trade-offs |
| Production (idempotency, HITL, audit, Temporal) | ⚠️ Minimal | ✅ **Dedicated M9** |
| Design and contracts (Flow IR, 53 nodes) | ❌ | ✅ **M0 + M11 + catalog** |
| Real industry cases | ⚠️ Generic | ✅ **10 templates** |
| Implementation from scratch | ⚠️ Partial | ✅ **Scratch layer in every workshop** |
| GraphRAG, multi-index, hard-filters | ⚠️ Superficial | ✅ **M4 in depth** |
| Final evaluation | Coursera project | ✅ **Triple capstone** (rebuild + design + exam) |

**Verdict:** plan v2 ([`PLAN.md §11`](../PLAN.md)) **fully covers** the IBM "RAG and Agentic AI" syllabus and **goes beyond it** in production, design awareness, industry cases, and ability to rebuild systems from scratch. The IBM syllabus served as a **safety net** for coverage; the material, pedagogical order, and deliverables are **this repository's own**.

---

*Related documents: [`PLAN.md`](../PLAN.md) · [`HANDOFF.md`](../HANDOFF.md) · [`catalogo-nodos.md`](./catalogo-nodos.md) · [`plantillas-mapeadas.md`](./plantillas-mapeadas.md) · [`tecnologias-comparadas.md`](./tecnologias-comparadas.md)*

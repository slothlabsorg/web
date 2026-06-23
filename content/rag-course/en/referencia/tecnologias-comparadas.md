# Compared technologies — RAG & Agentic AI course reference

> Decision tables for choosing **models, stores, frameworks, and tools** against competing alternatives. Each section follows the course polarity: **why it exists, when to use it, when NOT to, and what replaces it**. Price figures and context window sizes are **approx. 2025** — verify in the provider documentation before budgeting.
>
> **Audience:** Python programmers, no prior RAG/AI knowledge. Anchor each decision to a RAGorbit node ([`catalogo-nodos.md`](./catalogo-nodos.md)) and the module where it is covered in depth.

---

## 1. LLM models

### Table: closed providers (API)

| | Claude (Anthropic) | GPT (OpenAI) | Gemini (Google) |
|-|--------------------|-------------|-----------------|
| Main models | Opus 4.8, Sonnet 4.6, Haiku 4.5 | GPT-4o, GPT-4o-mini | Gemini 1.5 Pro, Flash |
| Context window (approx. 2025) | 200K tokens | 128K tokens | 1M tokens |
| Strengths | Long reasoning, instruction following, safety | Broad ecosystem, mature tool calling | Huge window, multimodal, Google integration |
| Output price (approx. 2025) | Opus: ~$15/MTok | GPT-4o: ~$10/MTok | Pro: ~$7/MTok |
| How to run them | API (`ANTHROPIC_API_KEY`) | API (`OPENAI_API_KEY`) | API (Google AI / Vertex) |
| Privacy | Data leaves to provider cloud | Same | Same |
| Offline mode | No | No | No |
| RAGorbit default | `anthropic:claude-opus-4-8` | configurable | configurable |

### Table: open-weights models (public weights)

| | Llama (Meta) | Mistral | Gemma (Google) |
|-|--------------|---------|----------------|
| License | Llama 3 Community | Apache 2.0 (Mistral 7B) | Gemma Terms |
| Models | Llama 3.1 8B / 70B / 405B | Mistral 7B, Mixtral 8x7B, Mistral Large | Gemma 2 2B / 9B / 27B |
| Window (approx. 2025) | 128K (3.1 70B) | 128K (Large) | Variable by size |
| How to run them | **Ollama**, Hugging Face, vLLM | Ollama, Mistral API, HF | Ollama, Hugging Face |
| Cost | Infrastructure only (GPU/CPU) | Infrastructure only | Infrastructure only |
| Privacy | Total if local | Total if local | Total if local |

### Table: deployment forms

| Form | What it is | When | Limitations |
|-------|--------|--------|--------------|
| **Provider API** | HTTP call to Claude/OpenAI/Gemini | Fast prototype, maximum quality without GPU | Cost per token, data in cloud |
| **Ollama** | Local runtime with one command (`ollama run llama3.1`) | Development without network, confidential data | Lower quality than frontier; GPU recommended |
| **Hugging Face** | Model hub + Inference API or self-host | Experiment with open models, embeddings | Self-host requires DevOps; API with limits |
| **vLLM / TGI** | High-performance inference server | On-premise production at scale | Requires GPU and operations |

**RAGorbit node:** [`model.llm`](./catalogo-nodos.md#modelllm) · **Module:** [M1 — Fundamentals](../01-fundamentos/guia.md#8-comparison-claude-vs-openai-vs-gemini-vs-llamamistral)

### How to choose / when to use each

For **prototypes** where cost does not matter, Claude Opus 4.8 or GPT-4o offer the best reasoning quality with minimal integration effort (one `model` field in the `model.llm` node). In **production with a flexible budget**, Sonnet 4.6 or GPT-4o balance quality and cost; for **high volume**, Haiku 4.5 or GPT-4o-mini reduce the per-token bill. If data **cannot leave your infrastructure** — banking contracts, medical records, air-gapped environments — Llama 3.1 70B via Ollama or vLLM is the natural option, assuming you accept lower reasoning quality and GPU cost. Gemini 1.5 Pro stands out when you need a **huge context window** (1M tokens) for long-context or multimodal, but remember that RAG is usually cheaper and more precise than "stuffing the whole document" into the prompt.

---

## 2. Embedding models

| Model | Dim | Max tokens | Multilingual | Cost (approx. 2025) | Privacy | Symmetric / asymmetric |
|--------|-----|-----------|-------------|---------------------|-----------|------------------------|
| `text-embedding-3-small` (OpenAI) | 1 536 | 8 191 | Yes | $0.02/1M tokens | External API | Symmetric (with optional prefixes) |
| `text-embedding-3-large` (OpenAI) | 3 072 (reducible) | 8 191 | Yes | $0.13/1M tokens | External API | Symmetric |
| `text-embedding-ada-002` (OpenAI) | 1 536 | 8 191 | Yes | $0.10/1M tokens | External API | Legacy |
| `embed-english-v3.0` (Cohere) | 1 024 | 512 | No (English) | $0.10/1M tokens | External API | Asymmetric (`search_query` / `search_document`) |
| `embed-multilingual-v3.0` (Cohere) | 1 024 | 512 | Yes (~100 languages) | $0.10/1M tokens | External API | Asymmetric |
| `BAAI/bge-large-en-v1.5` (local) | 1 024 | 512 | No | Free | Total if local | Asymmetric (query/passage prefixes) |
| `BAAI/bge-m3` (local) | 1 024 | 8 192 | Yes | Free | Total if local | Asymmetric |
| `intfloat/e5-large-v2` (local) | 1 024 | 512 | No | Free | Total if local | Asymmetric (`query:` / `passage:`) |
| `intfloat/multilingual-e5-large` (local) | 1 024 | 512 | Yes | Free | Total if local | Asymmetric |
| `nomic-embed-text-v1` (local) | 768 | 8 192 | No | Free | Total if local | Symmetric |

**RAGorbit node:** [`model.embedding`](./catalogo-nodos.md#modelembedding) · **Module:** [M3 — Embeddings and stores](../03-embeddings-y-stores/guia.md#13-embedding-models-openai-vs-cohere-vs-bgee5-local)

### How to choose / when to use each

RAG retrieval is almost always **asymmetric**: the query is short ("vacation days?") and the document is a long paragraph. That is why E5 and BGE with task prefixes (`query:` / `passage:`) often beat purely symmetric embeddings on retrieval benchmarks. If you already have an OpenAI API key and want the **shortest development time**, `text-embedding-3-large` is the RAGorbit default and works well multilingual. Cohere fits if you already use its reranker or need the API's explicit asymmetric mode. For **total privacy** or offline mode, local BGE or E5 (via `sentence-transformers`, Ollama `nomic-embed-text`) eliminate external calls; you need a GPU to index at scale. **Critical rule:** the same model must be used at ingest and query; if you change it, re-index everything.

---

## 3. Vector stores

| Store | Type | Metadata filters | CRUD | Persistence | Practical scale | On-prem | Cloud managed | Main strength |
|-------|------|------------------|------|--------------|-----------------|---------|---------------|---------------------|
| **ChromaDB** | Open source, embedded | Rich (operators) | add/update/delete native | Local disk | ~10M vectors | ✅ | ❌ native | Zero-config, ideal for prototypes |
| **FAISS** | Library (Meta) | Manual (external) | Manual | File on disk | 100M+ | ✅ | ❌ | Extreme speed, total control |
| **pgvector** | Postgres extension | Full SQL (`WHERE`) | Standard SQL | Postgres | ~5M practical | ✅ | ✅ (RDS, Supabase) | Joins, ACID transactions, complex filters |
| **Qdrant** | Dedicated vector DB | Very rich payload filtering | REST/gRPC API | Disk + snapshots | 100M+ | ✅ Docker | ✅ Qdrant Cloud | Advanced filters, Rust, good performance |
| **Pinecone** | SaaS | Metadata filters | API | Managed | Unlimited (SaaS) | ❌ | ✅ | Zero-ops, automatic scale |
| **Weaviate** | Vector DB + graph | GraphQL + hybrid BM25 | API | Disk/cluster | 100M+ | ✅ Docker | ✅ WCS | Native hybrid, multimodal |
| **Milvus** | Open source enterprise | Rich | API | Distributed cluster | 1B+ | ✅ | ✅ Zilliz | Massive scale, Attu ecosystem |

**RAGorbit nodes:** [`store.chroma`](./catalogo-nodos.md#storechroma), [`store.pgvector`](./catalogo-nodos.md#storepgvector), [`store.qdrant`](./catalogo-nodos.md#storeqdrant) · **Module:** [M3 — Embeddings and stores](../03-embeddings-y-stores/guia.md#12-vector-store-comparison)

### How to choose / when to use each

**ChromaDB** is the first step in almost every course project: zero server, simple CRUD, native metadata filters — perfect for template 09 (HR) and demos. **FAISS** when you need maximum speed and control the infrastructure yourself, but accept implementing filters and CRUD by hand (anti-pattern: FAISS + complex business filters). **pgvector** if you already have Postgres: template 02 (Banking) uses it because hard SQL filters are a regulatory requirement and you can `JOIN` with operational tables. **Qdrant** balances on-premise production with rich payload filters without adding Postgres. **Pinecone** for teams that do not want to operate infrastructure and accept SaaS lock-in. **Weaviate** if you need hybrid search (semantic + BM25) without extra code. **Milvus** only when you exceed tens of millions of vectors and have a platform team. Anti-patterns: Chroma in production with 50M+ docs; pgvector > 5M without prior benchmarking; Pinecone for convenience without evaluating cost at scale.

---

## 4. Chunking strategies

| Strategy | Deterministic | Requires structure | Natural metadata | Pros | Cons | Ideal case |
|-----------|-------------|--------------------|--------------------|------|---------|-----------|
| **Fixed** | Yes | No | No | Simple, fast, predictable | Cuts sentences and paragraphs mid-way | Prototype, homogeneous free text |
| **Recursive** | Yes | Paragraphs/sentences | No | Robust default; respects text hierarchy | Does not understand legal clauses or ATA sections | Articles, reports, policies (RAGorbit default) |
| **Semantic** | No (uses embeddings) | No | No | Variable-size chunks by semantic coherence | Slower and costlier at ingest | Dense narrative texts without clear structure |
| **By-layout** | Yes (with Unstructured) | PDF visual structure | Block `tipo` | Preserves tables, titles, lists as units | Requires advanced parser (Unstructured) | Reports with tables, rich PDFs |
| **By-clause / by-section** | Yes | Domain structure | `clausula_id`, `ata_chapter` | Exact citability; precise hard filters | Requires knowing the document schema | Contracts, regulations, ATA manuals |

**RAGorbit node:** [`ingest.chunker`](./catalogo-nodos.md#ingestchunker) · **Module:** [M2 — Ingestion](../02-ingesta/guia.md#47-chunking-strategy-comparison)

### How to choose / when to use each

Start with **recursive** (RAGorbit default: `chunkSize=1000`, `overlap=150`) unless the domain forces something else. Move to **by-clause** or **by-section** when citability is legal or compliance-related: one chunk = one numbered clause or one ATA section (template 05 Legal, template 08 Manufacturing). Use **by-layout** when the PDF mixes tables, figures, and text and a character splitter destroys meaning — typically with Unstructured as a pre-step. **Semantic chunking** only when recursive produces incoherent chunks in very long narrative texts and you have GPU budget at ingest. **Fixed** only for quick prototypes or when documents are already pre-chunked. Overlap > 30% inflates the index without proportional benefit.

---

## 5. Ingestion frameworks

| Framework | Abstraction | Strengths | Weaknesses | Best for | Avoid if |
|-----------|-------------|------------|-------------|-----------|----------|
| **LangChain loaders** | `Document` + 100+ loaders in `langchain-community` | Easy install; integration with LCEL splitters and stores | Extraction quality varies by underlying loader | Simple PDFs, CSV, web; LangChain stack | You need maximum quality on complex PDFs |
| **LlamaIndex readers** | `Node` + `llama-hub` readers | Rich metadata by default; multi-format `SimpleDirectoryReader` | Ecosystem separate from LangChain | LlamaIndex projects; mixed directories | You only use LangChain without mixing |
| **Unstructured.io** | Typed elements (`Title`, `Table`, `NarrativeText`) | Best parsing of rich PDFs; `hi_res` mode with vision | Slower; `hi_res` requires heavy dependencies or cloud API | Complex tables, multiple columns, figures | PDF is simple plain text |
| **`loader.multimodal` RAGorbit** | Integrated pipeline tables→JSON, images→vision | `sectionScheme` (ATA), contract with graph nodes | Vision cost and latency | Technical manuals, policies with photos | Document is text-only |

**RAGorbit nodes:** [`loader.*`](./catalogo-nodos.md#2-loader--fuentes-de-datos), [`ingest.chunker`](./catalogo-nodos.md#ingestchunker) · **Module:** [M2 — Ingestion](../02-ingesta/guia.md#7-ingestion-framework-comparison)

### How to choose / when to use each

If your stack is already LangChain/LangGraph (like RAGorbit codegen), **LangChain loaders** cover 80% of cases with minimal friction. If the project revolves around LlamaIndex indexes and query engines, its **readers** offer richer metadata from the start. When extraction quality is the bottleneck — legal PDFs with column tables, financial reports — **Unstructured** before the chunker is worth it even if it adds latency. The **`loader.multimodal`** RAGorbit node combines tabular extraction, vision, and `sectionScheme` in a contract that fits directly with `ingest.chunker` and hard filters from `retrieval.vector`.

---

## 6. Retrieval and rerankers

### Search: dense vs BM25 vs hybrid

| Method | Precision | Recall | Latency | When |
|--------|-----------|--------|----------|--------|
| **BM25** (keyword) | High on exact terms | Low on semantics | Very low | IDs, codes, part numbers, proper names |
| **Vector** (dense) | Medium-high | High on natural language | Low | Everyday-language questions, synonyms |
| **Hybrid** | High | High | Medium | **General case** in technical + natural domains |
| **GraphRAG** | Very high (structure) | Medium | High | Relationships between entities (Neo4j) |

### List fusion (hybrid)

| Method | When to prefer |
|--------|-----------------|
| **RRF** (Reciprocal Rank Fusion) | Scores on different scales (BM25 and cosine) — **recommended default** |
| **Weighted sum** (`alpha`) | Scores normalized to the same scale; fine control vector vs keyword |
| **Cross-encoder (reranker)** | Maximum precision after retrieving noisy top-K |

### Rerankers

| Model | Quality | Latency | Cost (approx. 2025) | When |
|--------|---------|----------|---------------------|--------|
| **BGE-reranker-v2** | Very high | 50–150 ms local | Free | On-premise production, critical domains |
| **Cohere Rerank v3** | Very high | 100–300 ms API | Pay per use | Fast prototype, Cohere stack |
| **ColBERT** | High | 20–80 ms | Free | Large scale, efficient late interaction |
| **FlashRank** | Medium-high | 5–20 ms | Free | Critical latency, edge |

**RAGorbit nodes:** [`retrieval.vector`](./catalogo-nodos.md#retrievalvector), [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid), [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker) · **Module:** [M4 — Retrieval and query](../04-retrieval-y-query/guia.md#11-technology-comparison)

### How to choose / when to use each

**Pure vector retrieval** is enough for HR or homogeneous FAQs; as soon as ATA codes, policy numbers, or exact technical jargon appear, add **BM25** and fuse with **RRF** (do not sum raw scores from incompatible scales). The **reranker** goes after retrieve: recover noisy top-10 or top-20, the cross-encoder returns precise top-3 (~50–150 ms extra). In legal, medical, or banking, the reranker is almost always justified; in high-volume bots with latency < 1 s, evaluate whether metadata hard filtering already removes noise. **BGE-reranker** local for privacy; **Cohere Rerank** if you have no GPU. **GraphRAG** only when relationships between entities matter as much as text (template 05 Legal with Neo4j).

---

## 7. Structured output

| Mechanism | Validity guarantee | Cloud APIs | Local models | Automatic retries | Typical use |
|-----------|---------------------|--------------|-----------------|------------------------|------------|
| **Tool-calling** | High (fine-tuned on frontier) | Yes | Variable | No | OpenAI/Anthropic/Google production |
| **JSON-mode** | Medium (valid JSON, not schema) | Yes | Variable | No | Very simple schemas |
| **instructor** | High (Pydantic + retries) | Yes | Yes | Yes (`max_retries`) | When tool-calling is unavailable |
| **outlines** | Total (formal grammar) | No | Yes | No | Local HF models, critical latency |
| **`with_structured_output`** (LangChain) | High (Pydantic) | Yes | Variable | Variable | Pipelines already in LCEL/LangGraph |

| Criterion | instructor | `with_structured_output` | JSON-mode |
|----------|------------|--------------------------|-----------|
| Already using LangChain | Less natural | **Best** | Manual parser |
| Retries with validation feedback | **Native** | Variable | No |
| Strict schema validation | Yes | Yes | **No** (JSON syntax only) |
| LangSmith / tracing | Extra callbacks | **Native** | Manual |
| Models without tool-calling | With retries | Not available | **Only option** |

**RAGorbit node:** [`logic.structured`](./catalogo-nodos.md#logicstructured) · **Module:** [M5 — Generation and logic](../05-generacion-y-logic/guia.md#2-structured-output)

### How to choose / when to use each

In RAGorbit pipelines (LangGraph/LCEL), **`with_structured_output`** is the most natural option: Pydantic validates shape, integrates with LangSmith, and fits the `logic.structured` node. Use **instructor** if you want structured output without coupling to LangChain or need automatic retries with validation error messages. **Tool-calling** when the model supports it well and the schema is complex — the production path on frontier models. **JSON-mode** only for simple objects without field validation. **outlines** exclusively with local Hugging Face models where you need a formal guarantee that output satisfies the grammar. Remember: Pydantic validates **shape**, not **truth** — combine with `logic.citations` and RAGAS `faithfulness` evaluation. Business thresholds (`score >= 70`) go in `logic.rules`, never in the LLM.

---

## 8. Evaluation frameworks

| Framework | Type | CI/CD integration | Dashboard | Real time | Provider-agnostic | Main metrics |
|-----------|------|-------------------|-----------|-------------|--------------------------|----------------------|
| **RAGAS** | Batch/offline | Yes (via pytest) | No (exports CSV/JSON) | No | Yes | faithfulness, answer relevancy, context precision/recall |
| **TruLens** | Instrumentation | Partial | Yes (Streamlit) | Yes | Yes | groundedness, relevance per call |
| **DeepEval** | LLM unit tests | Yes (native pytest) | Yes (cloud) | No | Yes | Metrics as tests with `threshold` |
| **promptfoo** | Prompt/model evaluation | Yes (CLI/YAML) | Yes (HTML) | No | Yes | A/B comparison of prompts and providers |

**RAGorbit nodes:** [`logic.citations`](./catalogo-nodos.md#logiccitations), [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback) · **Module:** [M5 — Generation and logic](../05-generacion-y-logic/guia.md#9-evaluation-frameworks)

### How to choose / when to use each

**RAGAS** is the standard for evaluating a full RAG pipeline in batch before a release or in nightly CI: you need a dataset with `question`, `answer`, `contexts`, and optionally `ground_truth`. **DeepEval** turns the same metrics into **pytest tests** with thresholds — ideal if your team already thinks in "tests that fail the build". **TruLens** instruments each call in development and shows a real-time dashboard to iterate prompts without exporting datasets. **promptfoo** shines at **comparing models and prompts** in parallel (YAML + HTML table) — perfect for deciding between Claude and GPT-4o or between two system prompt versions. In mature production: TruLens (continuous monitoring) + RAGAS (periodic batch evaluation).

---

## 9. Agent and multi-agent frameworks

| Framework | Mental model | Memory / state | Flow control | Learning curve | Ideal cases |
|-----------|---------------|------------------|-------------------|----------------------|---------------|
| **LangGraph** | State graph (`StateGraph`, checkpoints) | Checkpointer (memory, SQLite, Postgres) | Maximum — conditional edges, subgraphs, HITL | Medium-high | Transactional agents, supervisor multi-agent, RAGorbit production |
| **CrewAI** | Crew = agents + tasks + roles | Crew memory (short/long term) | Medium — declarative orchestration by roles | Low-medium | Agent teams with fixed roles (researcher, writer, reviewer) |
| **AutoGen / AG2** | Conversation between agents | Conversational history | Low-medium — emergent from dialogue | Medium | Collaborative prototypes, coding agents, exploration |
| **BeeAI** | Modular agents (IBM) | Configurable per agent | Medium | Medium | IBM/watsonx enterprise integration, governed agents |
| **Semantic Kernel** | Plugins + planners (Microsoft) | Semantic memory + embeddings | Medium-high — automatic planners | Medium-high | .NET/Azure ecosystem, orchestration with typed plugins |

### Agent patterns (complement)

| Pattern | Flexibility | LLM cost | When |
|--------|-------------|-----------|--------|
| **ReAct** | High | Medium (N steps) | **Starting point** — conversational and transactional agents |
| **Plan-and-Execute** | Low (fixed plan) | Higher | Long tasks with well-defined steps |
| **Reflexion** | High | High (steps + evaluation) | Batch with reliable evaluation function |

**RAGorbit nodes:** [`agent.react`](./catalogo-nodos.md#agentreact), [`agent.fanout`](./catalogo-nodos.md#agentfanout), [`tool.*`](./catalogo-nodos.md#10-tool--herramientas-externas) · **Modules:** [M6 — Agents I](../06-agentes-i/guia.md), [M7 — Agents II](../07-agentes-ii/guia.md)

### How to choose / when to use each

**LangGraph** is the production framework of the course and RAGorbit: explicit graphs, checkpointing between turns, guardrails as conditional edges, and traceable audit. Start with `create_react_agent` (M6) and migrate to explicit `StateGraph` when you need HITL, fan-out, or subgraphs (M7). **CrewAI** accelerates multi-role prototypes where each agent has a fixed persona — excellent for the comparative rebooking workshop in M7, less fine control than LangGraph in regulated production. **AutoGen/AG2** serves to explore emergent conversational dynamics; in transactional customer service the implicit flow makes audit difficult. **BeeAI** and **Semantic Kernel** make sense in already-adopted IBM or Microsoft stacks. For a single agent with 2–3 tools, **ReAct** (`agent.react`) is enough; multi-agent only when there is real parallelization (template 10 Logistics) or strong domain specialization.

---

## 10. MCP vs plugins and proprietary functions

| Aspect | **MCP** (Model Context Protocol) | **Plugins / proprietary functions** |
|---------|----------------------------------|--------------------------------------|
| Standard | Open (Anthropic + ecosystem) | Closed per provider (OpenAI Plugins, Assistants) |
| Transport | STDIO, Streamable HTTP | Provider proprietary HTTP |
| Discovery | Client lists tools/resources/prompts from server | Manual definition per integration |
| Security | Sampling, roots, permission approval | Variable; depends on provider |
| Portability | One MCP server serves Claude, Cursor, custom agents | Lock-in to provider ecosystem |
| Implementation | FastMCP (Python), custom servers | Provider SDK |
| In RAGorbit | Node [`tool.mcp`](./catalogo-nodos.md#toolmcp) | [`tool.service`](./catalogo-nodos.md#toolservice), [`tool.http`](./catalogo-nodos.md#toolhttp) |

**Module:** [M8 — MCP](../08-mcp/guia.md)

### How to choose / when to use each

Use **MCP** when you want to expose tools in a **standard, reusable** way across different clients (IDE, airline agent, internal copilot) with an explicit permission model — the M8 workshop exposes PolicyRAG as an MCP server with approval of sensitive actions. **Proprietary tools** (`tool.service`, `tool.http`) remain valid for one-off REST integrations that do not need the protocol or portability. MCP does not replace your business APIs: it **wraps** them in a contract the agent discovers dynamically. In regulated production, combine MCP with `guardrail.pre-tool` and `guardrail.confirm` for irreversible actions.

---

## 11. Guardrails

| Approach | What it offers | Strengths | Weaknesses | When |
|---------|-----------|------------|-------------|--------|
| **Guardrails AI** | Python validators + guardrails hub (PII, toxicity, schema) | Integrable in pipeline; pre/post LLM validation | Curve for complex custom guardrails | Python-first startups and teams |
| **NeMo Guardrails** | Colang DSL + programmatic rails (NVIDIA) | Multi-turn conversation with declarative rails | NVIDIA stack; DSL learning curve | Enterprise environments with NeMo/NVIDIA |
| **Custom (RAGorbit)** | `guardrail.*` nodes in the graph | Deterministic, auditable, no external dependency | Must implement each rule | **Production with legal/financial consequences** |

### Equivalent RAGorbit nodes

| Need | Native node | External alternative |
|-----------|-------------|---------------------|
| Validate before executing tool | `guardrail.pre-tool` | Guardrails AI validator |
| User confirmation (payments) | `guardrail.confirm` | NeMo dialog rail |
| Transactional idempotency | `guardrail.idempotency` | Redis + composite key |
| Resilience (retry, circuit breaker) | `guardrail.resilience` | tenacity, Istio |

**RAGorbit nodes:** [§11 guardrail](./catalogo-nodos.md#11-guardrail--seguridad-y-resiliencia) · **Module:** M9 — Production and security *(pending, see `PLAN.md` §6 M9)*

### How to choose / when to use each

The course golden rule: **restrictions with legal or financial consequences must be deterministic**, not instructions in the prompt. RAGorbit `guardrail.*` nodes implement that in the graph — the LLM does not decide whether a payment > $500 requires confirmation; the `guardrail.confirm` node enforces it. **Guardrails AI** and **NeMo Guardrails** add content validation layers (PII, toxicity, jailbreaks) useful as a complement, especially in the exploration phase. In banking, airlines, or healthcare, prioritize custom guardrails in the graph + prompt injection tests (M9 workshop); external libraries are accelerators, not substitutes for business logic.

---

## 12. Observability

| Tool | Approach | LLM traces | Infra metrics | Cost | Open source | LangChain integration |
|-------------|---------|------------|----------------|-------|-------------|----------------------|
| **LangSmith** | LangChain LLM platform | Excellent (chains, agents, tools) | Basic | SaaS (limited free tier) | No | **Native** |
| **Langfuse** | LLM observability | Complete (prompts, tokens, latency) | Basic | SaaS + self-host | Yes (core) | Good (callbacks) |
| **OpenTelemetry + Phoenix** | OTel standard + Arize Phoenix UI | Good (via instrumentation) | **Excellent** (Prometheus/Grafana) | Free (self-host) | Yes | Via OTel callbacks |

**RAGorbit nodes:** [`observability.audit`](./catalogo-nodos.md#observabilityaudit), [`observability.metrics`](./catalogo-nodos.md#observabilitymetrics), [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback) · **Module:** M9 — Production and security *(pending)*

### How to choose / when to use each

**LangSmith** if your entire stack is LangChain/LangGraph and you want to debug chains and agents with minimal configuration — the lowest-friction path in M6+. **Langfuse** when you need **open source** or self-hosting with a dashboard of prompts, costs, and latency without lock-in to LangChain. **OpenTelemetry + Phoenix** (or Jaeger/Grafana) when observability must **unify LLM with infrastructure** — Kafka throughput, P95 latency, circuit breakers — as in template 10 (Logistics). In RAGorbit, `observability.audit` publishes tool calls to Kafka/log for regulatory audit; the tools above complement with token visibility and debugging. Combine audit in the graph + Langfuse/LangSmith for development + OTel for production.

---

## 13. UIs for RAG and agents

| Framework | Paradigm | Chat UI | Deployment | Curve | Best for |
|-----------|-----------|---------|------------|-------|-----------|
| **Gradio** | ML components (`gr.ChatInterface`, `gr.Blocks`) | Native, polished with little code | Hugging Face Spaces, local | Low | RAG demos, internal prototypes, quick chatbots |
| **Streamlit** | Reactive script (`st.chat_message`, `st.chat_input`) | Good with widgets | Streamlit Cloud, local | Low | Evaluation dashboards (TruLens), internal tools |
| **Flask** (+ FastAPI in RAGorbit) | Traditional API/web | Must build it | Any hosting | Medium | Production, total control, integration with existing systems |

**RAGorbit nodes:** [`io.input`](./catalogo-nodos.md#ioinput), [`io.output`](./catalogo-nodos.md#iooutput) · **Modules:** M9 — Production *(pending)*, also covered in IBM syllabus (M1/M5 Flask)

### How to choose / when to use each

**Gradio** is the fastest option for teaching and demonstrating RAG: `gr.ChatInterface` in ~20 lines connected to your chain. **Streamlit** shines when the UI is a monitoring or evaluation panel (TruLens dashboard, faithfulness metrics) rather than a production chat. **Flask/FastAPI** when you need authentication, SSE/WebSocket, rate limiting, and a stable API contract — RAGorbit generates `deploymentTarget: chat-service` with FastAPI for that. For the M9 workshop (payment with idempotency + guardrail), Gradio is enough to test the flow; in production you migrate the same logic to the FastAPI skeleton from codegen.

---

## 14. Production orchestration

| Approach | Durability | State | Retry / saga | Ops complexity | When |
|---------|-------------|--------|--------------|-----------------|--------|
| **Temporal** | High (durable workflow) | Full workflow history | Native, with compensations | High (Temporal cluster) | Processes of days/weeks, HITL, multi-step approvals |
| **Queues + DB state** (Kafka + Postgres) | Medium-high | State in tables/event log | Manual (idempotency, retries) | Medium | High volume event-driven, massive fan-out |
| **Cron + batch** | Low | Files/checkpoints | Manual | Low | Nightly indexing, short jobs |

### RAGorbit mapping

| Node | Deployment target | Pattern |
|------|-------------------|--------|
| `io.trigger` | `temporal` | Long workflows with cron and human waits |
| `io.event-source` | `event-worker` | Kafka + exactly-once + fan-out (`agent.fanout`) |
| `io.batch` | `batch` | Scheduled file processing |
| `io.input` | `chat-service` | Real-time FastAPI SSE/WebSocket |

**RAGorbit nodes:** [`io.trigger`](./catalogo-nodos.md#iotrigger), [`io.event-source`](./catalogo-nodos.md#ioevent-source) · **Module:** M9 — Production *(pending)* · Template: [10-logistics-disruption-rebooking](../examples/10-logistics-disruption-rebooking/)

### How to choose / when to use each

**Temporal** when the flow can last days, includes human steps, and must survive server restarts — banking onboarding, multi-stage medical approvals. Operational complexity is only justified with truly long processes. **Kafka + DB state** is the template 10 pattern: thousands of disruption events, stateless `agent.fanout`, idempotency via `guardrail.idempotency` and exactly-once in the consumer. You do not need Temporal if each event is processed in seconds and state lives in Postgres. **Batch with cron** to re-index documents at night (templates 02, 04). Practical rule: real-time chat → FastAPI; massive events → Kafka; endless processes with humans → Temporal.

---

## 15. RAG vs fine-tuning vs pure prompting

| Criterion | Pure prompting | RAG | Fine-tuning |
|----------|----------------|-----|-------------|
| **Initial cost** | Minimum | Medium (index + embeddings) | High (GPU + data + training) |
| **Cost per query** | Prompt tokens | Tokens + retrieval | Tokens only (model already specialized) |
| **Data needed** | None (or few-shot) | Updatable documents | 500–5 000+ quality Q/A pairs |
| **Knowledge update** | Change prompt | Re-index documents | Retrain model |
| **Traceability / citations** | No (source hallucinations) | **Yes** (retrieved chunks) | Not inherently |
| **Privacy** | Data in prompt to provider | Documents in own index | High if training locally |
| **Best for** | General tasks, format, simple classification | FAQs, manuals, policies, compliance | Brand style, ultra-specialized domain |
| **RAGorbit node** | `logic.prompt` | pipeline `loader→store→retrieval→logic` | (external to graph; complements `model.llm`) |

### Decision tree

```
Do you have updatable proprietary documents?
  NO → Pure prompting (zero/few-shot)
  YES → RAG

Does RAG + base model give sufficient quality?
  YES → Stay with RAG
  NO → Do you have +1000 quality Q/A pairs?
         NO → Improve prompting / retrieval / reranker
         YES → Consider fine-tuning (+ RAG in mature systems)
```

**Module:** [M1 — Fundamentals](../01-fundamentos/guia.md#9-rag-vs-fine-tuning-vs-pure-prompting-when-to-use-each)

### How to choose / when to use each

**Pure prompting** solves writing, translation, and classification when the model already knows the topic. As soon as knowledge is **private, changing, or must be cited**, RAG is the first option — the central pattern of the entire course and the 10 templates. **Fine-tuning** does not replace RAG: it teaches *how to reason* or *what tone to use*, while RAG provides the factual *what*. The RAG + fine-tuning combination appears in mature healthcare or legal systems, but the course insists on mastering RAG first because it is cheaper, auditable, and iterable. If RAG fails, before fine-tuning improve chunking, metadata, hybrid, and reranker (M2–M4).

---

## Criticisms of the LangChain / LangGraph / LangSmith stack and when NOT to use it

> This section does not invalidate the tables above (§5, §7, §9, §12): LangChain/LangGraph remain the **reference framework of the course and RAGorbit**, but the tri-modal method requires naming criticisms honestly and knowing when another path is healthier.

### Why so many criticisms

LangChain grew very fast between 2022 and 2024: from loose utilities to LCEL, to fragmentation into packages (`langchain`, `langchain-core`, `langchain-community`, `langchain-openai`…), and LangGraph as the agent orchestration layer. That pace left **many abstractions**, documentation that could not keep up with new versions, and tutorials on the web written for APIs already retired.

Part of the criticism still circulating in forums and posts is **historical and outdated**: complaints about monolithic `LLMChain`, imports from `langchain.schema`, or opaque pre-LCEL/LangGraph agents no longer describe the stack this course uses (LCEL + explicit LangGraph, as of 2025/2026). Another part **remains valid**: debugging inside composed chains, version churn, the question of whether a framework is needed, LangSmith lock-in, and the weight of the dependency tree. The course polarity applies here too: understand the mechanism in layer ② and choose layer ③ with criteria, not fashion.

### Valid criticisms and their nuance

| Criticism | What is true | Mitigation / when it does not apply |
|---------|-------------------|-------------------------------|
| **Over-abstraction and "leaky abstractions"** | When something fails in the middle of an LCEL pipeline or a LangGraph node, the stack trace crosses layers (`RunnableSequence`, callbacks, wrappers) and it is hard to see whether the bug is in the model, retriever, or parser. | Build layer ② (scratch) first to know which step fails; in production, **explicit** graphs (`StateGraph`) instead of opaque chains; logging per node. Does not apply if the pipeline is short (retrieve → prompt → LLM) and you already master it. |
| **Version churn / breaking changes** | Between LangChain 0.1 and 0.2+ (and subsequent minors through 2025/2026) import paths, separated packages, and deprecated APIs changed. A `pip install -U` can break CI. | Pin versions in `requirements.txt` or lockfile; follow the style of the active module's `solucion_framework.py`; migrate package by package (`langchain-core` stable, integrations in `langchain-*`). Less pain if you do not update on every release. |
| **Curve: too many ways to do the same thing** | Loaders, retrievers, memory, "built-in" agents, and LCEL compete with LangGraph patterns; official documentation improves but third-party examples still show legacy paths. | This course reduces the menu: LCEL for linear RAG (M1 §11), `create_react_agent` → `StateGraph` for agents (M6 §8). If you already master one pattern, do not add another without reason. |
| **"Do you really need a framework?"** | For many cases — a chat with 3 tools, RAG with Chroma and an embedding — the **provider SDK** (`openai`, `anthropic`) + vector store + a 40-line `while` loop is enough. The framework adds composition and ecosystem, not magic. | Use a framework when you change providers often, the pipeline has many steps, or you need checkpointing/HITL (LangGraph). Does not apply to one-shot scripts or teams prioritizing minimal dependencies. |
| **LangSmith: proprietary, limited free tier, observability lock-in** | LangSmith is SaaS from LangChain Inc.; the free tier has trace/retention limits (see current provider pricing). The richest traces are optimized for LangChain chains. | LangSmith remains the **lowest-friction** path if the entire stack is LangChain/LangGraph (consistent with §12). To avoid lock-in: **Langfuse** (open-source, self-host) or **OpenTelemetry** + Phoenix/Jaeger. In RAGorbit, `observability.audit` in the graph complements any of them. |
| **Dependency overhead and attack surface** | `langchain` + integrations pull dozens of transitive packages; more code = more CVEs to watch and more `pip install` time in CI. | Course layer ② runs on stdlib; layer ③ only where it adds value. In regulated environments, audit `pip audit` / SBOM; consider native SDK + minimal libraries (`chromadb`, `instructor`). |

### How this course responds to those criticisms

The **tri-modal method** (PLAN §2, HANDOFF §3) is the main defense: in layer ② you implement retrieval, tool calling, and ReAct loops **by hand**; in layer ③ you see how the framework reimplements the same thing. If LangChain changes an import or a chain fails in production, you **reason about the mechanism**, not just the wrapper.

- **"Frameworks do not do magic"** — demonstrated by [M1 §11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch) (Document → splitter → embeddings → vector store → retriever → LCEL) and [M6 §8](../06-agentes-i/guia.md#8-layer--explained-langgraph-from-scratch-from-your-react-loop-to-the-graph) (your ReAct `while` mapped to nodes and edges).
- **You do not depend on the framework to design** — the RAGorbit node catalog is agnostic; LangChain is one layer ③ implementation, not the system definition.
- **Explicit alternatives** — §9 already compares LangGraph with CrewAI/AutoGen; hands-on without LangChain (table below) avoid monoculture.
- **Observability without lock-in** — §12 positions Langfuse and OTel as legitimate peers of LangSmith; the course does not assume you pay SaaS to learn.

### When LangGraph/LangChain ARE worth it — and when NOT

| Situation | Recommendation | Why |
|-----------|---------------|---------|
| Multi-step RAG pipeline (retrieve → rerank → structured output → rules) with provider change | **LangChain/LCEL + LangGraph** | `Runnable` composition, parsers, and auditable nodes; aligned with RAGorbit codegen |
| Transactional agent with checkpointing, HITL, subgraphs, fan-out | **LangGraph** (`StateGraph`) | Explicit flow control — consistent with §9 and M7 |
| Multi-role prototype with fixed personas (researcher, writer) | **CrewAI** or LangGraph | CrewAI faster for roles; LangGraph if you later need guardrails in the graph |
| Single script, < 50 lines, one provider, no memory between sessions | **Native SDK** | Fewer dependencies, direct debugging |
| Simple RAG (embed → Chroma → top-k → prompt) without complex orchestration | **Native SDK** or **LlamaIndex** | See [rag-sin-langchain.md](./rag-sin-langchain.md); LangChain adds little if you do not compose many steps |
| Team already standardized on LlamaIndex, Haystack, or Pydantic-AI | **That framework** | Do not add LangChain on top without a planned migration |
| Unified LLM + infra observability (Kafka, P95, Prometheus) | **OpenTelemetry** (+ Phoenix/Jaeger) | §12; LangSmith only covers the LLM layer well |
| Environment with strict dependency audit / air-gap | **Layer ② + minimal SDK** | Smaller surface; full framework only if the business requires it |

### Alternatives by layer

| Layer | Option without LangChain (course hands-on) | When to prefer it |
|------|------------------------------------------|-------------------|
| **RAG** (ingest → retrieve → generate) | [rag-sin-langchain.md](./rag-sin-langchain.md) — LlamaIndex, Haystack, native SDK | Project centered on indexes/query engines; minimal deps; IBM M2/M4 comparison |
| **Agents** (tools, ReAct, multi-agent) | [agentes-sin-langchain.md](./agentes-sin-langchain.md) — CrewAI, AutoGen/AG2, Pydantic-AI, native loop | Declarative roles (CrewAI), emergent dialogue (AutoGen), typed validation (Pydantic-AI), or total control (loop) |
| **Observability** | Langfuse, OpenTelemetry (+ Phoenix) | Self-host, no lock-in to LangChain Inc.; see §12 |
| **Structured output** | `instructor`, `outlines` | Without coupling to `with_structured_output`; see §7 |

### How to choose / when to use each

If you reach this document **from scratch**, do not interpret the criticisms as "avoid LangChain": the course uses it in layer ③ because RAGorbit codegen and the templates align with LCEL/LangGraph, and because changing providers or composing long pipelines is cheaper with those pieces. **Do avoid it** (or delay it) when you still do not understand what each step does — there layer ② is mandatory, not optional — or when your organization already chose another framework and mixing two stacks only doubles debt.

For **observability**, LangSmith in development + Langfuse/OTel in production is a reasonable combination and does not contradict §12. For **simple agents**, native SDK or Pydantic-AI may suffice; reserve LangGraph for flows that §9 already marks as production (checkpoints, HITL, audit). The course practical rule: **understand the mechanism in ②, choose the tool in ③, and be able to name the alternative in the table above** before a Reddit post decides for you.

---

> **Cross-links**
>
> - Node catalog (per-node sheet): [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Course plan (modules and "Competes"): [`PLAN.md`](../PLAN.md) — especially §6 and §11
> - Guides by module:
>   - [M1 Fundamentals](../01-fundamentos/guia.md) — LLM, minimal RAG, model choice
>   - [M2 Ingestion](../02-ingesta/guia.md) — loaders, chunking, metadata
>   - [M3 Embeddings and stores](../03-embeddings-y-stores/guia.md) — indexes, Chroma, FAISS, pgvector
>   - [M4 Retrieval and query](../04-retrieval-y-query/guia.md) — hybrid, rerank, GraphRAG
>   - [M5 Generation and logic](../05-generacion-y-logic/guia.md) — structured output, evaluation
>   - [M6 Agents I](../06-agentes-i/guia.md) — ReAct, memory, LangGraph
> - Industry templates: [`examples/`](../examples/)
> - Flow IR contract: [`docs/01-concepts.md`](../../docs/01-concepts.md)
> - Technical node catalog: [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md)

---

*RAGorbit course reference document. Generated for modular study: read it alongside the active module guide and return here when you need to compare alternatives.*

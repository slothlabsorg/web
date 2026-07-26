# Glossary — RAG & Agentic AI

> Didactic definitions of the course's key terms, written for someone who programs in Python but does not know RAG or AI frameworks. Each entry links to the module where it is covered in depth and, when applicable, to the corresponding node in the RAGorbit catalog.

---

## Index by letter

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [Z](#z)

---

## A

### Agent

An **agent** is a system where an LLM decides at runtime which steps to take and which tools to invoke to complete a task. Unlike a fixed RAG pipeline (always retrieve → always generate), the agent can skip steps, chain several tools, or ask for more information based on what it discovers.

**What it's for:** transactional or multi-step tasks with uncertainty (flight change, order return, research across multiple sources).

**Example:** the user says "I want to change my flight from the 15th to the 17th" → the agent first checks the reservation, then the fare policy, then inventory, and only then responds.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · node [`agent.react`](./catalogo-nodos.md#agentreact) in `catalogo-nodos.md`

---

### Agentic RAG

**Agentic RAG** exposes the vector retriever as a *tool* that the agent invokes when needed, instead of always running retrieval at the same point in the pipeline. The agent decides *whether*, *when*, *with what query*, and *with what filters* to search the knowledge base.

**What it's for:** queries where RAG is not always needed, or where the optimal query depends on data obtained in earlier steps (e.g. search for penalty only after knowing the `fare_class`).

**Example:** `policy_rag(query="penalidad ECONOMY_FLEX internacional")` is called after `ReservationService`, not before.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`tool.retriever`](./catalogo-nodos.md#toolretriever)

---

### Hallucination

A **hallucination** occurs when the LLM generates plausible but incorrect or invented information: nonexistent citations, wrong figures, policies not in the documents. It is not a model "bug": it is a consequence of predicting likely text without verifying facts.

**Why it matters:** justifies RAG (anchor answers in documents), mandatory citations, low temperature, and *faithfulness* evaluation.

**Example:** without RAG, the model may claim "15 vacation days in the first year" even though the real policy says 12.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### ANN (Approximate Nearest Neighbor)

**ANN** (approximate nearest neighbor search) is the family of algorithms that find the vectors most similar to a query without comparing against every vector in the index. It sacrifices a minimal fraction of precision in exchange for speed on large corpora.

**What it's for:** making vector search viable with millions of embeddings; HNSW and IVF indexes are ANN implementations.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Answer relevancy

**Answer relevancy** measures whether the LLM's final answer addresses the user's question, regardless of whether it is supported by the documents. An answer can be *faithful* to the context but irrelevant to the question.

**What it's for:** detecting answers that are "correct according to the chunks" but do not answer what the user asked.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · RAGAS

---

### Permission approval (MCP)

In the MCP protocol, **permission approval** requires the user (or the system) to explicitly authorize sensitive actions before the MCP client executes them: reading files outside *roots*, invoking write tools, using the host LLM's *sampling*.

**What it's for:** preventing an agent connected to multiple MCP servers from executing dangerous operations without human control or a security policy.

**See also:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### AutoGen / AG2

**AutoGen** (now evolving as **AG2**) is a Microsoft framework for orchestrating conversations between multiple LLM agents that pass messages, delegate subtasks, and can invoke tools. It stands out in research prototypes and conversational flows between specialized roles.

**What it's for:** experimenting with multi-agent dialogue patterns without defining an explicit graph as in LangGraph.

**See also:** `PLAN.md` §6 M7

---

## B

### Bag-of-words

**Bag-of-words** represents text as a vector of term frequencies, ignoring order. It is a classic lexical information retrieval technique, used in this course as a toy embedding in layer ② (scratch).

**What it's for:** understanding the similarity mechanism without depending on external models; in production it is replaced by semantic embeddings.

**Example:** `"vacation days"` and `"rest days"` share the word "days" but not synonyms → partial, not total similarity.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### BeeAI

**BeeAI** is an IBM agent framework oriented toward composing agentic workflows with integration in the watsonx ecosystem. It competes with CrewAI and LangGraph in enterprise scenarios with governance requirements.

**What it's for:** building agents in IBM/watsonx environments or comparing orchestration approaches against LangGraph and CrewAI.

**See also:** `PLAN.md` §6 M7

---

### Bi-encoder

A **bi-encoder** encodes the query and each document separately into independent embeddings and then compares similarity (cosine or dot product). It is the standard approach of embedding models and dense search in vector stores.

**What it's for:** indexing millions of documents efficiently (the document embedding is computed once at ingestion).

**Contrast:** the *cross-encoder* evaluates query+document together and is more accurate but much slower → used in reranking, not mass indexing.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### BM25

**BM25** (Best Match 25) is the keyword ranking algorithm used in Elasticsearch and classic retrieval. It combines term frequency (TF), inverse rarity (IDF), and document length normalization.

**What it's for:** retrieving exact matches of codes, technical identifiers (ATA 32-11-00), or proper names that dense embeddings represent poorly.

**Example:** the query `"ATA 32-11-00"` ranks better with BM25 than with pure semantic vectors.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid)

---

### Dense search

**Dense search** converts query and documents into high-dimensional vectors (embeddings) and retrieves the closest by cosine similarity or dot product. It captures semantic meaning even when words differ.

**What it's for:** natural language questions where the user does not use the same vocabulary as the documents.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`retrieval.vector`](./catalogo-nodos.md#retrievalvector)

---

### Hybrid search

**Hybrid search** combines dense (semantic) search and BM25 (lexical) to get the best of both. Fusion is usually done with RRF or weighted sum controlled by the `alpha` parameter.

**What it's for:** technical domains with exact jargon *and* conversational questions (telecom, manufacturing, legal).

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid)

---

## C

### Chain-of-Thought (CoT)

**Chain-of-Thought** is a prompting pattern where you ask the LLM to reason step by step before giving the final answer. It improves tasks that require several logical steps or calculations.

**What it's for:** eligibility, penalty calculations, auditable multi-step reasoning.

**Example:** add "Think step by step before answering" at the end of the prompt (*zero-shot CoT*).

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Checkpoint (LangGraph)

A **checkpoint** in LangGraph is a persisted snapshot of the graph state (messages, variables, tool history) associated with a `thread_id`. It allows resuming conversations between turns or after service restarts.

**What it's for:** conversational memory in production without manually managing message lists.

**Example:** `MemorySaver` + `thread_id: "demo-001"` restores Turn 1 before processing Turn 2.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Chroma / ChromaDB

**ChromaDB** is a Python-embedded vector database: the index runs in the same process, persists to disk, and does not require a separate server. Ideal for prototypes and low-volume demos.

**What it's for:** indexing quickly without standing up Postgres or Docker; template 09 (HR) uses it for simplicity.

**Limitation:** limited multi-process concurrent access; in multi-instance production pgvector or Qdrant is usually preferred.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.chroma`](./catalogo-nodos.md#storechroma)

---

### Chunking

**Chunking** splits long documents into retrievable fragments (*chunks*). It is one of the most critical decisions in the RAG pipeline: large chunks dilute relevance; small chunks lose context.

**Course strategies:**
- **Fixed:** blocks of N characters with overlap.
- **Recursive:** hierarchical separators (`\n\n` → `\n` → `. `).
- **Semantic:** cuts where similarity between consecutive sentences drops.
- **By-layout:** respects visual structure (headings, tables) via Unstructured.
- **By-clause / by-section:** domain separators (clauses, articles, ATA sections).

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.chunker`](./catalogo-nodos.md#ingestchunker)

---

### Chunks

**Chunks** are the text fragments the retriever returns to the LLM as context. In RAGorbit they flow as type `Chunks` between `retrieval.*` and `logic.*` nodes.

**What it's for:** limiting the context window to only what is relevant instead of passing entire documents.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Circuit breaker

A **circuit breaker** temporarily stops calls to an external service when the failure rate exceeds a threshold, returning a fallback instead of continuing to retry. It prevents a degraded service from blocking the agent in chained timeouts.

**What it's for:** payment APIs, inventory, or third parties with variable availability.

**See also:** `PLAN.md` §6 M9 · [`guardrail.resilience`](./catalogo-nodos.md#guardrailresilience)

---

### Citations

**Citations** anchor each LLM claim to a retrieved fragment with verifiable reference (`source`, `chunk_id`, page). In high-stakes domains (healthcare, legal, HR) they are mandatory, not optional.

**What it's for:** audit, user trust, and hallucination detection.

**Example:** `"Employees have 15 days [Source: vacation_policy.pdf, §3.2]"`.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### MCP client

An **MCP client** is the program that connects to one or more MCP servers, lists their tools/resources/prompts, and exposes them to an agent or application. It can communicate via STDIO (child process) or HTTP (Streamable HTTP).

**What it's for:** letting an agent consume standardized external tools without integrating each API by hand.

**See also:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Codegen (RAGorbit)

RAGorbit **codegen** transforms a `flow.json` (Flow IR) into an executable Python project with `app/`, `mocks/`, `tests/`, and the runtime corresponding to `deploymentTarget`.

**What it's for:** going from visual design to deployable code without rewriting the pipeline by hand.

**See also:** [../00-setup/guia.md](../00-setup/guia.md) · `docs/01-concepts.md`

---

### Collection (vector store)

A **collection** is the logical container of vectors + metadata + texts in a vector store (equivalent to a named "table" or "index"). One server can have several collections (`policy`, `faq`, `procedures`).

**What it's for:** separating knowledge domains and applying different configurations per collection.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index)

---

### ColBERT

**ColBERT** (Contextualized Late Interaction over BERT) is a reranking model that pre-computes embeddings per token and combines query and document with late interaction. It offers a balance between quality and scale compared to the classic cross-encoder.

**What it's for:** reranking on large corpora where a pure cross-encoder would be too slow.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

### Confirm-gate

The **confirm-gate** pauses execution of a sensitive tool and asks the user for explicit confirmation before continuing (e.g. payments above threshold, irreversible cancellations). In RAGorbit it is the `guardrail.confirm` node.

**What it's for:** deliberate friction on financial or irreversible actions that the LLM must not execute without consent.

**See also:** `PLAN.md` §6 M9 · [`guardrail.confirm`](./catalogo-nodos.md#guardrailconfirm)

---

### Context precision / Context recall

**Context precision** measures what proportion of retrieved chunks are actually relevant to the question. **Context recall** measures whether the chunks needed to answer were retrieved. Both are RAG retriever quality metrics, not generation metrics.

**What it's for:** diagnosing whether the problem is in retrieval (wrong chunks) or synthesis (LLM ignores good chunks).

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Context stuffing

**Context stuffing** consists of putting entire documents (or nearly entire) into the LLM context window instead of retrieving fragments. It only works if the corpus fits in the window and does not change frequently.

**What it's for:** simple cases with few static documents; becomes unviable with large corpora or the *lost in the middle* problem.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Contract (RAGorbit)

In RAGorbit, a **contract** defines what data types each node can emit and receive (`Message`, `Chunks`, `Retriever`, `Tool`, `Model`, etc.). Connecting two nodes with incompatible types is a design error that the validator detects before codegen.

**What it's for:** ensuring the graph is executable and each piece receives exactly what it needs.

**Example:** `store.chroma` produces `Retriever`; `retrieval.vector` consumes it and produces `Chunks`.

**See also:** [../00-setup/guia.md](../00-setup/guia.md) · `docs/01-concepts.md`

---

### CrewAI

**CrewAI** is a multi-agent framework where you define *agents* (roles), *tasks*, and *crews* (teams) that collaborate sequentially or in parallel with assigned tools. Lower learning curve than LangGraph for agent teams with fixed roles.

**What it's for:** business flows with clear roles (researcher, writer, reviewer) without modeling an explicit state graph.

**See also:** `PLAN.md` §6 M7

---

### Cross-encoder

A **cross-encoder** receives query and document together in a single model pass and returns a relevance score. It is more accurate than the bi-encoder but does not scale to index millions of docs → used in **reranking** over a pre-filtered top-K.

**What it's for:** reordering the 10–20 vector retriever candidates and keeping the 3 most relevant.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

## D

### DeepEval

**DeepEval** is an LLM evaluation framework with predefined metrics (faithfulness, relevancy, hallucination) and support for automated tests in CI. It competes with RAGAS and TruLens.

**What it's for:** integrating RAG evaluation into testing pipelines as you would with unit tests.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Deployment target

The **deployment target** is the deployment profile that RAGorbit infers from the input node (`io.*`): `chat-service` (FastAPI + SSE/WebSocket), `event-worker` (Kafka), `batch` (batch processing), or `temporal` (durable workflows with Temporal).

**What it's for:** having codegen generate the correct skeleton (conversational API vs event worker vs batch job).

**See also:** [../00-setup/guia.md](../00-setup/guia.md) · [`io.input`](./catalogo-nodos.md#ioinput) and [`io.event-source`](./catalogo-nodos.md#ioevent-source)

---

### Dimensionality

**Dimensionality** is the length of the embedding vector (e.g. 768, 1024, 1536, 3072). More dimensions do not guarantee better quality: the model, domain, and similarity metric used in the index matter.

**What it's for:** choosing store, index, and estimating storage cost (more dims = more RAM/disk per vector).

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`model.embedding`](./catalogo-nodos.md#modelembedding)

---

### L2 distance

**L2 distance** (Euclidean) measures the direct geometric distance between two vectors: `√Σ(Aᵢ - Bᵢ)²`. With normalized vectors, ranking by L2 equals ranking by cosine similarity.

**What it's for:** alternative metric in FAISS/Qdrant indexes when embeddings are not normalized.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Dot product

The **dot product** (inner product) sums the element-wise products of two vectors: `Σ AᵢBᵢ`. With **normalized** vectors, it equals cosine similarity and is the fastest operation on hardware (SIMD/GPU).

**What it's for:** maximum-performance vector search when the embedding model delivers unit vectors.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## E

### Embedding

An **embedding** is a fixed-length vector of real numbers representing the meaning of text (or image, audio) in a geometric space. Semantically similar texts end up close; different texts, far apart.

**What it's for:** enabling search by meaning in vector stores; the **same model** must be used at ingestion and at query time.

**Example:** "vacation days" and "paid annual leave" have close embeddings even though they do not share words.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`model.embedding`](./catalogo-nodos.md#modelembedding)

---

### Multimodal embeddings

**Multimodal embeddings** represent text, images, and audio in the same vector space (or aligned spaces), enabling cross-modal search: "find images similar to this description" or "search documents related to this photo".

**What it's for:** RAG over manuals with diagrams, visual catalogs, or mixed text+image knowledge bases.

**See also:** `PLAN.md` §6 M10 · [`loader.multimodal`](./catalogo-nodos.md#loadermultimodal)

---

## F

### Faithfulness

**Faithfulness** measures whether each claim in the LLM answer is supported by the retrieved chunks, without inventing data. It is the central metric for detecting hallucinations in RAG.

**What it's for:** evaluating and monitoring in production; combined with mandatory citations it forms the last line of defense.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### FAISS

**FAISS** (Facebook AI Similarity Search) is a Meta library for vector similarity search at scale, with flat, IVF, and HNSW indexes. Runs in memory or on disk, without a server — ideal for high-performance prototypes and experimentation.

**What it's for:** index benchmarks, compare HNSW vs flat, prototypes without DB infrastructure.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Fan-out (multi-agent)

The **fan-out** pattern dispatches N *stateless* sub-agents in parallel, one per batch item or event, with controlled concurrency. Each sub-agent is independent; state persists in DB or event log, not in shared memory.

**What it's for:** mass shipment rebooking, batch processing of requests, fraud alerts at scale.

**See also:** `PLAN.md` §6 M7 · [`agent.fanout`](./catalogo-nodos.md#agentfanout)

---

### Few-shot / Zero-shot / One-shot

- **Zero-shot:** the LLM executes the task without examples in the prompt.
- **One-shot:** a single input→output example.
- **Few-shot:** several examples (typically 2–5) demonstrating the desired pattern.

These are variants of **in-context learning**: the model imitates the pattern seen in the prompt without retraining.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Soft filter vs hard filter

A **soft filter** is an instruction in the prompt ("use only documents from plan PPO-Gold") that the LLM can ignore. A **hard filter** is a restriction on the retriever (`hardFilters`, WHERE clause in the store) applied **before** similarity calculation — the LLM never sees chunks outside the filter.

**What it's for:** hard filters are business guardrails; soft filters are relevance suggestions insufficient for compliance.

**Example:** `hardFilters: [{fare_class: "BUSINESS"}]` ensures economy fare chunks do not contaminate the answer.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.vector`](./catalogo-nodos.md#retrievalvector)

---

### Fine-tuning

**Fine-tuning** adapts model weights by training on examples specific to your domain or task. Unlike RAG (which injects knowledge into the prompt), it modifies the model's internal behavior.

**What it's for:** consistent response style, highly repetitive tasks with fixed format, domains where RAG is not enough and you have abundant training data.

**When NOT:** knowledge that changes frequently (use RAG); limited budget/time (use prompting + RAG).

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Flat (index)

A **flat** index compares the query against **all** vectors in the corpus (exact/brute force search). Maximum precision, speed linear with corpus size.

**What it's for:** small corpora (< 100K vectors), reference benchmarks, validating that an ANN index does not lose recall.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Flow IR

**Flow IR** (Intermediate Representation) is the JSON (`flow.json`) that describes the node graph, connections, and configuration in RAGorbit. It is the source of truth for the design before codegen.

**What it's for:** versioning architectures, sharing industry templates, and validating contracts between nodes.

**See also:** [../00-setup/guia.md](../00-setup/guia.md) · `examples/*/flow.json`

---

## G

### GraphRAG

**GraphRAG** combines a knowledge graph (entities and relations) with vector search: it retrieves relevant nodes by similarity and expands context by navigating relations (1–2 hops). Microsoft GraphRAG and Neo4j are well-known implementations.

**What it's for:** questions where relations matter as much as text ("which contracts are linked to this company and its subsidiaries?").

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j) · [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph)

---

### Groundedness

**Groundedness** indicates whether the LLM answer is founded on external evidence provided (chunks, tools), not only on the model's parametric knowledge. In practice it is evaluated together with *faithfulness* and citations.

**What it's for:** confidence metric in regulated systems; ungrounded answers are unacceptable in healthcare, legal, or banking.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Gradio

**Gradio** is a Python library for building demo web interfaces (chat, file upload, audio) with few lines. Ideal for prototyping RAG bots and agents without building a frontend.

**What it's for:** quick test UIs in M9 and IBM course labs.

**See also:** `PLAN.md` §6 M9

---

### Guardrail

A **guardrail** is a safety or resilience barrier around tools or the LLM: pre-execution validation, user confirmation, idempotency, circuit breaker. In RAGorbit they are nodes in the `guardrail.*` category that wrap `Tool`.

**What it's for:** ensuring critical constraints are **deterministic**, not prompt instructions the LLM can ignore.

**See also:** `PLAN.md` §6 M9 · guardrail section in [`catalogo-nodos.md`](./catalogo-nodos.md#11-guardrail--security-and-resilience)

---

### Guardrails AI

**Guardrails AI** is an open-source framework for validating LLM inputs and outputs with programmatic validators (PII, toxicity, JSON format, forbidden topics). It competes with NeMo Guardrails and custom guardrails.

**What it's for:** declarative validation layer without reimplementing each check by hand.

**See also:** `PLAN.md` §6 M9

---

## H

### HITL (Human-in-the-Loop)

**HITL** (human in the loop) pauses the agent flow and escalates the case to a human reviewer when a **deterministic** condition is met (not decided by the LLM). The flow resumes after approval, modification, or rejection.

**What it's for:** ambiguous diagnoses, procedures with WARNING, high-severity cases where agent error is unacceptable.

**See also:** `PLAN.md` §6 M9 · [`hitl.escalate`](./catalogo-nodos.md#hitlescalate)

---

### HNSW

**HNSW** (Hierarchical Navigable Small World) is a graph-based ANN index that offers an excellent speed/recall balance for vector search. It is the default in many stores (Qdrant, pgvector with HNSW index, FAISS).

**What it's for:** production with millions of vectors where flat would be too slow.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Hugging Face

**Hugging Face** (HF) is the open-source hub and ecosystem for models, datasets, and libraries (`transformers`, `sentence-transformers`). It lets you download and run LLMs and embeddings locally (Llama, BGE, E5, Whisper).

**What it's for:** open-weights models without paid API; integration with Ollama and sentence-transformers in layer ③.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · `PLAN.md` §6 M10

---

### HyDE

**HyDE** (Hypothetical Document Embeddings) uses an LLM to generate a hypothetical document that would answer the query and uses *its* embedding as the search query. It improves recall when the user's question is very short or distant from corpus vocabulary.

**What it's for:** advanced alternative to query rewriting in domains with lexical gap.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`query.rewrite`](./catalogo-nodos.md#queryrewrite)

---

## I

### Idempotency

**Idempotency** guarantees that executing the same operation multiple times produces the same result without duplicate side effects. In payments, the second call with the same key returns the cached result instead of charging twice.

**What it's for:** channels with streaming/reconnections, network retries, logical exactly-once in transactional operations.

**Example:** first charge `captured`, second with same `idempotencyKey` → `deduplicated`.

**See also:** `PLAN.md` §6 M9 · [`guardrail.idempotency`](./catalogo-nodos.md#guardrailidempotency)

---

### In-context learning

**In-context learning** is the LLM's ability to learn a pattern or task by seeing examples in the prompt, without updating its weights. Few-shot prompting is the most common way to exploit it.

**What it's for:** classification, extraction with specific format, tasks where fine-tuning would be excessive.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Intent detection

**Intent detection** classifies the user message into actionable labels (`policy_query`, `greeting`, `silence`) to decide whether to trigger the RAG pipeline, route to another agent, or discard noise (e.g. audio fragments in a call center).

**What it's for:** reducing cost and latency by avoiding RAG on non-actionable messages; multi-index routing.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`model.intent`](./catalogo-nodos.md#modelintent) · [`query.intent`](./catalogo-nodos.md#queryintent)

---

### Prompt injection

**Prompt injection** is an attack where the user (or a malicious indexed document) inserts instructions that attempt to override the system prompt: "ignore your previous instructions and…". It differs from a generic jailbreak but has the same goal: taking control of model behavior.

**Why it matters:** designing input guardrails, separating instructions from user data, and testing with adversarial cases.

**See also:** `PLAN.md` §6 M9

---

### instructor

**instructor** is a Python library that wraps LLM APIs to obtain output validated against Pydantic models, automatically retrying if validation fails.

**What it's for:** robust structured output without relying exclusively on the provider's native tool-calling.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.structured`](./catalogo-nodos.md#logicstructured)

---

### Vector index

A **vector index** is the data structure (flat, IVF, HNSW…) that efficiently finds the K vectors most similar to a query. Without an index, each search would require comparing against all vectors in the corpus.

**What it's for:** retrieval scalability; index choice affects latency, recall, and RAM.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### IVF (Inverted File Index)

**IVF** groups vectors into *clusters* and at query time only searches the clusters closest to the query. It reduces latency on very large corpora at the cost of configuring the number of clusters and an index training step.

**What it's for:** scale between flat (exact, slow) and HNSW (fast, without explicit cluster training).

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## J

### Jailbreak

A **jailbreak** is an attempt to bypass the model's safety restrictions to obtain prohibited responses (malicious code, PII, harmful instructions). Guardrails and injection tests aim to block these patterns before they reach the LLM or at output.

**Why it matters:** designing defense in depth (input, prompt, output, tool permissions).

**See also:** `PLAN.md` §6 M9

---

## K

### Knowledge cutoff

The **knowledge cutoff** is the date limit of the data the LLM was trained on. The model does not "know" events, laws, or prices after that date — it can only infer or hallucinate.

**What it's for:** justifying RAG for fresh and private data the model never saw in training.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Knowledge graph

A **knowledge graph** models entities (nodes) and typed relations (edges): `Company → signed → Contract → contains → Clause`. It enables neighborhood retrieval in addition to vector similarity.

**What it's for:** GraphRAG, multi-hop questions, domains with explicit relations (legal, healthcare, supply chain).

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j)

---

## L

### LangChain

**LangChain** is the most widely used Python framework for building LLM applications: chains, retrievers, tools, provider integrations, and message abstractions. RAGorbit uses LangChain/LangGraph in production codegen.

**What it's for:** layer ③ of the course — implement RAG and agents with proven components instead of reinventing each piece.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Langfuse

**Langfuse** is an open-source observability platform for LLMs: traces, costs, latency, human feedback, and datasets. Open-source alternative to LangSmith.

**What it's for:** auditing and debugging RAG/agent pipelines in production without vendor lock-in.

**See also:** `PLAN.md` §6 M9 · [`observability.audit`](./catalogo-nodos.md#observabilityaudit)

---

### LangGraph

**LangGraph** extends LangChain with state graphs (`StateGraph`): nodes, conditional edges, checkpoints, and multi-agent. It is the framework RAGorbit uses to generate ReAct agents and flows with branches.

**What it's for:** agents with memory, ReAct loops, multi-agent orchestration with explicit flow control.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`agent.react`](./catalogo-nodos.md#agentreact)

---

### LangSmith

**LangSmith** is LangChain's observability and evaluation platform (traces, datasets, prompt comparison, feedback). Native integration with LCEL chains and LangGraph.

**What it's for:** debugging agents in development and continuous evaluation in teams already using LangChain.

**See also:** `PLAN.md` §6 M9

---

### LlamaIndex

**LlamaIndex** is a framework specialized in RAG: readers, indexes, query engines, advanced retrievers, and GraphRAG. It competes with LangChain in ingestion (M2) and retrieval (M4); it stands out on complex documents.

**What it's for:** layer ③ when you need `VectorStoreIndex`, `ParentDocumentRetriever`, or `RouterQueryEngine`.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### LCEL (LangChain Expression Language)

**LCEL** is LangChain's declarative syntax for composing pipelines with the `|` (pipe) operator: `retriever | prompt | llm | parser`. It supports streaming, batch, and parallelism uniformly.

**What it's for:** building readable, composable RAG chains without imperative loops.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### LLM (Large Language Model)

An **LLM** is a neural network trained to predict the next token given a prefix. At inference it generates text token by token using learned probabilities; it **does not query databases** nor remember previous calls unless you pass the history in the prompt.

**What it's for:** synthesis, natural language reasoning, tool calling, and generation — the central engine of RAG and agents.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`model.llm`](./catalogo-nodos.md#modelllm)

---

### Loader

A **loader** loads raw data from a source (PDF, CSV, web, S3, SQL) and converts it into `Document` objects with text and basic metadata. It is the first step of the ingestion pipeline.

**What it's for:** abstracting input formats; in RAGorbit each source has its `loader.*` node with mocks for development without network.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · loader section in [`catalogo-nodos.md`](./catalogo-nodos.md#2-loader--data-sources)

---
## M

### MCP (Model Context Protocol)

**MCP** is an open protocol (initiated by Anthropic) for LLM applications to connect to external tools, resources, and prompts in a standardized way, with a security model (permissions, roots, sampling). It replaces ad-hoc integrations and proprietary plugins.

**What it's for:** exposing PolicyRAG, internal APIs, or local data as reusable servers for any MCP client.

**See also:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Memory (agent)

An agent's **memory** stores context between steps and between conversational turns:
- **Short term / conversational:** session message history.
- **Working memory:** structured state (PNR, pending amount, chosen flight).
- **Long term:** preferences or facts persistent across sessions (vector store, DB).

**What it's for:** letting the agent remember "do you confirm the change?" from the previous turn when the user answers "yes".

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Metadata

**Metadata** is a dictionary of fields associated with each chunk (`fare_class`, `clausula_id`, `effective_date`, `source`) that the retriever uses as **hard filters** or for citations and audit.

**What it's for:** turning generic vector search into search restricted by business rules.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.metadata`](./catalogo-nodos.md#ingestmetadata)

---

### Multi-agent

A **multi-agent** system coordinates several specialized agents. Course patterns:
- **Supervisor:** one agent orchestrates and delegates to sub-agents.
- **Hierarchical:** layers of managers and workers.
- **Collaborative:** agents with fixed roles passing results (CrewAI).
- **Fan-out:** N stateless agents in parallel per item.

**What it's for:** complex tasks where a single agent "gets lost" or where role separation improves quality and audit.

**See also:** `PLAN.md` §6 M7 · [`agent.fanout`](./catalogo-nodos.md#agentfanout)

---

### Multi-index routing

**Multi-index routing** directs each query to the correct vector index (`policy`, `faq`, `procedures`) instead of searching the entire corpus. It reduces cross-domain noise and latency.

**What it's for:** telecom with three knowledge bases, legal with playbook + regulations + precedents.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index) · [`retrieval.router`](./catalogo-nodos.md#retrievalrouter)

---

## N

### NeMo Guardrails

**NeMo Guardrails** (NVIDIA) is a framework for defining conversation rails with Colang: allowed flows, blocked topics, fact checking, and controlled dialogue. It competes with Guardrails AI.

**What it's for:** copilots with strict conversation policies in NVIDIA enterprise environments.

**See also:** `PLAN.md` §6 M9

---

### Node (RAGorbit)

A **node** is the processing unit in the RAGorbit graph: it has a `type` (e.g. `retrieval.vector`), `config`, and typed input/output ports. The 53 types are grouped into 13 categories.

**What it's for:** designing composable pipelines with verifiable contracts before writing code.

**See also:** [../00-setup/guia.md](../00-setup/guia.md) · [`catalogo-nodos.md`](./catalogo-nodos.md)

---

### Normalization (vectors)

**Normalization** divides a vector by its L2 norm so its length is 1. With normalized vectors, cosine similarity = dot product, simplifying and speeding up search.

**What it's for:** consistency in index metrics; avoiding bias toward long texts in dot product without normalization.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## O

### OCR

**OCR** (Optical Character Recognition) extracts text from images or scanned PDFs. It is slower and more error-prone than extracting text from PDFs with selectable text.

**What it's for:** `loader.pdf` with `ocr: true` only when the document is image-based, not embedded text.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`loader.pdf`](./catalogo-nodos.md#loaderpdf)

---

### Ollama

**Ollama** runs open-weights LLMs and embedding models locally with a compatible API. It enables development without API keys or per-token cost.

**What it's for:** local real mode with Llama, Mistral, nomic-embed, etc., when you have sufficient network and hardware.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### OpenTelemetry

**OpenTelemetry** (OTEL) is the open standard for traces, metrics, and logs. In this course it exports throughput, latency by priority, and pipeline errors via OTLP to Prometheus/Grafana.

**What it's for:** infrastructure observability complementary to LangSmith/Langfuse (which measure tokens and LLM cost).

**See also:** `PLAN.md` §6 M9 · [`observability.metrics`](./catalogo-nodos.md#observabilitymetrics)

---

### Overlap (chunking)

**Overlap** is the character or token overlap between consecutive chunks to avoid cutting sentences or context at the boundary. Typical: 10–15% of `chunkSize` in narrative text; low or zero in by-clause/by-section.

**What it's for:** letting the retriever return complete context even when the relevant sentence crosses the boundary between two chunks.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.chunker`](./catalogo-nodos.md#ingestchunker)

---

## P

### Parent-child retrieval

The **parent-child** pattern indexes small **child** chunks (high search precision) but returns the larger **parent** chunk to the LLM (more context). Metadata `parent_id` links child to parent.

**What it's for:** documents with long sections where small chunks improve ranking but the LLM needs full paragraphs.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.parent-child`](./catalogo-nodos.md#retrievalparent-child)

---

### Parsing

**Parsing** converts raw format (binary PDF, HTML, XLSX) into clean, structured text. Parsing errors (interleaved columns, mixed headers) contaminate the entire index downstream.

**What it's for:** silent but critical step between loader and chunker; Unstructured improves complex PDFs.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md)

---

### pgvector

**pgvector** is the PostgreSQL extension for storing and searching vectors with SQL. It combines vector search with filters, joins, and ACID transactions in the Postgres ecosystem.

**What it's for:** corporate production when you already have Postgres; template 02 (Banking) uses it.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.pgvector`](./catalogo-nodos.md#storepgvector)

---

### Plan-and-Execute

**Plan-and-Execute** separates planning (the LLM designs a step plan) from execution (an executor follows the plan). It contrasts with ReAct, where plan and action interleave step by step.

**What it's for:** very long tasks (15–20 searches) in batch where latency does not matter and an explicit plan prevents the agent from getting lost.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Prompt

A **prompt** is the text (or message sequence) you send to the LLM. In chat APIs it has roles:
- **System:** persistent behavior instructions.
- **User:** human question or dynamic context.
- **Assistant:** previous model responses in multi-turn conversations.

**What it's for:** defining tone, constraints, format, and context data (chunks) the model must use.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`logic.prompt`](./catalogo-nodos.md#logicprompt)

---

### Prompt template

A **prompt template** is a template with variables (`{message}`, `{chunks}`) that the system substitutes on each call. It avoids manual string concatenation and centralizes prompt format.

**What it's for:** maintainable production; the RAGorbit `logic.prompt` node uses `template` + `system`.

**Example:** `"Pregunta: {message}\n\nContexto:\n{chunks}"`

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### promptfoo

**promptfoo** is a CLI tool for evaluating and comparing prompts/models with declarative test cases (YAML), useful in CI for quality regressions.

**What it's for:** A/B testing prompts and detecting regressions when changing models.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Pydantic

**Pydantic** is the Python data validation library with typed models (`BaseModel`, `Field`). In RAG it defines the structured output contract and validates the LLM response before propagating it.

**What it's for:** declarative alternative to manual JSON Schema; basis of `instructor` and `with_structured_output`.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

## Q

### Qdrant

**Qdrant** is a dedicated vector database (Rust) with rich payload filters, multiple distance metrics, and good scale. Available self-hosted or as Qdrant Cloud.

**What it's for:** when you need a specialized vector DB without adding Postgres; tens of millions of vectors.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.qdrant`](./catalogo-nodos.md#storeqdrant)

---

### Query rewriting

**Query rewriting** normalizes or expands the user's question before the retriever: maps internal jargon to canonical terms, adds synonyms or reformulations to improve recall.

**What it's for:** "plan downgrade" → "service cancellation" in telecom; gap between user vocabulary and index vocabulary.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`query.rewrite`](./catalogo-nodos.md#queryrewrite)

---

## R

### RAG (Retrieval-Augmented Generation)

**RAG** retrieves relevant fragments from a knowledge base and injects them into the LLM prompt so it generates an answer anchored in real documents. It addresses hallucinations, knowledge cutoff, and private data without retraining the model.

**What it's for:** assistants over internal policies, manuals, contracts — any knowledge the LLM does not have or that changes frequently.

**Minimum flow:** embed query → search top-K chunks → prompt with chunks → generate answer.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### RAGAS

**RAGAS** is a metrics framework for evaluating RAG pipelines: faithfulness, answer relevancy, context precision/recall. It generates automatic scores using an LLM as judge.

**What it's for:** reproducible evaluation in development and as "quality tests" before deploying.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Reader (LlamaIndex)

A **reader** in LlamaIndex is the equivalent of LangChain's loader: it loads files or sources and returns `Document` objects. LlamaIndex stands out with specialized readers and query engine integration.

**What it's for:** layer ③ ingestion; compare `SimpleDirectoryReader` vs LangChain's `PyPDFLoader`.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md)

---

### ReAct

**ReAct** (Reasoning + Acting) alternates LLM reasoning, tool calls, and observation of results in a loop until the task completes. It is the standard pattern of modern agents.

**What it's for:** multi-step tasks where tool order is not known in advance (flight change, transactional support).

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`agent.react`](./catalogo-nodos.md#agentreact)

---

### Reflection

**Reflection** (one L) is when the agent evaluates its own answer before delivering it ("did I answer the question? is the breakdown missing?") and improves it if it detects problems. It can be the same LLM in a second step.

**What it's for:** improving quality without retraining; adds latency — not ideal in strict real time.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Reflexion

**Reflexion** (Shinn et al., 2023 paper) formalizes self-improvement with three roles: **Actor** (generates attempts), **Evaluator** (scores whether the task was achieved), and **Verbal reflection** (summarizes the error in memory for the next attempt). It does not modify model weights — it is iterative in-context learning.

**What it's for:** code with tests, verifiable tasks with several attempts in batch.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Reranking

**Reranking** reorders vector retriever candidates with a more accurate model (cross-encoder) and keeps the final top-N. It adds latency (~50–150 ms) but reduces semantic noise.

**What it's for:** high-precision flows (legal, medical, telecom with feedback).

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

### Retriever

A **retriever** is the component that, given a query, returns the most relevant chunks from a vector store (or BM25 index). In RAGorbit it is type `Retriever` connecting `store.*` with `retrieval.*`.

**What it's for:** abstracting search behind a uniform interface for pipelines and for `tool.retriever`.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### Deterministic rules

**Deterministic rules** evaluate `when → then` conditions in pure code, without LLM: numeric thresholds, eligibility, priority classification. 100% reproducible production `Decision`.

**What it's for:** decisions with legal or financial consequences that must **never** be delegated to the LLM.

**Course golden rule:** the LLM suggests; rules decide critical thresholds.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.rules`](./catalogo-nodos.md#logicrules)

---

### Router (logic / retrieval)

A **router** branches the flow based on a condition or decision. `logic.router` redirects the graph by named branches; `retrieval.router` selects the correct vector index in multi-index setups.

**What it's for:** different paths by shipment type, intent, or document category.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.router`](./catalogo-nodos.md#logicrouter) · [`retrieval.router`](./catalogo-nodos.md#retrievalrouter)

---

### Roots (MCP)

**Roots** in MCP define the directories or URIs a server can expose to the client. The client cannot access files outside declared roots — attack surface limit.

**What it's for:** sandbox of local resources on MCP servers (read only `/data/policies`, not the entire disk).

**See also:** `PLAN.md` §6 M8

---

### RRF (Reciprocal Rank Fusion)

**RRF** merges result lists from several retrievers using each document's **rank**, not direct scores (which have different scales). Formula: `RRF(d) = Σ 1/(k + rank(d))` with typical `k` ≈ 60.

**What it's for:** combining BM25 + vector without manually normalizing scores.

**See also:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### Runtime mock (RAGorbit)

The RAGorbit **runtime mock** runs flows without network or API keys: deterministic LLM by templates, toy embeddings, in-memory stores, and tools with fixtures. It enables "Test with mocks" in the webapp and running scratch workshops.

**What it's for:** zero-cost learning and reproducible tests — same input, same output.

**See also:** [../00-setup/guia.md](../00-setup/guia.md)

---

## S

### Sampling (MCP)

In MCP, **sampling** lets an MCP server request the **host** (the client application) to invoke its LLM to complete text. The user must approve each sampling request — the server does not call the LLM directly.

**What it's for:** servers that need the host model's reasoning without owning API keys.

**See also:** `PLAN.md` §6 M8

---

### sentence-transformers

**sentence-transformers** is the standard Python library for running local embedding models (BGE, E5, nomic) with `encode()`. It eliminates network calls and reduces latency by ~100–150 ms per query.

**What it's for:** layer ③ of M3; `model.embedding` with `local: true` in RAGorbit.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### MCP server

An **MCP server** exposes tools, resources, and prompts to MCP clients via STDIO or HTTP. It is built with **FastMCP** in Python by declaring operations and permissions.

**What it's for:** exposing PolicyRAG or internal APIs as a standard service consumable by Cursor, Claude Desktop, or your agent.

**See also:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Cosine similarity

**Cosine similarity** measures the angle between two vectors (range [-1, 1]), ignoring magnitude. Value 1 = same semantic direction; 0 = no relation. It is the default metric in text retrieval.

**What it's for:** ranking chunks by semantic relevance in `retrieval.vector`.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### State graph (StateGraph)

A **state graph** models the agent as nodes that transform shared state and edges that decide the next node. LangGraph `StateGraph` implements ReAct, memory, and conditional branches.

**What it's for:** explicit flow control vs ad-hoc `while` loops; basis of RAGorbit multi-agent codegen.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### STT (Speech-to-Text)

**STT** converts audio to text. In streaming it feeds real-time voice copilots; in batch it transcribes full recordings. **Whisper** (OpenAI, open-weights) is the reference model for offline/multilingual transcription.

**What it's for:** voice channel in call center (`io.stt`); multimodal input in M10.

**See also:** `PLAN.md` §6 M10 · [`io.stt`](./catalogo-nodos.md#iostt)

---

### Streamlit

**Streamlit** is a Python framework for dashboards and web chats with minimal code. Alternative to Gradio for internal RAG UIs.

**What it's for:** interface prototypes in M9 without custom FastAPI.

**See also:** `PLAN.md` §6 M9

---

### Structured output

**Structured output** forces the LLM to emit JSON (or typed object) validated against a **JSON Schema** or Pydantic model before the pipeline continues. Mechanisms: tool-calling, JSON-mode, instructor, outlines.

**What it's for:** decisions that feed downstream systems (credit score, claim adjudication) — free text is not reliably parseable.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.structured`](./catalogo-nodos.md#logicstructured)

---

## T

### Temperature

**Temperature** controls generation randomness: 0.0 ≈ deterministic; high values = more variation/creativity. For factual RAG use 0.0–0.2.

**What it's for:** balance between consistency (compliance, citations) and variety (creative writing).

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`model.llm`](./catalogo-nodos.md#modelllm)

---

### Temporal

**Temporal** is a durable workflow engine: it runs long-running processes with retries, timers, and survival across restarts. RAGorbit uses `io.trigger` → `deploymentTarget: temporal`.

**What it's for:** multi-day banking onboarding, intermediate human approvals — vs simple queues without workflow state.

**See also:** `PLAN.md` §6 M9 · [`io.trigger`](./catalogo-nodos.md#iotrigger)

---

### TF-IDF

**TF-IDF** (Term Frequency–Inverse Document Frequency) weights terms by frequency in the document and rarity in the corpus. It is the lexical basis of BM25 and classic sparse representations.

**What it's for:** understanding why BM25 discriminates rare terms; comparing lexical vs dense retrieval.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### thread_id

The **thread_id** identifies a conversational session in LangGraph. Same `thread_id` between invocations → the checkpointer restores full history; different `thread_id` → new empty session.

**What it's for:** multi-turn memory in production agents.

**Example:** `config = {"configurable": {"thread_id": "demo-001"}}`

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Token

A **token** is the text unit the LLM processes; it does not match a word (the BPE tokenizer may split words into sub-units). API consumption and context window are measured in tokens.

**What it's for:** estimating cost, sizing `chunkSize`, and knowing how much context fits in the prompt.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Tokenizer (BPE)

The **tokenizer** converts text to tokens; **BPE** (Byte Pair Encoding) is the most common algorithm: it merges frequent character pairs until forming a fixed vocabulary. Each model has its own tokenizer — they are not interchangeable.

**What it's for:** explaining why Spanish consumes more tokens than English and why context limits vary by model.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Tool calling (function calling)

**Tool calling** (or *function calling*) is the LLM's ability to emit a structured instruction `{tool, arguments}` instead of free text; the framework executes the function and returns the result as new context.

**What it's for:** connecting the LLM to APIs, databases, RAG, and transactional services in a typed way.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · tool section in [`catalogo-nodos.md`](./catalogo-nodos.md#10-tool--external-tools)

---

### Top-k / Top-p

- **Top-k:** at each generation step, only consider the k most probable tokens.
- **Top-p** (nucleus sampling): consider the minimum set of tokens whose cumulative probability reaches p (e.g. 0.9).

**What it's for:** fine-grained randomness control together with temperature; in factual RAG the defaults usually suffice.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### TruLens

**TruLens** is an evaluation and feedback framework for LLM apps with groundedness, relevance, and chain traceability metrics. It competes with RAGAS and DeepEval.

**What it's for:** evaluation with runtime instrumentation, not just offline.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### TTS (Text-to-Speech)

**TTS** converts text to synthetic audio. In the course it is covered conceptually together with multimodal generation (spoken responses, IVR).

**What it's for:** bidirectional voice bots: STT (input) + LLM + TTS (output).

**See also:** `PLAN.md` §6 M10

---

## U

### Unstructured

**Unstructured** (unstructured.io) is a document parsing library/service that classifies PDF blocks (heading, table, narrative, list) and enables higher-quality by-layout chunking than basic extractors.

**What it's for:** mixed PDFs (text + tables + images); robust alternative to PyPDFLoader for enterprise ingestion.

**See also:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`loader.multimodal`](./catalogo-nodos.md#loadermultimodal)

---

## V

### Vector store

A **vector store** persists embeddings + texts + metadata and answers similarity queries (top-K nearest neighbors). Examples: Chroma, FAISS, pgvector, Qdrant, Pinecone.

**What it's for:** the RAG "database" — without a store there is no persistent semantic retrieval.

**See also:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · store section in [`catalogo-nodos.md`](./catalogo-nodos.md#4-store--vector-storage)

---

### Context window

The **context window** is the maximum tokens the model can process in one call: system + history + chunks + generated response. Exceeding the limit truncates or fails the request.

**What it's for:** sizing how many chunks fit in the prompt; motivating chunking and RAG vs context stuffing.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Vision (model)

A multimodal **vision** model describes images, diagrams, and scanned tables in text to include them in the RAG pipeline. Used in `loader.multimodal` with `describeImages: true`.

**What it's for:** manuals with diagrams (AMM), damage photos in insurance, records with figures.

**See also:** `PLAN.md` §6 M10 · [`model.vision`](./catalogo-nodos.md#modelvision)

---

## W

### Whisper

**Whisper** is OpenAI's open-weights model for multilingual transcription. It runs locally (via HF/Ollama) or via API. Excellent offline quality; real-time streaming usually uses alternatives (Deepgram, Transcribe).

**What it's for:** STT in M10 and multimodal labs; compare with low-latency providers in production.

**See also:** `PLAN.md` §6 M10 · [`io.stt`](./catalogo-nodos.md#iostt)

---

### Working memory

**Working memory** is the structured state the agent maintains during a task: PNR, pending amount, selected flight, flow step. It complements conversational history (text) with typed queryable data.

**What it's for:** avoiding re-asking data already obtained; in LangGraph it lives in graph state in addition to messages.

**See also:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

## Z

### Zero-shot

See **Few-shot / Zero-shot / One-shot** in section F. **Zero-shot** = no examples in the prompt; the model relies only on instructions and parametric knowledge.

**See also:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

## Additional production and observability terms

### Feedback loop

A **feedback loop** captures quality signals (thumbs up/down, transaction callbacks) and stores them to improve retrieval or reranking over time. The reranker's `feedbackRef` can consume these signals.

**See also:** `PLAN.md` §6 M9 · [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback)

---

### PII leakage

**PII leakage** occurs when the system exposes personally identifiable data (names, ID numbers, accounts) in responses, logs, or traces without authorization. Mitigation: redaction in guardrails, tool permissions, audit, and adversarial tests.

**See also:** `PLAN.md` §6 M9

---

### JSON Schema

See **Structured output** — **JSON Schema** is the formal contract defining types, required fields, enums, and constraints of the object the LLM must emit.

**See also:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Observability

**Observability** in RAG/agent systems combines audit (tool calls to Kafka/log), metrics (OpenTelemetry), LLM traces (LangSmith/Langfuse), and user feedback to operate and meet regulation.

**See also:** `PLAN.md` §6 M9 · observability section in [`catalogo-nodos.md`](./catalogo-nodos.md#13-observability--audit-and-feedback)

---

### FastMCP

**FastMCP** is the Python framework for building MCP servers quickly: you declare tools, resources, and prompts; the server speaks STDIO or HTTP depending on deployment.

**What it's for:** M8 workshop — expose PolicyRAG as an MCP server consumable by an agent.

**See also:** `PLAN.md` §6 M8

---

### STDIO / HTTP (MCP transport)

**STDIO** launches the MCP server as a subprocess communicating via stdin/stdout (ideal on desktop/IDE). **HTTP** (Streamable HTTP) exposes the server on the network for remote clients or microservices.

**What it's for:** choosing local vs infrastructure service deployment.

**See also:** `PLAN.md` §6 M8

---

> **Cross-links**
> - Global course plan: [`../PLAN.md`](../PLAN.md) (vision, modules M0–M11, §5 lists this glossary)
> - Cards for the 53 RAGorbit nodes: [`./catalogo-nodos.md`](./catalogo-nodos.md)
> - Comparative technology tables: [`./tecnologias-comparadas.md`](./tecnologias-comparadas.md)
> - Authorship context and tri-modal method: [`../HANDOFF.md`](../HANDOFF.md)

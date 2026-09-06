# 🎓 RAG & Agentic AI — Zero to Expert Study Plan (v2)

> Curriculum to master **everything inside RAGorbit** and more: RAG, embeddings, vector stores, knowledge graphs, agents, multi-agent, MCP, multimodal, guardrails, security, observability, and deployment — until you can **design these architectures and rebuild the 10 templates from scratch in code**.
>
> **This file is the PLAN.** Material is generated **after your approval**.
>
> **v2:** **tri-modal** code approach (design + Python from scratch + real frameworks) and **full coverage of the IBM Coursera "RAG and Agentic AI" syllabus** (+ production extras that program does not cover). See §11.

---

## 1. Expected outcome (when you finish you will be able to…)

1. Explain **what each of the 13 RAGorbit node categories does, when to use it, and what alternatives it has**.
2. **Build from scratch, in Python**, each of the 10 templates — and also their version with **real frameworks** (LangChain/LangGraph/LlamaIndex).
3. **Design** a new RAG/agentic architecture: choose loaders, chunking, store, retrieval, model, guardrails, framework, and deployment — justifying each decision against competing technologies.
4. Build **agents** (tool calling, ReAct, **memory**, **Reflection/Reflexion**) and **multi-agent systems** with **LangGraph, CrewAI, AutoGen/AG2, and BeeAI**.
5. Build and integrate **MCP servers and clients** (FastMCP, STDIO/HTTP) with their **security model** (sampling, roots, permissions).
6. Handle **multimodal**: STT (Whisper), vision, and image/audio generation.
7. **Evaluate** RAG (faithfulness, groundedness, context precision/recall) and agents (success, cost, latency).
8. Apply **AI Security & Responsible AI**: prompt injection, data/PII leakage, jailbreaks, permissions.
9. Take to **production**: guardrails, idempotency, HITL, audit/observability, UIs (Gradio/Streamlit), and the 4 targets (chat-service, event-worker, batch, temporal).

**"Expert" criterion (self-assessable):** complete the **capstone** (rebuild 3 templates from scratch + design 1 new architecture + exam) without looking at solutions.

---

## 2. Method — tri-modal approach (what you asked for)

Each concept and each workshop is addressed in **three layers**, without losing depth of real tools:

```
①  DESIGN/CONCEPT   →   ②  FROM SCRATCH (pure Python)   →   ③  REAL FRAMEWORK (in depth)
   why / when /            you implement the mechanism         how it is done in LangChain/LangGraph/
   what replaces it        by hand to understand it            LlamaIndex/CrewAI/AutoGen/MCP, in depth
```

Cycle per module: **GUIDE → EXERCISES (with answers) → WORKSHOP (realistic, with *expected results*, in all 3 layers) → CHECKPOINT**.

- **Guides** — from scratch, with diagrams, analogies, and "when to use / when NOT"; each topic anchored to a RAGorbit node and its template(s).
- **Exercises** — conceptual and code, **all with answers** (in a separate file). Types: reasoned multiple choice, "predict the output", "find the bug", "choose the technology".
- **Workshops** — statement + sample data + **concrete expected result** + stepped hints + **solution in all 3 layers**. Designed so that, after reading the module guides, **you can solve them**.
- **Checkpoint** — "you know it if you can…" rubric + what to review.

---

## 3. Prerequisites and setup

- **Intermediate Python** (functions, classes, async, pip/venv); express refresher in M0.
- Zero prior ML/AI knowledge required.
- **Two work modes:**
  - **No network/no keys** (to learn, zero cost): RAGorbit mock runtime + local libs (in-memory indexes, local embeddings, models via Ollama optional).
  - **Real** (optional): LLM API key; Docker for pgvector/Qdrant/Neo4j/Kafka (`infra/`); Hugging Face/Ollama for open models.
- Each concept can be seen **working** in the webapp (`python3 -m ragorbit serve`) and in `examples/`.

---

## 4. Time budget (2 to 2½ months full-time)

Core **8 weeks (~320 h)**; with extra depth (multi-agent, MCP, generative multimodal, security, UIs) it extends to **~9–10 weeks**. Per day: ~3 h guide + ~2 h exercises + ~3 h workshop.

| Week | Module | Focus | RAGorbit nodes |
|-----|--------|------|----------------|
| 0 (½) | M0 | Setup + Python refresher + RAGorbit walkthrough | — |
| 1 | M1 | LLM fundamentals, prompting, in-context learning, model evaluation/selection | `model` |
| 2 | M2 | Ingestion: loaders, chunking, metadata (LangChain vs LlamaIndex vs Unstructured) | `loader`, `ingest` |
| 3 | M3 | Embeddings + Vector stores (Chroma, FAISS/HNSW, pgvector, Qdrant…) + recommendation | `store` |
| 4 | M4 | Advanced retrieval + Query (hybrid, rerank, hard filters, multi-index, GraphRAG) | `retrieval`, `query` |
| 5 | M5 | Generation + logic + RAG evaluation (structured, citations, rules, router; RAGAS) | `logic` |
| 6 | M6 | Agents I: tool calling, ReAct, memory, Reflection/Reflexion, agentic RAG | `agent`, `tool` |
| 7 | M7 | Agents II: multi-agent with LangGraph, CrewAI, AutoGen/AG2, BeeAI | `agent`, `tool` |
| 8 | M8 | MCP in depth: FastMCP server, clients (STDIO/HTTP), security (sampling/roots/permissions) | `tool.mcp` |
| 9 | M9 | Production & Security: guardrails, HITL, observability, io, deployment, AI Security, UIs | `guardrail`, `hitl`, `observability`, `io` |
| 9–10 | M10 | Multimodal: STT/Whisper, vision, image/audio generation | `io.stt`, `model.vision` |
| 10 | M11 | Architecture + **Capstone** (rebuild templates + design + exam) | all |

---

## 5. Material folder structure (to be generated)

```
rag-training/
  PLAN.md  README.md
  00-setup/ … 11-capstone/        (each: guia.md · ejercicios.md · soluciones.md · lab/)
  referencia/
    catalogo-nodos.md               card per node: what it does · when to use · alternatives
    tecnologias-comparadas.md      tables (stores, agent frameworks, rerankers, eval, UIs…)
    glosario.md
    plantillas-mapeadas.md           the 10 templates explained and mapped to modules
    cobertura-ibm-coursera.md      IBM syllabus mapping ↔ this course (§11)
  solutions/                      workshop solutions (separate)
```
Each `lab/`: `enunciado.md`, `datos/`, `expected.md`, `solucion_scratch.py`, `solucion_framework.py`, `solucion.md`.

---

## 6. Modules in detail

### M0 · Setup and refresher *(½ week)*
Environment (venv, no-network and real modes); Python refresher (typing, dataclasses, async, JSON, requests); run RAGorbit and read a `flow.json`. **Workshop:** load HR, "Test with mocks", identify nodes and connections.

### M1 · LLM fundamentals + RAG — `model` *(Week 1)*
LLMs, tokens, context window, temperature; **prompting and patterns** (system/user, few-shot, in-context learning, chain-of-thought); **why RAG**; minimal RAG pattern; embeddings (intuition). **Model selection/evaluation** (latency/cost/quality). **Compete:** Claude vs OpenAI vs Gemini vs Llama/Mistral; closed vs open-weights; **Hugging Face / Ollama / watsonx**; RAG vs fine-tune vs prompting. **Template:** 09-HR. **Workshop:** minimal RAG in ~40 lines (scratch) + LangChain version (③).

### M2 · Ingestion — `loader` + `ingest` *(Week 2)*
Sources (PDF, tables, web, SQL, S3, multimodal); parsing; **chunking** (fixed/recursive/semantic/by-layout/by-clause, overlap); **metadata** and its role in filters. **Compete:** LangChain loaders vs LlamaIndex readers vs **Unstructured**. **Templates:** 09, 02, 08, 04. **Workshop:** chunk legal PDF by clause + metadata; scratch + LlamaIndex. *Expected:* N chunks with verifiable {text, metadata, source}.

### M3 · Embeddings and Vector Stores — `store` *(Week 3)*
Embeddings in depth (dimensions, normalization, cosine/dot/L2); **indexes** (HNSW, IVF, flat); persistence and collections; **ChromaDB operations** (add/update/delete/manage); **FAISS** by hand; vector vs traditional DB; **recommendation systems** with embeddings. **Compete:** Chroma vs FAISS vs pgvector vs Qdrant vs Pinecone vs Weaviate vs Milvus (table); OpenAI vs Cohere vs **local BGE/E5** embeddings. **Templates:** 02 (pgvector), 09 (chroma). **Workshop:** index 50 docs in Chroma + FAISS, top-k with metadata filter; compare HNSW vs flat. *Expected:* top-3 ids and expected recall.

### M4 · Advanced retrieval + Query — `retrieval` + `query` *(Week 4)*
Dense vs **BM25/keyword** vs **hybrid**; **reranking** (cross-encoder); **parent-child**; **hard filters as guardrail**; **multi-index routing**; **query rewriting** and **intent**; **GraphRAG** (Neo4j: nodes/relations, neighborhood retrieval). **Compete:** BM25/Elastic, rerankers (Cohere, **BGE-reranker**, **ColBERT**), **GraphRAG (Microsoft)** vs vector; **LlamaIndex** vs LangChain retrievers. **Templates:** 05, 07, 08, 03 + GraphRAG. **Workshop:** hybrid + rerank + hard-filter on policies; scratch + LangChain/LlamaIndex. *Expected:* without filter there is noise; with filter expected top-3 and citable.

### M5 · Generation, logic, and evaluation — `logic` *(Week 5)*
Synthesis with context; **structured output** (JSON schema; tool-calling/JSON-mode/**instructor**/**outlines**); **mandatory citations**; deterministic **rules** (do not delegate thresholds to the LLM); **router/conditional**; **RAG evaluation** (faithfulness, answer/context relevance, precision/recall). **Compete:** LCEL vs LlamaIndex query engines; eval: **RAGAS, TruLens, DeepEval, promptfoo**. **Templates:** 02, 04, 08, 03. **Workshop:** structured decision with citations + groundedness check + eval with RAGAS (③). *Expected:* conformant JSON + non-empty `citations`; no-evidence case ⇒ "not determinable".

### M6 · Agents I (fundamentals) — `agent` + `tool` *(Week 6)*
From RAG to **agent**; **tool calling** and chaining; **ReAct** loop (reason→act→observe); **memory** (short/long term, conversational, state); **Reflection / Reflexion** (self-improvement); **agentic RAG** (the agent decides when/what to retrieve and routes queries); LangChain **built-in agents** (data, **visualization**, SQL); `tool.retriever` (RAG as tool). **LangGraph `StateGraph`** from scratch conceptually. **Compete:** ReAct vs Plan-and-Execute vs Reflexion. **Templates:** 01, 06, 07. **Workshop:** ReAct agent with memory + 2 tools (scratch) and then with **LangGraph** (③); + a **data visualization agent**. *Expected:* tool call sequence + correct answer; agent remembers the previous turn.

### M7 · Agents II (multi-agent and frameworks) — `agent` *(Week 7)*
Multi-agent patterns (supervisor, hierarchical, collaborative, stateless **fan-out**); orchestration; when multi-agent vs single agent. **Hands-on in depth** with: **LangGraph** (multi-agent, conditional edges, checkpoints), **CrewAI** (agents/tasks/crews/tools), **AutoGen/AG2** (conversation between agents), **BeeAI**. Framework selection and combination. **Compete:** LangGraph vs CrewAI vs AutoGen vs BeeAI vs Semantic Kernel table (memory, control, curve, cases). **Template:** 10 (fan-out/event-driven). **Workshop:** the same problem (disruption rebooking) solved in **CrewAI** and in **LangGraph multi-agent**; compare. *Expected:* both process N events with auto-confirm vs LLM; trade-offs table.

### M8 · Model Context Protocol (MCP) in depth — `tool.mcp` *(Week 8)*
MCP architecture and how it differs from traditional APIs/tool-calling; **FastMCP**: build a **server** (tools, resources, prompts); build **clients** (STDIO and **Streamable HTTP**); connect to one and multiple servers; **MCP security**: sampling, roots, **permission-based approval**. **Compete:** MCP vs proprietary plugins/functions. **Workshop:** expose the airline `PolicyRAG` as an **MCP server** and consume it from an agent (MCP client) with permission approval. *Expected:* agent lists and calls the MCP tool; a sensitive action requires approval.

### M9 · Production & Security — `guardrail` + `hitl` + `observability` + `io` *(Week 9)*
**Guardrails** (pre-tool, **confirm-gate**, **idempotency**, **circuit breaker**/retry/fallback); **HITL** (hardcoded escalation in critical cases); **observability** (audit to Kafka/log, **feedback loop**, metrics/**OpenTelemetry**); **io** (chat, **STT/voice**, **events/Kafka**, batch, notifications); **deployment targets** (FastAPI/SSE-WebSocket, Kafka worker, **Temporal**, batch). **AI Security & Responsible AI:** **prompt injection**, jailbreaks, **data/PII leakage**, unsafe output, permissions (links with MCP), bias. **UIs:** **Gradio / Streamlit / Flask** to interact with your RAG/agent. **Compete:** **Guardrails AI** vs **NeMo Guardrails** vs custom; **LangSmith** vs **Langfuse** vs OpenTelemetry/Phoenix; Temporal vs queues+state. **Templates:** 01, 10, 07, 03/08. **Workshop:** wrap payment with **idempotency + confirm-gate** + audit to a bus + **a prompt injection test** the guardrail blocks; UI in Gradio. *Expected:* 1st charge `captured`, 2nd `deduplicated`, malicious prompt rejected, ≥1 audit event.

### M10 · Multimodal *(Week 9–10)*
Multimodal concepts and challenges (text/voice/image/video); **STT with Whisper**; **vision** (describe images/diagrams, tables→JSON); image/audio **generation** (DALL·E/Sora/SDXL, TTS) — conceptual + lab; multimodal embeddings and **multimodal vector DB**. **Compete:** Whisper vs Deepgram; vision models; HF/watsonx/Granite/Llama. **Templates:** 08 (vision/ATA), 04 (damage vision), 07 (STT). **Workshop:** pipeline that transcribes audio (or uses mock transcript), understands an image (mock vision) and responds with citations. *Expected:* JSON with transcript + description + cited answer.

### M11 · Architecture and Capstone *(Week 10)*
Cross-cutting patterns (RAG-as-tool, hard-filter-as-guardrail, deterministic-vs-LLM, fan-out at scale, mandatory citations, agentic RAG); read and **design** a `flow.json`; anti-patterns; design checklist; **system testing** of AI systems (eval as test). **Capstone:**
1. **Rebuild from scratch** 3 templates (increasing: 09 → 02 → 01) in **scratch + framework**. *Expected:* pass tests equivalent to those of the generated artifact.
2. **Design new architecture** given a business brief: diagram + `flow.json` + technology justification. *Expected:* 0 contract errors in RAGorbit and "Test with mocks" responds.
3. **Integrative exam** (50 questions) + design defense. **Expert rubric** (correctness, justification, production, security, clarity).

---

## 7. Coverage of the 13 node categories → module (100%)

| Category | Primary module | Also |
|---|---|---|
| model | M1 | M10, all |
| loader | M2 | M3,M4 |
| ingest | M2 | M3 |
| store | M3 | M4 |
| retrieval | M4 | M5,M6 |
| query | M4 | M6 |
| logic | M5 | M2,M11 |
| agent | M6 | M7,M11 |
| tool | M6 | M7,M8 |
| guardrail | M9 | M6 |
| hitl | M9 | M5 |
| observability | M9 | M7 |
| io | M9 | M1,M10 |

## 8. The 10 templates → where they are mastered
09 HR (M1→M3) · 02 Banking (M2→M5) · 03 Healthcare (M4→M9) · 04 Insurance (M2→M5/M10) · 05 Legal (M4) · 06 Retail (M6) · 07 Telecom (M4→M7/M10) · 08 Manufacturing (M2→M4/M10) · 01 Airline (M6→M8/M9/M11) · 10 Logistics (M7→M9/M11).

---

## 9. Deliverables (estimated volume)

- **~45–55 guides** (4–6 per module) with diagrams and "when to use / alternatives".
- **~12 exercise sets** with solutions (~180–220 exercises).
- **~16 workshops** with data + *expected results* + **scratch and framework** solution.
- **5 reference docs** (node catalog, technology comparisons, glossary, mapped templates, IBM coverage).
- **Capstone** (briefs, rubric, solutions). Everything in **English**, runnable in **no-network mode** (+ real-mode notes).

---

## 10. Decisions (resolved)

- **Code:** tri-modal (design + scratch + real framework in depth). ✅
- **Language:** English. ✅
- **Generation order:** `referencia/` (catalog, glossary, comparisons, IBM coverage) → M0 → M1 → … → M11, **module by module** to study as I progress.

---

## 11. IBM "RAG and Agentic AI" (Coursera) syllabus coverage + extras

| IBM course | Covered in | Notes |
|-----------|-------------|-------|
| 1. Develop GenAI Apps (LangChain, prompts, JSON, model eval, Flask) | **M1, M5, M9** | prompts/in-context (M1), JSON/structured (M5), Flask/Gradio UI (M9) |
| 2. Build RAG Apps (RAG, Gradio, **LlamaIndex** vs LangChain) | **M1, M2, M4, M9** | LlamaIndex hands-on in M2/M4; Gradio in M9 |
| 3. Vector DBs for RAG (ChromaDB ops, similarity, recommendation) | **M3** | Chroma ops + recommendation |
| 4. Advanced RAG (**FAISS, HNSW**, LlamaIndex/LangChain retrievers, Gradio) | **M3, M4** | FAISS/HNSW (M3), retrievers (M4) |
| 5. Multimodal (Whisper, DALL·E, Sora, HF, watsonx, Granite) | **M10** | STT/vision/generation + open models |
| 6. Fundamentals of AI Agents (tool calling, chaining, built-in agents, viz/SQL) | **M6** | + data visualization agent lab |
| 7. Agentic AI LangChain/LangGraph (memory, **Reflection/Reflexion/ReAct**, multi-agent, agentic RAG) | **M6, M7** | memory + self-improvement architectures |
| 8. Agentic AI **CrewAI/AutoGen/BeeAI** + patterns | **M7** | hands-on with each framework + selection |
| 9. **MCP** (FastMCP server/client, STDIO/HTTP, security) | **M8** | server+client+security/permissions |
| 10. Capstone (data→deploy, unstructured→JSON, multimodal+multi-agent, MCP, testing) | **M11** | + our 10 templates |

**IBM skills (RAG, AI Security, Prompt Patterns, GenAI Agents, Agentic, Multimodal, Tool Calling, MCP, Vector DBs, LangChain/LangGraph, OpenAI API):** all mapped above.

**Extras this course adds (and the IBM program does not emphasize):**
- **Real production**: idempotency, **confirm-gate**, circuit breaker, hardcoded **HITL**, **audit to Kafka**, feedback loop, **Temporal**, exactly-once.
- **Contract awareness / correct design** (what can connect to what).
- **10 complete industry cases** (airlines, banking, healthcare, insurance, legal, retail, telecom, manufacturing, HR, logistics).
- **Rebuild everything from scratch** (not just use frameworks) + **design** new architectures.
- **GraphRAG/Neo4j**, **multi-index routing**, **hard-filters as guardrail** with more depth.

> ✅ Conclusion: plan v2 **covers the full IBM syllabus** and **exceeds it** in production, design from scratch, and industry cases. Upon approval, I generate `referencia/` + M0 + M1 and continue in order.

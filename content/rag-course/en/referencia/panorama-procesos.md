# Production process landscape — orchestration, serving, data, and deployment

> **RAGorbit course reference.** **Vendor-neutral** map of the **process** ecosystem around a RAG or agentic system in production. Complements (does not replace) [Module 9 — Production & Security](../09-produccion-y-seguridad/guia.md), which already covered the four RAGorbit `deploymentTarget` values, guardrails, observability, and basic `io.*` nodes.
>
> **Audience:** Python programmers who completed M9 and want to know **the full market** of orchestration, serving/inference, data pipelines, and deployment — not just Temporal, Kafka, and FastAPI.
>
> **Prerequisites:** M9 §5–§6 (IO and deployment targets), [`tecnologias-comparadas.md` §14](./tecnologias-comparadas.md#14-production-orchestration) and §12 (observability).

---

## Introduction: a production AI system is more than the LLM

In M6–M8 you built the **cognitive core**: retrieval, ReAct agents, tools, and MCP. In M9 you learned to **wrap** that core with guardrails, audit, and the correct input node (`io.input`, `io.event-source`, `io.trigger`, `io.batch`). But in a real company, **four process layers** coexist around that graph, and rarely does a single framework cover them all:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DEPLOYMENT / RUNTIME                                              │
│  Docker, K8s, Lambda, Cloud Run, Modal, LLM gateways (LiteLLM, Portkey…)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — DATA PIPELINES / INGESTION                                      │
│  Kafka, Spark, dbt, Flink, CDC, vector store reindexing               │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — MODEL SERVING / INFERENCE                                   │
│  vLLM, TGI, managed APIs, TEI (embeddings), batching, quantization      │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — WORKFLOW / DURABLE AGENT ORCHESTRATION                      │
│  Temporal, Prefect, Airflow, queues + DB state, cron + batch              │
├─────────────────────────────────────────────────────────────────────────────┤
│  RAGORBIT CORE — graph: retrieval + agent + guardrails + observability    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mental model:** the RAGorbit graph answers *"what does the agent do with each request"*. The four layers answer *"how the request arrives, where the model lives, where chunks come from, and on which machine everything runs"*.

### Summary table of the four layers

| Layer | Question it answers | Representative examples | Typical RAGorbit node |
|------|----------------------|--------------------------|----------------------|
| **1. Orchestration** | How do I coordinate steps that last seconds, hours, or days? | Temporal, Prefect, Kafka + Postgres | `io.trigger`, `io.event-source` |
| **2. Serving / inference** | Where do I run the LLM and embeddings? | vLLM, Bedrock, TEI, Groq | `model.llm`, `model.embedding` |
| **3. Data pipelines** | How do I index and update knowledge? | Spark, dbt, Flink, cron batch | `io.batch`, `loader.*`, `ingest.*` |
| **4. Deployment / runtime** | On what infrastructure does the service run? | K8s, Cloud Run, LiteLLM gateway | `deploymentTarget` of `io.*` node |

> **Timing note (2025/2026):** the LLM serving and gateway market evolves every quarter. The principles in this document (durability vs latency, batch vs streaming, self-host vs API) are stable; concrete names and benchmarks change — verify official documentation before deciding.

---

## 1. Workflow / durable agent orchestration

Orchestration answers: *"who executes which step, when, with what retries, and what happens if the server restarts mid-flow?"*

In M9 you already saw **Temporal** (`io.trigger`) vs **Kafka + DB state** (`io.event-source`) and **cron + batch** (`io.batch`). This section **expands** the full market catalog.

### 1.1 Comparative map of orchestrators

| Tool | Mental model | Durability | Best for | When NOT |
|-------------|---------------|-------------|------------|-----------|
| **Temporal** | Code as workflow; durable event history | **High** — survives restarts, days/weeks | Long processes, HITL, compensations (sagas), durable cron | Second-scale events, massive stateless volume |
| **Prefect** | Python flows with `@flow` / `@task`; modern UI | Medium-high (with Prefect Cloud or server) | Data + ML pipelines, Python-first teams | Workflows with complex human signals (Temporal wins) |
| **Dagster** | **Assets** as unit (tables, models, indexes) | Medium-high | Data pipelines with lineage, RAG index as asset | Real-time chat, sub-second latency |
| **Apache Airflow** | Declarative DAGs (Python or YAML); central scheduler | Medium (retries per task) | Classic ETL, nightly jobs, batch dependencies | Streaming, interactive agents, low latency |
| **Flyte** | Typed workflows on K8s; reproducibility | High on K8s | ML training + batch inference at scale | Teams without K8s, fast prototypes |
| **Argo Workflows** | Native K8s DAGs (CRD) | High on K8s | Containerized pipelines in existing cluster | Outside K8s, teams without cluster ops |
| **Kestra** | Declarative orchestrator (YAML); UI + plugins | Medium-high | Teams preferring YAML over Python code | Very dynamic agent logic at runtime |
| **Queue + workers** (Celery, RQ, Kafka consumer) | Message → stateless worker → DB state | Medium (depends on idempotency) | High throughput, fan-out, processing < minutes | Multi-day processes without orchestrator on top |
| **Cron + script** | `crontab` / K8s CronJob | Low | Nightly indexing, short idempotent jobs | Anything with HITL or complex state |

### 1.2 Per-tool sheet (catalog style)

#### Temporal

**What it does:** **Durable** workflow engine. Workflow code re-executes from event history after a failure; *activities* (external calls) have native retry, timeout, and compensation. Supports day-long timers, human signals (`signal`), and cron.

**When to use:** Multi-day banking onboarding, medical approvals with waits, any flow where `hitl.escalate` implies hour-long pauses and the process **must** survive deploys.

**When NOT to use:** Fan-out of 50,000 events/hour with processing < 30 s (template 10 — use `io.event-source`). A nightly reindex cron (use `io.batch`).

**Alternatives:** AWS Step Functions (AWS vendor lock-in), Prefect with manual pauses (less robust for weeks), Cadence (Temporal open-source predecessor).

**RAGorbit:** [`io.trigger`](./catalogo-nodos.md#iotrigger) → `deploymentTarget: temporal`.

---

#### Prefect

**What it does:** Python-first orchestrator. You define flows with decorators; Prefect manages scheduling, retries, logging, and an execution UI. Natural integration with ML pipelines and ingest tasks.

**When to use:** Reindex the vector store nightly with clear steps (load → chunk → embed → upsert), scheduled RAGAS evaluations, data sync from APIs.

**When NOT to use:** Workflows with interactive human signals lasting days (Temporal). Real-time event streaming.

**Alternatives:** Dagster (if data lineage is priority), Airflow (if you already have it in the company), simple cron (if the pipeline fits in one script).

---

#### Dagster

**What it does:** Orchestrator centered on **software-defined assets** — each table, index, or model is an asset with explicit dependencies. Excellent lineage: "this chunk in pgvector comes from this PDF processed yesterday".

**When to use:** Data teams already thinking in pipeline terms; RAG as a versioned **asset** (`vector_index_v3` depends on `raw_documents_v3`).

**When NOT to use:** Orchestrating a conversational agent at runtime. Interactive latency.

**Alternatives:** Prefect (simpler for ML teams without data-engineering culture), dbt (SQL transformations only, not general orchestration).

---

#### Apache Airflow

**What it does:** De facto batch ETL standard since 2015. DAGs with operators (`PythonOperator`, `BashOperator`, sensors). Central scheduler firing tasks by dependencies and cron.

**When to use:** Companies with Airflow already operated; massive nightly ingest jobs; data warehouse sync before reindexing.

**When NOT to use:** **Anti-pattern:** Airflow for chat or low-latency events — the scheduler is not designed for that. Agents with conversational state.

**Alternatives:** Prefect/Dagster (modern DX), cron + Docker (if the DAG has 2 steps).

---

#### Flyte

**What it does:** **Typed** workflow platform on Kubernetes. Each task is a container; typed inputs/outputs; strong caching and reproducibility. Widely used in ML at scale (Lyft, Spotify).

**When to use:** Training/fine-tuning + batch inference on K8s; pipelines with native GPU scheduling.

**When NOT to use:** Teams without K8s. RAG prototypes on a laptop.

**Alternatives:** Argo Workflows (less typed, more flexible), Kubeflow Pipelines.

---

#### Argo Workflows

**What it does:** Native Kubernetes workflow engine (Custom Resource Definition). Each step is a pod; parallelism via DAG. Integrates with the K8s ecosystem (Argo CD, events).

**When to use:** You already have K8s and want containerized pipelines without adding another cluster (Temporal, Prefect server).

**When NOT to use:** Pure serverless environments or VMs without K8s.

**Alternatives:** Flyte (more ML structure), Tekton (CI/CD more than data).

---

#### Kestra

**What it does:** **Declarative** orchestrator (YAML) with UI, plugins, and distributed execution. Less embedded Python code than Prefect; more configurable than cron.

**When to use:** Teams preferring YAML/GitOps for pipelines; plug-and-play integrations (S3, databases, notifications).

**When NOT to use:** Very dynamic agent logic (the agent graph changes according to the LLM at runtime — better Python code + Temporal or LangGraph).

**Alternatives:** Prefect (Python-first), Airflow (more mature ecosystem).

---

### 1.3 Durability vs simplicity — the spectrum

```
SIMPLICITY ──────────────────────────────────────────────▶ DURABILITY / COMPLEXITY

cron + script    Celery/RQ + Redis    Kafka + Postgres    Prefect/Dagster    Temporal
     │                    │                    │                  │                │
 io.batch           async tasks         io.event-source      pipelines        io.trigger
 nightly            emails, jobs         massive fan-out       data assets      multi-day HITL
 indexing           short                template 10          reindexing       onboarding
```

### 1.4 When is queue + DB state enough vs an orchestrator?

| Signal | Queue + DB (Celery, RQ, Kafka) | Orchestrator (Temporal, Prefect…) |
|-------|------------------------------|----------------------------------|
| Maximum flow duration | Seconds – few minutes | Hours – weeks |
| Intermediate human steps | Manual polling or `pending_approval` table | Native signals (Temporal) or pauses (Prefect) |
| Compensation / saga | Manual (hard to maintain) | Native (Temporal) |
| Volume (events/hour) | **High** — horizontal workers | Medium — one workflow per business instance |
| Ops complexity | Low–medium (you already have Kafka) | High (additional Temporal cluster) |
| RAGorbit example | Template 10 (logistics) | Banking onboarding with `io.trigger` |

**Course practical rule** (expanded from [§14](./tecnologias-comparadas.md#14-production-orchestration)):

- Real-time chat → FastAPI (`io.input`) — **no** orchestrator.
- Massive stateless events → Kafka (`io.event-source`) — **no** Temporal.
- Endless processes with humans → Temporal (`io.trigger`).
- Scheduled reindexing → cron, Prefect, Dagster, or Airflow (`io.batch` as graph origin).

---

## 2. LLM serving / inference

Serving answers: *"where does the model run, how do I serve tokens with low latency and high throughput, and when do I pay API vs own GPU?"*

RAGorbit `model.llm` and `model.embedding` nodes **consume** an inference endpoint; this layer is **independent** of the agent framework.

### 2.1 Self-hosted — open source inference engines

| Engine | What it does | Strength | Limitation | When to choose |
|-------|----------|-----------|------------|---------------|
| **vLLM** | LLM server with **PagedAttention**, continuous batching, OpenAI-compatible API | Very high GPU throughput; de facto OSS standard in 2025 for production | Requires NVIDIA GPU; non-trivial ops | High QPS, 7B–70B models, cost control at scale |
| **TGI** (Text Generation Inference) | Hugging Face server; optimized for transformers | Native HF integration, GPTQ/AWQ quantization | Less flexible than vLLM on some models | Hugging Face stack, deployment on HF Inference Endpoints or self-host |
| **SGLang** | Runtime with **radix attention**, aggressive batching | Throughput competitive with vLLM in recent benchmarks | Younger ecosystem (2024–2025) | Performance experimentation; multi-turn with prefix cache |
| **llama.cpp** | CPU/GPU inference in C++; GGUF | Runs on laptop, Apple Silicon, without datacenter GPU | Lower throughput than vLLM in cluster | Local development, edge, offline demos |
| **Ollama** | Friendly wrapper over llama.cpp (+ more backends) | `ollama run llama3` — zero friction locally | Not designed for multi-tenant production | Development, POCs, teams without GPU ops |
| **TensorRT-LLM** | NVIDIA optimization (kernels, FP8, inflight batching) | Maximum performance on NVIDIA hardware | NVIDIA lock-in; compilation curve | Demanding production on NVIDIA GPU at scale |
| **LMDeploy** | OpenMMLab serving; TurboMind quantization | Good balance on Chinese/alternative GPUs | Smaller community than vLLM outside Asia | Environments with hardware restrictions |
| **Ray Serve** | **General** serving framework (not LLM-only) | Composes LLM + preprocessing + postprocessing in one deployment | More pieces (Ray cluster) | Mixed ML pipelines: embed + rerank + LLM in one service |
| **BentoML** | Packages models as containerized APIs | Simple DX to deploy any model | Extra layer over vLLM/TGI | Teams wanting model CI/CD without writing FastAPI by hand |

### 2.2 Managed APIs (hosted inference)

| Provider | Consumption model | Strength | When NOT |
|-----------|-------------------|-----------|-----------|
| **OpenAI / Azure OpenAI** | Pay-per-token | Quality, mature tool calling, enterprise SLA | Cost at scale; sensitive data without BAA/DPA contract |
| **Amazon Bedrock** | Pay-per-token + varied models (Claude, Llama, Titan) | AWS integration, native guardrails, VPC | AWS lock-in; variable latency by region |
| **Google Vertex AI** | Pay-per-token + Gemini + open models | GCP integration, native grounding | GCP lock-in |
| **Anthropic direct** | Claude API | Long reasoning, context window | No self-host of proprietary model |
| **Together AI / Fireworks** | API over open-weights models | Llama/Mistral without managing GPU | Less control than self-host |
| **Groq** | LPU inference — ultra-low latency | Very low TTFT on supported models | Limited catalog; not self-host |

**When managed API:** prototype, team without GPU ops, unpredictable spikes, compliance already resolved with provider.

**When self-host:** > 1M tokens/day sustained, data that cannot leave VPC, predictable latency on own fine-tuned model.

### 2.3 Embeddings serving — TEI and alternatives

Embeddings feed `model.embedding` → `store.*`. Unlike the generative LLM, embedding serving is **cheaper** and is usually the bottleneck at **ingest**, not in chat.

| Tool | What it does | When to use |
|-------------|----------|-------------|
| **TEI** (Text Embeddings Inference) | Hugging Face server optimized for embedding models (sentence-transformers) | Self-host embeddings in ingest batch; OpenAI-compatible API |
| **vLLM / TGI** | Also serve some embedding models | If you already have the cluster and want a single stack |
| **Provider API** (OpenAI `text-embedding-3-*`, Cohere, Voyage) | Zero ops | Prototypes, low volumes, no GPU |
| **Sentence Transformers local** | `model.encode()` in process | Small batch scripts (`io.batch`), development |

**Throughput intuition:** in nightly ingest, embedding is usually processed in **batch** (hundreds of chunks per call). In chat, it is usually **1 query → 1 vector** — latency matters more than throughput.

### 2.4 Key concepts (intuition, not benchmarks)

| Concept | What it means for your RAG system |
|----------|-----------------------------------|
| **Continuous batching** | Server groups concurrent requests in one GPU pass → more tokens/second, slight P95 latency increase |
| **Quantization (INT8, INT4, GPTQ, AWQ)** | Smaller model in memory → fits on cheaper GPU; may degrade quality on fine tasks |
| **TTFT** (time to first token) | Critical in streaming chat (`io.output` with SSE) — Groq and optimized vLLM compete here |
| **TPOT** (time per output token) | Critical in long responses (reports, extended JSON) |
| **Prefix caching / KV cache** | Reuse repeated context (system prompt, fixed documents) — saves cost in multi-turn |

> **Honesty 2025/2026:** benchmarks published by each vendor are hard to compare (different hardware, model, batch size). **Profile with your real prompt and your hardware** before committing.

### 2.5 How to choose serving for RAGorbit

```
Can data leave your VPC?
  NO → self-host (vLLM/TGI/TEI) or Azure OpenAI/Bedrock in VPC
  YES → Sustained volume > economic threshold?
         NO → managed API (OpenAI, Anthropic, Bedrock)
         YES → self-host vLLM + TEI; LiteLLM gateway in front (§4)

Is it batch ingest or chat?
  INGEST → TEI/vLLM with large batch; you do not need low TTFT
  CHAT    → vLLM/SGLang/Groq; SSE streaming; measure TTFT
```

---

## 3. Data pipelines / ingest at scale

This layer answers: *"how do documents reach the vector store, how do I detect changes, and when do I reindex?"* It is **offline** relative to chat — but determines RAG quality more than the LLM.

### 3.1 Technology map

| Tool | Paradigm | Scale | Best for | When NOT |
|-------------|-----------|--------|------------|-----------|
| **Kafka** | Distributed log; pub/sub; retention | Very high | Change events, audit trail, decouple ingest from indexing | Processing 100 PDFs/day |
| **Apache Spark** | Distributed batch/streaming processing | Massive (TB+) | Chunking + embedding millions of docs, heavy ETL | < 10 GB of documents |
| **Ray Data** | Distributed dataset on Ray cluster | High | Parallel ML pipelines (embed, transform) integrated with Ray Serve | Without Ray cluster |
| **dbt** | Versioned SQL transformations | Warehouse | Enrich tabular metadata before hybrid RAG | Binary PDF ingest |
| **Apache Flink** | Stream processing with state | High (streaming) | Near-real-time CDC → incremental reindex | Simple nightly batch |
| **Apache Beam** | Unified batch + streaming API (runner: Dataflow, Flink, Spark) | Variable | Portability across clouds | Small team without portability need |
| **Cron + Python** | Sequential script | Low–medium | Templates 02, 04 — `io.batch` | TB of data, freshness SLA < 1 h |

### 3.2 Batch vs streaming

| Dimension | Batch (nightly, `io.batch`) | Streaming (Kafka + Flink) |
|-----------|------------------------------|---------------------------|
| **Index freshness** | Hours (acceptable for HR policies, manuals) | Minutes (prices, inventory, news) |
| **Complexity** | Low | High |
| **Cost** | Minimum | Continuous infra |
| **Idempotency** | Re-run entire job | Upsert per document/event |
| **Typical orchestration** | cron, Prefect, Airflow | Kafka → consumer → embed → upsert; Flink for aggregations |

### 3.3 CDC (Change Data Capture) and reindexing

**CDC** captures changes in operational databases (PostgreSQL, MySQL) and publishes them as events — ideal for RAG over **data that changes** without re-reading the entire warehouse.

```
PostgreSQL ──(Debezium/Logical Replication)──▶ Kafka topic "doc-changes"
                                                      │
                                                      ▼
                                            consumer: delete old vectors
                                                      + embed new version
                                                      + upsert pgvector
```

**When to full reindex vs incremental:**

| Signal | Full reindex | Incremental (CDC / delta) |
|-------|------------------|---------------------------|
| Embedding model changed | **Yes** — all vectors invalid | N/A |
| Chunking strategy changed | **Yes** | N/A |
| New document or edited paragraph | No | **Yes** — upsert/delete by ID |
| < 0.1% of docs change/day | Incremental overkill | **Yes** |
| Source is daily snapshot (S3 dump) | **Yes** — batch job | Streaming overkill |

### 3.4 Orchestrating ingest with orchestrators (§1)

**Offline** ingest usually lives in layer 1, not in the chat graph:

```
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (Prefect / Airflow / Dagster / cron)           │
│    1. loader.*  →  2. ingest.*  →  3. model.embedding       │
│    4. store.* (upsert)  →  5. observability (metrics)      │
└─────────────────────────────────────────────────────────────┘
         ▲                              │
         │ schedule                     │ index ready
         │                              ▼
    io.batch (origin)            RUNTIME: io.input / io.event-source
```

**RAGorbit:** the offline pipeline shares `loader`, `ingest`, `store` nodes with the graph; `deploymentTarget: batch` (`io.batch`) generates a CLI/cron job. See templates [02-banking](../../examples/02-banking-credit-scoring/) and [04-insurance](../../examples/04-insurance-claims/).

---

## 4. Deployment / runtime / serverless

This layer answers: *"on which machine does each piece run and how do I expose it securely?"*

M9 covered the four RAGorbit targets (FastAPI, Kafka worker, Temporal, batch). Here we expand the **infrastructure spectrum** and **LLM gateways**.

### 4.1 Containers and container orchestration

| Option | What it solves | When to use |
|--------|--------------|-------------|
| **Docker** | Reproducible packaging | Always — base of any serious deployment |
| **Docker Compose** | Multi-container local/staging | Development, demos, template 10 with Kafka |
| **Kubernetes (K8s)** | Scheduling, autoscaling, secrets, ingress | Multi-service production, GPU scheduling, > 1 team |
| **Helm charts** | Package K8s manifests | vLLM, TGI, TEI in cluster — community charts exist |
| **Nomad / ECS / Cloud Run (K8s-lite)** | Less ops than full K8s | Small teams with managed containers |

**RAGorbit mapping:**

| `deploymentTarget` | Typical runtime |
|--------------------|----------------|
| `chat-service` | K8s Deployment + Ingress, or Cloud Run, or VM + systemd |
| `event-worker` | K8s Deployment (replicas = consumer group), autoscale by Kafka lag |
| `temporal` | Temporal workers + managed or self-host Temporal cluster |
| `batch` | K8s CronJob, AWS Batch, or `docker compose run job` |

### 4.2 Serverless and on-demand GPU

| Platform | Model | Best for | Limitation |
|------------|--------|------------|------------|
| **AWS Lambda / Azure Functions** | Pay-per-invocation | Light APIs, preprocessing, **not** heavy LLM | Timeout (15 min max), no traditional GPU |
| **Google Cloud Run** | Serverless container | FastAPI chat-service with scale-to-zero | Cold start; GPU Cloud Run is newer — verify region |
| **Modal** | Python serverless with ephemeral GPU | On-demand GPU jobs, spot fine-tuning | Vendor-specific; unpredictable cost without limits |
| **RunPod / Vast.ai** | Bare-metal/on-demand GPU | Self-host vLLM without capex | Manual ops; no enterprise SLA out-of-the-box |
| **HF Inference Endpoints** | Managed TGI/vLLM | Fast deployment of HF models | Cost; less control than own cluster |

**Rule:** serverless **works well** for the agent **wrapper** (FastAPI, light Kafka consumer). The **heavy LLM** usually goes in a dedicated service (vLLM on persistent GPU or managed API), not in Lambda.

### 4.3 LLM gateways and proxies

Gateways sit **in front of** one or more backends (`model.llm`) and centralize cross-cutting concerns:

| Gateway | What it does | When to use |
|---------|----------|-------------|
| **LiteLLM** | OpenAI-compatible proxy; routes to 100+ providers; fallback, retry, budget | Multi-provider, dev/prod with same SDK, migrate OpenAI → Azure without code change |
| **OpenRouter** | Model marketplace via one API | Experiment with models without contract with each vendor |
| **Portkey** | Gateway with observability, semantic cache, guardrails | Multi-team production; cost metrics per project |
| **Kong AI Gateway** | Kong API gateway extension for LLM | Companies already using Kong for REST APIs |
| **Envoy + ext_proc / APISIX** | Generic gateway with plugins | Unified LLM + non-AI microservices infra |

**Typical gateway functions:**

- **Routing:** GPT-4 for complex cases, Llama-8B for cheap classification.
- **Fallback:** if OpenAI goes down → Bedrock.
- **Rate limiting / budget:** USD/day cap per API key.
- **Semantic cache:** identical or similar response without calling the LLM (watch sensitive data).
- **Unified logging:** complements [`observability.audit`](./catalogo-nodos.md#observabilityaudit) and [§12 observability](./tecnologias-comparadas.md#12-observability).

```
Client / io.input ──▶ FastAPI ──▶ LiteLLM/Portkey ──▶ OpenAI | vLLM | Bedrock
                                        │
                                        ├── rate limit
                                        ├── cost tracking
                                        └── fallback
```

---

## 5. When to keep it simple?

Not every RAG system needs four enterprise layers. M9 taught the targets because **you must recognize** when to scale; not because you must use everything from day one.

### 5.1 The minimum viable stack

| Piece | Simple stack | Sufficient when… |
|-------|--------------|-------------------|
| **Runtime** | One FastAPI process (`io.input`) | < 100 concurrent users, one team |
| **Ingest** | Python script + cron (`io.batch`) | < 10k documents, nightly reindex |
| **LLM** | Direct OpenAI/Anthropic API | Prototype or low volume |
| **Embeddings** | API or `sentence-transformers` in batch script | Same condition |
| **State / queue** | PostgreSQL + nothing else | No massive events, no multi-day workflows |
| **Observability** | Logs + Langfuse free tier | No regulatory audit trail requirement |

### 5.2 Signals that you need to scale

| Signal | Symptom | Layer to add |
|-------|---------|---------------|
| **P95 latency > SLA** in chat | Users wait > 3 s for first token | Dedicated serving (vLLM), gateway with fallback |
| **Reconnections duplicate actions** | Double charge, double booking | `guardrail.idempotency` + Redis (M9) |
| **> 10k events/hour** | Single queue saturated | Kafka (`io.event-source`) + horizontal workers |
| **Workflow > 24 h with humans** | Unmanageable state in tables | Temporal (`io.trigger`) |
| **Index stale > 4 h** | Users see obsolete info | Streaming CDC or more frequent ingest |
| **LLM cost > budget** | Unpredictable bill | Gateway routing to cheap models + cache |
| **Regulatory audit** | Cannot reconstruct who did what | `observability.audit` → Kafka + retention |
| **Multi-team on same cluster** | Deploy conflicts | K8s + namespaces; Dagster/Prefect for pipelines |

### 5.3 Deliberate anti-complexity

| Temptation | Reality | Keep simple with |
|-----------|----------|-------------------|
| "Let's add Temporal just in case" | Cluster ops without multi-day workflows | FastAPI + Postgres |
| "Spark for 500 PDFs" | JVM cluster for hours of work | `io.batch` + Python |
| "K8s on day one" | YAML before product-market fit | Docker Compose or PaaS |
| "Self-host vLLM for 10 queries/day" | GPU idle 99% | Managed API |

---

## 6. Master decision table

### 6.1 By business scenario

| Scenario | RAGorbit input | Orchestration (§1) | Serving (§2) | Data (§3) | Deployment (§4) |
|-----------|------------------|-------------------|--------------|------------|-----------------|
| **Real-time chat** (copilot, HR bot) | `io.input` | None (request/response) | Managed API or vLLM + SSE | Nightly batch (`io.batch`) | FastAPI on K8s/Cloud Run |
| **Massive event-driven** (disruptions, fraud) | `io.event-source` | Kafka + workers; **not** Temporal | Fast API (Groq) or rules without LLM | Kafka as event bus | Workers autoscale by lag |
| **Nightly batch** (scoring, claims) | `io.batch` | cron / Prefect / Airflow | TEI batch + LLM only at inference | Spark if > TB; else Python | CronJob / AWS Batch |
| **Long human-in-the-loop workflow** (onboarding, prior auth) | `io.trigger` | **Temporal** | Managed API (low volume) | Initial batch + spot updates | Temporal workers + FastAPI for UI |
| **High volume on-prem** (banking, defense) | `io.input` + `io.event-source` | Kafka + Temporal only where sagas exist | vLLM + TEI self-host | Spark/Flink + CDC | On-prem K8s + LiteLLM gateway |
| **Demo / workshop** | `io.input` | None | Local Ollama | Manual script | Gradio / local `uvicorn` |

### 6.2 Frequent anti-patterns

| Anti-pattern | Why it fails | Alternative |
|-------------|---------------|-------------|
| **Airflow for chat** | Scheduler in seconds/minutes, not milliseconds | FastAPI + `io.input` |
| **Temporal for a simple cron** | Temporal cluster for a 5 min/night job | `io.batch` + cron |
| **Kafka for 10 messages/day** | Broker ops without benefit | Webhook + FastAPI or SQS |
| **Spark for 200 PDF ingest** | JVM/cluster overhead | Python + `io.batch` |
| **LLM in Lambda** | Timeout, no GPU, cold start on large models | Managed API or dedicated vLLM |
| **Full reindex every hour** | Unnecessary embedding cost | Incremental CDC |
| **One expensive model for everything** | Simple classification at GPT-4 price | Gateway: small model → large if low confidence |
| **Observability only in LangSmith** | Lock-in; no Kafka/infra metrics | [§12](./tecnologias-comparadas.md#12-observability): audit + Langfuse + OTel |

### 6.3 Quick decision tree (graph input)

```
Is the input conversational in real time?
  YES → io.input (chat-service)
  NO → Triggered by broker events?
         YES → io.event-source (event-worker)
         NO → Business process duration?
                > 1 day or HITL with waits → io.trigger (temporal)
                NO → io.batch (batch/cron)
```

---

## Closing — how it all fits in RAGorbit

A mature RAG/agentic system **does not choose a single tool** — it combines layers:

```
[OFFLINE — Layer 3 + orchestrator §1]
io.batch → loader.* → ingest.* → model.embedding → store.*
         (Prefect/Airflow/cron)

[RUNTIME — Layer 2 + 4 + RAGorbit graph]
io.input | io.event-source | io.trigger
    → agent.* + retrieval + guardrails
    → model.llm (via gateway §4)
    → observability.* → io.output | io.notify

[CROSS-CUTTING — M9 + §12]
observability.audit (Kafka) + Langfuse (dev) + OTel (prod)
guardrail.* + hitl.escalate
```

Your job as an engineer is not to master all 30 tools in this document, but to **place each piece in the correct layer**, recognize scaling signals (§5), and avoid anti-patterns (§6.2).

---

> **Cross-links**
>
> - **M9 — Production & Security:** [guia.md §5–§6](../09-produccion-y-seguridad/guia.md) — `io.*` nodes, deployment targets, guardrails, Temporal vs Kafka comparison *(base this document expands)*.
> - **Expanded orchestration:** [`tecnologias-comparadas.md` §14](./tecnologias-comparadas.md#14-production-orchestration) — Temporal vs queues + DB vs cron table.
> - **Observability:** [`tecnologias-comparadas.md` §12](./tecnologias-comparadas.md#12-observability) — LangSmith vs Langfuse vs OTel; complements [`observability.audit`](./catalogo-nodos.md#observabilityaudit), [`.metrics`](./catalogo-nodos.md#observabilitymetrics), [`.feedback`](./catalogo-nodos.md#observabilityfeedback).
> - **IO node catalog:** [`io.input`](./catalogo-nodos.md#ioinput), [`io.event-source`](./catalogo-nodos.md#ioevent-source), [`io.trigger`](./catalogo-nodos.md#iotrigger), [`io.batch`](./catalogo-nodos.md#iobatch).
> - **Anchor templates:** [01-airline](../examples/01-airline-flight-change/) (chat + guardrails), [10-logistics](../examples/10-logistics-disruption-rebooking/) (Kafka fan-out), [02-banking](../examples/02-banking-credit-scoring/) (batch), [03-healthcare](../examples/03-healthcare-prior-auth/) (HITL).
> - **Concepts:** [`docs/01-concepts.md`](../../docs/01-concepts.md) §5 — `deploymentTarget` table and port types.

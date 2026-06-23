# Node catalog — pedagogical cards

> Reference for RAGorbit's **53 node types**, grouped into **13 categories**. For each node: what it does, when to use / when NOT to, and what alternative technologies exist. Exact `type` values come from [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md).

---

## Category index

1. [io — Inputs and outputs](#1-io--inputs-and-outputs)
2. [loader — Data sources](#2-loader--data-sources)
3. [ingest — Data preparation](#3-ingest--data-preparation)
4. [store — Vector storage](#4-store--vector-storage)
5. [retrieval — Retrieval](#5-retrieval--retrieval)
6. [model — Models](#6-model--models)
7. [query — Query operations](#7-query--query-operations)
8. [logic — Reasoning and rules](#8-logic--reasoning-and-rules)
9. [agent — Agents](#9-agent--agents)
10. [tool — External tools](#10-tool--external-tools)
11. [guardrail — Security and resilience](#11-guardrail--security-and-resilience)
12. [hitl — Human in the loop](#12-hitl--human-in-the-loop)
13. [observability — Audit and feedback](#13-observability--audit-and-feedback)

---

## 1. io — Inputs and outputs

The **input** node determines `deploymentTarget` (chat-service, event-worker, temporal, or batch). See [`docs/01-concepts.md §5`](../../docs/01-concepts.md) for the full target table.

---

### `io.input`

**What it does:** Conversational entry point (text or voice chat). The user or client sends a message and the node introduces it into the graph as type `Message`. It automatically sets `deploymentTarget: chat-service`, which generates a FastAPI skeleton with SSE/WebSocket.

**When to use:** Any conversational bot, virtual assistant, or copilot that receives text (or pre-transcribed voice). It is the most common entry node: HR assistant, airline agent, call center copilot.

**When NOT to use:** When input is not conversational: if you process a batch of files use `io.batch`; if you consume Kafka events use `io.event-source`; if you need long-term durability use `io.trigger`.

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `channel` | `chat` / `voice` | `chat` |
| `auth` | `none` / `jwt` / `booking-token` | `none` |
| `streaming` | `true` / `false` | `true` |

**Alternatives / competing technologies:** Streamlit `st.chat_input`, Gradio `gr.ChatInterface`, Slack Bolt, Twilio Conversations. RAGorbit abstracts the channel — the change is only a configuration field.

---

### `io.stt`

**What it does:** Streaming Speech-to-Text transcription. Receives raw audio from the voice channel and produces `Message` text fragments as audio arrives, without waiting for the user to finish speaking. Enables latencies < 1.5 s in call center copilots.

**When to use:** When input is real-time audio (phone calls, voice bots, copilots for human agents). Key example: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**When NOT to use:** If you already have transcribed text (use `io.input`). If audio is processed in batch (consider Whisper as a function inside a `tool.function` or in the `io.batch` pipeline).

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `provider` | `transcribe` / `deepgram` | `deepgram` |
| `language` | ISO code | `es` |

**Alternatives:** Deepgram Nova-2 (low latency, native streaming), Amazon Transcribe Streaming, Google Speech-to-Text v2, OpenAI Whisper (via API, not true streaming), local Whisper (open model, no per-token cost). Choice depends on target latency vs cost vs supported languages.

---

### `io.event-source`

**What it does:** Consumes events from a message broker (Kafka) and introduces them into the graph as type `Event`. Sets `deploymentTarget: event-worker`. Supports `exactlyOnce: true` via Kafka transactions to guarantee no event is processed twice.

**When to use:** High-volume asynchronous processing triggered by external events: logistics disruptions, fraud alerts, transaction notifications. Key example: [10-logistics-disruption-rebooking](../../examples/10-logistics-disruption-rebooking/).

**When NOT to use:** For conversational interactions (use `io.input`) or to process file batches without a broker (use `io.batch`). If volume is low and latency does not matter, a cronjob with `io.batch` may be simpler.

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `broker` | `kafka` | `kafka` |
| `topic` | string | *(required)* |
| `partitionKey` | event field | — |
| `exactlyOnce` | `true` / `false` | `true` |

**Alternatives:** AWS SQS/SNS, Google Pub/Sub, Azure Service Bus, RabbitMQ, Pulsar. Kafka is the de facto standard for high volume with retention and replay; the others are simpler to operate but offer fewer guarantees.

---

### `io.trigger`

**What it does:** Durable trigger. Starts a Temporal workflow (with cron support). Sets `deploymentTarget: temporal`. Ideal for processes that can last hours or days, require automatic retry, and must survive server restarts.

**When to use:** Long-running business flows with intermediate human steps, approvals, scheduled retries. For example, a banking onboarding process that waits for customer documents over several days.

**When NOT to use:** For real-time responses or simple batch. Temporal's operational complexity is unnecessary for conversational bots or short processing jobs.

**Main config:** `schedule` (optional cron), `idempotencyKey`.

**Alternatives:** AWS Step Functions, Prefect, Dagster, Airflow (for data flows), Celery with beat scheduler. Temporal stands out for code-as-workflow definition and durability guarantees.

---

### `io.batch`

**What it does:** File source for batch processing. Can be a local directory, S3/GCS bucket, or cron. Produces `Documents` and sets `deploymentTarget: batch`.

**When to use:** Nightly document indexing, case file processing, mass credit or claims evaluations. Key examples: [02-banking-credit-scoring](../../examples/02-banking-credit-scoring/), [04-insurance-claims](../../examples/04-insurance-claims/).

**When NOT to use:** For real-time or conversational processing.

**Main config:** `source` *(required)*, `glob` (file pattern, default `**/*.pdf`).

**Alternatives:** Apache Spark for massive scale, Pandas/Polars for in-memory tabular data, AWS Glue, dbt.

---

### `io.output`

**What it does:** Final flow output to the user or external system. Formats the response (text, markdown, or JSON) and sends it via SSE streaming or as a complete document. It is the standard output node present in all flows.

**When to use:** Always, as the terminal node of the flow. The format (`text`, `markdown`, `json`) must match the consumer.

**When NOT to use:** If you need to send asynchronous notifications (email, SMS, push) use `io.notify`. If you want to show a suggestion in a side panel without interrupting the main flow use `io.panel`.

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `format` | `text` / `markdown` / `json` | `markdown` |
| `streaming` | `true` / `false` | `true` |

**Alternatives:** No direct alternatives within the catalog — it is the standard output contract. In production, output can go to Gradio, Streamlit, a custom frontend, or a REST API.

---

### `io.notify`

**What it does:** Sends outbound notifications (email, SMS, push) without interrupting the main flow. It does not produce a conversational response, but an asynchronous trigger to external channels.

**When to use:** When the agent's action must be communicated outside the chat channel. Example: notify the customer of shipment rebooking by email and SMS, or alert a doctor about an escalated case.

**When NOT to use:** For the bot's main response (use `io.output`). It is not a replacement for mature transactional email systems (SendGrid, AWS SES) — it wraps them.

**Main config:** `channels: [email, sms, push]`.

**Alternatives:** SendGrid, Twilio SMS, Firebase Push, AWS SNS. `io.notify` abstracts the channel; real providers are configured via secrets.

---

### `io.panel`

**What it does:** Sends a suggestion to a side UI panel without interrupting the main conversation. Designed for copilots: the human agent keeps talking to the customer while the panel shows the suggested response in real time.

**When to use:** Copilots for human agents (call center, technical support, sales). Key example: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**When NOT to use:** For flows without UI or where the response is the bot's main output.

**Main config:** `cite: true` (shows source citations alongside the suggestion).

**Alternatives:** Custom implementation with WebSocket push, LiveKit for voice+panel in real time.

---

## 2. loader — Data sources

All loaders produce `Documents` and include **mock with fixtures** to run without the real source (`MOCK=true` flag).

---

### `loader.pdf`

**What it does:** Loads text PDFs (not scanned) and converts them into documents with text and basic metadata (filename, page number). Can enable OCR for scanned PDFs.

**When to use:** The most common knowledge source: manuals, policies, contracts, reports. It is the starting point of most RAG pipelines. Present in almost all templates.

**When NOT to use:** When PDFs contain critical tables or diagrams that must be preserved as structured data (use `loader.multimodal`). For CSV/Excel use `loader.tabular`.

**Main config:** `path`/`bucket`, `ocr: false` (enable only if the PDF is scanned; adds latency).

**Alternatives:** PyMuPDF (fitz), PDFMiner, pdfplumber, Unstructured (automatically detects document type), LlamaIndex SimpleDirectoryReader, LangChain PyPDFLoader. Unstructured is the most robust option for mixed PDFs (text + images + tables).

---

### `loader.multimodal`

**What it does:** Loads PDFs with mixed content: extracts tables as structured JSON (`extractTables: true`), sends diagrams and images to a vision model for text descriptions (`describeImages: true`), and preserves section hierarchy per a schema (`sectionScheme`, e.g. `ATA` for aviation manuals). Produces enriched `Documents`.

**When to use:** Technical or financial documents where tables and diagrams are part of the relevant content. Examples: aviation maintenance manuals ([08](../../examples/08-manufacturing-maintenance-rag/)), insurance policies ([04](../../examples/04-insurance-claims/)), financial statements.

**When NOT to use:** For plain-text PDFs (use `loader.pdf`, faster and cheaper). Vision processing adds latency and token cost.

**Main config:**

| Field | Default |
|-------|---------|
| `extractTables` | `true` |
| `describeImages` | `true` |
| `sectionScheme` | schema name (e.g. `ATA`, `insurance-policy`) |

**Alternatives:** Unstructured.io (open-source, supports many formats), Azure Document Intelligence, AWS Textract, LlamaParse (LlamaIndex), Nougat (Meta open model for scientific papers).

---

### `loader.tabular`

**What it does:** Loads tabular data (CSV, Parquet, Excel) and converts it into documents. Each row or row group becomes a text chunk with column metadata.

**When to use:** Structured financial data, product catalogs, customer records that must be available for semantic search or synthesis. Example: credit data in [02-banking](../../examples/02-banking-credit-scoring/).

**When NOT to use:** If tabular data must be queried with SQL, use `loader.sql` or connect directly to a `tool.service` that calls a DB. For complex numeric analysis, Pandas/Polars are more appropriate than RAG.

**Main config:** `path`, `schemaHint` (column interpretation hint).

**Alternatives:** Pandas read_csv/read_excel, LangChain CSVLoader, LlamaIndex PandasQueryEngine (for SQL queries over DataFrames).

---

### `loader.web`

**What it does:** Loads web pages and sitemaps, converts HTML to clean text, and produces `Documents`. Supports crawling to a certain depth.

**When to use:** Intranet FAQs, product pages, online documentation without a PDF version. Example: telecom FAQs in [07](../../examples/07-telecom-callcenter-copilot/).

**When NOT to use:** For sources requiring complex authentication or heavy JavaScript rendering. For structured REST APIs use `loader.sql` or `tool.service`.

**Main config:** `urls[]` *(required)*, `crawlDepth: 0` (0 = only the given URL, no link following).

**Alternatives:** Scrapy, BeautifulSoup + requests, LangChain WebBaseLoader, FireCrawl (managed crawling service), Apify.

---

### `loader.s3`

**What it does:** Loads objects (typically files) from a cloud storage bucket (S3, GCS). Equivalent to `loader.pdf` or `loader.multimodal` but with the source in the cloud.

**When to use:** In production environments where documents live in S3 (policies, contracts, reports). Secret `STORAGE_KEY` required.

**When NOT to use:** For local development (use `loader.pdf` with local path to avoid cloud credentials).

**Main config:** `bucket` *(required)*, `prefix` (subfolder within the bucket).

**Alternatives:** AWS SDK (boto3), Google Cloud Storage client, Azure Blob Storage SDK. For large-scale ingest orchestration, consider AWS Glue or Databricks.

---

### `loader.sql`

**What it does:** Runs a SQL query on a relational database and converts the resulting rows into documents. Lets you index operational data for semantic search.

**When to use:** When relevant data lives in DB tables and you want it in the RAG index. For example, transaction history or product catalog.

**When NOT to use:** For complex analytical queries in real time (use a `tool.service` with a data endpoint). Does not replace a data warehouse.

**Main config:** `query` *(required, full SQL)*, secret `DATABASE_URL`.

**Alternatives:** LangChain SQLDatabaseLoader, LlamaIndex DatabaseReader, SQLAlchemy + custom loader.

---

## 3. ingest — Data preparation

---

### `ingest.chunker`

**What it does:** Splits documents into fragments (chunks) of controlled size, respecting document structure per the chosen strategy. Produces `Documents` ready to be indexed.

Chunking is one of the most critical decisions in a RAG pipeline: chunks that are too large dilute relevance; too small lose context.

**When to use:** Always, after any loader and before the store. It is the step that converts full documents into retrievable fragments.

**When NOT to use:** Never omitted in a standard RAG pipeline. If documents are already short (< 500 tokens), you can use a large `chunkSize` and `overlap: 0`.

**Available strategies:**

| Strategy | When to use |
|------------|-------------|
| `recursive` | Generic text. Splits by paragraphs, then sentences, then characters. The most robust default. |
| `by-section` | Documents with clear headings (H1/H2). Respects section hierarchy. |
| `by-clause` | Contracts and legal documents. Each clause is an autonomous chunk. Critical for citability. |

**Main config:**

| Field | Default |
|-------|---------|
| `strategy` | `recursive` |
| `chunkSize` | `1000` (approx. characters) |
| `overlap` | `150` (overlap between chunks to avoid cutting context) |

**Alternatives:** LangChain RecursiveCharacterTextSplitter, LlamaIndex SentenceSplitter / SemanticSplitter (variable-size chunks based on semantic similarity), Unstructured chunking, chonkie (specialized chunking library).

---

### `ingest.metadata`

**What it does:** Tags each chunk with metadata fields that can later be used as **hard filters** in retrieval. It is the step that turns generic vector search into search with business constraints.

**When to use:** Whenever document context matters: fare type, insurance plan, aircraft type, fiscal period, document class. Without metadata, vector search cannot distinguish documents from different categories.

**When NOT to use:** If all documents in the index are the same type and you do not need category filtering. Omitting it simplifies the pipeline.

**Main config:** `fields[]` — list of field names to tag (e.g. `[fare_class, route_type, effective_date]`).

**Alternatives:** LangChain DocumentTransformer, LlamaIndex MetadataExtractor (can use LLM to extract metadata automatically from text), manual extraction via filename conventions.

---

## 4. store — Vector storage

Stores consume `Documents` + `Embeddings` and produce `Retriever`. They are the vector "database" of the RAG system.

---

### `store.pgvector`

**What it does:** Stores vectors and metadata in PostgreSQL with the `pgvector` extension. Combines vector search with all SQL capabilities (filters, joins, transactions).

**When to use:** When you already have PostgreSQL infrastructure, need complex filters combined with vector search, or require ACID transactions. Ideal for production in corporate environments. Used in most catalog templates.

**When NOT to use:** For quick prototypes where you do not want to run Postgres (use `store.chroma`). For scale beyond 100M vectors (consider Qdrant or Pinecone).

**Secrets:** `DATABASE_URL`.

**Alternatives:** Qdrant, Pinecone, Weaviate, Chroma. See full table in [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

### `store.qdrant`

**What it does:** Stores vectors in Qdrant, a dedicated vector database written in Rust. Supports rich filters (payload filtering), multiple distance types, and scales well to tens of millions of vectors.

**When to use:** When you need a dedicated vector database with advanced filters, good performance at scale, and do not want to add Postgres to the stack. Available as managed service (Qdrant Cloud) or self-hosted.

**When NOT to use:** If you already have Postgres in production (use `store.pgvector`). For local demos/development (use `store.chroma`).

**Secrets:** `QDRANT_URL`, `QDRANT_API_KEY`.

---

### `store.chroma`

**What it does:** Stores vectors in Chroma, an embedded vector database that runs inside the Python process, without a separate server. The index persists to disk. Ideal for development and demos.

**When to use:** Prototypes, demos, internal bots with low volume (< 1M vectors), environments where you cannot install Postgres. It is the simplest store to get running. Example: [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/).

**When NOT to use:** In production with multiple service instances (embedded Chroma does not natively support multi-process concurrent access). For scale or advanced filter needs.

**Direct alternatives:** FAISS (memory/disk only, no server), Qdrant (managed), pgvector.

---

### `store.neo4j`

**What it does:** Stores documents and entities as nodes in a knowledge graph, with typed relationships between them. Supports vector search over nodes (each node has an embedding) AND retrieval by graph neighborhood (1 or 2 hops). Implements the **GraphRAG** pattern.

**When to use:** When relationships between entities are as important as document content. Examples: character networks in legal documents, symptom-diagnosis relationships, organizational hierarchies.

**When NOT to use:** For simple RAG over documents without structured relationships. Graph modeling overhead is significant compared to a standard vector store.

**Secrets:** `NEO4J_URI`, `NEO4J_AUTH`.

**Alternatives:** Amazon Neptune, TigerGraph, Memgraph. Microsoft GraphRAG (specific tool that builds entity graphs over documents). LlamaIndex PropertyGraphIndex.

---

### `store.multi-index`

**What it does:** Groups several named indexes (e.g. `policy`, `procedure`, `faq`) into a single access point. It does not store data directly — it receives `Retriever` from multiple stores and exposes them under one name. `retrieval.router` uses this structure to route queries to the correct index.

**When to use:** When you have multiple knowledge bases with clearly distinct categories and want to avoid cross-category noise. Examples: telecom with policy+procedure+faq ([07](../../examples/07-telecom-callcenter-copilot/)), legal with playbook+regulations+precedent ([05](../../examples/05-legal-contract-review/)).

**When NOT to use:** If you have a single document type or if index separation does not measurably reduce noise.

**Main config:** `indexes[]` *(required)* — list of index names (must match names of connected stores).

---

## 5. retrieval — Retrieval

Retrieval nodes consume `Retriever` (or `Chunks`) and produce `Chunks`, the text fragments the LLM will use as context.

---

### `retrieval.vector`

**What it does:** Vector similarity search (nearest neighbor search). Given a query (converted to embedding), finds the `topK` chunks whose vector is closest to the query vector. Supports `hardFilters` to restrict search to index subsets.

**When to use:** The default retriever in almost every RAG flow. Works well when the query is semantic and exact keyword match is not required.

**When NOT to use:** When the user searches for exact technical terms (part numbers, codes) that embeddings may not distinguish well. In those cases, complement with `retrieval.hybrid`.

**Main config:**

| Field | Default |
|-------|---------|
| `topK` | `4` |
| `hardFilters[]` | list of metadata fields that act as mandatory constraints |

**Note on hardFilters:** They are not "relevance suggestions" — they are WHERE clauses in the store query. They guarantee economy fare chunks never contaminate a business fare response.

**Alternatives:** LangChain VectorStoreRetriever, LlamaIndex VectorIndexRetriever, FAISS similarity_search.

---

### `retrieval.graph`

**What it does:** Retrieval over a knowledge graph (Neo4j). Instead of searching by vector similarity in a flat chunk set, it navigates the graph by relationships: given a relevant node, it also retrieves its neighbors (nodes related at 1 or 2 hops).

**When to use:** When relationships between entities provide critical context. For example: "which contracts are related to this company?" is not just semantic similarity but graph traversal.

**When NOT to use:** For RAG over documents without graph structure. Latency is higher than flat vector search.

**Main config:** `hops: 1` (traversal depth), `pattern` (relationship type to follow).

**Alternatives:** LlamaIndex KnowledgeGraphIndex, Microsoft GraphRAG, Amazon Neptune, LangChain Neo4jGraph.

---

### `retrieval.hybrid`

**What it does:** Combines vector search (semantic) with keyword search (BM25/keyword). Fuses results from both modalities with an `alpha` parameter controlling relative weight. Retrieves better both semantic concepts and exact technical terms.

**When to use:** When the corpus has technical terms, proper names, codes, or serial numbers that embeddings represent poorly. It is the most robust option for retrieval in technical documents.

**When NOT to use:** When the corpus is homogeneous and vector search alone already has high precision. Adds operational complexity (needs BM25 index in addition to vector).

**Main config:** `alpha: 0.5` (0 = keyword only, 1 = vector only, 0.5 = balance).

**Alternatives:** Elasticsearch dense_vector + BM25, OpenSearch, Weaviate hybrid search, Qdrant hybrid, LangChain EnsembleRetriever.

---

### `retrieval.router`

**What it does:** Multi-index routing: given a query, selects the correct index from `store.multi-index` based on keyword or intent rules. Redirects vector search only to the relevant index, reducing latency and noise.

**When to use:** With `store.multi-index` when you have 2+ clearly distinct document categories and want to avoid irrelevant cross-category fragments.

**When NOT to use:** With a single index or when categories have heavy semantic overlap (keyword router will not work well).

**Main config:** `rules[]` — pairs `{keyword: value, index: index_name}`, `fallback` — default index if no rule matches.

**Alternatives:** LlamaIndex RouterQueryEngine, LangChain RouterChain, intent classifier followed by manual dispatch.

---

### `retrieval.parent-child`

**What it does:** Implements the Parent-Child retrieval pattern. Indexed chunks are small (for high search precision) but what is returned to the LLM is the larger parent chunk with more context. The `parentField` in metadata links each child chunk to its parent.

**When to use:** When small chunks give good search precision but the LLM needs more context to answer well. Documents with sections that make sense as a unit but are too long to index as a single chunk.

**When NOT to use:** When standard chunking already produces good context. Adds complexity to the ingest pipeline (you must generate and store the parent-child hierarchy).

**Main config:** `parentField: parent_id` (metadata field referencing the parent chunk).

**Alternatives:** LlamaIndex ParentDocumentRetriever, LangChain ParentDocumentRetriever, Small-to-Big retrieval (similar variant).

---

### `retrieval.reranker`

**What it does:** Reorders chunks retrieved by vector similarity and discards the least relevant, keeping the `topN` most useful. Uses a cross-encoder model that evaluates (query, chunk) pair relevance jointly, unlike embedding which encodes them separately.

**When to use:** When the vector retriever returns noise: semantically similar but not directly relevant chunks for the specific query. Improves answer quality at the cost of additional latency (~50-150ms). Essential in high-precision flows like legal or medical.

**When NOT to use:** When latency is critical and the vector retriever already has high precision. For a simple HR bot the reranker may be excessive.

**Main config:**

| Field | Default |
|-------|---------|
| `model` | `bge-reranker` |
| `topN` | `3` |
| `feedbackRef` | reference to feedback store for continuous fine-tune |

**Alternatives:** Cohere Rerank (managed API), BGE-Reranker (open model, local), ColBERT (late interaction, more efficient), FlashRank (ultra-fast, lower quality). See comparison table in [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

## 6. model — Models

---

### `model.llm`

**What it does:** Configures an LLM via LangChain's standard `init_chat_model` interface. Produces a `Model` that connects to nodes needing an LLM: `logic.prompt`, `logic.structured`, `agent.react`, etc.

**When to use:** In any flow needing natural language reasoning, synthesis, or text generation. It is the most common model node.

**When NOT to use:** For embeddings (use `model.embedding`), for vision (use `model.vision`), for lightweight intent classification (use `model.intent`).

**Main config:**

| Field | Default |
|-------|---------|
| `model` | `anthropic:claude-opus-4-8` |
| `temperature` | `0.2` |
| `apiKeyRef` | `ANTHROPIC_API_KEY` |

The `provider:model-name` format lets you change provider by editing one field, without lock-in.

**Alternatives:** Claude Opus/Sonnet/Haiku (Anthropic), GPT-4o/GPT-4o-mini (OpenAI), Gemini Pro/Flash (Google), Llama 3 (Meta, open-weights via Ollama/HF), Mistral Large/Mixtral, Granite (IBM watsonx). See comparison table in [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

### `model.embedding`

**What it does:** Configures the embedding model that converts text into numeric vectors. Produces `Embeddings`, which connects to vector stores. It is the component that enables semantic similarity search.

**When to use:** Whenever there is a vector store in the flow. The embedding model must be the same at ingest and query (if you change the model, you must re-index everything).

**When NOT to use:** Not applicable to omit if there is a store; it is mandatory.

**Main config:**

| Field | Default |
|-------|---------|
| `model` | `text-embedding-3-large` |
| `local` | `false` |
| `apiKeyRef` | per provider |

`local: true` uses a local model (sentence-transformers), eliminating network calls and reducing latency by ~100-150ms.

**Alternatives:** text-embedding-3-large/small (OpenAI), embed-v3 (Cohere), E5-large, BGE-large (local open models with quality comparable to API models), nomic-embed, Jina Embeddings.

---

### `model.vision`

**What it does:** Multimodal model capable of describing images, diagrams, tables, and figures in text. Produces `Model`. Connects mainly to `loader.multimodal` to enrich the ingest pipeline with descriptions of visual elements.

**When to use:** When documents contain images, technical diagrams, scanned tables, or figures that provide relevant information. Examples: maintenance manuals ([08](../../examples/08-manufacturing-maintenance-rag/)), insurance policies with damage photos ([04](../../examples/04-insurance-claims/)).

**When NOT to use:** For plain-text documents (adds unnecessary cost and latency).

**Main config:** `model: anthropic:claude-opus-4-8`, `apiKeyRef: ANTHROPIC_API_KEY`.

**Alternatives:** GPT-4o (OpenAI), Gemini Pro Vision (Google), LLaVA (open, local), Qwen-VL, Pixtral (Mistral).

---

### `model.intent`

**What it does:** Lightweight intent classifier. Given a message, classifies it into one of the defined labels (`labels[]`). Works with local embeddings (fast, ~5-10ms) or a small LLM. Produces `Query` (actionable fragment) and `Decision` (intent label).

**When to use:** As a gate before the RAG pipeline to discard non-actionable messages (greetings, silence, filler phrases). Key example: [07-telecom](../../examples/07-telecom-callcenter-copilot/), where it filters 30-50% of audio fragments. Also for routing: decide which agent or index should handle the query.

**When NOT to use:** When all queries are equally actionable or classification is unnecessary. Do not use for complex classification with many labels (> 10) — a small LLM gives better quality there.

**Main config:**

| Field | Default |
|-------|---------|
| `labels[]` | *(required)* |
| `backend` | `embeddings` |
| `threshold` | `0.6` |

**Alternatives:** `query.intent` (routing-oriented alias in the catalog), zero-shot classifiers with LLM (more flexible, more costly), fastText (ultra-fast, requires fine-tune), SetFit (few-shot with sentence-transformers).

---

## 7. query — Query operations

---

### `query.rewrite`

**What it does:** Normalizes and expands the user query before sending it to the retriever. Converts internal jargon, abbreviations, or synonyms into canonical terms the index expects. Can expand the query to improve recall (add synonyms or alternative reformulations).

**When to use:** When users use vocabulary different from the documents. Example: in telecom, "baja de plan" must map to "cancelación de servicio" so the retriever finds the correct chunks.

**When NOT to use:** For domains where user vocabulary matches the documents (adds no value in basic HR, for example).

**Main config:** `glossaryRef` (synonym glossary reference), `expand: true`.

**Alternatives:** HyDE (Hypothetical Document Embeddings — generates a hypothetical document and uses it as query), Step-back prompting, LLM-based query reformulation, LangChain MultiQueryRetriever.

---

### `query.intent`

**What it does:** Detects the actionable intent of the message. If intent is not relevant for RAG (e.g. the user says "thanks" or "yes"), it does not trigger the retrieval pipeline. It is an alias of `model.intent` oriented specifically to RAG pipeline routing.

**When to use:** In flows where not every query should activate RAG. Complements or replaces `model.intent` when the focus is query routing.

**When NOT to use:** In flows where every input is always a valid RAG query.

**Main config:** `labels[]` *(required)*.

---

## 8. logic — Reasoning and rules

---

### `logic.prompt`

**What it does:** LLM response synthesis from retrieved chunks and the user message. It is the standard generation node in a RAG pipeline: receives `Chunks` + `Model` + `Message` and produces `Message` (the natural language response).

**When to use:** In any RAG flow where the user response is LLM-generated text based on retrieved documents.

**When NOT to use:** When you need structured output (JSON) instead of free text (use `logic.structured`). When the response is deterministic and does not require an LLM (use `logic.rules`).

**Main config:** `template` *(required)*, `system` (LLM system instruction).

**Alternatives:** LangChain LCEL (LLMChain, RAGChain), LlamaIndex QueryEngine, an agent node with RAG as a tool.

---

### `logic.structured`

**What it does:** Structured output validated against a JSON Schema. Instead of free text, the LLM produces a JSON object with defined fields (e.g. `{score, decision, factores, justificacion}`). With `requireCitations: true`, requires each referenceable field to cite its source.

**When to use:** When the response consumer is a system (not a human) or when the response must be reproducible and auditable. Examples: credit evaluation ([02](../../examples/02-banking-credit-scoring/)), claims adjudication ([04](../../examples/04-insurance-claims/)), contract review ([05](../../examples/05-legal-contract-review/)).

**When NOT to use:** For conversational natural language responses (use `logic.prompt`).

**Main config:**

| Field | Default |
|-------|---------|
| `schema` | *(required, JSON Schema)* |
| `requireCitations` | `false` |

**Alternatives:** `instructor` (Python library for structured output), `outlines` (grammar-guided generation), LangChain `with_structured_output()`, LlamaIndex `StructuredLLM`, Pydantic v2 + `model.bind_tools()`.

---

### `logic.rules`

**What it does:** Evaluates deterministic rules (`when → then`) without invoking any LLM. Produces `Decision` based on pure logic: numeric thresholds, conditions on metadata fields, predefined classifications.

**When to use:** For decisions with business consequences that must be 100% reproducible: credit approval thresholds, insurance eligibility criteria, event priority classification. **Golden rule:** never delegate to the LLM a threshold with legal or financial consequences.

**When NOT to use:** For decisions requiring natural language understanding or reasoning over variable context.

**Main config:** `rules[]` — list of `{when: condition, then: action}` pairs, `else` — default action.

**Alternatives:** Pure Python code, rule engines like Drools or PyCaret, business rule DSLs.

---

### `logic.router`

**What it does:** Bifurcates the graph flow based on a condition or decision. Given an input `Decision`, redirects flow through one of the named `branches[]`. It is the graph's `if/else` node.

**When to use:** When the flow has distinct paths based on a prior node's decision. Example: `logic.rules` classifies shipments as `simple`/`complex` and `logic.router` redirects to the corresponding sub-agent.

**When NOT to use:** If the graph is linear without branches.

**Main config:** `branches[]` *(required)* — list of `{name: name, condition: expression}` pairs.

**Alternatives:** Conditional edges in LangGraph (`add_conditional_edges`), `logic.rules` + multiple outputs.

---

### `logic.citations`

**What it does:** Post-processor that verifies each LLM claim is anchored in one of the retrieved chunks. In `enforce` mode, rejects (or regenerates) responses without verifiable citations. In `annotate` mode, adds references without rejecting.

**When to use:** In any high-consequence domain where an unsupported answer is unacceptable: health, legal, compliance, HR, aviation maintenance. It is the last line of defense before the user.

**When NOT to use:** In relaxed conversational flows where fluency matters more than citability (e.g. an entertainment bot).

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `mode` | `enforce` / `annotate` | `enforce` |

**Alternatives:** FaithfulnessEvaluator (LlamaIndex), NLI (Natural Language Inference) models, RAGAS faithfulness metric as production guardrail.

---

## 9. agent — Agents

---

### `agent.react`

**What it does:** ReAct (Reason + Act) agent orchestrator. The LLM reasons about current state, decides which tool to call, observes the result, and repeats until the task completes or `maxSteps` is reached. Can handle multiple tools and maintain conversation state. It is the standard agent node for multi-step tasks.

**When to use:** For tasks requiring multiple service or knowledge base calls before answering: change a flight (check itinerary → verify policies → find alternatives → calculate price → charge), answer medical questions (check history → retrieve guidelines → verify criteria → decide).

**When NOT to use:** For simple single-retrieval answers (a standard RAG pipeline is sufficient and more predictable). For massive parallel processing (use `agent.fanout`).

**Main config:**

| Field | Default |
|-------|---------|
| `system` | *(required)* |
| `maxSteps` | `8` |
| `streaming` | `true` |

**Alternatives:** LangGraph `create_react_agent`, LangChain AgentExecutor (legacy), LlamaIndex ReActAgent, smolagents (HuggingFace), OpenAI Assistants API.

---

### `agent.fanout`

**What it does:** Dispatches N **stateless** sub-agents in parallel, one per batch item or partition. Controls concurrency with the `concurrency` field. Each sub-agent is independent and does not share in-memory state; state persists in the DB or event log.

**When to use:** For massive event processing where the same logic must apply to many items in parallel: mass shipment rebooking ([10](../../examples/10-logistics-disruption-rebooking/)), batch credit application processing, fraud alerts.

**When NOT to use:** For conversational agents with session state (use `agent.react`). For sequential processing where order matters.

**Main config:**

| Field | Default |
|-------|---------|
| `concurrency` | `16` |
| `subAgentSystem` | sub-agent instructions |

**Alternatives:** LangGraph multi-agent with conditional edges, CrewAI with parallel tasks, `asyncio.gather` + semaphore (the underlying generated implementation).

---

## 10. tool — External tools

All tools produce `Tool` for an agent to invoke. All include mock with fixtures.

---

### `tool.service`

**What it does:** Generic tool toward an external HTTP service. Declares the operation (name, base URL, input/output schemas) and the agent can invoke it by name in natural language.

**When to use:** To integrate any existing REST service (booking systems, ERP, CRM, payment services, internal APIs). It is the most versatile tool and the most used in templates.

**When NOT to use:** For simple HTTP calls without business logic (use `tool.http`). For inline Python functions without backend (use `tool.function`).

**Main config:** `name` *(required)*, `baseUrl` *(required)*, `operation` *(required)*, `inputSchema`, `outputSchema`.

**Secrets:** `SERVICE_API_KEY`.

**Alternatives:** LangChain StructuredTool with httpx, LlamaIndex FunctionTool, FastAPI endpoint + tool declaration.

---

### `tool.http`

**What it does:** Simple parameterized HTTP call. Less declarative than `tool.service`: specifies directly the method, URL template, and parameters. Useful for simple APIs with a single endpoint.

**When to use:** For quick integrations with simple REST APIs: webhooks, query endpoints without complex authentication.

**When NOT to use:** For services with multiple operations or complex business logic (use `tool.service`).

**Main config:** `method: GET`, `urlTemplate` *(required)*.

---

### `tool.function`

**What it does:** Runs a custom Python code fragment defined in the node. The agent can invoke this function like any other tool. Ideal for simple business logic that does not justify an external service.

**When to use:** Calculations, data transformations, validations, utility functions the agent needs to invoke but that are deterministic and self-contained.

**When NOT to use:** For logic needing persistence, external calls, or complex code (use `tool.service` or a Cloud lambda/function).

**Main config:** `name` *(required)*, `signature`, `body` *(required, Python code)*.

---

### `tool.mcp`

**What it does:** Exposes a tool served by an MCP (Model Context Protocol) server. The node connects to the specified MCP server (via STDIO or HTTP) and invokes the declared tool by name.

**When to use:** To integrate external tools exposed via the standard MCP protocol: Anthropic tools, GitHub Copilot MCP servers, custom servers built with FastMCP. Course module M8.

**When NOT to use:** If the service does not speak MCP (use `tool.service` or `tool.http`).

**Main config:** `server` *(required)*, `tool` *(required)*.

---

### `tool.retriever`

**What it does:** Exposes a `Retriever` (vector store) as a tool invocable by an agent. The agent can decide when and with which query to call RAG, instead of RAG always being forced in the pipeline.

**When to use:** In agentic RAG where the agent must decide whether to query the knowledge base or not, and with which specific query. Example: PolicyRAG in the airline agent ([01](../../examples/01-airline-flight-change/)).

**When NOT to use:** In simple RAG pipelines where retrieval always happens before synthesis (direct retrieval is more predictable and cheaper).

**Main config:** `name: search`, `description` *(required — the agent uses this description to decide when to invoke the tool)*.

---

## 11. guardrail — Security and resilience

Guardrails are placed **around** tools (between the tool and the agent). They wrap the `Tool` port: `Tool` in, `Tool` out.

---

### `guardrail.pre-tool`

**What it does:** Validates a condition **before** executing the tool. If the condition is not met, rejects the call and returns an error without executing the underlying service. Example: do not allow cabin downgrade, verify amount limit.

**When to use:** For business restrictions that must always apply, regardless of what the LLM decides. Security restrictions must be deterministic, not instructions in the LLM prompt.

**When NOT to use:** For simple validations the underlying service already handles adequately.

**Main config:** `checks[]` — list of `{when: condition, action: deny/allow}` pairs.

**Alternatives:** Middleware in the underlying service, validation in the tool JSON Schema, Guardrails AI nemo-guardrails.

---

### `guardrail.confirm`

**What it does:** Requires explicit user confirmation if a defined threshold is exceeded. Pauses tool execution, sends the confirmation message to the chat channel, and waits for the user response before continuing.

**When to use:** For financial or irreversible actions above a certain limit: payments > $500, refunds > $200, contract cancellations. Examples: [01-airline](../../examples/01-airline-flight-change/), [06-retail](../../examples/06-retail-postsale-bot/).

**When NOT to use:** For low-risk or reversible actions where confirm-gate friction hurts UX.

**Main config:** `threshold` (condition expression), `message` (confirmation text to the user).

**Alternatives:** Full HITL (`hitl.escalate`), manual verification in the downstream service.

---

### `guardrail.idempotency`

**What it does:** Makes a transactional tool idempotent. On first call with a given key (`keyFields`) it stores the result; subsequent calls with the same key return the cached result without re-executing the tool. Configurable TTL.

**When to use:** For any transactional operation that must not run twice: payments, refunds, booking confirmations. Critical on streaming channels where reconnections can cause retries. Standard pattern in payments (similar to Stripe `Idempotency-Key`).

**When NOT to use:** For read-only operations (unnecessary, no side effect).

**Main config:** `keyFields[]` *(required)*, `ttl: 24h`.

**Alternatives:** Redis with TTL + composite key, transaction table in DB with uniqueness constraint, Stripe Idempotency-Key at API gateway level.

---

### `guardrail.resilience`

**What it does:** Circuit breaker + retry + fallback. Retries the tool N times on transient failures. If failure rate exceeds the threshold, opens the circuit (subsequent calls return `fallbackMessage` directly without trying the service). Recovers automatically after a cooldown.

**When to use:** For external services with variable availability: payment APIs at peak hours, inventory services, third-party services. Prevents a degraded service from blocking the agent waiting on timeouts.

**When NOT to use:** For highly available internal services or operations where fallback is not semantically valid.

**Main config:** `retries: 2`, `breakerThreshold: 0.5` (50% failures opens circuit), `fallbackMessage`.

**Alternatives:** `tenacity` (Python retry library), `circuitbreaker` library, Istio/Envoy service mesh (infrastructure-level resilience), Hystrix (Java).

---

## 12. hitl — Human in the loop

---

### `hitl.escalate`

**What it does:** Interrupts the agent flow and escalates the case to a human (inspector, reviewer, senior agent). The escalation condition is evaluated **outside the LLM**, deterministically. The flow pauses until the human reviews and approves/modifies/rejects, with a configured `timeout`. After human intervention, the flow resumes.

**When to use:** For cases where an incorrect agent decision is unacceptable: ambiguous medical diagnoses ([03-healthcare](../../examples/03-healthcare-prior-auth/)), procedures with WARNING in aviation maintenance ([08](../../examples/08-manufacturing-maintenance-rag/)), high severity or complexity situations.

**When NOT to use:** For routine cases where the agent has high confidence. Escalation introduces latency (hours, not seconds) — use only when risk justifies it.

**Critical design:** The `when` condition must be evaluated by the graph, not by the LLM. If the LLM decides whether to escalate, it can "reason" incorrectly and fail to do so. HITL must be a **structural trip-wire**.

**Main config:** `when` *(required, deterministic condition)*, `assignee` (role or user), `timeout` (deadline for human review).

**Alternatives:** Ticketing systems (Zendesk, Jira Service Management), Slack/Teams approvals via webhook, `humanlayer` (Python library for programmatic approvals).

---

## 13. observability — Audit and feedback

---

### `observability.audit`

**What it does:** Persists each tool call with its arguments, result, timestamp, and session context. Acts as **passthrough**: receives `Any`, publishes the event to the configured sink (Kafka or log), and passes data to the next node unchanged. It is the regulatory traceability node.

**When to use:** In any flow where agent actions must be auditable: payments, credit decisions, medical authorizations, bookings. Examples: [01-airline](../../examples/01-airline-flight-change/), [06-retail](../../examples/06-retail-postsale-bot/), [10-logistics](../../examples/10-logistics-disruption-rebooking/).

**When NOT to use:** In prototypes or development flows without regulatory requirements (adds minimal but unnecessary overhead).

**Main config:**

| Field | Values | Default |
|-------|---------|---------|
| `sink` | `kafka` / `log` | `log` |
| `topic` | Kafka topic name | — |

**Alternatives:** LangSmith (LLM + tool traceability), Langfuse (open-source), Datadog APM, OpenTelemetry + Jaeger/Zipkin.

---

### `observability.feedback`

**What it does:** Feedback loop: captures quality signals (thumbs up/down, successful transaction callbacks) and stores them in a feedback store. `feedbackRef` in `retrieval.reranker` can be used for continuous fine-tune of the reranking model.

**When to use:** In production systems where you want to improve retrieval over time using real user preferences. Key example: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**When NOT to use:** In prototypes or when there is no defined process to consume feedback and retrain.

**Main config:** `store` *(required)*, `signals[]` — signal types to capture (e.g. `thumbs`, `txn_callback`).

**Alternatives:** LangSmith datasets + human feedback, Argilla (open-source annotation platform), Weights & Biases feedback logging.

---

### `observability.metrics`

**What it does:** Exports operational metrics via OpenTelemetry (OTLP): processed event throughput, auto-confirm vs LLM decision rate, latency by priority, errors. Metrics are visualized in Prometheus/Grafana or cloud APM.

**When to use:** In production to monitor system health, detect degradations, and have visibility during critical events (mass disruptions, traffic spikes). Example: [10-logistics](../../examples/10-logistics-disruption-rebooking/) with real-time rebooking metrics during a crisis.

**When NOT to use:** In development/prototype without observability infrastructure.

**Main config:** `exporter: otlp`.

**Alternatives:** Prometheus + Grafana (pull), Datadog APM, New Relic, AWS CloudWatch. LangSmith and Langfuse also export LLM metrics (tokens, latency, cost) that complement OTLP infrastructure metrics.

---

## Summary: the 53 nodes and their categories

| Category | Nodes (`type`) | Total |
|-----------|----------------|-------|
| io | `io.input`, `io.stt`, `io.event-source`, `io.trigger`, `io.batch`, `io.output`, `io.notify`, `io.panel` | 8 |
| loader | `loader.pdf`, `loader.multimodal`, `loader.tabular`, `loader.web`, `loader.s3`, `loader.sql` | 6 |
| ingest | `ingest.chunker`, `ingest.metadata` | 2 |
| store | `store.pgvector`, `store.qdrant`, `store.chroma`, `store.neo4j`, `store.multi-index` | 5 |
| retrieval | `retrieval.vector`, `retrieval.graph`, `retrieval.hybrid`, `retrieval.router`, `retrieval.parent-child`, `retrieval.reranker` | 6 |
| model | `model.llm`, `model.embedding`, `model.vision`, `model.intent` | 4 |
| query | `query.rewrite`, `query.intent` | 2 |
| logic | `logic.prompt`, `logic.structured`, `logic.rules`, `logic.router`, `logic.citations` | 5 |
| agent | `agent.react`, `agent.fanout` | 2 |
| tool | `tool.service`, `tool.http`, `tool.function`, `tool.mcp`, `tool.retriever` | 5 |
| guardrail | `guardrail.pre-tool`, `guardrail.confirm`, `guardrail.idempotency`, `guardrail.resilience` | 4 |
| hitl | `hitl.escalate` | 1 |
| observability | `observability.audit`, `observability.feedback`, `observability.metrics` | 3 |
| **Total** | | **53** |

---

*This catalog cross-references [`glosario.md`](./glosario.md) (term definitions) and [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) (comparison tables of options in each category).*

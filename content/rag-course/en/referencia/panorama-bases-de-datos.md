# Overview of databases and storage for RAG and agentic systems

> Extended reference for the **RAG & Agentic AI** course. Complements the seven vector stores table from [M3](../03-embeddings-y-stores/guia.md) and [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores) with the **full market map** as of 2025/2026: families, when each fits, when NOT, and honest Achilles heels.
>
> **Audience:** Python developers who already master embeddings, ANN indexes (flat / IVF / HNSW — see [M3 §6](../03-embeddings-y-stores/guia.md#6-index-types-flat-ivf-hnsw)) and the course's seven stores. Here you learn **where the rest fit** and how to decide without adding unnecessary pieces.

---

## Introduction: the decision is not just "Chroma vs Pinecone"

In RAG and agents, the real question is **where vectors, metadata, raw documents, relationships, and conversation state live**. That is not solved with a single product category. The market organizes into **families** with deliberate overlap: a search engine can index vectors; Postgres can be your only database; a graph can have embeddings on each node.

The course rule still applies: **choose the store by business requirements** (filters, compliance, scale, ops team), not by the first tutorial you read. ANN indexes (HNSW, IVF…) are **mechanisms** shared by many families — do not confuse "I have HNSW" with "I have the right database."

### Family summary table

| Family | What it mainly stores | Strength in RAG/agentic | Typical risk |
|--------|----------------------|-------------------------|--------------|
| **Dedicated vector DB** | Embeddings + payload/metadata | Optimized ANN, payload filters, retrieval APIs | Another piece in the stack if you already have SQL/search |
| **Relational + vector extension** | SQL rows + `vector` column | Joins, ACID, complex filters, single system | ANN scale limited vs dedicated engines |
| **Search engine / hybrid** | Inverted index (BM25) + vectors | Keyword + semantic in one engine, facets, web relevance | Cluster complexity and scoring tuning |
| **Document/NoSQL + vector** | JSON documents + vector index | "I already have my docs there" — one place | Vector search secondary; less mature than native |
| **Graph / knowledge graph** | Nodes, edges, sometimes embeddings | GraphRAG, relationships, multi-hop | Modeling and graph maintenance costly |
| **ANN library (not DB)** | Vectors only (FAISS, hnswlib…) | Extreme speed, full control | CRUD, filters, and multi-tenant by hand |
| **Specialized** | Features, semantic cache, objects, metadata | Complement — do not replace main index | Using them as "vector DB" by trend |

### How to choose at family level (before choosing product)

1. **Do the data already live in a system?** If yes, start by extending that system (Postgres → pgvector; Elasticsearch → dense_vector; Mongo → Atlas Vector Search) before adding Qdrant or Pinecone.
2. **Do you need BM25 + vector in production without fusing yourself?** Hybrid engines (OpenSearch, Vespa, Weaviate, Redis Stack) usually beat "pure vector + BM25 separately."
3. **Do relationships matter as much as text?** Graph family + [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph) (M4).
4. **Extreme volume and latency with platform team?** Dedicated vector DB or library (FAISS/Milvus) with explicit ops.
5. **Prototype or < 100k chunks?** Embedded or in-memory — see [§7](#7-when-you-do-not-need-a-vector-db).

---

## 1. Dedicated vector DBs

A **dedicated vector database** exposes embedding collections, ANN search, CRUD on vectors and metadata, and persistence as a product contract. It is not the same as an **ANN library** embedded in your process (FAISS, hnswlib): the library solves "find neighbors"; the DB solves "retrieval service with identities, filters, and concurrent operations."

### The course's seven (reference, not repetition)

Chroma, FAISS, pgvector, Qdrant, Pinecone, Weaviate, and Milvus are compared in [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores) and covered in depth in [M3 §12](../03-embeddings-y-stores/guia.md#12-vector-store-comparison). RAGorbit nodes: [`store.chroma`](./catalogo-nodos.md#storechroma), [`store.pgvector`](./catalogo-nodos.md#storepgvector), [`store.qdrant`](./catalogo-nodos.md#storeqdrant).

| Course store | Role in a broader architecture |
|--------------|-------------------------------|
| Chroma / FAISS | Prototype, edge, offline batch |
| pgvector | "Single database" when Postgres already rules |
| Qdrant / Milvus | Dedicated ANN scale on-prem or hybrid |
| Pinecone | Zero-ops SaaS, multi-tenant cloud |
| Weaviate | Vector + BM25 + light graph in one product |

### Dedicated vs ANN library

| Aspect | Dedicated vector DB | Library (FAISS, hnswlib, Annoy, ScaNN) |
|--------|---------------------|----------------------------------------|
| **Product API** | Collections, IDs, metadata, delete/update | Matrices + index in memory/file |
| **Business filters** | Payload / SQL per product | External: you maintain id → metadata map |
| **Concurrency** | Server or managed service | Single process; manual locking |
| **Persistence** | Snapshots, WAL, replication | `write_index` / pickle — your design |
| **When to prefer** | Multi-user RAG service, production | Benchmark, batch pipeline, 100M+ with fine control |

**FAISS** (Meta): reference in speed and IVF/PQ/GPU variants; used behind many systems. **hnswlib**: minimal HNSW, base of Chroma/Qdrant internally in variants. **Annoy** (Spotify): random tree, good for static disk indexes. **ScaNN** (Google): strong recall/speed; more common in research pipelines or specific integrations than as standalone "DB."

**When NOT to use a library alone:** complex metadata filters, frequent deletes, multiple services writing, audit of which chunk is indexed. Then move up to Qdrant, pgvector, or a hybrid engine.

### LanceDB

**What it does:** **Embedded** column-oriented vector database (Apache Arrow / Lance). Runs in-process or as a service; natural integration with Python and ML ecosystem (large datasets, multimodal).

**When to use:** Prototypes and data pipelines where you already use Arrow/Pandas/Polars; local storage with good analytical read performance; RAG on images/audio with heterogeneous columns in the same dataset.

**When NOT to use:** Need for mature multi-node cluster comparable to Milvus/Qdrant Cloud; complex enterprise SQL-style transactional filters; teams that only know Postgres and do not want another columnar mental model.

**Achilles heel:** ecosystem younger than Pinecone/Qdrant in enterprise multi-region deployments; verify SLA and distributed server roadmap for your scale.

### Vald

**What it does:** Distributed vector search engine (origin Yahoo Japan / Linux Foundation AI & Data), designed for **massive scale** and auto-recovery on Kubernetes.

**When to use:** Tens/hundreds of millions of vectors, K8s deployment, teams with SRE; portal-scale recommendation or search cases.

**When NOT to use:** Laptop demos; teams without capacity to operate a distributed system; small corporate RAG with Postgres sufficient.

**Achilles heel:** high ops curve; documentation and community smaller than Milvus/Qdrant outside Japan.

### Marqo

**What it does:** Open source **tensorial** search engine: end-to-end embeddings (integrated model or BYO), search-engine-style API over text and image.

**When to use:** Multimodal RAG (text + image) where you want one product that embeds and indexes; teams that prefer "search engine" to assembling embedding service + vector DB.

**When NOT to use:** Must fix a specific embedding for compliance and not change; need SQL joins with legacy systems; stack already standardized on OpenSearch + external model.

**Achilles heel:** model–index coupling if using Marqo defaults; changing model implies re-indexing (as in any RAG, but the product emphasizes it).

### Vespa

**What it does:** **Search and ranking** engine at web scale (Yahoo/Oath heritage): BM25, dense vectors, learning to rank, low-latency serving on cluster. Also appears in [§3](#3-search-engines--hybrid-keyword--vector) for its hybrid nature.

**When to use:** Production with millions of documents, sophisticated ranking (features, filters, freshness), native hybrid search at scale; teams with search engine experience.

**When NOT to use:** MVP in a single container; organizations without search DevOps; cases where pgvector + reranker suffice.

**Achilles heel:** modeling complexity (schemas, rank profiles); learning time >> Chroma or Pinecone.

### Turbopuffer

**What it does:** **Serverless** vector store oriented to object storage (pricing per GB stored + queries), namespaces, filters; positioned as cloud-native alternative to Pinecone for variable loads.

**When to use:** Multi-tenant SaaS with traffic spikes; cost sensitive to cold storage; want managed API without operating cluster.

**When NOT to use:** Mandatory on-prem; ultra-low latency with sub-10 ms SLA without evaluation; need in-database SQL joins.

**Achilles heel:** newer provider — evaluate filter limits, regions, and enterprise contract; volatile data as of 2025/2026.

### Chroma Cloud

**What it does:** **Managed** version of Chroma (same mental model as [`store.chroma`](./catalogo-nodos.md#storechroma)), with persistence and remote access without server embedded in your process.

**When to use:** Natural migration from local Chroma prototypes; small teams wanting managed without changing LangChain/LlamaIndex code.

**When NOT to use:** Strict region/sovereignty requirements not covered; scale or filters requiring Qdrant/Milvus; multi-instance production that should already be on pgvector/Qdrant.

**Achilles heel:** Chroma embedded history with concurrency limitations — Cloud solves remote access, but does not turn Chroma into Milvus; validate collection limits and pricing.

### How to choose among dedicated options

| Situation | Reasonable bias |
|-----------|-----------------|
| Course / demo / HR template | Chroma → [`store.chroma`](./catalogo-nodos.md#storechroma) |
| Production Rust, payload filters | Qdrant → [`store.qdrant`](./catalogo-nodos.md#storeqdrant) |
| No ops, cloud | Pinecone, Turbopuffer, Qdrant Cloud, Chroma Cloud |
| Billions scale, platform team | Milvus, Vald, Vespa |
| Local columnar ML pipeline | LanceDB |
| Multimodal "all in one" | Marqo, Weaviate |

**Anti-pattern:** choosing Milvus or Vespa on day 1 because "they scale to Google" with 50k PDFs.

---

## 2. Relational databases with vector extension

Here the vector is **one more column** in an SQL (or SQL-compatible) engine. You gain transactions, joins, roles, backups, and tools your organization already audited.

### pgvector

**What it does:** Open source extension for PostgreSQL: `vector` type, distance operators, IVFFlat and HNSW indexes (by version).

**When to use:** You already have Postgres; hard filters + joins (Banking template); ACID compliance. Node: [`store.pgvector`](./catalogo-nodos.md#storepgvector).

**When NOT to use:** > ~5–10M vectors without benchmark (practical course rule); more aggressive ANN latency than dedicated Qdrant.

**Achilles heel:** ANN under mixed OLTP + vector search load — requires index tuning and connection pooling.

Detail in [M3](../03-embeddings-y-stores/guia.md) and [§3 tecnologias-comparadas](./tecnologias-comparadas.md#3-vector-stores).

### pgvecto.rs

**What it does:** Alternative Postgres extension written in Rust, with vector types and own ANN methods (includes variants beyond classic HNSW evolving as of 2025/2026).

**When to use:** Postgres mandatory but need to squeeze ANN performance without leaving ecosystem; experimentation with indexes newer than standard pgvector.

**When NOT to use:** Environments where only cloud provider "blessed" extensions are allowed (verify RDS/Aurora — pgvector usually supported before pgvecto.rs).

**Achilles heel:** lower adoption than pgvector; migration and operation on cloud managed requires explicit verification.

### sqlite-vss / sqlite-vec

**What it does:** Vector extensions for **SQLite**: ANN index embedded in a `.db` file, zero server.

**When to use:** Desktop/edge apps, offline prototypes, integration tests, local agents with single persistence file.

**When NOT to use:** Multi-process write concurrency; centralized RAG services; datasets > hundreds of thousands of vectors without measuring.

**Achilles heel:** SQLite serializes writes; not a Postgres substitute in concurrent multi-tenant.

### DuckDB (VSS)

**What it does:** DuckDB with **VSS** extension (vector similarity search): columnar analytics + in-process ANN, ideal for parquet and local pipelines.

**When to use:** RAG on data already in Parquet/DuckDB; batch retrieval in notebooks; lightweight feature stores co-located with SQL aggregations.

**When NOT to use:** Multi-user production API with high write concurrency; standard Postgres HA replication needed.

**Achilles heel:** "embedded analytics" model, not typical web OLTP.

### SingleStore

**What it does:** **Distributed SQL** database (memory + columnar) with vector type and integrated ANN search in the same cluster as HTAP loads.

**When to use:** Already use SingleStore for hybrid analytics/transactional and want to avoid another system just for vectors; unified SQL + vector latency.

**When NOT to use:** Greenfield RAG where Postgres pgvector suffices; limited budget — license/complexity vs open source Postgres.

**Achilles heel:** cost and vendor lock-in; overkill if you only need document retrieval.

### ClickHouse

**What it does:** Extremely fast columnar OLAP; **vector index** support and distance functions evolving (see current docs as of 2025/2026).

**When to use:** Logs, events, telemetry + session embeddings; RAG on massive append-only corpus; aggregations and retrieval in the same place.

**When NOT to use:** Fine CRUD per legal document; typical row-level CMS transactions; teams without ClickHouse experience.

**Achilles heel:** optimized for ingest/analytics — frequent chunk updates and mutations are not its natural strength.

### How to choose "your SQL is enough"

```
Is Postgres (or SQL) already operational source of truth?
  YES → pgvector (or pgvecto.rs if benchmark wins)
  NO → Only local file / edge?
         YES → sqlite-vec / DuckDB VSS
         NO → Massive append-only OLAP?
                YES → ClickHouse
                NO → Enterprise HTAP already deployed?
                       YES → SingleStore
                       NO → dedicated vector DB family (§1)
```

**Key advantage:** a `JOIN` between `chunks` and `customers` in the same transaction — no pure vector DB matches without ETL. **Key risk:** mixing heavy OLTP with HNSW without isolating reads can degrade both.

---

## 3. Search engines / hybrid (keyword + vector)

These products were born for **web search relevance**: tokenization, BM25, facets, highlighting, learning to rank. Adding dense vectors enables **native hybrid** (sparse + dense) with a single cluster — the pattern [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid) implements in RAGorbit (M4).

### Elasticsearch

**What it does:** Distributed search engine (Elastic); indexes with `dense_vector`, kNN, and queries combining BM25 with vector (APIs evolved 2023–2025).

**When to use:** Already have Elastic cluster for logs or catalog; need facets, per-language analyzers, Elastic Stack security; hybrid in production without two systems.

**When NOT to use:** Greenfield project without Elastic ops — high complexity; Elastic cloud budget sensitive to hot nodes.

**Achilles heel:** operational cost and licensing (Elastic License vs OSS fork); shard/replica tuning not trivial.

### OpenSearch

**What it does:** Open source fork of Elasticsearch (Linux Foundation / AWS); k-NN plugin (FAISS/HNSW backends), hybrid search, AWS integration.

**When to use:** OSS preference; deployment on AWS OpenSearch Service; same cases as Elastic with open stack.

**When NOT to use:** Need very recent exclusive Elastic commercial stack features — compare release notes.

**Achilles heel:** gradual divergence vs Elastic; validate k-NN plugins on your specific version.

### Vespa

(See also [§1](#vespa).) Stands out when **ranking** and serving at scale are the center, not just "store embeddings."

### Typesense

**What it does:** **Lightweight** OSS search engine, typo-tolerance, simple API; vector support added in recent releases (see 2025/2026 docs).

**When to use:** E-commerce catalogs, public documentation, instant search with Algolia-like UX but self-host; medium volumes.

**When NOT to use:** Billions of documents; extreme rank learning; multi-hop graphs.

**Achilles heel:** enterprise ecosystem (IAM, compliance) less deep than Elastic/OpenSearch at large scale.

### Meilisearch

**What it does:** **Developer-friendly** search engine, fast to deploy; hybrid vectors evolving (confirm capabilities on your version).

**When to use:** Search in small/medium SaaS product; time-to-market priority over Elastic cluster.

**When NOT to use:** Mature geo-distributed clustering requirements; RAG with very complex metadata filters without evaluating limits.

**Achilles heel:** does not compete with Vespa/Elastic in ranking customization at massive web scale.

### Redis (RediSearch / Redis Stack)

**What it does:** In-memory inverted indexes + vector fields (HNSW) in Redis Stack; sub-ms latency for datasets that fit in RAM.

**When to use:** Hot retrieval cache; agent sessions; hybrid over medium catalogs already in Redis; combine with semantic cache (§6).

**When NOT to use:** Corpus that does not fit in affordable RAM; long-term persistence as sole archive — Redis is complement, not data lake.

**Achilles heel:** RAM cost; durability and size limits vs disk-first (Qdrant, OpenSearch).

### When native hybrid wins

| Signal | Hybrid engines usually win |
|--------|---------------------------|
| Codes, SKUs, IDs alongside natural language | BM25 + vector in one query |
| Facets ("brand", "jurisdiction", "date") | Elastic/OpenSearch/Vespa |
| Single "search" ops team | Avoid vector DB ↔ Elasticsearch sync |
| Strict P95 latency with hot index | Redis Stack, Vespa |

**When NOT:** only paraphrased questions without exact terms, homogeneous corpus — Chroma/pgvector + [`retrieval.vector`](./catalogo-nodos.md#retrievalvector) may suffice (M4).

**Fusion:** RAGorbit recommends RRF in [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid); native engines offer their own blend scores — evaluate with your benchmark, do not assume automatic superiority.

---

## 4. Document / NoSQL with vector

Pattern: **the JSON document (or wide-column row) already lives there**; the vector index is an add-on. Reduces ETL if your CMS, catalog, or app already persists in that store.

### MongoDB Atlas Vector Search

**What it does:** Vector index on MongoDB collections in Atlas (and compatible deployments), filters on document fields, aggregation pipeline integration.

**When to use:** MEAN/MERN stack; content already in Mongo; teams wanting single cloud provider for docs + vectors.

**When NOT to use:** On-prem without Atlas Vector Search; need SQL joins; extreme ANN scale without benchmark vs Qdrant.

**Achilles heel:** ANN quality and limits depend on Atlas tier; MongoDB cloud lock-in for managed features.

### Couchbase

**What it does:** JSON NoSQL + memory/disk; vector search capabilities in Capella / Server (2024–2026 evolution).

**When to use:** Mobile/edge apps with Couchbase sync already deployed; catalogs with integrated cache.

**When NOT to use:** Greenfield RAG without Couchbase; 100% Postgres teams.

**Achilles heel:** smaller RAG community than Mongo/Postgres — fewer LangChain/LlamaIndex examples.

### Cassandra / Astra DB (DataStax)

**What it does:** Distributed wide-column; Astra DB adds Vector Search on managed Cassandra data.

**When to use:** Massive horizontal scale, multi-region, data already in Cassandra; event sourcing + event embeddings.

**When NOT to use:** Classic document RAG with frequent per-chunk updates; teams without Cassandra experience.

**Achilles heel:** eventual consistency model — partitioning design critical; not ideal for "one PDF = many fine updates" without planning.

### Azure Cosmos DB

**What it does:** Globally distributed multi-model; **Vector Search** on MongoDB / NoSQL API (by region and mode as of 2025/2026).

**When to use:** Microsoft Azure standard; global SLAs; integration with Azure OpenAI in same tenant.

**When NOT to use:** Multi-cloud without Azure; unpredictable cost without capacity planning — RU/s + vector can surprise.

**Achilles heel:** consistency mode and pricing complexity; cross-partition latency on poorly modeled queries.

### How to choose "I already have my documents there"

| Question | If "yes" |
|----------|----------|
| Do you update documents frequently in-place? | NoSQL with integrated vector avoids dual-write |
| Need joins with ERP SQL? | Better pgvector + ETL from Mongo, not Mongo alone |
| Active-active multi-region? | Cassandra/Astra/Cosmos — watch cost |
| Team < 3 devs without DBA? | Postgres/Atlas managed > Cassandra DIY |

**Anti-pattern:** duplicating entire corpus in Mongo **and** Pinecone **and** S3 without versioned sync pipeline — drift guaranteed.

---

## 5. Graph databases / knowledge graphs (GraphRAG)

Here retrieval is not just "similar chunks" but **entities and relationships**: `(Clause)-[:REFERENCES]->(Article)`, `(Symptom)-[:INDICATES]->(Diagnosis)`. In RAGorbit: [`store.neo4j`](./catalogo-nodos.md#storeneo4j) + [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph). Covered in depth in [M4 §10 GraphRAG](../04-retrieval-y-query/guia.md#10-graphrag-and-knowledge-graphs-neo4j).

### Neo4j

**What it does:** Native property graph; Cypher; vector indexes on nodes; multi-hop traversal.

**When to use:** GraphRAG with explicit relationships; Legal template; compliance with lineage between entities.

**When NOT to use:** Corpus without extractable relational structure; MVP where pure vector suffices.

**Achilles heel:** enterprise cost and RAM on large graphs; incorrect modeling → worse than vector alone.

### Memgraph

**What it does:** In-memory graph (C++), largely Cypher-compatible; low latency for traversals.

**When to use:** Graphs that fit in RAM; relationship streaming; sub-ms latency on hops.

**When NOT to use:** Graphs > available memory without mature sharding; teams accustomed only to Neo4j Aura tooling.

**Achilles heel:** persistence and enterprise ecosystem differ from Neo4j — validate backup/HA.

### Kùzu

**What it does:** Embeddable graph DB (columnar, C++), Python integration; oriented to local / medium-scale graph analytics.

**When to use:** GraphRAG prototypes in notebook; graph + Python analytical pipelines without Neo4j server.

**When NOT to use:** Multi-tenant production with fine enterprise ACLs; huge dynamic graphs in cloud.

**Achilles heel:** younger in cloud managed production than Neo4j.

### ArangoDB

**What it does:** Multi-model (document + graph + key-value); AQL; vector search on documents and graphs.

**When to use:** Want JSON documents **and** edges in one engine without separate Neo4j + Mongo.

**When NOT to use:** Only need dense vector without relationships — Arango adds complexity; pure graph performance vs Neo4j/Memgraph per benchmark.

**Achilles heel:** "does everything" can mean "not best at each sub-mode."

### TigerGraph

**What it does:** Parallel distributed graph (GSQL), analytics and graph ML at scale.

**When to use:** Massive graphs (fraud, telco, supply chain); complex parallel traversals.

**When NOT to use:** Typical document RAG; small teams — GSQL + ops learning curve.

**Achilles heel:** LLM integration less standard than Neo4j in RAG tutorials; enterprise licensing.

### When relationships matter more than similarity

| Signal | GraphRAG |
|--------|----------|
| Questions "what is connected to X in 2 hops?" | Yes |
| Legal cross-references between clauses | Yes |
| Homogeneous HR FAQ | No — [`store.chroma`](./catalogo-nodos.md#storechroma) |
| Microsoft GraphRAG "global corpus summary" | Graph + communities — see M4 § Microsoft GraphRAG |

**Common combination:** vector finds seed node → traversal expands context → LLM answers with subgraph.

---

## 6. Specialized stores (complements, not substitutes)

These components **do not replace** the main vector index; they solve adjacent layers in mature RAG/agentic architectures.

### Feature stores (Feast)

**What it does:** Register and serve **ML features** (online/offline), consistency between training and inference.

**When to use:** RAG personalized by user with features (segment, risk, history) injected in filters or reranking; MLOps already uses Feast.

**When NOT to use:** Static document RAG — it is overhead.

**Achilles heel:** does not store corpus chunks or embeddings by default — frequent confusion.

### Semantic cache (GPTCache, Redis)

**What it does:** Caches responses (or query embeddings) by **semantic similarity** of the question, not just exact hash.

**When to use:** Nearly identical repeated questions in wording; reduce LLM + embedding cost in production.

**When NOT to use:** Critical data freshness (policies changing hourly); compliance requiring always-fresh retrieval.

**Achilles heel:** incorrect cache hit if similarity threshold poorly calibrated — risk of stale answers.

### Object storage (S3, MinIO, GCS, Azure Blob)

**What it does:** **Raw documents** (PDF, HTML, audio) and ingestion artifacts; not ANN.

**When to use:** Immutable source of truth; [`io.batch`](../referencia/catalogo-nodos.md#iobatch) reading buckets; corpus versioning.

**When NOT to use:** Direct vector search on S3 without indexing — classic anti-pattern.

**Pattern:** S3 (raw) → ingestion pipeline → vector store (chunks) + metadata pointer `s3://key`.

### Where metadata lives

| Metadata type | Where it usually lives | Notes |
|---------------|------------------------|-------|
| Retrieval filters (`department`, `jurisdiction`) | Vector payload / indexed SQL column | Must be in same engine as ANN or synchronized |
| Ingestion lineage (hash, doc version) | Postgres or object metadata | Audit |
| ACL per tenant | SQL, Elastic security, Qdrant payload | Multi-tenant: filter **before** top-k |
| Agent conversation state | Postgres, Redis, LangGraph checkpointer | Do not confuse with vector store |
| Evaluation traces | Langfuse, LangSmith, OTel | Observability — §12 tecnologias-comparadas |

[`store.multi-index`](./catalogo-nodos.md#storemulti-index) groups **several vector indexes** under names (`policy`, `faq`) — routing metadata lives in [`retrieval.router`](./catalogo-nodos.md#retrievalrouter) rules, not a feature store substitute.

---

## 7. When do you NOT need a vector DB?

Not every RAG architecture requires Qdrant, Pinecone, or pgvector with HNSW. Sometimes adding a service is **debt**, not solution.

### In-memory (NumPy, dict, FAISS flat)

**When it suffices:** < 10k–50k chunks; demo; tests; offline batch. FAISS `IndexFlatIP` or vector list in NumPy — 100% recall, zero ops.

**When NOT:** Concurrent web service; durable persistence without design; insufficient RAM.

### Grep / pure BM25

**When it suffices:** Logs, code, IDs, part numbers, SKUs; users write exact terms. `ripgrep`, Whoosh, rank-bm25 in Python.

**When NOT:** Free paraphrasing, synonyms, natural language questions — embeddings (M3) or hybrid (M4) apply.

### Long context (long-context LLM)

**When it suffices:** Corpus fits in window (e.g. 128k–1M tokens) and is queried whole few times; ad hoc analysis of a single contract.

**When NOT:** Thousands of updatable documents; prohibitive cost per token; need granular chunk citations — RAG still wins.

### Small stable data

**When it suffices:** 20 internal policy PDFs, quarterly update — embedded Chroma or even JSON + embedding in SQLite.

**Red flag:** hiring Pinecone before measuring latency of a local flat index.

### Quick "skip vector DB" table

| Condition | Alternative |
|-----------|-------------|
| < 100k vectors, single process | FAISS flat / local Chroma |
| Exact terms only | BM25 / grep |
| One large document per session | Long context + caching |
| 1-week prototype | embedded [`store.chroma`](./catalogo-nodos.md#storechroma) |

---

## 8. Master decision table

### By scenario

| Scenario | Primary bias | Valid alternative | Avoid |
|----------|--------------|-------------------|-------|
| **Prototype / course / HR** | [`store.chroma`](./catalogo-nodos.md#storechroma) | LanceDB, sqlite-vec | Pinecone/Milvus day 1 |
| **Already have Postgres, SQL filters** | [`store.pgvector`](./catalogo-nodos.md#storepgvector) | pgvecto.rs | Second DB without reason |
| **Production ANN, payload filters, Rust** | [`store.qdrant`](./catalogo-nodos.md#storeqdrant) | Weaviate, Milvus | FAISS alone with complex filters |
| **Zero ops cloud** | Pinecone, Turbopuffer, Qdrant Cloud | Chroma Cloud | Self-host Vald without SRE |
| **Native BM25+vector hybrid** | OpenSearch, Elastic, Vespa | Weaviate, Redis Stack | Pure vector + fragile manual sync |
| **E-commerce catalog search UX** | Typesense, Meilisearch | Elastic | pgvector alone |
| **Docs already in MongoDB Atlas** | Atlas Vector Search | + external reranker | Duplicate in Pinecone without sync |
| **Multi-region NoSQL** | Cosmos, Astra Vector | — | Neo4j as sole doc store |
| **GraphRAG / relationships** | [`store.neo4j`](./catalogo-nodos.md#storeneo4j) | Memgraph, ArangoDB | Vector alone in legal/compliance |
| **Several isolated corpora** | [`store.multi-index`](./catalogo-nodos.md#storemulti-index) + [`retrieval.router`](./catalogo-nodos.md#retrievalrouter) | Separate collections per tenant | One giant index without metadata |
| **Telemetry + session embeddings** | ClickHouse, Redis | — | Postgres OLTP |
| **Batch 100M+ offline** | FAISS IVF/PQ, Milvus, Vald | — | Embedded Chroma |
| **Edge / offline single file** | sqlite-vec, DuckDB VSS | LanceDB | Elastic cluster |

### By volume (practical rules, not laws)

| Vectors (order of magnitude) | Typical approach |
|------------------------------|------------------|
| < 100k | Flat / embedded / SQLite |
| 100k – 5M | HNSW (pgvector, Qdrant, OpenSearch) |
| 5M – 100M | Dedicated vector DB or benchmarked pgvector |
| 100M+ | Milvus, Vald, Vespa, FAISS+PQ batch; ops team |

Adjust by embedding dimension, QPS, and selective filters — [M3 §6](../03-embeddings-y-stores/guia.md#6-index-types-flat-ivf-hnsw).

### Multi-tenant

- **Mandatory filter** on every query (`tenant_id`) — same index with payload vs index per tenant.
- SaaS: Pinecone namespaces, Qdrant collections, Elastic index-per-tenant by isolation level.
- **Anti-pattern:** mixing client data without filter in ANN — context leak between tenants.

### On-prem vs SaaS

| On-prem / self-host | SaaS managed |
|---------------------|--------------|
| pgvector, Qdrant, Milvus, OpenSearch, Neo4j | Pinecone, Turbopuffer, Atlas, Cosmos, Qdrant Cloud |
| Regulated data, air-gap | Time-to-market, minimal ops |
| You pay GPU/CPU/RAM | Pay by dimension + QPS + storage |

### Anti-patterns (summary)

1. **Vector DB before measuring** — start simple ([§7](#7-when-you-do-not-need-a-vector-db)).
2. **Two sources of truth** — chunks in Pinecone and metadata in Postgres without transactional sync.
3. **FAISS + complex SQL filters DIY** — you reimplement Qdrant badly.
4. **Graph by trend** — Neo4j without reliable entity extraction.
5. **Ignore hybrid** in domains with exact codes — see [M4](../04-retrieval-y-query/guia.md).
6. **Change embedding without re-indexing** — M3 rule.
7. **Use object storage as retrieval "database"** — S3 is not ANN.
8. **Milvus/Vespa for 100k docs** — ops >> benefit.

---

## Minimal illustrative snippets

Only to fix ideas — do not replace each product's guide.

**pgvector: SQL filter + vector in one query**

```sql
SELECT content, metadata
FROM document_chunks
WHERE tenant_id = 'acme'
  AND jurisdiction = 'EU'
ORDER BY embedding <=> :query_embedding
LIMIT 5;
```

**Avoided dual-write pattern: object pointer + indexed chunk**

```python
metadata = {
    "source_uri": "s3://corpus/policies/2025-vacaciones.pdf",
    "page": 12,
    "tenant_id": "acme",
}
# El vector vive en el store; el PDF crudo solo en S3.
```

**When semantic cache (GPTCache concept)**

```python
# Si similitud(query_nueva, query_cacheada) > umbral → devolver respuesta cacheada
# Cuidado: políticas que cambian invalidan entradas por versión de corpus
```

---

> **Cross-links**
>
> - Comparison of the course's 7 stores: [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores)
> - ANN indexes (flat, IVF, HNSW): [M3 — Embeddings and stores §6](../03-embeddings-y-stores/guia.md#6-index-types-flat-ivf-hnsw)
> - Hybrid, rerank, GraphRAG: [M4 — Retrieval and query](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid) · [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph)
> - RAGorbit store nodes: [`store.chroma`](./catalogo-nodos.md#storechroma) · [`store.pgvector`](./catalogo-nodos.md#storepgvector) · [`store.qdrant`](./catalogo-nodos.md#storeqdrant) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index)
> - Pedagogical node sheets (style model): [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Course plan: [`PLAN.md`](../PLAN.md)

---

*RAGorbit reference document. Product data and pricing: verify in official documentation as of 2025/2026. Vendor-neutral by design — no family wins in all scenarios.*

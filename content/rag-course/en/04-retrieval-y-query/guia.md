# M4 · Advanced retrieval and query operations

> **Module 4 of the RAG & Agentic AI course — RAGorbit**
> Nodes covered: `retrieval.*`, `query.*`, `store.neo4j`, `store.multi-index`
> Anchor templates: 05-legal, 07-telecom, 08-manufacturing, 03-healthcare
> Week 4 · ~32 h (reading + exercises + workshop)

---

## Table of contents

1. [The problem of retrieving the right content](#1-the-problem-of-retrieving-the-right-content)
2. [Dense (vector) search](#2-dense-vector-search)
3. [Keyword search: BM25](#3-keyword-search-bm25)
4. [Hybrid search](#4-hybrid-search)
5. [Reranking with cross-encoder](#5-reranking-with-cross-encoder)
6. [Parent-child retrieval](#6-parent-child-retrieval)
7. [Hard filters as a safety guardrail](#7-hard-filters-as-a-safety-guardrail)
8. [Multi-index routing](#8-multi-index-routing)
9. [Query rewriting and intent detection](#9-query-rewriting-and-intent-detection)
10. [GraphRAG and knowledge graphs (Neo4j)](#10-graphrag-and-knowledge-graphs-neo4j)
11. [Technology comparison](#11-technology-comparison)
12. [RAGorbit nodes](#12-ragorbit-nodes)
13. [Layer ③ explained: LangChain retrievers from scratch](#13-layer--explained-langchain-retrievers-from-scratch)
14. [Checkpoint](#14-checkpoint)

---

## 1. The problem of retrieving the right content

RAG has a dependency chain: if retrieval fails, the LLM cannot generate a correct answer even if it is the best model in the world. You can have the most accurate embedding model and the most expensive LLM, but if the retrieved chunks are irrelevant or belong to the wrong domain, the answer will be wrong—or worse, plausibly wrong.

Retrieval fails in three dimensions:

```
SEMANTIC FAILURE     — the user writes "baja de plan"
                        the embedding does not associate it with "cancelación de servicio"
                        → BM25 or query rewriting fixes it

DOMAIN FAILURE       — the A320 technician gets a torque limit from the 787
                        because the embedding is similar
                        → hard filters fix it

RANKING FAILURE      — the top-5 has relevant fragments but in positions 4 and 5
                        the LLM uses the first two (noisier)
                        → reranking fixes it
```

This module covers the tools to address each type of failure.

---

## 2. Dense (vector) search

### What it is

Dense search converts the query and each document into high-dimensional dense vectors (e.g. 1536 dimensions with text-embedding-3-large) and measures cosine similarity or dot product. It was covered in depth in M3. Here we recall it as a comparison point.

```
Query: "procedimiento inspección tren de aterrizaje"
          ↓ embedding model
     [0.23, -0.11, 0.87, ...]  ← 1536-dim vector

Corpus:
  doc_A: [0.21, -0.09, 0.85, ...]  sim=0.97 ← highly relevant
  doc_B: [0.70,  0.45, 0.10, ...]  sim=0.31 ← barely relevant
  doc_C: [0.22, -0.10, 0.86, ...]  sim=0.95 ← highly relevant
```

### When it works well

- The query and documents are in the same semantic domain.
- Vocabulary is not highly specialized or jargon unseen during embedding model training.
- Chunks are moderate size (200–1000 tokens).

### When it fails

- Highly specific technical jargon: "ATA 32-11-00" or "RRF" do not have good representations in general-purpose embeddings.
- Short, exact queries: "GDPR artículo 17" retrieves better with keywords than with vectors.
- Internal company terms: the corporate glossary is not in the training data.

### RAGorbit node

`retrieval.vector` — `topK: 4` by default. Accepts `hardFilters[]` (see §7).

---

## 3. Keyword search: BM25

### What it is and where it comes from

BM25 (Best Match 25) is the probabilistic ranking function Elasticsearch uses internally and that was the state of the art in information retrieval for decades before embeddings took off. Its name comes from a series of experiments in the 1970s–90s (Okapi BM11, BM15… up to BM25).

### The BM25 formula

For a query `q` with terms `q_1 ... q_n` and a document `d`:

```
         n     IDF(q_i) · f(q_i, d) · (k1 + 1)
BM25 = Σ  ────────────────────────────────────────
        i=1  f(q_i, d) + k1 · (1 - b + b · |d|/avgdl)
```

Where:

| Symbol | Meaning |
|---------|-------------|
| `f(q_i, d)` | Term frequency of `q_i` in document `d` (term frequency) |
| `IDF(q_i)` | Inverse Document Frequency: `log((N - n_i + 0.5) / (n_i + 0.5) + 1)` |
| `N` | Total documents in the corpus |
| `n_i` | Number of documents containing `q_i` |
| `|d|` | Document length in tokens |
| `avgdl` | Average document length |
| `k1` | TF saturation parameter (typical: 1.2–2.0) |
| `b` | Length normalization parameter (typical: 0.75) |

### Formula intuition

**IDF:** A term that appears in few documents is highly discriminative. "Tren de aterrizaje" appears in few corpus documents → high IDF → that term weighs heavily. "El" appears in all → IDF ≈ 0 → that term does not discriminate.

**TF with saturation (k1):** Relevance does not grow linearly with frequency. If "mantenimiento" appears 1 time vs 2 times, there is a difference. If it appears 50 vs 51 times, the difference is almost nil. Parameter `k1` controls that saturation.

**Length normalization (b):** A 1000-word document will naturally have more repetitions of any term than a 100-word one. Parameter `b` penalizes long documents so they do not dominate ranking simply by being long. With `b=0.75`, partial normalization is applied (not total).

### Why BM25 complements embeddings

```
Query: "ATA 32-11-00"
  BM25: ← retrieves exact "ATA 32-11-00", high score
  Vector: ← "landing gear chapter 32" may be semantically closer
           but exact string "ATA 32-11-00" has better BM25

Query: "procedimiento para revisar sistemas hidráulicos antes de vuelo"
  BM25: ← may fail if the doc says "inspección pre-vuelo de actuadores"
  Vector: ← captures semantics even when words differ
```

Embedding models capture semantic intent but lose exact matches of technical terms. BM25 does the opposite. The combination is more robust than either alone.

### RAGorbit node: `retrieval.hybrid`

Internally combines a vector retriever and a BM25 retriever with parameter `alpha` controlling relative weight.

---

## 4. Hybrid search

### Fusion strategy: Reciprocal Rank Fusion (RRF)

RRF is the most common fusion method for combining result lists from different retrievers. The idea: instead of combining scores directly (which have different scales), use each document's rank in each list.

```
          1
RRF(d) = Σ ────────────
        r∈R  k + r(d)
```

Where `r(d)` is document `d`'s position in retriever `r`'s list, and `k` is a smoothing constant (typical: 60).

**Concrete example:**

```
BM25 returns:   doc_A (rank 1), doc_C (rank 2), doc_B (rank 3)
Vector returns: doc_C (rank 1), doc_A (rank 2), doc_D (rank 3)

RRF(doc_A) = 1/(60+1) + 1/(60+2) = 0.01639 + 0.01613 = 0.03252
RRF(doc_C) = 1/(60+2) + 1/(60+1) = 0.01613 + 0.01639 = 0.03252
RRF(doc_B) = 1/(60+3) + 0         = 0.01587
RRF(doc_D) = 0         + 1/(60+3) = 0.01587

Fused result: doc_A, doc_C (tie), doc_B, doc_D
```

### Weighted sum of normalized scores

Alternative to RRF when scores are on the same scale:

```
score_final(d) = alpha * score_vector(d) + (1 - alpha) * score_bm25(d)
```

With `alpha=0.5` both get equal weight. Tune `alpha` by domain.

### When to use hybrid

| Situation | Recommended alpha |
|-----------|-------------------|
| Technical domain with many exact identifiers | 0.3 (more BM25) |
| Conversational / natural language domain | 0.7 (more vector) |
| Unknown a priori | 0.5 (starting point) |
| With user feedback | tune with A/B testing |

### Template 07 (Telecom)

The call center copilot uses `retrieval.hybrid` because agents mix technical jargon ("roaming internacional EE.UU.") with natural language ("¿qué le digo al cliente?"). BM25 captures exact glossary terms; the vector captures question intent.

### Template 08 (Manufacturing)

AMM manuals have exact identifiers (ATA, section numbers, part numbers). BM25 is very precise for "Task 32-11-00-581-001". The vector captures "procedimiento inspección tren morro" even when the document says "nose landing gear inspection procedure".

---

## 5. Reranking with cross-encoder

### The problem it solves

Retrievers (both vector and BM25) encode the query and each document **separately** and then compute similarity. This is efficient but imprecise: the model does not see the query and document together when producing the representation.

A **cross-encoder** (reranker) is a model that receives the query **and** the document **together** as input and produces a relevance score. It is much more accurate but also slower—which is why it is used only on the retrievers' top-K, not the full corpus.

```
TWO-STAGE PIPELINE (retrieve + rerank)

Step 1 — Fast retrieve (high recall)
  BM25 + Vector → top-20 candidates
  [fast, scales to millions of docs, but imprecise]

Step 2 — Precise rerank (high precision)
  Cross-encoder scores query ↔ each candidate together
  → keeps top-3 most relevant
  [slow, only applies to 20 candidates, very precise]
```

### Why it improves precision

The bi-encoder (separate vectors) compresses the query into a vector without knowing which documents it will compare against. The cross-encoder, seeing both together, can capture subtle interactions:

```
Query: "límite de torque del actuador del tren de morro"

doc_A: "El torque máximo del actuador del tren principal es 45 Nm"  ← mentions torque but of the MAIN gear
doc_B: "Para el tren de morro, el torque del actuador es 32 Nm"    ← exactly what is being searched

Bi-encoder: doc_A may score similarly to doc_B (both talk about torque and gear)
Cross-encoder: doc_B scores much higher (nose gear + actuator + torque together)
```

### Latency trade-off

| Component | Typical latency | Why |
|------------|----------------|---------|
| Vector retrieval (HNSW, top-20) | 10-50 ms | approximate in-memory index |
| BM25 (top-20) | 5-20 ms | inverted index in memory |
| BGE reranker over 20 docs | 50-150 ms | model forward pass per pair |
| Cohere API reranker over 20 docs | 100-300 ms | network call + large model |

The reranker adds ~100-200 ms to the pipeline, but the relevance improvement is usually worth it in domains where precision is critical (legal, healthcare, aviation).

### Available reranker models

| Model | Type | Advantage | When to use |
|--------|------|---------|-------------|
| `bge-reranker-v2-m3` (BAAI) | Local cross-encoder | Free, no API, fast | Production without external dependencies |
| `rerank-english-v3.0` (Cohere) | Cloud API | High quality, very easy to integrate | Rapid prototyping, English |
| `ColBERT` | Late interaction | Latency/quality balance, allows pre-compute | Millions of docs |
| `FlashRank` | Very lightweight cross-encoder | Ultra fast, for edge/mobile | Latency < 50 ms critical |

### Template 05 (Legal) and 07 (Telecom)

Both use `retrieval.reranker` with `topN: 3`. In legal, the reranker distinguishes a playbook fragment on "indemnización" in software contracts from the fragment on "indemnización" in infrastructure contracts—semantically similar but legally relevant in different ways. In telecom, it adjusts ranking based on agent feedback (`feedbackRef`).

### RAGorbit node: `retrieval.reranker`

```json
{
  "type": "retrieval.reranker",
  "config": {
    "model": "bge-reranker",
    "topN": 3,
    "feedbackRef": "feedback_store"   // optional: improves with usage signals
  }
}
```

---

## 6. Parent-child retrieval

### The chunk size dilemma

Small chunks (100-200 tokens): more precise for retrieving the exact fragment, but lose context (a sentence without its paragraph).

Large chunks (800-1200 tokens): have more context, but the vector representation averages the meaning of the whole chunk and can dilute the relevant signal.

**Parent-child** resolves this dilemma with a two-level strategy:

```
PARENT LEVEL (large chunks, 800+ tokens)
  Complete section 32-11-00 (900-token procedure)
  Complete section 32-11-01 (850-token procedure variant)

CHILD LEVEL (small chunks, 100-200 tokens)
  Step 1: Coloca la aeronave en jack...       (child of 32-11-00)
  Step 2: Verifica el juego lateral...        (child of 32-11-00)
  Step 3: Inspecciona visualmente...          (child of 32-11-00)
  Step 4: Registra los resultados...          (child of 32-11-00)

RETRIEVAL:
  1. CHILDREN are indexed and retrieved (high precision)
  2. PARENTS are returned to the LLM (full context)
```

### When to use parent-child

- Documents with clear hierarchical structure: technical manuals, contracts, clinical guidelines.
- When index chunks are semantically dense but you need expanded context for the LLM to answer well.
- Template 08: each AMM procedure step is a child; the full ATA section is the parent.

### When it is not worth it

- Corpus of independent fragments (tweets, individual FAQs, blog posts).
- Chunks already moderate (400-600 tokens) where context is sufficient.
- When the extra latency of fetching the parent (second lookup) is not acceptable.

### RAGorbit node: `retrieval.parent-child`

```json
{
  "type": "retrieval.parent-child",
  "config": {
    "parentField": "parent_id"
  }
}
```

`parent_id` is set in `ingest.metadata` at indexing time, linking each child chunk to its parent document.

---

## 7. Hard filters as a safety guardrail

### The difference between soft filter and hard filter

A **soft filter** (or soft hint) instructs the LLM to "prefer" documents of a certain type. Example: "Answer only using information from the PPO-Gold plan". The problem: the LLM can ignore it, "forget" it in long prompts, or reason that another document is "relevant enough".

A **hard filter** is applied at the retrieval layer, **before** any document reaches the LLM. It is a `WHERE` clause in SQL, a metadata filter in the vector store. The LLM simply never sees documents that fail the filter.

```
WITHOUT HARD FILTER:
  Query: "criterios de RM de rodilla"
  Vector store returns: chunks from PPO-Gold, PPO-Basic, PPO-Platinum mixed
  LLM may use PPO-Platinum criteria for a PPO-Basic patient → CLINICAL ERROR

WITH HARD FILTER (hardFilter: plan = "PPO-Basic"):
  Query: "criterios de RM de rodilla"
  Vector store applies WHERE plan = 'PPO-Basic' before search
  Only PPO-Basic chunks reach the LLM → correct by design
```

### Why it is a guardrail, not just a filter

In high-consequence domains, the hard filter acts as a structural safety guardrail:

**Healthcare (03-healthcare):** A patient on PPO-Basic cannot receive PPO-Platinum criteria (more permissive). An incorrect "approved" is a legal and clinical problem.

**Aviation (08-manufacturing):** An A320 technician cannot receive 787 torque limits. Aircraft confusion is an FAA/EASA finding.

**Civil aviation (01-airline):** An Economy passenger cannot see Business policies in the LLM context, because they might receive upgrades or benefits they did not purchase.

In all these cases, the prompt instruction "use only the correct plan/aircraft data" is not enough. The hard filter is deterministic and inviolable.

### Implementation in the `retrieval.vector` node

```json
{
  "type": "retrieval.vector",
  "config": {
    "topK": 5,
    "hardFilters": ["aircraft_type", "ata_chapter"]
  }
}
```

In production, the node converts this into a filtered query:

```python
# Pseudocode for the node generated by RAGorbit
results = pgvector_store.similarity_search(
    query_embedding,
    k=5,
    filter={
        "aircraft_type": {"$eq": session.aircraft_type},
        "ata_chapter": {"$eq": session.ata_chapter}
    }
)
```

Filter values come from session context, not the LLM.

### Hard filter as a cross-cutting design pattern

This pattern appears in M3, M4, M5, and M9. In RAGorbit, `hardFilters[]` is available in `retrieval.vector` and `retrieval.hybrid`. Filterable fields are those tagged in `ingest.metadata`. The rule is: **any dimension that determines which information is permissible for a specific user must be a hard filter, not a prompt instruction**.

---

## 8. Multi-index routing

### Why not a single index

The "simple" solution is to index everything in one vector store and search there. The problems:

1. **Cross-domain noise:** a query about "indemnización" in the context of a software contract may retrieve indemnification fragments from construction contracts—semantically similar but legally irrelevant.

2. **Latency:** searching an index of 1 million documents is slower than three indexes of 100k each.

3. **Version control:** updating the legal playbook should not affect the regulatory index.

### Multi-index routing: architecture

```
INDEXES:
  policy     ← regulations, fares, legal terms
  procedure  ← step-by-step internal procedures
  faq        ← frequently asked questions

ROUTER RULES:
  keyword "facturacion"   → index: policy
  keyword "procedimiento" → index: procedure
  keyword "cómo puedo"    → index: faq
  fallback                → index: faq

QUERY: "¿Cuánto me cobran por superar mi límite de datos?"
  Router detects "cobran" → billing keyword → route to policy
  Only searches policy → 0 noise from procedure or faq
  Latency: 30ms (1 index) vs 90ms (3 indexes in parallel)
```

### Two routing strategies

**1. Keyword matching (deterministic)**

```python
for rule in rules:
    if rule.keyword in query.lower():
        return rule.index
return fallback
```

Advantages: microseconds, predictable, debuggable.
Disadvantages: requires manual maintenance of the keyword glossary.

**2. Intent-based routing (lightweight ML)**

Uses the `model.intent` classifier (lightweight embeddings, ~5-10ms) to detect query intent and route by label:

```
intent("¿cuánto me cobran?") → "facturacion" → policy
intent("cómo configuro el router?") → "soporte_tecnico" → procedure
```

Advantages: captures semantic variants ("¿cuánto es la tarifa?" → facturacion even without "cobran").
Disadvantages: requires training, can fail on ambiguous queries.

### RAGorbit nodes

```
store.multi-index   → groups several named Retrievers
retrieval.router    → selects the correct index by rules[] or intent
```

### Template 05 (Legal): three indexes, keyword routing

```
indexes: [playbook, regulations, precedent]
rules:
  "indemniz"   → playbook
  "regulacion" → regulations
  "precedente" → precedent
  fallback:      playbook
```

### Template 07 (Telecom): three indexes, intent routing

```
indexes: [policy, procedure, faq]
rules:
  facturacion     → policy
  soporte_tecnico → procedure
  fallback:         faq
```

---

## 9. Query rewriting and intent detection

### Query rewriting

The rewriter normalizes the user's query before sending it to the retriever. Its two main functions:

**1. Internal jargon normalization**

```
"baja de plan" → "cancelación de servicio"
"roaming gringo" → "roaming internacional EE.UU."
"batería de la laptop" → "bateria litio portatil equipaje cabina"
```

This is a mapping from internal/colloquial terms to canonical terms that appear in indexed documentation. Without this step, BM25 fails (no term match) and the vector may fail (the colloquial term's embedding differs from the technical one).

**2. Query expansion**

Adds related terms to improve BM25 recall:

```
Original query: "RM rodilla"
Expanded query: "resonancia magnética rodilla menisco cartílago articulación"
```

This is especially useful in medical or legal domains where users submit short queries and documents use full terminology.

### Intent detection as the RAG gate

Intent detection is not only for routing: its first function is to be the **gate** that decides whether the query deserves activating the RAG pipeline at all.

```
CALL CENTER AUDIO FRAGMENTS:
  "Oiga, y si viajo a Cancún..."   → intent: facturacion (score 0.71) → RAG
  "Sí, claro, aja... un momento"   → intent: no_accionable (score 0.82) → DISCARD
  "¿Cuánto cuesta el plan familiar?" → intent: facturacion (score 0.88) → RAG
```

Without this gate, 30-50% of audio fragments activate RAG unnecessarily, generating noise on the agent panel and consuming resources.

### RAGorbit nodes

```
query.rewrite   → normalizes jargon, expands terms
query.intent    → detects intent, filters non-actionable, routes
model.intent    → lightweight classifier (embeddings or small-LLM)
```

The difference between `query.intent` and `model.intent` in RAGorbit is that `query.intent` is oriented to the RAG gate (produces `Decision` and `Query`), while `model.intent` is the underlying classification model usable in more general contexts.

### Full query ops pipeline (Template 07)

```
Audio → STT → model.intent → [if no_accionable: discard]
                            → [if actionable: query.rewrite → retrieval.router → ...]
```

This pipeline removes noise before the first vector store call, with latency of only ~15 ms (intent: 10ms + rewrite: 5ms).

---

## 10. GraphRAG and knowledge graphs (Neo4j)

### When vectors are not enough

Embeddings capture text semantics but not structural relationships. Consider:

```
"¿Qué procedimientos están afectados por la Directiva de Aeronavegabilidad AD-2024-0023?"

With vectors:
  The query becomes a vector
  Similar chunks are searched → may find some procedures
  But CANNOT navigate: AD-2024-0023 → afecta a → SB-2023-32-001 → requiere → Task 32-11-001

With knowledge graph:
  AD-2024-0023 is a node
  It has typed relations: AFECTA_A → [SB-2023-32-001, SB-2023-32-002]
  Each SB has: REQUIERE → [Task 32-11-001, Task 32-11-002]
  A neighborhood query returns the whole subgraph in 1-2 hops
```

### Knowledge graph fundamentals

**Node:** A domain entity. In an AMM: a procedure, an airworthiness directive, a part, a certified technician.

**Relation (typed edge):** A connection with semantics. Not just "A is related to B", but "AFECTA_A", "REQUIERE", "REEMPLAZA_A", "ES_PREREQUISITO_DE".

**Neighborhood:** The set of nodes and relations 1 or more hops from a given node. "Neighborhood" retrieval is what distinguishes GraphRAG from vector RAG.

```
GRAPH (partial view — AMM domain):

[AD-2024-0023] --AFECTA_A--> [SB-2023-32-001]
                               |
                           REQUIERE
                               |
                          [Task 32-11-001] --ES_PARTE_DE--> [Seccion 32-11-00]
                               |
                           PREREQUISITO
                               |
                          [Task 07-11-001]  (jack de mantenimiento)

QUERY: "qué tareas requiere AD-2024-0023?"
GRAPH TRAVERSAL: AD-2024-0023 → AFECTA_A → SBs → REQUIERE → Tasks
RESULT: [Task 32-11-001, Task 07-11-001 (transitive)]
```

### Neo4j and the `store.neo4j` node

Neo4j is the most widely used graph database in production. Its two main advantages:
1. **Cypher:** declarative graph query language, very readable.
2. **Embeddings on nodes:** Neo4j supports storing embeddings on nodes and doing vector search on them, combining vector search and graph traversal.

```cypher
-- Cypher: find all documents related to a directive
MATCH (ad:Directive {id: "AD-2024-0023"})-[:AFECTA_A*1..2]->(doc:Document)
RETURN doc.text, doc.section, doc.revision
```

The `store.neo4j` node in RAGorbit:
- Creates `Chunk` nodes with their text, metadata, and embedding.
- Creates typed relations between chunks according to document structure (`entitySchema`).
- With `buildRelations: true`, the node infers relations automatically (section parent-child, entity co-occurrence).
- `retrieval.graph` retrieves by vector similarity on nodes AND by neighborhood traversal.

### Hybrid graph + vector retrieval

The GraphRAG flow combines both capabilities:

```
1. Vector search on graph nodes
   → finds the 3 nodes most similar to the query

2. Graph traversal from those nodes
   → expands 1-2 hops following typed relations
   → collects the context subgraph

3. Returns: vector search nodes + neighborhood
```

This is especially powerful when the answer to a question is not in a single chunk but in the structure of relations between multiple chunks.

### When to use graphs vs vectors

| Situation | Use |
|-----------|------|
| Corpus with explicit, complex relations between entities | Graph |
| "What affects what?", "What requires what?" questions | Graph |
| Text- and semantics-based retrieval | Vector |
| Corpus without clear relation structure | Vector |
| When graph maintenance is too costly | Vector |
| When extra precision is worth Neo4j overhead | Graph |

### Microsoft GraphRAG

Microsoft Research published a framework called GraphRAG in 2024 that takes the concept further: it uses an LLM to extract entities and relations from the corpus (building the graph automatically), then uses the graph to answer global-level questions ("what are the main themes of the corpus?") that vector RAG cannot answer well.

The key difference from RAGorbit's `store.neo4j` is that Microsoft GraphRAG uses "communities" (clustering of related entities) to answer holistic questions. RAGorbit uses the graph mainly for neighborhood traversal on specific queries.

---

## 11. Technology comparison

### Retrievers

| Method | Precision | Recall | Latency | When |
|--------|-----------|--------|----------|--------|
| Pure BM25 | High (exact) | Low (limited semantics) | Very low | Exact IDs, technical terms |
| Pure vector | Medium-high | High | Low | Natural language, semantics |
| **Hybrid** | **High** | **High** | Medium | **General case** |
| GraphRAG | Very high (structure) | Medium | High | Complex relations |

### Rerankers

| Model | Quality | Latency | Cost | When |
|--------|---------|----------|-------|--------|
| BGE-reranker-v2 | Very high | 50-150ms local | Free | Production without cloud |
| Cohere Rerank v3 | Very high | 100-300ms API | Pay per use | Prototyping, English |
| ColBERT | High | 20-80ms | Free | Large scale |
| FlashRank | Medium-high | 5-20ms | Free | Edge, critical latency |

### Fusion strategies

| Method | When to prefer |
|--------|-----------------|
| RRF (Reciprocal Rank Fusion) | Scores from different scales (BM25 and cosine) |
| Normalized weighted sum | Scores on same scale, fine alpha control |
| Cross-encoder (reranker) | Maximum precision, tolerable latency |

### Frameworks: LangChain vs LlamaIndex for retrieval

| Aspect | LangChain | LlamaIndex |
|---------|-----------|------------|
| Built-in retrievers | EnsembleRetriever, BM25Retriever, ContextualCompressionRetriever | SparseTopKRetriever, HybridFusion, RankGPT |
| Rerankers | ContextualCompressionRetriever + Cohere/BGE | CohereRerank, SentenceTransformerRerank, RankLLM |
| Graph RAG | Neo4j Graph RAG Toolkit integration | NebulaGraphStore, Neo4jGraphStore |
| Multi-index | MultiVectorRetriever, MergerRetriever | RouterRetriever, MultiIndexRetriever |
| When to prefer | When the rest of the stack already uses LangChain/LCEL | When the focus is advanced retrieval with many strategies |

---

## 12. RAGorbit nodes

### `retrieval` category

| Node | Description | When |
|------|-------------|--------|
| `retrieval.vector` | Similarity search with optional hard filters | Base case, semantic domain |
| `retrieval.hybrid` | Vector + BM25 fused (parameter `alpha`) | Domain with technical jargon + natural language |
| `retrieval.graph` | Similarity retrieval + neighborhood traversal (Neo4j) | Complex relations between entities |
| `retrieval.router` | Selects index by keyword/intent | Multi-index, reduce noise and latency |
| `retrieval.parent-child` | Retrieves children for precision, returns parents for context | Long hierarchical documents |
| `retrieval.reranker` | Reorders and trims with cross-encoder | Always after retrieve in critical domains |

### `query` category

| Node | Description | When |
|------|-------------|--------|
| `query.rewrite` | Normalizes jargon, expands terms | Domain with corporate/technical vocabulary |
| `query.intent` | Detects intent, filters non-actionable, routes | RAG gate, reduce unnecessary calls |

### Recommended production pipeline

```
User
  ↓ Message
query.intent     ← gate: is it actionable?
  ↓ Query (if actionable)
query.rewrite    ← normalizes jargon, expands
  ↓ Query
retrieval.router ← selects correct index
  ↓ Chunks (noisy top-K)
retrieval.reranker ← reorders, keeps top-3
  ↓ Chunks (precise)
logic.prompt + logic.citations
  ↓ Message (with citations)
io.output
```

---

## 13. Layer ③ explained: LangChain retrievers from scratch

> **Prerequisite:** complete layer ② of the workshop (`lab/solucion_scratch.py`) — BM25, cosine, RRF, rerank, and hard filter implemented by hand. Without that, this section will seem like magic.
>
> **LangChain reminder (not re-explained here):** In M1, [§11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch), you learned what LangChain is, the `Document` object, `HuggingFaceEmbeddings` / `OpenAIEmbeddings`, `Chroma.from_documents`, the **`Retriever`** abstraction (`as_retriever`, `.invoke`), and the LCEL pattern. **This section teaches only what's new in M4:** specialized retrievers for hybrid search, fusion, reranking, and hard filtering.
>
> **Environment:** the course study machine has no `pip` or network. You will not run this code here. The goal is that, with `pip install langchain langchain-community rank-bm25 sentence-transformers chromadb`, you can **write** `lab/solucion_framework.py` yourself.

### 13.1 The problem this layer solves

In `solucion_scratch.py` you wrote ~300 lines for: tokenize, compute BM25, embed with bag-of-words, fuse with RRF, rerank by token intersection, and filter by `fare_class`. It works and is deterministic. But in production you need:

- Optimized BM25 (not a Python loop over 50k docs).
- Real semantic embeddings (not bag-of-words).
- Hybrid fusion without reimplementing RRF.
- A real cross-encoder (BGE-reranker), not token intersection.
- Everything wired with the **same interface** so you can swap pieces.

LangChain gives you composable retrievers: each implements the same interface and you chain them like LEGO blocks.

```
SCRATCH (M4 lab)                         LANGCHAIN (M4 lab)
────────────────────                     ────────────────────────────────────
tokenizar() + BM25 manual      ────────▶  BM25Retriever.from_documents(docs)
embed BoW + coseno manual      ────────▶  Chroma + HuggingFaceEmbeddings + as_retriever
rrf_fusion() manual            ────────▶  EnsembleRetriever(retrievers=[...], weights=[...])
rerank por intersección        ────────▶  CrossEncoderReranker + ContextualCompressionRetriever
filtrar lista Python           ────────▶  crear_retriever_filtrado() o filter en Chroma
```

### 13.2 Bridge table: scratch → LangChain (M4)

| What you did by hand (layer ②) | LangChain piece (layer ③) | Concept section |
|-------------------------------|--------------------------|---------------------|
| `bm25_score()` + ranking over corpus | `BM25Retriever.from_documents(docs)` + `.k` attribute | [§3 BM25](#3-keyword-search-bm25) |
| `embed_bow()` + `similitud_coseno()` | `HuggingFaceEmbeddings` + `Chroma.from_documents` + `as_retriever(search_kwargs={"k":...})` | [§2 Dense search](#2-dense-vector-search) + M1 §11 |
| `rrf_fusion(bm25_rank, vector_rank, k=60)` | `EnsembleRetriever(retrievers=[...], weights=[...])` | [§4 Hybrid / RRF](#4-hybrid-search) |
| `rerank_interseccion()` (cross-encoder proxy) | `CrossEncoderReranker` + `ContextualCompressionRetriever` | [§5 Reranking](#5-reranking-with-cross-encoder) |
| Filter `CORPUS` by `fare_class` before search | `crear_retriever_filtrado()` or `search_kwargs={"filter": {...}}` in Chroma | [§7 Hard filters](#7-hard-filters-as-a-safety-guardrail) |
| `main()` prints top-3 with/without filter | `.get_relevant_documents(query)` or `.invoke(query)` | M1 §11 (Retriever interface) |

### 13.3 Retriever as a composable interface

In M1 you learned that a **Retriever** is any object that, given a query (string), returns `list[Document]`. The minimal interface:

```python
docs = retriever.invoke("¿puedo hacer cambios sin cargo?")
# docs: list[Document] with page_content and metadata
```

The legacy alias `.get_relevant_documents(query)` also exists — it does the same thing. In new code prefer `.invoke()`.

**The key M4 idea:** you can **stack** retrievers. A retriever can *contain* other retrievers:

```
                    ┌─────────────────────────────────────┐
                    │  ContextualCompressionRetriever     │
                    │  (reranker on top of ensemble)      │
                    └──────────────────┬──────────────────┘
                                       │ base_retriever
                    ┌──────────────────▼──────────────────┐
                    │       EnsembleRetriever             │
                    │  (RRF fusion of BM25 + vector)      │
                    └──────────┬─────────────┬────────────┘
                               │             │
                    ┌──────────▼──┐   ┌──────▼──────────┐
                    │ BM25Retriever│   │ vector_retriever │
                    │  (keyword)   │   │  (Chroma/dense)  │
                    └─────────────┘   └─────────────────┘
```

Each box speaks `list[Document]` upward. You only call `.invoke(query)` on the outermost retriever.

### 13.4 `Document` with filter metadata (brief reminder)

In the lab, each policy from the JSON becomes a `Document`:

```python
from langchain.schema import Document

documentos = [
    Document(
        page_content=item["texto"],
        metadata={
            "id": item["id"],
            "fare_class": item["metadata"]["fare_class"],  # ← key for hard filter
            "route_type": item["metadata"]["route_type"],
            "categoria": item["metadata"]["categoria"],
        },
    )
    for item in raw
]
```

- `page_content` = the text BM25 and the vector store index.
- `metadata["fare_class"]` = the dimension you use in the hard filter (§7). Without correct metadata, the filter cannot work.

Full `Document` detail: [M1 §11.3](../01-fundamentos/guia.md#113-the-document-object).

### 13.5 `BM25Retriever` — your manual BM25, packaged

**What it does:** builds an in-memory BM25 index over a list of `Document` using the `rank-bm25` library (the same §3 formula, optimized).

```python
from langchain_community.retrievers import BM25Retriever

bm25_retriever = BM25Retriever.from_documents(documentos)
bm25_retriever.k = 9   # how many documents to return per query (equivalent to your top-k)

docs = bm25_retriever.invoke("cambios sin cargo adicional")
# docs[0].metadata["id"] → probably pol_008 (Top) without filter
```

| Parameter / attribute | What it controls | Scratch equivalent |
|---------------------|--------------|---------------------|
| `.from_documents(docs)` | Builds the BM25 index | Your IDF + TF loop over `CORPUS` |
| `.k` | Top-k to return | Your BM25 ranking `[:9]` |

**When to use:** domains with exact terms ("cambios", "sin cargo", ATA codes). **When NOT:** if you only need semantics and there are no exact identifiers — a vector retriever alone may suffice.

**Gotcha:** `BM25Retriever` does not accept metadata `filter`. If you need a hard filter, pass only already-filtered `Document`s (see §13.10).

### 13.6 Vector retriever — Chroma + local embeddings

**What it does:** indexes `Document`s with dense embeddings and exposes a cosine similarity retriever.

```python
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
# Local model ~80MB; first run downloads from Hugging Face

vector_store = Chroma.from_documents(documentos, embeddings)
vector_retriever = vector_store.as_retriever(search_kwargs={"k": 9})

docs = vector_retriever.invoke("cambios de vuelo sin pagar")
```

| Piece | Role | M1 reminder |
|-------|-----|-----------------|
| `HuggingFaceEmbeddings` | Converts text → `list[float]` | M1 §11.6 — `Embeddings` interface |
| `Chroma.from_documents` | Persists vectors + metadata | M1 §11.7 — vector store |
| `as_retriever(search_kwargs={"k": N})` | Returns top-N by similarity | M1 §11.8 — `Retriever` |

**Difference from your scratch:** your BoW embedding does not capture that "modificación de fecha" and "cambio de vuelo" are semantically close. `all-MiniLM-L6-v2` does — which is why the framework's vector ranking may differ from scratch, but the **pattern** (without filter → noise from other fares) holds.

**When to use:** natural language, synonyms, long queries. **When NOT:** exact ID search only with no semantic variation.

### 13.7 `EnsembleRetriever` — your manual RRF, automated

**What it does:** runs several retrievers in parallel, fuses their rankings with **Reciprocal Rank Fusion** (RRF, §4) using `c=60` by default — the same `k=60` as your `rrf_fusion()`.

```python
from langchain.retrievers import EnsembleRetriever

ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],   # 40% BM25, 60% vector
)

docs = ensemble_retriever.invoke(QUERY)
```

**How it works internally (mapping to your scratch):**

```
Your scratch:                          EnsembleRetriever:
─────────────────                    ─────────────────────
for rank, doc in bm25_results:       Runs retriever[0].invoke(query)
  score += 1/(60+rank)               Runs retriever[1].invoke(query)
for rank, doc in vector_results:      Fuses with RRF (c=60)
  score += 1/(60+rank)               Applies weights as tiebreaker
sort by score desc                   Returns list[Document]
```

**On `weights`:** they are NOT multipliers of BM25 vs cosine scores (incompatible scales — which is why RRF uses ranks, §4). In `EnsembleRetriever`, weights influence when a document appears in **only one** list: a doc found only by the vector retriever gets a boost proportional to `weights[1]`. If it appears in both lists, RRF already scored it for both positions.

| weights | Practical interpretation |
|---------|------------------------|
| `[0.5, 0.5]` | BM25 / vector tie |
| `[0.4, 0.6]` | More confidence in semantics (conversational domain) |
| `[0.7, 0.3]` | More confidence in keywords (technical domain with exact IDs) |

**When to use:** whenever you want BM25+vector hybrid (general case, §4). **When NOT:** if one retriever is clearly useless in your domain — better remove it than give it weight 0.01.

**Gotcha:** `EnsembleRetriever` has no `hardFilter`. The filter must be applied *before* (§13.10).

### 13.8 Reranking — `CrossEncoderReranker` + `ContextualCompressionRetriever`

**What it does:** takes the base retriever output (ensemble), reorders it with a cross-encoder (§5), and trims to `top_n`.

```python
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever

cross_encoder = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
reranker = CrossEncoderReranker(model=cross_encoder, top_n=3)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,       # the "compressor" reorders and trims
    base_retriever=ensemble_retriever,  # where candidates come from
)

docs = compression_retriever.invoke(QUERY)  # at most 3 docs, reordered
```

**"Compression/reranking over base retriever" pattern:**

```
Query
  │
  ▼
base_retriever (Ensemble)  ──▶  top-9 candidates (high recall, §5)
  │
  ▼
base_compressor (Reranker) ──▶  reorders query+doc TOGETHER (high precision)
  │
  ▼
final top-3
```

The name "ContextualCompression" is historical: it originally compressed long documents. In RAG practice, the most common use is **reranking** — which is why the `base_compressor` is almost always a reranker.

**Cloud alternative (no local model):**

```python
# from langchain_cohere import CohereRerank
# reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=3)
```

`CohereRerank` follows the same pattern: pass it as `base_compressor` to `ContextualCompressionRetriever`. Requires `COHERE_API_KEY` but avoids downloading BGE (~400MB).

| Option | Advantage | When |
|--------|---------|--------|
| `CrossEncoderReranker` + BGE | Local, free, reasonably multilingual | Production without cloud |
| `CohereRerank` | Very easy, high quality in English | Rapid prototyping with API |

**When to use reranker:** critical domains (legal, healthcare, airline) where the retriever's top-5 has noise in positions 1-2. **When NOT:** latency < 100ms or corpus < 500 docs where the retriever is already precise.

**Gotcha:** the reranker receives `base_retriever` output. If the ensemble returns `k=3`, the reranker can only reorder 3 docs — set ensemble `k` high (9-20) and let the reranker trim to `top_n=3`.

### 13.9 Hard filter — why it is not in `EnsembleRetriever`

`EnsembleRetriever` fuses BM25 and vector lists. **It has no `hardFilter` parameter** because:

1. BM25 does not natively support metadata filters.
2. Chroma supports `filter` in `search_kwargs`, but that filter only applies to the vector retriever — BM25 would still return docs from other fares.

**Strategy A (recommended in the lab):** filter the corpus **before** building retrievers:

```python
def crear_retriever_filtrado(fare_class: str):
    docs_filtrados = [d for d in documentos if d.metadata["fare_class"] == fare_class]
    bm25_filtrado = BM25Retriever.from_documents(docs_filtrados)
    # ... rebuild vector store, ensemble, and compression retriever
```

**Strategy B (vector only):** filter in Chroma without rebuilding the index:

```python
vector_retriever = vector_store.as_retriever(
    search_kwargs={"k": 9, "filter": {"fare_class": "Basic"}}
)
```

This filters the vector retriever, but **ensemble BM25 would still be unfiltered** — guaranteed noise. That is why strategy A is robust (same as your scratch: filter `CORPUS` at the start).

Full justification in [§7](#7-hard-filters-as-a-safety-guardrail).

### 13.10 Block-by-block walkthrough: `lab/solucion_framework.py`

Open `lab/solucion_framework.py` and follow this map. Each block corresponds to something you already wrote by hand.

```
BLOCK 1 — Load corpus → Documents
─────────────────────────────────────
JSON → list[Document] with metadata fare_class, route_type, categoria
Why? BM25Retriever and Chroma consume Document, not loose dicts.

BLOCK 2 — BM25Retriever
────────────────────────
BM25Retriever.from_documents(documentos); bm25_retriever.k = 9
Why k=9? Corpus of 9 policies; we want all candidates
              so the ensemble has material to fuse.

BLOCK 3 — Vector store + retriever
────────────────────────────────────
HuggingFaceEmbeddings + Chroma.from_documents + as_retriever(k=9)
Why all-MiniLM-L6-v2? Lightweight local model; sufficient for the lab.

BLOCK 4 — EnsembleRetriever
─────────────────────────────
retrievers=[bm25, vector], weights=[0.4, 0.6]
Why? Replicates your scratch rrf_fusion() with internal RRF c=60.

BLOCK 5 — Reranker + Compression retriever
────────────────────────────────────────────
CrossEncoderReranker(BGE, top_n=3) wrapped in ContextualCompressionRetriever
Why? Replicates your intersection rerank, but with a real cross-encoder.

BLOCK 6 — crear_retriever_filtrado()
──────────────────────────────────────
Filter docs → rebuild BM25 + Chroma + Ensemble + Compression
Why rebuild everything? EnsembleRetriever does not filter; BM25 has no filter.

BLOCK 7 — Execution with/without filter
────────────────────────────────────
compression_retriever.invoke(QUERY)  vs  crear_retriever_filtrado("Basic").invoke(QUERY)
Why? Demonstrate the same pattern as expected.md from scratch.
```

**Expected result (same pattern as scratch):**

| Mode | Top-3 fare_class | Noise |
|------|------------------|-------|
| Without filter | Top, Plus, Basic mixed | Yes — pol_008 (Top) probably first |
| With filter `Basic` | Basic only | No — pol_002, pol_003, pol_001 |

The framework may rank slightly differently from scratch (real embeddings vs BoW), but the **noise check** must be the same: without filter there are wrong fares; with filter, Basic only.

### 13.11 When to use / NOT use each piece

| Piece | Use when | Do NOT use when | Main gotcha |
|-------|-------------|----------------|------------------|
| `BM25Retriever` | Exact IDs, technical jargon, rare terms | Conversational semantics only | No native metadata filter |
| Vector retriever (Chroma) | Natural language, synonyms | Exact code search only | Chroma `filter` does not affect ensemble BM25 |
| `EnsembleRetriever` | General hybrid case | One retriever clearly dominant | `weights` ≠ weighted-sum alpha (§4) |
| `CrossEncoderReranker` | Critical precision, noisy top-k | Latency < 100ms, small corpus | Needs high `k` on base retriever |
| `ContextualCompressionRetriever` | Whenever you add a reranker | — | Name is confusing; it is a rerank wrapper |
| Hard filter pre-corpus | Safety guardrail (§7) | Soft prompt filter is enough (rare) | Post-filtering after the LLM is too late |

### 13.12 Full pipeline diagram (framework)

```
politicas.json
      │
      ▼
 list[Document]  ──────────────────────────────────────────────┐
      │                                                         │
      │ full corpus (9 docs)                                    │ filtered docs (3 Basic)
      ▼                                                         ▼
 ┌─────────┐  ┌──────────────┐                    ┌─────────┐  ┌──────────────┐
 │  BM25   │  │ Chroma+HF    │                    │  BM25   │  │ Chroma+HF    │
 │  k=9    │  │ Embeddings   │                    │  k=3    │  │  k=3         │
 └────┬────┘  └──────┬───────┘                    └────┬────┘  └──────┬───────┘
      │              │                                  │              │
      └──────┬───────┘                                  └──────┬───────┘
             ▼                                                 ▼
      EnsembleRetriever                                  EnsembleRetriever
      weights=[0.4,0.6]                                  weights=[0.4,0.6]
      RRF c=60                                           RRF c=60
             │                                                 │
             ▼                                                 ▼
   ContextualCompressionRetriever                    ContextualCompressionRetriever
   + BGE reranker top_n=3                           + BGE reranker top_n=3
             │                                                 │
             ▼                                                 ▼
   WITHOUT FILTER: Top, Plus, Basic                      WITH FILTER: Basic only
   (noise — §7)                                      (correct — §7)
```

### 13.13 Next step: write the framework yourself

1. Read `lab/enunciado.md` — the **Layer ③** section has staged hints pointing here.
2. Try writing `lab/solucion_framework.py` **without looking** at the solution.
3. Compare with `lab/solucion_framework.py` and `lab/solucion.md`.
4. When you have `pip` and network, run it and verify the with/without filter pattern matches `lab/expected.md`.

**Useful cross-links:**

- BM25 concepts: [§3](#3-keyword-search-bm25)
- RRF fusion: [§4](#4-hybrid-search)
- Cross-encoder: [§5](#5-reranking-with-cross-encoder)
- Hard filter: [§7](#7-hard-filters-as-a-safety-guardrail)
- Scratch workshop: [`lab/enunciado.md`](lab/enunciado.md) · [`lab/expected.md`](lab/expected.md)
- LangChain base: [M1 §11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch)

---

> **Beyond Lang\*:** retrievers and the full RAG pipeline can also be built with **LlamaIndex** (query engines/retrievers), **Haystack**, and the **native SDK + Chroma** — see [`../referencia/rag-sin-langchain.md`](../referencia/rag-sin-langchain.md).
>
> **Strategy landscape:** beyond hybrid + rerank, there is a full catalog of RAG architectures (HyDE, RAG-Fusion, RAPTOR, Contextual Retrieval, ColBERT, Self-RAG, CRAG, Adaptive/Agentic RAG…). When to apply each in [`../referencia/panorama-estrategias-rag.md`](../referencia/panorama-estrategias-rag.md).

---

## 14. Checkpoint

**You know it if you can:**

- Explain the BM25 formula and why each parameter (IDF, k1, b) exists.
- Describe RRF and manually compute the fused score for 3 documents.
- Explain why a cross-encoder is more precise than a bi-encoder and when the extra latency is not worth it.
- Design a hard filter for a high-consequence domain and argue why a prompt instruction is not enough.
- Design multi-index routing for the telecom case (3 indexes, keyword + intent rules).
- Explain when a knowledge graph beats vectors and when it does not.
- Map the 6 `retrieval` nodes and 2 `query` nodes to their use cases.
- Explain what each LangChain retriever does (`BM25Retriever`, `EnsembleRetriever`, `ContextualCompressionRetriever`) and map it to what you implemented in scratch.
- Write a LangChain hybrid + rerank + hard filter pipeline without copying the lab solution.

**What to review if something is unclear:**

- BM25: reread §3 with a 5-document example corpus and compute scores by hand.
- Cross-encoder: reread §5, run the workshop scratch to see the difference with and without reranker.
- Hard filters: read templates 03 and 08 §9 for real-context justification.
- GraphRAG: explore `examples/05-legal-contract-review/flow.json` and the `store.neo4j` node in `docs/02-node-catalog.md`.
- LangChain retrievers: reread [§13](#13-layer--explained-langchain-retrievers-from-scratch), write `lab/solucion_framework.py` guided by `lab/enunciado.md`.

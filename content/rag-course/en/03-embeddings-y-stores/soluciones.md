# M3 · Solutions — Embeddings and Vector Stores

> Reasoned answers for exercises 14–21.

---

## Exercise 14 — Manual cosine similarity calculation

```
doc_A = [2, 3, 0]
doc_B = [0, 1, 4]
doc_C = [3, 2, 1]
query = [3, 3, 0]
```

### 14.a) Step-by-step calculation

**Norms:**
```
‖query‖ = √(9 + 9 + 0) = √18 ≈ 4.243
‖doc_A‖ = √(4 + 9 + 0) = √13 ≈ 3.606
‖doc_B‖ = √(0 + 1 + 16) = √17 ≈ 4.123
‖doc_C‖ = √(9 + 4 + 1) = √14 ≈ 3.742
```

**Dot products:**
```
query · doc_A = (3×2) + (3×3) + (0×0) = 6 + 9 + 0 = 15
query · doc_B = (3×0) + (3×1) + (0×4) = 0 + 3 + 0 = 3
query · doc_C = (3×3) + (3×2) + (0×1) = 9 + 6 + 0 = 15
```

**Cosine similarities:**
```
cos(query, doc_A) = 15 / (4.243 × 3.606) = 15 / 15.30 ≈ 0.980
cos(query, doc_B) = 3  / (4.243 × 4.123) = 3  / 17.49 ≈ 0.172
cos(query, doc_C) = 15 / (4.243 × 3.742) = 15 / 15.87 ≈ 0.945
```

### 14.b) Ranking

1. doc_A ≈ 0.980
2. doc_C ≈ 0.945
3. doc_B ≈ 0.172

**Top-1: doc_A** — "employee benefits policy". This makes sense: the query asks about benefits as an employee, and doc_A is the most aligned in that subspace.

### 14.c) Does the order change with normalization + dot product?

**No change.** With normalized vectors:
```
dot(q̂, â) = cos(q, a)
```

Cosine similarity is already implicit in the dot product of normalized vectors. The ranking will be identical because normalization does not change the angles between vectors, only the magnitudes.

### 14.d) L2 distance

```
d(query, doc_A) = √((3-2)² + (3-3)² + (0-0)²) = √(1 + 0 + 0) = 1.0
d(query, doc_B) = √((3-0)² + (3-1)² + (0-4)²) = √(9 + 4 + 16) = √29 ≈ 5.385
d(query, doc_C) = √((3-3)² + (3-2)² + (0-1)²) = √(0 + 1 + 1) = √2 ≈ 1.414
```

With L2: 1. doc_A (1.0), 2. doc_C (1.414), 3. doc_B (5.385). **The ranking is the same** as with cosine.

In this example, cosine and L2 give the same order because the vectors have similar magnitudes. The difference matters when magnitudes vary a lot: if doc_C were `[30, 20, 10]` (10× larger), cosine would still see it as similar to the query (same direction), but L2 would consider it very far. In text retrieval with normalized vectors, they are equivalent.

---

## Exercise 15 — Dimensions and normalization

### 15.a) Answer: B

Longer texts will dominate the results even if they are not more semantically relevant.

If vector norm grows with length, dot product `A·B = ‖A‖ × ‖B‖ × cos(θ)` favors vectors with larger magnitude. A long but irrelevant document can have a higher dot product than a short but perfectly relevant one. The solution is to normalize vectors before indexing or use explicit cosine similarity.

### 15.b) Answer: C

Dimension does not determine quality; you must evaluate on the domain.

A 768-dimensional model trained on healthcare data will outperform a 3,072-dimensional model trained on generic text if your application is healthcare. The correct metric is retrieval quality on your own data: prepare a set of 50–100 (query, relevant document) pairs and measure Recall@K. Dimension only matters for storage and compute cost.

### 15.c) Answer: C

The model was trained with these prefixes to distinguish the role of the text.

During training, E5 and BGE received millions of (query, passage) pairs with their corresponding prefixes. The model learned that query vectors should align with passage vectors in an asymmetric space: the query "how many vacation days do I get?" should be close to the passage "Employees have 15 vacation days per year", not to another similar query. Without the prefixes, vectors fall in a "neutral" zone of the space and recall drops ~5–15% according to the BEIR benchmark.

---

## Exercise 16 — Vector indexes

### 16.a) Choose the index

| Scenario | Chosen index | Justification |
|----------|--------------|---------------|
| Medical system, 8k docs, accuracy critical | **Flat** | With 8,000 documents, flat is O(N×D) but N is small → latency < 5ms. Recall = 100%, critical requirement for medical diagnosis. No reason to introduce ANN with recall loss. |
| E-commerce recommendation, 20M products, 8 GB RAM | **IVF+PQ** | 20M vectors of 1,024 dim × 4 bytes = 80 GB uncompressed. IVF+PQ compresses 8–16×, fitting in 8 GB. Recall ~85–90% with tuned nprobe is acceptable for recommendation. HNSW would consume >80 GB RAM. |
| RAG in development, 50k docs, frequent updates | **HNSW** | HNSW supports incremental insertions efficiently. With 50k docs and hourly updates, IVF would require periodic k-means retraining. Flat would also be a valid option at this size. |
| 2M scientific papers, no frequent updates | **IVF or HNSW** | Both are viable. IVF if RAM is limited. HNSW if you want better recall/speed and have ~8 GB available for the graph. IVF easier to configure with a single batch training run. |

### 16.b) Lowering M and ef_construction

**Consequences:**
- `M` from 64 to 16: each node has fewer connections → the graph has fewer "shortcuts" → greedy search can get stuck in local minima → recall drops, especially in high-dimensional spaces.
- `ef_construction` from 400 to 100: the graph is built with fewer candidates → worse index quality → harder to recover with high ef_search.
- **Memory:** reduces significantly (each edge costs ~8 bytes; reducing M 4× lowers the graph ~4×).

**When acceptable:** when target recall is ~85–90% (not 99%), the collection does not exceed ~1M vectors, and memory is the bottleneck. For content recommendation or search suggestions, this trade-off is usually acceptable. For medical or financial systems, it is not.

### 16.c) Predict output with nprobe=1

**The system does NOT return the most relevant documents.**

With `nprobe=1`, only the cluster nearest to the centroid is explored. In this case, C12 (personnel selection) is the cluster with the centroid closest to the query, but it contains irrelevant documents. The correct cluster C47 (vacations) is not explored.

Result: the returned top-K will contain documents about "personnel selection" with high similarity within C12, but without recall of the documents actually relevant to vacations.

**Fix:**
```python
index.nprobe = 5  # explore several neighboring clusters
# Or better: nprobe = max(1, nlist // 10) as an initial heuristic
```

With `nprobe=5`, C12 and the next 4 nearest clusters are explored, likely including C47. Recall improves from ~60% to ~90% with latency only 2–5× higher.

---

## Exercise 17 — ChromaDB: operations and filters

### 17.a) Find the bug

**Bug 1:** In `metadatas`, the third element contains `"tags": ["flexibility", "wellness"]`. ChromaDB does not support list-type values in metadata. It only accepts `str`, `int`, `float`, `bool`. It will raise an error when calling `add()`.

**Fix:** convert the list to a string or remove the field.
```python
{"category": "schedule", "year": 2024}
# or:
{"category": "schedule", "year": 2024, "tags": "flexibility,wellness"}
```

**Bug 2:** The filter `where={"category": {"$contains": "schedule"}}` is incorrect. `$contains` is a `where_document` operator (text search in the document), not a metadata filter operator for equality. To filter metadata by exact value, use `$eq` or simply the value directly.

**Fix:**
```python
where={"category": "schedule"}
# or explicitly:
where={"category": {"$eq": "schedule"}}
```

### 17.b) Upsert for re-ingestion

Use **`upsert`**.

- `add`: fails if the id already exists → monthly re-ingestion would fail for all already-indexed documents.
- `update`: fails if the id does NOT exist → new documents would not be added.
- `upsert`: "update if exists, create if not" → idempotent, perfect for periodic ingestion pipelines.

```python
collection.upsert(
    ids=new_or_existing_ids,
    documents=updated_texts,
    metadatas=updated_metadata
)
```

### 17.c) Query with multiple filters

```python
results = collection.query(
    query_texts=["dental benefits coverage"],
    n_results=5,
    where={
        "$and": [
            {"category": "benefits"},
            {"year": {"$gte": 2024}}
        ]
    },
    where_document={"$contains": "dental"}
)
```

`where` filters by metadata; `where_document` filters by text content. Both apply together (implicit AND between them).

### 17.d) Predict the output

```
1
```

3 documents with ids "a", "b", "c" are added. Then all with `lang == "python"` are deleted — "a" and "c". Only doc "b" (lang: java) remains. `col.count()` returns **1**.

---

## Exercise 18 — Choose the store

### 18.a) Legaltech startup, MVP, no DevOps, 500k docs, SaaS ok

**Choice: Pinecone**

With 2 engineers and a 2-week deadline, the bottleneck is development speed, not cost or performance. Pinecone is serverless: no Docker, no YAML, no index management. Connect with an API key. 500k documents fit comfortably in the free/starter tier.

**Why not ChromaDB:** ChromaDB is local, great for dev, but for scalable production they would need to manage a server or use the recently launched cloud. Adds unwanted operations overhead.

**Why not Qdrant/Weaviate:** require Docker or cloud account, initial configuration, and the feature gain does not justify the overhead for an MVP.

### 18.b) Bank, strict on-premise, 3M docs, existing PostgreSQL, DBA

**Choice: pgvector**

Data cannot leave their servers → rules out all SaaS (Pinecone, Qdrant Cloud). They already have PostgreSQL and a DBA → pgvector is an extension they add without a new system. 3M documents are within pgvector's comfortable range with HNSW. SQL filters they already know work for metadata filters.

**Why not Qdrant on-premise:** adds a new system the team does not know. A Postgres DBA does not need to learn Qdrant if pgvector solves the problem.

**Why not ChromaDB:** not production-grade for this scale and regulated environment.

### 18.c) ML lab, 50M papers, GPU, 128 GB RAM, research team

**Choice: FAISS**

50M × 1,024 dim × 4 bytes = 200 GB uncompressed. With IVF+PQ they compress to ~25–50 GB, within 128 GB. The team knows numpy/C++, they do not need database management. They only want the fastest search — FAISS with GPU reaches 100M+ queries/second. They do not need complex metadata filters (similar-to-paper search).

**Why not Milvus:** more complete but adds database complexity they do not need. FAISS is a library they integrate directly in their Python/C++ code.

**Why not Qdrant/Pinecone:** too much database and networking overhead for what they do.

### 18.d) E-commerce, 8M products, 12 languages, complex filters, Docker ok

**Choice: Weaviate**

Native hybrid search (semantic + BM25) is key for e-commerce: users search "red Nike Air Max sneakers size 42" — mix of semantics ("red sneakers") and exact text ("Nike Air Max", "size 42"). Weaviate has hybrid search modules and rich GraphQL filters. Supports multilingual with multilingual models. Deploys with Docker compose.

**Why not Qdrant:** Qdrant has excellent filters but hybrid search (text + semantic) is not as first-class as in Weaviate. You would have to implement hybrid scoring manually.

**Why not pgvector:** complex filters over 12 languages and 8M products push pgvector limits; they also need hybrid search.

### 18.e) FAISS has no metadata filters

FAISS is an **index library**, not a vector database. It has no native support for storing or filtering metadata. The team probably:

1. Built the FAISS index with the vectors.
2. Kept a separate Python dictionary `{faiss_index → metadata}`.
3. At query time: search top-K in FAISS → get indices → look up metadata → **filter manually**.

The problem is that manual filtering is post-retrieval: if you request top-10 and 8 of the 10 do not pass the price filter, you get only 2 results (or you have to request top-100 and then filter, degrading recall and latency).

The real cause is not FAISS but the design: they chose the wrong tool for a case with complex metadata filters. The solution is to migrate to Qdrant, Weaviate, or pgvector, which have filters integrated into vector search (pre-filtering), guaranteeing that the K returned results already pass the filters.

---

## Exercise 19 — sentence-transformers: from scratch to real embedding

### 19.a) Comparison table

| Aspect | Scratch (`embeder`) | Framework (`encode`) |
|--------|---------------------|----------------------|
| Vector dimensions | 20 fixed (size of `VOCAB` vocabulary) | 768 (defined by BGE-base model) |
| Synonym capture | No — only counts exact words in vocabulary | Yes — the transformer learned that "vacation" and "time off" are semantically close |
| Who normalizes the vector | You call `normalize()` explicitly before indexing | Parameter `normalize_embeddings=True` in `.encode()` returns unit vectors |
| Dependencies | stdlib only (`math`, `json`) | `pip install sentence-transformers` + model download (~440 MB) + network the first time |

### 19.b) Answer: B

`IndexFlatIP` computes dot product. Without normalization, `A·B = ‖A‖ × ‖B‖ × cos(θ)`: longer texts produce vectors with larger norm and dominate the ranking even if they are not more semantically relevant. The fix is `model.encode(texts, normalize_embeddings=True)` before `add()`.

The other options are incorrect: BGE-base has 768 dimensions (A is false); FAISS works with any float32 vector (C is false); `IndexFlatL2` would measure Euclidean distance, it would not solve the magnitude problem if you do not normalize (D is false).

---

## Exercise 20 — ChromaDB: predict output and convert distances

### 20.a) Prediction of `collection.query(...)`

1. **Number of ids:** 1 (only one document has `category=vacation`, and `n_results=2` cannot return more than exists after the filter).

2. **First result id:** `"v1"` — the only one that passes `where={"category": "vacation"}`.

3. **Top-1 distance:** `0.0` — the query embedding `[1.0, 0.0, 0.0]` is identical to `v1`'s embedding.

4. **Cosine similarity:** `sim = 1 - 0.0 / 2 = 1.0` — perfect similarity.

**Note:** without the `where` filter, top-2 would be `v1` (dist=0.0) and `b1`/`h1` (dist=√2 ≈ 1.414 with cosine between orthogonal unit vectors). Pre-filtering guarantees only valid candidates are ranked.

### 20.b) Complete the `where`

```python
results = collection.query(
    query_texts=["dental coverage"],
    n_results=5,
    where={
        "$and": [
            {"category": {"$in": ["benefits", "vacation"]}},
            {"version": {"$gte": "2024"}}
        ]
    },
    where_document={"$contains": "dental"}
)
```

- `where` filters metadata (`$in` for multiple categories, `$gte` for version).
- `where_document` filters text content (`$contains` searches for substring "dental").
- Both combine with implicit AND.

---

## Exercise 21 — FAISS: id→doc map and post-filtering bug

### 21.a) Why FAISS needs an external map

FAISS is a **vector index library**: internally it only stores float arrays (vectors) and integers (positions or numeric IDs). It has no concept of "document", "text", or "metadata".

ChromaDB is a **complete vector database**: each collection entry stores `id`, `document`, `embedding`, and `metadata` together. When you call `query()`, it returns ids, texts, and metadata without an external map.

That is why with FAISS you need `id_to_doc = {i: doc}` (or similar) to translate the numeric index returned by `search()` to the original document with its metadata.

### 21.b) Post-filtering bug

**Bug:** `k=3` is too small. The 3 globally nearest neighbors probably belong to the other 95 categories (95% of the corpus). After filtering by `vacation`, the list is empty.

**Minimal fix:** request more candidates before filtering:

```python
k_extra = 50  # or 100; rule: several times the desired k
scores, indices = index.search(query_vec, k=k_extra)

filtered = []
for score, idx in zip(scores[0], indices[0]):
    doc = id_to_doc[idx]
    if doc["metadata"]["category"] == filter_category:
        filtered.append((score, doc))
    if len(filtered) == 3:
        break
```

With 100 docs and only 5 vacation docs, `k=50` almost certainly finds enough candidates. With 1M docs you would need to request `k=1000` or more, or migrate to a store with pre-filtering.

### 21.c) Prediction with 12 vs 1M documents

**With 12 documents (workshop):** requesting `k=3` and filtering **can fail** if the 3 most similar globally are not in category `vacation` (there are 3 vacation and 9 other docs). That is why `solucion_framework.py` uses `k_extra=12` (all). With 12 docs it always works.

**With 1 million and 0.1% vacation (~1000 docs):** requesting `k=3` **almost certainly fails** — the probability that the global top 3 are vacation docs is ~0.01³. You need `k=500–5000` and recall may still degrade. This is the use case where ChromaDB, Qdrant, or pgvector (pre-filtering) are mandatory.

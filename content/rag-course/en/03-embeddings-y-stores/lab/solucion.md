# Solution — Workshop M3 · Mini Vector Store

---

## Layer ② — Pure Python (`solucion_scratch.py`)

### Design decisions

**Toy embedding:** bag-of-words over a fixed vocabulary of 20 HR domain keywords. This choice is deliberate to make the mechanics visible: you can see exactly which dimensions activate for each document and query. In production, a transformer replaces all of this with 768–3,072 dimensions that capture real semantics.

**Normalization before indexing:** all vectors are normalized to norm 1 at indexing time. This makes similarity computation at query time a simple dot product (faster and cleaner).

**Dictionary store:** `{ id → { vector, text, metadata } }`. It is the simplest possible structure. It has no ANN index — exhaustive search O(N). Perfect for 12 documents. For 100k+ documents, FAISS or an HNSW index would come in.

**Metadata filter as pre-filtering:** before computing similarities, the candidate list is filtered. This is correct and efficient for small collections. In FAISS (no native filters) you do post-filtering, which degrades recall.

### The filter effect in this specific case

The top 3 results without filter are already all in category `vacation`, because the query activates words (`leave`, `rest`, `days`) that only appear in documents of that category in the toy vocabulary. The filter does not change the top-3 here.

With a real neural embedding, the situation would be more interesting: "leave days" would be semantically close to "restaurant voucher" or "bonus" at certain angles in the space, and the filter would be more impactful to avoid results from other categories.

### Why doc_01 has score 0.0000

The query activates `days` (vocab position 1), `leave` (position 2), and `rest` (position 3). The text of `doc_01` contains "days", "vacation", and "monthly". In our fixed vocabulary:
- "days" → `days` in vocab → ✓ activates
- "vacation" → `vacation` in vocab → ✓ activates (but the query does not have `vacation`)
- "monthly" → not in vocab

doc_01's embedding has active dimensions for `vacation` and `days`. The query embedding has `days`, `leave`, and `rest` active. The intersection is only `days`, but in the normalized query that value is small and the dot product is almost 0.

Takeaway: the toy embedding has low semantic coverage. In a real embedding, "vacation days" and "leave days" would be in the same neighborhood of the space.

---

## Layer ③ — Real framework (`solucion_framework.py`)

> **Before reading this section:** study the guide [§15 — Layer ③ explained](../guia.md#15-layer--explained-from-in-memory-dict-to-chromadb-faiss-and-sentence-transformers). There you will find the piece-by-piece bridge from scratch, the `sentence-transformers` teaching, and the block-by-block walkthrough of this file. The guided workshop is in [`enunciado.md` Part 5](./enunciado.md#part-5--layer--chromadb--faiss--sentence-transformers-guided-task).

### ChromaDB: advantages over scratch

1. **Real embedding:** with `sentence-transformers` + `BAAI/bge-base-en-v1.5`, the embedding captures semantics. "leave days" and "vacation" would be close in the space.
2. **Native filters:** `where={"category": "vacation"}` applies pre-filtering inside the index. No post-processing overhead.
3. **Full CRUD:** `upsert`, `delete by filter`, `get by id` work without extra code.
4. **Automatic persistence:** `PersistentClient(path="./data")` writes to disk without manual management.
5. **Automatic HNSW:** for collections > 1000 documents, Chroma activates HNSW internally.

### FAISS: why it is more complex for this case

FAISS has no metadata or filters. To implement the same category filter:
1. Request K_extra (e.g. all N documents) in vector search.
2. Filter manually by metadata in Python.
3. Take the first 3 that pass the filter.

This is **post-filtering** and has two problems:
- If few documents remain after filtering, real recall drops (you ask for 3 but only find 1).
- You add metadata management code completely separate from the index.

For this workshop with 12 documents, it is manageable. For 1M documents with complex filters, use Qdrant or pgvector.

### Embedding model: BGE vs OpenAI

| Aspect | BGE-base (local) | text-embedding-3-small (OpenAI) |
|--------|-----------------|----------------------------------|
| Cost | Free | ~$0.02/1M tokens |
| Privacy | Total (local) | Data sent to OpenAI |
| Speed | Depends on GPU/CPU | API latency (~50–200ms) |
| Retrieval quality | Very good for English | Excellent, multilingual |
| Setup | `pip install sentence-transformers` + 440MB download | `pip install openai` + API key |

For the startup in the brief (private employee data), local BGE is the correct choice.

---

## Connection with RAGorbit

This workshop manually implements what the `store.chroma` node does in template 09 HR:

```
loader.pdf → ingest.chunker → store.chroma ← model.embedding
                                   │
                              retrieval.vector (topK: 4)
```

- `store.chroma` → our `store` (dictionary) or `ChromaDB.collection`
- `model.embedding` → our `embeder()` function or `SentenceTransformer`
- `retrieval.vector` → our `search()` function
- `hardFilters: [category]` → our `filter` parameter

The difference between template 09 (Chroma) and 02 (pgvector) is:
- Template 09: simple category filters → Chroma sufficient
- Template 02: filters by `doc_type` and `period` with complex SQL logic → pgvector needed for joins and transactions

---

## Toy embedding limitations and how to overcome them

| Limitation | Observed in workshop | Solution |
|------------|----------------------|----------|
| 20-word vocabulary | Many documents have score 0 | Neural model (768+ dim) |
| No semantics | Synonyms not related | Contrastive training |
| No subword tokenization | Words with accents do not always match | SentenceTransformer |
| Bag-of-words | Ignores word order | Transformer with attention |

The toy embedding serves to understand vector mechanics. In production, you replace `embeder()` with `model.encode()` and the rest of the pipeline (normalization, cosine, filter) is identical.

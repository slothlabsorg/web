# Solution — Lab M4

## What this lab demonstrates

The lab has a very specific goal: empirically show that the query `"can I make changes to my flight without paying additional fees?"` for a **Basic** fare passenger returns noise from other fares when there is no filter, and returns only correct, citable results when the hard filter `fare_class=Basic` is applied.

---

## Layer ② — Scratch solution (BM25 + cosine + RRF + rerank)

### Why without-filter fails

The query contains the key terms "changes" and "without additional fee". Document `pol_008` (**Top** fare) contains exactly `"unlimited changes of date, time, and route without additional fee"` — a perfect semantic and lexical match.

- BM25 ranks it first: "changes" and "fee" have high TF in that doc, medium IDF (appears in 3 of 9 docs), and the doc is medium length.
- Cosine ranks it first: the query's BoW embedding overlaps pol_008's words more than pol_002's (which denies changes: "flight changes are not allowed").
- RRF consolidates first place for pol_008 (consensus between both retrievers).
- The simple reranker (token intersection) does not change this because pol_008 also shares many tokens with the query.

Document pol_002 (Basic, changes) ranks third without filter — semantically correct but buried behind the noise.

### Why with-filter works

With `fare_class=Basic`, the active corpus shrinks to [pol_001, pol_002, pol_003]. Now pol_002 competes only with two other Basic policies (baggage and refunds). The query about "changes" makes pol_002 (category "changes") rank first, in both BM25 and cosine. The result is correct and citable.

### Scratch design decisions

**Tokenization:** `split()` + stopword removal. Simple but effective for this corpus. Accents are preserved as part of the alphanumeric character.

**Normalized BoW embedding:** Each frequency is divided by total tokens, yielding proportions. This allows comparing documents of different lengths with cosine similarity. It is an extremely simplified embedding (no IDF), but sufficient to demonstrate the concept.

**RRF with k=60:** Standard value. With few documents (9), rankings are very sensitive to k. With k=60, the difference between rank 1 and rank 2 is small (1/61 vs 1/62), making fusion smoother.

**Intersection rerank:** Simple and deterministic. Counts how many unique query tokens appear in the document. It is a cross-encoder proxy without external models. In production it would be replaced by BGE-reranker or Cohere.

---

## Layer ③ — Framework solution (LangChain)

> **Before reading this:** you should have tried writing the framework guided by [guide.md §13](../guia.md#13-layer--explained-langchain-retrievers-from-scratch) and the "Layer ③" section of [`enunciado.md`](enunciado.md). This section summarizes decisions; the full teaching is in the guide, not here.

### Key components

**BM25Retriever** uses the `rank-bm25` library under the hood — the same formula we implemented by hand, optimized in C. `BM25Retriever.from_documents(docs)` creates the in-memory index.

**EnsembleRetriever** implements RRF internally with `c=60` (the same k as our scratch). The `weights` you configure are not score weights but importance for fallback when a document appears in only one list.

**ContextualCompressionRetriever + CrossEncoderReranker** is LangChain's standard pattern for adding a reranker over any retriever. The `base_retriever` retrieves the initial top-K and the `base_compressor` reorders and trims to `top_n`.

**Hard filter in the framework:** LangChain has no central "hardFilter" in EnsembleRetriever. The correct strategy is to filter the corpus before building retrievers (as `create_filtered_retriever` does). With Chroma, you can also pass `filter={"fare_class": fare_class}` in the vector retriever's `search_kwargs` — but that filter only applies to the vector retriever, not BM25. That is why the most robust solution filters the corpus at the start.

### Key difference scratch vs framework

| Aspect | Scratch | Framework |
|---------|---------|-----------|
| BM25 | Full manual implementation | optimized rank-bm25 |
| Embedding | Normalized BoW (no semantics) | all-MiniLM-L6-v2 (real semantics) |
| Fusion | Manual RRF with k=60 | EnsembleRetriever (internal RRF) |
| Rerank | Token intersection (proxy) | BGE-reranker (real cross-encoder) |
| Hard filter | Filter Python list before pipeline | Filter corpus before retrievers |
| Dependencies | None (pure stdlib) | langchain, rank-bm25, sentence-transformers, chromadb |

Scratch is perfectly valid for understanding the mechanisms. The framework adds real semantics (contextual embeddings) and a cross-encoder reranker that captures interactions unavailable in BoW.

---

## The pattern to remember

```
                  FULL CORPUS
                       │
              ┌────────┴────────┐
              │  HARD FILTER    │  ← apply BEFORE any search
              │  fare_class =   │
              │  "Basic"        │
              └────────┬────────┘
                       │ 3 docs (instead of 9)
              ┌────────┴────────┐
              │   BM25          │
              │   + Cosine      │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   RRF           │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   Rerank        │
              └────────┬────────┘
                       │ top-3 ALL Basic
              ┌────────┴────────┐
              │   LLM           │  ← never sees Top or Plus docs
              └────────┬────────┘
                       │
              Correct, citable answer
```

This pattern — hard filter → retrieval → rerank — is identical to what `retrieval.vector` with `hardFilters: ["fare_class"]` uses in RAGorbit, and what templates 03 (healthcare, `plan`), 08 (manufacturing, `aircraft_type`), and 01 (airline, `fare_class`) use.

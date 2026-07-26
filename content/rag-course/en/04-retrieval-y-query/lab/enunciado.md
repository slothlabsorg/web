# Lab M4 · Hybrid retrieval with hard filter on airline policies

## Business context

An airline operates three fares (`fare_class`): **Basic**, **Plus**, and **Top**. Each fare has its own baggage, flight change, and refund policies. Call center agents consult these policies constantly during calls.

The problem: the current system returns policies from any fare regardless of which applies to the passenger. An agent asks "can they make changes without a fee?" for a Basic passenger, and the system returns Top's policy first ("unlimited free changes"). The agent incorrectly informs the passenger.

**Your task:** implement a retrieval pipeline that combines BM25 + vector similarity ( **hybrid** retrieval), applies a simple **rerank**, and uses a **hard filter** by `fare_class`. Empirically demonstrate that without a filter there is noise from other fares and with a filter the top-3 is correct and citable.

## The corpus

The `data/` directory contains **9 policies** in JSON format, 3 per fare, with metadata `fare_class` and `route_type`:

```
data/policies.json   ← list of 9 documents with text and metadata
```

Each document has:
```json
{
  "id": "pol_001",
  "text": "...",
  "metadata": {
    "fare_class": "Basic",
    "route_type": "domestic",
    "category": "baggage"
  }
}
```

## Task

Implement in `solution_scratch.py` (stdlib only, deterministic):

### Step 1: BM25 from scratch
Implement BM25 (k1=1.5, b=0.75) over the full corpus. Given a query, return all 9 documents with their scores.

### Step 2: Toy cosine similarity (bag-of-words embeddings)
Implement a toy embedding based on normalized bag-of-words. Compute cosine similarity. Return all 9 documents with cosine scores.

### Step 3: RRF fusion
Fuse BM25 and cosine rankings using Reciprocal Rank Fusion (k=60). Produce a unified ranking of all 9 documents.

### Step 4: Simple rerank
Apply a simple deterministic reranker: count how many query tokens appear in the document (normalized term intersection). Reorder the fused top-9 by this rerank score; tiebreak by RRF score.

### Step 5: Without filter vs with filter
Run the full pipeline for the test query with target `fare_class` `"Basic"`:

**Query:** `"can I make changes to my flight without paying additional fees?"`

- **Without filter:** show the fused + reranked top-3.
- **With filter:** apply `fare_class == "Basic"` before BM25/cosine (exclude non-Basic documents). Show the new top-3.

## Success criteria

- Without filter: the top-3 contains at least one document that is NOT `fare_class="Basic"`.
- With filter: the top-3 contains ONLY `fare_class="Basic"` documents and results are correctly citable.
- The script runs with `python3 solution_scratch.py` and produces exactly what `expected.md` describes.

## Staged hints

**Level 1:** How to tokenize? Use `text.lower().split()` and remove common stopwords (`["the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is", "it", "that", "with", "without", "by", "from", "as"]`).

**Level 2:** For IDF: `math.log((N - n_t + 0.5) / (n_t + 0.5) + 1)` where N is total documents and n_t is how many contain term t.

**Level 3:** The bag-of-words embedding is a dict `{term: normalized_frequency}`. For cosine similarity you need dot product and norms. Use `math.sqrt(sum(v**2 for v in vec.values()))` for the norm.

**Level 4:** For RRF, iterate rankings by position (rank starts at 1, not 0) and accumulate `1/(60+rank)` for each list.

**Level 5:** The hard filter is applied at the start: before computing any score, filter the document list to only those with `metadata["fare_class"] == target_fare_class`.

---

## Layer ③ — LangChain pipeline (guided task)

> **Mandatory prerequisite:** layer ② (`solution_scratch.py`) must run with stdlib and produce what `expected.md` shows. Layer ③ is **additional** — you write it when you have `pip` and network.
>
> **Do not start here without reading** [guide.md §13](../guia.md#13-layer--explained-langchain-retrievers-from-scratch). That section teaches each API from scratch. If you only open `solution_framework.py`, layer ③ will appear "all at once".

### Objective

Write (or rewrite) `solution_framework.py` implementing the **same pipeline** as your scratch, but with LangChain retrievers:

```
BM25Retriever + Chroma/vector + EnsembleRetriever + CrossEncoderReranker + hard filter
```

When done, compare your code with `solution_framework.py` and verify the with/without filter pattern matches `expected.md` (noise without filter, Basic only with filter).

### Installation (networked environment)

```bash
pip install langchain langchain-community rank-bm25 sentence-transformers chromadb
```

### Guided task — staged hints

**Level 1 — Documents:** Load `data/policies.json` and convert each item to `Document(page_content=..., metadata={id, fare_class, ...})`. See [guide §13.4](../guia.md#134-document-with-filter-metadata-brief-reminder) and reminder in [M1 §11.3](../../01-fundamentos/guia.md#113-the-document-object).

**Level 2 — BM25Retriever:** Create `BM25Retriever.from_documents(documents)` and set `.k = 9`. What does `.invoke(QUERY)` return for the lab query? See [guide §13.5](../guia.md#135-bm25retriever--your-manual-bm25-packaged).

**Level 3 — Vector retriever:** Instantiate `HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")`, create `Chroma.from_documents(documents, embeddings)`, and get `as_retriever(search_kwargs={"k": 9})`. Chroma reminder: [M1 §11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch). M4 detail: [guide §13.6](../guia.md#136-vector-retriever--chroma--local-embeddings).

**Level 4 — EnsembleRetriever:** Combine both retrievers with `EnsembleRetriever(retrievers=[bm25, vector], weights=[0.4, 0.6])`. How does it relate to your scratch `rrf_fusion()`? See [guide §13.7](../guia.md#137-ensembleretriever--your-manual-rrf-automated) and RRF concept in [guide §4](../guia.md#4-hybrid-search).

**Level 5 — Reranker:** Wrap the ensemble in `ContextualCompressionRetriever` with `CrossEncoderReranker(model=HuggingFaceCrossEncoder("BAAI/bge-reranker-base"), top_n=3)`. Why `top_n=3` and not `k=3` on the ensemble? See [guide §13.8](../guia.md#138-reranking--crossencoderreranker--contextualcompressionretriever).

**Level 6 — Hard filter:** Implement `create_filtered_retriever(fare_class)` that filters `Document`s **before** rebuilding BM25, Chroma, Ensemble, and Compression. Why is Chroma `filter` alone not enough? See [guide §13.9](../guia.md#139-hard-filter--why-its-not-in-ensembleretriever) and [guide §7](../guia.md#7-hard-filters-as-a-safety-guardrail).

**Level 7 — Execution:** Run without filter and with `create_filtered_retriever("Basic")`. Print top-3 with `id`, `fare_class`, `category`. Verify:
- Without filter: `any(c != "Basic" for c in classes)` → `True`
- With filter: `all(c == "Basic" for c in classes)` → `True`

### Success criteria (layer ③)

- Your script imports and uses: `BM25Retriever`, `EnsembleRetriever`, `ContextualCompressionRetriever`, `CrossEncoderReranker`.
- The empirical pattern matches `expected.md` (noise without filter, correction with filter).
- You can explain aloud what each block does without reading the solution.

### Final comparison

| Step | Your scratch | Your framework |
|------|-----------|--------------|
| Keyword | manual `bm25_score()` | `BM25Retriever` |
| Dense | BoW + cosine | `HuggingFaceEmbeddings` + Chroma |
| Fusion | `rrf_fusion(k=60)` | `EnsembleRetriever` (RRF c=60) |
| Rerank | token intersection | `CrossEncoderReranker` (BGE) |
| Filter | filter `CORPUS` at start | `create_filtered_retriever()` |

When finished, read `solution_framework.py` and `solution.md` to compare design decisions.

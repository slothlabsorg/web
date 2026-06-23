# M4 · Exercise solutions

> Reasoned answers for all exercises 14–21.

---

## Exercise 14 · BM25

**(a) IDF of "inspección" and "tren"**

Both terms appear in 3 of the 4 documents (doc_1, doc_2, doc_4). n_t = 3, N = 4:

```
IDF("inspección") = log((4 - 3 + 0.5) / (3 + 0.5) + 1)
                  = log(1.5 / 3.5 + 1)
                  = log(0.4286 + 1)
                  = log(1.4286)
                  ≈ 0.357

IDF("tren") = same calculation ≈ 0.357
```

The low IDF (0.357) reflects that both terms are common in this corpus. If there were a rarer term (like "34-11-00"), its IDF would be much higher and weigh more in the score.

**(b) Intuitive ranking**

From most to least relevant: **doc_1 > doc_4 > doc_2 > doc_3**

Reasoning:
- doc_3 ("cambio de aceite del motor"): contains neither term → score 0. Last for certain.
- doc_1 ("inspección del tren de aterrizaje principal"): contains both terms, short length (5 tokens ≈ avgdl) → good normalization.
- doc_4 ("inspección de frenos y tren de aterrizaje"): contains both, medium length (6 tokens, slightly above avgdl).
- doc_2 ("tren de aterrizaje principal: procedimiento de inspección detallado"): contains both but is longest (7 tokens > avgdl) → penalized by length.

**(c) Why doc_2 may not be most relevant**

Despite containing both terms and being the most descriptive, its greater length penalizes it. BM25 normalizes by length to prevent long documents from dominating simply by repeating more words. With `b=0.75`, doc_2 (7 tokens vs avgdl 5.75) receives a partial penalty that puts it behind doc_1 in the final ranking.

**(d) The b=0.75 parameter**

**Correct answer: B**

`b=0.75` applies partial normalization. With `b=0` there is no length normalization (long documents are not penalized). With `b=1` normalization is complete (all documents treated as if they had the same length). The standard value of 0.75 is a compromise: it moderately penalizes documents longer than average without ignoring length completely.

**(e) What happens with k1=0?**

**Correct answer: A**

With k1=0, the TF fraction numerator becomes `f(q,d) * 1 = f(q,d)` and the denominator `f(q,d) + 0 * ... = f(q,d)`, resulting in `f(q,d)/f(q,d) = 1` for any document containing the term. That is, only whether the term appears matters (binary presence), not how many times. BM25 degenerates to binary TF × IDF.

---

## Exercise 15 · Hybrid retrieval and fusion

**(a) RRF scores (k=60)**

Positions by list:
```
BM25 list:   doc_F=1, doc_A=2, doc_C=3, doc_B=4
Vector list: doc_A=1, doc_E=2, doc_F=3, doc_D=4
```

Scores:
```
doc_A: 1/(60+2) + 1/(60+1) = 1/62 + 1/61 = 0.01613 + 0.01639 = 0.03252
doc_F: 1/(60+1) + 1/(60+3) = 1/61 + 1/63 = 0.01639 + 0.01587 = 0.03226
doc_E: 0       + 1/(60+2) = 0 + 1/62      =                    0.01613
doc_C: 1/(60+3) + 0        = 1/63 + 0     =                    0.01587
doc_B: 1/(60+4) + 0        = 1/64 + 0     =                    0.01563
doc_D: 0        + 1/(60+4) = 0 + 1/64     =                    0.01563

Final ranking: doc_A > doc_F > doc_E > doc_C > doc_B = doc_D
```

**(b) Why doc_A wins**

doc_A has consensus: it is top-2 in BM25 AND top-1 in vector. It appears high in both lists. doc_F is top-1 in BM25 but only top-3 in vector — good BM25 score but the semantic retriever ranks it lower. RRF rewards consistency across sources.

**(c) Weighted sum (alpha=0.7)**

```
score_A = 0.7 * 0.92 + (1-0.7) * 0.80 = 0.644 + 0.240 = 0.884
score_F = 0.7 * 0.60 + (1-0.7) * 0.95 = 0.420 + 0.285 = 0.705
```

doc_A wins (0.884 > 0.705). With alpha=0.7 more weight goes to the vector retriever, and doc_A is best in that dimension.

**(d) RRF vs weighted sum**

**Correct answer: B**

RRF operates on ranks, not scores. It is the right choice when different retrievers have incompatible score scales (BM25 can produce 0-20+ while cosine is 0-1). Adding those numbers directly is incorrect. Weighted sum works well when both are already normalized to the same scale (0-1).

**(e) The RRF bug**

The bug is that `enumerate` starts at rank=0, but RRF uses `1/(k + r)`. With r=0 the first document gets `1/(60+0) = 1/60` instead of `1/(60+1) = 1/61`. The first element gets an artificially high score.

Fix:
```python
for rank, doc_id in enumerate(bm25_results, start=1):  # ← start=1
    scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
```

Also missing handling when a doc appears in both lists (the code does handle it with `get(..., 0)`), so that aspect is fine.

---

## Exercise 16 · Reranker and hard filters

**(a) Guaranteeing plan isolation**

**Correct answer: C** — `hardFilters: ["plan"]` in `retrieval.vector`.

Why the other options fail:

- **A (prompt instruction):** LLMs can "forget" instructions in long prompts, reason that another plan is "close" or "applicable by analogy", or simply not follow the instruction 100% consistently. In a regulated clinical environment (HIPAA, insurance law), failure probability must be structurally zero.

- **B (LLM post-processing):** If incorrect chunks already reached the LLM, the damage is done — the model already read them and they may influence its answer even if output is later "filtered". Filtering must happen before retrieval.

- **D (reminder at the end):** Same as A but worse — it is at the end of the prompt where the model pays less attention.

The hard filter is a `WHERE` clause in the SQL/vector query. The LLM never receives chunks from the wrong plan because they are never retrieved.

**(b) Reranker choice**

**Latency budget:** retrieval=300ms + LLM=400ms = 700ms already used. 100ms remain.

- BGE-reranker local (~100ms over 20 docs): right at the limit. If the reranker hits 120ms in production, the target is exceeded.
- Cohere API (~200ms): exceeds budget by 200ms. Not viable.
- No reranker: meets latency but sacrifices precision.

The correct choice is **local BGE-reranker** with active latency monitoring, and as an alternative, **reduce retriever topK to 10 docs** (instead of 20) so the reranker is faster (~50-70ms). If it still does not meet target, `FlashRank` (~20ms) is the ultra-fast alternative.

**(c) Cross-encoder advantage**

**Correct answer: B**

The bi-encoder encodes the query without seeing the document and vice versa. The vector for "límite de torque del actuador" is the same regardless of which documents are in the corpus. The cross-encoder sees BOTH together and can detect that "torque del tren de morro" is more specific than "torque del tren principal" for that particular query. This contextual interaction is what gives the precision improvement.

- A is incorrect: the cross-encoder is slower, not faster.
- C is incorrect: the cross-encoder is impractical for large corpora (does not scale).
- D is not a distinctive advantage; both can run on CPU.

**(d) With and without hardFilter**

**Without hardFilter:**
```
System returns: chunk_A, chunk_B, chunk_C (all three, ordered by similarity)
LLM may use chunk_C (PPO-Platinum: "aprobación automática")
Likely answer: "Se aprueba automáticamente"
Consequence: PPO-Basic patient receives approval they are not entitled to → 
              insurance fraud + regulatory risk
```

**With hardFilter plan="PPO-Basic":**
```
WHERE plan = 'PPO-Basic' before search
System returns: only chunk_A
LLM uses chunk_A: "diagnóstico M23.x, 4 semanas tratamiento conservador"
Answer: "Se aprueba si M23.2 confirmado y 4 semanas de tratamiento conservador"
Consequence: correct by design
```

**(e) feedbackRef in retrieval.reranker**

The `feedbackRef` field points to an `observability.feedback` store where user `thumbs_up/thumbs_down` signals are stored. The reranker uses these signals in periodic fine-tuning (outside the real-time flow): fragments that received more `thumbs_up` are used as positive examples to adjust cross-encoder model weights. Result: the reranker improves continuously with real usage without manual data labeling.

---

## Exercise 17 · Multi-index routing and query ops

**(a) Query routing**

| Query | Index | Keyword/Intent |
|-------|--------|----------------|
| "¿Puedo cambiar mi vuelo con tarifa Basic?" | tarifas | keyword "tarifa" + keyword "cambio" (but "tarifa" is more specific) |
| "¿Cómo proceso un rebooking de grupo de más de 10 pasajeros?" | procedimientos | keyword "proceso", "rebooking" → intent: operational procedure |
| "¿Qué dice la regulación sobre reembolsos por vuelo cancelado?" | regulaciones | keyword "regulación" |
| "Necesito cambiar la fecha a un cliente Business, ¿qué pasos sigo?" | procedimientos | keyword "pasos", "cómo" → intent: step-by-step guide |
| "¿Hay algún límite legal para el equipaje de mano?" | regulaciones | keyword "legal", "límite" → intent: regulatory |

Note: query 1 could route to "tarifas" or "procedimientos" depending on design. The most specific keyword is "tarifa", so "tarifas" is the best choice. If the router detects both keywords ("tarifa" and "cambio"), it should prioritize the more specific one or have a precedence rule.

**(b) Risk without query rewriting**

**Correct answer: D** — both risks are real.

"cosita de lítio" has a very different embedding from "batería de litio portátil" — it probably resembles "objeto extraño" or "cosa de plástico" more. The vector store will return incorrect results.

Also, the keyword-based router will not find any known keyword in "cosita de lítio" and may fall back or route incorrectly.

The query rewriter, with its corporate glossary, would convert "cosita de lítio" → "batería de litio portátil equipaje cabina" before any search.

**(c) query.intent Decision port**

**Correct answer: B**

The `Decision` port lets you build a graph that branches by intent: if `intent == no_accionable`, a branch ends the flow without invoking RAG (avoiding unnecessary latency and cost). If intent is actionable, it continues to the retrieval pipeline. The `Query` port is the query (possibly modified with the intent label) for the next step.

**(d) Router bug**

The test output is `"tarifas"` for the query `"¿cuál es la tarifa de cambio de vuelo?"`.

The problem: keyword `"tari"` (prefix of "tarifa") matches first in the list before "cambio". The query contains "tarifa de **cambio** de vuelo" — it should route to "procedimientos" for "cambio", but "tari" matches first.

There are two fix approaches:
1. **Sort by specificity:** put longer/more specific keywords first.
2. **Remove unnecessary prefixes:** if you already have "tarifa", you do not need "tari".
3. **Precedence logic:** count how many keywords from each index appear and use the majority.

Minimal fix: remove the `"tari"` rule (redundant with `"tarifa"`) and sort keywords by descending length.

**(e) Embeddings vs LLM for intent classification**

**Correct answer: C**

Intent classification is a lightweight task: map text to a label from a small set (3-5 classes). Lightweight embeddings (small sentence-transformers) solve it in ~5-10ms. A general LLM takes 500-2000ms. With a 1.5 second end-to-end latency target and the synthesis LLM already using ~500-700ms, there is no room for slow classification. Embeddings are the right tool for this pipeline stage.

---

## Exercise 18 · GraphRAG and integrated design

**(a) When GraphRAG adds more**

**Correct answer: B**

Maintenance manuals with AD → SB → Task form an explicit dependency graph queried frequently. The question "what tasks must I do for this directive?" requires relation traversal, not just semantic similarity.

- A (independent news): no relations between documents. Vector RAG is enough.
- C (FAQ): independent items. Vector RAG is simpler and more effective.
- D (movie recommendation): based on text similarity, not structural relations.

**(b) Traversal with hops: 2**

```
Starting point (vector search): 
  → finds [AD-2024-0023] (directive node)

Hop 1 (follow outgoing relations):
  AD-2024-0023 -[:AFECTA_A]-> SB-2023-32-001

Hop 2 (follow outgoing relations from hop 1):
  SB-2023-32-001 -[:REQUIERE]-> Task-32-11-001
  Task-32-11-001 -[:ES_PREREQUISITO_DE]-> Task-07-11-001

Returned nodes:
  [AD-2024-0023, SB-2023-32-001, Task-32-11-001, Task-07-11-001]

Answer to technician:
  "For AD-2024-0023 you must execute:
   Task-32-11-001 (Landing gear inspection)
   Task-07-11-001 (Aircraft jacking) — prerequisite"
```

With `hops: 1` it would only return AD-2024-0023 and SB-2023-32-001, missing the concrete tasks.

**(c) Design for the law firm**

| Question | Strategy | Justification |
|---------|-----------|---------------|
| "¿Qué contratos con cláusula de indemnización ilimitada hemos firmado con proveedores de IT?" | Vector RAG + hard filters (tipo_proveedor=IT, tipo_clausula=indemnización) | Semantic search over a text corpus. Contracts do not have complex relations between them; you only need metadata filtering. |
| "¿Hay precedentes de cláusulas de penalización que hayamos negociado exitosamente?" | Vector RAG over precedents index, with filter outcome=exitoso | Semantic search over precedents corpus. No graph relations needed. |
| "¿La cláusula 12.3 de este contrato es coherente con política interna y normativa vigente?" | Hybrid: vector multi-index (playbook + regulations) + routing | You need to search two distinct indexes and compare them. Template 05 (Legal) implements exactly this with multi-index + router + reranker. GraphRAG would be useful if relations between playbook rules and regulation articles were explicitly modeled (e.g. "playbook §4.2 implements regulation Art. 18"). If not modeled, multi-index is enough. |

**(e) Retrieval pipeline for pharmaceutical**

```
PROPOSED DESIGN:

Indexes (store.multi-index):
  fichas_tecnicas   → drug information by product + country
  estudios          → clinical evidence, side effects + country
  normativa         → FDA/EMA regulations by country
  guias             → prescribing guidelines by country + speciality

Hard filters (on all retrieval.vector):
  hardFilters: ["country"]      ← non-negotiable, safety guardrail

Query ops pipeline:
  io.input (physician message)
    ↓
  query.intent                  ← gate: is it an actionable medical question?
    ↓ (if actionable)
  query.rewrite                 ← normalize generic ↔ brand names
    ↓                             (e.g. "ibuprofeno" ↔ "Advil/Nurofen/...")
  retrieval.router              ← by intent: comparison → fichas+estudios
    ↓                              contraindications → fichas+guias
    ↓                              regulation → normativa
  retrieval.hybrid (alpha=0.4)  ← more BM25 weight: exact drug names
    + hardFilters: ["country"]
    ↓ (top-20 candidates)
  retrieval.reranker (BGE, topN=5) ← precision for medical questions
    ↓ (top-5 precise)
  logic.prompt + logic.citations (enforce)
    ↓
  io.output

Justification for alpha=0.4 (more BM25):
  Drug names are exact identifiers
  ("metformina 850mg" has no useful semantic variants)
  BM25 captures these exact matches better

Note on latency (< 2s):
  intent: ~10ms, rewrite: ~5ms, hybrid retrieval: ~80ms,
  BGE reranker (20→5): ~120ms, LLM: ~800-1200ms
  Total: ~1.0-1.4s — within target
```

---

## Exercise 19 · LangChain: EnsembleRetriever and RRF mapping

**(a) Completed code**

```python
ensemble = EnsembleRetriever(
    retrievers=[bm25, vector],
    weights=[0.4, 0.6],
)
```

Justification for `weights=[0.4, 0.6]`: in an airline call center there is a mix of exact jargon ("tarifa Basic", "sin cargo") and natural language ("¿puedo cambiar mi vuelo?"). **More weight on vector (0.6)** captures semantic intent, but BM25 stays relevant (0.4) for exact policy terms. These weights **are not** the weighted-sum `alpha` from §4 — they do not multiply BM25×0.4 + cosine×0.6. They influence RRF tiebreaking when a document appears in only one list.

If the domain were exact ATA codes only, you would use `[0.7, 0.3]` (more BM25, consistent with the §4 table).

**(b) RRF equivalence**

**Correct answer: B**

`EnsembleRetriever` uses RRF with `c=60`, identical to the `k=60` in your scratch formula `1/(k+rank)`. `weights` do not replace `c`; they only adjust relative retriever contribution when a document appears in a single fused list.

- A is incorrect: `weights` and `c` are independent parameters.
- C is incorrect: fusion is RRF by ranks, not score sum.
- D is incorrect: RRF exists precisely because scales are incompatible.

**(c) Effect of `bm25.k=3` vs `vector k=9`**

BM25 only contributes 3 positions to the RRF score; vector contributes 9. Documents the vector finds only in positions 4-9 get RRF score from vector but **zero** from BM25. Fusion becomes **asymmetric** — vector dominates more than weights suggest.

In the lab we used `k=9` for both because the corpus has exactly 9 documents: we want both retrievers to see the full corpus and RRF to fuse comparable rankings. In production with a large corpus, typically `k=20` for both in the ensemble, and the reranker trims to `top_n=3`.

**(d) One-line correspondence**

`rrf_fusion(bm25_rank, vector_rank, k=60)` → `EnsembleRetriever(retrievers=[bm25, vector], weights=[0.4, 0.6])` with internal RRF `c=60`.

---

## Exercise 20 · LangChain: predict order after the reranker

**(a) Top-3 after reranker**

The cross-encoder **reorders by its own score**, not by ensemble position:

```
Rank 1: pol_008  (0.91)
Rank 2: pol_005  (0.78)
Rank 3: pol_002  (0.35)
```

Order **does not change** relative to the ensemble in this case — the ensemble's top three are already the reranker's three highest scores. But the reason for order changes: now it is joint query↔doc relevance (§5), not RRF consensus.

pol_003 and pol_001 are out because `top_n=3`.

**(b) Does the reranker fix the domain problem?**

**No.** The reranker optimizes **textual relevance** of the query to the document, not **permissibility** by `fare_class`. The query asks for "cambios sin cargo" and `pol_008` (Top) answers exactly that — the cross-encoder scores it high (0.91). The reranker **reinforces** domain noise, it does not remove it.

The hard filter (§7) must be applied **before** any retriever. The reranker only improves precision within the candidate set you already retrieved — if that set includes wrong fares, the reranker may rank them first.

**(c) `top_n=3` with ensemble `k=3`**

The reranker receives at most **3 candidates** (what the ensemble returns). It can reorder those 3 but **cannot** bring back documents the ensemble did not retrieve. Implication: set high `k` on BM25 and vector (9-20) for high recall in the ensemble, and let the reranker trim to `top_n=3` with high precision (§5, §13.8).

**(d) Role of ContextualCompressionRetriever**

**Correct answer: B**

`ContextualCompressionRetriever` wraps a `base_compressor` (here, the reranker) over a `base_retriever` (the ensemble). It receives candidates from the base retriever, reorders/trims them, and returns the final result.

- A describes LLM compression (another use of the same wrapper, not the lab's).
- C is `EnsembleRetriever`'s job, not the compression retriever's.
- D is hard filter — must go before the pipeline, not in this component.

---

## Exercise 21 · LangChain: find the hard filter bug

**(a) Why the filter fails**

The `filter={"fare_class": fare_class}` in Chroma's `search_kwargs` **only applies to the vector retriever**. `bm25_retriever` remains indexed over the **full 9 documents** (Basic, Plus, Top). In RRF fusion, `pol_008` (Top) enters via BM25 with high score — the query contains "cambios" and "sin cargo adicional", terms that match Top's text perfectly. The filtered vector does not return it, but BM25 does, and RRF includes it in the final result.

**(b) Minimal fix**

Rebuild **both** retrievers over the filtered corpus:

```python
def crear_retriever_filtrado(fare_class: str):
    docs_filtrados = [d for d in documentos if d.metadata["fare_class"] == fare_class]

    bm25_filtrado = BM25Retriever.from_documents(docs_filtrados)
    bm25_filtrado.k = len(docs_filtrados)

    vector_filtrado_store = Chroma.from_documents(docs_filtrados, embeddings)
    vector_filtrado = vector_filtrado_store.as_retriever(
        search_kwargs={"k": len(docs_filtrados)}
    )

    ensemble_filtrado = EnsembleRetriever(
        retrievers=[bm25_filtrado, vector_filtrado],
        weights=[0.4, 0.6],
    )
    return ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble_filtrado,
    )
```

You must rebuild **2 base retrievers** (BM25 + vector) + ensemble + compression retriever = 4 pieces. Filtering Chroma alone is not enough.

**(c) Correct strategy for healthcare**

**Correct answer: B**

Filtering `Document` before building BM25 and Chroma is equivalent to `hardFilters: ["plan"]` in RAGorbit: the LLM never receives chunks from another plan because they are never indexed/retrieved.

- A leaves BM25 unfiltered → guaranteed noise (this exercise's bug).
- C is soft filter — the LLM can ignore it (§7).
- D is post-filtering — damage already occurred when the LLM read incorrect chunks.

**(d) Comparison table**

| Strategy | BM25 filtered? | Vector filtered? | Possible noise? |
|------------|-----------------|-------------------|-----------------|
| Scratch: `filtrar CORPUS` at start | Yes (corpus already reduced) | Yes (corpus already reduced) | No |
| LangChain B: filter `Document` before `.from_documents()` | Yes | Yes | No |
| LangChain A: Chroma `filter` only | **No** (BM25 still on full corpus) | Yes | **Yes** — docs from other fares/plans via BM25 |

# M4 · Advanced retrieval and query ops exercises

> Exercises 14–21. No answers — see `soluciones.md`.
> Types: reasoned multiple choice (MC), predict the output (PO), find the bug (FB), choose the technology (CT).

---

## Exercise 14 · BM25: understanding the formula

**Type: reasoned multiple choice + calculation**

You have a corpus of **4 documents** on aircraft maintenance:

```
doc_1: "inspección del tren de aterrizaje principal"
doc_2: "tren de aterrizaje principal: procedimiento de inspección detallado"
doc_3: "cambio de aceite del motor"
doc_4: "inspección de frenos y tren de aterrizaje"
```

The query is: `"inspección tren"`

**BM25 parameters:** k1=1.5, b=0.75. Lengths: doc_1=5 tokens, doc_2=7 tokens, doc_3=5 tokens, doc_4=6 tokens. avgdl=5.75.

**(a)** The term "inspección" appears in documents 1, 2, and 4. The term "tren" appears in documents 1, 2, and 4. With N=4 documents, compute the IDF of both terms using the formula:

```
IDF(t) = log((N - n_t + 0.5) / (n_t + 0.5) + 1)
```

Where `n_t` is the number of documents containing term `t`.

**(b)** Without computing full BM25, rank the 4 documents from most to least relevant and justify your answer intuitively.

**(c)** Why might doc_2 not be the most relevant despite being the longest and containing both terms?

**(d)** (Multiple choice) The `b=0.75` parameter in BM25:

   A) Increases the score of long documents proportionally to their length
   B) Applies partial length normalization, moderately penalizing documents longer than average
   C) Completely removes document length from the score
   D) Applies only if the document is more than twice the average length

**(e)** (Multiple choice) What happens if you set `k1=0` in BM25?

   A) Only whether the term appears matters (binary presence), not how many times
   B) The score becomes exactly pure TF
   C) BM25 stops working (division by zero)
   D) Documents shorter than average are ignored

---

## Exercise 15 · Hybrid retrieval and fusion

**Type: predict the output + reasoning**

You have a BM25 retriever and a vector retriever. For the query "¿cuánto cuesta el plan familiar?", each returns (in relevance order):

```
BM25:   [doc_F, doc_A, doc_C, doc_B]
Vector: [doc_A, doc_E, doc_F, doc_D]
```

**(a)** Compute RRF scores for all documents that appear in at least one list, using k=60. Order the final result.

**(b)** Which document wins in the fused ranking and why does it have more "consensus" than doc_F?

**(c)** Now consider weighted-sum fusion with alpha=0.7 (more weight on vector):

```
Normalized BM25 scores:   doc_F=0.95, doc_A=0.80, doc_C=0.50, doc_B=0.30
Normalized vector scores: doc_A=0.92, doc_E=0.75, doc_F=0.60, doc_D=0.40
```

Compute the fused score for doc_A and doc_F. Which wins?

**(d)** (Multiple choice) When would you prefer RRF over normalized weighted sum?

   A) When BM25 and vector retriever scores are on the same scale (0-1)
   B) When retrievers use different score scales (BM25 can be 0-25, cosine is 0-1)
   C) When you want to give one retriever precise extra weight
   D) When the corpus has fewer than 100 documents

**(e)** (Find the bug) The following code implements RRF. What is wrong?

```python
def rrf_fusion(bm25_results, vector_results, k=60):
    scores = {}
    for rank, doc_id in enumerate(bm25_results):      # rank starts at 0
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    for rank, doc_id in enumerate(vector_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.keys(), key=lambda d: scores[d], reverse=True)
```

---

## Exercise 16 · Reranker and hard filters

**Type: choose the technology + reasoned multiple choice**

A hospital is building a RAG system over clinical guidelines. Requirements:

- The answer must contain only criteria from the patient's insurance plan.
- The system has a target latency of < 800ms end-to-end.
- There are 3 distinct plans: PPO-Basic, PPO-Gold, PPO-Platinum.
- The embedding model is text-embedding-3-large.
- The corpus has 50,000 indexed chunks.

**(a)** (Choose the technology) To guarantee a PPO-Basic patient does not see PPO-Platinum criteria, which option would you use?

   A) System prompt instruction: "Only use information from the PPO-Basic plan"
   B) Post-processing: filter chunks returned by the LLM before showing them to the user
   C) `hardFilters: ["plan"]` in `retrieval.vector`
   D) Add at the end of the prompt: "Remember to use only the correct plan"

Justify why the other three options are insufficient for a regulated clinical environment.

**(b)** For the reranker, the team evaluates three options:

   - **Option 1:** BGE-reranker-v2 (local, ~100ms over 20 docs)
   - **Option 2:** Cohere Rerank v3 API (~200ms, pay per use)
   - **Option 3:** No reranker, top-5 directly from the vector store

With target latency of 800ms and the system already using 300ms on retrieval + 400ms on the LLM, which option would you choose and why?

**(c)** (Multiple choice) A cross-encoder scores the query and each document **together** (concatenated). What concrete advantage does it have over a bi-encoder that generates a vector separately?

   A) It is faster because it processes in parallel
   B) It can capture interactions between query and document terms that the bi-encoder does not see
   C) It works better for corpora of more than 1 million documents
   D) It does not require a GPU to run

**(d)** (Predict the output) Given this scenario:

```
Corpus:
  chunk_A: "Criterios RM rodilla PPO-Basic: diagnóstico M23.x, 4 semanas tratamiento conservador"
  chunk_B: "Criterios RM rodilla PPO-Gold: diagnóstico M23.x, sin requisito de tiempo"
  chunk_C: "Criterios RM rodilla PPO-Platinum: aprobación automática para M23.x"

Query: "¿Se aprueba RM de rodilla para diagnóstico M23.2?"
Patient: PPO-Basic plan
```

What does the system return WITH hardFilter and WITHOUT hardFilter? What is the consequence of the difference?

**(e)** The `retrieval.reranker` node in RAGorbit has a `feedbackRef` field. Explain in 3 sentences what it is for and how it connects to `observability.feedback`.

---

## Exercise 17 · Multi-index routing and query ops

**Type: design + multiple choice + find the bug**

An airline wants to build its call center agent system. It has 3 knowledge bases:
- `tarifas`: fare conditions, baggage, changes by class
- `procedimientos`: step-by-step customer service protocols
- `regulaciones`: applicable civil aviation regulations

**(a)** (Design) An agent receives the following queries. For each, indicate which index you would route to and which keyword or intent you would detect:

1. "¿Puedo cambiar mi vuelo con tarifa Basic?"
2. "¿Cómo proceso un rebooking de grupo de más de 10 pasajeros?"
3. "¿Qué dice la regulación sobre reembolsos por vuelo cancelado?"
4. "Necesito cambiar la fecha a un cliente Business, ¿qué pasos sigo?"
5. "¿Hay algún límite legal para el equipaje de mano?"

**(b)** (Multiple choice) A passenger says: "oye mi maleta lleva la cosita esa de lítio de la laptop, ¿puedo meterla en la bodega?". Without query rewriting, what is the risk?

   A) Vector retrieval will fail because the vector of "cosita de lítio" is not similar to the vector of "batería de litio portátil"
   B) The router will never find the correct keyword in "cosita de lítio" and may route incorrectly
   C) The LLM will receive the unnormalized query but can infer the meaning
   D) Both A and B are real risks

**(c)** (Multiple choice) The `query.intent` node in RAGorbit produces two output ports: `Query` and `Decision`. What is the `Decision` port for?

   A) It only routes the query to the correct index
   B) It allows branching the flow: if intent is no_accionable, the flow can end without invoking RAG
   C) It contains the rewritten query
   D) It is used to authenticate the user

**(d)** (Find the bug) This multi-index router has a subtle problem:

```python
rules = [
    {"keyword": "tari",      "index": "tarifas"},
    {"keyword": "tarifa",    "index": "tarifas"},
    {"keyword": "cambio",    "index": "procedimientos"},
    {"keyword": "regulacion","index": "regulaciones"},
]

def route(query: str, rules: list, fallback: str) -> str:
    query_lower = query.lower()
    for rule in rules:
        if rule["keyword"] in query_lower:
            return rule["index"]
    return fallback

# Test:
print(route("¿cuál es la tarifa de cambio de vuelo?", rules, "tarifas"))
```

What is the test output and why is it incorrect? How do you fix it?

**(e)** (Multiple choice) In template 07 (Telecom), `model.intent` uses `backend: embeddings` (lightweight embeddings) instead of an LLM for intent classification. Why?

   A) LLMs cannot classify text
   B) Embeddings are more accurate for intent classification
   C) Lightweight embeddings classify in ~5-10 ms vs ~500-2000 ms for an LLM, meeting the < 1.5s latency target
   D) LLMs can only be used for generation, not classification

---

## Exercise 18 · GraphRAG and integrated design

**Type: conceptual + design + multiple choice**

**(a)** (Multiple choice) In which of these cases does GraphRAG clearly add more than vector RAG?

   A) A corpus of independent news articles on different topics
   B) A maintenance manual corpus where airworthiness directives (AD) reference service bulletins (SB) that in turn reference interdependent tasks (Task)
   C) An FAQ knowledge base with independent Q&A items
   D) A movie recommendation system based on text descriptions

**(b)** Given this graph fragment in Neo4j (Cypher notation):

```cypher
(ad:Directive {id:"AD-2024-0023", type:"airworthiness"})
  -[:AFECTA_A]->
(sb:Bulletin {id:"SB-2023-32-001", ata_chapter:"32"})
  -[:REQUIERE]->
(task:Task {id:"Task-32-11-001", title:"Landing gear inspection"})
  -[:ES_PREREQUISITO_DE]->
(task2:Task {id:"Task-07-11-001", title:"Aircraft jacking"})
```

A technician asks: "¿Qué tareas debo hacer por la AD-2024-0023?". Describe the traversal `retrieval.graph` would perform with `hops: 2` and which nodes it would return.

**(c)** (Design) A law firm has a corpus with:
   - Signed contracts (thousands)
   - Internal clause playbook (hundreds of rules)
   - Applicable regulations (hundreds of articles)
   - Precedents: prior contracts with known resolution

Lawyers ask questions like:
- "¿Qué contratos con cláusula de indemnización ilimitada hemos firmado con proveedores de IT?"
- "¿Hay precedentes de cláusulas de penalización que hayamos negociado exitosamente?"
- "¿La cláusula 12.3 de este contrato es coherente con nuestra política interna y la normativa vigente?"

For each question, indicate whether you would prefer vector RAG, GraphRAG, or a combination, and justify.

**(d)** (Multiple choice) Template 05 (Legal) does not use `store.neo4j` but `store.multi-index` with `retrieval.router`. When would it be valid to replace it with `store.neo4j` and `retrieval.graph`?

   A) Whenever there are more than 3 indexes
   B) When relations between documents (contract → playbook → regulation) are sufficiently explicit and frequently queried by traversal
   C) When the corpus has more than 10,000 documents
   D) When LangChain is used instead of LlamaIndex

**(e)** (Integrated design — complex case) A pharmaceutical company wants a RAG system over its regulatory documentation. Requirements:
   - Corpus: 200,000 chunks of drug datasheets, clinical studies, FDA/EMA regulations, and prescribing guidelines
   - Users: prescribing physicians asking in natural language
   - Critical constraint: a physician can only see information for the country where they practice (filter by `country`)
   - Target latency: < 2 seconds
   - Frequent questions include: compare two drugs, drug interactions, contraindications for specific patient profiles

   Design the full retrieval pipeline indicating which RAGorbit nodes you would use, in what order, and why. Include: indexes, filters, reranker, and any necessary query ops steps.

---

## Exercise 19 · LangChain: EnsembleRetriever and RRF mapping

**Type: complete the code + reasoned multiple choice**

You implemented `rrf_fusion()` in scratch (M4 lab) and now want the LangChain equivalent. You have:

```python
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

bm25 = BM25Retriever.from_documents(documentos)
bm25.k = 9
vector = vector_store.as_retriever(search_kwargs={"k": 9})

# TODO: complete
ensemble = EnsembleRetriever(
    retrievers=[_____, _____],
    weights=[_____, _____],
)
```

The domain is an airline call center: queries mix exact jargon ("tarifa Basic", "sin cargo") with natural language ("¿puedo cambiar mi vuelo?").

**(a)** Complete `retrievers` and `weights`. Justify why you chose those weights (hint: they are not the weighted-sum `alpha` from §4).

**(b)** (Multiple choice) `EnsembleRetriever` fuses with RRF using `c=60`. What is the equivalence with your scratch?

   A) `weights` replace `c` — if you set `[0.9, 0.1]` the effective c changes to 6
   B) `c=60` is the same `k=60` as `1/(k+rank)` in your `rrf_fusion()`; `weights` only break ties for docs appearing in a single list
   C) `EnsembleRetriever` does not use RRF; it does weighted sum of BM25 and cosine scores
   D) `weights` directly multiply BM25 and vector scores before summing

**(c)** If you change `bm25.k = 3` but leave `vector` with `k=9`, what effect does that have on RRF fusion? Why did we use `k=9` for both in the lab?

**(d)** Write in one line the correspondence: `rrf_fusion(bm25_rank, vector_rank, k=60)` → `EnsembleRetriever(...)`.

---

## Exercise 20 · LangChain: predict order after the reranker

**Type: predict the output + reasoning**

A LangChain pipeline (without hard filter) returns these candidates from `EnsembleRetriever` for the query `"cambios sin cargo adicional"`:

```
Position after ensemble (RRF order):
  1. pol_008  (Top,   "cambios ilimitados sin cargo adicional")
  2. pol_005  (Plus,  "un cambio sin cargo adicional hasta 24h")
  3. pol_002  (Basic, "no se permiten cambios de vuelo")
  4. pol_003  (Basic, reembolsos)
  5. pol_001  (Basic, equipaje)
```

`CrossEncoderReranker` with `top_n=3` scores each (query, document) pair and reorders. Simulated cross-encoder scores:

```
pol_008: 0.91   (query asks for "sin cargo" → Top doc promises it explicitly)
pol_005: 0.78   (similar but Plus, not unlimited)
pol_002: 0.35   (Basic doc denies changes — low relevance for that query)
pol_003: 0.12
pol_001: 0.08
```

**(a)** Predict the top-3 **after** `CrossEncoderReranker`. Does it change relative to the ensemble?

**(b)** A **Basic** passenger asks the query. Does the reranker "fix" the domain problem? Why or why not? Relate to §7.

**(c)** If you configure `CrossEncoderReranker(..., top_n=3)` but `ensemble_retriever` only returns `k=3` candidates, what is the maximum number of documents the reranker can reorder? What implication does that have for pipeline design?

**(d)** (Multiple choice) What role does `ContextualCompressionRetriever` play in this pipeline?

   A) Compresses each document's text by removing irrelevant paragraphs with an LLM
   B) Wraps a `base_compressor` (reranker) over a `base_retriever` — reorders and trims output
   C) Fuses BM25 and vector automatically
   D) Applies hard metadata filters before search

---

## Exercise 21 · LangChain: find the hard filter bug

**Type: find the bug + choose the technology**

A student implemented the hard filter like this (trying to save memory by reusing the full BM25 index):

```python
def crear_retriever_con_filtro_chroma(fare_class: str):
    vector_filtrado = vector_store.as_retriever(
        search_kwargs={"k": 9, "filter": {"fare_class": fare_class}}
    )
    # Reuses bm25_retriever from the FULL corpus (9 docs)
    ensemble = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_filtrado],
        weights=[0.4, 0.6],
    )
    return ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble,
    )

docs = crear_retriever_con_filtro_chroma("Basic").invoke(QUERY)
# QUERY = "¿puedo hacer cambios sin pagar cargos adicionales?"
```

The student expects only `fare_class=Basic` documents, but the top-3 still includes `pol_008` (Top).

**(a)** Explain why the filter fails: which retriever in the ensemble ignores Chroma's `filter`?

**(b)** (Find the bug) Propose the minimal fix following the `crear_retriever_filtrado()` pattern in `lab/solucion_framework.py`. How many retrievers must be rebuilt?

**(c)** (Choose the technology) For a healthcare system with `hardFilters: ["plan"]` in RAGorbit, which strategy is equivalent and correct in LangChain?

   A) Only `filter` on Chroma for the vector retriever — ensemble BM25 can return other plans
   B) Filter the `Document` list before `BM25Retriever.from_documents()` and `Chroma.from_documents()`
   C) Add to the system prompt: "ignore documents from other plans"
   D) Post-filter LLM output removing incorrect citations

**(d)** Compare in a 3-row table: your scratch (`filtrar CORPUS`), LangChain strategy B, and strategy A (Chroma filter only). Columns: BM25 filtered? Vector filtered? Possible noise?

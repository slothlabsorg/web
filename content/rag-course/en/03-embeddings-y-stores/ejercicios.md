# M3 · Exercises — Embeddings and Vector Stores

> Exercises 14–21. No answers — see [`soluciones.md`](./soluciones.md).

---

## Exercise 14 — Manual cosine similarity calculation

Given the following simplified scenario, documents are represented with 3-dimensional vectors based on the frequency of three concepts: `[employment, benefit, loan]`.

```
doc_A = [2, 3, 0]   → "employee benefits policy"
doc_B = [0, 1, 4]   → "mortgage loan terms"
doc_C = [3, 2, 1]   → "employment contract and associated benefits"
query = [3, 3, 0]   → "benefits I have as an employee"
```

**a)** Calculate the cosine similarity between `query` and each of the three documents. Show the intermediate calculations (norm of each vector, dot product, final result).

**b)** Rank the documents from highest to lowest similarity with the query. Which would be the top-1?

**c)** Would the order change if you first normalized all vectors and used dot product instead of cosine similarity? Justify.

**d)** The team proposes replacing cosine similarity with L2 distance. Calculate `d(query, doc_A)`. Would the ranking change relative to cosine? When does this difference matter?

---

## Exercise 15 — Dimensions and normalization

**Reasoned multiple choice (select the best answer and justify in 2–3 lines):**

**15.a)** A team discovers that their embedding model returns vectors whose magnitude varies with text length (longer texts → vectors with larger norm). What is the main problem when using dot product as the metric?

```
A) Dot product does not work in high-dimensional spaces.
B) Longer texts will dominate the results even if they are not more semantically relevant.
C) Short texts can never appear in top-K.
D) Cosine similarity and dot product give exactly the same result in this case.
```

**15.b)** A data scientist has 1,536-dimensional OpenAI embeddings and 768-dimensional embeddings from a local model (nomic-embed-text). They want to know which to use. Which statement is correct?

```
A) Always use the higher-dimensional one because more dimensions = more information.
B) Always use the local one because it avoids API costs.
C) Evaluate on a representative dataset for the domain; dimension does not determine quality.
D) Use 768 dimensions because HNSW indexes are more efficient with lower dimensions.
```

**15.c)** Why do E5 and BGE models require prefixes like `"query: "` and `"passage: "` for asymmetric retrieval?

```
A) It is a technical requirement of the tokenizer; without the prefix the model fails with an error.
B) The prefixes are ignored; they are only a documentation convention.
C) The model was trained with these prefixes to distinguish the role of the text in the retrieval task; without them the embedding space is not calibrated for asymmetric search.
D) They are only required when the document exceeds 512 tokens.
```

---

## Exercise 16 — Vector indexes: intuition and trade-offs

**16.a)** "Choose the index":

For each scenario, indicate which index type (flat, IVF, HNSW, IVF+PQ) you would use and justify in 2–3 lines:

| Scenario | Chosen index | Justification |
|----------|--------------|---------------|
| Company FAQ system: 8,000 documents, latency < 200ms, accuracy critical (medical system) | | |
| E-commerce recommendation engine: 20 million products, latency < 50ms, recall > 90%, RAM limited to 8 GB | | |
| RAG pipeline in development: 50,000 documents, continuously updated with new documents every hour | | |
| Scientific catalog search: 2 million papers, latency < 100ms, no frequent updates | | |

**16.b)** An HNSW index is configured with `M=64, ef_construction=400`. A colleague suggests lowering to `M=16, ef_construction=100` to save memory. What are the consequences? In which situations is the change acceptable?

**16.c)** Predict the output: with `nprobe=1` in an IVF index, what happens with the following query?

```
Collection: 10,000 HR documents grouped into nlist=100 clusters.
Query: "vacation days in permanent contract"

Cluster C47 contains the most relevant documents about vacations.
Centroid of C47 is at distance 0.4 from the query.
Centroid of the nearest cluster (C12) is at distance 0.3 from the query,
but C12 contains only "personnel selection" documents.

With nprobe=1: only C12 is explored.
```

Does the system return the most relevant documents? How would you fix it?

---

## Exercise 17 — ChromaDB: operations and filters

**17.a)** Find the bug:

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("politicas")

collection.add(
    ids=["p1", "p2", "p3"],
    documents=[
        "Vacaciones: 15 días por año.",
        "Seguro médico: cobertura familiar.",
        "Home office: 2 días a la semana."
    ],
    metadatas=[
        {"categoria": "vacaciones", "año": 2024},
        {"categoria": "beneficios", "año": 2024},
        {"categoria": "horario", "año": 2024, "etiquetas": ["flexibilidad", "bienestar"]}
    ]
)

resultados = collection.query(
    query_texts=["¿puedo trabajar desde casa?"],
    n_results=2,
    where={"categoria": {"$contains": "horario"}}
)
```

There are two bugs. Identify them and propose the fix.

**17.b)** Upsert vs update vs add: for a monthly re-ingestion pipeline where documents may have been updated, modified, or be completely new, which operation would you use? Justify.

**17.c)** A team indexes HR policy documents and wants to retrieve only current ones (year >= 2024) in the "beneficios" category that contain the word "dental" in the text. Write the correct Chroma query.

**17.d)** Predict the output of the following code:

```python
import chromadb

client = chromadb.Client()
col = client.create_collection("test")

col.add(
    ids=["a", "b", "c"],
    documents=["python es un lenguaje", "java es tipado", "python tiene pandas"],
    metadatas=[{"lang": "python"}, {"lang": "java"}, {"lang": "python"}]
)

col.delete(where={"lang": "python"})

print(col.count())
```

---

## Exercise 18 — Choose the store

For each business brief, choose the most suitable vector store among: ChromaDB, FAISS, pgvector, Qdrant, Pinecone, Weaviate. Justify in 3–4 lines including at least one reason why you would rule out the other main options.

**18.a)** A legaltech startup is building its first case-law search MVP. The team has 2 engineers, no DevOps, ~500,000 documents, and wants to launch in 2 weeks. They are willing to pay a reasonable SaaS subscription.

**18.b)** A bank with strict data privacy regulation needs a vector store for search in customer documents. Data CANNOT leave their on-premise servers. They have 3 million documents, already operate a PostgreSQL cluster, and have a dedicated DBA.

**18.c)** A university ML lab is building a scientific article recommendation system. They have 50 million papers, compute resources (GPU and 128 GB RAM), and the team are researchers with numpy/C++ experience. They do not care about managing a database — they only want the fastest search possible.

**18.d)** An e-commerce platform needs semantic + text search (brands, exact SKUs) over an 8 million product catalog in 12 languages. Metadata filters are complex (price, category, brand, availability, rating). The team has Docker experience and can manage on-premise infrastructure.

**18.e)** "Predict the behavior": a team chooses FAISS for their e-commerce recommendation engine and after 3 months complain that "metadata filters don't work." Explain what they are experiencing and why FAISS is not the cause of the filter problem.

---

## Exercise 19 — sentence-transformers: from scratch to real embedding

**19.a)** In the scratch workshop, `embeder()` produces a 20-dimensional bag-of-words vector. In layer ③ you use `SentenceTransformer("BAAI/bge-base-en-v1.5").encode(texto, normalize_embeddings=True)`. What changes in each of these aspects? Justify in 1–2 lines each:

| Aspect | Scratch (`embeder`) | Framework (`encode`) |
|--------|---------------------|----------------------|
| Vector dimensions | | |
| Synonym capture ("vacaciones" ≈ "tiempo libre") | | |
| Who normalizes the vector | | |
| Dependencies (pip/network) | | |

**19.b)** Reasoned multiple choice:

A colleague writes this and complains that FAISS returns strange rankings:

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
embeddings = modelo.encode(textos)  # sin normalize_embeddings
index = faiss.IndexFlatIP(768)
index.add(embeddings.astype(np.float32))
```

What is the most likely problem?

```
A) BGE-base has 1024 dimensions, not 768.
B) IndexFlatIP requires normalized vectors for IP to equal cosine similarity; without normalization, long texts dominate the ranking.
C) FAISS does not support Hugging Face models.
D) You must use IndexFlatL2, not IndexFlatIP, with sentence-transformers.
```

---

## Exercise 20 — ChromaDB: predict output and convert distances

**20.a)** Predict what `collection.query(...)` returns in this scenario (without running code):

```python
import chromadb

client = chromadb.Client()
col = client.create_collection("test", metadata={"hnsw:space": "cosine"})

col.add(
    ids=["v1", "b1", "h1"],
    documents=[
        "15 dias de vacaciones al ano para empleados",
        "seguro medico dental y visual",
        "horario flexible dos dias remoto"
    ],
    embeddings=[
        [1.0, 0.0, 0.0],   # vector unitario simplificado
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0],
    ],
    metadatas=[
        {"categoria": "vacaciones"},
        {"categoria": "beneficios"},
        {"categoria": "horario"},
    ]
)

resultado = col.query(
    query_embeddings=[[1.0, 0.0, 0.0]],
    n_results=2,
    where={"categoria": "vacaciones"},
    include=["ids", "distances"]
)
```

Answer:
1. How many ids does `resultado["ids"][0]` return?
2. What is the id of the first result?
3. What is the value of `resultado["distances"][0][0]` (top-1 distance)?
4. What cosine similarity corresponds to that distance? (use `sim = 1 - dist/2`)

**20.b)** Complete the correct `where` for this query:

> "Retrieve documents in category `beneficios` or `vacaciones`, with `version >= 2024`, that contain the word `dental` in the text."

```python
resultados = collection.query(
    query_texts=["cobertura dental"],
    n_results=5,
    where=___COMPLETA_AQUI___,
    where_document=___COMPLETA_AQUI___
)
```

---

## Exercise 21 — FAISS: id→doc map and post-filtering bug

**21.a)** Why does FAISS need an external map `id_a_doc` (or equivalent) while ChromaDB does not? Explain in 3–4 lines what each one stores internally.

**21.b)** Find the bug in this post-filtering:

```python
import faiss
import numpy as np

# 100 docs: 5 de categoria "vacaciones", 95 de otras categorias
index = faiss.IndexFlatIP(768)
# ... index.add(embeddings) ...

filtro_categoria = "vacaciones"
query_vec = modelo.encode(["dias de permiso"], normalize_embeddings=True).astype(np.float32)

scores, indices = index.search(query_vec, k=3)  # solo pide 3

filtrados = []
for score, idx in zip(scores[0], indices[0]):
    doc = id_a_doc[idx]
    if doc["metadata"]["categoria"] == filtro_categoria:
        filtrados.append((score, doc))

print(f"Resultados con filtro: {len(filtrados)}")
```

The code prints `Resultados con filtro: 0` even though 5 vacation documents exist. Identify the bug and propose the minimal fix.

**21.c)** Predict the behavior: with 12 documents (as in the workshop) and filter `categoria=vacaciones` (3 docs), does requesting `k=3` in FAISS and filtering afterward work? And with 1 million documents where only 0.1% is "vacaciones"? Justify in both cases.

---

## Exercise type summary

| Exercise | Type | Core topic |
|----------|------|------------|
| 14 | Manual calculation | Cosine similarity, normalization, L2 |
| 15 | Reasoned multiple choice | Dimensions, normalization, asymmetric embeddings |
| 16 | Choose technology + predict output | Index types (flat/IVF/HNSW), trade-offs |
| 17 | Find the bug + predict output | ChromaDB CRUD, filters |
| 18 | Choose the store | Store comparison, business brief |
| 19 | Scratch→framework comparison + multiple choice | sentence-transformers, normalization |
| 20 | Predict output + complete code | Chroma query, distance→similarity, filters |
| 21 | Find the bug + predict behavior | FAISS id→doc map, post-filtering |

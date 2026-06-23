# Workshop M3 · Mini HR Policy Vector Store

## Business context

You are the only backend engineer at a 50-person startup. The HR director asks you to make the internal chatbot able to answer questions about company policies. You have the documents in `datos/` (12 fragments with metadata). There is no budget for external APIs or infrastructure — the prototype must run locally without installing anything.

Your goal is to build an **in-memory mini vector store** capable of:
1. Indexing the 12 documents with a deterministic toy embedding.
2. Answering a query by returning the **top-3 most similar documents** (cosine search).
3. Applying a **metadata filter by category** and comparing results with and without the filter.

---

## Available data

Folder `datos/`: 12 JSON files (`doc_01.json` … `doc_12.json`).

Each document has:
```json
{
  "id": "doc_01",
  "texto": "Los empleados tienen derecho a 15 días hábiles de vacaciones...",
  "metadata": {
    "categoria": "vacaciones",
    "tema": "tiempo libre",
    "version": "2024",
    "departamento": "todos"
  }
}
```

The categories present are: `vacaciones` (3 docs), `beneficios` (4 docs), `horario` (3 docs), `formacion` (2 docs).

---

## Task

### Part 1 — Deterministic toy embedding

Implement a function `embeder(texto: str) -> list[float]` that:
- Generates a 20-dimensional vector.
- Is **deterministic**: the same text always produces the same vector.
- Does not require pip or network.
- Suggested strategy: bag-of-words over a fixed vocabulary of 20 HR domain keywords.

### Part 2 — Index the documents

Load the 12 JSON files and build the store: a dictionary `{ id → { "vector": [...], "texto": ..., "metadata": {...} } }`.

Normalize the vectors before indexing.

### Part 3 — Top-K cosine query

Implement `buscar(query: str, k: int, filtro: dict | None) -> list[dict]`.

- Compute the query embedding.
- Normalize.
- Compute cosine similarity with all vectors in the store.
- If `filtro` is `{"categoria": "vacaciones"}`, only consider documents where `metadata["categoria"] == "vacaciones"`.
- Return the top-K with `{"id", "score", "texto"}`.

### Part 4 — Compare results

Run two searches with the same query:
```
Query: "días de permiso y descanso que tengo derecho"
```

- **Search A:** no filter, top-3
- **Search B:** with filter `{"categoria": "vacaciones"}`, top-3

Print both results. Does the top-1 change? Why?

---

## Tiered hints

**Hint 1 (vocabulary):** define a vocabulary of 20 words related to the domain:
```python
VOCAB = ["vacaciones", "dias", "permiso", "descanso", "festivo",
         "seguro", "medico", "beneficio", "bono", "salario",
         "horario", "jornada", "teletrabajo", "remoto", "extra",
         "formacion", "curso", "mentor", "restaurante", "ticket"]
```

**Hint 2 (bag-of-words):** vector `v[i]` counts how many times `VOCAB[i]` appears in the text (lowercased). If no vocabulary word appears in the text, the vector will be all zeros — treat it as a vector that cannot compete (similarity 0).

**Hint 3 (normalization):**
```python
import math
def normalizar(v):
    norma = math.sqrt(sum(x*x for x in v))
    if norma == 0:
        return v
    return [x / norma for x in v]
```

**Hint 4 (cosine):**
```python
def coseno(a, b):
    return sum(ai * bi for ai, bi in zip(a, b))
# Con vectores normalizados, el dot product ES la similitud coseno.
```

**Hint 5 (filter):** before computing similarities, build the candidate list:
```python
candidatos = [doc for doc in store.values()
              if filtro is None or doc["metadata"].get(filtro_campo) == filtro_valor]
```

---

## Success criteria

- The script runs with `python3 solucion_scratch.py` without installing anything.
- Without filter: top-1 must be a document in category `vacaciones` or similar (there are 3 in the corpus).
- With filter `vacaciones`: all 3 results are in category `vacaciones`.
- Scores are numbers between 0 and 1 (or very close), with 1 being perfect similarity.
- The script clearly prints both searches and the effect of the filter.

---

## Part 5 — Layer ③: ChromaDB + FAISS + sentence-transformers (guided task)

> **Prerequisite:** have completed and run layer ② (`solucion_scratch.py`).  
> **Required reading before starting:** [`../guia.md` §15](../guia.md#15-layer--explained-from-in-memory-dict-to-chromadb-faiss-and-sentence-transformers) (scratch→framework bridge) + [§8 ChromaDB](../guia.md#8-chromadb-in-depth-crud-operations) + [§9 FAISS](../guia.md#9-faiss-what-it-is-and-when-to-use-it).

This part **requires pip and network** (does not run in the course environment). Install first:

```bash
pip install chromadb faiss-cpu sentence-transformers
```

The first run will download the `BAAI/bge-base-en-v1.5` model (~440 MB).

### Objective

Write **your own version** of `solucion_framework.py` that does the same as the scratch solution but with real libraries:
1. Index the 12 JSON files in `datos/` with neural embeddings (BGE).
2. Search top-3 with the same workshop query, with and without filter `categoria=vacaciones`.
3. Implement both the ChromaDB **and** FAISS versions.
4. Compare results with the reference `solucion_framework.py`.

Do not copy the solution file wholesale — follow the hints in order and write each block yourself.

---

### Hint 1 — Install and load the model (replaces `embeder()`)

Read [guide §15.2](../guia.md#152-sentence-transformers-your-embeder-for-real).

```python
from sentence_transformers import SentenceTransformer

modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

# Prueba rápida:
vec = modelo.encode("dias de permiso", normalize_embeddings=True)
print(len(vec))  # debe ser 768
```

**Checkpoint:** why `normalize_embeddings=True`? (Hint: guide §3 + §15.6 gotchas.)

---

### Hint 2 — Load the 12 documents (same as scratch)

Reuse the scratch loading logic: iterate over `datos/doc_*.json` and build parallel lists `ids`, `textos`, `metadatas`.

```python
import json
from pathlib import Path

datos_dir = Path(__file__).parent / "datos"
ids, textos, metadatas = [], [], []
for archivo in sorted(datos_dir.glob("doc_*.json")):
    with open(archivo, encoding="utf-8") as f:
        doc = json.load(f)
    ids.append(doc["id"])
    textos.append(doc["texto"])
    metadatas.append(doc["metadata"])
```

**Checkpoint:** this is the equivalent of your `cargar_documentos()` — but now you will feed Chroma/FAISS instead of a `dict`.

---

### Hint 3 — Section A: write `demo_chromadb()` with ChromaDB

Read [guide §8](../guia.md#8-chromadb-in-depth-crud-operations) and the walkthrough [§15.5 blocks A](../guia.md#155-block-by-block-walkthrough-of-labsolucion_frameworkpy).

Implement in this order:

| Step | What to write | Key API | Scratch equivalent |
|------|---------------|---------|-------------------|
| A.1 | In-memory client | `chromadb.Client()` | `store = {}` |
| A.2 | Create collection with cosine metric | `get_or_create_collection(name=..., metadata={"hnsw:space": "cosine"})` | — |
| A.3 | Compute embeddings | `modelo.encode(textos, normalize_embeddings=True).tolist()` | `embeder()` + `normalizar()` |
| A.4 | Index | `collection.upsert(ids=..., documents=..., embeddings=..., metadatas=...)` | loop that fills `store[id]` |
| A.5 | Search without filter | `collection.query(query_texts=[query], n_results=3, include=[...])` | `buscar(query, 3, None)` |
| A.6 | Convert distance → similarity | `sim = 1 - dist / 2` | your `score` is already similarity |
| A.7 | Search with filter | `collection.query(..., where={"categoria": "vacaciones"})` | `buscar(query, 3, {"categoria": "vacaciones"})` |
| A.8 | (Optional) CRUD | `upsert` one doc, `delete` another, `count()` | scratch CRUD demo |

**Query to use (same as scratch):**
```
"dias de permiso y descanso que tengo derecho"
```

**Checkpoint:** print top-3 with similarity and category. With a real embedding, `doc_01` should rank higher than in scratch (where it had score 0).

---

### Hint 4 — Section B: write `demo_faiss()` with FAISS

Read [guide §9](../guia.md#9-faiss-what-it-is-and-when-to-use-it) and [§15.5 blocks B](../guia.md#155-block-by-block-walkthrough-of-labsolucion_frameworkpy).

Implement in this order:

| Step | What to write | Key API | Scratch equivalent |
|------|---------------|---------|-------------------|
| B.1 | Same embeddings | `modelo.encode(textos, normalize_embeddings=True)` | same as A.3 |
| B.2 | IP index + IDs | `IndexFlatIP(dim)` + `IndexIDMap` + `add_with_ids(vectors.astype(np.float32), ids)` | `store` with vectors |
| B.3 | External map | `id_a_doc = {i: docs[i] for i in range(len(docs))}` | metadata in each dict entry |
| B.4 | Search without filter | `index.search(query_vec, k=3)` | `buscar(query, 3, None)` |
| B.5 | Post-filtering | `search(k=12)` + filter by `metadata["categoria"]` in Python | `buscar` with manual filter |
| B.6 | (Optional) Persistence | `faiss.write_index` / `read_index` | does not exist in scratch |

**Important:** FAISS returns `scores` (= cosine similarity if you normalized), **not** distances like Chroma. Do not apply `1 - dist/2` here.

**Checkpoint:** do you get 3 results with filter `vacaciones`? If not, check that `k_extra` is large enough (with 12 docs, request all 12).

---

### Hint 5 — Compare with the reference solution

1. Run your script: `python3 mi_solucion_framework.py`
2. Open [`solucion_framework.py`](./solucion_framework.py) and compare block by block with [guide §15.5](../guia.md#155-block-by-block-walkthrough-of-labsolucion_frameworkpy).
3. Fill in this table in a comment or in a `comparativa.md` file:

| Aspect | Your ChromaDB | Your FAISS | Scratch (stdlib) |
|--------|---------------|------------|------------------|
| Top-1 without filter | ? | ? | doc_08 |
| Top-1 with vacaciones filter | ? | ? | doc_08 |
| doc_01 in top-3? | ? | ? | Yes, but score 0 |
| Approx. lines of code | ? | ? | ~150 |
| Filter: pre or post | pre | post | pre (manual) |

4. Read [`solucion.md`](./solucion.md) for the explanation of why Chroma is more natural for this case.

---

### Success criteria (layer ③)

- [ ] Your script imports `chromadb`, `faiss`, `sentence_transformers` without errors.
- [ ] You index the 12 documents with BGE-base (768 dims, normalized).
- [ ] ChromaDB: `query` without filter returns 3 results with interpretable similarity (`1 - dist/2`).
- [ ] ChromaDB: `query` with `where={"categoria": "vacaciones"}` returns only vacation docs.
- [ ] FAISS: search without filter returns 3 results with scores in [0, 1].
- [ ] FAISS: post-filtering returns 3 vacation docs (or you explain why not if `k_extra` is insufficient).
- [ ] You can explain in 3 sentences the difference between pre-filtering (Chroma) and post-filtering (FAISS).

---

## Optional extension (layer ② or ③)

If you finish early, add:
- Support for `where={"categoria": {"$in": ["vacaciones", "horario"]}}` (multiple categories).
- A function `actualizar(id, nuevo_texto, nueva_metadata)` that re-embeds and updates the store.
- Measure indexing and query time with `time.perf_counter()`.

---

*Scratch solution (stdlib):* [`solucion_scratch.py`](./solucion_scratch.py)  
*Framework solution (ChromaDB + FAISS):* [`solucion_framework.py`](./solucion_framework.py)  
*Explanation of both:* [`solucion.md`](./solucion.md)

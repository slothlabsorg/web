# M3 · Embeddings and Vector Stores

> **Module 3 of the RAGorbit course** — Week 3 (~32 h: ~12 h guide · ~8 h exercises · ~12 h workshop)
>
> RAGorbit nodes covered: `store.chroma`, `store.pgvector`, `store.qdrant`, `store.neo4j`, `store.multi-index`, `model.embedding`
> Anchor templates: **09 HR** (`store.chroma`) · **02 Banking** (`store.pgvector`)

---

## Table of contents

1. [What is an embedding?](#1-what-is-an-embedding)
2. [Dimensions and vector space](#2-dimensions-and-vector-space)
3. [Vector normalization](#3-vector-normalization)
4. [Similarity metrics: cosine, dot product, L2](#4-similarity-metrics-cosine-dot-product-l2)
5. [What is a vector index](#5-what-is-a-vector-index)
6. [Index types: flat, IVF, HNSW](#6-index-types-flat-ivf-hnsw)
7. [Persistence and collections](#7-persistence-and-collections)
8. [ChromaDB in depth: CRUD operations](#8-chromadb-in-depth-crud-operations)
9. [FAISS: what it is and when to use it](#9-faiss-what-it-is-and-when-to-use-it)
10. [Vector store vs traditional database](#10-vector-store-vs-traditional-database)
11. [Recommendation systems with embeddings](#11-recommendation-systems-with-embeddings)
12. [Vector store comparison](#12-vector-store-comparison)
13. [Embedding models: OpenAI vs Cohere vs BGE/E5 local](#13-embedding-models-openai-vs-cohere-vs-bgee5-local)
14. [RAGorbit nodes and template anchors](#14-ragorbit-nodes-and-template-anchors)
15. [Layer ③ explained: from in-memory dict to ChromaDB, FAISS, and sentence-transformers](#15-layer--explained-from-in-memory-dict-to-chromadb-faiss-and-sentence-transformers)
16. [Checkpoint](#16-checkpoint)

---

## 1. What is an embedding?

An **embedding** is the translation of a high-dimensional semantic object (text, image, audio) into a fixed-length vector of real numbers. It is not a hash or a code — it is a **geometric** representation: semantically similar objects end up close together in vector space.

### Analogy

Imagine a city where every idea has an address. "vacation policy" and "annual leave days" live in the same neighborhood; "mortgage interest rate" lives in another district. An embedding places each phrase at its coordinate within this conceptual map.

### How it is generated

An embedding model (BERT, E5, text-embedding-3-large…) receives text, processes it with a transformer architecture, and extracts the hidden state of a special token (`[CLS]`) or the average of all tokens. This vector summarizes the meaning of the text in that mathematical space.

```
Texto: "¿Cuántos días de vacaciones tengo?"
         │
         ▼
  Tokenización
         │
         ▼
  Transformer (N capas de atención)
         │
         ▼
  Pooling (CLS o mean)
         │
         ▼
  Vector: [0.12, -0.34, 0.78, ..., 0.05]   ← 1536 dimensiones (text-embedding-3-small)
```

### Why not use TF-IDF or BM25

TF-IDF and BM25 are **lexical** representations: two phrases identical in vocabulary but different in intent will have similar vectors; synonyms will have completely different vectors. Dense embeddings capture **semantics**: "¿Cuántos días de vacaciones tengo?" and "días de permiso remunerado al año" end up close even though they share no words.

This does NOT mean embeddings are always superior. For exact-term search (IDs, function names, product codes), BM25 often wins. Hybrid search (M4) combines both worlds.

---

## 2. Dimensions and vector space

The **dimension** of an embedding is the length of the vector. Common models:

| Model | Dimensions | Notes |
|--------|-------------|-------|
| `text-embedding-3-small` | 1 536 | OpenAI, economical |
| `text-embedding-3-large` | 3 072 | OpenAI, higher quality |
| `text-embedding-ada-002` | 1 536 | OpenAI, legacy |
| `embed-english-v3.0` | 1 024 | Cohere |
| `BAAI/bge-large-en-v1.5` | 1 024 | Open source, local |
| `intfloat/e5-large-v2` | 1 024 | Open source, local |
| `nomic-embed-text-v1` | 768 | Open source, long context |

### Dimensionality and quality

More dimensions do not always mean more quality. What matters is the **task** the model was trained for and the **domain** of the text. A well-aligned 768-dimensional model for your domain can outperform a 3,072-dimensional model trained on generic text.

### The "curse of dimensionality"

In very high-dimensional spaces, distances between points tend to homogenize: the difference between the nearest and farthest neighbor becomes relative. Above ~2,000–4,000 dimensions, approximate indexes (ANN) become less precise. For text embeddings, current dimensions (768–3,072) work well in practice because vectors are not uniform — they contain semantic structure.

### Projection and reduction (UMAP/PCA)

To **visualize** embeddings, they are reduced to 2 or 3 dimensions with UMAP or PCA. This is only for exploration — do not use reduced embeddings in production (you lose information).

---

## 3. Vector normalization

A vector is **normalized** if its L2 norm (geometric length) is 1. Normalization is applied by dividing by its norm:

```
v̂ = v / ‖v‖₂       donde  ‖v‖₂ = √(v₁² + v₂² + ... + vₙ²)
```

### Numeric example

```
v = [3, 4]
‖v‖ = √(9 + 16) = √25 = 5
v̂ = [3/5, 4/5] = [0.6, 0.8]
‖v̂‖ = √(0.36 + 0.64) = √1.0 = 1.0   ✓
```

### Why normalize

- Most modern embedding models already return normalized vectors.
- With normalized vectors, **cosine similarity = dot product**. This allows using the fastest operations of vector indexes.
- Without normalization, dot product favors vectors with larger magnitude, introducing bias toward longer texts.

**Practical rule:** always normalize before indexing unless your embedding vendor guarantees it already does (OpenAI `text-embedding-3-*` does).

---

## 4. Similarity metrics: cosine, dot product, L2

### 4.1 Cosine similarity

Measures the angle between two vectors, ignoring magnitude:

```
cos(θ) = (A · B) / (‖A‖ · ‖B‖)
```

Range: [-1, 1]  
- 1 → same direction (maximum similarity)  
- 0 → perpendicular (no semantic relation)  
- -1 → opposite

**Example with small vectors:**

```
A = [1, 0, 1]    (representa "perro come hueso")
B = [1, 0, 0.8]  (representa "can mastica alimento")
C = [0, 1, 0]    (representa "política fiscal")

A · B = 1×1 + 0×0 + 1×0.8 = 1.8
‖A‖ = √(1+0+1) = √2 ≈ 1.414
‖B‖ = √(1+0+0.64) = √1.64 ≈ 1.281

cos(A,B) = 1.8 / (1.414 × 1.281) ≈ 1.8 / 1.812 ≈ 0.994  → muy similar ✓

A · C = 0
cos(A,C) = 0 / (1.414 × 1) = 0  → sin relación ✓
```

**When to use cosine:** almost always in text retrieval. It is robust to text length.

### 4.2 Dot product (Dot Product / IP — Inner Product)

```
A · B = Σ (Aᵢ × Bᵢ)
```

With **normalized** vectors, `A · B = cos(θ)`. Without normalization, the result mixes angular similarity with magnitude.

**Advantage:** it is the fastest operation (SIMD/GPU). If you normalize beforehand, you get exactly cosine similarity without the cost of division.

**When to use IP:** when the model guarantees normalized vectors AND you need maximum speed. OpenAI recommends IP for `text-embedding-3-*` precisely because it delivers unit vectors.

### 4.3 L2 distance (Euclidean)

```
d(A,B) = √(Σ (Aᵢ - Bᵢ)²)
```

Measures the direct geometric distance between two points. Lower distance = higher similarity.

**Example:**

```
A = [0.6, 0.8]
B = [0.5, 0.9]
d = √((0.6-0.5)² + (0.8-0.9)²) = √(0.01 + 0.01) = √0.02 ≈ 0.141
```

**With normalized vectors:** `d(A,B)² = 2 - 2×cos(θ)`. That is, L2 and cosine are monotonically related — they give the same ranking order when vectors are normalized.

**When to use L2:** when embeddings are NOT normalized and magnitude matters (e.g. image embeddings where intensity has meaning).

### Metrics summary

| Metric | Formula | Range | When to use |
|---------|---------|-------|-------------|
| Cosine | `(A·B)/(‖A‖‖B‖)` | [-1, 1] | General text retrieval |
| Dot product | `Σ AᵢBᵢ` | (-∞, +∞) | Normalized vectors, maximum speed |
| L2 Euclidean | `√Σ(Aᵢ-Bᵢ)²` | [0, +∞) | When magnitude matters; clustering |

---

## 5. What is a vector index

A **vector index** is a data structure that efficiently answers the question: "which are the K vectors most similar to this query?"

### The problem without an index

With N stored vectors, answering a query requires computing distance with EVERY vector. This is **exhaustive search** (brute force):

```
Complejidad: O(N × D)   donde D = dimensiones
N = 1 000 000, D = 1 536 → 1.5 × 10⁹ operaciones por query
```

At 10 ms per million multiplications: 15 seconds per query. Unacceptable.

### The solution: Approximate Nearest Neighbor (ANN)

ANN indexes sacrifice a bit of **recall** (they may miss a real neighbor) in exchange for drastically higher speed. The speed/recall balance is the central design parameter.

```
Recall = |vecinos_reales_encontrados| / K

Ejemplo: buscas top-5; el índice devuelve 5 resultados, 4 son los reales top-5 → recall@5 = 80%
```

---

## 6. Index types: flat, IVF, HNSW

### 6.1 Flat (exhaustive search)

Not an ANN index: compares the query with ALL vectors.

```
         Query
           │
    ┌──────┴──────┐
    ▼             ▼
 Todos los vectores se comparan
    ▼             ▼
    └──────┬──────┘
           │
         Top-K
```

**Advantages:**
- Recall = 100% (exact)
- Very simple to implement
- No tuning parameters

**Disadvantages:**
- Scales linearly: 10× more data → 10× slower
- Practical limit: ~100k–500k vectors with acceptable latency

**When to use flat:**
- Small collections (< 100k documents)
- Development and prototyping
- When accuracy is critical (financial auditors, medical systems)
- Baseline benchmarks

**RAGorbit node:** `store.chroma` in default mode uses flat for small collections.

### 6.2 IVF (Inverted File Index)

**Intuition:** groups vectors into C clusters (Voronoi cells). When a query arrives, it only searches the nlist_probe closest clusters instead of all of them.

```
   Entrenamiento (k-means):
   ┌────────────────────────┐
   │  ●  ●                  │
   │    ☆ (centroide 1)     │
   │  ●  ●    ○  ○          │
   │         ☆ (centroide 2)│
   │         ○  ○           │
   └────────────────────────┘

   Query Q:
   1. Calcular distancia Q a los C centroides (barato: C << N)
   2. Seleccionar los nprobe centroides más cercanos
   3. Búsqueda exhaustiva solo dentro de esas celdas
```

**Key parameters:**
- `nlist` (C): number of clusters. Rule: `nlist ≈ sqrt(N)`. For 1M vectors → 1000 clusters.
- `nprobe`: how many clusters to explore at query time. Higher nprobe → higher recall → higher latency.

```
nprobe = 1   → rápido, recall bajo (~60-70%)
nprobe = 10  → equilibrado, recall ~90%
nprobe = C   → igual que flat (exhaustivo)
```

**Advantages:**
- Good balance for medium collections (100k–10M vectors)
- Fast training with k-means

**Disadvantages:**
- Requires training phase (k-means)
- Sensitive to data distribution
- Recall drops at cluster boundaries (the real neighbor may be in the adjacent cluster)

**IVF+PQ variant (Product Quantization):** compresses each vector using product quantization, reducing memory 8–32× at the cost of some recall. Ideal for 100M+ vectors in limited RAM.

### 6.3 HNSW (Hierarchical Navigable Small World)

**Intuition:** builds a navigable graph in multiple layers (like a highway + secondary roads + alleys). Search starts at the top layer (few connections, long jumps) and descends to the bottom layer (many connections, fine search).

```
Capa 2 (autopista):    A ──────────── E
Capa 1 (secundaria):   A ─── B ─── D ─ E
Capa 0 (local):        A - a - B - C - D - d - E

Query Q: "encuentra el vecino más cercano a Q"
1. Entrar en la capa superior por el entry point
2. Greedy search: saltar al vecino más cercano al query
3. Descender a la capa inferior
4. Repetir hasta capa 0 con búsqueda local exhaustiva
```

**Key parameters:**
- `M`: number of connections per node per layer. Higher M → higher recall, more memory, slower construction. Typical values: 16–64.
- `ef_construction`: size of the candidate list during construction. Higher → better graph quality, slower. Typical: 100–200.
- `ef_search` (or `ef`): size of the search queue at query time. Higher → more recall → slower.

```
M=16, ef_construction=200 → construcción equilibrada
ef_search=50  → recall ~95%, rápido
ef_search=200 → recall ~99%, más lento
```

**Advantages:**
- Better recall/speed than IVF for medium collections
- Does not require a separate training phase (builds the graph incrementally)
- Supports incremental insertions efficiently
- It is the default index of Chroma, Qdrant, and others

**Disadvantages:**
- Higher memory use than IVF (stores the graph)
- Slower construction than IVF for very large collections (>10M)

**Visual comparison:**

```
                Velocidad de query
                ◄──── más lento    más rápido ────►
Exactitud
     ▲    Flat ●
     │          HNSW ●
     │               IVF+HNSW ●
     │                    IVF ●
     │                         IVF+PQ ●
     ▼
```

### Decision table

| Criterion | Flat | IVF | HNSW |
|---------|------|-----|------|
| Small collection (<100k) | ✅ ideal | ok | ok |
| Medium collection (100k–5M) | slow | ✅ | ✅ |
| Large collection (>5M) | ❌ | ✅ IVF+PQ | may saturate RAM |
| Frequent insertions | ✅ | needs re-index | ✅ |
| Exact recall required | ✅ | ❌ | almost |
| Limited memory | ✅ | ✅ with PQ | higher use |

---

## 7. Persistence and collections

### 7.1 Persistence modes

Vector stores can operate in two modes:

**In-memory (ephemeral):**
```
store = chromadb.Client()  # desaparece al cerrar el proceso
```
Useful for: tests, rapid prototyping, workshops without dependencies.

**Persistent on disk:**
```
store = chromadb.PersistentClient(path="./chroma_db")  # escribe en disco
```
Useful for: local development, demos, collections built once and queried many times.

**Persistent on server (production):**
```
store = chromadb.HttpClient(host="localhost", port=8000)
```
Useful for: production, multiple workers, concurrent access.

### 7.2 Collections

A **collection** is the unit of organization within a vector store. Analogous to a table in SQL or an index in Elasticsearch.

Each collection has:
- A unique name
- An embedding function (can differ per collection)
- A distance metric
- Its own vectors and metadata

**When to split into collections:**
- Different domains (HR policies vs technical manuals) — avoids result contamination
- Different languages if the model is not multilingual
- Different embedding models
- Different lifecycles (one collection updated monthly; another read-only)

**Template 09 HR:** uses a single `hr_policies` collection in `store.chroma`. Sufficient because all documents are from the same domain.

**Template 02 Banking:** uses `store.pgvector` with `credit_docs` index per case file. In production, separate collections or schemas per client would be used.

---

## 8. ChromaDB in depth: CRUD operations

ChromaDB is the simplest vector store to get started: it does not require Docker or an external server for local mode. That is why it is RAGorbit's default choice for demos and `store.chroma`.

### 8.1 Installation and client

```python
# pip install chromadb
import chromadb

# In-memory
client = chromadb.Client()

# Persistente en disco
client = chromadb.PersistentClient(path="./datos/chroma")

# Servidor remoto
client = chromadb.HttpClient(host="localhost", port=8000)
```

### 8.2 Managing collections

```python
# Crear colección
collection = client.create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"}  # métrica de distancia
)

# Obtener existente (falla si no existe)
collection = client.get_collection("hr_policies")

# Obtener o crear (idempotente)
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"}
)

# Listar todas las colecciones
colecciones = client.list_collections()

# Eliminar colección
client.delete_collection("hr_policies")
```

### 8.3 ADD — add documents

```python
collection.add(
    ids=["doc_001", "doc_002", "doc_003"],
    documents=[
        "Los empleados tienen 15 días de vacaciones al año.",
        "El seguro médico cubre hasta 3 dependientes.",
        "La jornada laboral es de 8 horas con 1 hora de almuerzo."
    ],
    metadatas=[
        {"categoria": "vacaciones", "version": "2024"},
        {"categoria": "beneficios", "version": "2024"},
        {"categoria": "horario", "version": "2023"}
    ],
    # Si no proporcionas embeddings, Chroma los genera con su modelo interno
    # embeddings=[[0.1, 0.2, ...], ...]  # opcional
)
```

**Important notes:**
- `ids` must be unique within the collection. If the id already exists, Chroma raises an error (use `upsert` for update-or-insert).
- `documents` is plain text that Chroma can embed automatically if you do not pass `embeddings`.
- `metadatas` must be a list of dictionaries with values `str`, `int`, `float`, or `bool`. Does NOT support lists or nested dicts.

### 8.4 QUERY — search

```python
resultados = collection.query(
    query_texts=["¿cuántos días de vacaciones tengo?"],
    n_results=3,
    where={"categoria": "vacaciones"},  # filtro de metadata (opcional)
    include=["documents", "metadatas", "distances", "embeddings"]
)

# Estructura del resultado:
# {
#   'ids': [['doc_001']],
#   'distances': [[0.12]],
#   'metadatas': [[{'categoria': 'vacaciones', 'version': '2024'}]],
#   'documents': [['Los empleados tienen 15 días de vacaciones al año.']]
# }
```

**Metadata filters (operators):**

```python
# Igualdad
where={"categoria": "vacaciones"}

# Operadores: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
where={"version": {"$gte": "2024"}}
where={"categoria": {"$in": ["vacaciones", "beneficios"]}}

# Combinaciones: $and, $or
where={"$and": [
    {"categoria": "vacaciones"},
    {"version": {"$gte": "2023"}}
]}
```

**Content filter with `where_document`:**
```python
where_document={"$contains": "15 días"}
```

### 8.5 UPDATE — update

```python
collection.update(
    ids=["doc_001"],
    documents=["Los empleados tienen 20 días de vacaciones al año (nueva política 2025)."],
    metadatas=[{"categoria": "vacaciones", "version": "2025"}]
)
```

Chroma automatically recalculates the embedding of the new text.

### 8.6 UPSERT — create or update

```python
collection.upsert(
    ids=["doc_001", "doc_004"],  # doc_001 existe → update; doc_004 no existe → insert
    documents=["...", "..."],
    metadatas=[{...}, {...}]
)
```

Upsert is the safest operation for ingestion pipelines that run repeatedly.

### 8.7 DELETE — remove

```python
# Por id
collection.delete(ids=["doc_001", "doc_002"])

# Por filtro de metadata
collection.delete(where={"version": "2023"})

# Por contenido
collection.delete(where_document={"$contains": "texto obsoleto"})
```

### 8.8 GET — retrieve by id (without similarity)

```python
resultado = collection.get(
    ids=["doc_001", "doc_002"],
    include=["documents", "metadatas"]
)
```

Useful to verify what is indexed or for audit pipelines.

### 8.9 COUNT and PEEK

```python
total = collection.count()  # número de documentos en la colección

sample = collection.peek(5)  # primeros 5 documentos (para debug)
```

### Typical ChromaDB flow diagram

```
PDF/texto
   │
   ▼
Chunker (M2)
   │  chunks con metadata
   ▼
collection.upsert()  ← añade/actualiza vectores
   │
   │  [más tarde, en query time]
   │
   ▼
collection.query(query_texts=[...], where={...})
   │
   ▼
Top-K chunks → LLM → respuesta con citas
```

---

## 9. FAISS: what it is and when to use it

**FAISS** (Facebook AI Similarity Search) is a C++ library (with Python bindings) for high-efficiency nearest neighbor search, developed by Meta AI.

### Differences from ChromaDB

| Aspect | FAISS | ChromaDB |
|---------|-------|---------|
| What it is | Index library (search only) | Complete vector database |
| Metadata filtering | Not native (you must implement it) | Yes, with rich operators |
| Persistence | Manual (`faiss.write_index` / `read_index`) | Automatic |
| CRUD | Add/search only (no efficient update/delete) | Complete |
| Speed | Extreme (C++, BLAS/CUDA) | Good |
| Typical use | Research, ML pipelines, massive scale | RAG apps, demos, medium production |

### Main FAISS indexes

```python
import faiss
import numpy as np

dim = 1536  # dimensión de los embeddings

# Flat (exacto)
index_flat = faiss.IndexFlatL2(dim)

# Flat con similitud coseno (vectores normalizados)
index_ip = faiss.IndexFlatIP(dim)

# IVF + Flat
quantizer = faiss.IndexFlatL2(dim)
index_ivf = faiss.IndexIVFFlat(quantizer, dim, nlist=100)
index_ivf.train(train_vectors)  # requiere entrenamiento
index_ivf.nprobe = 10

# HNSW
index_hnsw = faiss.IndexHNSWFlat(dim, M=16)

# IVF + PQ (compresión extrema)
index_pq = faiss.IndexIVFPQ(quantizer, dim, nlist=100, M=8, nbits=8)
```

### Basic operations

```python
# Añadir vectores (deben ser float32)
vectors = np.array([[...], [...]], dtype=np.float32)
index.add(vectors)

# Buscar top-K
query = np.array([[...]], dtype=np.float32)
distances, indices = index.search(query, k=5)
# distances: (1, 5) array con distancias
# indices: (1, 5) array con posiciones en el índice

# Persistencia manual
faiss.write_index(index, "mis_vectores.faiss")
index = faiss.read_index("mis_vectores.faiss")
```

### FAISS with custom IDs

By default, FAISS assigns integer indices (0, 1, 2...). To map to your document IDs, keep an external dictionary:

```python
id_map = {}  # indice_faiss → id_documento
for i, doc_id in enumerate(tus_ids):
    id_map[i] = doc_id

# O usa IndexIDMap para gestión automática
index_with_ids = faiss.IndexIDMap(index_flat)
ids_array = np.array([101, 205, 307], dtype=np.int64)
index_with_ids.add_with_ids(vectors, ids_array)
```

### GPU with FAISS

FAISS has native GPU support (CUDA):

```python
res = faiss.StandardGpuResources()
index_gpu = faiss.index_cpu_to_gpu(res, 0, index_flat)
# Búsqueda hasta 100× más rápida en GPU
```

### When to choose FAISS over ChromaDB

- You have millions of vectors and need maximum speed
- You integrate into an ML pipeline (not a standard RAG app)
- You need fine control of the index algorithm (IVF+PQ for limited memory, HNSW for high recall)
- Your team has numpy/C++ experience
- You do not need complex metadata filters

---

## 10. Vector store vs traditional database

### Why not use "normal" PostgreSQL

An SQL table can store embeddings as arrays:

```sql
CREATE TABLE documentos (
    id TEXT PRIMARY KEY,
    texto TEXT,
    embedding FLOAT8[],
    categoria TEXT
);
```

But finding the K nearest requires:

```sql
SELECT id, texto,
       embedding <-> query_embedding AS distancia
FROM documentos
ORDER BY distancia
LIMIT 5;
```

This is exhaustive search — `O(N)`. With 1M documents, it is extremely slow.

### pgvector to the rescue

**pgvector** is a PostgreSQL extension that adds:
- `vector(1536)` data type
- Distance operators: `<->` (L2), `<#>` (negative IP), `<=>` (cosine)
- HNSW and IVF indexes inside Postgres

```sql
CREATE EXTENSION vector;

CREATE TABLE documentos (
    id TEXT PRIMARY KEY,
    texto TEXT,
    embedding vector(1536),
    categoria TEXT
);

CREATE INDEX ON documentos USING hnsw (embedding vector_cosine_ops);

SELECT id, texto
FROM documentos
WHERE categoria = 'vacaciones'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

This combines SQL filters with efficient vector search. That is why `store.pgvector` is the choice in template 02 Banking: you need hard filters by `doc_type` and `period` using standard SQL.

### Conceptual comparison

| Aspect | Relational DB | Vector DB | Relational DB + pgvector |
|---------|--------------|--------------|--------------------------|
| Semantic search | ❌ | ✅ | ✅ |
| Complex filters | ✅ | limited | ✅ |
| Joins, aggregations | ✅ | ❌ | ✅ |
| ACID transactions | ✅ | depends | ✅ |
| Scale >100M vectors | ❌ | ✅ dedicated | ❌ |
| Existing infrastructure | ✅ | no | ✅ if you have Postgres |

**Practical rule:** if you already have Postgres in production and your scale is < 5M vectors, pgvector is the simplest option. For massive scale or advanced features (complex numeric filters, streaming updates), use Qdrant or Weaviate.

---

## 11. Recommendation systems with embeddings

The semantic search engine of a vector store is fundamentally a recommendation engine. The same `top-K by similarity` query you use for RAG applies to product, content, song recommendation, etc.

### Item-to-item pattern

"Given an item the user is viewing, recommend similar items":

```
Ítem actual: embedding(descripción_producto_A)
                     │
                     ▼
      query al vector store con ese embedding
                     │
                     ▼
       Top-5 productos más similares → mostrar como recomendaciones
```

### User-to-item pattern (dense collaborative filtering)

"Given a user's history, recommend new items":

1. Generate the user embedding: average or transformation of embeddings of items they consumed.
2. Search top-K in item space.

```python
# Perfil del usuario como promedio de embeddings de artículos leídos
perfil_usuario = np.mean([embedding(articulo_1), embedding(articulo_2), ...], axis=0)
top_k = vector_store.query(perfil_usuario, k=5)
```

### Duplicate/near-duplicate detection pattern

```
Para cada nuevo documento:
  embedding(doc_nuevo) → query top-1 en el store
  Si similitud > 0.95 → probable duplicado, no indexar
```

### RAGorbit anchor

In template 09 HR, the same `store.chroma` with `retrieval.vector` acts as a policy recommendation engine: given the employee's question, it recommends the most relevant fragments. Vector search is the same mathematical operation as a recommendation system.

---

## 12. Vector store comparison

### Main table

| Store | Type | Filters | Indexes | Scale | On-premise | Cloud managed | Strength |
|-------|------|---------|---------|--------|-----------|---------------|-----------|
| **ChromaDB** | Open source | Rich (operators) | HNSW, flat | Up to ~10M | ✅ | ❌ native | Simplicity, zero-config, ideal RAG apps |
| **FAISS** | Library | Manual (external) | Flat, IVF, HNSW, PQ | 100M+ | ✅ | ❌ | Extreme speed, research, ML pipelines |
| **pgvector** | Postgres extension | Full SQL | HNSW, IVF | ~5M practical | ✅ | ✅ (RDS, AlloyDB, Supabase) | If you already have Postgres; complex joins |
| **Qdrant** | Dedicated vector DB | Very rich (payload) | HNSW, quantization | 100M+ | ✅ Docker | ✅ Qdrant Cloud | Advanced filters, performance, Rust |
| **Pinecone** | Vector DB SaaS | Metadata filters | Proprietary (ANN) | Unlimited | ❌ | ✅ | Zero-ops, automatic scale |
| **Weaviate** | Vector DB + graph | GraphQL + hybrid BM25 | HNSW | 100M+ | ✅ Docker | ✅ WCS | Native hybrid search, multimodal |
| **Milvus** | Open vector DB | Rich | HNSW, IVF, DiskANN | 1B+ | ✅ | ✅ Zilliz | Enterprise scale, Attu ecosystem |

### When to choose each one

**ChromaDB:** first prototype, demos, teams without DevOps. `store.chroma` in RAGorbit.

**FAISS:** you need the fastest possible and you control the infrastructure yourself (internal ML pipelines, research). No collection or server management.

**pgvector:** you already have Postgres and your scale is < 5M vectors. You avoid adding another system. Template 02 Banking uses `store.pgvector` because hard SQL filters are part of the regulatory requirement.

**Qdrant:** production-grade, you need complex payload filters, you want on-premise without cloud lock-in. Very good speed/features balance.

**Pinecone:** product team that does not want to manage infrastructure and can pay for SaaS. The "serverless" option of vector stores.

**Weaviate:** you need hybrid search (semantic + BM25) native without extra code, or the domain combines text with images.

**Milvus:** scale of 100M–1B+ vectors, large company with dedicated platform team.

### Common anti-patterns

- Using ChromaDB in production with 50M+ documents (becomes slow).
- Using FAISS when you need metadata filters (you must implement the logic yourself and re-filter post-search, which degrades recall).
- Using pgvector for collections > 5M without prior performance analysis.
- Choosing Pinecone by default for convenience without evaluating lock-in.

---

## 13. Embedding models: OpenAI vs Cohere vs BGE/E5 local

### Comparative dimensions

| Model | Dim | Max tokens | Multilingual | Cost | Privacy | Speed |
|--------|-----|-----------|-------------|-------|-----------|-----------|
| `text-embedding-3-small` | 1 536 | 8 191 | Yes | $0.02/1M tokens | ❌ external API | API latency |
| `text-embedding-3-large` | 3 072 | 8 191 | Yes | $0.13/1M tokens | ❌ external API | API latency |
| `text-embedding-ada-002` | 1 536 | 8 191 | Yes | $0.10/1M tokens | ❌ external API | API latency, legacy |
| `embed-english-v3.0` | 1 024 | 512 | No (english) | $0.10/1M tokens | ❌ external API | API latency |
| `embed-multilingual-v3.0` | 1 024 | 512 | Yes (100 languages) | $0.10/1M tokens | ❌ external API | API latency |
| `BAAI/bge-large-en-v1.5` | 1 024 | 512 | No (english) | Free | ✅ local | GPU required for speed |
| `BAAI/bge-m3` | 1 024 | 8 192 | Yes (100 languages) | Free | ✅ local | GPU recommended |
| `intfloat/e5-large-v2` | 1 024 | 512 | No | Free | ✅ local | GPU required |
| `intfloat/multilingual-e5-large` | 1 024 | 512 | Yes | Free | ✅ local | GPU recommended |
| `nomic-embed-text-v1` | 768 | 8 192 | No | Free | ✅ local | GPU optional |

### When to choose each family

**OpenAI (`text-embedding-3-*`):**
- You already use OpenAI for LLM (API key ready)
- Content in multiple languages without additional complexity
- You do not have a local GPU
- You want the shortest possible development time

**Cohere (`embed-*-v3`):**
- Pure English documents with 512 token limit (you chunk well already)
- Cohere API is already in your stack (e.g. you use their reranker)

**BGE (BAAI):**
- Data privacy: documents cannot leave your infrastructure
- Limited budget (zero API cost)
- You have GPU available (A10/T4/RTX are sufficient)
- Specific domain: you can fine-tune BGE with your own data

**E5:**
- Similar to BGE. The E5 family has "instruction-tuned" variants that accept a task prefix (`query: ...` / `passage: ...`) to improve accuracy in asymmetric retrieval.

**RAGorbit node `model.embedding`:**

```json
{
  "type": "model.embedding",
  "config": {
    "model": "text-embedding-3-large",
    "local": false,
    "apiKeyRef": "OPENAI_API_KEY"
  }
}
```

To use a local model:

```json
{
  "type": "model.embedding",
  "config": {
    "model": "BAAI/bge-large-en-v1.5",
    "local": true
  }
}
```

### Asymmetric vs symmetric embeddings

**Symmetric:** query and document are the same type (both questions or both answers). Standard models work well.

**Asymmetric:** the query is short ("¿días de vacaciones?") and the document is long (full policy paragraph). Models like **E5** and **BGE** have specific variants for asymmetric retrieval:

```python
# E5: prefijo de tarea
query_text = "query: ¿cuántos días de vacaciones tengo?"
doc_text = "passage: Los empleados tienen derecho a 15 días..."
```

In RAG, retrieval is almost always asymmetric. For production with high quality, use E5 or BGE with the corresponding prefixes.

---

## 14. RAGorbit nodes and template anchors

### `model.embedding`

Independent node that provides the embedding function to the store. It does not produce chunks or text — it produces `Embeddings` that the store consumes for indexing.

```
model.embedding (Embeddings →) ──────────▶ store.chroma/pgvector/qdrant (→ Embeddings)
```

**Typical configuration:**
```json
{
  "model": "text-embedding-3-large",
  "local": false,
  "apiKeyRef": "OPENAI_API_KEY"
}
```

### `store.chroma`

Local Chroma, no infrastructure. Ideal for demos and development. In **template 09 HR** (`hr-policy-assistant`), the graph is:

```
loader.pdf → ingest.chunker → store.chroma ← model.embedding
                                   │ Retriever
                                   ▼
                            retrieval.vector (topK: 4)
```

No metadata filters because all policies are from the same domain.

### `store.pgvector`

Postgres with vector extension. In **template 02 Banking** (`banking-credit-scoring`):

```
loader.pdf + loader.tabular → ingest.chunker → ingest.metadata → store.pgvector ← model.embedding
                                                                        │ Retriever
                                                                        ▼
                                                         retrieval.vector (topK: 6, hardFilters: [doc_type, period])
```

The `doc_type` and `period` filters ensure that when evaluating the 2023 case file, only documents from that period are retrieved — semantic guardrail implemented as metadata filter.

### `store.qdrant`, `store.neo4j`, `store.multi-index`

- `store.qdrant`: production with advanced payload filters and scalability. Health (M4) and telecom (M4) templates would use it in production.
- `store.neo4j`: GraphRAG. Documents are stored as nodes with typed relationships. Allows retrieval by graph neighborhood, not just vector similarity (M4).
- `store.multi-index`: groups multiple indexes for routing. The retriever can choose the correct index based on the query (M4).

---

## 15. Layer ③ explained: from in-memory dict to ChromaDB, FAISS, and sentence-transformers

> **Who this section is for:** you just completed the layer ② workshop (`lab/solucion_scratch.py`): an in-memory `dict`, 20-dimensional bag-of-words embedding, manual cosine, and manual filter. Here you learn the **three libraries** that replace each piece — so you can **write** `lab/solucion_framework.py` yourself, not just read it.
>
> **Prerequisites:** have read §8 (ChromaDB) and §9 (FAISS). This section does not duplicate them: it **connects** them with what you already did by hand.

### 15.1 The mental map: your scratch vs real libraries

In the scratch workshop you built a complete pipeline with standard Python only. Each piece has a production equivalent:

```
  CAPA ② (scratch)                    CAPA ③ (framework)
  ─────────────────                   ──────────────────────────────

  embeder(texto)                      SentenceTransformer.encode()
  bag-of-words 20 dim                 BGE-base 768 dim (transformer)

  store = {id: {vector, texto,       chromadb.Client() +
    metadata}}                        collection.upsert(...)

  coseno(a, b) manual                 Chroma: distances en query()
                                      FAISS: IndexFlatIP.search()

  for doc in store: top-k manual      collection.query(n_results=k)
                                      index.search(query_vec, k)

  if metadata["cat"] == "vac":        Chroma: where={"categoria":...}
  filtro antes del ranking            FAISS: post-filtering en Python

  dict en RAM (se pierde al cerrar)   Chroma: PersistentClient
                                      FAISS: write_index / read_index
```

**Detailed bridge table:**

| What you did by hand (scratch) | Real piece | Library / API |
|--------------------------------|------------|----------------|
| `embeder(texto)` — count of 20 vocabulary words | Neural model that converts text → dense 768-dim vector | `sentence-transformers`: `SentenceTransformer("BAAI/bge-base-en-v1.5").encode(textos, normalize_embeddings=True)` |
| `store[id] = {"vector", "texto", "metadata"}` — Python dict | Collection with indexed vectors + text + metadata | `chromadb`: `client.get_or_create_collection(...)` + `collection.upsert(ids, documents, embeddings, metadatas)` |
| `coseno(query_vec, doc_vec)` — dot product of normalized vectors | Index that computes IP (= cosine if you normalize) over millions of vectors in C++ | `faiss`: `IndexFlatIP(dim)` + `search(query_vec, k)` |
| `buscar(query, k, filtro)` — iterate all docs, filter, sort | Query with filter integrated in the index (pre-filtering) | `chromadb`: `collection.query(..., where={"categoria": "vacaciones"})` — see [§8.4](#84-query--search) |
| Same filter in FAISS | Request K_extra results and filter in Python afterward | Post-filtering manual — see [§9](#9-faiss-what-it-is-and-when-to-use-it) and [§15.5](#155-block-by-block-walkthrough-of-labsolucion_frameworkpy) |
| No persistence (RAM) | Save to disk and recover | Chroma: `PersistentClient(path=...)` · FAISS: `faiss.write_index` / `read_index` |
| O(N) exhaustive search over 12 docs | ANN index (HNSW) for millions | Chroma activates HNSW internally · FAISS: `IndexHNSWFlat(dim, M)` |

**Complete flow diagram (layer ③):**

```
  doc_01.json … doc_12.json
           │
           ▼
  ┌─────────────────────────────────────┐
  │  SentenceTransformer.encode()       │  ← reemplaza embeder()
  │  textos → array (12, 768) float32   │
  │  normalize_embeddings=True          │
  └──────────────┬──────────────────────┘
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  ChromaDB              FAISS
  collection.upsert()   IndexIDMap.add_with_ids()
  + where en query      + id_a_doc mapa externo
       │                   │
       ▼                   ▼
  query + filtro          query + post-filter
  nativo (pre-filter)     manual en Python
```

---

### 15.2 `sentence-transformers`: your `embeder()` for real

#### What is it?

`sentence-transformers` is a Python library that wraps transformer models (BERT, BGE, E5…) trained to produce **full-sentence vectors**. You do not need to know how a transformer works internally — you only need to know that it converts text into a number array where texts similar in meaning end up close together.

```bash
pip install sentence-transformers
# La primera vez descarga el modelo (~440 MB para BGE-base)
```

#### Minimal installation and first use

```python
from sentence_transformers import SentenceTransformer

# Cargar modelo (descarga automática la primera vez)
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

# Un solo texto → vector 1D de 768 floats
vec = modelo.encode("dias de permiso y descanso", normalize_embeddings=True)
print(len(vec))   # 768
print(vec[:3])    # [-0.02, 0.15, -0.08, ...]  (valores reales, no conteos)

# Varios textos → matriz (n, 768)
textos = [
    "Los empleados tienen 15 dias de vacaciones al ano.",
    "El seguro medico cubre dependientes.",
]
matriz = modelo.encode(textos, normalize_embeddings=True)
print(matriz.shape)  # (2, 768)
```

#### How it replaces your scratch `embeder()`

| Aspect | Scratch `embeder()` | Real `modelo.encode()` |
|---------|---------------------|------------------------|
| Dimensions | 20 (fixed, manual vocabulary) | 768 (learned by the model) |
| Semantics | Exact vocabulary words only | Synonyms and paraphrases close |
| Determinism | Yes (same text → same vector) | Yes (same model + same text → same vector) |
| Network / pip | Not required | Requires pip + model download |
| Normalization | You call `normalizar()` | `normalize_embeddings=True` does it |

**Mini comparative example:**

```python
# SCRATCH (lo que hiciste en el taller):
def embeder(texto):
    tokens = texto.lower().split()
    return [float(tokens.count(p)) for p in VOCAB]  # 20 dims, bag-of-words

# FRAMEWORK (lo que usarás en capa ③):
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
vec = modelo.encode(texto, normalize_embeddings=True)  # 768 dims, semántica real
```

With the real embedding, `"dias de permiso"` and `"vacaciones anuales"` will have high similarity even though they share no words — impossible with bag-of-words.

#### Why `normalize_embeddings=True`?

Same as in scratch: if you normalize before indexing, dot product **is** cosine similarity. FAISS with `IndexFlatIP` and Chroma with `metadata={"hnsw:space": "cosine"}` assume unit vectors. If you do not normalize:
- FAISS IP favors long vectors (long texts win without being more relevant).
- Chroma distances lose calibration.

**Rule:** always `normalize_embeddings=True` when calling `.encode()` for retrieval.

#### Bi-encoder vs cross-encoder (intuition, without going deep)

- **Bi-encoder** (what `sentence-transformers` uses): embeds query and document **separately** → compare vectors with cosine. Fast: you can pre-compute all documents and search in O(log N) with an index.
- **Cross-encoder** (rerankers, M4): puts query + document **together** in a single model → more precise relevance score but slow (you cannot pre-index). Used in a second pass to rerank top-100.

For indexing and search (this module), always bi-encoder.

#### BGE-base model size

`BAAI/bge-base-en-v1.5` weighs ~440 MB on disk. The first run downloads it from Hugging Face. On CPU it takes ~50–200 ms per small batch; with GPU it is much faster. For private employee data (template 09 HR), it is the correct choice: zero API cost, data does not leave your machine.

---

### 15.3 Bridge to ChromaDB (§8) and FAISS (§9)

You already read the full APIs in [§8](#8-chromadb-in-depth-crud-operations) and [§9](#9-faiss-what-it-is-and-when-to-use-it). Here only the **conceptual bridge** from your scratch:

**ChromaDB = your `dict` store + index + filters, packaged:**

| Your scratch function | ChromaDB equivalent | Section |
|-------------------|---------------------|---------|
| `store[id] = {...}` when loading JSONs | `collection.upsert(ids, documents, embeddings, metadatas)` | [§8.6](#86-upsert--create-or-update) |
| `buscar(query, k, filtro=None)` | `collection.query(query_texts=[query], n_results=k, where=filtro)` | [§8.4](#84-query--search) |
| `actualizar(id, ...)` in CRUD demo | `collection.upsert(ids=[id], ...)` | [§8.6](#86-upsert--create-or-update) |
| `eliminar(id)` | `collection.delete(ids=[id])` | [§8.7](#87-delete--remove) |
| `len(store)` | `collection.count()` | [§8.9](#89-count-and-peek) |

**FAISS = only the fast vector search engine; you manage the rest:**

| Your scratch function | FAISS equivalent | Section |
|-------------------|------------------|---------|
| `store` dict with vectors | `IndexFlatIP(dim)` or `IndexHNSWFlat(dim, M)` | [§9](#9-faiss-what-it-is-and-when-to-use-it) |
| String IDs (`"doc_01"`) | `IndexIDMap` + `add_with_ids(vectors, ids_numericos)` | [§9 — FAISS with custom IDs](#faiss-with-custom-ids) |
| `metadata` in each dict entry | **Does not exist in FAISS** → external map `id_a_doc = {i: doc}` | [§9 — differences from ChromaDB](#differences-from-chromadb) |
| `buscar()` with filter | `search(k_extra)` + filter in Python (post-filtering) | [§15.5](#155-block-by-block-walkthrough-of-labsolucion_frameworkpy) |
| Save store to disk | `faiss.write_index(index, "archivo.faiss")` | [§9 — basic operations](#basic-operations) |

---

### 15.4 Before writing code: what to install

```bash
pip install chromadb faiss-cpu sentence-transformers
# faiss-cpu en Mac/Linux sin GPU; usa faiss-gpu si tienes CUDA
```

The first run downloads `BAAI/bge-base-en-v1.5` (~440 MB). You need network. In the course environment (no pip/network) only layer ② runs; you run layer ③ on your machine when you have the packages.

---

### 15.5 Block-by-block walkthrough of `lab/solucion_framework.py`

Open [`lab/solucion_framework.py`](./lab/solucion_framework.py) while reading. The file has two sections (A: ChromaDB, B: FAISS) plus a comparison.

#### Section A — ChromaDB (`demo_chromadb`)

**Block 1: Client and collection (lines ~31–38)**

```python
client = chromadb.Client()  # in-memory; en producción: PersistentClient(path="./datos")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"}  # métrica coseno en el índice interno
)
```

- `Client()` = equivalent to your empty `store = {}` in RAM. Disappears when the process closes.
- `get_or_create_collection` = create the "table" where vectors + text + metadata will live. The `metadata={"hnsw:space": "cosine"}` tells Chroma to use cosine distance (like your manual `coseno()`).
- Persistence detail: [§7.1](#71-persistence-modes) and [§8.1](#81-installation-and-client).

**Block 2: Embedding model (lines ~40–44)**

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
```

Replaces your `embeder()`. Chroma *could* embed with `documents=` and its internal model (all-MiniLM), but here we want to control the model — same as production with `model.embedding` in RAGorbit.

**Block 3: Load JSONs (lines ~46–54)**

```python
for archivo in sorted(datos_dir.glob("doc_*.json")):
    doc = json.load(f)
    ids.append(doc["id"])
    textos.append(doc["texto"])
    metadatas.append(doc["metadata"])
```

Identical to your scratch `cargar_documentos()`: you separate `id`, text, and metadata into parallel lists (Chroma wants them this way).

**Block 4: Index with pre-calculated embeddings (lines ~64–71)**

```python
embeddings = modelo.encode(textos, normalize_embeddings=True).tolist()
collection.upsert(
    ids=ids,
    documents=textos,
    embeddings=embeddings,
    metadatas=metadatas,
)
```

- `modelo.encode(...)` → matrix (12, 768); `.tolist()` because Chroma expects Python lists, not numpy.
- `upsert` = "create if not exists, update if exists" — the safe operation for ingestion pipelines. See [§8.6](#86-upsert--create-or-update).
- Passing explicit `embeddings=` avoids Chroma using its internal model (different dimensionality).

**Block 5: Search A — no filter (lines ~75–91)**

```python
resultados = collection.query(
    query_texts=[query],
    n_results=3,
    include=["documents", "metadatas", "distances"]
)
```

- Equivalent to your `buscar(query, k=3, filtro=None)`.
- `query_texts` accepts raw text; Chroma embeds it internally **or** you can pass `query_embeddings=` if you already computed the vector with your model.
- `include` controls which fields are returned. Always request `distances` to interpret scores.

**Interpreting `distances` → similarity:**

Chroma with cosine space returns **distance** (not similarity):
- `0` = identical
- `2` = opposite (vectors in opposite directions)

Conversion to cosine similarity:

```
similitud = 1 - distancia / 2
```

The lab code does `sim = 1 - dist / 2`. With normalized vectors, `sim` will be in [0, 1] (1 = maximum similarity).

**Block 6: Search B — with filter (lines ~93–107)**

```python
resultados_filtro = collection.query(
    query_texts=[query],
    n_results=3,
    where={"categoria": "vacaciones"},
    include=["documents", "metadatas", "distances"]
)
```

- Equivalent to your `buscar(query, k=3, filtro={"categoria": "vacaciones"})`.
- **Pre-filtering:** Chroma filters *before* ranking. The 3 results are **guaranteed** to pass the filter. See operators in [§8.4](#84-query--search).

**Block 7: Advanced filters (lines ~109–127)**

```python
where={
    "$and": [
        {"categoria": {"$in": ["vacaciones", "horario"]}},
        {"version": {"$gte": "2024"}}
    ]
}
```

Demonstrates `$and`, `$in`, `$gte` — what in scratch you would program by hand with nested `if` statements.

**Block 8: CRUD (lines ~129–141)**

```python
collection.upsert(ids=["doc_01"], documents=[...], metadatas=[...])  # actualizar
collection.delete(ids=["doc_11", "doc_12"])                          # eliminar
collection.get(ids=["doc_01"], include=["metadatas"])                # leer por id
collection.count()                                                   # contar
```

Replicates the CRUD demo from your `solucion_scratch.py` with native APIs. See [§8.5–8.9](#85-update--update).

#### Section B — FAISS (`demo_faiss`)

**Block 1: Same model, same data (lines ~162–174)**

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
embeddings = modelo.encode(textos, normalize_embeddings=True)
dim = embeddings.shape[1]  # 768
```

Same embedding as Chroma. The difference starts **after** you have the vectors.

**Block 2: Build index (lines ~179–189)**

```python
index = faiss.IndexFlatIP(dim)                    # producto punto exacto
index_with_ids = faiss.IndexIDMap(index)          # permite IDs numéricos arbitrarios
index_with_ids.add_with_ids(
    embeddings.astype(np.float32),                # FAISS exige float32
    ids_numericos                                 # np.arange(12)
)
```

- `IndexFlatIP` = exhaustive dot product search. With normalized vectors, IP = cosine — same as your `for doc in store: coseno(...)` loop.
- `IndexIDMap` wraps the index so you can use integer IDs (0, 1, 2…) instead of implicit positions.
- **FAISS does not store text or metadata** — only vectors and positions.

**Block 3: id → document map (line ~193)**

```python
id_a_doc = {i: docs[i] for i in range(len(docs))}
```

**Mandatory.** Without this external dictionary, `search()` returns numeric indices (0, 5, 3) but you do not know which document it is or its category. Chroma resolves this internally; in FAISS it is your responsibility.

**Block 4: Search A — no filter (lines ~195–203)**

```python
query_vec = modelo.encode([query], normalize_embeddings=True).astype(np.float32)
scores, indices = index_with_ids.search(query_vec, k=3)
```

- `scores` = dot product (= cosine similarity if you normalized). **Already similarity, not distance** — unlike Chroma.
- `indices` = numeric IDs you passed in `add_with_ids`.

**Block 5: Search B — post-filtering (lines ~205–225)**

```python
k_extra = 12  # pedir TODOS porque FAISS no puede filtrar
scores_all, indices_all = index_with_ids.search(query_vec, k=k_extra)
filtrados = []
for score, idx in zip(scores_all[0], indices_all[0]):
    doc = id_a_doc[idx]
    if doc["metadata"]["categoria"] == filtro_categoria:
        filtrados.append((score, doc))
    if len(filtrados) == 3:
        break
```

**Why `k_extra = 12`:** with only 12 documents, we request all and filter. With 1M documents and a restrictive filter, requesting `k=3` could return 0 valid results (the 3 most similar globally are not in category "vacaciones"). Solution: request `k=100` or `k=1000` and filter — but recall degrades.

**Block 6: Persistence (lines ~227–232)**

```python
faiss.write_index(index_with_ids, "/tmp/hr_policies.faiss")
index_recuperado = faiss.read_index("/tmp/hr_policies.faiss")
```

Only saves vectors + index structure. Your `id_a_doc` map must be persisted separately (JSON, SQLite…). Chroma with `PersistentClient` saves everything together.

**Block 7: HNSW alternative (lines ~234–242)**

```python
index_hnsw = faiss.IndexHNSWFlat(dim, 16)  # M=16 conexiones por nodo
index_hnsw.add(embeddings.astype(np.float32))
```

For large collections (>100k) where flat is slow. Here with 12 docs it is irrelevant — illustrative. See [§6.3](#63-hnsw-hierarchical-navigable-small-world).

#### Final comparison (`imprimir_comparativa`)

Summarizes in a table what you just saw: Chroma = less code, native filters, CRUD; FAISS = more control, more speed at scale, more manual code.

---

### 15.6 Gotchas (common errors when moving from scratch to framework)

| Gotcha | What happens | How to avoid |
|--------|----------|---------------|
| **Distance ≠ similarity in Chroma** | You interpret `distances=0.12` as "12% similar" | With cosine: `sim = 1 - dist/2`. With normalized vectors, dist 0 = identical, dist 2 = opposite |
| **FAISS without id→doc map** | `search()` returns `5` but you do not know which document | Keep `id_a_doc = {i: doc}` or use `IndexIDMap` + inverse mapping |
| **Post-filtering with k too small** | You request top-3 in FAISS, filter by category, get 0–1 results | Request large `k_extra` (at least 10× desired k) and filter afterward |
| **Forgetting `normalize_embeddings=True`** | FAISS IP and Chroma cosine give incorrect rankings | Always normalize on `.encode()` and when indexing |
| **Float types in FAISS** | Silent error or crash | `embeddings.astype(np.float32)` — FAISS does not accept float64 |
| **Lists in Chroma metadata** | `add()` raises error | Only `str`, `int`, `float`, `bool` in metadata — see exercise 17.a |
| **Model download** | First run takes minutes | Plan BGE download (~440 MB) in advance |
| **Two upserts in the demo** | The lab upserts twice (with and without explicit embeddings) | In your code, use **only one**: either let Chroma embed, or pass `embeddings=` — not both |

---

### 15.7 Your checklist before the layer ③ workshop

Before writing `solucion_framework.py` (or your own version), verify you can:

- [ ] Install `chromadb`, `faiss-cpu`, `sentence-transformers` and download BGE-base.
- [ ] Explain what replaces each scratch function (`embeder`, `buscar`, `store`, filter).
- [ ] Write `collection.upsert(...)` and `collection.query(..., where=...)` without copying.
- [ ] Convert Chroma `distances` to similarity with `1 - dist/2`.
- [ ] Build `IndexFlatIP` + `IndexIDMap` + `id_a_doc` map in FAISS.
- [ ] Implement post-filtering in FAISS by requesting `k_extra` results.
- [ ] Compare Chroma vs FAISS for the workshop case (12 docs, filter by category).

**Next step:** [`lab/enunciado.md`](./lab/enunciado.md) — Part 5 (guided layer ③). Compare your code with [`lab/solucion_framework.py`](./lab/solucion_framework.py).

---

> **Market landscape:** this module uses Chroma/FAISS/pgvector as representatives, but there are **6+ storage families** (dedicated vector, relational+vector, hybrid engines, NoSQL+vector, graphs, specialized) and sometimes **you do not need a vector DB**. Complete vendor-neutral map in [`../referencia/panorama-bases-de-datos.md`](../referencia/panorama-bases-de-datos.md).

---

## 16. Checkpoint

### You know it if you can...

- [ ] Explain in 2 minutes what an embedding is, why it preserves semantics, and when BM25 beats it.
- [ ] Write the cosine similarity formula from memory and calculate the result for 3-dimensional vectors.
- [ ] Explain the difference between flat, IVF, and HNSW: intuition, key parameters, trade-offs.
- [ ] Decide which index type to use given N (number of documents) and the recall requirement.
- [ ] Perform the 4 CRUD operations in ChromaDB with metadata filters.
- [ ] List 3 reasons to choose FAISS and 3 to choose ChromaDB.
- [ ] Choose between pgvector, Qdrant, and Pinecone given a technical brief.
- [ ] Explain why template 02 Banking uses `store.pgvector` with `doc_type`/`period` filters.
- [ ] **New:** map each piece of your scratch (`embeder`, `store`, `buscar`, filter) to its equivalent in sentence-transformers, ChromaDB, and FAISS.
- [ ] **New:** write `collection.query(...)` from memory with `where` filter and convert `distances` to similarity.
- [ ] **New:** explain why FAISS needs an `id_a_doc` map and what post-filtering is.

### What to review if something is unclear

- Normalization and distances → sections 3 and 4
- IVF vs HNSW → section 6 + decision table
- ChromaDB CRUD → section 8 complete (with code)
- Scratch → framework bridge → **section 15** (this section)
- Choosing a store → section 12 (comparison table + anti-patterns)

---

*Next:* → [`ejercicios.md`](./ejercicios.md) · [`lab/enunciado.md`](./lab/enunciado.md)  
*Previous:* → [M2 — Ingestion](../02-ingesta/guia.md)  
*Reference:* → [`referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md)

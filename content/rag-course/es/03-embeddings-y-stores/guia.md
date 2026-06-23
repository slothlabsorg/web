# M3 · Embeddings y Vector Stores

> **Módulo 3 del curso RAGorbit** — Sem 3 (~32 h: ~12 h guía · ~8 h ejercicios · ~12 h taller)
>
> Nodos RAGorbit cubiertos: `store.chroma`, `store.pgvector`, `store.qdrant`, `store.neo4j`, `store.multi-index`, `model.embedding`
> Templates ancla: **09 RRHH** (`store.chroma`) · **02 Banca** (`store.pgvector`)

---

## Índice

1. [¿Qué es un embedding?](#1-qué-es-un-embedding)
2. [Dimensiones y espacio vectorial](#2-dimensiones-y-espacio-vectorial)
3. [Normalización de vectores](#3-normalización-de-vectores)
4. [Métricas de similitud: coseno, dot product, L2](#4-métricas-de-similitud-coseno-dot-product-l2)
5. [Qué es un índice vectorial](#5-qué-es-un-índice-vectorial)
6. [Tipos de índice: flat, IVF, HNSW](#6-tipos-de-índice-flat-ivf-hnsw)
7. [Persistencia y colecciones](#7-persistencia-y-colecciones)
8. [ChromaDB a fondo: operaciones CRUD](#8-chromadb-a-fondo-operaciones-crud)
9. [FAISS: qué es y cuándo usarlo](#9-faiss-qué-es-y-cuándo-usarlo)
10. [Vector store vs base de datos tradicional](#10-vector-store-vs-base-de-datos-tradicional)
11. [Sistemas de recomendación con embeddings](#11-sistemas-de-recomendación-con-embeddings)
12. [Comparativa de vector stores](#12-comparativa-de-vector-stores)
13. [Modelos de embedding: OpenAI vs Cohere vs BGE/E5 locales](#13-modelos-de-embedding-openai-vs-cohere-vs-bgee5-locales)
14. [Nodos RAGorbit y ancla a templates](#14-nodos-ragorbit-y-ancla-a-templates)
15. [La capa ③ explicada: del dict en memoria a ChromaDB, FAISS y sentence-transformers](#15-la-capa--explicada-del-dict-en-memoria-a-chromadb-faiss-y-sentence-transformers)
16. [Checkpoint](#16-checkpoint)

---

## 1. ¿Qué es un embedding?

Un **embedding** es la traducción de un objeto de alta dimensión semántica (texto, imagen, audio) a un vector de números reales de longitud fija. No es un hash ni un código — es una representación **geométrica**: objetos semánticamente similares quedan próximos en el espacio vectorial.

### Analogía

Imagina una ciudad en la que cada idea tiene una dirección. "política de vacaciones" y "días de descanso anuales" viven en el mismo barrio; "tipo de interés hipotecario" vive en otro distrito. Un embedding coloca cada frase en su coordenada dentro de este mapa conceptual.

### Cómo se genera

Un modelo de embedding (BERT, E5, text-embedding-3-large…) recibe un texto, lo procesa con una arquitectura transformer, y extrae el estado oculto de un token especial (`[CLS]`) o el promedio de todos los tokens. Este vector resume el significado del texto en ese espacio matemático.

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

### Por qué no usar TF-IDF o BM25

TF-IDF y BM25 son representaciones **léxicas**: dos frases idénticas en vocabulario pero diferentes en intención tendrán vectores similares; sinónimos tendrán vectores totalmente distintos. Los embeddings densos capturan **semántica**: "¿Cuántos días de vacaciones tengo?" y "días de permiso remunerado al año" quedan próximos aunque no compartan palabras.

Esto NO significa que embeddings siempre sean superiores. Para búsqueda de términos exactos (IDs, nombres de función, códigos de producto), BM25 suele ganar. La búsqueda híbrida (M4) combina ambos mundos.

---

## 2. Dimensiones y espacio vectorial

La **dimensión** de un embedding es la longitud del vector. Modelos comunes:

| Modelo | Dimensiones | Notas |
|--------|-------------|-------|
| `text-embedding-3-small` | 1 536 | OpenAI, económico |
| `text-embedding-3-large` | 3 072 | OpenAI, mayor calidad |
| `text-embedding-ada-002` | 1 536 | OpenAI, legacy |
| `embed-english-v3.0` | 1 024 | Cohere |
| `BAAI/bge-large-en-v1.5` | 1 024 | Open source, local |
| `intfloat/e5-large-v2` | 1 024 | Open source, local |
| `nomic-embed-text-v1` | 768 | Open source, contexto largo |

### Dimensionalidad y calidad

Más dimensiones no siempre equivalen a más calidad. Lo que importa es la **tarea** para la que se entrenó el modelo y el **dominio** del texto. Un modelo de 768 dimensiones bien alineado con tu dominio puede superar a uno de 3 072 dimensiones entrenado en texto genérico.

### La "maldición de la dimensionalidad"

En espacios de muy alta dimensión, las distancias entre puntos tienden a homogeneizarse: la diferencia entre el vecino más cercano y el más lejano se vuelve relativa. Por encima de ~2 000–4 000 dimensiones, los índices aproximados (ANN) se vuelven menos precisos. Para embeddings de texto, las dimensiones actuales (768–3 072) están bien en la práctica porque los vectores no son uniformes — contienen estructura semántica.

### Proyección y reducción (UMAP/PCA)

Para **visualizar** embeddings, se reducen a 2 o 3 dimensiones con UMAP o PCA. Esto es solo para exploración — no uses embeddings reducidos en producción (pierdes información).

---

## 3. Normalización de vectores

Un vector está **normalizado** si su norma L2 (longitud geométrica) es 1. La normalización se aplica dividiéndolo por su norma:

```
v̂ = v / ‖v‖₂       donde  ‖v‖₂ = √(v₁² + v₂² + ... + vₙ²)
```

### Ejemplo numérico

```
v = [3, 4]
‖v‖ = √(9 + 16) = √25 = 5
v̂ = [3/5, 4/5] = [0.6, 0.8]
‖v̂‖ = √(0.36 + 0.64) = √1.0 = 1.0   ✓
```

### Por qué normalizar

- La mayoría de los modelos de embedding modernos ya devuelven vectores normalizados.
- Con vectores normalizados, **similitud coseno = producto punto** (dot product). Esto permite usar las operaciones más rápidas de los índices vectoriales.
- Sin normalización, el producto punto favorece a los vectores de mayor magnitud, introduciendo un sesgo hacia textos más largos.

**Regla práctica:** siempre normaliza antes de indexar a menos que el vendor de tu embedding garantice que ya lo hace (OpenAI `text-embedding-3-*` lo hace).

---

## 4. Métricas de similitud: coseno, dot product, L2

### 4.1 Similitud coseno

Mide el ángulo entre dos vectores, ignorando su magnitud:

```
cos(θ) = (A · B) / (‖A‖ · ‖B‖)
```

Rango: [-1, 1]  
- 1 → misma dirección (máxima similitud)  
- 0 → perpendiculares (sin relación semántica)  
- -1 → opuestos

**Ejemplo con vectores pequeños:**

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

**Cuándo usar coseno:** casi siempre en text retrieval. Es robusto a la longitud del texto.

### 4.2 Producto punto (Dot Product / IP — Inner Product)

```
A · B = Σ (Aᵢ × Bᵢ)
```

Con vectores **normalizados**, `A · B = cos(θ)`. Sin normalización, el resultado mezcla similitud angular con magnitud.

**Ventaja:** es la operación más rápida (SIMD/GPU). Si normalizas previamente, obtienes exactamente la similitud coseno sin el costo de la división.

**Cuándo usar IP:** cuando el modelo garantiza vectores normalizados Y necesitas máxima velocidad. OpenAI recomienda IP para `text-embedding-3-*` precisamente porque entrega vectores unitarios.

### 4.3 Distancia L2 (Euclidiana)

```
d(A,B) = √(Σ (Aᵢ - Bᵢ)²)
```

Mide la distancia geométrica directa entre dos puntos. Menor distancia = mayor similitud.

**Ejemplo:**

```
A = [0.6, 0.8]
B = [0.5, 0.9]
d = √((0.6-0.5)² + (0.8-0.9)²) = √(0.01 + 0.01) = √0.02 ≈ 0.141
```

**Con vectores normalizados:** `d(A,B)² = 2 - 2×cos(θ)`. Es decir, L2 y coseno están relacionados monótonamente — dan el mismo orden de ranking cuando los vectores están normalizados.

**Cuándo usar L2:** cuando los embeddings NO están normalizados y la magnitud importa (p.ej. embeddings de imágenes donde la intensidad tiene significado).

### Resumen de métricas

| Métrica | Fórmula | Rango | Cuándo usar |
|---------|---------|-------|-------------|
| Coseno | `(A·B)/(‖A‖‖B‖)` | [-1, 1] | Text retrieval general |
| Dot product | `Σ AᵢBᵢ` | (-∞, +∞) | Vectores normalizados, máxima velocidad |
| L2 euclidiana | `√Σ(Aᵢ-Bᵢ)²` | [0, +∞) | Cuando la magnitud importa; clustering |

---

## 5. Qué es un índice vectorial

Un **índice vectorial** es una estructura de datos que permite responder eficientemente a la pregunta: "¿cuáles son los K vectores más similares a este query?"

### El problema sin índice

Con N vectores almacenados, responder una query requiere calcular la distancia con CADA vector. Esto es **búsqueda exhaustiva** (brute force):

```
Complejidad: O(N × D)   donde D = dimensiones
N = 1 000 000, D = 1 536 → 1.5 × 10⁹ operaciones por query
```

A 10 ms por millón de multiplicaciones: 15 segundos por query. Inaceptable.

### La solución: Approximate Nearest Neighbor (ANN)

Los índices ANN sacrifican un poco de **recall** (pueden perder algún vecino real) a cambio de una velocidad drásticamente mayor. El balance velocidad/recall es el parámetro central de diseño.

```
Recall = |vecinos_reales_encontrados| / K

Ejemplo: buscas top-5; el índice devuelve 5 resultados, 4 son los reales top-5 → recall@5 = 80%
```

---

## 6. Tipos de índice: flat, IVF, HNSW

### 6.1 Flat (búsqueda exhaustiva)

No es un índice ANN: compara el query con TODOS los vectores.

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

**Ventajas:**
- Recall = 100% (exacto)
- Muy simple de implementar
- Sin parámetros de tuning

**Desventajas:**
- Escala lineal: 10× más datos → 10× más lento
- Límite práctico: ~100k–500k vectores con latencia aceptable

**Cuándo usar flat:**
- Colecciones pequeñas (< 100k documentos)
- Desarrollo y prototipado
- Cuando la exactitud es crítica (auditores financieros, sistemas médicos)
- Benchmarks de baseline

**Nodo RAGorbit:** `store.chroma` en modo por defecto usa flat para colecciones pequeñas.

### 6.2 IVF (Inverted File Index)

**Intuición:** agrupa los vectores en C clústeres (celdas de Voronoi). Cuando llega un query, solo busca en los nlist_probe clústeres más cercanos en lugar de todos.

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

**Parámetros clave:**
- `nlist` (C): número de clústeres. Regla: `nlist ≈ sqrt(N)`. Para 1M vectores → 1000 clústeres.
- `nprobe`: cuántos clústeres explorar en query time. Mayor nprobe → mayor recall → mayor latencia.

```
nprobe = 1   → rápido, recall bajo (~60-70%)
nprobe = 10  → equilibrado, recall ~90%
nprobe = C   → igual que flat (exhaustivo)
```

**Ventajas:**
- Buen balance para colecciones medianas (100k–10M vectores)
- Entrenamiento rápido con k-means

**Desventajas:**
- Requiere fase de entrenamiento (k-means)
- Sensible a la distribución de los datos
- Recall cae en bordes de clúster (el vecino real puede estar en el clúster vecino)

**Variante IVF+PQ (Product Quantization):** comprime cada vector usando cuantización de producto, reduciendo memoria 8-32× a cambio de algo de recall. Ideal para 100M+ vectores en RAM limitada.

### 6.3 HNSW (Hierarchical Navigable Small World)

**Intuición:** construye un grafo navegable en múltiples capas (como una autopista + calles secundarias + callejones). La búsqueda empieza en la capa superior (pocas conexiones, saltos largos) y desciende hacia la capa inferior (muchas conexiones, búsqueda fina).

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

**Parámetros clave:**
- `M`: número de conexiones por nodo por capa. Mayor M → mayor recall, mayor memoria, construcción más lenta. Valores típicos: 16–64.
- `ef_construction`: tamaño de la lista de candidatos durante la construcción. Mayor → mejor calidad del grafo, más lento. Típico: 100–200.
- `ef_search` (o `ef`): tamaño de la cola de búsqueda en query time. Mayor → más recall → más lento.

```
M=16, ef_construction=200 → construcción equilibrada
ef_search=50  → recall ~95%, rápido
ef_search=200 → recall ~99%, más lento
```

**Ventajas:**
- Mejor recall/velocidad que IVF para colecciones medianas
- No requiere fase de entrenamiento separada (construye el grafo incrementalmente)
- Soporta inserciones incrementales eficientemente
- Es el índice por defecto de Chroma, Qdrant y otros

**Desventajas:**
- Mayor uso de memoria que IVF (almacena el grafo)
- Construcción más lenta que IVF para colecciones muy grandes (>10M)

**Comparativa visual:**

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

### Tabla de decisión

| Criterio | Flat | IVF | HNSW |
|---------|------|-----|------|
| Colección pequeña (<100k) | ✅ ideal | ok | ok |
| Colección mediana (100k–5M) | lento | ✅ | ✅ |
| Colección grande (>5M) | ❌ | ✅ IVF+PQ | puede saturar RAM |
| Inserciones frecuentes | ✅ | necesita re-index | ✅ |
| Recall exacto requerido | ✅ | ❌ | casi |
| Memoria limitada | ✅ | ✅ con PQ | mayor uso |

---

## 7. Persistencia y colecciones

### 7.1 Modos de persistencia

Los vector stores pueden operar en dos modos:

**In-memory (efímero):**
```
store = chromadb.Client()  # desaparece al cerrar el proceso
```
Útil para: tests, prototipado rápido, talleres sin dependencias.

**Persistente en disco:**
```
store = chromadb.PersistentClient(path="./chroma_db")  # escribe en disco
```
Útil para: desarrollo local, demos, colecciones que se construyen una vez y se consultan muchas.

**Persistente en servidor (producción):**
```
store = chromadb.HttpClient(host="localhost", port=8000)
```
Útil para: producción, múltiples workers, acceso concurrente.

### 7.2 Colecciones

Una **colección** es la unidad de organización dentro de un vector store. Análoga a una tabla en SQL o un índice en Elasticsearch.

Cada colección tiene:
- Un nombre único
- Una función de embedding (puede ser diferente por colección)
- Una métrica de distancia
- Sus propios vectores y metadatos

**Cuándo separar en colecciones:**
- Dominios distintos (políticas de RRHH vs manuales técnicos) — evita contaminación de resultados
- Idiomas distintos si el modelo no es multilingüe
- Modelos de embedding diferentes
- Ciclos de vida distintos (una colección se actualiza mensualmente; otra es de solo lectura)

**Template 09 RRHH:** usa una sola colección `hr_policies` en `store.chroma`. Suficiente porque todos los documentos son del mismo dominio.

**Template 02 Banca:** usa `store.pgvector` con índice `credit_docs` por expediente. En producción se usarían colecciones o esquemas separados por cliente.

---

## 8. ChromaDB a fondo: operaciones CRUD

ChromaDB es el vector store más simple de arrancar: no requiere Docker ni servidor externo para modo local. Por eso es el choice por defecto de RAGorbit para demos y `store.chroma`.

### 8.1 Instalación y cliente

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

### 8.2 Gestionar colecciones

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

### 8.3 ADD — añadir documentos

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

**Notas importantes:**
- Los `ids` deben ser únicos dentro de la colección. Si el id ya existe, Chroma lanza un error (usa `upsert` para update-or-insert).
- `documents` es texto plano que Chroma puede embeber automáticamente si no pasas `embeddings`.
- `metadatas` debe ser una lista de diccionarios con valores `str`, `int`, `float` o `bool`. NO soporta listas ni dicts anidados.

### 8.4 QUERY — consultar

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

**Filtros de metadata (operadores):**

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

**Filtro de contenido con `where_document`:**
```python
where_document={"$contains": "15 días"}
```

### 8.5 UPDATE — actualizar

```python
collection.update(
    ids=["doc_001"],
    documents=["Los empleados tienen 20 días de vacaciones al año (nueva política 2025)."],
    metadatas=[{"categoria": "vacaciones", "version": "2025"}]
)
```

Chroma recalcula automáticamente el embedding del nuevo texto.

### 8.6 UPSERT — crear o actualizar

```python
collection.upsert(
    ids=["doc_001", "doc_004"],  # doc_001 existe → update; doc_004 no existe → insert
    documents=["...", "..."],
    metadatas=[{...}, {...}]
)
```

Upsert es la operación más segura para pipelines de ingesta que se ejecutan repetidamente.

### 8.7 DELETE — eliminar

```python
# Por id
collection.delete(ids=["doc_001", "doc_002"])

# Por filtro de metadata
collection.delete(where={"version": "2023"})

# Por contenido
collection.delete(where_document={"$contains": "texto obsoleto"})
```

### 8.8 GET — recuperar por id (sin similitud)

```python
resultado = collection.get(
    ids=["doc_001", "doc_002"],
    include=["documents", "metadatas"]
)
```

Útil para verificar qué hay indexado o para pipelines de auditoría.

### 8.9 COUNT y PEEK

```python
total = collection.count()  # número de documentos en la colección

sample = collection.peek(5)  # primeros 5 documentos (para debug)
```

### Diagrama de flujo típico con ChromaDB

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

## 9. FAISS: qué es y cuándo usarlo

**FAISS** (Facebook AI Similarity Search) es una librería de C++ (con bindings Python) para búsqueda de vecinos más cercanos de alta eficiencia, desarrollada por Meta AI.

### Diferencias con ChromaDB

| Aspecto | FAISS | ChromaDB |
|---------|-------|---------|
| Qué es | Librería de índices (solo búsqueda) | Base de datos vectorial completa |
| Metadata filtering | No nativo (necesitas implementarlo tú) | Sí, con operadores ricos |
| Persistencia | Manual (`faiss.write_index` / `read_index`) | Automática |
| CRUD | Solo add/search (no update/delete eficiente) | Completo |
| Velocidad | Extrema (C++, BLAS/CUDA) | Buena |
| Uso típico | Investigación, ML pipelines, escala masiva | RAG apps, demos, producción media |

### Índices principales de FAISS

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

### Operaciones básicas

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

### FAISS con IDs personalizados

Por defecto, FAISS asigna índices enteros (0, 1, 2...). Para mapear a tus IDs de documento, mantén un diccionario externo:

```python
id_map = {}  # indice_faiss → id_documento
for i, doc_id in enumerate(tus_ids):
    id_map[i] = doc_id

# O usa IndexIDMap para gestión automática
index_with_ids = faiss.IndexIDMap(index_flat)
ids_array = np.array([101, 205, 307], dtype=np.int64)
index_with_ids.add_with_ids(vectors, ids_array)
```

### GPU con FAISS

FAISS tiene soporte nativo para GPU (CUDA):

```python
res = faiss.StandardGpuResources()
index_gpu = faiss.index_cpu_to_gpu(res, 0, index_flat)
# Búsqueda hasta 100× más rápida en GPU
```

### Cuándo elegir FAISS sobre ChromaDB

- Tienes millones de vectores y necesitas máxima velocidad
- Integras en un pipeline de ML (no una app RAG estándar)
- Necesitas control fino del algoritmo de índice (IVF+PQ para memoria limitada, HNSW para recall alto)
- Tu equipo tiene experiencia con numpy/C++
- No necesitas filtros de metadata complejos

---

## 10. Vector store vs base de datos tradicional

### Por qué no usar PostgreSQL "normal"

Una tabla SQL puede almacenar embeddings como arrays:

```sql
CREATE TABLE documentos (
    id TEXT PRIMARY KEY,
    texto TEXT,
    embedding FLOAT8[],
    categoria TEXT
);
```

Pero buscar los K más cercanos requiere:

```sql
SELECT id, texto,
       embedding <-> query_embedding AS distancia
FROM documentos
ORDER BY distancia
LIMIT 5;
```

Esto es una búsqueda exhaustiva — `O(N)`. Con 1M documentos, es lentísimo.

### pgvector al rescate

**pgvector** es una extensión de PostgreSQL que añade:
- Tipo de dato `vector(1536)`
- Operadores de distancia: `<->` (L2), `<#>` (IP negativo), `<=>` (coseno)
- Índices HNSW e IVF dentro de Postgres

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

Esto combina filtros SQL con búsqueda vectorial eficiente. Por eso `store.pgvector` es el choice en el template 02 Banca: necesitas filtros duros por `doc_type` y `period` usando SQL estándar.

### Comparativa conceptual

| Aspecto | BD relacional | BD vectorial | BD relacional + pgvector |
|---------|--------------|--------------|--------------------------|
| Búsqueda semántica | ❌ | ✅ | ✅ |
| Filtros complejos | ✅ | limitado | ✅ |
| Joins, agregaciones | ✅ | ❌ | ✅ |
| Transacciones ACID | ✅ | depende | ✅ |
| Escala >100M vectores | ❌ | ✅ dedicadas | ❌ |
| Infraestructura ya existente | ✅ | no | ✅ si tienes Postgres |

**Regla práctica:** si ya tienes Postgres en producción y tu escala es < 5M vectores, pgvector es la opción más sencilla. Para escala masiva o funcionalidades avanzadas (filtros numéricos complejos, streaming de actualizaciones), usa Qdrant o Weaviate.

---

## 11. Sistemas de recomendación con embeddings

El motor de búsqueda semántica de un vector store es fundamentalmente un motor de recomendación. La misma consulta `top-K por similitud` que usas para RAG se aplica a recomendación de productos, contenido, canciones, etc.

### Patrón item-to-item

"Dado un ítem que el usuario está viendo, recomienda ítems similares":

```
Ítem actual: embedding(descripción_producto_A)
                     │
                     ▼
      query al vector store con ese embedding
                     │
                     ▼
       Top-5 productos más similares → mostrar como recomendaciones
```

### Patrón user-to-item (collaborative filtering denso)

"Dado el historial de un usuario, recomienda nuevos ítems":

1. Generar el embedding del usuario: promedio o transformación de los embeddings de los ítems que consumió.
2. Buscar top-K en el espacio de ítems.

```python
# Perfil del usuario como promedio de embeddings de artículos leídos
perfil_usuario = np.mean([embedding(articulo_1), embedding(articulo_2), ...], axis=0)
top_k = vector_store.query(perfil_usuario, k=5)
```

### Patrón de detección de duplicados/near-duplicates

```
Para cada nuevo documento:
  embedding(doc_nuevo) → query top-1 en el store
  Si similitud > 0.95 → probable duplicado, no indexar
```

### Ancla con RAGorbit

En el template 09 RRHH, el mismo `store.chroma` con `retrieval.vector` actúa como motor de recomendación de políticas: dada la pregunta del empleado, recomienda los fragmentos más relevantes. La búsqueda vectorial es la misma operación matemática que un sistema de recomendación.

---

## 12. Comparativa de vector stores

### Tabla principal

| Store | Tipo | Filtros | Índices | Escala | On-premise | Cloud managed | Fortaleza |
|-------|------|---------|---------|--------|-----------|---------------|-----------|
| **ChromaDB** | Open source | Ricos (operadores) | HNSW, flat | Hasta ~10M | ✅ | ❌ nativo | Simplicidad, zero-config, ideal RAG apps |
| **FAISS** | Librería | Manual (externo) | Flat, IVF, HNSW, PQ | 100M+ | ✅ | ❌ | Velocidad extrema, investigación, ML pipelines |
| **pgvector** | Extensión Postgres | Full SQL | HNSW, IVF | ~5M práctico | ✅ | ✅ (RDS, AlloyDB, Supabase) | Si ya tienes Postgres; joins complejos |
| **Qdrant** | BD vectorial dedicada | Muy ricos (payload) | HNSW, cuantización | 100M+ | ✅ Docker | ✅ Qdrant Cloud | Filtros avanzados, rendimiento, Rust |
| **Pinecone** | BD vectorial SaaS | Metadata filters | Propietario (ANN) | Ilimitada | ❌ | ✅ | Zero-ops, escala automática |
| **Weaviate** | BD vectorial + grafo | GraphQL + BM25 híbrido | HNSW | 100M+ | ✅ Docker | ✅ WCS | Búsqueda híbrida nativa, multimodal |
| **Milvus** | BD vectorial open | Rich | HNSW, IVF, DiskANN | 1B+ | ✅ | ✅ Zilliz | Escala enterprise, ecosistema Attu |

### Cuándo elegir cada uno

**ChromaDB:** primer prototipo, demos, equipos sin DevOps. `store.chroma` en RAGorbit.

**FAISS:** necesitas lo más rápido posible y controlas tú la infraestructura (pipelines ML internos, investigación). Sin gestión de colecciones ni servidor.

**pgvector:** ya tienes Postgres y tu escala es < 5M vectores. Evitas añadir otro sistema. Template 02 Banca usa `store.pgvector` porque los filtros duros SQL son parte del requisito regulatorio.

**Qdrant:** production-grade, necesitas filtros de payload complejos, quieres on-premise sin lock-in a cloud. Muy buen equilibrio velocidad/features.

**Pinecone:** equipo de producto que no quiere gestionar infraestructura y puede pagar el SaaS. La opción "serverless" de vector stores.

**Weaviate:** necesitas búsqueda híbrida (semántica + BM25) nativa sin código extra, o el dominio combina texto con imágenes.

**Milvus:** escala de 100M–1B+ vectores, empresa grande con equipo de plataforma dedicado.

### Anti-patrones frecuentes

- Usar ChromaDB en producción con 50M+ documentos (se vuelve lento).
- Usar FAISS cuando necesitas filtros de metadata (tienes que implementar la lógica tú y re-filtrar post-búsqueda, lo que degrada el recall).
- Usar pgvector para colecciones > 5M sin análisis de rendimiento previo.
- Elegir Pinecone por defecto por comodidad sin evaluar el lock-in.

---

## 13. Modelos de embedding: OpenAI vs Cohere vs BGE/E5 locales

### Dimensión comparativa

| Modelo | Dim | Max tokens | Multilingüe | Costo | Privacidad | Velocidad |
|--------|-----|-----------|-------------|-------|-----------|-----------|
| `text-embedding-3-small` | 1 536 | 8 191 | Sí | $0.02/1M tokens | ❌ API externa | API latency |
| `text-embedding-3-large` | 3 072 | 8 191 | Sí | $0.13/1M tokens | ❌ API externa | API latency |
| `text-embedding-ada-002` | 1 536 | 8 191 | Sí | $0.10/1M tokens | ❌ API externa | API latency, legacy |
| `embed-english-v3.0` | 1 024 | 512 | No (english) | $0.10/1M tokens | ❌ API externa | API latency |
| `embed-multilingual-v3.0` | 1 024 | 512 | Sí (100 idiomas) | $0.10/1M tokens | ❌ API externa | API latency |
| `BAAI/bge-large-en-v1.5` | 1 024 | 512 | No (english) | Gratis | ✅ local | GPU requerida para velocidad |
| `BAAI/bge-m3` | 1 024 | 8 192 | Sí (100 idiomas) | Gratis | ✅ local | GPU recomendada |
| `intfloat/e5-large-v2` | 1 024 | 512 | No | Gratis | ✅ local | GPU requerida |
| `intfloat/multilingual-e5-large` | 1 024 | 512 | Sí | Gratis | ✅ local | GPU recomendada |
| `nomic-embed-text-v1` | 768 | 8 192 | No | Gratis | ✅ local | GPU opcional |

### Cuándo elegir cada familia

**OpenAI (`text-embedding-3-*`):**
- Ya usas OpenAI para LLM (API key lista)
- Contenido en múltiples idiomas sin complejidad adicional
- No tienes GPU local
- Quieres el menor tiempo de desarrollo posible

**Cohere (`embed-*-v3`):**
- Documentos en inglés puro con límite de 512 tokens (ya troceas bien)
- La API de Cohere ya está en tu stack (p.ej. usas su reranker)

**BGE (BAAI):**
- Privacidad de datos: los documentos no pueden salir de tu infraestructura
- Presupuesto limitado (cero costo de API)
- Tienes GPU disponible (A10/T4/RTX son suficientes)
- Dominio específico: puedes hacer fine-tune de BGE con datos propios

**E5:**
- Similar a BGE. La familia E5 tiene variantes de "instruction-tuned" que aceptan un prefijo de tarea (`query: ...` / `passage: ...`) para mejorar precisión en retrieval asimétrico.

**Nodo RAGorbit `model.embedding`:**

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

Para usar un modelo local:

```json
{
  "type": "model.embedding",
  "config": {
    "model": "BAAI/bge-large-en-v1.5",
    "local": true
  }
}
```

### Embeddings asimétricos vs simétricos

**Simétrico:** query y documento son del mismo tipo (ambos son preguntas o ambos son respuestas). Los modelos estándar funcionan bien.

**Asimétrico:** la query es corta ("¿días de vacaciones?") y el documento es largo (párrafo completo de la política). Los modelos tipo **E5** y **BGE** tienen variantes específicas para retrieval asimétrico:

```python
# E5: prefijo de tarea
query_text = "query: ¿cuántos días de vacaciones tengo?"
doc_text = "passage: Los empleados tienen derecho a 15 días..."
```

En RAG, el retrieval es casi siempre asimétrico. Para producción con alta calidad, usa E5 o BGE con los prefijos correspondientes.

---

## 14. Nodos RAGorbit y ancla a templates

### `model.embedding`

Nodo independiente que proporciona la función de embedding al store. No produce chunks ni texto — produce `Embeddings` que el store consume para indexar.

```
model.embedding (Embeddings →) ──────────▶ store.chroma/pgvector/qdrant (→ Embeddings)
```

**Configuración típica:**
```json
{
  "model": "text-embedding-3-large",
  "local": false,
  "apiKeyRef": "OPENAI_API_KEY"
}
```

### `store.chroma`

Chroma local, sin infraestructura. Ideal para demos y desarrollo. En el **template 09 RRHH** (`hr-policy-assistant`), el grafo es:

```
loader.pdf → ingest.chunker → store.chroma ← model.embedding
                                   │ Retriever
                                   ▼
                            retrieval.vector (topK: 4)
```

Sin filtros de metadata porque todas las políticas son del mismo dominio.

### `store.pgvector`

Postgres con extensión vectorial. En el **template 02 Banca** (`banking-credit-scoring`):

```
loader.pdf + loader.tabular → ingest.chunker → ingest.metadata → store.pgvector ← model.embedding
                                                                        │ Retriever
                                                                        ▼
                                                         retrieval.vector (topK: 6, hardFilters: [doc_type, period])
```

Los filtros `doc_type` y `period` aseguran que para evaluar el expediente del año 2023 solo se recuperen documentos de ese período — guardrail semántico implementado como filtro de metadata.

### `store.qdrant`, `store.neo4j`, `store.multi-index`

- `store.qdrant`: producción con filtros de payload avanzados y escalabilidad. Los templates de salud (M4) y telecom (M4) lo usarían en producción.
- `store.neo4j`: GraphRAG. Los documentos se almacenan como nodos con relaciones tipadas. Permite recuperar por vecindario en el grafo, no solo por similitud vectorial (M4).
- `store.multi-index`: agrupa múltiples índices para routing. El retriever puede elegir el índice correcto según la query (M4).

---

## 15. La capa ③ explicada: del dict en memoria a ChromaDB, FAISS y sentence-transformers

> **Para quién es esta sección:** acabas de completar el taller en capa ② (`lab/solucion_scratch.py`): un `dict` en memoria, embedding bag-of-words de 20 dimensiones, coseno manual y filtro a mano. Aquí aprendes las **tres librerías** que reemplazan cada pieza — para que puedas **escribir** `lab/solucion_framework.py` tú mismo, no solo leerlo.
>
> **Prerrequisitos:** haber leído §8 (ChromaDB) y §9 (FAISS). Esta sección no las duplica: las **conecta** con lo que ya hiciste a mano.

### 15.1 El mapa mental: tu scratch vs las librerías reales

En el taller scratch construiste un pipeline completo con solo Python estándar. Cada pieza tiene un equivalente en producción:

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

**Tabla puente detallada:**

| Lo que hiciste a mano (scratch) | Pieza real | Librería / API |
|--------------------------------|------------|----------------|
| `embeder(texto)` — conteo de 20 palabras del vocabulario | Modelo neuronal que convierte texto → vector denso de 768 dims | `sentence-transformers`: `SentenceTransformer("BAAI/bge-base-en-v1.5").encode(textos, normalize_embeddings=True)` |
| `store[id] = {"vector", "texto", "metadata"}` — dict Python | Colección con vectores + texto + metadata indexados | `chromadb`: `client.get_or_create_collection(...)` + `collection.upsert(ids, documents, embeddings, metadatas)` |
| `coseno(query_vec, doc_vec)` — producto punto de vectores normalizados | Índice que calcula IP (= coseno si normalizas) sobre millones de vectores en C++ | `faiss`: `IndexFlatIP(dim)` + `search(query_vec, k)` |
| `buscar(query, k, filtro)` — recorre todos los docs, filtra, ordena | Query con filtro integrado en el índice (pre-filtering) | `chromadb`: `collection.query(..., where={"categoria": "vacaciones"})` — ver [§8.4](#84-query--consultar) |
| Mismo filtro en FAISS | Pedir K_extra resultados y filtrar en Python después | Post-filtering manual — ver [§9](#9-faiss-qué-es-y-cuándo-usarlo) y [§15.5](#155-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy) |
| Sin persistencia (RAM) | Guardar en disco y recuperar | Chroma: `PersistentClient(path=...)` · FAISS: `faiss.write_index` / `read_index` |
| Búsqueda O(N) exhaustiva sobre 12 docs | Índice ANN (HNSW) para millones | Chroma activa HNSW internamente · FAISS: `IndexHNSWFlat(dim, M)` |

**Diagrama del flujo completo (capa ③):**

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

### 15.2 `sentence-transformers`: tu `embeder()` pero de verdad

#### ¿Qué es?

`sentence-transformers` es una librería Python que envuelve modelos transformer (BERT, BGE, E5…) entrenados para producir **vectores de oraciones completas**. No necesitas saber cómo funciona un transformer por dentro — solo necesitas saber que convierte texto en un array de números donde textos parecidos en significado quedan cerca.

```bash
pip install sentence-transformers
# La primera vez descarga el modelo (~440 MB para BGE-base)
```

#### Instalación mínima y primer uso

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

#### Cómo reemplaza tu `embeder()` del scratch

| Aspecto | `embeder()` scratch | `modelo.encode()` real |
|---------|---------------------|------------------------|
| Dimensiones | 20 (fijas, vocabulario manual) | 768 (aprendidas por el modelo) |
| Semántica | Solo palabras exactas del vocab | Sinónimos y paráfrasis cercanos |
| Determinismo | Sí (mismo texto → mismo vector) | Sí (mismo modelo + mismo texto → mismo vector) |
| Red / pip | No requiere | Requiere pip + descarga del modelo |
| Normalización | Tú llamas `normalizar()` | `normalize_embeddings=True` lo hace el modelo |

**Mini-ejemplo comparativo:**

```python
# SCRATCH (lo que hiciste en el taller):
def embeder(texto):
    tokens = texto.lower().split()
    return [float(tokens.count(p)) for p in VOCAB]  # 20 dims, bag-of-words

# FRAMEWORK (lo que usarás en capa ③):
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
vec = modelo.encode(texto, normalize_embeddings=True)  # 768 dims, semántica real
```

Con el embedding real, `"dias de permiso"` y `"vacaciones anuales"` tendrán similitud alta aunque no compartan palabras — algo imposible con bag-of-words.

#### ¿Por qué `normalize_embeddings=True`?

Igual que en el scratch: si normalizas antes de indexar, el producto punto **es** la similitud coseno. FAISS con `IndexFlatIP` y Chroma con `metadata={"hnsw:space": "cosine"}` asumen vectores unitarios. Si no normalizas:
- FAISS IP favorece vectores largos (textos largos ganan sin ser más relevantes).
- Las distancias de Chroma pierden calibración.

**Regla:** siempre `normalize_embeddings=True` al llamar `.encode()` para retrieval.

#### Bi-encoder vs cross-encoder (intuición, sin profundizar)

- **Bi-encoder** (lo que usa `sentence-transformers`): embede query y documento **por separado** → comparas vectores con coseno. Rápido: puedes pre-calcular todos los documentos y buscar en O(log N) con un índice.
- **Cross-encoder** (rerankers, M4): mete query + documento **juntos** en un solo modelo → score de relevancia más preciso pero lento (no puedes pre-indexar). Se usa en segunda pasada para reordenar top-100.

Para indexar y buscar (este módulo), siempre bi-encoder.

#### Tamaño del modelo BGE-base

`BAAI/bge-base-en-v1.5` pesa ~440 MB en disco. La primera ejecución lo descarga de Hugging Face. En CPU tarda ~50–200 ms por batch pequeño; con GPU es mucho más rápido. Para datos privados de empleados (template 09 RRHH), es la elección correcta: cero costo de API, datos no salen de tu máquina.

---

### 15.3 Puente hacia ChromaDB (§8) y FAISS (§9)

Ya leíste las APIs completas en [§8](#8-chromadb-a-fondo-operaciones-crud) y [§9](#9-faiss-qué-es-y-cuándo-usarlo). Aquí solo el **puente conceptual** desde tu scratch:

**ChromaDB = tu `dict` store + índice + filtros, empaquetado:**

| Tu función scratch | Equivalente ChromaDB | Sección |
|-------------------|---------------------|---------|
| `store[id] = {...}` al cargar JSONs | `collection.upsert(ids, documents, embeddings, metadatas)` | [§8.6](#86-upsert--crear-o-actualizar) |
| `buscar(query, k, filtro=None)` | `collection.query(query_texts=[query], n_results=k, where=filtro)` | [§8.4](#84-query--consultar) |
| `actualizar(id, ...)` en demo CRUD | `collection.upsert(ids=[id], ...)` | [§8.6](#86-upsert--crear-o-actualizar) |
| `eliminar(id)` | `collection.delete(ids=[id])` | [§8.7](#87-delete--eliminar) |
| `len(store)` | `collection.count()` | [§8.9](#89-count-y-peek) |

**FAISS = solo el motor de búsqueda vectorial rápido; tú gestionas el resto:**

| Tu función scratch | Equivalente FAISS | Sección |
|-------------------|------------------|---------|
| `store` dict con vectores | `IndexFlatIP(dim)` o `IndexHNSWFlat(dim, M)` | [§9](#9-faiss-qué-es-y-cuándo-usarlo) |
| IDs string (`"doc_01"`) | `IndexIDMap` + `add_with_ids(vectors, ids_numericos)` | [§9 — FAISS con IDs personalizados](#faiss-con-ids-personalizados) |
| `metadata` en cada entrada del dict | **No existe en FAISS** → mapa externo `id_a_doc = {i: doc}` | [§9 — diferencias con ChromaDB](#diferencias-con-chromadb) |
| `buscar()` con filtro | `search(k_extra)` + filtrar en Python (post-filtering) | [§15.5](#155-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy) |
| Guardar store en disco | `faiss.write_index(index, "archivo.faiss")` | [§9 — operaciones básicas](#operaciones-básicas) |

---

### 15.4 Antes de escribir código: qué instalar

```bash
pip install chromadb faiss-cpu sentence-transformers
# faiss-cpu en Mac/Linux sin GPU; usa faiss-gpu si tienes CUDA
```

La primera ejecución descarga `BAAI/bge-base-en-v1.5` (~440 MB). Necesitas red. En el entorno del curso (sin pip/red) solo corre la capa ②; la capa ③ la ejecutas en tu máquina cuando tengas los paquetes.

---

### 15.5 Recorrido bloque por bloque de `lab/solucion_framework.py`

Abre [`lab/solucion_framework.py`](./lab/solucion_framework.py) mientras lees. El archivo tiene dos secciones (A: ChromaDB, B: FAISS) más una comparativa.

#### Sección A — ChromaDB (`demo_chromadb`)

**Bloque 1: Cliente y colección (líneas ~31–38)**

```python
client = chromadb.Client()  # in-memory; en producción: PersistentClient(path="./datos")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"}  # métrica coseno en el índice interno
)
```

- `Client()` = equivalente a tu `store = {}` vacío en RAM. Desaparece al cerrar el proceso.
- `get_or_create_collection` = crear la "tabla" donde vivirán vectores + texto + metadata. El `metadata={"hnsw:space": "cosine"}` le dice a Chroma que use distancia coseno (como tu `coseno()` manual).
- Detalle de persistencia: [§7.1](#71-modos-de-persistencia) y [§8.1](#81-instalación-y-cliente).

**Bloque 2: Modelo de embedding (líneas ~40–44)**

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
```

Reemplaza tu `embeder()`. Chroma *podría* embeber solo con `documents=` y su modelo interno (all-MiniLM), pero aquí queremos controlar el modelo — igual que en producción con `model.embedding` en RAGorbit.

**Bloque 3: Cargar JSONs (líneas ~46–54)**

```python
for archivo in sorted(datos_dir.glob("doc_*.json")):
    doc = json.load(f)
    ids.append(doc["id"])
    textos.append(doc["texto"])
    metadatas.append(doc["metadata"])
```

Idéntico a tu `cargar_documentos()` del scratch: separas `id`, texto y metadata en listas paralelas (Chroma las quiere así).

**Bloque 4: Indexar con embeddings pre-calculados (líneas ~64–71)**

```python
embeddings = modelo.encode(textos, normalize_embeddings=True).tolist()
collection.upsert(
    ids=ids,
    documents=textos,
    embeddings=embeddings,
    metadatas=metadatas,
)
```

- `modelo.encode(...)` → matriz (12, 768); `.tolist()` porque Chroma espera listas Python, no numpy.
- `upsert` = "crea si no existe, actualiza si existe" — la operación segura para pipelines de ingesta. Ver [§8.6](#86-upsert--crear-o-actualizar).
- Pasar `embeddings=` explícitos evita que Chroma use su modelo interno (diferente dimensionalidad).

**Bloque 5: Búsqueda A — sin filtro (líneas ~75–91)**

```python
resultados = collection.query(
    query_texts=[query],
    n_results=3,
    include=["documents", "metadatas", "distances"]
)
```

- Equivalente a tu `buscar(query, k=3, filtro=None)`.
- `query_texts` acepta texto crudo; Chroma lo embebe internamente **o** puedes pasar `query_embeddings=` si ya calculaste el vector con tu modelo.
- `include` controla qué campos devuelve. Siempre pide `distances` para interpretar scores.

**Interpretar `distances` → similitud:**

Chroma con espacio coseno devuelve **distancia** (no similitud):
- `0` = idénticos
- `2` = opuestos (vectores en direcciones contrarias)

Conversión a similitud coseno:

```
similitud = 1 - distancia / 2
```

El código del lab hace `sim = 1 - dist / 2`. Con vectores normalizados, `sim` estará en [0, 1] (1 = máxima similitud).

**Bloque 6: Búsqueda B — con filtro (líneas ~93–107)**

```python
resultados_filtro = collection.query(
    query_texts=[query],
    n_results=3,
    where={"categoria": "vacaciones"},
    include=["documents", "metadatas", "distances"]
)
```

- Equivalente a tu `buscar(query, k=3, filtro={"categoria": "vacaciones"})`.
- **Pre-filtering:** Chroma filtra *antes* de rankear. Los 3 resultados **garantizados** pasan el filtro. Ver operadores en [§8.4](#84-query--consultar).

**Bloque 7: Filtros avanzados (líneas ~109–127)**

```python
where={
    "$and": [
        {"categoria": {"$in": ["vacaciones", "horario"]}},
        {"version": {"$gte": "2024"}}
    ]
}
```

Demuestra `$and`, `$in`, `$gte` — lo que en el scratch tendrías que programar a mano con `if` anidados.

**Bloque 8: CRUD (líneas ~129–141)**

```python
collection.upsert(ids=["doc_01"], documents=[...], metadatas=[...])  # actualizar
collection.delete(ids=["doc_11", "doc_12"])                          # eliminar
collection.get(ids=["doc_01"], include=["metadatas"])                # leer por id
collection.count()                                                   # contar
```

Replica el demo CRUD de tu `solucion_scratch.py` con APIs nativas. Ver [§8.5–8.9](#85-update--actualizar).

#### Sección B — FAISS (`demo_faiss`)

**Bloque 1: Mismo modelo, mismos datos (líneas ~162–174)**

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
embeddings = modelo.encode(textos, normalize_embeddings=True)
dim = embeddings.shape[1]  # 768
```

Mismo embedding que Chroma. La diferencia empieza **después** de tener los vectores.

**Bloque 2: Construir índice (líneas ~179–189)**

```python
index = faiss.IndexFlatIP(dim)                    # producto punto exacto
index_with_ids = faiss.IndexIDMap(index)          # permite IDs numéricos arbitrarios
index_with_ids.add_with_ids(
    embeddings.astype(np.float32),                # FAISS exige float32
    ids_numericos                                 # np.arange(12)
)
```

- `IndexFlatIP` = búsqueda exhaustiva por producto punto. Con vectores normalizados, IP = coseno — igual que tu bucle `for doc in store: coseno(...)`.
- `IndexIDMap` envuelve el índice para que puedas usar IDs enteros (0, 1, 2…) en lugar de posiciones implícitas.
- **FAISS no guarda texto ni metadata** — solo vectores y posiciones.

**Bloque 3: Mapa id → documento (línea ~193)**

```python
id_a_doc = {i: docs[i] for i in range(len(docs))}
```

**Obligatorio.** Sin este diccionario externo, `search()` te devuelve índices numéricos (0, 5, 3) pero no sabes qué documento es ni su categoría. Chroma lo resuelve internamente; en FAISS es tu responsabilidad.

**Bloque 4: Búsqueda A — sin filtro (líneas ~195–203)**

```python
query_vec = modelo.encode([query], normalize_embeddings=True).astype(np.float32)
scores, indices = index_with_ids.search(query_vec, k=3)
```

- `scores` = producto punto (= similitud coseno si normalizaste). **Ya es similitud, no distancia** — a diferencia de Chroma.
- `indices` = IDs numéricos que pasaste en `add_with_ids`.

**Bloque 5: Búsqueda B — post-filtering (líneas ~205–225)**

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

**Por qué `k_extra = 12`:** con solo 12 documentos, pedimos todos y filtramos. Con 1M documentos y filtro restrictivo, pedir `k=3` podría devolver 0 resultados válidos (los 3 más similares globalmente no son de categoría "vacaciones"). Solución: pedir `k=100` o `k=1000` y filtrar — pero el recall se degrada.

**Bloque 6: Persistencia (líneas ~227–232)**

```python
faiss.write_index(index_with_ids, "/tmp/hr_policies.faiss")
index_recuperado = faiss.read_index("/tmp/hr_policies.faiss")
```

Solo guarda vectores + estructura del índice. Tu mapa `id_a_doc` debes persistirlo aparte (JSON, SQLite…). Chroma con `PersistentClient` guarda todo junto.

**Bloque 7: HNSW alternativo (líneas ~234–242)**

```python
index_hnsw = faiss.IndexHNSWFlat(dim, 16)  # M=16 conexiones por nodo
index_hnsw.add(embeddings.astype(np.float32))
```

Para colecciones grandes (>100k) donde flat es lento. Aquí con 12 docs es irrelevante — es ilustrativo. Ver [§6.3](#63-hnsw-hierarchical-navigable-small-world).

#### Comparativa final (`imprimir_comparativa`)

Resume en tabla lo que acabas de ver: Chroma = menos código, filtros nativos, CRUD; FAISS = más control, más velocidad a escala, más código manual.

---

### 15.6 Gotchas (errores frecuentes al pasar de scratch a framework)

| Gotcha | Qué pasa | Cómo evitarlo |
|--------|----------|---------------|
| **Distancia ≠ similitud en Chroma** | Interpretas `distances=0.12` como "12% similar" | Con coseno: `sim = 1 - dist/2`. Con vectores normalizados, dist 0 = idénticos, dist 2 = opuestos |
| **FAISS sin mapa id→doc** | `search()` devuelve `5` pero no sabes qué documento es | Mantén `id_a_doc = {i: doc}` o usa `IndexIDMap` + mapeo inverso |
| **Post-filtering con k muy pequeño** | Pides top-3 en FAISS, filtras por categoría, obtienes 0–1 resultados | Pide `k_extra` grande (10× el k deseado como mínimo) y filtra después |
| **Olvidar `normalize_embeddings=True`** | FAISS IP y Chroma coseno dan rankings incorrectos | Siempre normaliza al `.encode()` y al indexar |
| **Tipos float en FAISS** | Error silencioso o crash | `embeddings.astype(np.float32)` — FAISS no acepta float64 |
| **Metadata con listas en Chroma** | `add()` lanza error | Solo `str`, `int`, `float`, `bool` en metadata — ver ejercicio 17.a |
| **Descarga del modelo** | Primera ejecución tarda minutos | Planifica la descarga de BGE (~440 MB) con antelación |
| **Dos upsert en el demo** | El lab hace upsert dos veces (con y sin embeddings explícitos) | En tu código, usa **solo uno**: o dejas que Chroma embeba, o pasas `embeddings=` — no ambos |

---

### 15.7 Tu checklist antes del taller capa ③

Antes de escribir `solucion_framework.py` (o tu propia versión), verifica que puedes:

- [ ] Instalar `chromadb`, `faiss-cpu`, `sentence-transformers` y descargar BGE-base.
- [ ] Explicar qué reemplaza cada función de tu scratch (`embeder`, `buscar`, `store`, filtro).
- [ ] Escribir `collection.upsert(...)` y `collection.query(..., where=...)` sin copiar.
- [ ] Convertir `distances` de Chroma a similitud con `1 - dist/2`.
- [ ] Construir `IndexFlatIP` + `IndexIDMap` + mapa `id_a_doc` en FAISS.
- [ ] Implementar post-filtering en FAISS pidiendo `k_extra` resultados.
- [ ] Comparar Chroma vs FAISS para el caso del taller (12 docs, filtro por categoría).

**Siguiente paso:** [`lab/enunciado.md`](./lab/enunciado.md) — Parte 5 (capa ③ guiada). Compara tu código con [`lab/solucion_framework.py`](./lab/solucion_framework.py).

---

> **Panorama del mercado:** este módulo usa Chroma/FAISS/pgvector como representantes, pero hay **6+ familias** de almacenamiento (vector dedicadas, relacional+vector, motores híbridos, NoSQL+vector, grafos, especializadas) y a veces **no necesitas una vector DB**. Mapa completo y vendor-neutral en [`../referencia/panorama-bases-de-datos.md`](../referencia/panorama-bases-de-datos.md).

---

## 16. Checkpoint

### Lo sabes si puedes...

- [ ] Explicar en 2 minutos qué es un embedding, por qué preserva semántica y cuándo BM25 lo supera.
- [ ] Escribir de memoria la fórmula de similitud coseno y calcular el resultado para vectores de 3 dimensiones.
- [ ] Explicar la diferencia entre flat, IVF y HNSW: intuición, parámetros clave, trade-offs.
- [ ] Decidir qué tipo de índice usar dado N (número de documentos) y el requisito de recall.
- [ ] Hacer las 4 operaciones CRUD en ChromaDB con filtros de metadata.
- [ ] Enumerar 3 razones para elegir FAISS y 3 para elegir ChromaDB.
- [ ] Elegir entre pgvector, Qdrant y Pinecone dado un brief técnico.
- [ ] Explicar por qué el template 02 Banca usa `store.pgvector` con filtros `doc_type`/`period`.
- [ ] **Nuevo:** mapear cada pieza de tu scratch (`embeder`, `store`, `buscar`, filtro) a su equivalente en sentence-transformers, ChromaDB y FAISS.
- [ ] **Nuevo:** escribir de memoria `collection.query(...)` con filtro `where` y convertir `distances` a similitud.
- [ ] **Nuevo:** explicar por qué FAISS necesita un mapa `id_a_doc` y qué es el post-filtering.

### Qué repasar si algo no quedó claro

- Normalización y distancias → sección 3 y 4
- IVF vs HNSW → sección 6 + tabla de decisión
- ChromaDB CRUD → sección 8 completa (con código)
- Puente scratch → framework → **sección 15** (esta sección)
- Elegir store → sección 12 (tabla comparativa + anti-patrones)

---

*Siguiente:* → [`ejercicios.md`](./ejercicios.md) · [`lab/enunciado.md`](./lab/enunciado.md)  
*Anterior:* → [M2 — Ingesta](../02-ingesta/guia.md)  
*Referencia:* → [`referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md)

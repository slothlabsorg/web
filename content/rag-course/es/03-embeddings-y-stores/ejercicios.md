# M3 · Ejercicios — Embeddings y Vector Stores

> Ejercicios 14–21. Sin respuestas — ver [`soluciones.md`](./soluciones.md).

---

## Ejercicio 14 — Cálculo de similitud coseno a mano

Dado el siguiente escenario simplificado, los documentos se representan con vectores de 3 dimensiones basados en la frecuencia de tres conceptos: `[empleo, beneficio, préstamo]`.

```
doc_A = [2, 3, 0]   → "política de beneficios para empleados"
doc_B = [0, 1, 4]   → "condiciones del préstamo hipotecario"
doc_C = [3, 2, 1]   → "contrato de empleo y beneficios asociados"
query = [3, 3, 0]   → "beneficios que tengo como empleado"
```

**a)** Calcula la similitud coseno entre `query` y cada uno de los tres documentos. Muestra los cálculos intermedios (norma de cada vector, producto punto, resultado final).

**b)** Ordena los documentos de mayor a menor similitud con la query. ¿Cuál sería el top-1?

**c)** ¿Cambiaría el orden si previamente normalizaras todos los vectores y usaras producto punto en lugar de similitud coseno? Justifica.

**d)** El equipo propone sustituir la similitud coseno por distancia L2. Calcula `d(query, doc_A)`. ¿Cambiaría el ranking respecto al coseno? ¿Cuándo es importante esta diferencia?

---

## Ejercicio 15 — Dimensiones y normalización

**Opción múltiple razonada (selecciona la mejor respuesta y justifica en 2-3 líneas):**

**15.a)** Un equipo descubre que su modelo de embedding devuelve vectores donde la magnitud varía según la longitud del texto (textos más largos → vectores de mayor norma). ¿Cuál es el problema principal al usar producto punto como métrica?

```
A) Que el producto punto no funciona en espacios de alta dimensión.
B) Que los textos más largos dominarán los resultados aunque no sean más relevantes semánticamente.
C) Que los textos cortos nunca podrán aparecer en top-K.
D) Que la similitud coseno y el producto punto dan exactamente el mismo resultado en este caso.
```

**15.b)** Un data scientist tiene embeddings de 1 536 dimensiones de OpenAI y embeddings de 768 dimensiones de un modelo local (nomic-embed-text). Quiere saber cuál usar. ¿Cuál afirmación es correcta?

```
A) Siempre usar el de mayor dimensión porque más dimensiones = más información.
B) Siempre usar el local porque evita costos de API.
C) Evaluar en un conjunto de datos representativo del dominio; dimensión no determina calidad.
D) Usar 768 dimensiones porque los índices HNSW son más eficientes con dimensiones menores.
```

**15.c)** ¿Por qué los modelos E5 y BGE requieren prefijos como `"query: "` y `"passage: "` para retrieval asimétrico?

```
A) Es un requisito técnico del tokenizador; sin prefijo el modelo falla con error.
B) Los prefijos son ignorados; solo son convención de documentación.
C) El modelo fue entrenado con estos prefijos para distinguir el rol del texto en la tarea de retrieval; sin ellos el espacio de embedding no está calibrado para búsqueda asimétrica.
D) Solo se requieren cuando el documento supera los 512 tokens.
```

---

## Ejercicio 16 — Índices vectoriales: intuición y trade-offs

**16.a)** "Elige el índice":

Para cada escenario, indica qué tipo de índice (flat, IVF, HNSW, IVF+PQ) usarías y justifica en 2-3 líneas:

| Escenario | Índice elegido | Justificación |
|-----------|---------------|---------------|
| Sistema de preguntas frecuentes de una empresa: 8 000 documentos, latencia < 200ms, exactitud crítica (sistema médico) | | |
| Motor de recomendación de e-commerce: 20 millones de productos, latencia < 50ms, recall > 90%, RAM limitada a 8 GB | | |
| Pipeline de RAG en desarrollo: 50 000 documentos, se actualiza continuamente con nuevos documentos cada hora | | |
| Búsqueda en catálogo científico: 2 millones de papers, latencia < 100ms, no hay actualizaciones frecuentes | | |

**16.b)** Un índice HNSW está configurado con `M=64, ef_construction=400`. Un compañero sugiere bajar a `M=16, ef_construction=100` para ahorrar memoria. ¿Qué consecuencias tiene esto? ¿En qué situaciones es aceptable el cambio?

**16.c)** Predice la salida: con `nprobe=1` en un índice IVF, ¿qué pasa con la consulta siguiente?

```
Colección: 10 000 documentos de RRHH agrupados en nlist=100 clústeres.
Query: "días de vacaciones en contrato indefinido"

El clúster C47 contiene los documentos más relevantes sobre vacaciones.
El centroide de C47 está a distancia 0.4 del query.
El centroide del clúster más cercano (C12) está a distancia 0.3 del query,
pero C12 contiene solo documentos de "selección de personal".

Con nprobe=1: se explora solo C12.
```

¿El sistema devuelve los documentos más relevantes? ¿Cómo lo corregirías?

---

## Ejercicio 17 — ChromaDB: operaciones y filtros

**17.a)** Encuentra el bug:

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

Hay dos bugs. Identifícalos y propón la corrección.

**17.b)** Upsert vs update vs add: para un pipeline de re-ingesta mensual de documentos que pueden haber sido actualizados, modificados o ser completamente nuevos, ¿qué operación usarías? Justifica.

**17.c)** Un equipo indexa documentos de políticas de RRHH y quiere recuperar solo los vigentes (año >= 2024) de la categoría "beneficios" que contengan la palabra "dental" en el texto. Escribe la consulta Chroma correcta.

**17.d)** Predice la salida del siguiente código:

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

## Ejercicio 18 — Elige el store

Para cada brief de negocio, elige el vector store más adecuado entre: ChromaDB, FAISS, pgvector, Qdrant, Pinecone, Weaviate. Justifica en 3-4 líneas incluyendo al menos una razón por la que descartarías las otras opciones principales.

**18.a)** Una startup de legaltech está construyendo su primer MVP de búsqueda de jurisprudencia. El equipo son 2 ingenieros, no tienen DevOps, tienen ~500 000 documentos y quieren arrancar en 2 semanas. Están dispuestos a pagar una suscripción SaaS razonable.

**18.b)** Un banco con regulación estricta de privacidad de datos necesita un vector store para búsqueda en documentos de clientes. Los datos NO pueden salir de sus servidores on-premise. Tienen 3 millones de documentos, ya operan un clúster de PostgreSQL y tienen un DBA dedicado.

**18.c)** Un laboratorio de ML de una universidad está construyendo un sistema de recomendación de artículos científicos. Tienen 50 millones de papers, recursos de cómputo (GPU y 128 GB RAM), y el equipo son investigadores con experiencia en numpy/C++. No les importa la gestión de una BD — solo quieren la búsqueda más rápida posible.

**18.d)** Una plataforma de e-commerce necesita búsqueda semántica + por texto (marcas, SKUs exactos) sobre un catálogo de 8 millones de productos en 12 idiomas. Los filtros de metadata son complejos (precio, categoría, marca, disponibilidad, rating). El equipo tiene experiencia con Docker y puede gestionar infraestructura on-premise.

**18.e)** "Predice el comportamiento": un equipo elige FAISS para su motor de recomendación de e-commerce y después de 3 meses se quejan de que "los filtros de metadata no funcionan". Explica qué están experimentando y por qué FAISS no es la causa del problema de filtros.

---

## Ejercicio 19 — sentence-transformers: del scratch al embedding real

**19.a)** En el taller scratch, `embeder()` produce un vector de 20 dimensiones con bag-of-words. En la capa ③ usas `SentenceTransformer("BAAI/bge-base-en-v1.5").encode(texto, normalize_embeddings=True)`. ¿Qué cambia en cada uno de estos aspectos? Justifica en 1-2 líneas cada uno:

| Aspecto | Scratch (`embeder`) | Framework (`encode`) |
|---------|---------------------|----------------------|
| Dimensiones del vector | | |
| Captura de sinónimos ("vacaciones" ≈ "tiempo libre") | | |
| Quién normaliza el vector | | |
| Dependencias (pip/red) | | |

**19.b)** Opción múltiple razonada:

Un compañero escribe esto y se queja de que FAISS devuelve rankings extraños:

```python
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
embeddings = modelo.encode(textos)  # sin normalize_embeddings
index = faiss.IndexFlatIP(768)
index.add(embeddings.astype(np.float32))
```

¿Cuál es el problema más probable?

```
A) BGE-base tiene 1024 dimensiones, no 768.
B) IndexFlatIP requiere vectores normalizados para que IP equivalga a similitud coseno; sin normalizar, textos largos dominan el ranking.
C) FAISS no soporta modelos de Hugging Face.
D) Hay que usar IndexFlatL2, no IndexFlatIP, con sentence-transformers.
```

---

## Ejercicio 20 — ChromaDB: predice la salida y convierte distancias

**20.a)** Predice qué devuelve `collection.query(...)` en este escenario (sin ejecutar código):

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

Responde:
1. ¿Cuántos ids devuelve `resultado["ids"][0]`?
2. ¿Cuál es el id del primer resultado?
3. ¿Cuál es el valor de `resultado["distances"][0][0]` (distancia del top-1)?
4. ¿Qué similitud coseno corresponde a esa distancia? (usa `sim = 1 - dist/2`)

**20.b)** Completa el `where` correcto para esta consulta:

> "Recuperar documentos de categoría `beneficios` o `vacaciones`, con `version >= 2024`, que contengan la palabra `dental` en el texto."

```python
resultados = collection.query(
    query_texts=["cobertura dental"],
    n_results=5,
    where=___COMPLETA_AQUI___,
    where_document=___COMPLETA_AQUI___
)
```

---

## Ejercicio 21 — FAISS: mapa id→doc y bug de post-filtering

**21.a)** ¿Por qué FAISS necesita un mapa externo `id_a_doc` (o equivalente) mientras ChromaDB no? Explica en 3-4 líneas qué almacena cada uno internamente.

**21.b)** Encuentra el bug en este post-filtering:

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

El código imprime `Resultados con filtro: 0` aunque existen 5 documentos de vacaciones. Identifica el bug y propón la corrección mínima.

**21.c)** Predice el comportamiento: con 12 documentos (como el taller) y filtro `categoria=vacaciones` (3 docs), ¿funciona pedir `k=3` en FAISS y filtrar después? ¿Y con 1 millón de documentos donde solo el 0.1% es "vacaciones"? Justifica en ambos casos.

---

## Resumen de tipos de ejercicio

| Ejercicio | Tipo | Tema central |
|-----------|------|-------------|
| 14 | Cálculo a mano | Similitud coseno, normalización, L2 |
| 15 | Opción múltiple razonada | Dimensiones, normalización, embeddings asimétricos |
| 16 | Elige la tecnología + predice la salida | Tipos de índice (flat/IVF/HNSW), trade-offs |
| 17 | Encuentra el bug + predice la salida | ChromaDB CRUD, filtros |
| 18 | Elige el store | Comparativa stores, brief de negocio |
| 19 | Comparativa scratch→framework + opción múltiple | sentence-transformers, normalización |
| 20 | Predice la salida + completa el código | Chroma query, distancia→similitud, filtros |
| 21 | Encuentra el bug + predice comportamiento | FAISS mapa id→doc, post-filtering |

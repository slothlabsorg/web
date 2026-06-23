# M3 · Soluciones — Embeddings y Vector Stores

> Respuestas razonadas de los ejercicios 14–21.

---

## Ejercicio 14 — Cálculo de similitud coseno a mano

```
doc_A = [2, 3, 0]
doc_B = [0, 1, 4]
doc_C = [3, 2, 1]
query = [3, 3, 0]
```

### 14.a) Cálculo paso a paso

**Normas:**
```
‖query‖ = √(9 + 9 + 0) = √18 ≈ 4.243
‖doc_A‖ = √(4 + 9 + 0) = √13 ≈ 3.606
‖doc_B‖ = √(0 + 1 + 16) = √17 ≈ 4.123
‖doc_C‖ = √(9 + 4 + 1) = √14 ≈ 3.742
```

**Productos punto:**
```
query · doc_A = (3×2) + (3×3) + (0×0) = 6 + 9 + 0 = 15
query · doc_B = (3×0) + (3×1) + (0×4) = 0 + 3 + 0 = 3
query · doc_C = (3×3) + (3×2) + (0×1) = 9 + 6 + 0 = 15
```

**Similitudes coseno:**
```
cos(query, doc_A) = 15 / (4.243 × 3.606) = 15 / 15.30 ≈ 0.980
cos(query, doc_B) = 3  / (4.243 × 4.123) = 3  / 17.49 ≈ 0.172
cos(query, doc_C) = 15 / (4.243 × 3.742) = 15 / 15.87 ≈ 0.945
```

### 14.b) Ranking

1. doc_A ≈ 0.980
2. doc_C ≈ 0.945
3. doc_B ≈ 0.172

**Top-1: doc_A** — "política de beneficios para empleados". Tiene sentido: la query pide información sobre beneficios como empleado, y doc_A es el más alineado en ese subespacio.

### 14.c) ¿Cambia el orden con normalización + dot product?

**No cambia.** Con vectores normalizados:
```
dot(q̂, â) = cos(q, a)
```

La similitud coseno ya está implícita en el producto punto de vectores normalizados. El ranking será idéntico porque la normalización no cambia los ángulos entre vectores, solo las magnitudes.

### 14.d) Distancia L2

```
d(query, doc_A) = √((3-2)² + (3-3)² + (0-0)²) = √(1 + 0 + 0) = 1.0
d(query, doc_B) = √((3-0)² + (3-1)² + (0-4)²) = √(9 + 4 + 16) = √29 ≈ 5.385
d(query, doc_C) = √((3-3)² + (3-2)² + (0-1)²) = √(0 + 1 + 1) = √2 ≈ 1.414
```

Con L2: 1. doc_A (1.0), 2. doc_C (1.414), 3. doc_B (5.385). **El ranking es el mismo** que con coseno.

En este ejemplo, coseno y L2 dan el mismo orden porque los vectores tienen magnitudes similares. La diferencia es importante cuando las magnitudes varían mucho: si doc_C fuera `[30, 20, 10]` (10× más grande), coseno lo seguiría viendo similar a la query (misma dirección), pero L2 lo consideraría muy lejano. En text retrieval con vectores normalizados, son equivalentes.

---

## Ejercicio 15 — Dimensiones y normalización

### 15.a) Respuesta: B

Los textos más largos dominarán los resultados aunque no sean más relevantes semánticamente.

Si la norma del vector crece con la longitud, el producto punto `A·B = ‖A‖ × ‖B‖ × cos(θ)` favorece a los vectores de mayor magnitud. Un documento largo pero irrelevante puede tener un producto punto mayor que uno corto pero perfectamente relevante. La solución es normalizar los vectores antes de indexar o usar similitud coseno explícita.

### 15.b) Respuesta: C

Dimensión no determina calidad; hay que evaluar en el dominio.

Un modelo de 768 dimensiones entrenado con datos del sector salud superará a uno de 3 072 dimensiones entrenado en texto genérico si tu aplicación es de salud. La métrica correcta es la calidad del retrieval en tus propios datos: prepara un conjunto de 50–100 pares (query, documento relevante) y mide Recall@K. La dimensión solo importa para el costo de almacenamiento y cómputo.

### 15.c) Respuesta: C

El modelo fue entrenado con estos prefijos para distinguir el rol del texto.

Durante el entrenamiento, E5 y BGE recibieron millones de pares (query, pasaje) con sus prefijos correspondientes. El modelo aprendió que los vectores de queries deben alinearse con vectores de pasajes en un espacio asimétrico: la query "¿cuántos días de vacaciones?" debe estar cerca del pasaje "Los empleados tienen 15 días de vacaciones al año", no de otra query similar. Sin los prefijos, los vectores caen en una zona "neutral" del espacio y el recall cae ~5-15% según el benchmark BEIR.

---

## Ejercicio 16 — Índices vectoriales

### 16.a) Elige el índice

| Escenario | Índice elegido | Justificación |
|-----------|---------------|---------------|
| Sistema médico, 8k docs, exactitud crítica | **Flat** | Con 8 000 documentos, flat es O(N×D) pero N es pequeño → latencia < 5ms. Recall = 100%, requerimiento crítico para diagnóstico médico. No hay razón para introducir ANN con pérdida de recall. |
| Recomendación e-commerce, 20M prods, 8 GB RAM | **IVF+PQ** | 20M vectores de 1 024 dim × 4 bytes = 80 GB sin comprimir. IVF+PQ comprime 8-16×, cabiendo en 8 GB. El recall ~85-90% con nprobe ajustado es aceptable para recomendación. HNSW consumiría >80 GB RAM. |
| RAG en desarrollo, 50k docs, actualizaciones frecuentes | **HNSW** | HNSW soporta inserciones incrementales eficientemente. Con 50k docs y actualizaciones por hora, IVF requeriría re-entrenamiento del k-means periódicamente. Flat también sería opción válida por el tamaño. |
| 2M papers científicos, sin actualizaciones frecuentes | **IVF o HNSW** | Ambos son viables. IVF si la RAM es limitada. HNSW si quieres mejor recall/velocidad y tienes ~8 GB disponibles para el grafo. IVF más fácil de configurar con entrenamiento batch único. |

### 16.b) Bajar M y ef_construction

**Consecuencias:**
- `M` de 64 a 16: cada nodo tiene menos conexiones → el grafo tiene menos "atajos" → la búsqueda greedy puede quedar atrapada en mínimos locales → recall cae, especialmente en espacios de alta dimensión.
- `ef_construction` de 400 a 100: el grafo se construye con menos candidatos → peor calidad del índice → más difícil recuperarlo con ef_search alto.
- **Memoria:** se reduce significativamente (cada arista cuesta ~8 bytes; reducir M 4× baja el grafo ~4×).

**Cuándo es aceptable:** cuando el recall objetivo es ~85-90% (no 99%), la colección no supera ~1M vectores y la memoria es el cuello de botella. Para recomendación de contenido o sugerencias de búsqueda, este trade-off suele ser aceptable. Para sistemas médicos o financieros, no.

### 16.c) Predice la salida con nprobe=1

**El sistema NO devuelve los documentos más relevantes.**

Con `nprobe=1`, solo se explora el clúster más cercano al centroide. En este caso, C12 (selección de personal) es el clúster con centroide más cercano a la query, pero contiene documentos irrelevantes. El clúster correcto C47 (vacaciones) no se explora.

Resultado: el top-K devuelto contendrá documentos sobre "selección de personal" con alta similitud dentro de C12, pero sin recall de los documentos realmente relevantes sobre vacaciones.

**Corrección:**
```python
index.nprobe = 5  # explorar varios clústeres vecinos
# O mejor: nprobe = max(1, nlist // 10) como heurística inicial
```

Con `nprobe=5`, se exploran C12 y los 4 clústeres vecinos siguientes, incluyendo probablemente C47. Recall mejora de ~60% a ~90% con una latencia apenas 2-5× mayor.

---

## Ejercicio 17 — ChromaDB: operaciones y filtros

### 17.a) Encuentra el bug

**Bug 1:** En `metadatas`, el tercer elemento contiene `"etiquetas": ["flexibilidad", "bienestar"]`. ChromaDB no soporta valores de tipo lista en metadata. Solo acepta `str`, `int`, `float`, `bool`. Lanzará un error al llamar `add()`.

**Corrección:** convertir la lista a string o eliminar el campo.
```python
{"categoria": "horario", "año": 2024}
# o bien:
{"categoria": "horario", "año": 2024, "etiquetas": "flexibilidad,bienestar"}
```

**Bug 2:** El filtro `where={"categoria": {"$contains": "horario"}}` es incorrecto. `$contains` es un operador de `where_document` (búsqueda en el texto del documento), no un operador de filtro de metadata para igualdad. Para filtrar metadata por valor exacto se usa `$eq` o simplemente el valor directo.

**Corrección:**
```python
where={"categoria": "horario"}
# o explícitamente:
where={"categoria": {"$eq": "horario"}}
```

### 17.b) Upsert para re-ingesta

Usar **`upsert`**.

- `add`: falla si el id ya existe → la re-ingesta mensual fallaría para todos los documentos ya indexados.
- `update`: falla si el id NO existe → los documentos nuevos no se añadirían.
- `upsert`: "actualiza si existe, crea si no existe" → idempotente, perfecto para pipelines de ingesta periódica.

```python
collection.upsert(
    ids=ids_nuevos_o_existentes,
    documents=textos_actualizados,
    metadatas=metadatos_actualizados
)
```

### 17.c) Consulta con múltiples filtros

```python
resultados = collection.query(
    query_texts=["cobertura dental beneficios"],
    n_results=5,
    where={
        "$and": [
            {"categoria": "beneficios"},
            {"año": {"$gte": 2024}}
        ]
    },
    where_document={"$contains": "dental"}
)
```

`where` filtra por metadata; `where_document` filtra por contenido del texto. Ambos se aplican en conjunto (AND implícito entre ellos).

### 17.d) Predice la salida

```
1
```

Se añaden 3 documentos con ids "a", "b", "c". Luego se eliminan todos los que tienen `lang == "python"`, que son "a" y "c". Quedan solo el doc "b" (lang: java). `col.count()` devuelve **1**.

---

## Ejercicio 18 — Elige el store

### 18.a) Startup legaltech, MVP, sin DevOps, 500k docs, SaaS ok

**Elección: Pinecone**

Con 2 ingenieros y plazo de 2 semanas, el cuello de botella es la velocidad de desarrollo, no el costo o el rendimiento. Pinecone es serverless: no hay Docker, no hay YAML, no hay gestión de índices. Se conecta con una API key. 500k documentos caben cómodamente en el tier gratuito/starter.

**Por qué no ChromaDB:** ChromaDB es local, genial para dev, pero para producción escalable necesitarían gestionar un servidor o usar el cloud recién lanzado. Añade operacional no deseado.

**Por qué no Qdrant/Weaviate:** requieren Docker o account de cloud, configuración inicial, y la ganancia en features no justifica el overhead para un MVP.

### 18.b) Banco, on-premise estricto, 3M docs, PostgreSQL existente, DBA

**Elección: pgvector**

Los datos no pueden salir de sus servidores → descarta todos los SaaS (Pinecone, Qdrant Cloud). Ya tienen PostgreSQL y un DBA → pgvector es una extensión que añaden sin nuevo sistema. 3M documentos están dentro del rango cómodo de pgvector con HNSW. Los filtros SQL que ya conocen funcionan para los filtros de metadata.

**Por qué no Qdrant on-premise:** añade un sistema nuevo que el equipo no conoce. Un DBA de Postgres no necesita aprender Qdrant si pgvector resuelve el problema.

**Por qué no ChromaDB:** no es production-grade para esta escala y el entorno regulado.

### 18.c) Laboratorio ML, 50M papers, GPU, 128 GB RAM, equipo de investigadores

**Elección: FAISS**

50M × 1 024 dim × 4 bytes = 200 GB sin comprimir. Con IVF+PQ se comprimen a ~25-50 GB, dentro de los 128 GB. El equipo conoce numpy/C++, no necesitan gestión de BD. Solo quieren la búsqueda más rápida — FAISS con GPU llega a 100M+ queries/segundo. No necesitan filtros de metadata complejos (es búsqueda de papers similar-to-paper).

**Por qué no Milvus:** es más completo pero añade complejidad de BD que no necesitan. FAISS es una librería que integran en su código Python/C++ directamente.

**Por qué no Qdrant/Pinecone:** demasiado overhead de BD y networking para lo que hacen.

### 18.d) E-commerce, 8M productos, 12 idiomas, filtros complejos, Docker ok

**Elección: Weaviate**

Búsqueda híbrida (semántica + BM25) nativa es clave para e-commerce: los usuarios buscan "zapatillas Nike Air Max rojas talla 42" — mezcla de semántica ("zapatillas rojas") y texto exacto ("Nike Air Max", "talla 42"). Weaviate tiene módulos de búsqueda híbrida y filtros GraphQL muy ricos. Soporta multilingüe con modelos multilingüe. Se despliega con Docker compose.

**Por qué no Qdrant:** Qdrant tiene filtros excelentes pero la búsqueda híbrida (texto + semántica) no es tan first-class como en Weaviate. Habría que implementar el scoring híbrido manualmente.

**Por qué no pgvector:** los filtros complejos sobre 12 idiomas y 8M productos empujan los límites de pgvector; además necesitan la búsqueda híbrida.

### 18.e) FAISS no tiene filtros de metadata

FAISS es una **librería de índices**, no una base de datos vectorial. No tiene soporte nativo para almacenar o filtrar metadata. El equipo probablemente:

1. Construyó el índice FAISS con los vectores.
2. Mantuvo un diccionario Python `{indice_faiss → metadata}` por separado.
3. En query time: busca top-K en FAISS → obtiene índices → busca metadata → **filtra manualmente**.

El problema es que el filtro manual es post-retrieval: si pides top-10 y 8 de los 10 no pasan el filtro de precio, obtienes solo 2 resultados (o tienes que pedir top-100 para luego filtrar, degradando el recall y la latencia).

La causa real no es FAISS sino el diseño: eligieron la herramienta incorrecta para un caso con filtros de metadata complejos. La solución es migrar a Qdrant, Weaviate o pgvector que tienen filtros integrados en la búsqueda vectorial (pre-filtering), garantizando que los K resultados devueltos ya pasan los filtros.

---

## Ejercicio 19 — sentence-transformers: del scratch al embedding real

### 19.a) Tabla comparativa

| Aspecto | Scratch (`embeder`) | Framework (`encode`) |
|---------|---------------------|----------------------|
| Dimensiones del vector | 20 fijas (tamaño del vocabulario `VOCAB`) | 768 (definidas por el modelo BGE-base) |
| Captura de sinónimos | No — solo cuenta palabras exactas del vocabulario | Sí — el transformer aprendió que "vacaciones" y "tiempo libre" son cercanos semánticamente |
| Quién normaliza el vector | Tú llamas `normalizar()` explícitamente antes de indexar | El parámetro `normalize_embeddings=True` en `.encode()` devuelve vectores unitarios |
| Dependencias | Solo stdlib (`math`, `json`) | `pip install sentence-transformers` + descarga del modelo (~440 MB) + red la primera vez |

### 19.b) Respuesta: B

`IndexFlatIP` calcula producto punto. Sin normalización, `A·B = ‖A‖ × ‖B‖ × cos(θ)`: textos más largos producen vectores de mayor norma y dominan el ranking aunque no sean más relevantes semánticamente. La corrección es `modelo.encode(textos, normalize_embeddings=True)` antes de `add()`.

Las otras opciones son incorrectas: BGE-base tiene 768 dimensiones (A es falsa); FAISS sí funciona con cualquier vector float32 (C es falsa); `IndexFlatL2` mediría distancia euclidiana, no resolvería el problema de magnitud si no normalizas (D es falsa).

---

## Ejercicio 20 — ChromaDB: predice la salida y convierte distancias

### 20.a) Predicción de `collection.query(...)`

1. **Cantidad de ids:** 1 (solo hay un documento con `categoria=vacaciones`, y `n_results=2` no puede devolver más de lo que existe tras el filtro).

2. **Id del primer resultado:** `"v1"` — es el único que pasa `where={"categoria": "vacaciones"}`.

3. **Distancia del top-1:** `0.0` — el query embedding `[1.0, 0.0, 0.0]` es idéntico al embedding de `v1`.

4. **Similitud coseno:** `sim = 1 - 0.0 / 2 = 1.0` — similitud perfecta.

**Nota:** si no hubiera filtro `where`, el top-2 serían `v1` (dist=0.0) y `b1`/`h1` (dist=√2 ≈ 1.414 con coseno entre vectores ortogonales unitarios). El filtro pre-filtering garantiza que solo se rankean candidatos válidos.

### 20.b) Completar el `where`

```python
resultados = collection.query(
    query_texts=["cobertura dental"],
    n_results=5,
    where={
        "$and": [
            {"categoria": {"$in": ["beneficios", "vacaciones"]}},
            {"version": {"$gte": "2024"}}
        ]
    },
    where_document={"$contains": "dental"}
)
```

- `where` filtra metadata (`$in` para múltiples categorías, `$gte` para versión).
- `where_document` filtra contenido del texto (`$contains` busca la subcadena "dental").
- Ambos se combinan con AND implícito.

---

## Ejercicio 21 — FAISS: mapa id→doc y bug de post-filtering

### 21.a) ¿Por qué FAISS necesita mapa externo?

FAISS es una **librería de índices vectoriales**: internamente solo almacena arrays de floats (vectores) y enteros (posiciones o IDs numéricos). No tiene concepto de "documento", "texto" ni "metadata".

ChromaDB es una **base de datos vectorial completa**: cada entrada en la colección guarda `id`, `document`, `embedding` y `metadata` juntos. Cuando haces `query()`, devuelve ids, textos y metadatos sin mapa externo.

Por eso con FAISS necesitas `id_a_doc = {i: doc}` (o similar) para traducir el índice numérico que devuelve `search()` al documento original con su metadata.

### 21.b) Bug en el post-filtering

**Bug:** `k=3` es demasiado pequeño. Los 3 vecinos globales más cercanos probablemente pertenecen a las otras 95 categorías (95% del corpus). Tras filtrar por `vacaciones`, la lista queda vacía.

**Corrección mínima:** pedir más candidatos antes de filtrar:

```python
k_extra = 50  # o 100; regla: varias veces el k deseado
scores, indices = index.search(query_vec, k=k_extra)

filtrados = []
for score, idx in zip(scores[0], indices[0]):
    doc = id_a_doc[idx]
    if doc["metadata"]["categoria"] == filtro_categoria:
        filtrados.append((score, doc))
    if len(filtrados) == 3:
        break
```

Con 100 docs y solo 5 de vacaciones, `k=50` casi seguro encuentra suficientes candidatos. Con 1M docs habría que pedir `k=1000` o más, o migrar a un store con pre-filtering.

### 21.c) Predicción con 12 vs 1M documentos

**Con 12 documentos (taller):** pedir `k=3` y filtrar **puede fallar** si los 3 más similares globalmente no son de categoría `vacaciones` (hay 3 de vacaciones y 9 de otras categorías). Por eso `solucion_framework.py` usa `k_extra=12` (todos). Con 12 docs funciona siempre.

**Con 1 millón y 0.1% vacaciones (~1000 docs):** pedir `k=3` **casi seguro falla** — la probabilidad de que los 3 globales sean de vacaciones es ~0.01³. Necesitas `k=500–5000` y aun así el recall puede degradarse. Este es el caso de uso donde ChromaDB, Qdrant o pgvector (pre-filtering) son obligatorios.

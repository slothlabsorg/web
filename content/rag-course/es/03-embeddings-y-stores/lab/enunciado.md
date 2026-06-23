# Taller M3 · Mini Vector Store de Políticas de RRHH

## Contexto de negocio

Eres el único ingeniero de backend en una startup de 50 empleados. La directora de RRHH te pide que el chatbot interno pueda responder preguntas sobre las políticas de la empresa. Tienes los documentos en `datos/` (12 fragmentos con metadata). No hay presupuesto para APIs externas ni infraestructura — el prototipo debe correr en local sin instalar nada.

Tu objetivo es construir un **mini vector store en memoria** capaz de:
1. Indexar los 12 documentos con un embedding de juguete determinista.
2. Responder a una query devolviendo los **top-3 documentos más similares** (búsqueda coseno).
3. Aplicar un **filtro de metadata por categoría** y comparar los resultados con y sin filtro.

---

## Datos disponibles

Carpeta `datos/`: 12 archivos JSON (`doc_01.json` … `doc_12.json`).

Cada documento tiene:
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

Las categorías presentes son: `vacaciones` (3 docs), `beneficios` (4 docs), `horario` (3 docs), `formacion` (2 docs).

---

## Tarea

### Parte 1 — Embedding de juguete determinista

Implementa una función `embeder(texto: str) -> list[float]` que:
- Genera un vector de 20 dimensiones.
- Es **determinista**: el mismo texto siempre produce el mismo vector.
- No requiere pip ni red.
- Estrategia sugerida: bag-of-words sobre un vocabulario fijo de 20 palabras clave del dominio RRHH.

### Parte 2 — Indexar los documentos

Carga los 12 JSON y construye el store: un diccionario `{ id → { "vector": [...], "texto": ..., "metadata": {...} } }`.

Normaliza los vectores antes de indexar.

### Parte 3 — Consulta top-K por coseno

Implementa `buscar(query: str, k: int, filtro: dict | None) -> list[dict]`.

- Calcula el embedding de la query.
- Normaliza.
- Calcula similitud coseno con todos los vectores del store.
- Si `filtro` es `{"categoria": "vacaciones"}`, solo considera documentos donde `metadata["categoria"] == "vacaciones"`.
- Devuelve los top-K con `{"id", "score", "texto"}`.

### Parte 4 — Comparar resultados

Ejecuta dos búsquedas con la misma query:
```
Query: "días de permiso y descanso que tengo derecho"
```

- **Búsqueda A:** sin filtro, top-3
- **Búsqueda B:** con filtro `{"categoria": "vacaciones"}`, top-3

Imprime ambos resultados. ¿Cambia el top-1? ¿Por qué?

---

## Pistas escalonadas

**Pista 1 (vocabulario):** define un vocabulario de 20 palabras relacionadas con el dominio:
```python
VOCAB = ["vacaciones", "dias", "permiso", "descanso", "festivo",
         "seguro", "medico", "beneficio", "bono", "salario",
         "horario", "jornada", "teletrabajo", "remoto", "extra",
         "formacion", "curso", "mentor", "restaurante", "ticket"]
```

**Pista 2 (bag-of-words):** el vector `v[i]` cuenta cuántas veces aparece `VOCAB[i]` en el texto (lowercased). Si ninguna palabra del vocab aparece en el texto, el vector será todo ceros — trátalo como un vector que no puede competir (similitud 0).

**Pista 3 (normalización):**
```python
import math
def normalizar(v):
    norma = math.sqrt(sum(x*x for x in v))
    if norma == 0:
        return v
    return [x / norma for x in v]
```

**Pista 4 (coseno):**
```python
def coseno(a, b):
    return sum(ai * bi for ai, bi in zip(a, b))
# Con vectores normalizados, el dot product ES la similitud coseno.
```

**Pista 5 (filtro):** antes de calcular similitudes, construye la lista de candidatos:
```python
candidatos = [doc for doc in store.values()
              if filtro is None or doc["metadata"].get(filtro_campo) == filtro_valor]
```

---

## Criterios de éxito

- El script corre con `python3 solucion_scratch.py` sin instalar nada.
- Sin filtro: top-1 debe ser un documento de categoría `vacaciones` o similar (hay 3 en el corpus).
- Con filtro `vacaciones`: los 3 resultados son TODOS de categoría `vacaciones`.
- Los scores son números entre 0 y 1 (o muy cercanos), siendo 1 la similitud perfecta.
- El script imprime claramente ambas búsquedas y el efecto del filtro.

---

## Parte 5 — Capa ③: ChromaDB + FAISS + sentence-transformers (tarea guiada)

> **Prerrequisito:** haber completado y ejecutado la capa ② (`solucion_scratch.py`).  
> **Lectura obligatoria antes de empezar:** [`../guia.md` §15](../guia.md#15-la-capa--explicada-del-dict-en-memoria-a-chromadb-faiss-y-sentence-transformers) (puente scratch→framework) + [§8 ChromaDB](../guia.md#8-chromadb-a-fondo-operaciones-crud) + [§9 FAISS](../guia.md#9-faiss-qué-es-y-cuándo-usarlo).

Esta parte **requiere pip y red** (no corre en el entorno del curso). Instala primero:

```bash
pip install chromadb faiss-cpu sentence-transformers
```

La primera ejecución descargará el modelo `BAAI/bge-base-en-v1.5` (~440 MB).

### Objetivo

Escribir **tu propia versión** de `solucion_framework.py` que haga lo mismo que el scratch pero con librerías reales:
1. Indexar los 12 JSON de `datos/` con embeddings neurales (BGE).
2. Buscar top-3 con la misma query del taller, con y sin filtro `categoria=vacaciones`.
3. Implementar la versión ChromaDB **y** la versión FAISS.
4. Comparar resultados con `solucion_framework.py` de referencia.

No copies el archivo de solución de golpe — sigue las pistas en orden y escribe cada bloque tú mismo.

---

### Pista 1 — Instalar y cargar el modelo (reemplaza `embeder()`)

Lee [guía §15.2](../guia.md#152-sentence-transformers-tu-embeder-pero-de-verdad).

```python
from sentence_transformers import SentenceTransformer

modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

# Prueba rápida:
vec = modelo.encode("dias de permiso", normalize_embeddings=True)
print(len(vec))  # debe ser 768
```

**Checkpoint:** ¿por qué `normalize_embeddings=True`? (Pista: §3 de la guía + §15.6 gotchas.)

---

### Pista 2 — Cargar los 12 documentos (igual que el scratch)

Reutiliza la lógica de carga del scratch: recorre `datos/doc_*.json` y construye listas paralelas `ids`, `textos`, `metadatas`.

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

**Checkpoint:** esto es el equivalente a tu `cargar_documentos()` — pero ahora alimentarás Chroma/FAISS en lugar de un `dict`.

---

### Pista 3 — Sección A: escribe `demo_chromadb()` con ChromaDB

Lee [guía §8](../guia.md#8-chromadb-a-fondo-operaciones-crud) y el recorrido [§15.5 bloques A](../guia.md#155-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy).

Implementa en este orden:

| Paso | Qué escribir | API clave | Equivalente scratch |
|------|-------------|-----------|---------------------|
| A.1 | Cliente in-memory | `chromadb.Client()` | `store = {}` |
| A.2 | Crear colección con métrica coseno | `get_or_create_collection(name=..., metadata={"hnsw:space": "cosine"})` | — |
| A.3 | Calcular embeddings | `modelo.encode(textos, normalize_embeddings=True).tolist()` | `embeder()` + `normalizar()` |
| A.4 | Indexar | `collection.upsert(ids=..., documents=..., embeddings=..., metadatas=...)` | bucle que llena `store[id]` |
| A.5 | Búsqueda sin filtro | `collection.query(query_texts=[query], n_results=3, include=[...])` | `buscar(query, 3, None)` |
| A.6 | Convertir distancia → similitud | `sim = 1 - dist / 2` | tu `score` ya es similitud |
| A.7 | Búsqueda con filtro | `collection.query(..., where={"categoria": "vacaciones"})` | `buscar(query, 3, {"categoria": "vacaciones"})` |
| A.8 | (Opcional) CRUD | `upsert` un doc, `delete` otro, `count()` | demo CRUD del scratch |

**Query a usar (la misma del scratch):**
```
"dias de permiso y descanso que tengo derecho"
```

**Checkpoint:** imprime top-3 con similitud y categoría. Con embedding real, `doc_01` debería subir en el ranking respecto al scratch (donde tenía score 0).

---

### Pista 4 — Sección B: escribe `demo_faiss()` con FAISS

Lee [guía §9](../guia.md#9-faiss-qué-es-y-cuándo-usarlo) y [§15.5 bloques B](../guia.md#155-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy).

Implementa en este orden:

| Paso | Qué escribir | API clave | Equivalente scratch |
|------|-------------|-----------|---------------------|
| B.1 | Mismos embeddings | `modelo.encode(textos, normalize_embeddings=True)` | igual que A.3 |
| B.2 | Índice IP + IDs | `IndexFlatIP(dim)` + `IndexIDMap` + `add_with_ids(vectors.astype(np.float32), ids)` | `store` con vectores |
| B.3 | Mapa externo | `id_a_doc = {i: docs[i] for i in range(len(docs))}` | metadata en cada entrada del dict |
| B.4 | Búsqueda sin filtro | `index.search(query_vec, k=3)` | `buscar(query, 3, None)` |
| B.5 | Post-filtering | `search(k=12)` + filtrar por `metadata["categoria"]` en Python | `buscar` con filtro manual |
| B.6 | (Opcional) Persistencia | `faiss.write_index` / `read_index` | no existe en scratch |

**Importante:** FAISS devuelve `scores` (= similitud coseno si normalizaste), **no** distancias como Chroma. No apliques `1 - dist/2` aquí.

**Checkpoint:** ¿obtienes 3 resultados con filtro `vacaciones`? Si no, revisa que `k_extra` sea suficientemente grande (con 12 docs, pide los 12).

---

### Pista 5 — Comparar con la solución de referencia

1. Ejecuta tu script: `python3 mi_solucion_framework.py`
2. Abre [`solucion_framework.py`](./solucion_framework.py) y compara bloque a bloque con [guía §15.5](../guia.md#155-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy).
3. Rellena esta tabla en un comentario o en un archivo `comparativa.md`:

| Aspecto | Tu ChromaDB | Tu FAISS | Scratch (stdlib) |
|---------|------------|----------|------------------|
| Top-1 sin filtro | ? | ? | doc_08 |
| Top-1 con filtro vacaciones | ? | ? | doc_08 |
| ¿doc_01 en top-3? | ? | ? | Sí, pero score 0 |
| Líneas de código aprox. | ? | ? | ~150 |
| Filtro: pre o post | pre | post | pre (manual) |

4. Lee [`solucion.md`](./solucion.md) para la explicación de por qué Chroma es más natural para este caso.

---

### Criterios de éxito (capa ③)

- [ ] Tu script importa `chromadb`, `faiss`, `sentence_transformers` sin errores.
- [ ] Indexas los 12 documentos con BGE-base (768 dims, normalizados).
- [ ] ChromaDB: `query` sin filtro devuelve 3 resultados con similitud interpretable (`1 - dist/2`).
- [ ] ChromaDB: `query` con `where={"categoria": "vacaciones"}` devuelve solo docs de vacaciones.
- [ ] FAISS: búsqueda sin filtro devuelve 3 resultados con scores en [0, 1].
- [ ] FAISS: post-filtering devuelve 3 docs de vacaciones (o explicas por qué no si `k_extra` es insuficiente).
- [ ] Puedes explicar en 3 frases la diferencia entre pre-filtering (Chroma) y post-filtering (FAISS).

---

## Extensión opcional (capa ② o ③)

Si terminas pronto, añade:
- Soporte para `where={"categoria": {"$in": ["vacaciones", "horario"]}}` (múltiples categorías).
- Una función `actualizar(id, nuevo_texto, nueva_metadata)` que re-embede y actualiza el store.
- Mide el tiempo de indexado y de query con `time.perf_counter()`.

---

*Solución scratch (stdlib):* [`solucion_scratch.py`](./solucion_scratch.py)  
*Solución framework (ChromaDB + FAISS):* [`solucion_framework.py`](./solucion_framework.py)  
*Explicación de ambas:* [`solucion.md`](./solucion.md)

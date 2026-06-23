# Solución — Taller M3 · Mini Vector Store

---

## Capa ② — Python puro (`solucion_scratch.py`)

### Decisiones de diseño

**Embedding de juguete:** se usa bag-of-words sobre un vocabulario fijo de 20 palabras clave del dominio RRHH. Esta elección es deliberada para hacer visible la mecánica: puedes ver exactamente qué dimensiones se activan para cada documento y query. En producción, un transformer reemplaza todo esto con 768–3 072 dimensiones que capturan semántica real.

**Normalización antes de indexar:** todos los vectores se normalizan a norma 1 al momento de indexarlos. Esto hace que el cálculo de similitud en query time sea un simple producto punto (más rápido y más limpio).

**Store en diccionario:** `{ id → { vector, texto, metadata } }`. Es la estructura más simple posible. No tiene índice ANN — es búsqueda exhaustiva O(N). Perfecto para 12 documentos. Para 100k+ documentos, aquí entraría FAISS o un índice HNSW.

**Filtro de metadata como pre-filtering:** antes de calcular similitudes, se filtra la lista de candidatos. Esto es correcto y eficiente para colecciones pequeñas. En FAISS (sin filtros nativos) se hace post-filtering, lo cual degrada el recall.

### El efecto del filtro en este caso específico

Los 3 primeros resultados sin filtro ya son todos de categoría `vacaciones`, porque la query activa palabras (`permiso`, `descanso`, `dias`) que solo aparecen en documentos de esa categoría en el vocabulario de juguete. El filtro no cambia el top-3 aquí.

Si tuviéramos un embedding neuronal real, la situación sería más interesante: "días de permiso" sería semánticamente cercano a "ticket restaurante" o "bono" en ciertos ángulos del espacio, y el filtro sería más impactante para evitar resultados de otras categorías.

### Por qué doc_01 tiene score 0.0000

La query activa `dias` (posición 1 del vocab), `permiso` (posición 2) y `descanso` (posición 3). El texto de `doc_01` contiene "días", "vacaciones" y "mensualmente". En nuestro vocabulario fijo:
- "días" → `dias` en el vocab → ✓ se activa
- "vacaciones" → `vacaciones` en el vocab → ✓ se activa (pero la query no tiene `vacaciones`)
- "mensualmente" → no está en el vocab

El embedding de doc_01 tiene dimensiones activas para `vacaciones` y `dias`. El embedding de la query tiene activas `dias`, `permiso` y `descanso`. La intersección es solo `dias`, pero en la query normalizada ese valor es pequeño y el producto punto da casi 0.

Moraleja: el embedding de juguete tiene baja cobertura semántica. En un embedding real, "días de vacaciones" y "días de permiso" estarían en el mismo vecindario del espacio.

---

## Capa ③ — Framework real (`solucion_framework.py`)

> **Antes de leer esta sección:** estudia la guía [§15 — La capa ③ explicada](../guia.md#15-la-capa--explicada-del-dict-en-memoria-a-chromadb-faiss-y-sentence-transformers). Ahí encontrarás el puente pieza a pieza desde el scratch, la enseñanza de `sentence-transformers` y el recorrido bloque por bloque de este archivo. El taller guiado está en [`enunciado.md` Parte 5](./enunciado.md#parte-5--capa--chromadb--faiss--sentence-transformers-tarea-guiada).

### ChromaDB: ventajas sobre el scratch

1. **Embedding real:** con `sentence-transformers` + `BAAI/bge-base-en-v1.5`, el embedding captura semántica. "días de permiso" y "vacaciones" quedarían próximos en el espacio.
2. **Filtros nativos:** `where={"categoria": "vacaciones"}` aplica pre-filtering dentro del índice. No hay overhead de post-processing.
3. **CRUD completo:** `upsert`, `delete by filter`, `get by id` funcionan sin código extra.
4. **Persistencia automática:** `PersistentClient(path="./datos")` escribe en disco sin gestión manual.
5. **HNSW automático:** para colecciones > 1000 documentos, Chroma activa HNSW internamente.

### FAISS: por qué es más complejo para este caso

FAISS no tiene metadata ni filtros. Para implementar el mismo filtro de categoría:
1. Pedir K_extra (p.ej. todos los N documentos) en la búsqueda vectorial.
2. Filtrar manualmente por metadata en Python.
3. Tomar los primeros 3 que pasen el filtro.

Esto es **post-filtering** y tiene dos problemas:
- Si quedan pocos documentos tras filtrar, el recall real cae (pides 3 pero solo encuentras 1).
- Añades código de gestión de metadata completamente separado del índice.

Para este taller con 12 documentos, es manageable. Para 1M documentos con filtros complejos, usar Qdrant o pgvector.

### Modelo de embedding: BGE vs OpenAI

| Aspecto | BGE-base (local) | text-embedding-3-small (OpenAI) |
|---------|-----------------|----------------------------------|
| Costo | Gratis | ~$0.02/1M tokens |
| Privacidad | Total (local) | Datos enviados a OpenAI |
| Velocidad | Depende de GPU/CPU | API latency (~50-200ms) |
| Calidad retrieval | Muy buena para inglés | Excelente, multilingüe |
| Setup | `pip install sentence-transformers` + descarga 440MB | `pip install openai` + API key |

Para la startup del enunciado (datos privados de empleados), BGE local es la elección correcta.

---

## Conexión con RAGorbit

Este taller implementa manualmente lo que hace el nodo `store.chroma` en el template 09 RRHH:

```
loader.pdf → ingest.chunker → store.chroma ← model.embedding
                                   │
                              retrieval.vector (topK: 4)
```

- `store.chroma` → nuestro `store` (diccionario) o `ChromaDB.collection`
- `model.embedding` → nuestra función `embeder()` o `SentenceTransformer`
- `retrieval.vector` → nuestra función `buscar()`
- `hardFilters: [categoria]` → nuestro parámetro `filtro`

La diferencia entre el template 09 (Chroma) y el 02 (pgvector) es:
- Template 09: filtros simples por categoría → Chroma suficiente
- Template 02: filtros por `doc_type` y `period` con lógica SQL compleja → pgvector necesario para joins y transacciones

---

## Limitaciones del embedding de juguete y cómo superarlas

| Limitación | Observada en el taller | Solución |
|-----------|----------------------|----------|
| Vocabulario de 20 palabras | Muchos documentos tienen score 0 | Modelo neuronal (768+ dim) |
| Sin semántica | Sinónimos no relacionados | Entrenamiento contrastivo |
| Sin tokenización subword | Palabras con tildes no siempre coinciden | SentenceTransformer |
| Bag-of-words | Ignora el orden de las palabras | Transformer con attention |

El embedding de juguete sirve para entender la mecánica vectorial. En producción, sustituyes `embeder()` por `modelo.encode()` y el resto del pipeline (normalización, coseno, filtro) es idéntico.

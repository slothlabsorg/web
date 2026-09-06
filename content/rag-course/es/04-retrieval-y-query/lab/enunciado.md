# Lab M4 · Retrieval híbrido con filtro duro sobre políticas de aerolínea

## Contexto de negocio

Una aerolínea opera tres tarifas (`fare_class`): **Basic**, **Plus** y **Top**. Cada tarifa tiene sus propias políticas de equipaje, cambios de vuelo y reembolsos. Los agentes del call center consultan estas políticas constantemente durante las llamadas.

El problema: el sistema actual devuelve políticas de cualquier tarifa independientemente de cuál aplica al pasajero. Un agente pregunta "¿puede hacer cambios sin cargo?" para un pasajero Basic, y el sistema devuelve primero la política de Top ("cambios gratuitos ilimitados"). El agente informa incorrectamente al pasajero.

**Tu tarea:** implementar un pipeline de retrieval que combine BM25 + similitud vectorial (retrieval **híbrido**), aplique un **rerank simple**, y use un **filtro duro** por `fare_class`. Demostrar empíricamente que sin filtro aparece ruido de otras tarifas y con filtro el top-3 es correcto y citable.

## El corpus

El directorio `datos/` contiene **9 políticas** en formato JSON, 3 por cada tarifa, con metadata `fare_class` y `route_type`:

```
datos/politicas.json   ← lista de 9 documentos con texto y metadata
```

Cada documento tiene:
```json
{
  "id": "pol_001",
  "texto": "...",
  "metadata": {
    "fare_class": "Basic",
    "route_type": "domestic",
    "categoria": "equipaje"
  }
}
```

## Tarea

Implementar en `solucion_scratch.py` (solo stdlib, determinista):

### Paso 1: BM25 desde cero
Implementa BM25 (k1=1.5, b=0.75) sobre el corpus completo. Dada una query, devuelve los 9 documentos con sus scores.

### Paso 2: Similitud coseno de juguete (embeddings por bag-of-words)
Implementa un embedding de juguete basado en bag-of-words normalizado. Calcula similitud coseno. Devuelve los 9 documentos con sus scores coseno.

### Paso 3: Fusión RRF
Fusiona los rankings de BM25 y coseno usando Reciprocal Rank Fusion (k=60). Produce un ranking unificado de los 9 documentos.

### Paso 4: Rerank simple
Aplica un reranker determinista simple: cuenta cuántos tokens de la query aparecen en el documento (intersección de términos normalizados). Reordena el top-9 fusionado por este score de rerank, desempates por RRF score.

### Paso 5: Sin filtro vs con filtro
Ejecuta el pipeline completo para la query de prueba con `fare_class` objetivo `"Basic"`:

**Query:** `"¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"`

- **Sin filtro:** muestra el top-3 del ranking fusionado + rerank.
- **Con filtro:** aplica `fare_class == "Basic"` antes de BM25/coseno (excluye los documentos que no son Basic). Muestra el nuevo top-3.

## Criterio de éxito

- Sin filtro: el top-3 contiene al menos un documento que NO es `fare_class="Basic"`.
- Con filtro: el top-3 contiene SOLO documentos `fare_class="Basic"` y los resultados son correctamente citables.
- El script corre con `python3 solucion_scratch.py` y produce exactamente lo que describe `expected.md`.

## Pistas escalonadas

**Nivel 1:** ¿Cómo tokenizar? Usa `texto.lower().split()` y elimina stopwords comunes (`["de", "en", "la", "el", "los", "las", "y", "a", "o", "que", "es", "se", "por", "un", "una", "con", "sin", "para", "del"]`).

**Nivel 2:** Para IDF: `math.log((N - n_t + 0.5) / (n_t + 0.5) + 1)` donde N es el total de documentos y n_t es cuántos contienen el término t.

**Nivel 3:** El embedding bag-of-words es un diccionario `{término: frecuencia_normalizada}`. Para similitud coseno, necesitas el producto punto y las normas. Usa `math.sqrt(sum(v**2 for v in vec.values()))` para la norma.

**Nivel 4:** Para RRF, itera los rankings por posición (rank empieza en 1, no en 0) y acumula `1/(60+rank)` por cada lista.

**Nivel 5:** El filtro duro se aplica al inicio: antes de calcular cualquier score, filtra la lista de documentos a solo los que tienen `metadata["fare_class"] == fare_class_objetivo`.

---

## Capa ③ — Pipeline LangChain (tarea guiada)

> **Prerrequisito obligatorio:** la capa ② (`solucion_scratch.py`) debe ejecutarse con stdlib y producir lo de `expected.md`. La capa ③ es **adicional** — la escribes cuando tengas `pip` y red.
>
> **No empieces aquí sin haber leído** [guia.md §13](../guia.md#13-la-capa--explicada-retrievers-de-langchain-desde-cero). Esa sección enseña cada API desde cero. Si solo abres `solucion_framework.py`, la capa ③ aparecerá "de golpe".

### Objetivo

Escribir (o reescribir) `solucion_framework.py` implementando el **mismo pipeline** que tu scratch, pero con retrievers de LangChain:

```
BM25Retriever + Chroma/vector + EnsembleRetriever + CrossEncoderReranker + filtro duro
```

Al terminar, compara tu código con `solucion_framework.py` y verifica que el patrón sin/con filtro coincide con `expected.md` (ruido sin filtro, solo Basic con filtro).

### Instalación (entorno con red)

```bash
pip install langchain langchain-community rank-bm25 sentence-transformers chromadb
```

### Tarea guiada — pistas escalonadas

**Nivel 1 — Documents:** Carga `datos/politicas.json` y convierte cada item a `Document(page_content=..., metadata={id, fare_class, ...})`. Ver [guia §13.4](../guia.md#134-document-con-metadata-de-filtro-recordatorio-breve) y recordatorio en [M1 §11.3](../../01-fundamentos/guia.md#113-el-objeto-document).

**Nivel 2 — BM25Retriever:** Crea `BM25Retriever.from_documents(documentos)` y asigna `.k = 9`. ¿Qué devuelve `.invoke(QUERY)` para la query del lab? Ver [guia §13.5](../guia.md#135-bm25retriever--tu-bm25-manual-empaquetado).

**Nivel 3 — Vector retriever:** Instancia `HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")`, crea `Chroma.from_documents(documentos, embeddings)` y obtén `as_retriever(search_kwargs={"k": 9})`. Recordatorio Chroma: [M1 §11](../../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero). Detalle M4: [guia §13.6](../guia.md#136-vector-retriever--chroma--embeddings-locales).

**Nivel 4 — EnsembleRetriever:** Combina ambos retrievers con `EnsembleRetriever(retrievers=[bm25, vector], weights=[0.4, 0.6])`. ¿Cómo se relaciona con tu `rrf_fusion()` de scratch? Ver [guia §13.7](../guia.md#137-ensembleretriever--tu-rrf-manual-automático) y concepto RRF en [guia §4](../guia.md#4-búsqueda-híbrida).

**Nivel 5 — Reranker:** Envuelve el ensemble en `ContextualCompressionRetriever` con `CrossEncoderReranker(model=HuggingFaceCrossEncoder("BAAI/bge-reranker-base"), top_n=3)`. ¿Por qué `top_n=3` y no `k=3` en el ensemble? Ver [guia §13.8](../guia.md#138-reranking--crossencoderreranker--contextualcompressionretriever).

**Nivel 6 — Filtro duro:** Implementa `crear_retriever_filtrado(fare_class)` que filtra los `Document` **antes** de reconstruir BM25, Chroma, Ensemble y Compression. ¿Por qué no basta con `filter` solo en Chroma? Ver [guia §13.9](../guia.md#139-filtro-duro--por-qué-no-está-en-ensembleretriever) y [guia §7](../guia.md#7-filtros-duros-como-guardrail-de-seguridad).

**Nivel 7 — Ejecución:** Ejecuta sin filtro y con `crear_retriever_filtrado("Basic")`. Imprime top-3 con `id`, `fare_class`, `categoria`. Comprueba:
- Sin filtro: `any(c != "Basic" for c in clases)` → `True`
- Con filtro: `all(c == "Basic" for c in clases)` → `True`

### Criterio de éxito (capa ③)

- Tu script importa y usa: `BM25Retriever`, `EnsembleRetriever`, `ContextualCompressionRetriever`, `CrossEncoderReranker`.
- El patrón empírico coincide con `expected.md` (ruido sin filtro, corrección con filtro).
- Puedes explicar en voz alta qué hace cada bloque sin leer la solución.

### Comparación final

| Paso | Tu scratch | Tu framework |
|------|-----------|--------------|
| Keyword | `bm25_score()` manual | `BM25Retriever` |
| Denso | BoW + coseno | `HuggingFaceEmbeddings` + Chroma |
| Fusión | `rrf_fusion(k=60)` | `EnsembleRetriever` (RRF c=60) |
| Rerank | intersección tokens | `CrossEncoderReranker` (BGE) |
| Filtro | filtrar `CORPUS` al inicio | `crear_retriever_filtrado()` |

Cuando termines, lee `solucion_framework.py` y `solucion.md` para contrastar decisiones de diseño.

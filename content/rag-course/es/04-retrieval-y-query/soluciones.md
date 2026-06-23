# M4 · Soluciones de ejercicios

> Respuestas razonadas de todos los ejercicios 14–21.

---

## Ejercicio 14 · BM25

**(a) IDF de "inspección" y "tren"**

Ambos términos aparecen en 3 de los 4 documentos (doc_1, doc_2, doc_4). n_t = 3, N = 4:

```
IDF("inspección") = log((4 - 3 + 0.5) / (3 + 0.5) + 1)
                  = log(1.5 / 3.5 + 1)
                  = log(0.4286 + 1)
                  = log(1.4286)
                  ≈ 0.357

IDF("tren") = mismo cálculo ≈ 0.357
```

El IDF bajo (0.357) refleja que ambos términos son comunes en este corpus. Si hubiera un término más raro (como "34-11-00"), su IDF sería mucho más alto y pesaría más en el score.

**(b) Ranking intuitivo**

De más a menos relevante: **doc_1 > doc_4 > doc_2 > doc_3**

Razonamiento:
- doc_3 ("cambio de aceite del motor"): no contiene ninguno de los dos términos → score 0. Último con certeza.
- doc_1 ("inspección del tren de aterrizaje principal"): contiene ambos términos, longitud corta (5 tokens ≈ avgdl) → buena normalización.
- doc_4 ("inspección de frenos y tren de aterrizaje"): contiene ambos, longitud media (6 tokens, ligeramente sobre avgdl).
- doc_2 ("tren de aterrizaje principal: procedimiento de inspección detallado"): contiene ambos pero es el más largo (7 tokens > avgdl) → penalizado por longitud.

**(c) Por qué doc_2 puede no ser el más relevante**

A pesar de contener ambos términos y ser el más descriptivo, su mayor longitud lo penaliza. BM25 normaliza por longitud para evitar que documentos extensos dominen simplemente por repetir más palabras. Con `b=0.75`, doc_2 (7 tokens vs avgdl 5.75) recibe una penalización parcial que lo pone detrás de doc_1 en el ranking final.

**(d) El parámetro b=0.75**

**Respuesta correcta: B**

`b=0.75` aplica una normalización parcial. Con `b=0` no hay normalización por longitud (documentos largos no se penalizan). Con `b=1` la normalización es completa (todos los documentos se tratan como si tuvieran la misma longitud). El valor estándar de 0.75 es un compromiso: penaliza moderadamente a los más largos que la media, sin ignorar la longitud completamente.

**(e) ¿Qué pasa con k1=0?**

**Respuesta correcta: A**

Con k1=0, el numerador de la fracción TF se convierte en `f(q,d) * 1 = f(q,d)` y el denominador en `f(q,d) + 0 * ... = f(q,d)`, resultando en `f(q,d)/f(q,d) = 1` para cualquier documento que contenga el término. Es decir, solo importa si el término aparece (presencia binaria), no cuántas veces. BM25 degenera a TF binario × IDF.

---

## Ejercicio 15 · Retrieval híbrido y fusión

**(a) Scores RRF (k=60)**

Posiciones por lista:
```
Lista BM25:   doc_F=1, doc_A=2, doc_C=3, doc_B=4
Lista Vector: doc_A=1, doc_E=2, doc_F=3, doc_D=4
```

Scores:
```
doc_A: 1/(60+2) + 1/(60+1) = 1/62 + 1/61 = 0.01613 + 0.01639 = 0.03252
doc_F: 1/(60+1) + 1/(60+3) = 1/61 + 1/63 = 0.01639 + 0.01587 = 0.03226
doc_E: 0       + 1/(60+2) = 0 + 1/62      =                    0.01613
doc_C: 1/(60+3) + 0        = 1/63 + 0     =                    0.01587
doc_B: 1/(60+4) + 0        = 1/64 + 0     =                    0.01563
doc_D: 0        + 1/(60+4) = 0 + 1/64     =                    0.01563

Ranking final: doc_A > doc_F > doc_E > doc_C > doc_B = doc_D
```

**(b) Por qué doc_A gana**

doc_A tiene consenso: es top-2 en BM25 Y top-1 en vectorial. Aparece alto en ambas listas. doc_F es top-1 en BM25 pero solo top-3 en vectorial — buen score BM25 pero el retriever semántico lo baja. RRF recompensa la consistencia entre fuentes.

**(c) Suma ponderada (alpha=0.7)**

```
score_A = 0.7 * 0.92 + (1-0.7) * 0.80 = 0.644 + 0.240 = 0.884
score_F = 0.7 * 0.60 + (1-0.7) * 0.95 = 0.420 + 0.285 = 0.705
```

doc_A gana (0.884 > 0.705). Con alpha=0.7 se da más peso al retriever vectorial, y doc_A es el mejor en esa dimensión.

**(d) RRF vs suma ponderada**

**Respuesta correcta: B**

RRF opera sobre rangos, no scores. Es la opción correcta cuando los scores de diferentes retrievers tienen escalas incompatibles (BM25 puede producir scores de 0-20+ mientras coseno es 0-1). Sumar directamente esos números es incorrecto. La suma ponderada funciona bien cuando ya normalizaste ambos a la misma escala (0-1).

**(e) El bug en RRF**

El bug es que `enumerate` empieza en rank=0, pero RRF usa `1/(k + r)`. Con r=0 el primer documento recibe `1/(60+0) = 1/60` en lugar de `1/(60+1) = 1/61`. El ranking del primer elemento tiene un score artificialmente alto.

Corrección:
```python
for rank, doc_id in enumerate(bm25_results, start=1):  # ← start=1
    scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
```

También falta manejar el caso donde un doc aparece en ambas listas (el código sí lo maneja con `get(..., 0)`), así que ese aspecto está bien.

---

## Ejercicio 16 · Reranker y filtros duros

**(a) Garantizar aislamiento de planes**

**Respuesta correcta: C** — `hardFilters: ["plan"]` en `retrieval.vector`.

Por qué las otras opciones fallan:

- **A (instrucción en prompt):** Los LLMs pueden "olvidar" instrucciones en prompts largos, pueden razonar que otro plan es "cercano" o "aplicable por analogía", o simplemente no cumplir la instrucción de forma consistente al 100%. En un entorno clínico regulado (HIPAA, leyes de seguros), la probabilidad de fallo debe ser cero estructuralmente.

- **B (postprocesado por el LLM):** Si los chunks incorrectos ya llegaron al LLM, el daño está hecho — el modelo ya los leyó y pueden influir en su respuesta aunque luego se "filtre" la salida. El filtrado debe ocurrir antes de la recuperación.

- **D (recordatorio al final):** Igual que A pero peor — está al final del prompt donde hay menos atención del modelo.

El filtro duro es una cláusula `WHERE` en la consulta SQL/vectorial. El LLM nunca recibe chunks del plan incorrecto porque nunca son recuperados.

**(b) Elección del reranker**

**Presupuesto de latencia:** retrieval=300ms + LLM=400ms = 700ms ya usados. Quedan 100ms.

- BGE-reranker local (~100ms sobre 20 docs): justo en el límite. Si el reranker va a 120ms en producción, se supera el objetivo.
- Cohere API (~200ms): supera el presupuesto en 200ms. No es viable.
- Sin reranker: cumple latencia pero sacrifica precisión.

La decisión correcta es **BGE-reranker local** con monitoreo activo de latencia, y como alternativa, **reducir el topK del retriever a 10 docs** (en vez de 20) para que el reranker sea más rápido (~50-70ms). Si aún no cumple, `FlashRank` (~20ms) es la alternativa ultrarrápida.

**(c) Ventaja del cross-encoder**

**Respuesta correcta: B**

El bi-encoder codifica la query sin ver el documento y vice-versa. El vector de "límite de torque del actuador" es el mismo independientemente de qué documentos haya en el corpus. El cross-encoder ve AMBOS juntos y puede detectar que "torque del tren de morro" es más específico que "torque del tren principal" para esa query particular. Esta interacción contextual es lo que da la mejora de precisión.

- A es incorrecto: el cross-encoder es más lento, no más rápido.
- C es incorrecto: el cross-encoder es impracticable para corpus grandes (no escala).
- D no es una ventaja distintiva; ambos pueden correr en CPU.

**(d) Con y sin hardFilter**

**Sin hardFilter:**
```
Sistema devuelve: chunk_A, chunk_B, chunk_C (los tres, ordenados por similitud)
LLM puede usar chunk_C (PPO-Platinum: "aprobación automática")
Respuesta probable: "Se aprueba automáticamente"
Consecuencia: paciente PPO-Basic recibe aprobación que no le corresponde → 
              fraude de seguros + riesgo regulatorio
```

**Con hardFilter plan="PPO-Basic":**
```
WHERE plan = 'PPO-Basic' antes de buscar
Sistema devuelve: solo chunk_A
LLM usa chunk_A: "diagnóstico M23.x, 4 semanas tratamiento conservador"
Respuesta: "Se aprueba si M23.2 confirmado y 4 semanas de tratamiento conservador"
Consecuencia: correcto por diseño
```

**(e) feedbackRef en retrieval.reranker**

El campo `feedbackRef` apunta a un `observability.feedback` store donde se almacenan las señales `thumbs_up/thumbs_down` de los usuarios. El reranker usa estas señales en su proceso de fine-tuning periódico (fuera del flujo de tiempo real): los fragmentos que recibieron más `thumbs_up` son usados como ejemplos positivos para ajustar los pesos del modelo cross-encoder. Resultado: el reranker mejora continuamente con el uso real sin necesitar etiquetado manual de datos.

---

## Ejercicio 17 · Multi-index routing y query ops

**(a) Routing de queries**

| Query | Índice | Keyword/Intent |
|-------|--------|----------------|
| "¿Puedo cambiar mi vuelo con tarifa Basic?" | tarifas | keyword "tarifa" + keyword "cambio" (pero "tarifa" es más específico) |
| "¿Cómo proceso un rebooking de grupo de más de 10 pasajeros?" | procedimientos | keyword "proceso", "rebooking" → intent: procedimiento operativo |
| "¿Qué dice la regulación sobre reembolsos por vuelo cancelado?" | regulaciones | keyword "regulación" |
| "Necesito cambiar la fecha a un cliente Business, ¿qué pasos sigo?" | procedimientos | keyword "pasos", "cómo" → intent: guía paso a paso |
| "¿Hay algún límite legal para el equipaje de mano?" | regulaciones | keyword "legal", "límite" → intent: normativo |

Nota: la query 1 podría rutear a "tarifas" o "procedimientos" según el diseño. El keyword más específico es "tarifa", así que "tarifas" es la mejor opción. Si el router detecta ambos keywords ("tarifa" y "cambio"), debe priorizar el más específico o tener una regla de precedencia.

**(b) Riesgo sin query rewriting**

**Respuesta correcta: D** — ambos riesgos son reales.

"cosita de lítio" tiene un embedding muy distinto a "batería de litio portátil" — probablemente se parezca más a "objeto extraño" o "cosa de plástico". El vector store devolverá resultados incorrectos.

Además, el router keyword-based no encontrará ningún keyword conocido en "cosita de lítio" y podría caer al fallback o rutear incorrectamente.

El query rewriter, con su glosario corporativo, convertiría "cosita de lítio" → "batería de litio portátil equipaje cabina" antes de cualquier búsqueda.

**(c) Puerto Decision de query.intent**

**Respuesta correcta: B**

El puerto `Decision` permite construir un grafo que bifurca el flujo según la intención: si `intent == no_accionable`, se activa una rama que termina el flujo sin invocar el RAG (evitando latencia y costo innecesarios). Si la intención es accionable, continúa al pipeline de retrieval. El puerto `Query` es la query (posiblemente modificada con el label de intención) para el siguiente paso.

**(d) Bug en el router**

La salida del test es `"tarifas"` para la query `"¿cuál es la tarifa de cambio de vuelo?"`.

El problema: la keyword `"tari"` (prefijo de "tarifa") aparece primero en la lista y hace match antes que "cambio". La query contiene "tarifa de **cambio** de vuelo" — debería rutear a "procedimientos" por la palabra "cambio", pero "tari" hace match primero.

La corrección tiene dos enfoques:
1. **Ordenar por especificidad:** poner las keywords más largas/específicas primero.
2. **Eliminar prefijos innecesarios:** si ya tienes "tarifa", no necesitas "tari".
3. **Lógica de precedencia:** contar cuántas keywords de cada índice aparecen y usar la mayoría.

Solución mínima: eliminar la regla de `"tari"` (es redundante con `"tarifa"`) y ordenar por longitud de keyword descendente.

**(e) Embeddings vs LLM para intent classification**

**Respuesta correcta: C**

La clasificación de intención es una tarea ligera: mapear texto a una etiqueta de un conjunto pequeño (3-5 clases). Los embeddings ligeros (sentence-transformers small) la resuelven en ~5-10ms. Un LLM general tarda 500-2000ms. Con una latencia objetivo de 1.5 segundos end-to-end y el LLM de síntesis ya usando ~500-700ms, no hay margen para una clasificación lenta. Los embeddings son la herramienta correcta para esta etapa del pipeline.

---

## Ejercicio 18 · GraphRAG y diseño integral

**(a) Cuándo GraphRAG aporta más**

**Respuesta correcta: B**

Los manuales de mantenimiento con AD → SB → Task forman un grafo de dependencias explícito y consultado frecuentemente. La pregunta "¿qué tareas debo hacer por esta directiva?" requiere traversal de relaciones, no solo similitud semántica.

- A (noticias independientes): sin relaciones entre documentos. Vector RAG es suficiente.
- C (FAQ): items independientes. Vector RAG es más simple y efectivo.
- D (recomendación de películas): basado en similitud de texto, no en relaciones estructurales.

**(b) Traversal con hops: 2**

```
Punto de partida (vector search): 
  → encuentra [AD-2024-0023] (nodo de directiva)

Hop 1 (seguir relaciones salientes):
  AD-2024-0023 -[:AFECTA_A]-> SB-2023-32-001

Hop 2 (seguir relaciones salientes desde hop 1):
  SB-2023-32-001 -[:REQUIERE]-> Task-32-11-001
  Task-32-11-001 -[:ES_PREREQUISITO_DE]-> Task-07-11-001

Nodos devueltos:
  [AD-2024-0023, SB-2023-32-001, Task-32-11-001, Task-07-11-001]

Respuesta al técnico:
  "Por la AD-2024-0023 debes ejecutar:
   Task-32-11-001 (Landing gear inspection)
   Task-07-11-001 (Aircraft jacking) — prerrequisito"
```

Con `hops: 1` solo devolvería AD-2024-0023 y SB-2023-32-001, perdiendo las tareas concretas.

**(c) Diseño para la firma de abogados**

| Pregunta | Estrategia | Justificación |
|---------|-----------|---------------|
| "¿Qué contratos con cláusula de indemnización ilimitada hemos firmado con proveedores de IT?" | Vector RAG + filtros duros (tipo_proveedor=IT, tipo_clausula=indemnización) | Es búsqueda semántica en corpus de texto. Los contratos no tienen relaciones complejas entre ellos; solo necesitas filtrar por metadata. |
| "¿Hay precedentes de cláusulas de penalización que hayamos negociado exitosamente?" | Vector RAG sobre índice de precedentes, con filtro outcome=exitoso | Búsqueda semántica en corpus de precedentes. Sin relaciones de grafo necesarias. |
| "¿La cláusula 12.3 de este contrato es coherente con política interna y normativa vigente?" | Híbrido: vector multi-index (playbook + regulaciones) + routing | Necesitas buscar en dos índices distintos y compararlos. El template 05 (Legal) implementa exactamente este caso con multi-index + router + reranker. GraphRAG sería útil si las relaciones entre reglas del playbook y artículos de normativa estuvieran explícitamente modeladas (p.ej., "playbook §4.2 implementa normativa Art. 18"). Si no están modeladas, multi-index es suficiente. |

**(e) Pipeline de retrieval para farmacéutica**

```
DISEÑO PROPUESTO:

Índices (store.multi-index):
  fichas_tecnicas   → información de medicamentos por producto + country
  estudios          → evidencia clínica, efectos secundarios + country
  normativa         → regulaciones FDA/EMA por country
  guias             → guías de prescripción por country + speciality

Filtros duros (en todos los retrieval.vector):
  hardFilters: ["country"]      ← no-negociable, guardrail de seguridad

Pipeline de query ops:
  io.input (message del médico)
    ↓
  query.intent                  ← compuerta: ¿es pregunta médica accionable?
    ↓ (si accionable)
  query.rewrite                 ← normalizar nombres genéricos ↔ comerciales
    ↓                             (ej: "ibuprofeno" ↔ "Advil/Nurofen/...")
  retrieval.router              ← según intent: comparación → fichas+estudios
    ↓                              contraindicaciones → fichas+guias
    ↓                              normativa → normativa
  retrieval.hybrid (alpha=0.4)  ← más peso a BM25: nombres de medicamentos exactos
    + hardFilters: ["country"]
    ↓ (top-20 candidatos)
  retrieval.reranker (BGE, topN=5) ← precisión para preguntas médicas
    ↓ (top-5 precisos)
  logic.prompt + logic.citations (enforce)
    ↓
  io.output

Justificación de alpha=0.4 (más BM25):
  Los nombres de medicamentos son identificadores exactos
  ("metformina 850mg" no tiene variantes semánticas útiles)
  BM25 captura mejor estas coincidencias exactas

Nota sobre latencia (< 2s):
  intent: ~10ms, rewrite: ~5ms, hybrid retrieval: ~80ms,
  BGE reranker (20→5): ~120ms, LLM: ~800-1200ms
  Total: ~1.0-1.4s — dentro del objetivo
```

---

## Ejercicio 19 · LangChain: EnsembleRetriever y mapeo RRF

**(a) Código completado**

```python
ensemble = EnsembleRetriever(
    retrievers=[bm25, vector],
    weights=[0.4, 0.6],
)
```

Justificación de `weights=[0.4, 0.6]`: en un call center de aerolínea hay mezcla de jerga exacta ("tarifa Basic", "sin cargo") y lenguaje natural ("¿puedo cambiar mi vuelo?"). Se da **más peso al vectorial (0.6)** para capturar intención semántica, pero se mantiene BM25 relevante (0.4) para términos exactos de políticas. Estos weights **no** son el `alpha` de suma ponderada (§4) — no multiplican scores BM25×0.4 + coseno×0.6. Influyen en el desempate RRF cuando un documento solo aparece en una lista.

Si el dominio fuera solo códigos ATA exactos, usarías `[0.7, 0.3]` (más BM25, coherente con la tabla de §4).

**(b) Equivalencia RRF**

**Respuesta correcta: B**

`EnsembleRetriever` usa RRF con `c=60`, idéntico al `k=60` de tu fórmula `1/(k+rank)` en scratch. Los `weights` no reemplazan a `c`; solo ajustan la contribución relativa de retrievers cuando un documento aparece en una sola lista fusionada.

- A es incorrecto: `weights` y `c` son parámetros independientes.
- C es incorrecto: la fusión es RRF por rangos, no suma de scores.
- D es incorrecto: RRF existe precisamente porque las escalas son incompatibles.

**(c) Efecto de `bm25.k=3` vs `vector k=9`**

BM25 solo aporta 3 posiciones al score RRF; el vector aporta 9. Los documentos que solo el vector encuenta en posiciones 4-9 recibirán score RRF del vector pero **cero** del BM25. La fusión queda **asimétrica** — el vector domina más de lo que sugieren los weights.

En el lab usamos `k=9` para ambos porque el corpus tiene exactamente 9 documentos: queremos que ambos retrievers vean el corpus completo y RRF fusione rankings comparables. En producción con corpus grande, típicamente `k=20` en ambos para el ensemble, y el reranker recorta a `top_n=3`.

**(d) Correspondencia en una línea**

`rrf_fusion(bm25_rank, vector_rank, k=60)` → `EnsembleRetriever(retrievers=[bm25, vector], weights=[0.4, 0.6])` con RRF interno `c=60`.

---

## Ejercicio 20 · LangChain: predice el orden tras el reranker

**(a) Top-3 después del reranker**

El cross-encoder **reordena por su propio score**, no por posición del ensemble:

```
Rank 1: pol_008  (0.91)
Rank 2: pol_005  (0.78)
Rank 3: pol_002  (0.35)
```

El orden **no cambia** respecto al ensemble en este caso — los tres primeros del ensemble ya son los tres scores más altos del reranker. Pero la razón del orden cambia: ahora es relevancia query↔doc conjunta (§5), no consenso RRF.

pol_003 y pol_001 quedan fuera porque `top_n=3`.

**(b) ¿El reranker arregla el problema de dominio?**

**No.** El reranker optimiza **relevancia textual** de la query respecto al documento, no **permisibilidad** por `fare_class`. La query pide "cambios sin cargo" y `pol_008` (Top) responde exactamente eso — el cross-encoder lo puntúa alto (0.91). El reranker **refuerza** el ruido de dominio, no lo elimina.

El filtro duro (§7) debe aplicarse **antes** de cualquier retriever. El reranker solo mejora precision dentro del conjunto de candidatos que ya recuperaste — si ese conjunto incluye tarifas incorrectas, el reranker las puede rankear primero.

**(c) `top_n=3` con ensemble `k=3`**

El reranker recibe como máximo **3 candidatos** (los que devuelve el ensemble). Puede reordenar esos 3, pero **no puede** traer documentos que el ensemble no recuperó. Implicación: configura `k` alto en BM25 y vector (9-20) para recall alto en el ensemble, y deja que el reranker recorte a `top_n=3` con precision alta (§5, §13.8).

**(d) Rol de ContextualCompressionRetriever**

**Respuesta correcta: B**

`ContextualCompressionRetriever` envuelve un `base_compressor` (aquí, el reranker) sobre un `base_retriever` (el ensemble). Recibe candidatos del retriever base, los reordena/recorta, y devuelve el resultado final.

- A describe compresión con LLM (otro uso del mismo wrapper, no el del lab).
- C es trabajo del `EnsembleRetriever`, no del compression retriever.
- D es filtro duro — debe ir antes del pipeline, no en este componente.

---

## Ejercicio 21 · LangChain: encuentra el bug del filtro duro

**(a) Por qué falla el filtro**

El `filter={"fare_class": fare_class}` en `search_kwargs` de Chroma **solo aplica al retriever vectorial**. El `bm25_retriever` sigue indexado sobre los **9 documentos completos** (Basic, Plus, Top). En la fusión RRF, `pol_008` (Top) entra por BM25 con score alto — la query contiene "cambios" y "sin cargo adicional", términos que matchean perfectamente el texto de Top. El vector filtrado no lo devuelve, pero BM25 sí, y RRF lo incluye en el resultado final.

**(b) Corrección mínima**

Reconstruir **ambos** retrievers sobre el corpus filtrado:

```python
def crear_retriever_filtrado(fare_class: str):
    docs_filtrados = [d for d in documentos if d.metadata["fare_class"] == fare_class]

    bm25_filtrado = BM25Retriever.from_documents(docs_filtrados)
    bm25_filtrado.k = len(docs_filtrados)

    vector_filtrado_store = Chroma.from_documents(docs_filtrados, embeddings)
    vector_filtrado = vector_filtrado_store.as_retriever(
        search_kwargs={"k": len(docs_filtrados)}
    )

    ensemble_filtrado = EnsembleRetriever(
        retrievers=[bm25_filtrado, vector_filtrado],
        weights=[0.4, 0.6],
    )
    return ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble_filtrado,
    )
```

Hay que reconstruir **2 retrievers base** (BM25 + vector) + el ensemble + el compression retriever = 4 piezas. No basta con filtrar solo Chroma.

**(c) Estrategia correcta para salud**

**Respuesta correcta: B**

Filtrar `Document` antes de construir BM25 y Chroma es equivalente a `hardFilters: ["plan"]` en RAGorbit: el LLM nunca recibe chunks de otro plan porque nunca se indexan/recuperan.

- A deja BM25 sin filtrar → ruido garantizado (el bug de este ejercicio).
- C es filtro blando — el LLM puede ignorarlo (§7).
- D es post-filtrado — el daño ya ocurrió cuando el LLM leyó chunks incorrectos.

**(d) Tabla comparativa**

| Estrategia | ¿BM25 filtrado? | ¿Vector filtrado? | ¿Ruido posible? |
|------------|-----------------|-------------------|-----------------|
| Scratch: `filtrar CORPUS` al inicio | Sí (corpus ya reducido) | Sí (corpus ya reducido) | No |
| LangChain B: filtrar `Document` antes de `.from_documents()` | Sí | Sí | No |
| LangChain A: solo `filter` en Chroma | **No** (BM25 sigue con corpus completo) | Sí | **Sí** — docs de otras tarifas/planes vía BM25 |

# M4 · Retrieval avanzado y operaciones sobre la query

> **Módulo 4 del curso RAG & Agentic AI — RAGorbit**
> Nodos cubiertos: `retrieval.*`, `query.*`, `store.neo4j`, `store.multi-index`
> Templates ancla: 05-legal, 07-telecom, 08-manufacturing, 03-healthcare
> Semana 4 · ~32 h (lectura + ejercicios + taller)

---

## Índice

1. [El problema de recuperar lo correcto](#1-el-problema-de-recuperar-lo-correcto)
2. [Búsqueda densa (vectorial)](#2-búsqueda-densa-vectorial)
3. [Búsqueda por keyword: BM25](#3-búsqueda-por-keyword-bm25)
4. [Búsqueda híbrida](#4-búsqueda-híbrida)
5. [Reranking con cross-encoder](#5-reranking-con-cross-encoder)
6. [Parent-child retrieval](#6-parent-child-retrieval)
7. [Filtros duros como guardrail de seguridad](#7-filtros-duros-como-guardrail-de-seguridad)
8. [Multi-index routing](#8-multi-index-routing)
9. [Query rewriting e intent detection](#9-query-rewriting-e-intent-detection)
10. [GraphRAG y knowledge graphs (Neo4j)](#10-graphrag-y-knowledge-graphs-neo4j)
11. [Comparativa de tecnologías](#11-comparativa-de-tecnologías)
12. [Los nodos de RAGorbit](#12-los-nodos-de-ragorbit)
13. [La capa ③ explicada: retrievers de LangChain desde cero](#13-la-capa--explicada-retrievers-de-langchain-desde-cero)
14. [Checkpoint](#14-checkpoint)

---

## 1. El problema de recuperar lo correcto

RAG tiene una cadena de dependencias: si la recuperación falla, el LLM no puede generar una respuesta correcta aunque sea el mejor modelo del mundo. Puedes tener el embedding más preciso y el LLM más caro, pero si los chunks recuperados son irrelevantes o pertenecen al dominio equivocado, la respuesta será incorrecta o, peor, plausiblmente incorrecta.

La recuperación tiene tres dimensiones de fallo:

```
FALLO POR SEMÁNTICA   — el usuario escribe "baja de plan"
                        el embedding no asocia con "cancelación de servicio"
                        → BM25 o query rewriting lo resuelven

FALLO POR DOMINIO     — el técnico de A320 recibe un límite de torque del 787
                        porque el embedding es similar
                        → filtros duros lo resuelven

FALLO POR RANKING     — el top-5 tiene fragmentos relevantes pero en posición 4 y 5
                        el LLM usa los primeros dos (más ruidosos)
                        → reranking lo resuelve
```

Este módulo cubre las herramientas para atacar cada tipo de fallo.

---

## 2. Búsqueda densa (vectorial)

### Qué es

La búsqueda densa convierte la query y cada documento en vectores densos de alta dimensión (p.ej. 1536 dimensiones con text-embedding-3-large) y mide similitud coseno o producto punto. Fue cubierta en profundidad en M3. Aquí la recordamos como punto de comparación.

```
Query: "procedimiento inspección tren de aterrizaje"
          ↓ modelo de embeddings
     [0.23, -0.11, 0.87, ...]  ← vector de 1536 dims

Corpus:
  doc_A: [0.21, -0.09, 0.85, ...]  sim=0.97 ← muy relevante
  doc_B: [0.70,  0.45, 0.10, ...]  sim=0.31 ← poco relevante
  doc_C: [0.22, -0.10, 0.86, ...]  sim=0.95 ← muy relevante
```

### Cuándo funciona bien

- La query y los documentos están en el mismo dominio semántico.
- El vocabulario no es altamente especializado o con jerga no vista durante el entrenamiento del modelo de embeddings.
- Los chunks son de tamaño moderado (200–1000 tokens).

### Cuándo falla

- Jerga técnica muy específica: "ATA 32-11-00" o "RRF" no tienen buenas representaciones en embeddings de uso general.
- Queries cortas y exactas: "GDPR artículo 17" recupera mejor con keyword que con vectores.
- Términos internos de empresa: el glosario corporativo no está en los datos de entrenamiento.

### Nodo RAGorbit

`retrieval.vector` — `topK: 4` por defecto. Acepta `hardFilters[]` (ver §7).

---

## 3. Búsqueda por keyword: BM25

### Qué es y de dónde viene

BM25 (Best Match 25) es la función de ranking probabilístico que usa Elasticsearch internamente y que ha sido el estado del arte en recuperación de información durante décadas antes del auge de los embeddings. Su nombre viene de una serie de experimentos en los años 70-90 (Okapi BM11, BM15… hasta BM25).

### La fórmula BM25

Para una query `q` con términos `q_1 ... q_n` y un documento `d`:

```
         n     IDF(q_i) · f(q_i, d) · (k1 + 1)
BM25 = Σ  ────────────────────────────────────────
        i=1  f(q_i, d) + k1 · (1 - b + b · |d|/avgdl)
```

Donde:

| Símbolo | Significado |
|---------|-------------|
| `f(q_i, d)` | Frecuencia del término `q_i` en el documento `d` (term frequency) |
| `IDF(q_i)` | Inverse Document Frequency: `log((N - n_i + 0.5) / (n_i + 0.5) + 1)` |
| `N` | Total de documentos en el corpus |
| `n_i` | Número de documentos que contienen `q_i` |
| `|d|` | Longitud del documento en tokens |
| `avgdl` | Longitud media de los documentos |
| `k1` | Parámetro de saturación de TF (típico: 1.2–2.0) |
| `b` | Parámetro de normalización de longitud (típico: 0.75) |

### Intuición de la fórmula

**IDF:** Un término que aparece en pocos documentos es muy discriminativo. "Tren de aterrizaje" aparece en pocos documentos del corpus → IDF alto → ese término pesa mucho. "El" aparece en todos → IDF ≈ 0 → ese término no discrimina.

**TF con saturación (k1):** La relevancia no crece linealmente con la frecuencia. Si "mantenimiento" aparece 1 vez vs 2 veces, hay diferencia. Si aparece 50 vs 51 veces, la diferencia es casi nula. El parámetro `k1` controla esa saturación.

**Normalización por longitud (b):** Un documento de 1000 palabras naturalmente tendrá más repeticiones de cualquier término que uno de 100 palabras. El parámetro `b` penaliza los documentos largos para evitar que dominen el ranking simplemente por ser extensos. Con `b=0.75` se aplica una normalización parcial (no total).

### Por qué BM25 complementa a los embeddings

```
Query: "ATA 32-11-00"
  BM25: ← recupera "ATA 32-11-00" exacto, score alto
  Vector: ← "landing gear chapter 32" puede ser más cercano semánticamente
           pero "ATA 32-11-00" como cadena exacta tiene mejor BM25

Query: "procedimiento para revisar sistemas hidráulicos antes de vuelo"
  BM25: ← puede fallar si el doc dice "inspección pre-vuelo de actuadores"
  Vector: ← captura la semántica aunque las palabras sean distintas
```

Los modelos de embeddings capturan intención semántica pero pierden coincidencias exactas de términos técnicos. BM25 hace exactamente lo contrario. La combinación es más robusta que cualquiera de los dos solos.

### Nodo RAGorbit: `retrieval.hybrid`

Internamente combina un retriever vectorial y uno BM25 con parámetro `alpha` que controla el peso relativo.

---

## 4. Búsqueda híbrida

### Estrategia de fusión: Reciprocal Rank Fusion (RRF)

RRF es el método de fusión más común para combinar listas de resultados de distintos retrievers. La idea: en lugar de combinar scores directamente (que tienen escalas distintas), se usa el rango de cada documento en cada lista.

```
          1
RRF(d) = Σ ────────────
        r∈R  k + r(d)
```

Donde `r(d)` es la posición del documento `d` en la lista del retriever `r`, y `k` es una constante de suavizado (típico: 60).

**Ejemplo concreto:**

```
BM25 retorna:   doc_A (rank 1), doc_C (rank 2), doc_B (rank 3)
Vector retorna: doc_C (rank 1), doc_A (rank 2), doc_D (rank 3)

RRF(doc_A) = 1/(60+1) + 1/(60+2) = 0.01639 + 0.01613 = 0.03252
RRF(doc_C) = 1/(60+2) + 1/(60+1) = 0.01613 + 0.01639 = 0.03252
RRF(doc_B) = 1/(60+3) + 0         = 0.01587
RRF(doc_D) = 0         + 1/(60+3) = 0.01587

Resultado fusionado: doc_A, doc_C (empate), doc_B, doc_D
```

### Suma ponderada de scores normalizados

Alternativa a RRF cuando los scores están en la misma escala:

```
score_final(d) = alpha * score_vector(d) + (1 - alpha) * score_bm25(d)
```

Con `alpha=0.5` da igual peso a ambos. Ajustar `alpha` según el dominio.

### Cuándo usar híbrido

| Situación | alpha recomendado |
|-----------|-------------------|
| Dominio técnico con muchos identificadores exactos | 0.3 (más BM25) |
| Dominio conversacional / lenguaje natural | 0.7 (más vectorial) |
| Sin saber a priori | 0.5 (punto de partida) |
| Con retroalimentación de usuarios | ajustar con A/B testing |

### Template 07 (Telecom)

El copilot de call center usa `retrieval.hybrid` porque los agentes mezclan jerga técnica ("roaming internacional EE.UU.") con lenguaje natural ("¿qué le digo al cliente?"). BM25 captura los términos exactos del glosario; el vector captura la intención de la pregunta.

### Template 08 (Manufactura)

Los manuales AMM tienen identificadores exactos (ATA, números de sección, números de parte). BM25 es muy preciso para "Task 32-11-00-581-001". El vector captura "procedimiento inspección tren morro" aunque el documento diga "nose landing gear inspection procedure".

---

## 5. Reranking con cross-encoder

### El problema que resuelve

Los retrievers (tanto vectorial como BM25) codifican la query y cada documento **por separado** y luego calculan similitud. Esto es eficiente pero impreciso: el modelo no ve la query y el documento juntos al producir la representación.

Un **cross-encoder** (reranker) es un modelo que recibe la query **y** el documento **juntos** como entrada y produce un score de relevancia. Es mucho más preciso pero también más lento — por eso se usa solo en el top-K de los retrievers, no en el corpus completo.

```
PIPELINE DE DOS ETAPAS (retrieve + rerank)

Paso 1 — Retrieve rápido (recall alto)
  BM25 + Vector → top-20 candidatos
  [rápido, escala a millones de docs, pero impreciso]

Paso 2 — Rerank preciso (precision alta)
  Cross-encoder puntúa query ↔ cada candidato juntos
  → retiene top-3 más relevantes
  [lento, solo aplica a los 20 candidatos, muy preciso]
```

### Por qué mejora la precisión

El bi-encoder (vectores separados) comprime la query en un vector sin saber qué documentos va a comparar. El cross-encoder, al ver los dos juntos, puede capturar interacciones sutiles:

```
Query: "límite de torque del actuador del tren de morro"

doc_A: "El torque máximo del actuador del tren principal es 45 Nm"  ← menciona torque pero del tren PRINCIPAL
doc_B: "Para el tren de morro, el torque del actuador es 32 Nm"    ← exactamente lo que se busca

Bi-encoder: doc_A puede puntuar similar a doc_B (ambos hablan de torque y tren)
Cross-encoder: doc_B puntúa mucho más alto (tren de morro + actuador + torque juntos)
```

### Latencia trade-off

| Componente | Latencia típica | Por qué |
|------------|----------------|---------|
| Retrieval vectorial (HNSW, top-20) | 10-50 ms | índice aproximado en memoria |
| BM25 (top-20) | 5-20 ms | índice invertido en memoria |
| Reranker BGE sobre 20 docs | 50-150 ms | forward pass del modelo por cada par |
| Reranker Cohere API sobre 20 docs | 100-300 ms | llamada de red + modelo grande |

El reranker agrega ~100-200 ms al pipeline, pero la mejora en relevancia suele valer la pena en dominios donde la precisión es crítica (legal, salud, aviación).

### Modelos reranker disponibles

| Modelo | Tipo | Ventaja | Cuándo usar |
|--------|------|---------|-------------|
| `bge-reranker-v2-m3` (BAAI) | Cross-encoder local | Gratuito, sin API, rápido | Producción sin dependencias externas |
| `rerank-english-v3.0` (Cohere) | API cloud | Alta calidad, muy fácil de integrar | Prototipado rápido, inglés |
| `ColBERT` | Late interaction | Balance latencia/calidad, permite pre-computar | Millones de docs |
| `FlashRank` | Cross-encoder muy ligero | Ultra rápido, para edge/mobile | Latencia < 50 ms crítica |

### Template 05 (Legal) y 07 (Telecom)

Ambos usan `retrieval.reranker` con `topN: 3`. En legal, el reranker distingue entre un fragmento del playbook sobre "indemnización" en contratos de software y el fragmento sobre "indemnización" en contratos de infraestructura — que semánticamente son similares pero legalmente relevantes de forma distinta. En telecom, ajusta el ranking según el feedback de los agentes (`feedbackRef`).

### Nodo RAGorbit: `retrieval.reranker`

```json
{
  "type": "retrieval.reranker",
  "config": {
    "model": "bge-reranker",
    "topN": 3,
    "feedbackRef": "feedback_store"   // opcional: mejora con señales de uso
  }
}
```

---

## 6. Parent-child retrieval

### El dilema del tamaño de chunk

Chunks pequeños (100-200 tokens): más precisos para recuperar el fragmento exacto, pero pierden contexto (una oración sin su párrafo).

Chunks grandes (800-1200 tokens): tienen más contexto, pero la representación vectorial promedia el significado de todo el chunk y puede diluir la señal relevante.

**Parent-child** resuelve este dilema con una estrategia de dos niveles:

```
NIVEL PADRE (chunks grandes, 800+ tokens)
  Sección 32-11-00 completa (procedimiento de 900 tokens)
  Sección 32-11-01 completa (variante del procedimiento, 850 tokens)

NIVEL HIJO (chunks pequeños, 100-200 tokens)
  Paso 1: Coloca la aeronave en jack...       (hijo de 32-11-00)
  Paso 2: Verifica el juego lateral...        (hijo de 32-11-00)
  Paso 3: Inspecciona visualmente...          (hijo de 32-11-00)
  Paso 4: Registra los resultados...          (hijo de 32-11-00)

RETRIEVAL:
  1. Se indexan y recuperan los HIJOS (precisión alta)
  2. Se devuelven los PADRES al LLM (contexto completo)
```

### Cuándo usar parent-child

- Documentos con estructura jerárquica clara: manuales técnicos, contratos, guías clínicas.
- Cuando los chunks del índice son semánticamente densos pero necesitas el contexto ampliado para que el LLM responda bien.
- Template 08: cada paso del procedimiento AMM es un hijo; la sección ATA completa es el padre.

### Cuándo no vale la pena

- Corpus de fragmentos independientes (tweets, FAQ individuales, posts de blog).
- Chunks ya moderados (400-600 tokens) donde el contexto es suficiente.
- Cuando la latencia extra de recuperar el padre (segundo lookup) no se puede asumir.

### Nodo RAGorbit: `retrieval.parent-child`

```json
{
  "type": "retrieval.parent-child",
  "config": {
    "parentField": "parent_id"
  }
}
```

El `parent_id` se establece en `ingest.metadata` al indexar, vinculando cada chunk hijo con su documento padre.

---

## 7. Filtros duros como guardrail de seguridad

### La diferencia entre filtro blando y filtro duro

Un **filtro blando** (o soft hint) instruye al LLM a "preferir" documentos de cierto tipo. Ejemplo: "Responde solo usando información del plan PPO-Gold". El problema: el LLM puede ignorarlo, "olvidarlo" en prompts largos, o razonar que otro documento es "suficientemente relevante".

Un **filtro duro** se aplica en la capa de recuperación, **antes** de que cualquier documento llegue al LLM. Es una cláusula `WHERE` en SQL, un filtro de metadata en el vector store. El LLM simplemente nunca ve los documentos que no pasan el filtro.

```
SIN FILTRO DURO:
  Query: "criterios de RM de rodilla"
  Vector store devuelve: chunks de PPO-Gold, PPO-Basic, PPO-Platinum mezclados
  LLM puede usar criterios de PPO-Platinum para un paciente PPO-Basic → ERROR CLÍNICO

CON FILTRO DURO (hardFilter: plan = "PPO-Basic"):
  Query: "criterios de RM de rodilla"
  Vector store aplica WHERE plan = 'PPO-Basic' antes de buscar
  Solo llegan al LLM chunks de PPO-Basic → correcto por diseño
```

### Por qué es un guardrail, no solo un filtro

En dominios de alta consecuencia, el filtro duro actúa como un guardrail de seguridad estructural:

**Salud (03-healthcare):** El paciente con plan PPO-Basic no puede recibir criterios del plan PPO-Platinum (más permisivos). Un "se aprueba" incorrecto es un problema legal y clínico.

**Aviación (08-manufacturing):** El técnico de A320 no puede recibir límites de torque del 787. La confusión de aeronave es un hallazgo FAA/EASA.

**Aviación civil (01-airline):** Un pasajero con tarifa Economy no puede ver políticas de Business en el contexto del LLM, porque podría recibir upgrades o beneficios no contratados.

En todos estos casos, la instrucción de prompt "usa solo los datos del plan/aeronave correcto" no es suficiente. El filtro duro es determinista e inviolable.

### Implementación en el nodo `retrieval.vector`

```json
{
  "type": "retrieval.vector",
  "config": {
    "topK": 5,
    "hardFilters": ["aircraft_type", "ata_chapter"]
  }
}
```

En producción, el nodo convierte esto en una consulta filtrada:

```python
# Pseudocódigo del nodo generado por RAGorbit
results = pgvector_store.similarity_search(
    query_embedding,
    k=5,
    filter={
        "aircraft_type": {"$eq": session.aircraft_type},
        "ata_chapter": {"$eq": session.ata_chapter}
    }
)
```

Los valores de los filtros vienen del contexto de sesión, no del LLM.

### El filtro duro como patrón de diseño transversal

Este patrón aparece en M3, M4, M5 y M9. En RAGorbit, `hardFilters[]` está disponible en `retrieval.vector` y `retrieval.hybrid`. Los campos que se pueden filtrar son los que se etiquetaron en `ingest.metadata`. La regla es: **cualquier dimensión que determine qué información es permisible para un usuario específico debe ser un filtro duro, no una instrucción de prompt**.

---

## 8. Multi-index routing

### Por qué no un solo índice

La solución "simple" es indexar todo en un solo vector store y buscar ahí. El problema:

1. **Ruido cross-dominio:** una query sobre "indemnización" en el contexto de un contrato de software puede recuperar fragmentos de indemnización de contratos de construcción, que son semánticamente similares pero jurídicamente irrelevantes.

2. **Latencia:** buscar en un índice de 1 millón de documentos es más lento que en tres índices de 100k cada uno.

3. **Control de versiones:** actualizar el playbook legal no debería afectar el índice de normativa regulatoria.

### Multi-index routing: arquitectura

```
ÍNDICES:
  policy     ← regulaciones, tarifas, condiciones legales
  procedure  ← procedimientos internos paso a paso
  faq        ← preguntas frecuentes

REGLAS DEL ROUTER:
  keyword "facturacion"   → index: policy
  keyword "procedimiento" → index: procedure
  keyword "cómo puedo"    → index: faq
  fallback                → index: faq

QUERY: "¿Cuánto me cobran por superar mi límite de datos?"
  Router detecta "cobran" → keyword de facturación → ruta a policy
  Solo se busca en policy → 0 ruido de procedure o faq
  Latencia: 30ms (1 índice) vs 90ms (3 índices en paralelo)
```

### Dos estrategias de routing

**1. Keyword matching (determinista)**

```python
for rule in rules:
    if rule.keyword in query.lower():
        return rule.index
return fallback
```

Ventajas: microsegundos, predecible, debuggeable.
Desventajas: requiere mantenimiento manual del glosario de keywords.

**2. Intent-based routing (ML ligero)**

Usa el clasificador `model.intent` (embeddings ligeros, ~5-10ms) para detectar la intención de la query y rutear según la etiqueta:

```
intent("¿cuánto me cobran?") → "facturacion" → policy
intent("cómo configuro el router?") → "soporte_tecnico" → procedure
```

Ventajas: captura variantes semánticas ("¿cuánto es la tarifa?" → facturacion aunque no diga "cobran").
Desventajas: requiere entrenamiento, puede fallar en queries ambiguas.

### Nodos RAGorbit

```
store.multi-index   → agrupa varios Retrievers nombrados
retrieval.router    → selecciona el índice correcto por rules[] o intent
```

### Template 05 (Legal): tres índices, routing por keyword

```
indexes: [playbook, regulations, precedent]
rules:
  "indemniz"   → playbook
  "regulacion" → regulations
  "precedente" → precedent
  fallback:      playbook
```

### Template 07 (Telecom): tres índices, routing por intent

```
indexes: [policy, procedure, faq]
rules:
  facturacion     → policy
  soporte_tecnico → procedure
  fallback:         faq
```

---

## 9. Query rewriting e intent detection

### Query rewriting

El rewriter normaliza la query del usuario antes de enviarla al retriever. Sus dos funciones principales:

**1. Normalización de jerga interna**

```
"baja de plan" → "cancelación de servicio"
"roaming gringo" → "roaming internacional EE.UU."
"batería de la laptop" → "bateria litio portatil equipaje cabina"
```

Esto es un mapeo de términos internos/coloquiales a los términos canónicos que aparecen en la documentación indexada. Sin este paso, BM25 falla (no hay coincidencia de términos) y el vector puede fallar (el embedding del término coloquial es distinto al del técnico).

**2. Expansión de la query (query expansion)**

Añade términos relacionados para mejorar el recall de BM25:

```
Query original: "RM rodilla"
Query expandida: "resonancia magnética rodilla menisco cartílago articulación"
```

Esto es especialmente útil en dominios médicos o legales donde los usuarios formulan queries cortas y los documentos usan terminología completa.

### Intent detection como compuerta del RAG

La detección de intención no es solo para routing: su primera función es ser la **compuerta** que decide si la query merece activar el pipeline RAG en absoluto.

```
FRAGMENTOS DE AUDIO EN CALL CENTER:
  "Oiga, y si viajo a Cancún..."   → intent: facturacion (score 0.71) → RAG
  "Sí, claro, aja... un momento"   → intent: no_accionable (score 0.82) → DESCARTAR
  "¿Cuánto cuesta el plan familiar?" → intent: facturacion (score 0.88) → RAG
```

Sin esta compuerta, el 30-50% de los fragmentos de audio activan el RAG innecesariamente, generando ruido en el panel del agente y consumiendo recursos.

### Nodos RAGorbit

```
query.rewrite   → normaliza jerga, expande términos
query.intent    → detecta intención, filtra no-accionables, ruta
model.intent    → clasificador ligero (embeddings o small-LLM)
```

La diferencia entre `query.intent` y `model.intent` en RAGorbit es que `query.intent` está orientado a la compuerta del RAG (produce `Decision` y `Query`), mientras que `model.intent` es el modelo de clasificación subyacente que puede usarse en contextos más generales.

### Pipeline completo de query ops (Template 07)

```
Audio → STT → model.intent → [si no_accionable: descartar]
                            → [si accionable: query.rewrite → retrieval.router → ...]
```

Este pipeline elimina el ruido antes de la primera llamada al vector store, con una latencia de solo ~15 ms (intent: 10ms + rewrite: 5ms).

---

## 10. GraphRAG y knowledge graphs (Neo4j)

### Cuándo los vectores no son suficientes

Los embeddings capturan semántica de texto, pero no capturan relaciones estructurales. Considera:

```
"¿Qué procedimientos están afectados por la Directiva de Aeronavegabilidad AD-2024-0023?"

Con vectores:
  La query se convierte en vector
  Se buscan chunks similares → puede encontrar algunos procedimientos
  Pero NO puede navegar: AD-2024-0023 → afecta a → SB-2023-32-001 → requiere → Task 32-11-001

Con knowledge graph:
  AD-2024-0023 es un nodo
  Tiene relaciones tipadas: AFECTA_A → [SB-2023-32-001, SB-2023-32-002]
  Cada SB tiene: REQUIERE → [Task 32-11-001, Task 32-11-002]
  Una consulta de vecindario devuelve todo el subgrafo en 1-2 hops
```

### Conceptos fundamentales del knowledge graph

**Nodo:** Una entidad del dominio. En un AMM: un procedimiento, una directiva de aeronavegabilidad, una parte, un técnico certificado.

**Relación (arista tipada):** Una conexión con semántica. No solo "A está relacionado con B", sino "AFECTA_A", "REQUIERE", "REEMPLAZA_A", "ES_PREREQUISITO_DE".

**Vecindario:** El conjunto de nodos y relaciones a 1 o más hops (saltos) de un nodo dado. La recuperación "por vecindario" es lo que diferencia GraphRAG de vector RAG.

```
GRAFO (vista parcial — dominio AMM):

[AD-2024-0023] --AFECTA_A--> [SB-2023-32-001]
                               |
                           REQUIERE
                               |
                          [Task 32-11-001] --ES_PARTE_DE--> [Seccion 32-11-00]
                               |
                           PREREQUISITO
                               |
                          [Task 07-11-001]  (jack de mantenimiento)

QUERY: "qué tareas requiere AD-2024-0023?"
GRAPH TRAVERSAL: AD-2024-0023 → AFECTA_A → SBs → REQUIERE → Tasks
RESULTADO: [Task 32-11-001, Task 07-11-001 (transitivo)]
```

### Neo4j y el nodo `store.neo4j`

Neo4j es la base de datos de grafos más usada en producción. Sus dos grandes ventajas:
1. **Cypher:** lenguaje de query declarativo para grafos, muy legible.
2. **Embeddings en nodos:** Neo4j soporta almacenar embeddings en los nodos y hacer búsqueda vectorial sobre ellos, combinando búsqueda vectorial y traversal de grafo.

```cypher
-- Cypher: encontrar todos los documentos relacionados con una directiva
MATCH (ad:Directive {id: "AD-2024-0023"})-[:AFECTA_A*1..2]->(doc:Document)
RETURN doc.text, doc.section, doc.revision
```

El nodo `store.neo4j` en RAGorbit:
- Crea nodos de tipo `Chunk` con su texto, metadata y embedding.
- Crea relaciones tipadas entre chunks según la estructura del documento (`entitySchema`).
- Con `buildRelations: true`, el nodo infiere relaciones automáticamente (padre-hijo de secciones, co-ocurrencia de entidades).
- El `retrieval.graph` recupera por similitud vectorial en los nodos Y por traversal de vecindario.

### Recuperación híbrida grafo + vector

El flujo de GraphRAG combina las dos capacidades:

```
1. Vector search en nodos del grafo
   → encuentra los 3 nodos más similares a la query

2. Graph traversal desde esos nodos
   → expande 1-2 hops siguiendo relaciones tipadas
   → recolecta el subgrafo de contexto

3. Devuelve: los nodos del vector search + el vecindario
```

Esto es especialmente potente cuando la respuesta a una pregunta no está en un solo chunk sino en la estructura de relaciones entre múltiples chunks.

### Cuándo usar grafos vs vectores

| Situación | Usar |
|-----------|------|
| Corpus con relaciones explícitas y complejas entre entidades | Grafo |
| Preguntas de tipo "¿qué afecta a qué?", "¿qué requiere qué?" | Grafo |
| Recuperación basada en texto y semántica | Vector |
| Corpus sin estructura de relaciones clara | Vector |
| Cuando el mantenimiento del grafo es demasiado costoso | Vector |
| Cuando la precisión extra vale el overhead de Neo4j | Grafo |

### Microsoft GraphRAG

Microsoft Research publicó en 2024 un framework llamado GraphRAG que lleva el concepto más lejos: usa un LLM para extraer entidades y relaciones del corpus (construyendo el grafo automáticamente), y luego usa el grafo para responder preguntas de nivel global ("¿cuáles son los temas principales del corpus?") que los RAG vectoriales no pueden responder bien.

La diferencia clave con el `store.neo4j` de RAGorbit es que Microsoft GraphRAG usa "comunidades" (clustering de entidades relacionadas) para responder preguntas holísticas. RAGorbit usa el grafo principalmente para traversal de vecindario en queries específicas.

---

## 11. Comparativa de tecnologías

### Retrievers

| Método | Precisión | Recall | Latencia | Cuándo |
|--------|-----------|--------|----------|--------|
| BM25 puro | Alta (exacta) | Bajo (semántica limitada) | Muy baja | IDs exactos, términos técnicos |
| Vector puro | Media-alta | Alto | Baja | Lenguaje natural, semántica |
| **Híbrido** | **Alta** | **Alto** | Media | **Caso general** |
| GraphRAG | Muy alta (estructura) | Medio | Alta | Relaciones complejas |

### Rerankers

| Modelo | Calidad | Latencia | Costo | Cuándo |
|--------|---------|----------|-------|--------|
| BGE-reranker-v2 | Muy alta | 50-150ms local | Gratuito | Producción sin cloud |
| Cohere Rerank v3 | Muy alta | 100-300ms API | Pago por uso | Prototipado, inglés |
| ColBERT | Alta | 20-80ms | Gratuito | Escala grande |
| FlashRank | Media-alta | 5-20ms | Gratuito | Edge, latencia crítica |

### Estrategias de fusión

| Método | Cuándo preferir |
|--------|-----------------|
| RRF (Reciprocal Rank Fusion) | Scores de distintas escalas (BM25 y coseno) |
| Suma ponderada normalizada | Scores en misma escala, control fino de alpha |
| Cross-encoder (reranker) | Precisión máxima, latencia tolerable |

### Frameworks: LangChain vs LlamaIndex para retrieval

| Aspecto | LangChain | LlamaIndex |
|---------|-----------|------------|
| Retrievers built-in | EnsembleRetriever, BM25Retriever, ContextualCompressionRetriever | SparseTopKRetriever, HybridFusion, RankGPT |
| Rerankers | ContextualCompressionRetriever + Cohere/BGE | CohereRerank, SentenceTransformerRerank, RankLLM |
| Graph RAG | Integración con Neo4j Graph RAG Toolkit | NebulaGraphStore, Neo4jGraphStore |
| Multi-index | MultiVectorRetriever, MergerRetriever | RouterRetriever, MultiIndexRetriever |
| Cuándo preferir | Cuando el resto del stack ya usa LangChain/LCEL | Cuando el foco es retrieval avanzado con muchas estrategias |

---

## 12. Los nodos de RAGorbit

### Categoría `retrieval`

| Nodo | Descripción | Cuándo |
|------|-------------|--------|
| `retrieval.vector` | Búsqueda por similitud con filtros duros opcionales | Caso base, dominio semántico |
| `retrieval.hybrid` | Vector + BM25 fusionados (parámetro `alpha`) | Dominio con jerga técnica + lenguaje natural |
| `retrieval.graph` | Recuperación por similitud + traversal de vecindario (Neo4j) | Relaciones complejas entre entidades |
| `retrieval.router` | Selecciona índice por keyword/intent | Multi-índice, reducir ruido y latencia |
| `retrieval.parent-child` | Recupera hijos para precisión, devuelve padres para contexto | Documentos jerárquicos largos |
| `retrieval.reranker` | Reordena y recorta con cross-encoder | Siempre después de retrieve en dominios críticos |

### Categoría `query`

| Nodo | Descripción | Cuándo |
|------|-------------|--------|
| `query.rewrite` | Normaliza jerga, expande términos | Dominio con vocabulario corporativo/técnico |
| `query.intent` | Detecta intención, filtra no-accionables, ruta | Compuerta del RAG, reducir llamadas innecesarias |

### Pipeline recomendado para producción

```
Usuario
  ↓ Message
query.intent     ← compuerta: ¿es accionable?
  ↓ Query (si accionable)
query.rewrite    ← normaliza jerga, expande
  ↓ Query
retrieval.router ← selecciona índice correcto
  ↓ Chunks (top-K ruidoso)
retrieval.reranker ← reordena, retiene top-3
  ↓ Chunks (precisos)
logic.prompt + logic.citations
  ↓ Message (con citas)
io.output
```

---

## 13. La capa ③ explicada: retrievers de LangChain desde cero

> **Prerrequisito:** haber completado la capa ② del taller (`lab/solucion_scratch.py`) — BM25, coseno, RRF, rerank y filtro duro implementados a mano. Sin eso, esta sección parecerá magia.
>
> **Recordatorio LangChain (no lo reexplicamos aquí):** En M1, [§11](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero), aprendiste qué es LangChain, el objeto `Document`, `HuggingFaceEmbeddings` / `OpenAIEmbeddings`, `Chroma.from_documents`, la abstracción **`Retriever`** (`as_retriever`, `.invoke`) y el patrón LCEL. **Esta sección enseña solo lo nuevo de M4:** retrievers especializados para búsqueda híbrida, fusión, reranking y filtro duro.
>
> **Entorno:** en la máquina de estudio del curso no hay `pip` ni red. No ejecutarás este código aquí. El objetivo es que, con `pip install langchain langchain-community rank-bm25 sentence-transformers chromadb`, puedas **escribir** `lab/solucion_framework.py` tú mismo.

### 13.1 El problema que resuelve esta capa

En `solucion_scratch.py` escribiste ~300 líneas para: tokenizar, calcular BM25, embedear con bag-of-words, fusionar con RRF, rerankear por intersección de tokens y filtrar por `fare_class`. Funciona y es determinista. Pero en producción necesitas:

- BM25 optimizado (no un bucle Python sobre 50k docs).
- Embeddings semánticos reales (no bag-of-words).
- Fusión híbrida sin reimplementar RRF.
- Un cross-encoder real (BGE-reranker), no intersección de tokens.
- Todo cableado con la **misma interfaz** para poder intercambiar piezas.

LangChain te da retrievers componibles: cada uno implementa la misma interfaz y los encadenas como bloques LEGO.

```
SCRATCH (M4 lab)                         LANGCHAIN (M4 lab)
────────────────────                     ────────────────────────────────────
tokenizar() + BM25 manual      ────────▶  BM25Retriever.from_documents(docs)
embed BoW + coseno manual      ────────▶  Chroma + HuggingFaceEmbeddings + as_retriever
rrf_fusion() manual            ────────▶  EnsembleRetriever(retrievers=[...], weights=[...])
rerank por intersección        ────────▶  CrossEncoderReranker + ContextualCompressionRetriever
filtrar lista Python           ────────▶  crear_retriever_filtrado() o filter en Chroma
```

### 13.2 Tabla puente: scratch → LangChain (M4)

| Lo que hiciste a mano (capa ②) | Pieza LangChain (capa ③) | Sección de concepto |
|-------------------------------|--------------------------|---------------------|
| `bm25_score()` + ranking sobre corpus | `BM25Retriever.from_documents(docs)` + atributo `.k` | [§3 BM25](#3-búsqueda-por-keyword-bm25) |
| `embed_bow()` + `similitud_coseno()` | `HuggingFaceEmbeddings` + `Chroma.from_documents` + `as_retriever(search_kwargs={"k":...})` | [§2 Búsqueda densa](#2-búsqueda-densa-vectorial) + M1 §11 |
| `rrf_fusion(bm25_rank, vector_rank, k=60)` | `EnsembleRetriever(retrievers=[...], weights=[...])` | [§4 Híbrido / RRF](#4-búsqueda-híbrida) |
| `rerank_interseccion()` (proxy cross-encoder) | `CrossEncoderReranker` + `ContextualCompressionRetriever` | [§5 Reranking](#5-reranking-con-cross-encoder) |
| Filtrar `CORPUS` por `fare_class` antes de buscar | `crear_retriever_filtrado()` o `search_kwargs={"filter": {...}}` en Chroma | [§7 Filtros duros](#7-filtros-duros-como-guardrail-de-seguridad) |
| `main()` imprime top-3 sin/con filtro | `.get_relevant_documents(query)` o `.invoke(query)` | M1 §11 (interfaz Retriever) |

### 13.3 Retriever como interfaz componible

En M1 aprendiste que un **Retriever** es cualquier objeto que, dada una query (string), devuelve `list[Document]`. La interfaz mínima:

```python
docs = retriever.invoke("¿puedo hacer cambios sin cargo?")
# docs: list[Document] con page_content y metadata
```

También existe el alias legacy `.get_relevant_documents(query)` — hace lo mismo. En código nuevo prefiere `.invoke()`.

**La idea clave de M4:** puedes **apilar** retrievers. Un retriever puede *contener* otros retrievers:

```
                    ┌─────────────────────────────────────┐
                    │  ContextualCompressionRetriever     │
                    │  (reranker encima del ensemble)     │
                    └──────────────────┬──────────────────┘
                                       │ base_retriever
                    ┌──────────────────▼──────────────────┐
                    │       EnsembleRetriever             │
                    │  (fusión RRF de BM25 + vector)      │
                    └──────────┬─────────────┬────────────┘
                               │             │
                    ┌──────────▼──┐   ┌──────▼──────────┐
                    │ BM25Retriever│   │ vector_retriever │
                    │  (keyword)   │   │  (Chroma/denso)  │
                    └─────────────┘   └─────────────────┘
```

Cada caja habla `list[Document]` hacia arriba. Tú solo llamas `.invoke(query)` al retriever más externo.

### 13.4 `Document` con metadata de filtro (recordatorio breve)

En el lab, cada política del JSON se convierte en un `Document`:

```python
from langchain.schema import Document

documentos = [
    Document(
        page_content=item["texto"],
        metadata={
            "id": item["id"],
            "fare_class": item["metadata"]["fare_class"],  # ← clave para filtro duro
            "route_type": item["metadata"]["route_type"],
            "categoria": item["metadata"]["categoria"],
        },
    )
    for item in raw
]
```

- `page_content` = el texto que indexan BM25 y el vector store.
- `metadata["fare_class"]` = la dimensión que usas en el filtro duro (§7). Sin metadata correcta, el filtro no puede funcionar.

Detalle completo de `Document`: [M1 §11.3](../01-fundamentos/guia.md#113-el-objeto-document).

### 13.5 `BM25Retriever` — tu BM25 manual, empaquetado

**Qué hace:** construye un índice BM25 en memoria sobre una lista de `Document` usando la librería `rank-bm25` (la misma fórmula de §3, optimizada).

```python
from langchain_community.retrievers import BM25Retriever

bm25_retriever = BM25Retriever.from_documents(documentos)
bm25_retriever.k = 9   # cuántos documentos devolver por query (equivalente a tu top-k)

docs = bm25_retriever.invoke("cambios sin cargo adicional")
# docs[0].metadata["id"] → probablemente pol_008 (Top) sin filtro
```

| Parámetro / atributo | Qué controla | Equivalente scratch |
|---------------------|--------------|---------------------|
| `.from_documents(docs)` | Construye el índice BM25 | Tu bucle IDF + TF sobre `CORPUS` |
| `.k` | Top-k a devolver | El `[:9]` de tu ranking BM25 |

**Cuándo usar:** dominios con términos exactos ("cambios", "sin cargo", códigos ATA). **Cuándo NO:** si solo necesitas semántica y no hay identificadores exactos — un vector retriever solo puede bastar.

**Gotcha:** `BM25Retriever` no acepta `filter` de metadata. Si necesitas filtro duro, debes pasarle solo los `Document` ya filtrados (ver §13.10).

### 13.6 Vector retriever — Chroma + embeddings locales

**Qué hace:** indexa los `Document` con embeddings densos y expone un retriever de similitud coseno.

```python
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
# Modelo local ~80MB; primera ejecución descarga de Hugging Face

vector_store = Chroma.from_documents(documentos, embeddings)
vector_retriever = vector_store.as_retriever(search_kwargs={"k": 9})

docs = vector_retriever.invoke("cambios de vuelo sin pagar")
```

| Pieza | Rol | Recordatorio M1 |
|-------|-----|-----------------|
| `HuggingFaceEmbeddings` | Convierte texto → `list[float]` | M1 §11.6 — interfaz `Embeddings` |
| `Chroma.from_documents` | Persiste vectores + metadata | M1 §11.7 — vector store |
| `as_retriever(search_kwargs={"k": N})` | Devuelve top-N por similitud | M1 §11.8 — `Retriever` |

**Diferencia con tu scratch:** tu embedding BoW no captura que "modificación de fecha" y "cambio de vuelo" son semánticamente cercanos. `all-MiniLM-L6-v2` sí — por eso el ranking vectorial del framework puede diferir del scratch, pero el **patrón** (sin filtro → ruido de otras tarifas) se mantiene.

**Cuándo usar:** lenguaje natural, sinónimos, queries largas. **Cuándo NO:** solo búsqueda por ID exacto sin variación semántica.

### 13.7 `EnsembleRetriever` — tu RRF manual, automático

**Qué hace:** ejecuta varios retrievers en paralelo, fusiona sus rankings con **Reciprocal Rank Fusion** (RRF, §4) usando `c=60` por defecto — el mismo `k=60` de tu `rrf_fusion()`.

```python
from langchain.retrievers import EnsembleRetriever

ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],   # 40% BM25, 60% vectorial
)

docs = ensemble_retriever.invoke(QUERY)
```

**Cómo funciona internamente (mapeo a tu scratch):**

```
Tu scratch:                          EnsembleRetriever:
─────────────────                    ─────────────────────
for rank, doc in bm25_results:       Ejecuta retriever[0].invoke(query)
  score += 1/(60+rank)               Ejecuta retriever[1].invoke(query)
for rank, doc in vector_results:      Fusiona con RRF (c=60)
  score += 1/(60+rank)               Aplica weights como desempate
sort by score desc                   Devuelve list[Document]
```

**Sobre `weights`:** NO son multiplicadores de score BM25 vs coseno (escalas incompatibles — por eso RRF usa rangos, §4). En `EnsembleRetriever`, los weights influyen cuando un documento aparece en **solo una** de las listas: un doc que solo el vector retriever encontró recibe un boost proporcional a `weights[1]`. Si aparece en ambas listas, RRF ya le dio score por las dos posiciones.

| weights | Interpretación práctica |
|---------|------------------------|
| `[0.5, 0.5]` | Empate BM25 / vectorial |
| `[0.4, 0.6]` | Más confianza en semántica (dominio conversacional) |
| `[0.7, 0.3]` | Más confianza en keywords (dominio técnico con IDs exactos) |

**Cuándo usar:** siempre que quieras híbrido BM25+vector (caso general, §4). **Cuándo NO:** si uno de los retrievers es claramente inútil en tu dominio — mejor quitarlo que darle weight 0.01.

**Gotcha:** `EnsembleRetriever` no tiene `hardFilter`. El filtro debe aplicarse *antes* (§13.10).

### 13.8 Reranking — `CrossEncoderReranker` + `ContextualCompressionRetriever`

**Qué hace:** toma la salida del retriever base (ensemble), la reordena con un cross-encoder (§5) y recorta a `top_n`.

```python
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever

cross_encoder = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
reranker = CrossEncoderReranker(model=cross_encoder, top_n=3)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,       # el "compresor" reordena y recorta
    base_retriever=ensemble_retriever,  # de dónde vienen los candidatos
)

docs = compression_retriever.invoke(QUERY)  # máximo 3 docs, reordenados
```

**Patrón "compression/reranking sobre retriever base":**

```
Query
  │
  ▼
base_retriever (Ensemble)  ──▶  top-9 candidatos (recall alto, §5)
  │
  ▼
base_compressor (Reranker) ──▶  reordena query+doc JUNTOS (precision alta)
  │
  ▼
top-3 finales
```

El nombre "ContextualCompression" es histórico: originalmente comprimía documentos largos. En la práctica de RAG, el uso más común es **reranking** — por eso casi siempre el `base_compressor` es un reranker.

**Alternativa cloud (sin modelo local):**

```python
# from langchain_cohere import CohereRerank
# reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=3)
```

`CohereRerank` sigue el mismo patrón: lo pasas como `base_compressor` a `ContextualCompressionRetriever`. Requiere `COHERE_API_KEY` pero evita descargar BGE (~400MB).

| Opción | Ventaja | Cuándo |
|--------|---------|--------|
| `CrossEncoderReranker` + BGE | Local, gratis, multilingüe razonable | Producción sin cloud |
| `CohereRerank` | Muy fácil, alta calidad en inglés | Prototipado rápido con API |

**Cuándo usar reranker:** dominios críticos (legal, salud, aerolínea) donde el top-5 del retriever tiene ruido en posiciones 1-2. **Cuándo NO:** latencia < 100ms o corpus < 500 docs donde el retriever ya es preciso.

**Gotcha:** el reranker recibe la salida del `base_retriever`. Si el ensemble devuelve `k=3`, el reranker solo puede reordenar 3 docs — configura `k` del ensemble alto (9-20) y deja que el reranker recorte a `top_n=3`.

### 13.9 Filtro duro — por qué no está en `EnsembleRetriever`

`EnsembleRetriever` fusiona listas de BM25 y vector. **No tiene parámetro `hardFilter`** porque:

1. BM25 no soporta filtros de metadata nativamente.
2. Chroma sí soporta `filter` en `search_kwargs`, pero ese filtro solo aplica al retriever vectorial — BM25 seguiría devolviendo docs de otras tarifas.

**Estrategia A (recomendada en el lab):** filtrar el corpus **antes** de construir los retrievers:

```python
def crear_retriever_filtrado(fare_class: str):
    docs_filtrados = [d for d in documentos if d.metadata["fare_class"] == fare_class]
    bm25_filtrado = BM25Retriever.from_documents(docs_filtrados)
    # ... reconstruir vector store, ensemble y compression retriever
```

**Estrategia B (solo vector):** filtro en Chroma sin reconstruir el índice:

```python
vector_retriever = vector_store.as_retriever(
    search_kwargs={"k": 9, "filter": {"fare_class": "Basic"}}
)
```

Esto filtra el retriever vectorial, pero **BM25 del ensemble seguiría sin filtrar** — ruido garantizado. Por eso la estrategia A es la robusta (igual que tu scratch: filtras `CORPUS` al inicio).

Ver justificación completa en [§7](#7-filtros-duros-como-guardrail-de-seguridad).

### 13.10 Recorrido bloque a bloque: `lab/solucion_framework.py`

Abre `lab/solucion_framework.py` y sigue este mapa. Cada bloque corresponde a algo que ya escribiste a mano.

```
BLOQUE 1 — Cargar corpus → Documents
─────────────────────────────────────
JSON → list[Document] con metadata fare_class, route_type, categoria
¿Por qué? BM25Retriever y Chroma consumen Document, no dicts sueltos.

BLOQUE 2 — BM25Retriever
────────────────────────
BM25Retriever.from_documents(documentos); bm25_retriever.k = 9
¿Por qué k=9? Corpus de 9 políticas; queremos todos los candidatos
              para que el ensemble tenga material para fusionar.

BLOQUE 3 — Vector store + retriever
────────────────────────────────────
HuggingFaceEmbeddings + Chroma.from_documents + as_retriever(k=9)
¿Por qué all-MiniLM-L6-v2? Modelo local ligero; suficiente para el lab.

BLOQUE 4 — EnsembleRetriever
─────────────────────────────
retrievers=[bm25, vector], weights=[0.4, 0.6]
¿Por qué? Replica tu rrf_fusion() de scratch con RRF c=60 interno.

BLOQUE 5 — Reranker + Compression retriever
────────────────────────────────────────────
CrossEncoderReranker(BGE, top_n=3) envuelto en ContextualCompressionRetriever
¿Por qué? Replica tu rerank por intersección, pero con cross-encoder real.

BLOQUE 6 — crear_retriever_filtrado()
──────────────────────────────────────
Filtra docs → reconstruye BM25 + Chroma + Ensemble + Compression
¿Por qué reconstruir todo? EnsembleRetriever no filtra; BM25 no tiene filter.

BLOQUE 7 — Ejecución sin/con filtro
────────────────────────────────────
compression_retriever.invoke(QUERY)  vs  crear_retriever_filtrado("Basic").invoke(QUERY)
¿Por qué? Demostrar el mismo patrón que expected.md del scratch.
```

**Resultado esperado (mismo patrón que scratch):**

| Modo | Top-3 fare_class | Ruido |
|------|------------------|-------|
| Sin filtro | Top, Plus, Basic mezclados | Sí — pol_008 (Top) probablemente primero |
| Con filtro `Basic` | Solo Basic | No — pol_002, pol_003, pol_001 |

El framework puede rankear ligeramente distinto al scratch (embeddings reales vs BoW), pero el **check de ruido** debe ser el mismo: sin filtro hay tarifas incorrectas; con filtro, solo Basic.

### 13.11 Cuándo usar / NO usar cada pieza

| Pieza | Usar cuando | NO usar cuando | Gotcha principal |
|-------|-------------|----------------|------------------|
| `BM25Retriever` | IDs exactos, jerga técnica, términos raros | Solo semántica conversacional | Sin filtro de metadata nativo |
| Vector retriever (Chroma) | Lenguaje natural, sinónimos | Solo búsqueda por código exacto | `filter` en Chroma no afecta a BM25 del ensemble |
| `EnsembleRetriever` | Caso general híbrido | Un retriever claramente dominante | `weights` ≠ alpha de suma ponderada (§4) |
| `CrossEncoderReranker` | Precisión crítica, top-k ruidoso | Latencia < 100ms, corpus pequeño | Necesita `k` alto en el retriever base |
| `ContextualCompressionRetriever` | Siempre que añadas reranker | — | El nombre confunde; es un wrapper de rerank |
| Filtro duro pre-corpus | Guardrail de seguridad (§7) | Filtro "blando" en prompt basta (raro) | Post-filtrar después del LLM es tarde |

### 13.12 Diagrama del pipeline completo (framework)

```
politicas.json
      │
      ▼
 list[Document]  ──────────────────────────────────────────────┐
      │                                                         │
      │ corpus completo (9 docs)                                │ docs_filtrados (3 Basic)
      ▼                                                         ▼
 ┌─────────┐  ┌──────────────┐                    ┌─────────┐  ┌──────────────┐
 │  BM25   │  │ Chroma+HF    │                    │  BM25   │  │ Chroma+HF    │
 │  k=9    │  │ Embeddings   │                    │  k=3    │  │  k=3         │
 └────┬────┘  └──────┬───────┘                    └────┬────┘  └──────┬───────┘
      │              │                                  │              │
      └──────┬───────┘                                  └──────┬───────┘
             ▼                                                 ▼
      EnsembleRetriever                                  EnsembleRetriever
      weights=[0.4,0.6]                                  weights=[0.4,0.6]
      RRF c=60                                           RRF c=60
             │                                                 │
             ▼                                                 ▼
   ContextualCompressionRetriever                    ContextualCompressionRetriever
   + BGE reranker top_n=3                           + BGE reranker top_n=3
             │                                                 │
             ▼                                                 ▼
   SIN FILTRO: Top, Plus, Basic                      CON FILTRO: solo Basic
   (ruido — §7)                                      (correcto — §7)
```

### 13.13 Siguiente paso: escribe el framework tú mismo

1. Lee `lab/enunciado.md` — la sección **Capa ③** tiene pistas escalonadas que apuntan aquí.
2. Intenta escribir `lab/solucion_framework.py` **sin mirar** la solución.
3. Compara con `lab/solucion_framework.py` y `lab/solucion.md`.
4. Cuando tengas `pip` y red, ejecútalo y verifica que el patrón sin/con filtro coincide con `lab/expected.md`.

**Cross-links útiles:**

- Conceptos BM25: [§3](#3-búsqueda-por-keyword-bm25)
- Fusión RRF: [§4](#4-búsqueda-híbrida)
- Cross-encoder: [§5](#5-reranking-con-cross-encoder)
- Filtro duro: [§7](#7-filtros-duros-como-guardrail-de-seguridad)
- Taller scratch: [`lab/enunciado.md`](lab/enunciado.md) · [`lab/expected.md`](lab/expected.md)
- LangChain base: [M1 §11](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero)

---

> **Más allá de Lang\*:** los retrievers y el pipeline RAG completo también se construyen con **LlamaIndex** (query engines/retrievers), con **Haystack** y con el **SDK nativo + Chroma** — ver [`../referencia/rag-sin-langchain.md`](../referencia/rag-sin-langchain.md).
>
> **Panorama de estrategias:** más allá de híbrido + rerank, existe un catálogo entero de arquitecturas RAG (HyDE, RAG-Fusion, RAPTOR, Contextual Retrieval, ColBERT, Self-RAG, CRAG, Adaptive/Agentic RAG…). Cuándo aplicar cada una en [`../referencia/panorama-estrategias-rag.md`](../referencia/panorama-estrategias-rag.md).

---

## 14. Checkpoint

**Lo sabes si puedes:**

- Explicar la fórmula BM25 y por qué cada parámetro (IDF, k1, b) existe.
- Describir RRF y calcular manualmente el score fusionado de 3 documentos.
- Explicar por qué un cross-encoder es más preciso que un bi-encoder y cuándo no vale la latencia extra.
- Diseñar un filtro duro para un dominio de alta consecuencia y argumentar por qué no basta con una instrucción de prompt.
- Diseñar un multi-index con routing para el caso de telecom (3 índices, reglas de keyword + intent).
- Explicar cuándo un knowledge graph supera a los vectores y cuándo no.
- Mapear los 6 nodos de `retrieval` y los 2 de `query` a sus casos de uso.
- Explicar qué hace cada retriever de LangChain (`BM25Retriever`, `EnsembleRetriever`, `ContextualCompressionRetriever`) y mapearlo a lo que implementaste en scratch.
- Escribir un pipeline LangChain híbrido + rerank + filtro duro sin copiar la solución del lab.

**Qué repasar si algo no está claro:**

- BM25: releer §3 con un corpus de 5 documentos de ejemplo y calcular los scores a mano.
- Cross-encoder: releer §5, ejecutar el scratch del taller para ver la diferencia con y sin reranker.
- Filtros duros: leer los §9 de los templates 03 y 08 para ver la justificación en contexto real.
- GraphRAG: explorar `examples/05-legal-contract-review/flow.json` y el nodo `store.neo4j` en `docs/02-node-catalog.md`.
- LangChain retrievers: releer [§13](#13-la-capa--explicada-retrievers-de-langchain-desde-cero), escribir `lab/solucion_framework.py` guiado por `lab/enunciado.md`.

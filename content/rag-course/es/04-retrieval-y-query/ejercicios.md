# M4 · Ejercicios de Retrieval avanzado y Query ops

> Ejercicios 14–21. Sin respuestas — ver `soluciones.md`.
> Tipos: opción múltiple razonada (OM), predice la salida (PS), encuentra el bug (EB), elige la tecnología (ET).

---

## Ejercicio 14 · BM25: entender la fórmula

**Tipo: opción múltiple razonada + cálculo**

Tienes un corpus de **4 documentos** sobre mantenimiento aeronáutico:

```
doc_1: "inspección del tren de aterrizaje principal"
doc_2: "tren de aterrizaje principal: procedimiento de inspección detallado"
doc_3: "cambio de aceite del motor"
doc_4: "inspección de frenos y tren de aterrizaje"
```

La query es: `"inspección tren"`

**Parámetros BM25:** k1=1.5, b=0.75. Longitudes: doc_1=5 tokens, doc_2=7 tokens, doc_3=5 tokens, doc_4=6 tokens. avgdl=5.75.

**(a)** El término "inspección" aparece en los documentos 1, 2 y 4. El término "tren" aparece en los documentos 1, 2 y 4. Con N=4 documentos, calcula el IDF de ambos términos usando la fórmula:

```
IDF(t) = log((N - n_t + 0.5) / (n_t + 0.5) + 1)
```

Donde `n_t` es el número de documentos que contienen el término `t`.

**(b)** Sin hacer el cálculo completo de BM25, ordena los 4 documentos del más relevante al menos relevante y justifica tu respuesta intuitivamente.

**(c)** ¿Por qué doc_2 puede no ser el más relevante a pesar de ser el más largo y contener ambos términos?

**(d)** (Opción múltiple) El parámetro `b=0.75` en BM25:

   A) Aumenta el score de los documentos largos proporcionalmente a su longitud
   B) Aplica una normalización parcial por longitud, penalizando moderadamente a los documentos más largos que la media
   C) Elimina completamente el efecto de la longitud del documento en el score
   D) Solo aplica si el documento tiene más del doble de la longitud media

**(e)** (Opción múltiple) ¿Qué pasa si pones `k1=0` en BM25?

   A) Solo importa si el término aparece o no (presencia binaria), no cuántas veces
   B) El score se vuelve exactamente igual al TF puro
   C) BM25 deja de funcionar (división por cero)
   D) Se ignoran documentos más cortos que la media

---

## Ejercicio 15 · Retrieval híbrido y fusión

**Tipo: predice la salida + razonamiento**

Tienes un retriever BM25 y un retriever vectorial. Para la query "¿cuánto cuesta el plan familiar?", cada uno devuelve (en orden de relevancia):

```
BM25:   [doc_F, doc_A, doc_C, doc_B]
Vector: [doc_A, doc_E, doc_F, doc_D]
```

**(a)** Calcula los scores RRF para todos los documentos que aparecen en al menos una lista, usando k=60. Ordena el resultado final.

**(b)** ¿Qué documento gana en el ranking fusionado y por qué tiene más "consenso" que doc_F?

**(c)** Considera ahora una fusión por suma ponderada con alpha=0.7 (más peso a vectorial):

```
BM25 scores normalizados:   doc_F=0.95, doc_A=0.80, doc_C=0.50, doc_B=0.30
Vector scores normalizados: doc_A=0.92, doc_E=0.75, doc_F=0.60, doc_D=0.40
```

Calcula el score fusionado para doc_A y doc_F. ¿Cuál gana?

**(d)** (Opción múltiple) ¿Cuándo preferirías RRF sobre suma ponderada normalizada?

   A) Cuando los scores de BM25 y el retriever vectorial están en la misma escala (0-1)
   B) Cuando los retrievers usan escalas de score distintas (BM25 puede ser 0-25, coseno es 0-1)
   C) Cuando quieres dar más peso a uno de los dos retrievers con precisión
   D) Cuando el corpus tiene menos de 100 documentos

**(e)** (Encuentra el bug) El siguiente código implementa RRF. ¿Qué está mal?

```python
def rrf_fusion(bm25_results, vector_results, k=60):
    scores = {}
    for rank, doc_id in enumerate(bm25_results):      # rank empieza en 0
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    for rank, doc_id in enumerate(vector_results):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    return sorted(scores.keys(), key=lambda d: scores[d], reverse=True)
```

---

## Ejercicio 16 · Reranker y filtros duros

**Tipo: elige la tecnología + opción múltiple razonada**

Un hospital está construyendo un sistema RAG sobre guías clínicas. Los requisitos son:

- La respuesta debe contener solo criterios del plan de seguro del paciente.
- El sistema tiene latencia objetivo de < 800ms end-to-end.
- Hay 3 planes distintos: PPO-Basic, PPO-Gold, PPO-Platinum.
- El modelo de embeddings es text-embedding-3-large.
- El corpus tiene 50,000 chunks indexados.

**(a)** (Elige la tecnología) Para garantizar que un paciente PPO-Basic no vea criterios PPO-Platinum, ¿cuál de estas opciones usarías?

   A) Instrucción en el system prompt: "Solo usa información del plan PPO-Basic"
   B) Postprocesado: filtrar los chunks devueltos por el LLM antes de mostrárselos al usuario
   C) `hardFilters: ["plan"]` en `retrieval.vector`
   D) Añadir al final del prompt: "Recuerda usar solo el plan correcto"

Justifica por qué las otras tres opciones son insuficientes para un entorno clínico regulado.

**(b)** Para el reranker, el equipo evalúa tres opciones:

   - **Opción 1:** BGE-reranker-v2 (local, ~100ms sobre 20 docs)
   - **Opción 2:** Cohere Rerank v3 API (~200ms, pago por uso)
   - **Opción 3:** Sin reranker, top-5 directo del vector store

Con latencia objetivo de 800ms y el sistema ya usando 300ms en retrieval + 400ms en LLM, ¿qué opción elegirías y por qué?

**(c)** (Opción múltiple) Un cross-encoder puntúa la query y cada documento **juntos** (concatenados). ¿Qué ventaja concreta tiene sobre el bi-encoder que genera un vector por separado?

   A) Es más rápido porque procesa en paralelo
   B) Puede capturar interacciones entre términos de la query y el documento que el bi-encoder no ve
   C) Funciona mejor para corpus de más de 1 millón de documentos
   D) No requiere GPU para ejecutarse

**(d)** (Predice la salida) Dado este escenario:

```
Corpus:
  chunk_A: "Criterios RM rodilla PPO-Basic: diagnóstico M23.x, 4 semanas tratamiento conservador"
  chunk_B: "Criterios RM rodilla PPO-Gold: diagnóstico M23.x, sin requisito de tiempo"
  chunk_C: "Criterios RM rodilla PPO-Platinum: aprobación automática para M23.x"

Query: "¿Se aprueba RM de rodilla para diagnóstico M23.2?"
Paciente: plan PPO-Basic
```

¿Qué devuelve el sistema CON hardFilter y qué devuelve SIN hardFilter? ¿Qué consecuencia tiene la diferencia?

**(e)** El nodo `retrieval.reranker` en RAGorbit tiene un campo `feedbackRef`. Explica en 3 oraciones para qué sirve y cómo conecta con `observability.feedback`.

---

## Ejercicio 17 · Multi-index routing y query ops

**Tipo: diseño + opción múltiple + encuentra el bug**

Una aerolínea quiere construir el sistema de su agente de call center. Tiene 3 bases de conocimiento:
- `tarifas`: condiciones de tarifas, equipaje, cambios según clase
- `procedimientos`: protocolos de atención al cliente paso a paso
- `regulaciones`: normativa de aviación civil aplicable

**(a)** (Diseño) Un agente recibe las siguientes queries. Para cada una, indica a qué índice la rutearías y qué keyword o intento detectarías:

1. "¿Puedo cambiar mi vuelo con tarifa Basic?"
2. "¿Cómo proceso un rebooking de grupo de más de 10 pasajeros?"
3. "¿Qué dice la regulación sobre reembolsos por vuelo cancelado?"
4. "Necesito cambiar la fecha a un cliente Business, ¿qué pasos sigo?"
5. "¿Hay algún límite legal para el equipaje de mano?"

**(b)** (Opción múltiple) Un pasajero dice: "oye mi maleta lleva la cosita esa de lítio de la laptop, ¿puedo meterla en la bodega?". Sin query rewriting, ¿cuál es el riesgo?

   A) La query vectorial fallará porque el vector de "cosita de lítio" no es similar al vector de "batería de litio portátil"
   B) El router nunca encontrará la keyword correcta en "cosita de lítio" y podría rutear incorrectamente
   C) El LLM recibirá la query sin normalizar pero puede inferir el significado
   D) Tanto A como B son riesgos reales

**(c)** (Opción múltiple) El nodo `query.intent` en RAGorbit produce dos puertos de salida: `Query` y `Decision`. ¿Para qué sirve el puerto `Decision`?

   A) Solo sirve para enrutar la query al índice correcto
   B) Permite bifurcar el flujo: si la intención es no_accionable, el flujo puede terminar sin invocar el RAG
   C) Contiene la query reescrita
   D) Se usa para autenticar al usuario

**(d)** (Encuentra el bug) Este router de multi-index tiene un problema sutil:

```python
rules = [
    {"keyword": "tari",      "index": "tarifas"},
    {"keyword": "tarifa",    "index": "tarifas"},
    {"keyword": "cambio",    "index": "procedimientos"},
    {"keyword": "regulacion","index": "regulaciones"},
]

def route(query: str, rules: list, fallback: str) -> str:
    query_lower = query.lower()
    for rule in rules:
        if rule["keyword"] in query_lower:
            return rule["index"]
    return fallback

# Test:
print(route("¿cuál es la tarifa de cambio de vuelo?", rules, "tarifas"))
```

¿Cuál es la salida del test y por qué es incorrecta? ¿Cómo lo corriges?

**(e)** (Opción múltiple) En el template 07 (Telecom), el `model.intent` usa `backend: embeddings` (embeddings ligeros) en lugar de un LLM para clasificar la intención. ¿Por qué?

   A) Los LLMs no pueden clasificar texto
   B) Los embeddings son más precisos para clasificación de intención
   C) Los embeddings ligeros clasifican en ~5-10 ms vs ~500-2000 ms de un LLM, cumpliendo la latencia < 1.5s
   D) Los LLMs solo se pueden usar para generación, no para clasificación

---

## Ejercicio 18 · GraphRAG y diseño integral

**Tipo: conceptual + diseño + opción múltiple**

**(a)** (Opción múltiple) ¿En cuál de estos casos GraphRAG aporta claramente más que vector RAG?

   A) Un corpus de artículos de noticias independientes sobre distintos temas
   B) Un corpus de manuales de mantenimiento donde las directivas de aeronavegabilidad (AD) referencian boletines de servicio (SB) que a su vez referencian tareas (Task) interdependientes
   C) Una base de conocimiento de FAQs con preguntas y respuestas independientes
   D) Un sistema de recomendación de películas basado en descripciones de texto

**(b)** Dado este fragmento de grafo en Neo4j (notación Cypher):

```cypher
(ad:Directive {id:"AD-2024-0023", type:"airworthiness"})
  -[:AFECTA_A]->
(sb:Bulletin {id:"SB-2023-32-001", ata_chapter:"32"})
  -[:REQUIERE]->
(task:Task {id:"Task-32-11-001", title:"Landing gear inspection"})
  -[:ES_PREREQUISITO_DE]->
(task2:Task {id:"Task-07-11-001", title:"Aircraft jacking"})
```

Un técnico pregunta: "¿Qué tareas debo hacer por la AD-2024-0023?". Describe el traversal que haría `retrieval.graph` con `hops: 2` y qué nodos devolvería.

**(c)** (Diseño) Una firma de abogados tiene un corpus con:
   - Contratos firmados (miles)
   - Playbook de cláusulas internas (centenares de reglas)
   - Normativa aplicable (cientos de artículos)
   - Precedentes: contratos anteriores con resolución conocida

Los abogados hacen preguntas como:
- "¿Qué contratos con cláusula de indemnización ilimitada hemos firmado con proveedores de IT?"
- "¿Hay precedentes de cláusulas de penalización que hayamos negociado exitosamente?"
- "¿La cláusula 12.3 de este contrato es coherente con nuestra política interna y la normativa vigente?"

Para cada pregunta, indica si preferirías vector RAG, GraphRAG, o una combinación, y justifica.

**(d)** (Opción múltiple) El template 05 (Legal) no usa `store.neo4j` sino `store.multi-index` con `retrieval.router`. ¿Cuándo sería válido reemplazarlo por `store.neo4j` con `retrieval.graph`?

   A) Siempre que haya más de 3 índices
   B) Cuando las relaciones entre documentos (contrato → playbook → normativa) son suficientemente explícitas y consultadas frecuentemente por traversal
   C) Cuando el corpus tiene más de 10,000 documentos
   D) Cuando se usa LangChain en lugar de LlamaIndex

**(e)** (Diseño integral — caso complejo) Una empresa farmacéutica quiere un sistema RAG sobre su documentación regulatoria. Requisitos:
   - Corpus: 200,000 chunks de fichas técnicas de medicamentos, estudios clínicos, normativa FDA/EMA, y guías de prescripción
   - Usuarios: médicos prescriptores que preguntan en lenguaje natural
   - Restricción crítica: un médico solo puede ver información del país donde ejerce (filtro por `country`)
   - Latencia objetivo: < 2 segundos
   - Preguntas frecuentes incluyen: comparar dos medicamentos, interacciones medicamentosas, contraindicaciones para perfiles de paciente específicos

   Diseña el pipeline de retrieval completo indicando qué nodos de RAGorbit usarías, en qué orden, y por qué. Incluye: índices, filtros, reranker, y cualquier paso de query ops necesario.

---

## Ejercicio 19 · LangChain: EnsembleRetriever y mapeo RRF

**Tipo: completa el código + opción múltiple razonada**

Has implementado `rrf_fusion()` en scratch (lab M4) y ahora quieres el equivalente LangChain. Tienes:

```python
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

bm25 = BM25Retriever.from_documents(documentos)
bm25.k = 9
vector = vector_store.as_retriever(search_kwargs={"k": 9})

# TODO: completar
ensemble = EnsembleRetriever(
    retrievers=[_____, _____],
    weights=[_____, _____],
)
```

El dominio es call center de aerolínea: queries mezclan jerga exacta ("tarifa Basic", "sin cargo") con lenguaje natural ("¿puedo cambiar mi vuelo?").

**(a)** Completa `retrievers` y `weights`. Justifica por qué elegiste esos weights (pista: no son el `alpha` de suma ponderada de §4).

**(b)** (Opción múltiple) `EnsembleRetriever` fusiona con RRF usando `c=60`. ¿Qué equivalencia tiene con tu scratch?

   A) `weights` reemplazan a `c` — si pones `[0.9, 0.1]` el c efectivo cambia a 6
   B) `c=60` es el mismo `k=60` de `1/(k+rank)` en tu `rrf_fusion()`; `weights` solo desempatan docs que aparecen en una sola lista
   C) `EnsembleRetriever` no usa RRF; hace suma ponderada de scores BM25 y coseno
   D) `weights` multiplican directamente los scores BM25 y vectorial antes de sumar

**(c)** Si cambias `bm25.k = 3` pero dejas `vector` con `k=9`, ¿qué efecto tiene en la fusión RRF? ¿Por qué en el lab usamos `k=9` para ambos?

**(d)** Escribe en una línea la correspondencia: `rrf_fusion(bm25_rank, vector_rank, k=60)` → `EnsembleRetriever(...)`.

---

## Ejercicio 20 · LangChain: predice el orden tras el reranker

**Tipo: predice la salida + razonamiento**

Un pipeline LangChain (sin filtro duro) devuelve del `EnsembleRetriever` estos candidatos para la query `"cambios sin cargo adicional"`:

```
Posición tras ensemble (orden RRF):
  1. pol_008  (Top,   "cambios ilimitados sin cargo adicional")
  2. pol_005  (Plus,  "un cambio sin cargo adicional hasta 24h")
  3. pol_002  (Basic, "no se permiten cambios de vuelo")
  4. pol_003  (Basic, reembolsos)
  5. pol_001  (Basic, equipaje)
```

El `CrossEncoderReranker` con `top_n=3` puntúa cada par (query, documento) y reordena. Scores simulados del cross-encoder:

```
pol_008: 0.91   (query pide "sin cargo" → doc Top lo promete explícitamente)
pol_005: 0.78   (similar pero Plus, no ilimitado)
pol_002: 0.35   (doc Basic niega cambios — baja relevancia para esa query)
pol_003: 0.12
pol_001: 0.08
```

**(a)** Predice el top-3 **después** del `CrossEncoderReranker`. ¿Cambia respecto al ensemble?

**(b)** Un pasajero **Basic** pregunta la query. ¿El reranker "arregla" el problema de dominio? ¿Por qué sí o por qué no? Relaciona con §7.

**(c)** Si configuras `CrossEncoderReranker(..., top_n=3)` pero el `ensemble_retriever` solo devuelve `k=3` candidatos, ¿cuántos documentos puede reordenar el reranker como máximo? ¿Qué implicación tiene para el diseño del pipeline?

**(d)** (Opción múltiple) ¿Qué rol cumple `ContextualCompressionRetriever` en este pipeline?

   A) Comprime el texto de cada documento eliminando párrafos irrelevantes con un LLM
   B) Envuelve un `base_compressor` (reranker) sobre un `base_retriever` — reordena y recorta la salida
   C) Fusiona BM25 y vectorial automáticamente
   D) Aplica filtros duros de metadata antes de buscar

---

## Ejercicio 21 · LangChain: encuentra el bug del filtro duro

**Tipo: encuentra el bug + elige la tecnología**

Un alumno implementó el filtro duro así (intenta ahorrar memoria reutilizando el índice BM25 completo):

```python
def crear_retriever_con_filtro_chroma(fare_class: str):
    vector_filtrado = vector_store.as_retriever(
        search_kwargs={"k": 9, "filter": {"fare_class": fare_class}}
    )
    # Reutiliza bm25_retriever del corpus COMPLETO (9 docs)
    ensemble = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_filtrado],
        weights=[0.4, 0.6],
    )
    return ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=ensemble,
    )

docs = crear_retriever_con_filtro_chroma("Basic").invoke(QUERY)
# QUERY = "¿puedo hacer cambios sin pagar cargos adicionales?"
```

El alumno espera solo documentos `fare_class=Basic`, pero el top-3 sigue incluyendo `pol_008` (Top).

**(a)** Explica por qué el filtro falla: ¿qué retriever del ensemble ignora el `filter` de Chroma?

**(b)** (Encuentra el bug) Propón la corrección mínima siguiendo el patrón de `crear_retriever_filtrado()` en `lab/solucion_framework.py`. ¿Cuántos retrievers hay que reconstruir?

**(c)** (Elige la tecnología) Para un sistema de salud con `hardFilters: ["plan"]` en RAGorbit, ¿cuál estrategia es equivalente y correcta en LangChain?

   A) Solo `filter` en Chroma del vector retriever — el BM25 del ensemble puede devolver otros planes
   B) Filtrar la lista de `Document` antes de `BM25Retriever.from_documents()` y de `Chroma.from_documents()`
   C) Añadir al system prompt: "ignora documentos de otros planes"
   D) Post-filtrar la salida del LLM eliminando citas incorrectas

**(d)** Compara en una tabla de 3 filas: tu scratch (`filtrar CORPUS`), estrategia B de LangChain, y estrategia A (solo filter Chroma). Columnas: ¿BM25 filtrado? ¿Vector filtrado? ¿Ruido posible?

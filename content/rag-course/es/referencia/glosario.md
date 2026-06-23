# Glosario — RAG & Agentic AI

> Definiciones didácticas de los términos clave del curso, escritas para alguien que programa en Python pero no conoce RAG ni frameworks de IA. Cada entrada enlaza al módulo donde se profundiza y, cuando aplica, al nodo correspondiente en el catálogo de RAGorbit.

---

## Índice por letra

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [Z](#z)

---

## A

### Agente

Un **agente** es un sistema donde un LLM decide, en tiempo de ejecución, qué pasos dar y qué herramientas invocar para cumplir una tarea. A diferencia de un pipeline RAG fijo (siempre recuperar → siempre generar), el agente puede saltar pasos, encadenar varias tools o pedir más información según lo que vaya descubriendo.

**Para qué sirve:** tareas transaccionales o multi-paso con incertidumbre (cambio de vuelo, devolución de pedido, investigación con varias fuentes).

**Ejemplo:** el usuario dice "quiero cambiar mi vuelo del 15 al 17" → el agente primero consulta la reserva, luego la política de tarifa, luego el inventario, y solo entonces responde.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · nodo [`agent.react`](./catalogo-nodos.md#agentreact) en `catalogo-nodos.md`

---

### Agentic RAG

**Agentic RAG** expone el retriever vectorial como una *tool* que el agente invoca cuando lo necesita, en lugar de ejecutar la recuperación siempre en el mismo punto del pipeline. El agente decide *si*, *cuándo*, *con qué query* y *con qué filtros* buscar en la base de conocimiento.

**Para qué sirve:** consultas donde no siempre hace falta RAG, o donde la query óptima depende de datos obtenidos en pasos anteriores (p. ej. buscar penalidad solo después de conocer la `fare_class`).

**Ejemplo:** `policy_rag(query="penalidad ECONOMY_FLEX internacional")` se llama después de `ReservationService`, no antes.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`tool.retriever`](./catalogo-nodos.md#toolretriever)

---

### Alucinación

Una **alucinación** ocurre cuando el LLM genera información plausible pero incorrecta o inventada: citas inexistentes, cifras erróneas, políticas que no están en los documentos. No es un "bug" del modelo: es consecuencia de que predice texto probable sin verificar hechos.

**Para qué sirve entenderlo:** justifica RAG (anclar respuestas en documentos), citas obligatorias, temperatura baja y evaluación de *faithfulness*.

**Ejemplo:** sin RAG, el modelo puede afirmar "15 días de vacaciones el primer año" aunque la política real diga 12.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### ANN (Approximate Nearest Neighbor)

**ANN** (búsqueda aproximada de vecinos más cercanos) es la familia de algoritmos que encuentran los vectores más similares a una query sin comparar contra todos los del índice. Sacrifica una fracción mínima de precisión a cambio de velocidad en corpora grandes.

**Para qué sirve:** hacer viable la búsqueda vectorial con millones de embeddings; los índices HNSW e IVF son implementaciones ANN.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Answer relevancy (relevancia de la respuesta)

**Answer relevancy** mide si la respuesta final del LLM responde a la pregunta del usuario, independientemente de si está sustentada en los documentos. Una respuesta puede ser *faithful* al contexto pero irrelevante para la pregunta.

**Para qué sirve:** detectar respuestas "correctas según los chunks" pero que no contestan lo que el usuario pidió.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · RAGAS

---

### Aprobación por permisos (MCP)

En el protocolo MCP, la **aprobación por permisos** exige que el usuario (o el sistema) autorice explícitamente acciones sensibles antes de que el cliente MCP las ejecute: leer archivos fuera de *roots*, invocar tools de escritura, usar *sampling* del LLM del host.

**Para qué sirve:** evitar que un agente conectado a varios servidores MCP ejecute operaciones peligrosas sin control humano o sin política de seguridad.

**Ver también:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### AutoGen / AG2

**AutoGen** (ahora evolucionando como **AG2**) es un framework de Microsoft para orquestar conversaciones entre múltiples agentes LLM que se pasan mensajes, delegan subtareas y pueden invocar tools. Destaca en prototipos de investigación y flujos conversacionales entre roles especializados.

**Para qué sirve:** experimentar con patrones multi-agente basados en diálogo sin definir un grafo explícito como en LangGraph.

**Ver también:** `PLAN.md` §6 M7

---

## B

### Bag-of-words

**Bag-of-words** (saco de palabras) representa un texto como un vector de frecuencias de términos, ignorando el orden. Es una técnica léxica clásica de recuperación de información, usada en este curso como embedding de juguete en la capa ② (scratch).

**Para qué sirve:** entender el mecanismo de similitud sin depender de modelos externos; en producción se reemplaza por embeddings semánticos.

**Ejemplo:** `"días de vacaciones"` y `"días de descanso"` comparten la palabra "días" pero no sinónimos → similitud parcial, no total.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### BeeAI

**BeeAI** es un framework de agentes de IBM orientado a composición de workflows agénticos con integración en el ecosistema watsonx. Compite con CrewAI y LangGraph en escenarios enterprise con requisitos de gobernanza.

**Para qué sirve:** construir agentes en entornos IBM/watsonx o comparar enfoques de orquestación frente a LangGraph y CrewAI.

**Ver también:** `PLAN.md` §6 M7

---

### Bi-encoder

Un **bi-encoder** codifica la query y cada documento por separado en embeddings independientes y luego compara similitud (coseno o dot product). Es el enfoque estándar de los modelos de embedding y de la búsqueda densa en vector stores.

**Para qué sirve:** indexar millones de documentos de forma eficiente (el embedding del documento se calcula una sola vez en ingesta).

**Contraste:** el *cross-encoder* evalúa query+documento juntos y es más preciso pero mucho más lento → se usa en reranking, no en indexado masivo.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### BM25

**BM25** (Best Match 25) es el algoritmo de ranking por palabras clave usado en Elasticsearch y en recuperación clásica. Combina frecuencia del término (TF), rareza inversa (IDF) y normalización por longitud del documento.

**Para qué sirve:** recuperar coincidencias exactas de códigos, identificadores técnicos (ATA 32-11-00) o nombres propios que los embeddings densos representan mal.

**Ejemplo:** la query `"ATA 32-11-00"` rankea mejor con BM25 que con vectores semánticos puros.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid)

---

### Búsqueda densa

La **búsqueda densa** convierte query y documentos en vectores de alta dimensión (embeddings) y recupera los más cercanos por similitud coseno o producto punto. Captura significado semántico aunque las palabras difieran.

**Para qué sirve:** preguntas en lenguaje natural donde el usuario no usa el mismo vocabulario que los documentos.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`retrieval.vector`](./catalogo-nodos.md#retrievalvector)

---

### Búsqueda híbrida

La **búsqueda híbrida** combina búsqueda densa (semántica) y BM25 (léxica) para aprovechar lo mejor de ambas. La fusión suele hacerse con RRF o con suma ponderada controlada por el parámetro `alpha`.

**Para qué sirve:** dominios técnicos con jerga exacta *y* preguntas conversacionales (telecom, manufactura, legal).

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid)

---

## C

### Chain-of-Thought (CoT)

**Chain-of-Thought** (cadena de pensamiento) es un patrón de prompting donde pides al LLM que razone paso a paso antes de dar la respuesta final. Mejora tareas que requieren varios pasos lógicos o cálculos.

**Para qué sirve:** elegibilidad, cálculos de penalidades, razonamiento multi-paso auditable.

**Ejemplo:** añadir "Piensa paso a paso antes de responder" al final del prompt (*zero-shot CoT*).

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Checkpoint (LangGraph)

Un **checkpoint** en LangGraph es una instantánea persistida del estado del grafo (mensajes, variables, historial de tools) asociada a un `thread_id`. Permite reanudar conversaciones entre turnos o tras reinicios del servicio.

**Para qué sirve:** memoria conversacional en producción sin gestionar manualmente listas de mensajes.

**Ejemplo:** `MemorySaver` + `thread_id: "demo-001"` restaura el Turno 1 antes de procesar el Turno 2.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Chroma / ChromaDB

**ChromaDB** es una base de datos vectorial embebida en Python: el índice corre en el mismo proceso, persiste en disco y no requiere servidor separado. Ideal para prototipos y demos de bajo volumen.

**Para qué sirve:** indexar rápidamente sin levantar Postgres ni Docker; template 09 (RRHH) lo usa por simplicidad.

**Limitación:** acceso concurrente multi-proceso limitado; en producción multi-instancia suele preferirse pgvector o Qdrant.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.chroma`](./catalogo-nodos.md#storechroma)

---

### Chunking

El **chunking** divide documentos largos en fragmentos (*chunks*) recuperables. Es una de las decisiones más críticas del pipeline RAG: chunks grandes diluyen relevancia; chunks pequeños pierden contexto.

**Estrategias del curso:**
- **Fixed:** bloques de N caracteres con overlap.
- **Recursive:** separadores jerárquicos (`\n\n` → `\n` → `. `).
- **Semantic:** corta donde cae la similitud entre oraciones consecutivas.
- **By-layout:** respeta estructura visual (títulos, tablas) vía Unstructured.
- **By-clause / by-section:** separadores de dominio (cláusulas, artículos, secciones ATA).

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.chunker`](./catalogo-nodos.md#ingestchunker)

---

### Chunks

Los **chunks** son los fragmentos de texto que el retriever devuelve al LLM como contexto. En RAGorbit circulan como tipo `Chunks` entre nodos `retrieval.*` y `logic.*`.

**Para qué sirve:** acotar la ventana de contexto a solo lo relevante en lugar de pasar documentos enteros.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Circuit breaker

Un **circuit breaker** (cortacircuitos) detiene temporalmente las llamadas a un servicio externo cuando la tasa de fallos supera un umbral, devolviendo un fallback en lugar de seguir reintentando. Evita que un servicio degradado bloquee al agente en timeouts encadenados.

**Para qué sirve:** APIs de pago, inventario o terceros con disponibilidad variable.

**Ver también:** `PLAN.md` §6 M9 · [`guardrail.resilience`](./catalogo-nodos.md#guardrailresilience)

---

### Citas

Las **citas** anclan cada afirmación del LLM a un fragmento recuperado con referencia verificable (`source`, `chunk_id`, página). En dominios de alta consecuencia (salud, legal, RRHH) son obligatorias, no opcionales.

**Para qué sirve:** auditoría, confianza del usuario y detección de alucinaciones.

**Ejemplo:** `"Los empleados tienen 15 días [Fuente: política_vacaciones.pdf, §3.2]"`.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### Cliente MCP

Un **cliente MCP** es el programa que se conecta a uno o más servidores MCP, lista sus tools/resources/prompts y los expone a un agente o aplicación. Puede comunicarse por STDIO (proceso hijo) o HTTP (Streamable HTTP).

**Para qué sirve:** que un agente consuma herramientas externas estandarizadas sin integrar cada API a mano.

**Ver también:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Codegen (RAGorbit)

El **codegen** de RAGorbit transforma un `flow.json` (Flow IR) en un proyecto Python ejecutable con `app/`, `mocks/`, `tests/` y el runtime correspondiente al `deploymentTarget`.

**Para qué sirve:** pasar del diseño visual al código desplegable sin reescribir el pipeline a mano.

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md) · `docs/01-concepts.md`

---

### Colección (vector store)

Una **colección** es el contenedor lógico de vectores + metadatos + textos en un vector store (equivalente a una "tabla" o "índice" nombrado). Un mismo servidor puede tener varias colecciones (`policy`, `faq`, `procedures`).

**Para qué sirve:** separar dominios de conocimiento y aplicar configuraciones distintas por colección.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index)

---

### ColBERT

**ColBERT** (Contextualized Late Interaction over BERT) es un modelo de reranking que pre-computa embeddings por token y combina query y documento con interacción tardía. Ofrece balance entre calidad y escala frente al cross-encoder clásico.

**Para qué sirve:** reranking en corpus grandes donde un cross-encoder puro sería demasiado lento.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

### Confirm-gate

El **confirm-gate** pausa la ejecución de una tool sensible y pide confirmación explícita al usuario antes de continuar (p. ej. pagos > umbral, cancelaciones irreversibles). En RAGorbit es el nodo `guardrail.confirm`.

**Para qué sirve:** fricción deliberada en acciones financieras o irreversibles que el LLM no debe ejecutar sin consentimiento.

**Ver también:** `PLAN.md` §6 M9 · [`guardrail.confirm`](./catalogo-nodos.md#guardrailconfirm)

---

### Context precision / Context recall

**Context precision** mide qué proporción de los chunks recuperados son realmente relevantes para la pregunta. **Context recall** mide si los chunks necesarios para responder fueron recuperados. Ambas son métricas RAG de calidad del retriever, no de la generación.

**Para qué sirve:** diagnosticar si el problema está en la recuperación (chunks incorrectos) o en la síntesis (LLM ignora chunks buenos).

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Context stuffing

El **context stuffing** consiste en meter documentos enteros (o casi enteros) en la ventana de contexto del LLM en lugar de recuperar fragmentos. Funciona solo si el corpus cabe en la ventana y no cambia con frecuencia.

**Para qué sirve:** casos simples con pocos documentos estáticos; se vuelve inviable con corpus grandes o con el problema *lost in the middle*.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Contrato (RAGorbit)

En RAGorbit, un **contrato** define qué tipos de datos puede emitir y recibir cada nodo (`Message`, `Chunks`, `Retriever`, `Tool`, `Model`, etc.). Conectar dos nodos con tipos incompatibles es un error de diseño que el validador detecta antes del codegen.

**Para qué sirve:** garantizar que el grafo es ejecutable y que cada pieza recibe exactamente lo que necesita.

**Ejemplo:** `store.chroma` produce `Retriever`; `retrieval.vector` lo consume y produce `Chunks`.

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md) · `docs/01-concepts.md`

---

### CrewAI

**CrewAI** es un framework de multi-agente donde defines *agents* (roles), *tasks* (tareas) y *crews* (equipos) que colaboran secuencial o paralelamente con tools asignadas. Curva de aprendizaje más baja que LangGraph para equipos de agentes con roles fijos.

**Para qué sirve:** flujos de negocio con roles claros (investigador, redactor, revisor) sin modelar un grafo de estado explícito.

**Ver también:** `PLAN.md` §6 M7

---

### Cross-encoder

Un **cross-encoder** recibe query y documento juntos en una sola pasada del modelo y devuelve un score de relevancia. Es más preciso que el bi-encoder pero no escala para indexar millones de docs → se usa en **reranking** sobre un top-K pre-filtrado.

**Para qué sirve:** reordenar los 10–20 candidatos del retriever vectorial y quedarse con los 3 más relevantes.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

## D

### DeepEval

**DeepEval** es un framework de evaluación de LLM con métricas predefinidas (faithfulness, relevancy, hallucination) y soporte para tests automatizados en CI. Compite con RAGAS y TruLens.

**Para qué sirve:** integrar evaluación de RAG en pipelines de testing como harías con tests unitarios.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Deployment target

El **deployment target** es el perfil de despliegue que RAGorbit infiere del nodo de entrada (`io.*`): `chat-service` (FastAPI + SSE/WebSocket), `event-worker` (Kafka), `batch` (procesamiento en lote) o `temporal` (workflows durables con Temporal).

**Para qué sirve:** que el codegen genere el esqueleto correcto (API conversacional vs worker de eventos vs job batch).

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md) · [`io.input`](./catalogo-nodos.md#ioinput) y [`io.event-source`](./catalogo-nodos.md#ioevent-source)

---

### Dimensionalidad

La **dimensionalidad** es la longitud del vector de embedding (p. ej. 768, 1024, 1536, 3072). Más dimensiones no garantizan mejor calidad: importa el modelo, el dominio y la métrica de similitud usada en el índice.

**Para qué sirve:** elegir store, índice y estimar costo de almacenamiento (más dims = más RAM/disco por vector).

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`model.embedding`](./catalogo-nodos.md#modelembedding)

---

### Distancia L2

La **distancia L2** (euclidiana) mide la distancia geométrica directa entre dos vectores: `√Σ(Aᵢ - Bᵢ)²`. Con vectores normalizados, el ranking por L2 equivale al ranking por similitud coseno.

**Para qué sirve:** métrica alternativa en índices FAISS/Qdrant cuando los embeddings no están normalizados.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Dot product (producto punto)

El **dot product** (producto punto o inner product) suma los productos elemento a elemento de dos vectores: `Σ AᵢBᵢ`. Con vectores **normalizados**, equivale a la similitud coseno y es la operación más rápida en hardware (SIMD/GPU).

**Para qué sirve:** búsqueda vectorial de máximo rendimiento cuando el modelo de embedding entrega vectores unitarios.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## E

### Embedding

Un **embedding** es un vector de números reales de longitud fija que representa el significado de un texto (o imagen, audio) en un espacio geométrico. Textos semánticamente similares quedan próximos; textos distintos, lejos.

**Para qué sirve:** habilitar búsqueda por significado en vector stores; debe usarse el **mismo modelo** en ingesta y en consulta.

**Ejemplo:** "días de vacaciones" y "permiso remunerado anual" tienen embeddings cercanos aunque no compartan palabras.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`model.embedding`](./catalogo-nodos.md#modelembedding)

---

### Embeddings multimodales

Los **embeddings multimodales** representan en el mismo espacio vectorial (o espacios alineados) texto, imágenes y audio, permitiendo búsqueda cross-modal: "encontrar imágenes similares a esta descripción" o "buscar documentos relacionados con esta foto".

**Para qué sirve:** RAG sobre manuales con diagramas, catálogos visuales o bases de conocimiento mixtas texto+imagen.

**Ver también:** `PLAN.md` §6 M10 · [`loader.multimodal`](./catalogo-nodos.md#loadermultimodal)

---

## F

### Faithfulness

La **faithfulness** (fidelidad) mide si cada afirmación de la respuesta del LLM está sustentada por los chunks recuperados, sin inventar datos. Es la métrica central para detectar alucinaciones en RAG.

**Para qué sirve:** evaluar y monitorear en producción; combinada con citas obligatorias forma la última línea de defensa.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.citations`](./catalogo-nodos.md#logiccitations)

---

### FAISS

**FAISS** (Facebook AI Similarity Search) es una librería de Meta para búsqueda de similitud vectorial a escala, con índices flat, IVF y HNSW. Corre en memoria o disco, sin servidor — ideal para prototipos de alto rendimiento y experimentación.

**Para qué sirve:** benchmarks de índices, comparar HNSW vs flat, prototipos sin infraestructura de BD.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Fan-out (multi-agente)

El patrón **fan-out** despacha N sub-agentes *stateless* en paralelo, uno por ítem de un lote o evento, con concurrencia controlada. Cada sub-agente es independiente; el estado persiste en BD o event log, no en memoria compartida.

**Para qué sirve:** rebooking masivo de envíos, procesamiento batch de solicitudes, alertas de fraude a escala.

**Ver también:** `PLAN.md` §6 M7 · [`agent.fanout`](./catalogo-nodos.md#agentfanout)

---

### Few-shot / Zero-shot / One-shot

- **Zero-shot:** el LLM ejecuta la tarea sin ejemplos en el prompt.
- **One-shot:** un solo ejemplo input→output.
- **Few-shot:** varios ejemplos (típicamente 2–5) que demuestran el patrón deseado.

Son variantes de **in-context learning**: el modelo imita el patrón visto en el prompt sin reentrenamiento.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Filtro blando vs filtro duro

Un **filtro blando** es una instrucción en el prompt ("usa solo documentos del plan PPO-Gold") que el LLM puede ignorar. Un **filtro duro** es una restricción en el retriever (`hardFilters`, cláusula WHERE en el store) aplicada **antes** del cálculo de similitud — el LLM nunca ve chunks fuera del filtro.

**Para qué sirve:** los filtros duros son guardrails de negocio; los blandos son sugerencias de relevancia insuficientes para compliance.

**Ejemplo:** `hardFilters: [{fare_class: "BUSINESS"}]` garantiza que chunks de tarifa economy no contaminen la respuesta.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.vector`](./catalogo-nodos.md#retrievalvector)

---

### Fine-tuning

El **fine-tuning** adapta los pesos del modelo entrenándolo con ejemplos específicos de tu dominio o tarea. A diferencia de RAG (que inyecta conocimiento en el prompt), modifica el comportamiento interno del modelo.

**Para qué sirve:** estilo de respuesta consistente, tareas muy repetitivas con formato fijo, dominios donde RAG no alcanza y tienes datos de entrenamiento abundantes.

**Cuándo NO:** conocimiento que cambia frecuentemente (usa RAG); presupuesto/tiempo limitado (usa prompting + RAG).

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Flat (índice)

Un índice **flat** compara la query contra **todos** los vectores del corpus (búsqueda exacta/brute force). Precisión máxima, velocidad lineal con el tamaño del corpus.

**Para qué sirve:** corpora pequeños (< 100K vectores), benchmarks de referencia, validar que un índice ANN no pierde recall.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Flow IR

El **Flow IR** (Intermediate Representation) es el JSON (`flow.json`) que describe el grafo de nodos, conexiones y configuración en RAGorbit. Es la fuente de verdad del diseño antes del codegen.

**Para qué sirve:** versionar arquitecturas, compartir templates de industria y validar contratos entre nodos.

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md) · `examples/*/flow.json`

---

## G

### GraphRAG

**GraphRAG** combina un grafo de conocimiento (entidades y relaciones) con búsqueda vectorial: recupera nodos relevantes por similitud y expande el contexto navegando relaciones (1–2 hops). Microsoft GraphRAG y Neo4j son implementaciones conocidas.

**Para qué sirve:** preguntas donde las relaciones importan tanto como el texto ("¿qué contratos están vinculados a esta empresa y sus subsidiarias?").

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j) · [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph)

---

### Groundedness

La **groundedness** (anclaje) indica si la respuesta del LLM está fundamentada en evidencia externa proporcionada (chunks, tools), no solo en conocimiento paramétrico del modelo. En la práctica se evalúa junto con *faithfulness* y citas.

**Para qué sirve:** métrica de confianza en sistemas regulados; respuestas sin anclaje son inaceptables en salud, legal o banca.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Gradio

**Gradio** es una librería Python para crear interfaces web de demostración (chat, subida de archivos, audio) con pocas líneas. Ideal para prototipar bots RAG y agentes sin construir un frontend.

**Para qué sirve:** UIs rápidas de prueba en M9 y labs del curso IBM.

**Ver también:** `PLAN.md` §6 M9

---

### Guardrail

Un **guardrail** es una barrera de seguridad o resiliencia alrededor de tools o del LLM: validación pre-ejecución, confirmación del usuario, idempotencia, circuit breaker. En RAGorbit son nodos de la categoría `guardrail.*` que envuelven `Tool`.

**Para qué sirve:** que restricciones críticas sean **deterministas**, no instrucciones en el prompt que el LLM puede ignorar.

**Ver también:** `PLAN.md` §6 M9 · sección guardrail en [`catalogo-nodos.md`](./catalogo-nodos.md#11-guardrail--seguridad-y-resiliencia)

---

### Guardrails AI

**Guardrails AI** es un framework open-source para validar entradas y salidas de LLM con validadores programáticos (PII, toxicidad, formato JSON, temas prohibidos). Compite con NeMo Guardrails y guardrails propios.

**Para qué sirve:** capa de validación declarativa sin reimplementar cada chequeo a mano.

**Ver también:** `PLAN.md` §6 M9

---

## H

### HITL (Human-in-the-Loop)

**HITL** (humano en el bucle) pausa el flujo del agente y escala el caso a un revisor humano cuando se cumple una condición **determinista** (no decidida por el LLM). El flujo se reanuda tras aprobación, modificación o rechazo.

**Para qué sirve:** diagnósticos ambiguos, procedimientos con WARNING, casos de alta severidad donde el error del agente es inaceptable.

**Ver también:** `PLAN.md` §6 M9 · [`hitl.escalate`](./catalogo-nodos.md#hitlescalar)

---

### HNSW

**HNSW** (Hierarchical Navigable Small World) es un índice ANN basado en grafos de vecinos que ofrece excelente balance velocidad/recall para búsqueda vectorial. Es el default en muchos stores (Qdrant, pgvector con índice HNSW, FAISS).

**Para qué sirve:** producción con millones de vectores donde flat sería demasiado lento.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Hugging Face

**Hugging Face** (HF) es el hub y ecosistema open-source de modelos, datasets y librerías (`transformers`, `sentence-transformers`). Permite descargar y ejecutar localmente LLMs y embeddings (Llama, BGE, E5, Whisper).

**Para qué sirve:** modelos open-weights sin API de pago; integración con Ollama y sentence-transformers en la capa ③.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · `PLAN.md` §6 M10

---

### HyDE

**HyDE** (Hypothetical Document Embeddings) genera con un LLM un documento hipotético que respondería la query y usa *su* embedding como query de búsqueda. Mejora recall cuando la pregunta del usuario es muy corta o distante del vocabulario del corpus.

**Para qué sirve:** alternativa avanzada a query rewriting en dominios con gap léxico.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`query.rewrite`](./catalogo-nodos.md#queryrewrite)

---

## I

### Idempotencia

La **idempotencia** garantiza que ejecutar la misma operación varias veces produce el mismo resultado sin efectos secundarios duplicados. En pagos, el segundo llamado con la misma clave devuelve el resultado cacheado en lugar de cobrar dos veces.

**Para qué sirve:** canales con streaming/reconexiones, reintentos de red, exactly-once lógico en operaciones transaccionales.

**Ejemplo:** primer cobro `captured`, segundo con misma `idempotencyKey` → `deduplicated`.

**Ver también:** `PLAN.md` §6 M9 · [`guardrail.idempotency`](./catalogo-nodos.md#guardrailidempotency)

---

### In-context learning

El **in-context learning** es la capacidad del LLM de aprender un patrón o tarea viendo ejemplos en el prompt, sin actualizar sus pesos. Few-shot prompting es la forma más común de explotarlo.

**Para qué sirve:** clasificación, extracción con formato específico, tareas donde fine-tuning sería excesivo.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Intent detection (detección de intención)

La **detección de intención** clasifica el mensaje del usuario en etiquetas accionables (`consulta_politica`, `saludo`, `silencio`) para decidir si disparar el pipeline RAG, enrutar a otro agente o descartar ruido (p. ej. fragmentos de audio en call center).

**Para qué sirve:** reducir costo y latencia evitando RAG en mensajes no accionables; routing multi-índice.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`model.intent`](./catalogo-nodos.md#modelintent) · [`query.intent`](./catalogo-nodos.md#queryintent)

---

### Inyección de prompts

La **inyección de prompts** es un ataque donde el usuario (o un documento malicioso indexado) inserta instrucciones que intentan anular el system prompt: "ignora tus instrucciones anteriores y…". Es distinta de un jailbreak genérico pero con el mismo objetivo: tomar control del comportamiento del modelo.

**Para qué sirve entenderla:** diseñar guardrails de entrada, separar instrucciones de datos del usuario y testear con casos adversarios.

**Ver también:** `PLAN.md` §6 M9

---

### instructor

**instructor** es una librería Python que envuelve APIs de LLM para obtener salida validada contra modelos Pydantic, reintentando automáticamente si la validación falla.

**Para qué sirve:** structured output robusto sin depender exclusivamente de tool-calling nativo del proveedor.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.structured`](./catalogo-nodos.md#logicstructured)

---

### Índice vectorial

Un **índice vectorial** es la estructura de datos (flat, IVF, HNSW…) que permite encontrar eficientemente los K vectores más similares a una query. Sin índice, cada búsqueda requeriría comparar contra todos los vectores del corpus.

**Para qué sirve:** escalabilidad del retrieval; la elección del índice afecta latencia, recall y RAM.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### IVF (Inverted File Index)

**IVF** agrupa vectores en *clusters* y en consulta solo busca en los clusters más cercanos al query. Reduce latencia en corpus muy grandes a costa de configurar el número de clusters y un paso de entrenamiento del índice.

**Para qué sirve:** escala entre flat (exacto, lento) y HNSW (rápido, sin entrenamiento de clusters explícito).

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## J

### Jailbreak

Un **jailbreak** es un intento de eludir las restricciones de seguridad del modelo para obtener respuestas prohibidas (código malicioso, PII, instrucciones dañinas). Los guardrails y tests de inyección buscan bloquear estos patrones antes de llegar al LLM o en la salida.

**Para qué sirve entenderlo:** diseñar defensa en profundidad (entrada, prompt, salida, permisos de tools).

**Ver también:** `PLAN.md` §6 M9

---

## K

### Knowledge cutoff

El **knowledge cutoff** es la fecha límite de los datos con los que se entrenó el LLM. El modelo no "sabe" eventos, leyes ni precios posteriores a esa fecha — solo puede inferir o alucinar.

**Para qué sirve:** justificar RAG para datos frescos y privados que el modelo nunca vio en entrenamiento.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Knowledge graph (grafo de conocimiento)

Un **knowledge graph** modela entidades (nodos) y relaciones tipadas (aristas): `Empresa → firmó → Contrato → contiene → Cláusula`. Permite recuperación por vecindario además de similitud vectorial.

**Para qué sirve:** GraphRAG, preguntas multi-hop, dominios con relaciones explícitas (legal, salud, supply chain).

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j)

---

## L

### LangChain

**LangChain** es el framework Python más extendido para construir aplicaciones con LLMs: cadenas, retrievers, tools, integraciones con proveedores y abstracciones de mensajes. RAGorbit usa LangChain/LangGraph en el codegen de producción.

**Para qué sirve:** capa ③ del curso — implementar RAG y agentes con componentes probados en lugar de reinventar cada pieza.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Langfuse

**Langfuse** es una plataforma open-source de observabilidad para LLM: trazas, costos, latencia, feedback humano y datasets. Alternativa open-source a LangSmith.

**Para qué sirve:** auditoría y debugging de pipelines RAG/agentes en producción sin vendor lock-in.

**Ver también:** `PLAN.md` §6 M9 · [`observability.audit`](./catalogo-nodos.md#observabilityaudit)

---

### LangGraph

**LangGraph** extiende LangChain con grafos de estado (`StateGraph`): nodos, aristas condicionales, checkpoints y multi-agente. Es el framework que RAGorbit usa para generar agentes ReAct y flujos con bifurcaciones.

**Para qué sirve:** agentes con memoria, loops ReAct, orquestación multi-agente con control explícito del flujo.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`agent.react`](./catalogo-nodos.md#agentreact)

---

### LangSmith

**LangSmith** es la plataforma de observabilidad y evaluación de LangChain (trazas, datasets, comparación de prompts, feedback). Integración nativa con cadenas LCEL y LangGraph.

**Para qué sirve:** debugging de agentes en desarrollo y evaluación continua en equipos que ya usan LangChain.

**Ver también:** `PLAN.md` §6 M9

---

### LlamaIndex

**LlamaIndex** es un framework especializado en RAG: readers, índices, query engines, retrievers avanzados y GraphRAG. Compite con LangChain en ingesta (M2) y retrieval (M4); destaca en documentos complejos.

**Para qué sirve:** capa ③ cuando necesitas `VectorStoreIndex`, `ParentDocumentRetriever` o `RouterQueryEngine`.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### LCEL (LangChain Expression Language)

**LCEL** es la sintaxis declarativa de LangChain para componer pipelines con el operador `|` (pipe): `retriever | prompt | llm | parser`. Soporta streaming, batch y paralelismo de forma uniforme.

**Para qué sirve:** construir cadenas RAG legibles y componibles sin bucles imperativos.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### LLM (Large Language Model)

Un **LLM** es una red neuronal entrenada para predecir el siguiente token dado un prefijo. En inferencia genera texto token a token usando probabilidades aprendidas; **no consulta bases de datos** ni recuerda llamadas anteriores salvo que tú le pases el historial en el prompt.

**Para qué sirve:** síntesis, razonamiento en lenguaje natural, tool calling y generación — el motor central de RAG y agentes.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`model.llm`](./catalogo-nodos.md#modelllm)

---

### Loader

Un **loader** carga datos crudos de una fuente (PDF, CSV, web, S3, SQL) y los convierte en objetos `Document` con texto y metadata básica. Es el primer paso del pipeline de ingesta.

**Para qué sirve:** abstraer formatos de entrada; en RAGorbit cada fuente tiene su nodo `loader.*` con mocks para desarrollo sin red.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · sección loader en [`catalogo-nodos.md`](./catalogo-nodos.md#2-loader--fuentes-de-datos)

---

## M

### MCP (Model Context Protocol)

**MCP** es un protocolo abierto (iniciado por Anthropic) para que aplicaciones LLM se conecten a herramientas, recursos y prompts externos de forma estandarizada, con modelo de seguridad (permisos, roots, sampling). Sustituye integraciones ad-hoc y plugins propietarios.

**Para qué sirve:** exponer PolicyRAG, APIs internas o datos locales como servidores reutilizables por cualquier cliente MCP.

**Ver también:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Memoria (agente)

La **memoria** de un agente almacena contexto entre pasos y entre turnos conversacionales:
- **Corto plazo / conversacional:** historial de mensajes de la sesión.
- **Working memory:** estado estructurado (PNR, monto pendiente, vuelo elegido).
- **Largo plazo:** preferencias o hechos persistentes entre sesiones (vector store, BD).

**Para qué sirve:** que el agente recuerde "¿confirmas el cambio?" del turno anterior cuando el usuario responde "sí".

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Metadata

La **metadata** es un diccionario de campos asociado a cada chunk (`fare_class`, `clausula_id`, `effective_date`, `source`) que el retriever usa como **filtros duros** o para citas y auditoría.

**Para qué sirve:** convertir búsqueda vectorial genérica en búsqueda restringida por reglas de negocio.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.metadata`](./catalogo-nodos.md#ingestmetadata)

---

### Multi-agente

Un sistema **multi-agente** coordina varios agentes especializados. Patrones del curso:
- **Supervisor:** un agente orquesta y delega a sub-agentes.
- **Jerárquico:** capas de managers y workers.
- **Colaborativo:** agentes con roles fijos que se pasan resultados (CrewAI).
- **Fan-out:** N agentes stateless en paralelo por ítem.

**Para qué sirve:** tareas complejas que un solo agente "se pierde" o donde la separación de roles mejora calidad y auditoría.

**Ver también:** `PLAN.md` §6 M7 · [`agent.fanout`](./catalogo-nodos.md#agentfanout)

---

### Multi-index routing

El **multi-index routing** dirige cada query al índice vectorial correcto (`policy`, `faq`, `procedures`) en lugar de buscar en todo el corpus. Reduce ruido cross-dominio y latencia.

**Para qué sirve:** telecom con tres bases de conocimiento, legal con playbook + normativa + precedentes.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index) · [`retrieval.router`](./catalogo-nodos.md#retrievalrouter)

---

## N

### NeMo Guardrails

**NeMo Guardrails** (NVIDIA) es un framework para definir rails de conversación con Colang: flujos permitidos, temas bloqueados, verificación de hechos y diálogo controlado. Compite con Guardrails AI.

**Para qué sirve:** copilots con políticas de conversación estrictas en entornos enterprise NVIDIA.

**Ver también:** `PLAN.md` §6 M9

---

### Nodo (RAGorbit)

Un **nodo** es la unidad de procesamiento en el grafo RAGorbit: tiene un `type` (p. ej. `retrieval.vector`), `config` y puertos tipados de entrada/salida. Los 53 tipos se agrupan en 13 categorías.

**Para qué sirve:** diseñar pipelines composables con contratos verificables antes de escribir código.

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md) · [`catalogo-nodos.md`](./catalogo-nodos.md)

---

### Normalización (vectores)

La **normalización** divide un vector por su norma L2 para que su longitud sea 1. Con vectores normalizados, similitud coseno = producto punto, simplificando y acelerando la búsqueda.

**Para qué sirve:** consistencia en métricas del índice; evitar sesgo hacia textos largos en dot product sin normalizar.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

## O

### OCR

**OCR** (Optical Character Recognition) extrae texto de imágenes o PDFs escaneados. Es más lento y propenso a errores que la extracción de PDFs con texto seleccionable.

**Para qué sirve:** `loader.pdf` con `ocr: true` solo cuando el documento es imagen, no texto embebido.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`loader.pdf`](./catalogo-nodos.md#loaderpdf)

---

### Ollama

**Ollama** ejecuta LLMs y modelos de embedding open-weights localmente con una API compatible. Permite desarrollo sin API keys ni costo por token.

**Para qué sirve:** modo real local con Llama, Mistral, nomic-embed, etc., cuando tienes red y hardware suficiente.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### OpenTelemetry

**OpenTelemetry** (OTEL) es el estándar abierto de trazas, métricas y logs. En este curso exporta throughput, latencia por prioridad y errores del pipeline vía OTLP a Prometheus/Grafana.

**Para qué sirve:** observabilidad de infraestructura complementaria a LangSmith/Langfuse (que miden tokens y costo LLM).

**Ver también:** `PLAN.md` §6 M9 · [`observability.metrics`](./catalogo-nodos.md#observabilitymetrics)

---

### Overlap (chunking)

El **overlap** es el solapamiento de caracteres o tokens entre chunks consecutivos para no cortar oraciones o contexto en la frontera. Típico: 10–15% del `chunkSize` en texto narrativo; bajo o cero en by-clause/by-section.

**Para qué sirve:** que el retriever devuelva contexto completo aunque la frase relevante cruce el límite entre dos chunks.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`ingest.chunker`](./catalogo-nodos.md#ingestchunker)

---

## P

### Parent-child retrieval

El patrón **parent-child** indexa chunks **hijos** pequeños (alta precisión en búsqueda) pero devuelve al LLM el chunk **padre** más grande (más contexto). La metadata `parent_id` liga hijo con padre.

**Para qué sirve:** documentos con secciones largas donde chunks pequeños mejoran el ranking pero el LLM necesita párrafos completos.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.parent-child`](./catalogo-nodos.md#retrievalparent-child)

---

### Parsing

El **parsing** convierte el formato bruto (PDF binario, HTML, XLSX) en texto limpio y estructurado. Errores de parsing (columnas entrelazadas, encabezados mezclados) contaminan todo el índice aguas abajo.

**Para qué sirve:** paso silencioso pero crítico entre loader y chunker; Unstructured mejora PDFs complejos.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md)

---

### pgvector

**pgvector** es la extensión de PostgreSQL para almacenar y buscar vectores con SQL. Combina búsqueda vectorial con filtros, joins y transacciones ACID del ecosistema Postgres.

**Para qué sirve:** producción corporate cuando ya tienes Postgres; template 02 (Banca) lo usa.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.pgvector`](./catalogo-nodos.md#storepgvector)

---

### Plan-and-Execute

**Plan-and-Execute** separa la planificación (el LLM diseña un plan de pasos) de la ejecución (un ejecutor sigue el plan). Contrasta con ReAct, donde plan y acción se intercalan paso a paso.

**Para qué sirve:** tareas muy largas (15–20 búsquedas) en batch donde la latencia no importa y un plan explícito evita que el agente se pierda.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Prompt

Un **prompt** es el texto (o secuencia de mensajes) que envías al LLM. En chat APIs tiene roles:
- **System:** instrucciones persistentes de comportamiento.
- **User:** pregunta o contexto dinámico del humano.
- **Assistant:** respuestas previas del modelo en conversaciones multi-turno.

**Para qué sirve:** definir tono, restricciones, formato y datos de contexto (chunks) que el modelo debe usar.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`logic.prompt`](./catalogo-nodos.md#logicprompt)

---

### Prompt template

Un **prompt template** es una plantilla con variables (`{message}`, `{chunks}`) que el sistema sustituye en cada llamada. Evita concatenar strings a mano y centraliza el formato del prompt.

**Para qué sirve:** producción mantenible; el nodo `logic.prompt` de RAGorbit usa `template` + `system`.

**Ejemplo:** `"Pregunta: {message}\n\nContexto:\n{chunks}"`

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### promptfoo

**promptfoo** es una herramienta CLI para evaluar y comparar prompts/modelos con casos de test declarativos (YAML), útil en CI para regresiones de calidad.

**Para qué sirve:** A/B testing de prompts y detección de regresiones al cambiar de modelo.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Pydantic

**Pydantic** es la librería Python de validación de datos con modelos tipados (`BaseModel`, `Field`). En RAG define el contrato de structured output y valida la respuesta del LLM antes de propagarla.

**Para qué sirve:** alternativa declarativa a JSON Schema manual; base de `instructor` y `with_structured_output`.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

## Q

### Qdrant

**Qdrant** es una base de datos vectorial dedicada (Rust) con filtros ricos en payload, múltiples métricas de distancia y buena escala. Disponible self-hosted o como Qdrant Cloud.

**Para qué sirve:** cuando necesitas un vector DB especializado sin añadir Postgres; decenas de millones de vectores.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [`store.qdrant`](./catalogo-nodos.md#storeqdrant)

---

### Query rewriting

El **query rewriting** normaliza o expande la pregunta del usuario antes del retriever: mapea jerga interna a términos canónicos, añade sinónimos o reformulaciones para mejorar recall.

**Para qué sirve:** "baja de plan" → "cancelación de servicio" en telecom; gap entre vocabulario del usuario y el del índice.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`query.rewrite`](./catalogo-nodos.md#queryrewrite)

---

## R

### RAG (Retrieval-Augmented Generation)

**RAG** recupera fragmentos relevantes de una base de conocimiento y los inyecta en el prompt del LLM para que genere una respuesta anclada en documentos reales. Resuelve alucinaciones, knowledge cutoff y datos privados sin reentrenar el modelo.

**Para qué sirve:** asistentes sobre políticas internas, manuales, contratos — cualquier conocimiento que el LLM no tiene o que cambia con frecuencia.

**Flujo mínimo:** embed query → buscar top-K chunks → prompt con chunks → generar respuesta.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### RAGAS

**RAGAS** es un framework de métricas para evaluar pipelines RAG: faithfulness, answer relevancy, context precision/recall. Genera scores automáticos usando LLM como juez.

**Para qué sirve:** evaluación reproducible en desarrollo y como "tests de calidad" antes de desplegar.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Reader (LlamaIndex)

Un **reader** en LlamaIndex es el equivalente al loader de LangChain: carga archivos o fuentes y devuelve objetos `Document`. LlamaIndex destaca en readers especializados y en integración con query engines.

**Para qué sirve:** capa ③ de ingesta; comparar `SimpleDirectoryReader` vs `PyPDFLoader` de LangChain.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md)

---

### ReAct

**ReAct** (Reasoning + Acting) alterna razonamiento del LLM, llamadas a tools y observación de resultados en un bucle hasta completar la tarea. Es el patrón estándar de agentes modernos.

**Para qué sirve:** tareas multi-paso donde el orden de tools no se conoce de antemano (cambio de vuelo, soporte transaccional).

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · [`agent.react`](./catalogo-nodos.md#agentreact)

---

### Reflection

**Reflection** (una L) es cuando el agente evalúa su propia respuesta antes de entregarla ("¿respondí la pregunta? ¿falta el desglose?") y la mejora si detecta problemas. Puede ser el mismo LLM en un segundo paso.

**Para qué sirve:** mejorar calidad sin reentrenar; añade latencia — no ideal en tiempo real estricto.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Reflexion

**Reflexion** (paper Shinn et al., 2023) formaliza la auto-mejora con tres roles: **Actor** (genera intentos), **Evaluador** (puntúa si logró la tarea) y **Reflexión verbal** (resume el error en memoria para el siguiente intento). No modifica pesos del modelo — es aprendizaje en contexto iterativo.

**Para qué sirve:** código con tests, tareas verificables con varios intentos en batch.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Reranking

El **reranking** reordena los candidatos del retriever vectorial con un modelo más preciso (cross-encoder) y se queda con los top-N finales. Añade latencia (~50–150 ms) pero reduce ruido semántico.

**Para qué sirve:** flujos de alta precisión (legal, médico, telecom con feedback).

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md) · [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker)

---

### Retriever

Un **retriever** es el componente que, dada una query, devuelve los chunks más relevantes desde un vector store (o índice BM25). En RAGorbit es el tipo `Retriever` que conecta `store.*` con `retrieval.*`.

**Para qué sirve:** abstraer la búsqueda detrás de una interfaz uniforme para pipelines y para `tool.retriever`.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### Reglas deterministas

Las **reglas deterministas** evalúan condiciones `when → then` en código puro, sin LLM: umbrales numéricos, elegibilidad, clasificación de prioridad. Producción `Decision` reproducible al 100%.

**Para qué sirve:** decisiones con consecuencias legales o financieras que **nunca** deben delegarse al LLM.

**Regla de oro del curso:** el LLM sugiere; las reglas deciden umbrales críticos.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.rules`](./catalogo-nodos.md#logicrules)

---

### Router (logic / retrieval)

Un **router** bifurca el flujo según una condición o decisión. `logic.router` redirige el grafo por ramas nombradas; `retrieval.router` selecciona el índice vectorial correcto en multi-index.

**Para qué sirve:** caminos distintos según tipo de envío, intención o categoría de documento.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.router`](./catalogo-nodos.md#logicrouter) · [`retrieval.router`](./catalogo-nodos.md#retrievalrouter)

---

### Roots (MCP)

Los **roots** en MCP definen los directorios o URIs que un servidor puede exponer al cliente. El cliente no accede a archivos fuera de los roots declarados — límite de superficie de ataque.

**Para qué sirve:** sandbox de recursos locales en servidores MCP (leer solo `/data/policies`, no todo el disco).

**Ver también:** `PLAN.md` §6 M8

---

### RRF (Reciprocal Rank Fusion)

**RRF** fusiona listas de resultados de varios retrievers usando el **rango** de cada documento, no scores directos (que tienen escalas distintas). Fórmula: `RRF(d) = Σ 1/(k + rank(d))` con `k` típico ≈ 60.

**Para qué sirve:** combinar BM25 + vectorial sin normalizar scores manualmente.

**Ver también:** [../04-retrieval-y-query/guia.md](../04-retrieval-y-query/guia.md)

---

### Runtime mock (RAGorbit)

El **runtime mock** de RAGorbit ejecuta flujos sin red ni API keys: LLM determinista por plantillas, embeddings de juguete, stores en memoria y tools con fixtures. Permite "Probar con mocks" en la webapp y correr talleres scratch.

**Para qué sirve:** aprendizaje con costo cero y tests reproducibles — mismo input, mismo output.

**Ver también:** [../00-setup/guia.md](../00-setup/guia.md)

---

## S

### Sampling (MCP)

En MCP, **sampling** permite que un servidor MCP solicite al **host** (la aplicación cliente) que invoque su LLM para completar texto. El usuario debe aprobar cada solicitud de sampling — el servidor no llama al LLM directamente.

**Para qué sirve:** servidores que necesitan razonamiento del modelo del host sin poseer API keys propias.

**Ver también:** `PLAN.md` §6 M8

---

### sentence-transformers

**sentence-transformers** es la librería Python estándar para ejecutar modelos de embedding locales (BGE, E5, nomic) con `encode()`. Elimina llamadas de red y reduce latencia en ~100–150 ms por query.

**Para qué sirve:** capa ③ de M3; `model.embedding` con `local: true` en RAGorbit.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### Servidor MCP

Un **servidor MCP** expone tools, resources y prompts a clientes MCP vía STDIO o HTTP. Se construye con **FastMCP** en Python declarando operaciones y permisos.

**Para qué sirve:** exponer PolicyRAG o APIs internas como servicio estándar consumible por Cursor, Claude Desktop o tu agente.

**Ver también:** `PLAN.md` §6 M8 · [`tool.mcp`](./catalogo-nodos.md#toolmcp)

---

### Similitud coseno

La **similitud coseno** mide el ángulo entre dos vectores (rango [-1, 1]), ignorando magnitud. Valor 1 = misma dirección semántica; 0 = sin relación. Es la métrica por defecto en retrieval de texto.

**Para qué sirve:** ranking de chunks por relevancia semántica en `retrieval.vector`.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### State graph (StateGraph)

Un **state graph** (grafo de estado) modela el agente como nodos que transforman un estado compartido y aristas que deciden el siguiente nodo. LangGraph `StateGraph` implementa ReAct, memoria y bifurcaciones condicionales.

**Para qué sirve:** control explícito del flujo frente a bucles `while` ad-hoc; base del codegen multi-agente de RAGorbit.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### STT (Speech-to-Text)

**STT** convierte audio en texto. En streaming alimenta copilots de voz en tiempo real; en batch transcribe grabaciones completas. **Whisper** (OpenAI, open-weights) es el modelo de referencia para transcripción offline/multilingüe.

**Para qué sirve:** canal de voz en call center (`io.stt`); entrada multimodal en M10.

**Ver también:** `PLAN.md` §6 M10 · [`io.stt`](./catalogo-nodos.md#iostt)

---

### Streamlit

**Streamlit** es un framework Python para dashboards y chats web con mínimo código. Alternativa a Gradio para UIs internas de RAG.

**Para qué sirve:** prototipos de interfaz en M9 sin FastAPI custom.

**Ver también:** `PLAN.md` §6 M9

---

### Structured output (salida estructurada)

La **salida estructurada** fuerza al LLM a emitir JSON (u objeto tipado) validado contra un **JSON Schema** o modelo Pydantic antes de continuar el pipeline. Mecanismos: tool-calling, JSON-mode, instructor, outlines.

**Para qué sirve:** decisiones que alimentan sistemas aguas abajo (score de crédito, adjudicación de siniestro) — el texto libre no es parseable de forma fiable.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md) · [`logic.structured`](./catalogo-nodos.md#logicstructured)

---

## T

### Temperatura

La **temperatura** controla la aleatoriedad de la generación: 0.0 ≈ determinista; valores altos = más variación/creatividad. Para RAG factual usa 0.0–0.2.

**Para qué sirve:** balance entre consistencia (compliance, citas) y variedad (redacción creativa).

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md) · [`model.llm`](./catalogo-nodos.md#modelllm)

---

### Temporal

**Temporal** es un motor de workflows durables: ejecuta procesos de larga duración con reintentos, timers y supervivencia a reinicios. RAGorbit usa `io.trigger` → `deploymentTarget: temporal`.

**Para qué sirve:** onboarding bancario multi-día, aprobaciones humanas intermedias — frente a colas simples sin estado de workflow.

**Ver también:** `PLAN.md` §6 M9 · [`io.trigger`](./catalogo-nodos.md#iotrigger)

---

### TF-IDF

**TF-IDF** (Term Frequency–Inverse Document Frequency) pondera términos por frecuencia en el documento y rareza en el corpus. Es la base léxica de BM25 y de representaciones sparse clásicas.

**Para qué sirve:** entender por qué BM25 discrimina términos raros; comparar recuperación léxica vs embeddings densos.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md)

---

### thread_id

El **thread_id** identifica una sesión conversacional en LangGraph. Mismo `thread_id` entre invocaciones → el checkpointer restaura el historial completo; distinto `thread_id` → sesión nueva vacía.

**Para qué sirve:** memoria multi-turno en agentes de producción.

**Ejemplo:** `config = {"configurable": {"thread_id": "demo-001"}}`

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

### Token

Un **token** es la unidad de texto que procesa el LLM; no coincide con una palabra (el tokenizador BPE puede partir palabras en sub-unidades). El consumo de API y la ventana de contexto se miden en tokens.

**Para qué sirve:** estimar costo, dimensionar `chunkSize` y saber cuánto contexto cabe en el prompt.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Tokenizador (BPE)

El **tokenizador** convierte texto en tokens; **BPE** (Byte Pair Encoding) es el algoritmo más común: fusiona pares de caracteres frecuentes hasta formar un vocabulario fijo. Cada modelo tiene su propio tokenizador — no son intercambiables.

**Para qué sirve:** explicar por qué el español consume más tokens que el inglés y por qué límites de contexto varían por modelo.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Tool calling (function calling)

El **tool calling** (o *function calling*) es la capacidad del LLM de emitir una instrucción estructurada `{tool, arguments}` en lugar de texto libre; el framework ejecuta la función y devuelve el resultado como nuevo contexto.

**Para qué sirve:** conectar el LLM a APIs, bases de datos, RAG y servicios transaccionales de forma tipada.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md) · sección tool en [`catalogo-nodos.md`](./catalogo-nodos.md#10-tool--herramientas-externas)

---

### Top-k / Top-p

- **Top-k:** en cada paso de generación, solo considera los k tokens más probables.
- **Top-p** (nucleus sampling): considera el conjunto mínimo de tokens cuya probabilidad acumulada alcanza p (p. ej. 0.9).

**Para qué sirve:** control fino de aleatoriedad junto con temperatura; en RAG factual los defaults suelen bastar.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### TruLens

**TruLens** es un framework de evaluación y feedback para apps LLM con métricas de groundedness, relevancia y trazabilidad de cadenas. Compite con RAGAS y DeepEval.

**Para qué sirve:** evaluación con instrumentación en runtime, no solo offline.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### TTS (Text-to-Speech)

**TTS** convierte texto en audio sintético. En el curso se cubre de forma conceptual junto con generación multimodal (respuestas habladas, IVR).

**Para qué sirve:** bots de voz bidireccionales: STT (entrada) + LLM + TTS (salida).

**Ver también:** `PLAN.md` §6 M10

---

## U

### Unstructured

**Unstructured** (unstructured.io) es una librería/servicio de parsing de documentos que clasifica bloques de PDF (título, tabla, narrativa, lista) y habilita chunking by-layout de mayor calidad que extractores básicos.

**Para qué sirve:** PDFs mixtos (texto + tablas + imágenes); alternativa robusta a PyPDFLoader para ingesta enterprise.

**Ver también:** [../02-ingesta/guia.md](../02-ingesta/guia.md) · [`loader.multimodal`](./catalogo-nodos.md#loadermultimodal)

---

## V

### Vector store

Un **vector store** persiste embeddings + textos + metadata y responde consultas de similitud (top-K nearest neighbors). Ejemplos: Chroma, FAISS, pgvector, Qdrant, Pinecone.

**Para qué sirve:** la "base de datos" del RAG — sin store no hay recuperación semántica persistente.

**Ver también:** [../03-embeddings-y-stores/guia.md](../03-embeddings-y-stores/guia.md) · sección store en [`catalogo-nodos.md`](./catalogo-nodos.md#4-store--almacenamiento-vectorial)

---

### Ventana de contexto

La **ventana de contexto** (*context window*) es el máximo de tokens que el modelo puede procesar en una llamada: system + historial + chunks + respuesta generada. Pasarse del límite trunca o falla la request.

**Para qué sirve:** dimensionar cuántos chunks caben en el prompt; motivar chunking y RAG frente a context stuffing.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

### Visión (modelo)

Un modelo de **visión** multimodal describe imágenes, diagramas y tablas escaneadas en texto para incluirlos en el pipeline RAG. Se usa en `loader.multimodal` con `describeImages: true`.

**Para qué sirve:** manuales con diagramas (AMM), fotos de daños en seguros, expedientes con figuras.

**Ver también:** `PLAN.md` §6 M10 · [`model.vision`](./catalogo-nodos.md#modelvision)

---

## W

### Whisper

**Whisper** es el modelo open-weights de OpenAI para transcripción multilingüe. Corre local (via HF/Ollama) o por API. Excelente calidad offline; el streaming en tiempo real suele usar alternativas (Deepgram, Transcribe).

**Para qué sirve:** STT en M10 y labs multimodales; comparar con proveedores de baja latencia en producción.

**Ver también:** `PLAN.md` §6 M10 · [`io.stt`](./catalogo-nodos.md#iostt)

---

### Working memory

La **working memory** es el estado estructurado que el agente mantiene durante una tarea: PNR, monto pendiente, vuelo seleccionado, paso del flujo. Complementa el historial conversacional (texto) con datos tipados consultables.

**Para qué sirve:** evitar re-preguntar datos ya obtenidos; en LangGraph vive en el estado del grafo además de los mensajes.

**Ver también:** [../06-agentes-i/guia.md](../06-agentes-i/guia.md)

---

## Z

### Zero-shot

Véase **Few-shot / Zero-shot / One-shot** en la sección F. **Zero-shot** = sin ejemplos en el prompt; el modelo se apoya solo en instrucciones y conocimiento paramétrico.

**Ver también:** [../01-fundamentos/guia.md](../01-fundamentos/guia.md)

---

## Términos adicionales de producción y observabilidad

### Feedback loop

Un **feedback loop** captura señales de calidad (thumbs up/down, callbacks de transacción) y las almacena para mejorar retrieval o reranking con el tiempo. El `feedbackRef` del reranker puede consumir estas señales.

**Ver también:** `PLAN.md` §6 M9 · [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback)

---

### Fuga de PII

La **fuga de PII** ocurre cuando el sistema expone datos personales identificables (nombres, DNI, cuentas) en respuestas, logs o trazas sin autorización. Mitigación: redacción en guardrails, permisos de tools, auditoría y tests adversarios.

**Ver también:** `PLAN.md` §6 M9

---

### JSON Schema

Véase **Structured output** — el **JSON Schema** es el contrato formal que define tipos, campos obligatorios, enums y restricciones del objeto que debe emitir el LLM.

**Ver también:** [../05-generacion-y-logic/guia.md](../05-generacion-y-logic/guia.md)

---

### Observabilidad

La **observabilidad** en sistemas RAG/agentes combina auditoría (tool calls a Kafka/log), métricas (OpenTelemetry), trazas LLM (LangSmith/Langfuse) y feedback de usuarios para operar y cumplir regulación.

**Ver también:** `PLAN.md` §6 M9 · sección observability en [`catalogo-nodos.md`](./catalogo-nodos.md#13-observability--auditoría-y-feedback)

---

### FastMCP

**FastMCP** es el framework Python para construir servidores MCP rápidamente: declaras tools, resources y prompts; el servidor habla STDIO o HTTP según despliegue.

**Para qué sirve:** taller M8 — exponer PolicyRAG como servidor MCP consumible por un agente.

**Ver también:** `PLAN.md` §6 M8

---

### STDIO / HTTP (transporte MCP)

**STDIO** lanza el servidor MCP como subproceso comunicándose por stdin/stdout (ideal en desktop/IDE). **HTTP** (Streamable HTTP) expone el servidor en red para clientes remotos o microservicios.

**Para qué sirve:** elegir despliegue local vs servicio en infraestructura.

**Ver también:** `PLAN.md` §6 M8

---

> **Cross-links**
> - Plan global del curso: [`../PLAN.md`](../PLAN.md) (visión, módulos M0–M11, §5 lista este glosario)
> - Fichas de los 53 nodos RAGorbit: [`./catalogo-nodos.md`](./catalogo-nodos.md)
> - Tablas comparativas de tecnologías: [`./tecnologias-comparadas.md`](./tecnologias-comparadas.md)
> - Contexto de autoría y método tri-modal: [`../HANDOFF.md`](../HANDOFF.md)

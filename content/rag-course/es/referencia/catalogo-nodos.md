# Catálogo de nodos — fichas pedagógicas

> Referencia de los **53 tipos de nodo** de RAGorbit, agrupados en las **13 categorías**. Por cada nodo: qué hace, cuándo usar / cuándo NO, y qué tecnologías alternativas existen. Los `type` exactos provienen de [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md).

---

## Índice de categorías

1. [io — Entradas y salidas](#1-io--entradas-y-salidas)
2. [loader — Fuentes de datos](#2-loader--fuentes-de-datos)
3. [ingest — Preparación de datos](#3-ingest--preparación-de-datos)
4. [store — Almacenamiento vectorial](#4-store--almacenamiento-vectorial)
5. [retrieval — Recuperación](#5-retrieval--recuperación)
6. [model — Modelos](#6-model--modelos)
7. [query — Operaciones sobre la consulta](#7-query--operaciones-sobre-la-consulta)
8. [logic — Razonamiento y reglas](#8-logic--razonamiento-y-reglas)
9. [agent — Agentes](#9-agent--agentes)
10. [tool — Herramientas externas](#10-tool--herramientas-externas)
11. [guardrail — Seguridad y resiliencia](#11-guardrail--seguridad-y-resiliencia)
12. [hitl — Humano en el loop](#12-hitl--humano-en-el-loop)
13. [observability — Auditoría y feedback](#13-observability--auditoría-y-feedback)

---

## 1. io — Entradas y salidas

El nodo de **entrada** determina el `deploymentTarget` (chat-service, event-worker, temporal o batch). Ver [`docs/01-concepts.md §5`](../../docs/01-concepts.md) para la tabla completa de targets.

---

### `io.input`

**Qué hace:** Punto de entrada conversacional (chat de texto o voz). El usuario o cliente envía un mensaje y el nodo lo introduce en el grafo como tipo `Message`. Determina automáticamente el `deploymentTarget: chat-service`, que genera un esqueleto FastAPI con SSE/WebSocket.

**Cuándo usar:** Cualquier bot conversacional, asistente virtual o copilot que recibe texto (o voz pre-transcrita). Es el nodo de entrada más común: asistente de RRHH, agente de aerolínea, copilot de call center.

**Cuándo NO usar:** Cuando la entrada no es conversacional: si procesas un lote de archivos usa `io.batch`; si consumes eventos de Kafka usa `io.event-source`; si necesitas durabilidad de largo plazo usa `io.trigger`.

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `channel` | `chat` / `voice` | `chat` |
| `auth` | `none` / `jwt` / `booking-token` | `none` |
| `streaming` | `true` / `false` | `true` |

**Alternativas / tecnologías que compiten:** Streamlit `st.chat_input`, Gradio `gr.ChatInterface`, Slack Bolt, Twilio Conversations. RAGorbit abstrae el canal — el cambio es solo un campo de configuración.

---

### `io.stt`

**Qué hace:** Transcripción Speech-to-Text en streaming. Recibe audio crudo del canal de voz y produce fragmentos de texto `Message` conforme llega el audio, sin esperar a que el usuario termine de hablar. Permite latencias < 1.5 s en copilots de call center.

**Cuándo usar:** Cuando la entrada es audio en tiempo real (llamadas telefónicas, bots de voz, copilots para agentes humanos). Ejemplo clave: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**Cuándo NO usar:** Si ya tienes el texto transcrito (usa `io.input`). Si el audio se procesa en lote (considera Whisper como función dentro de un `tool.function` o en el pipeline de `io.batch`).

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `provider` | `transcribe` / `deepgram` | `deepgram` |
| `language` | código ISO | `es` |

**Alternativas:** Deepgram Nova-2 (baja latencia, streaming nativo), Amazon Transcribe Streaming, Google Speech-to-Text v2, OpenAI Whisper (via API, no streaming real), Whisper local (modelo abierto, sin costo por token). La elección depende de latencia objetivo vs costo vs idiomas soportados.

---

### `io.event-source`

**Qué hace:** Consume eventos de un broker de mensajería (Kafka) y los introduce en el grafo como tipo `Event`. Determina `deploymentTarget: event-worker`. Soporta `exactlyOnce: true` mediante transacciones Kafka para garantizar que ningún evento se procese dos veces.

**Cuándo usar:** Procesamiento asíncrono de alto volumen disparado por eventos externos: disrupciones logísticas, alertas de fraude, notificaciones de transacciones. Ejemplo clave: [10-logistics-disruption-rebooking](../../examples/10-logistics-disruption-rebooking/).

**Cuándo NO usar:** Para interacciones conversacionales (usa `io.input`) o para procesar archivos en lote sin broker (usa `io.batch`). Si el volumen es bajo y la latencia no importa, un cronjob con `io.batch` puede ser más simple.

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `broker` | `kafka` | `kafka` |
| `topic` | string | *(requerido)* |
| `partitionKey` | campo del evento | — |
| `exactlyOnce` | `true` / `false` | `true` |

**Alternativas:** AWS SQS/SNS, Google Pub/Sub, Azure Service Bus, RabbitMQ, Pulsar. Kafka es el estándar de facto para alto volumen con retención y replay; los demás son más simples de operar pero con menos garantías.

---

### `io.trigger`

**Qué hace:** Disparador durable. Inicia un workflow de Temporal (con soporte a cron). Determina `deploymentTarget: temporal`. Ideal para procesos que pueden durar horas o días, requieren retry automático y deben sobrevivir reinicios del servidor.

**Cuándo usar:** Flujos de negocio de larga duración con pasos humanos intermedios, aprobaciones, re-intentos programados. Por ejemplo, un proceso de onboarding bancario que espera documentos del cliente por varios días.

**Cuándo NO usar:** Para respuestas en tiempo real o batch simple. La complejidad operativa de Temporal es innecesaria para bots conversacionales o jobs de procesamiento corto.

**Config principal:** `schedule` (cron opcional), `idempotencyKey`.

**Alternativas:** AWS Step Functions, Prefect, Dagster, Airflow (para flujos de datos), Celery con beat scheduler. Temporal destaca por su modelo de código como definición de workflow y garantías de durabilidad.

---

### `io.batch`

**Qué hace:** Fuente de archivos para procesamiento en lote (batch). Puede ser un directorio local, un bucket S3/GCS, o un cron. Produce `Documents` y determina `deploymentTarget: batch`.

**Cuándo usar:** Indexación nocturna de documentos, procesamiento de expedientes, evaluaciones masivas de crédito o siniestros. Ejemplo clave: [02-banking-credit-scoring](../../examples/02-banking-credit-scoring/), [04-insurance-claims](../../examples/04-insurance-claims/).

**Cuándo NO usar:** Para procesamiento en tiempo real o conversacional.

**Config principal:** `source` *(requerido)*, `glob` (patrón de archivos, default `**/*.pdf`).

**Alternativas:** Apache Spark para escala masiva, Pandas/Polars para datos tabulares en memoria, AWS Glue, dbt.

---

### `io.output`

**Qué hace:** Salida final del flujo hacia el usuario o sistema externo. Formatea la respuesta (texto, markdown o JSON) y la envía por streaming SSE o como documento completo. Es el nodo de salida estándar presente en todos los flujos.

**Cuándo usar:** Siempre, como nodo terminal del flujo. El formato (`text`, `markdown`, `json`) debe corresponderse con el consumidor.

**Cuándo NO usar:** Si necesitas enviar notificaciones asíncronas (email, SMS, push) usa `io.notify`. Si quieres mostrar una sugerencia en un panel lateral sin interrumpir el flujo principal usa `io.panel`.

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `format` | `text` / `markdown` / `json` | `markdown` |
| `streaming` | `true` / `false` | `true` |

**Alternativas:** No tiene alternativas directas dentro del catálogo — es el contrato de salida estándar. En producción, la salida puede ir a Gradio, Streamlit, un frontend custom o una API REST.

---

### `io.notify`

**Qué hace:** Envía notificaciones salientes (email, SMS, push) sin interrumpir el flujo principal. No produce una respuesta conversacional, sino un disparo asíncrono a canales externos.

**Cuándo usar:** Cuando la acción del agente debe comunicarse fuera del canal de chat. Ejemplo: notificar al cliente del rebooking de su envío por email y SMS, o alertar a un médico sobre un caso escalado.

**Cuándo NO usar:** Para la respuesta principal del bot (usa `io.output`). No es un reemplazo de sistemas de email transaccional maduros (SendGrid, AWS SES) — los envuelve.

**Config principal:** `channels: [email, sms, push]`.

**Alternativas:** SendGrid, Twilio SMS, Firebase Push, AWS SNS. `io.notify` abstrae el canal; los proveedores reales se configuran vía secretos.

---

### `io.panel`

**Qué hace:** Envía una sugerencia a un panel lateral de la UI sin interrumpir la conversación principal. Diseñado para copilots: el agente humano sigue hablando con el cliente mientras el panel muestra la respuesta sugerida en tiempo real.

**Cuándo usar:** Copilots para agentes humanos (call center, soporte técnico, ventas). Ejemplo clave: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**Cuándo NO usar:** Para flujos sin UI o donde la respuesta es la salida principal del bot.

**Config principal:** `cite: true` (muestra las citas de fuente junto a la sugerencia).

**Alternativas:** Implementación custom con WebSocket push, LiveKit para voz+panel en tiempo real.

---

## 2. loader — Fuentes de datos

Todos los loaders producen `Documents` y traen **mock con fixtures** para correr sin la fuente real (flag `MOCK=true`).

---

### `loader.pdf`

**Qué hace:** Carga PDFs de texto (no escaneados) y los convierte en documentos con texto y metadata básica (nombre de archivo, número de página). Puede activar OCR para PDFs escaneados.

**Cuándo usar:** La fuente de conocimiento más común: manuales, políticas, contratos, informes. Es el punto de partida de la mayoría de pipelines RAG. Presente en casi todos los templates.

**Cuándo NO usar:** Cuando los PDFs contienen tablas críticas o diagramas que deben preservarse como datos estructurados (usa `loader.multimodal`). Para CSV/Excel usa `loader.tabular`.

**Config principal:** `path`/`bucket`, `ocr: false` (activar solo si el PDF es escaneado, añade latencia).

**Alternativas:** PyMuPDF (fitz), PDFMiner, pdfplumber, Unstructured (detecta automáticamente el tipo de documento), LlamaIndex SimpleDirectoryReader, LangChain PyPDFLoader. Unstructured es la opción más robusta para PDFs mixtos (texto + imágenes + tablas).

---

### `loader.multimodal`

**Qué hace:** Carga PDFs con contenido mixto: extrae tablas como JSON estructurado (`extractTables: true`), envía diagramas e imágenes a un modelo de visión para obtener descripciones en texto (`describeImages: true`), y preserva la jerarquía de secciones según un esquema (`sectionScheme`, por ejemplo `ATA` para manuales aeronáuticos). Produce `Documents` enriquecidos.

**Cuándo usar:** Documentos técnicos o financieros donde las tablas y los diagramas son parte del contenido relevante. Ejemplos: manuales de mantenimiento aeronáutico ([08](../../examples/08-manufacturing-maintenance-rag/)), pólizas de seguro ([04](../../examples/04-insurance-claims/)), estados financieros.

**Cuándo NO usar:** Para PDFs de texto puro (usa `loader.pdf`, es más rápido y barato). El procesamiento de visión añade latencia y costo de tokens.

**Config principal:**

| Campo | Default |
|-------|---------|
| `extractTables` | `true` |
| `describeImages` | `true` |
| `sectionScheme` | nombre del esquema (p.ej. `ATA`, `insurance-policy`) |

**Alternativas:** Unstructured.io (open-source, soporta muchos formatos), Azure Document Intelligence, AWS Textract, LlamaParse (LlamaIndex), Nougat (modelo abierto de Meta para papers científicos).

---

### `loader.tabular`

**Qué hace:** Carga datos tabulares (CSV, Parquet, Excel) y los convierte en documentos. Cada fila o grupo de filas se convierte en un chunk de texto con metadata de columnas.

**Cuándo usar:** Datos financieros estructurados, catálogos de productos, registros de clientes que deben estar disponibles para búsqueda semántica o síntesis. Ejemplo: datos de crédito en [02-banking](../../examples/02-banking-credit-scoring/).

**Cuándo NO usar:** Si los datos tabulares deben consultarse con SQL, usa `loader.sql` o conéctalo directamente a un `tool.service` que llame a una BD. Para análisis numérico complejo, Pandas/Polars son más apropiados que RAG.

**Config principal:** `path`, `schemaHint` (sugerencia de interpretación de columnas).

**Alternativas:** Pandas read_csv/read_excel, LangChain CSVLoader, LlamaIndex PandasQueryEngine (para queries SQL sobre DataFrames).

---

### `loader.web`

**Qué hace:** Carga páginas web y sitemaps, convierte HTML en texto limpio y produce `Documents`. Soporta crawling hasta cierta profundidad.

**Cuándo usar:** FAQs de intranet, páginas de producto, documentación online que no tiene versión PDF. Ejemplo: FAQs de telecom en [07](../../examples/07-telecom-callcenter-copilot/).

**Cuándo NO usar:** Para fuentes que requieren autenticación compleja o renderizado JavaScript pesado. Para APIs REST estructuradas usa `loader.sql` o `tool.service`.

**Config principal:** `urls[]` *(requerido)*, `crawlDepth: 0` (0 = solo la URL dada, sin seguir links).

**Alternativas:** Scrapy, BeautifulSoup + requests, LangChain WebBaseLoader, FireCrawl (servicio gestionado de crawling), Apify.

---

### `loader.s3`

**Qué hace:** Carga objetos (típicamente archivos) desde un bucket de almacenamiento en la nube (S3, GCS). Equivalente a `loader.pdf` o `loader.multimodal` pero con la fuente en la nube.

**Cuándo usar:** En entornos de producción donde los documentos viven en S3 (políticas, contratos, informes). Secreto `STORAGE_KEY` requerido.

**Cuándo NO usar:** Para desarrollo local (usa `loader.pdf` con path local para no depender de credenciales de nube).

**Config principal:** `bucket` *(requerido)*, `prefix` (subcarpeta dentro del bucket).

**Alternativas:** AWS SDK (boto3), Google Cloud Storage client, Azure Blob Storage SDK. Para orquestación de ingesta a escala, considera AWS Glue o Databricks.

---

### `loader.sql`

**Qué hace:** Ejecuta una query SQL sobre una base de datos relacional y convierte las filas resultantes en documentos. Permite indexar datos operacionales para búsqueda semántica.

**Cuándo usar:** Cuando los datos relevantes están en tablas de una BD y quieres incluirlos en el índice RAG. Por ejemplo, historial de transacciones o catálogo de productos.

**Cuándo NO usar:** Para queries analíticas complejas en tiempo real (usa un `tool.service` con endpoint de datos). No reemplaza a un data warehouse.

**Config principal:** `query` *(requerido, SQL completa)*, secreto `DATABASE_URL`.

**Alternativas:** LangChain SQLDatabaseLoader, LlamaIndex DatabaseReader, SQLAlchemy + custom loader.

---

## 3. ingest — Preparación de datos

---

### `ingest.chunker`

**Qué hace:** Divide documentos en fragmentos (chunks) de tamaño controlado, respetando la estructura del documento según la estrategia elegida. Produce `Documents` listos para ser indexados.

El chunking es una de las decisiones más críticas en un pipeline RAG: chunks demasiado grandes diluyen la relevancia; demasiado pequeños pierden contexto.

**Cuándo usar:** Siempre, después de cualquier loader y antes del store. Es el paso que convierte documentos completos en fragmentos recuperables.

**Cuándo NO usar:** Nunca se omite en un pipeline RAG estándar. Si los documentos ya son cortos (< 500 tokens), se puede usar `chunkSize` grande y `overlap: 0`.

**Estrategias disponibles:**

| Estrategia | Cuándo usar |
|------------|-------------|
| `recursive` | Texto genérico. Divide por párrafos, luego oraciones, luego caracteres. El default más robusto. |
| `by-section` | Documentos con encabezados claros (H1/H2). Respeta la jerarquía de secciones. |
| `by-clause` | Contratos y documentos legales. Cada cláusula es un chunk autónomo. Crítico para citabilidad. |

**Config principal:**

| Campo | Default |
|-------|---------|
| `strategy` | `recursive` |
| `chunkSize` | `1000` (caracteres aprox.) |
| `overlap` | `150` (solapamiento entre chunks para no cortar contexto) |

**Alternativas:** LangChain RecursiveCharacterTextSplitter, LlamaIndex SentenceSplitter / SemanticSplitter (chunks de tamaño variable basados en similitud semántica), Unstructured chunking, chonkie (librería especializada en chunking).

---

### `ingest.metadata`

**Qué hace:** Etiqueta cada chunk con campos de metadata que luego pueden usarse como **filtros duros** en la recuperación. Es el paso que transforma una búsqueda vectorial genérica en una búsqueda con restricciones de negocio.

**Cuándo usar:** Siempre que el contexto del documento importa: tipo de tarifa, plan de seguro, tipo de aeronave, período fiscal, clase de documento. Sin metadata, la búsqueda vectorial no puede distinguir entre documentos de diferentes categorías.

**Cuándo NO usar:** Si todos los documentos del índice son del mismo tipo y no necesitas filtrar por categoría. En ese caso omitirlo simplifica el pipeline.

**Config principal:** `fields[]` — lista de nombres de campo a etiquetar (ej. `[fare_class, route_type, effective_date]`).

**Alternativas:** LangChain DocumentTransformer, LlamaIndex MetadataExtractor (puede usar LLM para extraer metadata automáticamente del texto), extracción manual vía convenciones de nombre de archivo.

---

## 4. store — Almacenamiento vectorial

Los stores consumen `Documents` + `Embeddings` y producen `Retriever`. Son la "base de datos vectorial" del sistema RAG.

---

### `store.pgvector`

**Qué hace:** Almacena vectores y metadatos en PostgreSQL con la extensión `pgvector`. Combina búsqueda vectorial con todas las capacidades de SQL (filtros, joins, transacciones).

**Cuándo usar:** Cuando ya tienes infraestructura PostgreSQL, necesitas filtros complejos combinados con búsqueda vectorial, o requieres transacciones ACID. Ideal para producción en entornos corporativos. Usado en la mayoría de los templates del catálogo.

**Cuándo NO usar:** Para prototipos rápidos donde no quieres levantar Postgres (usa `store.chroma`). Para escala de más de 100M vectores (considera Qdrant o Pinecone).

**Secretos:** `DATABASE_URL`.

**Alternativas:** Qdrant, Pinecone, Weaviate, Chroma. Ver tabla completa en [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

### `store.qdrant`

**Qué hace:** Almacena vectores en Qdrant, una base de datos vectorial dedicada escrita en Rust. Soporta filtros ricos (payload filtering), múltiples tipos de distancia, y escala bien a decenas de millones de vectores.

**Cuándo usar:** Cuando necesitas una base de datos vectorial dedicada con filtros avanzados, buena performance a escala, y no quieres añadir Postgres al stack. Disponible como managed service (Qdrant Cloud) o self-hosted.

**Cuándo NO usar:** Si ya tienes Postgres en producción (usa `store.pgvector`). Para demos/desarrollo local (usa `store.chroma`).

**Secretos:** `QDRANT_URL`, `QDRANT_API_KEY`.

---

### `store.chroma`

**Qué hace:** Almacena vectores en Chroma, una base de datos vectorial embebida que corre dentro del proceso Python, sin servidor separado. El índice persiste en disco. Ideal para desarrollo y demos.

**Cuándo usar:** Prototipos, demos, bots internos con bajo volumen (< 1M vectores), entornos donde no puedes instalar Postgres. Es el store más simple de poner a funcionar. Ejemplo: [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/).

**Cuándo NO usar:** En producción con múltiples instancias del servicio (Chroma embebido no soporta acceso concurrente multi-proceso de forma nativa). Para escala o necesidades de filtros avanzados.

**Alternativas directas:** FAISS (solo en memoria/disco, sin servidor), Qdrant (managed), pgvector.

---

### `store.neo4j`

**Qué hace:** Almacena documentos y entidades como nodos en un grafo de conocimiento (Knowledge Graph), con relaciones tipadas entre ellos. Soporta búsqueda vectorial sobre los nodos (cada nodo tiene embedding) Y recuperación por vecindario de grafo (1 o 2 hops de distancia). Implementa el patrón **GraphRAG**.

**Cuándo usar:** Cuando las relaciones entre entidades son tan importantes como el contenido de los documentos. Ejemplos: red de personajes en documentos legales, relaciones entre síntomas y diagnósticos, jerarquías organizacionales.

**Cuándo NO usar:** Para RAG simple sobre documentos sin relaciones estructuradas. El overhead de modelar el grafo es significativo comparado con un store vectorial estándar.

**Secretos:** `NEO4J_URI`, `NEO4J_AUTH`.

**Alternativas:** Amazon Neptune, TigerGraph, Memgraph. Microsoft GraphRAG (herramienta específica que construye grafos de entidades sobre documentos). LlamaIndex PropertyGraphIndex.

---

### `store.multi-index`

**Qué hace:** Agrupa varios índices nombrados (por ejemplo `policy`, `procedure`, `faq`) en un único punto de acceso. No almacena datos directamente — recibe `Retriever` de múltiples stores y los expone bajo un nombre. El `retrieval.router` usa esta estructura para dirigir queries al índice correcto.

**Cuándo usar:** Cuando tienes múltiples bases de conocimiento con categorías claramente distintas y quieres evitar ruido cross-categoría. Ejemplos: telecom con policy+procedure+faq ([07](../../examples/07-telecom-callcenter-copilot/)), legal con playbook+regulations+precedent ([05](../../examples/05-legal-contract-review/)).

**Cuándo NO usar:** Si tienes un solo tipo de documento o si la separación por índice no reduce el ruido de forma medible.

**Config principal:** `indexes[]` *(requerido)* — lista de nombres de índice (deben coincidir con los names de los stores conectados).

---

## 5. retrieval — Recuperación

Los nodos de retrieval consumen `Retriever` (o `Chunks`) y producen `Chunks`, que son los fragmentos de texto que el LLM usará como contexto.

---

### `retrieval.vector`

**Qué hace:** Búsqueda por similitud vectorial (nearest neighbor search). Dado un query (convertido a embedding), encuentra los `topK` chunks cuyo vector es más cercano al del query. Soporta `hardFilters` para restringir la búsqueda a subconjuntos del índice.

**Cuándo usar:** El retriever por defecto en casi todo flujo RAG. Funciona bien cuando la consulta es semántica y no se necesita coincidencia exacta de palabras clave.

**Cuándo NO usar:** Cuando el usuario busca términos técnicos exactos (números de parte, códigos) que los embeddings pueden no distinguir bien. En esos casos, complementa con `retrieval.hybrid`.

**Config principal:**

| Campo | Default |
|-------|---------|
| `topK` | `4` |
| `hardFilters[]` | lista de campos de metadata que actúan como restricciones obligatorias |

**Nota sobre hardFilters:** No son "sugerencias de relevancia" — son cláusulas WHERE en la consulta al store. Garantizan que los chunks de una tarifa economy nunca contaminen la respuesta de una tarifa business.

**Alternativas:** LangChain VectorStoreRetriever, LlamaIndex VectorIndexRetriever, FAISS similarity_search.

---

### `retrieval.graph`

**Qué hace:** Recuperación sobre un knowledge graph (Neo4j). En lugar de buscar por similitud vectorial en un conjunto plano de chunks, navega el grafo por relaciones: dado un nodo relevante, también recupera sus vecinos (nodos relacionados a 1 o 2 hops).

**Cuándo usar:** Cuando las relaciones entre entidades aportan contexto crítico. Por ejemplo: "¿qué contratos están relacionados con esta empresa?" no es solo similitud semántica sino traversal de grafo.

**Cuándo NO usar:** Para RAG sobre documentos sin estructura de grafo. La latencia es mayor que la búsqueda vectorial plana.

**Config principal:** `hops: 1` (profundidad de traversal), `pattern` (tipo de relación a seguir).

**Alternativas:** LlamaIndex KnowledgeGraphIndex, Microsoft GraphRAG, Amazon Neptune, LangChain Neo4jGraph.

---

### `retrieval.hybrid`

**Qué hace:** Combina búsqueda vectorial (semántica) con búsqueda por palabras clave (BM25/keyword). Fusiona los resultados de ambas modalidades con un parámetro `alpha` que controla el peso relativo. Recupera mejor tanto conceptos semánticos como términos técnicos exactos.

**Cuándo usar:** Cuando el corpus tiene términos técnicos, nombres propios, códigos o números de serie que los embeddings representan mal. Es la opción más robusta para retrieval en documentos técnicos.

**Cuándo NO usar:** Cuando el corpus es homogéneo y la búsqueda vectorial sola ya tiene alta precisión. Añade complejidad operativa (necesita índice BM25 además del vectorial).

**Config principal:** `alpha: 0.5` (0 = solo keyword, 1 = solo vectorial, 0.5 = balance).

**Alternativas:** Elasticsearch dense_vector + BM25, OpenSearch, Weaviate hybrid search, Qdrant hybrid, LangChain EnsembleRetriever.

---

### `retrieval.router`

**Qué hace:** Multi-index routing: dado un query, selecciona el índice correcto del `store.multi-index` basándose en reglas de keyword o intent. Redirige la búsqueda vectorial solo al índice relevante, reduciendo latencia y ruido.

**Cuándo usar:** Con `store.multi-index` cuando tienes 2+ categorías de documentos claramente distintas y quieres evitar recuperar fragmentos irrelevantes cross-categoría.

**Cuándo NO usar:** Con un solo índice o cuando las categorías tienen mucho solapamiento semántico (el router por keyword no funcionará bien).

**Config principal:** `rules[]` — pares `{keyword: valor, index: nombre_índice}`, `fallback` — índice por defecto si ninguna regla hace match.

**Alternativas:** LlamaIndex RouterQueryEngine, LangChain RouterChain, clasificador de intención seguido de dispatch manual.

---

### `retrieval.parent-child`

**Qué hace:** Implementa el patrón Parent-Child retrieval. Los chunks indexados son pequeños (para alta precisión en la búsqueda) pero lo que se devuelve al LLM es el chunk padre, más grande, que contiene más contexto. El campo `parentField` en la metadata liga cada chunk hijo con su padre.

**Cuándo usar:** Cuando los chunks pequeños dan buena precisión de búsqueda pero el LLM necesita más contexto para responder bien. Documentos con secciones que tienen sentido como unidad pero son demasiado largas para indexar como un solo chunk.

**Cuándo NO usar:** Cuando el chunking estándar ya produce buen contexto. Añade complejidad al pipeline de ingesta (hay que generar y almacenar la jerarquía padre-hijo).

**Config principal:** `parentField: parent_id` (campo de metadata que referencia el chunk padre).

**Alternativas:** LlamaIndex ParentDocumentRetriever, LangChain ParentDocumentRetriever, Small-to-Big retrieval (variante similar).

---

### `retrieval.reranker`

**Qué hace:** Reordena los chunks recuperados por similitud vectorial y descarta los menos relevantes, quedándose con los `topN` más útiles. Usa un modelo cross-encoder que evalúa la relevancia del par (query, chunk) de forma conjunta, a diferencia del embedding que los codifica por separado.

**Cuándo usar:** Cuando el retriever vectorial devuelve ruido: chunks semánticamente similares pero no directamente relevantes para la query específica. Mejora la calidad de las respuestas a costa de latencia adicional (~50-150ms). Fundamental en flujos de alta precisión como legal o médico.

**Cuándo NO usar:** Cuando la latencia es crítica y el retriever vectorial ya tiene alta precisión. Para un bot de RRHH simple el reranker puede ser excesivo.

**Config principal:**

| Campo | Default |
|-------|---------|
| `model` | `bge-reranker` |
| `topN` | `3` |
| `feedbackRef` | referencia al store de feedback para fine-tune continuo |

**Alternativas:** Cohere Rerank (API managed), BGE-Reranker (modelo abierto, local), ColBERT (late interaction, más eficiente), FlashRank (ultra-rápido, calidad menor). Ver tabla comparativa en [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

## 6. model — Modelos

---

### `model.llm`

**Qué hace:** Configura un LLM vía la interfaz estándar `init_chat_model` de LangChain. Produce un `Model` que conecta con nodos que necesitan un LLM: `logic.prompt`, `logic.structured`, `agent.react`, etc.

**Cuándo usar:** En cualquier flujo que necesite razonamiento de lenguaje natural, síntesis o generación de texto. Es el nodo de modelo más común.

**Cuándo NO usar:** Para embeddings (usa `model.embedding`), para visión (usa `model.vision`), para clasificación de intención ligera (usa `model.intent`).

**Config principal:**

| Campo | Default |
|-------|---------|
| `model` | `anthropic:claude-opus-4-8` |
| `temperature` | `0.2` |
| `apiKeyRef` | `ANTHROPIC_API_KEY` |

El formato `proveedor:nombre-modelo` permite cambiar de proveedor editando un solo campo, sin lock-in.

**Alternativas:** Claude Opus/Sonnet/Haiku (Anthropic), GPT-4o/GPT-4o-mini (OpenAI), Gemini Pro/Flash (Google), Llama 3 (Meta, open-weights via Ollama/HF), Mistral Large/Mixtral, Granite (IBM watsonx). Ver tabla comparativa en [`tecnologias-comparadas.md`](./tecnologias-comparadas.md).

---

### `model.embedding`

**Qué hace:** Configura el modelo de embeddings que convierte texto en vectores numéricos. Produce `Embeddings`, que conecta con los stores vectoriales. Es el componente que hace posible la búsqueda por similitud semántica.

**Cuándo usar:** Siempre que haya un store vectorial en el flujo. El modelo de embedding debe ser el mismo en ingesta y en consulta (si cambias el modelo, debes re-indexar todo).

**Cuándo NO usar:** No aplica omitirlo si hay un store; es obligatorio.

**Config principal:**

| Campo | Default |
|-------|---------|
| `model` | `text-embedding-3-large` |
| `local` | `false` |
| `apiKeyRef` | según proveedor |

`local: true` usa un modelo local (sentence-transformers), eliminando llamadas de red y reduciendo latencia en ~100-150ms.

**Alternativas:** text-embedding-3-large/small (OpenAI), embed-v3 (Cohere), E5-large, BGE-large (modelos abiertos locales con calidad comparable a los de API), nomic-embed, Jina Embeddings.

---

### `model.vision`

**Qué hace:** Modelo multimodal capaz de describir imágenes, diagramas, tablas y figuras en texto. Produce `Model`. Se conecta principalmente a `loader.multimodal` para enriquecer el pipeline de ingesta con descripciones de elementos visuales.

**Cuándo usar:** Cuando los documentos contienen imágenes, diagramas técnicos, tablas escaneadas o figuras que aportan información relevante. Ejemplos: manuales de mantenimiento ([08](../../examples/08-manufacturing-maintenance-rag/)), pólizas de seguros con fotos de daños ([04](../../examples/04-insurance-claims/)).

**Cuándo NO usar:** Para documentos de texto puro (añade costo y latencia innecesarios).

**Config principal:** `model: anthropic:claude-opus-4-8`, `apiKeyRef: ANTHROPIC_API_KEY`.

**Alternativas:** GPT-4o (OpenAI), Gemini Pro Vision (Google), LLaVA (abierto, local), Qwen-VL, Pixtral (Mistral).

---

### `model.intent`

**Qué hace:** Clasificador ligero de intención. Dado un mensaje, lo clasifica en una de las etiquetas definidas (`labels[]`). Funciona con embeddings locales (rápido, ~5-10ms) o con un LLM pequeño. Produce `Query` (fragmento accionable) y `Decision` (etiqueta de intención).

**Cuándo usar:** Como compuerta antes del pipeline RAG para descartar mensajes no accionables (saludos, silencios, frases de relleno). Ejemplo clave: [07-telecom](../../examples/07-telecom-callcenter-copilot/), donde filtra el 30-50% de fragmentos de audio. También para routing: decidir qué agente o índice debe manejar la consulta.

**Cuándo NO usar:** Cuando todas las consultas son igualmente accionables o cuando la clasificación es innecesaria. No lo uses para clasificaciones complejas con muchas etiquetas (> 10) — ahí un LLM pequeño da mejor calidad.

**Config principal:**

| Campo | Default |
|-------|---------|
| `labels[]` | *(requerido)* |
| `backend` | `embeddings` |
| `threshold` | `0.6` |

**Alternativas:** `query.intent` (alias orientado a routing en el catálogo), clasificadores zero-shot con LLM (más flexible, más costoso), fastText (ultra-rápido, requiere fine-tune), SetFit (few-shot con sentence-transformers).

---

## 7. query — Operaciones sobre la consulta

---

### `query.rewrite`

**Qué hace:** Normaliza y expande el query del usuario antes de enviarlo al retriever. Convierte jerga interna, abreviaciones o sinónimos en los términos canónicos que el índice espera. Puede expandir el query para mejorar el recall (añadir sinónimos o reformulaciones alternativas).

**Cuándo usar:** Cuando los usuarios usan vocabulario diferente al de los documentos. Ejemplo: en telecom, "baja de plan" debe mapearse a "cancelación de servicio" para que el retriever encuentre los chunks correctos.

**Cuándo NO usar:** Para dominios donde el vocabulario del usuario coincide con el de los documentos (no añade valor en RRHH básico, por ejemplo).

**Config principal:** `glossaryRef` (referencia al glosario de sinónimos), `expand: true`.

**Alternativas:** HyDE (Hypothetical Document Embeddings — genera un documento hipotético y lo usa como query), Step-back prompting, LLM-based query reformulation, LangChain MultiQueryRetriever.

---

### `query.intent`

**Qué hace:** Detecta la intención accionable del mensaje. Si la intención no es relevante para el RAG (por ejemplo, el usuario dice "gracias" o "sí"), no dispara el pipeline de recuperación. Es un alias de `model.intent` orientado específicamente al routing del pipeline RAG.

**Cuándo usar:** En flujos donde no todas las consultas deben activar el RAG. Complementa o reemplaza a `model.intent` cuando el enfoque es el routing de consultas.

**Cuándo NO usar:** En flujos donde toda entrada es siempre una consulta válida para el RAG.

**Config principal:** `labels[]` *(requerido)*.

---

## 8. logic — Razonamiento y reglas

---

### `logic.prompt`

**Qué hace:** Síntesis de respuesta con LLM a partir de chunks recuperados y el mensaje del usuario. Es el nodo de generación estándar en un pipeline RAG: recibe `Chunks` + `Model` + `Message` y produce `Message` (la respuesta en lenguaje natural).

**Cuándo usar:** En cualquier flujo RAG donde la respuesta al usuario es texto generado por el LLM basado en los documentos recuperados.

**Cuándo NO usar:** Cuando necesitas salida estructurada (JSON) en lugar de texto libre (usa `logic.structured`). Cuando la respuesta es determinista y no requiere LLM (usa `logic.rules`).

**Config principal:** `template` *(requerido)*, `system` (instrucción de sistema del LLM).

**Alternativas:** LangChain LCEL (LLMChain, RAGChain), LlamaIndex QueryEngine, un nodo de agente con RAG como tool.

---

### `logic.structured`

**Qué hace:** Salida estructurada validada contra un JSON Schema. En lugar de texto libre, el LLM produce un objeto JSON con campos definidos (por ejemplo: `{score, decision, factores, justificacion}`). Con `requireCitations: true`, exige que cada campo referenciable cite su fuente.

**Cuándo usar:** Cuando el consumidor de la respuesta es un sistema (no un humano) o cuando la respuesta debe ser reproducible y auditable. Ejemplos: evaluación de crédito ([02](../../examples/02-banking-credit-scoring/)), adjudicación de siniestros ([04](../../examples/04-insurance-claims/)), revisión de contratos ([05](../../examples/05-legal-contract-review/)).

**Cuándo NO usar:** Para respuestas conversacionales en lenguaje natural (usa `logic.prompt`).

**Config principal:**

| Campo | Default |
|-------|---------|
| `schema` | *(requerido, JSON Schema)* |
| `requireCitations` | `false` |

**Alternativas:** `instructor` (librería Python para structured output), `outlines` (generación guiada por gramática), LangChain `with_structured_output()`, LlamaIndex `StructuredLLM`, Pydantic v2 + `model.bind_tools()`.

---

### `logic.rules`

**Qué hace:** Evalúa reglas deterministas (`when → then`) sin invocar ningún LLM. Produce `Decision` basada en lógica pura: umbrales numéricos, condiciones sobre campos de metadata, clasificaciones predefinidas.

**Cuándo usar:** Para decisiones con consecuencias de negocio que deben ser reproducibles al 100%: umbrales de aprobación de crédito, criterios de elegibilidad de seguros, clasificación de prioridad de eventos. **La regla de oro:** nunca delegar al LLM un umbral que tiene consecuencias legales o financieras.

**Cuándo NO usar:** Para decisiones que requieren comprensión del lenguaje natural o razonamiento sobre contexto variable.

**Config principal:** `rules[]` — lista de pares `{when: condición, then: acción}`, `else` — acción por defecto.

**Alternativas:** Código Python puro, rule engines como Drools o PyCaret, DSL de reglas de negocio.

---

### `logic.router`

**Qué hace:** Bifurca el flujo del grafo según una condición o decisión. Dado un `Decision` de entrada, redirige el flujo por una de las `branches[]` nombradas. Es el nodo `if/else` del grafo.

**Cuándo usar:** Cuando el flujo tiene caminos distintos según la decisión de un nodo anterior. Ejemplo: `logic.rules` clasifica envíos como `simple`/`complex` y el `logic.router` redirige al sub-agente correspondiente.

**Cuándo NO usar:** Si el grafo es lineal sin bifurcaciones.

**Config principal:** `branches[]` *(requerido)* — lista de pares `{name: nombre, condition: expresión}`.

**Alternativas:** Conditional edges en LangGraph (`add_conditional_edges`), `logic.rules` + múltiples salidas.

---

### `logic.citations`

**Qué hace:** Post-procesador que verifica que la respuesta del LLM ancle cada afirmación en uno de los chunks recuperados. En modo `enforce`, rechaza (o regenera) respuestas sin citas verificables. En modo `annotate`, añade las referencias sin rechazar.

**Cuándo usar:** En cualquier dominio de alta consecuencia donde una respuesta sin sustento documental es inaceptable: salud, legal, compliance, RRHH, mantenimiento aeronáutico. Es la última línea de defensa antes del usuario.

**Cuándo NO usar:** En flujos conversacionales relajados donde la fluidez importa más que la citabilidad (por ejemplo, un bot de entretenimiento).

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `mode` | `enforce` / `annotate` | `enforce` |

**Alternativas:** FaithfulnessEvaluator (LlamaIndex), NLI (Natural Language Inference) models, RAGAS faithfulness metric como guardrail en producción.

---

## 9. agent — Agentes

---

### `agent.react`

**Qué hace:** Orquestador de agente ReAct (Reason + Act). El LLM razona sobre el estado actual, decide qué tool llamar, observa el resultado, y repite hasta completar la tarea o alcanzar `maxSteps`. Puede manejar múltiples tools y mantener el estado de la conversación. Es el nodo de agente estándar para tareas multi-paso.

**Cuándo usar:** Para tareas que requieren múltiples llamadas a servicios o a la base de conocimiento antes de poder responder: cambiar un vuelo (consultar itinerario → verificar políticas → buscar alternativas → calcular precio → cobrar), responder preguntas médicas (consultar historia → recuperar guías → verificar criterios → decidir).

**Cuándo NO usar:** Para respuestas simples de una sola recuperación (un pipeline RAG estándar es suficiente y más predecible). Para procesamiento masivo en paralelo (usa `agent.fanout`).

**Config principal:**

| Campo | Default |
|-------|---------|
| `system` | *(requerido)* |
| `maxSteps` | `8` |
| `streaming` | `true` |

**Alternativas:** LangGraph `create_react_agent`, LangChain AgentExecutor (legacy), LlamaIndex ReActAgent, smolagents (HuggingFace), OpenAI Assistants API.

---

### `agent.fanout`

**Qué hace:** Despacha N sub-agentes **stateless** en paralelo, uno por item de un lote o partición. Controla la concurrencia con el campo `concurrency`. Cada sub-agente es independiente y no comparte estado en memoria; el estado persiste en la BD o el event log.

**Cuándo usar:** Para procesamiento masivo de eventos donde la misma lógica debe aplicarse a muchos items en paralelo: rebooking masivo de envíos ([10](../../examples/10-logistics-disruption-rebooking/)), procesamiento batch de solicitudes de crédito, alertas de fraude.

**Cuándo NO usar:** Para agentes conversacionales con estado de sesión (usa `agent.react`). Para procesamiento secuencial donde el orden importa.

**Config principal:**

| Campo | Default |
|-------|---------|
| `concurrency` | `16` |
| `subAgentSystem` | instrucciones del sub-agente |

**Alternativas:** LangGraph multi-agent con conditional edges, CrewAI con tasks paralelas, `asyncio.gather` + semáforo (la implementación subyacente generada).

---

## 10. tool — Herramientas externas

Todos los tools producen `Tool` para que un agente los invoque. Todos traen mock con fixtures.

---

### `tool.service`

**Qué hace:** Tool genérico hacia un servicio HTTP externo. Declara la operación (nombre, URL base, esquemas de entrada/salida) y el agente puede invocarlo por nombre en lenguaje natural.

**Cuándo usar:** Para integrar cualquier servicio REST existente (sistemas de reservas, ERP, CRM, servicios de pago, APIs internas). Es el tool más versátil y el más usado en los templates.

**Cuándo NO usar:** Para llamadas HTTP simples sin lógica de negocio (usa `tool.http`). Para funciones Python inline sin backend (usa `tool.function`).

**Config principal:** `name` *(requerido)*, `baseUrl` *(requerido)*, `operation` *(requerido)*, `inputSchema`, `outputSchema`.

**Secretos:** `SERVICE_API_KEY`.

**Alternativas:** LangChain StructuredTool con httpx, LlamaIndex FunctionTool, FastAPI endpoint + tool declaration.

---

### `tool.http`

**Qué hace:** Llamada HTTP simple y parametrizada. Menos declarativo que `tool.service`: especifica directamente el método, la URL template y los parámetros. Útil para APIs simples con una sola endpoint.

**Cuándo usar:** Para integraciones rápidas con APIs REST sencillas: webhooks, endpoints de consulta sin autenticación compleja.

**Cuándo NO usar:** Para servicios con múltiples operaciones o lógica de negocio compleja (usa `tool.service`).

**Config principal:** `method: GET`, `urlTemplate` *(requerido)*.

---

### `tool.function`

**Qué hace:** Ejecuta un fragmento de código Python custom definido en el nodo. El agente puede invocar esta función como cualquier otro tool. Ideal para lógica de negocio simple que no justifica un servicio externo.

**Cuándo usar:** Cálculos, transformaciones de datos, validaciones, funciones utilitarias que el agente necesita invocar pero que son deterministas y autocontenidas.

**Cuándo NO usar:** Para lógica que necesita persistencia, llamadas externas o código complejo (usa `tool.service` o una lambda/función Cloud).

**Config principal:** `name` *(requerido)*, `signature`, `body` *(requerido, código Python)*.

---

### `tool.mcp`

**Qué hace:** Expone una tool servida por un servidor MCP (Model Context Protocol). El nodo conecta con el servidor MCP especificado (vía STDIO o HTTP) e invoca la tool declarada por nombre.

**Cuándo usar:** Para integrar tools externas expuestas vía el protocolo estándar MCP: herramientas de Anthropic, GitHub Copilot MCP servers, servers custom construidos con FastMCP. Módulo M8 del curso.

**Cuándo NO usar:** Si el servicio no habla MCP (usa `tool.service` o `tool.http`).

**Config principal:** `server` *(requerido)*, `tool` *(requerido)*.

---

### `tool.retriever`

**Qué hace:** Expone un `Retriever` (vector store) como tool invocable por un agente. El agente puede decidir cuándo y con qué query llamar al RAG, en lugar de que el RAG sea siempre forzado en el pipeline.

**Cuándo usar:** En agentes RAG (agentic RAG) donde el agente debe decidir si consultar la base de conocimiento o no, y con qué query específica. Ejemplo: PolicyRAG en el agente de aerolínea ([01](../../examples/01-airline-flight-change/)).

**Cuándo NO usar:** En pipelines RAG simples donde el retrieval siempre ocurre antes de la síntesis (el retrieval directo es más predecible y barato).

**Config principal:** `name: search`, `description` *(requerido — el agente usa esta descripción para decidir cuándo invocar la tool)*.

---

## 11. guardrail — Seguridad y resiliencia

Los guardrails se colocan **alrededor** de tools (entre el tool y el agente). Envuelven el puerto `Tool`: entran `Tool`, salen `Tool`.

---

### `guardrail.pre-tool`

**Qué hace:** Valida una condición **antes** de ejecutar el tool. Si la condición no se cumple, rechaza la llamada y devuelve un error sin ejecutar el servicio subyacente. Ejemplo: no permitir downgrade de cabina, verificar límite de monto.

**Cuándo usar:** Para restricciones de negocio que deben aplicarse siempre, independientemente de lo que el LLM decida. Las restricciones de seguridad deben ser deterministas, no instrucciones en el prompt del LLM.

**Cuándo NO usar:** Para validaciones simples que el propio servicio ya maneja de forma adecuada.

**Config principal:** `checks[]` — lista de pares `{when: condición, action: deny/allow}`.

**Alternativas:** Middleware en el servicio subyacente, validación en el JSON Schema del tool, Guardrails AI nemo-guardrails.

---

### `guardrail.confirm`

**Qué hace:** Exige confirmación explícita del usuario si se supera un umbral definido. Pausa la ejecución del tool, envía el mensaje de confirmación al canal de chat, y espera la respuesta del usuario antes de continuar.

**Cuándo usar:** Para acciones financieras o irreversibles que superan cierto límite: pagos > $500, devoluciones > $200, cancelaciones de contratos. Ejemplos: [01-airline](../../examples/01-airline-flight-change/), [06-retail](../../examples/06-retail-postsale-bot/).

**Cuándo NO usar:** Para acciones de bajo riesgo o reversibles donde la fricción del confirm-gate perjudica la UX.

**Config principal:** `threshold` (expresión de condición), `message` (texto de confirmación al usuario).

**Alternativas:** HITL completo (`hitl.escalate`), verificación manual en el servicio downstream.

---

### `guardrail.idempotency`

**Qué hace:** Hace idempotente un tool transaccional. Al primer llamado con una clave determinada (`keyFields`) guarda el resultado; los llamados subsiguientes con la misma clave devuelven el resultado cacheado sin volver a ejecutar el tool. TTL configurable.

**Cuándo usar:** Para cualquier operación transaccional que no debe ejecutarse dos veces: pagos, devoluciones, confirmaciones de reserva. Crítico en canales con streaming donde las reconexiones pueden generar reintentos. Patrón estándar en pagos (similar a `Idempotency-Key` de Stripe).

**Cuándo NO usar:** Para operaciones de solo lectura (innecesario, sin efecto secundario).

**Config principal:** `keyFields[]` *(requerido)*, `ttl: 24h`.

**Alternativas:** Redis con TTL + clave compuesta, tabla de transacciones en BD con constraint de unicidad, Stripe Idempotency-Key a nivel de API gateway.

---

### `guardrail.resilience`

**Qué hace:** Circuit breaker + retry + fallback. Reintenta el tool N veces ante fallos transitorios. Si la tasa de fallos supera el umbral, abre el circuito (las siguientes llamadas devuelven el `fallbackMessage` directamente sin intentar el servicio). Se recupera automáticamente tras un cooldown.

**Cuándo usar:** Para servicios externos con disponibilidad variable: APIs de pago en horas pico, servicios de inventario, servicios de terceros. Evita que un servicio degradado bloquee al agente en esperas de timeout.

**Cuándo NO usar:** Para servicios internos con alta disponibilidad o para operaciones donde el fallback no es semánticamente válido.

**Config principal:** `retries: 2`, `breakerThreshold: 0.5` (50% de fallos abre el circuito), `fallbackMessage`.

**Alternativas:** `tenacity` (librería Python de retry), `circuitbreaker` library, Istio/Envoy service mesh (resilience a nivel infraestructura), Hystrix (Java).

---

## 12. hitl — Humano en el loop

---

### `hitl.escalate`

**Qué hace:** Interrumpe el flujo del agente y escala el caso a un humano (inspector, revisor, agente senior). La condición de escalación se evalúa **fuera del LLM**, de forma determinista. El flujo se pausa hasta que el humano revisa y aprueba/modifica/rechaza, con un `timeout` configurado. Tras la intervención humana, el flujo se reanuda.

**Cuándo usar:** Para casos donde la consecuencia de una decisión incorrecta del agente es inaceptable: diagnósticos médicos ambiguos ([03-healthcare](../../examples/03-healthcare-prior-auth/)), procedimientos con WARNING en mantenimiento aeronáutico ([08](../../examples/08-manufacturing-maintenance-rag/)), situaciones de alta severidad o complejidad.

**Cuándo NO usar:** Para casos de rutina donde el agente tiene alta confianza. La escalación introduce latencia (horas, no segundos) — úsala solo cuando el riesgo lo justifica.

**Diseño crítico:** La condición `when` debe ser evaluada por el grafo, no por el LLM. Si el LLM decide si escalar, puede "razonar" incorrectamente y no hacerlo. El HITL debe ser un **trip-wire estructural**.

**Config principal:** `when` *(requerido, condición determinista)*, `assignee` (rol o usuario), `timeout` (plazo para la revisión humana).

**Alternativas:** Sistemas de ticketing (Zendesk, Jira Service Management), aprobaciones en Slack/Teams vía webhook, `humanlayer` (librería Python para aprobaciones programáticas).

---

## 13. observability — Auditoría y feedback

---

### `observability.audit`

**Qué hace:** Persiste cada tool call con sus argumentos, resultado, timestamp y contexto de sesión. Actúa como **passthrough**: recibe `Any`, publica el evento al sink configurado (Kafka o log), y pasa el dato al siguiente nodo sin modificarlo. Es el nodo de trazabilidad regulatoria.

**Cuándo usar:** En cualquier flujo donde las acciones del agente deben ser auditables: pagos, decisiones de crédito, autorizaciones médicas, reservas. Ejemplos: [01-airline](../../examples/01-airline-flight-change/), [06-retail](../../examples/06-retail-postsale-bot/), [10-logistics](../../examples/10-logistics-disruption-rebooking/).

**Cuándo NO usar:** En prototipos o flujos de desarrollo sin requisitos regulatorios (añade overhead mínimo pero innecesario).

**Config principal:**

| Campo | Valores | Default |
|-------|---------|---------|
| `sink` | `kafka` / `log` | `log` |
| `topic` | nombre del topic Kafka | — |

**Alternativas:** LangSmith (trazabilidad de LLM + tools), Langfuse (open-source), Datadog APM, OpenTelemetry + Jaeger/Zipkin.

---

### `observability.feedback`

**Qué hace:** Feedback loop: captura señales de calidad (thumbs up/down, callbacks de transacción exitosa) y las almacena en un store de feedback. El `feedbackRef` en el `retrieval.reranker` puede usarse para fine-tune continuo del modelo de reranking.

**Cuándo usar:** En sistemas en producción donde quieres mejorar el retrieval con el tiempo, usando las preferencias reales de los usuarios. Ejemplo clave: [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/).

**Cuándo NO usar:** En prototipos o cuando no hay un proceso definido para consumir el feedback y re-entrenar.

**Config principal:** `store` *(requerido)*, `signals[]` — tipos de señal a capturar (p.ej. `thumbs`, `txn_callback`).

**Alternativas:** LangSmith datasets + human feedback, Argilla (plataforma open-source de anotación), Weights & Biases feedback logging.

---

### `observability.metrics`

**Qué hace:** Exporta métricas operacionales via OpenTelemetry (OTLP): throughput de eventos procesados, tasa de auto-confirm vs decisión por LLM, latencia por prioridad, errores. Las métricas se visualizan en Prometheus/Grafana o en un APM cloud.

**Cuándo usar:** En producción para monitorear la salud del sistema, detectar degradaciones y tener visibilidad durante eventos críticos (disrupciones masivas, picos de tráfico). Ejemplo: [10-logistics](../../examples/10-logistics-disruption-rebooking/) con métricas de rebooking en tiempo real durante una crisis.

**Cuándo NO usar:** En desarrollo/prototipo sin infraestructura de observabilidad.

**Config principal:** `exporter: otlp`.

**Alternativas:** Prometheus + Grafana (pull), Datadog APM, New Relic, AWS CloudWatch. LangSmith y Langfuse también exportan métricas de LLM (tokens, latencia, costo) que complementan las métricas de infraestructura de OTLP.

---

## Resumen: los 53 nodos y sus categorías

| Categoría | Nodos (`type`) | Total |
|-----------|----------------|-------|
| io | `io.input`, `io.stt`, `io.event-source`, `io.trigger`, `io.batch`, `io.output`, `io.notify`, `io.panel` | 8 |
| loader | `loader.pdf`, `loader.multimodal`, `loader.tabular`, `loader.web`, `loader.s3`, `loader.sql` | 6 |
| ingest | `ingest.chunker`, `ingest.metadata` | 2 |
| store | `store.pgvector`, `store.qdrant`, `store.chroma`, `store.neo4j`, `store.multi-index` | 5 |
| retrieval | `retrieval.vector`, `retrieval.graph`, `retrieval.hybrid`, `retrieval.router`, `retrieval.parent-child`, `retrieval.reranker` | 6 |
| model | `model.llm`, `model.embedding`, `model.vision`, `model.intent` | 4 |
| query | `query.rewrite`, `query.intent` | 2 |
| logic | `logic.prompt`, `logic.structured`, `logic.rules`, `logic.router`, `logic.citations` | 5 |
| agent | `agent.react`, `agent.fanout` | 2 |
| tool | `tool.service`, `tool.http`, `tool.function`, `tool.mcp`, `tool.retriever` | 5 |
| guardrail | `guardrail.pre-tool`, `guardrail.confirm`, `guardrail.idempotency`, `guardrail.resilience` | 4 |
| hitl | `hitl.escalate` | 1 |
| observability | `observability.audit`, `observability.feedback`, `observability.metrics` | 3 |
| **Total** | | **53** |

---

*Este catálogo es referencia cruzada con [`glosario.md`](./glosario.md) (definiciones de términos) y [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) (tablas comparativas de opciones en cada categoría).*

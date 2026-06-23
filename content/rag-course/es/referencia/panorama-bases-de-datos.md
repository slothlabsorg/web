# Panorama de bases de datos y almacenamiento para RAG y sistemas agénticos

> Referencia ampliada del curso **RAG & Agentic AI**. Complementa la tabla de siete vector stores de [M3](../03-embeddings-y-stores/guia.md) y [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores) con el **mapa completo del mercado** a 2025/2026: familias, cuándo conviene cada una, cuándo NO, y talones de Aquiles honestos.
>
> **Audiencia:** programas en Python, ya domina embeddings, índices ANN (flat / IVF / HNSW — ver [M3 §6](../03-embeddings-y-stores/guia.md#6-tipos-de-índice-flat-ivf-hnsw)) y los siete stores del curso. Aquí aprendes **dónde encajan el resto** y cómo decidir sin añadir piezas de más.

---

## Introducción: la decisión no es solo «Chroma vs Pinecone»

En RAG y agentes, la pregunta real es **dónde viven los vectores, los metadatos, los documentos crudos, las relaciones y el estado de la conversación**. Eso no se resuelve con una sola categoría de producto. El mercado se organiza en **familias** con solapamientos deliberados: un motor de búsqueda puede indexar vectores; Postgres puede ser tu única base; un grafo puede tener embeddings en cada nodo.

La regla del curso sigue vigente: **elige el store por requisitos de negocio** (filtros, compliance, escala, equipo ops), no por el tutorial que leíste primero. Los índices ANN (HNSW, IVF…) son **mecanismos** compartidos por muchas familias — no confundas «tengo HNSW» con «tengo la base de datos correcta».

### Tabla resumen de familias

| Familia | Qué almacena principalmente | Fortaleza en RAG/agéntico | Riesgo típico |
|---------|------------------------------|---------------------------|---------------|
| **Vector DB dedicada** | Embeddings + payload/metadata | ANN optimizado, filtros de payload, APIs de retrieval | Otra pieza más en el stack si ya tienes SQL/search |
| **Relacional + extensión vectorial** | Filas SQL + columna `vector` | Joins, ACID, filtros complejos, un solo sistema | Escala ANN limitada vs motores dedicados |
| **Motor de búsqueda / híbrido** | Inverted index (BM25) + vectores | Keyword + semántico en un motor, facets, relevancia web | Complejidad de cluster y tuning de scoring |
| **Document/NoSQL + vector** | Documentos JSON + índice vectorial | «Ya tengo mis docs ahí» — un solo lugar | Vector search secundario; menos maduro que lo nativo |
| **Grafo / knowledge graph** | Nodos, aristas, a veces embeddings | GraphRAG, relaciones, multi-hop | Modelado y mantenimiento del grafo costosos |
| **Librería ANN (no BD)** | Solo vectores (FAISS, hnswlib…) | Velocidad extrema, control total | CRUD, filtros y multi-tenant a mano |
| **Especializados** | Features, caché semántica, objetos, metadatos | Complemento — no sustituyen el índice principal | Usarlos como «vector DB» por moda |

### Cómo elegir a nivel familia (antes de elegir producto)

1. **¿Los datos ya viven en un sistema?** Si sí, empieza por extender ese sistema (Postgres → pgvector; Elasticsearch → dense_vector; Mongo → Atlas Vector Search) antes de añadir Qdrant o Pinecone.
2. **¿Necesitas BM25 + vector en producción sin fusionar tú?** Motores híbridos (OpenSearch, Vespa, Weaviate, Redis Stack) suelen ganar a «vector puro + BM25 aparte».
3. **¿Las relaciones importan tanto como el texto?** Familia grafo + [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph) (M4).
4. **¿Volumen y latencia extremos con equipo de plataforma?** Vector DB dedicada o librería (FAISS/Milvus) con ops explícito.
5. **¿Prototipo o < 100k chunks?** Embebido o in-memory — ver [§7](#7-cuándo-no-necesitas-una-vector-db).

---

## 1. Vector DBs dedicadas

Una **vector database dedicada** expone colecciones de embeddings, búsqueda ANN, CRUD sobre vectores y metadatos, y persistencia como contrato de producto. No es lo mismo que una **librería ANN** embebida en tu proceso (FAISS, hnswlib): la librería resuelve «encuentra vecinos»; la BD resuelve «servicio de retrieval con identidades, filtros y operaciones concurrentes».

### Los siete del curso (referencia, no repetición)

Chroma, FAISS, pgvector, Qdrant, Pinecone, Weaviate y Milvus están comparados en [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores) y profundizados en [M3 §12](../03-embeddings-y-stores/guia.md#12-comparativa-de-vector-stores). Nodos RAGorbit: [`store.chroma`](./catalogo-nodos.md#storechroma), [`store.pgvector`](./catalogo-nodos.md#storepgvector), [`store.qdrant`](./catalogo-nodos.md#storeqdrant).

| Store del curso | Rol en una arquitectura más amplia |
|-----------------|-------------------------------------|
| Chroma / FAISS | Prototipo, edge, batch offline |
| pgvector | «Una sola base» cuando Postgres ya manda |
| Qdrant / Milvus | Escala ANN dedicada on-prem o híbrida |
| Pinecone | SaaS zero-ops, multi-tenant cloud |
| Weaviate | Vector + BM25 + grafo ligero en un producto |

### Dedicada vs librería ANN

| Aspecto | BD vectorial dedicada | Librería (FAISS, hnswlib, Annoy, ScaNN) |
|---------|----------------------|----------------------------------------|
| **API de producto** | Colecciones, IDs, metadata, delete/update | Matrices + índice en memoria/archivo |
| **Filtros de negocio** | Payload / SQL según producto | Externo: tú mantienes mapa id → metadata |
| **Concurrencia** | Servidor o servicio gestionado | Un proceso; locking manual |
| **Persistencia** | Snapshots, WAL, replicación | `write_index` / pickle — diseño tuyo |
| **Cuándo preferir** | Servicio RAG multi-usuario, producción | Benchmark, pipeline batch, 100M+ con control fino |

**FAISS** (Meta): referencia en velocidad y variantes IVF/PQ/GPU; usado detrás de muchos sistemas. **hnswlib**: HNSW minimalista, base de Chroma/Qdrant internamente en variantes. **Annoy** (Spotify): árbol random, bueno para índices estáticos en disco. **ScaNN** (Google): fuerte en recall/velocidad; más habitual en pipelines de investigación o integraciones específicas que como «BD» standalone.

**Cuándo NO usar solo una librería:** filtros metadata complejos, borrados frecuentes, varios servicios escribiendo, auditoría de qué chunk está indexado. Ahí subes a Qdrant, pgvector o un motor híbrido.

### LanceDB

**Qué hace:** Base vectorial **embebida** orientada a columnas (Apache Arrow / Lance). Corre en proceso o como servicio; integración natural con Python y ecosistema ML (datasets grandes, multimodal).

**Cuándo usar:** Prototipos y pipelines de datos donde ya usas Arrow/Pandas/Polars; almacenamiento local con buen rendimiento en lecturas analíticas; RAG sobre imágenes/audio con columnas heterogéneas en un mismo dataset.

**Cuándo NO usar:** Necesidad de cluster multi-nodo maduro comparable a Milvus/Qdrant Cloud; filtros transaccionales complejos tipo SQL enterprise; equipos que solo conocen Postgres y no quieren otro modelo mental columnar.

**Talón de Aquiles:** ecosistema más joven que Pinecone/Qdrant en despliegues enterprise multi-región; verifica SLA y roadmap de servidor distribuido para tu escala.

### Vald

**Qué hace:** Motor de búsqueda vectorial distribuido (origen Yahoo Japan / Linux Foundation AI & Data), diseñado para **escala masiva** y auto-recovery en Kubernetes.

**Cuándo usar:** Decenas/cientos de millones de vectores, despliegue K8s, equipos con SRE; casos tipo recomendación o búsqueda a escala portal.

**Cuándo NO usar:** Demos en laptop; equipos sin capacidad de operar un sistema distribuido; RAG corporativo pequeño con Postgres suficiente.

**Talón de Aquiles:** curva operativa alta; documentación y comunidad más pequeñas que Milvus/Qdrant fuera de Japón.

### Marqo

**Qué hace:** Motor de búsqueda **tensorial** open source: embeddings end-to-end (modelo integrado o BYO), API tipo search engine sobre texto e imagen.

**Cuándo usar:** Multimodal RAG (texto + imagen) donde quieres un solo producto que embedea e indexa; equipos que prefieren «search engine» a ensamblar embedding service + vector DB.

**Cuándo NO usar:** Debes fijar un embedding concreto por compliance y no cambiar; necesitas joins SQL con sistemas legacy; stack ya estandarizado en OpenSearch + modelo externo.

**Talón de Aquiles:** acoplamiento modelo–índice si usas defaults de Marqo; cambiar modelo implica re-indexar (como en cualquier RAG, pero aquí el producto lo enfatiza).

### Vespa

**Qué hace:** Motor de **búsqueda y ranking** a escala web (Yahoo/Oath heritage): BM25, vectores densos, aprendizaje to rank, serving de baja latencia en cluster. Aparece también en [§3](#3-motores-de-búsqueda--híbrido-keyword--vector) por su naturaleza híbrida.

**Cuándo usar:** Producción con millones de documentos, ranking sofisticado (features, filtros, freshness), búsqueda híbrida nativa a escala; equipos con experiencia en search engines.

**Cuándo NO usar:** MVP en un solo contenedor; organizaciones sin DevOps de search; casos donde pgvector + reranker bastan.

**Talón de Aquiles:** complejidad de modelado (schemas, rank profiles); tiempo de aprendizaje >> que Chroma o Pinecone.

### Turbopuffer

**Qué hace:** Almacén vectorial **serverless** orientado a object storage (precios por GB almacenado + consultas), namespaces, filtros; posicionado como alternativa cloud-native a Pinecone para cargas variables.

**Cuándo usar:** SaaS multi-tenant con picos de tráfico; coste sensible al almacenamiento frío; quieres API gestionada sin operar cluster.

**Cuándo NO usar:** On-prem obligatorio; latencia ultra-baja con SLA sub-10 ms sin evaluar; necesitas SQL joins in-database.

**Talón de Aquiles:** proveedor más reciente — evalúa límites de filtros, regiones y contrato enterprise; datos volátiles a 2025/2026.

### Chroma Cloud

**Qué hace:** Versión **gestionada** de Chroma (misma API mental que [`store.chroma`](./catalogo-nodos.md#storechroma)), con persistencia y acceso remoto sin servidor embebido en tu proceso.

**Cuándo usar:** Migración natural desde prototipos Chroma locales; equipos pequeños que quieren managed sin cambiar código LangChain/LlamaIndex.

**Cuándo NO usar:** Requisitos estrictos de región/soberanía no cubiertos; escala o filtros que exigen Qdrant/Milvus; producción multi-instancia que ya debería estar en pgvector/Qdrant.

**Talón de Aquiles:** historial de Chroma embebido con limitaciones de concurrencia — Cloud resuelve acceso remoto, pero no convierte Chroma en Milvus; valida límites de colección y pricing.

### Cómo elegir dentro de las dedicadas

| Situación | Sesgo razonable |
|-----------|-----------------|
| Curso / demo / RRHH template | Chroma → [`store.chroma`](./catalogo-nodos.md#storechroma) |
| Producción Rust, filtros payload | Qdrant → [`store.qdrant`](./catalogo-nodos.md#storeqdrant) |
| Sin ops, cloud | Pinecone, Turbopuffer, Qdrant Cloud, Chroma Cloud |
| Escala billones, equipo plataforma | Milvus, Vald, Vespa |
| ML pipeline columnar local | LanceDB |
| Multimodal «todo en uno» | Marqo, Weaviate |

**Anti-patrón:** elegir Milvus o Vespa en el día 1 porque «escalan a Google» con 50k PDFs.

---

## 2. Bases relacionales con extensión vectorial

Aquí el vector es **una columna más** en un motor SQL (o SQL-compatible). Ganas transacciones, joins, roles, backups y herramientas que tu organización ya auditó.

### pgvector

**Qué hace:** Extensión open source para PostgreSQL: tipo `vector`, operadores de distancia, índices IVFFlat y HNSW (según versión).

**Cuándo usar:** Ya tienes Postgres; filtros duros + joins (template Banca); compliance ACID. Nodo: [`store.pgvector`](./catalogo-nodos.md#storepgvector).

**Cuándo NO usar:** > ~5–10M vectores sin benchmark (regla práctica del curso); latencia ANN más agresiva que Qdrant dedicado.

**Talón de Aquiles:** ANN bajo carga mixta OLTP + búsqueda vectorial — requiere tuning de índices y connection pooling.

Detalle en [M3](../03-embeddings-y-stores/guia.md) y [§3 tecnologias-comparadas](./tecnologias-comparadas.md#3-vector-stores).

### pgvecto.rs

**Qué hace:** Extensión alternativa para Postgres escrita en Rust, con tipos vectoriales y métodos ANN propios (incluye variantes beyond classic HNSW en evolución a 2025/2026).

**Cuándo usar:** Postgres obligatorio pero necesitas exprimir rendimiento ANN sin salir del ecosistema; experimentación con índices más recientes que pgvector estándar.

**Cuándo NO usar:** Entornos donde solo extensiones «blessed» por cloud provider están permitidas (verifica RDS/Aurora — pgvector suele estar soportado antes que pgvecto.rs).

**Talón de Aquiles:** menor adopción que pgvector; migración y operación en cloud managed requiere verificación explícita.

### sqlite-vss / sqlite-vec

**Qué hace:** Extensiones vectoriales para **SQLite**: índice ANN embebido en un archivo `.db`, cero servidor.

**Cuándo usar:** Apps desktop/edge, prototipos offline, tests de integración, agentes locales con un solo archivo de persistencia.

**Cuándo NO usar:** Concurrencia de escritura multi-proceso; servicios RAG centralizados; datasets > cientos de miles de vectores sin medir.

**Talón de Aquiles:** SQLite serializa escrituras; no es sustituto de Postgres en multi-tenant concurrente.

### DuckDB (VSS)

**Qué hace:** DuckDB con extensión **VSS** (vector similarity search): analítica columnar + ANN en proceso, ideal para parquet y pipelines locales.

**Cuándo usar:** RAG sobre datos ya en Parquet/DuckDB; batch retrieval en notebooks; feature stores ligeros co-locados con agregaciones SQL.

**Cuándo NO usar:** API de producción multi-usuario con alta concurrencia de escritura; necesitas replicación HA estándar Postgres.

**Talón de Aquiles:** modelo «analítico embebido», no OLTP web típico.

### SingleStore

**Qué hace:** Base **SQL distribuida** (memoria + columnar) con tipo vector y búsqueda ANN integrada en el mismo cluster que cargas HTAP.

**Cuándo usar:** Ya usas SingleStore para analytics/transaccional híbrido y quieres evitar otro sistema solo por vectores; latencia unificada SQL + vector.

**Cuándo NO usar:** Greenfield RAG donde Postgres pgvector basta; presupuesto limitado — licencia/complexity vs Postgres open source.

**Talón de Aquiles:** coste y lock-in vendor; overkill si solo necesitas retrieval documental.

### ClickHouse

**Qué hace:** OLAP columnar extremadamente rápido; soporte de **índices vectoriales** y funciones de distancia en evolución (ver docs vigentes a 2025/2026).

**Cuándo usar:** Logs, eventos, telemetría + embeddings de sesión; RAG sobre corpus masivo append-only; agregaciones y retrieval en el mismo lugar.

**Cuándo NO usar:** CRUD fino por documento legal; transacciones row-level típicas de CMS; equipos sin experiencia ClickHouse.

**Talón de Aquiles:** optimizado para ingest/analytics — mutaciones y updates frecuentes de chunks no son su fuerte natural.

### Cómo elegir «tu SQL ya alcanza»

```
¿Postgres (o SQL) ya es source of truth operacional?
  SÍ → pgvector (o pgvecto.rs si benchmark gana)
  NO → ¿Solo archivo local / edge?
         SÍ → sqlite-vec / DuckDB VSS
         NO → ¿OLAP masivo append-only?
                SÍ → ClickHouse
                NO → ¿HTAP enterprise ya desplegado?
                       SÍ → SingleStore
                       NO → familia vector DB dedicada (§1)
```

**Ventaja clave:** un `JOIN` entre `chunks` y `customers` en la misma transacción — ninguna vector DB pura lo iguala sin ETL. **Riesgo clave:** mezclar OLTP pesado con HNSW sin aislar lecturas puede degradar ambos.

---

## 3. Motores de búsqueda / híbrido (keyword + vector)

Estos productos nacieron para **relevancia de búsqueda web**: tokenización, BM25, facets, highlighting, aprendizaje to rank. Añadir vectores densos permite **híbrido nativo** (sparse + dense) con un solo cluster — el patrón que [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid) implementa en RAGorbit (M4).

### Elasticsearch

**Qué hace:** Motor de búsqueda distribuido (Elastic); índices con `dense_vector`, kNN, y queries que combinan BM25 con vector (APIs evolucionaron 2023–2025).

**Cuándo usar:** Ya tienes cluster Elastic para logs o catálogo; necesitas facets, analyzers por idioma, seguridad Elastic Stack; híbrido en producción sin dos sistemas.

**Cuándo NO usar:** Proyecto greenfield sin ops Elastic — complejidad alta; presupuesto cloud Elastic sensible a nodos calientes.

**Talón de Aquiles:** coste operativo y licenciamiento (Elastic License vs OSS fork); tuning de shards/replicas no trivial.

### OpenSearch

**Qué hace:** Fork open source de Elasticsearch (Linux Foundation / AWS); k-NN plugin (FAISS/HNSW backends), búsqueda híbrida, integración AWS.

**Cuándo usar:** Preferencia OSS; despliegue en AWS OpenSearch Service; mismos casos que Elastic con stack open.

**Cuándo NO usar:** Necesitas features exclusivas del stack Elastic comercial muy recientes — compara release notes.

**Talón de Aquiles:** divergencia gradual vs Elastic; valida plugins k-NN en tu versión concreta.

### Vespa

(Véase también [§1](#vespa).) Destaca cuando **ranking** y serving a escala son el centro, no solo «almacenar embeddings».

### Typesense

**Qué hace:** Motor de búsqueda OSS **ligero**, typo-tolerance, API simple; soporte vectorial añadido en releases recientes (ver docs 2025/2026).

**Cuándo usar:** Catálogos e-commerce, documentación pública, búsqueda instantánea con UX tipo Algolia pero self-host; volúmenes medianos.

**Cuándo NO usar:** Billones de documentos; rank learning extremo; grafos multi-hop.

**Talón de Aquiles:** ecosistema enterprise (IAM, compliance) menos profundo que Elastic/OpenSearch a gran escala.

### Meilisearch

**Qué hace:** Motor de búsqueda **developer-friendly**, rápido de desplegar; vectores híbridos en evolución (confirmar capacidades en tu versión).

**Cuándo usar:** Búsqueda en producto SaaS pequeño/mediano; prioridad time-to-market sobre cluster Elastic.

**Cuándo NO usar:** Requisitos de clustering geo-distributed maduros; RAG con filtros metadata muy complejos sin evaluar límites.

**Talón de Aquiles:** no compite con Vespa/Elastic en personalización de ranking a escala web masiva.

### Redis (RediSearch / Redis Stack)

**Qué hace:** Índices invertidos en memoria + campos vectoriales (HNSW) en Redis Stack; latencia sub-ms para datasets que caben en RAM.

**Cuándo usar:** Caché de retrieval caliente; sesiones de agente; híbrido sobre catálogos medianos ya en Redis; combinar con caché semántica (§6).

**Cuándo NO usar:** Corpus que no cabe en memoria RAM costeable; persistencia a largo plazo como único archive — Redis es complemento, no data lake.

**Talón de Aquiles:** coste RAM; durabilidad y tamaño limitados vs disco-first (Qdrant, OpenSearch).

### Cuándo el híbrido nativo gana

| Señal | Motores híbridos suelen ganar |
|-------|------------------------------|
| Códigos, SKUs, IDs junto a lenguaje natural | BM25 + vector en un query |
| Facets («marca», «jurisdicción», «fecha») | Elastic/OpenSearch/Vespa |
| Un solo equipo ops de «search» | Evitas sync vector DB ↔ Elasticsearch |
| Latencia P95 estricta con índice caliente | Redis Stack, Vespa |

**Cuándo NO:** solo preguntas parafraseadas sin términos exactos, corpus homogéneo — Chroma/pgvector + [`retrieval.vector`](./catalogo-nodos.md#retrievalvector) puede bastar (M4).

**Fusión:** en RAGorbit se recomienda RRF en [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid); motores nativos ofrecen sus propios blend scores — evalúa con tu benchmark, no asumas superioridad automática.

---

## 4. Document / NoSQL con vector

Patrón: **el documento JSON (o wide-column row) ya vive ahí**; el índice vectorial es un add-on. Reduce ETL si tu CMS, catálogo o app ya persiste en ese store.

### MongoDB Atlas Vector Search

**Qué hace:** Índice vectorial sobre colecciones MongoDB en Atlas (y despliegues compatibles), filtros sobre campos del documento, integración con aggregation pipeline.

**Cuándo usar:** Stack MEAN/MERN; contenido ya en Mongo; equipos que quieren un solo proveedor cloud para docs + vectors.

**Cuándo NO usar:** On-prem sin Atlas Vector Search; necesitas SQL joins; ANN a escala extrema sin benchmark vs Qdrant.

**Talón de Aquiles:** calidad ANN y límites dependen de tier Atlas; lock-in MongoDB cloud para features gestionadas.

### Couchbase

**Qué hace:** NoSQL JSON + memoria/disco; capacidades de búsqueda vectorial en Capella / Server (evolución 2024–2026).

**Cuándo usar:** Apps móviles/edge con sync Couchbase ya desplegado; catálogos con cache integrado.

**Cuándo NO usar:** RAG greenfield sin Couchbase; equipos 100 % Postgres.

**Talón de Aquiles:** comunidad RAG más pequeña que Mongo/Postgres — menos ejemplos en LangChain/LlamaIndex.

### Cassandra / Astra DB (DataStax)

**Qué hace:** Wide-column distribuida; Astra DB añade Vector Search sobre datos en Cassandra gestionado.

**Cuándo usar:** Escala horizontal masiva, multi-región, datos ya en Cassandra; event sourcing + embeddings de eventos.

**Cuándo NO usar:** RAG documental clásico con updates frecuentes por chunk; equipos sin experiencia Cassandra.

**Talón de Aquiles:** modelo de consistencia eventual — diseño de particionado crítico; no ideal para «un PDF = muchas actualizaciones finas» sin planificar.

### Azure Cosmos DB

**Qué hace:** Multi-modelo globalmente distribuido; **Vector Search** en API MongoDB / NoSQL (según región y modo a 2025/2026).

**Cuándo usar:** Estándar Microsoft Azure; SLAs globales; integración con Azure OpenAI en el mismo tenant.

**Cuándo NO usar:** Multi-cloud sin Azure; coste impredecible sin capacity planning — RU/s + vector puede sorprender.

**Talón de Aquiles:** complejidad de modos de consistencia y pricing; latencia cross-partition en queries mal modeladas.

### Cómo elegir «ya tengo mis documentos ahí»

| Pregunta | Si «sí» |
|----------|---------|
| ¿Actualizas documentos frecuentemente in-place? | NoSQL con vector integrado evita dual-write |
| ¿Necesitas joins con ERP SQL? | Mejor pgvector + ETL desde Mongo, no Mongo solo |
| ¿Multi-región activo-activo? | Cassandra/Astra/Cosmos — con ojos en coste |
| ¿Equipo < 3 devs sin DBA? | Postgres/Atlas managed > Cassandra DIY |

**Anti-patrón:** duplicar todo el corpus en Mongo **y** Pinecone **y** S3 sin pipeline de sync versionado — drift garantizado.

---

## 5. Bases de grafos / knowledge graphs (GraphRAG)

Aquí el retrieval no es solo «chunks similares», sino **entidades y relaciones**: `(Cláusula)-[:REFERENCIA]->(Artículo)`, `(Síntoma)-[:INDICA]->(Diagnóstico)`. En RAGorbit: [`store.neo4j`](./catalogo-nodos.md#storeneo4j) + [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph). Profundiza en [M4 §10 GraphRAG](../04-retrieval-y-query/guia.md#10-graphrag-y-knowledge-graphs-neo4j).

### Neo4j

**Qué hace:** Grafo property graph nativo; Cypher; índices vectoriales sobre nodos; traversal multi-hop.

**Cuándo usar:** GraphRAG con relaciones explícitas; template Legal; compliance con linaje entre entidades.

**Cuándo NO usar:** Corpus sin estructura relacional extractible; MVP donde vector puro alcanza.

**Talón de Aquiles:** coste enterprise y RAM en grafos grandes; modelado incorrecto → peor que vector solo.

### Memgraph

**Qué hace:** Grafo en memoria (C++), compatible con Cypher en gran parte; baja latencia para traversals.

**Cuándo usar:** Grafos que caben en RAM; streaming de relaciones; latencia sub-ms en hops.

**Cuándo NO usar:** Grafos > memoria disponible sin sharding maduro; equipos acostumbrados solo a Neo4j Aura tooling.

**Talón de Aquiles:** persistencia y ecosistema enterprise diferentes a Neo4j — valida backup/HA.

### Kùzu

**Qué hace:** Embeddable graph DB (columnar, C++), integración Python; orientado a analytics graph local / medium scale.

**Cuándo usar:** Prototipos GraphRAG en notebook; pipelines analíticos graph + Python sin servidor Neo4j.

**Cuándo NO usar:** Producción multi-tenant con ACLs finos enterprise; grafos dinámicos enormes en cloud.

**Talón de Aquiles:** más joven en producción cloud managed que Neo4j.

### ArangoDB

**Qué hace:** Multi-modelo (documento + grafo + key-value); AQL; búsqueda vectorial en documentos y grafos.

**Cuándo usar:** Quieres documento JSON **y** aristas en un solo motor sin Neo4j + Mongo separados.

**Cuándo NO usar:** Solo necesitas vector denso sin relaciones — Arango añade complejidad; performance graph puro vs Neo4j/Memgraph según benchmark.

**Talón de Aquiles:** «hace todo» puede significar «no es el mejor en cada submodo».

### TigerGraph

**Qué hace:** Grafo distribuido paralelo (GSQL), analytics y ML graph a escala.

**Cuándo usar:** Grafos masivos (fraude, telco, supply chain); traversals paralelos complejos.

**Cuándo NO usar:** RAG documental típico; equipos pequeños — curva GSQL + ops.

**Talón de Aquiles:** integración LLM menos estándar que Neo4j en tutoriales RAG; licenciamiento enterprise.

### Cuándo las relaciones importan más que la similitud

| Señal | GraphRAG |
|-------|----------|
| Preguntas «¿qué está conectado con X en 2 saltos?» | Sí |
| Citas legales cruzadas entre cláusulas | Sí |
| FAQ homogénea de RRHH | No — [`store.chroma`](./catalogo-nodos.md#storechroma) |
| Microsoft GraphRAG «resumen global del corpus» | Grafo + comunidades — ver M4 § Microsoft GraphRAG |

**Combinación habitual:** vector encuentra nodo semilla → traversal expande contexto → LLM responde con subgrafo.

---

## 6. Almacenes especializados (complementos, no sustitutos)

Estos componentes **no reemplazan** el índice vectorial principal; resuelven capas adyacentes en arquitecturas RAG/agénticas maduras.

### Feature stores (Feast)

**Qué hace:** Registro y serving de **features** ML (online/offline), consistencia entre entrenamiento e inferencia.

**Cuándo usar:** RAG personalizado por usuario con features (segmento, riesgo, historial) inyectadas en filtros o reranking; MLOps ya usa Feast.

**Cuándo NO usar:** RAG documental estático — es overhead.

**Talón de Aquiles:** no almacena chunks ni embeddings de corpus por defecto — confusión frecuente.

### Caché semántica (GPTCache, Redis)

**Qué hace:** Cachea respuestas (o embeddings de query) por **similitud semántica** de la pregunta, no solo hash exacto.

**Cuándo usar:** Preguntas repetidas casi idénticas en wording; reducir costo LLM + embedding en producción.

**Cuándo NO usar:** Datos freshness crítica (políticas que cambian hourly); compliance que exige retrieval fresco siempre.

**Talón de Aquiles:** cache hit incorrecto si umbral de similitud mal calibrado — riesgo de respuestas obsoletas.

### Almacenamiento de objetos (S3, MinIO, GCS, Azure Blob)

**Qué hace:** **Documentos crudos** (PDF, HTML, audio) y artefactos de ingesta; no ANN.

**Cuándo usar:** Source of truth inmutable; [`io.batch`](../referencia/catalogo-nodos.md#iobatch) leyendo buckets; versionado de corpus.

**Cuándo NO usar:** Búsqueda vectorial directa sobre S3 sin indexar — anti-patrón clásico.

**Patrón:** S3 (raw) → pipeline ingesta → vector store (chunks) + metadata pointer `s3://key`.

### Dónde viven los metadatos

| Tipo de metadata | Dónde suele vivir | Notas |
|------------------|-------------------|-------|
| Filtros de retrieval (`department`, `jurisdiction`) | Payload vector / columna SQL indexada | Debe estar en el mismo motor que ANN o sincronizado |
| Linaje de ingesta (hash, versión doc) | Postgres o object metadata | Auditoría |
| ACL por tenant | SQL, Elastic security, Qdrant payload | Multi-tenant: filtrar **antes** de top-k |
| Estado conversación agente | Postgres, Redis, LangGraph checkpointer | No confundir con vector store |
| Trazas evaluación | Langfuse, LangSmith, OTel | Observabilidad — §12 tecnologias-comparadas |

[`store.multi-index`](./catalogo-nodos.md#storemulti-index) agrupa **varios índices vectoriales** bajo nombres (`policy`, `faq`) — los metadatos de routing viven en reglas de [`retrieval.router`](./catalogo-nodos.md#retrievalrouter), no sustituyen un feature store.

---

## 7. ¿Cuándo NO necesitas una vector DB?

No toda arquitectura RAG requiere Qdrant, Pinecone ni pgvector con HNSW. A veces añadir un servicio es **deuda**, no solución.

### In-memory (NumPy, dict, FAISS flat)

**Cuándo basta:** < 10k–50k chunks; demo; tests; batch offline. FAISS `IndexFlatIP` o lista de vectores en NumPy — recall 100%, cero ops.

**Cuándo NO:** Servicio web concurrente; persistencia durable sin diseño; memoria RAM insuficiente.

### Grep / BM25 puro

**Cuándo basta:** Logs, código, IDs, números de parte, SKUs; usuarios escriben términos exactos. `ripgrep`, Whoosh, rank-bm25 en Python.

**Cuándo NO:** Parafraseo libre, sinónimos, preguntas en lenguaje natural — ahí entran embeddings (M3) o híbrido (M4).

### Contexto largo (long-context LLM)

**Cuándo basta:** Corpus cabe en ventana (p. ej. 128k–1M tokens) y se consulta entero pocas veces; análisis ad hoc de un contrato único.

**Cuándo NO:** Miles de documentos actualizables; costo por token prohibitivo; necesitas citas granulares a chunk — RAG sigue ganando.

### Datos pequeños y estables

**Cuándo basta:** 20 PDFs de política interna, actualización trimestral — Chroma embebido o incluso JSON + embedding en SQLite.

**Señal de alarma:** contratar Pinecone antes de medir latencia de un índice flat local.

### Tabla rápida «skip vector DB»

| Condición | Alternativa |
|-----------|-------------|
| < 100k vectores, un proceso | FAISS flat / Chroma local |
| Solo términos exactos | BM25 / grep |
| Un documento grande por sesión | Long context + caching |
| Prototipo 1 semana | [`store.chroma`](./catalogo-nodos.md#storechroma) embebido |

---

## 8. Tabla de decisión maestra

### Por escenario

| Escenario | Sesgo primario | Alternativa válida | Evitar |
|-----------|----------------|-------------------|--------|
| **Prototipo / curso / RRHH** | [`store.chroma`](./catalogo-nodos.md#storechroma) | LanceDB, sqlite-vec | Pinecone/Milvus day 1 |
| **Ya tengo Postgres, filtros SQL** | [`store.pgvector`](./catalogo-nodos.md#storepgvector) | pgvecto.rs | Segunda BD sin motivo |
| **Producción ANN, filtros payload, Rust** | [`store.qdrant`](./catalogo-nodos.md#storeqdrant) | Weaviate, Milvus | FAISS solo con filtros complejos |
| **Zero ops cloud** | Pinecone, Turbopuffer, Qdrant Cloud | Chroma Cloud | Self-host Vald sin SRE |
| **Híbrido BM25+vector nativo** | OpenSearch, Elastic, Vespa | Weaviate, Redis Stack | Vector puro + sync manual frágil |
| **Catálogo e-commerce search UX** | Typesense, Meilisearch | Elastic | pgvector solo |
| **Docs ya en MongoDB Atlas** | Atlas Vector Search | + reranker externo | Duplicar en Pinecone sin sync |
| **Multi-región NoSQL** | Cosmos, Astra Vector | — | Neo4j como único store docs |
| **GraphRAG / relaciones** | [`store.neo4j`](./catalogo-nodos.md#storeneo4j) | Memgraph, ArangoDB | Vector solo en legal/compliance |
| **Varios corpus aislados** | [`store.multi-index`](./catalogo-nodos.md#storemulti-index) + [`retrieval.router`](./catalogo-nodos.md#retrievalrouter) | Colecciones separadas por tenant | Un índice gigante sin metadata |
| **Telemetría + embeddings sesión** | ClickHouse, Redis | — | Postgres OLTP |
| **Batch 100M+ offline** | FAISS IVF/PQ, Milvus, Vald | — | Chroma embebido |
| **Edge / offline single file** | sqlite-vec, DuckDB VSS | LanceDB | Cluster Elastic |

### Por volumen (reglas prácticas, no leyes)

| Vectores (orden de magnitud) | Enfoque típico |
|------------------------------|----------------|
| < 100k | Flat / embebido / SQLite |
| 100k – 5M | HNSW (pgvector, Qdrant, OpenSearch) |
| 5M – 100M | Vector DB dedicada o pgvector benchmarked |
| 100M+ | Milvus, Vald, Vespa, FAISS+PQ batch; equipo ops |

Ajusta según dimensión embedding, QPS y filtros selectivos — [M3 §6](../03-embeddings-y-stores/guia.md#6-tipos-de-índice-flat-ivf-hnsw).

### Multi-tenant

- **Filtro obligatorio** en cada query (`tenant_id`) — mismo índice con payload vs índice por tenant.
- SaaS: Pinecone namespaces, Qdrant collections, Elastic index-per-tenant según aislamiento.
- **Anti-patrón:** mezclar datos de clientes sin filtro en ANN — fuga de contexto entre tenants.

### On-prem vs SaaS

| On-prem / self-host | SaaS managed |
|---------------------|--------------|
| pgvector, Qdrant, Milvus, OpenSearch, Neo4j | Pinecone, Turbopuffer, Atlas, Cosmos, Qdrant Cloud |
| Datos regulados, air-gap | Time-to-market, ops mínimo |
| Tú pagas GPU/CPU/RAM | Pagas por dimensión + QPS + storage |

### Anti-patrones (resumen)

1. **Vector DB antes de medir** — empieza simple ([§7](#7-cuándo-no-necesitas-una-vector-db)).
2. **Dos fuentes de verdad** — chunks en Pinecone y metadata en Postgres sin sync transaccional.
3. **FAISS + filtros SQL complejos DIY** — reimplementas Qdrant mal.
4. **Grafo por moda** — Neo4j sin extracción de entidades fiable.
5. **Ignorar híbrido** en dominios con códigos exactos — ver [M4](../04-retrieval-y-query/guia.md).
6. **Cambiar embedding sin re-indexar** — regla M3.
7. **Usar object storage como «base de datos» de retrieval** — S3 no es ANN.
8. **Milvus/Vespa para 100k docs** — ops >> beneficio.

---

## Snippets mínimos ilustrativos

Solo para fijar ideas — no sustituyen la guía de cada producto.

**pgvector: filtro SQL + vector en una query**

```sql
SELECT content, metadata
FROM document_chunks
WHERE tenant_id = 'acme'
  AND jurisdiction = 'EU'
ORDER BY embedding <=> :query_embedding
LIMIT 5;
```

**Patrón dual-write evitado: puntero a objeto + chunk indexado**

```python
metadata = {
    "source_uri": "s3://corpus/policies/2025-vacaciones.pdf",
    "page": 12,
    "tenant_id": "acme",
}
# El vector vive en el store; el PDF crudo solo en S3.
```

**Cuándo caché semántica (concepto GPTCache)**

```python
# Si similitud(query_nueva, query_cacheada) > umbral → devolver respuesta cacheada
# Cuidado: políticas que cambian invalidan entradas por versión de corpus
```

---

> **Cross-links**
>
> - Comparativa de los 7 stores del curso: [`tecnologias-comparadas.md` §3](./tecnologias-comparadas.md#3-vector-stores)
> - Índices ANN (flat, IVF, HNSW): [M3 — Embeddings y stores §6](../03-embeddings-y-stores/guia.md#6-tipos-de-índice-flat-ivf-hnsw)
> - Híbrido, rerank, GraphRAG: [M4 — Retrieval y query](../04-retrieval-y-query/guia.md) · [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid) · [`retrieval.graph`](./catalogo-nodos.md#retrievalgraph)
> - Nodos store RAGorbit: [`store.chroma`](./catalogo-nodos.md#storechroma) · [`store.pgvector`](./catalogo-nodos.md#storepgvector) · [`store.qdrant`](./catalogo-nodos.md#storeqdrant) · [`store.neo4j`](./catalogo-nodos.md#storeneo4j) · [`store.multi-index`](./catalogo-nodos.md#storemulti-index)
> - Fichas pedagógicas por nodo (modelo de estilo): [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Plan del curso: [`PLAN.md`](../PLAN.md)

---

*Documento de referencia RAGorbit. Datos de producto y pricing: verificar en documentación oficial a 2025/2026. Vendor-neutral por diseño — ninguna familia gana en todos los escenarios.*

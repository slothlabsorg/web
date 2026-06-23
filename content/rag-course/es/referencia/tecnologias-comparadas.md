# Tecnologías comparadas — referencia del curso RAG & Agentic AI

> Tablas de decisión para elegir **modelos, stores, frameworks y herramientas** frente a las alternativas que compiten. Cada sección sigue la polaridad del curso: **por qué existe, cuándo usarlo, cuándo NO y qué lo reemplaza**. Las cifras de precio y ventana de contexto son **aprox. 2025** — verifica en la documentación del proveedor antes de presupuestar.
>
> **Audiencia:** programas en Python, sin conocimiento previo de RAG/IA. Ancla cada decisión a un nodo de RAGorbit ([`catalogo-nodos.md`](./catalogo-nodos.md)) y al módulo donde se profundiza.

---

## 1. Modelos LLM

### Tabla: proveedores cerrados (API)

| | Claude (Anthropic) | GPT (OpenAI) | Gemini (Google) |
|-|--------------------|-------------|-----------------|
| Modelos principales | Opus 4.8, Sonnet 4.6, Haiku 4.5 | GPT-4o, GPT-4o-mini | Gemini 1.5 Pro, Flash |
| Ventana contexto (aprox. 2025) | 200K tokens | 128K tokens | 1M tokens |
| Fortalezas | Razonamiento largo, seguimiento de instrucciones, seguridad | Ecosistema amplio, tool calling maduro | Ventana enorme, multimodal, integración Google |
| Precio salida (aprox. 2025) | Opus: ~$15/MTok | GPT-4o: ~$10/MTok | Pro: ~$7/MTok |
| Cómo correrlos | API (`ANTHROPIC_API_KEY`) | API (`OPENAI_API_KEY`) | API (Google AI / Vertex) |
| Privacidad | Datos salen a cloud del proveedor | Idem | Idem |
| Modo offline | No | No | No |
| Default RAGorbit | `anthropic:claude-opus-4-8` | configurable | configurable |

### Tabla: modelos open-weights (pesos públicos)

| | Llama (Meta) | Mistral | Gemma (Google) |
|-|--------------|---------|----------------|
| Licencia | Llama 3 Community | Apache 2.0 (Mistral 7B) | Gemma Terms |
| Modelos | Llama 3.1 8B / 70B / 405B | Mistral 7B, Mixtral 8x7B, Mistral Large | Gemma 2 2B / 9B / 27B |
| Ventana (aprox. 2025) | 128K (3.1 70B) | 128K (Large) | Variable por tamaño |
| Cómo correrlos | **Ollama**, Hugging Face, vLLM | Ollama, Mistral API, HF | Ollama, Hugging Face |
| Costo | Solo infraestructura (GPU/CPU) | Solo infraestructura | Solo infraestructura |
| Privacidad | Total si local | Total si local | Total si local |

### Tabla: formas de despliegue

| Forma | Qué es | Cuándo | Limitaciones |
|-------|--------|--------|--------------|
| **API de proveedor** | Llamada HTTP a Claude/OpenAI/Gemini | Prototipo rápido, máxima calidad sin GPU | Costo por token, datos en cloud |
| **Ollama** | Runtime local con un comando (`ollama run llama3.1`) | Desarrollo sin red, datos confidenciales | Calidad menor que frontier; GPU recomendada |
| **Hugging Face** | Hub de modelos + Inference API o self-host | Experimentar modelos abiertos, embeddings | Self-host requiere DevOps; API con límites |
| **vLLM / TGI** | Servidor de inferencia de alto rendimiento | Producción on-premise a escala | Requiere GPU y operación |

**Nodo RAGorbit:** [`model.llm`](./catalogo-nodos.md#modelllm) · **Módulo:** [M1 — Fundamentos](../01-fundamentos/guia.md#8-comparativa-claude-vs-openai-vs-gemini-vs-llamamistral)

### Cómo elegir / cuándo cada uno

Para **prototipos** donde el costo no importa, Claude Opus 4.8 o GPT-4o ofrecen la mejor calidad de razonamiento con mínimo esfuerzo de integración (un campo `model` en el nodo `model.llm`). En **producción con presupuesto flexible**, Sonnet 4.6 o GPT-4o equilibran calidad y costo; para **alto volumen**, Haiku 4.5 o GPT-4o-mini reducen la factura por token. Si los datos **no pueden salir de tu infraestructura** — contratos bancarios, expedientes médicos, entornos aislados — Llama 3.1 70B vía Ollama o vLLM es la opción natural, asumiendo que aceptas menor calidad de razonamiento y el costo de GPU. Gemini 1.5 Pro destaca cuando necesitas **ventana de contexto enorme** (1M tokens) para long-context o multimodal, pero recuerda que RAG suele ser más barato y preciso que "meter todo el documento" en el prompt.

---

## 2. Modelos de embeddings

| Modelo | Dim | Max tokens | Multilingüe | Costo (aprox. 2025) | Privacidad | Simétrico / asimétrico |
|--------|-----|-----------|-------------|---------------------|-----------|------------------------|
| `text-embedding-3-small` (OpenAI) | 1 536 | 8 191 | Sí | $0.02/1M tokens | API externa | Simétrico (con prefijos opcionales) |
| `text-embedding-3-large` (OpenAI) | 3 072 (reducible) | 8 191 | Sí | $0.13/1M tokens | API externa | Simétrico |
| `text-embedding-ada-002` (OpenAI) | 1 536 | 8 191 | Sí | $0.10/1M tokens | API externa | Legacy |
| `embed-english-v3.0` (Cohere) | 1 024 | 512 | No (inglés) | $0.10/1M tokens | API externa | Asimétrico (`search_query` / `search_document`) |
| `embed-multilingual-v3.0` (Cohere) | 1 024 | 512 | Sí (~100 idiomas) | $0.10/1M tokens | API externa | Asimétrico |
| `BAAI/bge-large-en-v1.5` (local) | 1 024 | 512 | No | Gratis | Total si local | Asimétrico (prefijos query/passage) |
| `BAAI/bge-m3` (local) | 1 024 | 8 192 | Sí | Gratis | Total si local | Asimétrico |
| `intfloat/e5-large-v2` (local) | 1 024 | 512 | No | Gratis | Total si local | Asimétrico (`query:` / `passage:`) |
| `intfloat/multilingual-e5-large` (local) | 1 024 | 512 | Sí | Gratis | Total si local | Asimétrico |
| `nomic-embed-text-v1` (local) | 768 | 8 192 | No | Gratis | Total si local | Simétrico |

**Nodo RAGorbit:** [`model.embedding`](./catalogo-nodos.md#modelembedding) · **Módulo:** [M3 — Embeddings y stores](../03-embeddings-y-stores/guia.md#13-modelos-de-embedding-openai-vs-cohere-vs-bgee5-locales)

### Cómo elegir / cuándo cada uno

El retrieval RAG es casi siempre **asimétrico**: la query es corta ("¿días de vacaciones?") y el documento es un párrafo largo. Por eso E5 y BGE con prefijos de tarea (`query:` / `passage:`) suelen superar a embeddings puramente simétricos en benchmarks de retrieval. Si ya tienes API key de OpenAI y quieres el **menor tiempo de desarrollo**, `text-embedding-3-large` es el default de RAGorbit y funciona bien multilingüe. Cohere encaja si ya usas su reranker o necesitas el modo asimétrico explícito de la API. Para **privacidad total** o modo sin red, BGE o E5 locales (vía `sentence-transformers`, Ollama `nomic-embed-text`) eliminan llamadas externas; necesitas GPU para indexar a escala. **Regla crítica:** el mismo modelo debe usarse en ingesta y consulta; si lo cambias, re-indexa todo.

---

## 3. Vector stores

| Store | Tipo | Filtros metadata | CRUD | Persistencia | Escala práctica | On-prem | Cloud managed | Fortaleza principal |
|-------|------|------------------|------|--------------|-----------------|---------|---------------|---------------------|
| **ChromaDB** | Open source, embebido | Ricos (operadores) | add/update/delete nativo | Disco local | ~10M vectores | ✅ | ❌ nativo | Zero-config, ideal prototipos |
| **FAISS** | Librería (Meta) | Manual (externo) | Manual | Archivo en disco | 100M+ | ✅ | ❌ | Velocidad extrema, control total |
| **pgvector** | Extensión Postgres | Full SQL (`WHERE`) | SQL estándar | Postgres | ~5M práctico | ✅ | ✅ (RDS, Supabase) | Joins, transacciones ACID, filtros complejos |
| **Qdrant** | BD vectorial dedicada | Payload filtering muy rico | API REST/gRPC | Disco + snapshots | 100M+ | ✅ Docker | ✅ Qdrant Cloud | Filtros avanzados, Rust, buen rendimiento |
| **Pinecone** | SaaS | Metadata filters | API | Gestionado | Ilimitada (SaaS) | ❌ | ✅ | Zero-ops, escala automática |
| **Weaviate** | BD vectorial + grafo | GraphQL + BM25 híbrido | API | Disco/cluster | 100M+ | ✅ Docker | ✅ WCS | Híbrido nativo, multimodal |
| **Milvus** | Open source enterprise | Rich | API | Cluster distribuido | 1B+ | ✅ | ✅ Zilliz | Escala masiva, ecosistema Attu |

**Nodos RAGorbit:** [`store.chroma`](./catalogo-nodos.md#storechroma), [`store.pgvector`](./catalogo-nodos.md#storepgvector), [`store.qdrant`](./catalogo-nodos.md#storeqdrant) · **Módulo:** [M3 — Embeddings y stores](../03-embeddings-y-stores/guia.md#12-comparativa-de-vector-stores)

### Cómo elegir / cuándo cada uno

**ChromaDB** es el primer paso en casi todo proyecto del curso: cero servidor, CRUD sencillo, filtros de metadata nativos — perfecto para el template 09 (RRHH) y demos. **FAISS** cuando necesitas velocidad máxima y controlas tú la infraestructura, pero aceptas implementar filtros y CRUD a mano (anti-patrón: FAISS + filtros complejos de negocio). **pgvector** si ya tienes Postgres: el template 02 (Banca) lo usa porque los filtros duros SQL son requisito regulatorio y puedes hacer `JOIN` con tablas operacionales. **Qdrant** equilibra producción on-premise con filtros de payload ricos sin añadir Postgres. **Pinecone** para equipos que no quieren operar infraestructura y aceptan lock-in SaaS. **Weaviate** si necesitas búsqueda híbrida (semántica + BM25) sin código extra. **Milvus** solo cuando superas decenas de millones de vectores y tienes equipo de plataforma. Anti-patrones: Chroma en producción con 50M+ docs; pgvector > 5M sin benchmark previo; Pinecone por comodidad sin evaluar costo a escala.

---

## 4. Estrategias de chunking

| Estrategia | Determinista | Requiere estructura | Metadata natural | Pros | Contras | Caso ideal |
|-----------|-------------|--------------------|--------------------|------|---------|-----------|
| **Fixed** | Sí | No | No | Simple, rápido, predecible | Corta frases y párrafos a mitad | Prototipo, texto libre homogéneo |
| **Recursive** | Sí | Párrafos/oraciones | No | Default robusto; respeta jerarquía textual | No entiende cláusulas legales ni secciones ATA | Artículos, informes, políticas (default RAGorbit) |
| **Semantic** | No (usa embeddings) | No | No | Chunks de tamaño variable por coherencia semántica | Más lento y costoso en ingesta | Textos narrativos densos sin estructura clara |
| **By-layout** | Sí (con Unstructured) | Estructura visual del PDF | `tipo` de bloque | Preserva tablas, títulos, listas como unidades | Requiere parser avanzado (Unstructured) | Informes con tablas, PDFs ricos |
| **By-clause / by-section** | Sí | Estructura de dominio | `clausula_id`, `ata_chapter` | Citabilidad exacta; filtros duros precisos | Requiere conocer el esquema del documento | Contratos, normativas, manuales ATA |

**Nodo RAGorbit:** [`ingest.chunker`](./catalogo-nodos.md#ingestchunker) · **Módulo:** [M2 — Ingesta](../02-ingesta/guia.md#47-comparativa-de-estrategias-de-chunking)

### Cómo elegir / cuándo cada uno

Empieza con **recursive** (default de RAGorbit: `chunkSize=1000`, `overlap=150`) salvo que el dominio te obligue a otra cosa. Pasa a **by-clause** o **by-section** cuando la citabilidad es legal o de compliance: un chunk = una cláusula numerada o una sección ATA (template 05 Legal, template 08 Manufactura). Usa **by-layout** cuando el PDF mezcla tablas, figuras y texto y un splitter de caracteres destruye el significado — típicamente con Unstructured como pre-paso. **Semantic chunking** solo cuando recursive produce chunks incoherentes en textos muy largos y narrativos, y tienes presupuesto de GPU en ingesta. **Fixed** únicamente para prototipos rápidos o cuando los documentos ya vienen pre-troceados. Overlap > 30% infla el índice sin beneficio proporcional.

---

## 5. Frameworks de ingesta

| Framework | Abstracción | Fortalezas | Debilidades | Mejor para | Evitar si |
|-----------|-------------|------------|-------------|-----------|----------|
| **LangChain loaders** | `Document` + 100+ loaders en `langchain-community` | Fácil instalación; integración con splitters y stores LCEL | Calidad de extracción variable según loader subyacente | PDFs simples, CSV, web; stack LangChain | Necesitas máxima calidad en PDFs complejos |
| **LlamaIndex readers** | `Node` + `llama-hub` readers | Metadata rica por defecto; `SimpleDirectoryReader` multi-formato | Ecosistema separado de LangChain | Proyectos LlamaIndex; directorios mixtos | Solo usas LangChain sin mezclar |
| **Unstructured.io** | Elementos tipados (`Title`, `Table`, `NarrativeText`) | Mejor parsing de PDFs ricos; modo `hi_res` con visión | Más lento; `hi_res` requiere dependencias pesadas o API cloud | Tablas complejas, columnas múltiples, figuras | PDF es texto plano simple |
| **`loader.multimodal` RAGorbit** | Pipeline integrado tablas→JSON, imágenes→visión | `sectionScheme` (ATA), contrato con nodos del grafo | Costo y latencia de visión | Manuales técnicos, pólizas con fotos | Documento solo texto |

**Nodos RAGorbit:** [`loader.*`](./catalogo-nodos.md#2-loader--fuentes-de-datos), [`ingest.chunker`](./catalogo-nodos.md#ingestchunker) · **Módulo:** [M2 — Ingesta](../02-ingesta/guia.md#7-comparativa-de-frameworks-de-ingesta)

### Cómo elegir / cuándo cada uno

Si tu stack ya es LangChain/LangGraph (como el codegen de RAGorbit), **LangChain loaders** cubren el 80% de casos con mínima fricción. Si el proyecto gira en torno a índices y query engines de LlamaIndex, sus **readers** ofrecen metadata más rica desde el inicio. Cuando la calidad de extracción es el cuello de botella — PDFs legales con tablas en columnas, informes financieros — **Unstructured** antes del chunker merece la pena aunque añada latencia. El nodo **`loader.multimodal`** de RAGorbit combina extracción tabular, visión y `sectionScheme` en un contrato que encaja directamente con `ingest.chunker` y filtros duros de `retrieval.vector`.

---

## 6. Retrieval y rerankers

### Búsqueda: denso vs BM25 vs híbrido

| Método | Precisión | Recall | Latencia | Cuándo |
|--------|-----------|--------|----------|--------|
| **BM25** (keyword) | Alta en términos exactos | Bajo en semántica | Muy baja | IDs, códigos, números de parte, nombres propios |
| **Vector** (denso) | Media-alta | Alto en lenguaje natural | Baja | Preguntas en lenguaje cotidiano, sinónimos |
| **Híbrido** | Alta | Alto | Media | **Caso general** en dominios técnicos + natural |
| **GraphRAG** | Muy alta (estructura) | Medio | Alta | Relaciones entre entidades (Neo4j) |

### Fusión de listas (híbrido)

| Método | Cuándo preferir |
|--------|-----------------|
| **RRF** (Reciprocal Rank Fusion) | Scores de escalas distintas (BM25 y coseno) — **default recomendado** |
| **Suma ponderada** (`alpha`) | Scores normalizados a la misma escala; control fino vector vs keyword |
| **Cross-encoder (reranker)** | Precisión máxima tras recuperar top-K ruidoso |

### Rerankers

| Modelo | Calidad | Latencia | Costo (aprox. 2025) | Cuándo |
|--------|---------|----------|---------------------|--------|
| **BGE-reranker-v2** | Muy alta | 50–150 ms local | Gratuito | Producción on-premise, dominios críticos |
| **Cohere Rerank v3** | Muy alta | 100–300 ms API | Pago por uso | Prototipo rápido, stack Cohere |
| **ColBERT** | Alta | 20–80 ms | Gratuito | Escala grande, late interaction eficiente |
| **FlashRank** | Media-alta | 5–20 ms | Gratuito | Latencia crítica, edge |

**Nodos RAGorbit:** [`retrieval.vector`](./catalogo-nodos.md#retrievalvector), [`retrieval.hybrid`](./catalogo-nodos.md#retrievalhybrid), [`retrieval.reranker`](./catalogo-nodos.md#retrievalreranker) · **Módulo:** [M4 — Retrieval y query](../04-retrieval-y-query/guia.md#11-comparativa-de-tecnologías)

### Cómo elegir / cuándo cada uno

El **retrieval vectorial puro** basta en RRHH o FAQs homogéneas; en cuanto aparecen códigos ATA, números de póliza o jerga técnica exacta, añade **BM25** y fusiona con **RRF** (no sumes scores crudos de escalas incompatibles). El **reranker** va después del retrieve: recupera top-10 o top-20 ruidosos, el cross-encoder devuelve top-3 precisos (~50–150 ms extra). En legal, médico o banca, el reranker casi siempre se justifica; en bots de alto volumen con latencia < 1 s, evalúa si el filtro duro de metadata ya elimina el ruido. **BGE-reranker** local para privacidad; **Cohere Rerank** si no tienes GPU. **GraphRAG** solo cuando las relaciones entre entidades importan tanto como el texto (template 05 Legal con Neo4j).

---

## 7. Salida estructurada

| Mecanismo | Garantía de validez | APIs de nube | Modelos locales | Reintentos automáticos | Uso típico |
|-----------|---------------------|--------------|-----------------|------------------------|------------|
| **Tool-calling** | Alta (fine-tuned en frontier) | Sí | Variable | No | Producción OpenAI/Anthropic/Google |
| **JSON-mode** | Media (JSON válido, no schema) | Sí | Variable | No | Schemas muy simples |
| **instructor** | Alta (Pydantic + reintenta) | Sí | Sí | Sí (`max_retries`) | Cuando tool-calling no está disponible |
| **outlines** | Total (gramática formal) | No | Sí | No | Modelos HF locales, latencia crítica |
| **`with_structured_output`** (LangChain) | Alta (Pydantic) | Sí | Variable | Variable | Pipelines LCEL/LangGraph ya en LangChain |

| Criterio | instructor | `with_structured_output` | JSON-mode |
|----------|------------|--------------------------|-----------|
| Ya usas LangChain | Menos natural | **Mejor** | Parser manual |
| Reintentos con feedback de validación | **Nativo** | Variable | No |
| Validación de schema estricta | Sí | Sí | **No** (solo sintaxis JSON) |
| LangSmith / tracing | Callbacks extra | **Nativo** | Manual |
| Modelos sin tool-calling | Con reintentos | No disponible | **Única opción** |

**Nodo RAGorbit:** [`logic.structured`](./catalogo-nodos.md#logicstructured) · **Módulo:** [M5 — Generación y lógica](../05-generacion-y-logic/guia.md#2-salida-estructurada)

### Cómo elegir / cuándo cada uno

En pipelines RAGorbit (LangGraph/LCEL), **`with_structured_output`** es la opción más natural: Pydantic valida la forma, integra con LangSmith y encaja en el nodo `logic.structured`. Usa **instructor** si quieres structured output sin acoplarte a LangChain o necesitas reintentos automáticos con mensajes de error de validación. **Tool-calling** cuando el modelo ya lo soporta bien y el schema es complejo — es el camino de producción en frontier models. **JSON-mode** solo para objetos simples sin validación de campos. **outlines** exclusivamente con modelos locales Hugging Face donde necesitas garantía formal de que el output cumple la gramática. Recuerda: Pydantic valida **forma**, no **verdad** — combina con `logic.citations` y evaluación RAGAS `faithfulness`. Los umbrales de negocio (`score >= 70`) van en `logic.rules`, nunca en el LLM.

---

## 8. Frameworks de evaluación

| Framework | Tipo | Integración CI/CD | Dashboard | Tiempo real | Agnóstico de proveedor | Métricas principales |
|-----------|------|-------------------|-----------|-------------|--------------------------|----------------------|
| **RAGAS** | Batch/offline | Sí (vía pytest) | No (exporta CSV/JSON) | No | Sí | faithfulness, answer relevancy, context precision/recall |
| **TruLens** | Instrumentación | Parcial | Sí (Streamlit) | Sí | Sí | groundedness, relevance por llamada |
| **DeepEval** | Tests unitarios LLM | Sí (pytest nativo) | Sí (cloud) | No | Sí | Métricas como tests con `threshold` |
| **promptfoo** | Evaluación de prompts/modelos | Sí (CLI/YAML) | Sí (HTML) | No | Sí | Comparación A/B de prompts y proveedores |

**Nodos RAGorbit:** [`logic.citations`](./catalogo-nodos.md#logiccitations), [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback) · **Módulo:** [M5 — Generación y lógica](../05-generacion-y-logic/guia.md#9-frameworks-de-evaluación)

### Cómo elegir / cuándo cada uno

**RAGAS** es el estándar para evaluar un pipeline RAG completo en batch antes de un release o en CI nocturno: necesitas dataset con `question`, `answer`, `contexts` y opcionalmente `ground_truth`. **DeepEval** convierte las mismas métricas en **tests pytest** con umbrales — ideal si tu equipo ya piensa en "tests que fallan el build". **TruLens** instrumenta cada llamada en desarrollo y muestra un dashboard en tiempo real para iterar prompts sin exportar datasets. **promptfoo** brilla al **comparar modelos y prompts** en paralelo (YAML + tabla HTML) — perfecto para decidir entre Claude y GPT-4o o entre dos versiones de system prompt. En producción madura: TruLens (monitoreo continuo) + RAGAS (evaluación periódica batch).

---

## 9. Frameworks de agentes y multi-agente

| Framework | Modelo mental | Memoria / estado | Control del flujo | Curva de aprendizaje | Casos ideales |
|-----------|---------------|------------------|-------------------|----------------------|---------------|
| **LangGraph** | Grafo de estado (`StateGraph`, checkpoints) | Checkpointer (memoria, SQLite, Postgres) | Máximo — aristas condicionales, subgrafos, HITL | Media-alta | Agentes transaccionales, multi-agente supervisor, producción RAGorbit |
| **CrewAI** | Crew = agentes + tasks + roles | Memoria de crew (corto/largo plazo) | Medio — orquestación declarativa por roles | Baja-media | Equipos de agentes con roles fijos (investigador, redactor, revisor) |
| **AutoGen / AG2** | Conversación entre agentes | Historial conversacional | Bajo-medio — emergente por diálogo | Media | Prototipos colaborativos, coding agents, exploración |
| **BeeAI** | Agentes modulares (IBM) | Configurable por agente | Medio | Media | Integración enterprise IBM/watsonx, agentes con gobernanza |
| **Semantic Kernel** | Plugins + planners (Microsoft) | Memoria semántica + embeddings | Medio-alto — planners automáticos | Media-alta | Ecosistema .NET/Azure, orquestación con plugins tipados |

### Patrones de agente (complemento)

| Patrón | Flexibilidad | Costo LLM | Cuándo |
|--------|-------------|-----------|--------|
| **ReAct** | Alta | Medio (N pasos) | **Punto de partida** — agentes conversacionales y transaccionales |
| **Plan-and-Execute** | Baja (plan fijo) | Mayor | Tareas largas con pasos bien definidos |
| **Reflexion** | Alta | Alto (pasos + evaluación) | Batch con función de evaluación confiable |

**Nodos RAGorbit:** [`agent.react`](./catalogo-nodos.md#agentreact), [`agent.fanout`](./catalogo-nodos.md#agentfanout), [`tool.*`](./catalogo-nodos.md#10-tool--herramientas-externas) · **Módulos:** [M6 — Agentes I](../06-agentes-i/guia.md), [M7 — Agentes II](../07-agentes-ii/guia.md)

### Cómo elegir / cuándo cada uno

**LangGraph** es el framework de producción del curso y de RAGorbit: grafos explícitos, checkpointing entre turnos, guardrails como aristas condicionales y auditoría trazable. Empieza con `create_react_agent` (M6) y migra a `StateGraph` explícito cuando necesites HITL, fan-out o subgrafos (M7). **CrewAI** acelera prototipos multi-rol donde cada agente tiene un persona fijo — excelente para el taller de rebooking comparativo de M7, menos control fino que LangGraph en producción regulada. **AutoGen/AG2** sirve para explorar dinámicas conversacionales emergentes; en servicios al cliente transaccionales el flujo implícito dificulta auditoría. **BeeAI** y **Semantic Kernel** tienen sentido en stacks IBM o Microsoft ya adoptados. Para un solo agente con 2–3 tools, **ReAct** (`agent.react`) basta; multi-agente solo cuando hay paralelización real (template 10 Logística) o especialización por dominio.

---

## 10. MCP vs plugins y funciones propietarias

| Aspecto | **MCP** (Model Context Protocol) | **Plugins / funciones propietarias** |
|---------|----------------------------------|--------------------------------------|
| Estándar | Abierto (Anthropic + ecosistema) | Cerrado por proveedor (OpenAI Plugins, Assistants) |
| Transporte | STDIO, Streamable HTTP | HTTP propietario del proveedor |
| Descubrimiento | Cliente lista tools/resources/prompts del server | Definición manual por integración |
| Seguridad | Sampling, roots, aprobación por permisos | Variable; depende del proveedor |
| Portabilidad | Un server MCP sirve a Claude, Cursor, agentes custom | Lock-in al ecosistema del proveedor |
| Implementación | FastMCP (Python), servers custom | SDK del proveedor |
| En RAGorbit | Nodo [`tool.mcp`](./catalogo-nodos.md#toolmcp) | [`tool.service`](./catalogo-nodos.md#toolservice), [`tool.http`](./catalogo-nodos.md#toolhttp) |

**Módulo:** [M8 — MCP](../08-mcp/guia.md)

### Cómo elegir / cuándo cada uno

Usa **MCP** cuando quieres exponer herramientas de forma **estándar y reutilizable** entre distintos clientes (IDE, agente de aerolínea, copilot interno) con un modelo de permisos explícito — el taller de M8 expone PolicyRAG como MCP server con aprobación de acciones sensibles. Los **tools propietarios** (`tool.service`, `tool.http`) siguen siendo válidos para integraciones REST puntuales que no necesitan el protocolo ni la portabilidad. MCP no reemplaza tus APIs de negocio: las **envuelve** en un contrato que el agente descubre dinámicamente. En producción regulada, combina MCP con `guardrail.pre-tool` y `guardrail.confirm` para acciones irreversibles.

---

## 11. Guardrails

| Enfoque | Qué ofrece | Fortalezas | Debilidades | Cuándo |
|---------|-----------|------------|-------------|--------|
| **Guardrails AI** | Validadores Python + hub de guardrails (PII, toxicidad, schema) | Integrable en pipeline; validación pre/post LLM | Curva para guardrails custom complejos | Startups y equipos Python-first |
| **NeMo Guardrails** | DSL Colang + rails programáticos (NVIDIA) | Conversación multi-turno con rails declarativos | Stack NVIDIA; curva del DSL | Entornos enterprise con NeMo/NVIDIA |
| **Propio (RAGorbit)** | Nodos `guardrail.*` en el grafo | Determinista, auditable, sin dependencia externa | Hay que implementar cada regla | **Producción con consecuencias legales/financieras** |

### Nodos RAGorbit equivalentes

| Necesidad | Nodo nativo | Alternativa externa |
|-----------|-------------|---------------------|
| Validar antes de ejecutar tool | `guardrail.pre-tool` | Guardrails AI validator |
| Confirmación usuario (pagos) | `guardrail.confirm` | NeMo dialog rail |
| Idempotencia transaccional | `guardrail.idempotency` | Redis + clave compuesta |
| Resiliencia (retry, circuit breaker) | `guardrail.resilience` | tenacity, Istio |

**Nodos RAGorbit:** [§11 guardrail](./catalogo-nodos.md#11-guardrail--seguridad-y-resiliencia) · **Módulo:** M9 — Producción y seguridad *(pendiente, ver `PLAN.md` §6 M9)*

### Cómo elegir / cuándo cada uno

La regla de oro del curso: **las restricciones con consecuencias legales o financieras deben ser deterministas**, no instrucciones en el prompt. Los nodos `guardrail.*` de RAGorbit implementan eso en el grafo — el LLM no decide si un pago > $500 requiere confirmación; el nodo `guardrail.confirm` lo impone. **Guardrails AI** y **NeMo Guardrails** añaden capas de validación de contenido (PII, toxicidad, jailbreaks) útiles como complemento, especialmente en la fase de exploración. En banca, aerolíneas o salud, prioriza guardrails propios en el grafo + tests de inyección de prompts (taller M9); las librerías externas son aceleradores, no sustitutos de la lógica de negocio.

---

## 12. Observabilidad

| Herramienta | Enfoque | Trazas LLM | Métricas infra | Costo | Open source | Integración LangChain |
|-------------|---------|------------|----------------|-------|-------------|----------------------|
| **LangSmith** | Plataforma LLM de LangChain | Excelente (chains, agents, tools) | Básica | SaaS (tier gratuito limitado) | No | **Nativa** |
| **Langfuse** | Observabilidad LLM | Completa (prompts, tokens, latencia) | Básica | SaaS + self-host | Sí (core) | Buena (callbacks) |
| **OpenTelemetry + Phoenix** | Estándar OTel + UI Arize Phoenix | Buena (via instrumentación) | **Excelente** (Prometheus/Grafana) | Gratis (self-host) | Sí | Via callbacks OTel |

**Nodos RAGorbit:** [`observability.audit`](./catalogo-nodos.md#observabilityaudit), [`observability.metrics`](./catalogo-nodos.md#observabilitymetrics), [`observability.feedback`](./catalogo-nodos.md#observabilityfeedback) · **Módulo:** M9 — Producción y seguridad *(pendiente)*

### Cómo elegir / cuándo cada uno

**LangSmith** si todo tu stack es LangChain/LangGraph y quieres depurar chains y agentes con mínima configuración — es el camino de menor fricción en M6+. **Langfuse** cuando necesitas **open source** o self-hosting con dashboard de prompts, costos y latencia sin lock-in a LangChain. **OpenTelemetry + Phoenix** (o Jaeger/Grafana) cuando la observabilidad debe **unificar LLM con infraestructura** — throughput de Kafka, latencia P95, circuit breakers — como en el template 10 (Logística). En RAGorbit, `observability.audit` publica tool calls a Kafka/log para auditoría regulatoria; las herramientas anteriores complementan con visibilidad de tokens y debugging. Combina audit en el grafo + Langfuse/LangSmith para desarrollo + OTel para producción.

---

## 13. UIs para RAG y agentes

| Framework | Paradigma | Chat UI | Despliegue | Curva | Mejor para |
|-----------|-----------|---------|------------|-------|-----------|
| **Gradio** | Componentes ML (`gr.ChatInterface`, `gr.Blocks`) | Nativo, bonito con poco código | Hugging Face Spaces, local | Baja | Demos RAG, prototipos internos, chatbots rápidos |
| **Streamlit** | Script reactivo (`st.chat_message`, `st.chat_input`) | Bueno con widgets | Streamlit Cloud, local | Baja | Dashboards de evaluación (TruLens), herramientas internas |
| **Flask** (+ FastAPI en RAGorbit) | API/web tradicional | Hay que construirla | Cualquier hosting | Media | Producción, control total, integración con sistemas existentes |

**Nodos RAGorbit:** [`io.input`](./catalogo-nodos.md#ioinput), [`io.output`](./catalogo-nodos.md#iooutput) · **Módulos:** M9 — Producción *(pendiente)*, cubierto también en temario IBM (M1/M5 Flask)

### Cómo elegir / cuándo cada uno

**Gradio** es la opción más rápida para enseñar y demostrar un RAG: `gr.ChatInterface` en ~20 líneas conectado a tu chain. **Streamlit** brilla cuando la UI es un panel de monitoreo o evaluación (dashboard TruLens, métricas de faithfulness) más que un chat de producción. **Flask/FastAPI** cuando necesitas autenticación, SSE/WebSocket, rate limiting y contrato API estable — RAGorbit genera `deploymentTarget: chat-service` con FastAPI para eso. Para el taller M9 (pago con idempotencia + guardrail), Gradio basta para probar el flujo; en producción migras la misma lógica al esqueleto FastAPI del codegen.

---

## 14. Orquestación de producción

| Enfoque | Durabilidad | Estado | Retry / saga | Complejidad ops | Cuándo |
|---------|-------------|--------|--------------|-----------------|--------|
| **Temporal** | Alta (workflow durable) | Historial completo del workflow | Nativo, con compensaciones | Alta (cluster Temporal) | Procesos de días/semanas, HITL, aprobaciones multi-paso |
| **Colas + estado en BD** (Kafka + Postgres) | Media-alta | Estado en tablas/event log | Manual (idempotencia, reintentos) | Media | Alto volumen event-driven, fan-out masivo |
| **Cron + batch** | Baja | Archivos/checkpoints | Manual | Baja | Indexación nocturna, jobs cortos |

### Mapeo RAGorbit

| Nodo | Deployment target | Patrón |
|------|-------------------|--------|
| `io.trigger` | `temporal` | Workflows largos con cron y esperas humanas |
| `io.event-source` | `event-worker` | Kafka + exactly-once + fan-out (`agent.fanout`) |
| `io.batch` | `batch` | Procesamiento de archivos programado |
| `io.input` | `chat-service` | FastAPI SSE/WebSocket en tiempo real |

**Nodos RAGorbit:** [`io.trigger`](./catalogo-nodos.md#iotrigger), [`io.event-source`](./catalogo-nodos.md#ioevent-source) · **Módulo:** M9 — Producción *(pendiente)* · Template: [10-logistics-disruption-rebooking](../examples/10-logistics-disruption-rebooking/)

### Cómo elegir / cuándo cada uno

**Temporal** cuando el flujo puede durar días, incluye pasos humanos y debe sobrevivir reinicios del servidor — onboarding bancario, aprobaciones médicas multi-etapa. La complejidad operativa solo se justifica con procesos realmente largos. **Kafka + estado en BD** es el patrón del template 10: miles de eventos de disrupción, `agent.fanout` stateless, idempotencia vía `guardrail.idempotency` y exactly-once en el consumer. No necesitas Temporal si cada evento se procesa en segundos y el estado vive en Postgres. **Batch con cron** para re-indexar documentos de noche (templates 02, 04). Regla práctica: chat en tiempo real → FastAPI; eventos masivos → Kafka; procesos interminables con humanos → Temporal.

---

## 15. RAG vs fine-tuning vs prompting puro

| Criterio | Prompting puro | RAG | Fine-tuning |
|----------|----------------|-----|-------------|
| **Costo inicial** | Mínimo | Medio (índice + embeddings) | Alto (GPU + datos + entrenamiento) |
| **Costo por consulta** | Tokens del prompt | Tokens + retrieval | Solo tokens (modelo ya especializado) |
| **Datos necesarios** | Ninguno (o few-shot) | Documentos actualizables | 500–5 000+ pares Q/A de calidad |
| **Actualización de conocimiento** | Cambiar prompt | Re-indexar documentos | Reentrenar modelo |
| **Trazabilidad / citas** | No (alucinaciones de fuente) | **Sí** (chunks recuperados) | No inherentemente |
| **Privacidad** | Datos en prompt al proveedor | Documentos en índice propio | Alta si entrenas local |
| **Mejor para** | Tareas generales, formato, clasificación simple | FAQs, manuales, políticas, compliance | Estilo de marca, dominio ultra-especializado |
| **Nodo RAGorbit** | `logic.prompt` | pipeline `loader→store→retrieval→logic` | (externo al grafo; complementa `model.llm`) |

### Árbol de decisión

```
¿Tienes documentos propios actualizables?
  NO → Prompting puro (zero/few-shot)
  SÍ → RAG

¿RAG + modelo base dan calidad suficiente?
  SÍ → Quédate con RAG
  NO → ¿Tienes +1000 pares Q/A de calidad?
         NO → Mejora prompting / retrieval / reranker
         SÍ → Considera fine-tuning (+ RAG en sistemas maduros)
```

**Módulo:** [M1 — Fundamentos](../01-fundamentos/guia.md#9-rag-vs-fine-tuning-vs-prompting-puro-cuándo-cada-uno)

### Cómo elegir / cuándo cada uno

**Prompting puro** resuelve redacción, traducción y clasificación cuando el modelo ya sabe el tema. En cuanto el conocimiento es **privado, cambiante o debe citarse**, RAG es la primera opción — es el patrón central de todo el curso y de los 10 templates. **Fine-tuning** no sustituye a RAG: enseña *cómo razonar* o *qué tono usar*, mientras RAG provee el *qué* factual. La combinación RAG + fine-tuning aparece en sistemas maduros de salud o legal, pero el curso insiste en dominar RAG primero porque es más barato, auditable e iterable. Si RAG falla, antes de fine-tunar mejora chunking, metadata, híbrido y reranker (M2–M4).

---

## Críticas al stack LangChain / LangGraph / LangSmith y cuándo NO usarlo

> Esta sección no invalida las tablas anteriores (§5, §7, §9, §12): LangChain/LangGraph siguen siendo el **framework de referencia del curso y de RAGorbit**, pero el método tri-modal exige nombrar las críticas con honestidad y saber cuándo otro camino es más sano.

### Por qué tantas críticas

LangChain creció muy rápido entre 2022 y 2024: pasó de utilidades sueltas a LCEL, a la fragmentación en paquetes (`langchain`, `langchain-core`, `langchain-community`, `langchain-openai`…), y a LangGraph como capa de orquestación de agentes. Ese ritmo dejó **muchas abstracciones**, documentación que no alcanzaba a las versiones nuevas y tutoriales en la red escritos para APIs ya retiradas.

Parte de la crítica que sigue circulando en foros y posts es **histórica y desactualizada**: quejas sobre `LLMChain` monolítico, imports desde `langchain.schema`, o agentes opacos pre-LCEL/LangGraph ya no describen el stack que usa este curso (LCEL + LangGraph explícito, a 2025/2026). Otra parte **sigue vigente**: depurar dentro de cadenas compuestas, el churn de versiones, la pregunta de si hace falta un framework, el lock-in de LangSmith y el peso del árbol de dependencias. La polaridad del curso aplica aquí también: entender el mecanismo en la capa ② y elegir la capa ③ con criterio, no por moda.

### Críticas vigentes y su matiz

| Crítica | Qué hay de cierto | Mitigación / cuándo no aplica |
|---------|-------------------|-------------------------------|
| **Sobre-abstracción y "leaky abstractions"** | Cuando algo falla en medio de un pipeline LCEL o un nodo LangGraph, el stack trace atraviesa capas (`RunnableSequence`, callbacks, wrappers) y cuesta ver si el bug es del modelo, del retriever o del parser. | Construye primero la capa ② (scratch) para saber qué paso falla; en producción, grafos **explícitos** (`StateGraph`) en lugar de cadenas opacas; logging por nodo. No aplica si el pipeline es corto (retrieve → prompt → LLM) y ya lo dominas. |
| **Churn de versiones / breaking changes** | Entre LangChain 0.1 y 0.2+ (y siguientes minor a 2025/2026) cambiaron rutas de import, paquetes separados y APIs deprecadas. Un `pip install -U` puede romper CI. | Fijar versiones en `requirements.txt` o lockfile; seguir el estilo de `solucion_framework.py` del módulo activo; migrar por paquete (`langchain-core` estable, integraciones en `langchain-*`). Menos dolor si no actualizas en cada release. |
| **Curva: demasiadas formas de hacer lo mismo** | Loaders, retrievers, memory, agentes "built-in" y LCEL compiten con patrones LangGraph; la documentación oficial mejora pero aún hay rutas legacy en ejemplos de terceros. | Este curso reduce el menú: LCEL para RAG lineal (M1 §11), `create_react_agent` → `StateGraph` para agentes (M6 §8). Si ya dominas un patrón, no añadas otro sin razón. |
| **"¿De verdad necesitas un framework?"** | Para muchos casos — un chat con 3 tools, un RAG con Chroma y un embedding — bastan el **SDK del proveedor** (`openai`, `anthropic`) + vector store + un bucle `while` de 40 líneas. El framework aporta composición y ecosistema, no magia. | Usa framework cuando cambias de proveedor a menudo, el pipeline tiene muchos pasos o necesitas checkpointing/HITL (LangGraph). No aplica en scripts one-shot o equipos que priorizan mínimas dependencias. |
| **LangSmith: propietario, tier gratuito limitado, lock-in de observabilidad** | LangSmith es SaaS de LangChain Inc.; el tier gratuito tiene límites de trazas/retención (ver pricing actual del proveedor). Las trazas más ricas están optimizadas para chains LangChain. | LangSmith sigue siendo el camino de **menor fricción** si todo el stack es LangChain/LangGraph (coherente con §12). Para evitar lock-in: **Langfuse** (open-source, self-host) u **OpenTelemetry** + Phoenix/Jaeger. En RAGorbit, `observability.audit` en el grafo complementa cualquiera. |
| **Sobrecoste de dependencias y superficie de ataque** | `langchain` + integraciones arrastran decenas de paquetes transitivos; más código = más CVEs que vigilar y más tiempo de `pip install` en CI. | Capa ② del curso corre con stdlib; capa ③ solo donde aporta. En entornos regulados, audita `pip audit` / SBOM; considera SDK nativo + librerías mínimas (`chromadb`, `instructor`). |

### Qué responde este curso a esas críticas

El **método tri-modal** (PLAN §2, HANDOFF §3) es la defensa principal: en la capa ② implementas retrieval, tool calling y bucles ReAct **a mano**; en la capa ③ ves cómo el framework reimplementa lo mismo. Si LangChain cambia un import o una cadena falla en producción, **razonas sobre el mecanismo**, no solo sobre el wrapper.

- **"Los frameworks no hacen magia"** — lo demuestran [M1 §11](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero) (Document → splitter → embeddings → vector store → retriever → LCEL) y [M6 §8](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) (tu `while` de ReAct mapeado a nodos y aristas).
- **No dependes del framework para diseñar** — el catálogo de nodos RAGorbit es agnóstico; LangChain es una implementación de la capa ③, no la definición del sistema.
- **Alternativas explícitas** — §9 ya compara LangGraph con CrewAI/AutoGen; los hands-on sin LangChain (tabla siguiente) evitan el monocultivo.
- **Observabilidad sin lock-in** — §12 posiciona Langfuse y OTel como pares legítimos de LangSmith; el curso no asume que pagues SaaS para aprender.

### Cuándo LangGraph/LangChain SÍ valen la pena — y cuándo NO

| Situación | Recomendación | Por qué |
|-----------|---------------|---------|
| Pipeline RAG multi-paso (retrieve → rerank → structured output → reglas) con cambio de proveedor | **LangChain/LCEL + LangGraph** | Composición `Runnable`, parsers y nodos auditables; alineado con codegen RAGorbit |
| Agente transaccional con checkpointing, HITL, subgrafos, fan-out | **LangGraph** (`StateGraph`) | Control explícito del flujo — coherente con §9 y M7 |
| Prototipo multi-rol con personas fijas (investigador, redactor) | **CrewAI** o LangGraph | CrewAI más rápido para roles; LangGraph si luego necesitas guardrails en el grafo |
| Script único, < 50 líneas, un proveedor, sin memoria entre sesiones | **SDK nativo** | Menos dependencias, depuración directa |
| RAG simple (embed → Chroma → top-k → prompt) sin orquestación compleja | **SDK nativo** o **LlamaIndex** | Ver [rag-sin-langchain.md](./rag-sin-langchain.md); LangChain aporta poco si no compones muchos pasos |
| Equipo ya estandarizado en LlamaIndex, Haystack o Pydantic-AI | **Ese framework** | No añadas LangChain encima sin migración planificada |
| Observabilidad unificada LLM + infra (Kafka, P95, Prometheus) | **OpenTelemetry** (+ Phoenix/Jaeger) | §12; LangSmith solo cubre bien la capa LLM |
| Entorno con auditoría estricta de dependencias / air-gap | **Capa ② + SDK mínimo** | Menor superficie; framework completo solo si el negocio lo exige |

### Alternativas por capa

| Capa | Opción sin LangChain (hands-on del curso) | Cuándo preferirla |
|------|------------------------------------------|-------------------|
| **RAG** (ingesta → retrieve → generar) | [rag-sin-langchain.md](./rag-sin-langchain.md) — LlamaIndex, Haystack, SDK nativo | Proyecto centrado en índices/query engines; mínimas deps; comparativa IBM M2/M4 |
| **Agentes** (tools, ReAct, multi-agente) | [agentes-sin-langchain.md](./agentes-sin-langchain.md) — CrewAI, AutoGen/AG2, Pydantic-AI, loop nativo | Roles declarativos (CrewAI), diálogo emergente (AutoGen), validación tipada (Pydantic-AI), o control total (loop) |
| **Observabilidad** | Langfuse, OpenTelemetry (+ Phoenix) | Self-host, sin lock-in a LangChain Inc.; ver §12 |
| **Structured output** | `instructor`, `outlines` | Sin acoplar a `with_structured_output`; ver §7 |

### Cómo elegir / cuándo cada uno

Si llegas a este documento **desde cero**, no interpretes las críticas como "evita LangChain": el curso lo usa en la capa ③ porque RAGorbit codegen y los templates están alineados con LCEL/LangGraph, y porque cambiar de proveedor o componer pipelines largos es más barato con esas piezas. **Sí evítalo** (o retrásalo) cuando aún no entiendes qué hace cada paso — ahí la capa ② es obligatoria, no opcional — o cuando tu organización ya eligió otro framework y mezclar dos stacks solo duplica deuda.

Para **observabilidad**, LangSmith en desarrollo + Langfuse/OTel en producción es una combinación razonable y no contradice §12. Para **agentes simples**, el SDK nativo o Pydantic-AI puede bastar; reserva LangGraph para flujos que §9 ya marca como producción (checkpoints, HITL, auditoría). La regla práctica del curso: **entiende el mecanismo en ②, elige la herramienta en ③, y sabe nombrar la alternativa en la tabla de arriba** antes de que un post de Reddit decida por ti.

---

> **Cross-links**
>
> - Catálogo de nodos (ficha por nodo): [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Plan del curso (módulos y "Compiten"): [`PLAN.md`](../PLAN.md) — especialmente §6 y §11
> - Guías por módulo:
>   - [M1 Fundamentos](../01-fundamentos/guia.md) — LLM, RAG mínimo, elección de modelo
>   - [M2 Ingesta](../02-ingesta/guia.md) — loaders, chunking, metadata
>   - [M3 Embeddings y stores](../03-embeddings-y-stores/guia.md) — índices, Chroma, FAISS, pgvector
>   - [M4 Retrieval y query](../04-retrieval-y-query/guia.md) — híbrido, rerank, GraphRAG
>   - [M5 Generación y lógica](../05-generacion-y-logic/guia.md) — structured output, evaluación
>   - [M6 Agentes I](../06-agentes-i/guia.md) — ReAct, memoria, LangGraph
> - Templates de industria: [`examples/`](../examples/)
> - Contrato Flow IR: [`docs/01-concepts.md`](../../docs/01-concepts.md)
> - Catálogo técnico de nodos: [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md)

---

*Documento de referencia del curso RAGorbit. Generado para estudio modular: léelo junto con la guía del módulo activo y vuelve aquí cuando necesites comparar alternativas.*

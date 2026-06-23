# Cobertura IBM "RAG and Agentic AI" (Coursera) ↔ este curso

> Mapeo detallado del programa profesional de IBM en Coursera (**10 cursos**) contra el currículum propio de este repositorio (**M0–M11**). El temario IBM fue **solo referencia de cobertura** — no seguimos ese curso ni replicamos sus labs. Construimos material propio, en español, con enfoque tri-modal (diseño + Python desde cero + frameworks reales) y lo **superamos** en producción, diseño y casos de industria. Ver [`PLAN.md §11`](../PLAN.md) y [`HANDOFF.md §2`](../HANDOFF.md).

---

## Índice

1. [Contexto y alcance](#1-contexto-y-alcance)
2. [Tabla principal: 10 cursos IBM → módulos](#2-tabla-principal-10-cursos-ibm--módulos)
3. [Skills IBM → dónde se adquieren](#3-skills-ibm--dónde-se-adquieren)
4. [Extras que añade este curso](#4-extras-que-añade-este-curso-y-el-programa-ibm-no-enfatiza)
5. [Checklist: si vienes del programa IBM](#5-checklist-si-vienes-del-programa-ibm-empieza-por)
6. [Conclusión](#6-conclusión)

---

## 1. Contexto y alcance

El programa IBM **"RAG and Agentic AI"** en Coursera consta de **10 cursos** que cubren, de forma progresiva, aplicaciones GenAI con LangChain, RAG, vector databases, RAG avanzado, multimodal, agentes, frameworks agénticos (LangGraph, CrewAI, AutoGen, BeeAI), MCP y un capstone integrador.

**Qué hicimos con esa referencia:**

| Aspecto | Programa IBM | Este curso |
|---------|--------------|------------|
| Rol del temario IBM | Curso a seguir | **Checklist de cobertura** — asegurar que no falte ningún tema |
| Material | Labs de Coursera | **Guías, ejercicios, talleres y soluciones propias** en `rag-training/` |
| Código | Principalmente frameworks | **Tri-modal**: ① diseño → ② scratch (stdlib) → ③ framework real |
| Casos de uso | Genéricos / datasets de curso | **10 templates de industria** de RAGorbit (aerolínea, banca, salud…) |
| Producción | Mínima | **M9 completo**: guardrails, HITL, Kafka, Temporal, AI Security |
| Evaluación final | Proyecto Coursera | **Capstone M11**: reconstruir 3 templates + diseñar arquitectura + examen |

**Cobertura de nodos RAGorbit:** las 13 categorías (`model`, `loader`, `ingest`, `store`, `retrieval`, `query`, `logic`, `agent`, `tool`, `guardrail`, `hitl`, `observability`, `io`) están mapeadas a módulos en [`PLAN.md §7`](../PLAN.md). Este documento cruza esa cobertura con el syllabus IBM.

---

## 2. Tabla principal: 10 cursos IBM → módulos

Cada fila desglosa los **temas del curso IBM**, dónde se cubren en **este curso** (módulo + carpeta) y **notas** de profundidad o diferencias.

### Curso 1 · Develop GenAI Apps

**Temas IBM:** LangChain básico, patrones de prompt, salida JSON, evaluación de modelos, despliegue con Flask.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Fundamentos de LLM (tokens, contexto, temperatura) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | + intuición de embeddings; elección modelo latencia/costo/calidad |
| Patrones de prompt (system/user, few-shot, CoT, in-context learning) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | Skill **Prompt Patterns**; comparativa Claude/OpenAI/Gemini/Llama |
| Por qué RAG vs fine-tune vs prompting | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | Patrón RAG mínimo ~40 líneas (scratch) + LangChain (③) |
| LangChain / LCEL (cadenas básicas) | **M1**, **M5** | M1 + [`../05-generacion-y-logic/`](../05-generacion-y-logic/) | Profundidad en M5: query engines, structured output |
| Salida JSON / structured output | **M5** | [`../05-generacion-y-logic/`](../05-generacion-y-logic/) | JSON Schema, `requireCitations`, instructor/outlines |
| Evaluación y elección de modelos | **M1**, **M5** | M1 + M5 | RAGAS, TruLens, DeepEval, promptfoo en M5 |
| APIs OpenAI (y alternativas) | **M1** | [`../01-fundamentos/`](../01-fundamentos/) | Skill **OpenAI API**; formato `proveedor:modelo` sin lock-in |
| UI Flask / despliegue ligero | **M9** | [`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/) | Flask + **Gradio/Streamlit**; targets FastAPI/SSE |

---

### Curso 2 · Build RAG Apps

**Temas IBM:** pipeline RAG end-to-end, Gradio, comparativa LlamaIndex vs LangChain.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Patrón RAG (retrieve → synthesize) | **M1**, **M5** | M1 + M5 | Template [09-RRHH](../../examples/09-hr-policy-assistant/) |
| Loaders y preparación de documentos | **M2** | [`../02-ingesta/`](../02-ingesta/) | PDF, tabular, web, SQL, S3; chunking y metadata |
| Embeddings e indexación | **M3** | [`../03-embeddings-y-stores/`](../03-embeddings-y-stores/) | Chroma, FAISS, pgvector; ver curso 3 |
| Retrieval y generación con contexto | **M4**, **M5** | M4 + M5 | Híbrido, rerank, citas obligatorias |
| LlamaIndex (readers, query engines) | **M2**, **M4** | M2 + M4 | Hands-on: trocear PDF legal + retriever LlamaIndex |
| LangChain vs LlamaIndex (trade-offs) | **M2**, **M4**, **M5** | M2–M5 | Tabla en [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) |
| Gradio para prototipar RAG | **M9** | [`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/) | UI conversacional; también Streamlit |

---

### Curso 3 · Vector DBs for RAG

**Temas IBM:** ChromaDB (operaciones CRUD), similitud vectorial, sistemas de recomendación.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Embeddings (dimensiones, normalización, métricas) | **M3** | [`../03-embeddings-y-stores/`](../03-embeddings-y-stores/) | Coseno, dot, L2; OpenAI vs Cohere vs BGE/E5 local |
| Índices vectoriales (HNSW, IVF, flat) | **M3** | M3 | Comparativa HNSW vs flat en taller |
| ChromaDB: add/update/delete/manage | **M3** | M3 | Skill **Vector DBs**; nodo `store.chroma` |
| FAISS a mano | **M3** | M3 | Implementación scratch + comparación con Chroma |
| Vector store vs BD tradicional | **M3** | M3 | pgvector, Qdrant, Pinecone, Weaviate, Milvus |
| Sistemas de recomendación con embeddings | **M3** | M3 | Extra IBM explícito; analogía item↔item y user↔item |
| Persistencia y colecciones | **M3** | M3 | Template 09 (Chroma), 02 (pgvector) |

---

### Curso 4 · Advanced RAG

**Temas IBM:** FAISS, HNSW, retrievers avanzados, Gradio.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| FAISS / HNSW en profundidad | **M3**, **M4** | M3 + [`../04-retrieval-y-query/`](../04-retrieval-y-query/) | Índices en M3; retrievers que los consumen en M4 |
| BM25 / búsqueda keyword | **M4** | M4 | Denso vs keyword vs **híbrido** (`alpha`) |
| Reranking (cross-encoder) | **M4** | M4 | BGE-reranker, Cohere, ColBERT |
| Retrievers LangChain y LlamaIndex | **M4** | M4 | EnsembleRetriever, VectorIndexRetriever, ParentDocument |
| Parent-child retrieval | **M4** | M4 | Nodo `retrieval.parent-child` |
| Query rewriting e intent | **M4** | M4 | `query.rewrite`, `query.intent` / `model.intent` |
| Filtros en retrieval | **M4**, **M9** | M4 + M9 | **Hard-filters** como guardrail de negocio (más profundo que IBM) |
| Multi-index routing | **M4** | M4 | `store.multi-index` + `retrieval.router`; template 07 telecom |
| GraphRAG (Neo4j) | **M4** | M4 | **Extra de profundidad** vs IBM; `store.neo4j`, `retrieval.graph` |
| Gradio para evaluar retrieval | **M9** | M9 | UI para inspeccionar chunks recuperados |

---

### Curso 5 · Multimodal

**Temas IBM:** Whisper, DALL·E, Sora, Hugging Face, watsonx, Granite.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Conceptos multimodal (texto/voz/imagen/video) | **M10** | [`../10-multimodal/`](../10-multimodal/) | Retos: alineación, costo, latencia |
| STT / Whisper | **M10**, **M9** | M10 + M9 | Nodo `io.stt`; template 07 call center |
| Visión (describir imágenes, tablas→JSON) | **M10**, **M2** | M10 + M2 | `model.vision`, `loader.multimodal`; templates 04, 08 |
| Generación imagen (DALL·E, SDXL) | **M10** | M10 | Conceptual + lab |
| Generación audio / TTS | **M10** | M10 | Sora mencionado como referencia de video generativo |
| Modelos abiertos (HF, watsonx, Granite, Llama) | **M10**, **M1** | M10 + M1 | Comparativa proveedores cerrados vs open-weights |
| Embeddings y vector DB multimodal | **M10**, **M3** | M10 + M3 | Indexación de descripciones visuales en pipeline RAG |

---

### Curso 6 · Fundamentals of AI Agents

**Temas IBM:** tool calling, chaining, agentes built-in de LangChain, visualización y SQL.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| De RAG a agente (cuándo agentizar) | **M6** | [`../06-agentes-i/`](../06-agentes-i/) | Agentic RAG: el agente decide cuándo recuperar |
| Tool calling y schemas | **M6** | M6 | Skill **Tool Calling**; nodos `tool.*` |
| Chaining de tools | **M6** | M6 | Secuencias multi-paso antes de responder |
| Bucle ReAct (razonar → actuar → observar) | **M6** | M6 | `agent.react`; scratch + LangGraph |
| Agentes built-in LangChain (datos, SQL) | **M6** | M6 | Agente SQL y de datos en taller |
| Agente de visualización de datos | **M6** | M6 | Lab explícito (IBM lo menciona; aquí con expected result) |
| RAG como tool (`tool.retriever`) | **M6** | M6 | PolicyRAG en template 01 aerolínea |
| LangGraph `StateGraph` (intro) | **M6** | M6 | Conceptual; profundidad en M7 |

---

### Curso 7 · Agentic AI with LangChain / LangGraph

**Temas IBM:** memoria, Reflection/Reflexion, ReAct, multi-agente, agentic RAG.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Memoria (corto/largo plazo, conversacional) | **M6**, **M7** | M6 + [`../07-agentes-ii/`](../07-agentes-ii/) | Estado en LangGraph; checkpoints en M7 |
| Reflection / Reflexion (auto-mejora) | **M6** | M6 | Comparativa ReAct vs Plan-and-Execute vs Reflexion |
| ReAct a fondo | **M6** | M6 | Taller: memoria + 2 tools, expected de secuencia |
| Agentic RAG | **M6**, **M4** | M6 + M4 | Query routing por el agente, no pipeline fijo |
| LangGraph: grafos, edges, estado | **M6**, **M7** | M6 + M7 | Skill **LangChain/LangGraph** |
| Multi-agente (intro y patrones) | **M7** | M7 | Supervisor, jerárquico, colaborativo |
| Conditional edges y checkpoints | **M7** | M7 | Persistencia de estado entre pasos |

---

### Curso 8 · Agentic AI with CrewAI / AutoGen / BeeAI

**Temas IBM:** frameworks alternativos y patrones multi-agente.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| CrewAI (agents, tasks, crews, tools) | **M7** | [`../07-agentes-ii/`](../07-agentes-ii/) | Hands-on mismo problema en CrewAI y LangGraph |
| AutoGen / AG2 (conversación entre agentes) | **M7** | M7 | Patrón diálogo multi-rol |
| BeeAI | **M7** | M7 | Cuarto framework en la comparativa |
| Patrones multi-agente (supervisor, fan-out) | **M7** | M7 | `agent.fanout`; template 10 logística |
| Cuándo multi-agente vs un solo agente | **M7**, **M11** | M7 + M11 | Tabla trade-offs; anti-patrones en M11 |
| Selección y combinación de frameworks | **M7** | M7 | vs Semantic Kernel (referencia) |
| Skill **GenAI Agents** / **Agentic** | **M6**, **M7** | M6 + M7 | Agentes simples → orquestación compleja |

---

### Curso 9 · Model Context Protocol (MCP)

**Temas IBM:** FastMCP, server/client, STDIO/HTTP, seguridad.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Arquitectura MCP vs APIs tradicionales | **M8** | [`../08-mcp/`](../08-mcp/) | Skill **MCP** |
| FastMCP: construir server (tools, resources, prompts) | **M8** | M8 | Nodo `tool.mcp` |
| Cliente MCP (STDIO y Streamable HTTP) | **M8** | M8 | Conectar a uno y a varios servers |
| Seguridad MCP (sampling, roots, permisos) | **M8**, **M9** | M8 + M9 | Aprobación basada en permisos; enlaza AI Security |
| MCP vs plugins propietarios | **M8** | M8 | Comparativa en guía |
| Taller integrador | **M8** | M8 | PolicyRAG de aerolínea como MCP server |

---

### Curso 10 · Capstone

**Temas IBM:** data→deploy, unstructured→JSON, multimodal + multi-agente, MCP, testing.

| Tema IBM | Módulo(s) | Carpeta | Notas |
|----------|-----------|---------|-------|
| Pipeline completo data → producción | **M11**, **M9** | [`../11-capstone/`](../11-capstone/) + M9 | 4 deployment targets: chat, Kafka worker, Temporal, batch |
| Unstructured → JSON estructurado | **M2**, **M5** | M2 + M5 | `loader.multimodal`, `logic.structured` |
| Multimodal + multi-agente integrados | **M10**, **M7**, **M11** | M10 + M7 + M11 | Templates reales, no dataset genérico |
| MCP en proyecto final | **M8**, **M11** | M8 + M11 | Opcional en diseño de capstone |
| Testing de sistemas de IA | **M5**, **M11** | M5 + M11 | RAGAS como test; system testing en M11 |
| Proyecto capstone | **M11** | M11 | **Supera IBM:** 3 templates desde cero + diseño nuevo + examen 50 preguntas |
| Los 10 templates de industria | **M1–M11** | Todos | Mapa en [`plantillas-mapeadas.md`](./plantillas-mapeadas.md) y [`PLAN.md §8`](../PLAN.md) |

---

### Resumen visual (curso IBM → módulo principal)

| # | Curso IBM | Módulo(s) principal(es) |
|---|-----------|-------------------------|
| 1 | Develop GenAI Apps | M1, M5, M9 |
| 2 | Build RAG Apps | M1, M2, M4, M9 |
| 3 | Vector DBs for RAG | M3 |
| 4 | Advanced RAG | M3, M4 |
| 5 | Multimodal | M10 |
| 6 | Fundamentals of AI Agents | M6 |
| 7 | Agentic AI LangChain/LangGraph | M6, M7 |
| 8 | Agentic AI CrewAI/AutoGen/BeeAI | M7 |
| 9 | MCP | M8 |
| 10 | Capstone | M11 (+ transversal M9) |

---

## 3. Skills IBM → dónde se adquieren

El programa IBM certifica competencias en **11 áreas**. Esta tabla indica el **módulo principal**, módulos de refuerzo y el **entregable** donde se demuestra la skill.

| Skill IBM | Módulo principal | También en | Cómo se demuestra |
|-----------|------------------|------------|-------------------|
| **RAG** | M1 → M5 | M2, M3, M4, M6 | Taller M1 (RAG mínimo); pipeline completo M2–M5; agentic RAG M6 |
| **Vector DBs** | M3 | M4 | Taller Chroma + FAISS; filtros metadata; pgvector en template 02 |
| **Prompt Patterns** | M1 | M5, M6 | Few-shot, CoT, system prompts; prompts de agente en M6 |
| **LangChain / LangGraph** | M5, M6, M7 | M1, M2, M4 | LCEL, ReAct, StateGraph, multi-agente, checkpoints |
| **OpenAI API** | M1 | M3, M5, M6 | Interfaz multi-proveedor; embeddings y chat completions |
| **Tool Calling** | M6 | M7, M8 | ReAct con tools; MCP como evolución del tool calling |
| **GenAI Agents** | M6 | M7 | Agente ReAct + built-in SQL/viz |
| **Agentic** | M6, M7 | M11 | Reflection, memoria, multi-agente, fan-out, capstone |
| **Multimodal** | M10 | M2, M9 | STT, visión, generación; `io.stt` en call center |
| **MCP** | M8 | M9, M11 | Server FastMCP + cliente con permisos |
| **AI Security** | M9 | M6, M8 | Inyección, jailbreak, PII, guardrails, permisos MCP |

**Skill transversal no listada explícitamente en IBM pero cubierta aquí:**

| Skill adicional | Módulo | Nota |
|-----------------|--------|------|
| **LlamaIndex** | M2, M4, M5 | Readers, retrievers, query engines |
| **Evaluación RAG/Agentes** | M5, M11 | RAGAS, faithfulness, costo, latencia |
| **Diseño de arquitectura** | M11 | Flow IR, contratos, anti-patrones |
| **Producción / SRE** | M9 | Idempotencia, HITL, Kafka, Temporal, OTel |

---

## 4. Extras que añade este curso (y el programa IBM no enfatiza)

IBM cubre bien los fundamentos de RAG y agentes con frameworks. **Este curso añade** capacidades de **ingeniería de producción** y **diseño sistemático** que el programa Coursera apenas toca.

### Producción real

| Tema | Módulo | Nodo(s) RAGorbit | Por qué importa |
|------|--------|------------------|-----------------|
| **Idempotencia** | M9 | `guardrail.idempotency` | Pagos y reservas no se cobran dos veces (Stripe-like) |
| **Confirm-gate** | M9 | `guardrail.confirm` | Acciones irreversibles exigen confirmación del usuario |
| **Circuit breaker** / retry / fallback | M9 | `guardrail.resilience` | Degradación elegante cuando APIs externas fallan |
| **HITL** (hardcoded, no LLM) | M9 | `hitl.escalate` | Escalación determinista en salud, legal, mantenimiento |
| **Auditoría a Kafka** | M9 | `observability.audit` | Trazabilidad regulatoria de cada tool call |
| **Feedback loop** | M9 | `observability.feedback` | Mejora continua del reranker |
| **Temporal** / exactly-once | M9 | `io.trigger`, `io.event-source` | Workflows durables; Kafka `exactlyOnce` |
| **4 deployment targets** | M9 | `io.*` | chat-service, event-worker, batch, temporal |
| **AI Security** | M9 | `guardrail.*` + guías | Inyección, jailbreak, fuga PII, sesgos |
| **UIs de producción** | M9 | — | Gradio, Streamlit, Flask para operar el sistema |

### Conciencia de contratos y diseño

| Tema | Módulo | Referencia |
|------|--------|------------|
| Qué nodo puede conectarse con qué (Flow IR) | M0, M11 | [`docs/01-concepts.md`](../../docs/01-concepts.md) |
| 53 tipos de nodo en 13 categorías | Todos | [`catalogo-nodos.md`](./catalogo-nodos.md) |
| Anti-patrones y checklist de diseño | M11 | [`../11-capstone/`](../11-capstone/) |
| Reglas deterministas vs delegar al LLM | M5, M9 | `logic.rules`, umbrales de negocio |

### Diez casos de industria completos

Templates en `examples/` — cada uno recorre varios módulos:

| Template | Industria | Módulos dominantes |
|----------|-----------|-------------------|
| [09-RRHH](../../examples/09-hr-policy-assistant/) | RRHH | M1 → M3 |
| [02-Banca](../../examples/02-banking-credit-scoring/) | Banca | M2 → M5 |
| [03-Salud](../../examples/03-healthcare-prior-auth/) | Salud | M4 → M9 |
| [04-Seguros](../../examples/04-insurance-claims/) | Seguros | M2 → M5, M10 |
| [05-Legal](../../examples/05-legal-contract-review/) | Legal | M4 |
| [06-Retail](../../examples/06-retail-postsale-bot/) | Retail | M6 |
| [07-Telecom](../../examples/07-telecom-callcenter-copilot/) | Telecom | M4 → M7, M10 |
| [08-Manufactura](../../examples/08-manufacturing-maintenance-rag/) | Manufactura | M2 → M4, M10 |
| [01-Aerolínea](../../examples/01-airline-flight-change/) | Aerolínea | M6 → M8, M9, M11 |
| [10-Logística](../../examples/10-logistics-disruption-rebooking/) | Logística | M7 → M9, M11 |

### Reconstruir desde cero (no solo usar frameworks)

| Capa | Qué implica | Dónde |
|------|-------------|-------|
| ① Diseño | Por qué / cuándo / alternativas | Todas las guías |
| ② Scratch | Python stdlib, mocks deterministas | Todos los `lab/solucion_scratch.py` |
| ③ Framework | LangChain, LangGraph, LlamaIndex, CrewAI… | `lab/solucion_framework.py` |
| Capstone | Reconstruir 09 → 02 → 01 sin mirar codegen | M11 |

### RAG avanzado con más profundidad que IBM

| Tema | Módulo | IBM | Este curso |
|------|--------|-----|------------|
| **GraphRAG / Neo4j** | M4 | Mención ligera | Taller con `store.neo4j` + `retrieval.graph` |
| **Multi-index routing** | M4 | Básico | `store.multi-index` + `retrieval.router`; template telecom |
| **Hard-filters como guardrail** | M4, M9 | Filtros opcionales | Cláusulas WHERE obligatorias; sin filtro ⇒ ruido demostrado en lab |
| **Parent-child + rerank** | M4 | Parcial | Taller legal/médico con expected de precisión |

---

## 5. Checklist: si vienes del programa IBM, empieza por…

Mapa rápido de equivalencias para no repetir lo que ya dominas y ubicarte en este currículum.

### Ya completaste el curso IBM 1–2 (GenAI + RAG básico)

- [ ] Salta la teoría repetida de M1 y ve directo al **taller** de [`../01-fundamentos/lab/`](../01-fundamentos/lab/) — valida que puedes el RAG mínimo en scratch.
- [ ] Estudia M2 ([`../02-ingesta/`](../02-ingesta/)): chunking por cláusula y metadata — IBM no profundiza tanto en metadata para filtros.
- [ ] Repasa [`catalogo-nodos.md`](./catalogo-nodos.md) §2–§3 para conectar loaders/ingest con RAGorbit.

### Ya completaste los cursos IBM 3–4 (Vector DBs + Advanced RAG)

- [ ] M3 ([`../03-embeddings-y-stores/`](../03-embeddings-y-stores/)): confirma Chroma ops + FAISS scratch.
- [ ] **Prioriza M4** ([`../04-retrieval-y-query/`](../04-retrieval-y-query/)): híbrido, rerank, **hard-filters**, **multi-index**, **GraphRAG** — aquí superamos al programa IBM.
- [ ] Abre el template [05-Legal](../../examples/05-legal-contract-review/) o [07-Telecom](../../examples/07-telecom-callcenter-copilot/) para ver routing en acción.

### Ya completaste el curso IBM 5 (Multimodal)

- [ ] M10 ([`../10-multimodal/`](../10-multimodal/)) — repaso rápido si ya usaste Whisper.
- [ ] Conecta con M2: `loader.multimodal` y template [08-Manufactura](../../examples/08-manufacturing-maintenance-rag/).

### Ya completaste los cursos IBM 6–8 (Agentes)

- [ ] M6 ([`../06-agentes-i/`](../06-agentes-i/)): valida ReAct + memoria + agentic RAG en scratch.
- [ ] **M7 es obligatorio** ([`../07-agentes-ii/`](../07-agentes-ii/)): mismo problema en CrewAI **y** LangGraph — IBM separa frameworks; aquí los comparamos en un solo taller.
- [ ] Template [01-Aerolínea](../../examples/01-airline-flight-change/) para ver agente + tools + guardrails.

### Ya completaste el curso IBM 9 (MCP)

- [ ] M8 ([`../08-mcp/`](../08-mcp/)): server + client + **seguridad/permisos** — profundiza más que el lab Coursera típico.
- [ ] Enlaza con M9: permisos MCP + AI Security.

### Ya completaste el capstone IBM 10

- [ ] **No te saltes M9** ([`../09-produccion-y-seguridad/`](../09-produccion-y-seguridad/)): idempotencia, HITL, Kafka, Temporal — probablemente tu mayor gap vs este curso.
- [ ] M11 ([`../11-capstone/`](../11-capstone/)): reconstruye templates 09, 02, 01 **sin mirar soluciones**; diseña arquitectura nueva; examen integrador.

### Tabla rápida IBM → primer módulo a abrir

| Si dominas IBM curso… | Empieza en este módulo | Si te sobra, salta a… |
|------------------------|------------------------|------------------------|
| 1 Develop GenAI Apps | M2 o taller M1 | M5 (JSON/eval) |
| 2 Build RAG Apps | M3 | M4 |
| 3 Vector DBs | M4 | M5 |
| 4 Advanced RAG | M5 o M6 | M9 (hard-filters en prod) |
| 5 Multimodal | M6 | M9 |
| 6 Fundamentals Agents | M7 | M8 |
| 7 LangGraph Agentic | M7 (CrewAI/AutoGen) | M8 |
| 8 CrewAI/AutoGen/BeeAI | M8 | M9 |
| 9 MCP | M9 | M11 |
| 10 Capstone | M9 + M11 | — |

### Setup común (todos los perfiles)

- [ ] M0 ([`../00-setup/`](../00-setup/)): entorno, repaso Python, primer `flow.json` en RAGorbit.
- [ ] Lee [`HANDOFF.md §3`](../HANDOFF.md): método tri-modal y restricción scratch/stdlib.

---

## 6. Conclusión

| Criterio | Programa IBM Coursera | Este curso (M0–M11) |
|----------|----------------------|----------------------|
| Temario RAG + Agentes + MCP + Multimodal | ✅ 10 cursos | ✅ **100% cubierto** (tabla §2) |
| Skills certificables IBM (11 áreas) | ✅ | ✅ **Todas mapeadas** (tabla §3) |
| Frameworks (LangChain, LangGraph, LlamaIndex, CrewAI, AutoGen, BeeAI, MCP) | ✅ | ✅ + comparativas y trade-offs |
| Producción (idempotencia, HITL, auditoría, Temporal) | ⚠️ Mínimo | ✅ **M9 dedicado** |
| Diseño y contratos (Flow IR, 53 nodos) | ❌ | ✅ **M0 + M11 + catálogo** |
| Casos de industria reales | ⚠️ Genéricos | ✅ **10 templates** |
| Implementación desde cero | ⚠️ Parcial | ✅ **Capa scratch en cada taller** |
| GraphRAG, multi-index, hard-filters | ⚠️ Superficial | ✅ **M4 en profundidad** |
| Evaluación final | Proyecto Coursera | ✅ **Capstone triple** (reconstruir + diseñar + examen) |

**Veredicto:** el plan v2 ([`PLAN.md §11`](../PLAN.md)) **cubre íntegramente** el temario IBM "RAG and Agentic AI" y lo **supera** en producción, conciencia de diseño, casos de industria y capacidad de reconstruir sistemas desde cero. El temario IBM sirvió como **red de seguridad** para la cobertura; el material, el orden pedagógico y los entregables son **propios** de este repositorio.

---

*Documentos relacionados: [`PLAN.md`](../PLAN.md) · [`HANDOFF.md`](../HANDOFF.md) · [`catalogo-nodos.md`](./catalogo-nodos.md) · [`plantillas-mapeadas.md`](./plantillas-mapeadas.md) · [`tecnologias-comparadas.md`](./tecnologias-comparadas.md)*

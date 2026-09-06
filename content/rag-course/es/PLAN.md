# 🎓 RAG & Agentic AI — Plan de estudio de cero a experto (v2)

> Currículum para dominar **todo lo que hay dentro de RAGorbit** y más: RAG, embeddings, vector stores, knowledge graphs, agentes, multi-agente, MCP, multimodal, guardrails, seguridad, observabilidad y despliegue — hasta poder **diseñar estas arquitecturas y reconstruir los 10 templates desde cero en código**.
>
> **Este archivo es el PLAN.** El material se genera **tras tu aprobación**.
>
> **v2:** enfoque de código **tri-modal** (diseño + Python desde cero + frameworks reales) y **cobertura completa del temario IBM "RAG and Agentic AI" de Coursera** (+ extras de producción que ese programa no cubre). Ver §11.

---

## 1. Resultado esperado (al terminar serás capaz de…)

1. Explicar **qué hace, cuándo usar y qué alternativas tiene** cada una de las 13 categorías de nodo de RAGorbit.
2. **Construir desde cero, en Python**, cada uno de los 10 templates — y también su versión con **frameworks reales** (LangChain/LangGraph/LlamaIndex).
3. **Diseñar** una arquitectura RAG/agéntica nueva: elegir loaders, chunking, store, retrieval, modelo, guardrails, framework y despliegue — justificando cada decisión frente a las tecnologías que compiten.
4. Construir **agentes** (tool calling, ReAct, **memoria**, **Reflection/Reflexion**) y **sistemas multi-agente** con **LangGraph, CrewAI, AutoGen/AG2 y BeeAI**.
5. Construir e integrar **servidores y clientes MCP** (FastMCP, STDIO/HTTP) con su **modelo de seguridad** (sampling, roots, permisos).
6. Manejar **multimodal**: STT (Whisper), visión, y generación de imagen/audio.
7. **Evaluar** RAG (faithfulness, groundedness, context precision/recall) y agentes (éxito, costo, latencia).
8. Aplicar **AI Security & Responsible AI**: inyección de prompts, fuga de datos/PII, jailbreaks, permisos.
9. Llevar a **producción**: guardrails, idempotencia, HITL, auditoría/observabilidad, UIs (Gradio/Streamlit), y los 4 targets (chat-service, event-worker, batch, temporal).

**Criterio de "experto" (autoevaluable):** resolver el **capstone** (reconstruir 3 templates desde cero + diseñar 1 arquitectura nueva + examen) sin mirar soluciones.

---

## 2. Método — enfoque tri-modal (lo que pediste)

Cada concepto y cada taller se aborda en **tres capas**, sin perder profundidad de las herramientas reales:

```
①  DISEÑO/CONCEPTO   →   ②  DESDE CERO (Python puro)   →   ③  FRAMEWORK REAL (con profundidad)
   por qué / cuándo /        implementas el mecanismo         cómo se hace en LangChain/LangGraph/
   qué lo reemplaza          a mano para entenderlo           LlamaIndex/CrewAI/AutoGen/MCP, a fondo
```

Ciclo por módulo: **GUÍA → EJERCICIOS (con respuesta) → TALLER (realista, con *expected results*, en las 3 capas) → CHECKPOINT**.

- **Guías** — desde cero, con diagramas, analogías y "cuándo usar / cuándo NO"; cada tema anclado a un nodo de RAGorbit y a su(s) template(s).
- **Ejercicios** — conceptuales y de código, **todos con respuesta** (en archivo aparte). Tipos: opción múltiple razonada, "predice la salida", "encuentra el bug", "elige la tecnología".
- **Talleres** — enunciado + datos de muestra + **expected result concreto** + pistas escalonadas + **solución en las 3 capas**. Diseñados para que, tras leer las guías del módulo, **puedas resolverlos**.
- **Checkpoint** — rúbrica "lo sabes si puedes…" + qué repasar.

---

## 3. Prerrequisitos y setup

- **Python intermedio** (funciones, clases, async, pip/venv); repaso exprés en M0.
- Cero conocimiento previo de ML/IA requerido.
- **Dos modos de trabajo:**
  - **Sin red/sin claves** (para aprender, costo cero): runtime mock de RAGorbit + libs locales (índices en memoria, embeddings locales, modelos via Ollama opcional).
  - **Real** (opcional): API key de un LLM; Docker para pgvector/Qdrant/Neo4j/Kafka (`infra/`); Hugging Face/Ollama para modelos abiertos.
- Cada concepto se puede ver **funcionando** en la webapp (`python3 -m ragorbit serve`) y en `examples/`.

---

## 4. Presupuesto de tiempo (2 a 2½ meses a tiempo completo)

Núcleo **8 semanas (~320 h)**; con la profundidad extra (multi-agente, MCP, multimodal generativo, seguridad, UIs) se extiende a **~9–10 semanas**. Por día: ~3 h guía + ~2 h ejercicios + ~3 h taller.

| Sem | Módulo | Foco | Nodos RAGorbit |
|-----|--------|------|----------------|
| 0 (½) | M0 | Setup + repaso Python + recorrido por RAGorbit | — |
| 1 | M1 | Fundamentos LLM, prompting, in-context learning, evaluación/elección de modelo | `model` |
| 2 | M2 | Ingesta: loaders, chunking, metadata (LangChain vs LlamaIndex vs Unstructured) | `loader`, `ingest` |
| 3 | M3 | Embeddings + Vector stores (Chroma, FAISS/HNSW, pgvector, Qdrant…) + recomendación | `store` |
| 4 | M4 | Retrieval avanzado + Query (híbrido, rerank, filtros duros, multi-index, GraphRAG) | `retrieval`, `query` |
| 5 | M5 | Generación + lógica + evaluación RAG (structured, citas, rules, router; RAGAS) | `logic` |
| 6 | M6 | Agentes I: tool calling, ReAct, memoria, Reflection/Reflexion, agentic RAG | `agent`, `tool` |
| 7 | M7 | Agentes II: multi-agente con LangGraph, CrewAI, AutoGen/AG2, BeeAI | `agent`, `tool` |
| 8 | M8 | MCP a fondo: FastMCP server, clients (STDIO/HTTP), seguridad (sampling/roots/permisos) | `tool.mcp` |
| 9 | M9 | Producción & Seguridad: guardrails, HITL, observabilidad, io, despliegue, AI Security, UIs | `guardrail`, `hitl`, `observability`, `io` |
| 9–10 | M10 | Multimodal: STT/Whisper, visión, generación imagen/audio | `io.stt`, `model.vision` |
| 10 | M11 | Arquitectura + **Capstone** (reconstruir templates + diseñar + examen) | todos |

---

## 5. Estructura de carpetas del material (se generará)

```
rag-training/
  PLAN.md  README.md
  00-setup/ … 11-capstone/        (cada uno: guia-*.md · ejercicios.md · soluciones.md · lab/)
  referencia/
    catalogo-nodos.md             ficha por nodo: qué hace · cuándo usar · alternativas
    tecnologias-comparadas.md     tablas (stores, frameworks de agentes, rerankers, eval, UIs…)
    glosario.md
    plantillas-mapeadas.md        los 10 templates explicados y mapeados a módulos
    cobertura-ibm-coursera.md     mapeo temario IBM ↔ este curso (§11)
  soluciones/                     soluciones de talleres (separadas)
```
Cada `lab/`: `enunciado.md`, `datos/`, `expected.md`, `solucion-scratch.py`, `solucion-framework.py`, `solucion.md`.

---

## 6. Módulos en detalle

### M0 · Setup y repaso *(½ sem)*
Entorno (venv, modo sin-red y real); repaso Python (typing, dataclasses, async, JSON, requests); correr RAGorbit y leer un `flow.json`. **Taller:** cargar RRHH, "Probar con mocks", identificar nodos y conexiones.

### M1 · Fundamentos LLM + RAG — `model` *(Sem 1)*
LLMs, tokens, ventana de contexto, temperatura; **prompting y patrones** (system/user, few-shot, in-context learning, chain-of-thought); **por qué RAG**; patrón RAG mínimo; embeddings (intuición). **Elección/evaluación de modelos** (latencia/costo/calidad). **Compiten:** Claude vs OpenAI vs Gemini vs Llama/Mistral; cerrado vs open-weights; **Hugging Face / Ollama / watsonx**; RAG vs fine-tune vs prompting. **Template:** 09-RRHH. **Taller:** RAG mínimo en ~40 líneas (scratch) + versión LangChain (③).

### M2 · Ingesta — `loader` + `ingest` *(Sem 2)*
Fuentes (PDF, tablas, web, SQL, S3, multimodal); parsing; **chunking** (fixed/recursive/semantic/by-layout/by-clause, overlap); **metadata** y su rol en filtros. **Compiten:** LangChain loaders vs LlamaIndex readers vs **Unstructured**. **Templates:** 09, 02, 08, 04. **Taller:** trocear PDF legal por cláusula + metadata; scratch + LlamaIndex. *Expected:* N chunks con {text, metadata, source} verificables.

### M3 · Embeddings y Vector Stores — `store` *(Sem 3)*
Embeddings a fondo (dimensiones, normalización, coseno/dot/L2); **índices** (HNSW, IVF, flat); persistencia y colecciones; **operaciones en ChromaDB** (add/update/delete/manage); **FAISS** a mano; vector vs BD tradicional; **sistemas de recomendación** con embeddings. **Compiten:** Chroma vs FAISS vs pgvector vs Qdrant vs Pinecone vs Weaviate vs Milvus (tabla); embeddings OpenAI vs Cohere vs **BGE/E5 locales**. **Templates:** 02 (pgvector), 09 (chroma). **Taller:** indexar 50 docs en Chroma + FAISS, top-k con filtro de metadata; comparar HNSW vs flat. *Expected:* top-3 ids y recall esperados.

### M4 · Retrieval avanzado + Query — `retrieval` + `query` *(Sem 4)*
Denso vs **BM25/keyword** vs **híbrido**; **reranking** (cross-encoder); **parent-child**; **filtros duros como guardrail**; **multi-index routing**; **query rewriting** e **intent**; **GraphRAG** (Neo4j: nodos/relaciones, recuperación por vecindario). **Compiten:** BM25/Elastic, rerankers (Cohere, **BGE-reranker**, **ColBERT**), **GraphRAG (Microsoft)** vs vector; retrievers de **LlamaIndex** vs LangChain. **Templates:** 05, 07, 08, 03 + GraphRAG. **Taller:** híbrido + rerank + hard-filter sobre políticas; scratch + LangChain/LlamaIndex. *Expected:* sin filtro hay ruido; con filtro top-3 esperado y citable.

### M5 · Generación, lógica y evaluación — `logic` *(Sem 5)*
Síntesis con contexto; **structured output** (JSON schema; tool-calling/JSON-mode/**instructor**/**outlines**); **citas obligatorias**; **rules** deterministas (no delegar umbrales al LLM); **router/condicional**; **evaluación RAG** (faithfulness, answer/context relevance, precision/recall). **Compiten:** LCEL vs LlamaIndex query engines; eval: **RAGAS, TruLens, DeepEval, promptfoo**. **Templates:** 02, 04, 08, 03. **Taller:** decisión estructurada con citas + chequeo de groundedness + eval con RAGAS (③). *Expected:* JSON conforme + `citations` no vacío; caso sin evidencia ⇒ "no determinable".

### M6 · Agentes I (fundamentos) — `agent` + `tool` *(Sem 6)*
De RAG a **agente**; **tool calling** y chaining; bucle **ReAct** (razonar→actuar→observar); **memoria** (corto/largo plazo, conversacional, estado); **Reflection / Reflexion** (auto-mejora); **agentic RAG** (el agente decide cuándo/qué recuperar y rutea queries); **agentes built-in** de LangChain (datos, **visualización**, SQL); `tool.retriever` (RAG como tool). **LangGraph `StateGraph`** desde cero conceptual. **Compiten:** ReAct vs Plan-and-Execute vs Reflexion. **Templates:** 01, 06, 07. **Taller:** agente ReAct con memoria + 2 tools (scratch) y luego con **LangGraph** (③); + un **agente de visualización de datos**. *Expected:* secuencia de tool calls + respuesta correcta; el agente recuerda el turno previo.

### M7 · Agentes II (multi-agente y frameworks) — `agent` *(Sem 7)*
Patrones multi-agente (supervisor, jerárquico, colaborativo, **fan-out** stateless); orquestación; cuándo multi-agente vs uno solo. **Hands-on con profundidad** de: **LangGraph** (multi-agente, conditional edges, checkpoints), **CrewAI** (agents/tasks/crews/tools), **AutoGen/AG2** (conversación entre agentes), **BeeAI**. Selección y combinación de frameworks. **Compiten:** tabla LangGraph vs CrewAI vs AutoGen vs BeeAI vs Semantic Kernel (memoria, control, curva, casos). **Template:** 10 (fan-out/event-driven). **Taller:** el mismo problema (rebooking de disrupción) resuelto en **CrewAI** y en **LangGraph multi-agente**; comparar. *Expected:* ambos procesan N eventos con auto-confirm vs LLM; tabla de trade-offs.

### M8 · Model Context Protocol (MCP) a fondo — `tool.mcp` *(Sem 8)*
Arquitectura MCP y en qué difiere de APIs/tool-calling tradicional; **FastMCP**: construir un **server** (tools, resources, prompts); construir **clients** (STDIO y **Streamable HTTP**); conectar a uno y a varios servers; **seguridad MCP**: sampling, roots, **aprobación basada en permisos**. **Compiten:** MCP vs plugins/funciones propietarias. **Taller:** exponer el `PolicyRAG` de la aerolínea como **MCP server** y consumirlo desde un agente (cliente MCP) con aprobación de permisos. *Expected:* el agente lista y llama el tool MCP; una acción sensible exige aprobación.

### M9 · Producción & Seguridad — `guardrail` + `hitl` + `observability` + `io` *(Sem 9)*
**Guardrails** (pre-tool, **confirm-gate**, **idempotencia**, **circuit breaker**/retry/fallback); **HITL** (escalación hardcoded en casos críticos); **observabilidad** (audit a Kafka/log, **feedback loop**, métricas/**OpenTelemetry**); **io** (chat, **STT/voz**, **eventos/Kafka**, batch, notificaciones); **deployment targets** (FastAPI/SSE-WebSocket, Kafka worker, **Temporal**, batch). **AI Security & Responsible AI:** **inyección de prompts**, jailbreaks, **fuga de datos/PII**, salida insegura, permisos (enlaza con MCP), sesgos. **UIs:** **Gradio / Streamlit / Flask** para interactuar con tu RAG/agente. **Compiten:** **Guardrails AI** vs **NeMo Guardrails** vs propio; **LangSmith** vs **Langfuse** vs OpenTelemetry/Phoenix; Temporal vs colas+estado. **Templates:** 01, 10, 07, 03/08. **Taller:** envolver pago con **idempotencia + confirm-gate** + audit a un bus + **un test de inyección de prompts** que el guardrail bloquea; UI en Gradio. *Expected:* 1er cobro `captured`, 2º `deduplicated`, prompt malicioso rechazado, ≥1 evento de auditoría.

### M10 · Multimodal *(Sem 9–10)*
Conceptos y retos multimodal (texto/voz/imagen/video); **STT con Whisper**; **visión** (describir imágenes/diagramas, tablas→JSON); **generación** de imagen/audio (DALL·E/Sora/SDXL, TTS) — conceptual + lab; embeddings multimodales y **vector DB multimodal**. **Compiten:** Whisper vs Deepgram; modelos de visión; HF/watsonx/Granite/Llama. **Templates:** 08 (visión/ATA), 04 (visión daños), 07 (STT). **Taller:** pipeline que transcribe audio (o usa transcript mock), entiende una imagen (mock visión) y responde citando. *Expected:* JSON con transcript + descripción + respuesta citada.

### M11 · Arquitectura y Capstone *(Sem 10)*
Patrones transversales (RAG-as-tool, hard-filter-as-guardrail, determinista-vs-LLM, fan-out a escala, citas obligatorias, agentic RAG); leer y **diseñar** un `flow.json`; anti-patrones; checklist de diseño; **system testing** de sistemas de IA (eval como test). **Capstone:**
1. **Reconstruir desde cero** 3 templates (creciente: 09 → 02 → 01) en **scratch + framework**. *Expected:* pasan tests equivalentes a los del artefacto generado.
2. **Diseñar arquitectura nueva** ante un brief de negocio: diagrama + `flow.json` + justificación tecnológica. *Expected:* 0 errores de contrato en RAGorbit y "Probar con mocks" responde.
3. **Examen integrador** (50 preguntas) + defensa de diseño. **Rúbrica de experto** (correctitud, justificación, producción, seguridad, claridad).

---

## 7. Cobertura de las 13 categorías de nodo → módulo (100%)

| Categoría | Módulo principal | También |
|---|---|---|
| model | M1 | M10, todos |
| loader | M2 | M3,M4 |
| ingest | M2 | M3 |
| store | M3 | M4 |
| retrieval | M4 | M5,M6 |
| query | M4 | M6 |
| logic | M5 | M2,M11 |
| agent | M6 | M7,M11 |
| tool | M6 | M7,M8 |
| guardrail | M9 | M6 |
| hitl | M9 | M5 |
| observability | M9 | M7 |
| io | M9 | M1,M10 |

## 8. Los 10 templates → dónde se dominan
09 RRHH (M1→M3) · 02 Banca (M2→M5) · 03 Salud (M4→M9) · 04 Seguros (M2→M5/M10) · 05 Legal (M4) · 06 Retail (M6) · 07 Telecom (M4→M7/M10) · 08 Manufactura (M2→M4/M10) · 01 Aerolínea (M6→M8/M9/M11) · 10 Logística (M7→M9/M11).

---

## 9. Entregables (volumen estimado)

- **~45–55 guías** (4–6 por módulo) con diagramas y "cuándo usar / alternativas".
- **~12 sets de ejercicios** con solución (~180–220 ejercicios).
- **~16 talleres** con datos + *expected results* + solución **scratch y framework**.
- **5 docs de referencia** (catálogo de nodos, tecnologías comparadas, glosario, plantillas mapeadas, cobertura IBM).
- **Capstone** (briefs, rúbrica, soluciones). Todo en **español**, ejecutable en **modo sin red** (+ notas modo real).

---

## 10. Decisiones (resueltas)

- **Código:** tri-modal (diseño + scratch + framework real con profundidad). ✅
- **Idioma:** español. ✅
- **Orden de generación:** `referencia/` (catálogo, glosario, comparativas, cobertura IBM) → M0 → M1 → … → M11, **módulo por módulo** para estudiar mientras avanzo.

---

## 11. Cobertura del temario IBM "RAG and Agentic AI" (Coursera) + extras

| Curso IBM | Cubierto en | Notas |
|-----------|-------------|-------|
| 1. Develop GenAI Apps (LangChain, prompts, JSON, model eval, Flask) | **M1, M5, M9** | prompts/in-context (M1), JSON/structured (M5), UI Flask/Gradio (M9) |
| 2. Build RAG Apps (RAG, Gradio, **LlamaIndex** vs LangChain) | **M1, M2, M4, M9** | LlamaIndex hands-on en M2/M4; Gradio en M9 |
| 3. Vector DBs for RAG (ChromaDB ops, similitud, recomendación) | **M3** | ops Chroma + recomendación |
| 4. Advanced RAG (**FAISS, HNSW**, retrievers LlamaIndex/LangChain, Gradio) | **M3, M4** | FAISS/HNSW (M3), retrievers (M4) |
| 5. Multimodal (Whisper, DALL·E, Sora, HF, watsonx, Granite) | **M10** | STT/visión/generación + modelos abiertos |
| 6. Fundamentals of AI Agents (tool calling, chaining, agentes built-in, viz/SQL) | **M6** | + lab de agente de visualización |
| 7. Agentic AI LangChain/LangGraph (memoria, **Reflection/Reflexion/ReAct**, multi-agente, agentic RAG) | **M6, M7** | memoria + arquitecturas de auto-mejora |
| 8. Agentic AI **CrewAI/AutoGen/BeeAI** + patrones | **M7** | hands-on con cada framework + selección |
| 9. **MCP** (FastMCP server/client, STDIO/HTTP, seguridad) | **M8** | server+client+seguridad/permisos |
| 10. Capstone (data→deploy, unstructured→JSON, multimodal+multi-agente, MCP, testing) | **M11** | + nuestros 10 templates |

**Skills IBM (RAG, AI Security, Prompt Patterns, GenAI Agents, Agentic, Multimodal, Tool Calling, MCP, Vector DBs, LangChain/LangGraph, OpenAI API):** todas mapeadas arriba.

**Extras que añade este curso (y el programa IBM no enfatiza):**
- **Producción real**: idempotencia, **confirm-gate**, circuit breaker, **HITL** hardcoded, **auditoría a Kafka**, feedback loop, **Temporal**, exactly-once.
- **Conciencia de contratos / diseño correcto** (qué puede conectarse con qué).
- **10 casos de industria** completos (aerolíneas, banca, salud, seguros, legal, retail, telecom, manufactura, RRHH, logística).
- **Reconstruir todo desde cero** (no solo usar frameworks) + **diseñar** arquitecturas nuevas.
- **GraphRAG/Neo4j**, **multi-index routing**, **hard-filters como guardrail** con más profundidad.

> ✅ Conclusión: el plan v2 **cubre todo el temario IBM** y lo **supera** en producción, diseño desde cero y casos de industria. Al aprobar, genero `referencia/` + M0 + M1 y sigo en orden.

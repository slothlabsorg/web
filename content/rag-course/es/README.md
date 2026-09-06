# 🎓 RAG & Agentic AI — Curso de cero a experto

Curso práctico (en español) para dominar RAG, vector stores, retrieval, agentes, multi-agente, MCP, multimodal, guardrails, seguridad y despliegue — y poder **diseñar estas arquitecturas y reconstruir desde cero los 10 templates** de RAGorbit.

- **Plan completo / syllabus:** [PLAN.md](./PLAN.md) (12 módulos M0–M11, ~9–10 semanas a tiempo completo).
- **Cómo continuar generando el curso (otra sesión/modelo):** [HANDOFF.md](./HANDOFF.md).
- **Método:** cada tema en 3 capas → **① diseño/concepto · ② desde cero en Python · ③ framework real**. Ciclo por módulo: **guía → ejercicios (con respuesta) → taller (con *expected results*) → checkpoint**.

## Cómo recorrerlo

1. Empieza por [`00-setup`](./00-setup/) y sigue en orden numérico.
2. En cada módulo: lee `guia.md` → resuelve `ejercicios.md` (revisa `soluciones.md`) → haz el `lab/` (compara con `lab/solucion.md`).
3. Consulta `referencia/` cuando necesites una ficha de nodo, el glosario o comparar tecnologías.

## Mapa de módulos

| Módulo | Carpeta | Tema |
|--------|---------|------|
| M0 | `00-setup/` | Setup + repaso Python + recorrido por RAGorbit |
| M1 | `01-fundamentos/` | LLMs, prompting, RAG, embeddings (nodo `model`) |
| M2 | `02-ingesta/` | Loaders + chunking + metadata (`loader`, `ingest`) |
| M3 | `03-embeddings-y-stores/` | Embeddings + vector stores (`store`) |
| M4 | `04-retrieval-y-query/` | Retrieval avanzado + GraphRAG (`retrieval`, `query`) |
| M5 | `05-generacion-y-logic/` | Generación, structured, citas, eval (`logic`) |
| M6 | `06-agentes-i/` | Agentes: tool calling, ReAct, memoria, Reflexion (`agent`, `tool`) |
| M7 | `07-agentes-ii/` | Multi-agente y frameworks (LangGraph, CrewAI, AutoGen/AG2, BeeAI) (`agent`) |
| M8 | `08-mcp/` | Model Context Protocol a fondo: FastMCP server/client, seguridad (`tool.mcp`) |
| M9 | `09-produccion-y-seguridad/` | Guardrails, HITL, observabilidad, despliegue, AI Security, UIs (`guardrail`, `hitl`, `observability`, `io`) |
| M10 | `10-multimodal/` | STT/Whisper, visión, generación imagen/audio (`io.stt`, `model.vision`) |
| M11 | `11-capstone/` | Arquitectura + capstone (reconstruir templates + diseñar + examen) |

> Estado de generación: **curso completo** — M0–M11 + `referencia/` (catálogo de nodos, glosario, tecnologías comparadas, plantillas mapeadas, cobertura IBM). Ver [HANDOFF.md](./HANDOFF.md).

## Las tres capas, de verdad

Cada módulo enseña su capa ③ (framework real) **desde cero**, no la asume: hay una sección `## La capa ③ explicada: <framework> desde cero` en cada `guia.md` que parte de lo que ya construiste a mano (capa ②) y te lleva a entender —y poder escribir— el `lab/solucion_framework.py`. La base de LangChain se enseña en [M1 §11](./01-fundamentos/guia.md); los módulos posteriores enlazan ahí y solo añaden lo nuevo.

## Ingeniero de IA completo, no experto solo en `lang*`

El curso usa LangChain/LangGraph como default (es lo que genera RAGorbit), pero el objetivo es independencia de framework. Por eso:

- **Críticas honestas** al stack LangChain/LangGraph/LangSmith y cuándo NO usarlo: [`referencia/tecnologias-comparadas.md`](./referencia/tecnologias-comparadas.md#críticas-al-stack-langchain--langgraph--langsmith-y-cuándo-no-usarlo).
- **El mismo RAG del curso, sin LangChain**: LlamaIndex, Haystack y SDK nativo → [`referencia/rag-sin-langchain.md`](./referencia/rag-sin-langchain.md).
- **El mismo agente del curso, sin LangGraph**: loop nativo del SDK, CrewAI, AutoGen/AG2 y Pydantic-AI → [`referencia/agentes-sin-langchain.md`](./referencia/agentes-sin-langchain.md).

### Panorama del mercado (vendor-neutral)

Mapas amplios del ecosistema, sin casarse con ningún stack:

- **Bases de datos / almacenamiento** (vector dedicadas, relacional+vector, motores híbridos, NoSQL+vector, grafos, especializadas, y cuándo NO usar vector DB): [`referencia/panorama-bases-de-datos.md`](./referencia/panorama-bases-de-datos.md).
- **Procesos** (orquestación, serving/inferencia, pipelines de datos, despliegue, gateways de LLM): [`referencia/panorama-procesos.md`](./referencia/panorama-procesos.md).
- **Estrategias RAG** (HyDE, RAG-Fusion, RAPTOR, Contextual Retrieval, ColBERT, Self-RAG, CRAG, Adaptive/Agentic RAG…): [`referencia/panorama-estrategias-rag.md`](./referencia/panorama-estrategias-rag.md).

## Requisitos

Python 3.11+. Los talleres (capa ②, *scratch*) corren **solo con la librería estándar** (sin instalar nada, sin red). La capa ③ (frameworks) muestra el código real (LangChain/LangGraph/etc.); para ejecutarla instala las libs indicadas en cada lab.

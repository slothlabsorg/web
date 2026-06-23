# Plantillas de industria — mapeo pedagógico

> Los **10 templates** de `examples/` son casos de negocio completos expresados como **Flow IR** (JSON). Este documento explica qué problema resuelve cada uno, qué nodos usa, en qué módulos del curso se estudia y qué aprendes al reconstruirlo. Ficha técnica de nodos: [`catalogo-nodos.md`](./catalogo-nodos.md).

---

## Qué es un template y cómo leerlo

Un **template** en RAGorbit es un proyecto de ejemplo listo para abrir en el lienzo: un archivo `flow.json` que describe un grafo de nodos y sus conexiones. Ese JSON es el **Flow IR** (Intermediate Representation): la fuente de verdad que el codegen traduce a Python (`app/`, `mocks/`, `tests/`).

**Cómo leer un `flow.json`:**

1. **`flow`** — metadatos: `id`, `name`, `deploymentTarget` (chat-service, batch, event-worker…). El nodo de entrada lo fija automáticamente.
2. **`nodes[]`** — cada entrada tiene `id`, `type` (p. ej. `retrieval.vector`), `label` y `config`.
3. **`edges[]`** — conexiones entre puertos: `source` → `target` con `sourcePort` y `targetPort`. Los tipos de puerto (`Message`, `Chunks`, `Tool`, `Retriever`…) deben ser compatibles.
4. **`secrets[]`** — nombres de variables de entorno requeridas (nunca valores).

Para el contrato completo de puertos y targets de despliegue, consulta [`docs/01-concepts.md`](../../docs/01-concepts.md). Para los 53 tipos de nodo y sus campos de config, [`docs/02-node-catalog.md`](../../docs/02-node-catalog.md).

**En el curso:** cada template se ancla a uno o más módulos (M0–M11). El orden de dificultad para el capstone es **09 → 02 → 01** (ver sección final).

---

## Tabla resumen

| # | Template | Industria | Problema de negocio | Nodos clave (`type`) | Módulos donde se domina | Patrón arquitectónico principal |
|---|----------|-----------|---------------------|----------------------|-------------------------|--------------------------------|
| 09 | [RRHH](../../examples/09-hr-policy-assistant/) | Recursos Humanos | Empleados preguntan políticas repetitivas; RRHH pierde tiempo | `io.input`, `loader.pdf`, `ingest.chunker`, `store.chroma`, `retrieval.vector`, `logic.prompt`, `logic.citations` | M1, M2, M3 | **RAG conversacional mínimo** (un índice, citas obligatorias) |
| 02 | [Banca](../../examples/02-banking-credit-scoring/) | Banca / crédito | Evaluar expedientes heterogéneos (PDF + CSV) con decisión auditable | `io.batch`, `loader.pdf`, `loader.tabular`, `store.pgvector`, `retrieval.vector`, `logic.structured`, `logic.rules` | M2, M3, M4, M5 | **RAG batch + salida estructurada + reglas deterministas** |
| 04 | [Seguros](../../examples/04-insurance-claims/) | Seguros | Adjudicar siniestros (póliza + fotos) con cláusula citada | `io.batch`, `loader.multimodal`, `model.vision`, `logic.rules`, `logic.structured` | M2, M4, M5, M10 | **Ingesta multimodal + reglas + JSON con citas** |
| 05 | [Legal](../../examples/05-legal-contract-review/) | Legal / compliance | Revisar contrato vs playbook, normativa y precedentes | `store.multi-index`, `retrieval.router`, `retrieval.reranker`, `logic.structured`, `logic.citations` | M4 | **Multi-index routing + rerank + citas duales** |
| 08 | [Manufactura](../../examples/08-manufacturing-maintenance-rag/) | MRO aeronáutico | Consultar AMM con filtros por aeronave/capítulo ATA | `loader.multimodal`, `model.vision`, `retrieval.vector`, `logic.prompt`, `hitl.escalate` | M2, M4, M9, M10 | **RAG técnico multimodal + hard-filters + HITL** |
| 03 | [Salud](../../examples/03-healthcare-prior-auth/) | Salud / pagadores | Pre-autorización clínica con guías filtradas por plan | `retrieval.vector`, `tool.retriever`, `agent.react`, `logic.citations`, `hitl.escalate` | M4, M5, M6, M9 | **Agentic RAG + filtros duros + citas + escalación** |
| 07 | [Telecom](../../examples/07-telecom-callcenter-copilot/) | Telecom / call center | Copilot en tiempo real para agente humano en llamada | `io.stt`, `model.intent`, `query.rewrite`, `retrieval.router`, `io.panel`, `observability.feedback` | M4, M6, M7, M9, M10 | **Pipeline de voz + intent gate + multi-index + feedback loop** |
| 06 | [Retail](../../examples/06-retail-postsale-bot/) | E-commerce | Post-venta: pedidos, devoluciones, recomendaciones | `agent.react`, `tool.service`, `guardrail.confirm`, `guardrail.idempotency`, `observability.audit` | M6, M9 | **Agente ReAct transaccional** (sin RAG en línea; tools + guardrails) |
| 10 | [Logística](../../examples/10-logistics-disruption-rebooking/) | Logística / última milla | Rebooking masivo ante disrupción (Kafka, miles de envíos) | `io.event-source`, `logic.rules`, `logic.router`, `agent.fanout`, `tool.retriever`, `io.notify`, `observability.metrics` | M7, M9, M11 | **Fan-out event-driven + determinista vs LLM** |
| 01 | [Aerolínea](../../examples/01-airline-flight-change/) | Aerolíneas | Cambio de vuelo transaccional con cobro y auditoría | `agent.react`, `tool.retriever`, `tool.service`, `guardrail.idempotency`, `guardrail.confirm`, `guardrail.resilience`, `observability.audit` | M6, M8, M9, M11 | **Agente transaccional + RAG-as-tool + cadena de guardrails** |

---

## 09 · Asistente de políticas RRHH

**Carpeta:** [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)

### Problema de negocio

Los empleados hacen las mismas preguntas sobre vacaciones, beneficios y bajas; los manuales existen pero nadie los lee. Se necesita un bot que responda en lenguaje natural citando la sección exacta de la política, sin inventar cuando no hay evidencia.

### Diagrama del flujo (según `flow.json`)

```
[INGESTA — offline]
  loader.pdf ──Documents──▶ ingest.chunker ──Documents──▶ store.chroma
  model.embedding ──Embeddings──▶ store.chroma (collection: hr_policies)
                                      │
                                      └── Retriever ──▶ retrieval.vector

[RUNTIME — chat-service]
  io.input ──Message──▶ retrieval.vector ◀── Retriever (hr_store)
       │                      │ Chunks
       │                      ▼
       └──Message──▶ logic.prompt ◀── Model (model.llm)
                          │ Message
                          ▼
                    logic.citations ◀── Chunks (retriever)
                          │ Message
                          ▼
                      io.output (markdown)
```

### Nodos que usa

| `type` | Rol en el flujo |
|--------|-----------------|
| `io.input` | Entrada chat (`auth: none`) |
| `loader.pdf` | PDFs de políticas RRHH |
| `ingest.chunker` | Troceo `by-section` |
| `model.embedding` | Vectores para el índice |
| `store.chroma` | Store embebido local (`hr_policies`) |
| `retrieval.vector` | Búsqueda topK=4 |
| `model.llm` | Síntesis |
| `logic.prompt` | Plantilla de respuesta RRHH |
| `logic.citations` | `mode: enforce` |
| `io.output` | Markdown streaming |

### Técnicas RAG / agénticas que ilustra

- Pipeline RAG **lineal** (sin agente): retrieve → prompt → cite → output.
- **Chroma** como store de prototipo (sin Postgres).
- **Citas obligatorias** como guardrail de groundedness.
- Respuesta explícita de “no determinable” cuando falta evidencia (vía prompt + citations).

### Módulos del curso

| Módulo | Qué se practica con este template |
|--------|-----------------------------------|
| **M1** | RAG mínimo, `model.llm`, primer contacto con `flow.json` |
| **M2** | `loader.pdf`, `ingest.chunker` (`by-section`) |
| **M3** | `store.chroma`, `retrieval.vector`, embeddings |

### Qué aprendes reconstruyéndolo

Es el **punto de partida del capstone**: si puedes reconstruir el 09 en ~40 líneas (scratch) y luego con LangChain, dominas el esqueleto RAG que todos los demás templates extienden. Aprendes el contrato de puertos `Documents → Retriever → Chunks → Message` y por qué `logic.citations` va *después* del LLM, no en el prompt.

---

## 02 · Evaluación de potencial de crédito (banca)

**Carpeta:** [`../../examples/02-banking-credit-scoring/`](../../examples/02-banking-credit-scoring/)

### Problema de negocio

Un oficial de crédito recibe lotes de expedientes (declaraciones PDF, estados de cuenta, CSV financiero). El proceso manual es lento e inconsistente. Se necesita un job batch que emita JSON con `score`, `decision`, `factores` y `justificacion`, con citas a documentos y umbrales de aprobación **deterministas** (no delegados al LLM).

### Diagrama del flujo

```
io.batch ──Documents──▶ ingest.chunker ◀── loader.pdf
                              ▲              loader.tabular
                              │ Documents
                              ▼
                        ingest.metadata (doc_type, period)
                              │ Documents
  model.embedding ──Embeddings──▶ store.pgvector (credit_docs)
                                      │ Retriever
                                      ▼
                               retrieval.vector (topK:6, hardFilters)
                                      │ Chunks
  model.llm ──Model──▶ logic.structured (requireCitations: true)
                              │ Decision
                              ▼
                        logic.rules (≥70 aprobar, 40–69 revisar, else rechazar)
                              │ Decision
                              ▼
                          io.output (json)
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `io.batch` | Fuente de lote (`deploymentTarget: batch`) |
| `loader.pdf` / `loader.tabular` | Fuentes heterogéneas |
| `ingest.chunker` | `by-section` |
| `ingest.metadata` | `doc_type`, `period` |
| `model.embedding` | Embeddings |
| `store.pgvector` | Índice `credit_docs` |
| `retrieval.vector` | Hard-filters por expediente |
| `model.llm` | Temperatura 0.1 |
| `logic.structured` | Schema score/decision/factores/justificacion |
| `logic.rules` | Umbrales deterministas |
| `io.output` | JSON sin streaming |

### Técnicas que ilustra

- **Batch RAG** con múltiples loaders convergiendo en un chunker.
- **Metadata + hardFilters** para acotar recuperación al expediente correcto.
- **Structured output** con `requireCitations: true`.
- **Separación LLM / reglas**: el modelo puntúa y argumenta; `logic.rules` fija la decisión final.

### Módulos del curso

**M2 → M5** (ingesta, pgvector, retrieval con filtros, generación estructurada y evaluación RAG).

### Qué aprendes reconstruyéndolo

Segundo paso del capstone: combinas ingesta multi-fuente, store de producción (pgvector) y el patrón **“el LLM razona, la regla decide”** — crítico en dominios regulados. Aprendes a validar JSON contra schema y a no confiar en el campo `decision` que emite el LLM sin pasar por `logic.rules`.

---

## 04 · Adjudicación de reclamos de seguros

**Carpeta:** [`../../examples/04-insurance-claims/`](../../examples/04-insurance-claims/)

### Problema de negocio

Un ajustador recibe carpetas con póliza PDF y fotos del daño. Revisar manualmente cada caso toma 20–45 minutos y las decisiones son difíciles de auditar. Se necesita JSON por reclamo: `cubierto`, `monto_estimado`, `deducible_aplicado`, `clausula_aplicada`, `razon` — con cita a la cláusula y reglas deterministas para deducible, exclusiones y vigencia.

### Diagrama del flujo

```
io.batch ──Documents──▶ ingest.chunker ◀── loader.multimodal
                              │              (extractTables, describeImages)
                              ▼
                        ingest.metadata (policy_type, coverage_section)
                              │ Documents
  model.embedding ──Embeddings──▶ store.pgvector (policies)
  model.vision ──Model──┐              │ Retriever
                        │              ▼
                        └──▶ logic.structured ◀── retrieval.vector (hardFilters: policy_type)
                                    ▲              ▲ Chunks
                                    │              │
                              logic.rules ◀────────┘ (Chunks → Any)
                              (deducible, exclusión, vigencia)
                                    │ Decision
                                    ▼
                              io.output (json)

model.llm ──Model──▶ logic.structured
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `io.batch` | Carpeta S3 de reclamos |
| `loader.multimodal` | Tablas → JSON; imágenes → descripción |
| `model.vision` | Describe daños en fotos |
| `ingest.chunker` | `by-clause` (citabilidad legal) |
| `ingest.metadata` | Tipo de póliza y sección |
| `store.pgvector` | Índice `policies` |
| `retrieval.vector` | Filtro duro por `policy_type` |
| `logic.rules` | Elegibilidad determinista |
| `logic.structured` | Decisión con citas |
| `model.llm` | Síntesis estructurada |

### Técnicas que ilustra

- **Ingesta multimodal** (tablas estructuradas + visión).
- **Reglas antes que LLM** para umbrales financieros.
- **Hard-filters** para no mezclar tipos de póliza.
- Batch con **doble modelo** (LLM + vision) alimentando `logic.structured`.

### Módulos del curso

**M2, M4, M5, M10** (loaders multimodales, retrieval, structured output, visión).

### Qué aprendes reconstruyéndolo

Cómo extender el pipeline batch del 02 con **contenido no textual** y por qué `logic.rules` debe evaluar deducible/exclusión *sin* invocar al LLM. Prepara el terreno para M10 (visión) y refuerza M5 (citas en JSON).

---

## 05 · Revisión de contratos contra playbook (legal)

**Carpeta:** [`../../examples/05-legal-contract-review/`](../../examples/05-legal-contract-review/)

### Problema de negocio

Equipos legales deben comparar un contrato entrante con el playbook interno, la normativa vigente y precedentes. El volumen alto genera omisiones. El usuario pregunta por riesgos de una cláusula y recibe hallazgos estructurados (`alto`/`medio`/`bajo`) con **citas duales** (contrato + fuente de referencia).

### Diagrama del flujo

```
[Contrato bajo revisión]
  loader.pdf → ingest.chunker → store.pgvector (contract) → retrieval.vector
       ▲                                                          │ Chunks
  chat_input ──Message──▶ Query ──────────────────────────────────┘
       │                                                          │
       │                    [KB — 3 índices]                      │
       │  playbook/regulations/precedent: loader → chunker → store │
       │                          │ Retriever ×3                  │
       │                          ▼                               │
       │                   store.multi-index → retrieval.router ◀── Query
       │                                          │ Chunks
       │                                          ▼
       │                                   retrieval.reranker (topN:3)
       │                                          │ Chunks
       └──Message──▶ logic.citations ◀────────────┤
  model.llm ──Model──▶ logic.structured ◀─────────┘ (Chunks contrato + KB)
                              │ Decision
                              ▼
                    chat_output (markdown) ◀── citations.Message
```

### Nodos que usa

| `type` | Cantidad / rol |
|--------|----------------|
| `io.input` | Entrada JWT |
| `loader.pdf` | ×4 (contrato + playbook + regulations + precedent) |
| `ingest.chunker` | ×4, `by-clause` |
| `store.pgvector` | ×4 índices nombrados |
| `store.multi-index` | Agrupa playbook, regulations, precedent |
| `retrieval.vector` | Sobre el contrato |
| `retrieval.router` | Keyword → índice correcto |
| `retrieval.reranker` | `bge-reranker`, topN=3 |
| `logic.structured` | Array `hallazgos` con enum de riesgo |
| `logic.citations` | `enforce` — citas duales |
| `model.embedding` / `model.llm` | Compartidos |

### Técnicas que ilustra

- **Multi-index routing** para evitar ruido cross-categoría.
- **Reranking** cross-encoder en dominio de alta precisión.
- **Chunking by-clause** para citabilidad jurídica.
- **Citas duales** verificadas fuera del LLM.

### Módulos del curso

**M4** (retrieval avanzado: router, reranker, multi-index).

### Qué aprendes reconstruyéndolo

Diseñar sistemas con **varios índices especializados** en lugar de un monolito vectorial. Entiendes cuándo el router por keyword basta vs cuándo necesitas clasificador de intent, y por qué el reranker es casi obligatorio en legal/médico.

---

## 08 · RAG sobre manuales de mantenimiento AMM

**Carpeta:** [`../../examples/08-manufacturing-maintenance-rag/`](../../examples/08-manufacturing-maintenance-rag/)

### Problema de negocio

Técnicos de línea consultan el Aircraft Maintenance Manual (AMM): miles de páginas con capítulos ATA, tablas de torque y diagramas. Citar el capítulo o revisión equivocada es un hallazgo de auditoría FAA/EASA. El sistema debe responder citando sección ATA y escalar a inspector certificado ante CAUTION/WARNING.

### Diagrama del flujo

```
[INGESTA]
  model.vision ──Model──▶ loader.multimodal (sectionScheme: ATA)
                               │ Documents
                               ▼
                         ingest.chunker (by-section)
                               ▼
                         ingest.metadata (ata_chapter, aircraft_type, …)
                               ▼
  model.embedding ──Embeddings──▶ store.pgvector (amm)
                                      │ Retriever
                                      ▼
[RUNTIME]                      retrieval.vector (hardFilters: aircraft_type, ata_chapter)
  io.input ──message──▶ query ──────────┘
       │                      │ chunks
       └──message──▶ logic.prompt ◀── model.llm
                          │ message
                          ▼
                    logic.citations ◀── chunks
                          │ message
                          ▼
                    hitl.escalate (WARNING|CAUTION)
                          │ any
                          ▼
                      io.output
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `loader.multimodal` | AMM con esquema ATA |
| `model.vision` | Diagramas técnicos → texto |
| `ingest.chunker` | `by-section` (no partir procedimientos) |
| `ingest.metadata` | `ata_chapter`, `aircraft_type`, `revision_date` |
| `retrieval.vector` | Filtros duros por aeronave y capítulo |
| `logic.prompt` | Síntesis con avisos CAUTION/WARNING |
| `logic.citations` | `enforce` |
| `hitl.escalate` | Inspector certificado, timeout 2h |

### Técnicas que ilustra

- **GraphRAG-lite** vía metadata ATA (sin Neo4j, pero mismos principios de contexto estructurado).
- **Hard-filters** como guardrail de seguridad (A320 ≠ 787).
- **HITL determinista** ante procedimientos críticos.
- Ingesta **multimodal** en dominio técnico.

### Módulos del curso

**M2, M4, M9, M10** (ingesta multimodal, retrieval con filtros, HITL, visión).

### Qué aprendes reconstruyéndolo

Por qué en documentos técnicos el chunking y la metadata son tan importantes como el embedding. Practica el trip-wire de `hitl.escalate` evaluado por el grafo, no por el LLM.

---

## 03 · Asistente de pre-autorización clínica (salud)

**Carpeta:** [`../../examples/03-healthcare-prior-auth/`](../../examples/03-healthcare-prior-auth/)

### Problema de negocio

Las aseguradoras exigen pre-autorización antes de procedimientos costosos. Hoy es manual: buscar guías PDF, verificar historia del paciente, decidir y escalar casos ambiguos. El flujo debe filtrar guías por **plan y condición** del paciente, citar siempre y escalar a revisor clínico en casos críticos.

### Diagrama del flujo

```
[INGESTA guías clínicas]
  loader.pdf → ingest.chunker → ingest.metadata (plan, condition, effective_date)
       → store.pgvector → retrieval.vector (hardFilters: plan, condition)
              → tool.retriever (GuidelinesRAG)

[RUNTIME]
  io.input ──message──▶ agent.react ◀── model.llm
                              ▲    ├── tool: PatientHistoryService
                              │    └── tool: GuidelinesRAG
                              │ message
                              ▼
                        logic.citations ◀── chunks (guidelines_retrieval)
                              │ message
                              ▼
                        hitl.escalate (severidad alta | criterio_no_encontrado)
                              │ any
                              ▼
                        io.output
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `retrieval.vector` | Filtros duros plan + condición |
| `tool.retriever` | RAG invocable por el agente |
| `tool.service` | PatientHistoryService (EHR) |
| `agent.react` | Orquestación multi-paso |
| `logic.citations` | Post-procesador `enforce` |
| `hitl.escalate` | Revisor clínico, 4h |

### Técnicas que ilustra

- **Agentic RAG**: el agente decide cuándo consultar guías y con qué filtros.
- **Hard-filters en SQL/pgvector** (no “sugerencia” al LLM).
- **Citas + HITL** en cadena post-agente.
- Integración **tool.service** con datos sensibles (PHI).

### Módulos del curso

**M4 → M9** (retrieval, agentes, producción/seguridad/HITL).

### Qué aprendes reconstruyéndolo

Cómo combinar agente ReAct con RAG como tool y guardrails **después** del agente (citations, escalate). El anti-patrón clave: no dejar que el LLM decida si escalar — `hitl.escalate` es estructural.

---

## 07 · Copilot de call center (telecom)

**Carpeta:** [`../../examples/07-telecom-callcenter-copilot/`](../../examples/07-telecom-callcenter-copilot/)

### Problema de negocio

Un agente humano atiende llamadas sobre facturación, cortes, portabilidad, etc. Buscar en manuales mientras el cliente espera introduce demoras. El copilot transcribe audio, filtra fragmentos no accionables, rutea al índice correcto (policy/procedure/faq) y muestra una sugerencia citada en un **panel lateral** en < 1.5 s.

### Diagrama del flujo

```
io.stt ──Message──▶ model.intent ──Query──▶ query.rewrite ──Query──▶ retrieval.router
                                                                        ▲ Retriever
policy_loader  ──┐                                                      │
procedure_loader┼──Documents──▶ store.multi-index (policy/procedure/faq)┘
faq_loader (web)─┘
                                        │ Chunks
                                        ▼
                                 retrieval.reranker (feedbackRef)
                                        │ Chunks
  model.llm ──Model──▶ logic.prompt ──Message──▶ logic.citations
                                        │ Message
                                        ▼
                                   io.panel (cite: true)
                                        │ Any
                                        ▼
                              observability.feedback (thumbs)
                                        │ loop:true
                                        └──────────▶ reranker (Chunks)
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `io.stt` | Deepgram streaming |
| `model.intent` | Descarta `no_accionable` |
| `query.rewrite` | Glosario interno → términos canónicos |
| `loader.pdf` ×2 + `loader.web` | Tres fuentes → multi-index |
| `retrieval.router` | Intent/keyword → índice |
| `retrieval.reranker` | topN=3 + `feedbackRef` |
| `logic.prompt` | Sugerencia ≤ 3 oraciones |
| `io.panel` | Salida lateral (no interrumpe llamada) |
| `observability.feedback` | Loop de mejora del reranker |

### Técnicas que ilustra

- **STT en streaming** como entrada (M10).
- **Intent gate** antes del RAG (ahorro de latencia).
- **Query rewriting** con glosario de dominio.
- **Feedback loop** cerrado hacia el reranker.
- Copilot **human-in-the-loop** (el agente humano valida, no el cliente).

### Módulos del curso

**M4, M6, M7, M9, M10** (retrieval avanzado, agentes, multi-agente conceptual, observabilidad, multimodal/STT).

### Qué aprendes reconstruyéndolo

Diseñar pipelines de **baja latencia** con compuertas tempranas (intent) y routing preciso. El loop `feedback → reranker` es el patrón de mejora continua en producción.

---

## 06 · Bot de post-venta retail

**Carpeta:** [`../../examples/06-retail-postsale-bot/`](../../examples/06-retail-postsale-bot/)

### Problema de negocio

Tras la compra, el cliente pregunta por estado del pedido, devoluciones y recomendaciones. Soporte humano es caro. El bot debe consultar pedidos, iniciar devoluciones con **confirmación** si el reembolso supera $200, garantizar **idempotencia** y auditar cada tool call.

### Diagrama del flujo

```
io.input ──Message──▶ agent.react ◀── model.llm
                         ▲   ├── Tool: OrderService
                         │   ├── Tool: RecommendationService
                         │   └── Tool: return_idempotency ◀── return_confirm ◀── ReturnService
                         │ message (loop: true)
                         ▼
                   observability.audit ──Any──▶ io.output
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `agent.react` | ReAct, maxSteps 8 |
| `tool.service` | Order, Return, Recommendation |
| `guardrail.confirm` | Umbral `amount > 200` |
| `guardrail.idempotency` | Clave `order_id + session_id` |
| `observability.audit` | sink: log |

**Nota:** Este template **no incluye RAG en línea** — es un agente puramente transaccional con APIs.

### Técnicas que ilustra

- **Tool calling** y encadenamiento ReAct.
- **Guardrails envolviendo tools** (confirm → idempotency).
- **Audit trail** de acciones del agente.
- Memoria conversacional vía loop `Message → Message`.

### Módulos del curso

**M6, M9** (agentes I, producción y guardrails).

### Qué aprendes reconstruyéndolo

La diferencia entre un bot RAG y un **agente transaccional**: los guardrails van *alrededor* del tool, no en el prompt. Preparación directa para el patrón de pagos del 01.

---

## 10 · Rebooking de envíos en disrupción masiva (logística)

**Carpeta:** [`../../examples/10-logistics-disruption-rebooking/`](../../examples/10-logistics-disruption-rebooking/)

### Problema de negocio

Una tormenta cierra un hub y afectan miles de envíos. El rebooking manual colapsa. Se necesita un worker Kafka que segmente por prioridad (P1/P2/P3), procese en **paralelo** (fan-out), auto-confirme casos simples con reglas y use LLM solo en casos complejos, notificando al cliente y auditando todo.

### Diagrama del flujo

```
io.event-source (Kafka, exactlyOnce)
       │ Event
       ▼
logic.rules (P1/P2/P3, track simple|complex)
       │ Decision
       ▼
logic.router (branches: simple, complex)
       │ Any → Event
       ▼
agent.fanout (concurrency: 16) ◀── Tool: ShipmentProfileService
       │                            ◀── Tool: PolicyRAG ← store.pgvector ← embedding_model
       │                            ◀── Tool: AlternativesService
       │                            ◀── Tool: AutoConfirmService
       ├──Any──▶ io.notify (email, sms, push)
       ├──Any──▶ observability.audit (kafka)
       └──Any──▶ observability.metrics (otlp)  [vía audit]
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `io.event-source` | `shipment.disruption`, partitionKey, exactlyOnce |
| `logic.rules` | Segmentación determinista |
| `logic.router` | Bifurcación simple vs complejo |
| `agent.fanout` | Sub-agentes stateless en paralelo |
| `tool.retriever` | PolicyRAG sobre `rebook_policies` |
| `tool.service` | Perfil, alternativas, auto-confirm |
| `io.notify` | Canales salientes |
| `observability.audit` / `observability.metrics` | Trazabilidad y OTLP |

**Nota:** El LLM se consume vía `defaults.llm` del flow dentro del fan-out para casos `track == 'complex'`; no hay arista explícita `model.llm → fanout`.

### Técnicas que ilustra

- **Event-driven** con Kafka y exactly-once.
- **Fan-out** multi-agente stateless a escala.
- **Determinista vs LLM**: reglas clasifican; el modelo solo en ambigüedad.
- **RAG-as-tool** en sub-agentes paralelos.
- Observabilidad de producción (audit + métricas).

### Módulos del curso

**M7, M9, M11** (multi-agente, producción, capstone de arquitectura).

### Qué aprendes reconstruyéndolo

Cuándo **no** usar un agente conversacional: el patrón fan-out para alto volumen. Cómo combinar `logic.rules` + `logic.router` + `agent.fanout` y medir auto-confirm vs intervención LLM.

---

## 01 · Agente de cambio de vuelo (aerolínea)

**Carpeta:** [`../../examples/01-airline-flight-change/`](../../examples/01-airline-flight-change/)

### Problema de negocio

Un pasajero quiere cambiar vuelo en lenguaje natural. El proceso implica consultar PNR, verificar políticas tarifarias, buscar alternativas, calcular diferencial + penalidad y cobrar con confirmación. Requiere trazabilidad regulatoria (audit Kafka) y protección financiera (idempotencia, confirm-gate, circuit breaker).

### Diagrama del flujo

```
[INGESTA políticas — offline]
  loader.pdf → ingest.chunker (by-clause) → ingest.metadata (fare_class, route_type)
       → store.pgvector (fare_rules) ← embedding_model
              → tool.retriever (PolicyRAG)

[RUNTIME]
  io.input ──Message──▶ agent.react ◀── model.llm
                            ▲   ├── PolicyRAG (tool.retriever)
                            │   ├── ReservationService, InventoryService, PricingService
                            │   └── payment_resilience ◀── payment_confirm ◀── payment_idempotency ◀── PaymentService
                            │ message (loop: true)
                            ▼
                      observability.audit (kafka: flight-change-audit)
                            │ Any
                            ▼
                        io.output
```

### Nodos que usa

| `type` | Rol |
|--------|-----|
| `agent.react` | Flujo obligatorio en system prompt |
| `tool.retriever` | PolicyRAG con filtros fare_class/route_type |
| `tool.service` | Reservas, inventario, pricing, pago |
| `guardrail.idempotency` | PNR + session_id, TTL 24h |
| `guardrail.confirm` | amount > 500 USD |
| `guardrail.resilience` | Circuit breaker en pago |
| `observability.audit` | Kafka audit trail |
| `ingest.chunker` | `by-clause` en fare rules |

### Técnicas que ilustra

- **Agentic RAG** (políticas como tool, no pipeline fijo).
- **Cadena de guardrails** en tool transaccional.
- **Hard-filters** en metadata tarifaria.
- **Audit regulatorio** passthrough.
- Caso de estudio para **MCP** (PolicyRAG como servidor MCP en M8).

### Módulos del curso

**M6, M8, M9, M11** (agentes, MCP, producción, capstone).

### Qué aprendes reconstruyéndolo

**Tercer y más difícil paso del capstone:** integras todo — ingesta con metadata, RAG-as-tool, múltiples APIs, tres guardrails en serie, audit y despliegue chat-service. Si reconstruyes el 01, estás listo para diseñar arquitecturas nuevas en M11.

---

## Ruta de reconstrucción (capstone)

El plan del curso ([`PLAN.md` §6 M11](../PLAN.md)) exige reconstruir **tres templates en orden creciente de dificultad**:

```
09 RRHH  →  02 Banca  →  01 Aerolínea
  ↑            ↑              ↑
 ~10 nodos   ~12 nodos     ~18 nodos
 RAG lineal  batch+rules    agente+guardrails+RAG-tool
```

### Por qué 09 primero

| Criterio | 09 RRHH |
|----------|---------|
| Complejidad | Mínima: un índice Chroma, sin agente, sin APIs externas |
| Nodos nuevos | Solo categorías `io`, `loader`, `ingest`, `store`, `retrieval`, `model`, `logic` |
| Secretos | Uno (`ANTHROPIC_API_KEY`) |
| Deployment | `chat-service` estándar |
| Habilidad validada | Entiendes el ciclo RAG completo y citas obligatorias |

Si el 09 no pasa tests equivalentes al artefacto generado, no tiene sentido avanzar: es el **RAG mínimo viable** del que dependen todos los demás.

### Por qué 02 segundo

| Criterio | 02 Banca |
|----------|----------|
| Salto respecto al 09 | Batch (`io.batch`), dos loaders, pgvector, hardFilters, structured output, `logic.rules` |
| Sin agente aún | El flujo sigue siendo determinista en grafo — más fácil de depurar que ReAct |
| Habilidad validada | Ingesta heterogénea, metadata, decisión auditable, **no delegar umbrales al LLM** |
| Puente hacia el 01 | Mismos patrones de pgvector + metadata que PolicyRAG en aerolínea, pero sin tool calling |

El 02 enseña **producción batch** y contratos JSON fuertes antes de introducir la no-determinismo del agente.

### Por qué 01 al final

| Criterio | 01 Aerolínea |
|----------|--------------|
| Complejidad máxima | Agente ReAct + 5 tools + RAG-as-tool + 3 guardrails encadenados + audit Kafka |
| Estado y multi-turno | Loop ReAct, confirmación de usuario, idempotencia por sesión |
| Integraciones | 4 APIs de negocio + store vectorial + broker de auditoría |
| Habilidad validada | Diseño **end-to-end** de sistema agéntico transaccional listo para producción |

Reconstruir el 01 demuestra que dominas agentes, guardrails, observabilidad y RAG integrado — el criterio de **experto** del curso.

### Los otros siete templates

No forman parte del capstone obligatorio, pero cubren patrones que aparecerán en el examen integrador y en el diseño de arquitecturas nuevas:

| Template | Patrón único que aporta |
|----------|-------------------------|
| 04 Seguros | Visión + reglas + structured en batch |
| 05 Legal | Multi-index + router + reranker |
| 03 Salud | Agent + citations + HITL |
| 08 Manufactura | Multimodal ATA + HITL |
| 07 Telecom | STT + intent + panel + feedback loop |
| 06 Retail | Agente sin RAG, guardrails transaccionales |
| 10 Logística | Fan-out Kafka, event-worker |

Estudiarlos en sus módulos correspondientes ([`PLAN.md` §8](../PLAN.md)) completa la cobertura de las **13 categorías de nodo** antes del examen de M11.

---

## Referencias cruzadas

- Plan del curso y módulos: [`../PLAN.md`](../PLAN.md)
- Fichas de nodos: [`./catalogo-nodos.md`](./catalogo-nodos.md)
- Glosario: [`./glosario.md`](./glosario.md)
- Tecnologías comparadas: [`./tecnologias-comparadas.md`](./tecnologias-comparadas.md)
- Contrato Flow IR: [`../../docs/01-concepts.md`](../../docs/01-concepts.md)
- Catálogo técnico de nodos: [`../../docs/02-node-catalog.md`](../../docs/02-node-catalog.md)
- Índice de ejemplos: [`../../examples/`](../../examples/)

---

*Última revisión alineada con los `flow.json` en `examples/` (irVersion 1.0). Si un template cambia en el repo, actualiza las aristas y la tabla de nodos de su ficha.*

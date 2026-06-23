# M11 · Arquitectura y Capstone

> **Módulo 11 — Semana 10.** Integra todo el currículum: patrones transversales, diseño de `flow.json`, anti-patrones, evaluación como test de sistema y el **capstone** (reconstruir templates + diseñar + examen).
>
> **Nodos RAGorbit:** todos (13 categorías). **Templates del capstone:** [09](../../examples/09-hr-policy-assistant/) → [02](../../examples/02-banking-credit-scoring/) → [01](../../examples/01-airline-flight-change/).

---

## Índice

1. [Patrones transversales](#1-patrones-transversales)
2. [Cómo leer un flow.json](#2-cómo-leer-un-flowjson)
3. [Cómo diseñar un flow.json](#3-cómo-diseñar-un-flowjson)
4. [Anti-patrones](#4-anti-patrones)
5. [Checklist de diseño](#5-checklist-de-diseño)
6. [System testing de IA (eval como test)](#6-system-testing-de-ia-eval-como-test)
7. [Ruta de reconstrucción 09 → 02 → 01](#7-ruta-de-reconstrucción-09--02--01)
8. [Checkpoint](#8-checkpoint)
9. [La capa ③ explicada: cómo reconstruir un template con framework](#12-la-capa--explicada-cómo-reconstruir-un-template-con-framework)

---

## 1. Patrones transversales

Estos patrones aparecen en múltiples templates y módulos. Dominarlos es el criterio de **experto** del curso ([`PLAN.md` §1](../PLAN.md)).

### 1.1 RAG-as-tool

**Qué es:** el retrieval no es un paso fijo del pipeline — es una **tool** que el agente invoca cuando necesita evidencia documental.

```
Pipeline fijo (09 RRHH):     io.input → retrieval.vector → prompt → output
RAG-as-tool (01 Aerolínea):  agent.react ──invoca──▶ tool.retriever (PolicyRAG)
```

**Cuándo usar:**
- El agente debe decidir **si** y **cuándo** consultar documentos (cambio de vuelo: solo tras obtener fare_class del PNR).
- Hay múltiples fuentes y el agente elige filtros dinámicamente.

**Cuándo NO:**
- Pregunta siempre sobre el mismo corpus (RRHH) → pipeline lineal es más simple y auditable.

**Nodo RAGorbit:** `tool.retriever`. **Templates:** 01, 03, 10.

**Implementación scratch:** función `policy_rag(query, fare_class, route_type)` envuelta en dict `TOOLS`.

**Implementación framework:** `@tool` de LangChain que internamente llama `retriever.invoke()` con filtros.

---

### 1.2 Hard-filter-as-guardrail

**Qué es:** filtros de metadata aplicados **en el store/SQL**, no como sugerencia al LLM.

```
❌ Mal:  "Busca solo documentos del plan PPO" en el system prompt
✅ Bien: retrieval.vector con hardFilters: [plan, condition] → SQL WHERE plan='PPO'
```

**Por qué importa:** el embedding semántico puede recuperar chunks de otro plan si el texto es similar. Los hard-filters son un **guardrail de precisión** — el sistema no puede violarlos por alucinación.

**Cuándo usar:** dominios regulados (salud, banca, aviación, legal) donde mezclar contextos tiene consecuencias.

**Nodo:** `retrieval.vector` con `hardFilters`, o `ingest.metadata` previo.

**Templates:** 02 (doc_type/period), 01 (fare_class/route_type), 03, 08.

---

### 1.3 Determinista vs LLM

**Principio:** el LLM **razona**; las reglas de negocio **deciden**.

| Tarea | Quién la hace | Nodo |
|-------|---------------|------|
| Puntuar riesgo crediticio | LLM (score 0–100) | `logic.structured` |
| Aprobar/rechazar según umbral | Regla determinista | `logic.rules` |
| Clasificar P1/P2/P3 en disrupción | Regla determinista | `logic.rules` |
| Redactar justificación | LLM | `logic.structured` / `logic.prompt` |
| Cobrar con idempotencia | Guardrail (código) | `guardrail.idempotency` |

**Anti-patrón:** pedir al LLM `"decision": "aprobar"` y confiar sin `logic.rules`.

**Templates:** 02 (umbrales crédito), 10 (track simple vs complex), 04 (deducible).

---

### 1.4 Fan-out a escala

**Qué es:** procesar miles de eventos en paralelo con sub-agentes **stateless**, no un agente conversacional único.

```
io.event-source (Kafka)
    → logic.rules (segmentar)
    → logic.router (simple | complex)
    → agent.fanout (concurrency: 16)
        ├── tool.retriever (PolicyRAG)
        ├── tool.service (Alternatives)
        └── auto-confirm (reglas) vs LLM (solo complex)
```

**Cuándo usar:** alto volumen, eventos independientes (logística, notificaciones masivas).

**Cuándo NO:** conversación multi-turno con un usuario → `agent.react`.

**Template:** 10-logistics. **Módulo:** M7.

---

### 1.5 Citas obligatorias

**Qué es:** post-procesador que verifica que la respuesta ancle afirmaciones a chunks recuperados.

**Flujo:**
```
logic.prompt → Message (respuesta del LLM)
                    ↓
logic.citations ← Chunks (del retriever)
    mode: enforce → rechaza/regenera si no hay cita
                    ↓
               io.output
```

**Por qué va DESPUÉS del LLM:** el LLM puede omitir citar; `enforce` es código que no negocia.

**Templates:** 09, 02, 03, 05, 07, 08.

---

### 1.6 Agentic RAG

**Qué es:** combinar agente ReAct con RAG-as-tool + guardrails post-agente.

```
agent.react
  ├── tool.retriever (guías clínicas)
  ├── tool.service (historial paciente)
  └── ...
       ↓
logic.citations (enforce)
       ↓
hitl.escalate (casos críticos — estructural, no decidido por LLM)
```

**Diferencia con RAG lineal:** el agente decide el orden de consultas y puede combinar APIs + documentos.

**Templates:** 01, 03. **Módulo:** M6.

---

### 1.7 Tabla resumen de patrones → templates

| Patrón | Templates que lo ilustran | Módulo principal |
|--------|---------------------------|------------------|
| RAG lineal | 09 | M1 |
| Batch + structured + rules | 02, 04 | M2–M5 |
| RAG-as-tool | 01, 03, 10 | M6, M7 |
| Hard-filters | 02, 01, 03, 08 | M4 |
| Fan-out | 10 | M7 |
| Citas enforce | 09, 02, 03, 05 | M5 |
| Guardrails transaccionales | 01, 06 | M6, M9 |
| Multi-index + router | 05, 07 | M4 |
| HITL | 03, 08 | M9 |
| MCP | 01 (PolicyRAG exportable) | M8 |

Mapa completo: [`referencia/plantillas-mapeadas.md`](../referencia/plantillas-mapeadas.md).

---

## 2. Cómo leer un flow.json

Un `flow.json` es el **Flow IR** — la fuente de verdad que RAGorbit traduce a Python. Contrato: [`docs/01-concepts.md`](../../docs/01-concepts.md).

### 2.1 Estructura de alto nivel

```json
{
  "irVersion": "1.0",
  "flow": { "id", "name", "deploymentTarget", "defaults" },
  "nodes": [ { "id", "type", "label", "config" } ],
  "edges": [ { "source", "sourcePort", "target", "targetPort", "loop?" } ],
  "secrets": [ { "name", "required", "usedBy" } ]
}
```

### 2.2 Lectura en 5 pasos

1. **`deploymentTarget`** — define el runtime: `chat-service`, `batch`, `event-worker`.
2. **Nodo de entrada implícito** — `io.input`, `io.batch` o `io.event-source`.
3. **Pipeline de ingesta (si existe)** — loaders → chunker → metadata → store (offline).
4. **Pipeline runtime** — desde entrada hasta `io.output`, siguiendo aristas.
5. **`secrets`** — qué credenciales necesitas (nunca valores en el JSON).

### 2.3 Puertos y tipos

Los puertos deben ser **compatibles**. Error común al leer:

| Puerto | Tipo de dato | Conecta con |
|--------|--------------|-------------|
| `Documents` | Lista de documentos/chunks sin indexar | `loader` → `ingest` → `store` |
| `Embeddings` | Función/modelo de embedding | `model.embedding` → `store` |
| `Retriever` | Objeto buscable | `store` → `retrieval` / `tool.retriever` |
| `Query` / `Message` | Texto de usuario | `io.input` → `retrieval` / `agent` |
| `Chunks` | Fragmentos recuperados | `retrieval` → `logic` |
| `Model` | LLM configurado | `model.llm` → `logic` / `agent` |
| `Tool` | Función invocable | `tool.*` → `agent` |
| `Decision` | JSON estructurado | `logic.structured` → `logic.rules` |
| `Any` | Passthrough | `observability` → `io.output` |

### 2.4 Ejemplo: trazar el 09 RRHH

```
chat_input:Message ──▶ retriever:Query
hr_store:Retriever ──▶ retriever:Retriever
retriever:Chunks ──▶ prompt:Chunks
chat_input:Message ──▶ prompt:Message
llm:Model ──▶ prompt:Model
prompt:Message ──▶ citations:Message
retriever:Chunks ──▶ citations:Chunks
citations:Message ──▶ chat_output:Any
```

**Ingesta offline (misma sesión de diseño):**
```
hr_docs:Documents → chunker → hr_store
embedder:Embeddings → hr_store
```

---

## 3. Cómo diseñar un flow.json

### 3.1 Proceso recomendado

```
Brief de negocio
    ↓
① Definir deploymentTarget (¿chat? ¿batch? ¿eventos?)
    ↓
② Listar entradas/salidas (io.*)
    ↓
③ Diseñar ingesta offline (si hay RAG)
    ↓
④ Diseñar runtime (pipeline o agente)
    ↓
⑤ Añadir guardrails, HITL, observabilidad
    ↓
⑥ Validar contrato en RAGorbit
    ↓
⑦ Probar con mocks → eval con dataset
```

### 3.2 Decisiones por categoría

| Pregunta | Opciones | Criterio |
|----------|----------|----------|
| ¿Agente o pipeline? | `agent.react` vs cadena fija | ¿El orden de pasos es impredecible? → agente |
| ¿Qué store? | Chroma vs pgvector vs multi-index | Chroma: prototipo; pgvector: producción; multi-index: varias KB |
| ¿Cuándo rerank? | Sí/No | Legal, médico, alta precisión → sí (M4) |
| ¿Structured o prompt libre? | `logic.structured` vs `logic.prompt` | ¿La salida va a otro sistema? → structured |
| ¿Dónde van las reglas? | `logic.rules` después del LLM | Siempre que haya umbral de negocio |

### 3.3 Plantilla mental por complejidad

**Nivel 1 — RAG conversacional (09):**
`io.input → retrieval → prompt → citations → io.output`

**Nivel 2 — Batch auditable (02):**
`io.batch → loaders → chunker → metadata → store → retrieval → structured → rules → io.output`

**Nivel 3 — Agente transaccional (01):**
`ingesta → tool.retriever` + `io.input → agent.react ← tools ← guardrails → audit → io.output`

---

## 4. Anti-patrones

### 4.1 Delegar umbrales al LLM

```json
// ❌ Anti-patrón
"logic.structured": { "schema": { "decision": "aprobar|rechazar" } }
// Sin logic.rules — el LLM decide aprobar con score 45
```

**Fix:** `logic.rules` determinista después de `logic.structured`.

---

### 4.2 Filtros en el prompt en lugar de hard-filters

```json
// ❌ "Filtra por plan PPO en tu búsqueda"
// ✅
"retrieval.vector": { "hardFilters": ["plan", "condition"] }
```

---

### 4.3 Citas solo en el system prompt

```json
// ❌ "Siempre cita tus fuentes" en system — el LLM puede ignorarlo
// ✅ logic.citations con mode: enforce DESPUÉS del LLM
```

---

### 4.4 HITL decidido por el LLM

```json
// ❌ "Si el caso es grave, di que escalarás a un humano"
// ✅ hitl.escalate con condiciones estructurales (severidad, criterio_no_encontrado)
```

---

### 4.5 Un índice monolítico para todo

Mezclar playbook legal + normativa + precedentes en un solo `store.pgvector` sin router → ruido cross-categoría.

**Fix:** `store.multi-index` + `retrieval.router` (template 05, 07).

---

### 4.6 Agente conversacional para alto volumen

Usar `agent.react` para rebookings masivos (miles de envíos) → latencia y costo insostenibles.

**Fix:** `agent.fanout` + `logic.rules` (template 10).

---

### 4.7 Guardrails en el prompt del agente

```json
// ❌ "Pide confirmación si el monto supera 500" en system del agente
// ✅ guardrail.confirm envolviendo el tool Payment
```

El agente consume `maxSteps` y puede "olvidar" la instrucción. Los guardrails estructurales son código.

---

### 4.8 Sin auditoría en acciones transaccionales

Cobros, cambios de vuelo, devoluciones sin `observability.audit` → incumplimiento regulatorio.

---

## 5. Checklist de diseño

Usa esta lista antes de dar por cerrado un `flow.json`:

### Negocio y despliegue

- [ ] `deploymentTarget` coincide con el caso (chat / batch / event-worker)
- [ ] Entrada y salida (`io.*`) definidas con formato correcto (markdown/json/streaming)
- [ ] Secretos declarados sin valores embebidos

### Ingesta y retrieval

- [ ] Estrategia de chunking justificada (by-section, by-clause, etc.)
- [ ] Metadata suficiente para hard-filters del dominio
- [ ] `topK` y store elegidos con trade-off documentado

### Generación y lógica

- [ ] Temperatura baja (0.0–0.2) para respuestas factuales
- [ ] `logic.structured` si la salida va a otro sistema
- [ ] `logic.rules` para umbrales de negocio (no delegados al LLM)
- [ ] `logic.citations` enforce si hay consecuencias por alucinación

### Agentes y tools

- [ ] `maxSteps` acotado en `agent.react`
- [ ] Tools con `description` clara para el LLM
- [ ] RAG-as-tool solo cuando el agente debe decidir cuándo recuperar

### Producción y seguridad

- [ ] Guardrails en tools transaccionales (idempotency, confirm, resilience)
- [ ] `hitl.escalate` en casos críticos (estructural)
- [ ] `observability.audit` en acciones reguladas
- [ ] Plan de eval (dataset + métricas mínimas)

### Validación técnica

- [ ] 0 errores al Validar en RAGorbit
- [ ] Probar con mocks responde coherentemente
- [ ] Aristas `loop: true` solo donde hay ciclo ReAct válido

---

## 6. System testing de IA (eval como test)

En sistemas de IA, **la evaluación es el test de sistema** — no hay salida determinista única, pero sí propiedades verificables.

### 6.1 Pirámide de tests para RAG/agéntico

```
                    ┌─────────────────┐
                    │  Eval end-to-end │  ← RAGAS, casos de negocio
                    │  (lento, caro)   │
                    ├─────────────────┤
                    │  Integration      │  ← grafo completo con mocks
                    │  (pytest + MOCK)  │
                    ├─────────────────┤
                    │  Unit / nodos     │  ← rules, filters, guardrails
                    │  (determinista)   │
                    └─────────────────┘
```

### 6.2 Qué testear de forma determinista

| Componente | Test | Ejemplo |
|------------|------|---------|
| `logic.rules` | Input → output fijo | score=72 → "aprobar" |
| `guardrail.idempotency` | 2ª llamada → deduplicated | M9 lab |
| hard-filters | Query sin chunks de otro plan | top-k solo del expediente |
| `logic.citations` enforce | Respuesta sin cita → rechazada | M5 lab |
| chunker | N chunks con metadata esperada | M2 expected |

### 6.3 Métricas de eval (capa superior)

| Métrica | Qué mide | Herramienta |
|---------|----------|-------------|
| Faithfulness | ¿La respuesta está anclada al contexto? | RAGAS |
| Context precision | ¿Los chunks recuperados son relevantes? | RAGAS |
| Context recall | ¿Se recuperó todo lo necesario? | RAGAS |
| Answer relevance | ¿Responde la pregunta? | RAGAS / DeepEval |
| Tool success rate | ¿El agente completó la tarea? | Custom + LangSmith |

### 6.4 Eval como CI

```python
# Pseudocódigo — patrón recomendado
DATASET = [
    {"query": "¿Vacaciones 3 años?", "must_contain": ["18 días"], "must_cite": "§3"},
    {"query": "¿Precio acciones?", "must_contain": ["no está disponible"]},
]

def test_rag_properties():
    for case in DATASET:
        result = pipeline(case["query"])
        assert all(s in result.text for s in case["must_contain"])
        if "must_cite" in case:
            assert case["must_cite"] in result.citations
```

**Regla:** los tests deterministas (rules, guardrails, filters) van en CI en cada commit; el eval con LLM real va en nightly o pre-release.

### 6.5 System testing del capstone

Para tus reconstrucciones 09→02→01:

1. **09:** assert índices y similitudes (como `expected.md`).
2. **02:** assert JSON schema + `decision` de rules, no del LLM.
3. **01:** assert secuencia de tool calls + idempotencia + audit events.

---

## 7. Ruta de reconstrucción 09 → 02 → 01

Orden del capstone ([`plantillas-mapeadas.md` § Ruta](../referencia/plantillas-mapeadas.md)):

```
09 RRHH        02 Banca           01 Aerolínea
~10 nodos      ~12 nodos          ~18 nodos
RAG lineal     batch+rules        agente+guardrails+RAG-tool
```

### 7.1 Template 09 — qué valida

- Ciclo RAG completo: `Documents → Retriever → Chunks → Message`.
- Citas obligatorias post-LLM.
- Chroma/store en memoria para prototipo.

**Taller:** [`lab/solucion_scratch.py`](lab/solucion_scratch.py) — referencia ejecutable.

### 7.2 Template 02 — salto de complejidad

Añade sobre el 09:
- `io.batch` + dos loaders
- `ingest.metadata` + `hardFilters`
- `logic.structured` + `logic.rules`
- pgvector (producción)

**Habilidad clave:** el LLM puntúa; la regla decide.

### 7.3 Template 01 — integración total

Añade sobre el 02:
- `agent.react` con loop
- `tool.retriever` (PolicyRAG)
- 4× `tool.service`
- 3× guardrails en cadena
- `observability.audit`

**Habilidad clave:** diseño end-to-end agéntico transaccional.

---

## 8. Checkpoint

**Lo sabes si puedes:**

- [ ] Dibujar de memoria el flujo del 09, 02 y 01 con puertos etiquetados.
- [ ] Explicar cuándo usar RAG lineal vs RAG-as-tool vs fan-out.
- [ ] Diseñar un `flow.json` nuevo que pase Validar en RAGorbit.
- [ ] Nombrar 5 anti-patrones y su fix estructural.
- [ ] Definir qué va en CI determinista vs eval nightly para un sistema RAG.
- [ ] Reconstruir el 09 en scratch en < 2 horas sin mirar solución.

---

## 12. La capa ③ explicada: cómo reconstruir un template con framework

> Esta sección **cierra el arco** de las capas ③ de M1–M6. No reexplica cada API desde cero — enlaza y muestra cómo **combinarlas** para reconstruir un template entero.

### 12.1 Mapa de capas ③ previas

| Módulo | Sección | Qué aprendiste | Pieza del template |
|--------|---------|----------------|-------------------|
| [M1](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero) | §11 | TextLoader, splitter, Chroma, retriever, LCEL | 09: núcleo RAG |
| [M2](../02-ingesta/guia.md#10-la-capa--explicada-chunking-con-langchain-desde-cero) | §10 | CharacterTextSplitter, metadata en Document | 09/02: chunking |
| [M3](../03-embeddings-y-stores/guia.md#15-la-capa--explicada-del-dict-en-memoria-a-chromadb-faiss-y-sentence-transformers) | §15 | Chroma, FAISS, sentence-transformers | 09: store |
| [M4](../04-retrieval-y-query/guia.md#13-la-capa--explicada-retrievers-de-langchain-desde-cero) | §13 | BM25, hybrid, filters, rerankers | 02/01: hard-filters |
| [M5](../05-generacion-y-logic/guia.md#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero) | §10 | Structured output, RAGAS, citations | 02: JSON + eval |
| [M6](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) | §8 | LangGraph, ReAct, tools, memoria | 01: agente |

### 12.2 Recorrido bloque por bloque: `solucion_framework.py` (template 09)

Abre [`lab/solucion_framework.py`](lab/solucion_framework.py) y sigue este mapa:

#### Bloque 1 — Loader (M1 §11.4, M2 §10)

```python
loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
documentos_raw = loader.load()
```

Equivale a `loader.pdf` cuando el documento ya es texto. En producción con PDFs reales: `PyPDFLoader` o `UnstructuredPDFLoader` (M2).

#### Bloque 2 — Splitter (M2 §10)

```python
splitter = CharacterTextSplitter(separator="\n---\n", ...)
chunks = splitter.split_documents(documentos_raw)
```

Equivale a `ingest.chunker` con `strategy: by-section`. Para `by-clause` (01, 05): `RecursiveCharacterTextSplitter` con separadores legales.

#### Bloque 3 — Embeddings + Store (M1 §11.6–11.7, M3 §15)

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = Chroma.from_documents(documents=chunks, embedding=embeddings, collection_name="hr_policies")
```

Equivale a `model.embedding` → `store.chroma`. Para 02/01 en producción: `PGVector` con `connection_string` (M3).

#### Bloque 4 — Retriever (M1 §11.8, M4 §13)

```python
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

Equivale a `retrieval.vector` con `topK: 4`. Para hard-filters (02):

```python
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 6, "filter": {"doc_type": "financial_data", "period": "2023"}}
)
```

#### Bloque 5 — Prompt + LLM (M1 §11.9)

```python
prompt = ChatPromptTemplate.from_messages([("system", SYSTEM), ("human", HUMAN)])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
```

Equivale a `model.llm` + `logic.prompt`.

#### Bloque 6 — Chain LCEL (M1 §11.11)

```python
rag_chain = {"contexto": retriever | formatear_chunks, "pregunta": RunnablePassthrough()} | prompt | llm | StrOutputParser()
```

Es la cadena lineal del 09 sin agente.

#### Bloque 7 — Citations enforce (M5 §4)

```python
def enforce_citations(respuesta, docs): ...
```

En RAGorbit es nodo separado `logic.citations`. En LangChain puedes implementarlo como post-procesador o como nodo en LangGraph.

### 12.3 Extender a template 02 (banca)

Sobre el esqueleto del 09, añade:

1. **Segundo loader** — `CSVLoader` para tabular (M2).
2. **Metadata** — `doc.metadata["doc_type"] = ...` antes de indexar (M2).
3. **PGVector** — `PGVector.from_documents(...)` (M3).
4. **Structured output** — `llm.with_structured_output(CreditDecision)` (M5 §10).
5. **Rules** — función Python pura post-LLM (M5 §3):

```python
def apply_rules(decision: CreditDecision) -> CreditDecision:
    if decision.score >= 70:
        decision.decision = "aprobar"
    elif decision.score >= 40:
        decision.decision = "revisar"
    else:
        decision.decision = "rechazar"
    return decision
```

### 12.4 Extender a template 01 (aerolínea)

Sobre el 02, sustituye la cadena lineal por agente:

1. **PolicyRAG como tool** (M6 §4):

```python
@tool
def policy_rag(query: str, fare_class: str, route_type: str) -> str:
    docs = retriever.invoke(query, filter={"fare_class": fare_class, "route_type": route_type})
    return format_docs(docs)
```

2. **Tools de servicio** — funciones que llaman APIs mock (M6).

3. **LangGraph** (M6 §8) — `StateGraph` con nodos `agent` y `tools`, arista condicional `should_continue`.

4. **Guardrails** — wrappers antes de registrar el tool en el agente (M9):

```python
payment_tool = with_resilience(with_confirm(with_idempotency(raw_payment_tool)))
```

5. **Audit** — callback o nodo que loguea cada tool call (M9).

### 12.5 Diagrama de composición

```
M1 (LCEL, Chroma) ──────┐
M2 (splitters, meta) ───┼──▶ Template 09 (RAG lineal)
M3 (stores) ────────────┘
                        │
M4 (filters) ───────────┼──▶ Template 02 (+ structured + rules)
M5 (structured, eval) ──┘
                        │
M6 (LangGraph, tools) ──┼──▶ Template 01 (+ guardrails + audit)
M9 (producción) ────────┘
```

### 12.6 Cuándo usar LangChain vs LangGraph vs LlamaIndex

| Framework | Mejor para | Template ejemplo |
|-----------|------------|------------------|
| LangChain LCEL | Cadenas lineales RAG | 09 |
| LangGraph | Agentes con ciclo y estado | 01, 03 |
| LlamaIndex | Query engines, índices complejos | 05 (alternativa) |
| CrewAI / AutoGen | Multi-agente colaborativo | 10 (M7) |

Tabla completa: [`tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md).

---

⬅️ [Plan del curso](../PLAN.md) · [Taller](lab/enunciado.md) · [Ejercicios](ejercicios.md)

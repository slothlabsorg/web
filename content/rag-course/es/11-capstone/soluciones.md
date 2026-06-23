# M11 · Soluciones — Examen integrador

> Respuestas razonadas de las 50 preguntas de `ejercicios.md`.

---

## Bloque 1 — Patrones transversales

**Ejercicio 1 (A)** — **b)** Un `tool.retriever` envuelve el retriever para invocación bajo demanda por `agent.react`. El pipeline fijo (a) describe RAG lineal del 09, no RAG-as-tool.

**Ejercicio 2 (A)** — **b)** Los hard-filters se aplican en el store/consulta SQL por metadata, no como instrucción al LLM. Son guardrail estructural (M4, guía §1.2).

**Ejercicio 3 (A)** — **b)** `logic.rules` sobrescribe `decision` según umbrales deterministas. El LLM puede emitir cualquier valor en structured output; la regla es la fuente de verdad auditable.

**Ejercicio 4 (E)** — **b)** `agent.fanout` + `logic.rules` (template 10). Volumen masivo e independiente no usa conversación ReAct.

**Ejercicio 5 (A)** — **b)** `enforce` verifica anclaje post-generación. El system prompt es insuficiente (anti-patrón §4.3).

**Ejercicio 6 (D)** — **Pipeline determinista**, no agente. Nodos mínimos: `io.input` → `retrieval.vector` ← `store.chroma` ← ingesta (`loader.pdf`, `ingest.chunker`, `model.embedding`) → `logic.prompt` ← `model.llm` → `logic.citations` → `io.output`. Mismo patrón que template 09: pregunta siempre sobre el mismo corpus, sin acciones transaccionales.

**Ejercicio 7 (A)** — **b)** El agente orquesta cuándo recuperar y combina tools (template 01, 03).

**Ejercicio 8 (P)** — **b)** `"revisar"`. Score 45 cae en rango 40–69. El valor `"aprobar"` del LLM es ignorado/sobrescrito por `logic.rules`.

**Ejercicio 9 (A)** — **b)** idempotency → confirm → resilience (ver `flow.json` del 01: payment_service → idempotency → confirm → resilience → orchestrator).

**Ejercicio 10 (B)** — Anti-patrón: filtro solo en prompt. **Fix:** metadata `fare_class`/`route_type` en ingesta + `hardFilters` en PolicyRAG/`retrieval.vector`, o filtros en `tool.retriever` al invocar con parámetros que el store aplica como WHERE, no como texto.

---

## Bloque 2 — Leer y diseñar flow.json

**Ejercicio 11 (A)** — **b)** Batch implica `io.batch`, procesamiento por lote, típicamente `io.output` sin streaming.

**Ejercicio 12 (P)** — **b)** Chunks y Message son tipos distintos. `logic.prompt` acepta Chunks y Message por separado, no Chunks→Message directo sin nodo intermedio.

**Ejercicio 13 (A)** — **b)** Solo nombres de env vars; nunca valores (seguridad, HANDOFF §4).

**Ejercicio 14 (D)** — Respuesta modelo: `io.stt` o entrada texto → `model.intent` (descartar no accionable) → `query.rewrite` → `store.multi-index` (policy/procedure/faq) → `retrieval.router` → `retrieval.reranker` → `logic.prompt` + `logic.citations` → `io.panel`. Opcional: `observability.feedback` loop al reranker. Basado en template 07.

**Ejercicio 15 (A)** — **b)** Ciclo ReAct del orchestrator (template 01, arista loop: true).

**Ejercicio 16 (B)** — **b)** Sin retrieval ni prompt template con chunks, no hay RAG. El LLM respondería solo con conocimiento paramétrico (alucinación).

**Ejercicio 17 (A)** — **b)** Router dirige query al índice correcto; evita ruido cross-categoría (template 05, 07).

**Ejercicio 18 (E)** — **b)** `store.chroma` local — sin Postgres, ideal prototipo intranet (template 09).

**Ejercicio 19 (P)** — **b)** Dos destinos: `prompt:Chunks` y `citations:Chunks`.

**Ejercicio 20 (D)** — Modelo:
```
loader.pdf:Documents → policy_chunker:Documents → policy_metadata:Documents → policy_store:Documents
embedding_model:Embeddings → policy_store:Embeddings
policy_store:Retriever → policy_tool:Retriever
```

---

## Bloque 3 — Anti-patrones y producción

**Ejercicio 21 (A)** — **b)** Umbrales deben ser código determinista (`logic.rules`) por auditabilidad y compliance (template 02 §9).

**Ejercicio 22 (B)** — Faltan: `guardrail.idempotency` (PNR+session), `guardrail.confirm` (>500 USD), `guardrail.resilience` (circuit breaker). Cadena del template 01.

**Ejercicio 23 (A)** — **b)** Compliance requiere escalación garantizada; el LLM puede omitirla (anti-patrón §4.4).

**Ejercicio 24 (P)** — **b)** `deduplicated` — segunda llamada con misma clave devuelve respuesta cacheada sin re-cobrar.

**Ejercicio 25 (A)** — **b)** Audit trail regulatorio (IATA, pagos).

**Ejercicio 26 (E)** — **b)** LangSmith/Langfuse para traces + OTel métricas + audit bus (Kafka/log) para acciones sensibles.

**Ejercicio 27 (B)** — Síntomas: chunks irrelevantes en top-k (playbook mezclado con normativa), respuestas con citas incorrectas, baja precision/recall, más tokens wasted. Fix: multi-index + router + reranker.

**Ejercicio 28 (A)** — **b)** Intercepta **antes** de ejecutar el tool; pausa para confirmación del usuario.

**Ejercicio 29 (D)** — Ejemplo: (1) `model.embedding` local / sin API externa; (2) despliegue en VPC sin egress; (3) `observability.audit` sin PII en logs; (4) hard-filters por plan/paciente; (5) `hitl.escalate` en casos críticos. Cualquier tres coherentes con el brief.

**Ejercicio 30 (A)** — **b)** ReAct es conversacional y stateful por evento; fan-out stateless escala horizontalmente (template 10).

---

## Bloque 4 — Reconstrucción templates

**Ejercicio 31 (A)** — **b)** 09 → 02 → 01 (PLAN §6 M11, plantillas-mapeadas).

**Ejercicio 32 (P)** — **b)** `1, 0, 7, 3` — salida real de `solucion_scratch.py` / `expected.md`.

**Ejercicio 33 (A)** — **b)** Cero fricción, sin servidor BD (README 09 §9).

**Ejercicio 34 (B)** — Falta hard-filter por `applicant_id` (o equivalente) en metadata y en `retrieve()`. Los chunks de otro expediente comparten el índice sin filtro SQL/metadata.

**Ejercicio 35 (A)** — **b)** Cada factor anclado a fragmentos del expediente actual.

**Ejercicio 36 (P)** — **c)** `"aprobar"` — score 72 ≥ 70.

**Ejercicio 37 (A)** — **b)** Guardrail de precisión tarifaria; similitud semántica puede cruzar tarifas (README 01 §9).

**Ejercicio 38 (D)** — Secuencia del system prompt del 01: (1) ReservationService/getItinerary, (2) PolicyRAG penalidades, (3) InventoryService/searchFlights, (4) PricingService/calculateDelta, (5) informar costo y pedir confirmación, (6) PaymentService solo tras confirmar.

**Ejercicio 39 (A)** — **b)** Citabilidad a nivel cláusula (legal/tarifario).

**Ejercicio 40 (B)** — `guardrail.confirm` no cableado, mal configurado (`threshold`), o el agente bypasea la cadena llamando `payment_service` directo sin pasar por idempotency→confirm→resilience.

---

## Bloque 5 — System testing y eval

**Ejercicio 41 (A)** — **b)** CI determinista rápido; eval con LLM en nightly/pre-release (guía §6).

**Ejercicio 42 (P)** — **b)** `logic.rules` — umbral 40–69 → revisar.

**Ejercicio 43 (A)** — **b)** Groundedness de la respuesta en el contexto.

**Ejercicio 44 (D)** — Ejemplo:
| Caso | Assert |
|------|--------|
| "¿Vacaciones primer año?" | must_contain "12 días"; must_cite §3 |
| "¿Precio acciones?" | must_contain "no está disponible"; citations_ok o sin afirmación inventada |
| "¿Vacaciones 3 años?" | must_contain "18 días"; faithfulness ≥ 0.9 |

**Ejercicio 45 (E)** — **b)** promptfoo o RAGAS con dataset versionado en git.

---

## Bloque 6 — Otros templates y arquitectura global

**Ejercicio 46 (A)** — **b)** Caso transaccional puro — tools + guardrails (template 06).

**Ejercicio 47 (A)** — **a)** Copilot lateral para agente humano (template 07).

**Ejercicio 48 (E)** — **b)** Reutilización estándar cross-app con permisos MCP (M8).

**Ejercicio 49 (D)** — **LangGraph multi-agente:** control fino del grafo, checkpoints, fan-out nativo, integración con observabilidad — ideal cuando necesitas routing condicional explícito y estado compartido (template 10). **CrewAI:** definición declarativa agents/tasks/crews, curva más baja, bueno para prototipos multi-rol rápidos; menos control sobre aristas exactas y exactly-once Kafka. Para 10 (event-worker, fan-out, métricas OTLP), LangGraph suele preferirse en producción; CrewAI para validar lógica de roles rápido.

**Ejercicio 50 (D)** — Reconstruir en código fuerza entender puertos, contratos y piezas que RAGorbit abstrae visualmente. El orden 09→02→01 aumenta complejidad gradualmente: primero RAG mínimo, luego batch auditable con reglas, finalmente agente transaccional completo. Sin esa profundidad, el diseño en lienzo es frágil ante cambios, debugging y producción. El criterio de experto es autoevaluable: si puedes reconstruir y defender, dominas las 13 categorías de nodo, no solo arrastrar cajas.

---

⬅️ [Ejercicios](ejercicios.md) · [Guía](guia.md)

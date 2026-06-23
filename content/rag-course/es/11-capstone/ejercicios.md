# M11 · Examen integrador — Arquitectura y Capstone

> **Instrucciones:** Resuelve las 50 preguntas sin mirar `soluciones.md`. Tipos: (A) opción múltiple razonada, (P) predice la salida, (B) encuentra el bug, (E) elige la tecnología, (D) diseño.
>
> Este examen cubre M0–M11. Tiempo sugerido: 3–4 horas.

---

## Bloque 1 — Patrones transversales (Ejercicios 1–10)

**Ejercicio 1 (A)** — ¿Cuál describe mejor el patrón **RAG-as-tool**?

a) El retriever está siempre conectado directamente a `logic.prompt` en el grafo  
b) Un `tool.retriever` envuelve el retriever para que un `agent.react` lo invoque bajo demanda  
c) El LLM genera embeddings internamente sin vector store  
d) RAG-as-tool solo funciona con Chroma, no con pgvector

---

**Ejercicio 2 (A)** — Los **hard-filters** en `retrieval.vector` se aplican:

a) Como instrucción en el system prompt del LLM  
b) En la consulta al store (SQL/metadata) antes de rankear por similitud  
c) Después de que el LLM genera la respuesta  
d) Solo en modo batch, nunca en chat-service

---

**Ejercicio 3 (A)** — En el template 02-banking, ¿quién tiene la palabra final sobre `decision`?

a) El LLM, porque emite el campo en el JSON structured  
b) `logic.rules`, que sobrescribe según umbrales deterministas de score  
c) El oficial de crédito manualmente en cada ejecución  
d) `logic.structured`, porque valida el schema

---

**Ejercicio 4 (E)** — Una tormenta afecta 50 000 envíos y cada uno necesita rebooking independiente. ¿Qué patrón arquitectónico es más adecuado?

a) `agent.react` conversacional único  
b) `agent.fanout` con `logic.rules` para clasificar simple vs complex  
c) Pipeline RAG lineal con `logic.prompt`  
d) Fine-tuning del LLM con casos históricos de disrupción

---

**Ejercicio 5 (A)** — `logic.citations` con `mode: enforce` va **después** del LLM porque:

a) El LLM necesita ver las citas antes de generar  
b) El post-procesador verifica anclaje a chunks; el prompt solo es una sugerencia  
c) Las citas consumen menos tokens al final  
d) Chroma solo expone citas en el puerto `Message`

---

**Ejercicio 6 (D)** — Diseña en 3–5 líneas un flujo para: "Empleado pregunta políticas de vacaciones, siempre del mismo manual". ¿Agente o pipeline? ¿Qué nodos mínimos?

---

**Ejercicio 7 (A)** — **Agentic RAG** se diferencia de RAG lineal en que:

a) No usa embeddings  
b) El agente decide cuándo/qué recuperar y puede combinar tools con retrieval  
c) Siempre requiere Kafka  
d) Elimina la necesidad de `logic.citations`

---

**Ejercicio 8 (P)** — Un batch de crédito produce `{"score": 45, "decision": "aprobar"}` del LLM. `logic.rules` define: ≥70 aprobar, 40–69 revisar, <40 rechazar. ¿Cuál es la `decision` final?

a) `"aprobar"`  
b) `"revisar"`  
c) `"rechazar"`  
d) Error — el JSON es inválido

---

**Ejercicio 9 (A)** — En el template 01-airline, la cadena de guardrails sobre PaymentService es:

a) confirm → idempotency → resilience  
b) idempotency → confirm → resilience  
c) resilience → confirm → idempotency  
d) Solo confirm — idempotencia va en el prompt

---

**Ejercicio 10 (B)** — Encuentra el anti-patrón:

> "Usamos `retrieval.vector` sin hardFilters. En el system prompt del agente decimos: 'Solo busca reglas de la tarifa Economy del pasajero'."

¿Cuál es el fix estructural mínimo?

---

## Bloque 2 — Leer y diseñar flow.json (Ejercicios 11–20)

**Ejercicio 11 (A)** — El campo `deploymentTarget: batch` en `flow.json` implica típicamente:

a) Streaming SSE obligatorio  
b) Nodo de entrada `io.batch` y salida sin streaming  
c) Uso exclusivo de `agent.react`  
d) Que no se puede usar RAG

---

**Ejercicio 12 (P)** — Tienes una arista `sourcePort: "Chunks"` → `targetPort: "Message"`. ¿Es válida según el contrato Flow IR?

a) Sí, siempre  
b) No — tipos incompatibles; Chunks no conecta directo a Message  
c) Sí, si el target es `logic.prompt` que acepta ambos  
d) Solo en deploymentTarget event-worker

---

**Ejercicio 13 (A)** — ¿Qué almacena `secrets[]` en el flow.json?

a) Las API keys en texto plano  
b) Solo nombres de variables de entorno requeridas  
c) Los embeddings precalculados  
d) La configuración de Chroma

---

**Ejercicio 14 (D)** — Brief: "Copilot lateral para agente de call center, <1.5s, tres índices (policy/procedure/faq)". Enumera 5 nodos que incluirías y por qué.

---

**Ejercicio 15 (A)** — La arista con `loop: true` en el template 01 conecta:

a) `loader.pdf` → `ingest.chunker`  
b) `orchestrator:Message` → `orchestrator:Message` (ciclo ReAct)  
c) `audit` → `io.output`  
d) `embedder` → `store`

---

**Ejercicio 16 (B)** — Un diseñador conecta `model.llm:Model` directamente a `io.output:Any` sin `logic.prompt` ni agente. ¿Qué problema principal hay?

a) Ninguno — es el patrón más eficiente  
b) No hay síntesis con contexto recuperado; el flujo no es RAG ni agente completo  
c) El LLM no puede conectar al puerto Any  
d) Falta obligatoriamente `guardrail.confirm`

---

**Ejercicio 17 (A)** — `store.multi-index` + `retrieval.router` resuelven principalmente:

a) Falta de GPU para embeddings  
b) Ruido por mezclar categorías de documentos en un solo índice  
c) Latencia de Kafka  
d) Incompatibilidad entre Claude y OpenAI

---

**Ejercicio 18 (E)** — Prototipo intranet RRHH, 200 empleados, sin Postgres. ¿Store recomendado?

a) Pinecone serverless  
b) `store.chroma` local  
c) Neo4j GraphRAG obligatorio  
d) Solo BM25 sin vectores

---

**Ejercicio 19 (P)** — En el flow.json del 09, ¿cuántos nodos tienen arista entrante desde `retriever`?

a) 1  
b) 2  
c) 3  
d) 4

---

**Ejercicio 20 (D)** — Dibuja en ASCII el pipeline de ingesta offline del template 01 (políticas tarifarias) con puertos.

---

## Bloque 3 — Anti-patrones y producción (Ejercicios 21–30)

**Ejercicio 21 (A)** — Delegar el umbral "aprobar si score ≥ 70" al LLM es anti-patrón porque:

a) Los LLM no pueden emitir números  
b) El LLM es probabilístico; umbrales legales/de negocio deben ser deterministas  
c) `logic.structured` no soporta enteros  
d) pgvector rechaza scores > 100

---

**Ejercicio 22 (B)** — Código: el agente llama `PaymentService` directamente sin wrappers. ¿Qué guardrails faltan para paridad con template 01?

---

**Ejercicio 23 (A)** — `hitl.escalate` debe ser estructural (nodo en el grafo) y no "decidido por el LLM" porque:

a) Los humanos no pueden recibir escalaciones  
b) El LLM puede omitir escalar en casos críticos; HITL es compliance  
c) `hitl.escalate` no es un nodo real  
d) Kafka no soporta HITL

---

**Ejercicio 24 (P)** — Primer cobro: `chargeChangeFee(pnr="ABC", session="s1", amount=600)` → `captured`. Segundo cobro idéntico en <24h → ¿qué esperas con `guardrail.idempotency`?

a) Segundo `captured` y doble cargo  
b) `deduplicated` sin segunda llamada al servicio  
c) Error 500  
d) El agente pide confirmación otra vez

---

**Ejercicio 25 (A)** — `observability.audit` con `sink: kafka` en el 01 sirve para:

a) Entrenar el embedding model  
b) Trazabilidad regulatoria de tool calls y decisiones  
c) Reemplazar `logic.citations`  
d) Cachear respuestas del LLM

---

**Ejercicio 26 (E)** — Observabilidad de un agente en producción: ¿qué combinación es más completa?

a) Solo print statements  
b) LangSmith o Langfuse + OpenTelemetry + audit bus  
c) Excel manual semanal  
d) Thumbs up/down sin almacenamiento

---

**Ejercicio 27 (B)** — "Usamos un solo `store.pgvector` para contrato + playbook + normativa + precedentes sin router." ¿Qué síntoma verás en producción?

---

**Ejercicio 28 (A)** — `guardrail.confirm` con `threshold: amount > 500` actúa:

a) Después del cobro exitoso  
b) Antes de ejecutar PaymentService, pausando para confirmación del usuario  
c) Solo en el system prompt  
d) Solo en deploymentTarget batch

---

**Ejercicio 29 (D)** — Brief con PHI que no puede salir del VPC. ¿Tres decisiones de arquitectura obligatorias?

---

**Ejercicio 30 (A)** — Usar `agent.react` para 50 000 rebookings paralelos es anti-patrón porque:

a) ReAct no soporta tools  
b) Conversación multi-turno no escala en volumen/costo vs fan-out stateless  
c) Kafka no funciona con agentes  
d) No se puede auditar

---

## Bloque 4 — Reconstrucción templates 09/02/01 (Ejercicios 31–40)

**Ejercicio 31 (A)** — Orden correcto de reconstrucción en el capstone:

a) 01 → 02 → 09  
b) 09 → 02 → 01  
c) 02 → 09 → 01  
d) Cualquier orden

---

**Ejercicio 32 (P)** — Query de vacaciones/3 años sobre `politicas_rrhh.txt` con bag-of-words (scratch M11). Índices top-4 esperados (0-based):

a) 0, 1, 2, 3  
b) 1, 0, 7, 3  
c) 0, 0, 0, 0  
d) 7, 6, 5, 4

---

**Ejercicio 33 (A)** — Template 09 usa `store.chroma` en lugar de pgvector principalmente porque:

a) Chroma es más preciso  
b) Prototipo sin servidor de BD externo — cero fricción  
c) pgvector no soporta embeddings  
d) Regulación obliga Chroma en RRHH

---

**Ejercicio 34 (B)** — En tu scratch del 02, el retriever devuelve chunks del expediente `applicant_002` al procesar `applicant_001`. ¿Dónde está el bug?

---

**Ejercicio 35 (A)** — `requireCitations: true` en `logic.structured` del 02 exige:

a) Que el LLM cite solo en el campo `justificacion`  
b) Que cada factor esté anclado a fragmentos recuperados del expediente  
c) Citas APA al final del JSON  
d) Eliminar el campo `score`

---

**Ejercicio 36 (P)** — Expediente `applicant_001`: ingresos $85k, deuda $12k, pagos 97%, antigüedad 6 años. Score del LLM: 72. ¿`decision` tras `logic.rules`?

a) `"rechazar"`  
b) `"revisar"`  
c) `"aprobar"`  
d) `"pendiente"`

---

**Ejercicio 37 (A)** — En el 01, PolicyRAG debe filtrar por `fare_class` y `route_type` porque:

a) Mejora la latencia del chat  
b) Evita aplicar penalidades de otra tarifa/ruta por similitud semántica  
c) Kafka lo requiere  
d) El PNR no contiene fare_class

---

**Ejercicio 38 (D)** — Lista la secuencia obligatoria de tools del system prompt del agente 01 (orden del flujo de negocio).

---

**Ejercicio 39 (A)** — `ingest.chunker` con `by-clause` en políticas tarifarias (01) sirve para:

a) Reducir costo de API  
b) Chunks citables a nivel de cláusula legal/tarifaria  
c) Eliminar metadata  
d) Evitar usar embeddings

---

**Ejercicio 40 (B)** — Tu agente 01 cobra sin pedir confirmación con monto $650. ¿Qué nodo/guardrail falló o no está cableado?

---

## Bloque 5 — System testing y eval (Ejercicios 41–45)

**Ejercicio 41 (A)** — ¿Qué va típicamente en CI en cada commit vs nightly?

a) Todo con LLM real en cada push  
b) CI: tests deterministas (rules, filters, guardrails); nightly: eval RAGAS con LLM  
c) Solo eval RAGAS en CI  
d) Nunca testear sistemas de IA

---

**Ejercicio 42 (P)** — `test_rules.py`: `assert apply_rules(score=69) == "revisar"`. ¿Qué componente del template 02 valida?

a) `model.embedding`  
b) `logic.rules`  
c) `logic.prompt`  
d) `io.batch`

---

**Ejercicio 43 (A)** — Faithfulness en RAGAS mide:

a) Velocidad del retriever  
b) Si la respuesta está fundamentada en el contexto recuperado  
c) Costo por token  
d) Número de nodos en el grafo

---

**Ejercicio 44 (D)** — Define 3 casos de test para el bot RRHH (09): query, propiedad esperada, métrica o assert.

---

**Ejercicio 45 (E)** — Framework de eval para regression de prompts en CI con comparación de versiones:

a) Solo pytest sin LLM  
b) promptfoo o RAGAS con dataset versionado  
c) Git diff del flow.json únicamente  
d) A/B manual sin automatización

---

## Bloque 6 — Otros templates y arquitectura global (Ejercicios 46–50)

**Ejercicio 46 (A)** — Template 06-retail **no** usa RAG en línea porque:

a) Retail prohíbe LLMs  
b) El caso es transaccional (pedidos/devoluciones) resuelto con tools + guardrails  
c) No hay documentos  
d) Chroma no funciona en e-commerce

---

**Ejercicio 47 (A)** — Template 07-telecom usa `io.panel` en lugar de `io.output` directo al cliente porque:

a) El copilot asiste al agente humano en panel lateral sin interrumpir la llamada  
b) El cliente no tiene pantalla  
c) Kafka requiere panel  
d) STT solo funciona con panel

---

**Ejercicio 48 (E)** — Exportar PolicyRAG del 01 como servidor MCP (M8) beneficia:

a) Solo estética del diagrama  
b) Reutilización cross-app con modelo de permisos estándar  
c) Eliminar el vector store  
d) Evitar guardrails

---

**Ejercicio 49 (D)** — Comparación en 1 párrafo: ¿cuándo elegirías LangGraph multi-agente vs CrewAI para el template 10?

---

**Ejercicio 50 (D)** — Pregunta de cierre del capstone: "Explica por qué el criterio de experto exige reconstruir 09→02→01 y no solo usar RAGorbit visualmente." Respuesta en 5–8 líneas.

---

**Fin del examen — 50 preguntas**

⬅️ [Guía](guia.md) · Respuestas en `soluciones.md` (solo tras intentar todas)

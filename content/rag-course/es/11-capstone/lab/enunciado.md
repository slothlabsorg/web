# M11 · Capstone — Enunciado del taller integrador

> **Duración estimada:** 24–32 horas (3–4 días a tiempo completo).
> **Prerrequisito:** haber completado M0–M10 (o al menos M1–M6 + M9 para los retos 1 y 3).
> **Método tri-modal:** cada reto exige diseño (①), implementación scratch (②) y versión framework (③) donde aplique.

---

## Contexto

Has completado el currículum de RAG & Agentic AI. Este capstone valida que puedes:

1. **Reconstruir** arquitecturas reales desde cero (los 3 templates del plan: 09 → 02 → 01).
2. **Diseñar** una arquitectura nueva ante un brief de negocio.
3. **Defender** tus decisiones con la rúbrica de experto del curso.

Todo el material de referencia está en [`../../referencia/plantillas-mapeadas.md`](../../referencia/plantillas-mapeadas.md) y los `flow.json` de [`../../examples/`](../../examples/).

---

## Reto 1 · Reconstruir 3 templates (09 → 02 → 01)

### Objetivo

Implementar en **scratch (stdlib)** y **framework (LangChain/LangGraph)** los tres templates en orden creciente de dificultad. El script de referencia `solucion_scratch.py` reconstruye el **09** y debe servirte de modelo; tú completas el 02 y el 01.

### Orden obligatorio

```
09 RRHH (RAG lineal)  →  02 Banca (batch + rules)  →  01 Aerolínea (agente + guardrails)
```

### Parte A — Template 09 (`examples/09-hr-policy-assistant/`)

**Lee:** `flow.json` + README del template.

**Tu entrega scratch (`tu_scratch_09.py` o extensión de `solucion_scratch.py`):**

- Pipeline: loader → chunker → embed → store → retrieve → prompt → LLM stub → citations enforce.
- Datos: `datos/politicas_rrhh.txt`.
- Debe coincidir con [`expected.md`](expected.md) (índices, similitudes, respuesta con 18 días).

**Tu entrega framework (`tu_framework_09.py`):**

- LangChain + Chroma siguiendo [`guia.md` §12](../guia.md#12-la-capa--explicada-cómo-reconstruir-un-template-con-framework).
- Compara bloque por bloque con `solucion_framework.py`.

### Parte B — Template 02 (`examples/02-banking-credit-scoring/`)

**Lee:** `flow.json` + README. Datos mock: `datos/applicants/applicant_001/`.

**Scratch:**

- Dos loaders (PDF/txt + CSV tabular) convergen en chunker.
- Metadata `doc_type` y `period` en cada chunk.
- Vector store en memoria con hard-filters.
- LLM stub que emite JSON con `score`, `factores`, `justificacion`.
- `logic.rules` determinista: ≥70 aprobar, 40–69 revisar, <40 rechazar.
- **La decisión final NO la decide el LLM** — la sobrescribe `logic.rules`.

**Framework:**

- Structured output con schema Pydantic (M5).
- pgvector o Chroma con filtros de metadata (M3/M4).

**Criterio:** JSON de salida para `applicant_001` con `decision: "aprobar"` y score ≥ 70.

### Parte C — Template 01 (`examples/01-airline-flight-change/`)

**Lee:** `flow.json` + README. Reutiliza stubs de M6 (`06-agentes-i/lab/datos/`).

**Scratch:**

- Agente ReAct con bucle Thought → Action → Observation.
- Tools: PolicyRAG (retriever con hard-filters fare_class/route_type), Reservation, Inventory, Pricing, Payment.
- Guardrails en Payment: idempotency → confirm (>500) → resilience (stub).
- Audit log en memoria (lista de eventos).
- Dos turnos: solicitud de cambio → confirmación → cobro idempotente.

**Framework:**

- LangGraph `StateGraph` o `create_react_agent` (M6 §8).
- Misma secuencia de tool calls verificable.

**Criterio:** ver [`expected.md` § Template 01](expected.md#criterios-de-aceptación--reto-1-templates-02-y-01).

### Pistas escalonadas

<details>
<summary>Pista 1 — ¿Por dónde empiezo el 09?</summary>

Abre `solucion_scratch.py` y ejecuta `python3 solucion_scratch.py`. Si la salida coincide con `expected.md`, entiendes el esqueleto. Luego reescríbelo tú sin copiar.
</details>

<details>
<summary>Pista 2 — El 02 mezcla expedientes</summary>

El anti-patrón más común: recuperar chunks de otro solicitante. Solución: hard-filters en metadata (`doc_type`, `period`, `applicant_id`) **antes** de la similitud vectorial — igual que `retrieval.vector` con `hardFilters` en el flow.json.
</details>

<details>
<summary>Pista 3 — El agente del 01 cobra dos veces</summary>

Implementa `guardrail.idempotency` como wrapper del tool Payment: clave `(pnr, session_id)`, TTL 24h, segunda llamada devuelve respuesta cacheada con status `deduplicated`.
</details>

<details>
<summary>Pista 4 — Framework del 01</summary>

Empieza con el grafo de M6 (`06-agentes-i/lab/solucion_framework.py`) y añade tools de servicio + cadena de guardrails. PolicyRAG es `tool.retriever` — un retriever envuelto como función invocable.
</details>

---

## Reto 2 · Diseñar arquitectura nueva

### Brief de negocio

Lee [`datos/brief_telemedicina.json`](datos/brief_telemedicina.json): copilot de telemedicina para SaludPlus Seguros.

### Tu entrega

1. **Diagrama ASCII** del flujo (ingesta + runtime) con puertos etiquetados.
2. **`flow.json` válido** importable en RAGorbit (0 errores al Validar).
3. **Documento de justificación** (1–2 páginas) que para cada nodo explique:
   - Por qué lo elegiste.
   - Qué alternativa descartaste y por qué (tabla de [`tecnologias-comparadas.md`](../../referencia/tecnologias-comparadas.md)).
   - Cómo cumple restricciones del brief (PHI, latencia, HITL, auditoría).

### Nodos mínimos esperados

| Categoría | Al menos uno de |
|-----------|-----------------|
| Ingesta | `loader.pdf`, `ingest.chunker`, `ingest.metadata` |
| Store/Retrieval | `store.pgvector` o `store.multi-index`, `retrieval.vector` con hardFilters |
| Agente o pipeline | `agent.react` o pipeline con `query.rewrite` + `retrieval.router` |
| Lógica | `logic.citations` enforce |
| Producción | `hitl.escalate`, `observability.audit` |
| IO | `io.panel` o `io.input` + `io.stt` (opcional) |

### Pistas

<details>
<summary>Pista — ¿Qué templates mirar?</summary>

Combina patrones de:
- [03-healthcare-prior-auth](../../examples/03-healthcare-prior-auth/) — agentic RAG + HITL
- [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/) — panel lateral + baja latencia
- [08-manufacturing-maintenance-rag](../../examples/08-manufacturing-maintenance-rag/) — hard-filters críticos
</details>

---

## Reto 3 · Defensa de diseño + examen integrador

### Parte A — Defensa oral/escrita (15 minutos)

Presenta tu solución del Reto 2 ante un "comité técnico" (compañero, mentor o tú mismo grabando). Cubre:

1. Diagrama y recorrido del `flow.json` nodo por nodo.
2. Un anti-patrón que **evitaste** y cómo lo evitaste en el diseño.
3. Cómo probarías el sistema en producción (eval + system tests).
4. Un escenario de seguridad (PHI, inyección de prompts) y tu mitigación.

### Parte B — Examen integrador

Resuelve las **50 preguntas** de [`ejercicios.md`](../ejercicios.md) sin mirar [`soluciones.md`](../soluciones.md).

**Umbral de aprobación sugerido:** ≥ 40/50 (80%) con justificación razonada en preguntas abiertas.

### Rúbrica de experto

| Dimensión | Peso | Indicadores de excelencia |
|-----------|------|---------------------------|
| **Correctitud** | 25% | Nodos correctos, puertos compatibles, pipeline coherente |
| **Justificación** | 25% | Trade-offs explícitos; alternativas descartadas con razón |
| **Producción** | 20% | Idempotencia, audit, latencia, deployment target adecuado |
| **Seguridad** | 15% | Filtros duros, guardrails, PHI/PII, no delegar umbrales al LLM |
| **Claridad** | 15% | Diagrama legible, defensa estructurada, documentación mantenible |

**Aprobado como experto:** Reto 1 completo (3 templates) + Reto 2 validado en RAGorbit + Reto 3 ≥ 80% examen + defensa satisfactoria en las 5 dimensiones.

---

## Entregables

```
tu-capstone/
  reto1/
    scratch_09.py
    scratch_02.py
    scratch_01.py
    framework_09.py
    framework_02.py
    framework_01.py
  reto2/
    diagrama.txt
    flow.json
    justificacion.md
  reto3/
    defensa.md (o video/script)
    ejercicios_resueltos.md
```

---

## Checkpoint

**Lo sabes si puedes:**

- [ ] Ejecutar tu scratch del 09 y obtener la salida de `expected.md`.
- [ ] Explicar por qué `logic.rules` va **después** de `logic.structured` en el 02.
- [ ] Dibujar la cadena de guardrails del 01 sin mirar el README.
- [ ] Validar tu `flow.json` del Reto 2 en RAGorbit sin errores.
- [ ] Responder ≥ 40/50 preguntas del examen integrador.

⬅️ [Guía del módulo](../guia.md) · [Soluciones de referencia](solucion.md)

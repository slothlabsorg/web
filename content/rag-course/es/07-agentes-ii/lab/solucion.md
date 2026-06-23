# Solución del Lab M7 — Multi-Agente Rebooking

---

## Capa ② — `solucion_scratch.py`

### Arquitectura

```
SupervisorOrchestrator
  ├── PriorityRulesAgent     → P1/P2/P3, simple/complex
  ├── ProfileAgent           → shipment_profiles.json
  ├── PolicyAgent            → rebook_policies.json (PolicyRAG simulado)
  ├── AlternativesAgent      → alternatives.json
  ├── AutoConfirmAgent       → rama simple
  └── FakeLLMAgent           → rama complex (plantillas)
```

`fan_out()` procesa lotes de hasta `concurrency=16` eventos — en scratch es secuencial pero respeta el contrato.

### Bifurcación auto-confirm vs LLM

```python
if autoconfirm_agent.can_auto_confirm(track, policy, alternatives, profile):
    # track=simple + opción obvia
    ...
else:
    llm_result = llm_agent.analyze(...)
```

**Opción obvia** (determinista):
- Una sola alternativa, o
- Varias pero la más rápida supera a la segunda por ≥ 4h ETA.

### Idempotencia

```python
if shipment_id in self._processed:
    return RebookResult(..., handler="deduplicated", ...)
...
self._processed.add(shipment_id)
```

### Métricas verificadas

- 6 envíos · 3 auto-confirm · 3 LLM · 50% cada uno.

---

## Capa ③ — `solucion_framework.py`

### CrewAI

| Componente | Rol en rebooking |
|------------|------------------|
| Agent clasificador | `PriorityRulesAgent` |
| Agent investigador | Profile + Policy + Alternatives via `@tool` |
| Agent ejecutor | Auto-confirm o propuesta LLM |
| `Process.sequential` | Pipeline fijo por envío |
| Loop externo | Fan-out simulado |

### LangGraph

| Nodo | Equivalente scratch |
|------|---------------------|
| `supervisor` | `PriorityRulesAgent` |
| `profile`, `policy`, `alternatives` | Agentes especialistas |
| `route_after_alternatives` | `if track == "complex"` |
| `autoconfirm` / `llm_specialist` | Ramas finales |

### Trade-offs CrewAI vs LangGraph

| Criterio | CrewAI | LangGraph |
|----------|--------|-----------|
| Control de flujo | Declarativo (tasks) | Explícito (aristas) |
| Fan-out masivo | Loop externo | Subgrafos + checkpointer |
| Auditoría | Logs de task | Traza por nodo |
| Producción RAGorbit | Prototipo | **Preferido** |

---

## Lecciones

1. **Segmenta antes del LLM** — `logic.rules` ahorra 10–20× en tokens.
2. **Fan-out = stateless** — estado en Kafka/BD, no en el agente.
3. **Idempotencia es obligatoria** — Kafka reentrega eventos.
4. **Multi-agente scratch** — clases especialistas + orquestador clarifican el grafo framework.
5. **Mismo problema, dos frameworks** — CrewAI acelera prototipo; LangGraph gana en producción.

---

## Conexión RAGorbit

El scratch mapea a:

```
io.event-source → logic.rules → logic.router → agent.fanout
                                                    ├── tool.service × 3
                                                    ├── tool.retriever
                                                    ├── io.notify
                                                    └── observability.audit
```

Ver [`flow.json`](../../../examples/10-logistics-disruption-rebooking/flow.json).

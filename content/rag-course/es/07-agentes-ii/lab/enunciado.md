# Lab M7 · Multi-Agente — Rebooking de Disrupción Logística

## Brief de negocio

Eres ingeniero en el **Control Tower** de una operadora logística. Un cierre del hub **MIA por tormenta** afecta a miles de envíos. El proceso manual (un agente humano por envío) colapsa en minutos.

Tu sistema debe:

1. Consumir eventos de disrupción (`shipment.disruption` en Kafka).
2. **Segmentar** cada envío en P1/P2/P3 y track `simple`/`complex` (reglas deterministas).
3. Despachar un **sub-agente por envío** en paralelo (fan-out, `concurrency=16`).
4. Para cada envío: perfil → política → alternativas → **auto-confirm** o **LLM**.
5. Notificar al cliente y auditar cada decisión.

**Guardarrail central:** cobertura 100 % (ningún envío sin rebook) + idempotencia (ningún doble rebook).

**Template ancla:** [`examples/10-logistics-disruption-rebooking/`](../../../examples/10-logistics-disruption-rebooking/README.md)

## Datos disponibles

En `lab/datos/`:

| Archivo | Contenido |
|---------|-----------|
| `disruption_events.json` | 6 eventos de disrupción (hub MIA, causa `weather`) |
| `shipment_profiles.json` | Perfil por `shipment_id` (tier, email, preferencias) |
| `rebook_policies.json` | Políticas por `disruption_cause` + `tier` |
| `alternatives.json` | Rutas alternativas por envío (ventana 48h) |

## Arquitectura objetivo (multi-agente)

```
                    ┌─────────────────────────────────────────┐
  Evento Kafka ────▶│  SupervisorOrchestrator (fan-out)       │
                    │       │                                 │
                    │       ├─ PriorityRulesAgent             │
                    │       ├─ ProfileAgent                   │
                    │       ├─ PolicyAgent                    │
                    │       ├─ AlternativesAgent              │
                    │       ├─ AutoConfirmAgent (simple)        │
                    │       └─ FakeLLMAgent (complex)         │
                    └─────────────────────────────────────────┘
```

## Tarea

### Parte A — Multi-agente desde cero (capa ②)

Implementa `lab/solucion_scratch.py`:

1. **Agentes como clases/funciones:** `PriorityRulesAgent`, `ProfileAgent`, `PolicyAgent`, `AlternativesAgent`, `AutoConfirmAgent`, `FakeLLMAgent`.
2. **`SupervisorOrchestrator`:** orquesta el pipeline por envío y el fan-out sobre la lista de eventos.
3. **LLM fake determinista:** plantillas fijas para casos `track=complex` (multi-leg premium, CRITICAL).
4. **Reglas de auto-confirm:** `track=simple` + opción obvia (única alt o gap ETA ≥ 4h).
5. **Idempotencia:** un `set` de `shipment_id` ya procesados.
6. **Salida:** traza por agente, tabla resumen, métricas auto-confirm vs LLM, tabla de trade-offs.
7. **`assert` finales:** 6 envíos, 3 auto-confirm, 3 LLM, idempotencia.

Ejecutar: `python3 solucion_scratch.py` — debe coincidir con [`expected.md`](expected.md).

### Parte B — CrewAI + LangGraph (capa ③, tarea guiada)

> **Lee primero:** [guia.md §9 — La capa ③ explicada: frameworks multi-agente desde cero](../guia.md#9-la-capa--explicada-frameworks-multi-agente-desde-cero). También repasa [M6 §8](../../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo).

**Objetivo:** el **mismo problema** resuelto en **CrewAI** y en **LangGraph multi-agente**; comparar trade-offs.

```bash
pip install crewai langgraph langchain langchain-anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### Paso B.1 — Tools compartidas (`@tool`)

Convierte los servicios del scratch en `@tool`: `get_shipment_profile`, `get_rebook_policy`, `get_alternatives`, `auto_confirm_rebook`.

#### Paso B.2 — CrewAI

1. Define 3 `Agent`: clasificador, investigador (con tools), ejecutor.
2. Define 3 `Task` encadenadas con `context=[...]`.
3. Crea `Crew(agents=..., tasks=..., process=Process.sequential)`.
4. Loop externo por evento = fan-out.

**Pregunta:** ¿Por qué `Process.sequential` y no `hierarchical` para este caso?

#### Paso B.3 — LangGraph multi-agente

1. Define `RebookState` con `Annotated[list, add_messages]`.
2. Nodos: `supervisor`, `profile`, `policy`, `alternatives`, `autoconfirm`, `llm_specialist`.
3. **Arista condicional** tras `alternatives`: `track=simple` → `autoconfirm`; `complex` → `llm_specialist`.
4. Compila con `builder.compile()`.

**Pregunta:** ¿Qué nodo del grafo corresponde a `SupervisorOrchestrator.process_event` del scratch?

#### Paso B.4 — Compara

Abre `lab/solucion_framework.py` bloque por bloque (guía §9.8). Completa la tabla de trade-offs CrewAI vs LangGraph.

> Ilustrativo en el entorno del curso (sin pip). Escríbelo aunque no puedas ejecutarlo.

## Escenario de prueba

| shipment_id | tier | track esperado | handler esperado | alt esperada |
|-------------|------|----------------|------------------|--------------|
| SHP-20240614-00742 | standard, flexible | simple | auto_confirm | ALT-881 |
| SHP-20240614-00815 | standard | simple | auto_confirm | ALT-902 |
| SHP-20240614-00189 | premium, multi-leg | complex | llm | ALT-715 |
| SHP-20240614-00331 | CRITICAL | complex | llm | ALT-640 |
| SHP-20240614-00556 | flexible, 2 alts | simple | auto_confirm | ALT-904 |
| SHP-20240614-00204 | premium, multi-leg | complex | llm | ALT-521 |

**Métricas esperadas:** 6 procesados · 3 auto-confirm (50%) · 3 LLM (50%)

## Pistas escalonadas

### Pista 1 — Reglas de prioridad (igual que `flow.json`)

```python
def classify(event):
    if event.get("tier") == "premium" or event.get("connections_lost", 0) > 0:
        return {"priority": "P1", "track": "complex"}
    if event.get("delivery_flexibility") == "flexible":
        return {"priority": "P2", "track": "simple"}
    if event.get("disruption_severity") == "CRITICAL":
        return {"priority": "P1", "track": "complex"}
    return {"priority": "P3", "track": "simple"}
```

### Pista 2 — Auto-confirm vs LLM

```python
# Auto-confirm si:
#   track == "simple" AND (
#     len(alternatives) == 1
#     OR una alternativa es >= 4h más rápida que la segunda
#   )
# LLM si:
#   track == "complex" (premium multi-leg, CRITICAL, etc.)
```

### Pista 3 — Fan-out simulado

```python
def fan_out(self, events, concurrency=16):
    for i in range(0, len(events), concurrency):
        batch = events[i : i + concurrency]
        for event in batch:
            yield self.process_event(event)
```

### Pista 4 — FakeLLMAgent por plantillas

```python
if is_multi_leg and tier == "premium":
    ranked = sorted(alts, key=lambda a: (a.get("connections", 99), a["eta_delta_hours"]))
    return {"proposal": ranked[0]["alternative_id"], ...}
```

## Criterios de aceptación

1. `python3 -m py_compile lab/solucion_scratch.py` — sin errores.
2. `python3 lab/solucion_scratch.py` — coincide con `expected.md`.
3. Solo stdlib en scratch (sin `langchain`, `crewai`, red).
4. `solucion_framework.py` compila (`py_compile`) con CrewAI + LangGraph.
5. Tabla trade-offs auto-confirm vs LLM al final del scratch.
6. Idempotencia verificada con `assert`.

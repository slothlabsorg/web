# M7 · Soluciones — Agentes II

---

## Ejercicio 30

**(a)** Un solo agente ReAct — un usuario, flujo conversacional, pocas tools; multi-agente añadiría latencia sin beneficio.

**(b)** Multi-agente fan-out — 5 000 items paralelos con la misma lógica; `agent.fanout` con sub-agentes stateless.

**(c)** Multi-agente jerárquico o CrewAI sequential — roles cognitivos distintos (buscar, resumir, revisar).

**(d)** Pipeline determinista — sin decisión dinámica de tools; RAG fijo es más barato y predecible.

**(e)** Un solo agente ReAct — un usuario; los 3 retrievers son tools del mismo agente (agentic RAG, M6).

---

## Ejercicio 31

**(a)** Jerárquico — manager delega a especialistas.

**(b)** Fan-out stateless — N instancias paralelas sin memoria compartida.

**(c)** Colaborativo — diálogo peer-to-peer (AutoGen).

**(d)** Supervisor — orquestador central con pipeline secuencial de especialistas.

---

## Ejercicio 32

**(a)** `{"priority": "P2", "track": "simple"}` — flexible coincide antes que CRITICAL.

**(b)** `{"priority": "P1", "track": "complex"}` — premium en primera regla.

**(c)** `{"priority": "P1", "track": "complex"}` — CRITICAL en tercera regla (flexible no aplica).

---

## Ejercicio 33

**(a)** Cada sub-agente procesa un envío independiente; no necesitan contexto de otros envíos; permite escalar horizontalmente y recuperarse de crashes.

**(b)** Event log de Kafka + base de datos transaccional (decisión de rebook por `shipment_id`).

**(c)** Kafka exactly-once (transacciones) + idempotencia en BD por `shipment_id`.

---

## Ejercicio 34

**(a)** Nunca se añade `shipment_id` a `self.processed` tras procesar exitosamente.

**(b)** `self.processed.append(shipment_id)` (o `self.processed.add(shipment_id)` si es set) justo antes del `return result`, tras `sub_agent` exitoso.

---

## Ejercicio 35

**(a)** Nodo `autoconfirm`.

**(b)** El grafo fallaría o terminaría sin ruta válida — las claves del dict (`"auto"`, `"llm"`) deben coincidir **exactamente** con lo que devuelve la función router.

**(c)** `if self.autoconfirm_agent.can_auto_confirm(...):` vs `llm_agent.analyze(...)` en `SupervisorOrchestrator.process_event`.

---

## Ejercicio 36

**(a)** `Agent` = rol persistente con personalidad y tools; `Task` = trabajo concreto con descripción y output esperado asignado a un agente.

**(b)** Pasa el resultado de tasks anteriores como contexto — encadenamiento como memoria entre pasos.

**(c)** Rebooking por envío es un pipeline lineal (clasificar → investigar → ejecutar), no necesita manager que delega dinámicamente; hierarchical añade un LLM extra innecesario.

---

## Ejercicio 37

**Respuesta: C — LangGraph fan-out + logic.rules.**

- **A descartada:** conversación emergente, sin grafo auditable, imposible exactly-once fiable.
- **B descartada:** hierarchical añade overhead de manager; peor para 10k items homogéneos que fan-out.
- **D descartada:** un ReAct secuencial no escala a 10k/h ni paraleliza; mezcla todos los envíos en una sesión.

**C gana:** rules deterministas para 60% sin LLM, fan-out paralelo, aristas explícitas para audit, checkpointer por `shipment_id`.

---

## Ejercicio 38

**(a)** El diálogo libre entre agentes (coder + executor) converge iterativamente sin diseñar grafo previo — ideal para explorar.

**(b)** Flujo explícito, conditional edges auditables, checkpoints, integración con Kafka/guardrails — cumplimiento regulatorio.

**(c)** `add_conditional_edges` con routing determinista por nombre de nodo; o `MemorySaver`/checkpointer con `thread_id` por entidad.

---

## Ejercicio 39

**(a)** 74 / 100 = **0.74 (74%)**.

**(b)** 26 × $0.05 = **$1.30**.

**(c)** 100 × $0.05 = $5.00. Ahorro: $5.00 − $1.30 = **$3.70 (74% del costo LLM evitado)**.

---

## Ejercicio 40

**(a)** Stack IBM — watsonx, gobernanza enterprise, integración Granite.

**(b)** **Plugins** (funciones/skills tipadas que el planner invoca).

---

## Ejercicio 41

```
Evento
  → PriorityRulesAgent (P1/P2/P3, track)
  → ProfileAgent
  → PolicyAgent
  → AlternativesAgent
  → ¿track simple?
        SÍ → AutoConfirmAgent → notify
        NO → FakeLLMAgent → notify (opciones al cliente)
```

Bifurcación tras `AlternativesAgent`, basada en `track` y reglas de opción obvia.

---

## Ejercicio 42

La función devuelve `"llm_specialist"` pero el dict de routing solo tiene clave `"llm"`. LangGraph no encuentra ruta.

**Corrección:**

```python
def route(state):
    if state["track"] == "complex":
        return "llm"
    return "autoconfirm"
```

O cambiar el dict a `{"llm_specialist": "llm_specialist", ...}` y devolver `"llm_specialist"`.

---

## Ejercicio 43

**(a)** `thread_id = shipment_id` (un checkpoint por envío).

**(b)** Se mezclan historiales y estado de dos envíos distintos — decisiones incorrectas y fuga de datos entre clientes.

---

## Ejercicio 44

**(a)** Tres: `ShipmentProfileService`, `AlternativesService`, `AutoConfirmService`.

**(b)** `priority_rules` (`logic.rules`).

**(c)** `16`.

---

## Ejercicio 45

| Criterio | Auto-confirm | LLM |
|----------|--------------|-----|
| Latencia típica P2 | ~1.8–2.1 s | ~5–6 s (P1) |
| Costo tokens | $0 | ~$0.02–0.08 por envío |
| Caso SHP-00189 | No aplica (va a LLM) | Propone ALT-715, opciones al premium |

---

## Ejercicio 46

**A favor:** separación de concerns — reportes batch no compiten con worker crítico; equipos distintos pueden mantener cada pieza.

**En contra:** dos stacks de observabilidad, duplicación de tools/prompts, riesgo de divergencia de lógica de negocio. Mitigación: tools compartidas (`@tool`) y un solo source of truth en `flow.json`.

---

## Ejercicio 47

**(a)** **Fan-out** — 50k items/día homogéneos, paralelizable, stateless por devolución.

**(b)** `logic.rules` (monto/risk), sub-agente con `OrderService`, `PolicyRAG`, `RefundService`, `EscalationService`, `io.notify`, `observability.audit`.

**(c)** Estimar ~65–75% auto-confirm (devoluciones estándar bajo umbral); ~25–35% LLM (montos altos, casos ambiguos, fraude sospechoso).

**(d)** **LangGraph fan-out** — audit, conditional edges, Kafka. Descartar AutoGen — sin grafo explícito para reembolsos regulados.

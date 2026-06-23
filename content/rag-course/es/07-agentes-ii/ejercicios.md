# M7 · Ejercicios — Agentes II (Multi-agente)

> **Instrucciones:** Responde sin mirar las soluciones. Las respuestas están en `soluciones.md`.

---

## Ejercicio 30 · Opción múltiple (A) — ¿Multi-agente o uno solo?

Para cada escenario, indica si usarías **un solo agente ReAct**, **multi-agente** o **pipeline determinista**, y justifica en una frase.

**(a)** Bot de aerolínea que cambia vuelos (1 usuario, 4 tools, conversación).

**(b)** Worker que procesa 5 000 alertas de fraude en paralelo con la misma lógica por alerta.

**(c)** Informe de investigación: un agente busca en web, otro resume, otro revisa calidad.

**(d)** Pipeline RAG que siempre recupera políticas y genera respuesta (sin tools externas).

**(e)** Copilot de call center con un usuario y 3 índices vectoriales como tools.

---

## Ejercicio 31 · Patrones (A) — Identifica el patrón

¿Qué patrón multi-agente describe cada arquitectura?

**(a)** Un manager LLM asigna subtareas a investigador, redactor y revisor.

**(b)** 16 sub-agentes idénticos procesan envíos de Kafka sin compartir memoria.

**(c)** Tres agentes debaten en chat hasta acordar una solución de código.

**(d)** Un orquestador llama secuencialmente a ProfileService, PolicyRAG y AutoConfirm.

---

## Ejercicio 32 · "Predice la salida" (P)

Dado este clasificador (igual que template 10):

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

¿Qué devuelve para cada evento?

**(a)** `{tier: "standard", connections_lost: 0, delivery_flexibility: "flexible", disruption_severity: "HIGH"}`

**(b)** `{tier: "premium", connections_lost: 0, delivery_flexibility: "fixed", disruption_severity: "LOW"}`

**(c)** `{tier: "standard", connections_lost: 0, delivery_flexibility: "fixed", disruption_severity: "CRITICAL"}`

---

## Ejercicio 33 · Fan-out (A)

**(a)** ¿Por qué los sub-agentes del `agent.fanout` son **stateless**?

**(b)** ¿Dónde persiste el estado de un rebooking en template 10?

**(c)** ¿Qué combinación garantiza exactly-once (sin doble rebook)?

---

## Ejercicio 34 · "Encuentra el bug" (B)

```python
class FanOut:
    def __init__(self):
        self.processed = []

    def process(self, shipment_id, event):
        if shipment_id in self.processed:
            return "duplicate"
        result = sub_agent(event)
        return result  # Bug: falta algo para idempotencia

    def run(self, events):
        results = []
        for e in events:
            results.append(self.process(e["shipment_id"], e))
        return results
```

**(a)** ¿Qué falta para que un reintento de Kafka no ejecute `sub_agent` dos veces?

**(b)** Escribe la línea que corregiría el bug.

---

## Ejercicio 35 · LangGraph (A) — Aristas condicionales

```python
builder.add_conditional_edges(
    "alternatives",
    lambda s: "llm" if s["track"] == "complex" else "auto",
    {"auto": "autoconfirm", "llm": "llm_specialist"},
)
```

**(a)** Si `track="simple"`, ¿qué nodo se ejecuta después de `alternatives`?

**(b)** Si el dict de routing usara `"autoconfirm"` en vez de `"auto"`, ¿qué pasaría?

**(c)** ¿Qué equivalente hay en el scratch del lab M7?

---

## Ejercicio 36 · CrewAI (A)

**(a)** ¿Qué diferencia hay entre `Agent` y `Task` en CrewAI?

**(b)** ¿Para qué sirve `context=[task_anterior]` en una Task?

**(c)** ¿Por qué el lab usa `Process.sequential` y no `hierarchical` para rebooking por envío?

---

## Ejercicio 37 · "Elige la tecnología" (E)

Brief: worker Kafka que rebook 10 000 envíos/hora con audit trail regulatorio, 60% casos simples auto-confirm.

| Opción | Framework |
|--------|-----------|
| A | AutoGen conversacional |
| B | CrewAI hierarchical |
| C | LangGraph fan-out + logic.rules |
| D | Un solo agent.react con 4 tools |

Elige una opción y justifica descartando las otras tres.

---

## Ejercicio 38 · AutoGen vs LangGraph (A)

**(a)** ¿Por qué AutoGen es mejor para prototipos de coding agents?

**(b)** ¿Por qué LangGraph es mejor para rebooking transaccional regulado?

**(c)** Nombra un mecanismo de LangGraph que AutoGen no ofrece nativamente con igual claridad.

---

## Ejercicio 39 · "Predice la salida" (P) — Métricas

Un fan-out procesa 100 envíos: 74 auto-confirm, 26 LLM.

**(a)** ¿Cuál es la tasa de auto-confirm?

**(b)** Si cada llamada LLM cuesta $0.05 y auto-confirm $0, ¿cuál es el costo LLM total?

**(c)** Si invocaras LLM en los 100, ¿cuánto costaría? ¿Ahorro vs selectivo?

---

## Ejercicio 40 · BeeAI / Semantic Kernel (D)

**(a)** ¿En qué stack enterprise tiene más sentido BeeAI?

**(b)** ¿Qué concepto de Semantic Kernel equivale aproximadamente a `@tool` de LangChain?

---

## Ejercicio 41 · Diseño (D) — Supervisor scratch

Dibuja (ASCII) la secuencia de agentes en `SupervisorOrchestrator.process_event` del lab:
desde `PriorityRulesAgent` hasta `AutoConfirmAgent` o `FakeLLMAgent`.

Indica en qué paso se bifurca simple vs complex.

---

## Ejercicio 42 · "Encuentra el bug" (B) — Conditional edge

```python
def route(state):
    if state["track"] == "complex":
        return "llm_specialist"
    return "autoconfirm"

builder.add_conditional_edges("alternatives", route,
    {"llm": "llm_specialist", "autoconfirm": "autoconfirm"})
```

¿Por qué el grafo falla cuando `track="complex"`? Escribe la corrección.

---

## Ejercicio 43 · Checkpoints (A)

**(a)** En M6, `thread_id` identifica una sesión conversacional. En M7 fan-out, ¿qué debería ser `thread_id`?

**(b)** ¿Qué pasa si dos envíos distintos comparten el mismo `thread_id`?

---

## Ejercicio 44 · Integración RAGorbit (A)

Abre `examples/10-logistics-disruption-rebooking/flow.json`.

**(a)** ¿Cuántos nodos `tool.service` hay y cómo se llaman?

**(b)** ¿Qué nodo clasifica P1/P2/P3 sin LLM?

**(c)** ¿Cuál es el valor de `concurrency` en `agent.fanout`?

---

## Ejercicio 45 · Trade-offs (E)

Completa la tabla para el lab M7 (auto-confirm vs LLM):

| Criterio | Auto-confirm | LLM |
|----------|--------------|-----|
| Latencia típica P2 | ? | ? |
| Costo tokens | ? | ? |
| Caso SHP-00189 (premium multi-leg) | ? | ? |

---

## Ejercicio 46 · Combinación de frameworks (D)

¿Es razonable usar CrewAI para generar reportes offline y LangGraph para el worker Kafka del mismo producto? Argumenta a favor y en contra.

---

## Ejercicio 47 · Diseño end-to-end (D)

Brief nuevo: marketplace con 50 000 devoluciones/día post-Black Friday. Cada devolución: consultar pedido, política, calcular reembolso, confirmar o escalar.

Diseña:
**(a)** ¿Fan-out o agente único? ¿Por qué?
**(b)** Lista de agentes/nodos especializados.
**(c)** ¿Qué porcentaje estimarías auto-confirm vs LLM?
**(d)** Framework elegido y alternativa descartada.

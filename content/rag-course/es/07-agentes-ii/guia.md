# Módulo 7 · Agentes II — Multi-agente y Frameworks (`agent`, `tool`)

> **Prerequisito:** M6 (agente ReAct, tool calling, LangGraph básico).
>
> **Nodos RAGorbit:** `agent.fanout`, `agent.react`, `tool.service`, `tool.retriever`
>
> **Template ancla:** `10-logistics-disruption-rebooking` (fan-out event-driven)

---

## Índice

1. [¿Cuándo multi-agente vs un solo agente?](#1-cuándo-multi-agente-vs-un-solo-agente)
2. [Patrones multi-agente](#2-patrones-multi-agente)
3. [Orquestación y fan-out stateless](#3-orquestación-y-fan-out-stateless)
4. [LangGraph multi-agente (supervisor, conditional edges, checkpoints)](#4-langgraph-multi-agente)
5. [CrewAI (agents, tasks, crews, tools)](#5-crewai)
6. [AutoGen / AG2 (conversación entre agentes)](#6-autogen--ag2)
7. [BeeAI y Semantic Kernel (visión rápida)](#7-beeai-y-semantic-kernel)
8. [Selección y combinación de frameworks](#8-selección-y-combinación-de-frameworks)
9. [La capa ③ explicada: frameworks multi-agente desde cero](#9-la-capa--explicada-frameworks-multi-agente-desde-cero)
10. [Nodos RAGorbit de este módulo](#10-nodos-ragorbit-de-este-módulo)
11. [Template 10 · Logística](#11-template-10--logística)
12. [Checkpoint](#12-checkpoint--lo-sabes-si-puedes)

---

## 1. ¿Cuándo multi-agente vs un solo agente?

### 1.1 El límite del agente único

En M6 construiste un **agente ReAct** con varias tools. Eso basta cuando:

- Una sola entidad conversacional atiende al usuario.
- Las tools comparten el mismo contexto de sesión.
- El flujo es secuencial (aunque dinámico) sobre **un** objetivo.

Un **sistema multi-agente** añade valor cuando:

| Señal | Por qué un solo agente falla | Ejemplo (template 10) |
|-------|------------------------------|------------------------|
| **Paralelización masiva** | 3 000 envíos no caben en un bucle secuencial | Fan-out con `concurrency=16` |
| **Especialización por dominio** | Un LLM con 15 tools confunde descripciones | ProfileAgent vs PolicyAgent vs AlternativesAgent |
| **Políticas de routing distintas** | Casos simples no deben pagar tokens de casos complejos | `logic.rules` → auto-confirm vs LLM |
| **Agentes stateless** | El estado vive en Kafka/BD, no en memoria del sub-agente | Re-procesar tras crash sin perder contexto |
| **Supervisión explícita** | Necesitas auditar *quién* decidió *qué* | Supervisor + audit trail |

### 1.2 Regla de oro

```
¿Un solo LLM con N tools resuelve el 80% en < 10 pasos?
  SÍ → agent.react (M6)
  NO → evalúa multi-agente

¿Necesitas procesar > 100 items idénticos en paralelo?
  SÍ → agent.fanout (M7)

¿Necesitas roles cognitivos distintos (investigador vs revisor)?
  SÍ → CrewAI o LangGraph multi-nodo

¿El flujo emerge de una conversación libre entre agentes?
  SÍ → AutoGen (prototipo); LangGraph (producción)
```

### 1.3 Cuándo NO usar multi-agente

- **Overhead innecesario:** 2 tools y un usuario → ReAct basta.
- **Auditoría crítica sin grafo explícito:** AutoGen conversacional es difícil de trazar.
- **Latencia estricta:** cada salto entre agentes suma una llamada LLM.
- **Costo:** N agentes × M pasos × tokens = explosión si no segmentas antes (ver `logic.rules` en template 10).

---

## 2. Patrones multi-agente

### 2.1 Supervisor (orquestador central)

Un agente **supervisor** recibe la tarea, decide qué especialista invocar y consolida el resultado.

```
                    ┌──────────────┐
  Entrada ─────────▶│  SUPERVISOR  │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Agente A   │  │ Agente B   │  │ Agente C   │
    │ (perfil)   │  │ (política) │  │ (routing)  │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┴───────────────┘
                           ▼
                    Respuesta consolidada
```

**Cuándo usar:** flujos transaccionales con pasos conocidos pero ramificaciones (rebooking, investigación legal).

**En RAGorbit:** `agent.fanout` actúa como supervisor del sub-agente por envío; internamente el sub-agente sigue un mini-grafo.

### 2.2 Jerárquico

El supervisor delega a **sub-supervisores** que a su vez coordinan especialistas.

```
CEO Agent
  ├── Research Manager → Web Agent, Doc Agent
  └── Writing Manager  → Drafter, Editor
```

**Cuándo usar:** equipos grandes (> 5 roles), informes multi-sección.

**Framework:** CrewAI `Process.hierarchical` con `manager_llm`.

### 2.3 Colaborativo (peer-to-peer)

Los agentes conversan entre sí sin supervisor fijo; el flujo **emerge** del diálogo.

```
Agente A ◄────────────────► Agente B
   │                           │
   └──────────► Agente C ◄─────┘
```

**Cuándo usar:** brainstorming, coding agents, exploración.

**Framework:** AutoGen/AG2. **Riesgo:** difícil de auditar; pocos guardrails nativos.

### 2.4 Fan-out stateless

El mismo sub-agente se instancia **N veces** en paralelo, una por item. Sin memoria compartida entre instancias.

```
Kafka Event Batch (3000 envíos)
        │
        ▼
  ┌─────────────────────────────────┐
  │  agent.fanout (concurrency=16)  │
  │  ┌─────┐ ┌─────┐ ┌─────┐       │
  │  │Sub 1│ │Sub 2│ │Sub N│ ...   │
  │  └──┬──┘ └──┬──┘ └──┬──┘       │
  └─────┼───────┼───────┼───────────┘
        ▼       ▼       ▼
     notify  notify  notify
     audit   audit   audit
```

**Cuándo usar:** procesamiento masivo event-driven (logística, fraude, alertas).

**Estado:** en event log + BD, no en heap del agente. Reentrega Kafka + idempotencia en BD = exactly-once.

### 2.5 Tabla comparativa de patrones

| Patrón | Control | Paralelismo | Auditoría | Caso RAGorbit |
|--------|---------|-------------|-----------|---------------|
| Supervisor | Alto | Medio | Alta | Sub-agente rebooking |
| Jerárquico | Alto | Medio | Media-alta | Informes multi-sección |
| Colaborativo | Bajo | Bajo | Baja | Prototipos AutoGen |
| Fan-out stateless | Alto (por item) | **Máximo** | Alta (por shipment_id) | Template 10 |

---

## 3. Orquestación y fan-out stateless

### 3.1 Pipeline del template 10

```
io.event-source ──▶ logic.rules ──▶ logic.router ──▶ agent.fanout
                              │                          │
                              │                    tool.service × 3
                              │                    tool.retriever
                              ▼                          ▼
                         P1/P2/P3                  io.notify
                         simple/complex             observability.audit
```

### 3.2 Segmentación antes del LLM (control de costo)

`logic.rules` clasifica **sin LLM**:

- **P1 / complex:** premium, `connections_lost > 0`, `CRITICAL`.
- **P2 / simple:** `delivery_flexibility == flexible`.
- **P3 / simple:** resto.

Solo el track `complex` invoca el LLM del sub-agente. En una disrupción típica por clima, **~70%** se auto-confirman — ahorro 10–20× en tokens.

### 3.3 Fan-out en código (concepto)

```python
# Generado por RAGorbit codegen (simplificado)
async def fanout(events, concurrency=16):
    sem = asyncio.Semaphore(concurrency)
    async def process_one(event):
        async with sem:
            return await sub_agent.invoke(event)
    return await asyncio.gather(*[process_one(e) for e in events])
```

En el taller scratch, `SupervisorOrchestrator.fan_out` simula esto secuencialmente pero respeta el concepto de lotes.

### 3.4 Idempotencia + exactly-once

- Kafka `exactlyOnce: true` → offset y audit atómicos.
- BD con clave `shipment_id` → segundo procesamiento devuelve cache.
- En scratch: `self._processed: set[str]`.

---

## 4. LangGraph multi-agente

### 4.1 De ReAct a grafo multi-nodo (repaso M6 → M7)

M6: grafo `agent ↔ tools` (un agente).

M7: grafo con **varios nodos-agente** + **supervisor** + **aristas condicionales**:

```
ENTRY → supervisor → profile → policy → alternatives
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                        autoconfirm                    llm_specialist
                              │                               │
                             END                             END
```

### 4.2 Conditional edges

Función router devuelve el **nombre del siguiente nodo**:

```python
def route_after_alternatives(state) -> str:
    if state["track"] == "complex":
        return "llm"
    return "autoconfirm"

builder.add_conditional_edges(
    "alternatives",
    route_after_alternatives,
    {"autoconfirm": "autoconfirm", "llm": "llm_specialist"},
)
```

Equivalente scratch: `if track == "simple": autoconfirm else: llm_agent.analyze(...)`.

### 4.3 Checkpoints en fan-out

- **Conversacional (M6):** `thread_id` = sesión de usuario.
- **Fan-out (M7):** `thread_id` = `shipment_id` (un checkpoint por envío).

```python
config = {"configurable": {"thread_id": event["shipment_id"]}}
graph.invoke(initial_state, config=config)
```

Si el worker cae, re-invoca con el mismo `shipment_id` y el checkpointer restaura el progreso parcial.

### 4.4 Subgrafos

Un nodo puede ser **otro grafo compilado** — útil para encapsular el sub-agente del fan-out:

```python
sub_rebook_graph = build_rebook_subgraph()
builder.add_node("rebook", sub_rebook_graph)
```

---

## 5. CrewAI

### 5.1 Modelo mental

```
Crew = Agents + Tasks + Process
```

| Concepto | Qué es | Analogía |
|----------|--------|----------|
| `Agent` | Rol con `goal`, `backstory`, tools opcionales | Empleado especializado |
| `Task` | Trabajo concreto + `expected_output` | Ticket de Jira |
| `Crew` | Equipo que ejecuta tasks | Sprint |
| `Process` | Orden de ejecución | Kanban / jerarquía |

### 5.2 Process.sequential vs hierarchical

```python
# Secuencial: task B recibe contexto de task A
Crew(..., process=Process.sequential)

# Jerárquico: un manager delega tasks a agentes
Crew(..., process=Process.hierarchical, manager_llm=llm)
```

Para rebooking por envío: **sequential** (clasificar → investigar → ejecutar).

Para fan-out masivo: **loop externo** `for event in events: crew.kickoff(...)`.

### 5.3 Cuándo usar CrewAI

**Sí:** prototipos multi-rol, informes (investigador + redactor + revisor), equipos con personas fijas.

**No:** fan-out masivo con auditoría estricta (LangGraph + Kafka es mejor), flujos con guardrails financieros finos.

### 5.4 Gotchas

1. **Tasks vagas → outputs vagos.** `expected_output` debe ser específico.
2. **Tools duplicadas** en varios agentes → confusión; centraliza en un agente investigador.
3. **Costo:** 3 agentes × 3 tasks = hasta 9 llamadas LLM por envío si no segmentas antes.

---

## 6. AutoGen / AG2

### 6.1 Conversación entre agentes

AutoGen modela agentes que **se envían mensajes** mutuamente hasta converger:

```python
user_proxy = UserProxyAgent(name="user")
assistant = AssistantAgent(name="assistant", llm_config=...)
user_proxy.initiate_chat(assistant, message="Diseña el rebook para SHP-001")
```

El flujo **no está en un grafo** — emerge del diálogo.

### 6.2 Cuándo usar

- Coding agents (generar + ejecutar + corregir código).
- Exploración de diseño con varios "expertos" simulados.
- Prototipos rápidos sin compliance estricto.

### 6.3 Cuándo NO usar

- Servicios transaccionales (pagos, rebooking regulado).
- Cuando necesitas **exactly-once** o audit trail por paso.
- Producción sin refactor a LangGraph.

### 6.4 AG2 (evolución de AutoGen)

AG2 añade mejor tipado, grupos de agentes y terminación explícita. El modelo mental sigue siendo conversacional.

---

## 7. BeeAI y Semantic Kernel

### 7.1 BeeAI (IBM)

Framework modular orientado a **enterprise IBM/watsonx**:
- Agentes con gobernanza y políticas integradas.
- Integración con watsonx.ai y Granite.
- Útil si tu stack ya es IBM; curva media.

### 7.2 Semantic Kernel (Microsoft)

**Plugins + Planners** sobre .NET/Azure:
- Funciones tipadas como plugins.
- Planners automáticos que encadenan plugins.
- Ideal en ecosistema Azure/OpenAI; menos común en Python puro.

### 7.3 Comparativa rápida (ver también [tecnologias-comparadas.md §9](../referencia/tecnologias-comparadas.md#9-frameworks-de-agentes-y-multi-agente))

| Framework | Control | Fan-out | Enterprise |
|-----------|---------|---------|------------|
| LangGraph | ★★★★★ | ★★★★★ | Producción |
| CrewAI | ★★★☆☆ | ★★☆☆☆ | Prototipos |
| AutoGen/AG2 | ★★☆☆☆ | ★★☆☆☆ | Exploración |
| BeeAI | ★★★☆☆ | ★★★☆☆ | IBM stack |
| Semantic Kernel | ★★★★☆ | ★★★☆☆ | Azure/.NET |

---

## 8. Selección y combinación de frameworks

### 8.1 Árbol de decisión

```
¿Procesamiento masivo event-driven?
  └─ SÍ → LangGraph + Kafka fan-out (template 10)

¿Roles fijos tipo "equipo editorial"?
  └─ SÍ → CrewAI sequential/hierarchical

¿Exploración / coding / diálogo libre?
  └─ SÍ → AutoGen (prototipo) → migrar a LangGraph

¿Stack IBM watsonx?
  └─ SÍ → BeeAI

¿Stack Azure/.NET?
  └─ SÍ → Semantic Kernel
```

### 8.2 Combinar frameworks (patrón híbrido)

Es válido y común:
- **CrewAI** para generar borradores de informes offline.
- **LangGraph** para el worker transaccional en producción.
- **AutoGen** en sandbox de desarrollo.

Lo que **no** recomendamos: dos frameworks orquestando el **mismo** flujo en producción — duplica observabilidad y puntos de fallo.

### 8.3 RAGorbit como capa unificadora

El `flow.json` abstrae el framework:
- `agent.react` → LangGraph ReAct (codegen).
- `agent.fanout` → asyncio + subgrafo LangGraph.
- Tools → `@tool` / `tool.service` independiente del framework de orquestación.

---

## 9. La capa ③ explicada: frameworks multi-agente desde cero

> **Prerrequisito:** haber implementado `lab/solucion_scratch.py` o entender cada agente que escribiste a mano. **Lee esta sección completa** antes de `lab/solucion_framework.py`.
>
> **Entorno:** sin pip/red en el curso. El objetivo es que, con `pip install crewai langgraph langchain langchain-anthropic`, puedas **escribir** la solución framework tú mismo.

### 9.1 Recordatorio y cross-links

| Módulo | Qué aprendiste | Enlace |
|--------|----------------|--------|
| M1 §11 | LangChain base: `ChatAnthropic`, mensajes, `invoke` | [M1 §11](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero) |
| M6 §8 | `@tool`, `create_react_agent`, `StateGraph`, `MemorySaver` | [M6 §8](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) |
| **M7** | Multi-agente: supervisor, fan-out, CrewAI, conditional edges | Esta sección |

**Lo nuevo de M7:** no es una sola tool ni un solo bucle ReAct — es **orquestar varios agentes** que pasan estado y bifurcan con aristas condicionales.

### 9.2 Tabla puente: scratch → CrewAI / LangGraph

| Lo que hiciste a mano (capa ②) | CrewAI (capa ③) | LangGraph (capa ③) |
|--------------------------------|-----------------|---------------------|
| `PriorityRulesAgent.classify()` | `Task` del Agent clasificador | Nodo `supervisor` |
| `ProfileAgent`, `PolicyAgent`, … | `Agent` investigador + `@tool` | Nodos `profile`, `policy`, `alternatives` |
| `if track == "simple": autoconfirm else: llm` | `Task` del ejecutor con instrucciones | `add_conditional_edges` tras `alternatives` |
| `SupervisorOrchestrator.fan_out()` | `for event: crew.kickoff(...)` | `for event: graph.invoke(...)` |
| `FakeLLMAgent.analyze()` | Agent ejecutor con LLM real | Nodo `llm_specialist` |
| `self._processed` (idempotencia) | Cache externa / flag en task output | `checkpointer` + `thread_id=shipment_id` |
| Traza `[profile_agent]`, `[llm_agent]` | `verbose=True` en Crew | Stream de nodos / LangSmith |

### 9.3 CrewAI desde cero — APIs que usa `solucion_framework.py`

#### Agent

```python
from crewai import Agent

researcher = Agent(
    role="Investigador de rebook",           # título del rol
    goal="Recopilar perfil, política y alternativas",
    backstory="Conoce PolicyRAG y servicios de routing.",
    tools=[get_shipment_profile, get_alternatives],  # LangChain @tool
    llm=llm,
    verbose=True,
)
```

- `role` + `goal` + `backstory` ≈ system prompt especializado del scratch.
- `tools`: las mismas `@tool` de M6.

#### Task

```python
from crewai import Task

research_task = Task(
    description="Para el envío en {event_json}, llama las tools necesarias.",
    expected_output="JSON con perfil, política y alternativas",
    agent=researcher,
    context=[classify_task],   # recibe output de tasks anteriores
)
```

- `context` encadena tasks como `memory.append` en scratch.
- `expected_output` guía la evaluación interna del agente.

#### Crew y Process

```python
from crewai import Crew, Process

crew = Crew(
    agents=[classifier, researcher, executor],
    tasks=[classify_task, research_task, execute_task],
    process=Process.sequential,
)
result = crew.kickoff(inputs={"event_json": json.dumps(event)})
```

- `Process.sequential` = pipeline fijo A → B → C (como tu `process_event`).
- `Process.hierarchical` = manager LLM delega (patrón jerárquico §2.2).

### 9.4 LangGraph multi-agente desde cero

#### Estado compartido

```python
class RebookState(TypedDict):
    messages: Annotated[list, add_messages]
    event: dict
    track: str
    profile: dict
    alternatives: list
    handler: str
```

Todos los nodos leen/escriben campos de `RebookState` — equivalente al dict que pasabas entre agentes en scratch.

#### Nodos especialistas

```python
def node_profile_agent(state: RebookState) -> RebookState:
    profile = get_shipment_profile.invoke({"shipment_id": state["event"]["shipment_id"]})
    return {"profile": profile, "messages": [AIMessage(content=f"Profile: {profile['tier']}")]}

builder.add_node("profile", node_profile_agent)
```

Cada nodo = una clase-agente del scratch.

#### Supervisor + conditional edges

```python
def route_after_alternatives(state) -> Literal["autoconfirm", "llm"]:
    return "llm" if state["track"] == "complex" else "autoconfirm"

builder.add_conditional_edges("alternatives", route_after_alternatives,
    {"autoconfirm": "autoconfirm", "llm": "llm_specialist"})
```

Esto **es** el `if track == "simple"` de `SupervisorOrchestrator.process_event`.

#### Compilar y ejecutar

```python
graph = builder.compile()
final = graph.invoke({"event": event, "messages": [], ...})
```

### 9.5 Recorrido bloque a bloque de `solucion_framework.py`

#### Bloque 1 — Datos y `@tool` compartidas (líneas 1–75)

Idéntico al scratch. Las tools son la interfaz común entre CrewAI y LangGraph.

#### Bloque 2 — CrewAI (líneas 78–145)

| Fragmento | Equivalente scratch |
|-----------|---------------------|
| `Agent` clasificador | `PriorityRulesAgent` |
| `Agent` investigador + tools | `ProfileAgent` + `PolicyAgent` + `AlternativesAgent` |
| `Agent` ejecutor | `AutoConfirmAgent` + `FakeLLMAgent` |
| `Task` con `context=[...]` | Orden de llamadas en `process_event` |
| `crew.kickoff(inputs={...})` | `orchestrator.process_event(event)` |
| Loop `for event in events` | `fan_out()` |

#### Bloque 3 — LangGraph multi-agente (líneas 148–280)

| Fragmento | Equivalente scratch |
|-----------|---------------------|
| `RebookState` | Campos locales de `process_event` |
| `node_supervisor` | `PriorityRulesAgent.classify` |
| `node_profile_agent` … `node_alternatives_agent` | Agentes especialistas |
| `route_after_alternatives` | Branch auto-confirm vs LLM |
| `node_llm_specialist` | `FakeLLMAgent` (con LLM real) |
| `build_langgraph_multi_agent` | `SupervisorOrchestrator` |

#### Bloque 4 — Demo comparativa (líneas 283–end)

Ejecuta ambos frameworks sobre los mismos 6 eventos e imprime tabla CrewAI vs LangGraph.

### 9.6 Cuándo usar cada framework y gotchas

| Situación | Usa | Por qué |
|-----------|-----|---------|
| Fan-out 3000 envíos + Kafka + audit | LangGraph | Grafos explícitos, checkpoints, LangSmith |
| Prototipo "equipo" investigador+ejecutor | CrewAI | Menos boilerplate, roles declarativos |
| Explorar diálogo libre entre agentes | AutoGen | Emergente; migrar a LangGraph después |
| IBM watsonx enterprise | BeeAI | Gobernanza nativa |
| Mismo problema, comparar en el lab | **Ambos** CrewAI + LangGraph | Ver trade-offs en la práctica |

**Gotchas:**

1. **CrewAI sin segmentación previa** → 3 agentes LLM por envío simple = costo innecesario. Replica `logic.rules` antes del crew.
2. **LangGraph sin `thread_id` por envío** → mezclas estado entre shipments en fan-out.
3. **Conditional edge mal nombrada** → el grafo termina sin ejecutar `autoconfirm`. Los nombres del dict deben coincidir exactamente.
4. **AutoGen en producción transaccional** → conversación impredecible; difícil cumplir exactly-once.
5. **Duplicar lógica** entre CrewAI y LangGraph → extrae tools compartidas (`SHARED_TOOLS` en el lab).

### 9.7 Checklist antes de escribir `solucion_framework.py`

- [ ] ¿Tools compartidas con docstrings que indican **cuándo** usarlas?
- [ ] ¿CrewAI: 3 agents + 3 tasks + `Process.sequential`?
- [ ] ¿LangGraph: nodo por especialista + conditional edge tras `alternatives`?
- [ ] ¿`RebookState` incluye `track` para el router?
- [ ] ¿Loop externo por evento para simular fan-out?
- [ ] ¿Tabla de trade-offs CrewAI vs LangGraph al final?

**Siguiente paso:** [lab/enunciado.md](lab/enunciado.md) Parte B — escribe el archivo antes de mirar la solución.

---

> **Más allá de Lang\*:** además de LangGraph y CrewAI, el caso de rebooking/cambio de vuelo está en **AutoGen/AG2**, **Pydantic-AI** y un **loop multi-agente nativo (sin framework)** en [`../referencia/agentes-sin-langchain.md`](../referencia/agentes-sin-langchain.md). Y revisa las [críticas al stack LangChain/LangGraph/LangSmith](../referencia/tecnologias-comparadas.md#críticas-al-stack-langchain--langgraph--langsmith-y-cuándo-no-usarlo) para decidir multi-agente vs un solo agente vs SDK nativo.

---

## 10. Nodos RAGorbit de este módulo

### `agent.fanout`

```
Puertos:
  → Event (desde io.event-source / logic.router)
  → Tool (n) — herramientas del sub-agente
  ← Any — hacia notify, audit, metrics

Config:
  concurrency: 16
  subAgentSystem: "instrucciones del sub-agente stateless"
```

### `agent.react` (en sub-agentes conversacionales)

Sigue siendo el nodo para **un** usuario; en template 10 el sub-agente del fan-out lo usa internamente para casos `complex`.

### `tool.service` + `tool.retriever`

Template 10 usa:
- `ShipmentProfileService`, `AlternativesService`, `AutoConfirmService`
- `policy_rag` (`tool.retriever` sobre `store.pgvector`)

Ver [catalogo-nodos.md §9–10](../referencia/catalogo-nodos.md).

---

## 11. Template 10 · Logística

El template más completo de **fan-out multi-agente** en RAGorbit.

**Flujo resumido:**
1. Kafka `shipment.disruption` → `logic.rules` (P1/P2/P3).
2. `logic.router` → `agent.fanout` (simple y complex al mismo nodo).
3. Sub-agente por envío: tools + LLM selectivo.
4. `io.notify` + `observability.audit` + métricas OTLP.

**Métricas clave en crisis:**
- `rebooking_autoconfirm_total / rebooking_processed_total` → eficiencia.
- `rebooking_duration_seconds` por prioridad → latencia P95.

Documentación completa: [`examples/10-logistics-disruption-rebooking/README.md`](../../examples/10-logistics-disruption-rebooking/README.md) y [`flow.json`](../../examples/10-logistics-disruption-rebooking/flow.json).

---

## 12. Checkpoint — Lo sabes si puedes…

- [ ] Explicar cuándo un solo `agent.react` basta y cuándo necesitas multi-agente.
- [ ] Dibujar los 4 patrones (supervisor, jerárquico, colaborativo, fan-out).
- [ ] Describir por qué `logic.rules` va **antes** del LLM en template 10.
- [ ] Construir un `StateGraph` con supervisor y `add_conditional_edges`.
- [ ] Explicar `Agent` / `Task` / `Crew` / `Process` en CrewAI.
- [ ] Comparar AutoGen vs LangGraph para auditoría en producción.
- [ ] Mapear cada clase del scratch a su nodo CrewAI y LangGraph (tabla §9.2).
- [ ] Leer el `flow.json` del template 10 e identificar fan-out, rules y tools.
- [ ] Resolver el lab: 6 envíos, 3 auto-confirm, 3 LLM, idempotencia.
- [ ] Justificar elección de framework para un brief nuevo (árbol §8.1).

**Si no puedes:** repasa §2 (patrones), §9 (frameworks desde cero) y el [lab/enunciado.md](lab/enunciado.md).

# Module 6 · Agents I — Fundamentals (`agent`, `tool`)

> **Prerequisite:** complete M1–M5. Familiarity with LLMs, prompting, RAG, and conditional logic is assumed.
>
> **RAGorbit nodes:** `agent.react`, `agent.fanout`, `tool.service`, `tool.retriever`, `tool.function`, `tool.http`, `tool.mcp`
>
> **Anchor templates:** `01-airline-flight-change` (transactional agent), `06-retail-postsale-bot` (service agent), `07-telecom-callcenter-copilot` (agentic RAG + feedback)

---

## 1. From RAG to Agent — when do you need one?

### 1.1 The limit of deterministic pipelines

A standard RAG pipeline follows a fixed path:

```
Entrada → [Retrieval] → [Generación] → Salida
```

It is perfect when:
- The number of steps is known and fixed.
- There is no need to decide *which* tool to call or *when*.
- Branching logic is simple and you can encode it yourself.

But it fails when the user query requires **multi-step reasoning with uncertainty about which steps to take**. Examples:

| Request | Why a fixed pipeline fails |
|-----------|--------------------------------|
| "Quiero cambiar mi vuelo del 15 al 17" | You do not know in advance which PNR they have, whether a penalty applies, which flights are available, or how much it will cost. |
| "¿Puedo devolver este pedido? ¿Y recibir un cambio en su lugar?" | Two distinct possible actions; depends on policy and the specific order. |
| "¿Qué hay en mi factura que no reconozco?" | Requires retrieving the invoice, identifying the item, searching the knowledge base — in dynamic order. |

### 1.2 Agent or rules?

**Use deterministic rules when:**
- The decision space is finite and you know it completely.
- Correctness is critical and the LLM might be wrong (exact financial calculations, security flags).
- Speed matters a lot (rules in microseconds vs. LLM in hundreds of ms).

**Use an agent when:**
- The number of steps is not fixed in advance.
- The LLM needs to *decide* what information to gather.
- The task has branches that depend on external data you do not have when designing the system.
- The user can ask follow-up questions that change the context.

**Golden rule:** if you can express it as a decision-node graph with all arcs defined at design time, use a pipeline. If you cannot, you need an agent.

In RAGorbit this materializes as:
- Deterministic pipeline → nodes `logic.router`, `logic.rules`, `logic.structured`.
- Agent → node `agent.react` with `tool.*`.

### 1.3 Quick comparison

```
                    Pipeline RAG         Agente ReAct
                    ─────────────        ────────────
Pasos               fijos               dinámicos
Herramientas        siempre las mismas  el LLM elige cuáles y cuándo
Estado inter-turno  ninguno             memoria explícita
Depuración          fácil (flujo fijo)  más difícil (traza de pasos)
Costo LLM           bajo (1–2 llamadas) mayor (N llamadas)
Riesgo              bajo                mayor (el LLM puede "alucinar" una acción)
Cuándo usarlo       Q&A, extracción     servicio al cliente, asistentes transaccionales
```

---

## 2. Tool Calling — the central mechanism

### 2.1 What it is

*Tool calling* (also called *function calling*) is an LLM's ability to emit, instead of free text, a structured instruction of the form:

```json
{
  "tool": "ReservationService",
  "arguments": { "pnr": "SCL-BOG-001" }
}
```

The framework intercepts that instruction, runs the real function, and returns the result to the LLM as if it were a new conversation turn. The LLM then reasons about the result and decides whether to call another tool or respond to the user.

### 2.2 Tool contract

Each tool is described to the LLM with:
1. **Name** — unique and unambiguous.
2. **Description** — in natural language, when and why to use it.
3. **Input schema** — JSON Schema of accepted arguments.
4. **Output schema** — (optional but good to document).

In RAGorbit, the `tool.service` node defines all of this:

```json
{
  "id": "reservation_tool",
  "type": "tool.service",
  "config": {
    "name": "ReservationService",
    "description": "Obtiene el itinerario completo de una reserva dado su PNR.",
    "baseUrl": "https://api.airline.internal/reservations",
    "operation": "getItinerary",
    "inputSchema": {
      "type": "object",
      "properties": { "pnr": { "type": "string" } },
      "required": ["pnr"]
    }
  }
}
```

The `description` is crucial: it determines whether the LLM will call this tool at the right moment.

### 2.3 Tool chaining

When the LLM calls tool A and uses its result to decide to call tool B, we have *chaining*. In template `01-airline-flight-change` the chaining is:

```
ReservationService (obtener PNR)
    ↓ resultado: fare_class = "ECONOMY_FLEX"
PolicyRAG (buscar penalidad para ECONOMY_FLEX)
    ↓ resultado: penalidad = USD 50
InventoryService (buscar vuelos SCL-BOG del día 17)
    ↓ resultado: flights = [FL-301, FL-305]
PricingService (calcular diferencial para PNR + FL-301)
    ↓ resultado: delta = USD 80
PaymentService (cobrar USD 130 = 50 + 80)
```

Each step uses the previous result. The LLM coordinates this chaining naturally — you do not need to hardcode the order (though in the agent's `system` prompt you do guide it for consistency).

### 2.4 Tool as RAG (tool.retriever)

A powerful variant: the vector retriever is exposed as a tool. The agent decides *when* and *with what query* to call RAG. This is **Agentic RAG** (section 6 of this guide).

In RAGorbit: `tool.retriever` wraps a `Retriever` from any `store.*` and exposes it as a `Tool` to the agent.

```
store.pgvector ──(Retriever)──▶ tool.retriever ──(Tool)──▶ agent.react
                                  name: "policy_rag"
                                  description: "Consulta reglas de tarifa..."
```

---

## 3. The ReAct Loop (Reason → Act → Observe)

### 3.1 Concept

ReAct (*Reasoning + Acting*) is the most widely used pattern in modern agents. It was introduced in the paper "ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al., 2022).

The idea: alternate between **reasoning** (the LLM thinks aloud about what to do) and **acting** (calling a tool), incorporating **observations** (results) as new context.

```
┌─────────────────────────────────────────────────────────────────┐
│                       BUCLE REACT                               │
│                                                                 │
│   Mensaje                                                       │
│   usuario  ──▶  [RAZONAR]  ──▶  [ACTUAR]  ──▶  [OBSERVAR]      │
│                    │                │               │           │
│                    │   "Necesito    │  tool_call()  │  result   │
│                    │   el PNR"      │               │           │
│                    │                └───────────────┘           │
│                    │                                            │
│                    └──── iteración ────────────────────────────▶│
│                                                                 │
│                    [si respuesta lista] ──▶ Respuesta final     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Diagram of a complete step

```
Paso 1: Razonar
  Contexto actual → LLM
  LLM emite: "Thought: Necesito el itinerario del pasajero.
              Action: ReservationService(pnr='SCL-BOG-001')"

Paso 2: Actuar
  Framework detecta Action → ejecuta ReservationService
  Resultado: { "flight": "LA501", "date": "2026-06-15",
               "fare_class": "ECONOMY_FLEX", "origin": "SCL",
               "destination": "BOG" }

Paso 3: Observar
  Framework agrega al contexto:
  "Observation: { flight: LA501, date: 2026-06-15, fare_class: ECONOMY_FLEX }"

  → vuelve al Paso 1 con contexto actualizado

Paso 4: Razonar (segunda iteración)
  LLM: "Thought: Ya tengo el itinerario. Ahora necesito la política
        de penalidad para ECONOMY_FLEX en ruta internacional."
  Action: policy_rag(query='penalidad cambio ECONOMY_FLEX internacional')

... (itera hasta tener toda la información) ...

Paso final:
  LLM: "Thought: Tengo todo. Puedo responder."
  No hay más Actions → emite respuesta final al usuario.
```

### 3.3 Example trace — Flight change

The user writes: *"Quiero cambiar mi vuelo SCL-BOG del 15 al 17 de junio."*

```
[TURNO 1 — USUARIO]
  "Quiero cambiar mi vuelo SCL-BOG del 15 al 17 de junio."

[PASO 1 · RAZONAR]
  Thought: Necesito obtener el itinerario del usuario para conocer
           el PNR, la tarifa y verificar si es posible el cambio.
  Action: ReservationService(pnr="SCL-BOG-001")

[PASO 1 · ACTUAR + OBSERVAR]
  → Tool: ReservationService
  ← { "pnr": "SCL-BOG-001", "flight": "LA501",
      "origin": "SCL", "destination": "BOG",
      "date": "2026-06-15", "fare_class": "ECONOMY_FLEX",
      "passenger": "Ana García" }

[PASO 2 · RAZONAR]
  Thought: Tengo el itinerario. Tarifa ECONOMY_FLEX, ruta internacional.
           Debo verificar la penalidad de cambio según la política.
  Action: policy_rag(query="penalidad cambio vuelo ECONOMY_FLEX internacional")

[PASO 2 · ACTUAR + OBSERVAR]
  → Tool: policy_rag (RAG sobre fare rules)
  ← [{ "text": "Tarifa ECONOMY_FLEX: cambio permitido con penalidad
        de USD 50 para rutas internacionales.",
       "source": "fare-rules-2026#§3.2" }]

[PASO 3 · RAZONAR]
  Thought: Penalidad: USD 50. Ahora necesito vuelos disponibles
           el 17 de junio en la ruta SCL-BOG.
  Action: InventoryService(origin="SCL", destination="BOG", date="2026-06-17")

[PASO 3 · ACTUAR + OBSERVAR]
  → Tool: InventoryService
  ← { "flights": [
        { "id": "FL301", "departure": "08:30", "price": 320.00 },
        { "id": "FL305", "departure": "14:45", "price": 295.00 }
      ]}

[PASO 4 · RAZONAR]
  Thought: Hay dos opciones. Presentaré la más económica primero.
           Debo calcular el diferencial de precio entre el vuelo
           actual (incluido en la reserva) y FL305.
  Action: PricingService(pnr="SCL-BOG-001", newFlightId="FL305")

[PASO 4 · ACTUAR + OBSERVAR]
  → Tool: PricingService
  ← { "pnr": "SCL-BOG-001", "newFlightId": "FL305",
      "delta": 80.00, "total": 130.00 }
         ↑ penalidad (50) + diferencial de precio (80)

[PASO 5 · RAZONAR]
  Thought: Tengo toda la información. Costo total: USD 130.
           Debo informar y pedir confirmación antes de cobrar.

[RESPUESTA FINAL — AL USUARIO]
  "Encontré tu reserva SCL-BOG para el 15 de junio (vuelo LA501,
   tarifa ECONOMY_FLEX).

   Para cambiar al **17 de junio** te recomiendo el vuelo FL305
   (salida 14:45), cuyo costo sería:
   - Penalidad de cambio: USD 50
   - Diferencial de tarifa: USD 80
   **Total: USD 130**

   ¿Confirmas el cambio?"
```

The agent **did not charge** until receiving confirmation. That control is not handled by the LLM but by `guardrail.confirm` on the `PaymentService` node.

### 3.4 In RAGorbit: `agent.react`

```json
{
  "type": "agent.react",
  "config": {
    "system": "Eres un asistente de cambio de vuelo...",
    "maxSteps": 10,
    "streaming": true
  }
}
```

- `maxSteps` limits the number of iterations (avoids infinite loops).
- The `system` prompt guides the preferred tool order but does not enforce it — the LLM can adapt.
- `Tool` ports (multiple) connect all available tools.

---

## 4. Memory

An agent without memory treats each turn as if it were the first. That is useful for stateless pipelines, but unacceptable in conversations where the user already said "my PNR is SCL-BOG-001" and should not repeat it.

### 4.1 Types of memory

```
┌──────────────────────────────────────────────────────────────────┐
│                    TIPOS DE MEMORIA                              │
│                                                                  │
│  Corto plazo (In-Context)                                        │
│  ─────────────────────────                                       │
│  • El historial de mensajes dentro de la ventana de contexto.   │
│  • Gratis: ya está en el prompt.                                 │
│  • Límite: la ventana de contexto del modelo (~200K tokens).     │
│  • Dura mientras dure la sesión.                                 │
│                                                                  │
│  Largo plazo (External)                                          │
│  ──────────────────────                                          │
│  • Vector store, base de datos, Redis, archivo.                  │
│  • Se recupera semánticamente ("¿qué reservas tiene este user?") │
│  • Persiste entre sesiones.                                      │
│  • Requiere decisión explícita de qué guardar.                  │
│                                                                  │
│  Estado del agente (Working Memory)                              │
│  ────────────────────────────────                                │
│  • Datos estructurados actualizados durante la sesión.           │
│  • Ej: { pnr: "SCL-BOG-001", delta: 130, confirmed: false }     │
│  • En LangGraph: el `state` del StateGraph.                      │
│  • En scratch: un diccionario que pasa por los pasos.            │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Conversational memory (short term in practice)

The simplest form: accumulate the list of messages (user/assistant/tool) and pass it in full on each LLM call.

```python
# Representación en Python simple
memory = [
    {"role": "system",    "content": "Eres asistente de vuelos..."},
    {"role": "user",      "content": "Quiero cambiar mi vuelo del 15 al 17"},
    {"role": "assistant", "content": "Voy a verificar tu reserva. [tool_call: ReservationService]"},
    {"role": "tool",      "name": "ReservationService",
                          "content": '{"pnr":"SCL-BOG-001","fare_class":"ECONOMY_FLEX"}'},
    # ... más pasos ...
    {"role": "assistant", "content": "El costo total es USD 130. ¿Confirmas?"},
    {"role": "user",      "content": "Sí, confirmo."},
]
# → el agente ahora RECUERDA todo el contexto previo
```

When the user says "sí, confirmo" on turn 2, the agent knows exactly what they are confirming because the full history is in the list.

### 4.3 Agent state (working memory)

For cases where the agent needs to *update* structured data during reasoning:

```python
state = {
    "pnr":       None,   # se llena tras ReservationService
    "fare_class": None,   # ídem
    "penalty":   None,   # se llena tras PolicyRAG
    "delta":     None,   # se llena tras PricingService
    "confirmed": False,  # cambia tras confirmación del usuario
    "new_flight": None,  # ídem
}
```

In LangGraph this is the `TypedDict` passed between nodes. In our scratch workshop agent, it is a simple dict.

### 4.4 Long-term memory

For conversations across sessions or with thousands of facts about the user:

```python
# Guardar:
vector_store.add("El usuario prefiere ventanilla y vuelos de mañana", metadata={"user_id": "U123"})

# Recuperar en el próximo turno:
recuerdos = vector_store.search("preferencias de asiento", filter={"user_id": "U123"})
# → ["prefiere ventanilla y vuelos de mañana"]
```

We do not implement this in this module (see M7 for LangGraph persistence).

---

## 5. Reflection and Reflexion — Agent self-improvement

### 5.1 Reflection (one L)

The agent evaluates its own response before delivering it. Sequence:

```
[Agente genera respuesta]
       ↓
[Mismo LLM u otro evalúa]
  "¿Respondí la pregunta? ¿Hay inconsistencias? ¿Me falta información?"
       ↓
[Si hay problemas] → el agente intenta de nuevo
[Si es correcta]   → entrega la respuesta
```

Example applied to flight change:

```
Respuesta tentativa: "El costo es USD 130."

Evaluación interna:
  - ¿Expliqué el desglose? NO → hay que mejorar.
  - ¿Pedí confirmación? NO → hay que agregar.

Respuesta mejorada:
  "Penalidad USD 50 + diferencial USD 80 = **Total USD 130**.
   ¿Confirmas el cambio?"
```

### 5.2 Reflexion (with X — the paper)

The Reflexion paper (Shinn et al., 2023) formalizes this with three components:

```
┌─────────────────────────────────────────────────────┐
│                  REFLEXION                          │
│                                                     │
│  1. Actor (agente ReAct normal)                     │
│     — genera trayectorias (intentos)                │
│                                                     │
│  2. Evaluador                                       │
│     — puntúa la trayectoria (¿logró la tarea?)      │
│                                                     │
│  3. Reflexión verbal                                │
│     — resume por qué falló → almacena en memoria   │
│     — el actor usa ese resumen en el siguiente intento│
└─────────────────────────────────────────────────────┘
```

The key point: **reflection is stored as text in the agent's memory**, not as model parameters. It is not fine-tuning; it is iterative in-context learning.

When to use Reflexion:
- Coding or problem-solving tasks where the result is verifiable.
- When the agent fails on several attempts and needs to learn from its errors in the same session.

When NOT to use Reflexion:
- Real-time conversations where the user expects a response (too much latency).
- When you have a reliable evaluator (if you cannot measure whether the response is good, reflection adds nothing).

---

## 6. Agentic RAG — The agent decides when and what to retrieve

### 6.1 Difference from traditional RAG

In standard RAG, retrieval always happens at the same place in the pipeline:

```
Entrada → [Siempre recuperar] → [Siempre generar] → Salida
```

In **Agentic RAG**, the retriever is one more tool:

```
Entrada → Agente ──decision──▶ ¿Recuperar ahora? ──sí──▶ [Retrieval] → contexto
                 ↓                                                        ↓
               ¿Qué query?                                             → LLM
               ¿Con qué filtros?
               ¿Necesito más contexto?
```

### 6.2 Advantages of Agentic RAG

1. **The agent decides the optimal retrieval moment.** If the user already gave all the information, nothing needs to be retrieved. If specific information is needed, it retrieves with a more precise query.

2. **The agent can perform multiple retrievals with different queries.** Example: first retrieve general policy, then retrieve special cases for the specific fare.

3. **The agent can enrich the query** using information already obtained from other tools.

In template 01:
```
ReservationService → { fare_class: "ECONOMY_FLEX" }
    ↓
policy_rag(query="penalidad ECONOMY_FLEX internacional")
    ↑ la query incluye datos del paso anterior
```

### 6.3 Query routing

The agent can decide *which index* to use:

```
"¿Cuál es la política de maletas?"   → tool: policy_rag
"¿Puedo cambiar mi vuelo?"           → tool: policy_rag + ReservationService
"¿Hay vuelos el viernes?"            → tool: InventoryService (no necesita RAG)
```

The `tool.retriever` node in RAGorbit lets you expose it with a clear name and description so the LLM makes this decision in an informed way.

For multiple knowledge bases:

```
tool.retriever "policy_rag"     → políticas de tarifa
tool.retriever "faq_rag"        → preguntas frecuentes
tool.retriever "procedures_rag" → procedimientos internos
```

The LLM chooses which to use according to each tool's description. This is the pattern of template 07 (telecom copilot).

### 6.4 `tool.retriever` in RAGorbit

```json
{
  "id": "policy_tool",
  "type": "tool.retriever",
  "config": {
    "name": "policy_rag",
    "description": "Consulta reglas de tarifa y penalidades de cambio. Úsala cuando necesites saber si aplica penalidad y cuánto es."
  }
}
```

- Input port: `Retriever` (from any `store.*`).
- Output port: `Tool` (connects to `agent.react`).

---

## 7. LangChain Built-in Agents

LangChain includes specialized agents for common use cases. Conceptually they are `agent.react` with predefined tools.

### 7.1 Data / analysis agent (CSV/DataFrame)

```python
# Requiere: pip install langchain langchain-experimental
from langchain_experimental.agents import create_pandas_dataframe_agent

agent = create_pandas_dataframe_agent(
    llm=llm,
    df=df,
    agent_type="openai-tools",
    verbose=True
)
# El agente puede responder: "¿Cuál es el total de ventas por categoría?"
# ejecutando código Python sobre el DataFrame
```

The agent generates and executes Python code internally. Use with care: generated code can have unwanted side effects.

### 7.2 SQL agent

```python
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase

db = SQLDatabase.from_uri("sqlite:///ventas.db")
agent = create_sql_agent(llm=llm, db=db, agent_type="openai-tools")
# "¿Qué clientes compraron más de $1000 en junio?" → genera y ejecuta SQL
```

### 7.3 Visualization agent

```python
from langchain_experimental.agents import create_pandas_dataframe_agent

agent = create_pandas_dataframe_agent(
    llm=llm, df=df, allow_dangerous_code=True
)
# "Crea una gráfica de barras de ventas por mes" →
# el agente genera código matplotlib/seaborn y lo ejecuta
```

### 7.4 When to use built-ins vs. your own agent

| Scenario | Use built-in | Use your own |
|-----------|-------------|---------------|
| Ad-hoc analysis on internal data | yes | — |
| Production with business logic | — | yes |
| Quick prototype | yes | — |
| Need fine control of system prompt | — | yes |
| Need financial guardrails | — | yes |

---

## 8. Layer ③ Explained: LangGraph from Scratch (From Your ReAct Loop to the Graph)

> **Prerequisite:** implement the workshop layer ② (`lab/solucion_scratch.py`) or understand each piece you wrote by hand. **Read this section in full** before attempting to write `lab/solucion_framework.py`.
>
> **Environment:** on the course study machine there is no `pip` or network. You will not be able to run this code here. The goal is that, when you have `pip install langgraph langchain langchain-anthropic` and an API key, you can **write** the framework solution yourself — not just read it.

### 8.1 Reminder: LangChain and chat models (M1 §11)

In M1 you already learned LangChain basics: `Document`, loaders, retrievers, `ChatPromptTemplate`, and **chat models** like `ChatAnthropic`. We do not repeat that here — link to [M1 §11 — Layer ③ Explained: LangChain from Scratch](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch).

For this module you only need to remember three pieces from M1:

| M1 piece | Purpose in M6 |
|----------|----------------------|
| `ChatAnthropic(model=..., temperature=..., api_key=...)` | The real LLM that **reasons** in the ReAct loop (replaces `fake_llm`) |
| Typed messages (`HumanMessage`, `AIMessage`, `ToolMessage`) | The history the agent reads and writes on each iteration |
| The `invoke(...)` operator | Standard way to run a LangChain/LangGraph component |

**What's new in M6** is not LangChain in general — it is **tools** (`@tool`) and **LangGraph** (the graph that implements the ReAct loop and memory between turns).

### 8.2 Bridge table: your scratch → LangGraph/LangChain

This table maps **each mechanism** from `lab/solucion_scratch.py` to its equivalent in `lab/solucion_framework.py`:

| What you did by hand (layer ②) | LangGraph/LangChain piece (layer ③) | Where in the lab |
|--------------------------------|-------------------------------------|-----------------|
| `TOOLS = {"consultar_reserva": fn, ...}` — manual registry | List `[consultar_reserva, consultar_politica]` of `@tool` functions | `TOOLS = [...]` |
| Python function docstring | **Description the LLM sees** (the `@tool` decorator extracts it) | `@tool` + docstring |
| Type hints `pnr: str` | **JSON Schema** of arguments the LLM must emit | `@tool` parameters |
| `fake_llm(memory)` — decides action or final response | `ChatAnthropic` + native tool calling protocol | `build_agent()` |
| `while step < MAX_STEPS:` — ReAct loop | `create_react_agent` (or `StateGraph` with `agent`↔`tools` nodes) | `agent.invoke(...)` |
| `memory.append({"role": "tool", ...})` | `ToolMessage` added automatically by the graph | Internal in LangGraph |
| `session.memory` — list that grows between turns | `MemorySaver` + `thread_id` in `config` | `config = {"configurable": {"thread_id": "..."}}` |
| `_find_in_memory(messages, "pnr")` — state in text | Full graph state persisted in the checkpointer | Same `thread_id` on Turn 2 |
| `react_loop(memory)` | `agent.invoke({"messages": [HumanMessage(...)]}, config)` | `main()` |

**Mental model:** in scratch you are the framework (loop, memory, tool execution). In LangGraph the framework **is** a state graph: nodes transform state, edges decide the next node, and the checkpointer saves everything between turns.

### 8.3 The `@tool` decorator — from Python function to LLM tool

In scratch you registered tools in a dictionary:

```python
TOOLS = {
    "consultar_reserva": consultar_reserva,
    "consultar_politica": consultar_politica,
}
```

In LangChain, the `@tool` decorator does three things automatically:

1. **Name** — takes the function name (`consultar_reserva`).
2. **Description** — takes the full **docstring** and passes it to the LLM as instruction on when to use the tool.
3. **Argument schema** — reads **type hints** (`pnr: str`) and generates a JSON Schema the LLM must respect when calling the tool.

```python
from langchain_core.tools import tool

@tool
def consultar_reserva(pnr: str) -> dict:
    """
    Obtiene el itinerario completo de una reserva dado su PNR.
    Úsala cuando el pasajero proporcione su número de reserva (PNR).

    Args:
        pnr: Número de reserva en formato XXX-XXX-NNN (ej: SCL-BOG-001)
    """
    reserva = RESERVAS.get(pnr)
    if not reserva:
        return {"error": f"No se encontró reserva con PNR {pnr!r}"}
    return reserva
```

**What the LLM sees** (simplified):

```json
{
  "name": "consultar_reserva",
  "description": "Obtiene el itinerario completo... Úsala cuando el pasajero proporcione su PNR.",
  "parameters": {
    "type": "object",
    "properties": {
      "pnr": {"type": "string", "description": "Número de reserva en formato XXX-XXX-NNN"}
    },
    "required": ["pnr"]
  }
}
```

**Invoking a decorated tool** (from code or from a graph node):

```python
result = consultar_reserva.invoke({"pnr": "SCL-BOG-001"})
# equivalente a: consultar_reserva(pnr="SCL-BOG-001")
```

**Gotcha:** if the docstring is vague ("consulta datos"), the LLM will call the tool at the wrong time or not call it. In §2.2 we saw that `description` is crucial — with `@tool`, the docstring **is** that description.

### 8.4 `ChatAnthropic` — the agent's LLM

Brief reminder (detail in M1 §11.9):

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0.1,                              # baja = más determinista
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)
```

In scratch, `fake_llm` inspected the history and returned `{"action": ...}` or `{"final": ...}`. With a real chat model, the LLM emits structured messages with `tool_calls` when it needs to act — LangGraph interprets those calls and executes the corresponding `@tool` functions.

### 8.5 `create_react_agent` — the prebuilt ReAct loop

`create_react_agent` from `langgraph.prebuilt` encapsulates the loop you implemented by hand in `react_loop`:

```
SCRATCH (tu while)                    create_react_agent (interno)
──────────────────                    ─────────────────────────────
fake_llm(memory)                      nodo "agent": llm.invoke(messages)
  → {"action": "consultar_reserva"}     → AIMessage con tool_calls
TOOLS[name](**args)                   nodo "tools": ejecuta cada @tool
  → resultado                         → ToolMessage por cada resultado
memory.append(tool_result)            add_messages acumula en state["messages"]
  → vuelve al while                   arista "tools" → "agent" (otra iteración)
  → {"final": "..."}                  sin tool_calls → END (respuesta final)
```

Minimal construction (as in `solucion_framework.py`):

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()

agent = create_react_agent(
    model=llm,
    tools=[consultar_reserva, consultar_politica],
    prompt="Eres un asistente de cambios de vuelo...",   # system prompt
    checkpointer=checkpointer,
)
```

**Run one turn:**

```python
from langchain_core.messages import HumanMessage

result = agent.invoke(
    {"messages": [HumanMessage(content="Quiero cambiar mi vuelo SCL-BOG-001...")]},
    config={"configurable": {"thread_id": "demo-001"}},
)
respuesta = result["messages"][-1].content   # último mensaje = respuesta del agente
```

Input and output state is a dictionary with key `"messages"`. Each `invoke` **appends** messages to that session's history (does not replace it).

### 8.6 `MemorySaver` and `thread_id` — memory between turns

In scratch, memory was `session.memory` — a list that persisted between `chat()` calls. In LangGraph, persistence is handled by a **checkpointer**:

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()   # en RAM; en producción: SqliteSaver, PostgresSaver...
```

The `thread_id` identifies the **conversation session**:

```python
config = {"configurable": {"thread_id": "demo-001"}}

# Turno 1 — el grafo guarda el estado completo bajo "demo-001"
agent.invoke({"messages": [HumanMessage("Cambiar vuelo del 15 al 17...")]}, config)

# Turno 2 — MISMO thread_id → recupera historial + estado del Turno 1
agent.invoke({"messages": [HumanMessage("Sí, confirmo el cambio.")]}, config)
```

**Why it works:** at the end of Turn 1, `MemorySaver` serializes the graph state (all accumulated `HumanMessage`, `AIMessage`, `ToolMessage`). When Turn 2 starts with the same `thread_id`, LangGraph **restores** that state before processing the new message. The LLM sees the full history — equivalent to passing the entire `session.memory` to `fake_llm`, but without you managing the list.

```
Turno 1 con thread_id="demo-001"
  HumanMessage("Cambiar vuelo...")
  AIMessage(tool_calls=[consultar_reserva])
  ToolMessage(resultado reserva)
  AIMessage(tool_calls=[consultar_politica])
  ToolMessage(resultado política)
  AIMessage("Total USD 130. ¿Confirmas?")
       ↓ MemorySaver guarda todo bajo "demo-001"

Turno 2 con thread_id="demo-001"  ← mismo ID
  [estado restaurado] +
  HumanMessage("Sí, confirmo")
  AIMessage("Cambio confirmado para SCL-BOG-001...")
```

**Gotchas:**
- **Different `thread_id` = new conversation** — the agent remembers nothing from the previous turn.
- **Same `thread_id` for two different users** — you would mix histories. In production, use a unique ID per user session (`user-123-sess-456`).
- `MemorySaver` lives in RAM — if you restart the process, you lose history. For real persistence use `SqliteSaver` or a database backend.

See also §4 (conversational memory) for the concept; here you see the framework implementation.

### 8.7 Explicit `StateGraph` — the graph that reproduces your `while`

`create_react_agent` is convenient but opaque: you do not see nodes or edges. When you need **fine control** (extra state fields, guardrails between nodes, hybrid LLM+deterministic flows), you build the graph by hand.

#### 8.7.1 Typed state with `TypedDict` and `add_messages`

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class FlightChangeState(TypedDict):
    messages:    Annotated[list, add_messages]   # historial — se ACUMULA, no se reemplaza
    pnr:         str
    fare_class:  str
    penalty:     float
    total:       float
    confirmed:   bool
```

`Annotated[list, add_messages]` is LangGraph's reducer for messages: each node returns `{"messages": [new_message]}` and LangGraph **concatenates** to the existing history (same as your `memory.append(...)` in scratch). Without `add_messages`, a node would overwrite the entire list.

#### 8.7.2 Nodes — `state → partial_state` functions

A node receives the current state and returns **only the fields that change**:

```python
def node_call_tools(state: FlightChangeState) -> FlightChangeState:
    """Ejecuta las tool calls del último AIMessage — equivalente a TOOLS[name](**args) en scratch."""
    last = state["messages"][-1]
    new_messages = []
    updates = {}

    for tc in last.tool_calls:
        if tc["name"] == "consultar_reserva":
            result = consultar_reserva.invoke(tc["args"])
            updates["pnr"] = result.get("pnr", "")
            updates["fare_class"] = result.get("fare_class", "")
        elif tc["name"] == "consultar_politica":
            result = consultar_politica.invoke(tc["args"])
            updates["penalty"] = float(result.get("penalidad_usd") or 0)

        new_messages.append(ToolMessage(
            content=json.dumps(result),
            tool_call_id=tc["id"],
        ))

    return {**updates, "messages": new_messages}
```

#### 8.7.3 Conditional edges — the ReAct loop's `if`

In scratch, the `while` decided: is there an `action`? → run tool; is there a `final`? → exit. In LangGraph, a **router function** returns the name of the next node:

```python
def should_continue(state: FlightChangeState) -> str:
    """¿El último mensaje tiene tool_calls pendientes?"""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"    # → nodo "tools"
    return "end"          # → END (respuesta final)
```

#### 8.7.4 Graph construction and compilation

```python
from langgraph.graph import StateGraph, END

builder = StateGraph(FlightChangeState)

builder.add_node("agent", lambda s: {"messages": [llm_with_tools.invoke(s["messages"])]})
builder.add_node("tools", node_call_tools)

builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
builder.add_edge("tools", "agent")          # tras ejecutar tools → volver a razonar

graph = builder.compile(checkpointer=MemorySaver())
```

ReAct loop diagram (same loop as §3):

```
                    ┌──────────────────────────────────┐
                    │         BUCLE REACT              │
                    │                                  │
  HumanMessage ──▶  │  [agent] ──should_continue──▶    │
       ▲            │     │              │            │
       │            │     │         tool_calls?        │
       │            │     │         ┌────┴────┐       │
       │            │     │        sí        no        │
       │            │     │         │         │        │
       │            │     │    [tools]      [END]      │
       │            │     │         │                  │
       │            │     └─────────┘ (add_edge)        │
       │            └──────────────────────────────────┘
       │
  (Turno 2: estado restaurado por checkpointer + nuevo HumanMessage)
```

This two-node graph (`agent` ↔ `tools`) **is** the `while` loop in `react_loop`. The `tools → agent` edge is your `memory.append(tool_result)` followed by another `while` iteration.

### 8.8 Block-by-block walkthrough of `lab/solucion_framework.py`

Open `lab/solucion_framework.py` and follow this map. Each block corresponds to a piece you already implemented in scratch.

#### Block 1 — Data loading (lines 17–34)

Identical to `solucion_scratch.py`. The `@tool` functions read the same JSON from `datos/`. No surprises.

#### Block 2 — Tools with `@tool` (lines 37–75)

```python
@tool
def consultar_reserva(pnr: str) -> dict: ...
@tool
def consultar_politica(fare_class: str, route_type: str) -> dict: ...

TOOLS = [consultar_reserva, consultar_politica]
```

**Scratch bridge:** `TOOLS` was a `dict` name→function; now it is a `list` of `BaseTool` objects. Each function's docstring replaces the logic that in scratch was implicit in `fake_llm` ("if I haven't called consultar_reserva, call it").

**Pedagogical detail:** `consultar_politica` says *"Úsala DESPUÉS de consultar_reserva"* — that guides the LLM to respect chaining order (§2.3).

#### Block 3 — `build_agent()` (lines 87–117)

```python
llm = ChatAnthropic(model="claude-sonnet-4-6", temperature=0.1, ...)
checkpointer = MemorySaver()
agent = create_react_agent(model=llm, tools=TOOLS, prompt=system_prompt, checkpointer=checkpointer)
```

**Scratch bridge:**
- `ChatAnthropic` → replaces `fake_llm`.
- `system_prompt` → replaces the initial `{"role": "system", ...}` message in `session.memory`.
- `create_react_agent` → replaces `react_loop` + the `while`.
- `checkpointer` → replaces `Session` keeping `self.memory` between turns.

The `system_prompt` includes the suggested flow (steps 1–6) — same as in scratch the system message guides `fake_llm`, but the real LLM can adapt if a tool fails.

#### Block 4 — Two-turn demo (lines 124–163)

```python
config = {"configurable": {"thread_id": "demo-001"}}

result1 = agent.invoke({"messages": [HumanMessage(content=turno1)]}, config=config)
# ... más tarde, mismo config:
result2 = agent.invoke({"messages": [HumanMessage(content=turno2)]}, config=config)
```

**Scratch bridge:** equivalent to calling `chat(session, turno1)` then `chat(session, turno2)` with the **same** `session`. The `thread_id` is the session; you do not need `_find_in_memory` because the checkpointer saves the full message history.

**What you should see when running (with API key):**
- Turn 1: sequence `consultar_reserva` → `consultar_politica` → response with total **USD 130**.
- Turn 2: the agent confirms the change citing PNR and cost **without** calling `consultar_reserva` again.

#### Block 5 — Commented explicit StateGraph (lines 166–234)

The commented section at the end of the file shows the advanced alternative. Piece by piece:

| Commented fragment | Scratch equivalent |
|---------------------|------------------------|
| `FlightChangeState` with `Annotated[list, add_messages]` | `session.memory` + extra fields (`pnr`, `penalty`…) |
| `node_call_tools` | `TOOLS[tool_name](**args)` block inside the `while` |
| `should_continue` → `"tools"` or `"end"` | `if "action" in response` vs `if "final" in response` |
| `add_node("agent", ...)` | Call to `fake_llm(memory)` |
| `add_conditional_edges("agent", should_continue, ...)` | The `if/else` that decides whether to keep iterating |
| `add_edge("tools", "agent")` | `memory.append(...)` + next `while` iteration |
| `graph.compile(checkpointer=MemorySaver())` | `Session` with persistent memory |

If you uncommented and completed that block (you would also need `llm.bind_tools(TOOLS)` for `llm_with_tools`), you would have explicit control over which state fields update on each tool call — something you did in scratch with `_find_in_memory` and `pnr:...` lines in the assistant response.

### 8.9 When to use each approach and final gotchas

| Situation | Use | Why |
|-----------|-----|---------|
| Quick prototype, standard conversational agent | `create_react_agent` | 10 lines; ReAct loop already wired |
| Guardrails between steps, extra structured state, subgraphs | Explicit `StateGraph` | See and control every node and edge |
| 100% deterministic flow (no LLM deciding order) | `StateGraph` without LLM node | §9 — Plan-and-Execute or pipeline |
| Multi-agent (M7) | `StateGraph` with several agent nodes | Supervisor, fan-out, etc. |

**Gotchas that appear in production:**

1. **Poor docstrings → tools misused.** The LLM only knows your tools by their description. Invest time in the docstring as if it were a prompt.
2. **`add_messages` accumulates — does not replace.** If a node returns `{"messages": [msg]}`, it is appended to history. To reset a session, use a new `thread_id`.
3. **Same `thread_id` = same session.** Document this in your API: each user conversation needs its own ID.
4. **High `temperature` in agents** → more creativity but inconsistent tool calls. For transactional agents (flight change, payments), use `0.0`–`0.2`.
5. **`create_react_agent` has internal `max_iterations`** — if the LLM loops calling the same tool, the graph ends with an error. In scratch you controlled it with `MAX_STEPS = 8`.

### 8.10 Checklist before writing your `solucion_framework.py`

- [ ] Do you have both `@tool` functions with docstrings that explain **when** to use them?
- [ ] Does the `system_prompt` guide the flow (reservation → policy → calculation → confirmation)?
- [ ] Is `MemorySaver()` in `create_react_agent(..., checkpointer=...)`?
- [ ] Do you use the **same** `config` with `thread_id` on both turns?
- [ ] Is each `invoke` input `{"messages": [HumanMessage(...)]}`?
- [ ] *(Challenge)* Can you draw the `agent → tools → agent` graph and point to which scratch line corresponds to each edge?

**Next step:** open `lab/enunciado.md` (Part B) and try writing the file yourself before looking at `solucion_framework.py`. Use this checklist and the bridge table in §8.2.

---

> **Beyond Lang\*:** this same flight-change agent is implemented with a **native SDK loop (no framework)**, **CrewAI**, **AutoGen/AG2**, and **Pydantic-AI** in [`../referencia/agentes-sin-langchain.md`](../referencia/agentes-sin-langchain.md). Start by understanding the ReAct loop by hand (layer ②): that way you can use LangGraph **or any other** framework with judgment.

---

## 9. Comparison: ReAct vs Plan-and-Execute vs Reflexion

| | ReAct | Plan-and-Execute | Reflexion |
|---|---|---|---|
| **Strategy** | Reason and act at each step | Plan everything, then execute | ReAct + evaluation + error memory |
| **Flexibility** | High (adapts plan from observations) | Low (plan is fixed) | High |
| **LLM cost** | Medium (N steps) | Higher (plan + N steps) | High (N steps + evaluations) |
| **Latency** | Medium | High (waits for full plan) | High |
| **When to use** | Most conversational agents | Long tasks with many well-defined steps | Hard problems with automatic evaluation |
| **Risk** | Plan may drift mid-task | If plan is bad, everything fails | Evaluator may be wrong |
| **Example** | Flight change (3-5 tools) | Research with 20 sources | Code problem solving |
| **In RAGorbit** | `agent.react` | No node; implement in LangGraph | No node; implement with evaluation tools |

**When to choose each:**

- **ReAct**: always the starting point. Works for the vast majority of transactional and conversational agents.
- **Plan-and-Execute**: when you have very long tasks where the agent gets "lost" without an explicit plan. Rare in customer service production.
- **Reflexion**: when the agent runs in *batch* mode (not waiting for the user in real time) and you have a reliable evaluation function.

---

## 10. RAGorbit Nodes for This Module

### `agent.react` — Orchestrator node

```
Puertos de entrada:
  → Model   (requerido)   — el LLM que razona
  → Tool    (n)           — herramientas disponibles
  → Retriever (n)         — retrievers directos (sin tool.retriever)
  → Message               — mensaje del usuario

Puerto de salida:
  Message →               — respuesta final + arista loop para ciclo ReAct
```

Key configuration:
```json
{
  "system":   "Prompt de sistema del agente",
  "maxSteps": 8,
  "streaming": true
}
```

### `tool.service` — Tool to HTTP service

```
Puerto de salida: Tool →
```

```json
{
  "name":        "ReservationService",
  "baseUrl":     "https://api.internal/reservations",
  "operation":   "getItinerary",
  "inputSchema": { "type": "object", "properties": { "pnr": {"type":"string"} } }
}
```

### `tool.retriever` — RAG as tool

```
Puerto de entrada: → Retriever  (del store.*)
Puerto de salida:  Tool →
```

```json
{
  "name":        "policy_rag",
  "description": "Consulta reglas de tarifa. Incluye fare_class en la query."
}
```

### `tool.function` — Custom Python function

```json
{
  "name":      "calcular_total",
  "signature": "(penalty: float, delta: float) -> float",
  "body":      "return penalty + delta"
}
```

---

## 11. Connection with Industry Templates

### Template 01 · Airline

The most complete agent template in RAGorbit. Combines:
- `agent.react` as central orchestrator.
- 4 `tool.service` (reservation, inventory, pricing, payment).
- 1 `tool.retriever` (PolicyRAG over fare rules).
- 3 guardrails in chain on payment.
- `observability.audit` with Kafka sink.

See [`examples/01-airline-flight-change/README.md`](../../examples/01-airline-flight-change/README.md) and [`flow.json`](../../examples/01-airline-flight-change/flow.json).

### Template 06 · Retail Post-Sale

Similar but simpler. The agent handles orders, returns, and recommendations.
- `guardrail.confirm` for returns > $200.
- `guardrail.idempotency` to avoid duplicate returns.

See [`examples/06-retail-postsale-bot/README.md`](../../examples/06-retail-postsale-bot/README.md).

### Template 07 · Telecom Copilot

Example of **Agentic RAG with multi-index routing**:
- Does not use `agent.react` in the traditional sense — it is a pipeline with `tool.retriever` at the center.
- `model.intent` as gate: only activates RAG for actionable fragments.
- Three `tool.retriever` for three distinct indexes (policy, procedure, faq).
- `observability.feedback` to continuously improve the reranker.

See [`examples/07-telecom-callcenter-copilot/README.md`](../../examples/07-telecom-callcenter-copilot/README.md).

---

## 12. Checkpoint — You know it if you can…

- [ ] Explain when a ReAct agent is better than a fixed pipeline (and vice versa).
- [ ] Draw the ReAct loop (reason → act → observe) for a concrete case.
- [ ] Describe what information goes in message history vs. agent state.
- [ ] Explain why Reflexion does not modify model weights.
- [ ] Describe how `tool.retriever` turns a vector index into an agent tool.
- [ ] Explain what `@tool` does (docstring → description, type hints → schema) and how to invoke with `.invoke()`.
- [ ] Build an agent with `create_react_agent` + `MemorySaver` + `thread_id` for two turns with memory.
- [ ] Draw the `agent ↔ tools` graph of an explicit `StateGraph` and map it to your scratch `while`.
- [ ] Distinguish when to use `create_react_agent` (fast) vs explicit `StateGraph` (control).
- [ ] Read template 01's `flow.json` and identify all `tool.*` nodes and their guardrails.

**If you cannot:** review §3 (ReAct), §4 (memory), §8 (LangGraph), and [lab/enunciado.md](lab/enunciado.md). Consult template 01 as a concrete example.

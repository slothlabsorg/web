# Módulo 6 · Agentes I — Fundamentos (`agent`, `tool`)

> **Prerequisito:** haber completado M1–M5. Se asume familiaridad con LLMs, prompting, RAG y lógica condicional.
>
> **Nodos RAGorbit:** `agent.react`, `agent.fanout`, `tool.service`, `tool.retriever`, `tool.function`, `tool.http`, `tool.mcp`
>
> **Templates ancla:** `01-airline-flight-change` (agente transaccional), `06-retail-postsale-bot` (agente de servicio), `07-telecom-callcenter-copilot` (agentic RAG + feedback)

---

## 1. De RAG a Agente — ¿cuándo necesitas uno?

### 1.1 El límite de los pipelines deterministas

Un pipeline RAG estándar sigue un camino fijo:

```
Entrada → [Retrieval] → [Generación] → Salida
```

Es perfecto cuando:
- El número de pasos es conocido y fijo.
- No hay necesidad de decidir *qué* herramienta llamar ni *cuándo*.
- La lógica de bifurcación es simple y puedes codificarla tú mismo.

Pero falla cuando la consulta del usuario requiere **razonamiento multi-paso con incertidumbre sobre qué pasos tomar**. Ejemplos:

| Solicitud | Por qué falla un pipeline fijo |
|-----------|--------------------------------|
| "Quiero cambiar mi vuelo del 15 al 17" | No sabes de antemano qué PNR tiene, si aplica penalidad, qué vuelos hay ni cuánto costará. |
| "¿Puedo devolver este pedido? ¿Y recibir un cambio en su lugar?" | Dos posibles acciones distintas; depende de la política y del pedido específico. |
| "¿Qué hay en mi factura que no reconozco?" | Requiere recuperar factura, identificar ítem, buscar en base de conocimiento — en orden dinámico. |

### 1.2 ¿Agente o reglas?

**Usa reglas deterministas cuando:**
- El espacio de decisiones es finito y lo conoces completamente.
- La corrección es crítica y el LLM podría equivocarse (cálculos financieros exactos, flags de seguridad).
- La velocidad importa mucho (reglas en microsegundos vs. LLM en cientos de ms).

**Usa un agente cuando:**
- El número de pasos no es fijo de antemano.
- El LLM necesita *decidir* qué información recopilar.
- La tarea tiene ramificaciones que dependen de datos externos que no tienes al diseñar el sistema.
- El usuario puede hacer preguntas de seguimiento que cambian el contexto.

**Regla de oro:** si puedes expresarlo como un grafo de nodos de decisión con todos los arcos definidos en tiempo de diseño, usa un pipeline. Si no puedes, necesitas un agente.

En RAGorbit esto se materializa así:
- Pipeline determinista → nodos `logic.router`, `logic.rules`, `logic.structured`.
- Agente → nodo `agent.react` con `tool.*`.

### 1.3 Comparativa rápida

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

## 2. Tool Calling — el mecanismo central

### 2.1 Qué es

*Tool calling* (también llamado *function calling*) es la capacidad de un LLM de emitir, en lugar de texto libre, una instrucción estructurada de la forma:

```json
{
  "tool": "ReservationService",
  "arguments": { "pnr": "SCL-BOG-001" }
}
```

El framework intercepta esa instrucción, ejecuta la función real, y devuelve el resultado al LLM como si fuera un nuevo turno de la conversación. El LLM entonces razona sobre el resultado y decide si llamar otra herramienta o responder al usuario.

### 2.2 Contrato de una tool

Cada herramienta se describe al LLM con:
1. **Nombre** — único e inequívoco.
2. **Descripción** — en lenguaje natural, cuándo y para qué usarla.
3. **Esquema de entrada** — JSON Schema de los argumentos que acepta.
4. **Esquema de salida** — (opcional pero bueno tenerlo documentado).

En RAGorbit, el nodo `tool.service` define todo esto:

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

El `description` es crucial: determina si el LLM decidirá llamar esta herramienta en el momento correcto.

### 2.3 Chaining de tools

Cuando el LLM llama herramienta A y usa su resultado para decidir llamar herramienta B, tenemos *chaining*. En el template `01-airline-flight-change` el chaining es:

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

Cada paso usa el resultado del anterior. El LLM coordina este chaining de forma natural — no necesitas hardcodear el orden (aunque en el `system` prompt del agente sí lo guías para que sea consistente).

### 2.4 Tool como RAG (tool.retriever)

Una variante poderosa: el retriever vectorial se expone como una tool. El agente decide *cuándo* y *con qué query* llamar al RAG. Esto es **Agentic RAG** (sección 6 de esta guía).

En RAGorbit: `tool.retriever` envuelve un `Retriever` de cualquier `store.*` y lo expone como `Tool` al agente.

```
store.pgvector ──(Retriever)──▶ tool.retriever ──(Tool)──▶ agent.react
                                  name: "policy_rag"
                                  description: "Consulta reglas de tarifa..."
```

---

## 3. El Bucle ReAct (Razonar → Actuar → Observar)

### 3.1 Concepto

ReAct (*Reasoning + Acting*) es el patrón más usado en agentes modernos. Fue introducido en el paper "ReAct: Synergizing Reasoning and Acting in Language Models" (Yao et al., 2022).

La idea: alternar entre **razonamiento** (el LLM piensa en voz alta qué hacer) y **actuación** (llamar una herramienta), incorporando las **observaciones** (resultados) como nuevo contexto.

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

### 3.2 Diagrama de un paso completo

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

### 3.3 Traza de ejemplo — Cambio de vuelo

El usuario escribe: *"Quiero cambiar mi vuelo SCL-BOG del 15 al 17 de junio."*

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

El agente **no cobró** hasta recibir confirmación. Ese control no lo maneja el LLM sino el `guardrail.confirm` del nodo `PaymentService`.

### 3.4 En RAGorbit: `agent.react`

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

- `maxSteps` limita el número de iteraciones (evita bucles infinitos).
- El prompt de `system` guía el orden preferido de herramientas pero no lo obliga — el LLM puede adaptarse.
- Los puertos `Tool` (múltiples) conectan todas las herramientas disponibles.

---

## 4. Memoria

Un agente sin memoria trata cada turno como si fuera el primero. Eso es útil para pipelines sin estado, pero inaceptable en conversaciones donde el usuario ya dijo "mi PNR es SCL-BOG-001" y no debería repetirlo.

### 4.1 Tipos de memoria

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

### 4.2 Memoria conversacional (corto plazo en práctica)

La forma más simple: acumular la lista de mensajes (user/assistant/tool) y pasarla completa en cada llamada al LLM.

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

Cuando el usuario dice "sí, confirmo" en el turno 2, el agente sabe exactamente a qué está confirmando porque todo el historial está en la lista.

### 4.3 Estado del agente (working memory)

Para casos donde el agente necesita *actualizar* datos estructurados durante el razonamiento:

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

En LangGraph esto es el `TypedDict` que pasa entre nodos. En nuestro agente scratch del taller, es un dict simple.

### 4.4 Memoria a largo plazo

Para conversaciones entre sesiones o con miles de hechos sobre el usuario:

```python
# Guardar:
vector_store.add("El usuario prefiere ventanilla y vuelos de mañana", metadata={"user_id": "U123"})

# Recuperar en el próximo turno:
recuerdos = vector_store.search("preferencias de asiento", filter={"user_id": "U123"})
# → ["prefiere ventanilla y vuelos de mañana"]
```

No implementamos esto en este módulo (ver M7 para persistencia en LangGraph).

---

## 5. Reflection y Reflexion — Auto-mejora del agente

### 5.1 Reflection (con una L)

El agente evalúa su propia respuesta antes de entregarla. Secuencia:

```
[Agente genera respuesta]
       ↓
[Mismo LLM u otro evalúa]
  "¿Respondí la pregunta? ¿Hay inconsistencias? ¿Me falta información?"
       ↓
[Si hay problemas] → el agente intenta de nuevo
[Si es correcta]   → entrega la respuesta
```

Ejemplo aplicado al cambio de vuelo:

```
Respuesta tentativa: "El costo es USD 130."

Evaluación interna:
  - ¿Expliqué el desglose? NO → hay que mejorar.
  - ¿Pedí confirmación? NO → hay que agregar.

Respuesta mejorada:
  "Penalidad USD 50 + diferencial USD 80 = **Total USD 130**.
   ¿Confirmas el cambio?"
```

### 5.2 Reflexion (con X — el paper)

El paper de Reflexion (Shinn et al., 2023) formaliza esto con tres componentes:

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

El punto clave: **la reflexión se guarda como texto en la memoria del agente**, no como parámetros del modelo. No es fine-tuning; es aprendizaje en contexto iterativo.

Cuándo usar Reflexion:
- Tareas de codificación o resolución de problemas donde el resultado es verificable.
- Cuando el agente falla en varios intentos y necesita aprender de sus errores en la misma sesión.

Cuándo NO usar Reflexion:
- Conversaciones en tiempo real donde el usuario espera una respuesta (demasiada latencia).
- Cuando tienes un evaluador confiable (si no puedes medir si la respuesta es buena, la reflexión no aporta).

---

## 6. Agentic RAG — El agente decide cuándo y qué recuperar

### 6.1 Diferencia con RAG tradicional

En RAG estándar, la recuperación siempre ocurre en el mismo lugar del pipeline:

```
Entrada → [Siempre recuperar] → [Siempre generar] → Salida
```

En **Agentic RAG**, el retriever es una tool más:

```
Entrada → Agente ──decision──▶ ¿Recuperar ahora? ──sí──▶ [Retrieval] → contexto
                 ↓                                                        ↓
               ¿Qué query?                                             → LLM
               ¿Con qué filtros?
               ¿Necesito más contexto?
```

### 6.2 Ventajas de Agentic RAG

1. **El agente decide el momento óptimo de recuperación.** Si el usuario ya dio toda la información, no hay que recuperar nada. Si necesita información específica, recupera con una query más precisa.

2. **El agente puede hacer múltiples recuperaciones con queries distintas.** Ejemplo: primero recupera la política general, luego recupera casos especiales para la tarifa específica.

3. **El agente puede enriquecer la query** usando información ya obtenida de otras herramientas.

En el template 01:
```
ReservationService → { fare_class: "ECONOMY_FLEX" }
    ↓
policy_rag(query="penalidad ECONOMY_FLEX internacional")
    ↑ la query incluye datos del paso anterior
```

### 6.3 Routing de queries

El agente puede decidir *qué índice* usar:

```
"¿Cuál es la política de maletas?"   → tool: policy_rag
"¿Puedo cambiar mi vuelo?"           → tool: policy_rag + ReservationService
"¿Hay vuelos el viernes?"            → tool: InventoryService (no necesita RAG)
```

El nodo `tool.retriever` en RAGorbit permite exponerlo con un nombre y descripción claros para que el LLM tome esta decisión de forma informada.

Para múltiples bases de conocimiento:

```
tool.retriever "policy_rag"     → políticas de tarifa
tool.retriever "faq_rag"        → preguntas frecuentes
tool.retriever "procedures_rag" → procedimientos internos
```

El LLM elige cuál usar según la descripción de cada tool. Este es el patrón del template 07 (copilot de telecom).

### 6.4 `tool.retriever` en RAGorbit

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

- Puerto de entrada: `Retriever` (viene de cualquier `store.*`).
- Puerto de salida: `Tool` (se conecta al `agent.react`).

---

## 7. Agentes Built-in de LangChain

LangChain incluye agentes especializados para casos de uso comunes. Conceptualmente son `agent.react` con tools predefinidas.

### 7.1 Agente de datos / análisis (CSV/DataFrame)

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

El agente genera y ejecuta código Python internamente. Usar con cuidado: el código generado puede tener efectos secundarios no deseados.

### 7.2 Agente SQL

```python
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase

db = SQLDatabase.from_uri("sqlite:///ventas.db")
agent = create_sql_agent(llm=llm, db=db, agent_type="openai-tools")
# "¿Qué clientes compraron más de $1000 en junio?" → genera y ejecuta SQL
```

### 7.3 Agente de visualización

```python
from langchain_experimental.agents import create_pandas_dataframe_agent

agent = create_pandas_dataframe_agent(
    llm=llm, df=df, allow_dangerous_code=True
)
# "Crea una gráfica de barras de ventas por mes" →
# el agente genera código matplotlib/seaborn y lo ejecuta
```

### 7.4 Cuándo usar los built-in vs. tu propio agente

| Escenario | Usa built-in | Usa tu propio |
|-----------|-------------|---------------|
| Análisis ad-hoc sobre datos internos | si | — |
| Producción con lógica de negocio | — | si |
| Prototipo rápido | si | — |
| Necesitas control fino del sistema prompt | — | si |
| Necesitas guardrails financieros | — | si |

---

## 8. La capa ③ explicada: LangGraph desde cero (de tu bucle ReAct al grafo)

> **Prerrequisito:** haber implementado la capa ② del taller (`lab/solucion_scratch.py`) o entender cada pieza que escribiste a mano. **Lee esta sección completa** antes de intentar escribir `lab/solucion_framework.py`.
>
> **Entorno:** en la máquina de estudio del curso no hay `pip` ni red. No podrás ejecutar este código aquí. El objetivo es que, cuando tengas `pip install langgraph langchain langchain-anthropic` y una API key, puedas **escribir** la solución framework tú mismo — no solo leerla.

### 8.1 Recordatorio: LangChain y chat models (M1 §11)

En M1 ya aprendiste la base de LangChain: `Document`, loaders, retrievers, `ChatPromptTemplate` y **chat models** como `ChatAnthropic`. No lo repetimos aquí — enlaza con [M1 §11 — La capa ③ explicada: LangChain desde cero](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero).

Para este módulo solo necesitas recordar tres piezas de M1:

| Pieza M1 | Para qué sirve en M6 |
|----------|----------------------|
| `ChatAnthropic(model=..., temperature=..., api_key=...)` | El LLM real que **razona** en el bucle ReAct (reemplaza a `fake_llm`) |
| Mensajes tipados (`HumanMessage`, `AIMessage`, `ToolMessage`) | El historial que el agente lee y escribe en cada iteración |
| El operador `invoke(...)` | Forma estándar de ejecutar un componente LangChain/LangGraph |

**Lo nuevo de M6** no es LangChain en general — es **tools** (`@tool`) y **LangGraph** (el grafo que implementa el bucle ReAct y la memoria entre turnos).

### 8.2 Tabla puente: tu scratch → LangGraph/LangChain

Esta tabla mapea **cada mecanismo** de `lab/solucion_scratch.py` a su equivalente en `lab/solucion_framework.py`:

| Lo que hiciste a mano (capa ②) | Pieza LangGraph/LangChain (capa ③) | Dónde en el lab |
|--------------------------------|-------------------------------------|-----------------|
| `TOOLS = {"consultar_reserva": fn, ...}` — registro manual | Lista `[consultar_reserva, consultar_politica]` de funciones `@tool` | `TOOLS = [...]` |
| Docstring de la función Python | **Descripción que ve el LLM** (el decorador `@tool` la extrae) | `@tool` + docstring |
| Type hints `pnr: str` | **JSON Schema** de argumentos que el LLM debe emitir | Parámetros de `@tool` |
| `fake_llm(memory)` — decide acción o respuesta final | `ChatAnthropic` + protocolo nativo de tool calling | `build_agent()` |
| `while step < MAX_STEPS:` — bucle ReAct | `create_react_agent` (o `StateGraph` con nodos `agent`↔`tools`) | `agent.invoke(...)` |
| `memory.append({"role": "tool", ...})` | `ToolMessage` agregado automáticamente por el grafo | Interno en LangGraph |
| `session.memory` — lista que crece entre turnos | `MemorySaver` + `thread_id` en `config` | `config = {"configurable": {"thread_id": "..."}}` |
| `_find_in_memory(messages, "pnr")` — estado en texto | Estado completo del grafo persistido en el checkpointer | Mismo `thread_id` en Turno 2 |
| `react_loop(memory)` | `agent.invoke({"messages": [HumanMessage(...)]}, config)` | `main()` |

**Modelo mental:** en scratch tú eres el framework (bucle, memoria, ejecución de tools). En LangGraph el framework **es** un grafo de estado: nodos transforman el estado, aristas deciden el siguiente nodo, y el checkpointer guarda todo entre turnos.

### 8.3 El decorador `@tool` — de función Python a herramienta del LLM

En scratch registraste tools en un diccionario:

```python
TOOLS = {
    "consultar_reserva": consultar_reserva,
    "consultar_politica": consultar_politica,
}
```

En LangChain, el decorador `@tool` hace tres cosas automáticamente:

1. **Nombre** — toma el nombre de la función (`consultar_reserva`).
2. **Descripción** — toma el **docstring** completo y se lo pasa al LLM como instrucción de cuándo usar la tool.
3. **Schema de argumentos** — lee los **type hints** (`pnr: str`) y genera un JSON Schema que el LLM debe respetar al llamar la tool.

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

**Qué ve el LLM** (simplificado):

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

**Invocar una tool decorada** (desde código o desde un nodo del grafo):

```python
result = consultar_reserva.invoke({"pnr": "SCL-BOG-001"})
# equivalente a: consultar_reserva(pnr="SCL-BOG-001")
```

**Gotcha:** si el docstring es vago ("consulta datos"), el LLM llamará la tool en el momento equivocado o no la llamará. En §2.2 vimos que la `description` es crucial — con `@tool`, el docstring **es** esa description.

### 8.4 `ChatAnthropic` — el LLM del agente

Recordatorio breve (detalle en M1 §11.9):

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4-6",
    temperature=0.1,                              # baja = más determinista
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)
```

En scratch, `fake_llm` inspeccionaba el historial y devolvía `{"action": ...}` o `{"final": ...}`. Con un chat model real, el LLM emite mensajes estructurados con `tool_calls` cuando necesita actuar — LangGraph interpreta esas llamadas y ejecuta las `@tool` correspondientes.

### 8.5 `create_react_agent` — el bucle ReAct preconstruido

`create_react_agent` de `langgraph.prebuilt` encapsula el bucle que implementaste a mano en `react_loop`:

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

Construcción mínima (como en `solucion_framework.py`):

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

**Ejecutar un turno:**

```python
from langchain_core.messages import HumanMessage

result = agent.invoke(
    {"messages": [HumanMessage(content="Quiero cambiar mi vuelo SCL-BOG-001...")]},
    config={"configurable": {"thread_id": "demo-001"}},
)
respuesta = result["messages"][-1].content   # último mensaje = respuesta del agente
```

El estado de entrada y salida es un diccionario con clave `"messages"`. Cada `invoke` **agrega** mensajes al historial de esa sesión (no lo reemplaza).

### 8.6 `MemorySaver` y `thread_id` — memoria entre turnos

En scratch, la memoria era `session.memory` — una lista que persistía entre llamadas a `chat()`. En LangGraph, la persistencia la maneja un **checkpointer**:

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()   # en RAM; en producción: SqliteSaver, PostgresSaver...
```

El `thread_id` identifica la **sesión conversacional**:

```python
config = {"configurable": {"thread_id": "demo-001"}}

# Turno 1 — el grafo guarda el estado completo bajo "demo-001"
agent.invoke({"messages": [HumanMessage("Cambiar vuelo del 15 al 17...")]}, config)

# Turno 2 — MISMO thread_id → recupera historial + estado del Turno 1
agent.invoke({"messages": [HumanMessage("Sí, confirmo el cambio.")]}, config)
```

**Por qué funciona:** al finalizar el Turno 1, `MemorySaver` serializa el estado del grafo (todos los `HumanMessage`, `AIMessage`, `ToolMessage` acumulados). Al iniciar el Turno 2 con el mismo `thread_id`, LangGraph **restaura** ese estado antes de procesar el nuevo mensaje. El LLM ve el historial completo — equivalente a pasar `session.memory` entera a `fake_llm`, pero sin que tú gestiones la lista.

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
- **Distinto `thread_id` = conversación nueva** — el agente no recuerda nada del turno anterior.
- **Mismo `thread_id` en dos usuarios distintos** — mezclarías historiales. En producción, usa un ID único por sesión de usuario (`user-123-sess-456`).
- `MemorySaver` vive en RAM — si reinicias el proceso, pierdes el historial. Para persistencia real usa `SqliteSaver` o un backend de base de datos.

Ver también §4 (memoria conversacional) para el concepto; aquí ves la implementación con framework.

### 8.7 `StateGraph` explícito — el grafo que reproduce tu `while`

`create_react_agent` es conveniente pero opaco: no ves los nodos ni las aristas. Cuando necesitas **control fino** (campos de estado extra, guardrails entre nodos, flujos híbridos LLM+deterministas), construyes el grafo a mano.

#### 8.7.1 Estado tipado con `TypedDict` y `add_messages`

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

`Annotated[list, add_messages]` es el reducer de LangGraph para mensajes: cada nodo devuelve `{"messages": [nuevo_mensaje]}` y LangGraph **concatena** al historial existente (igual que tu `memory.append(...)` en scratch). Sin `add_messages`, un nodo sobrescribiría la lista entera.

#### 8.7.2 Nodos — funciones `state → partial_state`

Un nodo recibe el estado actual y devuelve **solo los campos que cambian**:

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

#### 8.7.3 Aristas condicionales — el `if` del bucle ReAct

En scratch, el `while` decidía: ¿hay `action`? → ejecutar tool; ¿hay `final`? → salir. En LangGraph, una **función router** devuelve el nombre del siguiente nodo:

```python
def should_continue(state: FlightChangeState) -> str:
    """¿El último mensaje tiene tool_calls pendientes?"""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"    # → nodo "tools"
    return "end"          # → END (respuesta final)
```

#### 8.7.4 Construcción y compilación del grafo

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

Diagrama del grafo ReAct (el mismo bucle que §3):

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

Este grafo de dos nodos (`agent` ↔ `tools`) **es** el bucle `while` de `react_loop`. La arista `tools → agent` es tu `memory.append(tool_result)` seguido de otra iteración del `while`.

### 8.8 Recorrido bloque a bloque de `lab/solucion_framework.py`

Abre `lab/solucion_framework.py` y sigue este mapa. Cada bloque corresponde a una pieza que ya implementaste en scratch.

#### Bloque 1 — Carga de datos (líneas 17–34)

Idéntico a `solucion_scratch.py`. Las `@tool` leen los mismos JSON de `datos/`. Sin sorpresas.

#### Bloque 2 — Tools con `@tool` (líneas 37–75)

```python
@tool
def consultar_reserva(pnr: str) -> dict: ...
@tool
def consultar_politica(fare_class: str, route_type: str) -> dict: ...

TOOLS = [consultar_reserva, consultar_politica]
```

**Puente scratch:** `TOOLS` era un `dict` nombre→función; ahora es una `list` de objetos `BaseTool`. El docstring de cada función reemplaza la lógica que en scratch estaba implícita en `fake_llm` ("si no llamé consultar_reserva, llamarla").

**Detalle pedagógico:** `consultar_politica` dice *"Úsala DESPUÉS de consultar_reserva"* — eso guía al LLM a respetar el orden del chaining (§2.3).

#### Bloque 3 — `build_agent()` (líneas 87–117)

```python
llm = ChatAnthropic(model="claude-sonnet-4-6", temperature=0.1, ...)
checkpointer = MemorySaver()
agent = create_react_agent(model=llm, tools=TOOLS, prompt=system_prompt, checkpointer=checkpointer)
```

**Puente scratch:**
- `ChatAnthropic` → reemplaza `fake_llm`.
- `system_prompt` → reemplaza el mensaje `{"role": "system", ...}` inicial de `session.memory`.
- `create_react_agent` → reemplaza `react_loop` + el `while`.
- `checkpointer` → reemplaza que `Session` mantenga `self.memory` entre turnos.

El `system_prompt` incluye el flujo sugerido (pasos 1–6) — igual que en scratch el system message guía a `fake_llm`, pero el LLM real puede adaptarse si una tool falla.

#### Bloque 4 — Demo de dos turnos (líneas 124–163)

```python
config = {"configurable": {"thread_id": "demo-001"}}

result1 = agent.invoke({"messages": [HumanMessage(content=turno1)]}, config=config)
# ... más tarde, mismo config:
result2 = agent.invoke({"messages": [HumanMessage(content=turno2)]}, config=config)
```

**Puente scratch:** equivale a llamar `chat(session, turno1)` y luego `chat(session, turno2)` con la **misma** `session`. El `thread_id` es la sesión; no necesitas `_find_in_memory` porque el checkpointer guarda el historial completo de mensajes.

**Qué deberías ver al ejecutar (con API key):**
- Turno 1: secuencia `consultar_reserva` → `consultar_politica` → respuesta con total **USD 130**.
- Turno 2: el agente confirma el cambio citando PNR y costo **sin** volver a llamar `consultar_reserva`.

#### Bloque 5 — StateGraph explícito comentado (líneas 166–234)

La sección comentada al final del archivo muestra la alternativa avanzada. Pieza por pieza:

| Fragmento comentado | Equivalente en scratch |
|---------------------|------------------------|
| `FlightChangeState` con `Annotated[list, add_messages]` | `session.memory` + campos extra (`pnr`, `penalty`…) |
| `node_call_tools` | Bloque `TOOLS[tool_name](**args)` dentro del `while` |
| `should_continue` → `"tools"` o `"end"` | `if "action" in response` vs `if "final" in response` |
| `add_node("agent", ...)` | Llamada a `fake_llm(memory)` |
| `add_conditional_edges("agent", should_continue, ...)` | El `if/else` que decide si seguir iterando |
| `add_edge("tools", "agent")` | `memory.append(...)` + siguiente iteración del `while` |
| `graph.compile(checkpointer=MemorySaver())` | `Session` con memoria persistente |

Si descomentaras y completaras ese bloque (necesitarías además `llm.bind_tools(TOOLS)` para obtener `llm_with_tools`), tendrías control explícito sobre qué campos de estado se actualizan en cada tool call — algo que en scratch hacías con `_find_in_memory` y líneas `pnr:...` en la respuesta del asistente.

### 8.9 Cuándo usar cada enfoque y gotchas finales

| Situación | Usa | Por qué |
|-----------|-----|---------|
| Prototipo rápido, agente conversacional estándar | `create_react_agent` | 10 líneas; el bucle ReAct ya está cableado |
| Guardrails entre pasos, estado estructurado extra, subgrafos | `StateGraph` explícito | Ves y controlas cada nodo y arista |
| Flujo 100 % determinista (sin LLM decidiendo el orden) | `StateGraph` sin nodo LLM | §9 — Plan-and-Execute o pipeline |
| Multi-agente (M7) | `StateGraph` con varios nodos-agente | Supervisor, fan-out, etc. |

**Gotchas que aparecen en producción:**

1. **Docstrings pobres → tools mal usadas.** El LLM solo conoce tus tools por su descripción. Invierte tiempo en el docstring como si fuera un prompt.
2. **`add_messages` acumula — no reemplaza.** Si un nodo devuelve `{"messages": [msg]}`, se añade al historial. Para resetear una sesión, usa un `thread_id` nuevo.
3. **Mismo `thread_id` = misma sesión.** Documenta esto en tu API: cada conversación de usuario necesita su propio ID.
4. **`temperature` alta en agentes** → más creatividad pero tool calls inconsistentes. Para agentes transaccionales (cambio de vuelo, pagos), usa `0.0`–`0.2`.
5. **`create_react_agent` tiene `max_iterations` interno** — si el LLM entra en bucle llamando la misma tool, el grafo termina con error. En scratch lo controlabas con `MAX_STEPS = 8`.

### 8.10 Checklist antes de escribir tu `solucion_framework.py`

- [ ] ¿Tienes las dos `@tool` con docstrings que explican **cuándo** usarlas?
- [ ] ¿El `system_prompt` guía el flujo (reserva → política → cálculo → confirmación)?
- [ ] ¿`MemorySaver()` está en `create_react_agent(..., checkpointer=...)`?
- [ ] ¿Usas el **mismo** `config` con `thread_id` en ambos turnos?
- [ ] ¿Entrada de cada `invoke` es `{"messages": [HumanMessage(...)]}`?
- [ ] *(Reto)* ¿Puedes dibujar el grafo `agent → tools → agent` y señalar qué línea de scratch corresponde a cada arista?

**Siguiente paso:** abre `lab/enunciado.md` (Parte B) e intenta escribir el archivo tú mismo antes de mirar `solucion_framework.py`. Usa este checklist y la tabla puente de §8.2.

---

> **Más allá de Lang\*:** este mismo agente de cambio de vuelo está resuelto con un **loop nativo del SDK (sin framework)**, **CrewAI**, **AutoGen/AG2** y **Pydantic-AI** en [`../referencia/agentes-sin-langchain.md`](../referencia/agentes-sin-langchain.md). Empieza entendiendo el bucle ReAct a mano (capa ②): así puedes usar LangGraph **o cualquier otro** framework con criterio.

---

## 9. Comparativa: ReAct vs Plan-and-Execute vs Reflexion

| | ReAct | Plan-and-Execute | Reflexion |
|---|---|---|---|
| **Estrategia** | Razonar y actuar en cada paso | Planificar todo, luego ejecutar | ReAct + evaluación + memoria de errores |
| **Flexibilidad** | Alta (adapta el plan según observaciones) | Baja (el plan es fijo) | Alta |
| **Costo LLM** | Medio (N pasos) | Mayor (plan + N pasos) | Alto (N pasos + evaluaciones) |
| **Latencia** | Media | Alta (espera el plan completo) | Alta |
| **Cuándo usarlo** | Mayoría de agentes conversacionales | Tareas largas con muchos pasos bien definidos | Problemas difíciles con evaluación automática |
| **Riesgo** | El plan puede derivar en mitad de la tarea | Si el plan es malo, todo falla | El evaluador puede ser incorrecto |
| **Ejemplo** | Cambio de vuelo (3-5 tools) | Investigación con 20 fuentes | Resolución de problemas de código |
| **En RAGorbit** | `agent.react` | No hay nodo; se implementa en LangGraph | No hay nodo; se implementa con tools de eval |

**Cuándo elegir cada uno:**

- **ReAct**: siempre es el punto de partida. Funciona para la gran mayoría de agentes transaccionales y conversacionales.
- **Plan-and-Execute**: cuando tienes tareas muy largas donde el agente se "pierde" si no tiene un plan explícito. Raro en producción de servicios al cliente.
- **Reflexion**: cuando el agente opera en modo *batch* (sin esperar al usuario en tiempo real) y tienes una función de evaluación confiable.

---

## 10. Nodos RAGorbit de este módulo

### `agent.react` — Nodo orquestador

```
Puertos de entrada:
  → Model   (requerido)   — el LLM que razona
  → Tool    (n)           — herramientas disponibles
  → Retriever (n)         — retrievers directos (sin tool.retriever)
  → Message               — mensaje del usuario

Puerto de salida:
  Message →               — respuesta final + arista loop para ciclo ReAct
```

Configuración clave:
```json
{
  "system":   "Prompt de sistema del agente",
  "maxSteps": 8,
  "streaming": true
}
```

### `tool.service` — Tool hacia servicio HTTP

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

### `tool.retriever` — RAG como tool

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

### `tool.function` — Función Python custom

```json
{
  "name":      "calcular_total",
  "signature": "(penalty: float, delta: float) -> float",
  "body":      "return penalty + delta"
}
```

---

## 11. Conexión con los templates de industria

### Template 01 · Aerolínea

El template más completo de agente en RAGorbit. Combina:
- `agent.react` como orquestador central.
- 4 `tool.service` (reserva, inventario, precios, pago).
- 1 `tool.retriever` (PolicyRAG sobre fare rules).
- 3 guardrails en cadena sobre el pago.
- `observability.audit` con sink Kafka.

Ver [`examples/01-airline-flight-change/README.md`](../../examples/01-airline-flight-change/README.md) y [`flow.json`](../../examples/01-airline-flight-change/flow.json).

### Template 06 · Retail Post-Venta

Similar pero más sencillo. El agente gestiona pedidos, devoluciones y recomendaciones.
- `guardrail.confirm` para devoluciones > $200.
- `guardrail.idempotency` para evitar devoluciones duplicadas.

Ver [`examples/06-retail-postsale-bot/README.md`](../../examples/06-retail-postsale-bot/README.md).

### Template 07 · Telecom Copilot

Ejemplo de **Agentic RAG con routing multi-índice**:
- No usa `agent.react` en el sentido tradicional — es un pipeline con `tool.retriever` en el centro.
- `model.intent` como compuerta: solo activa el RAG para fragmentos accionables.
- Tres `tool.retriever` para tres índices distintos (policy, procedure, faq).
- `observability.feedback` para mejorar el reranker continuamente.

Ver [`examples/07-telecom-callcenter-copilot/README.md`](../../examples/07-telecom-callcenter-copilot/README.md).

---

## 12. Checkpoint — Lo sabes si puedes…

- [ ] Explicar en qué momento un agente ReAct es mejor que un pipeline fijo (y viceversa).
- [ ] Dibujar el bucle ReAct (razonar → actuar → observar) para un caso concreto.
- [ ] Describir qué información va en el historial de mensajes y qué en el estado del agente.
- [ ] Explicar por qué Reflexion no modifica los pesos del modelo.
- [ ] Describir cómo `tool.retriever` convierte un índice vectorial en una herramienta del agente.
- [ ] Explicar qué hace `@tool` (docstring → descripción, type hints → schema) y cómo se invoca con `.invoke()`.
- [ ] Construir un agente con `create_react_agent` + `MemorySaver` + `thread_id` para dos turnos con memoria.
- [ ] Dibujar el grafo `agent ↔ tools` de un `StateGraph` explícito y mapearlo al `while` de tu scratch.
- [ ] Distinguir cuándo usar `create_react_agent` (rápido) vs `StateGraph` explícito (control).
- [ ] Leer el `flow.json` del template 01 e identificar todos los nodos `tool.*` y sus guardrails.

**Si no puedes:** repasa §3 (ReAct), §4 (memoria), §8 (LangGraph) y el [lab/enunciado.md](lab/enunciado.md). Consulta el template 01 como ejemplo concreto.

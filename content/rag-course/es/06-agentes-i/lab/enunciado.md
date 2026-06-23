# Lab M6 · Agente ReAct con Memoria — Cambio de Vuelo

## Brief de negocio

Eres ingeniero en una aerolínea regional. El equipo de experiencia al cliente quiere un prototipo del agente conversacional que manejará cambios de vuelo. El sistema debe:

1. Recibir el mensaje del pasajero.
2. Razonar qué información necesita (itinerario, política tarifaria, precio del cambio).
3. Llamar las herramientas necesarias en el orden correcto.
4. Responder al pasajero con el costo detallado del cambio.
5. En un segundo turno, cuando el pasajero confirme, **recordar el contexto** del turno anterior (PNR, vuelo elegido, costo total) sin volver a llamar todas las herramientas.

## Datos disponibles

En `lab/datos/` encontrarás:
- `reservas.json` — base de datos mock de reservas por PNR.
- `politica.json` — penalidades de cambio por clase tarifaria.
- `vuelos.json` — inventario de vuelos disponibles con precios.

## Las dos tools mock

| Tool | Qué hace | Argumentos |
|------|----------|------------|
| `consultar_reserva(pnr)` | Devuelve el itinerario del pasajero | `pnr: str` |
| `consultar_politica(fare_class, route_type)` | Devuelve la penalidad de cambio | `fare_class: str`, `route_type: str` |

> **Nota:** En el lab no hay `InventoryService` ni `PricingService` separados — el precio del nuevo vuelo viene del campo `price` en `vuelos.json` y el diferencial se calcula localmente. El agente tiene acceso a los datos de vuelos directamente (es un simplificación para el taller).

## Tarea

### Parte A — Agente desde cero (capa ②)

Implementa `lab/solucion_scratch.py` con:

1. Un **LLM falso determinista** (`fake_llm`) que, dado el historial de mensajes, decide la siguiente acción. Debe ser completamente determinista (sin `random`, sin llamadas a red).

2. Las tools `consultar_reserva` y `consultar_politica` como funciones Python que leen los JSON de `datos/`.

3. El **bucle ReAct**: un `while` que itera hasta que el LLM emite una respuesta final o se alcanza `MAX_STEPS = 8`.

4. **Memoria conversacional**: una lista de mensajes que se pasa completa al LLM en cada iteración y se mantiene entre turnos.

5. Una función `chat(session, user_message) -> str` que:
   - Agrega el mensaje del usuario a la memoria de la sesión.
   - Ejecuta el bucle ReAct.
   - Agrega la respuesta final a la memoria.
   - Devuelve la respuesta.

6. Un bloque `if __name__ == "__main__":` que simula la conversación de dos turnos:
   - **Turno 1:** el pasajero pide cambiar el vuelo con PNR `SCL-BOG-001` del 15 al 17 de junio.
   - **Turno 2:** el pasajero confirma ("Sí, confirmo el cambio.").

### Parte B — Agente con LangGraph (capa ③, tarea guiada)

> **Lee primero:** [guia.md §8 — La capa ③ explicada: LangGraph desde cero](guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo). Esta sección te enseña cada API que necesitas. No copies `solucion_framework.py` de golpe — escríbelo tú siguiendo las pistas.

**Objetivo:** reimplementar el mismo agente del scratch usando LangGraph + LangChain, con memoria entre dos turnos. Al terminar, compara tu archivo con `lab/solucion_framework.py`.

**Requisitos de entorno** (fuera de la máquina del curso):

```bash
pip install langgraph langchain langchain-anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

#### Paso B.1 — Tools con `@tool`

1. Copia la carga de datos de tu scratch (o de `solucion_scratch.py`).
2. Convierte `consultar_reserva` y `consultar_politica` en tools decoradas con `@tool` de `langchain_core.tools`.
3. Escribe docstrings **ricos**: deben decir al LLM **cuándo** usar cada tool (ver §8.3 de la guía).
4. Crea `TOOLS = [consultar_reserva, consultar_politica]`.

**Comprueba:** ¿puedes invocar `consultar_reserva.invoke({"pnr": "SCL-BOG-001"})` y obtener el mismo dict que en scratch?

#### Paso B.2 — `build_agent()` con `create_react_agent`

1. Instancia `ChatAnthropic` (recuerda M1 §11.9).
2. Crea `checkpointer = MemorySaver()`.
3. Escribe un `system_prompt` que guíe el flujo: reserva → política → cálculo → confirmación (como en scratch).
4. Llama a `create_react_agent(model=..., tools=TOOLS, prompt=..., checkpointer=...)`.

**Pista:** `create_react_agent` es tu `react_loop` + `while` empaquetados. Mira la tabla puente en guía §8.2.

#### Paso B.3 — Dos turnos con `thread_id`

1. Define `config = {"configurable": {"thread_id": "demo-001"}}`.
2. **Turno 1:** `agent.invoke({"messages": [HumanMessage(content=turno1)]}, config=config)`.
3. **Turno 2:** mismo `config`, nuevo `HumanMessage("Sí, confirmo el cambio.")`.
4. Imprime `result["messages"][-1].content` en cada turno.

**Comprueba:** en el Turno 2, ¿el agente menciona el PNR y USD 130 sin volver a llamar `consultar_reserva`?

#### Paso B.4 — Compara con la solución

Abre `lab/solucion_framework.py` bloque por bloque (guía §8.8). Anota diferencias en docstrings, prompt o estructura.

#### Reto opcional — `StateGraph` explícito

Si dominas los pasos anteriores, descomenta y completa la sección al final de `solucion_framework.py`:

1. Define `FlightChangeState` con `Annotated[list, add_messages]`.
2. Implementa `node_call_tools` y `should_continue`.
3. Construye el grafo: `agent → (condicional) → tools → agent → END`.
4. Compila con `checkpointer=MemorySaver()`.

**Pregunta de cierre:** ¿qué línea de tu `while` en scratch corresponde a cada arista del grafo? (guía §8.7.4)

> Esta parte es ilustrativa en el entorno del curso (sin pip/red). Escríbela aunque no puedas ejecutarla aquí.

## Escenario de prueba

**Datos del pasajero:**
- PNR: `SCL-BOG-001`
- Pasajero: Ana García
- Vuelo actual: LA501 — SCL→BOG — 15 junio 2026
- Clase tarifaria: `ECONOMY_FLEX`

**Vuelos disponibles el 17 de junio:**
- FL301 — salida 08:30 — precio base $320
- FL305 — salida 14:45 — precio base $295

**Política ECONOMY_FLEX internacional:**
- Penalidad de cambio: $50

**Cálculo esperado:**
- El vuelo actual tenía precio base $215 (ver `reservas.json`).
- El pasajero elige FL305 (más económico que FL301).
- Diferencial: $295 - $215 = $80.
- Penalidad: $50.
- **Total: $130**.

## Pistas escalonadas

### Pista 1 — Estructura del fake_llm

```python
def fake_llm(messages: list) -> dict:
    """
    LLM falso determinista. Lee el último mensaje para decidir qué hacer.
    Devuelve:
      {"action": "nombre_tool", "args": {...}}  — si necesita llamar una tool
      {"final": "texto de respuesta"}            — si tiene toda la info
    """
    # Inspecciona el historial para ver qué se ha hecho ya
    tool_calls_done = [m["name"] for m in messages if m.get("role") == "tool"]
    last_user = next((m["content"] for m in reversed(messages)
                      if m["role"] == "user"), "")
    ...
```

### Pista 2 — Estructura del bucle ReAct

```python
def react_loop(memory: list) -> str:
    for step in range(MAX_STEPS):
        response = fake_llm(memory)
        if "final" in response:
            return response["final"]
        # ejecutar tool y agregar a memoria...
    return "Alcancé el límite de pasos."
```

### Pista 3 — Detección de confirmación en turno 2

El segundo turno debe detectar que el usuario confirmó y, en lugar de repetir todas las tool calls, usar el estado ya guardado en la memoria para ejecutar la acción de cambio y responder.

```python
CONFIRM_WORDS = ("sí", "si,", "si ", "confirmo", "acepto", "de acuerdo")
is_confirm = any(w in last_user.lower() for w in CONFIRM_WORDS)
```

### Pista 4 — Cómo calcular el diferencial

```python
# El vuelo actual tiene un precio base guardado en reservas.json
# El precio del vuelo nuevo está en vuelos.json
# diferencial = precio_nuevo - precio_base_actual
# total = penalidad + diferencial
```

## Criterios de aceptación

1. `python3 -m py_compile lab/solucion_scratch.py` no da errores.
2. `python3 lab/solucion_scratch.py` imprime la secuencia de tool calls y la respuesta final del Turno 1.
3. El Turno 2 imprime que recuerda el contexto (menciona el PNR y el costo de $130) sin volver a llamar `consultar_reserva`.
4. La respuesta del Turno 1 menciona el costo total de **$130** (penalidad $50 + diferencial $80).
5. Solo stdlib: no hay imports de `langchain`, `openai`, `anthropic`, `requests` ni similares.

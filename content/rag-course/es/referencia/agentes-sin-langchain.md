# Agentes sin LangGraph — el mismo asistente de cambio de vuelo con tecnologías competidoras

> **Para quién es este documento:** ya completaste la capa ② del taller de M6 (`06-agentes-i/lab/solucion_scratch.py`): bucle ReAct a mano, registro de tools, memoria conversacional. También viste LangGraph en M6 §8 y, si llegaste a M7, frameworks multi-agente en §9. Aquí **no repetimos LangGraph** — lo usamos como línea base y construimos el **mismo agente de cambio de vuelo** (template 01 · aerolínea, taller M6) con las alternativas que el mercado ofrece en 2025–2026.
>
> **Caso fijo en todos los enfoques:** pasajero con PNR `SCL-BOG-001` pide cambiar del 15 al 17 de junio; el agente llama `consultar_reserva` y `consultar_politica`, calcula **USD 130** (penalidad USD 50 + diferencial USD 80), pide confirmación y **solo en el turno 2** confirma el cobro. Dos tools, memoria entre turnos, confirmación antes de actuar.
>
> **Entorno:** en la máquina del curso no hay `pip` ni red. Todo el código de este documento es **ilustrativo** — ejecútalo cuando tengas las dependencias y una API key. Cabecera obligatoria: `# Requiere: pip install ...`.

---

## Introducción — por qué aprender agentes sin LangGraph

LangGraph es el framework de producción del curso y de RAGorbit: grafos explícitos, checkpoints, guardrails como aristas condicionales. Pero un ingeniero de IA completo debe poder **nombrar y escribir** el mismo patrón ReAct con otras herramientas — no solo copiar `create_react_agent`.

Razones concretas para dominar las alternativas:

1. **Menor dependencia** — un script de 80 líneas con el SDK de Anthropic o OpenAI puede ser todo lo que necesitas; sin LangChain encima.
2. **Equipos heterogéneos** — tu empresa puede estandarizar CrewAI (roles declarativos), Pydantic-AI (tipado estricto) o AG2 (exploración conversacional).
3. **Entrevistas y diseño** — "¿por qué no AutoGen para pagos?" exige comparar modelos mentales, no memorizar una API.
4. **El mecanismo no cambia** — en todos los frameworks ocurre lo mismo que en tu scratch: el LLM razona → elige una tool → observas el resultado → repites hasta respuesta final.

### Tabla puente universal — capa ② → cada framework

Esta tabla extiende la de M6 §8.8.2 a **todas** las tecnologías de este documento. Es tu mapa mental antes de leer cada sección.

| Lo que hiciste a mano (capa ②) | Loop nativo (SDK) | LangGraph (M6 §8) | CrewAI | AutoGen / AG2 | Pydantic-AI |
|--------------------------------|-------------------|-------------------|--------|---------------|-------------|
| `TOOLS = {"consultar_reserva": fn, ...}` | Lista de dicts JSON Schema + dict `IMPLEMENTACIONES` | Lista de `@tool` LangChain | `@tool` CrewAI o funciones en `Agent.tools` | `register_function` caller + executor | `@agent.tool` / `@agent.tool_plain` |
| Docstring + type hints → schema | `input_schema` en cada tool (Anthropic) o `parameters` (OpenAI) | Docstring → schema automático | Descripción en `@tool` o en `register_function` | `description` en `register_function` | Docstring + hints → schema Pydantic |
| `fake_llm(memory)` | `client.messages.create(...)` / `chat.completions.create(...)` | `ChatAnthropic.invoke` | LLM del `Agent` (p. ej. `ChatAnthropic`) | `ConversableAgent` + `llm_config` | `Agent(model='anthropic:...')` |
| `while step < MAX_STEPS:` | `while response.stop_reason == "tool_use":` | `create_react_agent` o `StateGraph` | `Crew.kickoff` / tasks encadenadas | `initiate_chat` / `GroupChat` | Loop interno del `Agent.run_sync` |
| `memory.append({"role": "tool", ...})` | Mensaje `role: "user"` con `tool_result` (Anthropic) o `role: "tool"` (OpenAI) | `ToolMessage` automático | Output de task → `context` de la siguiente | Respuesta del executor al caller | Historial en `result.all_messages()` |
| `session.memory` entre turnos | Misma lista `messages` reutilizada | `MemorySaver` + `thread_id` | Memoria de crew / historial en tasks | Historial del chat entre agentes | `message_history` en `run_sync` |
| `_find_in_memory(messages, "pnr")` | El LLM lee el historial completo | Checkpointer restaura estado | `context=[task_anterior]` | Mensajes acumulados en el chat | `RunContext` + deps tipadas |
| Confirmación antes de cobrar | Instrucción en system prompt + lógica en tu código | Arista condicional o prompt | `expected_output` + instrucciones en Task | `human_input_mode` en UserProxy | `result_type` + validadores Pydantic |

**Modelo mental compartido:** el framework (o tu `while`) implementa el **protocolo de tool calling** del proveedor. Tú defines qué hace cada tool; el LLM decide cuándo llamarla.

---

## 1. Loop nativo con el SDK del proveedor (sin framework)

### 1.1 ¿Necesitas un framework de agentes?

**Respuesta corta:** no, si tienes **un agente**, **pocas tools** (2–5), **memoria = lista de mensajes** y quieres **máximo control con mínima dependencia**.

Un framework aporta valor cuando necesitas:

- Checkpoints durables (Postgres, SQLite) entre reinicios
- Grafos con ramas condicionales explícitas (HITL, fan-out)
- Integración estándar con 15+ proveedores sin reescribir el bucle
- Observabilidad plug-and-play (LangSmith, etc.)

Para el taller M6 — un chat de aerolínea con dos tools — el SDK nativo **basta**. Es la capa ③ más cercana a tu scratch: tú sigues siendo el framework, pero el LLM es real.

### 1.2 Tabla puente — scratch → SDK nativo

| Scratch (`solucion_scratch.py`) | SDK nativo |
|-----------------------------------|------------|
| `TOOLS[name](**args)` | Función Python + entrada en `IMPLEMENTACIONES` |
| `fake_llm` devuelve `{"action": ..., "args": ...}` | El modelo devuelve bloques `tool_use` (Anthropic) o `tool_calls` (OpenAI) |
| `memory.append({"role": "tool", "content": ...})` | Devuelves `tool_result` al modelo en el siguiente request |
| `react_loop(memory)` | `while` que solo termina cuando no hay más tool calls |
| `Session.memory` | La misma lista `messages` entre `chat()` |

### 1.3 Tool-calling con Anthropic — APIs pieza por pieza

#### Definir tools como JSON Schema

Anthropic espera un array `tools` con `name`, `description` e `input_schema` (JSON Schema):

```python
TOOLS_SCHEMA = [
    {
        "name": "consultar_reserva",
        "description": (
            "Obtiene el itinerario de una reserva. "
            "Úsala cuando el pasajero proporcione su PNR (formato XXX-XXX-NNN)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pnr": {
                    "type": "string",
                    "description": "Número de reserva, ej: SCL-BOG-001",
                }
            },
            "required": ["pnr"],
        },
    },
    {
        "name": "consultar_politica",
        "description": (
            "Devuelve penalidad y condiciones de cambio. "
            "Úsala DESPUÉS de consultar_reserva, con fare_class y route_type del itinerario."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "fare_class": {"type": "string"},
                "route_type": {"type": "string", "enum": ["nacional", "internacional"]},
            },
            "required": ["fare_class", "route_type"],
        },
    },
]
```

Equivale a tu registro manual `TOOLS = {...}` más la metadata que antes ponías en docstrings.

#### El bucle manual — razonar → actuar → observar

```python
# Fragmento del patrón (no es el archivo completo)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    system=SYSTEM_PROMPT,
    tools=TOOLS_SCHEMA,
    messages=messages,  # historial acumulado
)

while response.stop_reason == "tool_use":
    # 1. Extraer tool_use blocks del response.content
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            fn = IMPLEMENTACIONES[block.name]
            result = fn(**block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False),
            })
    # 2. Añadir respuesta del asistente + resultados al historial
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})
    # 3. Volver a llamar al modelo
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=TOOLS_SCHEMA,
        messages=messages,
    )
# response.stop_reason == "end_turn" → texto final en content
```

**Diferencia clave con OpenAI:** en la API de Chat Completions, los resultados van en mensajes `role: "tool"` con `tool_call_id`, no en un bloque `tool_result` dentro de un mensaje `user`. El bucle es el mismo; cambia el formato de los mensajes.

#### Memoria = lista de mensajes

No hay `MemorySaver`: reutilizas la misma lista `messages` entre turnos del usuario. Equivale exactamente a `Session` del scratch.

### 1.4 Mini-implementación comentada — caso cambio de vuelo

```python
# Requiere: pip install anthropic
"""
Agente de cambio de vuelo — loop nativo Anthropic (sin LangChain/LangGraph).
Mismo caso que 06-agentes-i/lab/solucion_scratch.py y solucion_framework.py.
"""

import json
import os
from pathlib import Path

import anthropic

# --- Datos mock (misma carpeta datos/ del lab M6) ---
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"  # copia o symlink a 06-agentes-i/lab/datos/

RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))

# --- Implementaciones de tools (capa ②: funciones puras) ---

def consultar_reserva(pnr: str) -> dict:
    return RESERVAS.get(pnr, {"error": f"No se encontró reserva con PNR {pnr!r}"})


def consultar_politica(fare_class: str, route_type: str) -> dict:
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            return regla
    return {"error": f"No hay política para {fare_class!r} / {route_type!r}"}


IMPLEMENTACIONES = {
    "consultar_reserva": consultar_reserva,
    "consultar_politica": consultar_politica,
}

TOOLS_SCHEMA = [
    {
        "name": "consultar_reserva",
        "description": "Obtiene itinerario dado el PNR del pasajero.",
        "input_schema": {
            "type": "object",
            "properties": {"pnr": {"type": "string"}},
            "required": ["pnr"],
        },
    },
    {
        "name": "consultar_politica",
        "description": "Penalidad de cambio según fare_class y route_type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fare_class": {"type": "string"},
                "route_type": {"type": "string"},
            },
            "required": ["fare_class", "route_type"],
        },
    },
]

SYSTEM_PROMPT = """Eres un asistente de cambios de vuelo.
Flujo: (1) consultar_reserva con el PNR, (2) consultar_politica con fare_class y route_type,
(3) calcula total = penalidad + max(0, precio_nuevo - precio_base). Vuelo alternativo
más económico en la misma ruta para el 17 de junio 2026: LA503 a USD 295 (asume este dato
si no tienes otra fuente). (4) Presenta desglose y pide confirmación. (5) Si el pasajero
confirma en un mensaje posterior, confirma el cambio sin volver a llamar las tools."""

MAX_STEPS = 8


def _texto_final(content) -> str:
    """Extrae texto de bloques text del último response."""
    partes = []
    for block in content:
        if hasattr(block, "text"):
            partes.append(block.text)
        elif isinstance(block, dict) and block.get("type") == "text":
            partes.append(block["text"])
    return "\n".join(partes)


def react_loop_nativo(client: anthropic.Anthropic, messages: list) -> str:
    """
    Bucle ReAct — equivalente directo a react_loop() del scratch.
    Modifica messages in-place (memoria entre pasos y entre turnos).
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=TOOLS_SCHEMA,
        messages=messages,
    )

    for step in range(MAX_STEPS):
        if response.stop_reason != "tool_use":
            texto = _texto_final(response.content)
            messages.append({"role": "assistant", "content": response.content})
            return texto

        # --- Actuar: ejecutar cada tool_use ---
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            fn = IMPLEMENTACIONES.get(block.name)
            if not fn:
                result = {"error": f"Tool desconocida: {block.name}"}
            else:
                result = fn(**block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result, ensure_ascii=False),
            })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=messages,
        )

    return "Alcancé el límite de pasos sin poder responder."


class Session:
    """Memoria conversacional — misma idea que Session del scratch."""

    def __init__(self, client: anthropic.Anthropic):
        self.client = client
        self.messages: list = []

    def chat(self, user_message: str) -> str:
        self.messages.append({"role": "user", "content": user_message})
        return react_loop_nativo(self.client, self.messages)


def main():
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    session = Session(client)

    print(">>> TURNO 1")
    r1 = session.chat(
        "Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio."
    )
    print(r1)

    print("\n>>> TURNO 2")
    r2 = session.chat("Sí, confirmo el cambio.")
    print(r2)


if __name__ == "__main__":
    main()
```

### 1.5 Recorrido bloque por bloque

| Bloque | Equivalente scratch |
|--------|---------------------|
| `IMPLEMENTACIONES` + `TOOLS_SCHEMA` | `TOOLS` dict + docstrings |
| `react_loop_nativo` | `react_loop` |
| `while response.stop_reason == "tool_use"` | `while step < MAX_STEPS` sin `"final"` |
| `tool_results` con `tool_use_id` | `memory.append({"role": "tool", ...})` |
| `Session.messages` | `Session.memory` |
| `SYSTEM_PROMPT` con flujo obligatorio | `Session.SYSTEM` |

### 1.6 Cuándo usar / cuándo NO

| Usa loop nativo | Evítalo si |
|-----------------|------------|
| 1 agente, 2–5 tools, un proveedor LLM | Necesitas fan-out de miles de eventos (template 10) |
| Quieres depurar cada request/response HTTP | Requieres subgrafos, HITL como aristas, checkpoints en Postgres |
| Proyecto pequeño, pocas dependencias | El equipo ya invirtió en LangGraph + LangSmith |
| Prototipo antes de elegir framework | Cambias de proveedor cada semana sin capa de abstracción |

**Gotchas:**

1. **Formato de mensajes distinto por proveedor** — migrar de Anthropic a OpenAI implica reescribir el bucle de mensajes; LangChain abstrae eso.
2. **Sin checkpoint en disco** — si el proceso muere, pierdes la sesión (como `MemorySaver` en RAM).
3. **El LLM puede repetir tools** — en scratch lo evitabas con `called = _tools_called(messages)`; aquí dependes del prompt o añades lógica en tu bucle.
4. **Versión del SDK** — Anthropic SDK ≥ 0.40 usa objetos tipados en `response.content`; ejemplos antiguos con dicts puros siguen funcionando con `.model_dump()`.

---

## 2. CrewAI — equipos por roles

### 2.1 Qué es CrewAI y por qué existe

CrewAI modela un **equipo de trabajo**: cada miembro tiene `role`, `goal` y `backstory` (persona fija). Las `Task` encadenan el trabajo; `Crew` con `Process.sequential` o `Process.hierarchical` define el orden.

**Diferencia con LangGraph:** CrewAI es **declarativo por roles** ("analista", "calculador"); LangGraph es **declarativo por grafo** (nodos y aristas). **Diferencia con M7:** en M7 §9 ya viste CrewAI aplicado a **logística** (clasificador → investigador → ejecutor). Aquí aplicamos CrewAI al **mismo caso de aerolínea** de M6, con una división distinta: especialización por subtarea del rebooking, no por fan-out de eventos.

### 2.2 Tabla puente — scratch → CrewAI (caso vuelo)

| Scratch | CrewAI (este documento) |
|---------|-------------------------|
| Un solo `fake_llm` que hace todo | Dos agentes: analista de itinerario + calculador de costos |
| Secuencia implícita en el bucle | `Process.sequential`: task 1 → task 2 |
| `consultar_reserva` + `consultar_politica` | Tools del agente analista |
| Cálculo de precio en el LLM | Task del calculador con contexto del analista |
| Dos turnos con `Session.memory` | Turno 2 = nuevo `kickoff` con memoria vía `context` o input con historial |

### 2.3 APIs pieza por pieza

#### `@tool` de CrewAI

Desde CrewAI 0.7x+, el decorador `@tool` es el recomendado (antes `@tool` vivía solo en LangChain):

```python
from crewai.tools import tool

@tool("consultar_reserva")
def consultar_reserva(pnr: str) -> dict:
    """Obtiene el itinerario completo dado el PNR."""
    ...
```

CrewAI también acepta tools de LangChain (`langchain_core.tools.tool`) — como en `07-agentes-ii/lab/solucion_framework.py`.

#### `Agent` — role / goal / backstory

```python
from crewai import Agent

analista = Agent(
    role="Analista de itinerario",
    goal="Obtener reserva y política de cambio del pasajero",
    backstory="Especialista en PNR y reglas tarifarias internacionales.",
    tools=[consultar_reserva, consultar_politica],
    llm=llm,
    verbose=True,
)
```

`role` + `goal` + `backstory` ≈ el `SYSTEM` del scratch, pero **especializado** por agente.

#### `Task` — descripción + contexto encadenado

```python
from crewai import Task

task_itinerario = Task(
    description=(
        "El pasajero dice: '{solicitud}'. "
        "Usa consultar_reserva con el PNR y consultar_politica con fare_class y route_type. "
        "Devuelve JSON con pnr, passenger, fare_class, penalidad_usd, cambio_permitido."
    ),
    expected_output="JSON con datos de reserva y política",
    agent=analista,
)

task_costos = Task(
    description=(
        "Con el itinerario y la política del contexto, calcula el cambio al 17 de junio 2026. "
        "Vuelo LA503 a USD 295. base_price del JSON. "
        "total = penalidad + max(0, 295 - base_price). "
        "Presenta desglose y pregunta si confirma. NO cobres sin confirmación."
    ),
    expected_output="Propuesta con desglose USD y pregunta de confirmación",
    agent=calculador,
    context=[task_itinerario],  # recibe output de la task anterior
)
```

`context=[task_itinerario]` ≈ pasar el resultado de `consultar_reserva` al siguiente paso del scratch.

#### `Crew` y `Process`

```python
from crewai import Crew, Process

crew = Crew(
    agents=[analista, calculador],
    tasks=[task_itinerario, task_costos],
    process=Process.sequential,
    verbose=True,
)

resultado = crew.kickoff(inputs={"solicitud": "Cambiar SCL-BOG-001 del 15 al 17 de junio"})
```

- `Process.sequential` — A termina → B empieza (pipeline fijo).
- `Process.hierarchical` — un agente "manager" delega (útil si añades un revisor de compliance).

### 2.4 Mini-crew del caso — analista + calculador

```python
# Requiere: pip install crewai langchain-anthropic
"""
Cambio de vuelo con CrewAI — dos roles, Process.sequential.
Complementa M6 (un solo agente) y M7 §9 (CrewAI logística, no duplicado aquí).
"""

import json
import os
from pathlib import Path

from crewai import Agent, Crew, Process, Task
from crewai.tools import tool
from langchain_anthropic import ChatAnthropic

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


@tool("consultar_reserva")
def consultar_reserva(pnr: str) -> dict:
    """Obtiene itinerario dado el PNR (formato XXX-XXX-NNN)."""
    return RESERVAS.get(pnr, {"error": f"PNR no encontrado: {pnr}"})


@tool("consultar_politica")
def consultar_politica(fare_class: str, route_type: str) -> dict:
    """Penalidad y condiciones de cambio para fare_class y route_type."""
    for r in POLITICA["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return r
    return {"error": "Política no encontrada"}


def build_crew():
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=0.1,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )

    analista = Agent(
        role="Analista de itinerario",
        goal="Recuperar reserva y política de cambio",
        backstory="Experto en PNR y tarifas LATAM.",
        tools=[consultar_reserva, consultar_politica],
        llm=llm,
    )

    calculador = Agent(
        role="Calculador de costos",
        goal="Calcular total del rebooking y pedir confirmación",
        backstory="Nunca cobra sin confirmación explícita del pasajero.",
        llm=llm,
    )

    t1 = Task(
        description="Solicitud del pasajero: '{solicitud}'. Llama las tools necesarias.",
        expected_output="JSON: pnr, passenger, fare_class, base_price, penalidad_usd",
        agent=analista,
    )

    t2 = Task(
        description=(
            "Calcula cambio al 17-jun-2026 con vuelo LA503 (USD 295). "
            "total = penalidad + max(0, 295 - base_price). Desglose y pide confirmación."
        ),
        expected_output="Propuesta con total USD y pregunta de confirmación",
        agent=calculador,
        context=[t1],
    )

    return Crew(
        agents=[analista, calculador],
        tasks=[t1, t2],
        process=Process.sequential,
        verbose=True,
    )


def main():
    crew = build_crew()

    # Turno 1 — cotización
    r1 = crew.kickoff(inputs={
        "solicitud": "Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio."
    })
    print("TURNO 1:", r1)

    # Turno 2 — confirmación (nuevo kickoff con historial en el input)
    r2 = crew.kickoff(inputs={
        "solicitud": (
            "El pasajero confirma el cambio. Contexto previo: " + str(r1) +
            ". Responde con confirmación de cobro USD 130 y nuevo vuelo LA503."
        )
    })
    print("TURNO 2:", r2)


if __name__ == "__main__":
    main()
```

### 2.5 Recorrido bloque por bloque

| Fragmento | Rol |
|-----------|-----|
| `@tool` consultar_* | Misma interfaz que M6; compartible con LangGraph |
| `Agent` analista | Sustituye la fase "llamar tools" del `fake_llm` |
| `Agent` calculador | Sustituye la fase "calcular total y formatear" |
| `context=[t1]` | Encadena observaciones como `memory.append` |
| Segundo `kickoff` | Simula turno 2; en producción usarías memoria de crew o input estructurado |

### 2.6 Cuándo usar / cuándo NO

| Usa CrewAI | Evítalo si |
|------------|------------|
| Prototipo rápido con roles legibles para negocio | Necesitas aristas condicionales precisas (template 10) |
| Pipeline investigador → redactor → revisor | Un solo agente ReAct basta (M6) |
| Equipo no técnico define los roles en YAML | Auditoría estricta paso a paso (prefer LangGraph) |

**Gotchas:**

1. **Costo** — dos agentes LLM por consulta; para casos simples, un solo agente (M6) es más barato.
2. **Memoria entre turnos** — no es tan directo como `thread_id`; debes pasar contexto explícitamente o usar memoria de Crew.
3. **Tools duplicadas** — extrae `@tool` a módulo compartido (patrón `SHARED_TOOLS` de M7).
4. **Versión** — CrewAI 0.7+ unificó `@tool`; ejemplos viejos con `from crewai_tools import tool` pueden fallar.

---

## 3. AutoGen / AG2 — conversación entre agentes

### 3.1 Qué es AG2 (antes AutoGen)

AG2 (paquete PyPI: `ag2`, import `autogen`) modela agentes que **conversan entre sí**. El flujo **emerge del diálogo**: un agente propone una tool, otro la ejecuta, otro resume. No hay grafo explícito como LangGraph ni pipeline de tasks como CrewAI.

**Paquete en 2025–2026:** Microsoft renombró el proyecto a **AG2**. Instalas con `pip install ag2`; el import sigue siendo `from autogen import ...`. Si encuentras tutoriales con `pyautogen`, es la generación anterior — migra a `ag2`.

### 3.2 Tabla puente — scratch → AG2

| Scratch | AG2 |
|---------|-----|
| Un proceso que hace todo | `AssistantAgent` (razona) + `UserProxyAgent` o segundo agente (ejecuta tools) |
| `TOOLS[name](**args)` | Función registrada con `register_function` |
| `react_loop` | `initiate_chat` — los turnos son mensajes entre agentes |
| Memoria | Historial del chat entre agentes |
| Confirmación | `UserProxyAgent(human_input_mode="NEVER")` + instrucciones; o `ALWAYS` para HITL real |

### 3.3 APIs pieza por pieza

#### `ConversableAgent` / `AssistantAgent`

```python
from autogen import ConversableAgent, LLMConfig

llm_config = LLMConfig(
    config_list={"api_type": "anthropic", "model": "claude-sonnet-4-6",
                 "api_key": os.environ["ANTHROPIC_API_KEY"]},
)

asistente = ConversableAgent(
    name="asistente_vuelo",
    system_message="Eres asistente de cambios de vuelo. Delega ejecución de tools al ejecutor.",
    llm_config=llm_config,
)
```

`AssistantAgent` es un atajo de `ConversableAgent` orientado al LLM; en AG2 reciente muchos ejemplos usan `ConversableAgent` directamente.

#### `register_function` — caller + executor

Patrón central de AG2: **un agente propone** la tool (caller), **otro ejecuta** (executor):

```python
from autogen import register_function

ejecutor = ConversableAgent(name="ejecutor", human_input_mode="NEVER")

register_function(
    consultar_reserva,
    caller=asistente,
    executor=ejecutor,
    description="Obtiene itinerario dado el PNR",
)
```

Equivale a separar en scratch la decisión (`fake_llm`) de la ejecución (`TOOLS[name](**args)`), pero en **dos agentes** que chatean.

#### `initiate_chat` — un diálogo ReAct

```python
ejecutor.initiate_chat(
    asistente,
    message="Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio.",
    max_turns=10,
)
```

Cada turno puede incluir propuesta de tool, ejecución y respuesta — el bucle ReAct emerge de la conversación.

#### `GroupChat` + `GroupChatManager` — más de dos agentes

```python
from autogen import GroupChat, GroupChatManager

groupchat = GroupChat(
    agents=[asistente, ejecutor, user_proxy],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",  # el manager elige quién habla
)
manager = GroupChatManager(groupchat=groupchat, llm_config=llm_config)
user_proxy.initiate_chat(manager, message="...")
```

Útil si añades un agente "revisor de políticas" o un proxy humano. **Gotcha:** `speaker_selection_method="auto"` es impredecible en producción — difícil auditar quién decidió qué.

### 3.4 Mini-ejemplo — asistente + ejecutor de tools

```python
# Requiere: pip install ag2
"""
Cambio de vuelo con AG2 — diálogo asistente ↔ ejecutor de tools.
"""

import json
import os
from pathlib import Path
from typing import Annotated

from autogen import ConversableAgent, LLMConfig, register_function

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


def consultar_reserva(pnr: Annotated[str, "PNR formato XXX-XXX-NNN"]) -> str:
    data = RESERVAS.get(pnr, {"error": f"PNR no encontrado: {pnr}"})
    return json.dumps(data, ensure_ascii=False)


def consultar_politica(
    fare_class: Annotated[str, "Clase tarifaria"],
    route_type: Annotated[str, "nacional o internacional"],
) -> str:
    for r in POLITICA["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return json.dumps(r, ensure_ascii=False)
    return json.dumps({"error": "Política no encontrada"})


def main():
    llm_config = LLMConfig(
        config_list={
            "api_type": "anthropic",
            "model": "claude-sonnet-4-6",
            "api_key": os.environ["ANTHROPIC_API_KEY"],
        }
    )

    asistente = ConversableAgent(
        name="asistente_vuelo",
        system_message=(
            "Asistente de cambios de vuelo. "
            "1) Pide al ejecutor consultar_reserva y consultar_politica. "
            "2) Calcula total con LA503 USD 295. "
            "3) Pide confirmación antes de cobrar."
        ),
        llm_config=llm_config,
    )

    ejecutor = ConversableAgent(
        name="ejecutor",
        human_input_mode="NEVER",
        llm_config=False,  # no necesita LLM — solo ejecuta funciones
    )

    register_function(consultar_reserva, caller=asistente, executor=ejecutor,
                      description="Obtiene itinerario por PNR")
    register_function(consultar_politica, caller=asistente, executor=ejecutor,
                      description="Penalidad de cambio por fare_class y route_type")

    # Turno 1
    ejecutor.initiate_chat(
        asistente,
        message="Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio.",
        max_turns=8,
    )

    # Turno 2 — mismo par de agentes, nuevo chat con contexto
    ejecutor.initiate_chat(
        asistente,
        message="Sí, confirmo el cambio de vuelo.",
        max_turns=4,
    )


if __name__ == "__main__":
    main()
```

### 3.5 Cuándo usar / cuándo NO

| Usa AG2 | Evítalo si |
|---------|------------|
| Explorar dinámicas multi-agente emergentes | Pagos, PNR, cobros — flujo debe ser auditable |
| Coding agents, brainstorming, investigación | Necesitas exactamente-once o idempotencia (template 01/10) |
| Prototipo rápido de "¿y si dos LLMs negocian?" | Compliance exige traza nodo por nodo (LangGraph) |

**Gotchas:**

1. **Flujo emergente** — el orden de mensajes puede variar entre ejecuciones; difícil reproducir bugs.
2. **Dos agentes = más tokens** — el ejecutor y el asistente intercambian mensajes intermedios.
3. **`LLMConfig` cambió en AG2** — ejemplos viejos con `config_list=[{...}]` (lista) vs dict plano; consulta [docs.ag2.ai](https://docs.ag2.ai) para tu versión.
4. **Migración AutoGen → AG2** — `pip install ag2`; el namespace `autogen` se mantiene por compatibilidad.

---

## 4. Pydantic-AI — agentes type-safe ("anti-LangChain")

### 4.1 Qué es Pydantic-AI y por qué gusta

[Pydantic-AI](https://ai.pydantic.dev) es el framework de agentes del equipo de Pydantic. Filosofía: **tipado estricto, poca magia, sin LangChain obligatorio**. Encaja con equipos que ya usan Pydantic para APIs y quieren `result_type` validado al final del run.

No confundir con **Pydantic** (validación de datos) ni con **instructor** (M5 §10) — Pydantic-AI es un **runtime de agente completo** con tools, deps y grafos internos.

### 4.2 Tabla puente — scratch → Pydantic-AI

| Scratch | Pydantic-AI |
|---------|-------------|
| `TOOLS` dict | `@agent.tool` / `@agent.tool_plain` |
| `Session.SYSTEM` | `instructions=` en `Agent(...)` |
| Estado en memoria (`pnr:`, `total_usd:`) | `deps_type` + `RunContext` + `result_type` Pydantic |
| `react_loop` | `agent.run_sync(...)` — bucle interno |
| Validar respuesta final | `result_type=CotizacionCambio` — falla si el JSON no cumple schema |

### 4.3 APIs pieza por pieza

#### `Agent(model, instructions, deps_type, result_type)`

```python
from pydantic import BaseModel, Field
from pydantic_ai import Agent

class FlightDeps(BaseModel):
    reservas: dict
    politica: dict

class CotizacionCambio(BaseModel):
    pnr: str
    vuelo_nuevo: str
    total_usd: float = Field(gt=0)
    requiere_confirmacion: bool = True
    mensaje: str

agent = Agent(
    'anthropic:claude-sonnet-4-6',
    deps_type=FlightDeps,
    output_type=CotizacionCambio,  # antes result_type; API 0.x usaba result_type
    instructions="Eres asistente de cambios de vuelo...",
)
```

> **Nota de versión (2025–2026):** en Pydantic-AI ≥ 0.2 el parámetro se llama `output_type`; en versiones 0.1x era `result_type`. Si tu instalación falla, prueba el otro nombre.

#### `@agent.tool` y `RunContext`

```python
from pydantic_ai import RunContext

@agent.tool
def consultar_reserva(ctx: RunContext[FlightDeps], pnr: str) -> dict:
    """Obtiene itinerario dado el PNR."""
    return ctx.deps.reservas.get(pnr, {"error": f"PNR no encontrado: {pnr}"})
```

- `@agent.tool` — **requiere** `RunContext` como primer argumento (acceso a deps, usage, mensajes).
- `@agent.tool_plain` — sin `RunContext`; para funciones puras como calculadoras.

#### `agent.run_sync(...)` y memoria

```python
from pydantic_ai import ModelMessage

historial: list[ModelMessage] = []

result1 = agent.run_sync(
    "Cambiar SCL-BOG-001 del 15 al 17 de junio",
    deps=deps,
    message_history=historial,
)
historial = result1.all_messages()

result2 = agent.run_sync(
    "Sí, confirmo el cambio",
    deps=deps,
    message_history=historial,
)
cotizacion = result2.output  # CotizacionCambio validado
```

`message_history` ≈ `session.memory`; `result.output` ≈ respuesta final **ya validada** por Pydantic.

### 4.4 Mini-agente del caso — salida estructurada validada

```python
# Requiere: pip install pydantic-ai
"""
Cambio de vuelo con Pydantic-AI — tools tipadas + CotizacionCambio validada.
"""

import json
import os
from pathlib import Path

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"
RESERVAS = json.loads((_DATOS / "reservas.json").read_text(encoding="utf-8"))
POLITICA = json.loads((_DATOS / "politica.json").read_text(encoding="utf-8"))


class FlightDeps(BaseModel):
    reservas: dict
    politica: dict


class CotizacionCambio(BaseModel):
    pnr: str
    vuelo_nuevo: str
    fecha_nueva: str
    penalidad_usd: float
    diferencial_usd: float
    total_usd: float = Field(gt=0)
    requiere_confirmacion: bool = True
    mensaje: str


agent = Agent(
    'anthropic:claude-sonnet-4-6',
    deps_type=FlightDeps,
    output_type=CotizacionCambio,
    instructions=(
        "Asistente de cambios de vuelo. "
        "Flujo: consultar_reserva → consultar_politica → calcula con LA503 USD 295. "
        "total = penalidad + max(0, 295 - base_price). "
        "requiere_confirmacion=True hasta que el usuario confirme. "
        "Tras confirmación, requiere_confirmacion=False y confirma el cobro."
    ),
)


@agent.tool
def consultar_reserva(ctx: RunContext[FlightDeps], pnr: str) -> dict:
    """Obtiene itinerario dado el PNR."""
    return ctx.deps.reservas.get(pnr, {"error": f"PNR no encontrado: {pnr}"})


@agent.tool
def consultar_politica(
    ctx: RunContext[FlightDeps], fare_class: str, route_type: str
) -> dict:
    """Penalidad y condiciones de cambio."""
    for r in ctx.deps.politica["penalidades"]:
        if r["fare_class"] == fare_class and r["route_type"] == route_type:
            return r
    return {"error": "Política no encontrada"}


def main():
    deps = FlightDeps(reservas=RESERVAS, politica=POLITICA)
    historial = []

    r1 = agent.run_sync(
        "Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio.",
        deps=deps,
        message_history=historial,
    )
    historial = r1.all_messages()
    cot1 = r1.output
    print("TURNO 1:", cot1.mensaje)
    print(f"  Total: USD {cot1.total_usd:.2f}, confirmar: {cot1.requiere_confirmacion}")

    r2 = agent.run_sync(
        "Sí, confirmo el cambio.",
        deps=deps,
        message_history=historial,
    )
    cot2 = r2.output
    print("TURNO 2:", cot2.mensaje)


if __name__ == "__main__":
    main()
```

### 4.5 Por qué gusta a equipos "anti-LangChain"

| Ventaja | Detalle |
|---------|---------|
| Tipado de punta a punta | `deps_type`, `output_type`, tools con hints |
| Poca magia | Un solo `Agent`, sin LCEL ni grafos opcionales |
| Validación automática | Si el LLM devuelve `total_usd: -1`, Pydantic falla y puedes reintentar |
| Model string unificado | `'anthropic:claude-sonnet-4-6'`, `'openai:gpt-4o'` — cambio de proveedor en una línea |
| Integración Logfire | Observabilidad del mismo equipo Pydantic (opcional) |

### 4.6 Cuándo usar / cuándo NO

| Usa Pydantic-AI | Evítalo si |
|-----------------|------------|
| Agente con salida estructurada crítica (cotización, diagnóstico) | Fan-out masivo con subgrafos (LangGraph) |
| Equipo ya usa Pydantic/FastAPI en todo | Necesitas ecosistema LangSmith/LangGraph maduro |
| Quieres evitar LangChain pero con ergonomía | Roles multi-agente declarativos (CrewAI más rápido) |

**Gotchas:**

1. **`@agent.tool` vs `@agent.tool_plain`** — mezclarlos mal causa errores en runtime (el primero exige `RunContext`).
2. **`output_type` vs `result_type`** — revisa la versión instalada.
3. **Salida estructurada + conversación larga** — el modelo puede agotar tokens rellenando el schema; simplifica `output_type` en turnos intermedios.
4. **Menos ejemplos de multi-agente** que LangGraph/CrewAI — para template 10 sigue siendo LangGraph.

---

## 5. Tabla comparativa final y regla de decisión

### 5.1 Comparativa — mismo caso, cinco enfoques

| Criterio | Loop nativo (SDK) | LangGraph (M6) | CrewAI | AutoGen / AG2 | Pydantic-AI |
|----------|-------------------|----------------|--------|---------------|-------------|
| **Modelo mental** | Tú eres el framework | Grafo de estado | Equipo por roles | Conversación emergente | Agente tipado + validación |
| **Control del flujo** | Máximo (cada línea) | Máximo (aristas explícitas) | Medio (Process) | Bajo-medio | Medio-alto |
| **Auditoría** | Logs que tú escribes | Nodos + LangSmith | Logs crew/task | Difícil (turnos variables) | Validación schema + trazas |
| **Curva de aprendizaje** | Baja (si sabes ②) | Media-alta | Baja-media | Media | Media |
| **Memoria entre turnos** | Lista `messages` | `MemorySaver` + `thread_id` | Context / memoria crew | Historial de chat | `message_history` |
| **Mejor para** | 1 agente, pocas tools, deps mínimas | Producción RAGorbit, HITL, fan-out | Prototipo multi-rol legible | Exploración, coding agents | Salida estructurada + APIs tipadas |
| **Evitar si** | Necesitas grafos complejos | Solo quieres 30 líneas sin deps | Flujo transaccional estricto | Cobros, PNR, compliance | Multi-agente masivo sin plan claro |
| **Deps típicas** | `anthropic` o `openai` | `langgraph` + `langchain-*` | `crewai` + LLM adapter | `ag2` | `pydantic-ai` |

### 5.2 Regla de decisión — ¿un solo agente, framework o multi-agente?

```
¿Cuántas tools y cuán estricto es el flujo?
│
├─ 1 agente, 2–5 tools, chat con memoria
│   ├─ ¿Quieres mínimas dependencias y control línea a línea?
│   │   → Loop nativo (SDK) — §1
│   ├─ ¿Salida final debe cumplir schema Pydantic sí o sí?
│   │   → Pydantic-AI — §4
│   └─ ¿Checkpoints, LangSmith, mismo stack que RAGorbit?
│       → LangGraph — M6 §8
│
├─ Varios roles legibles para negocio (analista + calculador)
│   └─ ¿Prototipo, no fan-out masivo?
│       → CrewAI — §2 (este doc) o M7 §9 (logística)
│
├─ Diálogo libre entre agentes, exploración
│   └─ ¿Sin cobros ni auditoría estricta?
│       → AG2 — §3
│
└─ Miles de eventos, ramas simple/complex, idempotencia
    → LangGraph multi-agente — M7 §9 (NO CrewAI ni AG2 en producción)
```

**Reglas del curso (coherentes con `tecnologias-comparadas.md` §9):**

1. **Entiende ② antes de elegir ③** — si no puedes escribir `react_loop` a mano, ningún framework te salvará en producción.
2. **Un solo agente ReAct basta** para template 01 (cambio de vuelo conversacional) — multi-agente solo si hay paralelización real (template 10) o especialización fuerte.
3. **LangGraph** cuando el flujo tiene consecuencias financieras y necesitas checkpoints + guardrails en el grafo (M9).
4. **SDK nativo o Pydantic-AI** cuando el equipo rechaza LangChain pero necesita agente en producción ligera.
5. **CrewAI** para prototipos de equipo; **AG2** para experimentar — migrar a LangGraph cuando la auditoría importe.

### 5.3 Mapeo al nodo RAGorbit

El template 01 (aerolínea) implementa este flujo con el nodo [`agent.react`](./catalogo-nodos.md#agentreact): un orquestador ReAct con tools `consultar_reserva`, `consultar_politica`, `PaymentService` envuelto en `guardrail.confirm`. Cualquier framework de este documento que implemente el bucle ReAct + tools es un candidato a generar ese nodo; LangGraph es el que el codegen de RAGorbit usa por defecto por checkpoints y composición con el resto del grafo.

---

> **Cross-links**
>
> - **M6 §8 — LangGraph desde cero:** [06-agentes-i/guia.md §8](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) — línea base del curso; tabla puente scratch → LangGraph.
> - **M7 §9 — Frameworks multi-agente:** [07-agentes-ii/guia.md §9](../07-agentes-ii/guia.md#9-la-capa--explicada-frameworks-multi-agente-desde-cero) — CrewAI + LangGraph multi en logística (complementa §2 de este doc, no lo duplica).
> - **Frameworks de agentes (tabla §9):** [tecnologias-comparadas.md §9](./tecnologias-comparadas.md#9-frameworks-de-agentes-y-multi-agente)
> - **Nodos `agent.react` y `agent.fanout`:** [catalogo-nodos.md](./catalogo-nodos.md)
> - **Capa ② de referencia:** [06-agentes-i/lab/solucion_scratch.py](../06-agentes-i/lab/solucion_scratch.py)
> - **Template 01 aerolínea:** [examples/01-airline-flight-change/](../../examples/01-airline-flight-change/)
> - **Convención de autoría (capa ③):** [HANDOFF.md §3](../HANDOFF.md#3-método-de-autoría-obligatorio-para-mantener-consistencia)

# Requiere: pip install langgraph langchain langchain-anthropic
"""
Agente ReAct con Memoria — Cambio de Vuelo
===========================================
Capa ③: implementación con LangGraph + LangChain.

Este archivo es ILUSTRATIVO: muestra cómo implementar el mismo agente
del taller usando frameworks reales. No se ejecuta en el entorno del curso
(requiere pip install y claves de API).

Para ejecutarlo cuando tengas red y pip:
  pip install langgraph langchain langchain-anthropic
  export ANTHROPIC_API_KEY="sk-ant-..."
  python3 solucion_framework.py
"""

import json
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Carga de datos (igual que en solucion_scratch.py)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"


def _load(filename):
    return json.loads((_DATOS / filename).read_text(encoding="utf-8"))


RESERVAS = _load("reservas.json")
POLITICA = _load("politica.json")
VUELOS   = _load("vuelos.json")


# ---------------------------------------------------------------------------
# TOOLS decoradas con @tool de LangChain
# Ver guia.md §8.3: el docstring → descripción del LLM; type hints → JSON Schema
# ---------------------------------------------------------------------------
from langchain_core.tools import tool  # noqa: E402 (import después de carga de datos)


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


@tool
def consultar_politica(fare_class: str, route_type: str) -> dict:
    """
    Devuelve la política de cambio (penalidad, condiciones) para una clase
    tarifaria y tipo de ruta. Úsala DESPUÉS de consultar_reserva para conocer
    la penalidad aplicable al cambio.

    Args:
        fare_class: Clase tarifaria (ej: ECONOMY_FLEX, ECONOMY_BASIC, BUSINESS_FLEX)
        route_type: Tipo de ruta (nacional o internacional)
    """
    for regla in POLITICA["penalidades"]:
        if regla["fare_class"] == fare_class and regla["route_type"] == route_type:
            return regla
    return {"error": f"No hay política para {fare_class!r} / {route_type!r}"}


TOOLS = [consultar_reserva, consultar_politica]


# ---------------------------------------------------------------------------
# AGENTE con LangGraph create_react_agent
# Ver guia.md §8.5–§8.6: reemplaza react_loop + while del scratch
# ---------------------------------------------------------------------------
from langchain_anthropic import ChatAnthropic               # noqa: E402
from langgraph.prebuilt import create_react_agent           # noqa: E402
from langgraph.checkpoint.memory import MemorySaver         # noqa: E402
from langchain_core.messages import HumanMessage            # noqa: E402


def build_agent():
    """Construye el agente ReAct con memoria persistente."""
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=0.1,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )

    # MemorySaver persiste el estado entre llamadas con el mismo thread_id
    checkpointer = MemorySaver()

    system_prompt = (
        "Eres un asistente especializado en cambios de vuelo. "
        "Ayuda al pasajero a cambiar su itinerario cumpliendo las políticas tarifarias.\n\n"
        "Flujo obligatorio:\n"
        "1. Obtén el itinerario con consultar_reserva usando el PNR del pasajero.\n"
        "2. Consulta la penalidad con consultar_politica (fare_class y route_type del itinerario).\n"
        "3. Los vuelos disponibles los tienes en tu contexto; elige el más económico.\n"
        "4. Calcula: total = penalidad + (precio_nuevo - precio_base).\n"
        "5. Presenta el desglose y pide confirmación ANTES de ejecutar el cambio.\n"
        "6. Si el pasajero confirma, usa el contexto del turno anterior para responder.\n\n"
        "Sé conciso, preciso y empático. No repitas llamadas a tools si ya tienes la información."
    )

    agent = create_react_agent(
        model=llm,
        tools=TOOLS,
        prompt=system_prompt,
        checkpointer=checkpointer,
    )
    return agent


# ---------------------------------------------------------------------------
# DEMO — dos turnos de conversación
# ---------------------------------------------------------------------------

def main():
    agent = build_agent()

    # thread_id = sesión conversacional (guia.md §8.6)
    # Mismo thread_id en Turno 1 y 2 → MemorySaver restaura el historial completo
    config = {"configurable": {"thread_id": "demo-001"}}

    # --- Turno 1 ---
    print("=" * 60)
    print("TURNO 1")
    print("=" * 60)
    turno1 = "Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio."
    print(f"USUARIO: {turno1}\n")

    result1 = agent.invoke(
        {"messages": [HumanMessage(content=turno1)]},
        config=config,
    )
    respuesta1 = result1["messages"][-1].content
    print(f"AGENTE:\n{respuesta1}\n")

    # --- Turno 2 ---
    print("=" * 60)
    print("TURNO 2")
    print("=" * 60)
    turno2 = "Sí, confirmo el cambio."
    print(f"USUARIO: {turno2}\n")

    result2 = agent.invoke(
        {"messages": [HumanMessage(content=turno2)]},
        config=config,
    )
    respuesta2 = result2["messages"][-1].content
    print(f"AGENTE:\n{respuesta2}\n")

    print("=" * 60)
    print("Conversación completada.")


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# ALTERNATIVA: LangGraph StateGraph explícito (guia.md §8.7)
# ---------------------------------------------------------------------------
# Descomenta y completa para ver el bucle ReAct como grafo de nodos/aristas.
# Mapeo scratch → grafo:
#   fake_llm(memory)     → nodo "agent"
#   TOOLS[name](**args)  → nodo "tools" (node_call_tools)
#   while + break        → should_continue + add_conditional_edges
#   session.memory       → MemorySaver + thread_id

"""
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessage, ToolMessage
import operator


class FlightChangeState(TypedDict):
    messages:    Annotated[list, add_messages]
    pnr:         str
    fare_class:  str
    route_type:  str
    penalty:     float
    best_flight: dict
    total:       float
    confirmed:   bool


def node_call_tools(state: FlightChangeState) -> FlightChangeState:
    '''Ejecuta las tool calls presentes en el último mensaje del asistente.'''
    last = state["messages"][-1]
    new_messages = []
    updates = {}

    for tc in getattr(last, "tool_calls", []):
        if tc["name"] == "consultar_reserva":
            result = consultar_reserva.invoke(tc["args"])
            updates["pnr"]        = result.get("pnr", "")
            updates["fare_class"] = result.get("fare_class", "")
            updates["route_type"] = result.get("route_type", "")

        elif tc["name"] == "consultar_politica":
            result = consultar_politica.invoke(tc["args"])
            updates["penalty"] = float(result.get("penalidad_usd") or 0)

        else:
            result = {"error": f"Tool desconocida: {tc['name']}"}

        new_messages.append(ToolMessage(
            content=json.dumps(result, ensure_ascii=False),
            tool_call_id=tc["id"],
        ))

    return {**updates, "messages": new_messages}


def should_continue(state: FlightChangeState) -> str:
    '''Arista condicional: ¿hay tool calls pendientes o es respuesta final?'''
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"


builder = StateGraph(FlightChangeState)
builder.add_node("agent", lambda s: {"messages": [llm_with_tools.invoke(s["messages"])]})
builder.add_node("tools", node_call_tools)
builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
builder.add_edge("tools", "agent")
graph = builder.compile(checkpointer=MemorySaver())
"""

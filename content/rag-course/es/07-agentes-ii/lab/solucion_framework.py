# Requiere: pip install crewai langgraph langchain langchain-anthropic
"""
Multi-Agente — Rebooking de Disrupción Logística
=================================================
Capa ③: misma lógica del scratch en CrewAI y LangGraph multi-agente.

Este archivo es ILUSTRATIVO — no se ejecuta en el entorno del curso.
Cuando tengas pip y API keys:

  pip install crewai langgraph langchain langchain-anthropic
  export ANTHROPIC_API_KEY="sk-ant-..."
  python3 solucion_framework.py

Ver guia.md §9 para el recorrido bloque a bloque.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Annotated, Literal, TypedDict

# ---------------------------------------------------------------------------
# Datos compartidos (igual que scratch)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"


def _load(name: str):
    return json.loads((_DATOS / name).read_text(encoding="utf-8"))


EVENTS_DATA = _load("disruption_events.json")
PROFILES = _load("shipment_profiles.json")
POLICIES = _load("rebook_policies.json")
ALTERNATIVES = _load("alternatives.json")


# ---------------------------------------------------------------------------
# Tools compartidas (usadas por CrewAI y LangGraph)
# ---------------------------------------------------------------------------
from langchain_core.tools import tool  # noqa: E402


@tool
def get_shipment_profile(shipment_id: str) -> dict:
    """Obtiene tier, email y preferencias del envío. Úsala al inicio de cada rebook."""
    return PROFILES.get(shipment_id, {"error": f"No profile: {shipment_id}"})


@tool
def get_rebook_policy(disruption_cause: str, tier: str) -> dict:
    """Consulta política de rebook filtrada por causa y tier del cliente."""
    for p in POLICIES["policies"]:
        if p["disruption_cause"] == disruption_cause and p["tier"] == tier:
            return p
    for p in POLICIES["policies"]:
        if p["disruption_cause"] == disruption_cause:
            return p
    return {"error": f"No policy for {disruption_cause}"}


@tool
def get_alternatives(shipment_id: str) -> list:
    """Devuelve rutas alternativas disponibles en ventana de 48h."""
    return ALTERNATIVES.get(shipment_id, [])


@tool
def auto_confirm_rebook(shipment_id: str, alternative_id: str, reason: str) -> dict:
    """Confirma automáticamente un rebook cuando la opción es obvia."""
    return {
        "shipment_id": shipment_id,
        "alternative_id": alternative_id,
        "status": "confirmed",
        "reason": reason,
    }


SHARED_TOOLS = [get_shipment_profile, get_rebook_policy, get_alternatives, auto_confirm_rebook]


# ---------------------------------------------------------------------------
# IMPLEMENTACIÓN A — CrewAI (agents / tasks / crew / process)
# ---------------------------------------------------------------------------
from crewai import Agent, Crew, Process, Task  # noqa: E402
from langchain_anthropic import ChatAnthropic  # noqa: E402


def build_crewai_crew(llm) -> Crew:
    """
    Patrón CrewAI: roles fijos + tasks secuenciales por envío.
    Process.sequential = cada task pasa contexto a la siguiente.
    """
    classifier = Agent(
        role="Clasificador de prioridad",
        goal="Segmentar envíos en P1/P2/P3 y track simple/complejo",
        backstory="Experto en reglas de negocio de logística bajo disrupción.",
        llm=llm,
        verbose=True,
    )
    researcher = Agent(
        role="Investigador de rebook",
        goal="Recopilar perfil, política y alternativas del envío",
        backstory="Conoce PolicyRAG y servicios de routing.",
        tools=SHARED_TOOLS,
        llm=llm,
        verbose=True,
    )
    executor = Agent(
        role="Ejecutor de rebook",
        goal="Auto-confirmar casos simples o proponer opciones al cliente premium",
        backstory="Decide entre AutoConfirmService y escalación LLM.",
        tools=SHARED_TOOLS,
        llm=llm,
        verbose=True,
    )

    classify_task = Task(
        description=(
            "Clasifica el evento: {event_json}. "
            "Reglas: premium o connections_lost>0 → P1/complex; "
            "flexible → P2/simple; CRITICAL → P1/complex; else P3/simple."
        ),
        expected_output="JSON con priority y track",
        agent=classifier,
    )
    research_task = Task(
        description=(
            "Para el envío del evento, llama get_shipment_profile, "
            "get_rebook_policy y get_alternatives. Devuelve resumen estructurado."
        ),
        expected_output="Perfil + política + lista de alternativas",
        agent=researcher,
        context=[classify_task],
    )
    execute_task = Task(
        description=(
            "Si track=simple y hay opción obvia, llama auto_confirm_rebook. "
            "Si track=complex (multi-leg, premium, CRITICAL), propone opciones "
            "sin auto-confirm. Devuelve handler, alternative_id y summary."
        ),
        expected_output="Resultado final del rebook",
        agent=executor,
        context=[classify_task, research_task],
    )

    return Crew(
        agents=[classifier, researcher, executor],
        tasks=[classify_task, research_task, execute_task],
        process=Process.sequential,
        verbose=True,
    )


def run_crewai_demo(events: list[dict], llm) -> list[dict]:
    """Procesa cada evento con una Crew secuencial (fan-out = loop externo)."""
    crew = build_crewai_crew(llm)
    results = []
    for event in events:
        output = crew.kickoff(inputs={"event_json": json.dumps(event, ensure_ascii=False)})
        results.append({"framework": "crewai", "shipment_id": event["shipment_id"], "output": str(output)})
    return results


# ---------------------------------------------------------------------------
# IMPLEMENTACIÓN B — LangGraph multi-agente (supervisor + nodos especialistas)
# ---------------------------------------------------------------------------
from langgraph.graph import END, StateGraph  # noqa: E402
from langgraph.graph.message import add_messages  # noqa: E402
from langchain_core.messages import AIMessage, HumanMessage  # noqa: E402


class RebookState(TypedDict):
    messages: Annotated[list, add_messages]
    event: dict
    priority: str
    track: str
    profile: dict
    policy: dict
    alternatives: list
    handler: str
    alternative_id: str
    summary: str


def _classify_event(event: dict) -> dict:
    """Misma lógica determinista que PriorityRulesAgent del scratch."""
    if event.get("tier") == "premium" or event.get("connections_lost", 0) > 0:
        return {"priority": "P1", "track": "complex"}
    if event.get("delivery_flexibility") == "flexible":
        return {"priority": "P2", "track": "simple"}
    if event.get("disruption_severity") == "CRITICAL":
        return {"priority": "P1", "track": "complex"}
    return {"priority": "P3", "track": "simple"}


def node_supervisor(state: RebookState) -> RebookState:
    """Nodo supervisor: clasifica y decide el siguiente especialista."""
    decision = _classify_event(state["event"])
    msg = AIMessage(
        content=(
            f"Supervisor: {state['event']['shipment_id']} → "
            f"{decision['priority']}/{decision['track']}"
        )
    )
    return {**decision, "messages": [msg]}


def node_profile_agent(state: RebookState) -> RebookState:
    sid = state["event"]["shipment_id"]
    profile = get_shipment_profile.invoke({"shipment_id": sid})
    return {
        "profile": profile,
        "messages": [AIMessage(content=f"ProfileAgent: tier={profile.get('tier')}")],
    }


def node_policy_agent(state: RebookState) -> RebookState:
    cause = state["event"]["disruption_cause"]
    tier = state["profile"].get("tier", "standard")
    policy = get_rebook_policy.invoke({"disruption_cause": cause, "tier": tier})
    return {
        "policy": policy,
        "messages": [AIMessage(content=f"PolicyAgent: {policy.get('summary', policy)}")],
    }


def node_alternatives_agent(state: RebookState) -> RebookState:
    sid = state["event"]["shipment_id"]
    alts = get_alternatives.invoke({"shipment_id": sid})
    return {
        "alternatives": alts,
        "messages": [AIMessage(content=f"AlternativesAgent: {len(alts)} rutas")],
    }


def node_autoconfirm_agent(state: RebookState) -> RebookState:
    """Rama simple: confirma si hay opción obvia."""
    alts = state["alternatives"]
    profile = state["profile"]
    sid = state["event"]["shipment_id"]
    if not alts:
        return {"handler": "llm", "summary": "Sin alternativas", "messages": []}
    chosen = min(alts, key=lambda a: a["eta_delta_hours"])
    if state["track"] == "simple" and len(alts) == 1:
        auto_confirm_rebook.invoke({
            "shipment_id": sid,
            "alternative_id": chosen["alternative_id"],
            "reason": "única alternativa",
        })
        return {
            "handler": "auto_confirm",
            "alternative_id": chosen["alternative_id"],
            "summary": f"Auto-confirmado {chosen['alternative_id']}",
            "messages": [AIMessage(content=f"AutoConfirm: {chosen['alternative_id']}")],
        }
    return {
        "handler": "llm",
        "alternative_id": chosen["alternative_id"],
        "summary": f"Complejo — propuesta {chosen['alternative_id']}",
        "messages": [AIMessage(content="Derivando a LLM specialist")],
    }


def node_llm_specialist(state: RebookState, llm) -> RebookState:
    """Rama compleja: el LLM real razona sobre multi-leg / CRITICAL."""
    prompt = (
        f"Envío {state['event']['shipment_id']}, track={state['track']}, "
        f"alternativas={state['alternatives']}. Propón la mejor opción."
    )
    response = llm.invoke([HumanMessage(content=prompt)])
    return {
        "handler": "llm",
        "summary": response.content,
        "messages": [response],
    }


def route_after_supervisor(state: RebookState) -> Literal["profile", "end"]:
    return "profile"


def route_after_alternatives(state: RebookState) -> Literal["autoconfirm", "llm"]:
    """Arista condicional: simple → autoconfirm; complex → llm."""
    if state.get("track") == "complex":
        return "llm"
    return "autoconfirm"


def build_langgraph_multi_agent(llm):
    """
    Grafo multi-agente con supervisor y aristas condicionales.
    Equivalente al SupervisorOrchestrator del scratch.
    """
    builder = StateGraph(RebookState)

    builder.add_node("supervisor", node_supervisor)
    builder.add_node("profile", node_profile_agent)
    builder.add_node("policy", node_policy_agent)
    builder.add_node("alternatives", node_alternatives_agent)
    builder.add_node("autoconfirm", node_autoconfirm_agent)
    builder.add_node("llm_specialist", lambda s: node_llm_specialist(s, llm))

    builder.set_entry_point("supervisor")
    builder.add_edge("supervisor", "profile")
    builder.add_edge("profile", "policy")
    builder.add_edge("policy", "alternatives")
    builder.add_conditional_edges(
        "alternatives",
        route_after_alternatives,
        {"autoconfirm": "autoconfirm", "llm": "llm_specialist"},
    )
    builder.add_edge("autoconfirm", END)
    builder.add_edge("llm_specialist", END)

    return builder.compile()


def run_langgraph_demo(events: list[dict], llm) -> list[dict]:
    graph = build_langgraph_multi_agent(llm)
    results = []
    for event in events:
        final = graph.invoke({
            "messages": [],
            "event": event,
            "priority": "",
            "track": "",
            "profile": {},
            "policy": {},
            "alternatives": [],
            "handler": "",
            "alternative_id": "",
            "summary": "",
        })
        results.append({
            "framework": "langgraph",
            "shipment_id": event["shipment_id"],
            "handler": final.get("handler"),
            "summary": final.get("summary"),
        })
    return results


# ---------------------------------------------------------------------------
# Demo comparativa
# ---------------------------------------------------------------------------


def print_tradeoffs_table():
    print("\n" + "=" * 70)
    print("TRADE-OFFS: CrewAI vs LangGraph (mismo problema de rebooking)")
    print("=" * 70)
    rows = [
        ("Modelo mental", "Roles + tasks secuenciales", "Grafo + supervisor + conditional edges"),
        ("Control de flujo", "Process.sequential / hierarchical", "Aristas explícitas por nodo"),
        ("Fan-out masivo", "Loop externo por evento", "Subgrafos + checkpointer por shipment_id"),
        ("Auditoría", "Logs de crew/task", "Traza de nodos + LangSmith"),
        ("Curva", "Baja-media (roles declarativos)", "Media-alta (más control)"),
        ("Producción RAGorbit", "Prototipo multi-rol", "Preferido (template 10)"),
    ]
    print(f"  {'Criterio':<18} {'CrewAI':<28} {'LangGraph':<28}")
    print("  " + "-" * 74)
    for crit, crew, lg in rows:
        print(f"  {crit:<18} {crew:<28} {lg:<28}")
    print("=" * 70)


def main():
    llm = ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=0.1,
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
    events = EVENTS_DATA["events"]

    print("=" * 70)
    print("CREWAI — rebooking por envío (Process.sequential)")
    print("=" * 70)
    crewai_results = run_crewai_demo(events, llm)
    for r in crewai_results:
        print(f"  {r['shipment_id']}: {r['output'][:120]}...")

    print("\n" + "=" * 70)
    print("LANGGRAPH — multi-agente con supervisor")
    print("=" * 70)
    lg_results = run_langgraph_demo(events, llm)
    for r in lg_results:
        print(f"  {r['shipment_id']}: handler={r['handler']} — {r['summary'][:80]}")

    print_tradeoffs_table()


if __name__ == "__main__":
    main()

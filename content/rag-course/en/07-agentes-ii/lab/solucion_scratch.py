"""
Multi-Agente — Rebooking de Disrupción Logística
=================================================
Capa ②: simulación multi-agente con stdlib, determinista.

Arquitectura simulada:
  - SupervisorOrchestrator: orquesta el fan-out y el routing simple/complejo
  - PriorityRulesAgent: segmentación P1/P2/P3 (determinista)
  - ProfileAgent, PolicyAgent, AlternativesAgent: especialistas por dominio
  - AutoConfirmAgent: confirma casos obvios sin LLM
  - FakeLLMAgent: razonamiento determinista por plantillas para casos complejos

Ejecutar: python3 solucion_scratch.py
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Carga de datos
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_DATOS = os.path.join(_HERE, "datos")


def _load(filename: str) -> Any:
    with open(os.path.join(_DATOS, filename), encoding="utf-8") as f:
        return json.load(f)


EVENTS_DATA = _load("disruption_events.json")
PROFILES = _load("shipment_profiles.json")
POLICIES = _load("rebook_policies.json")
ALTERNATIVES = _load("alternatives.json")

# ---------------------------------------------------------------------------
# Modelos de resultado
# ---------------------------------------------------------------------------


@dataclass
class RebookResult:
    shipment_id: str
    priority: str
    track: str
    handler: str  # "auto_confirm" | "llm"
    alternative_id: str | None
    auto_confirmed: bool
    compensation_usd: float
    notify_channels: list[str]
    summary: str
    agent_trace: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Agente 1 — Reglas de prioridad (equivalente a logic.rules)
# ---------------------------------------------------------------------------


class PriorityRulesAgent:
    """Clasifica envíos en P1/P2/P3 y track simple/complejo."""

    def classify(self, event: dict) -> dict:
        if event.get("tier") == "premium" or event.get("connections_lost", 0) > 0:
            return {"priority": "P1", "track": "complex"}
        if event.get("delivery_flexibility") == "flexible":
            return {"priority": "P2", "track": "simple"}
        if event.get("disruption_severity") == "CRITICAL":
            return {"priority": "P1", "track": "complex"}
        return {"priority": "P3", "track": "simple"}


# ---------------------------------------------------------------------------
# Agentes especialistas (tools como clases)
# ---------------------------------------------------------------------------


class ProfileAgent:
    def get_profile(self, shipment_id: str) -> dict:
        profile = PROFILES.get(shipment_id)
        if not profile:
            return {"error": f"Perfil no encontrado: {shipment_id}"}
        return profile


class PolicyAgent:
    def get_policy(self, disruption_cause: str, tier: str) -> dict:
        for p in POLICIES["policies"]:
            if p["disruption_cause"] == disruption_cause and p["tier"] == tier:
                return p
        # fallback a standard si no hay política premium específica
        for p in POLICIES["policies"]:
            if p["disruption_cause"] == disruption_cause and p["tier"] == "standard":
                return p
        return {"error": f"Sin política para {disruption_cause}/{tier}"}


class AlternativesAgent:
    def get_alternatives(self, shipment_id: str) -> list[dict]:
        return list(ALTERNATIVES.get(shipment_id, []))


class AutoConfirmAgent:
    def can_auto_confirm(
        self,
        track: str,
        policy: dict,
        alternatives: list[dict],
        profile: dict,
    ) -> bool:
        if track != "simple":
            return False
        if not alternatives:
            return False
        if len(alternatives) == 1:
            return True
        # Múltiples alternativas: auto si hay una sola viable en ventana preferida
        window = profile.get("preferred_window_hours", 48)
        viable = [a for a in alternatives if a["eta_delta_hours"] <= window]
        if len(viable) == 1:
            return True
        # Opción obvia: la más rápida supera a la segunda por >= 4h (regla determinista P2)
        if len(viable) >= 2:
            ranked = sorted(viable, key=lambda a: a["eta_delta_hours"])
            gap = ranked[1]["eta_delta_hours"] - ranked[0]["eta_delta_hours"]
            if gap >= 4:
                return True
        return False

    def pick_alternative(
        self,
        alternatives: list[dict],
        profile: dict,
    ) -> dict:
        window = profile.get("preferred_window_hours", 48)
        viable = [a for a in alternatives if a["eta_delta_hours"] <= window]
        pool = viable if viable else alternatives
        return min(pool, key=lambda a: a["eta_delta_hours"])

    def confirm(self, shipment_id: str, alternative_id: str, reason: str) -> dict:
        return {
            "shipment_id": shipment_id,
            "alternative_id": alternative_id,
            "status": "confirmed",
            "reason": reason,
        }


# ---------------------------------------------------------------------------
# Agente LLM fake — plantillas deterministas (casos complejos)
# ---------------------------------------------------------------------------


class FakeLLMAgent:
    """
    Simula el razonamiento del sub-agente LLM para track=complex.
    No hay aleatoriedad: misma entrada → misma salida.
    """

    def analyze(
        self,
        event: dict,
        profile: dict,
        policy: dict,
        alternatives: list[dict],
    ) -> dict:
        shipment_id = event["shipment_id"]
        legs = event.get("legs", [])
        is_multi_leg = len(legs) > 1 or event.get("connections_lost", 0) > 0

        if not alternatives:
            return {
                "action": "escalate_hitl",
                "proposal": None,
                "message": f"Sin alternativas para {shipment_id}; escalar a operador humano.",
            }

        if is_multi_leg and profile.get("tier") == "premium":
            # Premium multi-leg: elegir ruta con menos conexiones dentro de ventana
            pref = profile.get("preference", "minimize_connections")
            if pref == "minimize_connections":
                ranked = sorted(
                    alternatives,
                    key=lambda a: (a.get("connections", 99), a["eta_delta_hours"]),
                )
            else:
                ranked = sorted(alternatives, key=lambda a: a["eta_delta_hours"])
            best = ranked[0]
            return {
                "action": "propose_options",
                "proposal": best["alternative_id"],
                "options_sent": [a["alternative_id"] for a in alternatives[:3]],
                "message": (
                    f"Multi-leg {shipment_id}: propongo {best['alternative_id']} "
                    f"({best['route']}, ETA +{best['eta_delta_hours']}h). "
                    f"Compensación ${policy.get('compensation_usd', 0)}. "
                    f"Opciones enviadas al cliente premium."
                ),
            }

        if event.get("disruption_severity") == "CRITICAL":
            # CRITICAL: priorizar la alternativa más rápida
            best = min(alternatives, key=lambda a: a["eta_delta_hours"])
            return {
                "action": "propose_options",
                "proposal": best["alternative_id"],
                "options_sent": [a["alternative_id"] for a in alternatives],
                "message": (
                    f"CRITICAL {shipment_id}: ruta express {best['alternative_id']} "
                    f"(ETA +{best['eta_delta_hours']}h). Sin auto-confirm — cliente elige."
                ),
            }

        # Fallback complejo genérico
        best = min(alternatives, key=lambda a: a["eta_delta_hours"])
        return {
            "action": "propose_options",
            "proposal": best["alternative_id"],
            "options_sent": [best["alternative_id"]],
            "message": f"Caso complejo {shipment_id}: opción recomendada {best['alternative_id']}.",
        }


# ---------------------------------------------------------------------------
# Supervisor — orquestador multi-agente (patrón supervisor)
# ---------------------------------------------------------------------------


class SupervisorOrchestrator:
    """
    Orquesta el pipeline multi-agente por envío.
    Equivalente conceptual a agent.fanout + sub-agentes especializados.
    """

    def __init__(self):
        self.priority_agent = PriorityRulesAgent()
        self.profile_agent = ProfileAgent()
        self.policy_agent = PolicyAgent()
        self.alternatives_agent = AlternativesAgent()
        self.autoconfirm_agent = AutoConfirmAgent()
        self.llm_agent = FakeLLMAgent()
        self._processed: set[str] = set()  # idempotencia

    def process_event(self, event: dict) -> RebookResult:
        shipment_id = event["shipment_id"]
        trace: list[str] = []

        if shipment_id in self._processed:
            trace.append(f"[supervisor] DUPLICADO ignorado (idempotencia): {shipment_id}")
            return RebookResult(
                shipment_id=shipment_id,
                priority="—",
                track="—",
                handler="deduplicated",
                alternative_id=None,
                auto_confirmed=False,
                compensation_usd=0,
                notify_channels=[],
                summary="Evento duplicado — sin rebook adicional",
                agent_trace=trace,
            )

        # Paso 1 — Segmentación
        decision = self.priority_agent.classify(event)
        priority, track = decision["priority"], decision["track"]
        trace.append(f"[priority_rules] {shipment_id} → {priority} / track={track}")

        # Paso 2 — Perfil
        profile = self.profile_agent.get_profile(shipment_id)
        trace.append(f"[profile_agent] tier={profile.get('tier')}, email={profile.get('customer_email')}")

        # Paso 3 — Política (PolicyRAG simulado con lookup determinista)
        policy = self.policy_agent.get_policy(event["disruption_cause"], profile.get("tier", "standard"))
        trace.append(
            f"[policy_agent] cause={event['disruption_cause']} → "
            f"penalty=${policy.get('penalty_usd', 0)}, comp=${policy.get('compensation_usd', 0)}"
        )

        # Paso 4 — Alternativas
        alternatives = self.alternatives_agent.get_alternatives(shipment_id)
        alt_ids = [a["alternative_id"] for a in alternatives]
        trace.append(f"[alternatives_agent] {len(alternatives)} alternativas: {alt_ids}")

        # Paso 5 — Routing: auto-confirm vs LLM
        if self.autoconfirm_agent.can_auto_confirm(track, policy, alternatives, profile):
            chosen = self.autoconfirm_agent.pick_alternative(alternatives, profile)
            confirm = self.autoconfirm_agent.confirm(
                shipment_id,
                chosen["alternative_id"],
                reason="opción obvia en ventana preferida",
            )
            trace.append(
                f"[autoconfirm_agent] Confirmado {confirm['alternative_id']} "
                f"(ETA +{chosen['eta_delta_hours']}h)"
            )
            trace.append(
                f"[notify] canales={profile.get('notify_channels')} → {profile.get('customer_email')}"
            )
            self._processed.add(shipment_id)
            return RebookResult(
                shipment_id=shipment_id,
                priority=priority,
                track=track,
                handler="auto_confirm",
                alternative_id=chosen["alternative_id"],
                auto_confirmed=True,
                compensation_usd=float(policy.get("compensation_usd", 0)),
                notify_channels=profile.get("notify_channels", []),
                summary=(
                    f"Auto-confirmado {chosen['alternative_id']} "
                    f"(+{chosen['eta_delta_hours']}h, sin penalidad)"
                ),
                agent_trace=trace,
            )

        # Rama LLM (casos complejos)
        llm_result = self.llm_agent.analyze(event, profile, policy, alternatives)
        trace.append(f"[llm_agent] {llm_result['message']}")
        trace.append(
            f"[notify] opciones {llm_result.get('options_sent', [])} → "
            f"{profile.get('customer_email')}"
        )
        self._processed.add(shipment_id)
        return RebookResult(
            shipment_id=shipment_id,
            priority=priority,
            track=track,
            handler="llm",
            alternative_id=llm_result.get("proposal"),
            auto_confirmed=False,
            compensation_usd=float(policy.get("compensation_usd", 0)),
            notify_channels=profile.get("notify_channels", []),
            summary=llm_result["message"],
            agent_trace=trace,
        )

    def fan_out(self, events: list[dict], concurrency: int = 16) -> list[RebookResult]:
        """
        Procesa N eventos en lotes (simula fan-out; en scratch es secuencial
        pero respeta el límite de concurrencia como semáforo conceptual).
        """
        results: list[RebookResult] = []
        batch_size = min(concurrency, len(events))
        for i in range(0, len(events), batch_size):
            batch = events[i : i + batch_size]
            for event in batch:
                results.append(self.process_event(event))
        return results


# ---------------------------------------------------------------------------
# Demo principal
# ---------------------------------------------------------------------------


def _print_result(r: RebookResult) -> None:
    print(f"\n--- {r.shipment_id} ---")
    for line in r.agent_trace:
        print(f"  {line}")
    print(f"  → handler={r.handler} | auto_confirmed={r.auto_confirmed} | alt={r.alternative_id}")
    print(f"  → {r.summary}")


def main() -> None:
    events = EVENTS_DATA["events"]
    disruption = EVENTS_DATA["disruption"]

    print("=" * 70)
    print("MULTI-AGENTE — REBOOKING DISRUPCIÓN LOGÍSTICA (stdlib, determinista)")
    print("=" * 70)
    print(f"Evento: {disruption['description']}")
    print(f"Hub: {disruption['hub_affected']} | Causa: {disruption['disruption_cause']}")
    print(f"Envíos a procesar: {len(events)}")
    print("=" * 70)

    orchestrator = SupervisorOrchestrator()
    results = orchestrator.fan_out(events, concurrency=16)

    for r in results:
        _print_result(r)

    # Métricas agregadas
    processed = [r for r in results if r.handler != "deduplicated"]
    auto_count = sum(1 for r in processed if r.handler == "auto_confirm")
    llm_count = sum(1 for r in processed if r.handler == "llm")
    total = len(processed)
    rate = auto_count / total if total else 0.0

    print("\n" + "=" * 70)
    print("RESUMEN DE MÉTRICAS")
    print("=" * 70)
    print(f"  Procesados:     {total}")
    print(f"  Auto-confirm:   {auto_count} ({rate * 100:.0f}%)")
    print(f"  LLM:            {llm_count} ({(llm_count / total * 100) if total else 0:.0f}%)")
    print()
    print("  Tabla por envío:")
    print(f"  {'SHIPMENT_ID':<22} {'PRIO':<5} {'TRACK':<8} {'HANDLER':<14} {'ALT':<10} {'AUTO'}")
    print("  " + "-" * 66)
    for r in processed:
        print(
            f"  {r.shipment_id:<22} {r.priority:<5} {r.track:<8} "
            f"{r.handler:<14} {str(r.alternative_id or '—'):<10} {r.auto_confirmed}"
        )

    print("\n" + "=" * 70)
    print("TABLA DE TRADE-OFFS (auto-confirm vs LLM)")
    print("=" * 70)
    print("  | Criterio          | Auto-confirm (determinista) | LLM (complejo)        |")
    print("  |-------------------|-----------------------------|-----------------------|")
    print("  | Latencia          | ~1.8–2.1 s (P2/P3)          | ~5–6 s (P1)           |")
    print("  | Costo tokens      | $0                          | ~$0.02–0.08 por envío |")
    print("  | Casos ideales     | 1 alt viable, sin multi-leg | Premium multi-leg     |")
    print("  | Auditoría         | Trivial (reglas fijas)      | Requiere traza LLM    |")
    print("  | Riesgo de error   | Bajo (reglas explícitas)    | Medio (ambigüedad)    |")
    print("=" * 70)

    # Verificaciones deterministas
    by_id = {r.shipment_id: r for r in processed}
    assert total == 6, f"Esperados 6 envíos, got {total}"
    assert auto_count == 3, f"Esperados 3 auto-confirm, got {auto_count}"
    assert llm_count == 3, f"Esperados 3 LLM, got {llm_count}"
    assert by_id["SHP-20240614-00742"].handler == "auto_confirm"
    assert by_id["SHP-20240614-00742"].alternative_id == "ALT-881"
    assert by_id["SHP-20240614-00815"].handler == "auto_confirm"
    assert by_id["SHP-20240614-00556"].handler == "auto_confirm"
    assert by_id["SHP-20240614-00556"].alternative_id == "ALT-904"
    assert by_id["SHP-20240614-00189"].handler == "llm"
    assert by_id["SHP-20240614-00331"].handler == "llm"
    assert by_id["SHP-20240614-00204"].handler == "llm"

    # Test idempotencia
    dup = orchestrator.process_event(events[0])
    assert dup.handler == "deduplicated"

    print("\nTodas las verificaciones pasaron.")


if __name__ == "__main__":
    main()

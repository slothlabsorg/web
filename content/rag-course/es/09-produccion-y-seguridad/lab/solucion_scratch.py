"""
Pago con Guardrails — Idempotencia + Confirm-Gate + Audit + Anti-inyección
===========================================================================
Capa ②: implementación desde cero, solo stdlib, determinista.

Envuelve un cobro transaccional con:
  - guardrail de inyección de prompts (pre-entrada)
  - confirm-gate (umbral USD 50)
  - idempotencia (clave compuesta)
  - audit bus en memoria (simula Kafka/log)

Ejecutar: python3 solucion_scratch.py
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_DATOS = os.path.join(_HERE, "datos")


def _load(filename: str) -> dict:
    with open(os.path.join(_DATOS, filename), encoding="utf-8") as f:
        return json.load(f)


DATOS_PAGO = _load("solicitudes_pago.json")
PROMPTS = _load("prompts_maliciosos.json")

CONFIRM_THRESHOLD = float(DATOS_PAGO["umbrales"]["confirm_gate_usd"])
CONFIRM_WORDS = (
    "confirmo", "confirmar", "sí confirmo", "si confirmo", "acepto",
    "de acuerdo", "procede", "adelante",
)

# ---------------------------------------------------------------------------
# Audit bus (simula observability.audit → Kafka/log)
# ---------------------------------------------------------------------------


@dataclass
class AuditBus:
    """Bus de auditoría en memoria. Cada evento es un dict inmutable."""

    events: list[dict[str, Any]] = field(default_factory=list)

    def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        event = {
            "ts": "2026-06-18T10:00:00Z",  # fijo para determinismo
            "type": event_type,
            **payload,
        }
        self.events.append(event)
        print(f"  [AUDIT] {event_type}: {json.dumps(payload, ensure_ascii=False)}")

    def count(self, event_type: str | None = None) -> int:
        if event_type is None:
            return len(self.events)
        return sum(1 for e in self.events if e["type"] == event_type)


# ---------------------------------------------------------------------------
# Guardrail: detección de inyección de prompts (determinista)
# ---------------------------------------------------------------------------

INJECTION_PATTERNS = [
    r"ignora\s+(todas\s+)?las\s+instrucciones",
    r"sin\s+confirmaci[oó]n",
    r"ejecuta\s+paymentservice",
    r"modo\s+dan",
    r"sin\s+restricciones",
    r"\bcvv\b",
    r"n[uú]mero\s+completo\s+de\s+tarjeta",
    r"transfiere\s+todos\s+los\s+fondos",
    r"act[uú]a\s+como\s+administrador",
]


class PromptGuardrail:
    """Bloquea entradas con patrones de inyección/jailbreak/fuga PII."""

    def __init__(self, audit: AuditBus):
        self.audit = audit

    def validate(self, user_input: str) -> dict[str, Any]:
        text = user_input.lower().strip()
        matched = [p for p in INJECTION_PATTERNS if re.search(p, text, re.IGNORECASE)]
        if matched:
            self.audit.publish("guardrail.prompt_blocked", {
                "reason": "prompt_injection_detected",
                "patterns": matched[:3],
                "input_preview": user_input[:80],
            })
            return {
                "allowed": False,
                "reason": "prompt_injection_detected",
                "message": "Solicitud rechazada por política de seguridad.",
            }
        return {"allowed": True}


# ---------------------------------------------------------------------------
# Idempotency store (simula guardrail.idempotency)
# ---------------------------------------------------------------------------


class IdempotencyStore:
    """Cachea resultados por clave; reintentos devuelven el mismo resultado."""

    def __init__(self):
        self._cache: dict[str, dict[str, Any]] = {}

    def get(self, key: str) -> dict[str, Any] | None:
        return self._cache.get(key)

    def put(self, key: str, result: dict[str, Any]) -> None:
        self._cache[key] = result


# ---------------------------------------------------------------------------
# Payment service + guardrails
# ---------------------------------------------------------------------------


@dataclass
class PaymentRequest:
    payment_id: str
    idempotency_key: str
    pnr: str
    passenger: str
    amount_usd: float
    description: str
    user_message: str
    confirmed: bool = False


class PaymentGateway:
    """Simula el servicio de cobro real (sin red)."""

    _charges: dict[str, dict[str, Any]] = {}

    def charge(self, req: PaymentRequest) -> dict[str, Any]:
        charge_id = f"CHG-{req.payment_id}"
        result = {
            "charge_id": charge_id,
            "payment_id": req.payment_id,
            "pnr": req.pnr,
            "amount_usd": req.amount_usd,
            "status": "captured",
            "timestamp": "2026-06-18T10:00:01Z",
        }
        self._charges[charge_id] = result
        return result


class GuardedPaymentService:
    """
    Envuelve PaymentGateway con la cadena de guardrails del template 01:
    prompt guard → confirm-gate → idempotency → charge → audit
    """

    def __init__(self, audit: AuditBus):
        self.audit = audit
        self.prompt_guard = PromptGuardrail(audit)
        self.idempotency = IdempotencyStore()
        self.gateway = PaymentGateway()

    def _user_confirmed(self, message: str) -> bool:
        msg = message.lower()
        return any(w in msg for w in CONFIRM_WORDS)

    def process(self, req: PaymentRequest) -> dict[str, Any]:
        # --- 1. Guardrail de inyección (pre-entrada) ---
        guard = self.prompt_guard.validate(req.user_message)
        if not guard["allowed"]:
            return {
                "status": "rejected",
                "reason": guard["reason"],
                "message": guard["message"],
            }

        self.audit.publish("payment.request_received", {
            "payment_id": req.payment_id,
            "idempotency_key": req.idempotency_key,
            "amount_usd": req.amount_usd,
            "pnr": req.pnr,
        })

        # --- 2. Confirm-gate (guardrail.confirm) ---
        needs_confirm = req.amount_usd >= CONFIRM_THRESHOLD
        is_confirmed = req.confirmed or self._user_confirmed(req.user_message)

        if needs_confirm and not is_confirmed:
            self.audit.publish("guardrail.confirm_pending", {
                "payment_id": req.payment_id,
                "amount_usd": req.amount_usd,
                "threshold_usd": CONFIRM_THRESHOLD,
            })
            return {
                "status": "pending_confirmation",
                "message": (
                    f"El cobro de USD {req.amount_usd:.2f} requiere confirmación explícita. "
                    f"¿Confirmas el cargo por '{req.description}'?"
                ),
            }

        # --- 3. Idempotencia (guardrail.idempotency) ---
        cached = self.idempotency.get(req.idempotency_key)
        if cached is not None:
            self.audit.publish("payment.deduplicated", {
                "idempotency_key": req.idempotency_key,
                "original_charge_id": cached.get("charge_id"),
            })
            return {
                **cached,
                "status": "deduplicated",
                "message": "Cobro ya procesado; devolviendo resultado cacheado.",
            }

        # --- 4. Ejecutar cobro ---
        self.audit.publish("tool.call", {
            "tool": "PaymentService",
            "args": {
                "payment_id": req.payment_id,
                "amount_usd": req.amount_usd,
                "pnr": req.pnr,
            },
        })

        result = self.gateway.charge(req)

        self.audit.publish("tool.result", {
            "tool": "PaymentService",
            "charge_id": result["charge_id"],
            "status": result["status"],
        })

        # Guardar en cache de idempotencia
        self.idempotency.put(req.idempotency_key, result)

        return {
            **result,
            "status": "captured",
            "message": f"Cobro exitoso: USD {req.amount_usd:.2f} para {req.passenger} ({req.pnr}).",
        }


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------


def _base_request() -> PaymentRequest:
    s = DATOS_PAGO["solicitudes"][0]
    return PaymentRequest(
        payment_id=s["payment_id"],
        idempotency_key=s["idempotency_key"],
        pnr=s["pnr"],
        passenger=s["passenger"],
        amount_usd=s["amount_usd"],
        description=s["description"],
        user_message=PROMPTS["entrada_legitima"],
        confirmed=False,
    )


def main() -> None:
    print("=" * 64)
    print("PAGO CON GUARDRAILS — stdlib, determinista")
    print("=" * 64)

    service = GuardedPaymentService(audit=AuditBus())

    # ------------------------------------------------------------------
    # ESCENARIO 1 — Primer cobro (sin confirmación explícita aún)
    # ------------------------------------------------------------------
    print("\n>>> ESCENARIO 1 — Solicitud sin confirmación")
    req1 = _base_request()
    req1.user_message = "Quiero pagar el cambio de vuelo SCL-BOG-001 por USD 130."
    print(f"USUARIO: {req1.user_message}\n")

    result1 = service.process(req1)
    print(f"RESULTADO: status={result1['status']}")
    if "message" in result1:
        print(f"MENSAJE: {result1['message']}")

    assert result1["status"] == "pending_confirmation", \
        f"Escenario 1: esperaba pending_confirmation, obtuvo {result1['status']}"

    # ------------------------------------------------------------------
    # ESCENARIO 2 — Primer cobro confirmado → captured
    # ------------------------------------------------------------------
    print("\n" + "-" * 64)
    print(">>> ESCENARIO 2 — Cobro confirmado (1.er intento)")
    req2 = _base_request()
    req2.user_message = PROMPTS["entrada_legitima"]
    req2.confirmed = True
    print(f"USUARIO: {req2.user_message}\n")

    result2 = service.process(req2)
    print(f"RESULTADO: status={result2['status']}, charge_id={result2.get('charge_id')}")
    print(f"MENSAJE: {result2.get('message')}")

    assert result2["status"] == "captured", \
        f"Escenario 2: esperaba captured, obtuvo {result2['status']}"
    assert result2.get("charge_id") == "CHG-PAY-2026-001"

    # ------------------------------------------------------------------
    # ESCENARIO 3 — Misma clave de idempotencia → deduplicated
    # ------------------------------------------------------------------
    print("\n" + "-" * 64)
    print(">>> ESCENARIO 3 — Reintento con misma idempotency_key")
    req3 = _base_request()
    req3.user_message = PROMPTS["entrada_legitima"]
    req3.confirmed = True
    print(f"USUARIO: {req3.user_message} (reintento por reconexión SSE)\n")

    result3 = service.process(req3)
    print(f"RESULTADO: status={result3['status']}, charge_id={result3.get('charge_id')}")
    print(f"MENSAJE: {result3.get('message')}")

    assert result3["status"] == "deduplicated", \
        f"Escenario 3: esperaba deduplicated, obtuvo {result3['status']}"
    assert result3.get("charge_id") == "CHG-PAY-2026-001"

    # ------------------------------------------------------------------
    # ESCENARIO 4 — Inyección de prompts → rechazado
    # ------------------------------------------------------------------
    print("\n" + "-" * 64)
    print(">>> ESCENARIO 4 — Test de inyección de prompts")
    malicious = PROMPTS["casos"][0]
    print(f"USUARIO (malicioso): {malicious['entrada']}\n")

    req4 = _base_request()
    req4.user_message = malicious["entrada"]
    req4.confirmed = True

    result4 = service.process(req4)
    print(f"RESULTADO: status={result4['status']}, reason={result4.get('reason')}")
    print(f"MENSAJE: {result4.get('message')}")

    assert result4["status"] == "rejected", \
        f"Escenario 4: esperaba rejected, obtuvo {result4['status']}"
    assert result4.get("reason") == "prompt_injection_detected"

    # ------------------------------------------------------------------
    # Resumen de auditoría
    # ------------------------------------------------------------------
    print("\n" + "=" * 64)
    print("RESUMEN DE AUDITORÍA")
    print("=" * 64)
    audit = service.audit
    print(f"Eventos totales: {audit.count()}")
    print(f"  - payment.request_received: {audit.count('payment.request_received')}")
    print(f"  - guardrail.confirm_pending: {audit.count('guardrail.confirm_pending')}")
    print(f"  - tool.call: {audit.count('tool.call')}")
    print(f"  - payment.deduplicated: {audit.count('payment.deduplicated')}")
    print(f"  - guardrail.prompt_blocked: {audit.count('guardrail.prompt_blocked')}")

    assert audit.count() >= 1, "Debe haber al menos 1 evento de auditoría"
    assert audit.count("tool.call") == 1, "Solo 1 cobro real debe ejecutarse"
    assert audit.count("payment.deduplicated") == 1
    assert audit.count("guardrail.prompt_blocked") == 1

    print("\nTodas las verificaciones pasaron.")


if __name__ == "__main__":
    main()

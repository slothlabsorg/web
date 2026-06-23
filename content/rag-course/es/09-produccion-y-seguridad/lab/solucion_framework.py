# Requiere: pip install guardrails-ai langfuse gradio fastapi uvicorn opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
"""
Pago con Guardrails — Capa ③ (frameworks reales)
=================================================
Ilustrativo: muestra cómo implementar el mismo taller con herramientas
de producción. No se ejecuta en el entorno del curso (requiere pip y red).

Para ejecutar cuando tengas entorno completo:
  pip install guardrails-ai langfuse gradio fastapi uvicorn \
              opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
  export LANGFUSE_PUBLIC_KEY="pk-..."
  export LANGFUSE_SECRET_KEY="sk-..."
  python3 solucion_framework.py          # lanza Gradio en :7860
  uvicorn solucion_framework:app --reload  # API FastAPI en :8000
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Datos (igual que scratch)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"

DATOS_PAGO = json.loads((_DATOS / "solicitudes_pago.json").read_text(encoding="utf-8"))
PROMPTS = json.loads((_DATOS / "prompts_maliciosos.json").read_text(encoding="utf-8"))

CONFIRM_THRESHOLD = float(DATOS_PAGO["umbrales"]["confirm_gate_usd"])
CONFIRM_WORDS = ("confirmo", "confirmar", "acepto", "de acuerdo", "procede")


# ---------------------------------------------------------------------------
# Bloque 1 — Guardrails AI: validación de entrada (reemplaza PromptGuardrail)
# Ver guia.md §12.3
# ---------------------------------------------------------------------------
from guardrails import Guard  # noqa: E402
from guardrails.hub import DetectPII, ToxicLanguage  # noqa: E402


def build_input_guard() -> Guard:
    """
    Guardrails AI valida la entrada del usuario antes de llegar al agente.
    Equivalente a PromptGuardrail.validate() del scratch.
    """
    guard = Guard().use(
        DetectPII(pii_entities=["CREDIT_CARD", "CVV"], on_fail="exception"),
    ).use(
        ToxicLanguage(threshold=0.5, validation_method="sentence", on_fail="exception"),
    )
    return guard


def validate_user_input(text: str) -> dict[str, Any]:
    """Envuelve el guard de Guardrails AI con manejo de errores."""
    guard = build_input_guard()
    try:
        guard.validate(text)
        return {"allowed": True}
    except Exception as exc:
        return {
            "allowed": False,
            "reason": "guardrails_ai_blocked",
            "message": f"Solicitud rechazada: {exc}",
        }


# ---------------------------------------------------------------------------
# Bloque 2 — Langfuse: trazas LLM (reemplaza AuditBus para observabilidad)
# Ver guia.md §12.5
# ---------------------------------------------------------------------------
from langfuse.decorators import langfuse_context, observe  # noqa: E402


@observe(name="payment.process")
def process_payment_framework(
    payment_id: str,
    idempotency_key: str,
    amount_usd: float,
    pnr: str,
    user_message: str,
    confirmed: bool = False,
    idempotency_cache: dict | None = None,
) -> dict[str, Any]:
    """
    Misma lógica que GuardedPaymentService.process() pero con decorador
    @observe de Langfuse para trazabilidad automática.
    """
    cache = idempotency_cache if idempotency_cache is not None else {}

    langfuse_context.update_current_observation(
        metadata={"payment_id": payment_id, "pnr": pnr, "amount_usd": amount_usd},
    )

    # Guardrail de entrada (Guardrails AI)
    guard_result = validate_user_input(user_message)
    if not guard_result["allowed"]:
        langfuse_context.update_current_observation(output=guard_result)
        return {"status": "rejected", **guard_result}

    # Confirm-gate
    is_confirmed = confirmed or any(w in user_message.lower() for w in CONFIRM_WORDS)
    if amount_usd >= CONFIRM_THRESHOLD and not is_confirmed:
        result = {
            "status": "pending_confirmation",
            "message": f"El cobro de USD {amount_usd:.2f} requiere confirmación.",
        }
        langfuse_context.update_current_observation(output=result)
        return result

    # Idempotencia
    if idempotency_key in cache:
        cached = cache[idempotency_key]
        result = {**cached, "status": "deduplicated"}
        langfuse_context.update_current_observation(output=result)
        return result

    # Cobro real
    charge = {
        "charge_id": f"CHG-{payment_id}",
        "payment_id": payment_id,
        "pnr": pnr,
        "amount_usd": amount_usd,
        "status": "captured",
    }
    cache[idempotency_key] = charge
    result = {**charge, "message": f"Cobro exitoso: USD {amount_usd:.2f}."}
    langfuse_context.update_current_observation(output=result)
    return result


# ---------------------------------------------------------------------------
# Bloque 3 — OpenTelemetry: métricas de infra (complementa Langfuse)
# Ver guia.md §12.6
# ---------------------------------------------------------------------------
from opentelemetry import metrics  # noqa: E402
from opentelemetry.sdk.metrics import MeterProvider  # noqa: E402
from opentelemetry.sdk.metrics.export import InMemoryMetricReader  # noqa: E402

_reader = InMemoryMetricReader()
_provider = MeterProvider(metric_readers=[_reader])
metrics.set_meter_provider(_provider)
_meter = metrics.get_meter("payment-service")

payments_total = _meter.create_counter(
    "payments_total",
    description="Total de intentos de cobro por status",
)


def record_payment_metric(status: str) -> None:
    payments_total.add(1, {"status": status})


# ---------------------------------------------------------------------------
# Bloque 4 — Gradio UI (reemplaza consola del scratch)
# Ver guia.md §12.7
# ---------------------------------------------------------------------------
import gradio as gr  # noqa: E402

_idempotency_cache: dict[str, dict] = {}


def gradio_chat(user_message: str, history: list) -> str:
    """Interfaz de chat para probar el flujo de pago con guardrails."""
    s = DATOS_PAGO["solicitudes"][0]
    result = process_payment_framework(
        payment_id=s["payment_id"],
        idempotency_key=s["idempotency_key"],
        amount_usd=s["amount_usd"],
        pnr=s["pnr"],
        user_message=user_message,
        idempotency_cache=_idempotency_cache,
    )
    record_payment_metric(result.get("status", "unknown"))
    return result.get("message", json.dumps(result, ensure_ascii=False))


def launch_gradio() -> None:
    demo = gr.ChatInterface(
        fn=gradio_chat,
        title="Pago con Guardrails — Demo Gradio",
        description=(
            "Prueba el flujo de cobro con confirm-gate e idempotencia. "
            "Intenta: (1) pedir cobro sin confirmar, (2) confirmar, "
            "(3) reintentar (deduplicated), (4) prompt malicioso."
        ),
        examples=[
            "Quiero pagar el cambio de vuelo SCL-BOG-001 por USD 130.",
            PROMPTS["entrada_legitima"],
            PROMPTS["casos"][0]["entrada"],
        ],
    )
    demo.launch(server_name="0.0.0.0", server_port=7860)


# ---------------------------------------------------------------------------
# Bloque 5 — FastAPI (deployment target chat-service de RAGorbit)
# Ver guia.md §12.8
# ---------------------------------------------------------------------------
from fastapi import FastAPI, HTTPException  # noqa: E402
from pydantic import BaseModel  # noqa: E402

app = FastAPI(title="Payment Guardrails API")


class PaymentRequest(BaseModel):
    payment_id: str
    idempotency_key: str
    pnr: str
    amount_usd: float
    user_message: str
    confirmed: bool = False


@app.post("/v1/payments")
def api_process_payment(req: PaymentRequest) -> dict[str, Any]:
    """Endpoint REST equivalente al nodo io.input + guardrails del grafo."""
    result = process_payment_framework(
        payment_id=req.payment_id,
        idempotency_key=req.idempotency_key,
        amount_usd=req.amount_usd,
        pnr=req.pnr,
        user_message=req.user_message,
        confirmed=req.confirmed,
        idempotency_cache=_idempotency_cache,
    )
    record_payment_metric(result.get("status", "unknown"))
    if result.get("status") == "rejected":
        raise HTTPException(status_code=403, detail=result)
    return result


# ---------------------------------------------------------------------------
# Demo CLI (sin levantar servidor)
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 64)
    print("PAGO CON GUARDRAILS — Framework (ilustrativo)")
    print("=" * 64)
    print("\nEste script requiere pip install y claves de Langfuse.")
    print("Para probar interactivamente:")
    print("  - Gradio:  python3 -c 'from solucion_framework import launch_gradio; launch_gradio()'")
    print("  - FastAPI: uvicorn solucion_framework:app --reload")
    print("\nEjecutando los 4 escenarios del scratch con la lógica framework...\n")

    cache: dict[str, dict] = {}
    s = DATOS_PAGO["solicitudes"][0]

    scenarios = [
        ("Sin confirmación", "Quiero pagar el cambio de vuelo SCL-BOG-001 por USD 130.", False),
        ("Confirmado (1.er cobro)", PROMPTS["entrada_legitima"], True),
        ("Reintento idempotente", PROMPTS["entrada_legitima"], True),
        ("Inyección", PROMPTS["casos"][0]["entrada"], True),
    ]

    for label, msg, confirmed in scenarios:
        result = process_payment_framework(
            payment_id=s["payment_id"],
            idempotency_key=s["idempotency_key"],
            amount_usd=s["amount_usd"],
            pnr=s["pnr"],
            user_message=msg,
            confirmed=confirmed,
            idempotency_cache=cache,
        )
        record_payment_metric(result.get("status", "unknown"))
        print(f"[{label}] status={result.get('status')} — {result.get('message', result)}")

    print("\nMétricas OTel registradas. Ver dashboard Langfuse para trazas.")


if __name__ == "__main__":
    main()

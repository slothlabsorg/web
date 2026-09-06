# Lab M9 · Pago con Guardrails — Producción & Seguridad

## Brief de negocio

Eres ingeniero en la aerolínea del template `01-airline-flight-change`. El agente ReAct del M6 ya calcula el costo del cambio de vuelo (USD 130) y pide confirmación al pasajero. Falta la **capa de producción** que envuelve el `PaymentService` antes de ir a producción:

1. **Confirm-gate** — ningún cobro ≥ USD 50 sin confirmación explícita del usuario.
2. **Idempotencia** — si el cliente reconecta (SSE/WebSocket) y reenvía el mismo cobro, no se cobra dos veces.
3. **Auditoría** — cada intento de cobro queda registrado en un bus (Kafka en producción; lista en memoria en el lab).
4. **Anti-inyección** — un atacante no puede saltarse el confirm-gate con un prompt malicioso.

Este es el mismo patrón que ves en el `flow.json` del template 01:

```
tool.service "PaymentService"
  ← guardrail.idempotency
  ← guardrail.confirm
  ← guardrail.resilience
```

Y en observabilidad:

```
agent.react → observability.audit → io.output
```

## Datos disponibles

En `lab/datos/`:

| Archivo | Contenido |
|---------|-----------|
| `solicitudes_pago.json` | Solicitud de cobro por cambio de vuelo SCL-BOG-001 (USD 130) + umbrales |
| `prompts_maliciosos.json` | Casos de inyección/jailbreak/fuga PII + entrada legítima de confirmación |

## Tarea

### Parte A — Guardrails desde cero (capa ②)

Implementa `lab/solucion_scratch.py` con **solo stdlib**:

1. **`AuditBus`** — lista en memoria que publica eventos con `type`, `ts` fijo y payload. Imprime `[AUDIT] type: {...}`.

2. **`PromptGuardrail`** — valida la entrada del usuario con patrones regex deterministas (inyección, jailbreak, fuga PII). Si bloquea, publica `guardrail.prompt_blocked` al bus.

3. **`IdempotencyStore`** — diccionario `idempotency_key → resultado`. Segundo llamado con la misma clave devuelve el resultado cacheado con `status=deduplicated`.

4. **`GuardedPaymentService`** — envuelve un `PaymentGateway` mock con la cadena:
   - prompt guard → confirm-gate (umbral USD 50) → idempotencia → cobro → audit.

5. **`main()`** con 4 escenarios:
   - **Escenario 1:** solicitud sin confirmación → `pending_confirmation`
   - **Escenario 2:** confirmación explícita → `captured` (1.er cobro)
   - **Escenario 3:** misma `idempotency_key` → `deduplicated`
   - **Escenario 4:** prompt malicioso → `rejected`

6. **`assert`** al final verificando las propiedades de `expected.md`.

### Parte B — Frameworks reales (capa ③, tarea guiada)

> **Lee primero:** [guia.md §12 — La capa ③ explicada](../guia.md#12-la-capa--explicada-guardrails-observabilidad-y-uis-con-frameworks-desde-cero).

**Objetivo:** reimplementar el mismo flujo con Guardrails AI, Langfuse, OpenTelemetry, Gradio y FastAPI.

**Requisitos de entorno** (fuera de la máquina del curso):

```bash
pip install guardrails-ai langfuse gradio fastapi uvicorn \
            opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp
```

**Piezas a implementar** (ver `solucion_framework.py` como referencia):

| Pieza scratch | Framework |
|---------------|-----------|
| `PromptGuardrail` | `Guard().use(DetectPII, ToxicLanguage)` de Guardrails AI |
| `AuditBus` | `@observe` de Langfuse + span OTel |
| `IdempotencyStore` | Mismo dict (o Redis en producción) |
| Consola `main()` | `gr.ChatInterface` de Gradio |
| — | `FastAPI` POST `/v1/payments` (deployment target `chat-service`) |

## Pistas escalonadas

<details>
<summary>Pista 1 — Estructura del confirm-gate</summary>

El confirm-gate NO depende del LLM. Evalúa una condición determinista:

```python
needs_confirm = amount_usd >= CONFIRM_THRESHOLD
is_confirmed = req.confirmed or any(w in user_message.lower() for w in CONFIRM_WORDS)
if needs_confirm and not is_confirmed:
    return {"status": "pending_confirmation", ...}
```

</details>

<details>
<summary>Pista 2 — Orden de la cadena de guardrails</summary>

El orden importa. En el template 01 la cadena sobre PaymentService es:

```
idempotency → confirm → resilience → PaymentService
```

En el lab (sin resilience), el orden recomendado es:

```
prompt_guard (entrada) → confirm_gate → idempotency → charge → audit
```

La idempotencia va **después** del confirm-gate para no cachear intentos rechazados.

</details>

<details>
<summary>Pista 3 — Clave de idempotencia</summary>

Usa el campo `idempotency_key` del JSON (`idem-SCL-BOG-001-130`). En producción, el cliente envía `Idempotency-Key` en el header HTTP — mismo concepto que Stripe.

</details>

<details>
<summary>Pista 4 — Patrones de inyección</summary>

No necesitas un LLM para detectar inyección en el lab. Lista de regex es suficiente:

```python
INJECTION_PATTERNS = [
    r"ignora\s+(todas\s+)?las\s+instrucciones",
    r"sin\s+confirmaci[oó]n",
    r"ejecuta\s+paymentservice",
    ...
]
```

En producción, combina regex + Guardrails AI + tests automatizados (promptfoo).

</details>

<details>
<summary>Pista 5 — Eventos de auditoría mínimos</summary>

Publica al menos estos tipos:

- `payment.request_received` — cada intento
- `guardrail.confirm_pending` — confirm-gate activado
- `tool.call` / `tool.result` — cobro ejecutado
- `payment.deduplicated` — idempotencia activada
- `guardrail.prompt_blocked` — inyección bloqueada

</details>

## Criterios de éxito

Consulta [`expected.md`](expected.md). Resumen:

| Escenario | `status` esperado |
|-----------|-------------------|
| Sin confirmación | `pending_confirmation` |
| 1.er cobro confirmado | `captured` |
| Reintento misma clave | `deduplicated` |
| Prompt malicioso | `rejected` |

Además: exactamente **1** `tool.call` (un solo cobro real) y **≥ 1** evento de auditoría total.

## Verificación

```bash
python3 -m py_compile solucion_scratch.py
python3 solucion_scratch.py
```

La salida debe coincidir con `expected.md`.

## Conexión con RAGorbit

Abre [`examples/01-airline-flight-change/flow.json`](../../examples/01-airline-flight-change/flow.json) y localiza:

- `guardrail.idempotency`, `guardrail.confirm`, `guardrail.resilience` sobre `PaymentService`
- `observability.audit` con `sink: kafka`

Después de este lab, podrás explicar **por qué** cada guardrail está en ese orden y qué pasaría si faltara alguno.

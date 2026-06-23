# M9 · Soluciones — Producción & Seguridad

---

## Ejercicio 1

| Restricción | Dónde | Justificación |
|-------------|-------|---------------|
| **(a)** Cobro > USD 500 sin supervisor | `hitl.escalate` (o `guardrail.pre-tool` + HITL) | Consecuencia financiera alta; debe ser trip-wire determinista, no prompt |
| **(b)** Tono empático | System prompt | Preferencia de estilo; bajo riesgo si falla |
| **(c)** No cobrar dos veces misma clave | `guardrail.idempotency` | Transaccional; patrón estándar Stripe; el LLM no controla reintentos de red |
| **(d)** No revelar tarjeta completa | Guardrails AI / `guardrail` de salida + post-procesado | Fuga de PII; validación determinista de patrones de tarjeta en output |
| **(e)** Reintentar InventoryService 3 veces | `guardrail.resilience` | Resiliencia infra; retry con backoff es lógica de infraestructura, no del LLM |

---

## Ejercicio 2

**Respuesta: B** — Kafka event-worker + OpenTelemetry + `observability.audit`.

- 50 000 eventos/hora y procesamiento < 30 s encaja con `io.event-source` + `deploymentTarget: event-worker` (template 10).
- Temporal sería overkill: los workflows no duran días.
- FastAPI/Gradio son para chat conversacional, no fan-out masivo.
- Batch con cron no procesa eventos en tiempo real.

---

## Ejercicio 3

**`guardrail.confirm`:** pausa automática ante umbral (ej. pago > USD 50); el **mismo usuario** en el **mismo canal** confirma con "sí" en segundos. Template 01: cobro de USD 130 por cambio de vuelo.

**`hitl.escalate`:** escala a un **humano experto** con SLA de horas/días; condición determinista fuera del LLM. Template 03: autorización médica ambigua que requiere revisión de un médico antes de aprobar un procedimiento.

Diferencia clave: confirm-gate = fricción UX controlada; HITL = decisión que el agente no debe tomar solo.

---

## Ejercicio 4

```
captured
deduplicated
captured
CHG-001
```

La segunda llamada con `key-A` devuelve cache. `key-B` es cobro nuevo. El `charge_id` del cache sigue siendo `CHG-001`.

---

## Ejercicio 5

**Bug:** usa `llm_response` para decidir confirmación — un jailbreak puede hacer que el LLM diga "sí" sin input real del usuario.

**Arreglo:** evaluar el mensaje **del usuario** directamente:

```python
CONFIRM_WORDS = ("confirmo", "acepto", "sí")
if amount >= 50:
    if not any(w in user_message.lower() for w in CONFIRM_WORDS):
        return {"status": "pending"}
return charge(amount)
```

O mejor: nodo `guardrail.confirm` en el grafo con flag `confirmed` del estado de sesión.

---

## Ejercicio 6

| Necesidad | Herramienta |
|-----------|-------------|
| Depurar 5 tool calls | **LangSmith** (nativo LangChain) o Langfuse |
| Dashboard OSS prompts/costos | **Langfuse** |
| P95 latencia consumer Kafka | **OpenTelemetry + Grafana** |
| Audit trail regulatorio | **`observability.audit`** → Kafka/log (ninguna de las tres) |

---

## Ejercicio 7

Secuencia aproximada en Kafka topic `flight-change-audit`:

1. `{type: "tool.call", tool: "PaymentService", args: {pnr, amount: 130}, ts, session_id}`
2. `{type: "tool.result", tool: "PaymentService", result: {status: "captured", charge_id}, ts}`
3. *(opcional)* `{type: "payment.confirmed", pnr, amount: 130, ts}`

El nodo es **passthrough**: recibe el mensaje del agente, publica, y lo pasa a `io.output` sin modificarlo.

---

## Ejercicio 8

| Nodo | Target | Ejemplo |
|------|--------|---------|
| `io.input` | `chat-service` | 01-airline (chat web) |
| `io.event-source` | `event-worker` | 10-logistics (Kafka disrupciones) |
| `io.batch` | `batch` | 02-banking (scoring nocturno) |
| `io.trigger` | `temporal` | Onboarding bancario multi-día |

---

## Ejercicio 9

**Temporal.**

1. **Duración:** 5 días con esperas humanas — Temporal persiste el estado del workflow y sobrevive reinicios; Kafka+Postgres requiere implementar sagas y timers manualmente.
2. **HITL nativo:** Temporal tiene signals/activities para "esperar aprobación del oficial" como primer ciudadano.
3. **Compensaciones:** si el cliente abandona, Temporal puede ejecutar rollback de pasos previos.

Kafka+Postgres gana en throughput masivo de eventos cortos (template 10), no en procesos interminables.

---

## Ejercicio 10

1. **Entrada:** `PromptGuardrail` / Guardrails AI — detecta "olvida tus reglas", "eres admin", "ejecuta PaymentService".
2. **Herramienta:** `guardrail.confirm` + `guardrail.pre-tool` — aunque el LLM emita tool call, el grafo bloquea cobros sin confirmación y con amount=0 sospechoso.
3. **Permisos:** scope del agente no incluye bypass de confirm; en MCP (M8), `roots` y aprobación de sampling impiden acciones no autorizadas.

---

## Ejercicio 11

```python
["error", "error", "error", "fallback", "fallback"]
```

Las primeras 3 llamadas lanzan `TimeoutError` (registradas como "error"). En la 3.ª, `circuit_open = True`. Las llamadas 4 y 5 devuelven "fallback" sin intentar el servicio.

---

## Ejercicio 12

`observability.feedback` captura señales (thumbs up/down del agente humano del call center, callbacks de transacción). El `feedbackRef` en `retrieval.reranker` usa esas señales para **re-entrenar o ajustar pesos** del reranker — mejora qué chunks suben al top-k sin tocar el LLM base.

El LLM sigue generando; lo que mejora es **qué contexto recibe** — más barato y auditable que fine-tuning.

---

## Ejercicio 13

| Caso | UI | Por qué |
|------|-----|---------|
| Demo interno RAG | **Gradio** | Chat en ~20 líneas; HF Spaces para compartir |
| Dashboard evaluación | **Streamlit** | Widgets, gráficas, integración TruLens/RAGAS |
| API producción JWT+SSE | **FastAPI** | Contrato estable, auth, WebSocket — codegen RAGorbit |

---

## Ejercicio 14

**Escenario que falla:**

1. Usuario pide cobro → `confirmed=False` → `{"status": "pending"}` **no se cachea** en el bug mostrado... 

En el código dado, si el primer llamado con `confirmed=False` **no** entra al cache, el segundo con `confirmed=True` funciona. Pero si el primer llamado **sí** cachea `pending`:

```python
# Variante del bug: cachea el pending
cache[key] = {"status": "pending"}  # al primer intento
# Usuario confirma → segundo intento devuelve pending cacheado ¡sin cobrar!
```

El bug del enunciado: cachear **antes** de confirmación hace que reconexiones tras confirmar devuelvan estado obsoleto. La idempotencia debe aplicarse solo a cobros **ejecutados** o claves que incluyan el estado confirmado.

---

## Ejercicio 15

| Escenario | Mejor opción |
|-----------|--------------|
| JSON schema salida | **Guardrails AI** (validador de schema) o `logic.structured` propio |
| Rail multi-turno Colang | **NeMo Guardrails** |
| Confirm-gate pago > USD 500 | **Propio (RAGorbit)** — determinista, auditable |
| Detectar PII en respuesta | **Guardrails AI** `DetectPII` + propio como red de seguridad |

---

## Ejercicio 16

```
io.event-source (Kafka)
       ↓ Event
agent.fanout
       ↓ (por cada shipment)
guardrail.idempotency  ← evita rebooking duplicado
       ↓
agent.react / lógica determinista
       ↓
observability.metrics  ← throughput, auto-confirm vs LLM
       ↓
io.notify (email/SMS)  ← aviso al cliente
       ↓
observability.audit
```

---

## Ejercicio 17

1. **Sesgo de género en políticas de parental leave** — test: mismas preguntas con nombres masculinos/femeninos; comparar respuestas (paridad de citas y recomendaciones).
2. **Cobertura desigual por tipo de contrato** — test: preguntas sobre temporales vs indefinidos; verificar que el retrieval no omite secciones relevantes (context recall).
3. **Alucinación de beneficios no documentados** — métrica faithfulness (RAGAS) + citas obligatorias (`logic.citations`).

---

## Ejercicio 18

```python
def pre_tool_guard(tool_name: str, args: dict) -> dict:
    if tool_name == "PaymentService" and args.get("amount_usd", 0) > 1000:
        return {
            "allowed": False,
            "error": "denied",
            "message": "Montos > USD 1000 requieren aprobación HITL.",
        }
    return {"allowed": True}
```

Si falla: devuelve error **sin ejecutar** el servicio — el agente recibe el error como observación.

---

## Ejercicio 19

**No aceptaría** sin evaluación rigurosa.

- **A favor:** costo cero por token; privacidad (audio no sale del datacenter).
- **En contra 1:** Whisper no es streaming nativo — latencia > 1.5 s para copilot en vivo.
- **En contra 2:** Deepgram Nova-2 está optimizado para telefonía (ruido, codecs); Whisper general-purpose puede degradar WER en call center.

Alternativa: Deepgram para streaming + Whisper para post-procesamiento offline.

---

## Ejercicio 20

Checklist go-live template 01:

1. **`guardrail.confirm`** en PaymentService con umbral USD 50 — test E2E de confirmación.
2. **`guardrail.idempotency`** con `keyFields` [pnr, amount] — test de reconexión SSE.
3. **`guardrail.resilience`** en PaymentService — test de fallback con mock de timeout.
4. **`observability.audit`** → Kafka topic `flight-change-audit` — verificar eventos en consumer.
5. **Tests de inyección** (promptfoo o suite M9) — jailbreaks no ejecutan cobro.
6. **Guardrails AI / PII** en salida — no filtrar números de tarjeta.
7. **FastAPI** con JWT (`io.input.auth: jwt`) + rate limiting.
8. **Langfuse/OTel** — alertas de latencia P95 y tasa de error en tool calls.

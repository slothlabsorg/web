# Solución del Lab M9 — Pago con Guardrails

---

## Capa ② — Solución desde cero (`solucion_scratch.py`)

### Arquitectura general

```
Entrada del usuario
       ↓
[PromptGuardrail.validate]  → si bloquea → rejected + audit
       ↓
[GuardedPaymentService.process]
       ├─ audit: payment.request_received
       ├─ [Confirm-gate]  → si amount ≥ umbral y no confirmado → pending_confirmation
       ├─ [IdempotencyStore.get]  → si existe → deduplicated + audit
       ├─ [PaymentGateway.charge]  → captured
       └─ audit: tool.call + tool.result + idempotency.put
```

### Por qué el orden importa

1. **Prompt guard primero** — no tiene sentido auditar ni evaluar confirm-gate si la entrada ya es maliciosa.
2. **Confirm-gate antes de idempotencia** — si cacheas un intento sin confirmación, un reintento legítimo devolvería `pending_confirmation` cacheado en lugar de permitir el cobro tras confirmar.
3. **Idempotencia antes del cobro** — evita ejecutar el gateway dos veces; es el patrón `Idempotency-Key` de Stripe.
4. **Audit en cada paso** — passthrough como `observability.audit` de RAGorbit: publica y deja pasar el dato.

### Confirm-gate determinista

```python
needs_confirm = req.amount_usd >= CONFIRM_THRESHOLD  # USD 50
is_confirmed = req.confirmed or self._user_confirmed(req.user_message)
```

El LLM **no** decide si el cobro requiere confirmación. El nodo `guardrail.confirm` del grafo evalúa `amount_usd >= 50` de forma determinista — igual que aquí.

### Idempotencia

```python
cached = self.idempotency.get(req.idempotency_key)
if cached is not None:
    return {**cached, "status": "deduplicated", ...}
# ... cobro real ...
self.idempotency.put(req.idempotency_key, result)
```

En producción, este dict sería Redis con TTL 24h o una tabla Postgres con constraint `UNIQUE(idempotency_key)`.

### Anti-inyección con regex

Para el lab, patrones regex son suficientes y deterministas. En producción:

- Regex para patrones conocidos (rápido, barato).
- Guardrails AI / NeMo para toxicidad, PII y jailbreaks semánticos.
- Tests automatizados con promptfoo o suite propia (como el Escenario 4).

### Resultados verificados

| Escenario | status | Cobro real |
|-----------|--------|------------|
| Sin confirmación | `pending_confirmation` | No |
| Confirmado | `captured` | Sí (1 vez) |
| Reintento | `deduplicated` | No |
| Inyección | `rejected` | No |

---

## Capa ③ — Solución con frameworks (`solucion_framework.py`)

### Tabla puente scratch → framework

| Scratch | Framework | Bloque en solucion_framework.py |
|---------|-----------|--------------------------------|
| `PromptGuardrail` | Guardrails AI `Guard().use(DetectPII, ToxicLanguage)` | Bloque 1 |
| `AuditBus` | Langfuse `@observe` | Bloque 2 |
| Métricas de throughput | OpenTelemetry `Counter` | Bloque 3 |
| Consola `main()` | Gradio `ChatInterface` | Bloque 4 |
| — | FastAPI `POST /v1/payments` | Bloque 5 |

### Guardrails AI vs propio

- **Propio (scratch/RAGorbit):** reglas de negocio financieras — confirm-gate, idempotencia, umbrales. Determinista, auditable.
- **Guardrails AI:** validación de *contenido* — PII, toxicidad, formato. Complementa, no reemplaza, los guardrails del grafo.

### Langfuse vs AuditBus

`AuditBus` registra eventos de negocio (`payment.deduplicated`). Langfuse registra *trazas* de la función `process_payment_framework` — latencia, tokens (si hubiera LLM), metadata. En producción usas ambos: audit regulatorio en Kafka + Langfuse para debugging.

### Gradio vs FastAPI

- **Gradio:** prototipo y demos internas (~20 líneas para un chat).
- **FastAPI:** producción con contrato API, auth JWT, SSE/WebSocket — lo que genera RAGorbit con `deploymentTarget: chat-service`.

### Qué NO hace el framework que sí hace el scratch

El `solucion_framework.py` no implementa `guardrail.resilience` (circuit breaker). Eso se añadiría con `tenacity` o a nivel de service mesh (Istio). El template 01 lo tiene sobre PaymentService para APIs de pago con disponibilidad variable.

---

## Lecciones clave

1. **Las restricciones financieras van en el grafo, no en el prompt.** "No cobres sin confirmación" en el system prompt es insuficiente; un jailbreak lo ignora.
2. **La idempotencia es obligatoria en canales con reconexión** (SSE, WebSocket, móvil).
3. **La auditoría es passthrough** — no modifica el flujo, solo observa. Crítico para regulación (aerolíneas, banca, salud).
4. **La seguridad de IA tiene capas:** entrada (inyección), herramientas (pre-tool, confirm), salida (PII en respuesta), permisos (MCP M8).

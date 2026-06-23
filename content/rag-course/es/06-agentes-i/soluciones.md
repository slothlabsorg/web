# M6 · Soluciones — Agentes I

---

## Ejercicio 14 · Agente o pipeline

**(a) PDF de boletín mensual → Pipeline determinista.**
El proceso es siempre el mismo y no hay decisiones que dependan de datos desconocidos en diseño. Un pipeline `loader → chunker → logic.prompt → io.output` es suficiente y más predecible.

**(b) Transferencia bancaria con verificación previa → Agente.**
El número de herramientas y el orden depende de lo que diga el usuario. El agente necesita consultar saldo, verificar cuenta destino, y potencialmente hacer la transferencia, pero el orden y si se ejecutan todos los pasos depende de cada respuesta.

**(c) Estado de envío por número de orden → Pipeline determinista.**
El PNR viene del JWT, la consulta es siempre la misma, la respuesta es directa. Un pipeline `io.input → tool.service → logic.prompt → io.output` resuelve el caso con costo mínimo.

**(d) Preguntas de RRHH sobre un documento → Pipeline determinista (RAG simple).**
Siempre es: usuario pregunta → buscar en el documento → responder. No hay ramificaciones ni tools adicionales. Un pipeline con `store.chroma + retrieval.vector + logic.prompt` es óptimo.

**(e) Diagnóstico de red → Agente.**
Cada paso depende del anterior: no sabes de antemano qué logs revisar, qué servicios hacer ping, ni si hay tickets anteriores relevantes. El agente necesita razonar en cada paso sobre qué herramienta usar según las observaciones previas.

---

## Ejercicio 15 · Traza el bucle ReAct

**Turno del usuario:** "Quiero devolver el pedido ORD-0998. Es que llegó incompleto."

```
[PASO 1]
  Thought: El usuario quiere devolver el pedido ORD-0998. Necesito verificar
           el estado y el monto del pedido antes de proceder.
  Action: OrderService(order_id="ORD-0998")
  Observation: { "order_id": "ORD-0998", "status": "entregado",
                 "amount": 240.00, "items": ["Zapatos talla 42", "Cinturón"] }

[PASO 2]
  Thought: El pedido existe y está entregado por $240. Necesito verificar
           la política de devoluciones para este tipo de caso (llegó incompleto).
  Action: PolicyRAG(query="política devolución pedido incompleto")
  Observation: [{ "text": "Devoluciones por producto incompleto son aceptadas
                  dentro de 30 días. El cliente recibe reembolso completo.",
                  "source": "politica-devoluciones#§2.1" }]

[PASO 3 — guardrail.confirm se activa]
  Thought: La política permite la devolución. El monto es $240 > $200,
           por lo que debo solicitar confirmación explícita antes de ejecutar.

  ← El guardrail.confirm intercepta la llamada a ReturnService (amount > 200)
     y devuelve el mensaje de confirmación al usuario. El agente NO ejecuta
     ReturnService todavía.

  RESPUESTA AL USUARIO (antes de cobrar):
  "El pedido ORD-0998 por $240.00 califica para devolución completa según
   §2.1 (producto incompleto). ¿Confirmas que deseas proceder con la
   devolución por $240.00?"

[— usuario responde "sí" —]

[PASO 4 — ahora sí se llama ReturnService]
  Thought: El usuario confirmó. Ejecuto la devolución.
  Action: ReturnService(order_id="ORD-0998", reason="producto incompleto", amount=240.00)
  Observation: { "return_id": "RET-4422", "status": "iniciada",
                 "refund_amount": 240.00, "eta_days": 5 }

[RESPUESTA FINAL]
  "He iniciado la devolución del pedido ORD-0998.
   - ID de devolución: RET-4422
   - Reembolso: $240.00 en 3-5 días hábiles
   ¿Hay algo más en lo que pueda ayudarte?"
```

El `guardrail.confirm` actúa entre el Paso 2 y el Paso 4, pausando la ejecución de ReturnService hasta recibir confirmación explícita. El agente interpreta el "sí" del usuario y solo entonces libera la llamada.

---

## Ejercicio 16 · Predice la salida

**(a)** El bucle ejecuta **2 iteraciones** antes del `break`:
- Iteración 1: `fake_llm` detecta "cuánto cuesta" → devuelve action `policy_rag`. Se ejecuta la tool. Se agregan dos mensajes a memoria.
- Iteración 2: `fake_llm` recibe la memoria con el resultado de `policy_rag` → la condición `"policy_rag" in str(last)` se cumple para el último mensaje (que contiene `str(tool_result)`) → devuelve `{"final": "La penalidad es USD 50 según §3.2."}` → `break`.

**(b)** Se imprime:
```
Respuesta: La penalidad es USD 50 según §3.2.
```

**(c)** No. Si el segundo turno no agrega nada al historial y el agente crea un nuevo objeto con solo el nuevo mensaje, no recuerda el primero. El código como está **no tiene** gestión de múltiples turnos.

**(d)** Hay que:
1. Agregar el nuevo mensaje del usuario a la lista `memory` existente (no reemplazarla).
2. Mantener la lista `memory` entre llamadas a `chat()` (en una clase o variable de sesión).
3. Resetear `memory` al `system` prompt al inicio de una nueva sesión, no de cada turno.

---

## Ejercicio 17 · Diseña la memoria

**(a) Memoria conversacional (historial de mensajes):**

```python
memory = [
    {"role": "system",    "content": "Eres asistente de vuelos..."},
    {"role": "user",      "content": "Mi PNR es SCL-BOG-001."},
    {"role": "assistant", "content": "[tool_call: ReservationService(pnr='SCL-BOG-001')]"},
    {"role": "tool",      "name": "ReservationService",
                          "content": '{"fare_class":"ECONOMY_FLEX","flight":"LA501",...}'},
    {"role": "user",      "content": "Quiero cambiar al 17 de junio."},
    {"role": "assistant", "content": "[tool_calls: InventoryService, PricingService]"},
    {"role": "tool",      "name": "PricingService",
                          "content": '{"delta":80,"total":130}'},
    {"role": "assistant", "content": "El costo total es USD 130. ¿Confirmas?"},
    {"role": "user",      "content": "Sí, confirmo el cambio."},
]
```

**(b) Estado del agente (working memory):**

```python
state = {
    "pnr":        "SCL-BOG-001",
    "fare_class": "ECONOMY_FLEX",
    "origin":     "SCL",
    "destination":"BOG",
    "old_flight": "LA501",
    "old_date":   "2026-06-15",
    "penalty":    50.0,
    "new_flight": "FL305",
    "new_date":   "2026-06-17",
    "delta":      80.0,
    "total":      130.0,
    "confirmed":  True
}
```

**(c) Si el usuario pregunta por FL301 en vez de FL305:**
- NO repetiría: ReservationService (ya tiene el PNR y fare_class), PolicyRAG (ya tiene la penalidad).
- SÍ repetiría: PricingService (nuevo cálculo de delta para FL301 en vez de FL305).
- El agente puede responder directamente con el nuevo precio una vez que llama a PricingService con `newFlightId="FL301"`.

**(d) Sin memoria y el usuario dice "sí confirmo" en un segundo turno separado:**
El agente no sabe qué está confirmando. No tiene PNR, no tiene el monto, no tiene el vuelo elegido. Respondería algo como "No tengo información de ningún cambio pendiente" o, peor, inventaría datos. Este es exactamente el escenario que justifica tener memoria conversacional persistente entre turnos.

---

## Ejercicio 18 · Encuentra el bug

**(a) Bug 1 — Sobrescribe la memoria en cada turno:**
```python
self.memory = [{"role": "user", "content": user_message}]
# ↑ Asigna una nueva lista cada vez, borrando el historial anterior.
# Debería ser: self.memory.append(...)
```

**(b) Bug 2 — No agrega el resultado de la tool a la memoria:**
```python
result = tool(**response["args"])
# Falta agregar el resultado al historial antes del segundo llamado al LLM:
self.memory.append({"role": "assistant", "content": str(response)})
self.memory.append({"role": "tool", "name": response["action"],
                    "content": str(result)})
response = fake_llm(self.memory)
```

**Código corregido de ambos bugs:**

```python
def chat(self, user_message):
    # Bug 1 corregido: append, no asignación
    self.memory.append({"role": "user", "content": user_message})

    response = fake_llm(self.memory)

    if "action" in response:
        tool = self.tools[response["action"]]
        result = tool(**response["args"])
        # Bug 2 corregido: agregar a memoria antes de la siguiente llamada
        self.memory.append({"role": "assistant", "content": str(response)})
        self.memory.append({"role": "tool",
                             "name": response["action"],
                             "content": str(result)})
        response = fake_llm(self.memory)

    if "final" in response:
        self.memory.append({"role": "assistant",
                             "content": response["final"]})
    return response.get("final", "Sin respuesta")
```

**(c)** Sí, después de las correcciones el agente recuerda la primera pregunta en la segunda, porque `self.memory` es una instancia persistente de `AgentWithMemory` y el historial se acumula con `append`. El segundo turno envía toda la lista al LLM, que puede razonar sobre el contexto completo.

---

## Ejercicio 19 · Comparativa de arquitecturas

**(a) Pipeline determinista:**

```
[io.input]
    ↓ Message
[logic.router]  ← ¿es pregunta de cobertura, consulta de póliza, o reclamo?
    ├─ "cobertura"    → [tool.retriever "CoberturaRAG"] → [logic.prompt] → [io.output]
    ├─ "poliza"       → [tool.service "PolicyService"]  → [logic.prompt] → [io.output]
    └─ "reclamo"      → [guardrail.confirm] → [tool.service "ClaimService"] → [io.output]
```

**Supuesto:** el usuario siempre comienza con una sola intención clara y el `logic.router` puede clasificarla sin ambigüedad. Falla si el usuario pregunta "¿mi póliza cubre inundaciones Y quiero hacer un reclamo?" en un solo mensaje.

**(b) Agente ReAct:**

Nodos: `agent.react` + `model.llm` + tools:
- `tool.retriever "coverage_rag"` (base de conocimiento de coberturas).
- `tool.service "PolicyService"` (estado de póliza).
- `tool.service "ClaimService"` (con `guardrail.confirm` para montos altos).

El agente decide qué herramientas usar según cada pregunta.

**(c) Para producción elegiría el agente ReAct.** Razones:
- Los usuarios de seguros combinan preguntas ("¿tengo cobertura? ¿cuánto recibiría?") en un solo turno.
- Cuando la intención es ambigua, el pipeline falla; el agente puede pedir aclaración.
- El mantenimiento es más fácil: si agrego una nueva tool, no tengo que rediseñar el grafo de routing.
- El costo extra de LLM se justifica por la reducción de escalaciones a agentes humanos.

---

## Ejercicio 20 · LangGraph conceptual

**(a) Diagrama del grafo:**

```
[START]
   ↓
  [A: extract_pnr]
   ↓ condicional: has_pnr?
   ├─ has_pnr=True  → [B: get_reservation]
   │                         ↓
   │                  [C: check_policy]
   │                         ↓ condicional: confirmed?
   │                         ├─ confirmed=True  → [E: execute] → [END]
   │                         └─ confirmed=False → [D: ask_confirm] → [END]
   └─ has_pnr=False → [D: ask_confirm] → [END]
```

**(b) Sin PNR:**
A → (has_pnr=False) → D → END. El agente pide el PNR al usuario sin llamar a ningún servicio.

**(c) Con PNR y confirmed=True:**
A → (has_pnr=True) → B → C → (confirmed=True) → E → END. El agente obtiene la reserva, verifica la política, y ejecuta directamente sin pedir confirmación (ya fue confirmado).

**(d) Ventaja del diseño explícito:**
- **Predecible y auditable:** puedes leer el grafo y saber exactamente qué caminos son posibles.
- **No hay sorpresas**: el LLM no puede "inventar" pasos fuera del grafo.
- **Persistencia de estado**: LangGraph puede guardar el estado en cada arista para reanudar conversaciones.
- **Testing determinista**: puedes probar cada rama individualmente.
- Contra: menos flexible cuando aparecen casos de borde no previstos en el diseño.

---

## Ejercicio 21 · Reflection práctica

**(a) Problemas con la respuesta tentativa "Sí, puedes llevar baterías de litio.":**

1. **Incompleta**: no distingue entre equipaje de mano y bodega (la diferencia es crítica).
2. **Sin condiciones**: ignora los límites de capacidad (≤100Wh, 100-160Wh, >160Wh).
3. **Sin cita**: no referencia la política (§4.2, §4.3, §4.4).
4. **Potencialmente incorrecta**: baterías >160Wh están prohibidas — la respuesta general "sí puedes" es falsa para ese caso.
5. **Riesgo regulatorio**: en aviación, una respuesta incorrecta sobre baterías puede tener consecuencias legales.

**(b) Respuesta mejorada:**

"Para baterías de litio de uso personal (laptops, tablets, teléfonos):
- **≤100 Wh**: permitidas en **equipaje de mano**; **prohibidas en bodega** [§4.2].
- **100–160 Wh**: requieren autorización previa de la aerolínea [§4.3].
- **>160 Wh**: **prohibidas** en todos los casos [§4.4].

¿Sabes la capacidad de tu batería? Suele estar impresa en la etiqueta del equipo."

**(c) Cuándo no vale la pena hacer Reflection:**

1. **Conversación en tiempo real con usuario esperando respuesta**: añade 1-3 segundos de latencia por la llamada extra al LLM, lo que degrada la experiencia de usuario.
2. **Cuando el contexto recuperado es suficientemente claro**: si la respuesta ya cita fuentes y cubre los casos, la reflexión agrega costo sin beneficio.
3. **Cuando no tienes un evaluador confiable**: si el LLM evaluador tiene los mismos sesgos que el actor, la reflexión no mejora la respuesta.
4. **Casos donde la respuesta siempre es simple**: "¿Puedo hacer check-in online?" → "Sí, hasta 2 horas antes" no necesita reflexión.

---

## Ejercicio 22 · Tool design

**(a) JSON Schemas:**

```json
// ConsultarSaldo
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string", "description": "ID de la cuenta" }
  },
  "required": ["account_id"]
}

// ListarMovimientos
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string" },
    "n":          { "type": "integer", "minimum": 1, "maximum": 100,
                    "default": 10, "description": "Número de movimientos" }
  },
  "required": ["account_id"]
}

// HacerTransferencia
{
  "type": "object",
  "properties": {
    "from_account": { "type": "string" },
    "to_account":   { "type": "string" },
    "amount":       { "type": "number", "minimum": 0.01 },
    "session_id":   { "type": "string" }
  },
  "required": ["from_account", "to_account", "amount", "session_id"]
}
```

**(b) Cadena de guardrails:**

```
[tool.service "TransferenciaService"]
      ↓ Tool
[guardrail.confirm]  threshold: "amount > 500"
      ↓ Tool
[guardrail.idempotency]  keyFields: ["account_id", "session_id"]
      ↓ Tool
[agent.react]
```

**(c) Description para el LLM:**

```
"Ejecuta una transferencia bancaria entre cuentas. ÚSALA SOLO después de haber consultado el saldo
con ConsultarSaldo y confirmar que hay fondos suficientes. Requiere confirmación explícita del usuario
para montos superiores a $500. No la llames especulativamente — espera a que el usuario indique
claramente que desea transferir y haya confirmado el monto."
```

---

## Ejercicio 23 · Agentic RAG vs RAG estándar

**(a) RAG estándar — problema:**

Pipeline fijo:
```
Entrada → retrieval(A o B o ambos) → generación → salida
```

Problema: si el usuario pregunta algo fuera de los documentos ("¿puedo cancelar mi póliza?") el sistema igual recupera fragmentos (posiblemente irrelevantes) y genera una respuesta que puede parecer válida pero estar basada en documentos del tema incorrecto. No puede decir "no tengo información" de forma confiable.

**(b) Agentic RAG — flujo:**

```
Thought: Necesito saber si cubre inundaciones. Primero busco en coberturas generales.
Action: coverage_rag(query="cobertura daños inundación")
Observation: [{ "text": "Cubre daños por agua accidental..." }]

Thought: La cobertura general dice que sí, pero debo verificar si hay exclusiones.
Action: exclusions_rag(query="exclusión inundación póliza BASIC")
Observation: [{ "text": "Inundaciones causadas por desbordamiento de río: EXCLUIDAS §8.3" }]

Thought: Hay una exclusión específica. La respuesta correcta es que depende del tipo de inundación.
```

Si ningún índice tiene la respuesta, el agente puede decirlo explícitamente: "No encontré información sobre ese tipo de cobertura en los documentos disponibles. Te recomiendo contactar a tu asesor."

**(c) Nodos `tool.retriever`:**

```json
{
  "id": "coverage_tool",
  "type": "tool.retriever",
  "config": {
    "name": "coverage_rag",
    "description": "Busca en las coberturas generales del seguro. Úsala para preguntas sobre qué está cubierto en términos generales."
  }
}

{
  "id": "exclusions_tool",
  "type": "tool.retriever",
  "config": {
    "name": "exclusions_rag",
    "description": "Busca en las exclusiones específicas por tipo de póliza. SIEMPRE consúltala después de coverage_rag para verificar si aplica alguna exclusión al caso específico del usuario."
  }
}
```

---

## Ejercicio 24 · Elige la tecnología

**(a) Chatbot de soporte — 1000 req/min, < 2 segundos → LangGraph StateGraph (con flujo determinista).**
El flujo es siempre el mismo (FAQ → ticket → respuesta). LangGraph con nodos predefinidos y sin LLM decidor entre pasos da latencia mínima. ReAct añade N llamadas al LLM innecesarias cuando el flujo ya es conocido. A este volumen, el costo de latencia extra de ReAct libre no se justifica.

**(b) Investigación en batch — 15-20 búsquedas → Plan-and-Execute o Reflexion.**
Al ser batch (sin usuario esperando), la latencia no importa. Plan-and-Execute permite al LLM diseñar un plan de investigación estructurado antes de ejecutar. Si los resultados son verificables (el informe tiene X fuentes mínimas), Reflexion puede mejorar la calidad iterativamente.

**(c) Agente de trading — estado persistente + auditoría → LangGraph StateGraph.**
El estado (cuenta, portfolio, riesgo) es exactamente lo que LangGraph maneja con checkpointing. El grafo explícito facilita la auditoría. ReAct libre sería difícil de auditar y el estado podría perderse entre llamadas.

**(d) Generación de código con validación — hasta 3 intentos → Reflexion.**
Ciclo clásico de Reflexion: Actor (genera código) → Evaluador (ejecuta y verifica output) → Reflexión (guarda por qué falló) → Actor (intenta de nuevo con el aprendizaje). El evaluador es confiable (ejecutar el código y comparar output). El número máximo de intentos (3) acota el costo.

---

## Ejercicio 25 · Integración RAGorbit

**(a) Nodos `tool.*` en el template 01:**

Hay **5 nodos tool**:
1. `policy_tool` — `tool.retriever` — "PolicyRAG Tool"
2. `reservation_tool` — `tool.service` — "ReservationService"
3. `inventory_tool` — `tool.service` — "InventoryService"
4. `pricing_tool` — `tool.service` — "PricingService"
5. `payment_service` — `tool.service` — "PaymentService"

**(b) Tres guardrails en cadena sobre el pago:**

1. `guardrail.idempotency` (primero): evita cobrar dos veces si la misma transacción llega duplicada (clave: PNR + session_id, TTL 24h). Actúa antes de cualquier otra verificación.
2. `guardrail.confirm` (segundo): si el monto supera $500, pausa y pide confirmación al usuario. Solo si el usuario confirma, libera la llamada al siguiente guardrail.
3. `guardrail.resilience` (tercero): circuit breaker + retry. Si el servicio de pago falla, reintenta 2 veces. Si sigue fallando, devuelve el mensaje de fallback sin bloquear al agente.

El orden importa: la idempotencia primero evita procesar dos veces; la confirmación antes del circuito breaker asegura que no hacemos reintentos de transacciones no confirmadas.

**(c) La arista `loop: true`:**

Representa el ciclo del bucle ReAct. Cada vez que el agente llama una herramienta y obtiene un resultado, el mensaje actualizado (con el resultado en el historial) vuelve al propio agente para el siguiente paso de razonamiento. Sin esta arista, el agente solo podría hacer un único paso y responder — no podría iterar.

**(d) Agregar un segundo índice RAG:**

Cambios al `flow.json`:

1. Agregar nodo `loader.pdf` para los procedimientos de excepción.
2. Agregar nodo `ingest.chunker` y `ingest.metadata` para ese loader.
3. Agregar nodo `store.pgvector` con `index: "exception_procedures"`.
4. Agregar nodo `tool.retriever` con `name: "exception_rag"` y description apropiada.
5. Agregar arista: `exception_tool:Tool → orchestrator:Tool`.
6. Actualizar el `system` del agente para mencionar cuándo usar `exception_rag` vs `policy_rag`.

**(e) ¿El system prompt lo convierte en pipeline?**

No. El prompt guía el orden *preferido* de herramientas pero el agente sigue siendo un ReAct: puede desviarse del orden si las observaciones lo justifican (p.ej. si ReservationService devuelve un error, el agente puede manejar el caso en lugar de proceder ciegamente). La diferencia con un pipeline es que el LLM *decide* en cada paso, no que el orden está hardcodeado en el grafo.

---

## Ejercicio 26 · Diseño end-to-end

**(a) Tools necesarias:**

```
1. ConsultarDisponibilidad
   Descripción: Busca habitaciones disponibles en un hotel para una fecha.
   Entrada: { "checkin": string, "checkout": string, "guests": int }

2. ObtenerReserva
   Descripción: Obtiene los detalles de una reserva existente por su ID.
   Entrada: { "booking_id": string }

3. CrearReserva
   Descripción: Crea una nueva reserva de habitación. Solo llamar cuando
                el usuario haya confirmado tipo de habitación y fechas.
   Entrada: { "checkin": string, "checkout": string,
               "room_type": string, "guest_name": string }

4. CancelarReserva
   Descripción: Cancela una reserva existente. Verifica penalidad primero
                con PolicyRAG si las fechas son próximas.
   Entrada: { "booking_id": string, "reason": string }

5. PolicyRAG (tool.retriever)
   Descripción: Consulta políticas del hotel (cancelación, penalidades,
                servicios incluidos). Úsala antes de confirmar cancelaciones.
```

**(b) Guardrails:**

- `CancelarReserva` → `guardrail.confirm` (threshold: "penalidad > 0", mensaje: "Hay una penalidad por cancelación tardía de $X. ¿Confirmas?").
- `CrearReserva` → `guardrail.confirm` (threshold: "total > 500") + `guardrail.idempotency` (keyFields: ["booking_id", "session_id"]).

**(c) Estado del agente (working memory):**

```python
state = {
    "guest_name":   None,   # nombre del huésped
    "booking_id":   None,   # ID de reserva activa en la sesión
    "checkin":      None,
    "checkout":     None,
    "room_type":    None,
    "total":        None,   # costo calculado
    "has_penalty":  False,  # si aplica penalidad de cancelación
    "penalty_amt":  0.0,
    "confirmed":    False
}
```

**(d) System prompt:**

```
Eres un asistente de reservas de hotel. Tu misión es ayudar a los huéspedes a
consultar disponibilidad, hacer reservas y gestionar cancelaciones de forma
eficiente y amable. Flujo sugerido: (1) Si el huésped menciona una reserva
existente, obtén sus detalles con ObtenerReserva primero. (2) Para nuevas
reservas, verifica disponibilidad antes de confirmar. (3) Para cancelaciones,
consulta siempre PolicyRAG para determinar si aplica penalidad, e informa al
huésped antes de proceder. Recuerda el contexto de la conversación — no pidas
información que el huésped ya proporcionó.
```

**(e) Casos para `hitl.escalate`:**

- Cuando el huésped reporta un problema grave durante su estancia (habitación en mal estado, problema de seguridad) — el bot no puede resolver problemas físicos.
- Cuando se solicita una excepción a la política (cancelación gratuita fuera del período por causa de fuerza mayor, emergencia médica) — requiere criterio humano.
- Cuando el cliente manifiesta insatisfacción severa o amenaza con queja formal — el tono emocional requiere intervención humana.

Configuración sugerida:
```json
{
  "type": "hitl.escalate",
  "config": {
    "when": "problema_estancia OR excepcion_politica OR insatisfaccion_severa",
    "assignee": "supervisor_hotel",
    "timeout": "5m"
  }
}
```

---

## Ejercicio 27 · Predice qué tool llama el agente

**(a) Primera iteración del Turno 1 → `consultar_saldo`.**

El usuario pregunta explícitamente por el saldo de la cuenta ACC-4421. El docstring de `consultar_saldo` dice "Úsala SOLO cuando el cliente pregunte por su saldo" — esa es exactamente la intención. `hacer_transferencia` dice explícitamente que requiere confirmación previa y saldo verificado, condiciones que aún no se cumplen.

**(b) Segundo turno → primero `consultar_saldo`, luego (tras confirmación) `hacer_transferencia`.**

Aunque el historial del Turno 1 está en memoria, el docstring de `hacer_transferencia` exige "confirmar saldo suficiente" antes de transferir. Un agente bien guiado verificaría el saldo actualizado antes de ejecutar la transferencia (el saldo pudo cambiar). Solo después de confirmar fondos y obtener confirmación explícita del monto y cuenta destino llamaría `hacer_transferencia(from_account="ACC-4421", to_account="ACC-9900", amount=200.0)`.

Orden esperado:
1. `consultar_saldo(account_id="ACC-4421")` — verificar fondos.
2. Presentar resumen al usuario y pedir confirmación (sin tool).
3. Tras "sí, confirmo" → `hacer_transferencia(...)`.

**(c) Docstring vago → transferencias prematuras o incorrectas.**

Con solo `"Transfiere dinero"`, el LLM no sabe que debe esperar confirmación ni verificar saldo primero. Podría llamar `hacer_transferencia` inmediatamente al detectar la palabra "transfiere", sin validar fondos — riesgo financiero y de experiencia de usuario.

---

## Ejercicio 28 · Completa la arista condicional

**(a) Cuerpo de `should_continue`:**

```python
def should_continue(state: FlightChangeState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"
```

Si el último mensaje es un `AIMessage` con `tool_calls` no vacío, el agente quiere actuar → ir al nodo `tools`. Si no hay tool calls, la respuesta está lista → terminar.

**(b) Mapa de `add_conditional_edges`:**

```python
builder.add_conditional_edges("agent", should_continue, {
    "tools": "tools",
    "end": END,
})
```

Los valores que devuelve `should_continue` (`"tools"`, `"end"`) se mapean al nodo destino. `"end"` es la constante `END` de LangGraph que finaliza la ejecución.

**(c) Por qué `add_edge("tools", "agent")` es necesaria:**

Tras ejecutar las tools, el grafo debe **volver a razonar** con los resultados en el historial — es la observación del bucle ReAct (§3). Sin esa arista, el grafo terminaría después de `tools` sin darle al LLM la oportunidad de leer los `ToolMessage` y decidir el siguiente paso. En scratch, esto es el `memory.append(tool_result)` seguido de otra iteración del `while`.

**(d) Diagrama ASCII:**

```
        ┌─────────┐
        │  START  │
        └────┬────┘
             │
             ▼
        ┌─────────┐
        │  agent  │◀────────────────┐
        └────┬────┘                 │
             │                      │
      should_continue               │
             │                      │
      ┌──────┴──────┐               │
      │             │               │
  tool_calls?      no               │
      │             │               │
     sí             ▼               │
      │        ┌─────────┐          │
      │        │   END   │          │
      │        └─────────┘          │
      ▼                             │
 ┌─────────┐                        │
 │  tools  │────────────────────────┘
 └─────────┘
```

---

## Ejercicio 29 · Mapea scratch → StateGraph y thread_id

**(a) Tabla de correspondencia:**

| Paso en `solucion_scratch.py` | Nodo/arista en LangGraph |
|-------------------------------|--------------------------|
| `fake_llm(memory)` decide acción | Nodo `"agent"` — `llm.invoke(messages)` |
| `TOOLS[name](**args)` | Nodo `"tools"` — `node_call_tools` |
| `memory.append({"role": "tool", ...})` | `add_messages` en `FlightChangeState` + `ToolMessage` devuelto por `node_call_tools` |
| `if "final" in response: break` | `should_continue` → `"end"` → `END` |
| `session.memory` persiste entre turnos | `MemorySaver` + mismo `thread_id` en `config` |

**(b) Por qué el mismo `thread_id` recuerda el Turno 1:**

Al finalizar cada `invoke`, `MemorySaver` serializa el estado completo del grafo (todos los mensajes acumulados: `HumanMessage`, `AIMessage`, `ToolMessage`) asociado al `thread_id`. En el Turno 2, LangGraph **restaura** ese estado antes de procesar el nuevo `HumanMessage`. El LLM recibe el historial completo — sabe el PNR, el costo de USD 130 y que pidió confirmación.

Si cambias el `thread_id` en el Turno 2 (p. ej. `"demo-002"`), LangGraph inicia una sesión vacía. El agente no vería el Turno 1 y respondería "¿Qué cambio deseas confirmar?" o similar.

**(c) ¿Necesitas `_find_in_memory` con `create_react_agent` + `MemorySaver`?**

**No.** El checkpointer persiste automáticamente todos los mensajes del Turno 1, incluyendo la respuesta del asistente con el desglose de USD 130. En el Turno 2, el LLM lee ese historial completo y entiende el contexto sin extraer campos de líneas `pnr:...` embebidas en texto.

`_find_in_memory` era un truco del scratch para simular estado estructurado sin un `TypedDict` formal. En producción con LangGraph, el historial de mensajes (corto plazo) o campos extra en `FlightChangeState` (working memory) reemplazan ese patrón. Si usas el `StateGraph` explícito comentado en el lab, `node_call_tools` actualiza `pnr`, `penalty`, `total` directamente en el estado — aún más limpio que buscar en texto.

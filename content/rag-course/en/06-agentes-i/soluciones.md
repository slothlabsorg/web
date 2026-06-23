# M6 · Solutions — Agents I

---

## Exercise 14 · Agent or pipeline

**(a) Monthly newsletter PDF → Deterministic pipeline.**
The process is always the same and there are no decisions depending on unknown data at design time. A `loader → chunker → logic.prompt → io.output` pipeline is sufficient and more predictable.

**(b) Bank transfer with prior verification → Agent.**
The number of tools and their order depends on what the user says. The agent needs to check balance, verify the destination account, and potentially make the transfer, but the order and whether all steps run depends on each response.

**(c) Shipping status by order number → Deterministic pipeline.**
The PNR comes from the JWT, the query is always the same, the response is direct. A `io.input → tool.service → logic.prompt → io.output` pipeline resolves the case at minimal cost.

**(d) HR questions about one document → Deterministic pipeline (simple RAG).**
It is always: user asks → search the document → respond. No branching or additional tools. A pipeline with `store.chroma + retrieval.vector + logic.prompt` is optimal.

**(e) Network diagnosis → Agent.**
Each step depends on the previous one: you do not know in advance which logs to review, which services to ping, or whether there are relevant previous tickets. The agent needs to reason at each step about which tool to use based on prior observations.

---

## Exercise 15 · Trace the ReAct loop

**User turn:** "Quiero devolver el pedido ORD-0998. Es que llegó incompleto."

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

`guardrail.confirm` acts between Step 2 and Step 4, pausing execution of ReturnService until explicit confirmation is received. The agent interprets the user's "sí" and only then releases the call.

---

## Exercise 16 · Predict the output

**(a)** The loop runs **2 iterations** before the `break`:
- Iteration 1: `fake_llm` detects "cuánto cuesta" → returns action `policy_rag`. The tool runs. Two messages are appended to memory.
- Iteration 2: `fake_llm` receives memory with the `policy_rag` result → condition `"policy_rag" in str(last)` is true for the last message (which contains `str(tool_result)`) → returns `{"final": "La penalidad es USD 50 según §3.2."}` → `break`.

**(b)** It prints:
```
Respuesta: La penalidad es USD 50 según §3.2.
```

**(c)** No. If the second turn does not append to the history and the agent creates a new object with only the new message, it does not remember the first. The code as written **does not** handle multiple turns.

**(d)** You need to:
1. Append the new user message to the existing `memory` list (not replace it).
2. Keep the `memory` list between `chat()` calls (in a class or session variable).
3. Reset `memory` to the `system` prompt at the start of a new session, not each turn.

---

## Exercise 17 · Design the memory

**(a) Conversational memory (message history):**

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

**(b) Agent state (working memory):**

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

**(c) If the user asks about FL301 instead of FL305:**
- Would NOT repeat: ReservationService (already has PNR and fare_class), PolicyRAG (already has penalty).
- WOULD repeat: PricingService (new delta calculation for FL301 instead of FL305).
- The agent can respond directly with the new price once it calls PricingService with `newFlightId="FL301"`.

**(d) Without memory and the user says "sí confirmo" on a separate second turn:**
The agent does not know what is being confirmed. It has no PNR, no amount, no chosen flight. It would respond with something like "I have no information about a pending change" or, worse, invent data. This is exactly the scenario that justifies persistent conversational memory between turns.

---

## Exercise 18 · Find the bug

**(a) Bug 1 — Overwrites memory on each turn:**
```python
self.memory = [{"role": "user", "content": user_message}]
# ↑ Asigna una nueva lista cada vez, borrando el historial anterior.
# Debería ser: self.memory.append(...)
```

**(b) Bug 2 — Does not append tool result to memory:**
```python
result = tool(**response["args"])
# Falta agregar el resultado al historial antes del segundo llamado al LLM:
self.memory.append({"role": "assistant", "content": str(response)})
self.memory.append({"role": "tool", "name": response["action"],
                    "content": str(result)})
response = fake_llm(self.memory)
```

**Corrected code for both bugs:**

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

**(c)** Yes, after the fixes the agent remembers the first question on the second, because `self.memory` is a persistent instance of `AgentWithMemory` and the history accumulates with `append`. The second turn sends the full list to the LLM, which can reason over the complete context.

---

## Exercise 19 · Architecture comparison

**(a) Deterministic pipeline:**

```
[io.input]
    ↓ Message
[logic.router]  ← ¿es pregunta de cobertura, consulta de póliza, o reclamo?
    ├─ "cobertura"    → [tool.retriever "CoberturaRAG"] → [logic.prompt] → [io.output]
    ├─ "poliza"       → [tool.service "PolicyService"]  → [logic.prompt] → [io.output]
    └─ "reclamo"      → [guardrail.confirm] → [tool.service "ClaimService"] → [io.output]
```

**Assumption:** the user always starts with a single clear intent and `logic.router` can classify it unambiguously. It fails if the user asks "Does my policy cover floods AND I want to file a claim?" in one message.

**(b) ReAct agent:**

Nodes: `agent.react` + `model.llm` + tools:
- `tool.retriever "coverage_rag"` (coverage knowledge base).
- `tool.service "PolicyService"` (policy status).
- `tool.service "ClaimService"` (with `guardrail.confirm` for high amounts).

The agent decides which tools to use per question.

**(c) For production I would choose the ReAct agent.** Reasons:
- Insurance users combine questions ("Do I have coverage? How much would I receive?") in one turn.
- When intent is ambiguous, the pipeline fails; the agent can ask for clarification.
- Maintenance is easier: if I add a new tool, I do not have to redesign the routing graph.
- The extra LLM cost is justified by fewer escalations to human agents.

---

## Exercise 20 · LangGraph conceptual

**(a) Graph diagram:**

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

**(b) Without PNR:**
A → (has_pnr=False) → D → END. The agent asks the user for the PNR without calling any service.

**(c) With PNR and confirmed=True:**
A → (has_pnr=True) → B → C → (confirmed=True) → E → END. The agent gets the reservation, checks policy, and executes directly without asking for confirmation (already confirmed).

**(d) Advantage of explicit design:**
- **Predictable and auditable:** you can read the graph and know exactly which paths are possible.
- **No surprises:** the LLM cannot "invent" steps outside the graph.
- **State persistence:** LangGraph can save state at each edge to resume conversations.
- **Deterministic testing:** you can test each branch individually.
- Downside: less flexible when edge cases not foreseen in the design appear.

---

## Exercise 21 · Reflection in practice

**(a) Problems with the tentative response "Sí, puedes llevar baterías de litio.":**

1. **Incomplete:** it does not distinguish carry-on vs. checked baggage (the difference is critical).
2. **No conditions:** it ignores capacity limits (≤100Wh, 100–160Wh, >160Wh).
3. **No citation:** it does not reference the policy (§4.2, §4.3, §4.4).
4. **Potentially incorrect:** batteries >160Wh are prohibited — the general "yes you can" is false for that case.
5. **Regulatory risk:** in aviation, an incorrect answer about batteries can have legal consequences.

**(b) Improved response:**

"Para baterías de litio de uso personal (laptops, tablets, teléfonos):
- **≤100 Wh**: permitidas en **equipaje de mano**; **prohibidas en bodega** [§4.2].
- **100–160 Wh**: requieren autorización previa de la aerolínea [§4.3].
- **>160 Wh**: **prohibidas** en todos los casos [§4.4].

¿Sabes la capacidad de tu batería? Suele estar impresa en la etiqueta del equipo."

**(c) When Reflection is not worth it:**

1. **Real-time conversation with user waiting:** adds 1–3 seconds of latency per extra LLM call, degrading user experience.
2. **When retrieved context is sufficiently clear:** if the response already cites sources and covers the cases, reflection adds cost without benefit.
3. **When you do not have a reliable evaluator:** if the evaluator LLM has the same biases as the actor, reflection does not improve the response.
4. **Cases where the answer is always simple:** "Can I check in online?" → "Yes, up to 2 hours before" does not need reflection.

---

## Exercise 22 · Tool design

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

**(b) Guardrail chain:**

```
[tool.service "TransferenciaService"]
      ↓ Tool
[guardrail.confirm]  threshold: "amount > 500"
      ↓ Tool
[guardrail.idempotency]  keyFields: ["account_id", "session_id"]
      ↓ Tool
[agent.react]
```

**(c) Description for the LLM:**

```
"Ejecuta una transferencia bancaria entre cuentas. ÚSALA SOLO después de haber consultado el saldo
con ConsultarSaldo y confirmar que hay fondos suficientes. Requiere confirmación explícita del usuario
para montos superiores a $500. No la llames especulativamente — espera a que el usuario indique
claramente que desea transferir y haya confirmado el monto."
```

---

## Exercise 23 · Agentic RAG vs standard RAG

**(a) Standard RAG — problem:**

Fixed pipeline:
```
Entrada → retrieval(A o B o ambos) → generación → salida
```

Problem: if the user asks something outside the documents ("Can I cancel my policy?") the system still retrieves chunks (possibly irrelevant) and generates a response that may look valid but be based on the wrong topic. It cannot reliably say "I don't have information."

**(b) Agentic RAG — flow:**

```
Thought: Necesito saber si cubre inundaciones. Primero busco en coberturas generales.
Action: coverage_rag(query="cobertura daños inundación")
Observation: [{ "text": "Cubre daños por agua accidental..." }]

Thought: La cobertura general dice que sí, pero debo verificar si hay exclusiones.
Action: exclusions_rag(query="exclusión inundación póliza BASIC")
Observation: [{ "text": "Inundaciones causadas por desbordamiento de río: EXCLUIDAS §8.3" }]

Thought: Hay una exclusión específica. La respuesta correcta es que depende del tipo de inundación.
```

If neither index has the answer, the agent can say so explicitly: "I did not find information about that type of coverage in the available documents. I recommend contacting your advisor."

**(c) `tool.retriever` nodes:**

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

## Exercise 24 · Choose the technology

**(a) Support chatbot — 1000 req/min, < 2 seconds → LangGraph StateGraph (deterministic flow).**
The flow is always the same (FAQ → ticket → response). LangGraph with predefined nodes and no LLM deciding between steps gives minimum latency. ReAct adds unnecessary N LLM calls when the flow is already known. At this volume, the extra latency cost of free ReAct is not justified.

**(b) Batch research — 15–20 searches → Plan-and-Execute or Reflexion.**
Being batch (no user waiting), latency does not matter. Plan-and-Execute lets the LLM design a structured research plan before executing. If results are verifiable (report has X minimum sources), Reflexion can iteratively improve quality.

**(c) Trading agent — persistent state + audit → LangGraph StateGraph.**
State (account, portfolio, risk) is exactly what LangGraph handles with checkpointing. The explicit graph facilitates auditing. Free ReAct would be hard to audit and state could be lost between calls.

**(d) Code generation with validation — up to 3 attempts → Reflexion.**
Classic Reflexion cycle: Actor (generates code) → Evaluator (runs and verifies output) → Reflection (stores why it failed) → Actor (tries again with the learning). The evaluator is reliable (run code and compare output). Maximum attempts (3) bounds cost.

---

## Exercise 25 · RAGorbit integration

**(a) `tool.*` nodes in template 01:**

There are **5 tool nodes**:
1. `policy_tool` — `tool.retriever` — "PolicyRAG Tool"
2. `reservation_tool` — `tool.service` — "ReservationService"
3. `inventory_tool` — `tool.service` — "InventoryService"
4. `pricing_tool` — `tool.service` — "PricingService"
5. `payment_service` — `tool.service` — "PaymentService"

**(b) Three guardrails in chain on payment:**

1. `guardrail.idempotency` (first): prevents charging twice if the same transaction arrives duplicated (key: PNR + session_id, TTL 24h). Acts before any other check.
2. `guardrail.confirm` (second): if amount exceeds $500, pauses and asks the user for confirmation. Only if the user confirms does it release the call to the next guardrail.
3. `guardrail.resilience` (third): circuit breaker + retry. If the payment service fails, retries twice. If it still fails, returns the fallback message without blocking the agent.

Order matters: idempotency first avoids processing twice; confirmation before circuit breaker ensures we do not retry unconfirmed transactions.

**(c) The `loop: true` edge:**

Represents the ReAct loop cycle. Each time the agent calls a tool and gets a result, the updated message (with the result in history) returns to the agent itself for the next reasoning step. Without this edge, the agent could only take one step and respond — it could not iterate.

**(d) Adding a second RAG index:**

Changes to `flow.json`:

1. Add `loader.pdf` node for exception procedures.
2. Add `ingest.chunker` and `ingest.metadata` nodes for that loader.
3. Add `store.pgvector` node with `index: "exception_procedures"`.
4. Add `tool.retriever` node with `name: "exception_rag"` and appropriate description.
5. Add edge: `exception_tool:Tool → orchestrator:Tool`.
6. Update agent `system` to mention when to use `exception_rag` vs `policy_rag`.

**(e) Does the system prompt turn it into a pipeline?**

No. The prompt guides the *preferred* tool order but the agent remains ReAct: it can deviate from the order if observations justify it (e.g., if ReservationService returns an error, the agent can handle the case instead of proceeding blindly). The difference from a pipeline is that the LLM *decides* at each step, not that the order is hardcoded in the graph.

---

## Exercise 26 · End-to-end design

**(a) Required tools:**

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

- `CancelarReserva` → `guardrail.confirm` (threshold: "penalidad > 0", message: "Hay una penalidad por cancelación tardía de $X. ¿Confirmas?").
- `CrearReserva` → `guardrail.confirm` (threshold: "total > 500") + `guardrail.idempotency` (keyFields: ["booking_id", "session_id"]).

**(c) Agent state (working memory):**

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

**(e) Cases for `hitl.escalate`:**

- When the guest reports a serious problem during their stay (room in poor condition, security issue) — the bot cannot resolve physical problems.
- When an exception to policy is requested (free cancellation outside the period for force majeure, medical emergency) — requires human judgment.
- When the customer expresses severe dissatisfaction or threatens formal complaint — emotional tone requires human intervention.

Suggested configuration:
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

## Exercise 27 · Predict which tool the agent calls

**(a) Turn 1 first iteration → `consultar_saldo`.**

The user explicitly asks for the balance of account ACC-4421. The `consultar_saldo` docstring says "Úsala SOLO cuando el cliente pregunte por su saldo" — that is exactly the intent. `hacer_transferencia` explicitly requires prior confirmation and verified balance, conditions not yet met.

**(b) Second turn → first `consultar_saldo`, then (after confirmation) `hacer_transferencia`.**

Even though Turn 1 history is in memory, the `hacer_transferencia` docstring requires "confirmar saldo suficiente" before transferring. A well-guided agent would verify updated balance before executing the transfer (balance may have changed). Only after confirming funds and obtaining explicit confirmation of amount and destination account would it call `hacer_transferencia(from_account="ACC-4421", to_account="ACC-9900", amount=200.0)`.

Expected order:
1. `consultar_saldo(account_id="ACC-4421")` — verify funds.
2. Present summary to user and ask for confirmation (no tool).
3. After "sí, confirmo" → `hacer_transferencia(...)`.

**(c) Vague docstring → premature or incorrect transfers.**

With only `"Transfiere dinero"`, the LLM does not know it must wait for confirmation or check balance first. It might call `hacer_transferencia` immediately on detecting "transfiere", without validating funds — financial and UX risk.

---

## Exercise 28 · Complete the conditional edge

**(a) Body of `should_continue`:**

```python
def should_continue(state: FlightChangeState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"
```

If the last message is an `AIMessage` with non-empty `tool_calls`, the agent wants to act → go to node `tools`. If there are no tool calls, the response is ready → terminate.

**(b) `add_conditional_edges` map:**

```python
builder.add_conditional_edges("agent", should_continue, {
    "tools": "tools",
    "end": END,
})
```

The values returned by `should_continue` (`"tools"`, `"end"`) map to destination nodes. `"end"` is LangGraph's `END` constant that finishes execution.

**(c) Why `add_edge("tools", "agent")` is necessary:**

After executing tools, the graph must **return to reasoning** with results in history — the observation step of the ReAct loop (§3). Without that edge, the graph would terminate after `tools` without giving the LLM a chance to read the `ToolMessage` and decide the next step. In scratch, this is `memory.append(tool_result)` followed by another `while` iteration.

**(d) ASCII diagram:**

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

## Exercise 29 · Map scratch → StateGraph and thread_id

**(a) Correspondence table:**

| Step in `solucion_scratch.py` | Node/edge in LangGraph |
|-------------------------------|--------------------------|
| `fake_llm(memory)` decides action | Node `"agent"` — `llm.invoke(messages)` |
| `TOOLS[name](**args)` | Node `"tools"` — `node_call_tools` |
| `memory.append({"role": "tool", ...})` | `add_messages` in `FlightChangeState` + `ToolMessage` returned by `node_call_tools` |
| `if "final" in response: break` | `should_continue` → `"end"` → `END` |
| `session.memory` persists between turns | `MemorySaver` + same `thread_id` in `config` |

**(b) Why the same `thread_id` remembers Turn 1:**

At the end of each `invoke`, `MemorySaver` serializes the full graph state (all accumulated messages: `HumanMessage`, `AIMessage`, `ToolMessage`) associated with the `thread_id`. On Turn 2, LangGraph **restores** that state before processing the new `HumanMessage`. The LLM receives the full history — it knows the PNR, the USD 130 cost, and that it asked for confirmation.

If you change the `thread_id` on Turn 2 (e.g. `"demo-002"`), LangGraph starts an empty session. The agent would not see Turn 1 and would respond "What change do you want to confirm?" or similar.

**(c) Do you need `_find_in_memory` with `create_react_agent` + `MemorySaver`?**

**No.** The checkpointer automatically persists all Turn 1 messages, including the assistant response with the USD 130 breakdown. On Turn 2, the LLM reads that full history and understands context without extracting fields from embedded `pnr:...` lines.

`_find_in_memory` was a scratch trick to simulate structured state without a formal `TypedDict`. In production with LangGraph, message history (short term) or extra fields in `FlightChangeState` (working memory) replace that pattern. If you use the explicit `StateGraph` commented in the lab, `node_call_tools` updates `pnr`, `penalty`, `total` directly in state — even cleaner than searching text.

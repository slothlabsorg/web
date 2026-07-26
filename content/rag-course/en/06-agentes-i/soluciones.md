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

**User turn:** "I want to return order ORD-0998. It arrived incomplete."

```
[STEP 1]
  Thought: The user wants to return order ORD-0998. I need to verify
           the status and amount of the order before proceeding.
  Action: OrderService(order_id="ORD-0998")
  Observation: { "order_id": "ORD-0998", "status": "delivered",
                 "amount": 240.00, "items": ["Shoes size 42", "Belt"] }

[STEP 2]
  Thought: The order exists and is delivered for $240. I need to verify
           the returns policy for this type of case (arrived incomplete).
  Action: PolicyRAG(query="return policy incomplete order")
  Observation: [{ "text": "Returns for incomplete products are accepted
                  within 30 days. The customer receives a full refund.",
                  "source": "returns-policy#§2.1" }]

[STEP 3 — guardrail.confirm is triggered]
  Thought: The policy allows the return. The amount is $240 > $200,
           so I must request explicit confirmation before executing.

  ← guardrail.confirm intercepts the call to ReturnService (amount > 200)
     and returns the confirmation message to the user. The agent does NOT
     execute ReturnService yet.

  RESPONSE TO USER (before charging):
  "Order ORD-0998 for $240.00 qualifies for a full return per
   §2.1 (incomplete product). Do you confirm you want to proceed with the
   return for $240.00?"

[— user responds "yes" —]

[STEP 4 — now ReturnService is called]
  Thought: The user confirmed. I execute the return.
  Action: ReturnService(order_id="ORD-0998", reason="incomplete product", amount=240.00)
  Observation: { "return_id": "RET-4422", "status": "initiated",
                 "refund_amount": 240.00, "eta_days": 5 }

[FINAL RESPONSE]
  "I have initiated the return for order ORD-0998.
   - Return ID: RET-4422
   - Refund: $240.00 in 3-5 business days
   Is there anything else I can help you with?"
```

`guardrail.confirm` acts between Step 2 and Step 4, pausing execution of ReturnService until explicit confirmation is received. The agent interprets the user's "yes" and only then releases the call.

---

## Exercise 16 · Predict the output

**(a)** The loop runs **2 iterations** before the `break`:
- Iteration 1: `fake_llm` detects "how much" → returns action `policy_rag`. The tool runs. Two messages are appended to memory.
- Iteration 2: `fake_llm` receives memory with the `policy_rag` result → condition `"policy_rag" in str(last)` is true for the last message (which contains `str(tool_result)`) → returns `{"final": "The penalty is USD 50 per §3.2."}` → `break`.

**(b)** It prints:
```
Response: The penalty is USD 50 per §3.2.
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
    {"role": "system",    "content": "You are a flight assistant..."},
    {"role": "user",      "content": "My PNR is SCL-BOG-001."},
    {"role": "assistant", "content": "[tool_call: ReservationService(pnr='SCL-BOG-001')]"},
    {"role": "tool",      "name": "ReservationService",
                          "content": '{"fare_class":"ECONOMY_FLEX","flight":"LA501",...}'},
    {"role": "user",      "content": "I want to change to June 17th."},
    {"role": "assistant", "content": "[tool_calls: InventoryService, PricingService]"},
    {"role": "tool",      "name": "PricingService",
                          "content": '{"delta":80,"total":130}'},
    {"role": "assistant", "content": "The total cost is USD 130. Do you confirm?"},
    {"role": "user",      "content": "Yes, I confirm the change."},
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

**(d) Without memory and the user says "yes I confirm" on a separate second turn:**
The agent does not know what is being confirmed. It has no PNR, no amount, no chosen flight. It would respond with something like "I have no information about a pending change" or, worse, invent data. This is exactly the scenario that justifies persistent conversational memory between turns.

---

## Exercise 18 · Find the bug

**(a) Bug 1 — Overwrites memory on each turn:**
```python
self.memory = [{"role": "user", "content": user_message}]
# ↑ Assigns a new list every time, erasing the previous history.
# Should be: self.memory.append(...)
```

**(b) Bug 2 — Does not append tool result to memory:**
```python
result = tool(**response["args"])
# Missing: add the result to history before the second LLM call:
self.memory.append({"role": "assistant", "content": str(response)})
self.memory.append({"role": "tool", "name": response["action"],
                    "content": str(result)})
response = fake_llm(self.memory)
```

**Corrected code for both bugs:**

```python
def chat(self, user_message):
    # Bug 1 fixed: append, not assignment
    self.memory.append({"role": "user", "content": user_message})

    response = fake_llm(self.memory)

    if "action" in response:
        tool = self.tools[response["action"]]
        result = tool(**response["args"])
        # Bug 2 fixed: add to memory before the next call
        self.memory.append({"role": "assistant", "content": str(response)})
        self.memory.append({"role": "tool",
                             "name": response["action"],
                             "content": str(result)})
        response = fake_llm(self.memory)

    if "final" in response:
        self.memory.append({"role": "assistant",
                             "content": response["final"]})
    return response.get("final", "No response")
```

**(c)** Yes, after the fixes the agent remembers the first question on the second, because `self.memory` is a persistent instance of `AgentWithMemory` and the history accumulates with `append`. The second turn sends the full list to the LLM, which can reason over the complete context.

---

## Exercise 19 · Architecture comparison

**(a) Deterministic pipeline:**

```
[io.input]
    ↓ Message
[logic.router]  ← is it a coverage question, policy lookup, or claim?
    ├─ "coverage"     → [tool.retriever "CoverageRAG"] → [logic.prompt] → [io.output]
    ├─ "policy"       → [tool.service "PolicyService"]  → [logic.prompt] → [io.output]
    └─ "claim"        → [guardrail.confirm] → [tool.service "ClaimService"] → [io.output]
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
   ↓ conditional: has_pnr?
   ├─ has_pnr=True  → [B: get_reservation]
   │                         ↓
   │                  [C: check_policy]
   │                         ↓ conditional: confirmed?
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

**(a) Problems with the tentative response "Yes, you can carry lithium batteries.":**

1. **Incomplete:** it does not distinguish carry-on vs. checked baggage (the difference is critical).
2. **No conditions:** it ignores capacity limits (≤100Wh, 100–160Wh, >160Wh).
3. **No citation:** it does not reference the policy (§4.2, §4.3, §4.4).
4. **Potentially incorrect:** batteries >160Wh are prohibited — the general "yes you can" is false for that case.
5. **Regulatory risk:** in aviation, an incorrect answer about batteries can have legal consequences.

**(b) Improved response:**

"For personal-use lithium batteries (laptops, tablets, phones):
- **≤100 Wh**: allowed in **carry-on baggage**; **prohibited in checked baggage** [§4.2].
- **100–160 Wh**: require prior authorization from the airline [§4.3].
- **>160 Wh**: **prohibited** in all cases [§4.4].

Do you know the capacity of your battery? It is usually printed on the device label."

**(c) When Reflection is not worth it:**

1. **Real-time conversation with user waiting:** adds 1–3 seconds of latency per extra LLM call, degrading user experience.
2. **When retrieved context is sufficiently clear:** if the response already cites sources and covers the cases, reflection adds cost without benefit.
3. **When you do not have a reliable evaluator:** if the evaluator LLM has the same biases as the actor, reflection does not improve the response.
4. **Cases where the answer is always simple:** "Can I check in online?" → "Yes, up to 2 hours before" does not need reflection.

---

## Exercise 22 · Tool design

**(a) JSON Schemas:**

```json
// CheckBalance
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string", "description": "Account ID" }
  },
  "required": ["account_id"]
}

// ListTransactions
{
  "type": "object",
  "properties": {
    "account_id": { "type": "string" },
    "n":          { "type": "integer", "minimum": 1, "maximum": 100,
                    "default": 10, "description": "Number of transactions" }
  },
  "required": ["account_id"]
}

// MakeTransfer
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
[tool.service "TransferService"]
      ↓ Tool
[guardrail.confirm]  threshold: "amount > 500"
      ↓ Tool
[guardrail.idempotency]  keyFields: ["account_id", "session_id"]
      ↓ Tool
[agent.react]
```

**(c) Description for the LLM:**

```
"Executes a bank transfer between accounts. USE ONLY after having checked the balance
with CheckBalance and confirming that there are sufficient funds. Requires explicit user
confirmation for amounts greater than $500. Do not call it speculatively — wait until the user
clearly indicates they want to transfer and has confirmed the amount."
```

---

## Exercise 23 · Agentic RAG vs standard RAG

**(a) Standard RAG — problem:**

Fixed pipeline:
```
Input → retrieval(A or B or both) → generation → output
```

Problem: if the user asks something outside the documents ("Can I cancel my policy?") the system still retrieves chunks (possibly irrelevant) and generates a response that may look valid but be based on the wrong topic. It cannot reliably say "I don't have information."

**(b) Agentic RAG — flow:**

```
Thought: I need to know if it covers floods. First I'll search general coverage.
Action: coverage_rag(query="flood damage coverage")
Observation: [{ "text": "Covers accidental water damage..." }]

Thought: The general coverage says yes, but I must verify if there are exclusions.
Action: exclusions_rag(query="flood exclusion BASIC policy")
Observation: [{ "text": "Floods caused by river overflow: EXCLUDED §8.3" }]

Thought: There is a specific exclusion. The correct answer is that it depends on the type of flood.
```

If neither index has the answer, the agent can say so explicitly: "I did not find information about that type of coverage in the available documents. I recommend contacting your advisor."

**(c) `tool.retriever` nodes:**

```json
{
  "id": "coverage_tool",
  "type": "tool.retriever",
  "config": {
    "name": "coverage_rag",
    "description": "Searches general insurance coverage. Use it for questions about what is covered in general terms."
  }
}

{
  "id": "exclusions_tool",
  "type": "tool.retriever",
  "config": {
    "name": "exclusions_rag",
    "description": "Searches specific exclusions by policy type. ALWAYS consult it after coverage_rag to verify if any exclusion applies to the user's specific case."
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
1. CheckAvailability
   Description: Searches available rooms at a hotel for a given date.
   Input: { "checkin": string, "checkout": string, "guests": int }

2. GetReservation
   Description: Gets the details of an existing reservation by its ID.
   Input: { "booking_id": string }

3. CreateReservation
   Description: Creates a new room reservation. Only call when
                the user has confirmed room type and dates.
   Input: { "checkin": string, "checkout": string,
               "room_type": string, "guest_name": string }

4. CancelReservation
   Description: Cancels an existing reservation. Verify penalty first
                with PolicyRAG if dates are close.
   Input: { "booking_id": string, "reason": string }

5. PolicyRAG (tool.retriever)
   Description: Queries hotel policies (cancellation, penalties,
                included services). Use it before confirming cancellations.
```

**(b) Guardrails:**

- `CancelReservation` → `guardrail.confirm` (threshold: "penalty > 0", message: "There is a late cancellation penalty of $X. Do you confirm?").
- `CreateReservation` → `guardrail.confirm` (threshold: "total > 500") + `guardrail.idempotency` (keyFields: ["booking_id", "session_id"]).

**(c) Agent state (working memory):**

```python
state = {
    "guest_name":   None,   # guest name
    "booking_id":   None,   # active reservation ID in the session
    "checkin":      None,
    "checkout":     None,
    "room_type":    None,
    "total":        None,   # calculated cost
    "has_penalty":  False,  # whether cancellation penalty applies
    "penalty_amt":  0.0,
    "confirmed":    False
}
```

**(d) System prompt:**

```
You are a hotel reservation assistant. Your mission is to help guests
check availability, make reservations, and manage cancellations efficiently
and politely. Suggested flow: (1) If the guest mentions an existing
reservation, get its details with GetReservation first. (2) For new
reservations, verify availability before confirming. (3) For cancellations,
always consult PolicyRAG to determine if a penalty applies, and inform the
guest before proceeding. Remember the conversation context — do not ask for
information the guest has already provided.
```

**(e) Cases for `hitl.escalate`:**

- When the guest reports a serious problem during their stay (room in poor condition, security issue) — the bot cannot resolve physical problems.
- When an exception to policy is requested (free cancellation outside the period for force majeure, medical emergency) — requires human judgment.
- When the customer expresses severe dissatisfaction or threatens a formal complaint — emotional tone requires human intervention.

Suggested configuration:
```json
{
  "type": "hitl.escalate",
  "config": {
    "when": "stay_problem OR policy_exception OR severe_dissatisfaction",
    "assignee": "hotel_supervisor",
    "timeout": "5m"
  }
}
```

---

## Exercise 27 · Predict which tool the agent calls

**(a) Turn 1 first iteration → `check_balance`.**

The user explicitly asks for the balance of account ACC-4421. The `check_balance` docstring says "Use ONLY when the customer asks about their balance" — that is exactly the intent. `make_transfer` explicitly requires prior confirmation and verified balance, conditions not yet met.

**(b) Second turn → first `check_balance`, then (after confirmation) `make_transfer`.**

Even though Turn 1 history is in memory, the `make_transfer` docstring requires "confirming sufficient balance" before transferring. A well-guided agent would verify updated balance before executing the transfer (balance may have changed). Only after confirming funds and obtaining explicit confirmation of amount and destination account would it call `make_transfer(from_account="ACC-4421", to_account="ACC-9900", amount=200.0)`.

Expected order:
1. `check_balance(account_id="ACC-4421")` — verify funds.
2. Present summary to user and ask for confirmation (no tool).
3. After "yes, I confirm" → `make_transfer(...)`.

**(c) Vague docstring → premature or incorrect transfers.**

With only `"Transfers money"`, the LLM does not know it must wait for confirmation or check balance first. It might call `make_transfer` immediately on detecting "transfer", without validating funds — financial and UX risk.

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
    yes             ▼               │
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

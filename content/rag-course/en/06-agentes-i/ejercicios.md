# M6 · Exercises — Agents I

> **Instructions:** Answer without looking at the solutions. For coding exercises, write your answer before running it.
>
> Reasoned answers are in `soluciones.md`.

---

## Exercise 14 · Multiple choice — Agent or pipeline?

For each scenario, indicate whether you would use a ReAct agent or a deterministic pipeline, and justify in one sentence.

**(a)** A company wants to automatically generate the monthly newsletter PDF from an article repository. The process is always the same: extract the month's articles, summarize them, format, and generate PDF.

**(b)** A banking user writes: "I need to transfer money, but first tell me if I have sufficient funds and if the destination account is active."

**(c)** An e-commerce bot must answer "When will my order arrive?" by checking shipping status using the order number already in the user's JWT.

**(d)** An HR assistant answers questions about vacation policies, leave, and benefits, always searching the same policy document.

**(e)** A technical support agent must diagnose a network problem: it may need to check logs, ping services, review previous tickets for the same customer, and each step depends on the previous one.

---

## Exercise 15 · "Trace the ReAct loop"

The user writes to a retail bot:
> "I want to return order ORD-0998. It arrived incomplete."

The agent has access to these tools:
- `OrderService(order_id)` → returns order status and amount.
- `PolicyRAG(query)` → searches the returns policy.
- `ReturnService(order_id, reason, amount)` → initiates the return.

**Trace the ReAct loop steps:** for each step write:
1. **Thought:** what the agent reasons.
2. **Action:** which tool it calls and with what arguments.
3. **Observation:** what the tool returns (invent something coherent; assume amount $240).

Indicate at which step `guardrail.confirm` applies (threshold $200) and what message the user sees before the agent calls `ReturnService`.

---

## Exercise 16 · "Predict the output"

Given this Python fragment implementing a minimal ReAct agent:

```python
memory = [
    {"role": "system", "content": "You are a flight assistant."},
    {"role": "user",   "content": "How much does it cost to change my flight?"}
]

def fake_llm(messages):
    last = messages[-1]["content"]
    if "how much" in last.lower():
        return {"action": "policy_rag", "args": {"query": "flight change penalty"}}
    if "policy_rag" in str(last):
        return {"final": "The penalty is USD 50 per §3.2."}
    return {"final": "I didn't understand the question."}

def policy_rag(query):
    return [{"text": "Change penalty: USD 50.", "source": "§3.2"}]

TOOLS = {"policy_rag": policy_rag}

step = 0
while step < 5:
    response = fake_llm(memory)
    if "final" in response:
        print("Response:", response["final"])
        break
    tool_name = response["action"]
    tool_result = TOOLS[tool_name](**response["args"])
    memory.append({"role": "assistant", "content": str(response)})
    memory.append({"role": "tool", "name": tool_name, "content": str(tool_result)})
    step += 1
```

**(a)** How many loop iterations run before the `break`?

**(b)** What is printed on screen?

**(c)** If the user asked in a **second turn** "and if I'm a premium member?" (without adding anything to the history), would the agent remember that they previously asked about the change cost?

**(d)** What would need to change so the second turn remembers the first?

---

## Exercise 17 · "Design the memory"

You have an airline customer service agent. In the current session the user has said:

1. "My PNR is SCL-BOG-001."
2. "I want to change to June 17th."
3. [The agent queried ReservationService: fare_class=ECONOMY_FLEX, penalty=USD 50]
4. [The agent calculated delta=USD 80, total=USD 130]
5. "Yes, I confirm the change."

**(a)** What information goes in **conversational memory** (message history)?

**(b)** What information goes in **agent state** (working memory / state dictionary)?

**(c)** If the user now asks "and what if instead of FL305 I choose FL301?", which ReAct steps would the agent have to repeat? Which would it not?

**(d)** What would happen if the agent had no memory and the user said "yes, I confirm" on a separate second turn?

---

## Exercise 18 · "Find the bug"

The following code attempts to implement an agent with simple memory:

```python
class AgentWithMemory:
    def __init__(self, tools):
        self.tools = tools
        self.memory = []  # ← message history

    def chat(self, user_message):
        # Bug 1: is there something wrong with how the user message is added?
        self.memory = [{"role": "user", "content": user_message}]

        response = fake_llm(self.memory)

        if "action" in response:
            tool = self.tools[response["action"]]
            result = tool(**response["args"])
            # Bug 2: what is missing here?
            response = fake_llm(self.memory)

        return response.get("final", "No response")

agent = AgentWithMemory({"policy_rag": policy_rag})
r1 = agent.chat("How much does it cost to change my flight?")
r2 = agent.chat("And if I'm a premium member?")  # does it remember the context?
```

**(a)** Identify and describe the two marked bugs.

**(b)** Write the corrected code for the two defective fragments.

**(c)** After the fix, does the agent remember the first question when answering the second? Why?

---

## Exercise 19 · Architecture comparison

You need to build an assistant for an insurance call center. The assistant must:
- Answer questions about coverage (static knowledge base).
- Check the status of a specific policy (HTTP service).
- Create a claim ticket if the customer requests it (HTTP service with confirmation).

**(a)** Design the flow as a **deterministic pipeline** (without `agent.react`). Draw a simple diagram with the necessary RAGorbit nodes and order. What assumption must you make about the user flow?

**(b)** Design the flow as a **ReAct agent**. Which nodes would you use? Which tools would the agent have?

**(c)** Which would you choose for production and why? Consider: cost, maintainability, robustness to off-happy-path questions.

---

## Exercise 20 · LangGraph conceptual

Given the following agent graph (pseudocode):

```python
class State(TypedDict):
    query:     str
    pnr:       str
    has_pnr:   bool
    policy:    str
    confirmed: bool
    result:    str

builder = StateGraph(State)
builder.add_node("A", node_extract_pnr)    # extracts PNR from query
builder.add_node("B", node_get_reservation) # calls ReservationService
builder.add_node("C", node_check_policy)   # calls PolicyRAG
builder.add_node("D", node_ask_confirm)    # asks for confirmation
builder.add_node("E", node_execute)        # executes the change

builder.set_entry_point("A")
builder.add_conditional_edges("A", lambda s: "B" if s["has_pnr"] else "D")
builder.add_edge("B", "C")
builder.add_conditional_edges("C", lambda s: "E" if s["confirmed"] else "D")
builder.add_edge("D", END)
builder.add_edge("E", END)
```

**(a)** Draw the graph (nodes and conditional edges).

**(b)** If the user writes "Change flight" (no PNR), which path does the graph follow?

**(c)** If the user writes "Change flight PNR=SCL001" and already has `confirmed=True` in state, which path does it follow?

**(d)** What advantage does this explicit design have vs. a free ReAct that could also do this?

---

## Exercise 21 · Reflection in practice

A ReAct agent generates the following tentative response to "can I carry lithium batteries in my luggage?":

> "Yes, you can carry lithium batteries."

An internal evaluator (another LLM call) receives this response along with the retrieved context:

```
Retrieved context:
  - "Lithium batteries ≤100Wh: allowed in carry-on baggage; prohibited in checked baggage. [§4.2]"
  - "Batteries 100-160Wh: require prior authorization. [§4.3]"
  - "Batteries >160Wh: prohibited. [§4.4]"
```

**(a)** What problems does the tentative response have? List at least 3.

**(b)** Write the improved response the agent should deliver after reflection.

**(c)** When would **Reflection not** be worth doing in this use case? Provide at least two reasons.

---

## Exercise 22 · Tool design

You are designing tools for a bank customer service agent. The agent must be able to:
1. Check account balance.
2. List the last N transactions.
3. Make a transfer.

**(a)** Write the `inputSchema` JSON Schema for each tool.

**(b)** The transfer tool needs `guardrail.confirm` for amounts > $500 and `guardrail.idempotency` with key `(account_id, session_id)`. Draw the connection chain in RAGorbit (Tool → Tool ports).

**(c)** What description would you write for the transfer tool so the LLM uses it at the right moment (not before checking balance)?

---

## Exercise 23 · Agentic RAG vs standard RAG

You have an insurance assistant with two knowledge bases:
- Index A: general coverage.
- Index B: policy-specific exclusions.

**(a)** With standard RAG, design how you would answer "does my policy cover flood damage?". What problem arises when the user asks something outside the documents?

**(b)** With Agentic RAG, how would the agent use the two indexes for the same question? What would it do if neither index has the answer?

**(c)** In RAGorbit, how would you expose the two indexes as tools? Write the two `tool.retriever` nodes with their description.

---

## Exercise 24 · "Choose the technology"

For each case, choose among ReAct, Plan-and-Execute, Reflexion, or LangGraph StateGraph, and justify in 2–3 sentences.

**(a)** A support chatbot handling 1000 conversations per minute, with expected responses in < 2 seconds. The flow always involves: search FAQ, check ticket status, respond.

**(b)** A research system that, given a business question, performs 15–20 web searches, reads documents, and synthesizes a report. Runs in batch, not real time.

**(c)** A trading agent that executes stock orders. The number of steps is variable but state (account, portfolio, risk) must persist between calls and be auditable.

**(d)** A system that generates Python code for a client, runs it in a sandbox, evaluates whether the output is correct, and improves the code if not. Up to 3 attempts allowed.

---

## Exercise 25 · RAGorbit integration

Review the `flow.json` of template `01-airline-flight-change` (in `examples/01-airline-flight-change/flow.json`).

**(a)** Count how many `tool.*` nodes there are and list their names and IDs.

**(b)** Why does payment have three guardrails in chain? Explain what each one does in order.

**(c)** What does the agent's self-edge (`"loop": true`) represent in the ReAct loop?

**(d)** If you wanted to add a second RAG index (e.g., exception procedures for cancelled international flights), which nodes would you add and how would you connect them? Describe changes to `flow.json`.

**(e)** The `system` prompt of `agent.react` says: "Mandatory flow: (1) Get itinerary... (2) Query PolicyRAG...". Does that turn the agent into a pipeline? Why or why not?

---

## Exercise 26 · End-to-end design

You have the following business brief:

> **Hotel booking assistant.** A guest can ask about availability ("Are there rooms on July 20?"), make a reservation, or cancel one. Cancellation has a penalty if less than 48 hours in advance. The assistant must remember context during the conversation (the guest should not repeat their reservation number every turn).

**(a)** List the tools this agent would need (names, 1-line description, simplified input schema).

**(b)** Which guardrails would you place and on which tools?

**(c)** What information would you store in agent state (working memory)?

**(d)** Write the `system` prompt for `agent.react` (3–5 sentences, guiding the preferred flow without making it fully deterministic).

**(e)** Is there any case where this agent should escalate to a human (`hitl.escalate`)? Which?

---

## Exercise 27 · "Predict which tool the agent calls"

An agent has these two tools decorated with `@tool`:

```python
@tool
def check_balance(account_id: str) -> dict:
    """
    Returns the current balance of a bank account.
    Use ONLY when the customer asks about their balance or available funds.
    Requires the customer's account_id.
    """
    ...

@tool
def make_transfer(from_account: str, to_account: str, amount: float) -> dict:
    """
    Executes a transfer between accounts.
    USE ONLY after confirming sufficient balance and obtaining
    explicit confirmation from the customer about the amount and destination account.
    """
    ...
```

The user writes on the **first turn**: *"How much do I have in my account ACC-4421?"*

**(a)** Which tool should the agent call on its first iteration? Why?

**(b)** The user responds on a **second turn** (same session): *"Transfer $200 to account ACC-9900."* Without having checked balance this turn, which tools should the agent call and in what order? Justify using the docstrings.

**(c)** If the `make_transfer` docstring said only `"Transfers money"`, what problem could occur?

---

## Exercise 28 · "Complete the conditional edge"

You are building an explicit `StateGraph` for the lab agent. You have this incomplete skeleton:

```python
def should_continue(state: FlightChangeState) -> str:
    last = state["messages"][-1]
    # TODO: complete — are there pending tool_calls?
    ...

builder = StateGraph(FlightChangeState)
builder.add_node("agent", node_agent)
builder.add_node("tools", node_call_tools)
builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {
    # TODO: complete the destination map
})
builder.add_edge("tools", "agent")
graph = builder.compile(checkpointer=MemorySaver())
```

**(a)** Complete the body of `should_continue` so it returns `"tools"` if the last message has `tool_calls`, and `"end"` if not.

**(b)** Complete the dictionary for the third argument of `add_conditional_edges` (mapping return values → node names or `END`).

**(c)** Why is `add_edge("tools", "agent")` necessary? What would happen if you only had the conditional edge from `agent` without that return edge?

**(d)** Draw the resulting graph (nodes + edges) in ASCII.

---

## Exercise 29 · "Map scratch → StateGraph and memory with thread_id"

Compare your scratch lab implementation with LangGraph's `StateGraph`.

**(a)** Complete this correspondence table:

| Step in `solucion_scratch.py` | Node/edge in LangGraph |
|-------------------------------|--------------------------|
| `fake_llm(memory)` decides action | ? |
| `TOOLS[name](**args)` | ? |
| `memory.append({"role": "tool", ...})` | ? |
| `if "final" in response: break` | ? |
| `session.memory` persists between turns | ? |

**(b)** Why does the same `thread_id` on two consecutive `invoke` calls make the agent remember Turn 1? Explain what `MemorySaver` stores and what happens if you change the `thread_id` on Turn 2.

**(c)** In scratch you used `_find_in_memory` to recover `pnr` and `total` from Turn 1. With `create_react_agent` + `MemorySaver`, do you need that function? Why or why not?

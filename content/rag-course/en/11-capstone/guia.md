# M11 · Architecture and Capstone

> **Module 11 — Week 10.** Integrates the full curriculum: cross-cutting patterns, `flow.json` design, anti-patterns, evaluation as system testing, and the **capstone** (rebuild templates + design + exam).
>
> **RAGorbit nodes:** all (13 categories). **Capstone templates:** [09](../../examples/09-hr-policy-assistant/) → [02](../../examples/02-banking-credit-scoring/) → [01](../../examples/01-airline-flight-change/).

---

## Table of Contents

1. [Cross-cutting patterns](#1-cross-cutting-patterns)
2. [How to read a flow.json](#2-how-to-read-a-flowjson)
3. [How to design a flow.json](#3-how-to-design-a-flowjson)
4. [Anti-patterns](#4-anti-patterns)
5. [Design checklist](#5-design-checklist)
6. [AI system testing (eval as test)](#6-ai-system-testing-eval-as-test)
7. [Reconstruction path 09 → 02 → 01](#7-reconstruction-path-09--02--01)
8. [Checkpoint](#8-checkpoint)
9. [Layer ③ explained: how to rebuild a template with a framework](#12-layer--explained-how-to-rebuild-a-template-with-a-framework)

---

## 1. Cross-cutting patterns

These patterns appear across multiple templates and modules. Mastering them is the **expert** criterion for the course ([`PLAN.md` §1](../PLAN.md)).

### 1.1 RAG-as-tool

**What it is:** retrieval is not a fixed pipeline step — it is a **tool** the agent invokes when it needs documentary evidence.

```
Fixed pipeline (09 HR):       io.input → retrieval.vector → prompt → output
RAG-as-tool (01 Airline):     agent.react ──invokes──▶ tool.retriever (PolicyRAG)
```

**When to use:**
- The agent must decide **whether** and **when** to consult documents (flight change: only after obtaining fare_class from the PNR).
- There are multiple sources and the agent chooses filters dynamically.

**When NOT to:**
- Question always about the same corpus (HR) → linear pipeline is simpler and more auditable.

**RAGorbit node:** `tool.retriever`. **Templates:** 01, 03, 10.

**Scratch implementation:** function `policy_rag(query, fare_class, route_type)` wrapped in a `TOOLS` dict.

**Framework implementation:** LangChain `@tool` that internally calls `retriever.invoke()` with filters.

---

### 1.2 Hard-filter-as-guardrail

**What it is:** metadata filters applied **in the store/SQL**, not as a suggestion to the LLM.

```
❌ Wrong: "Search only PPO plan documents" in the system prompt
✅ Right: retrieval.vector with hardFilters: [plan, condition] → SQL WHERE plan='PPO'
```

**Why it matters:** semantic embedding can retrieve chunks from another plan if the text is similar. Hard-filters are a **precision guardrail** — the system cannot violate them through hallucination.

**When to use:** regulated domains (healthcare, banking, aviation, legal) where mixing contexts has consequences.

**Node:** `retrieval.vector` with `hardFilters`, or prior `ingest.metadata`.

**Templates:** 02 (doc_type/period), 01 (fare_class/route_type), 03, 08.

---

### 1.3 Deterministic vs LLM

**Principle:** the LLM **reasons**; business rules **decide**.

| Task | Who does it | Node |
|-------|---------------|------|
| Score credit risk | LLM (score 0–100) | `logic.structured` |
| Approve/reject by threshold | Deterministic rule | `logic.rules` |
| Classify P1/P2/P3 in disruption | Deterministic rule | `logic.rules` |
| Draft justification | LLM | `logic.structured` / `logic.prompt` |
| Charge with idempotency | Guardrail (code) | `guardrail.idempotency` |

**Anti-pattern:** asking the LLM for `"decision": "approve"` and trusting it without `logic.rules`.

**Templates:** 02 (credit thresholds), 10 (simple vs complex track), 04 (deductible).

---

### 1.4 Fan-out at scale

**What it is:** process thousands of events in parallel with **stateless** sub-agents, not a single conversational agent.

```
io.event-source (Kafka)
    → logic.rules (segment)
    → logic.router (simple | complex)
    → agent.fanout (concurrency: 16)
        ├── tool.retriever (PolicyRAG)
        ├── tool.service (Alternatives)
        └── auto-confirm (rules) vs LLM (complex only)
```

**When to use:** high volume, independent events (logistics, mass notifications).

**When NOT to:** multi-turn conversation with one user → `agent.react`.

**Template:** 10-logistics. **Module:** M7.

---

### 1.5 Mandatory citations

**What it is:** post-processor that verifies the response anchors claims to retrieved chunks.

**Flow:**
```
logic.prompt → Message (LLM response)
                    ↓
logic.citations ← Chunks (from the retriever)
    mode: enforce → rejects/regenerates if no citation
                    ↓
               io.output
```

**Why it goes AFTER the LLM:** the LLM may omit citing; `enforce` is code that does not negotiate.

**Templates:** 09, 02, 03, 05, 07, 08.

---

### 1.6 Agentic RAG

**What it is:** combine ReAct agent with RAG-as-tool + post-agent guardrails.

```
agent.react
  ├── tool.retriever (clinical guidelines)
  ├── tool.service (patient history)
  └── ...
       ↓
logic.citations (enforce)
       ↓
hitl.escalate (critical cases — structural, not decided by LLM)
```

**Difference from linear RAG:** the agent decides the order of queries and can combine APIs + documents.

**Templates:** 01, 03. **Module:** M6.

---

### 1.7 Summary table: patterns → templates

| Pattern | Templates that illustrate it | Main module |
|--------|---------------------------|------------------|
| Linear RAG | 09 | M1 |
| Batch + structured + rules | 02, 04 | M2–M5 |
| RAG-as-tool | 01, 03, 10 | M6, M7 |
| Hard-filters | 02, 01, 03, 08 | M4 |
| Fan-out | 10 | M7 |
| Citations enforce | 09, 02, 03, 05 | M5 |
| Transactional guardrails | 01, 06 | M6, M9 |
| Multi-index + router | 05, 07 | M4 |
| HITL | 03, 08 | M9 |
| MCP | 01 (exportable PolicyRAG) | M8 |

Full map: [`reference/mapped-templates.md`](../referencia/plantillas-mapeadas.md).

---

## 2. How to read a flow.json

A `flow.json` is the **Flow IR** — the source of truth that RAGorbit translates to Python. Contract: [`docs/01-concepts.md`](../../docs/01-concepts.md).

### 2.1 High-level structure

```json
{
  "irVersion": "1.0",
  "flow": { "id", "name", "deploymentTarget", "defaults" },
  "nodes": [ { "id", "type", "label", "config" } ],
  "edges": [ { "source", "sourcePort", "target", "targetPort", "loop?" } ],
  "secrets": [ { "name", "required", "usedBy" } ]
}
```

### 2.2 Reading in 5 steps

1. **`deploymentTarget`** — defines the runtime: `chat-service`, `batch`, `event-worker`.
2. **Implicit entry node** — `io.input`, `io.batch`, or `io.event-source`.
3. **Ingestion pipeline (if any)** — loaders → chunker → metadata → store (offline).
4. **Runtime pipeline** — from entry to `io.output`, following edges.
5. **`secrets`** — which credentials you need (never values in the JSON).

### 2.3 Ports and types

Ports must be **compatible**. Common error when reading:

| Port | Data type | Connects with |
|--------|--------------|-------------|
| `Documents` | List of unindexed documents/chunks | `loader` → `ingest` → `store` |
| `Embeddings` | Embedding function/model | `model.embedding` → `store` |
| `Retriever` | Searchable object | `store` → `retrieval` / `tool.retriever` |
| `Query` / `Message` | User text | `io.input` → `retrieval` / `agent` |
| `Chunks` | Retrieved fragments | `retrieval` → `logic` |
| `Model` | Configured LLM | `model.llm` → `logic` / `agent` |
| `Tool` | Invocable function | `tool.*` → `agent` |
| `Decision` | Structured JSON | `logic.structured` → `logic.rules` |
| `Any` | Passthrough | `observability` → `io.output` |

### 2.4 Example: trace template 09 HR

```
chat_input:Message ──▶ retriever:Query
hr_store:Retriever ──▶ retriever:Retriever
retriever:Chunks ──▶ prompt:Chunks
chat_input:Message ──▶ prompt:Message
llm:Model ──▶ prompt:Model
prompt:Message ──▶ citations:Message
retriever:Chunks ──▶ citations:Chunks
citations:Message ──▶ chat_output:Any
```

**Offline ingestion (same design session):**
```
hr_docs:Documents → chunker → hr_store
embedder:Embeddings → hr_store
```

---

## 3. How to design a flow.json

### 3.1 Recommended process

```
Business brief
    ↓
① Define deploymentTarget (chat? batch? events?)
    ↓
② List inputs/outputs (io.*)
    ↓
③ Design offline ingestion (if RAG is needed)
    ↓
④ Design runtime (pipeline or agent)
    ↓
⑤ Add guardrails, HITL, observability
    ↓
⑥ Validate contract in RAGorbit
    ↓
⑦ Test with mocks → eval with dataset
```

### 3.2 Decisions by category

| Question | Options | Criterion |
|----------|----------|----------|
| Agent or pipeline? | `agent.react` vs fixed chain | Is step order unpredictable? → agent |
| Which store? | Chroma vs pgvector vs multi-index | Chroma: prototype; pgvector: production; multi-index: multiple KBs |
| When to rerank? | Yes/No | Legal, medical, high precision → yes (M4) |
| Structured or free prompt? | `logic.structured` vs `logic.prompt` | Does output go to another system? → structured |
| Where do rules go? | `logic.rules` after the LLM | Whenever there is a business threshold |

### 3.3 Mental template by complexity

**Level 1 — Conversational RAG (09):**
`io.input → retrieval → prompt → citations → io.output`

**Level 2 — Auditable batch (02):**
`io.batch → loaders → chunker → metadata → store → retrieval → structured → rules → io.output`

**Level 3 — Transactional agent (01):**
`ingestion → tool.retriever` + `io.input → agent.react ← tools ← guardrails → audit → io.output`

---

## 4. Anti-patterns

### 4.1 Delegating thresholds to the LLM

```json
// ❌ Anti-pattern
"logic.structured": { "schema": { "decision": "approve|reject" } }
// Without logic.rules — the LLM decides to approve with score 45
```

**Fix:** deterministic `logic.rules` after `logic.structured`.

---

### 4.2 Filters in the prompt instead of hard-filters

```json
// ❌ "Filter by PPO plan in your search"
// ✅
"retrieval.vector": { "hardFilters": ["plan", "condition"] }
```

---

### 4.3 Citations only in the system prompt

```json
// ❌ "Always cite your sources" in system — the LLM can ignore it
// ✅ logic.citations with mode: enforce AFTER the LLM
```

---

### 4.4 HITL decided by the LLM

```json
// ❌ "If the case is severe, say you will escalate to a human"
// ✅ hitl.escalate with structural conditions (severity, criteria_not_found)
```

---

### 4.5 One monolithic index for everything

Mixing legal playbook + regulations + precedents in a single `store.pgvector` without router → cross-category noise.

**Fix:** `store.multi-index` + `retrieval.router` (template 05, 07).

---

### 4.6 Conversational agent for high volume

Using `agent.react` for mass rebookings (thousands of shipments) → unsustainable latency and cost.

**Fix:** `agent.fanout` + `logic.rules` (template 10).

---

### 4.7 Guardrails in the agent prompt

```json
// ❌ "Ask for confirmation if the amount exceeds 500" in the agent's system prompt
// ✅ guardrail.confirm wrapping the Payment tool
```

The agent consumes `maxSteps` and may "forget" the instruction. Structural guardrails are code.

---

### 4.8 No audit on transactional actions

Charges, flight changes, refunds without `observability.audit` → regulatory non-compliance.

---

## 5. Design checklist

Use this list before considering a `flow.json` complete:

### Business and deployment

- [ ] `deploymentTarget` matches the use case (chat / batch / event-worker)
- [ ] Entry and exit (`io.*`) defined with correct format (markdown/json/streaming)
- [ ] Secrets declared without embedded values

### Ingestion and retrieval

- [ ] Chunking strategy justified (by-section, by-clause, etc.)
- [ ] Sufficient metadata for domain hard-filters
- [ ] `topK` and store chosen with documented trade-off

### Generation and logic

- [ ] Low temperature (0.0–0.2) for factual responses
- [ ] `logic.structured` if output goes to another system
- [ ] `logic.rules` for business thresholds (not delegated to the LLM)
- [ ] `logic.citations` enforce if there are consequences for hallucination

### Agents and tools

- [ ] Bounded `maxSteps` in `agent.react`
- [ ] Tools with clear `description` for the LLM
- [ ] RAG-as-tool only when the agent must decide when to retrieve

### Production and security

- [ ] Guardrails on transactional tools (idempotency, confirm, resilience)
- [ ] `hitl.escalate` in critical cases (structural)
- [ ] `observability.audit` on regulated actions
- [ ] Eval plan (dataset + minimum metrics)

### Technical validation

- [ ] 0 errors when validating in RAGorbit
- [ ] Testing with mocks responds coherently
- [ ] Edges with `loop: true` only where there is a valid ReAct cycle

---

## 6. AI system testing (eval as test)

In AI systems, **evaluation is system testing** — there is no single deterministic output, but there are verifiable properties.

### 6.1 Test pyramid for RAG/agentic

```
                    ┌─────────────────┐
                    │  End-to-end eval │  ← RAGAS, business cases
                    │  (slow, costly)  │
                    ├─────────────────┤
                    │  Integration      │  ← full graph with mocks
                    │  (pytest + MOCK)  │
                    ├─────────────────┤
                    │  Unit / nodes     │  ← rules, filters, guardrails
                    │  (deterministic)  │
                    └─────────────────┘
```

### 6.2 What to test deterministically

| Component | Test | Example |
|------------|------|---------|
| `logic.rules` | Fixed input → output | score=72 → "approve" |
| `guardrail.idempotency` | 2nd call → deduplicated | M9 lab |
| hard-filters | Query without chunks from another plan | top-k only from the file |
| `logic.citations` enforce | Response without citation → rejected | M5 lab |
| chunker | N chunks with expected metadata | M2 expected |

### 6.3 Eval metrics (upper layer)

| Metric | What it measures | Tool |
|---------|----------|-------------|
| Faithfulness | Is the response anchored to context? | RAGAS |
| Context precision | Are retrieved chunks relevant? | RAGAS |
| Context recall | Was everything necessary retrieved? | RAGAS |
| Answer relevance | Does it answer the question? | RAGAS / DeepEval |
| Tool success rate | Did the agent complete the task? | Custom + LangSmith |

### 6.4 Eval as CI

```python
# Pseudocode — recommended pattern
DATASET = [
    {"query": "Vacation after 3 years?", "must_contain": ["18 days"], "must_cite": "§3"},
    {"query": "Stock price?", "must_contain": ["not available"]},
]

def test_rag_properties():
    for case in DATASET:
        result = pipeline(case["query"])
        assert all(s in result.text for s in case["must_contain"])
        if "must_cite" in case:
            assert case["must_cite"] in result.citations
```

**Rule:** deterministic tests (rules, guardrails, filters) go in CI on every commit; eval with real LLM goes in nightly or pre-release.

### 6.5 Capstone system testing

For your 09→02→01 reconstructions:

1. **09:** assert indices and similarities (like `expected.md`).
2. **02:** assert JSON schema + `decision` from rules, not from the LLM.
3. **01:** assert tool call sequence + idempotency + audit events.

---

## 7. Reconstruction path 09 → 02 → 01

Capstone order ([`mapped-templates.md` § Path](../referencia/plantillas-mapeadas.md)):

```
09 HR          02 Banking          01 Airline
~10 nodes      ~12 nodes           ~18 nodes
Linear RAG     batch+rules         agent+guardrails+RAG-tool
```

### 7.1 Template 09 — what it validates

- Full RAG cycle: `Documents → Retriever → Chunks → Message`.
- Mandatory citations post-LLM.
- Chroma/in-memory store for prototype.

**Lab:** [`lab/solucion_scratch.py`](lab/solucion_scratch.py) — executable reference.

### 7.2 Template 02 — complexity jump

Adds on top of 09:
- `io.batch` + two loaders
- `ingest.metadata` + `hardFilters`
- `logic.structured` + `logic.rules`
- pgvector (production)

**Key skill:** the LLM scores; the rule decides.

### 7.3 Template 01 — full integration

Adds on top of 02:
- `agent.react` with loop
- `tool.retriever` (PolicyRAG)
- 4× `tool.service`
- 3× guardrails in chain
- `observability.audit`

**Key skill:** end-to-end transactional agentic design.

---

## 8. Checkpoint

**You know it if you can:**

- [ ] Draw from memory the flow of 09, 02, and 01 with labeled ports.
- [ ] Explain when to use linear RAG vs RAG-as-tool vs fan-out.
- [ ] Design a new `flow.json` that passes Validate in RAGorbit.
- [ ] Name 5 anti-patterns and their structural fix.
- [ ] Define what goes in deterministic CI vs nightly eval for a RAG system.
- [ ] Rebuild 09 in scratch in < 2 hours without looking at the solution.

---

## 12. Layer ③ explained: how to rebuild a template with a framework

> This section **closes the arc** of layers ③ from M1–M6. It does not re-explain each API from scratch — it links and shows how to **combine them** to rebuild an entire template.

### 12.1 Map of previous ③ layers

| Module | Section | What you learned | Template piece |
|--------|---------|----------------|-------------------|
| [M1](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch) | §11 | TextLoader, splitter, Chroma, retriever, LCEL | 09: RAG core |
| [M2](../02-ingesta/guia.md#10-layer--explained-chunking-with-langchain-from-scratch) | §10 | CharacterTextSplitter, metadata in Document | 09/02: chunking |
| [M3](../03-embeddings-y-stores/guia.md#15-layer--explained-from-in-memory-dict-to-chromadb-faiss-and-sentence-transformers) | §15 | Chroma, FAISS, sentence-transformers | 09: store |
| [M4](../04-retrieval-y-query/guia.md#13-layer--explained-langchain-retrievers-from-scratch) | §13 | BM25, hybrid, filters, rerankers | 02/01: hard-filters |
| [M5](../05-generacion-y-logic/guia.md#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch) | §10 | Structured output, RAGAS, citations | 02: JSON + eval |
| [M6](../06-agentes-i/guia.md#8-la-capa--explicada-langgraph-desde-cero-de-tu-bucle-react-al-grafo) | §8 | LangGraph, ReAct, tools, memory | 01: agent |

### 12.2 Block-by-block walkthrough: `solucion_framework.py` (template 09)

Open [`lab/solucion_framework.py`](lab/solucion_framework.py) and follow this map:

#### Block 1 — Loader (M1 §11.4, M2 §10)

```python
loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
raw_documents = loader.load()
```

Equivalent to `loader.pdf` when the document is already text. In production with real PDFs: `PyPDFLoader` or `UnstructuredPDFLoader` (M2).

#### Block 2 — Splitter (M2 §10)

```python
splitter = CharacterTextSplitter(separator="\n---\n", ...)
chunks = splitter.split_documents(raw_documents)
```

Equivalent to `ingest.chunker` with `strategy: by-section`. For `by-clause` (01, 05): `RecursiveCharacterTextSplitter` with legal separators.

#### Block 3 — Embeddings + Store (M1 §11.6–11.7, M3 §15)

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
vectorstore = Chroma.from_documents(documents=chunks, embedding=embeddings, collection_name="hr_policies")
```

Equivalent to `model.embedding` → `store.chroma`. For 02/01 in production: `PGVector` with `connection_string` (M3).

#### Block 4 — Retriever (M1 §11.8, M4 §13)

```python
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

Equivalent to `retrieval.vector` with `topK: 4`. For hard-filters (02):

```python
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 6, "filter": {"doc_type": "financial_data", "period": "2023"}}
)
```

#### Block 5 — Prompt + LLM (M1 §11.9)

```python
prompt = ChatPromptTemplate.from_messages([("system", SYSTEM), ("human", HUMAN)])
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
```

Equivalent to `model.llm` + `logic.prompt`.

#### Block 6 — LCEL chain (M1 §11.11)

```python
rag_chain = {"context": retriever | format_chunks, "question": RunnablePassthrough()} | prompt | llm | StrOutputParser()
```

This is the linear chain of 09 without an agent.

#### Block 7 — Citations enforce (M5 §4)

```python
def enforce_citations(response, docs): ...
```

In RAGorbit it is a separate `logic.citations` node. In LangChain you can implement it as a post-processor or as a node in LangGraph.

### 12.3 Extend to template 02 (banking)

On the 09 skeleton, add:

1. **Second loader** — `CSVLoader` for tabular data (M2).
2. **Metadata** — `doc.metadata["doc_type"] = ...` before indexing (M2).
3. **PGVector** — `PGVector.from_documents(...)` (M3).
4. **Structured output** — `llm.with_structured_output(CreditDecision)` (M5 §10).
5. **Rules** — pure Python function post-LLM (M5 §3):

```python
def apply_rules(decision: CreditDecision) -> CreditDecision:
    if decision.score >= 70:
        decision.decision = "approve"
    elif decision.score >= 40:
        decision.decision = "review"
    else:
        decision.decision = "reject"
    return decision
```

### 12.4 Extend to template 01 (airline)

On top of 02, replace the linear chain with an agent:

1. **PolicyRAG as tool** (M6 §4):

```python
@tool
def policy_rag(query: str, fare_class: str, route_type: str) -> str:
    docs = retriever.invoke(query, filter={"fare_class": fare_class, "route_type": route_type})
    return format_docs(docs)
```

2. **Service tools** — functions that call mock APIs (M6).

3. **LangGraph** (M6 §8) — `StateGraph` with `agent` and `tools` nodes, conditional edge `should_continue`.

4. **Guardrails** — wrappers before registering the tool with the agent (M9):

```python
payment_tool = with_resilience(with_confirm(with_idempotency(raw_payment_tool)))
```

5. **Audit** — callback or node that logs each tool call (M9).

### 12.5 Composition diagram

```
M1 (LCEL, Chroma) ──────┐
M2 (splitters, meta) ───┼──▶ Template 09 (linear RAG)
M3 (stores) ────────────┘
                        │
M4 (filters) ───────────┼──▶ Template 02 (+ structured + rules)
M5 (structured, eval) ──┘
                        │
M6 (LangGraph, tools) ──┼──▶ Template 01 (+ guardrails + audit)
M9 (production) ────────┘
```

### 12.6 When to use LangChain vs LangGraph vs LlamaIndex

| Framework | Best for | Example template |
|-----------|------------|------------------|
| LangChain LCEL | Linear RAG chains | 09 |
| LangGraph | Agents with cycle and state | 01, 03 |
| LlamaIndex | Query engines, complex indexes | 05 (alternative) |
| CrewAI / AutoGen | Collaborative multi-agent | 10 (M7) |

Full table: [`technologies-compared.md`](../referencia/tecnologias-comparadas.md).

---

⬅️ [Course plan](../PLAN.md) · [Lab](lab/enunciado.md) · [Exercises](ejercicios.md)

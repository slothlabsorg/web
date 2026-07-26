# M11 · Integrative exam — Architecture and Capstone

> **Instructions:** Answer all 50 questions without looking at `soluciones.md`. Types: (A) reasoned multiple choice, (P) predict the output, (B) find the bug, (E) choose the technology, (D) design.
>
> This exam covers M0–M11. Suggested time: 3–4 hours.

---

## Block 1 — Cross-cutting patterns (Exercises 1–10)

**Exercise 1 (A)** — Which best describes the **RAG-as-tool** pattern?

a) The retriever is always connected directly to `logic.prompt` in the graph  
b) A `tool.retriever` wraps the retriever so an `agent.react` invokes it on demand  
c) The LLM generates embeddings internally without a vector store  
d) RAG-as-tool only works with Chroma, not with pgvector

---

**Exercise 2 (A)** — **Hard-filters** in `retrieval.vector` are applied:

a) As an instruction in the LLM system prompt  
b) In the store query (SQL/metadata) before ranking by similarity  
c) After the LLM generates the response  
d) Only in batch mode, never in chat-service

---

**Exercise 3 (A)** — In template 02-banking, who has the final word on `decision`?

a) The LLM, because it emits the field in structured JSON  
b) `logic.rules`, which overrides according to deterministic score thresholds  
c) The credit officer manually on each run  
d) `logic.structured`, because it validates the schema

---

**Exercise 4 (E)** — A storm affects 50,000 shipments and each needs independent rebooking. Which architectural pattern is most appropriate?

a) Single conversational `agent.react`  
b) `agent.fanout` with `logic.rules` to classify simple vs complex  
c) Linear RAG pipeline with `logic.prompt`  
d) Fine-tuning the LLM with historical disruption cases

---

**Exercise 5 (A)** — `logic.citations` with `mode: enforce` goes **after** the LLM because:

a) The LLM needs to see citations before generating  
b) The post-processor verifies anchoring to chunks; the prompt is only a suggestion  
c) Citations consume fewer tokens at the end  
d) Chroma only exposes citations on the `Message` port

---

**Exercise 6 (D)** — Design in 3–5 lines a flow for: "Employee asks about vacation policies, always from the same manual". Agent or pipeline? Minimum nodes?

---

**Exercise 7 (A)** — **Agentic RAG** differs from linear RAG in that:

a) It does not use embeddings  
b) The agent decides when/what to retrieve and can combine tools with retrieval  
c) It always requires Kafka  
d) It eliminates the need for `logic.citations`

---

**Exercise 8 (P)** — A credit batch produces `{"score": 45, "decision": "approve"}` from the LLM. `logic.rules` defines: ≥70 approve, 40–69 review, <40 reject. What is the final `decision`?

a) `"approve"`  
b) `"review"`  
c) `"reject"`  
d) Error — the JSON is invalid

---

**Exercise 9 (A)** — In template 01-airline, the guardrail chain on PaymentService is:

a) confirm → idempotency → resilience  
b) idempotency → confirm → resilience  
c) resilience → confirm → idempotency  
d) Confirm only — idempotency goes in the prompt

---

**Exercise 10 (B)** — Find the anti-pattern:

> "We use `retrieval.vector` without hardFilters. In the agent system prompt we say: 'Only search rules for the passenger's Economy fare'."

What is the minimum structural fix?

---

## Block 2 — Read and design flow.json (Exercises 11–20)

**Exercise 11 (A)** — The field `deploymentTarget: batch` in `flow.json` typically implies:

a) Mandatory SSE streaming  
b) Entry node `io.batch` and output without streaming  
c) Exclusive use of `agent.react`  
d) RAG cannot be used

---

**Exercise 12 (P)** — You have an edge `sourcePort: "Chunks"` → `targetPort: "Message"`. Is it valid per the Flow IR contract?

a) Yes, always  
b) No — incompatible types; Chunks does not connect directly to Message  
c) Yes, if the target is `logic.prompt` which accepts both  
d) Only in deploymentTarget event-worker

---

**Exercise 13 (A)** — What does `secrets[]` store in flow.json?

a) API keys in plain text  
b) Only names of required environment variables  
c) Precomputed embeddings  
d) Chroma configuration

---

**Exercise 14 (D)** — Brief: "Side copilot for call center agent, <1.5s, three indexes (policy/procedure/faq)". List 5 nodes you would include and why.

---

**Exercise 15 (A)** — The edge with `loop: true` in template 01 connects:

a) `loader.pdf` → `ingest.chunker`  
b) `orchestrator:Message` → `orchestrator:Message` (ReAct cycle)  
c) `audit` → `io.output`  
d) `embedder` → `store`

---

**Exercise 16 (B)** — A designer connects `model.llm:Model` directly to `io.output:Any` without `logic.prompt` or agent. What is the main problem?

a) None — it is the most efficient pattern  
b) No synthesis with retrieved context; the flow is not complete RAG or agent  
c) The LLM cannot connect to the Any port  
d) `guardrail.confirm` is mandatory

---

**Exercise 17 (A)** — `store.multi-index` + `retrieval.router` mainly solve:

a) Lack of GPU for embeddings  
b) Noise from mixing document categories in a single index  
c) Kafka latency  
d) Incompatibility between Claude and OpenAI

---

**Exercise 18 (E)** — HR intranet prototype, 200 employees, no Postgres. Recommended store?

a) Pinecone serverless  
b) Local `store.chroma`  
c) Mandatory Neo4j GraphRAG  
d) BM25 only without vectors

---

**Exercise 19 (P)** — In the 09 flow.json, how many nodes have an incoming edge from `retriever`?

a) 1  
b) 2  
c) 3  
d) 4

---

**Exercise 20 (D)** — Draw in ASCII the offline ingestion pipeline of template 01 (fare policies) with ports.

---

## Block 3 — Anti-patterns and production (Exercises 21–30)

**Exercise 21 (A)** — Delegating the threshold "approve if score ≥ 70" to the LLM is an anti-pattern because:

a) LLMs cannot emit numbers  
b) The LLM is probabilistic; legal/business thresholds must be deterministic  
c) `logic.structured` does not support integers  
d) pgvector rejects scores > 100

---

**Exercise 22 (B)** — Code: the agent calls `PaymentService` directly without wrappers. Which guardrails are missing for parity with template 01?

---

**Exercise 23 (A)** — `hitl.escalate` must be structural (node in the graph) and not "decided by the LLM" because:

a) Humans cannot receive escalations  
b) The LLM may omit escalating in critical cases; HITL is compliance  
c) `hitl.escalate` is not a real node  
d) Kafka does not support HITL

---

**Exercise 24 (P)** — First charge: `chargeChangeFee(pnr="ABC", session="s1", amount=600)` → `captured`. Identical second charge within <24h → what do you expect with `guardrail.idempotency`?

a) Second `captured` and double charge  
b) `deduplicated` without a second call to the service  
c) Error 500  
d) The agent asks for confirmation again

---

**Exercise 25 (A)** — `observability.audit` with `sink: kafka` in 01 serves to:

a) Train the embedding model  
b) Regulatory traceability of tool calls and decisions  
c) Replace `logic.citations`  
d) Cache LLM responses

---

**Exercise 26 (E)** — Observability of an agent in production: which combination is most complete?

a) Print statements only  
b) LangSmith or Langfuse + OpenTelemetry + audit bus  
c) Manual weekly Excel  
d) Thumbs up/down without storage

---

**Exercise 27 (B)** — "We use a single `store.pgvector` for contract + playbook + regulations + precedents without router." What symptom will you see in production?

---

**Exercise 28 (A)** — `guardrail.confirm` with `threshold: amount > 500` acts:

a) After successful charge  
b) Before executing PaymentService, pausing for user confirmation  
c) Only in the system prompt  
d) Only in deploymentTarget batch

---

**Exercise 29 (D)** — Brief with PHI that cannot leave the VPC. Three mandatory architecture decisions?

---

**Exercise 30 (A)** — Using `agent.react` for 50,000 parallel rebookings is an anti-pattern because:

a) ReAct does not support tools  
b) Multi-turn conversation does not scale in volume/cost vs stateless fan-out  
c) Kafka does not work with agents  
d) It cannot be audited

---

## Block 4 — Rebuilding templates 09/02/01 (Exercises 31–40)

**Exercise 31 (A)** — Correct reconstruction order in the capstone:

a) 01 → 02 → 09  
b) 09 → 02 → 01  
c) 02 → 09 → 01  
d) Any order

---

**Exercise 32 (P)** — Vacation/3 years query on `hr_policies.txt` with bag-of-words (M11 scratch). Expected top-4 indices (0-based):

a) 0, 1, 2, 3  
b) 1, 0, 7, 3  
c) 0, 0, 0, 0  
d) 7, 6, 5, 4

---

**Exercise 33 (A)** — Template 09 uses `store.chroma` instead of pgvector mainly because:

a) Chroma is more accurate  
b) Prototype without external DB server — zero friction  
c) pgvector does not support embeddings  
d) Regulation mandates Chroma for HR

---

**Exercise 34 (B)** — In your 02 scratch, the retriever returns chunks from file `applicant_002` when processing `applicant_001`. Where is the bug?

---

**Exercise 35 (A)** — `requireCitations: true` in `logic.structured` of 02 requires:

a) That the LLM cite only in the `justification` field  
b) That each factor is anchored to retrieved fragments from the file  
c) APA citations at the end of the JSON  
d) Removing the `score` field

---

**Exercise 36 (P)** — File `applicant_001`: income $85k, debt $12k, payments 97%, tenure 6 years. LLM score: 72. `decision` after `logic.rules`?

a) `"reject"`  
b) `"review"`  
c) `"approve"`  
d) `"pending"`

---

**Exercise 37 (A)** — In 01, PolicyRAG must filter by `fare_class` and `route_type` because:

a) It improves chat latency  
b) It avoids applying penalties from another fare/route by semantic similarity  
c) Kafka requires it  
d) The PNR does not contain fare_class

---

**Exercise 38 (D)** — List the mandatory tool sequence from the 01 agent system prompt (business flow order).

---

**Exercise 39 (A)** — `ingest.chunker` with `by-clause` on fare policies (01) serves to:

a) Reduce API cost  
b) Citable chunks at legal/fare clause level  
c) Eliminate metadata  
d) Avoid using embeddings

---

**Exercise 40 (B)** — Your 01 agent charges without asking for confirmation with amount $650. Which node/guardrail failed or is not wired?

---

## Block 5 — System testing and eval (Exercises 41–45)

**Exercise 41 (A)** — What typically goes in CI on every commit vs nightly?

a) Everything with real LLM on every push  
b) CI: deterministic tests (rules, filters, guardrails); nightly: RAGAS eval with LLM  
c) RAGAS eval only in CI  
d) Never test AI systems

---

**Exercise 42 (P)** — `test_rules.py`: `assert apply_rules(score=69) == "review"`. Which component of template 02 does it validate?

a) `model.embedding`  
b) `logic.rules`  
c) `logic.prompt`  
d) `io.batch`

---

**Exercise 43 (A)** — Faithfulness in RAGAS measures:

a) Retriever speed  
b) Whether the response is grounded in retrieved context  
c) Cost per token  
d) Number of nodes in the graph

---

**Exercise 44 (D)** — Define 3 test cases for the HR bot (09): query, expected property, metric or assert.

---

**Exercise 45 (E)** — Eval framework for prompt regression in CI with version comparison:

a) pytest only without LLM  
b) promptfoo or RAGAS with versioned dataset  
c) Git diff of flow.json only  
d) Manual A/B without automation

---

## Block 6 — Other templates and global architecture (Exercises 46–50)

**Exercise 46 (A)** — Template 06-retail does **not** use inline RAG because:

a) Retail prohibits LLMs  
b) The case is transactional (orders/refunds) solved with tools + guardrails  
c) There are no documents  
d) Chroma does not work in e-commerce

---

**Exercise 47 (A)** — Template 07-telecom uses `io.panel` instead of `io.output` directly to the customer because:

a) The copilot assists the human agent in a side panel without interrupting the call  
b) The customer has no screen  
c) Kafka requires panel  
d) STT only works with panel

---

**Exercise 48 (E)** — Exporting PolicyRAG from 01 as an MCP server (M8) benefits:

a) Diagram aesthetics only  
b) Cross-app reuse with standard permission model  
c) Eliminating the vector store  
d) Avoiding guardrails

---

**Exercise 49 (D)** — One-paragraph comparison: when would you choose LangGraph multi-agent vs CrewAI for template 10?

---

**Exercise 50 (D)** — Capstone closing question: "Explain why the expert criterion requires rebuilding 09→02→01 and not just using RAGorbit visually." Answer in 5–8 lines.

---

**End of exam — 50 questions**

⬅️ [Guide](guia.md) · Answers in `soluciones.md` (only after attempting all)

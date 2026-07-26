# M1 · Solutions — LLM and RAG Fundamentals

> **Reasoned answers** for all exercises in `ejercicios.md`. Read the reasoning, not just the correct letter.

---

## Block 1 — LLMs, tokens, and context window

**Exercise 1 → b) Use RAG**

**Reason:** 200,000 words in Spanish × ~2 tokens/word ≈ 400,000 tokens — double the 128,000 limit. Option (a) confuses output `max_tokens` with the context window: they are different things. Option (c) splits the information arbitrarily and the model does not see the full document in each call, losing context between sections. Option (d) is a design error: even with 1M tokens, stuffing the entire document is expensive and causes the "lost in the middle problem". RAG retrieves only the 4–5 most relevant fragments — the only ones the model needs to answer the specific question.

---

**Exercise 2 → b) ~30 tokens**

**Reason:** The text has 32 words in Spanish. Using the rule of 1.5–2 tokens/word in Spanish: 32 × ~1.7 ≈ 54 tokens... but the closest option is (c) ~55. However, the rule is _approximate_: the text has short words (the, to, of, in, 2) that are often 1 token, and words like "increasing" that can be 3–4 tokens. A more careful count: ~40–50 tokens. The correct answer is (c) ~55 tokens — it is the estimate closest to reality.

> **Note:** if you chose (b) ~30, your estimate assumed 1 token per word on average, which is closer to English. In Spanish the more precise answer is (c).

---

**Exercise 3 → b) The LLM generates the next token based on probabilities**

**Reason:** This is the technically correct description of how an LLM works. Option (a) is false: there is no internal database — "knowledge" is implicit in the network weights. Option (c) is false: without explicit memory or an external tool, each session starts from zero. Option (d) is false: large models are better _on average_, but in very specific domains a small fine-tuned model can outperform a large generic one.

---

**Exercise 4 → b) The model has difficulty using information in the middle of a long context**

**Reason:** Studies like "Lost in the Middle" (Liu et al., 2023) showed that LLMs tend to use information at the start and end of the context better. Information in the middle of the prompt tends to be ignored even when present. This is relevant for RAG: do not put 50 chunks in the prompt expecting the model to use all of them — use a low topK (3–5) and only the most relevant ones.

---

## Block 2 — Temperature and prompting

**Exercise 5 → b) Identical or nearly identical responses**

**Reason:** Temperature 0 concentrates all probability on the most likely token at each step. The process is deterministic (given the same input, the same token is most likely). In practice, some inference systems have small floating-point differences that can produce marginal variations, but for all practical purposes the response is the same. Temperature 0 is very useful for regression tests: you want to confirm that the model always gives the same response to the same question.

---

**Exercise 6 → Missing system message and retrieved chunks**

**Reason and fix:** The current prompt only passes the question. For an HR assistant that does not hallucinate you need:

1. **A system message** instructing the model to rely ONLY on the documents.
2. **The retrieved chunks** as context.
3. Optionally: an instruction to say "I don't know" if there is no relevant information.

```python
SYSTEM = """You are the official HR assistant.
Answer ONLY based on the policy fragments provided.
If the information is not in the fragments, explicitly say you don't have that information."""

TEMPLATE = """Employee question: {question}

Relevant policy fragments:
{chunks}

Answer in markdown with clear and simple language."""

messages = [
    {"role": "system", "content": SYSTEM},
    {"role": "user", "content": TEMPLATE.format(question=question, chunks=chunks_text)}
]
response = llm.invoke(messages)
```

Without the system message and without the chunks, the model invents the answer using its general knowledge — exactly the problem RAG solves.

---

**Exercise 7 → c) For questions that require multiple reasoning steps**

**Reason:** CoT shines when reasoning needs to be made explicit: calculating whether an employee is entitled to a benefit requires verifying conditions (seniority, contract type, start date) and combining them. For a simple lookup ("how many days does the company give?"), CoT is unnecessary overhead — the answer is directly in the context. Option (d) is false: CoT works well even in 7B parameter models for appropriate tasks.

---

**Exercise 8 → Example solution**

```
[system]
Classify the HR question into one of these categories:
vacation, payroll, benefits, onboarding, other.
Answer ONLY with the category, no explanation.

Question: When can I take my accumulated vacation days?
Category: vacation

Question: How do I see my payslip on the portal?
Category: payroll

Question: Can I enroll my children in the company's health insurance?
Category: benefits

Question: Starting from which month do I begin contributing to social security?
Category:
```

**Expected answer:** `onboarding` (it is a question about the onboarding process, specifically about legal benefits that apply from day one).

**Why these examples:** the three examples cover the three most common categories so the model understands the pattern. The target question is about an onboarding process (social security enrollment), not directly about vacation or payroll.

---

## Block 3 — RAG: why and how

**Exercise 9 → b) Hallucination**

**Reason:** Hallucination is when the model generates false information with confidence. It is not a programming bug — it is a structural characteristic of LLMs: they generate plausible text based on statistical patterns, without verifying against a source of truth. The model "knows" that employee handbooks have vacation policies, so it generates a plausible number. RAG solves this by forcing the model to respond ONLY with text retrieved from real documents.

---

**Exercise 10 → c) Receive question → Retrieve → Augment prompt → Generate**

**Reason:** This is the correct order of the RAG pattern in the online phase. First you need the question to know what to retrieve. Then you retrieve the relevant chunks. Then you build the augmented prompt (question + chunks). Finally the LLM generates the response using that context. You cannot augment the prompt before retrieving, nor generate before having the context.

---

**Exercise 11 → b) The 4 fragments with the highest similarity to the question are retrieved**

**Reason:** `topK` is the parameter that controls how many chunks are retrieved from the vector index. The `retrieval.vector` node computes cosine similarity between the question embedding and all index embeddings, and returns the K closest ones. They are not the first 4 in the document (that would be position-based retrieval, not relevance) nor a limit on total documents.

---

**Exercise 12 → Offline phase of template 09**

```
1. loader.pdf (node "HR Docs")
   Input: PDF files in data/hr_docs/
   Output: Documents (list of documents with text and metadata)

2. ingest.chunker (node "Section Chunker")
   Input: Documents
   Output: Documents (smaller fragments, ~800 tokens each, strategy: by-section)

3. model.embedding (node "Embedding Model") + store.chroma (node "Chroma hr_policies")
   The chunker feeds store.chroma with Documents.
   model.embedding feeds store.chroma with Embeddings (vectors for each chunk).
   store.chroma indexes and persists the (chunk, vector) pairs in the hr_policies collection.
   Output: Retriever (search interface ready for the online phase)
```

**Important note:** `model.embedding` and `store.chroma` run in parallel as inputs to the store — the store receives both documents and vectors and stores them together. This is exactly how it is wired in the template's `flow.json`.

---

## Block 4 — Embeddings and similarity

**Exercise 13 → Pair (A, B) is more similar**

**Calculation:**

```
A = [0.9, 0.1, 0.0]    ||A|| = sqrt(0.81 + 0.01 + 0) = sqrt(0.82) ≈ 0.906
B = [0.8, 0.2, 0.1]    ||B|| = sqrt(0.64 + 0.04 + 0.01) = sqrt(0.69) ≈ 0.831
C = [0.0, 0.1, 0.9]    ||C|| = sqrt(0 + 0.01 + 0.81) = sqrt(0.82) ≈ 0.906

sim(A, B) = (0.9×0.8 + 0.1×0.2 + 0.0×0.1) / (0.906 × 0.831)
           = (0.72 + 0.02 + 0) / 0.753
           = 0.74 / 0.753 ≈ 0.983  ← VERY high similarity

sim(A, C) = (0.9×0.0 + 0.1×0.1 + 0.0×0.9) / (0.906 × 0.906)
           = (0 + 0.01 + 0) / 0.821
           = 0.01 / 0.821 ≈ 0.012  ← almost zero similarity
```

**Interpretation:** Texts A and B are about labor topics (vacation, rest) → high similarity (0.983). A and C are from completely different domains (HR vs energy) → similarity ~0. This shows why RAG works: an employee's question about vacation will have high similarity with vacation policy chunks, and low similarity with chunks on other topics.

---

**Exercise 14 → b) `model.llm` generates responses; `model.embedding` converts text into vectors**

**Reason:** They are distinct models, with distinct architectures, for distinct purposes. The embedding model (e.g. `text-embedding-3-large`) takes text and returns a vector of 1536 or 3072 numbers. The LLM takes a prompt and generates text tokens. In template 09, `model.embedding` is used in the offline phase (index chunks) and in the online phase (embed the question before searching). `model.llm` is only used in the online phase to generate the final response. Option (d) has the roles reversed.

---

## Block 5 — Model selection and RAG vs fine-tuning

**Exercise 15 → Strategy by case**

**a) Chatbot with updatable internal regulations → RAG**

The regulations are proprietary documents (not in the model's pretraining). They are updated annually → RAG allows easy updates: re-index the new document and the model automatically uses the updated version. Fine-tuning for annual updates would be costly and unnecessary.

**b) Formal style with specific internal terminology → Fine-tuning (or RAG + fine-tuning)**

You have 10,000 documents with the correct style — enough data for fine-tuning. The "knowledge" here is procedural (how to write) rather than documentary (what a contract says). Fine-tuning teaches the model to adopt the style. If you also need it to cite specific contracts, combine fine-tuning + RAG.

**c) Help with standard Python code → Pure prompting**

Standard Python is a public domain widely covered in any modern model's pretraining. You have no proprietary documents. The model already knows Python. Pure prompting (zero-shot or with examples of the type of code you want) is sufficient.

---

**Exercise 16 → b) When data is confidential or no network is available**

**Reason:** Local open-weights models are the only option when data cannot leave the server (regulatory privacy, medical data, sensitive financial data) or when there is no connectivity (edge computing, isolated environments). Option (a) is false: cloud models (Claude, GPT-4o) remain superior in general quality. Option (c) confuses hardware with license. Option (d) is false: Llama 3.1 70B with Ollama can do RAG perfectly well.

---

**Exercise 17 → b) Haiku — the 0.03 difference rarely justifies the cost**

**Reason:** With 50,000 daily questions, the cost difference between Opus and Haiku can be 10x or more. A 0.03 faithfulness difference (0.94 vs 0.91) means that out of every 100 questions, 3 more may have some issue with Haiku. The right approach is: deploy Haiku, monitor faithfulness in production with a real sample, and only scale to Sonnet or Opus if production metrics indicate serious problems. Option (c) could be valid long-term but requires data and time. Option (a) is extreme without sufficient evidence.

---

**Exercise 18 → Additional nodes needed**

For the assistant to **book** vacation days in Workday, you need to convert it from pure RAG to an **agent with tools**:

```
Additional nodes:

1. agent.react (replaces or wraps logic.prompt)
   - Connects to: model.llm, tool.service (Workday), tool.retriever (existing RAG as a tool)
   - The agent decides when to search policies and when to act in Workday

2. tool.retriever (wraps existing retrieval.vector as an agent tool)
   - name: "search_hr_policy"
   - description: "Searches the company's HR policies"

3. tool.service → Workday API
   - name: "request_vacation"
   - baseUrl: "https://api.workday.com/..."
   - operation: "create_vacation_request"
   - inputSchema: {employee_id, start_date, end_date, days}
   - Secret: WORKDAY_API_KEY

4. guardrail.confirm (optional but recommended)
   - Wraps tool.service
   - Asks for confirmation before creating the request

5. guardrail.idempotency (recommended for transactional actions)
   - keyFields: [employee_id, start_date, end_date]
   - Prevents creating two identical requests if the user clicks twice
```

**Reference:** this pattern (RAG as a tool inside an agent) is covered in M6 with the `01-airline-flight-change` template. The template 09 README also mentions it in the "How to scale" section.

---

## Block 6 — LangChain and layer ③

**Exercise 19 → c) `list[Document]`

**Reason:** `as_retriever()` converts the vector store into a `Retriever` object whose standard interface is `.invoke(query) → list[Document]`. Each `Document` has `page_content` (chunk text) and `metadata` (e.g. `source`). It does not return a concatenated string — your `format_chunks` function does that in the chain. It does not return an embedding (Chroma does that internally via `embeddings.embed_query`). It does not return the dict `{"context", "question"}` — that dict is **built** by the LCEL chain in the `RunnableParallel` step (the dict with two branches) before passing to `ChatPromptTemplate`.

**Mental check:** in `solucion_framework.py`, `retrieved_chunks = retriever.invoke(query)` and then you iterate `for doc in retrieved_chunks: doc.page_content` — that only makes sense if they are `Document`.

---

**Exercise 20 → 1→C, 2→A, 3→B, 4→D**

**Reason (bridge table §11.2):**

| Function | LangChain | Why |
|---------|-----------|---------|
| `load_chunks()` | **C** — `TextLoader` + `CharacterTextSplitter` | Reads the file and splits by `\n---\n` into `list[Document]`. |
| `embed()` | **A** — `OpenAIEmbeddings` | Converts text into a vector; implements the `Embeddings` interface. |
| `retrieve()` | **B** — `vectorstore.as_retriever(...)` | Searches top-k by similarity and returns the closest documents. |
| `build_prompt()` | **D** — `ChatPromptTemplate.from_messages(...)` | Template with variables filled with context and question. |

Confusing `embed()` with the retriever is common: the retriever **uses** embeddings internally, but the scratch function that does search and ranking is `retrieve()`, not `embed()`.

---

**Exercise 21 → Two bugs**

**Bug 1 — Inconsistent variable name:** the dict uses the key `"ctx"` but the prompt template expects `{context}`. When invoking the chain, `ChatPromptTemplate` cannot find the variable `context` → `KeyError` or empty variable.

**Fix:**

```python
{
    "context": retriever | format_chunks,  # not "ctx"
    "question": RunnablePassthrough(),
}
```

**Bug 2 — Missing `StrOutputParser()` at the end:** without it, `chain.invoke(query)` returns an **`AIMessage`** (rich provider object), not a `str`. If you `print(response)` expecting plain text, you will see the object representation or have to access `.content` manually.

**Fix:**

```python
chain = (
    {"context": retriever | format_chunks, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

**Rule:** names in the parallel step dict must match **exactly** the `{...}` variables in the template (§11.10). And in pipelines that end in a user response, `StrOutputParser()` is the standard (§11.11).

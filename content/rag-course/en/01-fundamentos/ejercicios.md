# M1 · Exercises — LLM and RAG Fundamentals

> **Instructions:** solve each exercise without looking at the solutions. Reasoned answers are in `soluciones.md`. Types: (A) reasoned multiple choice, (P) predict the output, (B) find the bug, (E) choose the technology, (D) design.

---

## Block 1 — LLMs, tokens, and context window

**Exercise 1 (A)** — A model has a context window of 128,000 tokens. You want to pass it a 400-page employee handbook (≈ 200,000 words in Spanish). What is the best strategy?

a) Increase output `max_tokens` to 200,000  
b) Use RAG: index the handbook and retrieve only the relevant fragments  
c) Split the handbook into two calls of 100,000 words each  
d) Use a model with a 1 million token window — always the best option

---

**Exercise 2 (P)** — Predict the approximate token count of the following text in Spanish using the module's rule of thumb:

```
"La empresa otorga a sus empleados 15 días hábiles de vacaciones por año calendario,
incrementándose en 2 días cada 5 años de antigüedad."
```

a) ~10 tokens  
b) ~30 tokens  
c) ~55 tokens  
d) ~100 tokens

---

**Exercise 3 (A)** — Which of these statements about LLMs is CORRECT?

a) The LLM searches an internal database when answering questions  
b) The LLM generates the next token based on probabilities learned during pretraining  
c) The LLM remembers previous conversations across sessions  
d) Increasing the number of parameters always improves quality in all domains

---

**Exercise 4 (A)** — The "lost in the middle problem" occurs when:

a) The model loses the thread in very long conversations due to response time  
b) The model has difficulty using information located in the middle of a very long context  
c) RAG retrieves the wrong chunk because it is in the middle of the index  
d) High temperature causes the model to lose coherence in long responses

---

## Block 2 — Temperature and prompting

**Exercise 5 (P)** — With `temperature = 0.0`, you run the exact same prompt three times. What do you expect?

a) Three completely different responses due to the model's natural randomness  
b) Identical or nearly identical (deterministic) responses  
c) An empty response because temperature 0 disables generation  
d) The same response only if the model is small; large models remain random

---

**Exercise 6 (B)** — Find the bug in this prompt for the HR assistant:

```python
prompt = f"""
Responde esta pregunta: {pregunta}
"""
response = llm.invoke(prompt)
```

Describe what is missing and how you would fix it.

---

**Exercise 7 (A)** — When is Chain-of-Thought (CoT) MOST useful?

a) For simple lookup questions: "How many vacation days does the company give?"  
b) For creative generation tasks where there is no "correct" answer  
c) For questions that require multiple reasoning steps: calculating eligibility, comparing conditions  
d) Only in models with more than 70B parameters — it does not work in small models

---

**Exercise 8 (D)** — Write a few-shot prompt with 3 examples to classify HR questions into: `vacaciones`, `nómina`, `beneficios`, `onboarding`, `otro`. The question to classify is: "¿A partir de qué mes empiezo a cotizar al IMSS?"

---

## Block 3 — RAG: why and how

**Exercise 9 (A)** — An LLM responds with total confidence: "La empresa Acme otorga 30 días de vacaciones el primer año según su Manual del Empleado versión 2023." When you verify the real handbook, the figure is 15 days. This phenomenon is called:

a) Model overfitting  
b) Hallucination  
c) High temperature  
d) Context window overflow

---

**Exercise 10 (A)** — What is the CORRECT order of steps in the minimal RAG pattern during the inference phase?

a) Retrieve → Generate → Augment prompt → Receive question  
b) Receive question → Augment prompt → Retrieve → Generate  
c) Receive question → Retrieve → Augment prompt → Generate  
d) Generate → Retrieve → Receive question → Augment prompt

---

**Exercise 11 (A)** — In the `09-hr-policy-assistant` template, the `topK: 4` parameter in the `retrieval.vector` node means:

a) The model can only process 4 documents in total  
b) The 4 fragments with the highest similarity to the question are retrieved  
c) The first 4 chunks of the indexed document are used  
d) The response will have at most 4 sentences

---

**Exercise 12 (D)** — Describe the **offline phase** of the `09-hr-policy-assistant` template in terms of the RAGorbit nodes involved and the correct order. What does each node produce?

---

## Block 4 — Embeddings and similarity

**Exercise 13 (P)** — You have three texts and their embeddings (simplified to 3 dimensions):

```
A: "días de vacaciones anuales"    → [0.9, 0.1, 0.0]
B: "política de descanso laboral"  → [0.8, 0.2, 0.1]
C: "precio del barril de petróleo" → [0.0, 0.1, 0.9]
```

Using cosine similarity, which pair is more similar: (A, B) or (A, C)? Show the approximate calculation.

---

**Exercise 14 (A)** — What is the difference between the `model.llm` node and the `model.embedding` node in RAGorbit?

a) They are the same node with different names; both generate text  
b) `model.llm` generates text responses; `model.embedding` converts text into numeric vectors  
c) `model.embedding` is more expensive than `model.llm` for all providers  
d) `model.llm` is used in the offline phase and `model.embedding` in the online phase

---

## Block 5 — Model selection and RAG vs fine-tuning

**Exercise 15 (E)** — For each use case, choose the best strategy (RAG, fine-tuning, pure prompting) and briefly justify:

a) A chatbot that answers questions about a company's internal regulations with 200 employees. The regulations are updated annually.

b) A model that must always generate in the formal style and with the specific internal terminology of a law firm (10,000 documents with the correct style available).

c) An assistant that helps programmers write standard Python code (no internal libraries).

---

**Exercise 16 (A)** — When is it MOST appropriate to use a **local open-weights model** (Llama, Mistral via Ollama) instead of a cloud API?

a) Always — local models are always superior in quality  
b) When data is confidential and cannot leave the server, or when no network is available  
c) Only when the budget is unlimited for buying hardware  
d) Exclusively for simple classification tasks; local models are not useful for RAG

---

**Exercise 17 (A)** — A startup wants to deploy an HR assistant with 50,000 daily questions and tight margins. The team evaluated Claude Opus 4.8 (high quality, high cost) and Claude Haiku 4.5 (good quality, low cost). Evaluation metrics on their own dataset show: Opus faithfulness=0.94, Haiku faithfulness=0.91. What would you recommend?

a) Opus always — the 0.03 faithfulness difference could cost jobs  
b) Haiku — the 0.03 faithfulness difference rarely justifies the additional cost at this volume; monitor it in production  
c) Fine-tune Haiku to reach Opus-level without Opus cost  
d) Gemini Flash — always better than both for high-volume cases

---

**Exercise 18 (D)** — The HR team wants the template 09 assistant to **also be able to book vacation days** in the HR system (Workday). Describe what additional nodes you would need to add to `flow.json` and why. You do not need to write the full JSON — describe the node types and how to connect them to the existing flow.

---

## Block 6 — LangChain and layer ③

> These exercises verify that you understand §11 of the guide *before* writing `solucion_framework.py`. If you fail several, review [§11 — Layer ③ explained: LangChain from scratch](guia.md#11-layer--explained-langchain-from-scratch).

**Exercise 19 (P)** — You have this code:

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)
resultado = retriever.invoke("¿Cuántos días de vacaciones si llevo 3 años?")
```

What type of value is `resultado`?

a) `str` — the concatenated text of the 3 chunks  
b) `list[float]` — the question's embedding  
c) `list[Document]` — three objects with `.page_content` and `.metadata`  
d) `dict` with keys `"contexto"` and `"pregunta"`

---

**Exercise 20 (A)** — Match each function from `solucion_scratch.py` with the correct LangChain abstraction:

| Scratch function | Which LangChain piece? |
|-----------------|------------------------------|
| 1. `cargar_chunks()` | A. `OpenAIEmbeddings` |
| 2. `embed()` | B. `vectorstore.as_retriever(...)` |
| 3. `recuperar()` | C. `TextLoader` + `CharacterTextSplitter` |
| 4. `construir_prompt()` | D. `ChatPromptTemplate.from_messages(...)` |

Write the correct matching (1→?, 2→?, 3→?, 4→?).

---

**Exercise 21 (B)** — Find the bug in this LCEL chain (there are **two** errors). Explain what would fail and how you would fix it:

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "Responde solo con el contexto."),
    ("human", "Contexto:\n{contexto}\n\nPregunta: {pregunta}"),
])

chain = (
    {
        "context": retriever | formatear_chunks,
        "pregunta": RunnablePassthrough(),
    }
    | prompt
    | llm
)
# respuesta = chain.invoke(query)
```

---

> **Next:** `soluciones.md` — reasoned answers for all exercises. Do not open it until you have attempted each exercise on your own.

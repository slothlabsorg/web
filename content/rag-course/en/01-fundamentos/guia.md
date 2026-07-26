# M1 · LLM and RAG Fundamentals

> **Module 1 — Week 1.** Master the concepts that underpin everything else: what an LLM does internally, how you talk to it, why RAG exists, how the minimal pattern works, and how to choose the right model. By the end of this guide you will be able to complete the lab without help.
>
> **RAGorbit node:** `model.llm`, `model.embedding` (category `model`). **Reference template:** [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/).

---

## Table of contents

1. [What is an LLM? Tokens and context window](#1-what-is-an-llm-tokens-and-context-window)
2. [Temperature and other inference hyperparameters](#2-temperature-and-other-inference-hyperparameters)
3. [Prompting: system, user, few-shot, CoT](#3-prompting-system-user-few-shot-cot)
4. [Why RAG: hallucination, private data, fresh data](#4-why-rag-hallucination-private-data-fresh-data)
5. [The minimal RAG pattern](#5-the-minimal-rag-pattern)
6. [Embeddings: geometric intuition and cosine similarity](#6-embeddings-geometric-intuition-and-cosine-similarity)
7. [Model selection and evaluation](#7-model-selection-and-evaluation)
8. [Comparison: Claude vs OpenAI vs Gemini vs Llama/Mistral](#8-comparison-claude-vs-openai-vs-gemini-vs-llamamistral)
9. [RAG vs fine-tuning vs pure prompting: when to use each](#9-rag-vs-fine-tuning-vs-pure-prompting-when-to-use-each)
10. [Layer ③ explained: LangChain from scratch](#11-layer--explained-langchain-from-scratch)
11. [Checkpoint](#12-checkpoint)

---

## 1. What is an LLM? Tokens and context window

### 1.1 The core idea

A **Large Language Model (LLM)** is a neural network trained to predict the next *token* given a prefix of tokens. During training it read a significant fraction of text published on the internet, books, and code — which gives it the illusion of "knowing" many things. At inference time (when you use it), it remembers nothing between calls: each call starts from zero.

The key is that the model **does not search a database** nor run any SQL query. It generates text token by token using probabilities learned from the language distribution. That has important consequences you will see in §4.

### 1.2 What is a token?

A token is not a word. It is a **unit of text** determined by the model's tokenizer (typically BPE — Byte Pair Encoding or similar variants). As a rule of thumb:

- 1 English word ≈ 1–2 tokens
- 1 Spanish word ≈ 1.3–2.5 tokens (richer morphology = more tokens)
- 1 exotic Unicode character can be 3–5 tokens
- 100 tokens ≈ 75 English words

**Why it matters:** models have a maximum token limit per call (the "context window"). If you exceed it, the model cannot process the input.

```
Text:     "Employees are entitled to 15 days of annual vacation."
Tokens:   ["Employees", " are", " entitled", " to", " 15", " days", " of", " annual", " vacation", "."]
Count:    10 tokens (approximate — depends on the tokenizer)
```

### 1.3 Context window

The **context window** is the maximum number of tokens the model can "see" at once, including the system prompt, conversation history, retrieved documents, and generated response.

| Model | Approx. window (2025) |
|--------|----------------------|
| Claude Opus 4.8 | 200,000 tokens |
| GPT-4o | 128,000 tokens |
| Gemini 1.5 Pro | 1,000,000 tokens |
| Llama 3.1 70B | 128,000 tokens |
| Mistral Large | 128,000 tokens |

**When does size matter?** When you have long documents (contracts, technical manuals) and want to pass the entire document to the model — this is called "long-context RAG" or even "context stuffing". A large window is convenient but not free: more tokens = more latency and more cost.

**When NOT to use huge windows:** if the document has 1,000 pages, even 1M tokens is not enough, and the model can lose the thread in the middle ("lost in the middle problem"). RAG solves that by retrieving only the relevant fragments (§5).

### 1.4 Model parameters

LLMs have billions of parameters (network weights). Size matters but is not everything:

- **Large models** (70B+): stronger reasoning, higher cost, higher latency.
- **Small models** (7B–13B): fast and cheap, good for classifiable tasks.
- **Distilled models** (Haiku 4.5, GPT-4o-mini, Gemma 2B): quality/cost balance for high-volume production.

> **RAGorbit connection:** the `model.llm` node has a `model` field that accepts any `provider:model-name` string. The default is `anthropic:claude-opus-4-8`. Change that field and you change the model — without touching the rest of the flow. See [`docs/02-node-catalog.md` §model](../../docs/02-node-catalog.md).

---

## 2. Temperature and other inference hyperparameters

### 2.1 Temperature

**Temperature** controls how "creative" or "deterministic" the model's response is. Technically, it is a divisor of the logit before softmax: low temperature concentrates probability on the most likely tokens; high temperature spreads it out.

```
temperature 0.0 → nearly deterministic response (same input, same output)
temperature 0.2 → very consistent responses, with little variation
temperature 0.7 → varied responses, more "creative"
temperature 1.0 → unmodified distribution
temperature > 1.0 → chaotic, incoherent responses
```

**Practical rule for RAG:** use low temperature (0.0–0.2) when you need factual responses based on documents. Use higher temperature only when you want variety (e.g. generating wording options).

In the HR template (`09-hr-policy-assistant/flow.json`), the `model.llm` node has `"temperature": 0.2`. The assistant must be precise, not creative.

### 2.2 Top-p and Top-k

- **Top-p** (nucleus sampling): only considers tokens whose cumulative probability reaches `p`. `top_p=0.9` = take the tokens that represent 90% of total probability.
- **Top-k**: only considers the `k` most likely tokens at each step.

For factual RAG: `top_p=0.9` or less. Most APIs expose it but the default is reasonable — you rarely need to touch it.

### 2.3 Max output tokens

Distinct from the context window: it is the limit you set on the generated response. Useful for controlling cost and avoiding infinite responses. For an HR assistant, 512–1024 output tokens is usually enough.

---

## 3. Prompting: system, user, few-shot, CoT

**Prompting** is how you give instructions to the model. It is not magic — it is text engineering.

### 3.1 Chat format: system and user roles

Modern chat LLMs use a message format with roles:

```
[system]  You are the official HR assistant. Respond based ONLY on the documents.
[user]    How many vacation days do I get in the first year?
[assistant]  (model response)
```

- **system:** persistent instructions that define model behavior. Sent once at the start. The model "remembers" it for the whole conversation (while it stays in the window).
- **user:** the human's message.
- **assistant:** the response the model generated (in multi-turn conversations, history is passed back).

**When to use system vs user:** put in `system` what does NOT change (personality, constraints, response format). Put in `user` what does change (the question, dynamic context like retrieved chunks).

In template 09, the `logic.prompt` node uses:
- `system`: HR assistant instructions
- `template`: a template with `{message}` and `{chunks}` filled dynamically

### 3.2 Few-shot prompting (In-Context Learning)

**In-context learning** is the LLM's ability to learn a task simply by seeing examples in the prompt — without retraining. This works because the model saw millions of "input→output" pairs during pretraining and can "imitate" the pattern.

**Few-shot** = give a few examples (2–5 typically):

```
[system] Classify whether the following question is about vacation, benefits, or payroll.

Question: When do I get my year-end bonus?
Category: payroll

Question: Can I request days off for a family member's illness?
Category: vacation

Question: How do I add my spouse to the health insurance?
Category: benefits

Question: {new_question}
Category:
```

**Zero-shot** = no examples. Works well with large models and common tasks. **One-shot** = a single example.

**When to use few-shot:**
- The task has a specific output format the model does not produce well without examples.
- The model makes errors with zero-shot (evaluate with zero-shot first, then add examples only if needed).
- Do not overuse: each example consumes context window tokens.

### 3.3 Chain-of-Thought (CoT)

**Chain-of-Thought** tells the model to "think out loud" before answering. It significantly improves reasoning on questions that require multiple steps.

```
Version without CoT:
[user] Is an employee who has been here 8 months entitled to vacation?
[assistant] They are not yet entitled to the full amount.  ← may be right or wrong

Version with CoT:
[user] Is an employee who has been here 8 months entitled to vacation?
       Think step by step before answering.
[assistant]
1. The policy states that employees accrue 1 day per full month worked.
2. 8 full months = 8 accrued days.
3. Therefore, yes, they are entitled to 8 proportional vacation days.
Answer: Yes, they are entitled to 8 proportional vacation days.
```

**When to use CoT:**
- Complex reasoning questions (eligibility, calculations, multi-step).
- When you need to audit the model's reasoning (the "step by step" exposes it).
- Not necessary for simple fact lookup questions.

**Zero-shot CoT:** simply add "Think step by step." at the end of the prompt. Works surprisingly well.

### 3.4 Prompt templates with variables

In production, the prompt is not written "by hand" on each call. **Templates** with variables are used and substituted dynamically:

```python
TEMPLATE = """You are the HR assistant.

Employee question: {message}

Relevant policy fragments:
{chunks}

Respond in markdown with simple language."""

prompt = TEMPLATE.format(
    message="How many vacation days do I get?",
    chunks="§3.1 Vacation: Employees accrue 1 day per month..."
)
```

This is exactly what the `logic.prompt` node in template 09 does.

---

## 4. Why RAG: hallucination, private data, fresh data

### 4.1 The hallucination problem

LLMs **generate** text — they do not retrieve it from a database. When they do not know the answer, instead of saying "I don't know", they tend to invent a plausible answer with total confidence. This is called **hallucination**.

```
Question: How many vacation days are legally required in Mexico?
LLM without RAG: "15 days in the first year, increasing by 2 days for each additional year."
← Correct for Mexico. But if you ask about your company's internal policy...

Question: How many vacation days does Company X give in the first year?
LLM without RAG: "Company X grants 20 business days in the first year..." ← FABRICATED
```

The model "knows" that companies have vacation policies and generates something plausible — but it has no access to your company's real policy.

**RAG solves this** by passing the model real documents as context. The model no longer invents: it reasons over text you provide.

### 4.2 The private data problem

Pretrained LLMs only know what was in their training corpus — which is public. **Your employee handbook, your contracts, your customer database are not there.**

Options to include private knowledge:
1. **RAG** (this module): retrieve relevant documents in real time and put them in the prompt.
2. **Fine-tuning** (§9): retrain the model on your data — costly, requires expertise.
3. **Context stuffing**: put the entire document in the prompt — only works for small documents.

RAG is the most practical option for most cases.

### 4.3 The fresh data problem

Pretraining has a **knowledge cutoff** date. A model trained through March 2024 knows nothing of what happened after — no law changes, no new company policies, no current prices.

**RAG enables real-time knowledge** because the documents you retrieve are the ones you keep updated. Update the index → the model automatically uses the new information.

### 4.4 Summary: when you do NOT need RAG

- **General task:** draft an email, summarize text the user pastes directly, translate.
- **Public knowledge well covered:** programming questions, mathematics, general history.
- **Small static data** that fits in the context window: you can do direct "context stuffing".

---

## 5. The minimal RAG pattern

**RAG = Retrieval-Augmented Generation.** In one sentence: before calling the LLM, you retrieve the most relevant document fragments for the question and put them in the prompt.

### 5.1 The four steps

```
┌─────────────────────────────────────────────────────────────────────┐
│                       MINIMAL RAG PATTERN                            │
│                                                                       │
│  1. QUESTION                                                          │
│     The user writes: "How many vacation days do I get?"            │
│                │                                                      │
│                ▼                                                      │
│  2. RETRIEVE                                                          │
│     Convert the question into an embedding vector.                    │
│     Search the index for the K most similar fragments.               │
│                │                                                      │
│                ▼                                                      │
│  3. AUGMENT PROMPT                                                    │
│     Build the prompt: instructions + retrieved chunks                 │
│     + user question.                                                  │
│                │                                                      │
│                ▼                                                      │
│  4. RESPOND (Generate)                                                │
│     The LLM generates the response using ONLY the given context.         │
│     "According to §3.1, you get 12 business days in the first year." │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 The full flow (with offline indexing)

The RAG pattern has two phases:

**Offline phase (indexing):** happens once, or when you update documents.

```
PDF/text documents
        │
        ▼
  Chunking (split into fragments)
        │
        ▼
  Embedding of each chunk → vector
        │
        ▼
  Store vectors in an index (vector store)
```

**Online phase (inference):** happens on each user question.

```
User question
        │
        ▼
  Embedding of the question → vector
        │
        ▼
  Search the index: top-K most similar chunks
        │
        ▼
  Build augmented prompt:
    system + chunks + question
        │
        ▼
  LLM generates response
        │
        ▼
  Response to user (with citations)
```

### 5.3 How it maps to template 09

```
Offline phase:
  loader.pdf  →  ingest.chunker  →  [model.embedding]  →  store.chroma

Online phase (per question):
  io.input (question)
      │
      ├──▶ retrieval.vector ◀── store.chroma (Retriever)
      │         │ top-4 chunks
      │         ▼
      └──▶ logic.prompt ◀── model.llm
               │ response with citations
               ▼
         logic.citations
               │
               ▼
           io.output
```

Each node in template 09 corresponds exactly to a step in the minimal RAG pattern.

### 5.4 Why top-K and not all chunks?

Even with a huge window, passing all chunks to the model is costly (tokens = money) and can confuse it ("lost in the middle"). The `topK=4` parameter in template 09's `retrieval.vector` node means: retrieve only the 4 most relevant fragments. That number is an empirical default — 3–5 is the usual range for policy documents.

---

## 6. Embeddings: geometric intuition and cosine similarity

### 6.1 What is an embedding?

An **embedding** is a function that converts text (or any data) into a high-dimensional numeric vector. The key property: **semantically similar texts end up close in vector space**.

```
"vacation policy"           → [0.12, -0.34, 0.89, 0.01, ...]  (1536 numbers)
"annual rest days"          → [0.11, -0.33, 0.91, 0.02, ...]  (very close)
"oil price"                 → [-0.67, 0.45, -0.23, 0.78, ...]  (very far)
```

### 6.2 Geometric intuition

Imagine each text as a point in a 1,536-dimensional space (the size of `text-embedding-3-large` embeddings). Texts with the same meaning end up in "zones" of the space:

```
          HR policies
          ┌────────────────────┐
          │  vacation ●        │
          │  time off ●        │     prices
          │  days off ●        │  ┌──────────────┐
          └────────────────────┘  │ oil ●        │
                                  │ gas ●        │
                                  └──────────────┘
```

Similarity search consists of: "given the question embedding, which is the closest point in the space?"

### 6.3 Cosine similarity

The most common metric for comparing embeddings is **cosine similarity**: it measures the angle between two vectors, regardless of magnitude.

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)

Range: -1 (opposite) to 1 (identical)
```

In pure Python:

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x**2 for x in a))
    norm_b = math.sqrt(sum(x**2 for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
```

### 6.4 Production embeddings vs toy embeddings

For the module lab you will use "toy" embeddings (bag-of-words or char n-grams). They are enough to understand the mechanism, but in production you will use dedicated models:

| Embedding model | Dimensions | Notes |
|---------------------|-------------|-------|
| `text-embedding-3-large` (OpenAI) | 3,072 (reducible) | RAGorbit default |
| `text-embedding-3-small` (OpenAI) | 1,536 | Cheaper, good quality |
| `embed-english-v3.0` (Cohere) | 1,024 | Multilingual available |
| `bge-large-en-v1.5` (BAAI, local) | 1,024 | Open weights, no API key |
| `E5-large` (Microsoft, local) | 1,024 | Excellent on benchmarks |

**When to use local embeddings:** total privacy (no text leaves your server), no embedding token cost, integrable in Ollama.

> **RAGorbit connection:** the `model.embedding` node in template 09 has `"model": "text-embedding-3-large"`. Change that field to `"local": true` and a local model for embeddings without API.

### 6.5 The difference between embeddings and the LLM

This confuses many people: the LLM (`model.llm` node) and the embedding model (`model.embedding` node) are distinct models with distinct roles.

| | LLM | Embedding model |
|-|-----|---------------------|
| Role | Generates response text | Converts text into vector |
| When used | At inference (generate response) | Offline (index) + online (embed question) |
| Output | Text tokens | Numeric vector |
| Example | `claude-opus-4-8` | `text-embedding-3-large` |

---

## 7. Model selection and evaluation

### 7.1 The three decision axes

Choosing a model is always a balance of three variables:

```
         Quality
            ▲
            │       Claude Opus
            │    GPT-4o  ●
            │       ●
            │  Gemini Pro ●
            │
            │      Llama 70B ●
            │  Mistral Large ●
            │
            │    Claude Haiku ●
            │ GPT-4o-mini ●
            └──────────────────────────▶ Speed (low latency)
              ──────────────────────────▶
                      Cost (low)
```

You cannot maximize all three at once. The choice depends on your use case.

### 7.2 Evaluation metrics

To choose a model for RAG, evaluate on **your own dataset** with these metrics:

| Metric | What it measures | Tool |
|---------|----------|-------------|
| Faithfulness | Is the response supported by the chunks? | RAGAS |
| Answer Relevancy | Does the response answer the question? | RAGAS |
| Context Precision | Are the retrieved chunks relevant? | RAGAS |
| Context Recall | Were all necessary chunks retrieved? | RAGAS |
| P95 Latency | 95th percentile response time | Direct measurement |
| Cost per 1K questions | Input + output tokens × price | Calculated |

**Principle:** do not choose a model by generic benchmark. Evaluate in your specific domain with an eval set of 50–200 questions with reference answers.

### 7.3 Recommended evaluation process

1. Build an eval set: 50–100 (question, correct answer) pairs based on your real documents.
2. Run the full RAG pipeline with each candidate model.
3. Measure faithfulness, answer relevancy, and latency.
4. Choose the model with the best quality/cost balance for your SLA.

### 7.4 When to use a small model

For **light classification** tasks (is this question about vacation, payroll, or benefits?), a small model (Haiku 4.5, GPT-4o-mini, Llama 3.1 8B) may be enough and 10–100x cheaper.

In RAGorbit, the `model.intent` node is exactly for this: classify before running expensive RAG. If the question is not about HR, you do not call the full pipeline.

---

## 8. Comparison: Claude vs OpenAI vs Gemini vs Llama/Mistral

### 8.1 Closed models (closed-source / proprietary)

Accessed via API. You cannot see the weights, you cannot deploy on your server.

| | Claude (Anthropic) | GPT (OpenAI) | Gemini (Google) |
|-|--------------------|-------------|-----------------|
| Main models | Opus 4.8, Sonnet 4.6, Haiku 4.5 | GPT-4o, GPT-4o-mini | Gemini 1.5 Pro, Flash |
| Context window | 200K | 128K | 1M |
| Strengths | Long reasoning, instruction following, safety | Broad ecosystem, function calling | Huge window, multimodal, Google integration |
| Price (approx, 2025) | Opus: ~$15/MTok output | GPT-4o: ~$10/MTok output | Pro: ~$7/MTok output |
| Offline mode | No | No | No |
| RAGorbit default | `anthropic:claude-opus-4-8` | configurable | configurable |

RAGorbit uses LangChain's `init_chat_model`, which supports all these providers by changing only the `model` field.

### 8.2 Open-weights models

Weights are public. You can download them, run them on your hardware or in Ollama.

| | Llama (Meta) | Mistral | Gemma (Google) |
|-|--------------|---------|----------------|
| License | Llama 3 Community | Apache 2.0 (Mistral 7B) | Gemma Terms |
| Models | Llama 3.1 8B/70B/405B | Mistral 7B, Mixtral 8x7B, Mistral Large | Gemma 2 2B/9B/27B |
| How to use | Ollama, HuggingFace, vLLM | Ollama, Mistral API | Ollama, HuggingFace |
| Cost | Infrastructure only | Infrastructure only | Infrastructure only |
| Privacy | Total (no external API) | Total if local | Total if local |

### 8.3 Hugging Face and Ollama

**Hugging Face** is the central repository for open-weights models. It has an inference API (paid or free with limits) and thousands of models for embeddings, LLMs, vision models, etc.

**Ollama** is the easiest way to run models locally:

```bash
ollama run llama3.1         # downloads and runs Llama 3.1 8B
ollama run mistral          # Mistral 7B
ollama run nomic-embed-text # local embeddings
```

In RAGorbit you can point to Ollama by changing `model` to `ollama:llama3.1` in the `model.llm` node.

### 8.4 When to use what

| Situation | Recommendation |
|-----------|---------------|
| Quick prototype, cost doesn't matter | Claude Opus 4.8 or GPT-4o |
| High-quality production, flexible budget | Claude Sonnet 4.6 or GPT-4o |
| High-volume production, minimize cost | Claude Haiku 4.5 or GPT-4o-mini |
| Confidential data, no cloud | Llama 3.1 70B via Ollama or vLLM |
| No network / isolated environment | Ollama with local model |
| Embeddings with total privacy | Local `bge-large` or `E5` via Ollama |

---

## 9. RAG vs fine-tuning vs pure prompting: when to use each

### 9.1 Three strategies to "teach" the model

```
PURE PROMPTING             RAG                      FINE-TUNING
──────────────────         ──────────────────────   ──────────────────
Instructions in            Retrieve relevant        Retrain model
the prompt                 documents and put        weights with
                           them in the prompt       your data

Cost:       minimal        medium                    high
Privacy:    low            medium                    high (if local)
Updatable:  instant        when you update index     when you retrain
Needs data: no             yes (documents)          yes (many Q/A pairs)
```

### 9.2 Pure prompting

**When it works well:**
- General tasks where the model already has good knowledge (draft, reformat, translate).
- Recent public knowledge well covered in pretraining.
- Few-shot for simple classification tasks.

**When it is not enough:**
- The model does not know your private data.
- Information changes frequently (knowledge cutoff).
- You need to cite the exact source (the model can invent citations).

### 9.3 RAG

**When to use RAG:**
- You have proprietary documents (manuals, contracts, FAQs, knowledge base).
- Information changes and you need the model to always use the latest version.
- You need traceability (cite the exact fragment that supported the answer).
- Limited budget for fine-tuning.

**When RAG alone is not enough:**
- Tasks requiring very domain-specific reasoning (e.g. interpreting complex legal clauses) — RAG provides context, but the base model may not reason well over it without additional training.
- When "knowledge" is procedural and lives in model behavior, not in documents.

### 9.4 Fine-tuning

**When to consider fine-tuning:**
- You need the model to adopt a very specific style or tone (brand voice).
- The domain is so specialized that the base model makes consistent errors even when given context (medicine, highly technical law).
- You have many high-quality (input, output) pairs (minimum 500–1000, better 5,000+).
- Production volume justifies training cost.

**When NOT to use fine-tuning:**
- As a first option (RAG is cheaper and faster to iterate).
- When data changes frequently (retraining is costly).
- When you do not have quality data.

### 9.5 Combination: RAG + fine-tuning

In mature systems they are used **together**: the fine-tuned model understands the domain better and reasons better over the context RAG provides. Fine-tuning teaches "how to reason"; RAG provides the "what".

### 9.6 Decision table

```
Do you have updatable proprietary documents?
  NO → Pure prompting (zero/few-shot)
  YES → RAG

Does RAG + base model give sufficient quality?
  YES → Stay with RAG
  NO → Do you have +1000 quality Q/A pairs?
         NO → Improve prompting/retrieval
         YES → Consider fine-tuning on the base model
              or fine-tuning + RAG
```

---

## 11. Layer ③ explained: LangChain from scratch

> **Prerequisite:** have implemented lab layer ② (`lab/solucion_scratch.py`) or at least understand each function you wrote by hand. This section is the **LangChain foundation for the entire course** — modules M2–M11 will link here. Read it completely before attempting to write `lab/solucion_framework.py`.
>
> **Environment:** on this study machine there is no `pip` or network. **You will not be able to run** the code in this section here. The goal is that, when you have an environment with `pip install langchain langchain-community langchain-openai chromadb` and an API key, you can **write** the framework solution yourself — not just read it.

### 11.1 What LangChain is and why it exists

Imagine you just finished `solucion_scratch.py`. It works. But to take it to production you need:

- Real embeddings (OpenAI API or local Ollama).
- A vector store with an efficient index (Chroma, not an in-memory list).
- A real LLM (GPT-4o, Claude…).
- Reusable prompt templates.
- Wire everything: *query → retrieve → format → prompt → LLM → text*.

In scratch, **you** wrote that wiring function by function. In a real system, that wiring repeats in every RAG project with small variations. **LangChain exists so you don't rewrite the wiring every time** — it gives you standard pieces that fit together.

**Analogy:** you built a circuit with loose wires (scratch). LangChain is a box of **modules with standard connectors**: each piece has a known interface (`Document`, `Embeddings`, `VectorStore`, `Retriever`, `Runnable`) and you connect them with `|` instead of calling functions by hand.

```
SCRATCH (you wire everything)          LANGCHAIN (pieces + connectors)
─────────────────────────              ─────────────────────────────────
load_chunks()            ────────────▶  TextLoader + CharacterTextSplitter
embed()                  ────────────▶  OpenAIEmbeddings (Embeddings interface)
in-memory list           ────────────▶  Chroma.from_documents(...)
similarity + sort        ────────────▶  vectorstore.as_retriever(...)
build_prompt()           ────────────▶  ChatPromptTemplate
fake llm                 ────────────▶  ChatOpenAI / ChatAnthropic
sequential main()        ────────────▶  LCEL chain with | operator
```

**What problem it removes:**

| Without LangChain | With LangChain |
|---------------|---------------|
| Reimplement chunking, embedding, top-k search in every project | Loaders, splitters, stores, and retrievers ready |
| Switching OpenAI to Anthropic = rewrite HTTP calls | Change `ChatOpenAI` to `ChatAnthropic` — one line |
| Pipeline is imperative code hard to test step by step | LCEL decomposes flow into composable steps (`Runnable`) |
| No convention: each team names things differently | Same interface in tutorials, RAGorbit, and production |

**What LangChain does NOT do:** it does not improve RAG quality by itself. If your chunks are bad or the prompt is weak, LangChain won't fix it. It only **orchestrates** better what you already designed in §5 and §6.

### 11.2 Bridge table: scratch → LangChain

This table maps **each function** in `solucion_scratch.py` to its LangChain abstraction in `solucion_framework.py`:

| What you did by hand (layer ②) | LangChain piece (layer ③) | RAGorbit node (template 09) |
|--------------------------------|--------------------------|----------------------------|
| `load_chunks(path)` — read txt and split by `---` | `TextLoader(...).load()` + `CharacterTextSplitter(...).split_documents(...)` | `loader` + `ingest.chunker` |
| `embed(text)` — bag-of-words → `dict` | `OpenAIEmbeddings(model=...)` (implements `Embeddings` interface) | `model.embedding` |
| In-memory `chunks` list + vectors computed on the fly | `Chroma.from_documents(documents, embedding, collection_name=...)` | `store.chroma` |
| `cosine_similarity()` + `sort` in `retrieve()` | `vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 3})` | `retrieval.vector` |
| `retrieve()` returns `(index, sim, text)` | `retriever.invoke(query)` returns `list[Document]` | (same retriever) |
| `build_prompt()` — f-string with numbered chunks | `ChatPromptTemplate.from_messages([("system",...), ("human",...)])` | `logic.prompt` |
| (no real LLM in scratch) | `ChatOpenAI(model=..., temperature=...)` or `ChatAnthropic(...)` | `model.llm` |
| `main()` calls functions in order | LCEL chain: `dict | prompt | llm | StrOutputParser()` | edges of `flow.json` |

### 11.3 The `Document` object

LangChain does not work with loose strings for indexable documents. It uses **`Document`**:

```python
# Conceptual — each chunk is a Document
doc = Document(
    page_content="VACATION POLICY §3 — Accrual and use\nEmployees...",
    metadata={"source": "data/hr_policies.txt", "chunk": 0},
)
```

- **`page_content`:** the fragment text (equivalent to each string in your scratch `chunks` list).
- **`metadata`:** dictionary of tags (`source`, section, date…). In scratch you had no metadata; in production it enables **hard filters** (M4): "only chunks from `section=§3`".

Loaders and splitters **produce** `list[Document]`. Vector stores **consume** `list[Document]`. Retrievers **return** `list[Document]`.

### 11.4 Loaders: `TextLoader`

A **loader** reads an external source and converts it into LangChain documents.

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("data/hr_policies.txt", encoding="utf-8")
raw_documents = loader.load()
# raw_documents: list[Document] — typically ONE Document with the whole file
```

**Scratch equivalent:** open the file and read `content = f.read()` — but wrapped in a `Document` with `metadata={"source": "data/hr_policies.txt"}`.

In M2 you will see loaders for PDF, web, SQL, etc. The pattern is always the same: `.load()` → `list[Document]`.

### 11.5 Text splitters: `CharacterTextSplitter`

The policy file has **8 fragments** separated by `\n---\n`. In scratch you did `re.split(r"\n---\n", content)`. In LangChain:

```python
from langchain.text_splitter import CharacterTextSplitter

splitter = CharacterTextSplitter(
    separator="\n---\n",    # where to cut (same as your separator)
    chunk_size=1000,         # maximum characters per chunk (fallback if a block is huge)
    chunk_overlap=0,         # how many characters overlap between consecutive chunks
    keep_separator=False,    # if True, the separator stays inside the chunk
)
chunks = splitter.split_documents(raw_documents)
# chunks: list[Document] — 8 Documents, one per policy fragment
```

| Parameter | What it does |
|-----------|----------|
| `separator` | String (or regex) where to split. Here it replicates `load_chunks()`. |
| `chunk_size` | Character limit. If a block exceeds 1000, it splits again. |
| `chunk_overlap` | Repeat N characters from the end of the previous chunk at the start of the next — useful to avoid cutting sentences in half (M2). |
| `keep_separator` | `False` = the `---` does not appear in `page_content`. |

**`.split_documents(...)`** receives `list[Document]` and returns smaller `list[Document]`. Do not confuse with `.split_text(...)` which works on strings.

### 11.6 The `Embeddings` interface

In scratch, `embed()` returned a `dict[str, float]`. In production, an embedding is a **dense vector** of hundreds or thousands of floats. LangChain unifies all providers under the **`Embeddings`** interface:

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
# The API key is read from the OPENAI_API_KEY environment variable

vec = embeddings.embed_query("How many vacation days do I get?")
# vec: list[float] of 1536 dimensions

vectors = embeddings.embed_documents(["chunk 1", "chunk 2"])
# vectors: list[list[float]] — one per document
```

**Key methods:**

| Method | When used | Scratch equivalent |
|--------|---------------|---------------------|
| `embed_query(text)` | A user question (online phase) | `embed(query)` |
| `embed_documents(list)` | Many chunks when indexing (offline phase) | `embed(chunk)` in a loop |

**Local alternative (no API key):**

```python
from langchain_community.embeddings import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="nomic-embed-text")
```

Chroma and other stores **do not know** whether you use OpenAI or Ollama — they only call `.embed_query()` / `.embed_documents()` on the object you pass. That is the power of the interface.

### 11.7 VectorStore: `Chroma.from_documents`

A **vector store** stores `(Document, vector)` pairs and enables similarity search. In scratch it was an in-memory list; in LangChain:

```python
from langchain_community.vectorstores import Chroma

vectorstore = Chroma.from_documents(
    documents=chunks,              # the 8 Documents from the splitter
    embedding=embeddings,            # OpenAIEmbeddings object
    collection_name="hr_policies",   # collection name (as in template 09)
)
```

**What `.from_documents` does internally (offline phase):**

```
chunks (8 Documents)
    │
    ├──▶ embeddings.embed_documents([doc.page_content for doc in chunks])
    │         → 8 vectors of 1536 floats
    │
    └──▶ Chroma stores (id, vector, page_content, metadata) in HNSW index
```

Equivalent to your loop `for chunk in chunks: embed(chunk)` + store in memory, but with an index optimized for millions of vectors. To persist to disk: `persist_directory="./chroma_db"` (M3).

### 11.8 Retriever: `as_retriever` and `.invoke`

The vector store knows how to search, but the RAG pipeline wants an object with a uniform interface: **`Retriever`**. You obtain it like this:

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",      # search by cosine similarity
    search_kwargs={"k": 3},        # top-3, like k=3 in retrieve()
)

result = retriever.invoke("How many vacation days if I've been here 3 years?")
# result: list[Document] — 3 documents, from most to least similar
```

**Scratch equivalent:**

```python
# retrieve(query, chunks, k=3) → list[tuple[int, float, str]]
# retriever.invoke(query)       → list[Document]  (no index or score exposed by default)
```

| Parameter | Meaning |
|-----------|-------------|
| `search_type="similarity"` | Orders by cosine similarity (Chroma default). |
| `search_kwargs={"k": 3}` | How many documents to return — template 09's `topK=4`. |

**Important prediction:** `retriever.invoke(query)` **does not** return a string or an embedding. It returns **`list[Document]`** — objects with `.page_content` and `.metadata`. See exercise 19.

### 11.9 Chat models: `ChatOpenAI` and `ChatAnthropic`

In scratch you did not call a real LLM. In framework:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
```

```python
# Anthropic alternative (default in RAGorbit):
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.2)
```

- **`model`:** model identifier in the provider API.
- **`temperature`:** same concept as §2.1 — for factual RAG use 0.0–0.2.

The `llm` object is a **`Runnable`**: you can compose it with `|` (see §11.10). When it receives a formatted prompt, it returns an **`AIMessage`** (not a plain string — that's why you need `StrOutputParser` at the end).

### 11.10 Prompt templates: `ChatPromptTemplate`

In scratch, `build_prompt()` was an f-string. In LangChain, prompts are **templates with variables**:

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are the HR assistant. Respond ONLY with the given fragments."),
    ("human", """Relevant fragments:
{context}

Employee question: {question}

Respond in markdown."""),
])
```

- **`("system", ...)`** → system message (§3.1).
- **`("human", ...)`** → user message with variables `{context}` and `{question}`.
- When invoked with `{"context": "...", "question": "..."}`, LangChain fills the variables and produces a **`ChatPromptValue`** ready for the LLM.

Variables must match **exactly** the keys of the dict that feeds the chain (next section).

### 11.11 LCEL: the `|` operator, `Runnable`, and the dict pattern

**LCEL** (LangChain Expression Language) is how you **compose** pipeline steps. Three key ideas:

#### Idea 1: everything chainable is a `Runnable`

A **`Runnable`** is any LangChain object that implements `.invoke(input)` (and optionally `.stream()`, `.batch()`). Examples: `retriever`, `prompt`, `llm`, `StrOutputParser`, wrapped functions.

The **`|`** operator connects two Runnables: the left output goes into the right.

```
A | B | C
  ≡  C(B(A(input)))
```

Think Unix pipes: `query | retriever | format | prompt | llm | parser`.

#### Idea 2: `RunnablePassthrough` passes input through unchanged

```python
from langchain.schema.runnable import RunnablePassthrough

RunnablePassthrough()  # invoke("hello") → "hello"
```

Useful when one branch of the pipeline needs the **original input** (the question) while another branch transforms it (retrieve chunks).

#### Idea 3: the dict runs branches in parallel and fills the prompt

```python
from langchain.schema.output_parser import StrOutputParser

def format_chunks(docs: list) -> str:
    return "\n\n".join(f"[{i+1}] {d.page_content}" for i, d in enumerate(docs))

chain = (
    {
        "context": retriever | format_chunks,
        "question": RunnablePassthrough(),
    }
    | prompt
    | llm
    | StrOutputParser()
)
```

**Step-by-step flow** when you call `chain.invoke(query)`:

```
INPUT: query = "How many vacation days...?"

STEP 1 — The dict (parallel branches):
┌─────────────────────────────────────────────────────────────┐
│  "context": retriever | format_chunks                       │
│      query ──▶ retriever.invoke(query)                      │
│             ──▶ list[Document] (3 docs)                       │
│             ──▶ format_chunks(docs)                          │
│             ──▶ "[1] POLICY §4...\n\n[2] POLICY §3..."       │
│                                                             │
│  "question": RunnablePassthrough()                          │
│      query ──▶ query  (unchanged)                           │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
  {"context": "[1] ...", "question": "How many days..."}

STEP 2 — prompt:
  ChatPromptTemplate fills {context} and {question}
        │
        ▼
  ChatPromptValue (system + human messages ready)

STEP 3 — llm:
  Provider API → AIMessage with response
        │
        ▼
STEP 4 — StrOutputParser:
  Extracts text string from AIMessage
        │
        ▼
OUTPUT: "According to Policy §3, you are entitled to 18 business days..."
```

**Why the dict and not a single linear chain:** the question must reach the prompt **intact** (`{question}`), but the retriever needs the same question as input to search. `RunnablePassthrough()` prevents the question from being lost or overwritten by chunks.

**`StrOutputParser`:** the LLM returns a rich object (`AIMessage`). The parser extracts `.content` as `str` — what you print or return to the user.

### 11.12 Lab pipeline walkthrough, block by block

This is the complete walkthrough of `lab/solucion_framework.py`, line by line conceptually:

```
┌──────────────────────────────────────────────────────────────────┐
│  IMPORTS                                                         │
│  TextLoader, CharacterTextSplitter, OpenAIEmbeddings, Chroma,    │
│  ChatOpenAI, ChatPromptTemplate, RunnablePassthrough,            │
│  StrOutputParser                                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 1 — LOAD AND CHUNK          (≈ load_chunks)             │
│  loader = TextLoader("data/hr_policies.txt")                     │
│  raw_documents = loader.load()         # 1 large Document        │
│  splitter = CharacterTextSplitter(separator="\n---\n", ...)       │
│  chunks = splitter.split_documents(...)  # 8 Documents           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 2 — EMBEDDINGS + CHROMA       (≈ embed + index)          │
│  embeddings = OpenAIEmbeddings(model="text-embedding-3-small")   │
│  vectorstore = Chroma.from_documents(chunks, embeddings, ...)    │
│  # Indexes 8 semantic vectors in memory                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 3 — RETRIEVER                 (≈ retrieve)               │
│  retriever = vectorstore.as_retriever(                           │
│      search_type="similarity", search_kwargs={"k": 3})           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 4 — PROMPT + LLM              (≈ build_prompt + LLM)     │
│  llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)        │
│  prompt = ChatPromptTemplate.from_messages([                     │
│      ("system", SYSTEM_PROMPT),                                  │
│      ("human", HUMAN_TEMPLATE),  # {context}, {question}         │
│  ])                                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 5 — LCEL CHAIN                (≈ orchestrated main)      │
│  chain = (                                                       │
│      {"context": retriever | format_chunks,                      │
│       "question": RunnablePassthrough()}                         │
│      | prompt | llm | StrOutputParser()                         │
│  )                                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 6 — EXECUTE                                             │
│  retrieved_chunks = retriever.invoke(query)   # inspection       │
│  response = chain.invoke(query)               # final response   │
└──────────────────────────────────────────────────────────────────┘
```

**Ranking difference vs scratch:** with real semantic embeddings, §3 ("After 3 years… 18 days") usually ranks **first** — not §4 as in bag-of-words. The mechanism is identical; vector quality changes (§6.4).

### 11.13 When to use LangChain / when NOT — and gotchas

**When YES:**

- RAG prototypes and production where you want to switch providers (OpenAI ↔ Anthropic ↔ Ollama) without rewriting.
- Pipelines with many steps (retrieve → rerank → prompt → LLM → parser) — LCEL composes them cleanly.
- Teams already using the ecosystem (LangSmith, LangGraph in M6+).

**When NOT (or not LangChain alone):**

- One-off 30-line script, no provider change → scratch or direct requests may suffice.
- Maximum latency/cost control → direct API calls without intermediate layer.
- Already using LlamaIndex/CrewAI with another mental model → don't mix two frameworks without reason (M2 compares).

**Common gotchas:**

| Gotcha | What happens | Solution |
|--------|----------|----------|
| Package versions | Imports change between LangChain 0.1 and 0.2+ (`langchain.schema` vs `langchain_core`) | Pin versions in `requirements.txt`; this course uses the style of `solucion_framework.py` |
| Missing API key | `OpenAIEmbeddings` / `ChatOpenAI` fail without `OPENAI_API_KEY` | Export the variable or use `OllamaEmbeddings` + local model |
| `\|` with non-Runnable object | `TypeError` when composing | Only Runnables, functions, or dicts of Runnables in LCEL |
| Prompt variables | `{context}` in template but `"contexto"` in dict → KeyError | Identical names in template and dict |
| `retriever.invoke()` vs `chain.invoke()` | First returns docs; second returns LLM response | Use retriever only to inspect; chain for final response |
| `CharacterTextSplitter` with wrong separator | 1 giant chunk or too many chunks | Same `\n---\n` as in scratch |

### 11.14 Environment note and next step

Do not run this section in the course environment without network. **Study, write** `solucion_framework.py` in the lab (see `lab/enunciado.md` layer ③), and compare with the reference solution.

**Cross-links:**

- Minimal RAG pattern (the 4 steps): [§5](#5-the-minimal-rag-pattern)
- Embeddings and cosine similarity (what replaces `embed()`): [§6](#6-embeddings-geometric-intuition-and-cosine-similarity)
- Scratch + framework lab: [`lab/enunciado.md`](lab/enunciado.md), [`lab/solucion_framework.py`](lab/solucion_framework.py)
- Full template 09: [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)

---

> **Beyond Lang\*:** this same HR RAG is implemented with **LlamaIndex**, with the **provider native SDK (no framework)**, and with **Haystack** in [`../referencia/rag-sin-langchain.md`](../referencia/rag-sin-langchain.md). LangChain is the course default because it is what generates RAGorbit, but the goal is for you to understand the mechanism (layer ②) and be able to use **any** stack. Also read the [honest critiques of the LangChain/LangGraph/LangSmith stack](../referencia/tecnologias-comparadas.md#críticas-al-stack-langchain--langgraph--langsmith-y-cuándo-no-usarlo).

---

## 12. Checkpoint

**You know it if you can…**

- [ ] Explain what a token is and approximately calculate how many tokens a paragraph has.
- [ ] Describe what happens when temperature is 0 vs 0.7.
- [ ] Write a system/user prompt for the HR assistant that avoids hallucinations.
- [ ] Explain the 4 steps of the minimal RAG pattern without looking.
- [ ] Draw the offline and online phase diagram for template 09.
- [ ] Calculate cosine similarity between two 3-dimensional vectors by hand.
- [ ] Decide between RAG, fine-tuning, and pure prompting for a given case.
- [ ] Name at least 2 open models and how to run them locally.
- [ ] Map each function in `solucion_scratch.py` to its LangChain piece (table §11.2).
- [ ] Explain what `retriever.invoke(query)` returns and what the `|` operator does in LCEL.
- [ ] Write from scratch (on paper or in an editor) the lab LCEL chain without copy-pasting.

**If something is unclear, review:**
- Tokens → §1.2
- Temperature → §2.1
- Why RAG → §4
- Cosine similarity → §6.3
- RAG vs fine-tuning → §9
- LangChain from scratch → §11

**Next:** go to `ejercicios.md` (includes LangChain block) and then to `lab/enunciado.md`.

---

> **Cross-links:**
> - `model` node catalog: [`../../docs/02-node-catalog.md#model--modelos`](../../docs/02-node-catalog.md)
> - Full HR template: [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)
> - Compared technologies (full table of models and stores): [`../referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md)
> - Glossary: [`../referencia/glosario.md`](../referencia/glosario.md)

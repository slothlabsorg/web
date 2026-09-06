# Module 5 · Generation, logic, and evaluation

> **Week 5 — `logic` nodes**
> How to go from "I retrieved relevant chunks" to "I produced a structured, cited, audited, and evaluated decision."

---

## Table of contents

1. [Contextual synthesis — the `logic.prompt` node](#1-contextual-synthesis)
2. [Structured output — `logic.structured`](#2-structured-output)
3. [Mandatory citations — `logic.citations`](#3-mandatory-citations)
4. [Deterministic rules — `logic.rules`](#4-deterministic-rules)
5. [Router/conditional — `logic.router`](#5-routerconditional)
6. [RAG evaluation — faithfulness, relevance, precision/recall](#6-rag-evaluation)
7. [Decision evaluation](#7-decision-evaluation)
8. [LCEL vs LlamaIndex query engines comparison](#8-lcel-vs-llamaindex-query-engines-comparison)
9. [Evaluation frameworks — RAGAS, TruLens, DeepEval, promptfoo](#9-evaluation-frameworks)
10. [Layer ③ explained: structured output and evaluation with frameworks, from scratch](#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch)
11. [Module summary and checkpoint](#11-module-summary-and-checkpoint)

---

## 1. Contextual synthesis

### What is synthesis in RAG?

After retrieval you have a set of **chunks** (document fragments) and the user's **question or request**. Synthesis is the step where the LLM combines both to produce a useful answer.

Without synthesis, RAG would be just a search engine returning raw fragments. With synthesis, the LLM:

- Integrates information from multiple chunks that may be complementary or apparently contradictory.
- Adapts tone and format to the audience (technical, regulatory, conversational).
- Detects which part of the question is covered by the chunks and which is not.

### The `logic.prompt` node

In RAGorbit, `logic.prompt` is the general-purpose synthesis node. It receives:

- **`→ Model`** (required): the LLM to use.
- **`→ Chunks`**: retrieved fragments (may be 0 if nothing relevant).
- **`→ Message`**: the original question or request.

And produces **`Message →`**: the synthesized response in text or markdown.

```
retrieval.vector ──chunks──► logic.prompt ──message──► io.output
model.llm        ──model──►
io.input         ──message──►
```

### The anatomy of a synthesis prompt

A good synthesis template has four parts:

```
SYSTEM:
You are a [domain] assistant. Respond ONLY using the provided fragments.
If the fragments do not contain sufficient evidence, indicate "not_determinable".

CONTEXT (retrieved chunks):
---
{chunk_1_text}
[Source: {chunk_1_source}]
---
{chunk_2_text}
[Source: {chunk_2_source}]
---

REQUEST:
{user_question}

INSTRUCTION:
Synthesize the response. Cite the source in brackets for each claim.
```

### When to use `logic.prompt` vs `logic.structured`

| Situation | Recommended node |
|---|---|
| Conversational response in natural language (support chat, technical assistant) | `logic.prompt` |
| Decision that feeds another system or process (approval, score, classification) | `logic.structured` |
| You need to guarantee a type contract (required fields, enums) | `logic.structured` |
| Output is shown directly to a human as text | `logic.prompt` |

**Examples in the templates:**
- Template 08 (manufacturing/AMM): uses `logic.prompt` because the technician receives Markdown text with citations, not a JSON object.
- Template 02 (banking): uses `logic.structured` because the output feeds a core banking system that expects JSON with typed fields.

---

## 2. Structured output

### The free-text problem

When the LLM returns free text, extracting data from that response requires fragile parsing (regex, heuristics) that can fail with model or wording changes. Worse: if the LLM omits a critical field (like `score` in a credit evaluation), downstream systems can fail silently.

**Structured output** forces the LLM to emit a JSON object validated against a **JSON Schema** before the pipeline continues. If the LLM does not satisfy the schema, the node fails with an explicit error — it never propagates corrupt data.

### JSON Schema: the contract between the LLM and the system

A JSON Schema defines the expected structure:

```json
{
  "type": "object",
  "required": ["decision", "score", "factors", "citations"],
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["approve", "review", "reject"]
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "factors": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1
    },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["text", "source"],
        "properties": {
          "text": {"type": "string"},
          "source": {"type": "string"}
        }
      },
      "minItems": 1
    }
  }
}
```

This schema guarantees that:
1. `decision` can only be one of three values (not "APPROVED", "apprvd.", or free text).
2. `score` is an integer between 0 and 100 (not "72/100" or "seventy-two").
3. There is always at least one factor and at least one citation.

### Four mechanisms for structured output

> **Layer ③ depth:** step-by-step teaching of Pydantic, instructor, and `with_structured_output` (with a lab walkthrough) is in [§10 — Layer ③ explained](#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch). Here is only the design overview.

#### ① Tool-calling (function with schema)

The LLM receives a "tool" whose signature defines the schema. The model "calls" the tool instead of responding with text. It is the most robust mechanism because the model has been fine-tuned to respect function schemas.

```python
# With LangChain (real framework — requires pip install langchain-anthropic)
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from pydantic import BaseModel

class CreditDecision(BaseModel):
    decision: str
    score: int
    factors: list[str]
    citations: list[dict]

llm = ChatAnthropic(model="claude-opus-4-8")
structured_llm = llm.with_structured_output(CreditDecision)
```

**Advantage:** the model knows it must respect the schema (it is part of its tool-calling training).
**Disadvantage:** requires provider support for function-calling (OpenAI, Anthropic, Google — yes; small local models — variable).

#### ② JSON-mode

Instructs the model to output valid JSON. Simpler than tool-calling but without schema validation — you can get valid JSON with incorrect fields.

```python
# With OpenAI JSON-mode
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},
    messages=[{"role": "user", "content": "Evaluate the application and return JSON with: decision, score, factors"}]
)
```

**When to use:** when the provider does not support tool-calling or when the schema is so simple that the error risk is low.

#### ③ instructor (Python library)

`instructor` is a wrapper over the LLM API that parses the response and validates it against a Pydantic model, retrying if validation fails.

```python
# Requires: pip install instructor pydantic
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field

class CreditDecision(BaseModel):
    decision: str = Field(..., pattern="^(approve|review|reject)$")
    score: int = Field(..., ge=0, le=100)
    factors: list[str] = Field(..., min_length=1)
    citations: list[dict] = Field(..., min_length=1)

client = instructor.from_anthropic(Anthropic())
decision = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
    response_model=CreditDecision,
)
```

**Advantage:** automatic retries with the validation error as feedback to the model.
**Disadvantage:** additional dependency; more latency from retries.

#### ④ outlines (grammar-guided generation)

`outlines` controls generation token by token using a formal grammar (regex or JSON schema), guaranteeing valid output by construction — not by retry.

```python
# Requires: pip install outlines
import outlines

model = outlines.models.transformers("mistral-7b")
generator = outlines.generate.json(model, CreditDecision)
decision = generator(prompt)
```

**Advantage:** mathematical guarantee of validity — invalid output is impossible, not improbable.
**Disadvantage:** only with local models (Hugging Face); does not work with provider APIs.

### Comparison table

| Mechanism | Validity guarantee | Cloud APIs | Local models | Retries | Typical use |
|---|---|---|---|---|---|
| Tool-calling | High (fine-tuned) | Yes | Variable | No | Production with OpenAI/Anthropic/Google |
| JSON-mode | Medium (valid JSON, not schema) | Yes | Variable | No | Simple schemas |
| instructor | High (validates + retries) | Yes | Yes | Yes | When tool-calling unavailable |
| outlines | Total (formal grammar) | No | Yes | No | Local models, critical latency |

### The `logic.structured` node in RAGorbit

```
model.llm    ──model──►
                        logic.structured ──decision──► logic.rules
retrieval.vector ──chunks──►
```

Key config:
```json
{
  "type": "logic.structured",
  "config": {
    "schema": { "...JSON Schema here..." },
    "requireCitations": true
  }
}
```

With `requireCitations: true`, the node instructs the LLM to include a `citations` field with at least one entry. If the LLM omits it, schema validation fails before propagating the decision.

**Anchor to template 02 (banking):** the `structured_decision` node produces `{score, decision, factors, justification}` with `requireCitations: true`. The LLM's `decision` field is only tentative — `logic.rules` overwrites it with the deterministic decision based on the score.

---

## 3. Mandatory citations

### The problem of hallucinations without citation

An LLM can produce a plausible, coherent response that is not backed by any retrieved chunk. Without a verification mechanism, this hallucination reaches the user with the same appearance as a correctly grounded response.

In high-consequence domains (healthcare, credit, insurance, aviation), a response without verifiable citation is unacceptable:
- Regulatorily: a credit denial without citation to evidence can violate ECOA/Reg B.
- Operationally: an invented maintenance procedure can cause an aviation incident.

### Groundedness: is the response anchored in the chunks?

**Groundedness** (or faithfulness) is the property that every claim in the response can be traced to a concrete fragment of retrieved context.

```
Claim: "The applicant's annual income is $85,000"
                            ↓
Source chunk: "annual_income,85000,2023" [datos_financieros.csv]
                            ↓
Groundedness: VERIFIED
```

```
Claim: "The applicant has an excellent payment history over 10 years"
                            ↓
Retrieved chunks: only contain data from 2023
                            ↓
Groundedness: NOT VERIFIED → must report "not_determinable"
```

### The `logic.citations` node

```
logic.prompt ──message──► logic.citations ──message──► io.output
retrieval.vector ──chunks──►
```

In `enforce` mode: if the response does not contain citations verifiable against the chunks, the node **rejects the response** instead of letting it through. It returns an actionable error.

In `annotate` mode: adds citation annotations to the response but does not block it.

```json
{
  "type": "logic.citations",
  "config": {
    "mode": "enforce"
  }
}
```

### Implement groundedness from scratch (② scratch)

```python
def verify_groundedness(response: str, chunks: list[dict]) -> dict:
    """
    Verifies that each sentence in the response appears (or can be traced)
    in at least one of the chunks.
    Simplified version: checks word n-gram overlap.
    """
    chunk_words = set()
    for chunk in chunks:
        chunk_words.update(chunk["text"].lower().split())
    
    sentences = [s.strip() for s in response.split(".") if s.strip()]
    results = []
    
    for sentence in sentences:
        sentence_words = set(sentence.lower().split())
        # At least 40% of the words must be in the chunks
        overlap = len(sentence_words & chunk_words)
        ratio = overlap / max(len(sentence_words), 1)
        results.append({
            "sentence": sentence,
            "grounded": ratio >= 0.4,
            "ratio": round(ratio, 2)
        })
    
    all_grounded = all(r["grounded"] for r in results)
    return {"grounded": all_grounded, "detail": results}
```

**Limitation of this simple implementation:** word overlap does not detect paraphrase or implication. Evaluation frameworks (section 9) use LLMs as judges to detect semantic groundedness.

### When to use enforce vs annotate

| Scenario | Recommended mode |
|---|---|
| Decision with legal consequences (credit, insurance, healthcare) | `enforce` |
| Regulatory audit system (aviation AMM) | `enforce` |
| Customer support chatbot (low risk) | `annotate` |
| Internal employee search system | `annotate` |
| Prototype / demo | `annotate` (to avoid interrupting flow) |

**Anchor to template 08 (manufacturing):** `citations_check` in `enforce` mode is the last line before the response reaches the technician. A hallucination in an aviation maintenance procedure is not just a quality error; it is a PART-145 audit and safety risk.

**Anchor to template 03 (healthcare):** `logic.citations` with `mode: enforce` ensures no medical pre-authorization decision reaches the authorization agent without citing the exact section of the clinical guideline that supports it.

---

## 4. Deterministic rules

### Why NOT delegate thresholds to the LLM

This is one of the most important design decisions in production RAG systems.

**The problem:** LLMs are probabilistic. The same prompt with the same information can produce slightly different decisions across runs (even with temperature 0, non-determinism can emerge from quantization, KV cache, etc.). For business thresholds with legal or financial consequences, this non-determinism is unacceptable.

**Examples of what the LLM must NOT decide:**
- "Should a score of 68 be approved or rejected?" (the threshold is 70 — deterministic decision)
- "Does the loan amount exceed the automatic approval limit?" (it is arithmetic)
- "Is the policy in force on the claim date?" (date comparison)
- "Was the deductible reached?" (subtraction)

**These the LLM CAN decide:**
- "What risk factors emerge from these financial documents?"
- "How to explain this rejection in language the applicant can understand?"
- "Which policy clause applies to this type of damage?"

### The judge/arbitrator pattern

```
LLM: reasons and produces a numeric score (the "judge")
          ↓
Deterministic rule: applies the threshold and sets the decision (the "arbitrator")
```

This pattern appears in all high-consequence domains in RAGorbit:

| Template | LLM produces | Deterministic rule decides |
|---|---|---|
| 02 banking | `score` (0–100) | `≥70→approve, 40-69→review, <40→reject` |
| 04 insurance | estimated amount, clause | `deductible_reached`, `exclusion_applicable`, `policy_in_force` |
| 03 healthcare | criterion_not_found, severity | escalate if `severity==high OR criterion_not_found==true` |
| 08 manufacturing | warning level | `if WARNING or CAUTION → hitl.escalate` |

### The `logic.rules` node in RAGorbit

```
logic.structured ──decision──► logic.rules ──decision──► io.output
```

Config:
```json
{
  "type": "logic.rules",
  "config": {
    "rules": [
      {"when": "score >= 70", "then": {"decision": "approve"}},
      {"when": "score >= 40 AND score < 70", "then": {"decision": "review"}}
    ],
    "else": {"decision": "reject"}
  }
}
```

Rules are evaluated in order; the first match wins. `else` is the default if no rule matches.

### Implement `logic.rules` from scratch (② scratch)

```python
def apply_rules(data: dict, rules: list[dict], default: dict) -> dict:
    """
    Minimalist deterministic rules engine.
    Rules are Python-evaluable strings against the data dict.
    """
    for rule in rules:
        condition = rule["when"]
        # Evaluate the condition with data as local variables
        try:
            if eval(condition, {}, data):
                result = dict(data)
                result.update(rule["then"])
                return result
        except Exception as e:
            raise ValueError(f"Error evaluating rule '{condition}': {e}")
    
    # No rule matched → apply default
    result = dict(data)
    result.update(default)
    return result

# Usage:
rules = [
    {"when": "score >= 70", "then": {"decision": "approve"}},
    {"when": "score >= 40", "then": {"decision": "review"}}
]
data = {"score": 72, "factors": [...]}
result = apply_rules(data, rules, default={"decision": "reject"})
# → {"score": 72, "factors": [...], "decision": "approve"}
```

**Important:** using `eval()` in production requires sandboxing. Rule frameworks like `durable_rules` or `business-rules` (Python) offer safe evaluation without `eval`.

### When to use and when NOT to use deterministic rules

| Situation | Deterministic rule | LLM |
|---|---|---|
| Numeric threshold (`score >= 70`) | Yes | No |
| Date comparison (`start_date <= today`) | Yes | No |
| Financial arithmetic (amount - deductible) | Yes | No |
| Ambiguous text classification | No | Yes |
| Entity extraction from heterogeneous documents | No | Yes |
| Narrative synthesis of multiple factors | No | Yes |
| Detecting whether a clause applies to damage | No (depends) | Yes (with citations) |

---

## 5. Router/conditional

### The `logic.router` node

The router branches graph flow based on the decision value. It is the equivalent of `if/else` in the graph:

```
logic.structured ──decision──► logic.router ──[approve]──► io.output (approval_notification)
                                              ──[review]──► hitl.escalate (review_queue)
                                              ──[reject]──► io.output (rejection_notification)
```

Config:
```json
{
  "type": "logic.router",
  "config": {
    "branches": [
      {"when": "decision == 'approve'", "output": "approval"},
      {"when": "decision == 'review'", "output": "review"},
      {"when": "decision == 'reject'", "output": "rejection"}
    ]
  }
}
```

### Router vs deterministic rules

**`logic.rules`:** modifies decision content (changes a field value).
**`logic.router`:** changes flow path (which node runs next).

In practice they are used in sequence:
1. `logic.rules` sets `decision = "approve"` based on the score.
2. `logic.router` reads `decision` and branches to the corresponding notification path.

### Intent-based router

A common use of the router is after `model.intent` or `query.intent`: depending on the intent detected in the query, flow is redirected to different retrievers or handlers:

```
query.intent ──decision──► logic.router ──[credit]──► retrieval (credit_index)
                                         ──[insurance]──► retrieval (insurance_index)
                                         ──[other]──► logic.prompt (generic_response)
```

---

## 6. RAG evaluation

### Why evaluate a RAG system?

A RAG system has multiple independent failure points:
1. The retriever may bring irrelevant chunks (low precision) or miss relevant chunks (low recall).
2. The LLM may ignore chunks and hallucinate (low faithfulness).
3. The response may not answer what the user asked (low answer relevance).

RAG evaluation measures each of these points independently to know where to improve.

### The four fundamental metrics

#### Faithfulness (fidelity to context)

*Are the claims in the response backed by retrieved chunks?*

```
faithfulness = claims_backed_by_chunks / total_claims_in_response
```

- High faithfulness (≥0.8): the LLM synthesizes without inventing.
- Low faithfulness: the LLM is hallucinating or ignoring context.

**How to measure it (with LLM-as-judge):**
For each claim in the response, a judge LLM determines whether it is backed by any chunk. The proportion of backed claims is the score.

#### Answer Relevance (response relevance)

*Does the response answer the question that was asked?*

```
answer_relevance = cosine_similarity(embedding(response), embedding(question))
```

In practice, RAGAS generates hypothetical questions from the response and measures how similar they are to the original question.

#### Context Precision (context precision)

*Are retrieved chunks relevant to answering the question?*

```
context_precision = relevant_chunks_in_topK / total_chunks_in_topK
```

Measures context "contamination" by irrelevant chunks. Irrelevant context can confuse the LLM.

#### Context Recall (context recall)

*Did the system retrieve all chunks needed to answer correctly?*

```
context_recall = response_claims_backed_by_chunks /
                 total_claims_in_the_ideal_response
```

Requires having an ideal answer (ground truth) for comparison.

### When a low metric indicates which problem

```
Low faithfulness    → the LLM is hallucinating; review the prompt, reduce temperature
Low answer relevance → the retriever brings correct info but the question is poorly formulated
                       or the synthesis prompt is not instructing well
Low context precision → there is noise in the index; review chunking, metadata, filters
Low context recall  → the retriever does not find all relevant content; increase topK,
                       review embeddings, consider hybrid retrieval
```

### Diagnostic flow diagram

```
Incorrect responses?
        ↓
Low faithfulness? ──Yes──► Problem in generation (LLM, prompt)
        ↓No
Low answer relevance? ──Yes──► Problem in synthesis or intent
        ↓No
Low context precision? ──Yes──► Too much noise in retrieval
        ↓No
Low context recall? ──Yes──► The retriever misses needed chunks
        ↓No
The system works well → monitor in production
```

---

## 7. Decision evaluation

### Difference between evaluating RAG and evaluating decisions

RAG evaluation measures properties of the information flow (did chunks arrive correctly? does the response reflect the chunks?). **Decision** evaluation measures whether the business decision is correct.

To evaluate decisions you need:
1. A **test case set** with the known correct decision (ground truth).
2. Decisions the system produces on those cases.
3. Classification metrics: accuracy, precision, recall, F1, confusion matrix.

### Decision evaluation metrics

| Metric | Formula | When to prioritize |
|---|---|---|
| Accuracy | TP+TN / total | Balanced classes |
| Precision | TP / (TP+FP) | When false positives are costly (approving credit that should not be approved) |
| Recall | TP / (TP+FN) | When false negatives are costly (denying coverage that should be approved) |
| F1 | 2 * P * R / (P+R) | Balance between precision and recall |
| AUC-ROC | — | When threshold is adjustable |

### End-to-end traceability

An advantage of the `logic.structured + logic.rules` pattern is that decisions are fully traceable:

```
Decision: "reject"
  ↑
Rule: score < 40
  ↑
Score: 32
  ↑
LLM factors: ["debt_to_income_ratio: 0.68", "on_time_payments_pct: 61%"]
  ↑
Source chunks: [datos_financieros.csv, account_statement_q3.pdf §History]
  ↑
Original documents in the case file
```

This traceability chain allows auditing any decision historically, a common requirement in regulatory environments (ECOA, EBA, HIPAA).

---

## 8. LCEL vs LlamaIndex query engines comparison

> **LCEL reminder:** if you need to review `ChatPromptTemplate`, the `|` operator, and chat models, go to [M1 §11](../01-fundamentos/guia.md#11-layer-③-explained-langchain-from-scratch). For **structured output** with `with_structured_output`, go to [§10](#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch).

### LangChain Expression Language (LCEL)

LCEL defines RAG pipelines as **functional composition chains** with the `|` operator:

```python
# Requires: pip install langchain langchain-anthropic langchain-chroma
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# LCEL pipeline
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt_template
    | ChatAnthropic(model="claude-opus-4-8")
    | StrOutputParser()
)

response = chain.invoke("What is the credit limit?")
```

**LCEL advantages:**
- Clear, Pythonic functional composition.
- Native streaming support (`chain.stream()`).
- Easy parallelization with `RunnableParallel`.
- Native LangSmith integration for traces.

**Disadvantages:**
- The graph is implicit — hard to visualize and debug with many branches.
- For flows with complex state (memory, loops, HITL), migrate to LangGraph.

### LlamaIndex Query Engines

LlamaIndex structures the pipeline around the **index + query engine** concept:

```python
# Requires: pip install llama-index
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

documents = SimpleDirectoryReader("data/").load_data()
index = VectorStoreIndex.from_documents(documents)

# Query engine with synthesis
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="tree_summarize"  # other modes: compact, refine, simple_summarize
)
response = query_engine.query("What are the approval criteria?")
print(response.response)
print(response.source_nodes)  # cited chunks
```

**LlamaIndex response modes:**

| Mode | Description | When to use |
|---|---|---|
| `compact` | Compresses chunks to max context and calls LLM once | Simple answers, low cost |
| `refine` | Iterates chunk by chunk, refining the response | High precision, many chunks |
| `tree_summarize` | Bottom-up summary tree | Very long documents |
| `simple_summarize` | Summarizes all chunks at once | Fast summaries |
| `no_text` | Returns only chunks without synthesizing | When you only need retrieval |

**LlamaIndex advantages:**
- High-level abstractions for common RAG pipelines.
- Excellent structured index support (SQL, pandas, knowledge graphs).
- `SubQuestionQueryEngine` to decompose complex questions into sub-questions.

**Disadvantages:**
- Steeper learning curve for deep customization.
- Abstractions can hide what actually happens (harder debugging).
- For complex agent logic, also delegates to LangGraph or similar.

### Decision table

| Criterion | LCEL / LangChain | LlamaIndex |
|---|---|---|
| Standard RAG pipeline (query→retrieve→synthesize) | Both good | Both good |
| Agents with tools and memory | LangChain + LangGraph | LlamaIndex Agents (more limited) |
| Advanced indexing (SQL, pandas, KG) | Good with integrations | Better native |
| Loader ecosystem | LangChain (>100 loaders) | LlamaIndex (>100 readers) |
| Integrated observability | LangSmith | LlamaIndex (Phoenix/Arize) |
| Structured output | `with_structured_output` | `output_parser` |
| RAGorbit uses in codegen | LangGraph (LangChain subset) | — |

**In RAGorbit:** codegen produces **LangGraph** (compiled state graphs), which uses LCEL internally for synthesis nodes. LlamaIndex is used mainly in M2/M4 for its excellent loader and specialized retriever support.

---

## 9. Evaluation frameworks

> **RAGAS depth in layer ③:** how to build the `Dataset`, what each metric measures, and how to connect it to the lab is in [§10.6](#106-ragas-evaluating-faithfulness-and-relevance-in-batch). Here is the comparison with TruLens, DeepEval, and promptfoo.

### RAGAS

RAGAS (Retrieval Augmented Generation Assessment) is the most widely used RAG evaluation framework. It computes the four fundamental metrics (section 6) using LLMs as judges.

```python
# Requires: pip install ragas langchain-anthropic
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

# Evaluation data: question, generated answer, retrieved chunks, ideal answer
data = {
    "question": ["What is the credit score?"],
    "answer": ["The score is 72, indicating a solid credit profile [datos_financieros.csv]"],
    "contexts": [["annual_income: 85000 [datos_financieros.csv]", "total_debt: 12000 [datos_financieros.csv]"]],
    "ground_truth": ["The calculated score is 72 based on income and debt-to-income ratio"]
}

dataset = Dataset.from_dict(data)
result = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision, context_recall])
print(result)
# → {'faithfulness': 0.92, 'answer_relevancy': 0.87, 'context_precision': 0.80, 'context_recall': 0.75}
```

**When to use RAGAS:** for batch evaluation of a RAG system in CI/CD or before a release. Not a real-time monitoring tool.

### TruLens

TruLens instruments LLM calls and evaluates each interaction in real time, building a queryable evaluation database.

```python
# Requires: pip install trulens-eval
from trulens_eval import TruChain, Feedback, Tru
from trulens_eval.feedback.provider import OpenAI as FeedbackProvider

provider = FeedbackProvider()

# Define feedback functions
f_faithfulness = Feedback(provider.groundedness_measure_with_cot_reasons).on_input_output()
f_relevance = Feedback(provider.relevance).on_input_output()

# Wrap the LangChain chain
tru_recorder = TruChain(chain, app_id="credit_scoring_v1",
                        feedbacks=[f_faithfulness, f_relevance])

with tru_recorder as recording:
    response = chain.invoke(question)

# View dashboard
Tru().run_dashboard()  # → http://localhost:8501
```

**Advantage over RAGAS:** real-time evaluation + interactive dashboard. Ideal for development environments where you want to see the impact of prompt changes immediately.

### DeepEval

DeepEval is a framework oriented to LLM unit tests — integrates with pytest to treat evaluations as tests:

```python
# Requires: pip install deepeval
import pytest
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

def test_credit_decision():
    case = LLMTestCase(
        input="Evaluate the credit application for case file 001",
        actual_output=system_response,
        retrieval_context=retrieved_chunks,
        expected_output="score: 72, decision: approve"
    )
    
    faithfulness = FaithfulnessMetric(threshold=0.8)
    relevance = AnswerRelevancyMetric(threshold=0.7)
    
    assert_test(case, [faithfulness, relevance])
```

**Advantage:** native CI/CD integration (pytest). Lets you include quality evaluations as part of the continuous integration pipeline.

### promptfoo

promptfoo evaluates prompts and models in a provider-agnostic way (works with OpenAI, Anthropic, local models, etc.) using YAML config files:

```yaml
# promptfooconfig.yaml
prompts:
  - "Evaluate the credit application: {{case_file}}"

providers:
  - anthropic:claude-opus-4-8
  - openai:gpt-4o

tests:
  - vars:
      case_file: "income: 85000, debt: 12000, on_time_payments: 97%"
    assert:
      - type: contains-json
      - type: javascript
        value: "output.score >= 70 && output.decision === 'approve'"
      - type: llm-rubric
        value: "The response explicitly cites the case file data"
```

```bash
npx promptfoo eval
```

**Advantage:** parallel model and prompt comparison. Ideal for model selection decisions or when migrating between LLM versions.

### Evaluation frameworks comparison table

| Framework | Type | CI/CD integration | Dashboard | Real time | Provider-agnostic |
|---|---|---|---|---|---|
| RAGAS | Batch/offline | Yes (via pytest) | No (exports CSV/JSON) | No | Yes |
| TruLens | Instrumentation | Partial | Yes (Streamlit) | Yes | Yes |
| DeepEval | Unit tests | Yes (native pytest) | Yes (cloud) | No | Yes |
| promptfoo | Prompt evaluation | Yes (CLI/YAML) | Yes (HTML) | No | Yes |

**Practical recommendation:**
- For **automated CI/CD**: RAGAS or DeepEval (integrate with pytest).
- For **exploration and debugging**: TruLens (real-time dashboard).
- For **model/prompt selection**: promptfoo (table comparison).
- In real production: combine TruLens (monitoring) + RAGAS (periodic evaluation).

---

## 10. Layer ③ explained: structured output and evaluation with frameworks, from scratch

> **Prerequisite:** complete layer ② of the lab (`lab/solucion_scratch.py`) — or at least understand each function you wrote by hand (`validate_schema`, `verify_groundedness`, `apply_threshold_rule`). This section teaches **only what is new in M5**: Pydantic, instructor, `with_structured_output`, and RAGAS.
>
> **LangChain base (LCEL, `|`, `ChatPromptTemplate`, chat models):** you already learned this in [M1 §11 — Layer ③ explained: LangChain from scratch](../01-fundamentos/guia.md#11-layer-③-explained-langchain-from-scratch). Here we only recall what you need for structured output; we do not re-explain LCEL from scratch.
>
> **Environment:** on the course study machine there is no `pip` or network. You will not run this code here. The goal is that, with `pip install instructor pydantic ragas langchain-anthropic` and an API key, you can **write** `lab/solucion_framework.py` yourself — not just read it.

### 10.1 Quick reminder: what you already know about LangChain (M1 §11)

In M1 you learned that LangChain wires pipelines with **LCEL** and the `|` operator:

```python
chain = template | llm | StrOutputParser()
result = chain.invoke({"question": "...", "context": "..."})
```

- **`ChatPromptTemplate`:** template with placeholders `{application}`, `{context}` — equivalent to your scratch prompt `f-string`.
- **`ChatAnthropic` / `ChatOpenAI`:** the real LLM — equivalent to your `fake_llm()` but with API.
- **`|` operator:** chains steps; each step receives the previous output.

In M5 you add a new step: instead of `StrOutputParser()` (free text), you use **`with_structured_output(MyPydanticModel)`** to get a typed object. The rest of the wiring (template, invoke) is identical to M1.

### 10.2 Bridge table: scratch → M5 frameworks

This table connects **what you already implemented by hand** in `solucion_scratch.py` with **the framework piece** in `solucion_framework.py`:

| What you did by hand (layer ②) | Framework piece (layer ③) | What problem it solves |
|---|---|---|
| Dict `SCHEMA` + `validate_schema(obj)` with `isinstance`, enums, `minItems` | **Pydantic** `BaseModel` + `Field(...)` + `@field_validator` | Declarative validation: same contract, but automatic with clear error messages |
| Parse LLM JSON with `json.loads()` and check fields | **`instructor`** `response_model=MyModel` or **`with_structured_output(MyModel)`** | LLM returns Pydantic object directly; retries if it fails |
| `verify_groundedness()` — check that `citation["source"]` exists in chunks | **RAGAS** `faithfulness` metric | Semantic groundedness with LLM-as-judge (deeper than your structural check) |
| `apply_threshold_rule()` — `if score >= 70: decision = "approve"` | **Pure Python** (same in framework) | Deterministic rule **never** goes inside the LLM — neither in scratch nor in production |
| `fake_llm()` builds output dict field by field | Real LLM + Pydantic schema | LLM reasons; schema forces output shape |

```
SCRATCH (stdlib)                         FRAMEWORK (M5)
────────────────────                     ────────────────────────────────────
SCHEMA = {...}                    ────▶  class CreditDecision(BaseModel)
validate_schema(obj)              ────▶  CreditDecision(**obj)  # or response_model
fake_llm() → dict                 ────▶  instructor / with_structured_output → CreditDecision
verify_groundedness()             ────▶  ragas.metrics.faithfulness
apply_threshold_rule()            ────▶  apply_threshold_rule()  # no changes!
```

### 10.3 Pydantic from scratch (for a Python dev)

**Pydantic** is a data validation library. If you already use type hints in Python, Pydantic turns them into **executable rules**.

#### The problem it solves

In scratch you wrote this by hand:

```python
if not isinstance(obj.get("score"), int):
    return False, "score must be int"
if obj["score"] < 0 or obj["score"] > 100:
    return False, "score out of range"
if obj["decision"] not in {"approve", "review", "reject"}:
    return False, "invalid decision"
# ... 30 more lines ...
```

With Pydantic, the same contract is **declarative**:

```python
from pydantic import BaseModel, Field, field_validator

class CreditDecision(BaseModel):
    decision: str = Field(..., description="approve, review, reject, or not_determinable")
    score: int = Field(..., ge=0, le=100)  # ge=greater-or-equal, le=less-or-equal
    factors: list[str] = Field(..., min_length=1, max_length=5)
```

#### Key pieces

| Pydantic piece | Scratch equivalent | Example |
|---|---|---|
| `BaseModel` | The dict you define as output | `class CreditDecision(BaseModel):` |
| `Field(..., ge=0, le=100)` | `minimum`/`maximum` in JSON Schema | `score: int = Field(..., ge=0, le=100)` |
| `Field(..., min_length=1)` | `minItems` / `minLength` | `factors: list[str] = Field(..., min_length=1)` |
| `Optional[int]` | Field that can be `null` | `score: Optional[int] = Field(None, ge=0, le=100)` |
| `@field_validator("decision")` | Custom enum check | Validates that `v in {"approve", "review", ...}` |
| `model_dump()` | Python `dict` of the object | `decision.model_dump()` → `{"decision": "approve", ...}` |
| `model_dump_json()` | `json.dumps(decision.model_dump())` | To save or send to RAGAS |

#### Mini-example: valid vs ValidationError

```python
from pydantic import BaseModel, Field, ValidationError

class Citation(BaseModel):
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)

# ✅ Valid — Pydantic creates the object without complaining
citation_ok = Citation(text="Annual income: $85,000", source="tax_return_2023.pdf")

# ❌ Invalid — raises ValidationError
try:
    citation_bad = Citation(text="", source="invented.pdf")  # empty text violates min_length=1
except ValidationError as e:
    print(e.errors())
    # → [{'type': 'string_too_short', 'loc': ('text',), ...}]
```

**Mental rule:** every `ValidationError` Pydantic raises is exactly what your `validate_schema()` returned as `(False, "message")` — but with field location (`loc`) and error type (`type`) already structured.

### 10.4 instructor: structured output with retries

**`instructor`** wraps the LLM client (Anthropic, OpenAI…) and turns normal calls into operations that return a **Pydantic model**.

#### What it does under the hood

```
1. You define response_model=CreditDecision
2. instructor converts the Pydantic schema into a "tool" (function) the LLM must call
3. The LLM generates the tool call with the arguments (model fields)
4. instructor parses the arguments → CreditDecision instance
5. If Pydantic validation fails → sends the error to the LLM as feedback → retries (max_retries)
```

```
  Your code                    instructor                    LLM (Claude)
  ─────────                    ──────────                    ────────────
  response_model=CreditDecision
        │
        ├──────────────────▶  converts schema to tool definition
        │                                              │
        ├──────────────────▶  messages.create(...)  ──▶│ generates tool_call
        │                                              │ with JSON fields
        │◀──────────────────  parses + validates Pydantic │
        │                                              │
        │   (if ValidationError)                       │
        ├──────────────────▶  retries with error   ──▶│ corrects fields
```

#### Minimal code (equivalent to Lab Part B)

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field

class CreditDecision(BaseModel):
    decision: str
    score: int = Field(..., ge=0, le=100)
    factors: list[str] = Field(..., min_length=1)
    citations: list[dict] = Field(..., min_length=1)

client = instructor.from_anthropic(Anthropic())

decision = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=2048,
    messages=[{"role": "user", "content": prompt_with_chunks}],
    response_model=CreditDecision,
    max_retries=3,  # up to 3 retries if Pydantic rejects the response
)
# decision is already CreditDecision — no need for json.loads()
```

**Connection to §2:** instructor uses **tool-calling** under the hood (mechanism ① from section 2). The difference is you do not write the tool by hand: instructor generates it from your Pydantic model.

### 10.5 LangChain `with_structured_output`: the LCEL alternative

If you already use LangChain in the pipeline (M1 §11), structured output fits LCEL without an extra library:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.1)
structured_llm = llm.with_structured_output(CreditDecision)  # ← new piece in M5

template = ChatPromptTemplate.from_messages([
    ("system", "You are a credit analyst. Respond ONLY with the documents."),
    ("human", "Application: {application}\n\nDocuments:\n{context}")
])

chain = template | structured_llm   # same LCEL pattern from M1 §11
decision = chain.invoke({"application": application, "context": context_chunks})
# decision is CreditDecision
```

#### What it does under the hood

`with_structured_output` also uses **tool-calling**: it sends the Pydantic schema as a function definition to the provider. Difference from instructor:

| Aspect | instructor | `with_structured_output` |
|---|---|---|
| Integration | Direct Anthropic/OpenAI client | Inside LCEL chain (`template \| structured_llm`) |
| Retries with validation feedback | Native (`max_retries=3`) | Depends on version/config; less explicit |
| LangSmith tracing | Requires extra callbacks | Native if using LangChain |
| When to choose | You only need structured output | You already have retriever + LangChain chain |

**Connection to §8:** the "Structured output" row in the LCEL vs LlamaIndex table points here. LlamaIndex has an equivalent `output_parser`; in RAGorbit codegen uses LangChain/LangGraph.

### 10.6 RAGAS: evaluating faithfulness and relevance in batch

**RAGAS** computes RAG metrics (§6) using LLMs as judges. Your scratch `verify_groundedness()` checks that sources exist; RAGAS goes further and asks: *is response content semantically backed by the chunks?*

#### How to build the Dataset

RAGAS expects a `datasets.Dataset` with fixed columns:

```python
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

data = {
    "question":     [question],            # the user's request
    "answer":       [response_str],        # the generated decision (as string/JSON)
    "contexts":     [list_of_chunks],      # texts of retrieved chunks
    "ground_truth": [ideal_response],      # known correct answer (for some metrics)
}
dataset = Dataset.from_dict(data)
result = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])
```

#### What each metric measures (the three from the lab)

| RAGAS metric | Question it answers | Approximate scratch equivalent | Needs `ground_truth` |
|---|---|---|---|
| **faithfulness** | Are response claims backed by chunks? | `verify_groundedness()` but semantic | No |
| **answer_relevancy** | Does the response answer the question asked? | (not measured in scratch) | No |
| **context_precision** | Are retrieved chunks relevant to the question? | Retriever quality (M4) | Yes |

**Important gotcha:** `context_precision` and `context_recall` **require `ground_truth`** — a known ideal answer for comparison. Without ground truth, RAGAS cannot compute them. `faithfulness` and `answer_relevancy` work without ground truth.

**Connection to §9:** the RAGAS vs TruLens vs DeepEval comparison still holds. RAGAS is for **batch** evaluation (CI/CD, releases); not real-time monitoring.

### 10.7 Block-by-block walkthrough of `lab/solucion_framework.py`

Open [`lab/solucion_framework.py`](./lab/solucion_framework.py) and follow this map:

```
Part A ──▶ Part B ──▶ Part E ──▶ Part D
(schema)    (instructor)  (rule)     (RAGAS)
                │
                └──▶ Part C (LangChain alternative)
                         │
                         └──▶ Part F (full pipeline)
```

#### Part A — Schema with Pydantic

```python
class Citation(BaseModel):
    text: str = Field(..., min_length=1, description="Literal fragment from the document")
    source: str = Field(..., min_length=1, description="File name")

class CreditDecision(BaseModel):
    decision: str = Field(...)
    score: Optional[int] = Field(None, ge=0, le=100)
    factors: list[str] = Field(..., min_length=1, max_length=5)
    citations: list[Citation] = Field(...)
    # ...
    @field_validator("decision")
    @classmethod
    def valid_decision(cls, v):
        if v not in {"approve", "review", "reject", "not_determinable"}:
            raise ValueError(...)
        return v
```

**Why:** this replaces your `SCHEMA` dict + `validate_schema()`. `@field_validator` covers enums that JSON Schema expresses with `"enum"` but need custom messages (like `"MAYBE"` → clear error). `Optional[int]` allows `score=None` in the `not_determinable` case — same as scratch.

#### Part B — instructor + Claude

**Why:** in production you do not have `fake_llm()`. The real LLM reads chunks and produces `CreditDecision`. `max_retries=3` catches format errors that in scratch would have made `validate_schema()` fail.

#### Part C — LangChain `with_structured_output`

**Why:** same output as Part B, but integrated in LCEL. If your pipeline already has `retriever | template | ...`, only change the last link to `structured_llm`. Natural option if you come from M1 §11.

#### Part D — Evaluation with RAGAS

**Why:** after generating the decision, you want to **measure** whether the LLM hallucinated (`faithfulness`) or answered the question (`answer_relevancy`). In CI/CD you would write:

```python
assert metrics["faithfulness"] >= 0.80
```

#### Part E — Deterministic rule (pure Python)

```python
def apply_threshold_rule(decision: CreditDecision) -> CreditDecision:
    if decision.decision == "not_determinable" or decision.score is None:
        return decision
    if decision.score >= 70:
        decision.decision = "approve"
    elif decision.score >= 40:
        decision.decision = "review"
    else:
        decision.decision = "reject"
    return decision
```

**Why:** this function is **identical in spirit** to your scratch `apply_threshold_rule()`. Frameworks do not change this piece. The judge/arbitrator pattern (§4) holds: LLM produces score → Python applies threshold.

#### Part F — Full pipeline

Execution order:

```
1. evaluate_credit_with_instructor(chunks, application)  → CreditDecision (tentative)
2. apply_threshold_rule(decision)                        → corrected decision
3. evaluate_with_ragas(...)                              → quality metrics
```

Framework equivalent of your scratch `main()`: fake_llm → validate → groundedness → rule.

### 10.8 When to use instructor vs `with_structured_output` vs JSON-mode

| Criterion | instructor | `with_structured_output` | JSON-mode |
|---|---|---|---|
| You already use LangChain in the pipeline | Less natural | **Better** | Requires manual parser |
| You only need structured output | **Better** (minimal) | LangChain overhead | Only if schema very simple |
| Automatic retries with feedback | **Native** (`max_retries`) | Variable | No |
| Strict schema validation | Yes (Pydantic) | Yes (Pydantic) | **No** (syntax-only JSON) |
| LangSmith / tracing | Extra callbacks | **Native** | Manual |
| Models without tool-calling | With retries | Not available | **Only option** |

#### Gotchas you should know

1. **Retries consume tokens.** Each `ValidationError` that triggers a retry is another LLM call. In production, an overly strict schema (e.g. `justification` with `min_length=500`) can multiply costs. Balance rigor vs latency.

2. **The deterministic rule NEVER goes inside the LLM.** Neither instructor nor `with_structured_output` should evaluate `score >= 70`. That is `apply_threshold_rule()` in pure Python (Part E). Delegating thresholds to the LLM violates ECOA/Reg B and introduces non-determinism (§4).

3. **RAGAS needs `ground_truth` for some metrics.** `context_precision` and `context_recall` do not work without an ideal answer. For continuous evaluation without ground truth, use `faithfulness` + `answer_relevancy`.

4. **Pydantic validates shape, not truth.** An object with `citations=[{"text": "abc", "source": "invented.pdf"}]` can pass Pydantic if types are correct. That is why you need RAGAS `faithfulness` in addition to schema — same as scratch needed `verify_groundedness()` in addition to `validate_schema()`.

5. **The `not_determinable` case is business logic, not framework logic.** If there is no evidence, your code (not the LLM) must decide to return `decision="not_determinable"` before calling structured output — or explicitly instruct the LLM in the prompt (as the lab does).

### 10.9 How to practice: from scratch to framework

```
Step 1  Complete lab/solucion_scratch.py (layer ②, stdlib)
           │
Step 2  Read this section §10 completely
           │
Step 3  Follow the layer ③ guided task in lab/enunciado.md
           │
Step 4  Write your solucion_framework.py (or copy section by section
        from the reference file, understanding each block)
           │
Step 5  Compare your version with lab/solucion_framework.py
```

**Cross-links:**
- Design concepts (why structured output): [§2](#2-structured-output)
- LCEL vs LlamaIndex (where `with_structured_output` fits): [§8](#8-lcel-vs-llamaindex-query-engines-comparison)
- Evaluation frameworks comparison: [§9](#9-evaluation-frameworks)
- Layer ③ guided lab: [`lab/enunciado.md`](./lab/enunciado.md)
- Reference solution: [`lab/solucion_framework.py`](./lab/solucion_framework.py)

---

## 11. Module summary and checkpoint

### What you learned in this module

1. **`logic.prompt`** synthesizes with context. A good template has system + chunks with sources + request + instruction to cite.

2. **`logic.structured`** forces JSON output validated against schema. The four mechanisms are: tool-calling (most robust), JSON-mode (simple), instructor (retries + Pydantic), outlines (formal guarantee, local only).

3. **`logic.citations`** is the last line of defense against hallucinations. In `enforce` mode it blocks responses without citation. Groundedness = every claim anchors in a retrieved chunk.

4. **`logic.rules`** applies deterministic rules. Business thresholds (scores, dates, amounts) are NEVER decided by the LLM. The pattern is: LLM reasons and produces data → deterministic rule decides.

5. **`logic.router`** branches flow based on decision. Used after `logic.rules` or `query.intent`.

6. **RAG evaluation:** four metrics — faithfulness (did the LLM hallucinate?), answer relevance (does it answer the question?), context precision (are chunks relevant?), context recall (was everything necessary retrieved?).

7. **LCEL vs LlamaIndex:** LCEL is more flexible for complex agents; LlamaIndex has better abstractions for simple RAG pipelines and structured indexing.

8. **Evaluation frameworks:** RAGAS (batch), TruLens (real time), DeepEval (pytest), promptfoo (model/prompt comparison).

9. **Layer ③ (frameworks):** Pydantic validates the contract; instructor / `with_structured_output` obtain structured output from the LLM; RAGAS measures faithfulness; deterministic rule stays in pure Python. See [§10](#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch).

### You know it if you can...

- [ ] Design the JSON schema for a credit decision with citations.
- [ ] Explain why the `score >= 70` threshold must not be evaluated by the LLM.
- [ ] Distinguish faithfulness from context recall (two very different metrics).
- [ ] Choose between RAGAS and TruLens for a given use case.
- [ ] Write the Pydantic schema for a credit decision and explain what it replaces from scratch `validate_schema()`.
- [ ] Distinguish when to use instructor vs `with_structured_output` vs JSON-mode.

- [ ] Recognize which RAGorbit node hosts each logic piece in templates 02, 03, 04, and 08.

### What to review

- If you have questions about JSON Schema: read the specification at [json-schema.org](https://json-schema.org).
- If the faithfulness concept is unclear: practice the lab groundedness exercise.
- If the LCEL/LlamaIndex difference is fuzzy: implement the same pipeline in both (exercise 18).
- If layer ③ feels "magical": read [§10](#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch) and do the guided task in [`lab/enunciado.md`](./lab/enunciado.md#layer-③--framework-guided-task).

### Connections to other modules

- **M4 (retrieval):** context precision and recall directly measure retrieval quality.
- **M6 (agents):** `agent.react` can use `logic.structured` as post-processor of its final response.
- **M9 (production):** `observability.audit` records every `logic.structured` decision for regulatory traceability.
- **M11 (capstone):** in templates 02 and 04, you will rebuild the full structured decision pipeline.

---

*Next: [Exercises 14–21](./ejercicios.md) · [Lab](./lab/enunciado.md)*

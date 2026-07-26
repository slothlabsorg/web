# Solutions — Module 5 · Generation, logic, and evaluation

---

## E14 · Reasoned multiple choice — Structured output

### Question 1 → **b)**

**Correct answer: b) Tool-calling with a JSON schema that defines `"minItems": 1` on `citations`.**

The reason: JSON Schema with `"minItems": 1` is part of the formal contract that the provider (Anthropic, OpenAI) enforces at generation time when using tool-calling. Answer a) (JSON-mode) only guarantees syntactically valid JSON, not semantic schema compliance. Answer c) (instruction in the prompt) can be forgotten by the LLM — it is not a guarantee. Answer d) is incomplete: the combination of tool-calling + `minItems` is the closest guarantee to "never empty", although in an extreme case a model could hallucinate `"citations": [{}]` (empty objects), for which you also add `"required": ["text", "source"]` on each object.

In practice, for the no-evidence case you add explicit logic: if chunks are empty → do not call the LLM → return directly `{"citations": [], "decision": "undetermined"}` skipping `logic.structured`.

### Question 2 → **a)**

**Correct answer: a) To save LLM tokens when the rules can already reject the claim.**

In template 04, `logic.rules` first checks **pure deterministic** conditions (does the damage amount exceed the deductible? is the policy in force? does an exclusion apply?). If any rejection condition is met, the LLM is never called — latency and cost are saved. b) is incorrect: `logic.rules` does not read citations from `logic.structured` (it runs before). c) is incorrect: `model.vision` is called in the loader, not here. d) is incorrect: `logic.structured` can receive chunks directly.

### Question 3 → **b)**

**Correct answer: b) `instructor` validates post-generation and retries; `outlines` guides generation token by token.**

This is the fundamental architectural difference. `instructor` calls the LLM normally, tries to parse and validate the response against the Pydantic model, and if it fails resends the error to the LLM as feedback so it can correct (retry loop). `outlines` modifies the generation process itself: at each generation step, it only allows tokens compatible with the current schema state — invalid output is impossible by construction. a) is incorrect: `instructor` supports multiple providers (Anthropic, OpenAI, Gemini...). c) is incorrect: `instructor` retries add latency. d) is incorrect in both directions.

---

## E15 · Design the JSON schema for a credit decision

### Task A — Complete JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["score", "decision", "factors", "justification", "citations"],
  "additionalProperties": false,
  "properties": {
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Credit risk score calculated by the LLM"
    },
    "decision": {
      "type": "string",
      "enum": ["approve", "review", "reject"],
      "description": "Tentative LLM decision; will be overwritten by logic.rules"
    },
    "factors": {
      "type": "array",
      "items": {"type": "string", "minLength": 1},
      "minItems": 1,
      "maxItems": 5,
      "description": "Main factors supporting the score"
    },
    "justification": {
      "type": "string",
      "minLength": 50,
      "description": "Narrative reasoning for the score"
    },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["text", "source"],
        "additionalProperties": false,
        "properties": {
          "text": {"type": "string", "minLength": 1},
          "source": {"type": "string", "minLength": 1}
        }
      },
      "minItems": 1,
      "description": "Documentary evidence supporting the factors"
    },
    "risk_level": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Qualitative risk classification (optional)"
    }
  }
}
```

### Task B — Why include `decision` if `logic.rules` overwrites it

**Reason 1 — LLM integrity validation:** if the LLM emits `"decision": "MAYBE"`, the schema rejects it immediately with a clear error before reaching `logic.rules`. Without the schema, `logic.rules` would receive an object with an invalid field, which could cause a silent error or unexpected behavior.

**Reason 2 — Comparative audit:** having the LLM's tentative `decision` alongside the final `decision` from `logic.rules` lets you detect systematic discrepancies. If the LLM says "reject" and the rule says "approve" (score right at the threshold, e.g. 70), that pattern is useful for adjusting prompts or thresholds.

**Reason 3 — Contract consistency:** the schema defines the complete decision object. `logic.rules` receives it as input and returns it modified — it is cleaner to have the field defined from the start than to add it later.

### Task C — LLM emits `"APPROVE"` instead of `"approve"`

Schema validation **fails** because `"APPROVE"` is not in the enum `["approve", "review", "reject"]`. The `logic.structured` node raises an error before propagating the object.

**How to handle it:**

1. **With `instructor`:** the validation error is sent to the LLM as feedback. The retry prompt says something like: "The `decision` field must be one of `approve`, `review`, `reject` (lowercase). Your previous response used uppercase. Correct it and return only the JSON."

2. **In the synthesis prompt:** add an explicit instruction: `"The decision field MUST be exactly one of these three lowercase values: approve, review, reject"`.

3. **Defensive normalization:** in post-processing code, apply `.lower()` to the decision field before schema validation (but this hides the problem instead of fixing it at the source).

The most robust option in production is (1) + (2): clear instruction in the prompt + automatic retries with validation feedback.

---

## E16 · What the LLM decides vs deterministic rules

| Item | Who decides | Reasoning |
|---|---|---|
| a) debt-to-income ratio > 50%? | **Deterministic rule** | Pure arithmetic: `total_debt / annual_income > 0.5`. The result is 100% reproducible and requires no interpretation. |
| b) Signs of job instability? | **LLM** | Requires interpreting heterogeneous text (termination letters, frequent employer changes, employment gaps) and combining ambiguous signals that have no exact formula. |
| c) Score 72 ≥ threshold 70? | **Deterministic rule** | Integer comparison. The LLM must never evaluate business thresholds with legal or financial consequences (ECOA, Reg B). |
| d) What risk factors emerge from 6 months of account statements? | **LLM** | Requires synthesis and interpretation of multiple transactions, behavior patterns, and context. |
| e) Policy in force on claim date? | **Deterministic rule** | Date comparison: `policy_start_date <= claim_date <= policy_end_date`. Deterministic and critical for system correctness. |
| f) Is the photograph consistent with the description? | **LLM** (with `model.vision`) | Requires visual and semantic reasoning that no deterministic rule can encode. |
| g) Amount 1700 > deductible 500? | **Deterministic rule** | Subtraction and comparison: `estimated_amount - deductible > 0`. Must be deterministic to guarantee the calculated payment is always the same given the same input. |
| h) Which clause applies to the type of damage? | **LLM** (with mandatory citations) | Requires semantic understanding of policy text and damage type. Mandatory citation ensures the LLM does not invent the clause. |

**General pattern:** if the operation is arithmetic, date comparison, or lookup of a known value → deterministic rule. If it requires natural language interpretation, synthesis of multiple ambiguous signals, or semantic reasoning → LLM (with citations).

---

## E17 · Find the bug — Groundedness and evaluation

### Bug 1 — `calculate_score` always returns 75

**Problem:** the function ignores the `chunks` received and returns a hardcoded value. This makes the system always approve (75 ≥ 70) regardless of file content. It is the equivalent of a credit system that approves everyone.

**Fix:** implement a function that calculates the score from data in the chunks (or, in a deterministic fake LLM, parse it from available numeric data).

### Bug 2 — Incorrect threshold in the review rule

**Problem:** the condition `elif score > 40` applies to scores 41–69 AND also to score exactly 40 if you used `>=`, but with `>` score 40 would fall through to `else` (reject) when it should be "review" (40–69). Template 02 defines the range as `40–69 → review`, which implies `score >= 40 AND score < 70`.

**Fix:**
```python
if score >= 70:
    decision = "approve"
elif score >= 40:   # covers 40-69 inclusive
    decision = "review"
else:
    decision = "reject"
```

### Bug 3 — `citations: []` (empty array)

**Problem:** citations are an empty array even though `chunks` contain explicit evidence. Without citations, the decision cannot be audited — there is no traceability from factor to source document. It is like a medical opinion without bibliographic references.

**Impact:** a schema with `"minItems": 1` on `citations` would reject this object. The `logic.citations` node in `enforce` mode would block the response.

### Bug 4 — `verify_groundedness` only checks that `citations` is not empty

**Problem:** the function verifies `len(citations) > 0`, but does not check whether citations are backed by real chunks. It could have `"citations": [{"text": "abc", "source": "invented.pdf"}]` and pass verification.

**Real groundedness:** for each citation, verify that its `text` appears (literally or semantically) in one of the context chunks.

### Answer B — `logic.citations` in `enforce` mode with `citations: []`

The node rejects the response and raises an actionable error like:
```json
{
  "error": "citations_required",
  "message": "The decision does not contain verifiable citations. At least one citation backed by retrieved chunks is required."
}
```

The decision never reaches `logic.rules` or `io.output`. The pipeline fails with an explicit error instead of propagating non-auditable data.

### Answer C — Why Bug 4 is incorrect

Checking `len(citations) > 0` only verifies that the structure exists, not that it is valid. An LLM can fabricate plausible citations that do not correspond to any real chunk. Correct verification must:

1. For each entry in `citations`, check whether `citation["text"]` appears literally in some chunk.
2. Or (semantic verification) compute similarity between citation text and chunks.
3. If no citation matches any real chunk, the response is not "grounded" even though `citations` is not empty.

### Answer D — Fix for Bug 3

```python
def generate_decision(score, chunks):
    if score >= 70:
        decision = "approve"
    elif score >= 40:
        decision = "review"
    else:
        decision = "reject"
    
    # Build real citations from chunks
    citations = []
    for chunk in chunks:
        citations.append({
            "text": chunk["text"][:100],  # first representative fragment
            "source": chunk["source"]
        })
    
    return {
        "score": score,
        "decision": decision,
        "factors": [
            f"Data verified in {chunk['source']}" for chunk in chunks
        ],
        "citations": citations  # now non-empty with real sources
    }
```

---

## E18 · Choose the technology — Evaluation and frameworks

### Scenario A → **DeepEval**

DeepEval is best suited for CI/CD with GitHub Actions because it integrates natively with pytest. You can define a test with `FaithfulnessMetric(threshold=0.80)` and the test fails if the metric does not reach the threshold. The CI pipeline simply runs `pytest tests/eval/` and the job fails if quality drops below the defined threshold. RAGAS is also viable (it produces JSON you can read with assertions), but DeepEval requires less glue code.

### Scenario B → **TruLens**

TruLens is designed exactly for this case: you instrument your chain with `TruChain` and each LLM call is recorded and evaluated. The Streamlit dashboard shows immediately how quality changed in the last 50 conversations after the prompt change. RAGAS would require exporting data and running evaluation manually, which breaks the fast exploration flow.

### Scenario C → **promptfoo**

promptfoo is best for model comparison. You define both providers (`anthropic:claude-opus-4-8` and `openai:gpt-4o`) in the YAML config, list the 200 test cases as `tests`, and `npx promptfoo eval` runs all cases on both models and produces a comparative table with metrics. No additional Python code required. RAGAS also works but promptfoo is more optimized for multi-provider comparison.

### Scenario D → **RAGAS**

For periodic batch evaluation, RAGAS is the natural choice. You can build a dataset with the week's conversations, run `evaluate()`, and record metrics in a monitoring database (or in LangSmith). It has less overhead than TruLens (which instruments in real time and accumulates data continuously). TruLens would also work but has more infrastructure overhead for a nightly batch job.

### Scenario E → **DeepEval**

For custom metrics that must integrate with pytest, DeepEval is the only one of the four that supports `BaseMetric` as a base class for custom metrics:

```python
from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase

class ContainsNumberMetric(BaseMetric):
    def __init__(self, threshold=1.0):
        self.threshold = threshold
    
    def measure(self, test_case: LLMTestCase) -> float:
        import re
        has_number = bool(re.search(r'\d+', test_case.actual_output))
        return 1.0 if has_number else 0.0
    
    @property
    def is_successful(self) -> bool:
        return self.score >= self.threshold
    
    @property
    def name(self) -> str:
        return "contains_number"
```

---

## E14b · Predict the output — `logic.router`

- **Case 1** `{"score": 72, "decision": "approve"}`: branch **`approval_notification`** — `score >= 70 and decision == 'approve'` is satisfied.
- **Case 2** `{"score": 55, "decision": "review"}`: branch **`review_queue`** — `decision == 'review'` is satisfied.
- **Case 3** `{"score": 72, "decision": "review"}`: branch **`review_queue`** — even though the score is 72 (which should approve), the condition `decision == 'approve'` is not satisfied because `logic.rules` has not run yet and the LLM emitted "review". It routes incorrectly to the review queue.

**What Case 3 reveals:** execution order is critical. `logic.rules` MUST run before `logic.router`. The router must read `decision` **after** deterministic rules have corrected it. If the router runs with the LLM's tentative decision, a case that should auto-approve can be routed incorrectly. The correct pipeline is:

```
logic.structured → logic.rules → logic.router
(tentative LLM)  (corrected by rules) (branches on final decision)
```

---

## E15b · RAG metrics — Diagnosis

### Answer A — Bottleneck

The bottleneck is in **synthesis / generation**, not retrieval. Indicators:

- `context_precision: 0.85` → retriever brings relevant chunks (little noise).
- `context_recall: 0.78` → retriever recovers most of what is needed.
- `faithfulness: 0.91` → LLM does not hallucinate (respects chunks).
- `answer_relevancy: 0.62` → the answer does not respond well to the question!

If retrieval works well (reasonable precision and recall) and the LLM is faithful to context (high faithfulness), but the answer is not relevant, the problem is in how the answer is formulated or how the question is understood.

### Answer B — Two likely causes of low `answer_relevancy`

**Cause 1 — The synthesis prompt is not instructing the LLM to answer the specific question.** The LLM may be synthesizing chunks faithfully but producing a generic summary instead of answering directly what was asked. Investigation: review the `logic.prompt` template — does it explicitly include `{question}` in the prompt? Does the instruction say "answer question X" or only "synthesize the context"?

**Cause 2 — The intent/query module is not reformulating the question well.** In template 03, the agent may reformulate the question before passing it to the retriever. If reformulation loses the original intent, the LLM receives a different question and answers that reformulated version. Investigation: log the reformulated query and compare it to the original question to detect intent loss.

### Answer C — Impact of raising `topK` from 5 to 10

**Metrics that would improve:**
- `context_recall` (likely): more chunks = higher probability of capturing everything needed. If relevant chunks were outside the top-5, they will now be included.

**Metrics that might worsen:**
- `context_precision` (likely): more chunks = higher risk of including irrelevant chunks (denominator grows faster than numerator). Going from 5 to 10 chunks usually lowers precision.
- `faithfulness` (possibly): more chunks and more noise can confuse the LLM, increasing the risk that it synthesizes information from irrelevant chunks as if it were relevant.

**Practical rule:** raising `topK` improves recall but sacrifices precision. The optimal balance depends on the domain: in healthcare, where a missing chunk can change a clinical decision, high recall is preferred even if precision drops (and more context noise is tolerated).

---

## E19 · Predict whether Pydantic raises ValidationError

### A → **Passes**

All fields comply: `decision` in the enum, `score` in [0, 100], one factor, justification ≥ 50 characters, at least one valid `Citation`.

### B → **ValidationError** (in `@field_validator("decision")`)

`"APPROVE"` is not in `{"approve", "review", "reject", "undetermined"}`. The validator raises `ValueError("invalid decision")`, which Pydantic wraps as `ValidationError`. Same case as E15 Task C: in scratch `validate_schema()` would return `(False, "...")`; with `instructor`, it would trigger a retry.

### C → **ValidationError** (`score=150`)

`score=150` violates `ge=0, le=100`. Even though `citations=[]` is syntactically valid in this model (no `min_length=1`), the out-of-range score is enough to fail. In the real lab, the `undetermined` case uses `score=None`, not an invalid integer.

### D → **ValidationError** (`factors` with 6 elements)

`max_length=5` on `factors` limits to 5 elements; there are 6 (`f1`…`f6`). Equivalent to `"maxItems": 5` in JSON Schema from E15.

---

## E20 · Complete the Field with the correct constraints

### Question A — Correct values

```python
score: int = Field(..., ge=0, le=100)
factors: list[str] = Field(..., min_length=1, max_length=5)
justification: str = Field(..., min_length=50)
citations: list[Citation] = Field(..., min_length=1)
```

### Question B — `list[Citation]` vs `list[dict]`

`list[Citation]` requires that **each element** of the list be a validated `Citation` object (with non-empty `text` and `source`). With `list[dict]`, Pydantic only checks that it is a list of dictionaries — a `{"text": "", "source": "x"}` could slip through.

Advantage over scratch `validate_schema()`: nested validation is automatic. In scratch you must manually iterate over `citations` and check each sub-field; with Pydantic, nested `Citation` inside `CreditDecision` does it on instantiation.

---

## E21 · Scratch → framework mapping and RAGAS metric

### Question A — Completed table

| Scratch function | Framework equivalent | Does it change with the framework? |
|---|---|---|
| `validate_schema(obj)` | Instantiate `CreditDecision(**obj)` or implicit validation in `response_model` | Yes — declarative with Pydantic |
| `fake_llm(chunks, request)` | `evaluate_credit_with_instructor()` or `evaluate_credit_with_langchain()` | Yes — real LLM + structured output |
| `verify_groundedness(obj, chunks)` | RAGAS `faithfulness` (semantic batch evaluation) | Yes — deeper; does not replace structural runtime check |
| `apply_threshold_rule(obj)` | `apply_threshold_rule(decision)` — **same Python code** | **No** — remains deterministic logic outside the LLM |

### Question B — RAGAS metric

**`faithfulness`** detects that the response claims ($250,000, 15 years) are not backed by the chunks ($85,000, 6 years).

The Pydantic schema is not enough because it validates **shape** (types, ranges, enums), not **truth**. A perfectly valid JSON can contain invented data. That is why in production you combine: Pydantic (contract) + groundedness/faithfulness (content).

### Question C — instructor vs `with_structured_output`

1. **You only need structured output** without a retriever or LangChain chain — instructor is more direct (`client.messages.create` + `response_model`).
2. **You want explicit retries** with validation feedback (`max_retries=3`) without configuring LangChain callbacks.

Valid alternative: if you already have an LCEL pipeline (M1 §11) with retriever + template, `with_structured_output` is more natural for consistency and LangSmith integration.

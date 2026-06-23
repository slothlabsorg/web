# Solution — Lab M5 · Structured decision with citations

---

## ① Design/concept — what this lab does and why

This lab implements the core of `logic.structured + logic.rules + logic.citations` from template 02 (banking). The pipeline has five clear responsibilities:

| Responsibility | Who fulfills it | RAGorbit equivalent |
|---|---|---|
| Extract data from chunks and calculate score | `fake_llm()` | `logic.structured` with real LLM |
| Ensure output meets the JSON contract | `validar_schema()` | JSON Schema in `logic.structured` |
| Ensure citations are real (not invented) | `verificar_groundedness()` | `logic.citations` in `enforce` mode |
| Apply the deterministic threshold | `aplicar_regla_umbral()` | `logic.rules` |
| Handle the no-evidence case | Condition in `fake_llm()` | Guard logic in `logic.structured` |

The separation between these five functions is not just organizational — it is a correctness guarantee:

- If the schema fails, the pipeline stops before applying the rule (does not propagate corrupt data).
- If groundedness fails, the pipeline stops before returning the decision (does not propagate hallucinations).
- The threshold rule ONLY runs on validated, grounded objects.

---

## ② From scratch — explanation of the scratch implementation

### `fake_llm()` — the heart of the lab

The function simulates what an LLM would do with structured output. In a real system, the LLM would read chunk text and reason about risk factors. In our deterministic implementation:

1. **Extracts data from structured metadata** in chunks (`_extraer_numerico()`). This works because sample chunks have `metadata` with numeric values already parsed. In a real system, the LLM would do this parsing by reading free text.

2. **Applies the score formula.** The formula normalizes four dimensions to ranges [0, 30], [0, 30], [0, 25], and [0, 15] respectively. The weights reflect the relative importance of each factor in real credit evaluation (income and debt-to-income ratio are most important).

3. **Builds factors and citations** by iterating over chunks. Each chunk with numeric data contributes a factor and a citation. This is the crucial part: citations are built from real chunks, not invented.

4. **Handles the no-evidence case** by counting how many key numeric values it could extract. With fewer than 2 values (or without income), it returns the `no_determinable` object.

### `validar_schema()` — validation without jsonschema

Implementing JSON Schema validation from scratch with stdlib requires verifying:
- Presence of required fields (`for campo in SCHEMA["required"]`).
- Correct types (`isinstance()`).
- Enum values (`if v not in valid_values`).
- Numeric constraints (`minimum`, `maximum`).
- Array constraints (`minItems`).

This implementation covers 90% of typical RAG schemas. For more complex schemas (patternProperties, $ref, allOf/anyOf/oneOf), using the third-party `jsonschema` library is more robust.

### `verificar_groundedness()` — the most important check

The check verifies that the `source` of each citation exists in the set of available chunks. This is a **structural** verification, not semantic: it does not check whether citation text is a precise paraphrase of the chunk, only that it points to a real source.

For production with real LLMs, semantic verification (is citation text backed by the chunk?) is what RAGAS computes as `faithfulness`. The structural verification in this lab is the prior step.

### `aplicar_regla_umbral()` — the principle of not delegating to the LLM

The function is intentionally simple: three conditions and a default. It has no state, no side effects, does not call the LLM. Given the same score, it always produces the same decision.

The `_decision_llm_original` field records the LLM's tentative decision for audit. In production, this field would feed discrepancy analysis: if the LLM says "revisar" and the rule says "aprobar" (score exactly at the 70 limit), that discrepancy is informative for adjusting prompts or thresholds.

---

## ③ Framework — how it is done in production

> **Full layer ③ teaching:** read [guide §10](../guia.md#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch) before this section. LangChain basics (LCEL, `ChatPromptTemplate`) are in [M1 §11](../../01-fundamentos/guia.md#11-layer-③-explained-langchain-from-scratch). The [guided task](./enunciado.md#layer-③--framework-guided-task) in the lab brief asks you to **write** the framework solution, not just read it.

### Pydantic + instructor

`solucion_framework.py` shows the production approach in six parts (A–F). The block-by-block walkthrough is in [guide §10.7](../guia.md#107-block-by-block-walkthrough-of-labsolucion_frameworkpy).

**Pydantic (schema):** defines the contract with explicit validators (`@field_validator`). The advantage over manual JSON Schema is that validation errors include field context and the received value — easier debugging.

**instructor (structured output):** wraps the Anthropic/OpenAI API and turns calls into operations that return the Pydantic type directly. The `max_retries=3` parameter means that if the LLM emits JSON that fails Pydantic validation, instructor resends the error as feedback to the LLM and tries again. This catches 90%+ of format errors.

**LangChain LCEL (`with_structured_output`):** alternative that uses tool-calling internally. The difference from instructor is that LCEL is more integrated with the LangChain ecosystem (easy to combine with retrievers, chains, etc.), while instructor is more minimal and works well when you only need structured output without the rest of the ecosystem.

**RAGAS:** evaluates `faithfulness` (are citations in the chunks?) and `answer_relevancy` (does the response answer the question?). In CI/CD, you would include these metrics as assertions:

```python
assert metricas["faithfulness"] >= 0.80, "Faithfulness por debajo del umbral"
assert metricas["answer_relevancy"] >= 0.70, "Answer relevancy por debajo del umbral"
```

### When to use each approach

| Criterion | instructor | LCEL + with_structured_output |
|---|---|---|
| You only need structured output | Better | Additional overhead |
| You already use LangChain in the rest of the pipeline | Less natural | Better (consistency) |
| You want retries with feedback | Native | Requires more configuration |
| You want LangSmith tracing | Only if you add callbacks | Native |
| Local models (Ollama, HF) | Yes (with appropriate provider) | Yes |

---

## Frequently asked questions

**Why is the score for file 001 84 and not some other number?**

```
comp_ingreso    = min(85000/100000, 1.0) * 30  = 0.85 * 30   = 25.50
comp_deuda      = max(1 - 12000/85000, 0) * 30 = 0.8588 * 30 = 25.76
comp_pagos      = (97/100) * 25                              = 24.25
comp_antiguedad = min(6/10, 1.0) * 15          = 0.6 * 15    = 9.00
                                                       total = 84.51
score = int(84.51) = 84
```

**Why is file 002 `no_determinable` if it has income of $31,000 in 2022?**

Because that income is in the chunk **text**, not in `metadata` with key `ingreso_anual`. The `_extraer_numerico()` function only reads structured metadata. In a system with a real LLM, the model would read the text and extract the value; in our deterministic fake, we depend on structured metadata. This is intentional: it illustrates that pipeline quality depends on ingestion pipeline quality (well-labeled metadata).

**What would happen if the LLM emitted `"decision": "APROBAR"` in uppercase?**

Enum validation in `validar_schema()` would fail:
```
Error: 'decision' debe ser uno de ['aprobar', 'revisar', 'rechazar', 'no_determinable'], pero es 'APROBAR'
```
The pipeline would return `{"error": "schema_invalido", "detalle": "..."}` and would not reach the threshold rule. With `instructor`, this would trigger a retry with the error message as feedback to the LLM.

---

## Connections to the templates

- **Template 02 (banking):** this lab implements exactly the core of that template. In production, `fake_llm()` → Claude with `logic.structured`, `validar_schema()` → RAGorbit runtime, `aplicar_regla_umbral()` → `logic.rules`.

- **Template 04 (insurance):** same pattern but with `logic.rules` before `logic.structured` (deterministic eligibility rules apply first). The schema would be `{cubierto, monto_estimado, deducible_aplicado, clausula_aplicada, razon}`.

- **Template 03 (healthcare):** the `no_determinable` case is analogous to `criterio_no_encontrado == true` → escalation to `hitl.escalate`. The escalation decision is also not made by the LLM: the HITL node condition makes it.

- **Template 08 (manufacturing):** the groundedness check is `logic.citations` in `enforce` mode. If the AMM does not have the procedure indexed, the response fails with an explicit error instead of hallucinating it.

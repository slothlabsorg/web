# Lab M5 · Structured decision with citations for credit evaluation

## Business context

You are the ML engineer on the credit origination team at **FinBank**. The risk team asks you to implement the core of the automatic evaluation pipeline: given a loan application file (represented as a set of chunks with their sources), the system must produce a **structured decision** in JSON that satisfies a defined schema, with mandatory citations to source documents.

The pipeline has two steps:

1. **Structured generation:** an LLM (in this lab, a deterministic fake) reads the chunks and produces JSON with `{decision, score, factores, citations}`.
2. **Deterministic threshold rule:** `score >= 70 → aprobar`, `40–69 → revisar`, `< 40 → rechazar` — this rule overwrites the LLM's tentative decision.

Additionally, the system must handle the case where there is **insufficient evidence** in the chunks: if the score cannot be determined, the decision must be `"no_determinable"` and `citations` may be empty (controlled exception to the mandatory citations rule).

---

## Layer ② — Scratch (REQUIRED, stdlib only)

This layer **must run** with the Python standard library, no `pip`, no network. It is the foundation you must master before layer ③.

### Task

### Step 1 — Read input data

Sample chunks are in `datos/`. There are two files:

- **`expediente_001.json`** — complete data (case with evidence).
- **`expediente_002.json`** — incomplete data (case with insufficient evidence).

### Step 2 — Implement the deterministic fake LLM

Implement a `fake_llm(chunks, solicitud)` function that:

1. Parses chunks to extract key numeric values (income, debt, on-time payments, job tenure).
2. Calculates the score using the lab's deterministic formula (see hints).
3. Builds factors with descriptive text.
4. Builds citations pointing to source chunks.
5. Returns the partial JSON object (with tentative `decision`).

If it cannot extract at least 2 of the 4 key values, return the `no_determinable` object.

### Step 3 — Validate against the schema

Implement `validar_schema(obj)` that verifies the object satisfies the lab JSON Schema using **stdlib only** (the `json` module). The schema is defined in the script itself.

### Step 4 — Groundedness check

Implement `verificar_groundedness(obj, chunks)` that verifies each citation in `obj["citations"]` has its `source` in one of the available chunks.

### Step 5 — Deterministic rule

Implement `aplicar_regla_umbral(obj)` that overwrites `obj["decision"]` based on the score. If `obj["decision"] == "no_determinable"`, the rule does not apply.

### Step 6 — Run on both files

Process both files, print results, and verify that:

- File 001 produces valid JSON with non-empty `citations` and a rule-based `decision`.
- File 002 produces `"decision": "no_determinable"` with an appropriate message.

---

## Success criteria

| Criterion | How to verify |
|---|---|
| Valid JSON against schema | `validar_schema()` does not raise an exception |
| Non-empty `citations` in case with evidence | `len(resultado["citations"]) >= 1` |
| No-evidence case → `"no_determinable"` | `resultado["decision"] == "no_determinable"` |
| Threshold rule overwrites LLM decision | `resultado["decision"]` determined by score, not by the LLM |
| Groundedness: all citations have real source | `verificar_groundedness()` returns `True` |

---

## Tiered hints

### Hint 1 — Score formula (if you do not know where to start)

The score is calculated as follows (values normalized between 0 and 100):

```
component_ingreso   = min(ingreso / 100_000, 1.0) * 30   # máx 30 pts
component_deuda     = max(1 - deuda / ingreso, 0) * 30   # máx 30 pts (menor deuda = mejor)
component_pagos     = (pagos_puntuales_pct / 100) * 25   # máx 25 pts
component_antiguedad = min(antiguedad / 10, 1.0) * 15    # máx 15 pts
score = int(component_ingreso + component_deuda + component_pagos + component_antiguedad)
```

### Hint 2 — Minimal schema for stdlib validation

To validate with stdlib you do not need `jsonschema`. You can implement a function that checks:
- Required fields are present.
- Types are correct (isinstance).
- Enums have the correct values.
- Arrays are not empty when `minItems` is required.

### Hint 3 — Chunk structure

Each chunk in the files has: `id`, `text`, `source`, `metadata` (dict with numeric values when applicable).

### Hint 4 — The no-evidence case

In `expediente_002.json`, chunks do not contain numeric financial data (only incomplete information). The fake LLM must detect this and return:

```python
{
    "decision": "no_determinable",
    "score": None,
    "factores": ["Datos financieros insuficientes para calcular score"],
    "citations": [],
    "mensaje": "No hay evidencia suficiente en los documentos para determinar el score crediticio."
}
```

### Hint 5 — Verify groundedness

To verify a citation is "real", check that the citation's `source` matches the `source` of one of the context chunks:

```python
fuentes_disponibles = {chunk["source"] for chunk in chunks}
for cita in obj.get("citations", []):
    if cita["source"] not in fuentes_disponibles:
        return False, f"Cita con fuente desconocida: {cita['source']}"
return True, "OK"
```

---

## Layer ③ — Framework (GUIDED TASK)

> **When to do it:** after your `solucion_scratch.py` passes `expected.md` **and** you have read [§10 of the guide](../guia.md#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch). LangChain basics (LCEL, `|`, `ChatPromptTemplate`) were covered in [M1 §11](../../01-fundamentos/guia.md#11-layer-③-explained-langchain-from-scratch).
>
> **Environment:** requires `pip install instructor pydantic ragas langchain-anthropic` and `ANTHROPIC_API_KEY`. Not run on the course study machine.

The goal is not to copy the reference file: it is to **write** `solucion_framework.py` (or a new file) yourself, understanding each block. At the end, compare with [`solucion_framework.py`](./solucion_framework.py).

### Step F1 — Pydantic schema (replaces `validar_schema`)

**Goal:** convert your `SCHEMA` dict + `validar_schema()` into Pydantic classes.

1. Create `Cita` with `text` and `source` (both `str`, `min_length=1`).
2. Create `DecisionCredito` with the same fields you validated in scratch: `decision`, `score` (`Optional[int]`, `ge=0`, `le=100`), `factores` (`min_length=1`, `max_length=5`), `justificacion` (`min_length=50`), `citations` (`list[Cita]`), optional `nivel_riesgo`.
3. Add `@field_validator` for `decision` (enum) and `nivel_riesgo`.

**Hint 1:** read [§10.3](../guia.md#103-pydantic-from-scratch-for-a-python-dev). Try creating a valid object and an invalid one (`decision="QUIZAS"`) and observe the `ValidationError`.

**Verify:** the `if __name__ == "__main__"` block at the end of `solucion_framework.py` demonstrates validation without LLM — run it when you have pip.

### Step F2 — Structured output with instructor (replaces `fake_llm` + JSON parsing)

**Goal:** function `evaluar_credito_con_instructor(chunks, solicitud) -> DecisionCredito`.

1. `client = instructor.from_anthropic(Anthropic())`
2. Build the prompt with formatted chunks (same as scratch, but text for the real LLM).
3. `client.messages.create(..., response_model=DecisionCredito, max_retries=3)`

**Hint 2:** read [§10.4](../guia.md#104-instructor-structured-output-with-retries). What does instructor do when Pydantic raises `ValidationError`? (Answer: retries with the error as feedback.)

### Step F3 — LangChain alternative (optional but recommended)

**Goal:** function `evaluar_credito_con_langchain(chunks, solicitud) -> DecisionCredito`.

1. `structured_llm = ChatAnthropic(...).with_structured_output(DecisionCredito)`
2. `template = ChatPromptTemplate.from_messages([...])`
3. `chain = template | structured_llm`
4. `chain.invoke({"solicitud": ..., "contexto": ...})`

**Hint 3:** read [§10.5](../guia.md#105-langchain-with_structured_output-the-lcel-alternative). Same LCEL pattern as M1 §11; only the last link changes.

### Step F4 — Deterministic rule (copy from scratch, no frameworks)

**Goal:** `aplicar_regla_umbral(decision: DecisionCredito) -> DecisionCredito`.

Copy the logic from your scratch `aplicar_regla_umbral()` almost literally — only adapt from `dict` to Pydantic object (`decision.score`, `decision.decision = "aprobar"`).

**Hint 4:** read [§10.7 Part E](../guia.md#107-block-by-block-walkthrough-of-labsolucion_frameworkpy). The rule **never** goes inside the LLM or instructor.

### Step F5 — RAGAS evaluation (optional)

**Goal:** function `evaluar_con_ragas(pregunta, respuesta, chunks_recuperados, respuesta_ideal) -> dict`.

1. Build the dict with columns `question`, `answer`, `contexts`, `ground_truth`.
2. `Dataset.from_dict(data)`
3. `evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])`

**Hint 5:** read [§10.6](../guia.md#106-ragas-evaluating-faithfulness-and-relevance-in-batch). Which metric detects an invented response not backed by chunks? (`faithfulness`)

### Step F6 — Pipeline and comparison

1. Implement `pipeline_framework(ruta_expediente)` chaining: instructor → rule → RAGAS.
2. Run on `datos/expediente_001.json` and compare the final decision with your scratch.
3. Open [`solucion_framework.py`](./solucion_framework.py) block by block ([§10.7](../guia.md#107-block-by-block-walkthrough-of-labsolucion_frameworkpy)) and note differences.

### Success criteria (layer ③)

| Criterion | How to verify |
|---|---|
| Pydantic schema equivalent to scratch | `DecisionCredito(...)` valid with file 001 data; invalid with `decision="QUIZAS"` |
| Structured output returns `DecisionCredito` | `type(resultado) == DecisionCredito`, not `dict` or `str` |
| Deterministic rule identical to scratch | Same score → same final `decision` as `solucion_scratch.py` |
| RAGAS runs without error (optional) | `evaluate()` returns dict with key `faithfulness` |

---

## Expected result

See [`expected.md`](./expected.md) for the exact expected output.

## Solutions

- **Scratch (stdlib):** [`solucion_scratch.py`](./solucion_scratch.py) — run with `python3 solucion_scratch.py`. **Required.**
- **Framework (instructor + Pydantic + RAGAS):** write it following the [layer ③ guided task](#layer-③--framework-guided-task); reference in [`solucion_framework.py`](./solucion_framework.py).
- **Explanation:** [`solucion.md`](./solucion.md) · layer ③ teaching: [guide §10](../guia.md#10-layer-③-explained-structured-output-and-evaluation-with-frameworks-from-scratch).

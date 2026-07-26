# Expected — M1 · Minimal RAG

> Concrete result when running `python3 solucion_scratch.py` from the `lab/` directory.
> Generated from the script's actual output — if your solution matches, you're on track.

---

## Test query

```
How many vacation days do I get if I have been at the company for 3 years?
```

---

## Top-3 retrieved chunks

| Rank | Index (0-based) | Similarity | Chunk start |
|----------|-----------------|-----------|-----------------|
| 1 | 1 | 0.5080 | VACATION POLICY §4 — Additional vacation by seniority... |
| 2 | 0 | 0.4397 | VACATION POLICY §3 — Accrual and use... |
| 3 | 7 | 0.3384 | TRAINING POLICY §1 — Professional development... |

**Exact printed line:**
```
Retrieved indices (0-based): 1, 0, 7
Similarities:                0.5080, 0.4397, 0.3384
```

---

## Why these chunks (analysis)

**Chunk 1 (index 1, sim 0.5080):** "VACATION POLICY §4 — Additional vacation by seniority"
- Contains: "vacation", "days", "years", "company" — words present in the query.
- The word "years" appears multiple times in this chunk, increasing its weight.
- It is the most relevant semantically even though it talks about >5 years (the bag-of-words embedding does not distinguish the exact number of years, only word co-occurrence).

**Chunk 2 (index 0, sim 0.4397):** "VACATION POLICY §3 — Accrual and use"
- Contains the correct answer: "After 3 full years of seniority the employee is entitled to 18 business days".
- Has high keyword density: "vacation", "days", "year", "years".
- It is slightly less similar than §4 because §4 has more repetition of "days" and "years".

**Chunk 3 (index 7, sim 0.3384):** "TRAINING POLICY §1 — Professional development"
- Appears because it shares words like "days" and "company". It is a partial false positive.
- In a production system with real semantic embeddings, this chunk would NOT appear in top-3 — semantic similarity between "vacation/seniority" and "training/courses" is very low.
- **This demonstrates the toy embedding limitation:** bag-of-words does not capture meaning, only superficial word co-occurrence.

---

## Complete augmented prompt (actual output)

```
You are the company's HR assistant. Answer ONLY based on the policy fragments provided.

Relevant fragments:
[1] VACATION POLICY §4 — Additional vacation by seniority
The company recognizes employee loyalty with additional vacation days. For every 5 full years of seniority, 2 additional business days of vacation are granted on top of the current base. An employee with 5 years gets 20 days, with 10 years gets 22 days, and with 15 years gets 24 annual business days. Additional days are credited automatically on the work anniversary.

[2] VACATION POLICY §3 — Accrual and use
Employees are entitled to paid annual vacation. During the first year of service, 12 business days of vacation are accrued, prorated from the start month. Starting from the second year, the company grants 15 business days. After 3 full years of seniority the employee is entitled to 18 business days of vacation. Vacation days must be requested at least 15 days in advance through the HR portal.

[3] TRAINING POLICY §1 — Professional development
The company allocates an annual training budget of up to 5,000 pesos per employee for courses, certifications, or conferences related to their area of work. Requests must be submitted at least 30 days in advance and approved by the direct supervisor and HR. Approved courses are taken during work hours without affecting salary or vacation days.

Employee question: How many vacation days do I get if I have been at the company for 3 years?

Answer:
```

---

## What would the LLM respond?

The augmented prompt contains the information needed to answer correctly. A real LLM like Claude would respond something like:

```
According to **Vacation Policy §3 — Accrual and use**, after
3 full years of seniority you are entitled to **18 business days** of
annual vacation.

> Source: Vacation Policy §3, "Accrual and use" — "After
> 3 full years of seniority the employee is entitled to 18 business days
> of vacation."

Remember that you must request your vacation at least 15 days in
advance through the HR portal.
```

Chunk [2] (§3) contains the exact answer. Chunk [1] (§4) is additional relevant context about seniority. Chunk [3] (training) is not relevant to this question — a well-instructed LLM would ignore it.

---

## Observed limitation and its production solution

The ranking §4 > §3 for the query about "3 years" is because §4 contains more repetitions of the words "years" and "days" than §3 (it mentions 5, 10, 15 years several times). The bag-of-words embedding rewards lexical frequency, not semantic relevance.

**In production (real embeddings):** with OpenAI's `text-embedding-3-large` or local `bge-large`, chunk §3 would appear first because the semantic model would understand that "3 years of seniority" in the query corresponds exactly to the phrase "After 3 full years of seniority" in §3.

This is exactly what the `model.embedding` node of the `09-hr-policy-assistant` template solves compared to the toy embedding in this lab.

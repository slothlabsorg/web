# Expected — Lab M5 · Structured decision with citations

When you run `python3 solution_scratch.py` from the `lab/` folder, the output should be:

```
============================================================
Processing: EXP-2024-001
Applicant: Carlos Mendoza
Request: Personal loan application for $45,000 over 60 months for debt consolidation.
============================================================

[fake_llm] Calculated score: 84
[fake_llm] Tentative decision: approve
[schema] Validation: OK
[groundedness] OK
[logic.rules] Final decision: approve
[logic.rules] Original LLM decision: approve (overwritten by deterministic rule)

--- Final JSON result ---
{
  "decision": "approve",
  "score": 84,
  "factors": [
    "Declared annual income: $85,000 [tax_return_2023.pdf]",
    "On-time payment history: 97% [account_statement_q3_2023.pdf]",
    "Debt-to-income ratio: 14.1% — job tenure: 6 years [financial_data.csv]",
    "No negative reports in credit bureau (last 24 months) [credit_bureau_query.pdf]"
  ],
  "citations": [
    {
      "text": "Annual income: $85,000",
      "source": "tax_return_2023.pdf"
    },
    {
      "text": "On-time payments: 97% in the last 12 months",
      "source": "account_statement_q3_2023.pdf"
    },
    {
      "text": "Total debt: $12,000, job tenure: 6 years",
      "source": "financial_data.csv"
    },
    {
      "text": "No negative reports in the last 24 months",
      "source": "credit_bureau_query.pdf"
    }
  ],
  "_original_llm_decision": "approve"
}

============================================================
Processing: EXP-2024-002
Applicant: Ana Rojas
Request: Mortgage loan application for $120,000.
============================================================

[fake_llm] Calculated score: None
[fake_llm] Tentative decision: undetermined
[schema] Validation: OK
[groundedness] OK (undetermined — empty citations allowed)
[logic.rules] Final decision: undetermined

--- Final JSON result ---
{
  "decision": "undetermined",
  "score": null,
  "factors": [
    "Insufficient financial data to calculate credit score"
  ],
  "citations": [],
  "message": "There is not enough evidence in the provided documents to determine the applicant's credit score."
}

============================================================
FINAL VERIFICATIONS
============================================================
[001] decision=approve score=84 citations=4 ✓
[002] decision=undetermined ✓

All verifications passed.
```

---

## Conformance criteria

### File 001 (Carlos Mendoza — case with evidence)

| Field | Expected value | Reasoning |
|---|---|---|
| `decision` | `"approve"` | Score 84 ≥ 70 → deterministic rule: approve |
| `score` | `84` | Formula: income(25.5) + debt(25.8) + payments(24.25) + tenure(9.0) = 84 |
| `citations` | 4 entries | One per chunk with verifiable numeric data |
| `citations[*].source` | Only sources from `file_001.json` | Groundedness: all sources exist in the chunks |
| `_original_llm_decision` | `"approve"` | In this case the LLM and the rule agree (high score) |

**Score 84 breakdown:**
- `income_component = min(85000/100000, 1.0) * 30 = 0.85 * 30 = 25.5`
- `debt_component = max(1 - 12000/85000, 0) * 30 = max(0.859, 0) * 30 = 25.76`
- `payments_component = (97/100) * 25 = 24.25`
- `tenure_component = min(6/10, 1.0) * 15 = 0.6 * 15 = 9.0`
- `score = int(25.5 + 25.76 + 24.25 + 9.0) = int(84.51) = 84`

### File 002 (Ana Rojas — case without evidence)

| Field | Expected value | Reasoning |
|---|---|---|
| `decision` | `"undetermined"` | Only 1 partial numeric datum (2022 income, wrong year) |
| `score` | `null` | Not calculable — insufficient data |
| `citations` | `[]` | No evidence → no citations (controlled exception) |
| `message` | Descriptive string | Explains why the score cannot be determined |

**Why it is `undetermined`:** Ana Rojas's chunks do not contain `annual_income` in their metadata (the 2022 `income` is in a text field, not structured metadata), and they have no data on debt, on-time payments, or tenure in the current job (which has not started yet). `available_data = 0 < 2` → case without evidence.

---

## System invariants (expected values may differ if the data is modified)

1. **Schema always valid:** the JSON produced always passes `validate_schema()`.
2. **Groundedness always OK:** no citation points to a source that is not in the chunks.
3. **Deterministic rule:** if `score is not None and score >= 70` → `decision = "approve"`.
4. **Undetermined when data is missing:** if `available_data < 2 OR income is None` → `decision = "undetermined"`.
5. **File with evidence:** `len(citations) >= 1` always.

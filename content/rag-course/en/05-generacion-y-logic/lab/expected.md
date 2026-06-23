# Expected — Lab M5 · Structured decision with citations

When you run `python3 solucion_scratch.py` from the `lab/` folder, the output should be:

```
============================================================
Procesando: EXP-2024-001
Solicitante: Carlos Mendoza
Solicitud: Solicitud de préstamo personal por $45,000 a 60 meses para consolidación de deudas.
============================================================

[fake_llm] Score calculado: 84
[fake_llm] Decision tentativa: aprobar
[schema] Validación: OK
[groundedness] OK
[logic.rules] Decision final: aprobar
[logic.rules] Decision LLM original: aprobar (sobreescrita por la regla determinista)

--- Resultado JSON final ---
{
  "decision": "aprobar",
  "score": 84,
  "factores": [
    "Ingreso anual declarado: $85,000 [declaracion_fiscal_2023.pdf]",
    "Historial de pagos puntuales: 97% [estado_cuenta_q3_2023.pdf]",
    "Ratio deuda/ingreso: 14.1% — antigüedad laboral: 6 años [datos_financieros.csv]",
    "Sin reportes negativos en buró de crédito (últimos 24 meses) [buro_credito_consulta.pdf]"
  ],
  "citations": [
    {
      "text": "Ingreso anual: $85,000",
      "source": "declaracion_fiscal_2023.pdf"
    },
    {
      "text": "Pagos puntuales: 97% en los últimos 12 meses",
      "source": "estado_cuenta_q3_2023.pdf"
    },
    {
      "text": "Deuda total: $12,000, antigüedad laboral: 6 años",
      "source": "datos_financieros.csv"
    },
    {
      "text": "Sin reportes negativos en los últimos 24 meses",
      "source": "buro_credito_consulta.pdf"
    }
  ],
  "_decision_llm_original": "aprobar"
}

============================================================
Procesando: EXP-2024-002
Solicitante: Ana Rojas
Solicitud: Solicitud de préstamo hipotecario por $120,000.
============================================================

[fake_llm] Score calculado: None
[fake_llm] Decision tentativa: no_determinable
[schema] Validación: OK
[groundedness] OK (no_determinable — citas vacías permitidas)
[logic.rules] Decision final: no_determinable

--- Resultado JSON final ---
{
  "decision": "no_determinable",
  "score": null,
  "factores": [
    "Datos financieros insuficientes para calcular score crediticio"
  ],
  "citations": [],
  "mensaje": "No hay evidencia suficiente en los documentos proporcionados para determinar el score crediticio del solicitante."
}

============================================================
VERIFICACIONES FINALES
============================================================
[001] decision=aprobar score=84 citations=4 ✓
[002] decision=no_determinable ✓

Todas las verificaciones pasaron.
```

---

## Conformance criteria

### File 001 (Carlos Mendoza — case with evidence)

| Field | Expected value | Reasoning |
|---|---|---|
| `decision` | `"aprobar"` | Score 84 ≥ 70 → deterministic rule: approve |
| `score` | `84` | Formula: income(25.5) + debt(25.8) + payments(24.25) + tenure(9.0) = 84 |
| `citations` | 4 entries | One per chunk with verifiable numeric data |
| `citations[*].source` | Only sources from `expediente_001.json` | Groundedness: all sources exist in the chunks |
| `_decision_llm_original` | `"aprobar"` | In this case the LLM and the rule agree (high score) |

**Score 84 breakdown:**
- `comp_ingreso = min(85000/100000, 1.0) * 30 = 0.85 * 30 = 25.5`
- `comp_deuda = max(1 - 12000/85000, 0) * 30 = max(0.859, 0) * 30 = 25.76`
- `comp_pagos = (97/100) * 25 = 24.25`
- `comp_antiguedad = min(6/10, 1.0) * 15 = 0.6 * 15 = 9.0`
- `score = int(25.5 + 25.76 + 24.25 + 9.0) = int(84.51) = 84`

### File 002 (Ana Rojas — case without evidence)

| Field | Expected value | Reasoning |
|---|---|---|
| `decision` | `"no_determinable"` | Only 1 partial numeric datum (2022 income, wrong year) |
| `score` | `null` | Not calculable — insufficient data |
| `citations` | `[]` | No evidence → no citations (controlled exception) |
| `mensaje` | Descriptive string | Explains why the score cannot be determined |

**Why it is `no_determinable`:** Ana Rojas's chunks do not contain `ingreso_anual` in their metadata (the 2022 `ingreso` is in a text field, not structured metadata), and they have no data on debt, on-time payments, or tenure in the current job (which has not started yet). `datos_disponibles = 0 < 2` → case without evidence.

---

## System invariants (expected values may differ if the data is modified)

1. **Schema always valid:** the JSON produced always passes `validar_schema()`.
2. **Groundedness always OK:** no citation points to a source that is not in the chunks.
3. **Deterministic rule:** if `score is not None and score >= 70` → `decision = "aprobar"`.
4. **No_determinable when data is missing:** if `datos_disponibles < 2 OR ingreso is None` → `decision = "no_determinable"`.
5. **File with evidence:** `len(citations) >= 1` always.

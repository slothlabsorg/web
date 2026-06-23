# Expected — Taller M5 · Decisión estructurada con citas

Al ejecutar `python3 solucion_scratch.py` desde la carpeta `lab/`, la salida debe ser:

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

## Criterios de conformidad

### Expediente 001 (Carlos Mendoza — caso con evidencia)

| Campo | Valor esperado | Razonamiento |
|---|---|---|
| `decision` | `"aprobar"` | Score 84 ≥ 70 → regla determinista: aprobar |
| `score` | `84` | Fórmula: ingreso(25.5) + deuda(25.8) + pagos(24.25) + antigüedad(9.0) = 84 |
| `citations` | 4 entradas | Una por cada chunk con datos numéricos verificables |
| `citations[*].source` | Solo fuentes de `expediente_001.json` | Groundedness: todas las fuentes existen en los chunks |
| `_decision_llm_original` | `"aprobar"` | En este caso el LLM y la regla coinciden (score alto) |

**Desglose del score 84:**
- `comp_ingreso = min(85000/100000, 1.0) * 30 = 0.85 * 30 = 25.5`
- `comp_deuda = max(1 - 12000/85000, 0) * 30 = max(0.859, 0) * 30 = 25.76`
- `comp_pagos = (97/100) * 25 = 24.25`
- `comp_antiguedad = min(6/10, 1.0) * 15 = 0.6 * 15 = 9.0`
- `score = int(25.5 + 25.76 + 24.25 + 9.0) = int(84.51) = 84`

### Expediente 002 (Ana Rojas — caso sin evidencia)

| Campo | Valor esperado | Razonamiento |
|---|---|---|
| `decision` | `"no_determinable"` | Solo hay 1 dato numérico parcial (ingreso 2022, año incorrecto) |
| `score` | `null` | No calculable — datos insuficientes |
| `citations` | `[]` | Sin evidencia → sin citas (excepción controlada) |
| `mensaje` | String descriptivo | Explica por qué no se puede determinar |

**Por qué es `no_determinable`:** los chunks de Ana Rojas no contienen `ingreso_anual` en su metadata (el `ingreso` de 2022 es de un campo texto, no del metadata estructurado), y no tienen datos de deuda, pagos puntuales ni antigüedad laboral en el empleo actual (que aún no ha comenzado). `datos_disponibles = 0 < 2` → caso sin evidencia.

---

## Invariantes del sistema (el expected puede tomar otros valores si se modifican los datos)

1. **Schema siempre válido:** el JSON producido siempre pasa `validar_schema()`.
2. **Groundedness siempre OK:** ninguna cita apunta a una fuente que no esté en los chunks.
3. **Regla determinista:** si `score is not None and score >= 70` → `decision = "aprobar"`.
4. **No_determinable cuando faltan datos:** si `datos_disponibles < 2 OR ingreso is None` → `decision = "no_determinable"`.
5. **Expediente con evidencia:** `len(citations) >= 1` siempre.

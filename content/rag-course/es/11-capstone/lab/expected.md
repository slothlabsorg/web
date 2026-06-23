# Expected — M11 · Capstone · Template 09 (scratch)

> Resultado concreto al ejecutar `python3 solucion_scratch.py` desde el directorio `lab/`.
> Generado con la salida real del script — si tu solución coincide, vas bien.

---

## Query de prueba

```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
```

---

## Resumen del pipeline

| Etapa | Resultado esperado |
|-------|-------------------|
| Chunks indexados | 8 |
| topK recuperado | 4 (template 09 usa topK=4) |
| Índices (0-based) | `1, 0, 7, 3` |
| Similitudes | `0.5080, 0.4397, 0.3384, 0.3215` |
| `citations_ok` | `True` |
| Días en respuesta | **18 días hábiles** |
| Fuente citada | Política de Vacaciones §3 |

---

## Top-4 chunks recuperados

| Posición | Índice (0-based) | Similitud | Fuente |
|----------|-----------------|-----------|--------|
| 1 | 1 | 0.5080 | POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad |
| 2 | 0 | 0.4397 | POLÍTICA DE VACACIONES §3 — Acumulación y disfrute |
| 3 | 7 | 0.3384 | POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional |
| 4 | 3 | 0.3215 | POLÍTICA DE PERMISOS §2 — Permiso por maternidad y paternidad |

**Líneas exactas impresas:**
```
Índices recuperados (0-based): 1, 0, 7, 3
Similitudes:                   0.5080, 0.4397, 0.3384, 0.3215
```

---

## Respuesta final (fake_llm + logic.citations enforce)

```
Después de **3 años completos de antigüedad** tienes derecho a **18 días hábiles** de vacaciones anuales.

> Fuente: Política de Vacaciones §3 — Acumulación y disfrute

citations_ok: True
citations:    ['POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad', 'POLÍTICA DE VACACIONES §3 — Acumulación y disfrute', 'POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional']
```

---

## Criterios de aceptación — Reto 1 (template 09 scratch)

Tu `solucion_scratch.py` **pasa** si:

1. Corre con `python3 solucion_scratch.py` sin dependencias externas.
2. Indexa exactamente **8** chunks desde `datos/politicas_rrhh.txt`.
3. Para la query de vacaciones/3 años, los índices recuperados son **`1, 0, 7, 3`** (orden y valores).
4. Las similitudes coinciden a **4 decimales**: `0.5080, 0.4397, 0.3384, 0.3215`.
5. La respuesta final menciona **18 días hábiles** y una **fuente** (§3 o equivalente).
6. `citations_ok` es `True`.

---

## Criterios de aceptación — Reto 1 (templates 02 y 01)

No hay script de referencia ejecutable aquí (complejidad mayor). Tu entrega pasa si:

### Template 02 (banca)

- Procesa `datos/applicants/applicant_001/` y emite JSON con `score`, `decision`, `factores`, `justificacion`.
- `logic.rules` sobrescribe `decision`: score ≥ 70 → `"aprobar"` (determinista, no delegado al LLM).
- Hard-filters por `doc_type`/`period` evitan mezclar expedientes.
- Cada factor en `factores` referencia un documento del expediente.

### Template 01 (aerolínea)

- Agente ReAct con al menos: `PolicyRAG`, `ReservationService`, `InventoryService`, `PricingService`, `PaymentService`.
- Cadena de guardrails en Payment: `idempotency → confirm → resilience`.
- Segundo cobro con mismo `(pnr, session_id)` devuelve `deduplicated`.
- Cobro > USD 500 exige confirmación antes de ejecutar.
- Al menos un evento de auditoría por sesión con tool calls registrados.

---

## Criterios de aceptación — Reto 2 (diseño nuevo)

Tu `flow.json` + diagrama + justificación pasan si:

1. **Validación RAGorbit:** 0 errores de contrato al pulsar Validar.
2. **Probar con mocks:** responde a al menos 2 de las 3 preguntas en `datos/brief_telemedicina.json`.
3. Incluye: retrieval con hard-filters, citas obligatorias, escalación HITL y auditoría.
4. Justifica cada nodo frente a una alternativa de [`tecnologias-comparadas.md`](../../referencia/tecnologias-comparadas.md).

---

## Criterios de aceptación — Reto 3 (defensa)

Rúbrica de experto (detalle en `solucion.md`):

| Dimensión | Mínimo para aprobar |
|-----------|---------------------|
| Correctitud técnica | Explica puertos y nodos sin errores de contrato |
| Justificación | Cada decisión tiene trade-off explícito |
| Producción | Menciona idempotencia, audit o latencia según el caso |
| Seguridad | Identifica PHI/PII, filtros duros o guardrails |
| Claridad | Diagrama legible + defensa en < 15 minutos |

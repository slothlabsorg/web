# Expected — M1 · Minimal RAG

> Concrete result when running `python3 solucion_scratch.py` from the `lab/` directory.
> Generated from the script's actual output — if your solution matches, you're on track.

---

## Test query

```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
```

---

## Top-3 retrieved chunks

| Rank | Index (0-based) | Similarity | Chunk start |
|----------|-----------------|-----------|-----------------|
| 1 | 1 | 0.5080 | POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad... |
| 2 | 0 | 0.4397 | POLÍTICA DE VACACIONES §3 — Acumulación y disfrute... |
| 3 | 7 | 0.3384 | POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional... |

**Exact printed line:**
```
Índices recuperados (0-based): 1, 0, 7
Similitudes:                   0.5080, 0.4397, 0.3384
```

---

## Why these chunks (analysis)

**Chunk 1 (index 1, sim 0.5080):** "POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad"
- Contains: "vacaciones", "días", "años", "empresa" — words present in the query.
- The word "años" appears multiple times in this chunk, increasing its weight.
- It is the most relevant semantically even though it talks about >5 years (the bag-of-words embedding does not distinguish the exact number of years, only word co-occurrence).

**Chunk 2 (index 0, sim 0.4397):** "POLÍTICA DE VACACIONES §3 — Acumulación y disfrute"
- Contains the correct answer: "Después de 3 años completos de antigüedad el trabajador tiene derecho a 18 días hábiles".
- Has high keyword density: "vacaciones", "días", "año", "años".
- It is slightly less similar than §4 because §4 has more repetition of "días" and "años".

**Chunk 3 (index 7, sim 0.3384):** "POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional"
- Appears because it shares words like "días" and "empresa". It is a partial false positive.
- In a production system with real semantic embeddings, this chunk would NOT appear in top-3 — semantic similarity between "vacaciones/antigüedad" and "capacitación/cursos" is very low.
- **This demonstrates the toy embedding limitation:** bag-of-words does not capture meaning, only superficial word co-occurrence.

---

## Complete augmented prompt (actual output)

```
Eres el asistente de RRHH de la empresa. Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados.

Fragmentos relevantes:
[1] POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad
La empresa reconoce la lealtad de sus empleados con días adicionales de vacaciones. Por cada 5 años completos de antigüedad se otorgan 2 días hábiles adicionales de vacaciones sobre la base vigente. Un empleado con 5 años tiene 20 días, con 10 años tiene 22 días, y con 15 años tiene 24 días hábiles anuales. Los días adicionales se acreditan automáticamente en el aniversario laboral.

[2] POLÍTICA DE VACACIONES §3 — Acumulación y disfrute
Los empleados tienen derecho a vacaciones anuales pagadas. Durante el primer año de servicio se acumulan 12 días hábiles de vacaciones, prorrateados a partir del mes de inicio. A partir del segundo año, la empresa otorga 15 días hábiles. Después de 3 años completos de antigüedad el trabajador tiene derecho a 18 días hábiles de vacaciones. Los días de vacaciones deben solicitarse con al menos 15 días de anticipación a través del portal de RRHH.

[3] POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional
La empresa destina un presupuesto anual de capacitación de hasta 5,000 pesos por empleado para cursos, certificaciones o conferencias relacionadas con su área de trabajo. Las solicitudes deben presentarse con al menos 30 días de anticipación y ser aprobadas por el jefe directo y RRHH. Los cursos aprobados se toman en horario de trabajo sin afectar el sueldo ni los días de vacaciones.

Pregunta del empleado: ¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?

Respuesta:
```

---

## What would the LLM respond?

The augmented prompt contains the information needed to answer correctly. A real LLM like Claude would respond something like:

```
Según la **Política de Vacaciones §3 — Acumulación y disfrute**, después de
3 años completos de antigüedad tienes derecho a **18 días hábiles** de
vacaciones anuales.

> Fuente: Política de Vacaciones §3, "Acumulación y disfrute" — "Después de
> 3 años completos de antigüedad el trabajador tiene derecho a 18 días hábiles
> de vacaciones."

Recuerda que debes solicitar tus vacaciones con al menos 15 días de
anticipación a través del portal de RRHH.
```

Chunk [2] (§3) contains the exact answer. Chunk [1] (§4) is additional relevant context about seniority. Chunk [3] (training) is not relevant to this question — a well-instructed LLM would ignore it.

---

## Observed limitation and its production solution

The ranking §4 > §3 for the query about "3 years" is because §4 contains more repetitions of the words "años" and "días" than §3 (it mentions 5, 10, 15 years several times). The bag-of-words embedding rewards lexical frequency, not semantic relevance.

**In production (real embeddings):** with OpenAI's `text-embedding-3-large` or local `bge-large`, chunk §3 would appear first because the semantic model would understand that "3 años de antigüedad" in the query corresponds exactly to the phrase "Después de 3 años completos de antigüedad" in §3.

This is exactly what the `model.embedding` node of the `09-hr-policy-assistant` template solves compared to the toy embedding in this lab.

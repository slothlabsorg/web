# Expected — M1 · RAG mínimo

> Resultado concreto al ejecutar `python3 solucion_scratch.py` desde el directorio `lab/`.
> Generado con la salida real del script — si tu solución coincide, vas bien.

---

## Query de prueba

```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
```

---

## Top-3 chunks recuperados

| Posición | Índice (0-based) | Similitud | Inicio del chunk |
|----------|-----------------|-----------|-----------------|
| 1 | 1 | 0.5080 | POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad... |
| 2 | 0 | 0.4397 | POLÍTICA DE VACACIONES §3 — Acumulación y disfrute... |
| 3 | 7 | 0.3384 | POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional... |

**Línea exacta impresa:**
```
Índices recuperados (0-based): 1, 0, 7
Similitudes:                   0.5080, 0.4397, 0.3384
```

---

## Por qué estos chunks (análisis)

**Chunk 1 (índice 1, sim 0.5080):** "POLÍTICA DE VACACIONES §4 — Vacaciones adicionales por antigüedad"
- Contiene: "vacaciones", "días", "años", "empresa" — palabras presentes en la query.
- La palabra "años" aparece múltiples veces en este chunk, aumentando su peso.
- Es el más relevante semánticamente aunque habla de >5 años (el embedding de bag-of-words no distingue el número exacto de años, solo la co-ocurrencia de palabras).

**Chunk 2 (índice 0, sim 0.4397):** "POLÍTICA DE VACACIONES §3 — Acumulación y disfrute"
- Contiene la respuesta correcta: "Después de 3 años completos de antigüedad el trabajador tiene derecho a 18 días hábiles".
- Tiene alta densidad de palabras clave: "vacaciones", "días", "año", "años".
- Es ligeramente menos similar que §4 porque §4 tiene más repetición de "días" y "años".

**Chunk 3 (índice 7, sim 0.3384):** "POLÍTICA DE CAPACITACIÓN §1 — Desarrollo profesional"
- Aparece porque comparte palabras como "días" y "empresa". Es un falso positivo parcial.
- En un sistema de producción con embeddings semánticos reales, este chunk NO aparecería en top-3 — la similitud semántica entre "vacaciones/antigüedad" y "capacitación/cursos" es muy baja.
- **Esto demuestra la limitación del embedding de juguete:** bag-of-words no captura significado, solo co-ocurrencia de palabras superficiales.

---

## Prompt aumentado completo (salida real)

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

## ¿Qué respondería el LLM?

El prompt aumentado contiene la información necesaria para responder correctamente. Un LLM real como Claude respondería algo como:

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

El chunk [2] (§3) contiene la respuesta exacta. El chunk [1] (§4) es contexto adicional relevante sobre antigüedad. El chunk [3] (capacitación) no es relevante para esta pregunta — el LLM bien instruido lo ignoraría.

---

## Limitación observada y su solución en producción

El ranking §4 > §3 para la query sobre "3 años" se debe a que §4 contiene más repeticiones de las palabras "años" y "días" que §4 (menciona 5, 10, 15 años varias veces). El embedding bag-of-words premia la frecuencia léxica, no la relevancia semántica.

**En producción (embeddings reales):** con `text-embedding-3-large` de OpenAI o `bge-large` local, el chunk §3 aparecería primero porque el modelo semántico entendería que "3 años de antigüedad" en la query corresponde exactamente a la frase "Después de 3 años completos de antigüedad" en §3.

Esto es exactamente lo que resuelve el nodo `model.embedding` del template `09-hr-policy-assistant` comparado con el embedding de juguete de este taller.

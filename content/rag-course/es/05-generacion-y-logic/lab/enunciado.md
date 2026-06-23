# Taller M5 · Decisión estructurada con citas para evaluación de crédito

## Contexto de negocio

Eres el ingeniero de ML del equipo de originación de crédito de **FinBank**. El equipo de riesgo te pide implementar el núcleo del pipeline de evaluación automática: dado un expediente de solicitud de préstamo (representado como un conjunto de chunks con sus fuentes), el sistema debe producir una **decisión estructurada** en JSON que cumpla un schema definido, con citas obligatorias a los documentos fuente.

El pipeline tiene dos pasos:

1. **Generación estructurada:** un LLM (en este taller, un fake determinista) lee los chunks y produce el JSON con `{decision, score, factores, citations}`.
2. **Regla determinista sobre el umbral:** `score >= 70 → aprobar`, `40–69 → revisar`, `< 40 → rechazar` — esta regla sobreescribe la decisión tentativa del LLM.

Adicionalmente, el sistema debe manejar el caso donde **no hay evidencia suficiente** en los chunks: si el score no puede determinarse, la decisión debe ser `"no_determinable"` y `citations` puede estar vacío (excepción controlada a la regla de citas obligatorias).

---

## Capa ② — Scratch (OBLIGATORIO, solo stdlib)

Esta capa **debe ejecutarse** con la librería estándar de Python, sin `pip`, sin red. Es la base que debes dominar antes de la capa ③.

### Tarea

### Paso 1 — Leer los datos de entrada

Los chunks de muestra están en `datos/`. Hay dos expedientes:

- **`expediente_001.json`** — datos completos (caso con evidencia).
- **`expediente_002.json`** — datos incompletos (caso sin evidencia suficiente).

### Paso 2 — Implementar el fake LLM determinista

Implementa una función `fake_llm(chunks, solicitud)` que:

1. Parsea los chunks para extraer los valores numéricos clave (ingreso, deuda, pagos puntuales, antigüedad laboral).
2. Calcula el score usando la fórmula determinista del taller (ver pistas).
3. Construye los factores con texto descriptivo.
4. Construye las citas (`citations`) apuntando a los chunks fuente.
5. Devuelve el objeto JSON parcial (con `decision` tentativa).

Si no puede extraer al menos 2 de los 4 valores clave, devuelve el objeto `no_determinable`.

### Paso 3 — Validar contra el schema

Implementa `validar_schema(obj)` que verifica que el objeto cumple el JSON Schema del taller usando **solo stdlib** (módulo `json`). El schema está definido en el propio script.

### Paso 4 — Groundedness check

Implementa `verificar_groundedness(obj, chunks)` que verifica que cada cita en `obj["citations"]` tenga su `source` en alguno de los chunks disponibles.

### Paso 5 — Regla determinista

Implementa `aplicar_regla_umbral(obj)` que sobreescribe `obj["decision"]` basado en el score. Si `obj["decision"] == "no_determinable"`, la regla no se aplica.

### Paso 6 — Ejecutar sobre los dos expedientes

Procesa ambos expedientes, imprime los resultados y verifica que:

- Expediente 001 produce un JSON válido con `citations` no vacío y `decision` de regla.
- Expediente 002 produce `"decision": "no_determinable"` con mensaje apropiado.

---

## Criterios de éxito

| Criterio | Cómo verificarlo |
|---|---|
| JSON válido contra schema | `validar_schema()` no lanza excepción |
| `citations` no vacío en caso con evidencia | `len(resultado["citations"]) >= 1` |
| Caso sin evidencia → `"no_determinable"` | `resultado["decision"] == "no_determinable"` |
| Regla de umbral sobreescribe la decision del LLM | `resultado["decision"]` determinado por score, no por el LLM |
| Groundedness: todas las citas tienen source real | `verificar_groundedness()` devuelve `True` |

---

## Pistas escalonadas

### Pista 1 — Fórmula del score (si no sabes por dónde empezar)

El score se calcula así (valores normalizados entre 0 y 100):

```
component_ingreso   = min(ingreso / 100_000, 1.0) * 30   # máx 30 pts
component_deuda     = max(1 - deuda / ingreso, 0) * 30   # máx 30 pts (menor deuda = mejor)
component_pagos     = (pagos_puntuales_pct / 100) * 25   # máx 25 pts
component_antiguedad = min(antiguedad / 10, 1.0) * 15    # máx 15 pts
score = int(component_ingreso + component_deuda + component_pagos + component_antiguedad)
```

### Pista 2 — Schema minimal para validación con stdlib

Para validar con stdlib no necesitas `jsonschema`. Puedes implementar una función que comprueba:
- Que los campos requeridos están presentes.
- Que los tipos son los correctos (isinstance).
- Que los enums tienen los valores correctos.
- Que los arrays no están vacíos cuando se requiere `minItems`.

### Pista 3 — Estructura de los chunks

Cada chunk en los expedientes tiene: `id`, `text`, `source`, `metadata` (dict con los valores numéricos cuando aplica).

### Pista 4 — El caso sin evidencia

En `expediente_002.json`, los chunks no contienen datos financieros numéricos (solo información incompleta). El fake LLM debe detectar esto y retornar:

```python
{
    "decision": "no_determinable",
    "score": None,
    "factores": ["Datos financieros insuficientes para calcular score"],
    "citations": [],
    "mensaje": "No hay evidencia suficiente en los documentos para determinar el score crediticio."
}
```

### Pista 5 — Verificar groundedness

Para verificar que una cita es "real", comprueba que el `source` de la cita coincide con el `source` de alguno de los chunks del contexto:

```python
fuentes_disponibles = {chunk["source"] for chunk in chunks}
for cita in obj.get("citations", []):
    if cita["source"] not in fuentes_disponibles:
        return False, f"Cita con fuente desconocida: {cita['source']}"
return True, "OK"
```

---

## Capa ③ — Framework (TAREA GUIADA)

> **Cuándo hacerla:** después de que tu `solucion_scratch.py` pase `expected.md` **y** hayas leído [§10 de la guía](../guia.md#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero). LangChain base (LCEL, `|`, `ChatPromptTemplate`) ya lo viste en [M1 §11](../../01-fundamentos/guia.md#11-la-capa-③-explicada-langchain-desde-cero).
>
> **Entorno:** requiere `pip install instructor pydantic ragas langchain-anthropic` y `ANTHROPIC_API_KEY`. No se ejecuta en la máquina de estudio del curso.

El objetivo no es copiar el archivo de referencia: es **escribir tú** `solucion_framework.py` (o un archivo nuevo) entendiendo cada bloque. Al final, compara con [`solucion_framework.py`](./solucion_framework.py).

### Paso F1 — Schema Pydantic (reemplaza `validar_schema`)

**Meta:** convertir tu dict `SCHEMA` + `validar_schema()` en clases Pydantic.

1. Crea `Cita` con `text` y `source` (ambos `str`, `min_length=1`).
2. Crea `DecisionCredito` con los mismos campos que validaste en scratch: `decision`, `score` (`Optional[int]`, `ge=0`, `le=100`), `factores` (`min_length=1`, `max_length=5`), `justificacion` (`min_length=50`), `citations` (`list[Cita]`), `nivel_riesgo` opcional.
3. Añade `@field_validator` para `decision` (enum) y `nivel_riesgo`.

**Pista 1:** lee [§10.3](../guia.md#103-pydantic-desde-cero-para-un-dev-python). Prueba crear un objeto válido y uno inválido (`decision="QUIZAS"`) y observa el `ValidationError`.

**Comprueba:** el bloque `if __name__ == "__main__"` al final de `solucion_framework.py` demuestra validación sin LLM — ejecútalo cuando tengas pip.

### Paso F2 — Structured output con instructor (reemplaza `fake_llm` + parseo JSON)

**Meta:** función `evaluar_credito_con_instructor(chunks, solicitud) -> DecisionCredito`.

1. `client = instructor.from_anthropic(Anthropic())`
2. Construye el prompt con chunks formateados (igual que en scratch, pero texto para el LLM real).
3. `client.messages.create(..., response_model=DecisionCredito, max_retries=3)`

**Pista 2:** lee [§10.4](../guia.md#104-instructor-structured-output-con-reintentos). ¿Qué hace instructor cuando Pydantic lanza `ValidationError`? (Respuesta: reintenta con el error como feedback.)

### Paso F3 — Alternativa LangChain (opcional pero recomendado)

**Meta:** función `evaluar_credito_con_langchain(chunks, solicitud) -> DecisionCredito`.

1. `structured_llm = ChatAnthropic(...).with_structured_output(DecisionCredito)`
2. `template = ChatPromptTemplate.from_messages([...])`
3. `chain = template | structured_llm`
4. `chain.invoke({"solicitud": ..., "contexto": ...})`

**Pista 3:** lee [§10.5](../guia.md#105-langchain-with_structured_output-la-alternativa-lcel). Es el mismo patrón LCEL de M1 §11; solo cambias el último eslabón.

### Paso F4 — Regla determinista (copia de scratch, sin frameworks)

**Meta:** `aplicar_regla_umbral(decision: DecisionCredito) -> DecisionCredito`.

Copia la lógica de tu `aplicar_regla_umbral()` de scratch casi literal — solo adapta de `dict` a objeto Pydantic (`decision.score`, `decision.decision = "aprobar"`).

**Pista 4:** lee [§10.7 Parte E](../guia.md#107-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy). La regla **nunca** va dentro del LLM ni de instructor.

### Paso F5 — Evaluación RAGAS (opcional)

**Meta:** función `evaluar_con_ragas(pregunta, respuesta, chunks_recuperados, respuesta_ideal) -> dict`.

1. Arma el dict con columnas `question`, `answer`, `contexts`, `ground_truth`.
2. `Dataset.from_dict(data)`
3. `evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])`

**Pista 5:** lee [§10.6](../guia.md#106-ragas-evaluar-faithfulness-y-relevancia-en-batch). ¿Qué métrica detecta una respuesta inventada no respaldada por los chunks? (`faithfulness`)

### Paso F6 — Pipeline y comparación

1. Implementa `pipeline_framework(ruta_expediente)` que encadena: instructor → regla → RAGAS.
2. Ejecuta sobre `datos/expediente_001.json` y compara la decisión final con tu scratch.
3. Abre [`solucion_framework.py`](./solucion_framework.py) bloque por bloque ([§10.7](../guia.md#107-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy)) y anota diferencias.

### Criterios de éxito (capa ③)

| Criterio | Cómo verificarlo |
|---|---|
| Schema Pydantic equivalente al scratch | `DecisionCredito(...)` válido con datos del expediente 001; inválido con `decision="QUIZAS"` |
| Structured output devuelve `DecisionCredito` | `type(resultado) == DecisionCredito`, no `dict` ni `str` |
| Regla determinista idéntica a scratch | Mismo score → misma `decision` final que `solucion_scratch.py` |
| RAGAS corre sin error (opcional) | `evaluate()` devuelve dict con clave `faithfulness` |

---

## Expected result

Ver [`expected.md`](./expected.md) para la salida exacta esperada.

## Soluciones

- **Scratch (stdlib):** [`solucion_scratch.py`](./solucion_scratch.py) — corre con `python3 solucion_scratch.py`. **Obligatorio.**
- **Framework (instructor + Pydantic + RAGAS):** escríbelo siguiendo la [tarea guiada capa ③](#capa-③--framework-tarea-guiada); referencia en [`solucion_framework.py`](./solucion_framework.py).
- **Explicación:** [`solucion.md`](./solucion.md) · enseñanza capa ③: [guía §10](../guia.md#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero).

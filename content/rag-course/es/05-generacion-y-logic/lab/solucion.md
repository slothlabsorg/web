# Solución — Taller M5 · Decisión estructurada con citas

---

## ① Diseño/concepto — qué hace este taller y por qué

Este taller implementa el núcleo de `logic.structured + logic.rules + logic.citations` del template 02 (banca). El pipeline tiene cinco responsabilidades claras:

| Responsabilidad | Quién la cumple | Equivalente en RAGorbit |
|---|---|---|
| Extraer datos de los chunks y calcular score | `fake_llm()` | `logic.structured` con LLM real |
| Garantizar que el output cumple el contrato JSON | `validar_schema()` | JSON Schema en `logic.structured` |
| Garantizar que las citas son reales (no inventadas) | `verificar_groundedness()` | `logic.citations` en modo `enforce` |
| Aplicar el umbral determinista | `aplicar_regla_umbral()` | `logic.rules` |
| Manejar el caso sin evidencia | Condición en `fake_llm()` | Lógica de guarda en `logic.structured` |

La separación entre estas cinco funciones no es solo organizativa — es una garantía de corrección:

- Si el schema falla, el pipeline se detiene antes de aplicar la regla (no propaga datos corruptos).
- Si el groundedness falla, el pipeline se detiene antes de devolver la decisión (no propaga alucinaciones).
- La regla de umbral SOLO se ejecuta sobre objetos validados y grounded.

---

## ② Desde cero — explicación de la implementación scratch

### `fake_llm()` — el corazón del taller

La función simula lo que haría un LLM con structured output. En un sistema real, el LLM leería el texto de los chunks y razonaría sobre los factores de riesgo. En nuestra implementación determinista:

1. **Extrae datos del metadata estructurado** de los chunks (`_extraer_numerico()`). Esto funciona porque los chunks de muestra tienen `metadata` con los valores numéricos ya parseados. En un sistema real, el LLM haría este parsing leyendo el texto libre.

2. **Aplica la fórmula de score.** La fórmula normaliza cuatro dimensiones a rangos [0, 30], [0, 30], [0, 25] y [0, 15] respectivamente. Los pesos reflejan la importancia relativa de cada factor en evaluación crediticia real (el ingreso y el ratio deuda/ingreso son los más importantes).

3. **Construye factores y citas** iterando sobre los chunks. Cada chunk con datos numéricos aporta un factor y una cita. Esta es la parte crucial: las citas se construyen desde los chunks reales, no se inventan.

4. **Maneja el caso sin evidencia** contando cuántos valores numéricos clave pudo extraer. Con menos de 2 valores (o sin ingreso), retorna el objeto `no_determinable`.

### `validar_schema()` — validación sin jsonschema

Implementar validación de JSON Schema desde cero con stdlib requiere verificar:
- Presencia de campos requeridos (`for campo in SCHEMA["required"]`).
- Tipos correctos (`isinstance()`).
- Valores de enum (`if v not in valid_values`).
- Restricciones numéricas (`minimum`, `maximum`).
- Restricciones de array (`minItems`).

Esta implementación cubre el 90% de los schemas típicos de RAG. Para schemas más complejos (patternProperties, $ref, allOf/anyOf/oneOf), usar la biblioteca `jsonschema` (tercero) es más robusto.

### `verificar_groundedness()` — la verificación más importante

La verificación comprueba que el `source` de cada cita existe en el conjunto de chunks disponibles. Esto es una **verificación estructural**, no semántica: no comprueba si el texto de la cita es una paráfrasis precisa del chunk, solo que apunta a una fuente real.

Para producción con LLMs reales, la verificación semántica (¿el texto de la cita está respaldado por el chunk?) es lo que calcula RAGAS como `faithfulness`. La verificación estructural de este taller es el paso previo.

### `aplicar_regla_umbral()` — el principio de no delegar al LLM

La función es intencionalmente simple: tres condiciones y un default. No tiene estado, no tiene efectos secundarios, no llama al LLM. Dado el mismo score, siempre produce la misma decisión.

El campo `_decision_llm_original` registra la decisión tentativa del LLM para auditoría. En producción, este campo alimentaría un análisis de discrepancias: si el LLM dice "revisar" y la regla dice "aprobar" (score en el límite exacto de 70), esa discrepancia es informativa para ajustar el prompt o los umbrales.

---

## ③ Framework — cómo se hace en producción

> **Enseñanza completa capa ③:** lee [guía §10](../guia.md#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero) antes de este apartado. LangChain base (LCEL, `ChatPromptTemplate`) está en [M1 §11](../../01-fundamentos/guia.md#11-la-capa-③-explicada-langchain-desde-cero). La [tarea guiada](./enunciado.md#capa-③--framework-tarea-guiada) del enunciado te pide **escribir** la solución framework, no solo leerla.

### Pydantic + instructor

`solucion_framework.py` muestra el enfoque de producción en seis partes (A–F). El recorrido bloque por bloque está en [guía §10.7](../guia.md#107-recorrido-bloque-por-bloque-de-labsolucion_frameworkpy).

**Pydantic (schema):** define el contrato con validadores explícitos (`@field_validator`). La ventaja sobre el JSON Schema manual es que el error de validación incluye el contexto del campo y el valor recibido — facilita el debugging.

**instructor (structured output):** envuelve la API de Anthropic/OpenAI y convierte las llamadas en operaciones que devuelven directamente el tipo Pydantic. El parámetro `max_retries=3` hace que, si el LLM emite un JSON que no pasa la validación Pydantic, instructor reenvíe el error como feedback al LLM y lo intente de nuevo. Esto captura el 90%+ de los errores de formato.

**LangChain LCEL (`with_structured_output`):** alternativa que usa tool-calling internamente. La diferencia con instructor es que LCEL está más integrado con el ecosistema LangChain (fácil de combinar con retrievers, chains, etc.), mientras que instructor es más minimalista y funciona bien cuando solo necesitas structured output sin el resto del ecosistema.

**RAGAS:** evalúa `faithfulness` (¿las citas están en los chunks?) y `answer_relevancy` (¿la respuesta responde la pregunta?). En CI/CD, incluirías estas métricas como assertions:

```python
assert metricas["faithfulness"] >= 0.80, "Faithfulness por debajo del umbral"
assert metricas["answer_relevancy"] >= 0.70, "Answer relevancy por debajo del umbral"
```

### Cuándo usar cada enfoque

| Criterio | instructor | LCEL + with_structured_output |
|---|---|---|
| Solo necesitas structured output | Mejor | Overhead adicional |
| Ya usas LangChain en el resto del pipeline | Menos natural | Mejor (consistencia) |
| Quieres reintentos con feedback | Nativo | Requiere más configuración |
| Quieres LangSmith tracing | Solo si añades callbacks | Nativo |
| Modelos locales (Ollama, HF) | Sí (con provider adecuado) | Sí |

---

## Preguntas frecuentes

**¿Por qué el score del expediente 001 es 84 y no otro número?**

```
comp_ingreso    = min(85000/100000, 1.0) * 30  = 0.85 * 30   = 25.50
comp_deuda      = max(1 - 12000/85000, 0) * 30 = 0.8588 * 30 = 25.76
comp_pagos      = (97/100) * 25                              = 24.25
comp_antiguedad = min(6/10, 1.0) * 15          = 0.6 * 15    = 9.00
                                                       total = 84.51
score = int(84.51) = 84
```

**¿Por qué el expediente 002 es `no_determinable` si tiene un ingreso de $31,000 en 2022?**

Porque ese ingreso está en el **texto** del chunk, no en el `metadata` con clave `ingreso_anual`. La función `_extraer_numerico()` solo lee el metadata estructurado. En un sistema con LLM real, el modelo leería el texto y extraería el valor; en nuestro fake determinista, dependemos del metadata estructurado. Esto es intencional: ilustra que la calidad del pipeline depende de la calidad del pipeline de ingesta (metadata bien etiquetado).

**¿Qué pasaría si el LLM emitiera `"decision": "APROBAR"` en mayúsculas?**

La validación del enum en `validar_schema()` fallaría:
```
Error: 'decision' debe ser uno de ['aprobar', 'revisar', 'rechazar', 'no_determinable'], pero es 'APROBAR'
```
El pipeline retornaría `{"error": "schema_invalido", "detalle": "..."}` y no llegaría a la regla de umbral. Con `instructor`, esto dispararía un reintento con el mensaje de error como feedback al LLM.

---

## Conexiones con los templates

- **Template 02 (banca):** este taller implementa exactamente el núcleo de ese template. En producción, `fake_llm()` → Claude con `logic.structured`, `validar_schema()` → el runtime de RAGorbit, `aplicar_regla_umbral()` → `logic.rules`.

- **Template 04 (seguros):** mismo patrón pero con `logic.rules` antes de `logic.structured` (las reglas de elegibilidad deterministas se aplican primero). El schema sería `{cubierto, monto_estimado, deducible_aplicado, clausula_aplicada, razon}`.

- **Template 03 (salud):** el caso `no_determinable` es análogo a `criterio_no_encontrado == true` → escalación a `hitl.escalate`. La decisión de escalar tampoco la toma el LLM: la toma la condición en el nodo HITL.

- **Template 08 (manufactura):** el groundedness check es `logic.citations` en modo `enforce`. Si el AMM no tiene el procedimiento indexado, la respuesta falla con error explícito en lugar de alucinarlo.

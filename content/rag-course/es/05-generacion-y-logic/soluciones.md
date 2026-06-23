# Soluciones — Módulo 5 · Generación, lógica y evaluación

---

## E14 · Opción múltiple razonada — Salida estructurada

### Pregunta 1 → **b)**

**Respuesta correcta: b) Tool-calling con un schema JSON que define `"minItems": 1` en `citations`.**

La razón: el JSON Schema con `"minItems": 1` es parte del contrato formal que el proveedor (Anthropic, OpenAI) hace cumplir a nivel de generación cuando se usa tool-calling. La respuesta a) (JSON-mode) solo garantiza JSON válido sintácticamente, no que cumpla el schema semántico. La c) (instrucción en el prompt) puede olvidarse por el LLM — no es una garantía. La d) es incompleta: la combinación de tool-calling + `minItems` es la garantía más cercana a "nunca vacío", aunque en teoría extrema un modelo podría alucinar `"citations": [{}]` (objetos vacíos), para lo que también se agrega `"required": ["text", "source"]` en cada objeto.

En la práctica, para el caso sin evidencia se agrega lógica explícita: si los chunks están vacíos → no llamar al LLM → retornar directamente `{"citations": [], "decision": "no_determinable"}` saltándose `logic.structured`.

### Pregunta 2 → **a)**

**Respuesta correcta: a) Para ahorrar tokens de LLM cuando las reglas ya pueden rechazar el reclamo.**

En el template 04, `logic.rules` primero verifica condiciones **puras y deterministas** (¿el monto del daño supera el deducible? ¿la póliza está vigente? ¿aplica una exclusión?). Si alguna condición de rechazo se cumple, el LLM nunca se llama — se ahorra latencia y costo. La b) es incorrecta: `logic.rules` no lee las citas de `logic.structured` (se ejecuta antes). La c) es incorrecta: `model.vision` se llama en el loader, no aquí. La d) es incorrecta: `logic.structured` sí puede recibir chunks directamente.

### Pregunta 3 → **b)**

**Respuesta correcta: b) `instructor` valida post-generación y reintenta; `outlines` guía la generación token a token.**

Esta es la diferencia arquitectónica fundamental. `instructor` llama al LLM normalmente, intenta parsear y validar la respuesta contra el modelo Pydantic, y si falla reenvía el error al LLM como feedback para que corrija (ciclo de reintento). `outlines` modifica el proceso de generación mismo: en cada paso de generación, solo permite tokens que son compatibles con el estado actual del schema — el output inválido es imposible por construcción. La a) es incorrecta: `instructor` soporta múltiples proveedores (Anthropic, OpenAI, Gemini...). La c) es incorrecta: los reintentos de `instructor` añaden latencia. La d) es incorrecta en ambas direcciones.

---

## E15 · Diseña el JSON schema de una decisión de crédito

### Tarea A — JSON Schema completo

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["score", "decision", "factores", "justificacion", "citations"],
  "additionalProperties": false,
  "properties": {
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Puntuación de riesgo crediticio calculada por el LLM"
    },
    "decision": {
      "type": "string",
      "enum": ["aprobar", "revisar", "rechazar"],
      "description": "Decisión tentativa del LLM; será sobreescrita por logic.rules"
    },
    "factores": {
      "type": "array",
      "items": {"type": "string", "minLength": 1},
      "minItems": 1,
      "maxItems": 5,
      "description": "Factores principales que sustentan la puntuación"
    },
    "justificacion": {
      "type": "string",
      "minLength": 50,
      "description": "Razonamiento narrativo del score"
    },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["text", "source"],
        "additionalProperties": false,
        "properties": {
          "text": {"type": "string", "minLength": 1},
          "source": {"type": "string", "minLength": 1}
        }
      },
      "minItems": 1,
      "description": "Evidencia documental que respalda los factores"
    },
    "nivel_riesgo": {
      "type": "string",
      "enum": ["bajo", "medio", "alto"],
      "description": "Clasificación cualitativa del riesgo (opcional)"
    }
  }
}
```

### Tarea B — Por qué incluir `decision` si `logic.rules` la sobreescribe

**Razón 1 — Validación de integridad del LLM:** si el LLM emite `"decision": "QUIZAS"`, el schema lo rechaza inmediatamente con un error claro antes de llegar a `logic.rules`. Sin el schema, `logic.rules` recibiría un objeto con un campo inválido, lo que podría causar un error silencioso o un comportamiento inesperado.

**Razón 2 — Auditoría comparativa:** tener la `decision` tentativa del LLM junto a la `decision` final de `logic.rules` permite detectar discrepancias sistemáticas. Si el LLM dice "rechazar" y la regla dice "aprobar" (score justo en el umbral, ej. 70), ese patrón es interesante para ajustar prompts o umbrales.

**Razón 3 — Consistencia del contrato:** el schema define el objeto de decisión completo. `logic.rules` lo recibe como input y lo devuelve modificado — es más limpio tener el campo definido desde el inicio que agregarlo después.

### Tarea C — LLM emite `"APROBAR"` en lugar de `"aprobar"`

La validación del schema **falla** porque `"APROBAR"` no está en el enum `["aprobar", "revisar", "rechazar"]`. El nodo `logic.structured` lanza un error antes de propagar el objeto.

**Cómo manejarlo:**

1. **Con `instructor`:** el error de validación se envía al LLM como feedback. El prompt de reintento dice algo como: "El campo `decision` debe ser uno de `aprobar`, `revisar`, `rechazar` (minúsculas). Tu respuesta anterior usó mayúsculas. Corrige y devuelve solo el JSON."

2. **En el prompt de síntesis:** agregar una instrucción explícita: `"El campo decision DEBE ser exactamente uno de estos tres valores en minúsculas: aprobar, revisar, rechazar"`.

3. **Normalización defensiva:** en el código de post-procesamiento, aplicar `.lower()` al campo decision antes de la validación del schema (pero esto oculta el problema en lugar de corregirlo en la fuente).

La opción más robusta en producción es (1) + (2): instrucción clara en el prompt + reintentos automáticos con feedback de validación.

---

## E16 · Qué decide el LLM vs las reglas deterministas

| Ítem | Quién decide | Razonamiento |
|---|---|---|
| a) ¿ratio deuda/ingreso > 50%? | **Regla determinista** | Es aritmética pura: `deuda_total / ingreso_anual > 0.5`. El resultado es 100% reproducible y no requiere interpretación. |
| b) ¿Señales de inestabilidad laboral? | **LLM** | Requiere interpretar texto heterogéneo (cartas de despido, cambios frecuentes de empleador, brechas de empleo) y combinar señales ambiguas que no tienen una fórmula exacta. |
| c) ¿Score 72 ≥ umbral 70? | **Regla determinista** | Es una comparación de enteros. El LLM nunca debe evaluar umbrales de negocio con consecuencias legales o financieras (ECOA, Reg B). |
| d) ¿Qué factores de riesgo emergen de 6 meses de estados de cuenta? | **LLM** | Requiere síntesis e interpretación de múltiples transacciones, patrones de comportamiento y contexto. |
| e) ¿Póliza vigente en fecha del reclamo? | **Regla determinista** | Es una comparación de fechas: `fecha_inicio_poliza <= fecha_reclamo <= fecha_fin_poliza`. Determinista y crítico para la corrección del sistema. |
| f) ¿La fotografía es consistente con la descripción? | **LLM** (con `model.vision`) | Requiere razonamiento visual y semántico que ninguna regla determinista puede codificar. |
| g) ¿Monto 1700 > deducible 500? | **Regla determinista** | Resta y comparación: `monto_estimado - deducible > 0`. Debe ser determinista para garantizar que el pago calculado es siempre el mismo dado el mismo input. |
| h) ¿Qué cláusula aplica al tipo de daño? | **LLM** (con citas obligatorias) | Requiere comprensión semántica del texto de la póliza y el tipo de daño. Pero la cita obligatoria garantiza que el LLM no invente la cláusula. |

**Patrón general:** si la operación es aritmética, comparación de fechas o lookup de un valor conocido → regla determinista. Si requiere interpretación de lenguaje natural, síntesis de múltiples señales ambiguas o razonamiento semántico → LLM (con citas).

---

## E17 · Encuentra el bug — Groundedness y evaluación

### Bug 1 — `calcular_score` siempre devuelve 75

**Problema:** la función ignora los `chunks` recibidos y devuelve un valor hardcodeado. Esto hace que el sistema siempre apruebe (75 ≥ 70) sin importar el contenido del expediente. Es el equivalente a un sistema de crédito que aprueba a todos.

**Corrección:** implementar una función que calcule el score a partir de los datos en los chunks (o, en un fake LLM determinista, parsearlo de los datos numéricos disponibles).

### Bug 2 — Umbral incorrecto en la regla de revisión

**Problema:** la condición `elif score > 40` aplica para scores de 41–69 Y también para scores de 40 exacto si se usa `>=`, pero con `>` el score 40 caería al `else` (rechazar) cuando debería ser "revisar" (40–69). El template 02 define el rango como `40–69 → revisar`, lo que implica `score >= 40 AND score < 70`.

**Corrección:**
```python
if score >= 70:
    decision = "aprobar"
elif score >= 40:   # cubre 40-69 inclusive
    decision = "revisar"
else:
    decision = "rechazar"
```

### Bug 3 — `citations: []` (array vacío)

**Problema:** las citas son un array vacío aunque los `chunks` contienen evidencia explícita. Sin citas, la decisión no puede auditarse — no hay trazabilidad desde el factor hasta el documento fuente. Es como un dictamen médico sin referencias bibliográficas.

**Impacto:** el schema con `"minItems": 1` en `citations` rechazaría este objeto. El nodo `logic.citations` en modo `enforce` bloquearía la respuesta.

### Bug 4 — `verificar_groundedness` solo comprueba que `citations` no esté vacío

**Problema:** la función verifica `len(citations) > 0`, pero no comprueba si las citas están respaldadas por los chunks reales. Podría tener `"citations": [{"text": "abc", "source": "inventado.pdf"}]` y pasaría la verificación.

**Groundedness real:** para cada cita, verificar que su `text` aparece (literalmente o semánticamente) en alguno de los chunks del contexto.

### Respuesta B — `logic.citations` en modo `enforce` con `citations: []`

El nodo rechaza la respuesta y lanza un error accionable del tipo:
```json
{
  "error": "citations_required",
  "message": "La decisión no contiene citas verificables. Se requiere al menos una cita respaldada por los chunks recuperados."
}
```

La decisión nunca llega a `logic.rules` ni a `io.output`. El pipeline falla con error explícito en lugar de propagar datos no auditables.

### Respuesta C — Por qué Bug 4 es incorrecto

Verificar `len(citations) > 0` solo comprueba que la estructura existe, no que sea válida. Un LLM puede fabricar citas plausibles que no corresponden a ningún chunk real. La verificación correcta debe:

1. Para cada entrada en `citations`, buscar si `citation["text"]` aparece literalmente en algún chunk.
2. O (verificación semántica) calcular la similitud entre el texto de la cita y los chunks.
3. Si ninguna cita matchea ningún chunk real, la respuesta no está "grounded" aunque `citations` no esté vacío.

### Respuesta D — Corrección de Bug 3

```python
def generar_decision(score, chunks):
    if score >= 70:
        decision = "aprobar"
    elif score >= 40:
        decision = "revisar"
    else:
        decision = "rechazar"
    
    # Construir citas reales desde los chunks
    citations = []
    for chunk in chunks:
        citations.append({
            "text": chunk["text"][:100],  # primer fragmento representativo
            "source": chunk["source"]
        })
    
    return {
        "score": score,
        "decision": decision,
        "factores": [
            f"Datos verificados en {chunk['source']}" for chunk in chunks
        ],
        "citations": citations  # ahora no vacío y con fuentes reales
    }
```

---

## E18 · Elige la tecnología — Evaluación y frameworks

### Escenario A → **DeepEval**

DeepEval es el más indicado para CI/CD con GitHub Actions porque integra nativamente con pytest. Puedes definir un test con `FaithfulnessMetric(threshold=0.80)` y el test falla si la métrica no alcanza el umbral. El pipeline de CI simplemente ejecuta `pytest tests/eval/` y el job falla si la calidad cae por debajo del umbral definido. RAGAS también es viable (genera JSON que puedes leer con assertions), pero DeepEval requiere menos código de pegamento.

### Escenario B → **TruLens**

TruLens está diseñado exactamente para este caso: instrumentas tu chain con `TruChain` y cada llamada al LLM queda registrada y evaluada. El dashboard de Streamlit te muestra inmediatamente cómo cambió la calidad en las últimas 50 conversaciones tras el cambio de prompt. RAGAS requeriría exportar los datos y correr la evaluación manualmente, lo que rompe el flujo de exploración rápida.

### Escenario C → **promptfoo**

promptfoo es el más indicado para comparación de modelos. Defines ambos providers (`anthropic:claude-opus-4-8` y `openai:gpt-4o`) en el YAML de configuración, listas los 200 casos de prueba como `tests`, y `npx promptfoo eval` ejecuta todos los casos en ambos modelos y produce una tabla comparativa con métricas. No requiere código Python adicional. RAGAS también funciona pero promptfoo está más optimizado para el caso de comparación multi-proveedor.

### Escenario D → **RAGAS**

Para evaluación periódica en batch, RAGAS es la opción natural. Puedes construir un dataset con las conversaciones de la semana, ejecutar `evaluate()` y registrar las métricas en una base de datos de monitoreo (o en LangSmith). Es menos overhead que TruLens (que instrumenta en tiempo real y acumula datos continuamente). TruLens también funcionaría pero tiene más overhead de infraestructura para un job batch nocturno.

### Escenario E → **DeepEval**

Para métricas custom que deben integrarse con pytest, DeepEval es el único de los cuatro que soporta `BaseMetric` como clase base para métricas personalizadas:

```python
from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase

class ContieneNumeroMetric(BaseMetric):
    def __init__(self, threshold=1.0):
        self.threshold = threshold
    
    def measure(self, test_case: LLMTestCase) -> float:
        import re
        tiene_numero = bool(re.search(r'\d+', test_case.actual_output))
        return 1.0 if tiene_numero else 0.0
    
    @property
    def is_successful(self) -> bool:
        return self.score >= self.threshold
    
    @property
    def name(self) -> str:
        return "contiene_numero"
```

---

## E14b · Predice la salida — `logic.router`

- **Caso 1** `{"score": 72, "decision": "aprobar"}`: rama **`notif_aprobacion`** — se cumple `score >= 70 and decision == 'aprobar'`.
- **Caso 2** `{"score": 55, "decision": "revisar"}`: rama **`cola_revision`** — se cumple `decision == 'revisar'`.
- **Caso 3** `{"score": 72, "decision": "revisar"}`: rama **`cola_revision`** — a pesar de que el score es 72 (que debería aprobarse), la condición `decision == 'aprobar'` no se cumple porque `logic.rules` aún no corrió y el LLM emitió "revisar". Se enruta incorrectamente a la cola de revisión.

**Lo que revela el Caso 3:** el orden de ejecución es crítico. `logic.rules` DEBE ejecutarse antes que `logic.router`. El router debe leer la `decision` **después** de que las reglas deterministas la hayan corregido. Si el router se ejecuta con la decisión tentativa del LLM, se puede enrutar mal un caso que debería aprobarse automáticamente. El pipeline correcto es:

```
logic.structured → logic.rules → logic.router
(tentativa LLM)  (corregida por reglas) (bifurca según decisión final)
```

---

## E15b · Métricas RAG — Diagnóstico

### Respuesta A — Cuello de botella

El cuello de botella está en la **síntesis / generación**, no en el retrieval. Los indicadores:

- `context_precision: 0.85` → el retriever trae chunks relevantes (poco ruido).
- `context_recall: 0.78` → el retriever recupera la mayoría de lo necesario.
- `faithfulness: 0.91` → el LLM no alucina (respeta los chunks).
- `answer_relevancy: 0.62` → ¡la respuesta no responde bien a la pregunta!

Si el retriever funciona bien (precision y recall razonables) y el LLM es fiel al contexto (faithfulness alta), pero la respuesta no es relevante, el problema está en cómo se formula la respuesta o en cómo se entiende la pregunta.

### Respuesta B — Dos causas probables de baja `answer_relevancy`

**Causa 1 — El prompt de síntesis no está instruyendo al LLM a responder la pregunta específica.** El LLM puede estar sintetizando fielmente los chunks pero produciendo un resumen genérico en lugar de responder directamente a lo que se preguntó. Investigación: revisar el template de `logic.prompt` — ¿incluye explícitamente `{pregunta}` en el prompt? ¿La instrucción dice "responde a la pregunta X" o solo "sintetiza el contexto"?

**Causa 2 — El módulo de intent/query no está reformulando bien la pregunta.** En el template 03, el agente puede reformular la pregunta antes de pasarla al retriever. Si la reformulación pierde la intención original, el LLM recibe una pregunta diferente y responde a esa versión reformulada. Investigación: loggear la query reformulada y compararla con la pregunta original para detectar pérdida de intención.

### Respuesta C — Impacto de subir `topK` de 5 a 10

**Métricas que mejorarían:**
- `context_recall` (probablemente): más chunks = más probabilidad de capturar todo lo necesario. Si había chunks relevantes fuera de los top-5, ahora estarán incluidos.

**Métricas que podrían empeorar:**
- `context_precision` (probablemente): más chunks = más riesgo de incluir chunks irrelevantes (el denominador crece más rápido que el numerador). Pasar de 5 a 10 chunks suele bajar la precisión.
- `faithfulness` (posiblemente): más chunks y más ruido pueden confundir al LLM, aumentando el riesgo de que sintetice información de chunks irrelevantes como si fueran relevantes.

**Regla práctica:** subir `topK` mejora recall pero sacrifica precision. El balance óptimo depende del dominio: en salud, donde un chunk omitido puede cambiar una decisión clínica, se prefiere recall alto aunque baje la precision (y se tolera más ruido en el contexto).

---

## E19 · Predice si Pydantic lanza ValidationError

### A → **Pasa**

Todos los campos cumplen: `decision` en el enum, `score` en [0, 100], un factor, justificación ≥ 50 caracteres, al menos una `Cita` válida.

### B → **ValidationError** (en `@field_validator("decision")`)

`"APROBAR"` no está en `{"aprobar", "revisar", "rechazar", "no_determinable"}`. El validator lanza `ValueError("decision inválida")`, que Pydantic envuelve como `ValidationError`. Es el mismo caso que E15 Tarea C: en scratch `validar_schema()` devolvería `(False, "...")`; con `instructor`, dispararía un reintento.

### C → **ValidationError** (`score=150`)

`score=150` viola `ge=0, le=100`. Aunque `citations=[]` es sintácticamente válido en este modelo (no tiene `min_length=1`), el score fuera de rango basta para fallar. En el lab real, el caso `no_determinable` usa `score=None`, no un entero inválido.

### D → **ValidationError** (`factores` con 6 elementos)

`max_length=5` en `factores` limita a 5 elementos; hay 6 (`f1`…`f6`). Equivalente a `"maxItems": 5` en JSON Schema del E15.

---

## E20 · Completa el Field con las restricciones correctas

### Pregunta A — Valores correctos

```python
score: int = Field(..., ge=0, le=100)
factores: list[str] = Field(..., min_length=1, max_length=5)
justificacion: str = Field(..., min_length=50)
citations: list[Cita] = Field(..., min_length=1)
```

### Pregunta B — `list[Cita]` vs `list[dict]`

`list[Cita]` obliga a que **cada elemento** de la lista sea un objeto `Cita` validado (con `text` y `source` no vacíos). Con `list[dict]`, Pydantic solo comprueba que sea una lista de diccionarios — un `{"text": "", "source": "x"}` podría colarse.

Ventaja frente a `validar_schema()` de scratch: la validación anidada es automática. En scratch debes iterar manualmente sobre `citations` y comprobar cada sub-campo; con Pydantic, `Cita` anidado en `DecisionCredito` lo hace al instanciar.

---

## E21 · Mapeo scratch → framework y métrica RAGAS

### Pregunta A — Tabla completada

| Función scratch | Equivalente framework | ¿Cambia con el framework? |
|---|---|---|
| `validar_schema(obj)` | Instanciar `DecisionCredito(**obj)` o validación implícita en `response_model` | Sí — declarativo con Pydantic |
| `fake_llm(chunks, solicitud)` | `evaluar_credito_con_instructor()` o `evaluar_credito_con_langchain()` | Sí — LLM real + structured output |
| `verificar_groundedness(obj, chunks)` | RAGAS `faithfulness` (evaluación semántica batch) | Sí — más profundo; no reemplaza chequeo estructural en runtime |
| `aplicar_regla_umbral(obj)` | `aplicar_regla_umbral(decision)` — **mismo código Python** | **No** — sigue siendo lógica determinista fuera del LLM |

### Pregunta B — Métrica RAGAS

**`faithfulness`** detecta que las afirmaciones de la respuesta ($250,000, 15 años) no están respaldadas por los chunks ($85,000, 6 años).

El schema Pydantic no basta porque valida **forma** (tipos, rangos, enums), no **verdad**. Un JSON perfectamente válido puede contener datos inventados. Por eso en producción combinas: Pydantic (contrato) + groundedness/faithfulness (contenido).

### Pregunta C — instructor vs `with_structured_output`

1. **Solo necesitas structured output** sin retriever ni chain LangChain — instructor es más directo (`client.messages.create` + `response_model`).
2. **Quieres reintentos explícitos** con feedback de validación (`max_retries=3`) sin configurar callbacks de LangChain.

Alternativa válida: si ya tienes pipeline LCEL (M1 §11) con retriever + template, `with_structured_output` es más natural por consistencia e integración con LangSmith.

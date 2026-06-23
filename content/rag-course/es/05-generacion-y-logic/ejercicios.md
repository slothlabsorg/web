# Ejercicios — Módulo 5 · Generación, lógica y evaluación

> Ejercicios 14–21. Las respuestas razonadas están en [`soluciones.md`](./soluciones.md).

---

## E14 · Opción múltiple razonada — Salida estructurada

**Contexto:** Estás construyendo el nodo `logic.structured` para la evaluación de reclamos de seguros (template 04). El schema requiere los campos `cubierto` (booleano), `monto_estimado` (número), `clausula_aplicada` (string) y `citations` (array no vacío).

**Pregunta 1.** ¿Qué mecanismo de salida estructurada garantiza que el campo `citations` nunca sea un array vacío?

a) JSON-mode, porque el LLM respetará el schema si se le indica en el system prompt.  
b) Tool-calling con un schema JSON que define `"minItems": 1` en `citations`.  
c) Pedir al LLM "siempre incluye citas" en el prompt es suficiente.  
d) Ningún mecanismo puede garantizarlo; hay que verificar en post-procesamiento.

**Pregunta 2.** En el template 04 (seguros), `logic.rules` se ejecuta **antes** que `logic.structured`. ¿Cuál es la razón principal?

a) Para ahorrar tokens de LLM cuando las reglas ya pueden rechazar el reclamo.  
b) Para que `logic.rules` pueda leer las citas producidas por `logic.structured`.  
c) Porque las reglas necesitan la descripción visual generada por `model.vision`.  
d) Porque `logic.structured` no puede recibir chunks directamente.

**Pregunta 3.** ¿Cuál es la diferencia fundamental entre `instructor` y `outlines`?

a) `instructor` funciona solo con OpenAI; `outlines` funciona con cualquier proveedor.  
b) `instructor` valida post-generación y reintenta; `outlines` guía la generación token a token.  
c) `instructor` es más rápido porque no requiere reintentos.  
d) `outlines` produce JSON-mode; `instructor` produce tool-calling.

---

## E15 · Diseña el JSON schema de una decisión de crédito

**Contexto:** Eres el arquitecto del template 02 (banca). El nodo `logic.structured` debe producir una decisión de crédito con los siguientes requisitos:

- `score`: entero entre 0 y 100 (obligatorio).
- `decision`: uno de `"aprobar"`, `"revisar"`, `"rechazar"` (obligatorio, pero lo sobreescribirá `logic.rules` — igual debe estar en el schema para validación).
- `factores`: lista de strings con al menos 1 elemento y máximo 5 (obligatorio).
- `justificacion`: string con al menos 50 caracteres (obligatorio).
- `citations`: lista de objetos, cada uno con `text` (string, requerido) y `source` (string, requerido), al menos 1 elemento (obligatorio).
- `nivel_riesgo`: uno de `"bajo"`, `"medio"`, `"alto"` (opcional).

**Tarea A.** Escribe el JSON Schema completo que valide este objeto.

**Tarea B.** ¿Por qué tiene sentido incluir `decision` en el schema si `logic.rules` lo va a sobreescribir? ¿Qué problema resuelve tenerlo?

**Tarea C.** Si el LLM emite `"decision": "APROBAR"` (mayúsculas) en lugar de `"aprobar"`, ¿qué pasa con la validación del schema? ¿Cómo lo manejarías?

---

## E16 · Qué decide el LLM vs las reglas deterministas

**Contexto:** Tienes el pipeline completo del template 02 (banca). Para cada ítem de la lista, indica si debe decidirlo el **LLM** o una **regla determinista**. Justifica en una oración.

a) ¿El ratio deuda/ingreso del solicitante supera el 50%?  
b) ¿Los documentos del expediente muestran señales de inestabilidad laboral reciente?  
c) ¿El score calculado (72) cumple el umbral de aprobación automática (≥70)?  
d) ¿Qué factores de riesgo emergen de los estados de cuenta de los últimos 6 meses?  
e) ¿La póliza de seguro está vigente en la fecha del reclamo?  
f) ¿La fotografía del daño es consistente con la descripción del reclamo?  
g) ¿El monto estimado del daño (1.700) supera el deducible (500)?  
h) ¿Qué cláusula de la póliza aplica al tipo de daño descrito?

---

## E17 · Encuentra el bug — Groundedness y evaluación

**Contexto:** Un equipo implementó el siguiente sistema RAG para evaluación de crédito. Lee el código y responde las preguntas.

```python
import json

CHUNKS = [
    {"id": "c1", "text": "El solicitante reporta ingresos anuales de $85,000 en 2023.",
     "source": "declaracion_2023.pdf"},
    {"id": "c2", "text": "Historial de pagos: 97% de pagos puntuales en los últimos 12 meses.",
     "source": "estado_cuenta_q3.pdf"},
]

def calcular_score(chunks):
    # Bug 1: el LLM fake siempre devuelve el mismo score
    return 75

def generar_decision(score, chunks):
    # Bug 2
    if score > 70:
        decision = "aprobar"
    elif score > 40:
        decision = "revisar"
    else:
        decision = "rechazar"
    
    return {
        "score": score,
        "decision": decision,
        "factores": ["Ingresos altos", "Buen historial de pagos"],
        "citations": []  # Bug 3
    }

def verificar_groundedness(decision_obj, chunks):
    # Bug 4
    return len(decision_obj["citations"]) > 0

resultado = generar_decision(calcular_score(CHUNKS), CHUNKS)
print(json.dumps(resultado, ensure_ascii=False))
es_grounded = verificar_groundedness(resultado, CHUNKS)
print(f"Grounded: {es_grounded}")
```

**Pregunta A.** Identifica los **4 bugs** marcados en el código y explica por qué cada uno es un problema.

**Pregunta B.** `Bug 3` produce `citations: []`. ¿Qué haría el nodo `logic.citations` de RAGorbit en modo `enforce` con esta respuesta?

**Pregunta C.** `Bug 4` implementa la verificación de groundedness. ¿Por qué esta implementación es incorrecta? ¿Qué debería verificar realmente?

**Pregunta D.** Propón una corrección para Bug 3 que agregue citas reales a los factores usando los chunks disponibles.

---

## E18 · Elige la tecnología — Evaluación y frameworks

Para cada escenario, elige el framework de evaluación más adecuado (**RAGAS**, **TruLens**, **DeepEval** o **promptfoo**) y justifica en 2–3 oraciones.

**Escenario A.** Quieres incluir evaluaciones de faithfulness en tu pipeline de CI/CD con GitHub Actions. Cada PR debe pasar un umbral mínimo de faithfulness de 0.80 antes de mergear.

**Escenario B.** Estás en la fase de exploración: cambiaste el prompt de síntesis y quieres ver inmediatamente cómo afecta a la calidad de las respuestas en las últimas 50 conversaciones reales.

**Escenario C.** Tu empresa está decidiendo si migrar de GPT-4o a Claude Opus 4.8 para el sistema de evaluación de reclamos. Necesitas comparar ambos modelos sobre 200 casos de prueba con métricas objetivas.

**Escenario D.** Cada noche a las 2am, un job batch procesa 5,000 solicitudes de crédito. Quieres medir semanalmente si la faithfulness del sistema está degradándose con el tiempo.

**Escenario E.** El equipo de ML quiere añadir una nueva métrica custom: "¿La justificación incluye al menos un dato numérico del expediente?". Necesita integrarse con el resto del sistema de tests existente (pytest).

---

## E14b · Predice la salida — `logic.router`

**Contexto:** Tienes el siguiente router configurado en RAGorbit:

```json
{
  "type": "logic.router",
  "config": {
    "branches": [
      {"when": "score >= 70 and decision == 'aprobar'", "output": "notif_aprobacion"},
      {"when": "decision == 'revisar'", "output": "cola_revision"},
      {"when": "decision == 'rechazar'", "output": "notif_rechazo"}
    ]
  }
}
```

Y el pipeline anterior produce estas tres decisiones en tres ejecuciones:

- Caso 1: `{"score": 72, "decision": "aprobar"}`
- Caso 2: `{"score": 55, "decision": "revisar"}`
- Caso 3: `{"score": 72, "decision": "revisar"}` ← producida antes de que `logic.rules` corrija la decisión

**Pregunta.** ¿A qué rama se enruta cada caso? ¿Qué revela el Caso 3 sobre el orden en que deben ejecutarse `logic.rules` y `logic.router`?

---

## E15b · Métricas RAG — Diagnóstico

**Contexto:** Un sistema RAG para evaluación de pre-autorizaciones médicas (template 03) muestra estas métricas tras una evaluación con RAGAS sobre 100 casos:

```
faithfulness:       0.91  ✓
answer_relevancy:   0.62  ✗
context_precision:  0.85  ✓
context_recall:     0.78  ✓
```

**Pregunta A.** ¿Qué parte del pipeline es probablemente el cuello de botella? ¿Por qué?

**Pregunta B.** La `answer_relevancy` baja (0.62) indica que las respuestas no siempre responden a lo que se preguntó. El retriever recupera chunks correctos (alta precision y recall) y el LLM no alucina (alta faithfulness). ¿Cuáles son las dos causas más probables y cómo las investigarías?

**Pregunta C.** Si subieras `topK` de 5 a 10 en `retrieval.vector`, ¿qué métricas esperarías que mejoren y cuáles podrían empeorar? Razona.

---

## E19 · Predice si Pydantic lanza ValidationError

**Contexto:** Estás portando el schema del taller M5 a Pydantic. Considera estos modelos:

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class Cita(BaseModel):
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)

class DecisionCredito(BaseModel):
    decision: str
    score: Optional[int] = Field(None, ge=0, le=100)
    factores: list[str] = Field(..., min_length=1, max_length=5)
    justificacion: str = Field(..., min_length=50)
    citations: list[Cita] = Field(...)

    @field_validator("decision")
    @classmethod
    def decision_valida(cls, v):
        if v not in {"aprobar", "revisar", "rechazar", "no_determinable"}:
            raise ValueError("decision inválida")
        return v
```

Para cada intento de construcción, indica si **pasa** o lanza **`ValidationError`** y por qué (campo y regla violada):

**A.**
```python
DecisionCredito(
    decision="aprobar",
    score=84,
    factores=["Ingreso estable"],
    justificacion="Perfil sólido con ingreso estable y bajo endeudamiento según expediente.",
    citations=[Cita(text="Ingreso: $85,000", source="declaracion_fiscal_2023.pdf")]
)
```

**B.**
```python
DecisionCredito(
    decision="APROBAR",
    score=84,
    factores=["Ingreso estable"],
    justificacion="Perfil sólido con ingreso estable y bajo endeudamiento según expediente.",
    citations=[Cita(text="Ingreso: $85,000", source="declaracion_fiscal_2023.pdf")]
)
```

**C.**
```python
DecisionCredito(
    decision="no_determinable",
    score=150,
    factores=["Datos insuficientes"],
    justificacion="No hay evidencia financiera suficiente en los documentos del expediente.",
    citations=[]
)
```

**D.**
```python
DecisionCredito(
    decision="revisar",
    score=55,
    factores=["f1", "f2", "f3", "f4", "f5", "f6"],
    justificacion="Score intermedio que requiere revisión manual por el analista de riesgo.",
    citations=[Cita(text="Deuda total: $12,000", source="datos_financieros.csv")]
)
```

---

## E20 · Completa el Field con las restricciones correctas

**Contexto:** En `solucion_framework.py`, el schema Pydantic debe ser equivalente al JSON Schema del ejercicio E15. Completa los `Field(...)` faltantes:

```python
from pydantic import BaseModel, Field
from typing import Optional

class Cita(BaseModel):
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)

class DecisionCredito(BaseModel):
    score: int = Field(..., ge=___, le=___)
    decision: str = Field(...)  # enum validado con @field_validator
    factores: list[str] = Field(..., min_length=___, max_length=___)
    justificacion: str = Field(..., min_length=___)
    citations: list[Cita] = Field(..., min_length=___)
    nivel_riesgo: Optional[str] = Field(None)  # enum: bajo, medio, alto
```

**Pregunta A.** Escribe los valores numéricos correctos para cada `___`.

**Pregunta B.** ¿Por qué `citations` usa `list[Cita]` en lugar de `list[dict]`? ¿Qué ventaja tiene frente a tu `validar_schema()` de scratch?

---

## E21 · Mapeo scratch → framework y métrica RAGAS

**Contexto:** Revisa las funciones de `lab/solucion_scratch.py` y el pipeline de `lab/solucion_framework.py`.

**Pregunta A.** Completa la tabla:

| Función scratch | Equivalente framework | ¿Cambia con el framework? |
|---|---|---|
| `validar_schema(obj)` | | |
| `fake_llm(chunks, solicitud)` | | |
| `verificar_groundedness(obj, chunks)` | | |
| `aplicar_regla_umbral(obj)` | | |

**Pregunta B.** Un sistema RAG de crédito genera esta respuesta:

> "El solicitante tiene un ingreso de $250,000 y 15 años de historial crediticio impecable."

Los chunks recuperados solo mencionan ingreso de $85,000 y 6 años de antigüedad laboral. Tu `verificar_groundedness()` de scratch podría pasar si las fuentes existen pero el texto está inventado.

¿Qué métrica RAGAS detecta este problema? ¿Por qué no basta con validar el schema Pydantic?

**Pregunta C.** ¿Cuándo elegirías `instructor` en lugar de `with_structured_output` para este taller? Da dos criterios concretos.

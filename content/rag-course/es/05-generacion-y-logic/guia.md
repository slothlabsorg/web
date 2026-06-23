# Módulo 5 · Generación, lógica y evaluación

> **Semana 5 — Nodos `logic`**
> Cómo pasar de "recuperé chunks relevantes" a "produje una decisión estructurada, citada, auditada y evaluada".

---

## Índice

1. [Síntesis con contexto — el nodo `logic.prompt`](#1-síntesis-con-contexto)
2. [Salida estructurada — `logic.structured`](#2-salida-estructurada)
3. [Citas obligatorias — `logic.citations`](#3-citas-obligatorias)
4. [Reglas deterministas — `logic.rules`](#4-reglas-deterministas)
5. [Router/condicional — `logic.router`](#5-routercondicional)
6. [Evaluación RAG — faithfulness, relevance, precision/recall](#6-evaluación-rag)
7. [Evaluación de decisiones](#7-evaluación-de-decisiones)
8. [Comparativa LCEL vs LlamaIndex query engines](#8-comparativa-lcel-vs-llamaindex-query-engines)
9. [Frameworks de evaluación — RAGAS, TruLens, DeepEval, promptfoo](#9-frameworks-de-evaluación)
10. [La capa ③ explicada: salida estructurada y evaluación con frameworks, desde cero](#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero)
11. [Resumen del módulo y checkpoint](#11-resumen-y-checkpoint)

---

## 1. Síntesis con contexto

### ¿Qué es la síntesis en RAG?

Después del retrieval tienes un conjunto de **chunks** (fragmentos de documentos) y la **pregunta o solicitud** del usuario. La síntesis es el paso donde el LLM combina ambos para producir una respuesta útil.

Sin síntesis, el RAG sería solo un motor de búsqueda que devuelve fragmentos en bruto. Con síntesis, el LLM:

- Integra información de múltiples chunks que pueden ser complementarios o aparentemente contradictorios.
- Adapta el tono y el formato a la audiencia (técnico, regulatorio, conversacional).
- Detecta qué parte de la pregunta está cubierta por los chunks y qué parte no.

### El nodo `logic.prompt`

En RAGorbit, `logic.prompt` es el nodo de síntesis de propósito general. Recibe:

- **`→ Model`** (requerido): el LLM a usar.
- **`→ Chunks`**: los fragmentos recuperados (pueden ser 0 si no hay nada relevante).
- **`→ Message`**: la pregunta o solicitud original.

Y produce **`Message →`**: la respuesta sintetizada en texto o markdown.

```
retrieval.vector ──chunks──► logic.prompt ──message──► io.output
model.llm        ──model──►
io.input         ──message──►
```

### La anatomía de un prompt de síntesis

Un buen template de síntesis tiene cuatro partes:

```
SYSTEM:
Eres un asistente de [dominio]. Responde SOLO usando los fragmentos proporcionados.
Si los fragmentos no contienen evidencia suficiente, indica "no_determinable".

CONTEXTO (chunks recuperados):
---
{chunk_1_text}
[Fuente: {chunk_1_source}]
---
{chunk_2_text}
[Fuente: {chunk_2_source}]
---

SOLICITUD:
{pregunta_del_usuario}

INSTRUCCIÓN:
Sintetiza la respuesta. Cita la fuente entre corchetes para cada afirmación.
```

### Cuándo usar `logic.prompt` vs `logic.structured`

| Situación | Nodo recomendado |
|---|---|
| Respuesta conversacional en lenguaje natural (chat de soporte, asistente técnico) | `logic.prompt` |
| Decisión que alimenta otro sistema o proceso (aprobación, score, clasificación) | `logic.structured` |
| Necesitas garantizar un contrato de tipos (campos obligatorios, enums) | `logic.structured` |
| El output se muestra directamente a un humano como texto | `logic.prompt` |

**Ejemplo en los templates:**
- Template 08 (manufactura/AMM): usa `logic.prompt` porque el técnico recibe texto en Markdown con citas, no un objeto JSON.
- Template 02 (banca): usa `logic.structured` porque el output alimenta un sistema core bancario que espera un JSON con campos tipados.

---

## 2. Salida estructurada

### El problema del texto libre

Cuando el LLM devuelve texto libre, extraer datos de esa respuesta requiere parsing frágil (regex, heurísticas) que puede fallar con cambios de modelo o redacción. Peor aún: si el LLM omite un campo crítico (como el `score` en una evaluación de crédito), el sistema aguas abajo puede fallar silenciosamente.

La **salida estructurada** fuerza al LLM a emitir un objeto JSON que se valida contra un **JSON Schema** antes de continuar el pipeline. Si el LLM no cumple el schema, el nodo falla con un error explícito — nunca propaga datos corruptos.

### JSON Schema: el contrato entre el LLM y el sistema

Un JSON Schema define la estructura esperada:

```json
{
  "type": "object",
  "required": ["decision", "score", "factores", "citations"],
  "properties": {
    "decision": {
      "type": "string",
      "enum": ["aprobar", "revisar", "rechazar"]
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "factores": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1
    },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["text", "source"],
        "properties": {
          "text": {"type": "string"},
          "source": {"type": "string"}
        }
      },
      "minItems": 1
    }
  }
}
```

Este schema garantiza que:
1. `decision` solo puede ser uno de tres valores (no "APROBADO", "aprov.", ni texto libre).
2. `score` es un entero entre 0 y 100 (no "72/100" ni "setenta y dos").
3. Siempre hay al menos un factor y al menos una cita.

### Cuatro mecanismos para obtener salida estructurada

> **Profundidad en capa ③:** la enseñanza paso a paso de Pydantic, instructor y `with_structured_output` (con recorrido del lab) está en [§10 — La capa ③ explicada](#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero). Aquí solo el panorama de diseño.

#### ① Tool-calling (función con schema)

El LLM recibe una "herramienta" cuya firma define el schema. El modelo "llama" la herramienta en lugar de responder con texto. Es el mecanismo más robusto porque el modelo ha sido fine-tuned para respetar schemas de funciones.

```python
# Con LangChain (framework real — requiere pip install langchain-anthropic)
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from pydantic import BaseModel

class DecisionCredito(BaseModel):
    decision: str
    score: int
    factores: list[str]
    citations: list[dict]

llm = ChatAnthropic(model="claude-opus-4-8")
structured_llm = llm.with_structured_output(DecisionCredito)
```

**Ventaja:** el modelo sabe que debe respetar el schema (es parte de su entrenamiento para tool-calling).
**Desventaja:** requiere que el proveedor soporte function-calling (OpenAI, Anthropic, Google — sí; modelos pequeños locales — variable).

#### ② JSON-mode

Instruye al modelo para que su output sea JSON válido. Más simple que tool-calling pero sin validación de schema — puedes obtener JSON válido pero con campos incorrectos.

```python
# Con OpenAI JSON-mode
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_object"},
    messages=[{"role": "user", "content": "Evalúa la solicitud y devuelve JSON con: decision, score, factores"}]
)
```

**Cuándo usar:** cuando el proveedor no soporta tool-calling o cuando el schema es tan simple que el riesgo de error es bajo.

#### ③ instructor (biblioteca Python)

`instructor` es un wrapper sobre la API del LLM que parsea la respuesta y la valida contra un modelo Pydantic, reintentando si la validación falla.

```python
# Requiere: pip install instructor pydantic
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field

class DecisionCredito(BaseModel):
    decision: str = Field(..., pattern="^(aprobar|revisar|rechazar)$")
    score: int = Field(..., ge=0, le=100)
    factores: list[str] = Field(..., min_length=1)
    citations: list[dict] = Field(..., min_length=1)

client = instructor.from_anthropic(Anthropic())
decision = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
    response_model=DecisionCredito,
)
```

**Ventaja:** reintentos automáticos con el error de validación como feedback al modelo.
**Desventaja:** dependencia adicional; más latencia por los reintentos.

#### ④ outlines (generación guiada por gramática)

`outlines` controla la generación token a token usando una gramática formal (regex o schema JSON), garantizando que el output sea válido por construcción — no por reintento.

```python
# Requiere: pip install outlines
import outlines

model = outlines.models.transformers("mistral-7b")
generator = outlines.generate.json(model, DecisionCredito)
decision = generator(prompt)
```

**Ventaja:** garantía matemática de validez — el output inválido es imposible, no improbable.
**Desventaja:** solo con modelos locales (Hugging Face); no funciona con APIs de proveedores.

### Tabla comparativa

| Mecanismo | Garantía de validez | APIs de nube | Modelos locales | Reintentos | Uso típico |
|---|---|---|---|---|---|
| Tool-calling | Alta (fine-tuned) | Sí | Variable | No | Producción con OpenAI/Anthropic/Google |
| JSON-mode | Media (JSON válido, no schema) | Sí | Variable | No | Schemas simples |
| instructor | Alta (valida + reintenta) | Sí | Sí | Sí | Cuando tool-calling no disponible |
| outlines | Total (gramática formal) | No | Sí | No | Modelos locales, latencia crítica |

### El nodo `logic.structured` en RAGorbit

```
model.llm    ──model──►
                        logic.structured ──decision──► logic.rules
retrieval.vector ──chunks──►
```

Config clave:
```json
{
  "type": "logic.structured",
  "config": {
    "schema": { "...JSON Schema aquí..." },
    "requireCitations": true
  }
}
```

Con `requireCitations: true`, el nodo instrucye al LLM a incluir un campo `citations` con al menos una entrada. Si el LLM lo omite, la validación del schema falla antes de propagar la decisión.

**Ancla al template 02 (banca):** el nodo `structured_decision` produce `{score, decision, factores, justificacion}` con `requireCitations: true`. El campo `decision` del LLM es solo tentativo — `logic.rules` lo sobreescribe con la decisión determinista basada en el score.

---

## 3. Citas obligatorias

### El problema de las alucinaciones sin cita

Un LLM puede producir una respuesta plausible y coherente que no está respaldada por ningún chunk recuperado. Sin un mecanismo de verificación, esta alucinación llega al usuario con la misma apariencia que una respuesta correctamente fundamentada.

En dominios de alta consecuencia (salud, crédito, seguros, aeronáutica), una respuesta sin cita verificable es inaceptable:
- Regulatoriamente: un rechazo de crédito sin cita a la evidencia puede violar ECOA/Reg B.
- Operativamente: un procedimiento de mantenimiento inventado puede causar un incidente aeronáutico.

### Groundedness: ¿la respuesta está anclada en los chunks?

**Groundedness** (o faithfulness) es la propiedad de que cada afirmación en la respuesta puede rastrearse hasta un fragmento concreto del contexto recuperado.

```
Afirmación: "El ingreso anual del solicitante es $85,000"
                            ↓
Chunk fuente: "ingreso_anual,85000,2023" [datos_financieros.csv]
                            ↓
Groundedness: VERIFICADA
```

```
Afirmación: "El solicitante tiene historial de pagos excelente durante 10 años"
                            ↓
Chunks recuperados: solo contienen datos de 2023
                            ↓
Groundedness: NO VERIFICADA → debe reportar "no_determinable"
```

### El nodo `logic.citations`

```
logic.prompt ──message──► logic.citations ──message──► io.output
retrieval.vector ──chunks──►
```

En modo `enforce`: si la respuesta no contiene citas verificables contra los chunks, el nodo **rechaza la respuesta** en lugar de dejarla pasar. Devuelve un error accionable.

En modo `annotate`: agrega anotaciones de cita a la respuesta pero no la bloquea.

```json
{
  "type": "logic.citations",
  "config": {
    "mode": "enforce"
  }
}
```

### Implementar groundedness desde cero (② scratch)

```python
def verificar_groundedness(respuesta: str, chunks: list[dict]) -> dict:
    """
    Verifica que cada oración de la respuesta aparezca (o pueda rastrearse)
    en al menos uno de los chunks.
    Versión simplificada: comprueba solapamiento de n-gramas de palabras.
    """
    palabras_chunks = set()
    for chunk in chunks:
        palabras_chunks.update(chunk["text"].lower().split())
    
    oraciones = [s.strip() for s in respuesta.split(".") if s.strip()]
    resultados = []
    
    for oracion in oraciones:
        palabras_oracion = set(oracion.lower().split())
        # Al menos 40% de las palabras deben estar en los chunks
        solapamiento = len(palabras_oracion & palabras_chunks)
        ratio = solapamiento / max(len(palabras_oracion), 1)
        resultados.append({
            "oracion": oracion,
            "grounded": ratio >= 0.4,
            "ratio": round(ratio, 2)
        })
    
    todas_grounded = all(r["grounded"] for r in resultados)
    return {"grounded": todas_grounded, "detalle": resultados}
```

**Limitación de esta implementación simple:** el solapamiento de palabras no detecta paráfrasis ni implicaciones. Los frameworks de evaluación (sección 9) usan LLMs como jueces para detectar groundedness semántica.

### Cuándo usar enforce vs annotate

| Escenario | Modo recomendado |
|---|---|
| Decisión con consecuencias legales (crédito, seguro, salud) | `enforce` |
| Sistema de auditoría regulatoria (AMM aeronáutico) | `enforce` |
| Chatbot de atención al cliente (bajo riesgo) | `annotate` |
| Sistema de búsqueda interna para empleados | `annotate` |
| Prototipo / demo | `annotate` (para no interrumpir el flujo) |

**Ancla al template 08 (manufactura):** `citations_check` en modo `enforce` es la última línea antes de que la respuesta llegue al técnico. Una alucinación en un procedimiento de mantenimiento aeronáutico no es solo un error de calidad; es un riesgo de auditoría PART-145 y de seguridad.

**Ancla al template 03 (salud):** `logic.citations` con `mode: enforce` garantiza que ninguna decisión de pre-autorización médica llegue al agente de autorización sin citar la sección exacta de la guía clínica que la respalda.

---

## 4. Reglas deterministas

### Por qué NO delegar umbrales al LLM

Esta es una de las decisiones de diseño más importantes en sistemas RAG de producción.

**El problema:** los LLMs son probabilísticos. El mismo prompt con la misma información puede producir decisiones ligeramente distintas en ejecuciones diferentes (incluso con temperatura 0, el no-determinismo puede emerger por cuantización, caché KV, etc.). Para umbrales de negocio con consecuencias legales o financieras, este no-determinismo es inaceptable.

**Ejemplos de lo que NO debe decidir el LLM:**
- "¿El score de 68 debe aprobarse o rechazarse?" (el umbral es 70 — decisión determinista)
- "¿El monto del préstamo supera el límite de aprobación automática?" (es aritmética)
- "¿La póliza está vigente a la fecha del reclamo?" (comparación de fechas)
- "¿El deducible fue alcanzado?" (resta)

**Estos sí puede decidir el LLM:**
- "¿Qué factores de riesgo emergen de estos documentos financieros?"
- "¿Cómo explicar este rechazo en lenguaje comprensible para el solicitante?"
- "¿Qué cláusula de la póliza aplica a este tipo de daño?"

### El patrón juez/árbitro

```
LLM: razona y produce score numérico (el "juez")
          ↓
Regla determinista: aplica el umbral y fija la decisión (el "árbitro")
```

Este patrón aparece en todos los dominios de alta consecuencia en RAGorbit:

| Template | LLM produce | Regla determinista decide |
|---|---|---|
| 02 banca | `score` (0–100) | `≥70→aprobar, 40-69→revisar, <40→rechazar` |
| 04 seguros | monto estimado, cláusula | `deducible_alcanzado`, `exclusion_aplicable`, `poliza_vigente` |
| 03 salud | criterio_no_encontrado, severidad | escalar si `severidad==alta OR criterio_no_encontrado==true` |
| 08 manufactura | nivel de advertencia | `si WARNING o CAUTION → hitl.escalate` |

### El nodo `logic.rules` en RAGorbit

```
logic.structured ──decision──► logic.rules ──decision──► io.output
```

Config:
```json
{
  "type": "logic.rules",
  "config": {
    "rules": [
      {"when": "score >= 70", "then": {"decision": "aprobar"}},
      {"when": "score >= 40 AND score < 70", "then": {"decision": "revisar"}}
    ],
    "else": {"decision": "rechazar"}
  }
}
```

Las reglas se evalúan en orden; la primera que se cumple gana. El `else` es el default si ninguna regla se cumple.

### Implementar `logic.rules` desde cero (② scratch)

```python
def aplicar_reglas(datos: dict, reglas: list[dict], default: dict) -> dict:
    """
    Motor de reglas determinista minimalista.
    Las reglas son strings Python evaluables contra el dict de datos.
    """
    for regla in reglas:
        condicion = regla["when"]
        # Evalúa la condición con los datos como variables locales
        try:
            if eval(condicion, {}, datos):
                resultado = dict(datos)
                resultado.update(regla["then"])
                return resultado
        except Exception as e:
            raise ValueError(f"Error evaluando regla '{condicion}': {e}")
    
    # Ninguna regla se cumplió → aplicar default
    resultado = dict(datos)
    resultado.update(default)
    return resultado

# Uso:
reglas = [
    {"when": "score >= 70", "then": {"decision": "aprobar"}},
    {"when": "score >= 40", "then": {"decision": "revisar"}}
]
datos = {"score": 72, "factores": [...]}
resultado = aplicar_reglas(datos, reglas, default={"decision": "rechazar"})
# → {"score": 72, "factores": [...], "decision": "aprobar"}
```

**Importante:** usar `eval()` en producción requiere sandboxing. Los frameworks de reglas como `durable_rules` o `business-rules` (Python) ofrecen evaluación segura sin `eval`.

### Cuándo SÍ y cuándo NO usar reglas deterministas

| Situación | Regla determinista | LLM |
|---|---|---|
| Umbral numérico (`score >= 70`) | Sí | No |
| Comparación de fechas (`fecha_inicio <= hoy`) | Sí | No |
| Aritmética financiera (monto - deducible) | Sí | No |
| Clasificación de texto ambiguo | No | Sí |
| Extracción de entidades de documentos heterogéneos | No | Sí |
| Síntesis narrativa de múltiples factores | No | Sí |
| Detección de si una cláusula aplica a un daño | No (depende) | Sí (con citas) |

---

## 5. Router/condicional

### El nodo `logic.router`

El router bifurca el flujo del grafo según el valor de una decisión. Es el equivalente a un `if/else` en el grafo:

```
logic.structured ──decision──► logic.router ──[aprobar]──► io.output (notificacion_aprobacion)
                                              ──[revisar]──► hitl.escalate (cola_revision)
                                              ──[rechazar]──► io.output (notificacion_rechazo)
```

Config:
```json
{
  "type": "logic.router",
  "config": {
    "branches": [
      {"when": "decision == 'aprobar'", "output": "aprobacion"},
      {"when": "decision == 'revisar'", "output": "revision"},
      {"when": "decision == 'rechazar'", "output": "rechazo"}
    ]
  }
}
```

### Router vs reglas deterministas

**`logic.rules`:** modifica el contenido de la decisión (cambia el valor de un campo).
**`logic.router`:** cambia el camino del flujo (qué nodo se ejecuta a continuación).

En práctica se usan en secuencia:
1. `logic.rules` fija `decision = "aprobar"` basado en el score.
2. `logic.router` lee `decision` y bifurca hacia la rama de notificación correspondiente.

### Router basado en intención

Un uso frecuente del router es después de `model.intent` o `query.intent`: según la intención detectada en la consulta, el flujo se redirige a diferentes retrievers o handlers:

```
query.intent ──decision──► logic.router ──[credito]──► retrieval (indice_credito)
                                         ──[seguro]──► retrieval (indice_seguros)
                                         ──[otro]──► logic.prompt (respuesta_generica)
```

---

## 6. Evaluación RAG

### ¿Por qué evaluar un sistema RAG?

Un sistema RAG tiene múltiples puntos de falla independientes:
1. El retriever puede traer chunks irrelevantes (baja precisión) o perderse chunks relevantes (bajo recall).
2. El LLM puede ignorar los chunks y alucinar (baja faithfulness).
3. La respuesta puede no responder a lo que el usuario preguntó (baja answer relevance).

La evaluación RAG mide cada uno de estos puntos de forma independiente para saber dónde mejorar.

### Las cuatro métricas fundamentales

#### Faithfulness (fidelidad al contexto)

*¿Las afirmaciones en la respuesta están respaldadas por los chunks recuperados?*

```
faithfulness = afirmaciones_respaldadas_por_chunks / total_afirmaciones_en_respuesta
```

- Alta faithfulness (≥0.8): el LLM sintetiza sin inventar.
- Baja faithfulness: el LLM está alucinando o ignorando el contexto.

**Cómo medirlo (con LLM-as-judge):**
Para cada afirmación en la respuesta, un LLM juez determina si está respaldada por alguno de los chunks. La proporción de afirmaciones respaldadas es el score.

#### Answer Relevance (relevancia de la respuesta)

*¿La respuesta responde a la pregunta que se hizo?*

```
answer_relevance = similitud_coseno(embedding(respuesta), embedding(pregunta))
```

En la práctica, RAGAS genera preguntas hipotéticas a partir de la respuesta y mide cuánto se parecen a la pregunta original.

#### Context Precision (precisión del contexto)

*¿Los chunks recuperados son relevantes para responder la pregunta?*

```
context_precision = chunks_relevantes_en_topK / total_chunks_en_topK
```

Mide la "contaminación" del contexto por chunks irrelevantes. Contexto irrelevante puede confundir al LLM.

#### Context Recall (recall del contexto)

*¿El sistema recuperó todos los chunks necesarios para responder correctamente?*

```
context_recall = afirmaciones_de_la_respuesta_respaldadas_por_chunks /
                 total_afirmaciones_en_la_respuesta_ideal
```

Requiere tener una respuesta ideal (ground truth) para comparar.

### Cuándo una métrica baja indica qué problema

```
Baja faithfulness  → el LLM está aluminando; revisay el prompt, reduce temperatura
Baja answer relevance → el retriever trae info correcta pero la pregunta está mal formulada
                         o el prompt de síntesis no está instruyendo bien
Baja context precision → hay ruido en el índice; revisar chunking, metadata, filtros
Bajo context recall → el retriever no encuentra todo lo relevante; subir topK,
                       revisar embeddings, considerar retrieval híbrido
```

### Diagrama de flujo de diagnóstico

```
¿Respuestas incorrectas?
        ↓
¿Baja faithfulness? ──Sí──► Problema en generación (LLM, prompt)
        ↓No
¿Baja answer relevance? ──Sí──► Problema en síntesis o intent
        ↓No
¿Baja context precision? ──Sí──► Demasiado ruido en retrieval
        ↓No
¿Bajo context recall? ──Sí──► El retriever pierde chunks necesarios
        ↓No
El sistema funciona bien → monitorea en producción
```

---

## 7. Evaluación de decisiones

### Diferencia entre evaluar RAG y evaluar decisiones

La evaluación RAG mide propiedades del flujo información (¿los chunks llegaron correctamente? ¿la respuesta refleja los chunks?). La evaluación de **decisiones** mide si la decisión de negocio es correcta.

Para evaluar decisiones necesitas:
1. Un **conjunto de casos de prueba** con la decisión correcta conocida (ground truth).
2. Las decisiones que el sistema produce sobre esos casos.
3. Métricas de clasificación: accuracy, precisión, recall, F1, confusion matrix.

### Métricas de evaluación de decisiones

| Métrica | Fórmula | Cuándo priorizar |
|---|---|---|
| Accuracy | TP+TN / total | Clases balanceadas |
| Precisión | TP / (TP+FP) | Cuando los falsos positivos son caros (aprobar crédito que no debe aprobarse) |
| Recall | TP / (TP+FN) | Cuando los falsos negativos son caros (rechazar cobertura que debe aprobarse) |
| F1 | 2 * P * R / (P+R) | Balance entre precisión y recall |
| AUC-ROC | — | Cuando el umbral es ajustable |

### Trazabilidad end-to-end

Una ventaja del patrón `logic.structured + logic.rules` es que las decisiones son completamente trazables:

```
Decisión: "rechazar"
  ↑
Regla: score < 40
  ↑
Score: 32
  ↑
Factores del LLM: ["ratio_deuda_ingreso: 0.68", "pagos_puntuales_pct: 61%"]
  ↑
Chunks fuente: [datos_financieros.csv, estado_cuenta_q3.pdf §Historial]
  ↑
Documentos originales del expediente
```

Esta cadena de trazabilidad permite auditar cualquier decisión históricamente, requisito común en entornos regulatorios (ECOA, EBA, HIPAA).

---

## 8. Comparativa LCEL vs LlamaIndex query engines

> **Recordatorio LCEL:** si necesitas repasar `ChatPromptTemplate`, el operador `|` y chat models, ve a [M1 §11](../01-fundamentos/guia.md#11-la-capa-③-explicada-langchain-desde-cero). Para **structured output** con `with_structured_output`, ve a [§10](#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero).

### LangChain Expression Language (LCEL)

LCEL define pipelines RAG como **cadenas de composición funcional** con el operador `|`:

```python
# Requiere: pip install langchain langchain-anthropic langchain-chroma
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Pipeline LCEL
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt_template
    | ChatAnthropic(model="claude-opus-4-8")
    | StrOutputParser()
)

respuesta = chain.invoke("¿Cuál es el límite de crédito?")
```

**Ventajas de LCEL:**
- Composición funcional clara y Pythonica.
- Soporte nativo de streaming (`chain.stream()`).
- Fácil paralelización con `RunnableParallel`.
- Integración nativa con LangSmith para trazas.

**Desventajas:**
- El grafo es implícito — difícil de visualizar y depurar cuando hay muchas ramas.
- Para flujos con estado complejo (memoria, bucles, HITL), se migra a LangGraph.

### LlamaIndex Query Engines

LlamaIndex estructura el pipeline alrededor del concepto de **índice + query engine**:

```python
# Requiere: pip install llama-index
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

documentos = SimpleDirectoryReader("datos/").load_data()
index = VectorStoreIndex.from_documents(documentos)

# Query engine con síntesis
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="tree_summarize"  # otros modos: compact, refine, simple_summarize
)
respuesta = query_engine.query("¿Cuáles son los criterios de aprobación?")
print(respuesta.response)
print(respuesta.source_nodes)  # chunks citados
```

**Modos de respuesta de LlamaIndex:**

| Modo | Descripción | Cuándo usar |
|---|---|---|
| `compact` | Comprime los chunks al máximo contexto y llama al LLM una vez | Respuestas simples, costo bajo |
| `refine` | Itera chunk por chunk, refinando la respuesta | Precisión alta, muchos chunks |
| `tree_summarize` | Árbol de resúmenes bottom-up | Documentos muy largos |
| `simple_summarize` | Resume todos los chunks de una vez | Resúmenes rápidos |
| `no_text` | Solo devuelve los chunks sin sintetizar | Cuando solo necesitas retrieval |

**Ventajas de LlamaIndex:**
- Abstracciones de alto nivel para pipelines RAG comunes.
- Excelente soporte de índices estructurados (SQL, pandas, knowledge graphs).
- `SubQuestionQueryEngine` para descomponer preguntas complejas en sub-preguntas.

**Desventajas:**
- Mayor curva de aprendizaje para personalización profunda.
- Abstracciones pueden ocultar lo que realmente pasa (debugging más difícil).
- Para lógica de agentes compleja, también se delega a LangGraph o similar.

### Tabla de decisión

| Criterio | LCEL / LangChain | LlamaIndex |
|---|---|---|
| Pipeline RAG estándar (query→retrieve→synthesize) | Ambos bien | Ambos bien |
| Agentes con herramientas y memoria | LangChain + LangGraph | LlamaIndex Agents (más limitado) |
| Indexación avanzada (SQL, pandas, KG) | Bien con integraciones | Mejor nativo |
| Ecosistema de loaders | LangChain (>100 loaders) | LlamaIndex (>100 readers) |
| Observabilidad integrada | LangSmith | LlamaIndex (Phoenix/Arize) |
| Salida estructurada | `with_structured_output` | `output_parser` |
| RAGorbit usa en su codegen | LangGraph (subset de LangChain) | — |

**En RAGorbit:** el codegen produce **LangGraph** (grafos de estado compilados), que usa LCEL internamente para los nodos de síntesis. LlamaIndex se usa principalmente en M2/M4 para su excelente soporte de loaders y retrievers especializados.

---

## 9. Frameworks de evaluación

> **Profundidad RAGAS en capa ③:** cómo armar el `Dataset`, qué mide cada métrica y cómo conectarlo al lab está en [§10.6](#106-ragas-evaluar-faithfulness-y-relevancia-en-batch). Aquí la comparativa con TruLens, DeepEval y promptfoo.

### RAGAS

RAGAS (Retrieval Augmented Generation Assessment) es el framework de evaluación RAG más usado. Calcula las cuatro métricas fundamentales (sección 6) usando LLMs como jueces.

```python
# Requiere: pip install ragas langchain-anthropic
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

# Datos de evaluación: pregunta, respuesta generada, chunks recuperados, respuesta ideal
data = {
    "question": ["¿Cuál es el score de crédito?"],
    "answer": ["El score es 72, lo que indica perfil crediticio sólido [datos_financieros.csv]"],
    "contexts": [["ingreso_anual: 85000 [datos_financieros.csv]", "deuda_total: 12000 [datos_financieros.csv]"]],
    "ground_truth": ["El score calculado es 72 basado en ingreso y ratio deuda/ingreso"]
}

dataset = Dataset.from_dict(data)
resultado = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision, context_recall])
print(resultado)
# → {'faithfulness': 0.92, 'answer_relevancy': 0.87, 'context_precision': 0.80, 'context_recall': 0.75}
```

**Cuándo usar RAGAS:** para evaluación batch de un sistema RAG en CI/CD o antes de un release. No es una herramienta de monitoreo en tiempo real.

### TruLens

TruLens instrumenta las llamadas al LLM y evalúa cada interacción en tiempo real, construyendo una base de datos de evaluaciones consultable.

```python
# Requiere: pip install trulens-eval
from trulens_eval import TruChain, Feedback, Tru
from trulens_eval.feedback.provider import OpenAI as FeedbackProvider

proveedor = FeedbackProvider()

# Definir feedback functions
f_faithfulness = Feedback(proveedor.groundedness_measure_with_cot_reasons).on_input_output()
f_relevance = Feedback(proveedor.relevance).on_input_output()

# Envolver el chain de LangChain
tru_recorder = TruChain(chain, app_id="credit_scoring_v1",
                        feedbacks=[f_faithfulness, f_relevance])

with tru_recorder as recording:
    respuesta = chain.invoke(pregunta)

# Ver dashboard
Tru().run_dashboard()  # → http://localhost:8501
```

**Ventaja sobre RAGAS:** evaluación en tiempo real + dashboard interactivo. Ideal para entornos de desarrollo donde quieres ver el impacto de cambios de prompt inmediatamente.

### DeepEval

DeepEval es un framework orientado a tests unitarios de LLM — integra con pytest para tratar las evaluaciones como tests:

```python
# Requiere: pip install deepeval
import pytest
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase

def test_decision_credito():
    caso = LLMTestCase(
        input="Evalúa la solicitud de crédito del expediente 001",
        actual_output=respuesta_del_sistema,
        retrieval_context=chunks_recuperados,
        expected_output="score: 72, decision: aprobar"
    )
    
    faithfulness = FaithfulnessMetric(threshold=0.8)
    relevance = AnswerRelevancyMetric(threshold=0.7)
    
    assert_test(caso, [faithfulness, relevance])
```

**Ventaja:** integración nativa con CI/CD (pytest). Permite incluir evaluaciones de calidad como parte del pipeline de integración continua.

### promptfoo

promptfoo evalúa prompts y modelos de forma agnóstica (funciona con OpenAI, Anthropic, modelos locales, etc.) usando archivos YAML de configuración:

```yaml
# promptfooconfig.yaml
prompts:
  - "Evalúa la solicitud de crédito: {{expediente}}"

providers:
  - anthropic:claude-opus-4-8
  - openai:gpt-4o

tests:
  - vars:
      expediente: "ingreso: 85000, deuda: 12000, pagos_puntuales: 97%"
    assert:
      - type: contains-json
      - type: javascript
        value: "output.score >= 70 && output.decision === 'aprobar'"
      - type: llm-rubric
        value: "La respuesta cita explícitamente los datos del expediente"
```

```bash
npx promptfoo eval
```

**Ventaja:** comparación de modelos y prompts en paralelo. Ideal para decisiones de selección de modelo o al migrar entre versiones de un LLM.

### Tabla comparativa de frameworks de evaluación

| Framework | Tipo | Integración CI/CD | Dashboard | Tiempo real | Agnóstico de proveedor |
|---|---|---|---|---|---|
| RAGAS | Batch/offline | Sí (via pytest) | No (exporta CSV/JSON) | No | Sí |
| TruLens | Instrumentación | Parcial | Sí (Streamlit) | Sí | Sí |
| DeepEval | Tests unitarios | Sí (pytest nativo) | Sí (cloud) | No | Sí |
| promptfoo | Evaluación de prompts | Sí (CLI/YAML) | Sí (HTML) | No | Sí |

**Recomendación práctica:**
- Para **CI/CD automático**: RAGAS o DeepEval (integran con pytest).
- Para **exploración y debugging**: TruLens (dashboard en tiempo real).
- Para **selección de modelo/prompt**: promptfoo (comparación en tabla).
- En producción real: combinar TruLens (monitoreo) + RAGAS (evaluación periódica).

---

## 10. La capa ③ explicada: salida estructurada y evaluación con frameworks, desde cero

> **Prerrequisito:** haber completado la capa ② del taller (`lab/solucion_scratch.py`) — o al menos entender cada función que escribiste a mano (`validar_schema`, `verificar_groundedness`, `aplicar_regla_umbral`). Esta sección enseña **solo lo nuevo de M5**: Pydantic, instructor, `with_structured_output` y RAGAS.
>
> **LangChain base (LCEL, `|`, `ChatPromptTemplate`, chat models):** ya lo aprendiste en [M1 §11 — La capa ③ explicada: LangChain desde cero](../01-fundamentos/guia.md#11-la-capa-③-explicada-langchain-desde-cero). Aquí solo recordamos lo que necesitas para structured output; no reexplicamos LCEL desde cero.
>
> **Entorno:** en la máquina de estudio del curso no hay `pip` ni red. No ejecutarás este código aquí. El objetivo es que, con `pip install instructor pydantic ragas langchain-anthropic` y una API key, puedas **escribir** `lab/solucion_framework.py` tú mismo — no solo leerlo.

### 10.1 Recordatorio rápido: lo que ya sabes de LangChain (M1 §11)

En M1 aprendiste que LangChain cablea pipelines con **LCEL** y el operador `|`:

```python
chain = template | llm | StrOutputParser()
resultado = chain.invoke({"pregunta": "...", "contexto": "..."})
```

- **`ChatPromptTemplate`:** plantilla con placeholders `{solicitud}`, `{contexto}` — equivale a tu `f-string` de prompt en scratch.
- **`ChatAnthropic` / `ChatOpenAI`:** el LLM real — equivale a tu `fake_llm()` pero con API.
- **Operador `|`:** encadena pasos; cada paso recibe la salida del anterior.

En M5 añades un paso nuevo: en lugar de `StrOutputParser()` (texto libre), usas **`with_structured_output(MiModeloPydantic)`** para obtener un objeto tipado. El resto del cableado (template, invoke) es idéntico a M1.

### 10.2 Tabla puente: scratch → frameworks de M5

Esta tabla conecta **lo que ya implementaste a mano** en `solucion_scratch.py` con **la pieza del framework** en `solucion_framework.py`:

| Lo que hiciste a mano (capa ②) | Pieza del framework (capa ③) | Qué problema resuelve |
|---|---|---|
| Dict `SCHEMA` + `validar_schema(obj)` con `isinstance`, enums, `minItems` | **Pydantic** `BaseModel` + `Field(...)` + `@field_validator` | Validación declarativa: el mismo contrato, pero automático y con mensajes de error claros |
| Parsear JSON del LLM con `json.loads()` y comprobar campos | **`instructor`** `response_model=MiModelo` o **`with_structured_output(MiModelo)`** | El LLM devuelve directamente el objeto Pydantic; si falla, reintenta |
| `verificar_groundedness()` — comprobar que `citation["source"]` existe en chunks | **RAGAS** métrica `faithfulness` | Groundedness semántica con LLM-as-judge (más profunda que tu chequeo estructural) |
| `aplicar_regla_umbral()` — `if score >= 70: decision = "aprobar"` | **Python puro** (igual en framework) | La regla determinista **nunca** va dentro del LLM — ni en scratch ni en producción |
| `fake_llm()` construye el dict de salida campo a campo | LLM real + schema Pydantic | El LLM razona; el schema fuerza la forma del output |

```
SCRATCH (stdlib)                         FRAMEWORK (M5)
────────────────────                     ────────────────────────────────────
SCHEMA = {...}                    ────▶  class DecisionCredito(BaseModel)
validar_schema(obj)               ────▶  DecisionCredito(**obj)  # o response_model
fake_llm() → dict                 ────▶  instructor / with_structured_output → DecisionCredito
verificar_groundedness()          ────▶  ragas.metrics.faithfulness
aplicar_regla_umbral()            ────▶  aplicar_regla_umbral()  # ¡sin cambios!
```

### 10.3 Pydantic desde cero (para un dev Python)

**Pydantic** es una biblioteca de validación de datos. Si ya usas type hints en Python, Pydantic los convierte en **reglas ejecutables**.

#### El problema que resuelve

En scratch escribiste esto a mano:

```python
if not isinstance(obj.get("score"), int):
    return False, "score debe ser int"
if obj["score"] < 0 or obj["score"] > 100:
    return False, "score fuera de rango"
if obj["decision"] not in {"aprobar", "revisar", "rechazar"}:
    return False, "decision inválida"
# ... 30 líneas más ...
```

Con Pydantic, el mismo contrato es **declarativo**:

```python
from pydantic import BaseModel, Field, field_validator

class DecisionCredito(BaseModel):
    decision: str = Field(..., description="aprobar, revisar, rechazar o no_determinable")
    score: int = Field(..., ge=0, le=100)  # ge=greater-or-equal, le=less-or-equal
    factores: list[str] = Field(..., min_length=1, max_length=5)
```

#### Piezas clave

| Pieza Pydantic | Equivalente en scratch | Ejemplo |
|---|---|---|
| `BaseModel` | El dict que defines como salida | `class DecisionCredito(BaseModel):` |
| `Field(..., ge=0, le=100)` | `minimum`/`maximum` en JSON Schema | `score: int = Field(..., ge=0, le=100)` |
| `Field(..., min_length=1)` | `minItems` / `minLength` | `factores: list[str] = Field(..., min_length=1)` |
| `Optional[int]` | Campo que puede ser `null` | `score: Optional[int] = Field(None, ge=0, le=100)` |
| `@field_validator("decision")` | Comprobación de enum custom | Valida que `v in {"aprobar", "revisar", ...}` |
| `model_dump()` | `dict` Python del objeto | `decision.model_dump()` → `{"decision": "aprobar", ...}` |
| `model_dump_json()` | `json.dumps(decision.model_dump())` | Para guardar o enviar a RAGAS |

#### Mini-ejemplo: válido vs ValidationError

```python
from pydantic import BaseModel, Field, ValidationError

class Cita(BaseModel):
    text: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)

# ✅ Válido — Pydantic crea el objeto sin quejarse
cita_ok = Cita(text="Ingreso anual: $85,000", source="declaracion_fiscal_2023.pdf")

# ❌ Inválido — lanza ValidationError
try:
    cita_mal = Cita(text="", source="inventado.pdf")  # text vacío viola min_length=1
except ValidationError as e:
    print(e.errors())
    # → [{'type': 'string_too_short', 'loc': ('text',), ...}]
```

**Regla mental:** cada `ValidationError` que Pydantic lanza es exactamente lo que tu `validar_schema()` devolvía como `(False, "mensaje")` — pero con la ubicación del campo (`loc`) y el tipo de error (`type`) ya estructurados.

### 10.4 instructor: structured output con reintentos

**`instructor`** envuelve el cliente del LLM (Anthropic, OpenAI…) y convierte llamadas normales en operaciones que devuelven un **modelo Pydantic**.

#### Qué hace por debajo

```
1. Tú defines response_model=DecisionCredito
2. instructor convierte el schema Pydantic en una "tool" (function) que el LLM debe llamar
3. El LLM genera la tool call con los argumentos (campos del modelo)
4. instructor parsea los argumentos → instancia DecisionCredito
5. Si la validación Pydantic falla → reenvía el error al LLM como feedback → reintenta (max_retries)
```

```
  Tu código                    instructor                    LLM (Claude)
  ─────────                    ──────────                    ────────────
  response_model=DecisionCredito
        │
        ├──────────────────▶  convierte schema a tool definition
        │                                              │
        ├──────────────────▶  messages.create(...)  ──▶│ genera tool_call
        │                                              │ con campos JSON
        │◀──────────────────  parsea + valida Pydantic │
        │                                              │
        │   (si ValidationError)                       │
        ├──────────────────▶  reintenta con error  ──▶│ corrige campos
```

#### Código mínimo (equivalente a Parte B del lab)

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field

class DecisionCredito(BaseModel):
    decision: str
    score: int = Field(..., ge=0, le=100)
    factores: list[str] = Field(..., min_length=1)
    citations: list[dict] = Field(..., min_length=1)

client = instructor.from_anthropic(Anthropic())

decision = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=2048,
    messages=[{"role": "user", "content": prompt_con_chunks}],
    response_model=DecisionCredito,
    max_retries=3,  # hasta 3 reintentos si Pydantic rechaza la respuesta
)
# decision ya es DecisionCredito — no necesitas json.loads()
```

**Conexión con §2:** instructor usa **tool-calling** por debajo (mecanismo ① de la sección 2). La diferencia es que tú no escribes la tool a mano: instructor la genera desde tu modelo Pydantic.

### 10.5 LangChain `with_structured_output`: la alternativa LCEL

Si ya usas LangChain en el pipeline (M1 §11), structured output encaja con LCEL sin biblioteca extra:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.1)
structured_llm = llm.with_structured_output(DecisionCredito)  # ← pieza nueva de M5

template = ChatPromptTemplate.from_messages([
    ("system", "Eres un analista de crédito. Responde SOLO con los documentos."),
    ("human", "Solicitud: {solicitud}\n\nDocumentos:\n{contexto}")
])

chain = template | structured_llm   # mismo patrón LCEL de M1 §11
decision = chain.invoke({"solicitud": solicitud, "contexto": contexto_chunks})
# decision es DecisionCredito
```

#### Qué hace por debajo

`with_structured_output` también usa **tool-calling**: envía el schema Pydantic como definición de función al proveedor. La diferencia con instructor:

| Aspecto | instructor | `with_structured_output` |
|---|---|---|
| Integración | Cliente directo Anthropic/OpenAI | Dentro de chain LCEL (`template \| structured_llm`) |
| Reintentos con feedback de validación | Nativo (`max_retries=3`) | Depende de versión/config; menos explícito |
| LangSmith tracing | Requiere callbacks extra | Nativo si usas LangChain |
| Cuándo elegir | Solo necesitas structured output | Ya tienes retriever + chain LangChain |

**Conexión con §8:** la fila "Salida estructurada" de la tabla LCEL vs LlamaIndex apunta aquí. LlamaIndex tiene `output_parser` equivalente; en RAGorbit el codegen usa LangChain/LangGraph.

### 10.6 RAGAS: evaluar faithfulness y relevancia en batch

**RAGAS** calcula métricas RAG (§6) usando LLMs como jueces. Tu `verificar_groundedness()` de scratch comprueba que las fuentes existen; RAGAS va más lejos y pregunta: *¿el contenido de la respuesta está respaldado semánticamente por los chunks?*

#### Cómo se construye el Dataset

RAGAS espera un `datasets.Dataset` con columnas fijas:

```python
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

data = {
    "question":     [pregunta],           # la solicitud del usuario
    "answer":       [respuesta_str],      # la decisión generada (como string/JSON)
    "contexts":     [lista_de_chunks],    # textos de los chunks recuperados
    "ground_truth": [respuesta_ideal],    # respuesta correcta conocida (para algunas métricas)
}
dataset = Dataset.from_dict(data)
resultado = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])
```

#### Qué mide cada métrica (las tres del lab)

| Métrica RAGAS | Pregunta que responde | Equivalente aproximado en scratch | Necesita `ground_truth` |
|---|---|---|---|
| **faithfulness** | ¿Las afirmaciones de la respuesta están respaldadas por los chunks? | `verificar_groundedness()` pero semántico | No |
| **answer_relevancy** | ¿La respuesta contesta la pregunta que se hizo? | (no lo mediste en scratch) | No |
| **context_precision** | ¿Los chunks recuperados son relevantes para la pregunta? | Calidad del retriever (M4) | Sí |

**Gotcha importante:** `context_precision` y `context_recall` **requieren `ground_truth`** — una respuesta ideal conocida para comparar. Sin ground truth, RAGAS no puede calcularlas. `faithfulness` y `answer_relevancy` funcionan sin ground truth.

**Conexión con §9:** la comparativa RAGAS vs TruLens vs DeepEval sigue vigente. RAGAS es para evaluación **batch** (CI/CD, releases); no es monitoreo en tiempo real.

### 10.7 Recorrido bloque por bloque de `lab/solucion_framework.py`

Abre [`lab/solucion_framework.py`](./lab/solucion_framework.py) y sigue este mapa:

```
Parte A ──▶ Parte B ──▶ Parte E ──▶ Parte D
(schema)    (instructor)  (regla)     (RAGAS)
                │
                └──▶ Parte C (LangChain alternativa)
                         │
                         └──▶ Parte F (pipeline completo)
```

#### Parte A — Schema con Pydantic

```python
class Cita(BaseModel):
    text: str = Field(..., min_length=1, description="Fragmento literal del documento")
    source: str = Field(..., min_length=1, description="Nombre del archivo")

class DecisionCredito(BaseModel):
    decision: str = Field(...)
    score: Optional[int] = Field(None, ge=0, le=100)
    factores: list[str] = Field(..., min_length=1, max_length=5)
    citations: list[Cita] = Field(...)
    # ...
    @field_validator("decision")
    @classmethod
    def decision_valida(cls, v):
        if v not in {"aprobar", "revisar", "rechazar", "no_determinable"}:
            raise ValueError(...)
        return v
```

**Por qué:** esto reemplaza tu `SCHEMA` dict + `validar_schema()`. Los `@field_validator` cubren enums que JSON Schema expresa con `"enum"` pero que necesitan mensajes custom (como `"QUIZAS"` → error claro). `Optional[int]` permite `score=None` en el caso `no_determinable` — igual que en scratch.

#### Parte B — instructor + Claude

**Por qué:** en producción no tienes `fake_llm()`. El LLM real lee los chunks y produce `DecisionCredito`. `max_retries=3` captura errores de formato que en scratch habrían hecho fallar `validar_schema()`.

#### Parte C — LangChain `with_structured_output`

**Por qué:** misma salida que Parte B, pero integrada en LCEL. Si tu pipeline ya tiene `retriever | template | ...`, solo cambias el último eslabón por `structured_llm`. Es la opción natural si vienes de M1 §11.

#### Parte D — Evaluación con RAGAS

**Por qué:** después de generar la decisión, quieres **medir** si el LLM alucinó (`faithfulness`) o si respondió a la pregunta (`answer_relevancy`). En CI/CD pondrías:

```python
assert metricas["faithfulness"] >= 0.80
```

#### Parte E — Regla determinista (Python puro)

```python
def aplicar_regla_umbral(decision: DecisionCredito) -> DecisionCredito:
    if decision.decision == "no_determinable" or decision.score is None:
        return decision
    if decision.score >= 70:
        decision.decision = "aprobar"
    elif decision.score >= 40:
        decision.decision = "revisar"
    else:
        decision.decision = "rechazar"
    return decision
```

**Por qué:** esta función es **idéntica en espíritu** a tu `aplicar_regla_umbral()` de scratch. Los frameworks no cambian esta pieza. El patrón juez/árbitro (§4) se mantiene: LLM produce score → Python aplica umbral.

#### Parte F — Pipeline completo

Orden de ejecución:

```
1. evaluar_credito_con_instructor(chunks, solicitud)  → DecisionCredito (tentativa)
2. aplicar_regla_umbral(decision)                     → decisión corregida
3. evaluar_con_ragas(...)                             → métricas de calidad
```

Es el equivalente framework de tu `main()` en scratch: fake_llm → validar → groundedness → regla.

### 10.8 Cuándo usar instructor vs `with_structured_output` vs JSON-mode

| Criterio | instructor | `with_structured_output` | JSON-mode |
|---|---|---|---|
| Ya usas LangChain en el pipeline | Menos natural | **Mejor** | Requiere parser manual |
| Solo necesitas structured output | **Mejor** (minimalista) | Overhead de LangChain | Solo si schema muy simple |
| Reintentos automáticos con feedback | **Nativo** (`max_retries`) | Variable | No |
| Validación de schema estricta | Sí (Pydantic) | Sí (Pydantic) | **No** (solo JSON sintáctico) |
| LangSmith / tracing | Callbacks extra | **Nativo** | Manual |
| Modelos sin tool-calling | Con reintentos | No disponible | **Única opción** |

#### Gotchas que debes conocer

1. **Reintentos gastan tokens.** Cada `ValidationError` que dispara un reintento es otra llamada al LLM. En producción, un schema demasiado estricto (p. ej. `justificacion` con `min_length=500`) puede multiplicar costos. Balancea rigor vs latencia.

2. **La regla determinista NUNCA va dentro del LLM.** Ni instructor ni `with_structured_output` deben evaluar `score >= 70`. Eso es `aplicar_regla_umbral()` en Python puro (Parte E). Delegar umbrales al LLM viola ECOA/Reg B y introduce no-determinismo (§4).

3. **RAGAS necesita `ground_truth` para algunas métricas.** `context_precision` y `context_recall` no funcionan sin respuesta ideal. Para evaluación continua sin ground truth, usa `faithfulness` + `answer_relevancy`.

4. **Pydantic valida forma, no verdad.** Un objeto con `citations=[{"text": "abc", "source": "inventado.pdf"}]` puede pasar Pydantic si los tipos son correctos. Por eso necesitas RAGAS `faithfulness` además del schema — igual que en scratch necesitabas `verificar_groundedness()` además de `validar_schema()`.

5. **El caso `no_determinable` es lógica de negocio, no del framework.** Si no hay evidencia, tu código (no el LLM) debe decidir retornar `decision="no_determinable"` antes de llamar al structured output — o instruir explícitamente al LLM en el prompt (como hace el lab).

### 10.9 Cómo practicar: del scratch al framework

```
Paso 1  Completa lab/solucion_scratch.py (capa ②, stdlib)
           │
Paso 2  Lee esta sección §10 completa
           │
Paso 3  Sigue la tarea guiada de capa ③ en lab/enunciado.md
           │
Paso 4  Escribe tu solucion_framework.py (o copia sección por sección
        desde el archivo de referencia, entendiendo cada bloque)
           │
Paso 5  Compara tu versión con lab/solucion_framework.py
```

**Cross-links:**
- Conceptos de diseño (por qué structured output): [§2](#2-salida-estructurada)
- LCEL vs LlamaIndex (dónde encaja `with_structured_output`): [§8](#8-comparativa-lcel-vs-llamaindex-query-engines)
- Comparativa de frameworks de evaluación: [§9](#9-frameworks-de-evaluación)
- Taller guiado capa ③: [`lab/enunciado.md`](./lab/enunciado.md)
- Solución de referencia: [`lab/solucion_framework.py`](./lab/solucion_framework.py)

---

## 11. Resumen y checkpoint

### Qué aprendiste en este módulo

1. **`logic.prompt`** sintetiza con contexto. Un buen template tiene system + chunks con fuentes + solicitud + instrucción de citar.

2. **`logic.structured`** fuerza salida JSON validada contra schema. Los cuatro mecanismos son: tool-calling (más robusto), JSON-mode (simple), instructor (reintentos + Pydantic), outlines (garantía formal, solo local).

3. **`logic.citations`** es la última línea de defensa contra alucinaciones. En modo `enforce` bloquea respuestas sin cita. Groundedness = cada afirmación ancla en un chunk recuperado.

4. **`logic.rules`** aplica reglas deterministas. Los umbrales de negocio (scores, fechas, montos) NUNCA los decide el LLM. El patrón es: LLM razona y produce datos → regla determinista decide.

5. **`logic.router`** bifurca el flujo según la decisión. Se usa después de `logic.rules` o `query.intent`.

6. **Evaluación RAG:** cuatro métricas — faithfulness (¿el LLM alucinó?), answer relevance (¿responde la pregunta?), context precision (¿los chunks son relevantes?), context recall (¿se recuperó todo lo necesario?).

7. **LCEL vs LlamaIndex:** LCEL es más flexible para agentes complejos; LlamaIndex tiene mejores abstracciones para pipelines RAG simples y indexación estructurada.

8. **Frameworks de evaluación:** RAGAS (batch), TruLens (tiempo real), DeepEval (pytest), promptfoo (comparación de modelos/prompts).

9. **Capa ③ (frameworks):** Pydantic valida el contrato; instructor / `with_structured_output` obtienen salida estructurada del LLM; RAGAS mide faithfulness; la regla determinista sigue en Python puro. Ver [§10](#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero).

### Lo sabes si puedes...

- [ ] Diseñar el JSON schema para una decisión de crédito con citas.
- [ ] Explicar por qué el umbral `score >= 70` no debe evaluarlo el LLM.
- [ ] Distinguir faithfulness de context recall (dos métricas muy diferentes).
- [ ] Elegir entre RAGAS y TruLens para un caso de uso dado.
- [ ] Escribir el schema Pydantic de una decisión de crédito y explicar qué reemplaza de `validar_schema()` en scratch.
- [ ] Distinguir cuándo usar instructor vs `with_structured_output` vs JSON-mode.

- [ ] Reconocer en qué nodo de RAGorbit vive cada pieza de lógica de los templates 02, 03, 04 y 08.

### Qué repasar

- Si tienes dudas sobre JSON Schema: lee la especificación en [json-schema.org](https://json-schema.org).
- Si el concepto de faithfulness no es claro: practica el ejercicio de groundedness del lab.
- Si la diferencia LCEL/LlamaIndex es borrosa: implementa el mismo pipeline en ambos (ejercicio 18).
- Si la capa ③ te parece "mágica": lee [§10](#10-la-capa-③-explicada-salida-estructurada-y-evaluación-con-frameworks-desde-cero) y haz la tarea guiada en [`lab/enunciado.md`](./lab/enunciado.md#capa-③--framework-tarea-guiada).

### Conexiones con otros módulos

- **M4 (retrieval):** context precision y recall miden directamente la calidad del retrieval.
- **M6 (agentes):** `agent.react` puede usar `logic.structured` como post-procesador de su respuesta final.
- **M9 (producción):** `observability.audit` registra cada decisión de `logic.structured` para trazabilidad regulatoria.
- **M11 (capstone):** en los templates 02 y 04, reconstruirás completo el pipeline de decisión estructurada.

---

*Siguiente: [Ejercicios 14–21](./ejercicios.md) · [Taller](./lab/enunciado.md)*

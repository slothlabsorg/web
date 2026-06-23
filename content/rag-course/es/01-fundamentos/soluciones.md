# M1 · Soluciones — Fundamentos de LLMs y RAG

> **Respuestas razonadas** de todos los ejercicios de `ejercicios.md`. Lee las razones, no solo la letra correcta.

---

## Bloque 1 — LLMs, tokens y ventana de contexto

**Ejercicio 1 → b) Usar RAG**

**Razón:** 200 000 palabras en español × ~2 tokens/palabra ≈ 400 000 tokens — el doble del límite de 128 000. Opción (a) confunde `max_tokens` de salida con la ventana de contexto: son cosas distintas. Opción (c) parte la información arbitrariamente y el modelo no ve el documento completo en cada llamada, perdiendo contexto entre secciones. Opción (d) es un error de diseño: incluso con 1M de tokens, meter todo el documento es costoso y genera el "lost in the middle problem". RAG recupera solo los 4–5 fragmentos más relevantes — los únicos que el modelo necesita para responder la pregunta puntual.

---

**Ejercicio 2 → b) ~30 tokens**

**Razón:** El texto tiene 32 palabras en español. Usando la regla de 1.5–2 tokens/palabra en español: 32 × ~1.7 ≈ 54 tokens... pero la opción más cercana es (c) ~55. Sin embargo, la regla es _aproximada_: el texto tiene palabras cortas (la, a, de, en, 2) que frecuentemente son 1 token, y palabras como "incrementándose" que pueden ser 3–4 tokens. Un conteo más cuidadoso: ~40–50 tokens. La respuesta correcta es (c) ~55 tokens — es la estimación más cercana a la realidad.

> **Nota:** si pusiste (b) ~30, tu estimación asumió 1 token por palabra en promedio, que es más cercano al inglés. En español la respuesta más precisa es (c).

---

**Ejercicio 3 → b) El LLM genera el siguiente token basándose en probabilidades**

**Razón:** Esta es la descripción técnica correcta de cómo funciona un LLM. Opción (a) es falsa: no hay BD interna — el "conocimiento" está implícito en los pesos de la red. Opción (c) es falsa: sin memoria explícita o herramienta externa, cada sesión empieza de cero. Opción (d) es falsa: los modelos grandes son mejores _en promedio_, pero en dominios muy específicos un modelo pequeño fine-tuned puede superar a uno grande genérico.

---

**Ejercicio 4 → b) El modelo tiene dificultad para usar información en el centro de un contexto largo**

**Razón:** Estudios como "Lost in the Middle" (Liu et al., 2023) demostraron que los LLMs tienden a usar mejor la información al inicio y al final del contexto. La información en el medio del prompt tiende a ignorarse aunque esté presente. Esto es relevante para RAG: no metas 50 chunks en el prompt esperando que el modelo use todos — usa topK bajo (3–5) y solo los más relevantes.

---

## Bloque 2 — Temperatura y prompting

**Ejercicio 5 → b) Respuestas idénticas o casi idénticas**

**Razón:** Temperatura 0 concentra toda la probabilidad en el token más probable en cada paso. El proceso es determinista (dado el mismo input, el mismo token es el más probable). En la práctica, algunos sistemas de inferencia tienen pequeñas diferencias de punto flotante que pueden producir variaciones marginales, pero para todos los efectos prácticos la respuesta es la misma. Temperatura 0 es muy útil para tests de regresión: quieres confirmar que el modelo siempre da la misma respuesta a la misma pregunta.

---

**Ejercicio 6 → Falta el mensaje de sistema y los chunks recuperados**

**Razón y corrección:** El prompt actual solo pasa la pregunta. Para un asistente de RRHH que no alucine necesitas:

1. **Un mensaje system** que instruya al modelo a basarse SOLO en los documentos.
2. **Los chunks recuperados** como contexto.
3. Opcionalmente: instrucción de decir "no sé" si no hay información relevante.

```python
SYSTEM = """Eres el asistente oficial de RRHH.
Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados.
Si la información no está en los fragmentos, di explícitamente que no tienes esa información."""

TEMPLATE = """Pregunta del empleado: {pregunta}

Fragmentos de política relevantes:
{chunks}

Responde en markdown con lenguaje claro y sencillo."""

messages = [
    {"role": "system", "content": SYSTEM},
    {"role": "user", "content": TEMPLATE.format(pregunta=pregunta, chunks=chunks_texto)}
]
response = llm.invoke(messages)
```

Sin el system y sin los chunks, el modelo inventa la respuesta usando su conocimiento general — exactamente el problema que RAG resuelve.

---

**Ejercicio 7 → c) Para preguntas que requieren múltiples pasos de razonamiento**

**Razón:** CoT brilla cuando el razonamiento necesita ser explicitado: calcular si un empleado tiene derecho a una prestación requiere verificar condiciones (antigüedad, tipo de contrato, fecha de inicio) y combinarlas. Para un simple lookup ("¿cuántos días da la empresa?"), CoT es overhead innecesario — la respuesta está directamente en el contexto. Opción (d) es falsa: CoT funciona bien incluso en modelos de 7B parámetros para tareas apropiadas.

---

**Ejercicio 8 → Ejemplo de solución**

```
[system]
Clasifica la pregunta de RRHH en una de estas categorías:
vacaciones, nómina, beneficios, onboarding, otro.
Responde SOLO con la categoría, sin explicación.

Pregunta: ¿Cuándo puedo tomar mis días de vacaciones acumulados?
Categoría: vacaciones

Pregunta: ¿Cómo veo mi recibo de nómina en el portal?
Categoría: nómina

Pregunta: ¿Puedo inscribir a mis hijos en el seguro médico de la empresa?
Categoría: beneficios

Pregunta: ¿A partir de qué mes empiezo a cotizar al IMSS?
Categoría:
```

**Respuesta esperada:** `onboarding` (es una pregunta sobre el proceso de inicio en la empresa, específicamente sobre prestaciones legales que aplican desde el primer día).

**Por qué estos ejemplos:** los tres ejemplos cubren las tres categorías más comunes para que el modelo entienda el patrón. La pregunta objetivo es sobre un proceso de onboarding (alta en seguridad social), no sobre vacaciones ni nómina directamente.

---

## Bloque 3 — RAG: por qué y cómo

**Ejercicio 9 → b) Alucinación**

**Razón:** La alucinación es cuando el modelo genera información falsa con confianza. No es un bug de programación — es una característica estructural de los LLMs: generan texto plausible basándose en patrones estadísticos, no verificando contra una fuente de verdad. El modelo "sabe" que los manuales de empleados tienen políticas de vacaciones, así que genera un número plausible. RAG soluciona esto al forzar al modelo a responder SOLO con el texto recuperado de los documentos reales.

---

**Ejercicio 10 → c) Recibir pregunta → Recuperar → Aumentar prompt → Generar**

**Razón:** Este es el orden correcto del patrón RAG en la fase online. Primero necesitas la pregunta para saber qué recuperar. Luego recuperas los chunks relevantes. Luego construyes el prompt aumentado (pregunta + chunks). Finalmente el LLM genera la respuesta usando ese contexto. No puedes aumentar el prompt antes de recuperar, ni generar antes de tener el contexto.

---

**Ejercicio 11 → b) Se recuperan los 4 fragmentos con mayor similitud a la pregunta**

**Razón:** `topK` es el parámetro que controla cuántos chunks se recuperan del índice vectorial. El nodo `retrieval.vector` calcula la similitud coseno entre el embedding de la pregunta y todos los embeddings del índice, y devuelve los K más cercanos. No son los primeros 4 del documento (eso sería recuperación por posición, no por relevancia) ni un límite de documentos totales.

---

**Ejercicio 12 → Fase offline del template 09**

```
1. loader.pdf (nodo "Docs RRHH")
   Entrada: archivos PDF en data/hr_docs/
   Salida: Documents (lista de documentos con texto y metadata)

2. ingest.chunker (nodo "Troceador por sección")
   Entrada: Documents
   Salida: Documents (fragmentos más pequeños, ~800 tokens c/u, strategy: by-section)

3. model.embedding (nodo "Modelo Embedding") + store.chroma (nodo "Chroma hr_policies")
   El chunker alimenta store.chroma con Documents.
   model.embedding alimenta store.chroma con Embeddings (los vectores de cada chunk).
   store.chroma indexa y persiste los pares (chunk, vector) en la colección hr_policies.
   Salida: Retriever (interfaz de búsqueda lista para usar en la fase online)
```

**Nota importante:** `model.embedding` y `store.chroma` se ejecutan en paralelo como entradas al store — el store recibe tanto los documentos como los vectores y los almacena juntos. Esto es exactamente como está cableado en el `flow.json` del template.

---

## Bloque 4 — Embeddings y similitud

**Ejercicio 13 → El par (A, B) es más similar**

**Cálculo:**

```
A = [0.9, 0.1, 0.0]    ||A|| = sqrt(0.81 + 0.01 + 0) = sqrt(0.82) ≈ 0.906
B = [0.8, 0.2, 0.1]    ||B|| = sqrt(0.64 + 0.04 + 0.01) = sqrt(0.69) ≈ 0.831
C = [0.0, 0.1, 0.9]    ||C|| = sqrt(0 + 0.01 + 0.81) = sqrt(0.82) ≈ 0.906

sim(A, B) = (0.9×0.8 + 0.1×0.2 + 0.0×0.1) / (0.906 × 0.831)
           = (0.72 + 0.02 + 0) / 0.753
           = 0.74 / 0.753 ≈ 0.983  ← MUY alta similitud

sim(A, C) = (0.9×0.0 + 0.1×0.1 + 0.0×0.9) / (0.906 × 0.906)
           = (0 + 0.01 + 0) / 0.821
           = 0.01 / 0.821 ≈ 0.012  ← similitud casi cero
```

**Interpretación:** Los textos A y B son sobre temas laborales (vacaciones, descanso) → alta similitud (0.983). A y C son de dominios completamente distintos (RRHH vs energía) → similitud ~0. Esto demuestra por qué RAG funciona: la pregunta del empleado sobre vacaciones tendrá alta similitud con los chunks de la política de vacaciones, y baja similitud con chunks de otros temas.

---

**Ejercicio 14 → b) `model.llm` genera respuestas; `model.embedding` convierte texto en vectores**

**Razón:** Son modelos distintos, con arquitecturas distintas, para propósitos distintos. El modelo de embedding (p.ej. `text-embedding-3-large`) toma un texto y devuelve un vector de 1536 o 3072 números. El LLM toma un prompt y genera tokens de texto. En el template 09, `model.embedding` se usa en la fase offline (indexar chunks) y en la fase online (embed la pregunta antes de buscar). `model.llm` solo se usa en la fase online para generar la respuesta final. Opción (d) tiene los roles invertidos.

---

## Bloque 5 — Elección de modelo y RAG vs fine-tuning

**Ejercicio 15 → Estrategia por caso**

**a) Chatbot con reglamento interno actualizable → RAG**

El reglamento son documentos propios (no en el preentrenamiento del modelo). Se actualiza anualmente → RAG permite actualizarlo fácilmente: re-indexas el documento nuevo y el modelo usa la versión actualizada automáticamente. Fine-tuning para actualizaciones anuales sería costoso e innecesario.

**b) Estilo formal con terminología interna específica → Fine-tuning (o RAG + fine-tuning)**

Tienes 10 000 documentos con el estilo correcto — datos suficientes para fine-tuning. El "conocimiento" aquí es procedimental (cómo escribir) más que documental (qué dice un contrato). Fine-tuning enseña al modelo a adoptar el estilo. Si además necesitas que cite contratos específicos, combinas fine-tuning + RAG.

**c) Ayuda con código Python estándar → Prompting puro**

Python estándar es un dominio público ampliamente cubierto en el preentrenamiento de cualquier modelo moderno. No tienes documentos propios. El modelo ya sabe Python. Prompting puro (zero-shot o con ejemplos específicos del tipo de código que quieres) es suficiente.

---

**Ejercicio 16 → b) Cuando los datos son confidenciales o no hay red disponible**

**Razón:** Los modelos open-weights locales son la única opción cuando los datos no pueden salir del servidor (privacidad regulatoria, datos médicos, financieros sensibles) o cuando no hay conectividad (edge computing, entornos aislados). Opción (a) es falsa: los modelos de cloud (Claude, GPT-4o) siguen siendo superiores en calidad general. Opción (c) confunde hardware con licencia. Opción (d) es falsa: Llama 3.1 70B con Ollama puede hacer RAG perfectamente bien.

---

**Ejercicio 17 → b) Haiku — la diferencia de 0.03 raramente justifica el costo**

**Razón:** Con 50 000 preguntas diarias, la diferencia de costo entre Opus y Haiku puede ser de un factor 10x o más. Una diferencia de 0.03 en faithfulness (0.94 vs 0.91) significa que de cada 100 preguntas, 3 más pueden tener algún problema con Haiku. Lo correcto es: desplegar Haiku, monitorear faithfulness en producción con una muestra real, y solo escalar a Sonnet u Opus si las métricas de producción indican problemas graves. La opción (c) podría ser válida a largo plazo pero requiere datos y tiempo. Opción (a) es extremista sin evidencia suficiente.

---

**Ejercicio 18 → Nodos adicionales necesarios**

Para que el asistente pueda **reservar** días de vacaciones en Workday, necesitas convertirlo de un RAG puro a un **agente con tools**:

```
Nodos adicionales:

1. agent.react (reemplaza o envuelve logic.prompt)
   - Conecta con: model.llm, tool.service (Workday), tool.retriever (el RAG existente como tool)
   - El agente decide cuándo buscar en políticas y cuándo actuar en Workday

2. tool.retriever (wrappea el retrieval.vector existente como tool del agente)
   - name: "buscar_politica_rrhh"
   - description: "Busca en las políticas de RRHH de la empresa"

3. tool.service → Workday API
   - name: "solicitar_vacaciones"
   - baseUrl: "https://api.workday.com/..."
   - operation: "crear_solicitud_vacaciones"
   - inputSchema: {empleado_id, fecha_inicio, fecha_fin, dias}
   - Secreto: WORKDAY_API_KEY

4. guardrail.confirm (opcional pero recomendado)
   - Envuelve tool.service
   - Pide confirmación antes de crear la solicitud

5. guardrail.idempotency (recomendado para acciones transaccionales)
   - keyFields: [empleado_id, fecha_inicio, fecha_fin]
   - Evita crear dos solicitudes idénticas si el usuario hace clic dos veces
```

**Referencia:** este patrón (RAG como tool dentro de un agente) se cubre en M6 con el template `01-airline-flight-change`. El README del template 09 también lo menciona en la sección "Cómo escalar".

---

## Bloque 6 — LangChain y capa ③

**Ejercicio 19 → c) `list[Document]`**

**Razón:** `as_retriever()` convierte el vector store en un objeto `Retriever` cuya interfaz estándar es `.invoke(query) → list[Document]`. Cada `Document` tiene `page_content` (texto del chunk) y `metadata` (p.ej. `source`). No devuelve un string concatenado — eso lo hace tu función `formatear_chunks` en la chain. No devuelve un embedding (eso lo hace `embeddings.embed_query` internamente dentro de Chroma). No devuelve el dict `{"contexto", "pregunta"}` — ese dict lo **construye** la chain LCEL en el paso del `RunnableParallel` (el dict con dos ramas) antes de pasarlo al `ChatPromptTemplate`.

**Comprobación mental:** en `solucion_framework.py`, `chunks_recuperados = retriever.invoke(query)` y luego se itera `for doc in chunks_recuperados: doc.page_content` — eso solo tiene sentido si son `Document`.

---

**Ejercicio 20 → 1→C, 2→A, 3→B, 4→D**

**Razón (tabla puente §11.2):**

| Función | LangChain | Por qué |
|---------|-----------|---------|
| `cargar_chunks()` | **C** — `TextLoader` + `CharacterTextSplitter` | Lee el archivo y lo parte por `\n---\n` en `list[Document]`. |
| `embed()` | **A** — `OpenAIEmbeddings` | Convierte texto en vector; implementa la interfaz `Embeddings`. |
| `recuperar()` | **B** — `vectorstore.as_retriever(...)` | Busca top-k por similitud y devuelve los documentos más cercanos. |
| `construir_prompt()` | **D** — `ChatPromptTemplate.from_messages(...)` | Plantilla con variables que se rellenan con contexto y pregunta. |

Confundir `embed()` con el retriever es común: el retriever **usa** embeddings por dentro, pero la función scratch que hace la búsqueda y el ranking es `recuperar()`, no `embed()`.

---

**Ejercicio 21 → Dos bugs**

**Bug 1 — Nombre de variable inconsistente:** el dict usa la clave `"context"` pero el template del prompt espera `{contexto}`. Al invocar la chain, `ChatPromptTemplate` no encuentra la variable `contexto` → `KeyError` o variable vacía.

**Corrección:**

```python
{
    "contexto": retriever | formatear_chunks,  # no "context"
    "pregunta": RunnablePassthrough(),
}
```

**Bug 2 — Falta `StrOutputParser()` al final:** sin él, `chain.invoke(query)` devuelve un **`AIMessage`** (objeto rico del proveedor), no un `str`. Si haces `print(respuesta)` esperando texto plano, verás la representación del objeto o tendrás que acceder a `.content` manualmente.

**Corrección:**

```python
chain = (
    {"contexto": retriever | formatear_chunks, "pregunta": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

**Regla:** los nombres en el dict del paso paralelo deben coincidir **exactamente** con las variables `{...}` del template (§11.10). Y en pipelines que terminan en respuesta de usuario, `StrOutputParser()` es el estándar (§11.11).

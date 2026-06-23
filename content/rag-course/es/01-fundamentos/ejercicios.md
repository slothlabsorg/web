# M1 · Ejercicios — Fundamentos de LLMs y RAG

> **Instrucciones:** resuelve cada ejercicio sin mirar las soluciones. Las respuestas razonadas están en `soluciones.md`. Tipos: (A) opción múltiple razonada, (P) predice la salida, (B) encuentra el bug, (E) elige la tecnología, (D) diseño.

---

## Bloque 1 — LLMs, tokens y ventana de contexto

**Ejercicio 1 (A)** — Un modelo tiene una ventana de contexto de 128 000 tokens. Quieres pasarle un manual de empleados de 400 páginas (≈ 200 000 palabras en español). ¿Cuál es la mejor estrategia?

a) Aumentar `max_tokens` de salida a 200 000  
b) Usar RAG: indexar el manual y recuperar solo los fragmentos relevantes  
c) Dividir el manual en dos llamadas de 100 000 palabras cada una  
d) Usar un modelo con ventana de 1 millón de tokens — siempre la mejor opción

---

**Ejercicio 2 (P)** — Predice el conteo aproximado de tokens del siguiente texto en español usando la regla de oro del módulo:

```
"La empresa otorga a sus empleados 15 días hábiles de vacaciones por año calendario,
incrementándose en 2 días cada 5 años de antigüedad."
```

a) ~10 tokens  
b) ~30 tokens  
c) ~55 tokens  
d) ~100 tokens

---

**Ejercicio 3 (A)** — ¿Cuál de estas afirmaciones sobre los LLMs es CORRECTA?

a) El LLM busca en una base de datos interna cuando responde preguntas  
b) El LLM genera el siguiente token basándose en probabilidades aprendidas durante el preentrenamiento  
c) El LLM recuerda conversaciones anteriores entre sesiones  
d) Aumentar el número de parámetros siempre mejora la calidad en todos los dominios

---

**Ejercicio 4 (A)** — El "lost in the middle problem" ocurre cuando:

a) El modelo pierde el hilo en conversaciones muy largas por tiempo de respuesta  
b) El modelo tiene dificultad para usar información ubicada en el centro de un contexto muy largo  
c) RAG recupera el chunk equivocado por estar en el medio del índice  
d) La temperatura alta hace que el modelo pierda coherencia en respuestas largas

---

## Bloque 2 — Temperatura y prompting

**Ejercicio 5 (P)** — Con `temperatura = 0.0`, ejecutas el mismo prompt exacto tres veces. ¿Qué esperas?

a) Tres respuestas completamente distintas por aleatoriedad natural del modelo  
b) Respuestas idénticas o casi idénticas (deterministas)  
c) Una respuesta vacía porque temperatura 0 desactiva la generación  
d) La misma respuesta solo si el modelo es small; los modelos grandes siguen siendo aleatorios

---

**Ejercicio 6 (B)** — Encuentra el bug en este prompt para el asistente de RRHH:

```python
prompt = f"""
Responde esta pregunta: {pregunta}
"""
response = llm.invoke(prompt)
```

Describe qué falta y cómo lo arreglarías.

---

**Ejercicio 7 (A)** — ¿Cuándo es MÁS útil el Chain-of-Thought (CoT)?

a) Para preguntas simples de lookup: "¿Cuántos días de vacaciones da la empresa?"  
b) Para tareas de generación creativa donde no hay respuesta "correcta"  
c) Para preguntas que requieren múltiples pasos de razonamiento: calcular elegibilidad, comparar condiciones  
d) Solo en modelos con más de 70B parámetros — en modelos pequeños no funciona

---

**Ejercicio 8 (D)** — Escribe un prompt few-shot de 3 ejemplos para clasificar preguntas de RRHH en: `vacaciones`, `nómina`, `beneficios`, `onboarding`, `otro`. La pregunta de clasificar es: "¿A partir de qué mes empiezo a cotizar al IMSS?"

---

## Bloque 3 — RAG: por qué y cómo

**Ejercicio 9 (A)** — Un LLM responde con total confianza: "La empresa Acme otorga 30 días de vacaciones el primer año según su Manual del Empleado versión 2023." Cuando verificas el manual real, la cifra es 15 días. Este fenómeno se llama:

a) Overfitting del modelo  
b) Alucinación  
c) Temperatura alta  
d) Context window overflow

---

**Ejercicio 10 (A)** — ¿Cuál es el orden CORRECTO de los pasos en el patrón RAG mínimo durante la fase de inferencia?

a) Recuperar → Generar → Aumentar prompt → Recibir pregunta  
b) Recibir pregunta → Aumentar prompt → Recuperar → Generar  
c) Recibir pregunta → Recuperar → Aumentar prompt → Generar  
d) Generar → Recuperar → Recibir pregunta → Aumentar prompt

---

**Ejercicio 11 (A)** — En el template `09-hr-policy-assistant`, el parámetro `topK: 4` en el nodo `retrieval.vector` significa:

a) El modelo solo puede procesar 4 documentos en total  
b) Se recuperan los 4 fragmentos con mayor similitud a la pregunta  
c) Se usan los primeros 4 chunks del documento indexado  
d) La respuesta tendrá máximo 4 oraciones

---

**Ejercicio 12 (D)** — Describe la **fase offline** del template `09-hr-policy-assistant` en términos de los nodos RAGorbit involucrados y el orden correcto. ¿Qué produce cada nodo?

---

## Bloque 4 — Embeddings y similitud

**Ejercicio 13 (P)** — Tienes tres textos y sus embeddings (simplificados a 3 dimensiones):

```
A: "días de vacaciones anuales"    → [0.9, 0.1, 0.0]
B: "política de descanso laboral"  → [0.8, 0.2, 0.1]
C: "precio del barril de petróleo" → [0.0, 0.1, 0.9]
```

Usando similitud coseno, ¿cuál par es más similar: (A, B) o (A, C)? Muestra el cálculo aproximado.

---

**Ejercicio 14 (A)** — ¿Cuál es la diferencia entre el nodo `model.llm` y el nodo `model.embedding` en RAGorbit?

a) Son el mismo nodo con distintos nombres; ambos generan texto  
b) `model.llm` genera respuestas de texto; `model.embedding` convierte texto en vectores numéricos  
c) `model.embedding` es más caro que `model.llm` en todos los proveedores  
d) `model.llm` se usa en la fase offline y `model.embedding` en la fase online

---

## Bloque 5 — Elección de modelo y RAG vs fine-tuning

**Ejercicio 15 (E)** — Para cada caso de uso, elige la mejor estrategia (RAG, fine-tuning, prompting puro) y justifica brevemente:

a) Un chatbot que responde preguntas sobre el reglamento interno de una empresa con 200 empleados. El reglamento se actualiza anualmente.

b) Un modelo que debe generar siempre en el estilo formal y con la terminología interna específica de un despacho de abogados (10 000 documentos con el estilo correcto disponibles).

c) Un asistente que ayuda a programadores a escribir código Python estándar (sin librerías internas).

---

**Ejercicio 16 (A)** — ¿Cuándo es MÁS apropiado usar un modelo de **open-weights local** (Llama, Mistral via Ollama) en lugar de una API de cloud?

a) Siempre — los modelos locales son siempre superiores en calidad  
b) Cuando los datos son confidenciales y no pueden salir del servidor, o cuando no hay red disponible  
c) Solo cuando el presupuesto es ilimitado para comprar hardware  
d) Exclusivamente para tareas de clasificación simples; los modelos locales no sirven para RAG

---

**Ejercicio 17 (A)** — Una startup quiere desplegar un asistente de RRHH con 50 000 preguntas diarias y margen ajustado. El equipo evaluó Claude Opus 4.8 (alta calidad, costo alto) y Claude Haiku 4.5 (buena calidad, costo bajo). Las métricas de eval sobre su dataset propio muestran: Opus faithfulness=0.94, Haiku faithfulness=0.91. ¿Qué recomendarías?

a) Opus siempre — la diferencia de 0.03 en faithfulness puede costar empleos  
b) Haiku — la diferencia de 0.03 en faithfulness raramente justifica el costo adicional a este volumen; monitorearlo en producción  
c) Fine-tuning de Haiku para llegar al nivel de Opus sin el costo de Opus  
d) Gemini Flash — siempre mejor que ambos para casos de alto volumen

---

**Ejercicio 18 (D)** — El equipo de RRHH quiere que el asistente del template 09 **también pueda reservar días de vacaciones** en el sistema de RRHH (Workday). Describe qué nodos adicionales necesitarías agregar al `flow.json` y por qué. No necesitas escribir el JSON completo — describe los tipos de nodo y cómo conectarlos al flujo existente.

---

## Bloque 6 — LangChain y capa ③

> Estos ejercicios comprueban que entiendes §11 de la guía *antes* de escribir `solucion_framework.py`. Si fallas varios, repasa [§11 — La capa ③ explicada: LangChain desde cero](guia.md#11-la-capa--explicada-langchain-desde-cero).

**Ejercicio 19 (P)** — Tienes este código:

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)
resultado = retriever.invoke("¿Cuántos días de vacaciones si llevo 3 años?")
```

¿Qué tipo de valor es `resultado`?

a) `str` — el texto concatenado de los 3 chunks  
b) `list[float]` — el embedding de la pregunta  
c) `list[Document]` — tres objetos con `.page_content` y `.metadata`  
d) `dict` con claves `"contexto"` y `"pregunta"`

---

**Ejercicio 20 (A)** — Empareja cada función de `solucion_scratch.py` con la abstracción LangChain correcta:

| Función scratch | ¿Cuál es la pieza LangChain? |
|-----------------|------------------------------|
| 1. `cargar_chunks()` | A. `OpenAIEmbeddings` |
| 2. `embed()` | B. `vectorstore.as_retriever(...)` |
| 3. `recuperar()` | C. `TextLoader` + `CharacterTextSplitter` |
| 4. `construir_prompt()` | D. `ChatPromptTemplate.from_messages(...)` |

Escribe el emparejamiento correcto (1→?, 2→?, 3→?, 4→?).

---

**Ejercicio 21 (B)** — Encuentra el bug en esta chain LCEL (hay **dos** errores). Explica qué fallaría y cómo lo corregirías:

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", "Responde solo con el contexto."),
    ("human", "Contexto:\n{contexto}\n\nPregunta: {pregunta}"),
])

chain = (
    {
        "context": retriever | formatear_chunks,
        "pregunta": RunnablePassthrough(),
    }
    | prompt
    | llm
)
# respuesta = chain.invoke(query)
```

---

> **Siguiente:** `soluciones.md` — respuestas razonadas de todos los ejercicios. No las abras hasta haber intentado cada ejercicio por tu cuenta.

# M1 · Fundamentos de LLMs y RAG

> **Módulo 1 — Semana 1.** Domina los conceptos que sustentan todo lo demás: qué hace un LLM por dentro, cómo le hablas, por qué RAG existe, cómo funciona el patrón mínimo y cómo elegir el modelo correcto. Al final de esta guía serás capaz de resolver el taller sin ayuda.
>
> **Nodo RAGorbit:** `model.llm`, `model.embedding` (categoría `model`). **Template de referencia:** [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/).

---

## Índice

1. [¿Qué es un LLM? Tokens y ventana de contexto](#1-qué-es-un-llm-tokens-y-ventana-de-contexto)
2. [Temperatura y otros hiperparámetros de inferencia](#2-temperatura-y-otros-hiperparámetros-de-inferencia)
3. [Prompting: system, user, few-shot, CoT](#3-prompting-system-user-few-shot-cot)
4. [Por qué RAG: alucinación, datos privados, datos frescos](#4-por-qué-rag-alucinación-datos-privados-datos-frescos)
5. [El patrón RAG mínimo](#5-el-patrón-rag-mínimo)
6. [Embeddings: intuición geométrica y similitud coseno](#6-embeddings-intuición-geométrica-y-similitud-coseno)
7. [Elección y evaluación de modelos](#7-elección-y-evaluación-de-modelos)
8. [Comparativa: Claude vs OpenAI vs Gemini vs Llama/Mistral](#8-comparativa-claude-vs-openai-vs-gemini-vs-llamamistra)
9. [RAG vs fine-tuning vs prompting puro: cuándo cada uno](#9-rag-vs-fine-tuning-vs-prompting-puro-cuándo-cada-uno)
10. [La capa ③ explicada: LangChain desde cero](#11-la-capa--explicada-langchain-desde-cero)
11. [Checkpoint](#12-checkpoint)

---

## 1. ¿Qué es un LLM? Tokens y ventana de contexto

### 1.1 La idea central

Un **Large Language Model (LLM)** es una red neuronal entrenada para predecir el siguiente *token* dado un prefijo de tokens. Durante el entrenamiento leyó una fracción significativa del texto publicado en internet, libros y código — lo que le da la ilusión de "saber" muchas cosas. En inferencia (cuando lo usas), no recuerda nada entre llamadas: cada llamada empieza de cero.

La clave es que el modelo **no busca en una base de datos** ni ejecuta ninguna consulta SQL. Genera texto token por token usando probabilidades aprendidas de la distribución del lenguaje. Eso tiene consecuencias importantes que verás en §4.

### 1.2 ¿Qué es un token?

Un token no es una palabra. Es una **unidad de texto** determinada por el tokenizador del modelo (típicamente BPE — Byte Pair Encoding o variantes similares). Como regla de oro:

- 1 palabra en inglés ≈ 1–2 tokens
- 1 palabra en español ≈ 1.3–2.5 tokens (morfología más rica = más tokens)
- 1 carácter Unicode exótico puede ser 3–5 tokens
- 100 tokens ≈ 75 palabras en inglés

**Por qué importa:** los modelos tienen un límite máximo de tokens por llamada (la "ventana de contexto"). Si te pasas, el modelo no puede procesar la entrada.

```
Texto:    "Los empleados tienen 15 días de vacaciones anuales."
Tokens:   ["Los", " emple", "ados", " tienen", " 15", " días", " de", " vac", "aciones", " anuales", "."]
Conteo:   11 tokens (aproximado — depende del tokenizador)
```

### 1.3 Ventana de contexto

La **ventana de contexto** (context window) es el número máximo de tokens que el modelo puede "ver" a la vez, incluyendo el prompt del sistema, el historial de conversación, los documentos recuperados y la respuesta generada.

| Modelo | Ventana aprox. (2025) |
|--------|----------------------|
| Claude Opus 4.8 | 200 000 tokens |
| GPT-4o | 128 000 tokens |
| Gemini 1.5 Pro | 1 000 000 tokens |
| Llama 3.1 70B | 128 000 tokens |
| Mistral Large | 128 000 tokens |

**¿Cuándo el tamaño importa?** Cuando tienes documentos largos (contratos, manuales técnicos) y quieres pasar el documento entero al modelo — esto se llama "long-context RAG" o incluso "context stuffing". La ventana grande es cómoda pero no gratuita: más tokens = más latencia y más costo.

**Cuándo NO usar ventanas enormes:** si el documento tiene 1 000 páginas, incluso 1M de tokens no alcanza, y el modelo puede perder el hilo en el medio ("lost in the middle problem"). RAG resuelve eso recuperando solo los fragmentos relevantes (§5).

### 1.4 Parámetros del modelo

Los LLMs tienen billones de parámetros (pesos de la red). El tamaño importa pero no lo es todo:

- **Modelos grandes** (70B+): mayor razonamiento, mayor costo, mayor latencia.
- **Modelos pequeños** (7B–13B): rápidos y baratos, bien para tareas clasificables.
- **Modelos destilados** (Haiku 4.5, GPT-4o-mini, Gemma 2B): balance calidad/costo para producciones de alto volumen.

> **Conexión RAGorbit:** el nodo `model.llm` tiene un campo `model` que acepta cualquier string `proveedor:nombre-modelo`. El default es `anthropic:claude-opus-4-8`. Cambias ese campo y cambias el modelo — sin tocar el resto del flujo. Ver [`docs/02-node-catalog.md` §model](../../docs/02-node-catalog.md).

---

## 2. Temperatura y otros hiperparámetros de inferencia

### 2.1 Temperatura

La **temperatura** controla qué tan "creativa" o "determinista" es la respuesta del modelo. Técnicamente, es un divisor del logit antes del softmax: temperatura baja concentra la probabilidad en los tokens más probables; temperatura alta la dispersa.

```
temperatura 0.0 → respuesta casi determinista (mismo input, mismo output)
temperatura 0.2 → respuestas muy consistentes, con poca variación
temperatura 0.7 → respuestas variadas, más "creativas"
temperatura 1.0 → distribución sin modificar
temperatura > 1.0 → respuestas caóticas, poco coherentes
```

**Regla práctica para RAG:** usa temperatura baja (0.0–0.2) cuando necesitas respuestas factuales basadas en documentos. Usa temperatura más alta solo cuando quieres variedad (p.ej. generación de opciones de redacción).

En el template de RRHH (`09-hr-policy-assistant/flow.json`), el nodo `model.llm` tiene `"temperature": 0.2`. El asistente debe ser preciso, no creativo.

### 2.2 Top-p y Top-k

- **Top-p** (nucleus sampling): solo considera los tokens cuya probabilidad acumulada llega a `p`. `top_p=0.9` = toma los tokens que representan el 90% de la probabilidad total.
- **Top-k**: solo considera los `k` tokens más probables en cada paso.

Para RAG factual: `top_p=0.9` o menos. La mayoría de las APIs lo exponen pero el default es razonable — rara vez necesitas tocarlo.

### 2.3 Max tokens de salida

Distinto a la ventana de contexto: es el límite que pones tú a la respuesta generada. Sirve para controlar costos y evitar respuestas infinitas. Para un asistente de RRHH, 512–1024 tokens de salida suele ser suficiente.

---

## 3. Prompting: system, user, few-shot, CoT

El **prompting** es la forma en que le das instrucciones al modelo. No es magia — es ingeniería de texto.

### 3.1 El formato chat: roles system y user

Los LLMs modernos de chat usan un formato de mensajes con roles:

```
[system]  Eres el asistente oficial de RRHH. Responde basándote SOLO en los documentos.
[user]    ¿Cuántos días de vacaciones tengo el primer año?
[assistant]  (respuesta del modelo)
```

- **system:** instrucciones persistentes que definen el comportamiento del modelo. Se envía una vez al inicio. El modelo lo "recuerda" durante toda la conversación (mientras esté en la ventana).
- **user:** el mensaje del humano.
- **assistant:** la respuesta que generó el modelo (en conversaciones multi-turno, el historial se pasa de vuelta).

**Cuándo usar system vs user:** pon en `system` lo que NO cambia (personalidad, restricciones, formato de respuesta). Pon en `user` lo que sí cambia (la pregunta, el contexto dinámico como los chunks recuperados).

En el template 09, el nodo `logic.prompt` usa:
- `system`: instrucciones del asistente de RRHH
- `template`: una plantilla con `{message}` y `{chunks}` que se llena dinámicamente

### 3.2 Few-shot prompting (In-Context Learning)

**In-context learning** es la capacidad del LLM de aprender a hacer una tarea simplemente viendo ejemplos en el prompt — sin reentrenamiento. Esto funciona porque el modelo ha visto millones de pares "input→output" durante el preentrenamiento y puede "imitar" el patrón.

**Few-shot** = dar unos pocos ejemplos (2–5 típicamente):

```
[system] Clasifica si la siguiente pregunta es sobre vacaciones, beneficios o nómina.

Pregunta: ¿Cuándo cobro el aguinaldo?
Categoría: nómina

Pregunta: ¿Puedo pedir días por enfermedad de un familiar?
Categoría: vacaciones

Pregunta: ¿Cómo agrego a mi cónyuge al seguro médico?
Categoría: beneficios

Pregunta: {nueva_pregunta}
Categoría:
```

**Zero-shot** = sin ejemplos. Funciona bien con modelos grandes y tareas comunes. **One-shot** = un solo ejemplo.

**Cuándo usar few-shot:**
- La tarea tiene un formato de salida específico que el modelo no produce bien sin ejemplos.
- El modelo comete errores con zero-shot (evalúa primero con zero-shot, luego añade ejemplos solo si hace falta).
- No abuses: cada ejemplo consume tokens de la ventana.

### 3.3 Chain-of-Thought (CoT)

**Chain-of-Thought** es decirle al modelo que "piense en voz alta" antes de responder. Mejora significativamente el razonamiento en preguntas que requieren múltiples pasos.

```
Versión sin CoT:
[user] ¿Tiene derecho a vacaciones un empleado que lleva 8 meses?
[assistant] No tiene derecho completo todavía.  ← puede estar bien o mal

Versión con CoT:
[user] ¿Tiene derecho a vacaciones un empleado que lleva 8 meses?
       Piensa paso a paso antes de responder.
[assistant]
1. La política dice que los empleados acumulan 1 día por mes completo trabajado.
2. 8 meses completos = 8 días acumulados.
3. Por tanto, sí tiene derecho a 8 días de vacaciones proporcionales.
Respuesta: Sí, tiene derecho a 8 días de vacaciones proporcionales.
```

**Cuándo usar CoT:**
- Preguntas de razonamiento complejo (eligibilidad, cálculos, multi-paso).
- Cuando necesitas auditar el razonamiento del modelo (el "paso a paso" lo expone).
- No necesario para preguntas simples de recuperación de hecho.

**Zero-shot CoT:** simplemente añade "Piensa paso a paso." al final del prompt. Funciona sorprendentemente bien.

### 3.4 Prompt templates con variables

En producción, el prompt no se escribe "a mano" en cada llamada. Se usan **templates** con variables que se sustituyen dinámicamente:

```python
TEMPLATE = """Eres el asistente de RRHH.

Pregunta del empleado: {message}

Fragmentos de política relevantes:
{chunks}

Responde en markdown con lenguaje sencillo."""

prompt = TEMPLATE.format(
    message="¿Cuántos días de vacaciones tengo?",
    chunks="§3.1 Vacaciones: Los empleados acumulan 1 día por mes..."
)
```

Esto es exactamente lo que hace el nodo `logic.prompt` del template 09.

---

## 4. Por qué RAG: alucinación, datos privados, datos frescos

### 4.1 El problema de la alucinación

Los LLMs **generan** texto — no lo recuperan de una base de datos. Cuando no saben la respuesta, en lugar de decir "no sé", tienden a inventar una respuesta plausible con total confianza. Esto se llama **alucinación**.

```
Pregunta: ¿Cuántos días de vacaciones por ley corresponden en México?
LLM sin RAG: "15 días en el primer año, aumentando 2 días por cada año adicional."
← Correcto para México. Pero si preguntas por la política interna de tu empresa...

Pregunta: ¿Cuántos días de vacaciones da Empresa X el primer año?
LLM sin RAG: "Empresa X otorga 20 días hábiles el primer año..." ← INVENTADO
```

El modelo "sabe" que las empresas tienen políticas de vacaciones y genera algo plausible — pero no tiene acceso a la política real de tu empresa.

**RAG soluciona esto** pasándole al modelo los documentos reales como contexto. El modelo ya no inventa: razona sobre texto que tú le proporciones.

### 4.2 El problema de los datos privados

Los LLMs preentrenados solo saben lo que estaba en su corpus de entrenamiento — que es público. **Tu manual del empleado, tus contratos, tu base de datos de clientes no están ahí.**

Opciones para incluir conocimiento privado:
1. **RAG** (este módulo): recuperas los documentos relevantes en tiempo real y los pones en el prompt.
2. **Fine-tuning** (§9): reentenas el modelo con tus datos — costoso, requiere expertise.
3. **Context stuffing**: metes el documento entero en el prompt — funciona solo para documentos pequeños.

RAG es la opción más práctica para la mayoría de los casos.

### 4.3 El problema de los datos frescos

El preentrenamiento tiene una **fecha de corte** (knowledge cutoff). Un modelo entrenado hasta marzo de 2024 no sabe nada de lo que pasó después — ni cambios de ley, ni nuevas políticas de empresa, ni precios actuales.

**RAG permite conocimiento en tiempo real** porque los documentos que recuperas son los que mantienes actualizados tú. Actualizas el índice → el modelo automáticamente usa la información nueva.

### 4.4 Resumen: cuándo NO necesitas RAG

- **Tarea general:** redactar un email, resumir un texto que el usuario pega directamente, traducir.
- **Conocimiento público bien cubierto:** preguntas de programación, matemáticas, historia general.
- **Datos pequeños y estáticos** que caben en el context window: puedes hacer "context stuffing" directo.

---

## 5. El patrón RAG mínimo

**RAG = Retrieval-Augmented Generation.** En una frase: antes de llamar al LLM, recuperas los fragmentos de documento más relevantes para la pregunta y los metes en el prompt.

### 5.1 Los cuatro pasos

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PATRÓN RAG MÍNIMO                              │
│                                                                       │
│  1. PREGUNTA                                                          │
│     El usuario escribe: "¿Cuántos días de vacaciones tengo?"         │
│                │                                                      │
│                ▼                                                      │
│  2. RECUPERAR (Retrieve)                                              │
│     Convierte la pregunta en un vector embedding.                    │
│     Busca en el índice los K fragmentos más similares.               │
│                │                                                      │
│                ▼                                                      │
│  3. AUMENTAR EL PROMPT (Augment)                                      │
│     Construye el prompt: instrucciones + chunks recuperados          │
│     + pregunta del usuario.                                          │
│                │                                                      │
│                ▼                                                      │
│  4. RESPONDER (Generate)                                              │
│     El LLM genera la respuesta usando SOLO el contexto dado.         │
│     "Según §3.1, tienes 12 días hábiles el primer año."              │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 El flujo completo (con indexado offline)

El patrón RAG tiene dos fases:

**Fase offline (indexado):** ocurre una vez, o cuando actualizas documentos.

```
Documentos PDF/texto
        │
        ▼
  Chunking (trocear en fragmentos)
        │
        ▼
  Embedding de cada chunk → vector
        │
        ▼
  Almacenar vectores en un índice (vector store)
```

**Fase online (inferencia):** ocurre en cada pregunta del usuario.

```
Pregunta del usuario
        │
        ▼
  Embedding de la pregunta → vector
        │
        ▼
  Buscar en el índice: top-K chunks más similares
        │
        ▼
  Construir prompt aumentado:
    system + chunks + pregunta
        │
        ▼
  LLM genera respuesta
        │
        ▼
  Respuesta al usuario (con citas)
```

### 5.3 Cómo se mapea al template 09

```
Fase offline:
  loader.pdf  →  ingest.chunker  →  [model.embedding]  →  store.chroma

Fase online (por pregunta):
  io.input (pregunta)
      │
      ├──▶ retrieval.vector ◀── store.chroma (Retriever)
      │         │ top-4 chunks
      │         ▼
      └──▶ logic.prompt ◀── model.llm
               │ respuesta con citas
               ▼
         logic.citations
               │
               ▼
           io.output
```

Cada nodo del template 09 corresponde exactamente a un paso del patrón RAG mínimo.

### 5.4 ¿Por qué top-K y no todos los chunks?

Aunque la ventana sea enorme, pasar todos los chunks al modelo es costoso (tokens = dinero) y puede confundirlo ("lost in the middle"). El parámetro `topK=4` del nodo `retrieval.vector` del template significa: recuperar solo los 4 fragmentos más relevantes. Ese número es un default empírico — 3-5 es el rango usual para documentos de política.

---

## 6. Embeddings: intuición geométrica y similitud coseno

### 6.1 ¿Qué es un embedding?

Un **embedding** es una función que convierte texto (o cualquier dato) en un vector de números de alta dimensión. La propiedad clave: **textos semánticamente similares quedan cerca en el espacio vectorial**.

```
"política de vacaciones"    → [0.12, -0.34, 0.89, 0.01, ...]  (1536 números)
"días de descanso anuales"  → [0.11, -0.33, 0.91, 0.02, ...]  (muy cerca)
"precio del petróleo"       → [-0.67, 0.45, -0.23, 0.78, ...]  (muy lejos)
```

### 6.2 Intuición geométrica

Imagina que cada texto es un punto en un espacio de 1 536 dimensiones (el tamaño de los embeddings de `text-embedding-3-large`). Textos con el mismo significado quedan en "zonas" del espacio:

```
          políticas RRHH
          ┌────────────────────┐
          │  vacaciones ●      │
          │  descanso ●        │     precios
          │  días libres ●     │  ┌──────────────┐
          └────────────────────┘  │ petróleo ●   │
                                  │ gas ●        │
                                  └──────────────┘
```

La búsqueda por similitud consiste en: "dado el embedding de la pregunta, ¿cuál es el punto más cercano en el espacio?"

### 6.3 Similitud coseno

La métrica más usada para comparar embeddings es la **similitud coseno**: mide el ángulo entre dos vectores, independientemente de su magnitud.

```
similitud_coseno(A, B) = (A · B) / (||A|| × ||B||)

Rango: -1 (opuestos) a 1 (idénticos)
```

En Python puro:

```python
import math

def coseno(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x**2 for x in a))
    norm_b = math.sqrt(sum(x**2 for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
```

### 6.4 Embeddings de producción vs embeddings de juguete

Para el taller del módulo usarás embeddings "de juguete" (bag-of-words o char n-grams). Son suficientes para entender el mecanismo, pero en producción usarás modelos dedicados:

| Modelo de embeddings | Dimensiones | Notas |
|---------------------|-------------|-------|
| `text-embedding-3-large` (OpenAI) | 3 072 (reducible) | Default RAGorbit |
| `text-embedding-3-small` (OpenAI) | 1 536 | Más barato, buena calidad |
| `embed-english-v3.0` (Cohere) | 1 024 | Multilingüe disponible |
| `bge-large-en-v1.5` (BAAI, local) | 1 024 | Open weights, sin API key |
| `E5-large` (Microsoft, local) | 1 024 | Excelente en benchmarks |

**Cuándo usar embeddings locales:** privacidad total (ningún texto sale de tu servidor), sin costo por token de embedding, integrable en Ollama.

> **Conexión RAGorbit:** el nodo `model.embedding` en el template 09 tiene `"model": "text-embedding-3-large"`. Cambias ese campo a `"local": true` y un modelo local para embeddings sin API.

### 6.5 La diferencia entre embeddings y el LLM

Confunde a muchos: el LLM (nodo `model.llm`) y el modelo de embedding (nodo `model.embedding`) son modelos distintos con roles distintos.

| | LLM | Modelo de embedding |
|-|-----|---------------------|
| Rol | Genera texto de respuesta | Convierte texto en vector |
| Cuándo se usa | En inferencia (generar respuesta) | Offline (indexar) + online (embed pregunta) |
| Salida | Tokens de texto | Vector numérico |
| Ejemplo | `claude-opus-4-8` | `text-embedding-3-large` |

---

## 7. Elección y evaluación de modelos

### 7.1 Los tres ejes de decisión

Elegir un modelo siempre es un balance de tres variables:

```
         Calidad
            ▲
            │       Claude Opus
            │    GPT-4o  ●
            │       ●
            │  Gemini Pro ●
            │
            │      Llama 70B ●
            │  Mistral Large ●
            │
            │    Claude Haiku ●
            │ GPT-4o-mini ●
            └──────────────────────────▶ Velocidad (baja latencia)
              ──────────────────────────▶
                      Costo (bajo)
```

No puedes maximizar los tres a la vez. La elección depende de tu caso de uso.

### 7.2 Métricas de evaluación

Para elegir un modelo para RAG, evalúa sobre **tu propio dataset** con estas métricas:

| Métrica | Qué mide | Herramienta |
|---------|----------|-------------|
| Faithfulness | ¿La respuesta está respaldada por los chunks? | RAGAS |
| Answer Relevancy | ¿La respuesta responde la pregunta? | RAGAS |
| Context Precision | ¿Los chunks recuperados son relevantes? | RAGAS |
| Context Recall | ¿Se recuperaron todos los chunks necesarios? | RAGAS |
| Latencia P95 | Tiempo de respuesta percentil 95 | Medición directa |
| Costo por 1K preguntas | Tokens entrada + salida × precio | Calculado |

**Principio:** no elijas modelo por benchmark genérico. Evalúa en tu dominio específico con un eval set de 50–200 preguntas con respuestas de referencia.

### 7.3 Proceso recomendado de evaluación

1. Construye un eval set: 50–100 pares (pregunta, respuesta correcta) basados en tus documentos reales.
2. Ejecuta el pipeline RAG completo con cada modelo candidato.
3. Mide faithfulness, answer relevancy y latencia.
4. Elige el modelo con el mejor balance calidad/costo para tu SLA.

### 7.4 Cuándo usar un modelo pequeño

Para tareas de **clasificación ligera** (¿es esta pregunta sobre vacaciones, nómina o beneficios?), un modelo pequeño (Haiku 4.5, GPT-4o-mini, Llama 3.1 8B) puede ser suficiente y 10–100x más barato.

En RAGorbit, el nodo `model.intent` es justamente para esto: clasificar antes de ejecutar el RAG costoso. Si la pregunta no es sobre RRHH, no llamas al pipeline completo.

---

## 8. Comparativa: Claude vs OpenAI vs Gemini vs Llama/Mistral

### 8.1 Modelos cerrados (closed-source / proprietary)

Accedes vía API. No puedes ver los pesos, no puedes desplegar en tu servidor.

| | Claude (Anthropic) | GPT (OpenAI) | Gemini (Google) |
|-|--------------------|-------------|-----------------|
| Modelos principales | Opus 4.8, Sonnet 4.6, Haiku 4.5 | GPT-4o, GPT-4o-mini | Gemini 1.5 Pro, Flash |
| Ventana contexto | 200K | 128K | 1M |
| Fortalezas | Razonamiento largo, seguimiento de instrucciones, seguridad | Ecosistema amplio, función calling | Ventana enorme, multimodal, integración Google |
| Precio (aprox, 2025) | Opus: ~$15/MTok salida | GPT-4o: ~$10/MTok salida | Pro: ~$7/MTok salida |
| Modo offline | No | No | No |
| Default RAGorbit | `anthropic:claude-opus-4-8` | configurable | configurable |

RAGorbit usa `init_chat_model` de LangChain, que soporta todos estos proveedores cambiando solo el campo `model`.

### 8.2 Modelos open-weights

Los pesos son públicos. Puedes descargarlos, ejecutarlos en tu hardware o en Ollama.

| | Llama (Meta) | Mistral | Gemma (Google) |
|-|--------------|---------|----------------|
| Licencia | Llama 3 Community | Apache 2.0 (Mistral 7B) | Gemma Terms |
| Modelos | Llama 3.1 8B/70B/405B | Mistral 7B, Mixtral 8x7B, Mistral Large | Gemma 2 2B/9B/27B |
| Cómo usarlos | Ollama, HuggingFace, vLLM | Ollama, Mistral API | Ollama, HuggingFace |
| Costo | Solo infraestructura | Solo infraestructura | Solo infraestructura |
| Privacidad | Total (sin API externa) | Total si local | Total si local |

### 8.3 Hugging Face y Ollama

**Hugging Face** es el repositorio central de modelos open-weights. Tiene una API de inferencia (pagada o gratuita con límites) y miles de modelos para embeddings, LLMs, modelos de visión, etc.

**Ollama** es la forma más fácil de correr modelos localmente:

```bash
ollama run llama3.1         # descarga y corre Llama 3.1 8B
ollama run mistral          # Mistral 7B
ollama run nomic-embed-text # embeddings locales
```

En RAGorbit puedes apuntar a Ollama cambiando `model` a `ollama:llama3.1` en el nodo `model.llm`.

### 8.4 Cuándo usar qué

| Situación | Recomendación |
|-----------|---------------|
| Prototipo rápido, no importa el costo | Claude Opus 4.8 o GPT-4o |
| Producción alta calidad, presupuesto flexible | Claude Sonnet 4.6 o GPT-4o |
| Producción alto volumen, minimizar costo | Claude Haiku 4.5 o GPT-4o-mini |
| Datos confidenciales, sin cloud | Llama 3.1 70B vía Ollama o vLLM |
| Sin red / entorno aislado | Ollama con modelo local |
| Embeddings con privacidad total | `bge-large` o `E5` local vía Ollama |

---

## 9. RAG vs fine-tuning vs prompting puro: cuándo cada uno

### 9.1 Las tres estrategias para "enseñarle" al modelo

```
PROMPTING PURO             RAG                      FINE-TUNING
──────────────────         ──────────────────────   ──────────────────
Instrucciones en           Recupera documentos      Reentrena los pesos
el prompt                  relevantes y los         del modelo con
                           mete en el prompt        tus datos

Costo:       mínimo        medio                    alto
Privacidad:  baja          media                    alta (si local)
Actualizable:instante      cuando actualizas índice cuando reentrenas
Requiere datos: no         sí (documentos)          sí (muchos pares Q/A)
```

### 9.2 Prompting puro

**Cuándo funciona bien:**
- Tareas generales donde el modelo ya tiene buen conocimiento (redactar, reformatear, traducir).
- Conocimiento público reciente bien cubierto en el preentrenamiento.
- Few-shot para tareas de clasificación simples.

**Cuándo no es suficiente:**
- El modelo no conoce tus datos privados.
- La información cambia frecuentemente (knowledge cutoff).
- Necesitas citar la fuente exacta (el modelo puede inventar citas).

### 9.3 RAG

**Cuándo usar RAG:**
- Tienes documentos propios (manuales, contratos, FAQs, base de conocimiento).
- La información cambia y necesitas que el modelo siempre use la versión más reciente.
- Necesitas trazabilidad (citar el fragmento exacto que respaldó la respuesta).
- Presupuesto limitado para fine-tuning.

**Cuándo RAG no es suficiente por sí solo:**
- Tareas que requieren razonamiento muy específico del dominio (p.ej. interpretar cláusulas legales complejas) — RAG da el contexto, pero el modelo base puede no razonar bien sobre él sin entrenamiento adicional.
- Cuando el "conocimiento" es procedimental y está en el comportamiento del modelo, no en documentos.

### 9.4 Fine-tuning

**Cuándo considerar fine-tuning:**
- Necesitas que el modelo adopte un estilo o tono muy específico (voz de marca).
- El dominio es tan especializado que el modelo base produce errores consistentes aunque le des el contexto (medicina, derecho muy técnico).
- Tienes muchos pares (input, output) de alta calidad (mínimo 500–1000, mejor 5 000+).
- El volumen de producción justifica el costo del entrenamiento.

**Cuándo NO usar fine-tuning:**
- Como primera opción (RAG es más barato y rápido de iterar).
- Cuando los datos cambian frecuentemente (reentrenar es costoso).
- Cuando no tienes datos de calidad.

### 9.5 Combinación: RAG + fine-tuning

En sistemas maduros se usan **juntos**: el modelo fine-tuned entiende mejor el dominio y razona mejor sobre el contexto que RAG le provee. El fine-tuning enseña el "cómo razonar"; RAG provee el "qué".

### 9.6 Tabla de decisión

```
¿Tienes documentos propios actualizables?
  NO → Prompting puro (zero/few-shot)
  SÍ → RAG

¿RAG + modelo base dan calidad suficiente?
  SÍ → Quédate con RAG
  NO → ¿Tienes +1000 pares Q/A de calidad?
         NO → Mejora el prompting/retrieval
         SÍ → Considera fine-tuning sobre el modelo base
              o fine-tuning + RAG
```

---

## 11. La capa ③ explicada: LangChain desde cero

> **Prerrequisito:** haber implementado la capa ② del taller (`lab/solucion_scratch.py`) o al menos entender cada función que escribiste a mano. Esta sección es la **base de LangChain para todo el curso** — los módulos M2–M11 enlazarán aquí. Léela completa antes de intentar escribir `lab/solucion_framework.py`.
>
> **Entorno:** en esta máquina de estudio no hay `pip` ni red. **No podrás ejecutar** el código de esta sección aquí. El objetivo es que, cuando tengas un entorno con `pip install langchain langchain-community langchain-openai chromadb` y una API key, puedas **escribir** la solución framework tú mismo — no solo leerla.

### 11.1 Qué es LangChain y por qué existe

Imagina que acabas de terminar `solucion_scratch.py`. Funciona. Pero para llevarlo a producción necesitas:

- Embeddings reales (API de OpenAI u Ollama local).
- Un vector store con índice eficiente (Chroma, no una lista en memoria).
- Un LLM real (GPT-4o, Claude…).
- Plantillas de prompt reutilizables.
- Cablear todo: *query → recuperar → formatear → prompt → LLM → texto*.

En scratch, **tú** escribiste ese cableado función por función. En un sistema real, ese cableado se repite en cada proyecto RAG con pequeñas variaciones. **LangChain existe para no reescribir el cableado cada vez** — te da piezas estándar que encajan entre sí.

**Analogía:** construiste un circuito con cables sueltos (scratch). LangChain es una caja de **módulos con conectores estándar**: cada pieza tiene una interfaz conocida (`Document`, `Embeddings`, `VectorStore`, `Retriever`, `Runnable`) y las conectas con `|` en lugar de llamar funciones a mano.

```
SCRATCH (tú cableas todo)              LANGCHAIN (piezas + conectores)
─────────────────────────              ─────────────────────────────────
cargar_chunks()          ────────────▶  TextLoader + CharacterTextSplitter
embed()                  ────────────▶  OpenAIEmbeddings (interfaz Embeddings)
lista en memoria         ────────────▶  Chroma.from_documents(...)
similitud + sort         ────────────▶  vectorstore.as_retriever(...)
construir_prompt()       ────────────▶  ChatPromptTemplate
llm fake                 ────────────▶  ChatOpenAI / ChatAnthropic
main() secuencial        ────────────▶  chain LCEL con operador |
```

**Qué problema te quita de encima:**

| Sin LangChain | Con LangChain |
|---------------|---------------|
| Reimplementar chunking, embedding, búsqueda top-k en cada proyecto | Loaders, splitters, stores y retrievers listos |
| Cambiar de OpenAI a Anthropic = reescribir llamadas HTTP | Cambiar `ChatOpenAI` por `ChatAnthropic` — una línea |
| El pipeline es código imperativo difícil de testear por pasos | LCEL descompone el flujo en pasos componibles (`Runnable`) |
| Sin convención: cada equipo nombra distinto | Misma interfaz en tutoriales, RAGorbit y producción |

**Qué NO hace LangChain:** no mejora la calidad del RAG por sí solo. Si tus chunks son malos o el prompt es débil, LangChain no lo arregla. Solo **orquesta** mejor lo que ya diseñaste en §5 y §6.

### 11.2 Tabla puente: scratch → LangChain

Esta tabla mapea **cada función** de `solucion_scratch.py` a su abstracción LangChain en `solucion_framework.py`:

| Lo que hiciste a mano (capa ②) | Pieza LangChain (capa ③) | Nodo RAGorbit (template 09) |
|--------------------------------|--------------------------|----------------------------|
| `cargar_chunks(ruta)` — leer txt y dividir por `---` | `TextLoader(...).load()` + `CharacterTextSplitter(...).split_documents(...)` | `loader` + `ingest.chunker` |
| `embed(texto)` — bag-of-words → `dict` | `OpenAIEmbeddings(model=...)` (implementa interfaz `Embeddings`) | `model.embedding` |
| Lista `chunks` en memoria + vectores calculados al vuelo | `Chroma.from_documents(documents, embedding, collection_name=...)` | `store.chroma` |
| `similitud_coseno()` + `sort` en `recuperar()` | `vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 3})` | `retrieval.vector` |
| `recuperar()` devuelve `(índice, sim, texto)` | `retriever.invoke(query)` devuelve `list[Document]` | (mismo retriever) |
| `construir_prompt()` — f-string con chunks numerados | `ChatPromptTemplate.from_messages([("system",...), ("human",...)])` | `logic.prompt` |
| (no hay LLM real en scratch) | `ChatOpenAI(model=..., temperature=...)` o `ChatAnthropic(...)` | `model.llm` |
| `main()` llama funciones en orden | Chain LCEL: `dict \| prompt \| llm \| StrOutputParser()` | edges del `flow.json` |

### 11.3 El objeto `Document`

LangChain no trabaja con strings sueltos para documentos indexables. Usa **`Document`**:

```python
# Conceptual — cada chunk es un Document
doc = Document(
    page_content="POLÍTICA DE VACACIONES §3 — Acumulación y disfrute\nLos empleados...",
    metadata={"source": "datos/politicas_rrhh.txt", "chunk": 0},
)
```

- **`page_content`:** el texto del fragmento (equivale a cada string en tu lista `chunks` de scratch).
- **`metadata`:** diccionario de etiquetas (`source`, sección, fecha…). En scratch no tenías metadata; en producción permite **filtros duros** (M4): "solo chunks de `section=§3`".

Los loaders y splitters **producen** `list[Document]`. Los vector stores **consumen** `list[Document]`. Los retrievers **devuelven** `list[Document]`.

### 11.4 Loaders: `TextLoader`

Un **loader** lee una fuente externa y la convierte en documentos LangChain.

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
documentos_raw = loader.load()
# documentos_raw: list[Document] — típicamente UN Document con todo el archivo
```

**Equivalente scratch:** abrir el archivo y leer `contenido = f.read()` — pero envuelto en un `Document` con `metadata={"source": "datos/politicas_rrhh.txt"}`.

En M2 verás loaders para PDF, web, SQL, etc. El patrón es siempre el mismo: `.load()` → `list[Document]`.

### 11.5 Text splitters: `CharacterTextSplitter`

El archivo de políticas tiene **8 fragmentos** separados por `\n---\n`. En scratch hiciste `re.split(r"\n---\n", contenido)`. En LangChain:

```python
from langchain.text_splitter import CharacterTextSplitter

splitter = CharacterTextSplitter(
    separator="\n---\n",    # dónde cortar (igual que tu separador)
    chunk_size=1000,         # máximo de caracteres por chunk (respaldo si un bloque es enorme)
    chunk_overlap=0,         # cuántos caracteres se solapan entre chunks consecutivos
    keep_separator=False,    # si True, el separador queda dentro del chunk
)
chunks = splitter.split_documents(documentos_raw)
# chunks: list[Document] — 8 Document, uno por fragmento de política
```

| Parámetro | Qué hace |
|-----------|----------|
| `separator` | Cadena (o regex) donde partir. Aquí replica `cargar_chunks()`. |
| `chunk_size` | Límite de caracteres. Si un bloque supera 1000, lo parte de nuevo. |
| `chunk_overlap` | Repite N caracteres del final del chunk anterior al inicio del siguiente — útil para no cortar frases a la mitad (M2). |
| `keep_separator` | `False` = el `---` no aparece en `page_content`. |

**`.split_documents(...)`** recibe `list[Document]` y devuelve `list[Document]` más pequeños. No confundir con `.split_text(...)` que trabaja sobre strings.

### 11.6 La interfaz `Embeddings`

En scratch, `embed()` devolvía un `dict[str, float]`. En producción, un embedding es un **vector denso** de cientos o miles de floats. LangChain unifica todos los proveedores bajo la interfaz **`Embeddings`**:

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
# La API key se lee de la variable de entorno OPENAI_API_KEY

vec = embeddings.embed_query("¿Cuántos días de vacaciones?")
# vec: list[float] de 1536 dimensiones

vectores = embeddings.embed_documents(["chunk 1", "chunk 2"])
# vectores: list[list[float]] — uno por documento
```

**Métodos clave:**

| Método | Cuándo se usa | Equivalente scratch |
|--------|---------------|---------------------|
| `embed_query(texto)` | Una pregunta del usuario (fase online) | `embed(query)` |
| `embed_documents(lista)` | Muchos chunks al indexar (fase offline) | `embed(chunk)` en bucle |

**Alternativa local (sin API key):**

```python
from langchain_community.embeddings import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="nomic-embed-text")
```

Chroma y otros stores **no saben** si usas OpenAI u Ollama — solo llaman a `.embed_query()` / `.embed_documents()` en el objeto que les pases. Eso es el poder de la interfaz.

### 11.7 VectorStore: `Chroma.from_documents`

Un **vector store** guarda pares `(Document, vector)` y permite búsqueda por similitud. En scratch era una lista en memoria; en LangChain:

```python
from langchain_community.vectorstores import Chroma

vectorstore = Chroma.from_documents(
    documents=chunks,              # los 8 Document del splitter
    embedding=embeddings,            # objeto OpenAIEmbeddings
    collection_name="hr_policies",   # nombre de la colección (como en template 09)
)
```

**Qué hace `.from_documents` por dentro (fase offline):**

```
chunks (8 Document)
    │
    ├──▶ embeddings.embed_documents([doc.page_content for doc in chunks])
    │         → 8 vectores de 1536 floats
    │
    └──▶ Chroma almacena (id, vector, page_content, metadata) en índice HNSW
```

Equivale a tu bucle `for chunk in chunks: embed(chunk)` + guardar en memoria, pero con índice optimizado para millones de vectores. Para persistir en disco: `persist_directory="./chroma_db"` (M3).

### 11.8 Retriever: `as_retriever` y `.invoke`

El vector store sabe buscar, pero el pipeline RAG quiere un objeto con interfaz uniforme: **`Retriever`**. Se obtiene así:

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",      # búsqueda por similitud coseno
    search_kwargs={"k": 3},        # top-3, como k=3 en recuperar()
)

resultado = retriever.invoke("¿Cuántos días de vacaciones si llevo 3 años?")
# resultado: list[Document] — 3 documentos, del más al menos similar
```

**Equivalente scratch:**

```python
# recuperar(query, chunks, k=3) → list[tuple[int, float, str]]
# retriever.invoke(query)        → list[Document]  (sin índice ni score expuesto por defecto)
```

| Parámetro | Significado |
|-----------|-------------|
| `search_type="similarity"` | Ordena por similitud coseno (default en Chroma). |
| `search_kwargs={"k": 3}` | Cuántos documentos devolver — el `topK=4` del template 09. |

**Predicción importante:** `retriever.invoke(query)` **no** devuelve un string ni un embedding. Devuelve **`list[Document]`** — objetos con `.page_content` y `.metadata`. Ver ejercicio 19.

### 11.9 Chat models: `ChatOpenAI` y `ChatAnthropic`

En scratch no llamabas a un LLM real. En framework:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
```

```python
# Alternativa Anthropic (default en RAGorbit):
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.2)
```

- **`model`:** identificador del modelo en la API del proveedor.
- **`temperature`:** igual concepto que §2.1 — para RAG factual usa 0.0–0.2.

El objeto `llm` es un **`Runnable`**: puedes componerlo con `|` (ver §11.10). Cuando recibe un prompt formateado, devuelve un **`AIMessage`** (no un string plano — por eso necesitas `StrOutputParser` al final).

### 11.10 Prompt templates: `ChatPromptTemplate`

En scratch, `construir_prompt()` era un f-string. En LangChain, los prompts son **plantillas con variables**:

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "Eres el asistente de RRHH. Responde SOLO con los fragmentos dados."),
    ("human", """Fragmentos relevantes:
{contexto}

Pregunta del empleado: {pregunta}

Responde en markdown."""),
])
```

- **`("system", ...)`** → mensaje de sistema (§3.1).
- **`("human", ...)`** → mensaje del usuario con variables `{contexto}` y `{pregunta}`.
- Al invocar con `{"contexto": "...", "pregunta": "..."}`, LangChain rellena las variables y produce un **`ChatPromptValue`** listo para el LLM.

Las variables deben coincidir **exactamente** con las claves del dict que alimenta la chain (siguiente sección).

### 11.11 LCEL: el operador `|`, `Runnable` y el patrón dict

**LCEL** (LangChain Expression Language) es la forma de **componer** pasos del pipeline. Tres ideas clave:

#### Idea 1: todo encadenable es un `Runnable`

Un **`Runnable`** es cualquier objeto LangChain que implementa `.invoke(input)` (y opcionalmente `.stream()`, `.batch()`). Ejemplos: `retriever`, `prompt`, `llm`, `StrOutputParser`, funciones envueltas.

El operador **`|`** conecta dos Runnables: la salida del izquierdo entra al derecho.

```
A | B | C
  ≡  C(B(A(input)))
```

Piensa en tuberías de Unix: `query | retriever | formatear | prompt | llm | parser`.

#### Idea 2: `RunnablePassthrough` deja pasar el input sin cambiarlo

```python
from langchain.schema.runnable import RunnablePassthrough

RunnablePassthrough()  # invoke("hola") → "hola"
```

Sirve cuando una rama del pipeline necesita el **input original** (la pregunta) mientras otra rama lo transforma (recuperar chunks).

#### Idea 3: el dict ejecuta ramas en paralelo y rellena el prompt

```python
from langchain.schema.output_parser import StrOutputParser

def formatear_chunks(docs: list) -> str:
    return "\n\n".join(f"[{i+1}] {d.page_content}" for i, d in enumerate(docs))

chain = (
    {
        "contexto": retriever | formatear_chunks,
        "pregunta": RunnablePassthrough(),
    }
    | prompt
    | llm
    | StrOutputParser()
)
```

**Flujo paso a paso** cuando llamas `chain.invoke(query)`:

```
INPUT: query = "¿Cuántos días de vacaciones...?"

PASO 1 — El dict (ramas en paralelo):
┌─────────────────────────────────────────────────────────────┐
│  "contexto": retriever | formatear_chunks                   │
│      query ──▶ retriever.invoke(query)                      │
│             ──▶ list[Document] (3 docs)                       │
│             ──▶ formatear_chunks(docs)                      │
│             ──▶ "[1] POLÍTICA §4...\n\n[2] POLÍTICA §3..."   │
│                                                             │
│  "pregunta": RunnablePassthrough()                          │
│      query ──▶ query  (sin cambios)                         │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
  {"contexto": "[1] ...", "pregunta": "¿Cuántos días..."}

PASO 2 — prompt:
  ChatPromptTemplate rellena {contexto} y {pregunta}
        │
        ▼
  ChatPromptValue (mensajes system + human listos)

PASO 3 — llm:
  API del proveedor → AIMessage con la respuesta
        │
        ▼
PASO 4 — StrOutputParser:
  Extrae el string de texto del AIMessage
        │
        ▼
OUTPUT: "Según la Política §3, tienes derecho a 18 días hábiles..."
```

**Por qué el dict y no una sola cadena lineal:** la pregunta debe llegar **intacta** al prompt (`{pregunta}`), pero el retriever necesita la misma pregunta como input para buscar. `RunnablePassthrough()` evita que la pregunta se pierda o se sobrescriba con los chunks.

**`StrOutputParser`:** el LLM devuelve un objeto rico (`AIMessage`). El parser extrae `.content` como `str` — lo que imprimes o devuelves al usuario.

### 11.12 Recorrido del pipeline del taller, bloque por bloque

Este es el recorrido completo de `lab/solucion_framework.py`, línea por línea conceptual:

```
┌──────────────────────────────────────────────────────────────────┐
│  IMPORTS                                                         │
│  TextLoader, CharacterTextSplitter, OpenAIEmbeddings, Chroma,    │
│  ChatOpenAI, ChatPromptTemplate, RunnablePassthrough,            │
│  StrOutputParser                                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 1 — CARGAR Y TROCEAR          (≈ cargar_chunks)          │
│  loader = TextLoader("datos/politicas_rrhh.txt")                 │
│  documentos_raw = loader.load()        # 1 Document grande       │
│  splitter = CharacterTextSplitter(separator="\n---\n", ...)       │
│  chunks = splitter.split_documents(...)  # 8 Document            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 2 — EMBEDDINGS + CHROMA       (≈ embed + índice)         │
│  embeddings = OpenAIEmbeddings(model="text-embedding-3-small")   │
│  vectorstore = Chroma.from_documents(chunks, embeddings, ...)    │
│  # Indexa 8 vectores semánticos en memoria                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 3 — RETRIEVER                 (≈ recuperar)              │
│  retriever = vectorstore.as_retriever(                           │
│      search_type="similarity", search_kwargs={"k": 3})           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 4 — PROMPT + LLM              (≈ construir_prompt + LLM) │
│  llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)        │
│  prompt = ChatPromptTemplate.from_messages([                     │
│      ("system", SYSTEM_PROMPT),                                  │
│      ("human", HUMAN_TEMPLATE),  # {contexto}, {pregunta}        │
│  ])                                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 5 — CHAIN LCEL                (≈ main orquestado)        │
│  chain = (                                                       │
│      {"contexto": retriever | formatear_chunks,                  │
│       "pregunta": RunnablePassthrough()}                        │
│      | prompt | llm | StrOutputParser()                         │
│  )                                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 6 — EJECUTAR                                             │
│  chunks_recuperados = retriever.invoke(query)  # inspección      │
│  respuesta = chain.invoke(query)               # respuesta final │
└──────────────────────────────────────────────────────────────────┘
```

**Diferencia de ranking vs scratch:** con embeddings semánticos reales, §3 ("Después de 3 años… 18 días") suele rankear **primero** — no §4 como en bag-of-words. El mecanismo es idéntico; cambia la calidad del vector (§6.4).

### 11.13 Cuándo usar LangChain / cuándo NO — y gotchas

**Cuándo SÍ:**

- Prototipos y producción RAG donde quieres cambiar proveedor (OpenAI ↔ Anthropic ↔ Ollama) sin reescribir.
- Pipelines con muchos pasos (retrieve → rerank → prompt → LLM → parser) — LCEL los compone limpiamente.
- Equipos que ya usan el ecosistema (LangSmith, LangGraph en M6+).

**Cuándo NO (o no solo LangChain):**

- Script de una sola vez, 30 líneas, sin cambio de proveedor → scratch o requests directos pueden bastar.
- Máximo control de latencia/costo → llamadas API directas sin capa intermedia.
- Ya usas LlamaIndex/CrewAI con otro modelo mental → no mezcles dos frameworks sin razón (M2 compara).

**Gotchas comunes:**

| Gotcha | Qué pasa | Solución |
|--------|----------|----------|
| Versiones de paquetes | Imports cambian entre LangChain 0.1 y 0.2+ (`langchain.schema` vs `langchain_core`) | Fija versiones en `requirements.txt`; este curso usa el estilo de `solucion_framework.py` |
| API key ausente | `OpenAIEmbeddings` / `ChatOpenAI` fallan sin `OPENAI_API_KEY` | Exporta la variable o usa `OllamaEmbeddings` + modelo local |
| `\|` con objeto no-Runnable | `TypeError` al componer | Solo Runnables, funciones, o dicts de Runnables en LCEL |
| Variables del prompt | `{context}` en template pero `"contexto"` en dict → KeyError | Nombres idénticos en template y dict |
| `retriever.invoke()` vs `chain.invoke()` | El primero devuelve docs; el segundo, respuesta del LLM | Usa retriever solo para inspeccionar; chain para respuesta final |
| `CharacterTextSplitter` con separador equivocado | 1 chunk gigante o demasiados chunks | Mismo `\n---\n` que en scratch |

### 11.14 Nota de entorno y siguiente paso

No ejecutes esta sección en el entorno sin red del curso. **Estudia, escribe** `solucion_framework.py` en el taller (ver `lab/enunciado.md` capa ③), y compara con la solución de referencia.

**Cross-links:**

- Patrón RAG mínimo (los 4 pasos): [§5](#5-el-patrón-rag-mínimo)
- Embeddings y similitud coseno (lo que reemplaza `embed()`): [§6](#6-embeddings-intuición-geométrica-y-similitud-coseno)
- Taller scratch + framework: [`lab/enunciado.md`](lab/enunciado.md), [`lab/solucion_framework.py`](lab/solucion_framework.py)
- Template 09 completo: [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)

---

> **Más allá de Lang\*:** este mismo RAG de RRHH está resuelto con **LlamaIndex**, con el **SDK nativo del proveedor (sin framework)** y con **Haystack** en [`../referencia/rag-sin-langchain.md`](../referencia/rag-sin-langchain.md). LangChain es el default del curso porque es lo que genera RAGorbit, pero la meta es que entiendas el mecanismo (capa ②) y puedas usar **cualquier** stack. Lee también las [críticas honestas al stack LangChain/LangGraph/LangSmith](../referencia/tecnologias-comparadas.md#críticas-al-stack-langchain--langgraph--langsmith-y-cuándo-no-usarlo).

---

## 12. Checkpoint

**Lo sabes si puedes…**

- [ ] Explicar qué es un token y calcular aproximadamente cuántos tokens tiene un párrafo.
- [ ] Describir qué pasa cuando la temperatura es 0 vs 0.7.
- [ ] Escribir un prompt system/user para el asistente de RRHH que evite alucinaciones.
- [ ] Explicar los 4 pasos del patrón RAG mínimo sin mirar.
- [ ] Dibujar el diagrama de la fase offline y la fase online del template 09.
- [ ] Calcular la similitud coseno entre dos vectores de 3 dimensiones a mano.
- [ ] Decidir entre RAG, fine-tuning y prompting puro para un caso dado.
- [ ] Nombrar al menos 2 modelos abiertos y cómo ejecutarlos localmente.
- [ ] Mapear cada función de `solucion_scratch.py` a su pieza LangChain (tabla §11.2).
- [ ] Explicar qué devuelve `retriever.invoke(query)` y qué hace el operador `|` en LCEL.
- [ ] Escribir desde cero (en papel o editor) la chain LCEL del taller sin copiar pegando.

**Si algo no está claro, repasa:**
- Tokens → §1.2
- Temperatura → §2.1
- RAG por qué → §4
- Similitud coseno → §6.3
- RAG vs fine-tuning → §9
- LangChain desde cero → §11

**Siguiente:** ve a `ejercicios.md` (incluye bloque LangChain) y luego al `lab/enunciado.md`.

---

> **Cross-links:**
> - Catálogo de nodos `model`: [`../../docs/02-node-catalog.md#model--modelos`](../../docs/02-node-catalog.md)
> - Template RRHH completo: [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)
> - Tecnologías comparadas (tabla completa de modelos y stores): [`../referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md)
> - Glosario de términos: [`../referencia/glosario.md`](../referencia/glosario.md)

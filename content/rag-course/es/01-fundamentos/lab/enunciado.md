# Taller M1 · Construye un RAG mínimo

> **Contexto de negocio:** eres el único desarrollador de una empresa de 120 personas. El equipo de RRHH está harto de responder siempre las mismas preguntas sobre vacaciones, permisos y beneficios. Tienes 2 horas para construir un prototipo funcional. No tienes presupuesto para APIs, la laptop no tiene red y Python 3 está instalado.
>
> Tu objetivo: dado un conjunto de fragmentos de política de RRHH y una pregunta de empleado, **recuperar los top-k fragmentos más relevantes y construir el prompt aumentado** que se le pasaría al LLM.

---

## Objetivo del taller

Implementar el **patrón RAG mínimo** (recuperar → aumentar → responder) en dos versiones:

1. **Capa ② (scratch):** solo `stdlib` de Python, sin pip, sin red. Embeddings de juguete + similitud coseno a mano. **Debe ejecutarse.**
2. **Capa ③ (framework):** la misma lógica con LangChain. Ilustrativo — no se ejecuta en este entorno.

---

## Datos de entrada

Los documentos de políticas están en `datos/politicas_rrhh.txt`. El archivo contiene **8 fragmentos** de política, separados por líneas `---`. Cada fragmento tiene una primera línea que es su título.

**Query de prueba:**
```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
```

---

## Especificación de la solución scratch (`solucion_scratch.py`)

### Paso 1 — Cargar y parsear los fragmentos
Lee `datos/politicas_rrhh.txt`, divide por `---` y elimina espacios en blanco. Resultado: lista de strings, uno por fragmento.

### Paso 2 — Embeddings de juguete (bag-of-words normalizado)
Implementa una función `embed(texto)` que:
1. Convierte el texto a minúsculas y extrae palabras (split por espacios y signos de puntuación).
2. Construye un vocabulario global con todas las palabras de todos los fragmentos.
3. Devuelve un vector de frecuencias normalizado (divide cada conteo por la longitud del texto en palabras).

**No uses numpy, scipy ni ninguna librería externa.**

### Paso 3 — Similitud coseno manual
Implementa `similitud_coseno(a, b)` que opere sobre diccionarios `{palabra: peso}` (no sobre listas densas — más eficiente para vocabularios grandes).

```python
def similitud_coseno(a: dict, b: dict) -> float:
    # dot product solo sobre claves comunes
    # divide por normas
    ...
```

### Paso 4 — Recuperar top-k
Implementa `recuperar(query, chunks, k=3)` que:
1. Embebe la query.
2. Calcula la similitud coseno entre la query y cada chunk.
3. Devuelve los `k` índices y textos más similares, ordenados de mayor a menor similitud.

### Paso 5 — Construir el prompt aumentado
Implementa `construir_prompt(query, chunks_recuperados)` que devuelva el string del prompt completo:

```
Eres el asistente de RRHH de la empresa. Responde ÚNICAMENTE basándote
en los fragmentos de política proporcionados.

Fragmentos relevantes:
[1] <texto del chunk 1>
[2] <texto del chunk 2>
[3] <texto del chunk 3>

Pregunta del empleado: <query>

Respuesta:
```

### Paso 6 — Salida del programa
El script debe imprimir:
1. Los índices de los top-k chunks recuperados (0-indexed, separados por coma).
2. Las similitudes correspondientes (2 decimales).
3. El prompt aumentado completo.

---

## Pistas escalonadas

**Pista 1 (si no sabes por dónde empezar):** empieza implementando solo `embed()` y pruébala con una sola oración. Imprime el diccionario resultante — si ves palabras con sus frecuencias normalizadas, vas bien.

**Pista 2 (si la similitud coseno da valores raros):** asegúrate de que el dot product solo suma sobre las claves que existen en AMBOS diccionarios. Usa `set(a.keys()) & set(b.keys())` para las claves comunes.

**Pista 3 (si los resultados no te parecen intuitivos):** el embedding de bag-of-words es simple pero limitado. "Días de vacaciones" y "días de descanso" compartirán la palabra "días" pero no "vacaciones"/"descanso" — la similitud será parcial. Esto es esperable en el embedding de juguete; en producción usarías embeddings semánticos que capturan sinónimos.

**Pista 4 (si el script no corre):** verifica con `python3 -m py_compile solucion_scratch.py` antes de ejecutarlo. Los errores de sintaxis aparecen ahí.

---

## Capa ③ — Escribe la versión LangChain (tarea guiada)

> **No es “léelo y listo”.** Después de que `solucion_scratch.py` corra y coincida con `expected.md`, **tú** escribes `solucion_framework.py` paso a paso. La guía [§11 — La capa ③ explicada: LangChain desde cero](../guia.md#11-la-capa--explicada-langchain-desde-cero) enseña cada API desde cero; úsala como libro de texto mientras codificas.
>
> **Entorno:** no ejecutarás esta capa aquí (sin pip/red). El objetivo es **comprensión total** para poder ejecutarla cuando tengas `pip install langchain langchain-community langchain-openai chromadb` y una API key.

### Qué debes lograr

Un archivo `solucion_framework.py` que replique el pipeline scratch con LangChain:

1. Cargar y trocear `datos/politicas_rrhh.txt` → 8 `Document`.
2. Indexar en Chroma con `OpenAIEmbeddings`.
3. Recuperar top-3 con un retriever.
4. Construir prompt con `ChatPromptTemplate` (variables `{contexto}` y `{pregunta}`).
5. Componer una chain LCEL que termine en `StrOutputParser()`.
6. (Opcional al ejecutar) Llamar `chain.invoke(query)` con la misma query del taller.

### Paso 0 — Antes de escribir código

Abre la [tabla puente §11.2](../guia.md#112-tabla-puente-scratch--langchain) y ten a la vista tu `solucion_scratch.py`. Por cada función scratch, anota qué pieza LangChain la reemplaza. Si no puedes completar la tabla sin mirar la solución, repasa §11 antes de continuar.

### Paso 1 — Imports y cabecera

Crea `solucion_framework.py` con la cabecera de dependencias (como en la solución de referencia). Importa **solo** lo que necesitas:

| Necesitas | Import |
|-----------|--------|
| Leer el txt | `from langchain_community.document_loaders import TextLoader` |
| Trocear por `---` | `from langchain.text_splitter import CharacterTextSplitter` |
| Embeddings | `from langchain_openai import OpenAIEmbeddings` |
| Vector store | `from langchain_community.vectorstores import Chroma` |
| LLM | `from langchain_openai import ChatOpenAI` |
| Prompt | `from langchain.prompts import ChatPromptTemplate` |
| LCEL | `from langchain.schema.runnable import RunnablePassthrough` |
| Parser | `from langchain.schema.output_parser import StrOutputParser` |

**Pista 1:** si no sabes qué hace cada import, lee §11.3–§11.11 en la guía — hay un mini-ejemplo por abstracción.

### Paso 2 — Loader + splitter (≈ `cargar_chunks`)

```python
loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
documentos_raw = loader.load()

splitter = CharacterTextSplitter(
    separator="\n---\n",
    chunk_size=1000,
    chunk_overlap=0,
    keep_separator=False,
)
chunks = splitter.split_documents(documentos_raw)
```

**Comprueba mentalmente:** ¿cuántos `Document` esperas? (8, igual que en scratch.) Si no sabes por qué `split_documents` y no `split_text`, repasa §11.5.

**Pista 2:** el `separator` debe ser **idéntico** al que usa `cargar_chunks()` en scratch: `\n---\n`.

### Paso 3 — Embeddings + Chroma (≈ `embed` + índice en memoria)

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="hr_policies",
)
```

**Pista 3:** `embedding=` recibe el **objeto** `OpenAIEmbeddings`, no un vector suelto. Chroma llamará a `.embed_documents()` internamente. Ver §11.6–§11.7.

### Paso 4 — Retriever (≈ `recuperar`)

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)
```

Define la misma `query` que en scratch. **Escribe tú** (sin mirar la solución) qué tipo devuelve `retriever.invoke(query)`. Luego comprueba con §11.8 y el ejercicio 19.

**Pista 4:** `k=3` es el equivalente a `recuperar(..., k=3)` en scratch.

### Paso 5 — Prompt + LLM (≈ `construir_prompt` + llamada al modelo)

Define `SYSTEM_PROMPT` y `HUMAN_TEMPLATE` con las mismas instrucciones que el prompt scratch (asistente RRHH, solo fragmentos, pregunta del empleado). El template human **debe** usar `{contexto}` y `{pregunta}` — esos nombres son los que usará la chain.

```python
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])
```

**Pista 5:** `temperature=0.2` alinea con el template 09 y §2.1 (RAG factual).

### Paso 6 — Chain LCEL (≈ `main` orquestado)

Escribe la función `formatear_chunks(docs)` que convierta `list[Document]` en el string numerado `[1] ...\n\n[2] ...` (como hace `construir_prompt` en scratch).

Luego compón la chain:

```python
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

**Pista 6 (si el dict no tiene sentido):** dibuja el diagrama de §11.11 — dos ramas en paralelo: una recupera y formatea; la otra deja pasar la pregunta intacta.

**Pista 7 (si no sabes qué poner a la izquierda de `|`):** solo objetos **Runnable**: retriever, prompt, llm, `StrOutputParser()`, o funciones que acepten la salida del paso anterior.

### Paso 7 — Ejecución e inspección

```python
query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

chunks_recuperados = retriever.invoke(query)
# Imprime preview de cada chunk recuperado

# respuesta = chain.invoke(query)  # descomentar cuando tengas API key
```

### Paso 8 — Compara con la solución de referencia

**Solo después** de haber escrito tu versión completa:

1. Abre `solucion_framework.py` (referencia del curso).
2. Compara bloque por bloque usando el recorrido §11.12 de la guía.
3. Lee `solucion.md` capa ③ para entender diferencias de ranking semántico vs scratch.

**Criterios capa ③ (auto-evaluación):**

- [ ] Usas `TextLoader` + `CharacterTextSplitter` con `separator="\n---\n"`.
- [ ] `Chroma.from_documents` con `collection_name="hr_policies"`.
- [ ] Retriever con `search_kwargs={"k": 3}`.
- [ ] `ChatPromptTemplate` con roles `system` y `human` y variables `{contexto}` / `{pregunta}`.
- [ ] Chain LCEL con dict + `RunnablePassthrough` + `StrOutputParser`.
- [ ] Puedes explicar en voz alta qué hace cada `|` de tu chain sin leer la guía.

---

## Criterios de evaluación

- [ ] El script corre con `python3 solucion_scratch.py` sin errores.
- [ ] Usa solo `stdlib` (no hay ningún `import` de paquete externo).
- [ ] La función `embed()` produce diccionarios `{palabra: float}`.
- [ ] `similitud_coseno()` devuelve 1.0 para vectores idénticos y 0.0 para vectores sin palabras comunes.
- [ ] `recuperar()` devuelve los chunks en orden de mayor a menor similitud.
- [ ] El prompt aumentado tiene el formato especificado.
- [ ] Los índices y similitudes impresos coinciden con lo que dice `expected.md`.

---

## Entrega

- `solucion_scratch.py` — capa ②, debe correr.
- `solucion_framework.py` — capa ③, **escrito por ti** siguiendo la sección guiada arriba; luego compara con la referencia del curso.
- `solucion.md` — explicación de ambas soluciones.

> **Cross-links:** guía §5 (patrón RAG mínimo), §6 (embeddings y similitud coseno), **§11 (LangChain desde cero)**, template [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/).

# Solución del taller M1 · RAG mínimo

> Explica las dos implementaciones y por qué cada decisión de diseño.

---

## Capa ② — Scratch (stdlib)

### Visión general

`solucion_scratch.py` implementa el patrón RAG mínimo completo en ~100 líneas usando **cero dependencias externas**. El objetivo no es hacer un sistema de producción, sino que entiendas cada pieza del mecanismo antes de delegarla a un framework.

### Decisión: bag-of-words normalizado como embedding de juguete

```python
def embed(texto: str) -> dict[str, float]:
    tokens = tokenizar(texto)
    conteos = {}
    for token in tokens:
        conteos[token] = conteos.get(token, 0) + 1
    total = len(tokens)
    return {palabra: conteo / total for palabra, conteo in conteos.items()}
```

**Por qué diccionario disperso y no lista densa:**

Si el vocabulario de todos los documentos tiene 800 palabras únicas, un vector denso sería una lista de 800 floats, la mayoría 0.0. Un diccionario `{palabra: peso}` solo almacena las palabras que sí aparecen — mucho más eficiente en memoria para vocabularios grandes. Además, la similitud coseno sobre diccionarios es natural: el dot product solo itera sobre claves comunes.

**Por qué normalizar (dividir por total de palabras):**

Sin normalización, un chunk largo tiene conteos más altos que uno corto simplemente por ser largo, no por ser más relevante. La normalización hace que los pesos sean comparables independientemente del tamaño del fragmento.

**Limitación conocida:** el bag-of-words es léxico, no semántico. No entiende que "vacaciones" y "descanso" son conceptos relacionados a menos que compartan palabras literales. En la salida real, el chunk §4 (vacaciones adicionales por antigüedad) rankea sobre §3 (acumulación y disfrute) porque §4 tiene más repeticiones de "días" y "años" — dos palabras también presentes en la query. Con embeddings semánticos reales, §3 rankearía primero porque contiene la respuesta exacta.

### Decisión: similitud coseno sobre diccionarios

```python
def similitud_coseno(a, b):
    claves_comunes = set(a.keys()) & set(b.keys())
    dot = sum(a[k] * b[k] for k in claves_comunes)
    norma_a = math.sqrt(sum(v * v for v in a.values()))
    norma_b = math.sqrt(sum(v * v for v in b.values()))
    return dot / (norma_a * norma_b)
```

El truco de `set(a.keys()) & set(b.keys())` es la optimización clave: si los diccionarios tienen 500 entradas cada uno pero solo 20 palabras en común, solo hacemos 20 multiplicaciones en el dot product, no 500. Esto es O(min(|a|, |b|)) en lugar de O(|vocabulario|).

**Por qué coseno y no distancia euclidea:** la distancia euclidea es sensible a la magnitud de los vectores. Si un chunk menciona "vacaciones" 5 veces y otro solo 1 vez, la distancia euclidea los separa aunque hablen del mismo tema. La similitud coseno mide el **ángulo** entre los vectores — si ambos "apuntan" en la misma dirección del espacio semántico, son similares independientemente de su magnitud.

### Flujo del main

```
cargar_chunks("datos/politicas_rrhh.txt")   # 8 fragmentos
        ↓
recuperar(query, chunks, k=3)
  ├── embed(query)                          # vector de la pregunta
  ├── embed(chunk_i)  para cada i           # vector de cada chunk
  ├── similitud_coseno(vec_query, vec_i)    # score por chunk
  └── sort(scores, desc) → top-3            # ranking
        ↓
construir_prompt(query, resultados)         # prompt aumentado
        ↓
print(índices, similitudes, prompt)
```

### Resultado obtenido

```
Índices recuperados (0-based): 1, 0, 7
Similitudes:                   0.5080, 0.4397, 0.3384
```

Ver `expected.md` para el análisis completo de por qué estos chunks.

---

## Capa ③ — Framework (LangChain + Chroma)

> **Cómo usar esta sección:** primero escribe tu propio `solucion_framework.py` siguiendo el taller guiado (`enunciado.md`, capa ③) y la guía [§11](../guia.md#11-la-capa--explicada-langchain-desde-cero). **Después** lee lo siguiente y compara con `solucion_framework.py` bloque por bloque (recorrido §11.12).

### Visión general

`solucion_framework.py` hace exactamente lo mismo que el scratch, pero usando los bloques de LangChain. La diferencia principal está en la calidad de los embeddings y en el nivel de abstracción. Si la solución de referencia te sorprende, vuelve a §11 — cada bloque está explicado allí antes de aparecer aquí.

### TextLoader + CharacterTextSplitter

```python
loader = TextLoader("datos/politicas_rrhh.txt")
splitter = CharacterTextSplitter(separator="\n---\n", chunk_size=1000)
chunks = splitter.split_documents(documentos_raw)
```

`CharacterTextSplitter` hace exactamente lo que hace `cargar_chunks()` en scratch, pero añade metadatos (`source`, número de chunk) a cada `Document`. Esos metadatos son los que luego permiten filtros duros en `retrieval.vector` (p.ej. mostrar solo chunks de cierta sección).

### OpenAIEmbeddings → Chroma

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(chunks, embeddings)
```

`OpenAIEmbeddings` llama a la API de OpenAI para obtener vectores de 1536 dimensiones. Chroma los almacena con un índice HNSW que hace la búsqueda top-k eficiente incluso con millones de chunks.

Esto equivale exactamente al par `model.embedding` + `store.chroma` del template 09.

### LCEL chain

```python
chain = (
    {"contexto": retriever | formatear_chunks, "pregunta": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

LCEL (LangChain Expression Language) usa el operador `|` para componer pasos. Es equivalente al "cableado" visual de RAGorbit pero en código. El resultado del `retriever` pasa por `formatear_chunks`, se combina con la `pregunta` para llenar el `prompt`, que va al `llm`, cuya salida pasa por `StrOutputParser` para extraer el string.

**Explicación detallada del dict y cada `|`:** guía [§11.11](../guia.md#111-lcel-el-operador--runnable-y-el-patrón-dict).

Esto modela exactamente los edges del `flow.json` del template 09:
```
retrieval.vector → logic.prompt → model.llm → io.output
```

### Por qué el framework es mejor en producción

| Aspecto | Scratch | Framework |
|---------|---------|-----------|
| Embeddings | Bag-of-words (léxico) | Semánticos (1536D) |
| Falsos positivos | Frecuentes (chunk §7 de capacitación aparece por "días") | Raros (entiende significado) |
| Chunks con metadata | No | Sí (`source`, sección) |
| Filtros de metadata | Manual | `.as_retriever(filter={"section": "§3"})` |
| Persistencia del índice | No (en memoria) | `persist_directory="./chroma_db"` |
| Streaming de respuesta | No | `chain.stream(query)` |
| Cambio de modelo | Reescribir funciones | Cambiar un string |

---

## Conexión con el template 09

El taller es una miniaturización del flujo completo del template `09-hr-policy-assistant`. Cada función del scratch corresponde a un nodo:

| Función scratch | Nodo RAGorbit | Descripción |
|-----------------|---------------|-------------|
| `cargar_chunks()` | `loader.pdf` + `ingest.chunker` | Cargar y trocear documentos |
| `embed()` | `model.embedding` | Convertir texto en vector |
| `recuperar()` | `retrieval.vector` | Buscar top-k por similitud |
| `construir_prompt()` | `logic.prompt` | Armar el prompt aumentado |
| LLM (stub/fake) | `model.llm` | Generar la respuesta |

La diferencia es que en el template 09:
- Los embeddings son semánticos reales (`text-embedding-3-large`).
- El vector store es Chroma con persistencia.
- El LLM es Claude Opus 4.8.
- Hay un nodo `logic.citations` adicional que verifica que la respuesta cite su fuente.
- Todo está orquestado por LangGraph.

---

## Qué aprendiste con este taller

1. **El mecanismo core de RAG es simple:** embed la query, busca los más similares, construye el prompt, llama al LLM.
2. **La calidad del embedding es el cuello de botella:** bag-of-words es suficiente para entender el mecanismo, pero los embeddings semánticos son los que hacen que RAG funcione bien en producción.
3. **Los frameworks no hacen magia:** LangChain hace exactamente lo mismo que el scratch, con mejores embeddings, mejor gestión de memoria y más opciones de configuración.
4. **El "prompt aumentado" es la pieza central:** el LLM no sabe nada de tus documentos por sí solo — el contexto que le das en el prompt es todo lo que tiene para responder correctamente.

> **Siguiente paso:** en M3 verás los embeddings a fondo (dimensiones, HNSW, operaciones Chroma, FAISS) y en M4 verás retrieval avanzado (híbrido, reranking, filtros duros). El template 09 se revisitará en ambos módulos.

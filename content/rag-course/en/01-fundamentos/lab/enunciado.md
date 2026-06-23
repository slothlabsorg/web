# M1 Lab · Build a Minimal RAG

> **Business context:** you are the sole developer at a 120-person company. The HR team is tired of answering the same questions about vacation, leave, and benefits. You have 2 hours to build a working prototype. You have no budget for APIs, the laptop has no network, and Python 3 is installed.
>
> Your goal: given a set of HR policy fragments and an employee question, **retrieve the top-k most relevant fragments and build the augmented prompt** that would be passed to the LLM.

---

## Lab objective

Implement the **minimal RAG pattern** (retrieve → augment → respond) in two versions:

1. **Layer ② (scratch):** Python `stdlib` only, no pip, no network. Toy embeddings + manual cosine similarity. **Must run.**
2. **Layer ③ (framework):** the same logic with LangChain. Illustrative — does not run in this environment.

---

## Input data

Policy documents are in `datos/politicas_rrhh.txt`. The file contains **8 policy fragments**, separated by `---` lines. Each fragment has a first line that is its title.

**Test query:**
```
¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?
```

---

## Scratch solution specification (`solucion_scratch.py`)

### Step 1 — Load and parse fragments
Read `datos/politicas_rrhh.txt`, split by `---`, and strip whitespace. Result: list of strings, one per fragment.

### Step 2 — Toy embeddings (normalized bag-of-words)
Implement an `embed(texto)` function that:
1. Converts text to lowercase and extracts words (split on spaces and punctuation).
2. Builds a global vocabulary with all words from all fragments.
3. Returns a normalized frequency vector (divide each count by text length in words).

**Do not use numpy, scipy, or any external library.**

### Step 3 — Manual cosine similarity
Implement `similitud_coseno(a, b)` that operates on `{word: weight}` dictionaries (not dense lists — more efficient for large vocabularies).

```python
def similitud_coseno(a: dict, b: dict) -> float:
    # dot product only over common keys
    # divide by norms
    ...
```

### Step 4 — Retrieve top-k
Implement `recuperar(query, chunks, k=3)` that:
1. Embeds the query.
2. Computes cosine similarity between the query and each chunk.
3. Returns the `k` most similar indices and texts, ordered from highest to lowest similarity.

### Step 5 — Build the augmented prompt
Implement `construir_prompt(query, chunks_recuperados)` that returns the full prompt string:

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

### Step 6 — Program output
The script must print:
1. The indices of the retrieved top-k chunks (0-indexed, comma-separated).
2. The corresponding similarities (2 decimal places).
3. The complete augmented prompt.

---

## Tiered hints

**Hint 1 (if you don't know where to start):** start by implementing only `embed()` and test it with a single sentence. Print the resulting dictionary — if you see words with normalized frequencies, you're on track.

**Hint 2 (if cosine similarity gives odd values):** make sure the dot product only sums over keys that exist in BOTH dictionaries. Use `set(a.keys()) & set(b.keys())` for common keys.

**Hint 3 (if results don't seem intuitive):** the bag-of-words embedding is simple but limited. "Días de vacaciones" and "días de descanso" will share the word "días" but not "vacaciones"/"descanso" — similarity will be partial. This is expected with the toy embedding; in production you would use semantic embeddings that capture synonyms.

**Hint 4 (if the script won't run):** verify with `python3 -m py_compile solucion_scratch.py` before running it. Syntax errors appear there.

---

## Layer ③ — Write the LangChain version (guided task)

> **This is not "read it and done."** After `solucion_scratch.py` runs and matches `expected.md`, **you** write `solucion_framework.py` step by step. The guide [§11 — Layer ③ explained: LangChain from scratch](../guia.md#11-layer--explained-langchain-from-scratch) teaches each API from scratch; use it as a textbook while you code.
>
> **Environment:** you will not run this layer here (no pip/network). The goal is **full understanding** so you can run it when you have `pip install langchain langchain-community langchain-openai chromadb` and an API key.

### What you must achieve

A `solucion_framework.py` file that replicates the scratch pipeline with LangChain:

1. Load and chunk `datos/politicas_rrhh.txt` → 8 `Document`s.
2. Index in Chroma with `OpenAIEmbeddings`.
3. Retrieve top-3 with a retriever.
4. Build prompt with `ChatPromptTemplate` (variables `{contexto}` and `{pregunta}`).
5. Compose an LCEL chain ending in `StrOutputParser()`.
6. (Optional when running) Call `chain.invoke(query)` with the same lab query.

### Step 0 — Before writing code

Open the [bridge table §11.2](../guia.md#112-bridge-table-scratch--langchain) and have your `solucion_scratch.py` visible. For each scratch function, note which LangChain piece replaces it. If you cannot complete the table without looking at the solution, review §11 before continuing.

### Step 1 — Imports and header

Create `solucion_framework.py` with the dependency header (as in the reference solution). Import **only** what you need:

| You need | Import |
|-----------|--------|
| Read the txt | `from langchain_community.document_loaders import TextLoader` |
| Split by `---` | `from langchain.text_splitter import CharacterTextSplitter` |
| Embeddings | `from langchain_openai import OpenAIEmbeddings` |
| Vector store | `from langchain_community.vectorstores import Chroma` |
| LLM | `from langchain_openai import ChatOpenAI` |
| Prompt | `from langchain.prompts import ChatPromptTemplate` |
| LCEL | `from langchain.schema.runnable import RunnablePassthrough` |
| Parser | `from langchain.schema.output_parser import StrOutputParser` |

**Hint 1:** if you don't know what each import does, read §11.3–§11.11 in the guide — there is a mini-example per abstraction.

### Step 2 — Loader + splitter (≈ `cargar_chunks`)

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

**Mental check:** how many `Document`s do you expect? (8, same as scratch.) If you don't know why `split_documents` and not `split_text`, review §11.5.

**Hint 2:** the `separator` must be **identical** to what `cargar_chunks()` uses in scratch: `\n---\n`.

### Step 3 — Embeddings + Chroma (≈ `embed` + in-memory index)

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="hr_policies",
)
```

**Hint 3:** `embedding=` receives the **object** `OpenAIEmbeddings`, not a loose vector. Chroma will call `.embed_documents()` internally. See §11.6–§11.7.

### Step 4 — Retriever (≈ `recuperar`)

```python
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)
```

Define the same `query` as in scratch. **Write yourself** (without looking at the solution) what type `retriever.invoke(query)` returns. Then verify with §11.8 and exercise 19.

**Hint 4:** `k=3` is equivalent to `recuperar(..., k=3)` in scratch.

### Step 5 — Prompt + LLM (≈ `construir_prompt` + model call)

Define `SYSTEM_PROMPT` and `HUMAN_TEMPLATE` with the same instructions as the scratch prompt (HR assistant, fragments only, employee question). The human template **must** use `{contexto}` and `{pregunta}` — those are the names the chain will use.

```python
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])
```

**Hint 5:** `temperature=0.2` aligns with template 09 and §2.1 (factual RAG).

### Step 6 — LCEL chain (≈ orchestrated `main`)

Write the `formatear_chunks(docs)` function that converts `list[Document]` into the numbered string `[1] ...\n\n[2] ...` (as `construir_prompt` does in scratch).

Then compose the chain:

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

**Hint 6 (if the dict doesn't make sense):** draw the diagram from §11.11 — two parallel branches: one retrieves and formats; the other passes the question through unchanged.

**Hint 7 (if you don't know what goes to the left of `|`):** only **Runnable** objects: retriever, prompt, llm, `StrOutputParser()`, or functions that accept the previous step's output.

### Step 7 — Execution and inspection

```python
query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

chunks_recuperados = retriever.invoke(query)
# Print preview of each retrieved chunk

# respuesta = chain.invoke(query)  # uncomment when you have API key
```

### Step 8 — Compare with the reference solution

**Only after** writing your complete version:

1. Open `solucion_framework.py` (course reference).
2. Compare block by block using the §11.12 walkthrough in the guide.
3. Read `solucion.md` layer ③ to understand semantic vs scratch ranking differences.

**Layer ③ criteria (self-assessment):**

- [ ] You use `TextLoader` + `CharacterTextSplitter` with `separator="\n---\n"`.
- [ ] `Chroma.from_documents` with `collection_name="hr_policies"`.
- [ ] Retriever with `search_kwargs={"k": 3}`.
- [ ] `ChatPromptTemplate` with `system` and `human` roles and `{contexto}` / `{pregunta}` variables.
- [ ] LCEL chain with dict + `RunnablePassthrough` + `StrOutputParser`.
- [ ] You can explain out loud what each `|` in your chain does without reading the guide.

---

## Evaluation criteria

- [ ] The script runs with `python3 solucion_scratch.py` without errors.
- [ ] Uses only `stdlib` (no external package `import`).
- [ ] The `embed()` function produces `{word: float}` dictionaries.
- [ ] `similitud_coseno()` returns 1.0 for identical vectors and 0.0 for vectors with no common words.
- [ ] `recuperar()` returns chunks in order from highest to lowest similarity.
- [ ] The augmented prompt has the specified format.
- [ ] Printed indices and similarities match what `expected.md` says.

---

## Deliverables

- `solucion_scratch.py` — layer ②, must run.
- `solucion_framework.py` — layer ③, **written by you** following the guided section above; then compare with the course reference.
- `solucion.md` — explanation of both solutions.

> **Cross-links:** guide §5 (minimal RAG pattern), §6 (embeddings and cosine similarity), **§11 (LangChain from scratch)**, template [`../../examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/).

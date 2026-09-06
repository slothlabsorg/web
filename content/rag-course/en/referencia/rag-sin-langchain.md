# RAG without LangChain — building the same HR assistant with competing technologies

> **RAGorbit course reference.** This document teaches how to build the **same RAG** from the M1 workshop (HR policy assistant, template [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/)) using **LangChain alternatives**: LlamaIndex, provider native SDK + Chroma, and Haystack. The pedagogy mirrors the course sections **"Layer ③ explained"**: bridge table, API by API, block-by-block walkthrough, when to use / when NOT to, and gotchas.
>
> **Audience:** Python programmers who have already completed layer ② (`01-fundamentos/lab/solucion_scratch.py`) and want to be a **full AI engineer**, not only a `lang*` expert.
>
> **Reference query throughout this document:** `How many vacation days am I entitled to if I have been at the company for 3 years?`
>
> **Expected answer (per §3 of the policies):** 18 business days of vacation.

---

## Introduction: why learn RAG without LangChain

In M1 you learned LangChain because it is RAGorbit's orchestration framework for codegen and the most documented ecosystem. But **mastering LangChain is not mastering RAG**. RAG is a four-step pattern (index → retrieve → augment prompt → generate) that exists **before** and **after** any framework.

Learning the alternatives gives you three concrete advantages:

1. **Framework independence.** If tomorrow your company adopts LlamaIndex, or decides to drop intermediate layers and call APIs directly, you do not start from zero.
2. **Engineering judgment.** You will know when a framework adds value (abstractions, composition, observability) and when it is just dead weight in an 80-line script.
3. **Debugging.** When a pipeline fails in production, the error is usually in embeddings, chunks, or the prompt — not in the LangChain import. Understanding each piece without the framework lets you isolate the problem.

```
WHAT YOU ALREADY KNOW (layer ②)       WHAT YOU WILL LEARN HERE
────────────────────────              ─────────────────────────────────────
cargar_chunks() + embed()             The same with LlamaIndex, native SDK, or Haystack
recuperar() + construir_prompt()      Same HR case, same query, different tools
main() orchestrating everything       When each approach wins or loses vs LangChain
```

### Global bridge table: layer ② → each technology

This table maps **each function** from [`solucion_scratch.py`](../01-fundamentos/lab/solucion_scratch.py) to its equivalent in LangChain (M1 §11), LlamaIndex, native SDK, and Haystack:

| What you did by hand (layer ②) | LangChain (M1 §11) | LlamaIndex (§1) | Native SDK + Chroma (§2) | Haystack (§3) |
|--------------------------------|-------------------|-----------------|--------------------------|---------------|
| `cargar_chunks(ruta)` — read txt and split by `---` | `TextLoader` + `CharacterTextSplitter` | `Document` + manual split or `SentenceSplitter` | `open()` + `re.split(r"\n---\n", ...)` (stdlib) | `Document` + manual split at index time |
| `embed(texto)` — bag-of-words → `dict` | `OpenAIEmbeddings` | `Settings.embed_model` / `OpenAIEmbedding` | `SentenceTransformer.encode()` or embeddings API | `SentenceTransformersDocumentEmbedder` |
| `chunks` list in memory | `Chroma.from_documents(...)` | `VectorStoreIndex.from_documents(...)` | `collection.upsert(...)` | `document_store.write_documents(...)` |
| `similitud_coseno()` + `sort` | `as_retriever(search_kwargs={"k": 3})` | `as_query_engine(similarity_top_k=3)` / `as_retriever` | `collection.query(n_results=3)` | `InMemoryEmbeddingRetriever` |
| `recuperar()` → `(index, sim, text)` | `retriever.invoke(query)` → `list[Document]` | `retriever.retrieve(query)` → `list[NodeWithScore]` | `resultados["documents"]` + `distances` | `retriever.run(query=...)` → `documents` |
| `construir_prompt()` — f-string | `ChatPromptTemplate` | `PromptTemplate` + `text_qa_template` | f-string / manual `str.format` | `PromptBuilder` (Jinja2 template) |
| (no LLM in scratch) | `ChatOpenAI` / `ChatAnthropic` | `Settings.llm` / `Anthropic` | `anthropic.Anthropic().messages.create(...)` | `OpenAIGenerator` / `AnthropicChatGenerator` |
| `main()` orchestrating | LCEL chain with `\|` | `query_engine.query(...)` | Sequential `responder(query)` function | `Pipeline.run(...)` |

**RAGorbit nodes from template 09:** `loader` → `ingest.chunker` → `model.embedding` → `store.chroma` → `retrieval.vector` → `logic.prompt` → `model.llm`. The four approaches in this document implement that same chain with different tools.

> **Environment:** on the course study machine there is no `pip` or network ([`HANDOFF.md` §5](../HANDOFF.md)). The framework code in this document is **ILLUSTRATIVE** — each block has a header `# Requiere: pip install ...`. Run it in your environment when you have packages and API keys.

---

## 1. LlamaIndex (the main RAG alternative)

### 1.1 What LlamaIndex is and how it differs from LangChain

**LlamaIndex** (formerly GPT Index) is a Python framework focused on **data + queries**: load documents, build **indexes**, retrieve context, and answer questions. It was born as "the RAG library" before RAG went mainstream.

**Mental model difference:**

| Aspect | LangChain | LlamaIndex |
|---------|-----------|------------|
| Central unit | Composable `Runnable` with `\|` (LCEL) | **Index** (`VectorStoreIndex`, etc.) + **query engine** |
| Main strength | General orchestration (RAG, agents, tools, LCEL) | RAG pipelines, indexes, query engines, agents over indexes |
| Document abstraction | `Document(page_content=..., metadata=...)` | `Document(text=..., metadata=...)` |
| Retrieval | `vectorstore.as_retriever().invoke(query)` | `index.as_retriever()` or `index.as_query_engine()` |
| Generation | You wire retriever + prompt + LLM in LCEL | `as_query_engine()` **integrates** retrieve + prompt + LLM in one object |
| Ecosystem | LangGraph, LangSmith, 100+ integrations | LlamaHub readers, specialized indexes, LlamaParse |

**Analogy:** LangChain is a box of universal connectors (plugs for everything). LlamaIndex is a **semantic search engine factory** with a query accelerator (`query_engine`) that already includes the most common RAG wiring.

```
LANGCHAIN (M1)                         LLAMAINDEX (this §1)
────────────────                       ─────────────────────────────────
TextLoader → Splitter → Chroma         Document → VectorStoreIndex
    → as_retriever → LCEL chain            → as_query_engine → .query()
You wire each step                   The query engine wires retrieve+prompt+LLM
```

> **Version note (2025/2026):** since **LlamaIndex 0.10**, `ServiceContext` is deprecated; in **0.11 it was removed**. Use the global singleton `Settings` or pass `embed_model` / `llm` directly to local constructors. If you see old tutorials with `ServiceContext`, they are obsolete.

### 1.2 Bridge table: scratch → LlamaIndex

| What you did by hand (layer ②) | LlamaIndex piece (layer ③) | RAGorbit node (template 09) |
|--------------------------------|---------------------------|----------------------------|
| `cargar_chunks(ruta)` | `Document(text=...)` per fragment (manual split by `\n---\n`) | `loader` + `ingest.chunker` |
| `embed(texto)` | `Settings.embed_model = OpenAIEmbedding(...)` | `model.embedding` |
| In-memory list + vectors | `VectorStoreIndex.from_documents(docs)` | `store.chroma` (conceptually) |
| `recuperar()` top-3 | `index.as_retriever(similarity_top_k=3)` | `retrieval.vector` |
| `construir_prompt()` + LLM | `index.as_query_engine(similarity_top_k=3, text_qa_template=...)` | `logic.prompt` + `model.llm` |
| `main()` | `query_engine.query(pregunta)` | edges of `flow.json` |

### 1.3 The `Document` object

LlamaIndex uses `Document` with the **`text`** field (not `page_content` like LangChain):

```python
from llama_index.core import Document

doc = Document(
    text="VACATION POLICY §3 — Accrual and use\nEmployees...",
    metadata={"source": "datos/politicas_rrhh.txt", "section": "§3"},
)
```

- **`text`:** the fragment content (equivalent to each string in your scratch `chunks` list).
- **`metadata`:** tags for later filters (M4). In HR you could add `{"type": "vacation"}`.

Indexes **consume** `list[Document]` and convert them internally into **nodes** (`TextNode`) with embeddings.

### 1.4 `Settings` — replacement for `ServiceContext`

In modern LlamaIndex, global configuration lives in `Settings`:

```python
from llama_index.core import Settings
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

# Embeddings — equivalent to OpenAIEmbeddings in LangChain
Settings.embed_model = OpenAIEmbedding(
    model="text-embedding-3-small",
    # api_key is read from OPENAI_API_KEY
)

# LLM — equivalent to ChatAnthropic in LangChain (RAGorbit default)
Settings.llm = Anthropic(
    model="claude-opus-4-8",
    temperature=0.2,
)
```

| `Settings` attribute | What it controls | Scratch / LangChain equivalent |
|---------------------|--------------|--------------------------------|
| `Settings.embed_model` | Global embedding model | `embed()` / `OpenAIEmbeddings` |
| `Settings.llm` | Global generation model | LLM stub / `ChatAnthropic` |
| `Settings.chunk_size` | Maximum chunk size (if you use automatic splitters) | `chunk_size` of `CharacterTextSplitter` |
| `Settings.chunk_overlap` | Overlap between chunks | `chunk_overlap` of the splitter |

**Local alternative (HR privacy):**

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-base-en-v1.5")
Settings.llm = Ollama(model="llama3.1", request_timeout=120.0)
```

### 1.5 `VectorStoreIndex.from_documents`

The **`VectorStoreIndex`** is the most used index in LlamaIndex: it converts documents into embeddings and enables semantic search.

```python
from llama_index.core import VectorStoreIndex

# documentos: list[Document] — the 8 HR policy fragments
index = VectorStoreIndex.from_documents(
    documentos,
    show_progress=True,
)
# Under the hood: embed_documents → store vectors → index ready to query
```

**What `.from_documents` does internally (offline phase):**

```
documentos (8 Document)
    │
    ├──▶ Settings.embed_model.get_text_embedding_batch([doc.text for doc in docs])
    │         → 8 dense vectors
    │
    └──▶ In-memory vector index (or in Chroma if you use StorageContext — §1.8)
```

Equivalent to your loop `for chunk in chunks: embed(chunk)` + store in memory, but with real semantic embeddings.

### 1.6 `as_query_engine` — retrieve + prompt + LLM in one

The **query engine** is LlamaIndex's distinctive piece. In LangChain you wire retriever + prompt + LLM with LCEL; in LlamaIndex:

```python
from llama_index.core import PromptTemplate

# Template equivalent to construir_prompt() from scratch
QA_TEMPLATE = PromptTemplate(
    "You are the company's HR assistant. "
    "Answer ONLY based on the provided policy fragments.\n\n"
    "Relevant fragments:\n{context_str}\n\n"
    "Employee question: {query_str}\n\n"
    "Answer in markdown with clear and simple language."
)

query_engine = index.as_query_engine(
    similarity_top_k=3,           # top-3, like k=3 in recuperar()
    text_qa_template=QA_TEMPLATE,
)

response = query_engine.query(
    "How many vacation days am I entitled to if I have been at the company for 3 years?"
)
print(response.response)   # final LLM text
# response.source_nodes     # retrieved nodes (for inspection / citations)
```

| Parameter | Meaning | Scratch equivalent |
|-----------|-------------|---------------------|
| `similarity_top_k=3` | How many fragments to retrieve | `k=3` in `recuperar()` |
| `text_qa_template` | Template with `{context_str}` and `{query_str}` | `construir_prompt()` |
| `response_mode` | `"compact"`, `"tree_summarize"`, etc. | How it condenses long context (default `"compact"` is enough for HR) |

**Important prediction:** with real semantic embeddings, §3 ("After 3 years… 18 days") usually ranks **first** — not §4 as in scratch bag-of-words. The mechanism is identical; vector quality changes.

### 1.7 `as_retriever` — retrieve only, no generation

If you want to **control the prompt yourself** (as in LangChain LCEL), use the retriever without a query engine:

```python
retriever = index.as_retriever(similarity_top_k=3)

nodos = retriever.retrieve(
    "How many vacation days am I entitled to if I have been at the company for 3 years?"
)
# nodos: list[NodeWithScore]
# nodos[0].text          → chunk text
# nodos[0].score         → similarity score
# nodos[0].metadata      → metadata from the original Document

for i, nodo in enumerate(nodos):
    print(f"[{i+1}] score={nodo.score:.4f} | {nodo.text[:80]}...")
```

| Method | Returns | When to use it |
|--------|----------|---------------|
| `as_query_engine().query(...)` | `Response` with `.response` (LLM text) | Full RAG pipeline in one call |
| `as_retriever().retrieve(...)` | `list[NodeWithScore]` | Inspect ranking, citations, or wire a custom prompt |

### 1.8 Chroma integration: `ChromaVectorStore` + `StorageContext`

To persist the index to disk (like the `store.chroma` node in template 09):

```python
import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore

# Chroma client — in memory or persistent
client = chromadb.PersistentClient(path="./chroma_hr_policies")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"},  # cosine metric — see M3 §8
)

vector_store = ChromaVectorStore(chroma_collection=collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

index = VectorStoreIndex.from_documents(
    documentos,
    storage_context=storage_context,
)
```

> **Separate package:** `ChromaVectorStore` lives in `llama-index-vector-stores-chroma`, not in the core. Install it explicitly.

**LangChain equivalent:** `Chroma.from_documents(..., collection_name="hr_policies", persist_directory="./chroma_db")`. The difference: LlamaIndex wraps Chroma as the **index backend**; LangChain treats it as an independent **VectorStore**.

### 1.9 Full mini-pipeline COMMENTED — HR case

```python
# Requiere: pip install llama-index llama-index-embeddings-openai llama-index-llms-anthropic
# Optional Chroma: pip install llama-index-vector-stores-chroma chromadb
# This file is ILLUSTRATIVE — it does not run in the development environment without network.
#
# Same pipeline as solucion_scratch.py and solucion_framework.py (LangChain),
# but with LlamaIndex. Test query at the end.

import re
from pathlib import Path

from llama_index.core import Document, VectorStoreIndex, Settings, PromptTemplate
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

# ---------------------------------------------------------------------------
# GLOBAL CONFIGURATION (replaces ServiceContext — removed in LlamaIndex 0.11)
# ---------------------------------------------------------------------------
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = Anthropic(model="claude-opus-4-8", temperature=0.2)

# ---------------------------------------------------------------------------
# BLOCK 1 — LOAD AND CHUNK (≈ cargar_chunks from scratch)
# ---------------------------------------------------------------------------
ruta = Path("datos/politicas_rrhh.txt")
contenido = ruta.read_text(encoding="utf-8")
fragmentos = [p.strip() for p in re.split(r"\n---\n", contenido) if p.strip()]
# fragmentos: 8 strings — one per policy

documentos = [
    Document(text=texto, metadata={"source": str(ruta), "chunk_id": i})
    for i, texto in enumerate(fragmentos)
]
print(f"Total documents: {len(documentos)}")  # Expected: 8

# ---------------------------------------------------------------------------
# BLOCK 2 — VECTOR INDEX (≈ embed + store from scratch)
# ---------------------------------------------------------------------------
index = VectorStoreIndex.from_documents(documentos, show_progress=True)

# ---------------------------------------------------------------------------
# BLOCK 3 — RETRIEVER (inspection — ≈ recuperar from scratch)
# ---------------------------------------------------------------------------
retriever = index.as_retriever(similarity_top_k=3)
query = "How many vacation days am I entitled to if I have been at the company for 3 years?"

nodos = retriever.retrieve(query)
print("\nTOP-3 RETRIEVED NODES:")
for i, nodo in enumerate(nodos):
    print(f"  [{i+1}] score={nodo.score:.4f} | {nodo.text[:80].replace(chr(10), ' ')}...")

# ---------------------------------------------------------------------------
# BLOCK 4 — QUERY ENGINE (≈ construir_prompt + LLM from scratch)
# ---------------------------------------------------------------------------
qa_template = PromptTemplate(
    "You are the company's HR assistant. "
    "Answer ONLY based on the provided policy fragments. "
    "If the information is not in the fragments, state so explicitly.\n\n"
    "Relevant fragments:\n{context_str}\n\n"
    "Employee question: {query_str}\n\n"
    "Answer in markdown with clear and simple language."
)

query_engine = index.as_query_engine(
    similarity_top_k=3,
    text_qa_template=qa_template,
)

# ---------------------------------------------------------------------------
# BLOCK 5 — RUN
# ---------------------------------------------------------------------------
# response = query_engine.query(query)
# print("\nLLM Response:")
# print(response.response)
print("\n(requires ANTHROPIC_API_KEY and OPENAI_API_KEY — uncomment the lines above)")
```

### 1.10 Block-by-block walkthrough

```
┌──────────────────────────────────────────────────────────────────┐
│  IMPORTS + Settings                                              │
│  OpenAIEmbedding, Anthropic, Document, VectorStoreIndex          │
│  Settings.embed_model / Settings.llm (NO ServiceContext)         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 1 — LOAD AND CHUNK          (≈ cargar_chunks)             │
│  read_text → re.split("\n---\n") → list[Document]              │
│  8 Document with metadata chunk_id                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 2 — INDEX                    (≈ embed + index)            │
│  VectorStoreIndex.from_documents(documentos)                     │
│  Indexes 8 semantic vectors                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 3 — RETRIEVER (inspection)    (≈ recuperar)               │
│  retriever.retrieve(query) → list[NodeWithScore]                 │
│  Prints scores and previews                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 4 — QUERY ENGINE              (≈ prompt + LLM)            │
│  PromptTemplate with {context_str} and {query_str}                 │
│  as_query_engine(similarity_top_k=3, text_qa_template=...)       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 5 — RUN                                                   │
│  query_engine.query(query) → response.response                   │
│  response.source_nodes for citations                             │
└──────────────────────────────────────────────────────────────────┘
```

### 1.11 When to choose LlamaIndex vs LangChain

**Choose LlamaIndex when:**

- The project **is primarily RAG** (queries over documents, indexes, query engines).
- You want `query_engine.query()` in **one line** without wiring LCEL.
- You need specialized indexes (tree, list, index composition) or LlamaHub readers.
- Your team has already standardized on LlamaIndex and does not use LangGraph.

**Choose LangChain (or stay with it) when:**

- You need **LangGraph** for stateful agents, checkpoints, and HITL (M6–M7).
- Your stack is RAGorbit / codegen that already generates LCEL.
- You want LangSmith for native tracing.
- You mix RAG with many tools, LCEL structured output, and heterogeneous pipelines.

**Avoid mixing both** in the same pipeline without a clear reason — you duplicate abstractions (LangChain `Document` ≠ LlamaIndex `Document`) and complicate debugging.

**LlamaIndex gotchas:**

| Gotcha | What happens | Solution |
|--------|----------|----------|
| `ServiceContext` in old tutorials | `ImportError` or migration error | Use `Settings` (since 0.10; removed in 0.11) |
| `Document(page_content=...)` | Wrong attribute | LlamaIndex uses `text=`, not `page_content` |
| Separate integration packages | `ModuleNotFoundError` for Chroma, Anthropic, etc. | `pip install llama-index-vector-stores-chroma llama-index-llms-anthropic` |
| `response.response` vs `str(response)` | Confusion with the `Response` type | Use `.response` for text; `.source_nodes` for chunks |
| Default prompt in English | Responses in English if you do not customize | Pass a Spanish `text_qa_template` (as in block 4) |

---

## 2. No framework — provider native SDK + Chroma

### 2.1 The direct answer to "do you need a framework?"

**No.** The RAG pattern is vector arithmetic + an HTTP call. Frameworks **do not add magic** to retrieval — they add **convention, composition, and less repeated code**.

This approach uses only:

| Piece | Library | Role |
|-------|----------|-----|
| Load and chunk | **stdlib** (`pathlib`, `re`) | Same as scratch, but with real embeddings |
| Vector store | **`chromadb`** | Persistence + cosine search (M3 §8) |
| Embeddings | **`sentence-transformers`** or provider API | Dense semantic vectors (M3 §15) |
| LLM | **`anthropic`** or **`openai`** SDK | Direct call, no intermediate layer |
| Prompt | Manual **f-string** | Same as scratch `construir_prompt()` |

```
FRAMEWORK (LangChain/LlamaIndex)       NATIVE SDK (this §2)
──────────────────────────────         ──────────────────────────────────
Document, Embeddings, Retriever        chromadb.Collection + query()
Chain / query_engine                   sequential responder() function
5-8 subpackage imports                 3-4 libraries with stable APIs
```

### 2.2 Bridge table: scratch → native SDK

| What you did by hand (layer ②) | Native SDK piece | Library |
|--------------------------------|------------------|----------|
| `cargar_chunks(ruta)` | `read_text()` + `re.split(r"\n---\n", ...)` | stdlib |
| `embed(texto)` | `modelo.encode(texto, normalize_embeddings=True)` | `sentence-transformers` |
| In-memory `store` dict | `collection.upsert(ids, documents, embeddings, metadatas)` | `chromadb` |
| `similitud_coseno()` + `sort` | `collection.query(query_embeddings=..., n_results=3)` | `chromadb` |
| `recuperar()` | `resultados["documents"][0]` + `resultados["distances"][0]` | `chromadb` |
| `construir_prompt()` | f-string with numbered chunks | stdlib |
| LLM stub | `client.messages.create(model=..., messages=[...])` | `anthropic` |

### 2.3 Key APIs, one by one

#### ChromaDB — your `store` dict but with an index

```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_hr")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"},
)
```

#### sentence-transformers — your `embed()` but semantic

```python
from sentence_transformers import SentenceTransformer

modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
vec = modelo.encode("How many vacation days?", normalize_embeddings=True)
# vec: ndarray of 768 floats — not a bag-of-words dict
```

#### Index (offline phase)

```python
ids = [f"chunk_{i}" for i in range(len(fragmentos))]
embeddings = modelo.encode(fragmentos, normalize_embeddings=True).tolist()

collection.upsert(
    ids=ids,
    documents=fragmentos,
    embeddings=embeddings,
    metadatas=[{"chunk_id": i} for i in range(len(fragmentos))],
)
```

#### Retrieve (online phase)

```python
query = "How many vacation days am I entitled to if I have been at the company for 3 years?"
query_vec = modelo.encode([query], normalize_embeddings=True).tolist()

resultados = collection.query(
    query_embeddings=query_vec,
    n_results=3,
    include=["documents", "distances", "metadatas"],
)
# resultados["documents"][0]  → list[str] top-3
# resultados["distances"][0]  → distances (lower = more similar with cosine)
```

#### Anthropic SDK — direct generation

```python
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

mensaje = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    temperature=0.2,
    system="You are the HR assistant. Answer ONLY with the given fragments.",
    messages=[{"role": "user", "content": prompt_aumentado}],
)
respuesta = mensaje.content[0].text
```

> **OpenAI alternative:** `openai.OpenAI().chat.completions.create(model="gpt-4o-mini", messages=[...])`. The pattern is identical; only the client changes.

### 2.4 Full mini-pipeline COMMENTED — HR case

```python
# Requiere: pip install chromadb sentence-transformers anthropic
# This file is ILLUSTRATIVE — it does not run in the development environment without network.
#
# RAG without lang*: stdlib + chromadb + sentence-transformers + anthropic SDK.
# Same HR case, same query as solucion_scratch.py.

import re
from pathlib import Path

import anthropic
import chromadb
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# BLOCK 1 — LOAD AND CHUNK (stdlib — identical to scratch)
# ---------------------------------------------------------------------------
def cargar_chunks(ruta: str) -> list[str]:
    contenido = Path(ruta).read_text(encoding="utf-8")
    partes = re.split(r"\n---\n", contenido)
    return [p.strip() for p in partes if p.strip()]

RUTA_DATOS = "datos/politicas_rrhh.txt"
fragmentos = cargar_chunks(RUTA_DATOS)
print(f"Total chunks: {len(fragmentos)}")  # Expected: 8

# ---------------------------------------------------------------------------
# BLOCK 2 — EMBEDDINGS + CHROMA (≈ embed + store from scratch)
# ---------------------------------------------------------------------------
modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

client = chromadb.PersistentClient(path="./chroma_hr_native")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"},
)

ids = [f"chunk_{i}" for i in range(len(fragmentos))]
embeddings = modelo.encode(fragmentos, normalize_embeddings=True).tolist()
collection.upsert(
    ids=ids,
    documents=fragmentos,
    embeddings=embeddings,
    metadatas=[{"chunk_id": i, "source": RUTA_DATOS} for i in range(len(fragmentos))],
)

# ---------------------------------------------------------------------------
# BLOCK 3 — RETRIEVE TOP-3 (≈ recuperar from scratch)
# ---------------------------------------------------------------------------
def recuperar(query: str, k: int = 3) -> list[tuple[float, str]]:
    query_vec = modelo.encode([query], normalize_embeddings=True).tolist()
    resultados = collection.query(
        query_embeddings=query_vec,
        n_results=k,
        include=["documents", "distances"],
    )
    docs = resultados["documents"][0]
    dists = resultados["distances"][0]
    return list(zip(dists, docs))

# ---------------------------------------------------------------------------
# BLOCK 4 — AUGMENTED PROMPT (≈ construir_prompt from scratch)
# ---------------------------------------------------------------------------
def construir_prompt(query: str, resultados: list[tuple[float, str]]) -> str:
    lineas = [f"[{i+1}] {texto}" for i, (_, texto) in enumerate(resultados)]
    contexto = "\n\n".join(lineas)
    return (
        "You are the company's HR assistant. "
        "Answer ONLY based on the provided policy fragments. "
        "If the information is not in the fragments, state so explicitly.\n\n"
        f"Relevant fragments:\n{contexto}\n\n"
        f"Employee question: {query}\n\n"
        "Answer in markdown with clear and simple language."
    )

# ---------------------------------------------------------------------------
# BLOCK 5 — LLM + ORCHESTRATION (≈ main from scratch, with real LLM)
# ---------------------------------------------------------------------------
def responder(query: str, k: int = 3) -> str:
    resultados = recuperar(query, k=k)
    prompt = construir_prompt(query, resultados)
    client = anthropic.Anthropic()
    mensaje = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}],
    )
    return mensaje.content[0].text

# ---------------------------------------------------------------------------
# BLOCK 6 — RUN
# ---------------------------------------------------------------------------
QUERY = "How many vacation days am I entitled to if I have been at the company for 3 years?"

resultados = recuperar(QUERY, k=3)
print("\nTOP-3 RETRIEVED CHUNKS:")
for i, (dist, texto) in enumerate(resultados, start=1):
    print(f"  [{i}] distancia={dist:.4f} | {texto[:80].replace(chr(10), ' ')}...")

print("\nAUGMENTED PROMPT:")
print(construir_prompt(QUERY, resultados))

# respuesta = responder(QUERY)
# print("\nLLM Response:")
# print(respuesta)
print("\n(requires ANTHROPIC_API_KEY — uncomment the lines above)")
```

### 2.5 Block-by-block walkthrough

```
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 1 — LOAD AND CHUNK (stdlib)                               │
│  cargar_chunks() — re.split("\n---\n") → 8 fragments            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 2 — EMBEDDINGS + CHROMA                                   │
│  SentenceTransformer.encode() → collection.upsert()              │
│  Persistence in ./chroma_hr_native                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 3 — RETRIEVE                                              │
│  encode(query) → collection.query(n_results=3)                   │
│  Returns (distance, text) — inspectable                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 4 — AUGMENTED PROMPT                                      │
│  construir_prompt() — f-string with numbered chunks              │
│  Same format as scratch and LangChain                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 5 — LLM (native SDK)                                      │
│  anthropic.Anthropic().messages.create(...)                      │
│  No LangChain, no LlamaIndex                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.6 When the native SDK is the most sensible choice

**Use it when:**

- **Small or medium** project (one RAG microservice, an internal script).
- You want **maximum control** of latency, cost, and each HTTP call.
- You need **minimal dependencies** (security audit, slim container).
- The team does not want to learn framework abstractions — only Python + APIs.
- Privacy: local embeddings (`sentence-transformers`) + Chroma on-premise + Anthropic/OpenAI only for generation.

**Avoid it when:**

- The pipeline grows to **hybrid retriever + reranker + structured output + agent** — you will reimplement what LangChain/LangGraph already composes (M4–M6).
- You need **tracing, evaluation, and frequent provider swapping** without touching every call.
- Multiple teams must read the same code — frameworks provide shared convention.

**Native SDK gotchas:**

| Gotcha | What happens | Solution |
|--------|----------|----------|
| Re-index when changing embedding model | Vectors incompatible between models | Same model at ingest and query; if you change, `collection.delete()` and re-upsert |
| Chroma without `normalize_embeddings` | Ranking biased toward long texts | Always `normalize_embeddings=True` in `.encode()` |
| Prompt without separate system | Instructions mixed with context | Use Anthropic `system=` parameter or system message in OpenAI |
| `collection.query` returns nested lists | `documents[0]` is the results list | First index = the query (only one here) |

---

## 3. Haystack (deepset) — component pipelines

### 3.1 What Haystack is

**Haystack** (by deepset) is an open source framework oriented toward **production pipelines** for NLP and RAG. Its mental model is a **directed acyclic graph (DAG)** of **components** with typed inputs and outputs.

**Haystack 2.0** (2024) rewrote the framework from scratch. If you see Haystack 1.x code (`Pipeline.add_node`, `ElasticsearchDocumentStore`), it is from another generation — do not mix it with 2.x.

```
HAYSTACK 2.x — mental model
────────────────────────────
Pipeline
  ├── add_component("retriever", InMemoryEmbeddingRetriever(...))
  ├── add_component("prompt_builder", PromptBuilder(template=...))
  ├── add_component("llm", OpenAIGenerator(...))
  ├── connect("retriever.documents", "prompt_builder.documents")
  └── connect("prompt_builder", "llm")

pipeline.run({...})  → each component receives typed inputs and produces typed outputs
```

**Difference vs LangChain and LlamaIndex:**

| Aspect | LangChain | LlamaIndex | Haystack 2.x |
|---------|-----------|------------|--------------|
| Composition | LCEL `\|` | integrated `query_engine` | explicit `Pipeline` + `connect` |
| Visualization | LangSmith | Notebooks / logs | Pipelines serializable to **YAML** |
| Evaluation | External (RAGAS, etc.) | External | Native integration with eval frameworks |
| Focus | General + agents | Indexes / query | **Declarative production pipelines** |

### 3.2 Bridge table: scratch → Haystack

| What you did by hand (layer ②) | Haystack 2.x piece | Notes |
|--------------------------------|-------------------|-------|
| `cargar_chunks(ruta)` | `Document(content=...)` + manual split | Haystack `Document` uses `content`, not `page_content` |
| `embed(texto)` | `SentenceTransformersDocumentEmbedder` + `SentenceTransformersTextEmbedder` | Separate embedder for docs (offline) and query (online) |
| In-memory store | `InMemoryDocumentStore` | Also `ChromaDocumentStore` via integration |
| `recuperar()` | `InMemoryEmbeddingRetriever` | Connected to the document store with embeddings |
| `construir_prompt()` | `PromptBuilder(template=...)` — **Jinja2** template | Variables `documents`, `query` |
| LLM stub | `OpenAIGenerator` or `AnthropicChatGenerator` | Generators for completion; ChatGenerators for chat models |
| `main()` | `pipeline.run({...})` | One dict with inputs per component |

### 3.3 Key APIs, one by one

#### `Document` (Haystack)

```python
from haystack import Document

doc = Document(
    content="VACATION POLICY §3 — Accrual and use\n...",
    meta={"source": "politicas_rrhh.txt", "chunk_id": 0},
)
```

#### `Pipeline` + `add_component` + `connect`

```python
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever

pipeline = Pipeline()
pipeline.add_component("retriever", retriever)
pipeline.add_component("prompt_builder", PromptBuilder(template=my_template))
pipeline.add_component("llm", OpenAIGenerator(model="gpt-4o-mini"))

# Explicit connection: retriever output → prompt builder input
pipeline.connect("retriever.documents", "prompt_builder.documents")
pipeline.connect("prompt_builder", "llm")
```

- **`add_component(name, instance)`** — registers a node in the graph.
- **`connect(sender, receiver)`** — wires output → input. The name `"retriever.documents"` specifies **which output** of the sender you connect.
- **`pipeline.run(data)`** — runs the graph. `data` is a dict with inputs per component.

#### `PromptBuilder` — Jinja2 template

```python
from haystack.components.builders import PromptBuilder

template = """
You are the HR assistant. Answer ONLY with the given fragments.

Relevant fragments:
{% for doc in documents %}
[{{ loop.index }}] {{ doc.content }}
{% endfor %}

Employee question: {{ query }}

Answer in markdown with clear and simple language.
"""

prompt_builder = PromptBuilder(template=template)
```

> **Haystack 2.x also offers `ChatPromptBuilder`** for chat models with system/user messages. For this workshop we use `PromptBuilder` + `OpenAIGenerator` because it is the most direct pair to map scratch `construir_prompt()`. In production with Claude/GPT-4o, many teams migrate to `ChatPromptBuilder` + `AnthropicChatGenerator`.

### 3.4 Full mini-pipeline COMMENTED — HR case

```python
# Requiere: pip install haystack-ai sentence-transformers
# This file is ILLUSTRATIVE — it does not run in the development environment without network.
#
# RAG with Haystack 2.x — same HR case as solucion_scratch.py.
# Pipeline: offline indexing → Retriever + PromptBuilder + Generator.

import re
from pathlib import Path

from haystack import Pipeline, Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.embedders import (
    SentenceTransformersDocumentEmbedder,
    SentenceTransformersTextEmbedder,
)
from haystack.components.retrievers.in_memory import InMemoryEmbeddingRetriever
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.utils import Secret

# ---------------------------------------------------------------------------
# BLOCK 1 — LOAD AND CHUNK (≈ cargar_chunks from scratch)
# ---------------------------------------------------------------------------
ruta = Path("datos/politicas_rrhh.txt")
contenido = ruta.read_text(encoding="utf-8")
fragmentos = [p.strip() for p in re.split(r"\n---\n", contenido) if p.strip()]

documentos = [
    Document(content=texto, meta={"source": str(ruta), "chunk_id": i})
    for i, texto in enumerate(fragmentos)
]
print(f"Total documents: {len(documentos)}")  # Expected: 8

# ---------------------------------------------------------------------------
# BLOCK 2 — DOCUMENT STORE + EMBEDDINGS (≈ embed + store from scratch)
# ---------------------------------------------------------------------------
document_store = InMemoryDocumentStore()

doc_embedder = SentenceTransformersDocumentEmbedder(
    model="BAAI/bge-base-en-v1.5",
)
doc_embedder.warm_up()

# Embedder computes vectors and attaches them to the Documents
docs_con_embeddings = doc_embedder.run(documents=documentos)["documents"]
document_store.write_documents(docs_con_embeddings)

# ---------------------------------------------------------------------------
# BLOCK 3 — RAG PIPELINE COMPONENTS
# ---------------------------------------------------------------------------
text_embedder = SentenceTransformersTextEmbedder(
    model="BAAI/bge-base-en-v1.5",
)
text_embedder.warm_up()

retriever = InMemoryEmbeddingRetriever(document_store=document_store, top_k=3)

plantilla = """
You are the company's HR assistant. Answer ONLY based on the provided policy fragments. If the information is not in the fragments, state so explicitly.

Relevant fragments:
{% for doc in documents %}
[{{ loop.index }}] {{ doc.content }}
{% endfor %}

Employee question: {{ query }}

Answer in markdown with clear and simple language.
"""

prompt_builder = PromptBuilder(template=plantilla)
llm = OpenAIGenerator(
    api_key=Secret.from_env_var("OPENAI_API_KEY"),
    model="gpt-4o-mini",
    generation_kwargs={"temperature": 0.2},
)

# ---------------------------------------------------------------------------
# BLOCK 4 — ASSEMBLE PIPELINE (Retriever → PromptBuilder → Generator)
# ---------------------------------------------------------------------------
rag_pipeline = Pipeline()
rag_pipeline.add_component("text_embedder", text_embedder)
rag_pipeline.add_component("retriever", retriever)
rag_pipeline.add_component("prompt_builder", prompt_builder)
rag_pipeline.add_component("llm", llm)

rag_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
rag_pipeline.connect("retriever.documents", "prompt_builder.documents")
rag_pipeline.connect("prompt_builder", "llm")

# ---------------------------------------------------------------------------
# BLOCK 5 — RUN
# ---------------------------------------------------------------------------
QUERY = "How many vacation days am I entitled to if I have been at the company for 3 years?"

# Retrieval only (inspection — ≈ recuperar from scratch):
embedding_result = text_embedder.run(text=QUERY)
docs_recuperados = retriever.run(
    query_embedding=embedding_result["embedding"],
)["documents"]

print("\nTOP-3 RETRIEVED DOCUMENTS:")
for i, doc in enumerate(docs_recuperados):
    print(f"  [{i+1}] {doc.content[:80].replace(chr(10), ' ')}...")

# Full pipeline (uncomment with OPENAI_API_KEY):
# result = rag_pipeline.run({
#     "text_embedder": {"text": QUERY},
#     "prompt_builder": {"query": QUERY},
# })
# print("\nLLM Response:")
# print(result["llm"]["replies"][0])
print("\n(requires OPENAI_API_KEY — uncomment the lines above)")
```

### 3.5 Block-by-block walkthrough

```
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 1 — LOAD AND CHUNK                                        │
│  read_text → re.split → list[Document(content=..., meta=...)]  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 2 — OFFLINE INDEXING                                      │
│  SentenceTransformersDocumentEmbedder.run(documents)             │
│  document_store.write_documents(docs_con_embeddings)             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 3 — COMPONENTS                                            │
│  TextEmbedder (query) · Retriever (top_k=3)                      │
│  PromptBuilder (Jinja2) · OpenAIGenerator                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 4 — PIPELINE                                              │
│  text_embedder → retriever → prompt_builder → llm                │
│  explicit connect() between outputs and inputs                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOCK 5 — RUN                                                   │
│  pipeline.run({"text_embedder": {"text": query}, ...})           │
│  result["llm"]["replies"][0] → final answer                      │
└──────────────────────────────────────────────────────────────────┘
```

### 3.6 When Haystack fits

**Use it when:**

- You want **declarative** pipelines serializable to YAML (versioning, CI/CD, deployment).
- The team values **components testable in isolation** (unit test the retriever without the LLM).
- You need integrated evaluation and a **production** culture (deepset has years in industrial NLP).
- You build RAG **without** the LangChain ecosystem — independence similar to native SDK but with structure.

**Avoid it when:**

- You are already on **LangGraph** with complex agents — migrating the orchestrator adds little.
- You need to prototype in 10 minutes — Haystack has more boilerplate than LlamaIndex `query_engine`.
- Your organization standardized on RAGorbit/LangChain — Haystack would be a second framework without reason.

**Haystack gotchas:**

| Gotcha | What happens | Solution |
|--------|----------|----------|
| Haystack 1.x code on the internet | Incompatible APIs (`add_node` vs `add_component`) | Verify it is **Haystack 2.x** (`haystack-ai` on pip) |
| Forgetting `warm_up()` on embedders | Error on first run | Call `.warm_up()` after creating embedders |
| Ambiguous `connect` | Pipeline does not wire documents to prompt | Explicitly connect `"retriever.documents"` → `"prompt_builder.documents"` |
| `PromptBuilder` vs `ChatPromptBuilder` | Wrong format for chat models | Use `ChatPromptBuilder` + `AnthropicChatGenerator` for Claude |
| Two embedders (doc + text) | Confusion about which to use when | Doc embedder = offline (index); Text embedder = online (query) |

---

## 4. Final comparison table

### 4.1 LangChain vs LlamaIndex vs Haystack vs native SDK (for RAG)

| Criterion | LangChain | LlamaIndex | Haystack 2.x | Native SDK + Chroma |
|----------|-----------|------------|--------------|---------------------|
| **Abstraction** | Medium-high (LCEL, Runnables) | High (indexes, query engines) | High (typed Pipeline DAG) | Minimal (your functions) |
| **Learning curve** | Medium — many subpackages | Medium — index/query engine concept | Medium-high — components + connect | Low — if you already did scratch |
| **Fine control** | Medium — hidden layers in Runnables | Medium — query engine integrates steps | High — each component is explicit | **Maximum** |
| **Lines for minimal HR RAG** | ~50 (see `solucion_framework.py`) | ~45 with `query_engine` | ~70 (indexing + pipeline) | ~80 (but no framework) |
| **Best for** | RAGorbit ecosystem, LangGraph, LCEL, multi-tool | Pure RAG projects, indexes, query engines | Declarative production, YAML, integrated eval | Microservices, control, minimal deps |
| **Avoid if** | You only need a simple query_engine | You need LangGraph or advanced LCEL | Fast prototype or LangChain stack | Pipeline grows to hybrid + agent + HITL |
| **Provider swapping** | One line (`ChatOpenAI` → `ChatAnthropic`) | `Settings.llm = ...` | Change Generator component | Rewrite HTTP call |
| **Chroma persistence** | `Chroma.from_documents(persist_directory=...)` | `ChromaVectorStore` + `StorageContext` | `ChromaDocumentStore` (integration) | `chromadb.PersistentClient` direct |
| **Tracing / observability** | Native LangSmith | Callbacks / external | Native eval integration | You implement (logs, OTel) |
| **Dependencies** | Many (`langchain-*`) | Many (`llama-index-*`) | Moderate (`haystack-ai`) | Few (chromadb, ST, SDK) |

### 4.2 Decision rule

```
Do you start from scratch and the course / RAGorbit already uses LangChain?
  YES → LangChain (M1 §11) — consistency with codegen and M6+ LangGraph
  NO ↓

Is the project ONLY RAG over documents, without complex agents?
  YES → Do you want minimal code?
         YES → LlamaIndex (query_engine in few lines)
         NO → Do you want YAML pipelines and production culture?
                YES → Haystack 2.x
                NO → Native SDK + Chroma
  NO ↓

Do you need stateful agents, HITL, fan-out?
  YES → LangGraph (M6–M7) — no alternative in this guide replaces it equally
  NO → Reevaluate with the row above
```

**Course golden rule:** master **one** orchestration tool in depth (LangChain in the syllabus) and know the others to **choose**, not to mix them all in one project.

### 4.3 Mental map: four paths to the same destination

```
                    ┌─────────────────────────────────────┐
                    │  politicas_rrhh.txt (8 fragments)   │
                    └──────────────────┬──────────────────┘
                                       │
           ┌───────────┬───────────────┼───────────────┬───────────────┐
           ▼           ▼               ▼               ▼               │
      ┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐          │
      │LangChain│ │LlamaIdx │   │ Haystack│   │Native SDK│          │
      │  LCEL   │ │query_eng│   │ Pipeline│   │ functions│          │
      └────┬────┘ └────┬────┘   └────┬────┘   └────┬────┘          │
           │           │               │               │               │
           └───────────┴───────────────┴───────────────┘               │
                                       │                               │
                                       ▼                               │
                    ┌─────────────────────────────────────┐          │
                    │  top-3 chunks on "vacation 3        │          │
                    │  years" → augmented prompt → LLM     │          │
                    └──────────────────┬──────────────────┘          │
                                       ▼                               │
                    "You are entitled to 18 business days..."  ◀───────────┘
```

---

> **Cross-links**
>
> - LangChain from scratch (course foundation): [M1 §11 — Layer ③ explained](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch)
> - ChromaDB, FAISS, and sentence-transformers: [M3 §15 — Layer ③ explained](../03-embeddings-y-stores/guia.md#15-layer--explained-from-in-memory-dict-to-chromadb-faiss-and-sentence-transformers)
> - Hybrid retrievers, rerank, and hard filter: [M4 — Retrieval and query](../04-retrieval-y-query/guia.md)
> - Decision tables (models, stores, frameworks): [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) — especially §1–§3 (models/embeddings/stores) and §5 (ingest)
> - RAGorbit node cards: [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Scratch workshop (layer ②): [`01-fundamentos/lab/solucion_scratch.py`](../01-fundamentos/lab/solucion_scratch.py)
> - LangChain workshop (layer ③): [`01-fundamentos/lab/solucion_framework.py`](../01-fundamentos/lab/solucion_framework.py)
> - HR template: [`examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)
> - Layer convention and environment: [`HANDOFF.md` §3 and §5](../HANDOFF.md)

---

*RAGorbit course reference document. Read it after M1 §11 and the workshop layer ②; use it when you need to build the same RAG without depending exclusively on LangChain.*
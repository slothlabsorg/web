# RAG sin LangChain — construir el mismo asistente de RRHH con tecnologías competidoras

> **Referencia del curso RAGorbit.** Este documento enseña a construir el **mismo RAG** del taller M1 (asistente de políticas de RRHH, template [09-hr-policy-assistant](../../examples/09-hr-policy-assistant/)) usando las **alternativas a LangChain**: LlamaIndex, SDK nativo del proveedor + Chroma, y Haystack. La pedagogía replica las secciones **"La capa ③ explicada"** del curso: tabla puente, API por API, recorrido bloque por bloque, cuándo usar/NO y gotchas.
>
> **Audiencia:** programas en Python, ya completó la capa ② (`01-fundamentos/lab/solucion_scratch.py`) y quiere ser **ingeniero de IA completo**, no experto solo en `lang*`.
>
> **Query de referencia en todo el documento:** `¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?`
>
> **Respuesta esperada (según §3 de las políticas):** 18 días hábiles de vacaciones.

---

## Introducción: por qué aprender RAG sin LangChain

En M1 aprendiste LangChain porque es el framework de orquestación del codegen de RAGorbit y del ecosistema más documentado. Pero **dominar LangChain no es dominar RAG**. RAG es un patrón de cuatro pasos (indexar → recuperar → aumentar prompt → generar) que existe **antes** y **después** de cualquier framework.

Aprender las alternativas te da tres ventajas concretas:

1. **Independencia de framework.** Si mañana tu empresa adopta LlamaIndex, o decide eliminar capas intermedias y llamar APIs directamente, no empiezas de cero.
2. **Criterio de ingeniería.** Sabrás cuándo un framework aporta valor (abstracciones, composición, observabilidad) y cuándo es solo peso muerto en un script de 80 líneas.
3. **Depuración.** Cuando un pipeline falla en producción, el error suele estar en embeddings, chunks o el prompt — no en el import de LangChain. Entender cada pieza sin el framework te permite aislar el problema.

```
LO QUE YA SABES (capa ②)              LO QUE APRENDERÁS AQUÍ
────────────────────────              ─────────────────────────────────────
cargar_chunks() + embed()             Lo mismo con LlamaIndex, SDK nativo o Haystack
recuperar() + construir_prompt()      Mismo caso RRHH, misma query, distintas herramientas
main() orquestando todo               Cuándo cada enfoque gana o pierde frente a LangChain
```

### Tabla puente global: capa ② → cada tecnología

Esta tabla mapea **cada función** de [`solucion_scratch.py`](../01-fundamentos/lab/solucion_scratch.py) a su equivalente en LangChain (M1 §11), LlamaIndex, SDK nativo y Haystack:

| Lo que hiciste a mano (capa ②) | LangChain (M1 §11) | LlamaIndex (§1) | SDK nativo + Chroma (§2) | Haystack (§3) |
|--------------------------------|-------------------|-----------------|--------------------------|---------------|
| `cargar_chunks(ruta)` — leer txt y dividir por `---` | `TextLoader` + `CharacterTextSplitter` | `Document` + split manual o `SentenceSplitter` | `open()` + `re.split(r"\n---\n", ...)` (stdlib) | `Document` + split manual al indexar |
| `embed(texto)` — bag-of-words → `dict` | `OpenAIEmbeddings` | `Settings.embed_model` / `OpenAIEmbedding` | `SentenceTransformer.encode()` o API embeddings | `SentenceTransformersDocumentEmbedder` |
| Lista `chunks` en memoria | `Chroma.from_documents(...)` | `VectorStoreIndex.from_documents(...)` | `collection.upsert(...)` | `document_store.write_documents(...)` |
| `similitud_coseno()` + `sort` | `as_retriever(search_kwargs={"k": 3})` | `as_query_engine(similarity_top_k=3)` / `as_retriever` | `collection.query(n_results=3)` | `InMemoryEmbeddingRetriever` |
| `recuperar()` → `(índice, sim, texto)` | `retriever.invoke(query)` → `list[Document]` | `retriever.retrieve(query)` → `list[NodeWithScore]` | `resultados["documents"]` + `distances` | `retriever.run(query=...)` → `documents` |
| `construir_prompt()` — f-string | `ChatPromptTemplate` | `PromptTemplate` + `text_qa_template` | f-string / `str.format` a mano | `PromptBuilder` (plantilla Jinja2) |
| (no hay LLM en scratch) | `ChatOpenAI` / `ChatAnthropic` | `Settings.llm` / `Anthropic` | `anthropic.Anthropic().messages.create(...)` | `OpenAIGenerator` / `AnthropicChatGenerator` |
| `main()` orquestando | Chain LCEL con `\|` | `query_engine.query(...)` | Función `responder(query)` secuencial | `Pipeline.run(...)` |

**Nodos RAGorbit del template 09:** `loader` → `ingest.chunker` → `model.embedding` → `store.chroma` → `retrieval.vector` → `logic.prompt` → `model.llm`. Los cuatro enfoques de este documento implementan esa misma cadena con distintas herramientas.

> **Entorno:** en la máquina de estudio del curso no hay `pip` ni red ([`HANDOFF.md` §5](../HANDOFF.md)). El código de framework de este documento es **ILUSTRATIVO** — cada bloque lleva cabecera `# Requiere: pip install ...`. Ejecútalo en tu entorno cuando tengas paquetes y API keys.

---

## 1. LlamaIndex (la gran alternativa para RAG)

### 1.1 Qué es LlamaIndex y en qué difiere de LangChain

**LlamaIndex** (antes GPT Index) es un framework Python centrado en **datos + consultas**: cargar documentos, construir **índices**, recuperar contexto y responder preguntas. Nació como "la librería de RAG" antes de que RAG fuera mainstream.

**Diferencia de modelo mental:**

| Aspecto | LangChain | LlamaIndex |
|---------|-----------|------------|
| Unidad central | `Runnable` componible con `\|` (LCEL) | **Índice** (`VectorStoreIndex`, etc.) + **query engine** |
| Fortaleza principal | Orquestación general (RAG, agentes, tools, LCEL) | Pipelines RAG, índices, query engines, agentes sobre índices |
| Abstracción de documento | `Document(page_content=..., metadata=...)` | `Document(text=..., metadata=...)` |
| Recuperación | `vectorstore.as_retriever().invoke(query)` | `index.as_retriever()` o `index.as_query_engine()` |
| Generación | Tú cableas retriever + prompt + LLM en LCEL | `as_query_engine()` **integra** retrieve + prompt + LLM en un solo objeto |
| Ecosistema | LangGraph, LangSmith, 100+ integraciones | LlamaHub readers, índices especializados, LlamaParse |

**Analogía:** LangChain es una caja de conectores universales (enchufas para todo). LlamaIndex es una **fábrica de motores de búsqueda semántica** con un acelerador de consultas (`query_engine`) que ya incluye el cableado RAG más común.

```
LANGCHAIN (M1)                         LLAMAINDEX (este §1)
────────────────                       ─────────────────────────────────
TextLoader → Splitter → Chroma         Document → VectorStoreIndex
    → as_retriever → LCEL chain            → as_query_engine → .query()
Tú cableas cada paso                   El query engine cablea retrieve+prompt+LLM
```

> **Nota de versiones (2025/2026):** desde **LlamaIndex 0.10**, `ServiceContext` está deprecado; en **0.11 fue eliminado**. Usa el singleton global `Settings` o pasa `embed_model` / `llm` directamente a constructores locales. Si ves tutoriales antiguos con `ServiceContext`, están obsoletos.

### 1.2 Tabla puente: scratch → LlamaIndex

| Lo que hiciste a mano (capa ②) | Pieza LlamaIndex (capa ③) | Nodo RAGorbit (template 09) |
|--------------------------------|---------------------------|----------------------------|
| `cargar_chunks(ruta)` | `Document(text=...)` por fragmento (split manual por `\n---\n`) | `loader` + `ingest.chunker` |
| `embed(texto)` | `Settings.embed_model = OpenAIEmbedding(...)` | `model.embedding` |
| Lista en memoria + vectores | `VectorStoreIndex.from_documents(docs)` | `store.chroma` (conceptualmente) |
| `recuperar()` top-3 | `index.as_retriever(similarity_top_k=3)` | `retrieval.vector` |
| `construir_prompt()` + LLM | `index.as_query_engine(similarity_top_k=3, text_qa_template=...)` | `logic.prompt` + `model.llm` |
| `main()` | `query_engine.query(pregunta)` | edges del `flow.json` |

### 1.3 El objeto `Document`

LlamaIndex usa `Document` con el campo **`text`** (no `page_content` como LangChain):

```python
from llama_index.core import Document

doc = Document(
    text="POLÍTICA DE VACACIONES §3 — Acumulación y disfrute\nLos empleados...",
    metadata={"source": "datos/politicas_rrhh.txt", "seccion": "§3"},
)
```

- **`text`:** el contenido del fragmento (equivale a cada string en tu lista `chunks` de scratch).
- **`metadata`:** etiquetas para filtros posteriores (M4). En RRHH podrías añadir `{"tipo": "vacaciones"}`.

Los índices **consumen** `list[Document]` y los convierten internamente en **nodos** (`TextNode`) con embeddings.

### 1.4 `Settings` — reemplazo de `ServiceContext`

En LlamaIndex moderno, la configuración global vive en `Settings`:

```python
from llama_index.core import Settings
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

# Embeddings — equivale a OpenAIEmbeddings en LangChain
Settings.embed_model = OpenAIEmbedding(
    model="text-embedding-3-small",
    # api_key se lee de OPENAI_API_KEY
)

# LLM — equivale a ChatAnthropic en LangChain (default RAGorbit)
Settings.llm = Anthropic(
    model="claude-opus-4-8",
    temperature=0.2,
)
```

| Atributo `Settings` | Qué controla | Equivalente scratch / LangChain |
|---------------------|--------------|--------------------------------|
| `Settings.embed_model` | Modelo de embeddings global | `embed()` / `OpenAIEmbeddings` |
| `Settings.llm` | Modelo de generación global | LLM stub / `ChatAnthropic` |
| `Settings.chunk_size` | Tamaño máximo de chunk (si usas splitters automáticos) | `chunk_size` del `CharacterTextSplitter` |
| `Settings.chunk_overlap` | Solapamiento entre chunks | `chunk_overlap` del splitter |

**Alternativa local (privacidad RRHH):**

```python
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-base-en-v1.5")
Settings.llm = Ollama(model="llama3.1", request_timeout=120.0)
```

### 1.5 `VectorStoreIndex.from_documents`

El **`VectorStoreIndex`** es el índice más usado en LlamaIndex: convierte documentos en embeddings y habilita búsqueda semántica.

```python
from llama_index.core import VectorStoreIndex

# documentos: list[Document] — los 8 fragmentos de políticas RRHH
index = VectorStoreIndex.from_documents(
    documentos,
    show_progress=True,
)
# Por dentro: embed_documents → almacena vectores → índice listo para consultar
```

**Qué hace `.from_documents` por dentro (fase offline):**

```
documentos (8 Document)
    │
    ├──▶ Settings.embed_model.get_text_embedding_batch([doc.text for doc in docs])
    │         → 8 vectores densos
    │
    └──▶ Índice vectorial en memoria (o en Chroma si usas StorageContext — §1.8)
```

Equivale a tu bucle `for chunk in chunks: embed(chunk)` + guardar en memoria, pero con embeddings semánticos reales.

### 1.6 `as_query_engine` — retrieve + prompt + LLM en uno

El **query engine** es la pieza distintiva de LlamaIndex. En LangChain cableas retriever + prompt + LLM con LCEL; en LlamaIndex:

```python
from llama_index.core import PromptTemplate

# Plantilla equivalente a construir_prompt() del scratch
QA_TEMPLATE = PromptTemplate(
    "Eres el asistente de RRHH de la empresa. "
    "Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados.\n\n"
    "Fragmentos relevantes:\n{context_str}\n\n"
    "Pregunta del empleado: {query_str}\n\n"
    "Responde en markdown con lenguaje claro y sencillo."
)

query_engine = index.as_query_engine(
    similarity_top_k=3,           # top-3, como k=3 en recuperar()
    text_qa_template=QA_TEMPLATE,
)

response = query_engine.query(
    "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"
)
print(response.response)   # texto final del LLM
# response.source_nodes     # nodos recuperados (para inspección / citas)
```

| Parámetro | Significado | Equivalente scratch |
|-----------|-------------|---------------------|
| `similarity_top_k=3` | Cuántos fragmentos recuperar | `k=3` en `recuperar()` |
| `text_qa_template` | Plantilla con `{context_str}` y `{query_str}` | `construir_prompt()` |
| `response_mode` | `"compact"`, `"tree_summarize"`, etc. | Cómo condensa contexto largo (default `"compact"` basta para RRHH) |

**Predicción importante:** con embeddings semánticos reales, §3 ("Después de 3 años… 18 días") suele rankear **primero** — no §4 como en bag-of-words del scratch. El mecanismo es idéntico; cambia la calidad del vector.

### 1.7 `as_retriever` — solo recuperar, sin generar

Si quieres **controlar el prompt tú mismo** (como en LangChain LCEL), usa el retriever sin query engine:

```python
retriever = index.as_retriever(similarity_top_k=3)

nodos = retriever.retrieve(
    "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"
)
# nodos: list[NodeWithScore]
# nodos[0].text          → texto del chunk
# nodos[0].score         → score de similitud
# nodos[0].metadata      → metadata del Document original

for i, nodo in enumerate(nodos):
    print(f"[{i+1}] score={nodo.score:.4f} | {nodo.text[:80]}...")
```

| Método | Devuelve | Cuándo usarlo |
|--------|----------|---------------|
| `as_query_engine().query(...)` | `Response` con `.response` (texto del LLM) | Pipeline RAG completo en una llamada |
| `as_retriever().retrieve(...)` | `list[NodeWithScore]` | Inspeccionar ranking, citas, o cablear prompt custom |

### 1.8 Integración con Chroma: `ChromaVectorStore` + `StorageContext`

Para persistir el índice en disco (como el nodo `store.chroma` del template 09):

```python
import chromadb
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.vector_stores.chroma import ChromaVectorStore

# Cliente Chroma — en memoria o persistente
client = chromadb.PersistentClient(path="./chroma_hr_policies")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"},  # métrica coseno — ver M3 §8
)

vector_store = ChromaVectorStore(chroma_collection=collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

index = VectorStoreIndex.from_documents(
    documentos,
    storage_context=storage_context,
)
```

> **Paquete separado:** `ChromaVectorStore` vive en `llama-index-vector-stores-chroma`, no en el core. Instálalo explícitamente.

**Equivalente LangChain:** `Chroma.from_documents(..., collection_name="hr_policies", persist_directory="./chroma_db")`. La diferencia: LlamaIndex envuelve Chroma como **backend del índice**; LangChain lo trata como **VectorStore** independiente.

### 1.9 Mini-pipeline completo COMENTADO — caso RRHH

```python
# Requiere: pip install llama-index llama-index-embeddings-openai llama-index-llms-anthropic
# Opcional Chroma: pip install llama-index-vector-stores-chroma chromadb
# Este archivo es ILUSTRATIVO — no se ejecuta en el entorno de desarrollo sin red.
#
# Mismo pipeline que solucion_scratch.py y solucion_framework.py (LangChain),
# pero con LlamaIndex. Query de prueba al final.

import re
from pathlib import Path

from llama_index.core import Document, VectorStoreIndex, Settings, PromptTemplate
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

# ---------------------------------------------------------------------------
# CONFIGURACIÓN GLOBAL (reemplaza ServiceContext — eliminado en LlamaIndex 0.11)
# ---------------------------------------------------------------------------
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = Anthropic(model="claude-opus-4-8", temperature=0.2)

# ---------------------------------------------------------------------------
# BLOQUE 1 — CARGAR Y TROCEAR (≈ cargar_chunks del scratch)
# ---------------------------------------------------------------------------
ruta = Path("datos/politicas_rrhh.txt")
contenido = ruta.read_text(encoding="utf-8")
fragmentos = [p.strip() for p in re.split(r"\n---\n", contenido) if p.strip()]
# fragmentos: 8 strings — uno por política

documentos = [
    Document(text=texto, metadata={"source": str(ruta), "chunk_id": i})
    for i, texto in enumerate(fragmentos)
]
print(f"Total de documentos: {len(documentos)}")  # Esperado: 8

# ---------------------------------------------------------------------------
# BLOQUE 2 — ÍNDICE VECTORIAL (≈ embed + store del scratch)
# ---------------------------------------------------------------------------
index = VectorStoreIndex.from_documents(documentos, show_progress=True)

# ---------------------------------------------------------------------------
# BLOQUE 3 — RETRIEVER (inspección — ≈ recuperar del scratch)
# ---------------------------------------------------------------------------
retriever = index.as_retriever(similarity_top_k=3)
query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

nodos = retriever.retrieve(query)
print("\nTOP-3 NODOS RECUPERADOS:")
for i, nodo in enumerate(nodos):
    print(f"  [{i+1}] score={nodo.score:.4f} | {nodo.text[:80].replace(chr(10), ' ')}...")

# ---------------------------------------------------------------------------
# BLOQUE 4 — QUERY ENGINE (≈ construir_prompt + LLM del scratch)
# ---------------------------------------------------------------------------
qa_template = PromptTemplate(
    "Eres el asistente de RRHH de la empresa. "
    "Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados. "
    "Si la información no está en los fragmentos, dilo explícitamente.\n\n"
    "Fragmentos relevantes:\n{context_str}\n\n"
    "Pregunta del empleado: {query_str}\n\n"
    "Responde en markdown con lenguaje claro y sencillo."
)

query_engine = index.as_query_engine(
    similarity_top_k=3,
    text_qa_template=qa_template,
)

# ---------------------------------------------------------------------------
# BLOQUE 5 — EJECUTAR
# ---------------------------------------------------------------------------
# response = query_engine.query(query)
# print("\nRespuesta del LLM:")
# print(response.response)
print("\n(requiere ANTHROPIC_API_KEY y OPENAI_API_KEY — descomenta las líneas anteriores)")
```

### 1.10 Recorrido bloque por bloque

```
┌──────────────────────────────────────────────────────────────────┐
│  IMPORTS + Settings                                              │
│  OpenAIEmbedding, Anthropic, Document, VectorStoreIndex          │
│  Settings.embed_model / Settings.llm (NO ServiceContext)         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 1 — CARGAR Y TROCEAR          (≈ cargar_chunks)          │
│  read_text → re.split("\n---\n") → list[Document]              │
│  8 Document con metadata chunk_id                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 2 — ÍNDICE                    (≈ embed + índice)         │
│  VectorStoreIndex.from_documents(documentos)                     │
│  Indexa 8 vectores semánticos                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 3 — RETRIEVER (inspección)    (≈ recuperar)              │
│  retriever.retrieve(query) → list[NodeWithScore]                 │
│  Imprime scores y previews                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 4 — QUERY ENGINE              (≈ prompt + LLM)           │
│  PromptTemplate con {context_str} y {query_str}                  │
│  as_query_engine(similarity_top_k=3, text_qa_template=...)       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 5 — EJECUTAR                                             │
│  query_engine.query(query) → response.response                   │
│  response.source_nodes para citas                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.11 Cuándo elegir LlamaIndex vs LangChain

**Elige LlamaIndex cuando:**

- El proyecto **es principalmente RAG** (consultas sobre documentos, índices, query engines).
- Quieres `query_engine.query()` en **una línea** sin cablear LCEL.
- Necesitas índices especializados (árbol, lista, composición de índices) o readers de LlamaHub.
- Tu equipo ya estandarizó LlamaIndex y no usa LangGraph.

**Elige LangChain (o quédate con él) cuando:**

- Necesitas **LangGraph** para agentes con estado, checkpoints y HITL (M6–M7).
- Tu stack es RAGorbit / codegen que ya genera LCEL.
- Quieres LangSmith para tracing nativo.
- Mezclas RAG con muchas tools, structured output LCEL, y pipelines heterogéneos.

**Evita mezclar ambos** en el mismo pipeline sin una razón clara — duplicas abstracciones (`Document` de LangChain ≠ `Document` de LlamaIndex) y complicas el debugging.

**Gotchas LlamaIndex:**

| Gotcha | Qué pasa | Solución |
|--------|----------|----------|
| `ServiceContext` en tutoriales viejos | `ImportError` o error de migración | Usa `Settings` (desde 0.10; eliminado en 0.11) |
| `Document(page_content=...)` | Atributo incorrecto | LlamaIndex usa `text=`, no `page_content` |
| Paquetes de integración separados | `ModuleNotFoundError` para Chroma, Anthropic, etc. | `pip install llama-index-vector-stores-chroma llama-index-llms-anthropic` |
| `response.response` vs `str(response)` | Confusión con el tipo `Response` | Usa `.response` para el texto; `.source_nodes` para chunks |
| Prompt por defecto en inglés | Respuestas en inglés si no personalizas | Pasa `text_qa_template` en español (como en el bloque 4) |

---

## 2. Sin framework — SDK nativo del proveedor + Chroma

### 2.1 La respuesta directa a "¿necesitas un framework?"

**No.** El patrón RAG es aritmética vectorial + una llamada HTTP. Los frameworks **no añaden magia** al retrieval — añaden **convención, composición y menos código repetido**.

Este enfoque usa solo:

| Pieza | Librería | Rol |
|-------|----------|-----|
| Carga y troceo | **stdlib** (`pathlib`, `re`) | Igual que scratch, pero con embeddings reales |
| Vector store | **`chromadb`** | Persistencia + búsqueda coseno (M3 §8) |
| Embeddings | **`sentence-transformers`** o API del proveedor | Vectores densos semánticos (M3 §15) |
| LLM | **`anthropic`** o **`openai`** SDK | Llamada directa, sin capa intermedia |
| Prompt | **f-string** a mano | Igual que `construir_prompt()` del scratch |

```
FRAMEWORK (LangChain/LlamaIndex)       SDK NATIVO (este §2)
──────────────────────────────         ──────────────────────────────────
Document, Embeddings, Retriever        chromadb.Collection + query()
Chain / query_engine                   función responder() secuencial
5-8 imports de subpaquetes             3-4 librerías con APIs estables
```

### 2.2 Tabla puente: scratch → SDK nativo

| Lo que hiciste a mano (capa ②) | Pieza SDK nativo | Librería |
|--------------------------------|------------------|----------|
| `cargar_chunks(ruta)` | `read_text()` + `re.split(r"\n---\n", ...)` | stdlib |
| `embed(texto)` | `modelo.encode(texto, normalize_embeddings=True)` | `sentence-transformers` |
| `store` dict en memoria | `collection.upsert(ids, documents, embeddings, metadatas)` | `chromadb` |
| `similitud_coseno()` + `sort` | `collection.query(query_embeddings=..., n_results=3)` | `chromadb` |
| `recuperar()` | `resultados["documents"][0]` + `resultados["distances"][0]` | `chromadb` |
| `construir_prompt()` | f-string con chunks numerados | stdlib |
| LLM stub | `client.messages.create(model=..., messages=[...])` | `anthropic` |

### 2.3 APIs clave, una por una

#### ChromaDB — tu `store` dict pero con índice

```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_hr")
collection = client.get_or_create_collection(
    name="hr_policies",
    metadata={"hnsw:space": "cosine"},
)
```

#### sentence-transformers — tu `embed()` pero semántico

```python
from sentence_transformers import SentenceTransformer

modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")
vec = modelo.encode("¿Cuántos días de vacaciones?", normalize_embeddings=True)
# vec: ndarray de 768 floats — no un dict bag-of-words
```

#### Indexar (fase offline)

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

#### Recuperar (fase online)

```python
query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"
query_vec = modelo.encode([query], normalize_embeddings=True).tolist()

resultados = collection.query(
    query_embeddings=query_vec,
    n_results=3,
    include=["documents", "distances", "metadatas"],
)
# resultados["documents"][0]  → list[str] top-3
# resultados["distances"][0]  → distancias (menor = más similar con coseno)
```

#### Anthropic SDK — generación directa

```python
import anthropic

client = anthropic.Anthropic()  # lee ANTHROPIC_API_KEY del entorno

mensaje = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    temperature=0.2,
    system="Eres el asistente de RRHH. Responde SOLO con los fragmentos dados.",
    messages=[{"role": "user", "content": prompt_aumentado}],
)
respuesta = mensaje.content[0].text
```

> **Alternativa OpenAI:** `openai.OpenAI().chat.completions.create(model="gpt-4o-mini", messages=[...])`. El patrón es idéntico; cambia el cliente.

### 2.4 Mini-pipeline completo COMENTADO — caso RRHH

```python
# Requiere: pip install chromadb sentence-transformers anthropic
# Este archivo es ILUSTRATIVO — no se ejecuta en el entorno de desarrollo sin red.
#
# RAG sin lang*: stdlib + chromadb + sentence-transformers + anthropic SDK.
# Mismo caso RRHH, misma query que solucion_scratch.py.

import re
from pathlib import Path

import anthropic
import chromadb
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# BLOQUE 1 — CARGAR Y TROCEAR (stdlib — idéntico al scratch)
# ---------------------------------------------------------------------------
def cargar_chunks(ruta: str) -> list[str]:
    contenido = Path(ruta).read_text(encoding="utf-8")
    partes = re.split(r"\n---\n", contenido)
    return [p.strip() for p in partes if p.strip()]

RUTA_DATOS = "datos/politicas_rrhh.txt"
fragmentos = cargar_chunks(RUTA_DATOS)
print(f"Total de chunks: {len(fragmentos)}")  # Esperado: 8

# ---------------------------------------------------------------------------
# BLOQUE 2 — EMBEDDINGS + CHROMA (≈ embed + store del scratch)
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
# BLOQUE 3 — RECUPERAR TOP-3 (≈ recuperar del scratch)
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
# BLOQUE 4 — PROMPT AUMENTADO (≈ construir_prompt del scratch)
# ---------------------------------------------------------------------------
def construir_prompt(query: str, resultados: list[tuple[float, str]]) -> str:
    lineas = [f"[{i+1}] {texto}" for i, (_, texto) in enumerate(resultados)]
    contexto = "\n\n".join(lineas)
    return (
        "Eres el asistente de RRHH de la empresa. "
        "Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados. "
        "Si la información no está en los fragmentos, dilo explícitamente.\n\n"
        f"Fragmentos relevantes:\n{contexto}\n\n"
        f"Pregunta del empleado: {query}\n\n"
        "Responde en markdown con lenguaje claro y sencillo."
    )

# ---------------------------------------------------------------------------
# BLOQUE 5 — LLM + ORQUESTACIÓN (≈ main del scratch, con LLM real)
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
# BLOQUE 6 — EJECUTAR
# ---------------------------------------------------------------------------
QUERY = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

resultados = recuperar(QUERY, k=3)
print("\nTOP-3 CHUNKS RECUPERADOS:")
for i, (dist, texto) in enumerate(resultados, start=1):
    print(f"  [{i}] distancia={dist:.4f} | {texto[:80].replace(chr(10), ' ')}...")

print("\nPROMPT AUMENTADO:")
print(construir_prompt(QUERY, resultados))

# respuesta = responder(QUERY)
# print("\nRespuesta del LLM:")
# print(respuesta)
print("\n(requiere ANTHROPIC_API_KEY — descomenta las líneas anteriores)")
```

### 2.5 Recorrido bloque por bloque

```
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 1 — CARGAR Y TROCEAR (stdlib)                            │
│  cargar_chunks() — re.split("\n---\n") → 8 fragmentos           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 2 — EMBEDDINGS + CHROMA                                  │
│  SentenceTransformer.encode() → collection.upsert()              │
│  Persistencia en ./chroma_hr_native                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 3 — RECUPERAR                                            │
│  encode(query) → collection.query(n_results=3)                   │
│  Devuelve (distancia, texto) — inspeccionable                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 4 — PROMPT AUMENTADO                                     │
│  construir_prompt() — f-string con chunks numerados              │
│  Mismo formato que scratch y LangChain                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 5 — LLM (SDK nativo)                                     │
│  anthropic.Anthropic().messages.create(...)                      │
│  Sin LangChain, sin LlamaIndex                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.6 Cuándo el SDK nativo es lo más sensato

**Úsalo cuando:**

- Proyecto **pequeño o mediano** (un microservicio RAG, un script interno).
- Quieres **máximo control** de latencia, costo y cada llamada HTTP.
- Necesitas **mínimas dependencias** (auditoría de seguridad, contenedor slim).
- El equipo no quiere aprender abstracciones de framework — solo Python + APIs.
- Privacidad: embeddings locales (`sentence-transformers`) + Chroma on-premise + Anthropic/OpenAI solo para generación.

**Evítalo cuando:**

- El pipeline crece a **retriever híbrido + reranker + structured output + agente** — reimplementarás lo que LangChain/LangGraph ya componen (M4–M6).
- Necesitas **tracing, evaluación y swapping de proveedores** frecuente sin tocar cada llamada.
- Múltiples equipos deben leer el mismo código — los frameworks dan convención compartida.

**Gotchas SDK nativo:**

| Gotcha | Qué pasa | Solución |
|--------|----------|----------|
| Re-indexar al cambiar modelo de embedding | Vectores incompatibles entre modelos | Mismo modelo en ingesta y consulta; si cambias, `collection.delete()` y re-upsert |
| Chroma sin `normalize_embeddings` | Ranking sesgado hacia textos largos | Siempre `normalize_embeddings=True` en `.encode()` |
| Prompt sin system separado | Mezclas instrucciones con contexto | Usa parámetro `system=` de Anthropic o mensaje system en OpenAI |
| `collection.query` devuelve listas anidadas | `documents[0]` es la lista de resultados | Primer índice = la query (solo una aquí) |

---

## 3. Haystack (deepset) — pipelines de componentes

### 3.1 Qué es Haystack

**Haystack** (by deepset) es un framework open source orientado a **pipelines de producción** para NLP y RAG. Su modelo mental es un **grafo acíclico dirigido (DAG)** de **componentes** con entradas y salidas tipadas.

**Haystack 2.0** (2024) reescribió el framework desde cero. Si ves código de Haystack 1.x (`Pipeline.add_node`, `ElasticsearchDocumentStore`), es de otra generación — no lo mezcles con 2.x.

```
HAYSTACK 2.x — modelo mental
────────────────────────────
Pipeline
  ├── add_component("retriever", InMemoryEmbeddingRetriever(...))
  ├── add_component("prompt_builder", PromptBuilder(template=...))
  ├── add_component("llm", OpenAIGenerator(...))
  ├── connect("retriever.documents", "prompt_builder.documents")
  └── connect("prompt_builder", "llm")

pipeline.run({...})  → cada componente recibe inputs tipados y produce outputs tipados
```

**Diferencia frente a LangChain y LlamaIndex:**

| Aspecto | LangChain | LlamaIndex | Haystack 2.x |
|---------|-----------|------------|--------------|
| Composición | LCEL `\|` | `query_engine` integrado | `Pipeline` + `connect` explícito |
| Visualización | LangSmith | Notebooks / logs | Pipelines serializables a **YAML** |
| Evaluación | Externa (RAGAS, etc.) | Externa | Integración nativa con frameworks de eval |
| Foco | General + agentes | Índices / query | **Pipelines declarativos de producción** |

### 3.2 Tabla puente: scratch → Haystack

| Lo que hiciste a mano (capa ②) | Pieza Haystack 2.x | Notas |
|--------------------------------|-------------------|-------|
| `cargar_chunks(ruta)` | `Document(content=...)` + split manual | `Document` de Haystack usa `content`, no `page_content` |
| `embed(texto)` | `SentenceTransformersDocumentEmbedder` + `SentenceTransformersTextEmbedder` | Embedder separado para docs (offline) y query (online) |
| Store en memoria | `InMemoryDocumentStore` | También hay `ChromaDocumentStore` vía integración |
| `recuperar()` | `InMemoryEmbeddingRetriever` | Conectado al document store con embeddings |
| `construir_prompt()` | `PromptBuilder(template=...)` — plantilla **Jinja2** | Variables `documents`, `query` |
| LLM stub | `OpenAIGenerator` o `AnthropicChatGenerator` | Generators para completado; ChatGenerators para modelos chat |
| `main()` | `pipeline.run({...})` | Un dict con inputs por componente |

### 3.3 APIs clave, una por una

#### `Document` (Haystack)

```python
from haystack import Document

doc = Document(
    content="POLÍTICA DE VACACIONES §3 — Acumulación y disfrute\n...",
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
pipeline.add_component("prompt_builder", PromptBuilder(template=mi_plantilla))
pipeline.add_component("llm", OpenAIGenerator(model="gpt-4o-mini"))

# Conexión explícita: salida del retriever → entrada del prompt builder
pipeline.connect("retriever.documents", "prompt_builder.documents")
pipeline.connect("prompt_builder", "llm")
```

- **`add_component(name, instance)`** — registra un nodo en el grafo.
- **`connect(sender, receiver)`** — cablea salida → entrada. El nombre `"retriever.documents"` especifica **qué output** del sender conectas.
- **`pipeline.run(data)`** — ejecuta el grafo. `data` es un dict con inputs por componente.

#### `PromptBuilder` — plantilla Jinja2

```python
from haystack.components.builders import PromptBuilder

plantilla = """
Eres el asistente de RRHH. Responde SOLO con los fragmentos dados.

Fragmentos relevantes:
{% for doc in documents %}
[{{ loop.index }}] {{ doc.content }}
{% endfor %}

Pregunta del empleado: {{ query }}

Responde en markdown con lenguaje claro y sencillo.
"""

prompt_builder = PromptBuilder(template=plantilla)
```

> **Haystack 2.x también ofrece `ChatPromptBuilder`** para modelos chat con mensajes system/user. Para este taller usamos `PromptBuilder` + `OpenAIGenerator` porque es el par más directo para mapear `construir_prompt()` del scratch. En producción con Claude/GPT-4o, muchos equipos migran a `ChatPromptBuilder` + `AnthropicChatGenerator`.

### 3.4 Mini-pipeline completo COMENTADO — caso RRHH

```python
# Requiere: pip install haystack-ai sentence-transformers
# Este archivo es ILUSTRATIVO — no se ejecuta en el entorno de desarrollo sin red.
#
# RAG con Haystack 2.x — mismo caso RRHH que solucion_scratch.py.
# Pipeline: indexación offline → Retriever + PromptBuilder + Generator.

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
# BLOQUE 1 — CARGAR Y TROCEAR (≈ cargar_chunks del scratch)
# ---------------------------------------------------------------------------
ruta = Path("datos/politicas_rrhh.txt")
contenido = ruta.read_text(encoding="utf-8")
fragmentos = [p.strip() for p in re.split(r"\n---\n", contenido) if p.strip()]

documentos = [
    Document(content=texto, meta={"source": str(ruta), "chunk_id": i})
    for i, texto in enumerate(fragmentos)
]
print(f"Total de documentos: {len(documentos)}")  # Esperado: 8

# ---------------------------------------------------------------------------
# BLOQUE 2 — DOCUMENT STORE + EMBEDDINGS (≈ embed + store del scratch)
# ---------------------------------------------------------------------------
document_store = InMemoryDocumentStore()

doc_embedder = SentenceTransformersDocumentEmbedder(
    model="BAAI/bge-base-en-v1.5",
)
doc_embedder.warm_up()

# Embedder calcula vectores y los adjunta a los Document
docs_con_embeddings = doc_embedder.run(documents=documentos)["documents"]
document_store.write_documents(docs_con_embeddings)

# ---------------------------------------------------------------------------
# BLOQUE 3 — COMPONENTES DEL PIPELINE RAG
# ---------------------------------------------------------------------------
text_embedder = SentenceTransformersTextEmbedder(
    model="BAAI/bge-base-en-v1.5",
)
text_embedder.warm_up()

retriever = InMemoryEmbeddingRetriever(document_store=document_store, top_k=3)

plantilla = """
Eres el asistente de RRHH de la empresa. Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados. Si la información no está en los fragmentos, dilo explícitamente.

Fragmentos relevantes:
{% for doc in documents %}
[{{ loop.index }}] {{ doc.content }}
{% endfor %}

Pregunta del empleado: {{ query }}

Responde en markdown con lenguaje claro y sencillo.
"""

prompt_builder = PromptBuilder(template=plantilla)
llm = OpenAIGenerator(
    api_key=Secret.from_env_var("OPENAI_API_KEY"),
    model="gpt-4o-mini",
    generation_kwargs={"temperature": 0.2},
)

# ---------------------------------------------------------------------------
# BLOQUE 4 — ENSAMBLAR PIPELINE (Retriever → PromptBuilder → Generator)
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
# BLOQUE 5 — EJECUTAR
# ---------------------------------------------------------------------------
QUERY = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

# Solo recuperación (inspección — ≈ recuperar del scratch):
embedding_result = text_embedder.run(text=QUERY)
docs_recuperados = retriever.run(
    query_embedding=embedding_result["embedding"],
)["documents"]

print("\nTOP-3 DOCUMENTOS RECUPERADOS:")
for i, doc in enumerate(docs_recuperados):
    print(f"  [{i+1}] {doc.content[:80].replace(chr(10), ' ')}...")

# Pipeline completo (descomentar con OPENAI_API_KEY):
# result = rag_pipeline.run({
#     "text_embedder": {"text": QUERY},
#     "prompt_builder": {"query": QUERY},
# })
# print("\nRespuesta del LLM:")
# print(result["llm"]["replies"][0])
print("\n(requiere OPENAI_API_KEY — descomenta las líneas anteriores)")
```

### 3.5 Recorrido bloque por bloque

```
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 1 — CARGAR Y TROCEAR                                    │
│  read_text → re.split → list[Document(content=..., meta=...)]  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 2 — INDEXACIÓN OFFLINE                                   │
│  SentenceTransformersDocumentEmbedder.run(documents)             │
│  document_store.write_documents(docs_con_embeddings)             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 3 — COMPONENTES                                          │
│  TextEmbedder (query) · Retriever (top_k=3)                      │
│  PromptBuilder (Jinja2) · OpenAIGenerator                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 4 — PIPELINE                                             │
│  text_embedder → retriever → prompt_builder → llm                │
│  connect() explícito entre salidas y entradas                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  BLOQUE 5 — EJECUTAR                                             │
│  pipeline.run({"text_embedder": {"text": query}, ...})           │
│  result["llm"]["replies"][0] → respuesta final                   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.6 Cuándo encaja Haystack

**Úsalo cuando:**

- Quieres pipelines **declarativos** serializables a YAML (versionado, CI/CD, despliegue).
- El equipo valora **componentes testables en aislamiento** (unit test del retriever sin LLM).
- Necesitas evaluación integrada y cultura de **producción** (deepset lleva años en NLP industrial).
- Construyes RAG **sin** el ecosistema LangChain — independencia similar al SDK nativo pero con estructura.

**Evítalo cuando:**

- Ya estás en **LangGraph** con agentes complejos — migrar el orquestador no aporta.
- Necesitas prototipar en 10 minutos — Haystack tiene más boilerplate que LlamaIndex `query_engine`.
- Tu organización estandarizó RAGorbit/LangChain — Haystack sería un segundo framework sin razón.

**Gotchas Haystack:**

| Gotcha | Qué pasa | Solución |
|--------|----------|----------|
| Código Haystack 1.x en internet | APIs incompatibles (`add_node` vs `add_component`) | Verifica que sea **Haystack 2.x** (`haystack-ai` en pip) |
| Olvidar `warm_up()` en embedders | Error en primera ejecución | Llama `.warm_up()` tras crear embedders |
| `connect` ambiguo | El pipeline no cablea documents al prompt | Conecta explícitamente `"retriever.documents"` → `"prompt_builder.documents"` |
| `PromptBuilder` vs `ChatPromptBuilder` | Formato incorrecto para modelos chat | Usa `ChatPromptBuilder` + `AnthropicChatGenerator` para Claude |
| Dos embedders (doc + text) | Confusión sobre cuál usar cuándo | Doc embedder = offline (indexar); Text embedder = online (query) |

---

## 4. Tabla comparativa final

### 4.1 LangChain vs LlamaIndex vs Haystack vs SDK nativo (para RAG)

| Criterio | LangChain | LlamaIndex | Haystack 2.x | SDK nativo + Chroma |
|----------|-----------|------------|--------------|---------------------|
| **Abstracción** | Media-alta (LCEL, Runnables) | Alta (índices, query engines) | Alta (Pipeline DAG tipado) | Mínima (funciones tuyas) |
| **Curva de aprendizaje** | Media — muchos subpaquetes | Media — concepto índice/query engine | Media-alta — componentes + connect | Baja — si ya hiciste scratch |
| **Control fino** | Medio — capas ocultas en Runnables | Medio — query engine integra pasos | Alto — cada componente es explícito | **Máximo** |
| **Líneas para RAG mínimo RRHH** | ~50 (ver `solucion_framework.py`) | ~45 con `query_engine` | ~70 (indexación + pipeline) | ~80 (pero sin framework) |
| **Mejor para** | Ecosistema RAGorbit, LangGraph, LCEL, multi-tool | Proyectos RAG puros, índices, query engines | Producción declarativa, YAML, eval integrada | Microservicios, control, mínimas deps |
| **Evitar si** | Solo necesitas un query_engine simple | Necesitas LangGraph o LCEL avanzado | Prototipo rápido o stack LangChain | Pipeline crece a híbrido + agente + HITL |
| **Swapping proveedor** | Una línea (`ChatOpenAI` → `ChatAnthropic`) | `Settings.llm = ...` | Cambiar componente Generator | Reescribir llamada HTTP |
| **Persistencia Chroma** | `Chroma.from_documents(persist_directory=...)` | `ChromaVectorStore` + `StorageContext` | `ChromaDocumentStore` (integración) | `chromadb.PersistentClient` directo |
| **Tracing / observabilidad** | LangSmith nativo | Callbacks / externos | Integración eval nativa | Tú implementas (logs, OTel) |
| **Dependencias** | Muchas (`langchain-*`) | Muchas (`llama-index-*`) | Moderadas (`haystack-ai`) | Pocas (chromadb, ST, SDK) |

### 4.2 Regla de decisión

```
¿Empiezas desde cero y el curso / RAGorbit ya usa LangChain?
  SÍ → LangChain (M1 §11) — coherencia con el codegen y M6+ LangGraph
  NO ↓

¿El proyecto es SOLO RAG sobre documentos, sin agentes complejos?
  SÍ → ¿Quieres mínimo código?
         SÍ → LlamaIndex (query_engine en pocas líneas)
         NO → ¿Quieres pipelines YAML y cultura de producción?
                SÍ → Haystack 2.x
                NO → SDK nativo + Chroma
  NO ↓

¿Necesitas agentes con estado, HITL, fan-out?
  SÍ → LangGraph (M6–M7) — ninguna alternativa de esta guía lo sustituye igual
  NO → Reevalúa con la fila anterior
```

**Regla de oro del curso:** domina **una** herramienta de orquestación en profundidad (LangChain en el syllabus) y conoce las demás para **elegir**, no para mezclarlas todas en un solo proyecto.

### 4.3 Mapa mental: los cuatro caminos al mismo destino

```
                    ┌─────────────────────────────────────┐
                    │  politicas_rrhh.txt (8 fragmentos)  │
                    └──────────────────┬──────────────────┘
                                       │
           ┌───────────┬───────────────┼───────────────┬───────────────┐
           ▼           ▼               ▼               ▼               │
      ┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐          │
      │LangChain│ │LlamaIdx │   │ Haystack│   │SDK nativo│          │
      │  LCEL   │ │query_eng│   │ Pipeline│   │ funciones│          │
      └────┬────┘ └────┬────┘   └────┬────┘   └────┬────┘          │
           │           │               │               │               │
           └───────────┴───────────────┴───────────────┘               │
                                       │                               │
                                       ▼                               │
                    ┌─────────────────────────────────────┐          │
                    │  top-3 chunks sobre "vacaciones 3     │          │
                    │  años" → prompt aumentado → LLM       │          │
                    └──────────────────┬──────────────────┘          │
                                       ▼                               │
                    "Tienes derecho a 18 días hábiles..."  ◀───────────┘
```

---

> **Cross-links**
>
> - LangChain desde cero (base del curso): [M1 §11 — La capa ③ explicada](../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero)
> - ChromaDB, FAISS y sentence-transformers: [M3 §15 — La capa ③ explicada](../03-embeddings-y-stores/guia.md#15-la-capa--explicada-del-dict-en-memoria-a-chromadb-faiss-y-sentence-transformers)
> - Retrievers híbridos, rerank y filtro duro: [M4 — Retrieval y query](../04-retrieval-y-query/guia.md)
> - Tablas de decisión (modelos, stores, frameworks): [`tecnologias-comparadas.md`](./tecnologias-comparadas.md) — especialmente §1–§3 (modelos/embeddings/stores) y §5 (ingesta)
> - Fichas de nodos RAGorbit: [`catalogo-nodos.md`](./catalogo-nodos.md)
> - Taller scratch (capa ②): [`01-fundamentos/lab/solucion_scratch.py`](../01-fundamentos/lab/solucion_scratch.py)
> - Taller LangChain (capa ③): [`01-fundamentos/lab/solucion_framework.py`](../01-fundamentos/lab/solucion_framework.py)
> - Template RRHH: [`examples/09-hr-policy-assistant/`](../../examples/09-hr-policy-assistant/)
> - Convención de capas y entorno: [`HANDOFF.md` §3 y §5](../HANDOFF.md)

---

*Documento de referencia del curso RAGorbit. Léelo después de M1 §11 y la capa ② del taller; úsalo cuando necesites construir el mismo RAG sin depender exclusivamente de LangChain.*

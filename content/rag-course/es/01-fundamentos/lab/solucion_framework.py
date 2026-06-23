# Requiere: pip install langchain langchain-community langchain-openai chromadb
# Este archivo es ILUSTRATIVO — no se ejecuta en el entorno de desarrollo sin red.
# Representa la capa ③ (framework real) del taller M1.
#
# ANTES de leer este archivo: escribe tu propia versión siguiendo lab/enunciado.md
# y la guía §11 (../guia.md#11-la-capa--explicada-langchain-desde-cero).
# Luego compara bloque por bloque con §11.12 de la guía.

"""
M1 · RAG mínimo — capa ③ (LangChain + Chroma)

Mismo pipeline que solucion_scratch.py, pero con:
  - TextLoader + CharacterTextSplitter para cargar y trocear documentos
  - OpenAIEmbeddings (o cualquier proveedor) para embeddings reales
  - Chroma como vector store en memoria
  - RetrievalQA o un chain manual para construir el prompt aumentado
"""

# ---------------------------------------------------------------------------
# IMPORTS
# ---------------------------------------------------------------------------
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings  # o: from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI         # o: from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# ---------------------------------------------------------------------------
# 1. CARGAR Y TROCEAR DOCUMENTOS
# Guía §11.4 (TextLoader) + §11.5 (CharacterTextSplitter)
# Scratch equivalente: cargar_chunks()
# ---------------------------------------------------------------------------
# TextLoader lee el archivo como un solo Document.
# CharacterTextSplitter lo divide por el separador '---'.
loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
documentos_raw = loader.load()

splitter = CharacterTextSplitter(
    separator="\n---\n",   # mismo separador que usamos en scratch
    chunk_size=1000,        # caracteres máx por chunk (aproximado)
    chunk_overlap=0,        # sin overlap para este dataset pequeño
    keep_separator=False,
)
chunks = splitter.split_documents(documentos_raw)
# chunks es una lista de Document(page_content=..., metadata={"source": "..."})

print(f"Total de chunks: {len(chunks)}")  # Esperado: 8

# ---------------------------------------------------------------------------
# 2. EMBEDDINGS + VECTOR STORE (Chroma en memoria)
# Guía §11.6 (Embeddings) + §11.7 (Chroma.from_documents)
# Scratch equivalente: embed() + lista en memoria
# ---------------------------------------------------------------------------
# OpenAIEmbeddings usa text-embedding-3-small por defecto.
# Para privacidad total: OllamaEmbeddings(model="nomic-embed-text")
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    # openai_api_key se lee de OPENAI_API_KEY env var
)

# Chroma en memoria — para persistencia: persist_directory="./chroma_db"
# Equivale al nodo store.chroma del template 09 con collection="hr_policies"
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="hr_policies",
)

# ---------------------------------------------------------------------------
# 3. RETRIEVER (top-k = 3)
# Guía §11.8 — retriever.invoke(query) devuelve list[Document]
# Scratch equivalente: recuperar()
# ---------------------------------------------------------------------------
# Equivale al nodo retrieval.vector con topK=3
retriever = vectorstore.as_retriever(
    search_type="similarity",   # similitud coseno
    search_kwargs={"k": 3},
)

# ---------------------------------------------------------------------------
# 4. PROMPT TEMPLATE + LLM
# Guía §11.9 (ChatPromptTemplate) + §11.9 (ChatOpenAI)
# Scratch equivalente: construir_prompt() + (LLM stub)
# ---------------------------------------------------------------------------
# Equivale al nodo model.llm + logic.prompt del template 09
# Cambiar a ChatAnthropic para usar Claude:
#   from langchain_anthropic import ChatAnthropic
#   llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.2)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

SYSTEM_PROMPT = (
    "Eres el asistente de RRHH de la empresa. "
    "Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados. "
    "Si la información no está en los fragmentos, dilo explícitamente."
)

HUMAN_TEMPLATE = """Fragmentos relevantes:
{contexto}

Pregunta del empleado: {pregunta}

Responde en markdown con lenguaje claro y sencillo."""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])

# ---------------------------------------------------------------------------
# 5. CHAIN LCEL (LangChain Expression Language)
# Guía §11.11 — dict con dos ramas + operador |
# Scratch equivalente: main() orquestando recuperar → prompt → LLM
# ---------------------------------------------------------------------------
# Equivale a la secuencia: retrieval.vector → logic.prompt → model.llm
def formatear_chunks(docs) -> str:
    """Formatea los Document recuperados en un string numerado."""
    return "\n\n".join(f"[{i+1}] {doc.page_content}" for i, doc in enumerate(docs))

chain = (
    {
        "contexto": retriever | formatear_chunks,  # recuperar y formatear
        "pregunta": RunnablePassthrough(),          # pasar la pregunta tal cual
    }
    | prompt          # construir el ChatPromptValue
    | llm             # llamar al LLM → AIMessage
    | StrOutputParser() # extraer el string de la respuesta
)

# ---------------------------------------------------------------------------
# 6. EJECUTAR
# ---------------------------------------------------------------------------
query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

# Opción A: respuesta directa
# respuesta = chain.invoke(query)
# print(respuesta)

# Opción B: mostrar también qué chunks se recuperaron (más didáctico)
chunks_recuperados = retriever.invoke(query)
print("\nChunks recuperados:")
for i, doc in enumerate(chunks_recuperados):
    print(f"  [{i+1}] {doc.page_content[:80]}...")

print("\nRespuesta del LLM:")
# respuesta = chain.invoke(query)  # descomentar cuando tengas API key
# print(respuesta)
print("(requiere API key — descomenta la línea anterior)")

# ---------------------------------------------------------------------------
# NOTAS COMPARATIVAS vs SCRATCH
# ---------------------------------------------------------------------------
# | Aspecto               | Scratch (capa ②)           | Framework (capa ③)          |
# |-----------------------|---------------------------|----------------------------|
# | Embeddings            | Bag-of-words (juguete)    | text-embedding-3-small      |
# | Vector store          | Lista en memoria          | Chroma (con índice HNSW)    |
# | Similitud             | Coseno manual sobre dict  | Coseno optimizado           |
# | Chunking              | Separador manual          | CharacterTextSplitter       |
# | Prompt                | f-string                  | ChatPromptTemplate          |
# | LLM                   | Función fake/stub         | ChatOpenAI / ChatAnthropic  |
# | Líneas de código      | ~80                       | ~50 (más declarativo)       |
# | Resultado semántico   | Limitado (lexical only)   | Alto (embeddings reales)    |
#
# En producción, la arquitectura del framework es equivalente al nodo graph del
# template 09-hr-policy-assistant — salvo que ahí está orquestado por LangGraph.

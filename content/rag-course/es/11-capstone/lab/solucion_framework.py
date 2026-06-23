# Requiere: pip install langchain langchain-community langchain-openai chromadb
# Este archivo es ILUSTRATIVO — no se ejecuta en el entorno sin red/pip.
# Capa ③ del capstone M11: reconstrucción del template 09-hr-policy-assistant.
#
# ANTES de leer: escribe tu versión siguiendo guia.md §12 y las capas ③ de M1–M6.
# Recorrido bloque por bloque explicado en guia.md §12 y lab/solucion.md.

"""
M11 · Capstone — capa ③ (LangChain + Chroma)
Reconstrucción del template 09: loader → splitter → embeddings → store →
retriever → prompt → llm → citations
"""

# ---------------------------------------------------------------------------
# IMPORTS
# ---------------------------------------------------------------------------
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# ---------------------------------------------------------------------------
# 1. LOADER + CHUNKER
# Guía M11 §12.2 | M2 §10 (CharacterTextSplitter) | M1 §11.4–11.5
# Scratch: cargar_chunks() con separador '---'
# Nodos: loader.pdf → ingest.chunker (by-section)
# ---------------------------------------------------------------------------
loader = TextLoader("datos/politicas_rrhh.txt", encoding="utf-8")
documentos_raw = loader.load()

splitter = CharacterTextSplitter(
    separator="\n---\n",
    chunk_size=1000,
    chunk_overlap=0,
    keep_separator=False,
)
chunks = splitter.split_documents(documentos_raw)
print(f"[ingest] Total chunks: {len(chunks)}")  # Esperado: 8

# ---------------------------------------------------------------------------
# 2. EMBEDDINGS + VECTOR STORE
# Guía M11 §12.3 | M3 §15 (Chroma.from_documents)
# Scratch: embed() + VectorStore en memoria
# Nodos: model.embedding → store.chroma (collection: hr_policies)
# ---------------------------------------------------------------------------
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
# Alternativa local (PHI): OllamaEmbeddings(model="nomic-embed-text")

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="hr_policies",
)

# ---------------------------------------------------------------------------
# 3. RETRIEVER
# Guía M11 §12.4 | M4 §13 (as_retriever)
# Scratch: VectorStore.retrieve()
# Nodo: retrieval.vector (topK=4 en template 09)
# ---------------------------------------------------------------------------
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4},
)

# ---------------------------------------------------------------------------
# 4. PROMPT + LLM
# Guía M11 §12.5 | M1 §11.9 | M5 §10 (citas en prompt)
# Scratch: construir_prompt() + fake_llm()
# Nodos: model.llm + logic.prompt
# ---------------------------------------------------------------------------
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
# En producción template 09: ChatAnthropic(model="claude-opus-4-8", temperature=0.2)

SYSTEM_PROMPT = (
    "Eres el asistente oficial de RRHH de la empresa. "
    "Responde de forma clara y empática. Basa TODA respuesta en los fragmentos "
    "de política recuperados. Si la información no está en los documentos, "
    "dilo explícitamente. Responde en markdown con lenguaje sencillo."
)

HUMAN_TEMPLATE = """Pregunta del empleado: {pregunta}

Fragmentos de política relevantes:
{contexto}

Responde citando la sección exacta cuando sea posible."""

prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])


def formatear_chunks(docs) -> str:
    return "\n\n".join(f"[{i+1}] {doc.page_content}" for i, doc in enumerate(docs))


# ---------------------------------------------------------------------------
# 5. CHAIN LCEL
# Guía M11 §12.6 | M1 §11.11
# Equivale a: retrieval.vector → logic.prompt → model.llm
# ---------------------------------------------------------------------------
rag_chain = (
    {
        "contexto": retriever | formatear_chunks,
        "pregunta": RunnablePassthrough(),
    }
    | prompt
    | llm
    | StrOutputParser()
)

# ---------------------------------------------------------------------------
# 6. CITAS OBLIGATORIAS (post-procesador)
# Guía M5 §4 | M11 §3
# Scratch: aplicar_citas()
# Nodo: logic.citations (mode: enforce)
# ---------------------------------------------------------------------------
def enforce_citations(respuesta: str, docs_recuperados) -> str:
    """
    Post-procesador equivalente a logic.citations enforce.
    En RAGorbit esto es un nodo separado; aquí lo aplicamos como función.
    """
    if not docs_recuperados:
        return (
            "No encontré fragmentos relevantes en las políticas de RRHH. "
            "No puedo responder sin evidencia documental."
        )
    if "fuente:" in respuesta.lower() or "§" in respuesta:
        return respuesta
    primera_linea = docs_recuperados[0].page_content.split("\n")[0]
    return respuesta + f"\n\n> **Fuente:** {primera_linea}"


# ---------------------------------------------------------------------------
# 7. EJECUTAR
# ---------------------------------------------------------------------------
QUERY = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

chunks_recuperados = retriever.invoke(QUERY)
print("\n[retrieval] Chunks recuperados:")
for i, doc in enumerate(chunks_recuperados):
    preview = doc.page_content[:80].replace("\n", " ")
    print(f"  [{i+1}] {preview}...")

# respuesta_cruda = rag_chain.invoke(QUERY)
# respuesta_final = enforce_citations(respuesta_cruda, chunks_recuperados)
# print("\n[output]", respuesta_final)
print("\n[output] (requiere API key — descomenta las líneas anteriores)")

# ---------------------------------------------------------------------------
# NOTAS: cómo este archivo se combina con M2–M6
# ---------------------------------------------------------------------------
# | Pieza            | Módulo donde aprendiste la capa ③        |
# |------------------|------------------------------------------|
# | TextLoader       | M1 §11.4, M2 §10                         |
# | CharacterSplitter| M2 §10                                   |
# | OpenAIEmbeddings | M1 §11.6, M3 §15                         |
# | Chroma           | M1 §11.7, M3 §15                         |
# | as_retriever     | M1 §11.8, M4 §13                         |
# | ChatPromptTemplate| M1 §11.9                                |
# | LCEL chain       | M1 §11.11                                |
# | enforce_citations| M5 §4, M5 §10                            |
#
# Para reconstruir 02-banking: añade metadata filters (M4), structured output (M5).
# Para reconstruir 01-airline: envuelve retriever como tool (M6), añade LangGraph (M6 §8).

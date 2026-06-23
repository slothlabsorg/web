# Requiere: pip install langchain langchain-community rank-bm25 sentence-transformers chromadb
# (ilustrativo — no se ejecuta en el entorno sin pip)
#
# ANTES DE LEER ESTE ARCHIVO: intenta escribirlo tú mismo siguiendo
#   guia.md §13  →  lab/enunciado.md (sección "Capa ③")
#
# Equivalente al lab usando LangChain EnsembleRetriever (BM25 + vector)
# + reranker BGE + filtro duro por fare_class

"""
Lab M4 — Versión framework (LangChain)
=======================================
Mapeo bloque a bloque → guia.md §13.10

Pipeline:
  1. JSON → list[Document]           (§13.4)
  2. BM25Retriever                   (§13.5 — equivale a bm25_score() scratch)
  3. Chroma + HuggingFaceEmbeddings  (§13.6 — equivale a BoW+coseno scratch)
  4. EnsembleRetriever               (§13.7 — equivale a rrf_fusion() scratch)
  5. CrossEncoderReranker            (§13.8 — equivale a rerank intersección scratch)
  6. crear_retriever_filtrado()      (§13.9 — equivale a filtrar CORPUS al inicio)
  7. invoke sin/con filtro           (§13.10 — mismo patrón que expected.md)
"""

import json
from pathlib import Path

# ─────────────────────────────────────────────────────────
# 1. Cargar corpus → Documents (guia §13.4)
# ─────────────────────────────────────────────────────────

DATOS_PATH = Path(__file__).parent / "datos" / "politicas.json"

with open(DATOS_PATH) as f:
    raw = json.load(f)

# Convertir a LangChain Documents
from langchain.schema import Document

documentos = [
    Document(
        page_content=item["texto"],
        metadata={
            "id": item["id"],
            "fare_class": item["metadata"]["fare_class"],
            "route_type": item["metadata"]["route_type"],
            "categoria": item["metadata"]["categoria"],
        },
    )
    for item in raw
]

# ─────────────────────────────────────────────────────────
# 2. BM25Retriever — tu bm25_score() manual (guia §13.5)
# ─────────────────────────────────────────────────────────

from langchain_community.retrievers import BM25Retriever

bm25_retriever = BM25Retriever.from_documents(documentos)
bm25_retriever.k = 9  # devolver todos para la fusión

# ─────────────────────────────────────────────────────────
# 3. Vector store + retriever (guia §13.6; Chroma recordado en M1 §11)
# ─────────────────────────────────────────────────────────

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Modelo ligero local: all-MiniLM-L6-v2 (~80MB)
# En producción usa text-embedding-3-large de OpenAI o E5 de HuggingFace
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vector_store = Chroma.from_documents(documentos, embeddings)
vector_retriever = vector_store.as_retriever(search_kwargs={"k": 9})

# ─────────────────────────────────────────────────────────
# 4. EnsembleRetriever — tu rrf_fusion(k=60) manual (guia §13.7)
#    RRF interno con c=60. weights desempatan docs de una sola lista.
# ─────────────────────────────────────────────────────────

from langchain.retrievers import EnsembleRetriever

# weights=[0.4, 0.6]: 40% BM25, 60% vectorial
# Ajustar según el dominio (más peso a BM25 para terminología exacta)
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],
)

# ─────────────────────────────────────────────────────────
# 5. Reranker — patrón compression sobre retriever base (guia §13.8)
#    base_retriever devuelve candidatos; base_compressor reordena y recorta.
# ─────────────────────────────────────────────────────────

# Opción A: Cohere Rerank (requiere COHERE_API_KEY)
# from langchain_cohere import CohereRerank
# from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
# reranker = CohereRerank(model="rerank-multilingual-v3.0", top_n=3)
# compression_retriever = ContextualCompressionRetriever(
#     base_compressor=reranker,
#     base_retriever=ensemble_retriever,
# )

# Opción B: BGE Reranker (local, sin API key)
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever

cross_encoder = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
reranker = CrossEncoderReranker(model=cross_encoder, top_n=3)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=ensemble_retriever,
)

# ─────────────────────────────────────────────────────────
# 6. Filtro duro — filtrar corpus ANTES de retrievers (guia §13.9)
#    EnsembleRetriever no tiene hardFilter; filter en Chroma no afecta BM25.
# ─────────────────────────────────────────────────────────

def crear_retriever_filtrado(fare_class: str):
    """Crea un pipeline completo filtrado por fare_class desde el inicio."""
    # Filtrar documentos
    docs_filtrados = [d for d in documentos if d.metadata["fare_class"] == fare_class]

    # BM25 solo sobre docs filtrados
    bm25_filtrado = BM25Retriever.from_documents(docs_filtrados)
    bm25_filtrado.k = len(docs_filtrados)

    # Vector store solo sobre docs filtrados
    # Alternativamente, usar metadata_filter en Chroma:
    # vector_filtrado = vector_store.as_retriever(
    #     search_kwargs={"k": len(docs_filtrados), "filter": {"fare_class": fare_class}}
    # )
    vector_filtrado_store = Chroma.from_documents(docs_filtrados, embeddings)
    vector_filtrado = vector_filtrado_store.as_retriever(
        search_kwargs={"k": len(docs_filtrados)}
    )

    ensemble_filtrado = EnsembleRetriever(
        retrievers=[bm25_filtrado, vector_filtrado],
        weights=[0.4, 0.6],
    )

    cross_encoder_local = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
    reranker_local = CrossEncoderReranker(model=cross_encoder_local, top_n=3)

    return ContextualCompressionRetriever(
        base_compressor=reranker_local,
        base_retriever=ensemble_filtrado,
    )


# ─────────────────────────────────────────────────────────
# 7. Ejecución sin/con filtro (guia §13.10 — mismo patrón que expected.md)
# ─────────────────────────────────────────────────────────

QUERY = "¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"
FARE_CLASS_OBJETIVO = "Basic"


def main():
    print(f"\nQuery: \"{QUERY}\"")
    print(f"Fare class objetivo: {FARE_CLASS_OBJETIVO}\n")

    # Sin filtro
    print("=" * 70)
    print("  SIN FILTRO (EnsembleRetriever + BGE Reranker, corpus completo)")
    print("=" * 70)
    docs_sin_filtro = compression_retriever.get_relevant_documents(QUERY)
    for i, doc in enumerate(docs_sin_filtro[:3], 1):
        print(f"\nRank {i}:")
        print(f"  id         : {doc.metadata.get('id')}")
        print(f"  fare_class : {doc.metadata.get('fare_class')}")
        print(f"  categoria  : {doc.metadata.get('categoria')}")
        print(f"  texto      : {doc.page_content[:80]}...")

    clases = [d.metadata.get("fare_class") for d in docs_sin_filtro[:3]]
    print(f"\n[CHECK] fare_classes en top-3: {clases}")
    print(f"[CHECK] Hay ruido: {any(c != FARE_CLASS_OBJETIVO for c in clases)}")

    # Con filtro
    print("\n" + "=" * 70)
    print(f"  CON FILTRO fare_class='{FARE_CLASS_OBJETIVO}' (corpus filtrado)")
    print("=" * 70)
    retriever_filtrado = crear_retriever_filtrado(FARE_CLASS_OBJETIVO)
    docs_con_filtro = retriever_filtrado.get_relevant_documents(QUERY)
    for i, doc in enumerate(docs_con_filtro[:3], 1):
        print(f"\nRank {i}:")
        print(f"  id         : {doc.metadata.get('id')}")
        print(f"  fare_class : {doc.metadata.get('fare_class')}")
        print(f"  categoria  : {doc.metadata.get('categoria')}")
        print(f"  texto      : {doc.page_content[:80]}...")

    clases_f = [d.metadata.get("fare_class") for d in docs_con_filtro[:3]]
    print(f"\n[CHECK] fare_classes en top-3: {clases_f}")
    print(f"[CHECK] Solo Basic: {all(c == FARE_CLASS_OBJETIVO for c in clases_f)}")
    ids_citables = [d.metadata.get("id") for d in docs_con_filtro[:3]]
    print(f"[CHECK] IDs citables: {ids_citables}")


if __name__ == "__main__":
    main()

"""
Lab M4 — Retrieval híbrido con filtro duro (solo stdlib)
=========================================================
Implementa:
  1. BM25 desde cero (k1=1.5, b=0.75)
  2. Embeddings bag-of-words + similitud coseno
  3. Fusión RRF (k=60)
  4. Rerank simple (intersección de tokens)
  5. Comparación sin filtro vs con filtro duro por fare_class

Corre con: python3 solucion_scratch.py
"""

import json
import math
import os

# ---------------------------------------------------------------------------
# 0. Cargar corpus
# ---------------------------------------------------------------------------

DATOS_PATH = os.path.join(os.path.dirname(__file__), "datos", "politicas.json")

with open(DATOS_PATH, encoding="utf-8") as f:
    CORPUS = json.load(f)

# ---------------------------------------------------------------------------
# 1. Utilidades de tokenización
# ---------------------------------------------------------------------------

STOPWORDS = {
    "de", "en", "la", "el", "los", "las", "y", "a", "o", "que", "es",
    "se", "por", "un", "una", "con", "sin", "para", "del", "al", "lo",
    "le", "su", "sus", "hay", "no", "si", "pero", "más", "hasta", "una",
    "este", "esta", "son", "han", "ha", "muy", "cada", "cualquier",
    "como", "también", "solo", "vez", "vez", "cuál", "puede", "puedo",
}


def tokenizar(texto: str) -> list[str]:
    """Convierte texto a lista de tokens en minúsculas, sin stopwords ni puntuación."""
    tokens = []
    for palabra in texto.lower().split():
        # Quitar puntuación al inicio y final de cada token
        limpia = ""
        for c in palabra:
            if c.isalnum() or c in ("á", "é", "í", "ó", "ú", "ñ", "ü"):
                limpia += c
        if limpia and limpia not in STOPWORDS:
            tokens.append(limpia)
    return tokens


# ---------------------------------------------------------------------------
# 2. BM25
# ---------------------------------------------------------------------------

class BM25:
    """BM25 desde cero. Parámetros estándar: k1=1.5, b=0.75."""

    def __init__(self, documentos: list[dict], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.docs = documentos
        self.N = len(documentos)

        # Tokenizar todos los documentos
        self.corpus_tokens = [tokenizar(d["texto"]) for d in documentos]

        # Longitud de cada documento y longitud media
        self.longitudes = [len(t) for t in self.corpus_tokens]
        self.avgdl = sum(self.longitudes) / self.N if self.N > 0 else 1.0

        # Índice invertido: término -> set de índices de documento que lo contienen
        self.df: dict[str, int] = {}
        for tokens in self.corpus_tokens:
            for termino in set(tokens):
                self.df[termino] = self.df.get(termino, 0) + 1

    def idf(self, termino: str) -> float:
        n_t = self.df.get(termino, 0)
        return math.log((self.N - n_t + 0.5) / (n_t + 0.5) + 1)

    def score(self, query_tokens: list[str], doc_idx: int) -> float:
        doc_tokens = self.corpus_tokens[doc_idx]
        dl = self.longitudes[doc_idx]
        # Frecuencia de cada término en el documento
        tf_map: dict[str, int] = {}
        for t in doc_tokens:
            tf_map[t] = tf_map.get(t, 0) + 1

        total = 0.0
        for term in query_tokens:
            f = tf_map.get(term, 0)
            if f == 0:
                continue
            idf_val = self.idf(term)
            # Numerador TF saturado
            num = f * (self.k1 + 1)
            # Denominador con normalización de longitud
            den = f + self.k1 * (1 - self.b + self.b * dl / self.avgdl)
            total += idf_val * (num / den)
        return total

    def buscar(self, query: str) -> list[tuple[int, float]]:
        """Devuelve lista de (doc_idx, score) ordenada por score descendente."""
        tokens_q = tokenizar(query)
        resultados = [(i, self.score(tokens_q, i)) for i in range(self.N)]
        resultados.sort(key=lambda x: x[1], reverse=True)
        return resultados


# ---------------------------------------------------------------------------
# 3. Embeddings bag-of-words + similitud coseno
# ---------------------------------------------------------------------------

def embedding_bow(tokens: list[str]) -> dict[str, float]:
    """Bag-of-words normalizado (TF simple / total de tokens)."""
    if not tokens:
        return {}
    tf: dict[str, int] = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    total = len(tokens)
    return {t: c / total for t, c in tf.items()}


def similitud_coseno(vec_a: dict[str, float], vec_b: dict[str, float]) -> float:
    """Similitud coseno entre dos vectores dispersos representados como dicts."""
    # Producto punto
    comunes = set(vec_a.keys()) & set(vec_b.keys())
    dot = sum(vec_a[t] * vec_b[t] for t in comunes)
    # Normas
    norma_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norma_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norma_a == 0 or norma_b == 0:
        return 0.0
    return dot / (norma_a * norma_b)


class RetrieverCoseno:
    """Retriever por similitud coseno sobre embeddings bag-of-words."""

    def __init__(self, documentos: list[dict]):
        self.docs = documentos
        self.embeddings = [
            embedding_bow(tokenizar(d["texto"])) for d in documentos
        ]

    def buscar(self, query: str) -> list[tuple[int, float]]:
        tokens_q = tokenizar(query)
        vec_q = embedding_bow(tokens_q)
        resultados = [
            (i, similitud_coseno(vec_q, self.embeddings[i]))
            for i in range(len(self.docs))
        ]
        resultados.sort(key=lambda x: x[1], reverse=True)
        return resultados


# ---------------------------------------------------------------------------
# 4. Fusión RRF
# ---------------------------------------------------------------------------

def rrf_fusion(rankings: list[list[tuple[int, float]]], k: int = 60) -> list[tuple[int, float]]:
    """
    Reciprocal Rank Fusion sobre múltiples rankings.
    Cada ranking es una lista [(doc_idx, score), ...] ordenada por relevancia.
    Devuelve lista [(doc_idx, rrf_score), ...] ordenada descendente.
    """
    scores_rrf: dict[int, float] = {}
    for ranking in rankings:
        for rank, (doc_idx, _score) in enumerate(ranking, start=1):  # rank empieza en 1
            scores_rrf[doc_idx] = scores_rrf.get(doc_idx, 0.0) + 1.0 / (k + rank)
    resultado = sorted(scores_rrf.items(), key=lambda x: x[1], reverse=True)
    return resultado


# ---------------------------------------------------------------------------
# 5. Rerank simple (intersección de tokens query ↔ documento)
# ---------------------------------------------------------------------------

def rerank(
    query: str,
    ranking: list[tuple[int, float]],
    documentos: list[dict],
) -> list[tuple[int, float, int]]:
    """
    Rerank por intersección de tokens query ∩ doc.
    Devuelve [(doc_idx, rrf_score, tokens_compartidos), ...] ordenado por
    tokens_compartidos desc, luego rrf_score desc.
    """
    tokens_q = set(tokenizar(query))
    resultado = []
    for doc_idx, rrf_score in ranking:
        tokens_d = set(tokenizar(documentos[doc_idx]["texto"]))
        comunes = len(tokens_q & tokens_d)
        resultado.append((doc_idx, rrf_score, comunes))
    # Ordenar: primero por tokens comunes (desc), luego por rrf_score (desc)
    resultado.sort(key=lambda x: (x[2], x[1]), reverse=True)
    return resultado


# ---------------------------------------------------------------------------
# 6. Pipeline completo
# ---------------------------------------------------------------------------

def pipeline(
    query: str,
    documentos: list[dict],
    fare_class_filtro: str | None = None,
    top_k: int = 3,
) -> list[dict]:
    """
    Pipeline completo:
      1. Aplicar filtro duro (opcional)
      2. BM25
      3. Coseno bag-of-words
      4. RRF
      5. Rerank simple
      6. Devolver top_k con metadata
    """
    # Paso 1: filtro duro
    if fare_class_filtro:
        corpus_activo = [d for d in documentos if d["metadata"]["fare_class"] == fare_class_filtro]
    else:
        corpus_activo = documentos

    if not corpus_activo:
        return []

    # Paso 2: BM25
    bm25 = BM25(corpus_activo)
    ranking_bm25 = bm25.buscar(query)

    # Paso 3: coseno BoW
    ret_cos = RetrieverCoseno(corpus_activo)
    ranking_cos = ret_cos.buscar(query)

    # Paso 4: RRF
    fusionado = rrf_fusion([ranking_bm25, ranking_cos])

    # Paso 5: rerank
    rerankeado = rerank(query, fusionado, corpus_activo)

    # Paso 6: devolver top_k con metadata del corpus activo
    top = rerankeado[:top_k]
    return [
        {
            "id": corpus_activo[doc_idx]["id"],
            "fare_class": corpus_activo[doc_idx]["metadata"]["fare_class"],
            "categoria": corpus_activo[doc_idx]["metadata"]["categoria"],
            "rrf_score": round(rrf_score, 6),
            "tokens_comunes": tokens_comunes,
            "texto": corpus_activo[doc_idx]["texto"],
        }
        for doc_idx, rrf_score, tokens_comunes in top
    ]


# ---------------------------------------------------------------------------
# 7. Demo y comparación con / sin filtro
# ---------------------------------------------------------------------------

QUERY = "¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"
FARE_CLASS_OBJETIVO = "Basic"


def mostrar_resultado(titulo: str, resultados: list[dict]) -> None:
    ancho = 70
    print("=" * ancho)
    print(f"  {titulo}")
    print("=" * ancho)
    for i, r in enumerate(resultados, 1):
        print(f"\nRank {i}:")
        print(f"  id          : {r['id']}")
        print(f"  fare_class  : {r['fare_class']}")
        print(f"  categoria   : {r['categoria']}")
        print(f"  rrf_score   : {r['rrf_score']}")
        print(f"  tokens_comun: {r['tokens_comunes']}")
        print(f"  texto       : {r['texto'][:80]}...")
    print()


def main():
    print(f"\nQuery: \"{QUERY}\"")
    print(f"Fare class objetivo: {FARE_CLASS_OBJETIVO}\n")

    # Sin filtro
    sin_filtro = pipeline(QUERY, CORPUS, fare_class_filtro=None, top_k=3)
    mostrar_resultado("SIN FILTRO (top-3 del corpus completo)", sin_filtro)

    # Verificar que hay ruido
    clases_sin_filtro = [r["fare_class"] for r in sin_filtro]
    hay_ruido = any(fc != FARE_CLASS_OBJETIVO for fc in clases_sin_filtro)
    print(f"  [CHECK] Hay documentos de otras fare_class en top-3: {hay_ruido}")
    print(f"  [CHECK] fare_classes en top-3: {clases_sin_filtro}")
    print()

    # Con filtro
    con_filtro = pipeline(QUERY, CORPUS, fare_class_filtro=FARE_CLASS_OBJETIVO, top_k=3)
    mostrar_resultado(f"CON FILTRO fare_class='{FARE_CLASS_OBJETIVO}' (top-3)", con_filtro)

    # Verificar que solo hay Basic
    clases_con_filtro = [r["fare_class"] for r in con_filtro]
    solo_basic = all(fc == FARE_CLASS_OBJETIVO for fc in clases_con_filtro)
    print(f"  [CHECK] Todos los resultados son fare_class='{FARE_CLASS_OBJETIVO}': {solo_basic}")
    print(f"  [CHECK] IDs citables: {[r['id'] for r in con_filtro]}")
    print()

    # Mostrar el top-1 con filtro como resultado citable
    if con_filtro:
        mejor = con_filtro[0]
        print("  [RESULTADO CITABLE]")
        print(f"  Fuente: {mejor['id']} | fare_class: {mejor['fare_class']} | categoria: {mejor['categoria']}")
        print(f"  Texto: {mejor['texto']}")
    print()


if __name__ == "__main__":
    main()

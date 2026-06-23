"""
M1 · RAG mínimo — capa ② (scratch)
Solo stdlib de Python. Sin pip, sin red. Determinista.

Implementa:
  1. Carga y parseo de fragmentos de política RRHH
  2. Embeddings bag-of-words normalizados (función embed)
  3. Similitud coseno sobre diccionarios dispersos
  4. Recuperación top-k por similitud
  5. Construcción del prompt aumentado
"""

import math
import re
import os


# ---------------------------------------------------------------------------
# 1. CARGA Y PARSEO DE FRAGMENTOS
# ---------------------------------------------------------------------------

def cargar_chunks(ruta: str) -> list[str]:
    """
    Lee el archivo de políticas y devuelve una lista de fragmentos.
    Los fragmentos están separados por líneas que contienen solo '---'.
    """
    with open(ruta, encoding="utf-8") as f:
        contenido = f.read()
    # Dividir por separador '---' (puede tener espacios alrededor)
    partes = re.split(r"\n---\n", contenido)
    # Limpiar espacios en blanco al inicio y al final de cada parte
    chunks = [p.strip() for p in partes if p.strip()]
    return chunks


# ---------------------------------------------------------------------------
# 2. EMBEDDINGS BAG-OF-WORDS NORMALIZADOS
# ---------------------------------------------------------------------------

def tokenizar(texto: str) -> list[str]:
    """
    Convierte texto a minúsculas y extrae palabras alfanuméricas.
    Filtra tokens de un solo carácter para reducir ruido.
    """
    texto = texto.lower()
    tokens = re.findall(r"[a-záéíóúüñ0-9]+", texto)
    return [t for t in tokens if len(t) > 1]


def embed(texto: str) -> dict[str, float]:
    """
    Embedding bag-of-words normalizado.
    Devuelve {palabra: frecuencia_relativa}.
    La normalización es: conteo(palabra) / total_palabras.
    """
    tokens = tokenizar(texto)
    if not tokens:
        return {}
    conteos: dict[str, int] = {}
    for token in tokens:
        conteos[token] = conteos.get(token, 0) + 1
    total = len(tokens)
    return {palabra: conteo / total for palabra, conteo in conteos.items()}


# ---------------------------------------------------------------------------
# 3. SIMILITUD COSENO SOBRE DICCIONARIOS DISPERSOS
# ---------------------------------------------------------------------------

def similitud_coseno(a: dict[str, float], b: dict[str, float]) -> float:
    """
    Similitud coseno entre dos vectores dispersos representados como diccionarios.
    Rango: 0.0 (sin palabras en común) a 1.0 (idénticos).
    """
    if not a or not b:
        return 0.0

    # Dot product: solo sobre palabras presentes en ambos vectores
    claves_comunes = set(a.keys()) & set(b.keys())
    dot = sum(a[k] * b[k] for k in claves_comunes)

    # Normas euclideas
    norma_a = math.sqrt(sum(v * v for v in a.values()))
    norma_b = math.sqrt(sum(v * v for v in b.values()))

    if norma_a == 0.0 or norma_b == 0.0:
        return 0.0

    return dot / (norma_a * norma_b)


# ---------------------------------------------------------------------------
# 4. RECUPERACIÓN TOP-K
# ---------------------------------------------------------------------------

def recuperar(query: str, chunks: list[str], k: int = 3) -> list[tuple[int, float, str]]:
    """
    Recupera los k fragmentos más similares a la query.
    Devuelve lista de (índice_0based, similitud, texto), ordenada de mayor a menor similitud.
    """
    vec_query = embed(query)
    scores = []
    for i, chunk in enumerate(chunks):
        vec_chunk = embed(chunk)
        sim = similitud_coseno(vec_query, vec_chunk)
        scores.append((i, sim, chunk))
    # Ordenar por similitud descendente, desempate por índice ascendente
    scores.sort(key=lambda x: (-x[1], x[0]))
    return scores[:k]


# ---------------------------------------------------------------------------
# 5. CONSTRUIR PROMPT AUMENTADO
# ---------------------------------------------------------------------------

def construir_prompt(query: str, resultados: list[tuple[int, float, str]]) -> str:
    """
    Construye el prompt aumentado con el contexto recuperado.
    Formato compatible con el template 09-hr-policy-assistant.
    """
    lineas_chunks = []
    for pos, (idx, sim, texto) in enumerate(resultados, start=1):
        lineas_chunks.append(f"[{pos}] {texto}")
    contexto = "\n\n".join(lineas_chunks)

    prompt = (
        "Eres el asistente de RRHH de la empresa. "
        "Responde ÚNICAMENTE basándote en los fragmentos de política proporcionados.\n\n"
        "Fragmentos relevantes:\n"
        f"{contexto}\n\n"
        f"Pregunta del empleado: {query}\n\n"
        "Respuesta:"
    )
    return prompt


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    # Ruta relativa al archivo de datos (el script corre desde su propio directorio
    # o desde cualquier directorio — usamos la ruta absoluta relativa al script)
    directorio_script = os.path.dirname(os.path.abspath(__file__))
    ruta_datos = os.path.join(directorio_script, "datos", "politicas_rrhh.txt")

    # Cargar fragmentos
    chunks = cargar_chunks(ruta_datos)

    # Query de prueba
    query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

    # Recuperar top-3
    k = 3
    resultados = recuperar(query, chunks, k=k)

    # Imprimir resultados
    print("=" * 60)
    print("QUERY:", query)
    print("=" * 60)
    print(f"\nTOP-{k} CHUNKS RECUPERADOS:")
    indices = []
    for pos, (idx, sim, texto) in enumerate(resultados, start=1):
        print(f"\n  [{pos}] Índice {idx} | Similitud: {sim:.4f}")
        # Mostrar solo las primeras 80 caracteres del chunk para legibilidad
        preview = texto[:80].replace("\n", " ")
        print(f"       Preview: {preview}...")
        indices.append(idx)

    print(f"\nÍndices recuperados (0-based): {', '.join(str(i) for i in indices)}")
    print(f"Similitudes:                   {', '.join(f'{r[1]:.4f}' for r in resultados)}")

    print("\n" + "=" * 60)
    print("PROMPT AUMENTADO:")
    print("=" * 60)
    prompt = construir_prompt(query, resultados)
    print(prompt)


if __name__ == "__main__":
    main()

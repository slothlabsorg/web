"""
M11 · Capstone — capa ② (scratch)
Reconstrucción mínima ejecutable del template 09-hr-policy-assistant.
Solo stdlib. Sin pip, sin red. Determinista.

Pipeline: loader → chunker → embed → store → retrieve → prompt → fake_llm → citations
"""

import math
import os
import re


# ---------------------------------------------------------------------------
# 1. CARGA Y PARSEO (loader.pdf + ingest.chunker by-section)
# ---------------------------------------------------------------------------

def cargar_chunks(ruta: str) -> list[dict]:
    """Lee políticas separadas por '---' y devuelve chunks con metadata."""
    with open(ruta, encoding="utf-8") as f:
        contenido = f.read()
    partes = re.split(r"\n---\n", contenido)
    chunks = []
    for i, parte in enumerate(partes):
        texto = parte.strip()
        if not texto:
            continue
        titulo_match = re.match(r"^([^\n]+)", texto)
        titulo = titulo_match.group(1).strip() if titulo_match else f"chunk_{i}"
        chunks.append({"id": i, "text": texto, "source": titulo})
    return chunks


# ---------------------------------------------------------------------------
# 2. EMBEDDINGS + VECTOR STORE EN MEMORIA
# ---------------------------------------------------------------------------

def tokenizar(texto: str) -> list[str]:
    texto = texto.lower()
    tokens = re.findall(r"[a-záéíóúüñ0-9]+", texto)
    return [t for t in tokens if len(t) > 1]


def embed(texto: str) -> dict[str, float]:
    tokens = tokenizar(texto)
    if not tokens:
        return {}
    conteos: dict[str, int] = {}
    for token in tokens:
        conteos[token] = conteos.get(token, 0) + 1
    total = len(tokens)
    return {palabra: conteo / total for palabra, conteo in conteos.items()}


def similitud_coseno(a: dict[str, float], b: dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    claves = set(a) & set(b)
    dot = sum(a[k] * b[k] for k in claves)
    norma_a = math.sqrt(sum(v * v for v in a.values()))
    norma_b = math.sqrt(sum(v * v for v in b.values()))
    if norma_a == 0.0 or norma_b == 0.0:
        return 0.0
    return dot / (norma_a * norma_b)


class VectorStore:
    """store.chroma en memoria — índice hr_policies."""

    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        self.vectors = [embed(c["text"]) for c in chunks]

    def retrieve(self, query: str, k: int = 4) -> list[tuple[int, float, dict]]:
        vec_q = embed(query)
        scores = []
        for i, (chunk, vec) in enumerate(zip(self.chunks, self.vectors)):
            sim = similitud_coseno(vec_q, vec)
            scores.append((i, sim, chunk))
        scores.sort(key=lambda x: (-x[1], x[0]))
        return scores[:k]


# ---------------------------------------------------------------------------
# 3. PROMPT + FAKE LLM (model.llm stub determinista)
# ---------------------------------------------------------------------------

def construir_prompt(query: str, resultados: list[tuple[int, float, dict]]) -> str:
    lineas = [f"[{pos}] {item[2]['text']}" for pos, item in enumerate(resultados, 1)]
    contexto = "\n\n".join(lineas)
    return (
        "Eres el asistente oficial de RRHH. Basa TODA respuesta en los fragmentos.\n\n"
        f"Fragmentos de política relevantes:\n{contexto}\n\n"
        f"Pregunta del empleado: {query}\n\n"
        "Respuesta:"
    )


def fake_llm(query: str, resultados: list[tuple[int, float, dict]]) -> str:
    """
    LLM determinista: busca patrones en chunks recuperados.
    Simula síntesis del nodo logic.prompt sin API externa.
    """
    texto_chunks = " ".join(item[2]["text"].lower() for item in resultados)

    if "3 años" in query or "tres años" in query.lower():
        if "18 días" in texto_chunks or "3 años completos" in texto_chunks:
            return (
                "Después de **3 años completos de antigüedad** tienes derecho a "
                "**18 días hábiles** de vacaciones anuales.\n\n"
                "> Fuente: Política de Vacaciones §3 — Acumulación y disfrute"
            )

    if "primer año" in query.lower() or "primer año" in query.lower():
        if "12 días" in texto_chunks:
            return (
                "Durante tu **primer año de servicio** tienes derecho a "
                "**12 días hábiles** de vacaciones, prorrateados mensualmente.\n\n"
                "> Fuente: Política de Vacaciones §3 — Acumulación y disfrute"
            )

    if any(p in query.lower() for p in ("acciones", "bolsa", "financier")):
        return (
            "Lo siento, esa información no está disponible en los documentos de "
            "política de RRHH que tengo acceso."
        )

    mejor = max(resultados, key=lambda x: x[1]) if resultados else None
    if mejor and mejor[1] < 0.15:
        return (
            "No encontré información suficiente en las políticas de RRHH para "
            "responder con certeza."
        )

    fuente = mejor[2]["source"] if mejor else "política desconocida"
    return (
        f"Según los fragmentos recuperados, consulta la sección relevante en {fuente}.\n\n"
        f"> Fuente: {fuente}"
    )


# ---------------------------------------------------------------------------
# 4. CITAS OBLIGATORIAS (logic.citations mode: enforce)
# ---------------------------------------------------------------------------

def aplicar_citas(respuesta: str, resultados: list[tuple[int, float, dict]]) -> dict:
    """
    Post-procesador enforce: exige referencia a fuente de chunks recuperados.
    Devuelve dict con respuesta final y metadatos de citación.
    """
    if not resultados:
        return {
            "respuesta": (
                "No hay fragmentos relevantes. No puedo responder sin evidencia documental."
            ),
            "citations_ok": False,
            "citations": [],
        }

    fuentes = [item[2]["source"] for item in resultados]
    tiene_cita = any(
        f.lower() in respuesta.lower() or "fuente:" in respuesta.lower()
        for f in fuentes
    ) or "fuente:" in respuesta.lower()

    if not tiene_cita and "no está disponible" not in respuesta.lower():
        mejor = resultados[0][2]
        respuesta += f"\n\n> Fuente: {mejor['source']}"
        tiene_cita = True

    return {
        "respuesta": respuesta,
        "citations_ok": tiene_cita,
        "citations": fuentes[:3],
    }


# ---------------------------------------------------------------------------
# MAIN — pipeline completo template 09
# ---------------------------------------------------------------------------

def main():
    directorio = os.path.dirname(os.path.abspath(__file__))
    ruta_datos = os.path.join(directorio, "datos", "politicas_rrhh.txt")

    query = "¿Cuántos días de vacaciones me corresponden si llevo 3 años en la empresa?"

    chunks = cargar_chunks(ruta_datos)
    store = VectorStore(chunks)
    resultados = store.retrieve(query, k=4)

    print("=" * 60)
    print("M11 CAPSTONE · Template 09 — RAG mínimo (scratch)")
    print("=" * 60)
    print("QUERY:", query)
    print(f"CHUNKS INDEXADOS: {len(chunks)}")
    print("=" * 60)

    print(f"\nTOP-{len(resultados)} CHUNKS RECUPERADOS:")
    indices = []
    similitudes = []
    for pos, (idx, sim, chunk) in enumerate(resultados, start=1):
        preview = chunk["text"][:80].replace("\n", " ")
        print(f"\n  [{pos}] Índice {idx} | Similitud: {sim:.4f}")
        print(f"       Fuente: {chunk['source']}")
        print(f"       Preview: {preview}...")
        indices.append(idx)
        similitudes.append(sim)

    print(f"\nÍndices recuperados (0-based): {', '.join(str(i) for i in indices)}")
    print(f"Similitudes:                   {', '.join(f'{s:.4f}' for s in similitudes)}")

    prompt = construir_prompt(query, resultados)
    print("\n" + "=" * 60)
    print("PROMPT AUMENTADO (extracto):")
    print("=" * 60)
    print(prompt[:500] + "...\n[truncado]")

    respuesta_cruda = fake_llm(query, resultados)
    salida = aplicar_citas(respuesta_cruda, resultados)

    print("=" * 60)
    print("RESPUESTA FINAL (con logic.citations enforce):")
    print("=" * 60)
    print(salida["respuesta"])
    print(f"\ncitations_ok: {salida['citations_ok']}")
    print(f"citations:    {salida['citations']}")


if __name__ == "__main__":
    main()

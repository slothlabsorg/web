"""
Pipeline multimodal MRO — voz + imagen + RAG con citas
=======================================================
Capa ②: solo stdlib, determinista, sin red.

Simula:
  - STT (io.stt): lee transcript fijo de audio_notificacion.json
  - Visión (model.vision): lee descripción fija de foto_fuga.json
  - Retrieval: bag-of-words + filtros duros sobre amm_chunks.json
  - Generación: plantilla determinista con citas obligatorias

Ejecutar: python3 solucion_scratch.py
"""

from __future__ import annotations

import json
import math
import os
import re
import unicodedata
from collections import Counter

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
_DATOS = os.path.join(_HERE, "datos")


def _load(filename: str) -> dict:
    with open(os.path.join(_DATOS, filename), encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Capa STT mock — equivalente a io.stt / Whisper offline
# ---------------------------------------------------------------------------

def transcribe_audio(audio_ref: str) -> dict:
    """
    'Transcribe' audio leyendo el transcript mock.

    En producción: whisper.load_model("base").transcribe(audio_path)
    Aquí: el JSON ya contiene el texto fijo.
    """
    data = _load("audio_notificacion.json")
    if audio_ref and audio_ref != data["audio_id"]:
        return {"error": f"Audio desconocido: {audio_ref!r}"}
    return {
        "audio_id": data["audio_id"],
        "language": data["language"],
        "duration_sec": data["duration_sec"],
        "transcript": data["transcript"],
        "segments": data["segments"],
    }


# ---------------------------------------------------------------------------
# Capa visión mock — equivalente a model.vision
# ---------------------------------------------------------------------------

def describe_image(image_ref: str) -> dict:
    """
    'Entiende' una imagen leyendo la descripción mock.

    En producción: modelo de visión sobre píxeles reales.
    Aquí: JSON con descripción, metadata ATA y elementos detectados.
    """
    data = _load("foto_fuga.json")
    if image_ref and image_ref != data["image_id"]:
        return {"error": f"Imagen desconocida: {image_ref!r}"}
    return {
        "image_id": data["image_id"],
        "description": data["description"],
        "aircraft_type": data["aircraft_type"],
        "ata_chapter": data["ata_chapter"],
        "ata_section": data["ata_section"],
        "detected_elements": data["detected_elements"],
        "severity_hint": data["severity_hint"],
    }


# ---------------------------------------------------------------------------
# Retrieval — bag-of-words + filtros duros (hard-filters)
# ---------------------------------------------------------------------------

_STOPWORDS = {
    "a", "al", "con", "de", "del", "el", "en", "es", "la", "las", "lo",
    "los", "que", "se", "según", "un", "una", "y", "¿", "?",
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", _normalize(text))
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 2]


def _cosine_similarity(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    dot = sum(a[k] * b[k] for k in a if k in b)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve_chunks(
    query: str,
    *,
    aircraft_type: str,
    ata_chapter: str,
    top_k: int = 2,
) -> list[dict]:
    """Recupera chunks del AMM con filtro duro + similitud coseno sobre BoW."""
    corpus = _load("amm_chunks.json")["chunks"]
    query_vec = Counter(_tokenize(query))

    scored: list[tuple[float, dict]] = []
    for chunk in corpus:
        meta = chunk["metadata"]
        if meta.get("aircraft_type") != aircraft_type:
            continue
        if str(meta.get("ata_chapter")) != str(ata_chapter):
            continue
        chunk_vec = Counter(_tokenize(chunk["text"]))
        score = _cosine_similarity(query_vec, chunk_vec)
        scored.append((score, chunk))

    scored.sort(key=lambda x: (-x[0], x[1]["id"]))
    return [
        {
            "id": c["id"],
            "text": c["text"],
            "source": c["source"],
            "score": round(s, 4),
            "metadata": c["metadata"],
        }
        for s, c in scored[:top_k]
    ]


# ---------------------------------------------------------------------------
# Generación determinista con citas
# ---------------------------------------------------------------------------

def _build_query(transcript: str, vision: dict) -> str:
    labels = " ".join(e["label"].replace("_", " ") for e in vision["detected_elements"])
    return f"{transcript} {vision['description']} {labels}"


def generate_answer(
    transcript: str,
    vision: dict,
    chunks: list[dict],
) -> dict:
    """
    LLM fake: sintetiza respuesta citando chunks recuperados.
    Si no hay evidencia, responde 'no determinable'.
    """
    if not chunks:
        return {
            "answer": (
                "No determinable: no se encontró procedimiento AMM aplicable "
                f"para {vision['aircraft_type']} capítulo ATA {vision['ata_chapter']}."
            ),
            "citations": [],
            "escalate_hitl": vision.get("severity_hint") == "WARNING",
        }

    primary = chunks[0]
    secondary = chunks[1] if len(chunks) > 1 else None

    leak_detected = any(
        e["label"] == "hydraulic_fluid_leak" for e in vision["detected_elements"]
    )

    lines = [
        f"**Hallazgo multimodal:** la nota de voz reporta fuga hidráulica en MLG del "
        f"{vision['aircraft_type']}; la imagen confirma "
        f"{'fuga activa en el actuador de retracción' if leak_detected else 'anomalía visual'}.",
        "",
        f"**Procedimiento aplicable** (según {primary['source']}):",
        primary["text"],
    ]

    if secondary:
        lines.extend([
            "",
            f"**Acción correctiva referenciada** ({secondary['source']}):",
            secondary["text"],
        ])

    lines.extend([
        "",
        f"**Recomendación:** seguir pasos del AMM {vision['ata_section']} antes de liberar "
        f"la aeronave. Revisión vigente: {primary['metadata']['revision']}.",
    ])

    if vision.get("severity_hint") == "WARNING":
        lines.append(
            "\n⚠️ **WARNING detectado** — escalar a inspector certificado (hitl.escalate)."
        )

    citations = [c["source"] for c in chunks]

    return {
        "answer": "\n".join(lines),
        "citations": citations,
        "escalate_hitl": vision.get("severity_hint") == "WARNING",
    }


# ---------------------------------------------------------------------------
# Pipeline completo
# ---------------------------------------------------------------------------

def run_multimodal_pipeline(
    audio_ref: str = "AUDIO-MLG-001",
    image_ref: str = "IMG-MLG-001",
) -> dict:
    stt = transcribe_audio(audio_ref)
    if "error" in stt:
        return {"error": stt["error"]}

    vision = describe_image(image_ref)
    if "error" in vision:
        return {"error": vision["error"]}

    query = _build_query(stt["transcript"], vision)
    chunks = retrieve_chunks(
        query,
        aircraft_type=vision["aircraft_type"],
        ata_chapter=vision["ata_chapter"],
        top_k=2,
    )

    generated = generate_answer(stt["transcript"], vision, chunks)

    return {
        "transcript": stt["transcript"],
        "image_description": vision["description"],
        "vision_metadata": {
            "aircraft_type": vision["aircraft_type"],
            "ata_chapter": vision["ata_chapter"],
            "ata_section": vision["ata_section"],
            "severity_hint": vision["severity_hint"],
        },
        "retrieved_chunks": chunks,
        "answer": generated["answer"],
        "citations": generated["citations"],
        "escalate_hitl": generated["escalate_hitl"],
    }


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 60)
    print("PIPELINE MULTIMODAL MRO — stdlib, determinista")
    print("=" * 60)

    result = run_multimodal_pipeline()

    print("\n[1/4] STT (transcript mock)")
    print(f"  → {result['transcript'][:80]}...")

    print("\n[2/4] Visión (descripción mock)")
    print(f"  → {result['image_description'][:80]}...")

    print("\n[3/4] Retrieval (top chunks)")
    for ch in result["retrieved_chunks"]:
        print(f"  • {ch['id']} (score={ch['score']}) — {ch['source']}")

    print("\n[4/4] Respuesta citada")
    print(result["answer"])

    print("\n" + "-" * 60)
    print("JSON DE SALIDA:")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # Verificaciones
    assert result["transcript"], "transcript vacío"
    assert result["image_description"], "descripción vacía"
    assert result["citations"], "citations vacío"
    assert "AMM-A320#32-11-00#rev45" in result["citations"]
    assert result["escalate_hitl"] is True
    assert "WARNING" in result["answer"]

    print("\nTodas las verificaciones pasaron.")


if __name__ == "__main__":
    main()

# Requiere: pip install openai-whisper openai langchain langchain-openai pillow
"""
Pipeline multimodal MRO — voz + imagen + RAG con citas
=======================================================
Capa ③: implementación ilustrativa con APIs reales.

Este archivo NO se ejecuta en el entorno del curso (requiere pip, red y claves).
Muestra cómo reemplazar los mocks del scratch por:
  - Whisper (STT offline)
  - GPT-4o (visión)
  - LangChain + embeddings (retrieval)
  - OpenAI TTS / DALL·E (generación, opcional)

Para ejecutarlo cuando tengas red y pip:
  pip install openai-whisper openai langchain langchain-openai pillow
  export OPENAI_API_KEY="sk-..."
  python3 solucion_framework.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Carga de datos (chunks del AMM — igual que scratch)
# ---------------------------------------------------------------------------
_HERE = Path(__file__).parent
_DATOS = _HERE / "datos"


def _load_chunks() -> list[dict]:
    return json.loads((_DATOS / "amm_chunks.json").read_text(encoding="utf-8"))["chunks"]


# ---------------------------------------------------------------------------
# STT real — Whisper (reemplaza transcribe_audio mock)
# Ver guia.md §10.3: whisper.load_model().transcribe()
# ---------------------------------------------------------------------------

def transcribe_with_whisper(audio_path: str, model_size: str = "base") -> dict:
    """
    Transcribe un archivo de audio con Whisper local.

    Args:
        audio_path: ruta al .wav/.mp3 real (no al JSON mock del lab).
        model_size: tiny | base | small | medium | large

    Returns:
        dict con transcript, segments y language detectado.
    """
    import whisper  # noqa: PLC0415 — import tardío; requiere pip install

    model = whisper.load_model(model_size)
    result = model.transcribe(
        audio_path,
        language="es",
        fp16=False,  # en CPU/MPS forzar fp32
    )
    return {
        "transcript": result["text"].strip(),
        "language": result.get("language", "es"),
        "segments": [
            {"start": s["start"], "end": s["end"], "text": s["text"].strip()}
            for s in result.get("segments", [])
        ],
    }


# Alternativa streaming en producción (template 07 — io.stt):
# from deepgram import DeepgramClient, PrerecordedOptions
# client = DeepgramClient(api_key=os.environ["DEEPGRAM_API_KEY"])
# response = client.listen.rest.v("1").transcribe_file(open(audio_path, "rb"), {...})


# ---------------------------------------------------------------------------
# Visión real — GPT-4o multimodal (reemplaza describe_image mock)
# Ver guia.md §10.4
# ---------------------------------------------------------------------------

def describe_image_with_vision(image_path: str) -> dict:
    """
    Describe una imagen con un modelo de visión (GPT-4o).

    En producción también podrías usar:
      - Claude Opus/GPT-4o via LangChain ChatAnthropic/ChatOpenAI
      - LLaVA local (HF transformers)
      - IBM Granite Vision / watsonx
    """
    import base64  # noqa: PLC0415

    from openai import OpenAI  # noqa: PLC0415

    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    suffix = Path(image_path).suffix.lower().lstrip(".")
    mime = "jpeg" if suffix in ("jpg", "jpeg") else suffix

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Describe esta imagen de mantenimiento aeronáutico. "
                            "Extrae: aircraft_type, ata_chapter, ata_section, "
                            "descripción del daño, severity_hint (NOTE/CAUTION/WARNING). "
                            "Responde en JSON."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/{mime};base64,{b64}"},
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )

    return json.loads(response.choices[0].message.content)


# ---------------------------------------------------------------------------
# Retrieval con LangChain (reemplaza bag-of-words del scratch)
# ---------------------------------------------------------------------------

def build_retriever(chunks: list[dict]):
    """Construye un retriever vectorial en memoria sobre los chunks del AMM."""
    from langchain_core.documents import Document  # noqa: PLC0415
    from langchain_openai import OpenAIEmbeddings  # noqa: PLC0415
    from langchain_community.vectorstores import FAISS  # noqa: PLC0415

    docs = [
        Document(
            page_content=c["text"],
            metadata={**c["metadata"], "source": c["source"], "id": c["id"]},
        )
        for c in chunks
    ]

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    store = FAISS.from_documents(docs, embeddings)

    return store.as_retriever(
        search_kwargs={
            "k": 2,
            "filter": {"aircraft_type": "A320", "ata_chapter": "32"},
        }
    )


def retrieve_with_langchain(query: str, retriever) -> list[dict]:
    """Recupera chunks y los formatea como en el scratch."""
    docs = retriever.invoke(query)
    return [
        {
            "id": d.metadata.get("id", ""),
            "text": d.page_content,
            "source": d.metadata.get("source", ""),
            "metadata": {k: v for k, v in d.metadata.items() if k not in ("id", "source")},
        }
        for d in docs
    ]


# ---------------------------------------------------------------------------
# Generación con LLM real + citas
# ---------------------------------------------------------------------------

def generate_with_llm(transcript: str, vision: dict, chunks: list[dict]) -> dict:
    """Sintetiza respuesta citando chunks — reemplaza plantilla determinista."""
    from langchain_openai import ChatOpenAI  # noqa: PLC0415
    from langchain_core.prompts import ChatPromptTemplate  # noqa: PLC0415

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

    context = "\n\n".join(
        f"[{c['source']}] {c['text']}" for c in chunks
    ) or "SIN EVIDENCIA EN EL AMM."

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Eres un asistente MRO aeronáutico. Responde SOLO con evidencia del AMM citado. "
            "Incluye el campo citations como lista de sources. Si no hay evidencia, di 'no determinable'.",
        ),
        (
            "human",
            "Transcripción de voz:\n{transcript}\n\n"
            "Descripción de imagen:\n{vision_desc}\n\n"
            "Chunks AMM:\n{context}\n\n"
            "Responde en JSON: {{answer, citations, escalate_hitl}}",
        ),
    ])

    chain = prompt | llm
    raw = chain.invoke({
        "transcript": transcript,
        "vision_desc": vision.get("description", json.dumps(vision)),
        "context": context,
    })

    try:
        return json.loads(raw.content)
    except json.JSONDecodeError:
        return {"answer": raw.content, "citations": [c["source"] for c in chunks], "escalate_hitl": False}


# ---------------------------------------------------------------------------
# Generación de audio (TTS) — salida multimodal opcional
# Ver guia.md §10.5
# ---------------------------------------------------------------------------

def synthesize_tts(text: str, output_path: str, voice: str = "nova") -> str:
    """
    Convierte texto a audio con OpenAI TTS.

    Alternativas: ElevenLabs, Amazon Polly, Google Cloud TTS, Coqui TTS (local).
    """
    from openai import OpenAI  # noqa: PLC0415

    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text[:4096],
    )
    response.stream_to_file(output_path)
    return output_path


# ---------------------------------------------------------------------------
# Generación de imagen (DALL·E) — ilustrativo
# ---------------------------------------------------------------------------

def generate_image_dalle(prompt: str, output_path: str) -> str:
    """
    Genera imagen con DALL·E 3.

    Alternativas: Stable Diffusion XL (local), Sora (video), Midjourney API.
    """
    from openai import OpenAI  # noqa: PLC0415

    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    result = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    import urllib.request  # noqa: PLC0415

    url = result.data[0].url
    urllib.request.urlretrieve(url, output_path)
    return output_path


# ---------------------------------------------------------------------------
# Pipeline completo (modo real)
# ---------------------------------------------------------------------------

def run_multimodal_pipeline_real(
    audio_path: str,
    image_path: str,
    *,
    use_mocks_if_missing: bool = True,
) -> dict:
    """
    Pipeline end-to-end con APIs reales.

    Si los archivos de audio/imagen no existen y use_mocks_if_missing=True,
    cae a los JSON mock del lab (útil para probar retrieval + generación).
    """
    # --- STT ---
    if Path(audio_path).exists():
        stt = transcribe_with_whisper(audio_path)
        transcript = stt["transcript"]
    elif use_mocks_if_missing:
        mock = json.loads((_DATOS / "audio_notificacion.json").read_text(encoding="utf-8"))
        transcript = mock["transcript"]
    else:
        raise FileNotFoundError(f"Audio no encontrado: {audio_path}")

    # --- Visión ---
    if Path(image_path).exists():
        vision = describe_image_with_vision(image_path)
    elif use_mocks_if_missing:
        mock = json.loads((_DATOS / "foto_fuga.json").read_text(encoding="utf-8"))
        vision = {
            "description": mock["description"],
            "aircraft_type": mock["aircraft_type"],
            "ata_chapter": mock["ata_chapter"],
            "ata_section": mock["ata_section"],
            "severity_hint": mock["severity_hint"],
        }
    else:
        raise FileNotFoundError(f"Imagen no encontrada: {image_path}")

    # --- Retrieval ---
    chunks_data = _load_chunks()
    retriever = build_retriever(chunks_data)
    query = f"{transcript} {vision.get('description', '')}"
    chunks = retrieve_with_langchain(query, retriever)

    # --- Generación ---
    generated = generate_with_llm(transcript, vision, chunks)

    return {
        "transcript": transcript,
        "image_description": vision.get("description", ""),
        "retrieved_chunks": chunks,
        "answer": generated.get("answer", ""),
        "citations": generated.get("citations", []),
        "escalate_hitl": generated.get("escalate_hitl", False),
    }


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 60)
    print("PIPELINE MULTIMODAL MRO — framework (ilustrativo)")
    print("=" * 60)
    print("NOTA: requiere OPENAI_API_KEY y archivos de audio/imagen reales.")
    print("      Sin ellos, usa mocks de datos/ para retrieval + generación.\n")

    result = run_multimodal_pipeline_real(
        audio_path=str(_DATOS / "nota_tecnico.wav"),   # no existe en el lab
        image_path=str(_DATOS / "foto_fuga.jpg"),      # no existe en el lab
        use_mocks_if_missing=True,
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

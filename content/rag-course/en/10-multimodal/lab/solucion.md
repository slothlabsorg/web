# Lab M10 Solution — MRO multimodal pipeline

---

## Layer ② — From-scratch solution (`solucion_scratch.py`)

### Pipeline architecture

```
audio_notificacion.json          foto_fuga.json
        │                               │
        ▼                               ▼
 [transcribe_audio]            [describe_image]
   (mock io.stt)                 (mock model.vision)
        │                               │
        └───────────┬───────────────────┘
                    ▼
            [_build_query]  ← combines transcript + description + labels
                    │
                    ▼
         [retrieve_chunks]  ← BoW + cosine + hard-filters
                    │
                    ▼
          [generate_answer]  ← deterministic template + citations
                    │
                    ▼
              output JSON
```

### Mock STT — why JSON and not a `.wav`

In production, `io.stt` receives audio bytes and calls Deepgram (streaming) or Whisper (batch). In the course environment there is no network or downloadable models, so the mock **separates contract from implementation**:

- **Input:** audio reference (`AUDIO-MLG-001`).
- **Output:** `transcript`, `segments`, `language` — exactly what the rest of the pipeline needs.

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    return {"transcript": data["transcript"], "segments": data["segments"], ...}
```

Downstream pipeline **does not know** whether text came from Whisper or JSON. That decoupling is the same one RAGorbit uses with mocks in `ragorbit/runtime/`.

### Mock vision — ATA metadata as guardrail

The image description is not just free text: it includes `aircraft_type`, `ata_chapter`, `ata_section`, and `severity_hint`. Those fields feed:

1. **Hard filters** in retrieval (A320 chunks only, chapter 32).
2. **HITL escalation** if `severity_hint == "WARNING"` (like template 08 `hitl.escalate`).

### Multimodal retrieval — enriched query

The query is not just the transcript. It combines three sources:

```python
def _build_query(transcript: str, vision: dict) -> str:
    labels = " ".join(e["label"].replace("_", " ") for e in vision["detected_elements"])
    return f"{transcript} {vision['description']} {labels}"
```

This simulates what you would do in production: concatenate voice text + visual description + detected entities before embedding/retrieving.

**Hard filters** are applied *before* scoring — same as `retrieval.vector` with `hardFilters` in template 08:

```python
if meta.get("aircraft_type") != aircraft_type:
    continue
if str(meta.get("ata_chapter")) != str(ata_chapter):
    continue
```

Without this, the B737 chunk (`amm-b737-32-11-001`) could slip in via lexical similarity on "tren de aterrizaje".

### Generation with citations — deterministic template

`generate_answer` does not call a real LLM. It builds the response explicitly citing each retrieved chunk `source`. If `chunks` is empty, it returns `"No determinable"` — same M5 pattern (`logic.structured` without evidence).

---

## Layer ③ — Framework solution (`solucion_framework.py`)

> **Before reading:** try to write the file following [guia.md §10](../guia.md#10-layer--explained-whisper-vision-and-generation-from-scratch).

### Scratch → framework bridge table

| Scratch (②) | Framework (③) | Function |
|-------------|---------------|---------|
| Read `audio_notificacion.json` | `whisper.load_model().transcribe()` | STT |
| Read `foto_fuga.json` | `client.chat.completions.create` with base64 image | Vision |
| BoW + cosine in memory | `FAISS` + `OpenAIEmbeddings` | Retrieval |
| Deterministic template | `ChatOpenAI` + citations prompt | Generation |
| — | `client.audio.speech.create` | TTS (output) |
| — | `client.images.generate` | DALL·E (output) |

### Degraded mode with mocks

`run_multimodal_pipeline_real(..., use_mocks_if_missing=True)` lets you test retrieval + generation even without real `.wav`/`.jpg` — falls back to lab JSON for STT and vision, but uses real APIs for embeddings and LLM.

### Production gotchas

1. **Whisper `base` on CPU** can take 10–30 s per minute of audio. For real-time call center use Deepgram (`io.stt` from template 07).
2. **Vision per image** costs ~$0.01–0.03 per photo (GPT-4o). In claims batch (template 04) cost scales with number of photos.
3. **FAISS filters** require metadata indexed correctly at ingestion — if `aircraft_type` is not in metadata, the filter fails silently.

---

## Connection with RAGorbit

This pipeline corresponds to this subgraph:

```
io.stt ──Message──▶┐
                   │  (enriched query)
model.vision ──Model──▶ loader.multimodal / fusion logic
                   │
                   ▼
            retrieval.vector (hardFilters: aircraft_type, ata_chapter)
                   │ Chunks
                   ▼
            logic.prompt + logic.citations
                   │
                   ▼
              io.output (json)
                   │
         hitl.escalate (if WARNING)
```

See [`examples/08-manufacturing-maintenance-rag/flow.json`](../../examples/08-manufacturing-maintenance-rag/flow.json) for full wiring with `loader.multimodal` + `model.vision`.

---

## Workshop lessons

1. **Multimodal = merge signals before retrieving.** Do not transcribe and retrieve with voice alone; the image adds entities (MLG, leak, Skydrol) that improve recall.
2. **Deterministic mocks teach the contract.** Transcript/description JSON is as valid for learning as a real `.wav` — the real API only changes step 1.
3. **Hard filters + multimodal:** visual metadata (`aircraft_type`, `ata_chapter`) can act as a retrieval guardrail without delegating to the LLM.
4. **Mandatory citations in regulated domains:** MRO, insurance, and healthcare require documentary anchor; the `citations` field is not decorative.

# Lab M10 · Multimodal pipeline — voice + image + RAG with citations

## Business brief

You are an engineer at an **aeronautical MRO** company (maintenance, repair, and overhaul). Line technicians on the ramp report incidents in two ways at once:

1. **Voice note** recorded from a mobile device (audio).
2. **Photograph** of the affected component (image).

The multimodal copilot must:

1. **Transcribe** the voice note to text.
2. **Understand** the photograph (structured description + ATA metadata).
3. **Retrieve** the correct procedure from the AMM (Aircraft Maintenance Manual).
4. **Respond citing** manual sections — never without documentary anchor.
5. If it detects **WARNING/CAUTION**, flag HITL escalation (like template 08).

This pattern combines:
- **STT** from template [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/) (`io.stt`).
- **Vision** from templates [04-insurance-claims](../../examples/04-insurance-claims/) and [08-manufacturing-maintenance-rag](../../examples/08-manufacturing-maintenance-rag/) (`model.vision`, `loader.multimodal`).
- **RAG with hard filters** from template 08 (`retrieval.vector` + `aircraft_type` + `ata_chapter`).

## Available data

In `lab/datos/`:

| File | What it represents | In production it would be… |
|---------|----------------|----------------------|
| `audio_notificacion.json` | Fixed transcript of a voice note | Whisper / Deepgram output on a `.wav` |
| `foto_fuga.json` | Fixed description + ATA metadata of a photo | `model.vision` output on a `.jpg` |
| `amm_chunks.json` | Indexed fragments from A320 AMM | Chunks in `store.pgvector` after multimodal ingestion |

> **Course environment constraint:** no network or pip. Mock JSON is **deterministic** — the scratch reads fixed text instead of processing real binaries.

## Test scenario

A technician reports:

- **Voice:** hydraulic fluid leak in the MLG actuator of an A320; asks for AMM procedure 32-11-00.
- **Image:** active Skydrol leak on the left MLG retraction actuator.
- **Visual severity:** `WARNING`.

The system must retrieve chunks `amm-32-11-00-001` and `amm-32-11-00-200-001` (not the B737 or NLG chunk) and respond citing both sources.

## Task

### Part A — Pipeline from scratch (layer ②)

Implement `lab/solucion_scratch.py` with:

1. **`transcribe_audio(audio_ref)`** — reads `audio_notificacion.json` and returns the transcript (mock STT).

2. **`describe_image(image_ref)`** — reads `foto_fuga.json` and returns description + metadata (mock vision).

3. **`retrieve_chunks(query, aircraft_type, ata_chapter, top_k=2)`** — bag-of-words + cosine similarity on `amm_chunks.json` with **hard filters** by `aircraft_type` and `ata_chapter`.

4. **`generate_answer(transcript, vision, chunks)`** — deterministic fake LLM that synthesizes a response with non-empty `citations` (or "not determinable" if there are no chunks).

5. **`run_multimodal_pipeline()`** — orchestrates the 4 steps and returns JSON with:
   - `transcript`
   - `image_description`
   - `retrieved_chunks`
   - `answer`
   - `citations`
   - `escalate_hitl`

6. **`main()`** — prints the 4 stages and final JSON; verifies properties from `expected.md` with `assert`.

**Constraints:** stdlib only. No `random`, no network, no pip. Must be **deterministic**.

### Part B — Pipeline with real frameworks (layer ③, guided task)

> **Read first:** [guia.md §10 — Layer ③ explained](../guia.md#10-layer--explained-whisper-vision-and-generation-from-scratch). Do not copy `solucion_framework.py` wholesale.

**Environment requirements** (outside the course machine):

```bash
pip install openai-whisper openai langchain langchain-openai pillow
export OPENAI_API_KEY="sk-..."
```

#### Step B.1 — STT with Whisper

1. Implement `transcribe_with_whisper(audio_path)` with `whisper.load_model("base").transcribe(...)`.
2. Compare output with the lab mock transcript.

#### Step B.2 — Vision with GPT-4o

1. Implement `describe_image_with_vision(image_path)` sending the image in base64.
2. Request JSON output with `aircraft_type`, `ata_chapter`, `description`, `severity_hint`.

#### Step B.3 — Retrieval with LangChain + FAISS

1. Load `amm_chunks.json` as LangChain `Document`.
2. Index with `OpenAIEmbeddings` + `FAISS`.
3. Retrieve with filter `aircraft_type=A320`, `ata_chapter=32`.

#### Step B.4 — Generation + citations

1. Use `ChatOpenAI` with a prompt that requires citations.
2. Return the same JSON schema as the scratch.

#### Step B.5 — (Optional) TTS and DALL·E

1. `synthesize_tts()` — converts the response to audio.
2. `generate_image_dalle()` — generates a procedure illustration.

## Scaffolding hints

### Hint 1 — Mock STT

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    return {"transcript": data["transcript"], ...}
```

### Hint 2 — Multimodal query

Combine transcript + image description + detected labels:

```python
query = f"{transcript} {vision['description']} hydraulic fluid leak"
```

### Hint 3 — Hard filter before scoring

```python
if meta["aircraft_type"] != aircraft_type:
    continue
if str(meta["ata_chapter"]) != str(ata_chapter):
    continue
```

### Hint 4 — Mandatory citations

```python
citations = [c["source"] for c in chunks]
if not citations:
    return {"answer": "Not determinable...", "citations": []}
```

## Acceptance criteria

1. `python3 -m py_compile lab/solucion_scratch.py` with no errors.
2. `python3 lab/solucion_scratch.py` prints JSON with `transcript`, `image_description`, non-empty `citations`.
3. `citations` includes `AMM-A320#32-11-00#rev45`.
4. Retrieved chunks: A320 chapter 32 only (not B737).
5. `escalate_hitl` is `true`.
6. Stdlib only in the scratch.

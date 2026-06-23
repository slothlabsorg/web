# Module 10 · Multimodal — Voice, vision, and generation (`io.stt`, `model.vision`)

> **Prerequisite:** M1–M6 (LLMs, ingestion, retrieval, generation with citations, agents). M2 covers `loader.multimodal` in ingestion; this module goes deeper into multimodal **input and output**.
>
> **RAGorbit nodes:** `io.stt`, `model.vision`, `loader.multimodal`, `model.llm` (multimodal)
>
> **Anchor templates:** `07-telecom-callcenter-copilot` (STT streaming), `04-insurance-claims` (vision in claims), `08-manufacturing-maintenance-rag` (AMM + ATA diagrams)

---

## 1. What "multimodal" means and why it matters in RAG

A **multimodal** system processes more than one type of signal: text, voice, image, video, scanned tables. In RAG and agents, the goal is not to "look pretty" — it is to **convert those signals into structured text** that the rest of the pipeline (retrieval, generation, rules) already knows how to handle.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TYPICAL MULTIMODAL PIPELINE                       │
│                                                                     │
│  Audio (.wav)  ──▶ [STT] ──▶ text                                  │
│  Image (.jpg) ──▶ [Vision] ──▶ description + metadata               │
│  PDF with photos ──▶ [loader.multimodal] ──▶ enriched chunks      │
│                                                                     │
│         text + descriptions + metadata                              │
│                    │                                                │
│                    ▼                                                │
│            [Retrieval / RAG / Agent]                                │
│                    │                                                │
│                    ▼                                                │
│  Text response ◀─┴──▶ [TTS] ──▶ audio (optional)                   │
│              └──▶ [DALL·E/SDXL] ──▶ image (optional)                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 When to use multimodal?

**Use multimodal input when:**
- The user **speaks** (call center, voice assistant, dictation on the ramp).
- Documents include **diagrams, photos, or tables** whose information is not in OCR text.
- You need to **classify damage** in photos (insurance, industrial inspection).
- The input channel is **photo + question** (WhatsApp with an invoice image).

**Do NOT use multimodal when:**
- All relevant content is already in **clean text** (digital PDF, Markdown, SQL).
- Latency is critical (<500 ms) and you can ask the user to **type** instead of speaking or photographing.
- Cost per query matters and the visual signal **does not add** new information (decorative logo in a PDF).

### 1.2 The RAGorbit pattern: convert → retrieve → cite

RAGorbit does not index pixels or audio waveforms directly in the vector store (except specialized multimodal embeddings). The dominant pattern is:

1. **Convert** audio/image to text (STT, vision).
2. **Enrich** with metadata (ATA chapter, damage type, language).
3. **Retrieve** with fused text + hard filters.
4. **Generate** with mandatory citations (M5).

---

## 2. Multimodal challenges in production

| Challenge | What it means | Mitigation |
|------|---------------|------------|
| **Alignment** | Voice and image must refer to the same incident | Session IDs; timestamp; merge into a single query |
| **Latency** | STT streaming + vision + RAG can exceed 3 s | STT streaming (Deepgram); async vision; description cache |
| **Cost** | Vision ~$0.01–0.03/img; Whisper API per minute | Offline batch with local Whisper; compress images |
| **Languages** | Multilingual Whisper ≠ all accents | `language` hint; fine-tune or regional model |
| **Formats** | Audio codecs, HEIC, scanned PDF | Normalize at ingestion (`loader.multimodal`) |
| **Visual hallucination** | The model "sees" damage that does not exist | Citations to the AMM; HITL on WARNING; rules on metadata |
| **PII in audio/image** | Voices, license plates, faces in photos | Redaction pre-STT; blur in ingestion pipeline |

```
Typical latency (call center copilot, template 07):
  Deepgram STT (streaming)     ~300–800 ms
  model.intent                  ~10 ms
  retrieval + rerank            ~200–400 ms
  logic.prompt + citations      ~500–1500 ms
  ─────────────────────────────────────────
  Target total:                 < 1.5 s from end of phrase
```

---

## 3. STT — Speech-to-Text and the `io.stt` node

### 3.1 What it does

**STT** converts audio to text. In RAGorbit, the `io.stt` node produces `Message` fragments **in streaming** as audio arrives — it does not wait for the user to finish speaking.

See full reference: [`referencia/catalogo-nodos.md` §io.stt](../referencia/catalogo-nodos.md#iostt).

```json
{
  "type": "io.stt",
  "config": {
    "provider": "deepgram",
    "language": "es"
  }
}
```

### 3.2 Streaming vs batch

| Mode | When | Example |
|------|--------|---------|
| **Streaming** | Real time, copilot, IVR | Template 07: call fragment → suggestion in panel |
| **Batch** | Full recording, post-processing | Technician voice note on ramp → transcript → RAG |

In batch, local Whisper is the reference option (open-weights, no per-token cost). In streaming, **Deepgram Nova-2** or Amazon Transcribe Streaming dominate on latency.

### 3.3 When NOT to use `io.stt`

- If you already have the transcript (`.txt` file, subtitles, CRM).
- If audio is processed in overnight batch — use Whisper as an `io.batch` or `tool.function` step.

---

## 4. Whisper — the reference model for offline STT

**Whisper** (OpenAI, open-weights) is the standard for offline multilingual transcription. Models: `tiny`, `base`, `small`, `medium`, `large` — larger = better quality, slower.

```python
# Conceptual — see §10 for full implementation
import whisper
model = whisper.load_model("base")
result = model.transcribe("nota_tecnico.wav", language="es")
print(result["text"])
```

### 4.1 Strengths

- **Multilingual** without fine-tuning (99 languages).
- **Open-weights** — runs locally via Hugging Face, Ollama, `pip install openai-whisper`.
- **Segments with timestamps** — useful for aligning with video or review UI.
- **Zero cost** per token if it runs on your GPU/CPU.

### 4.2 Limitations

- **Not true streaming** — processes the full file (or large chunks).
- **Latency** on CPU: ~10–30× real time with the `base` model.
- **Background noise** on ramp/airport degrades quality.

### 4.3 Whisper vs Deepgram

| | Whisper (local) | Deepgram Nova-2 |
|---|---|---|
| **Latency** | High (batch) | Low (<300 ms streaming) |
| **Cost** | Fixed GPU/CPU | ~$0.0043/min |
| **Privacy** | Data stays local | Audio goes to API |
| **Languages** | 99 | 36+ with excellent ES |
| **Ideal case** | Batch, offline, private | Real-time call center (template 07) |

See also: [`referencia/glosario.md` §Whisper](../referencia/glosario.md), [`referencia/glosario.md` §STT](../referencia/glosario.md).

---

## 5. Vision — describing images, diagrams, and tables→JSON

### 5.1 The `model.vision` node

**What it does:** multimodal model that describes images, diagrams, and tables as **text** for the RAG pipeline. Produces `Model` and connects to `loader.multimodal`.

```json
{
  "type": "model.vision",
  "config": {
    "model": "anthropic:claude-opus-4-8",
    "apiKeyRef": "ANTHROPIC_API_KEY"
  }
}
```

Reference: [`referencia/catalogo-nodos.md` §model.vision](../referencia/catalogo-nodos.md#modelvision).

### 5.2 Use cases in the templates

**Template 04 (insurance):** vehicle damage photos → description → `logic.rules` + `logic.structured` with cited clause.

**Template 08 (manufacturing):** hydraulic diagrams from the AMM → text describing components → indexable chunks with `sectionScheme: ATA`.

```
AMM PDF
    │
    ▼
loader.multimodal (extractTables: true, describeImages: true)
    │                    ▲
    │                    │ Model
    └──── model.vision ──┘
    │
    ▼
"Figure 32-11-05: MLG retraction actuator with inspection points A, B, C..."
    │
    ▼
ingest.chunker → store.pgvector → retrieval with hardFilters (aircraft_type, ata_chapter)
```

### 5.3 Scanned tables → JSON

`loader.multimodal` with `extractTables: true` converts tolerance, deductible, or torque tables into structured JSON — not just plain text. That enables deterministic `logic.rules` on numeric values (M5).

### 5.4 When NOT to use vision

- PDF with selectable text (use `loader.pdf` directly).
- Decorative images with no technical information.
- When cost per document (hundreds of pages with figures) exceeds budget — consider OCR + layout parser (Unstructured) first.

### 5.5 Competing vision models

| Model | Strength | Weakness |
|--------|-----------|-----------|
| **GPT-4o** | Excellent on diagrams + JSON | API cost |
| **Claude Opus/GPT-4o** | Reasoning over technical figures | Latency |
| **Gemini Pro Vision** | Long context, video | Google ecosystem |
| **LLaVA / Qwen-VL** | Local, open-weights | Lower quality on dense tables |
| **IBM Granite Vision** | Enterprise, watsonx | Integration curve |
| **Pixtral (Mistral)** | Good EU balance | Smaller ecosystem |

---

## 6. Image and audio generation (multimodal output)

So far we covered multimodal **input** (audio→text, image→text). **Generation** converts text into image or audio — useful for spoken responses, illustrations, or IVR.

### 6.1 Image generation

| Model | Type | When to use |
|--------|------|-------------|
| **DALL·E 3** | OpenAI API | Illustrations, mockups, conceptual diagrams |
| **Stable Diffusion XL** | Local/open | High volume, LoRA control, no API |
| **Sora** | Video (OpenAI) | Short clips, prototypes — high cost and latency |
| **Midjourney** | API/discord | Artistic quality |

In production RAG, image generation is **rare** — the value is in retrieving and citing real documents. It is used more in creative assistants or to generate explanatory diagrams *ad hoc*.

### 6.2 TTS — Text-to-Speech

Converts the LLM response into synthetic audio:

```python
# Conceptual
client.audio.speech.create(model="tts-1", voice="nova", input=respuesta)
```

**When to use TTS:**
- Bidirectional voice bot: STT (input) + LLM + TTS (output).
- IVR that reads simplified policies.
- Accessibility.

**Alternatives:** ElevenLabs (natural voices), Amazon Polly, Google Cloud TTS, Coqui TTS (local).

### 6.3 Full voice pipeline

```
User speaks ──▶ io.stt ──▶ text ──▶ RAG/agent ──▶ text response ──▶ TTS ──▶ audio
```

Template 07 implements only the left half (STT → copilot for human agent). A closed voice bot would add TTS at the end.

---

## 7. Multimodal embeddings and multimodal vector DB

### 7.1 The problem

Text embeddings (M3) do not represent images directly. **Multimodal embeddings** project text and image into the same vector space (or aligned spaces):

- CLIP (OpenAI): image ↔ text
- ImageBind (Meta): image, audio, text, depth…
- Cohere embed-multilingual-v3: text + image in API

### 7.2 Use cases

| Case | How it works |
|------|---------------|
| Search "photos similar to this description" | Embed text query + compare with image embeddings |
| Cross-modal search | "Find diagrams related to this damage photo" |
| Indexing in Weaviate/Milvus multimodal | Native modules for image + text |

### 7.3 When to use multimodal embeddings vs vision→text?

| Approach | Advantage | Disadvantage |
|---------|---------|------------|
| **Vision → text → embed text** (RAGorbit pattern) | Compatible with any vector store; citations on text | Loses fine detail; vision cost at ingestion |
| **Embed image directly** | Visual similarity search | Less interpretable; hard to cite; specialized stores |

For regulated domains (MRO, insurance, healthcare), **vision→text→RAG with citations** is the preferred pattern because you can audit the indexed text.

### 7.4 Vector DB with multimodal support

**Weaviate** and **Milvus** offer modules for image+text. **Chroma** and **pgvector** in RAGorbit index mainly text — the natural path is to describe images at ingestion (`loader.multimodal`).

---

## 8. Technology comparison — quick decision

### 8.1 STT

| Provider | Latency | Streaming | Privacy | Best for |
|-----------|----------|-----------|------------|------------|
| Local Whisper | High | No | ✅ Total | Batch, offline, lab |
| Deepgram | Very low | ✅ | API | Call center (07) |
| OpenAI Whisper API | Medium | No | API | Rapid prototypes |
| Amazon Transcribe | Medium | ✅ | AWS | AWS stack |

### 8.2 Vision

| Provider | Technical quality | Local | Best for |
|-----------|-----------------|-------|------------|
| GPT-4o | High | No | Diagrams, JSON, insurance |
| Claude Opus | High | No | Technical manuals (08) |
| LLaVA-1.6 | Medium | ✅ | Prototypes without API |
| watsonx Granite Vision | High | Hybrid | IBM enterprise |

### 8.3 Open platforms (HF / Ollama / watsonx)

- **Hugging Face:** download Whisper, LLaVA, CLIP, SDXL; `transformers` + `pipeline`.
- **Ollama:** `ollama run llava` for local vision; Whisper via bindings.
- **watsonx / Granite:** enterprise models with governance; vision + LLM under one contract.

See extended table: [`referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md).

---

## 9. Connection with industry templates

### Template 07 · Telecom Copilot — STT streaming

```
Call audio → io.stt (Deepgram) → model.intent → query.rewrite → retrieval.router → io.panel
```

- STT feeds **partial** fragments; `model.intent` discards greetings.
- Target latency: **< 1.5 s** from end of phrase.
- See [`examples/07-telecom-callcenter-copilot/README.md`](../../examples/07-telecom-callcenter-copilot/README.md).

### Template 04 · Insurance — vision in claims

```
io.batch → loader.multimodal (photos + policy) → model.vision → logic.rules → logic.structured
```

- Damage photos → description → deductible rules → JSON with `clausula_aplicada`.
- See [`examples/04-insurance-claims/README.md`](../../examples/04-insurance-claims/README.md).

### Template 08 · Manufacturing MRO — multimodal AMM

```
model.vision → loader.multimodal (sectionScheme: ATA) → retrieval.vector (hardFilters) → hitl.escalate
```

- AMM diagrams → text; filters by `aircraft_type` and `ata_chapter`.
- WARNING/CAUTION → escalation to inspector.
- See [`examples/08-manufacturing-maintenance-rag/README.md`](../../examples/08-manufacturing-maintenance-rag/README.md).

---

## 10. Layer ③ explained: Whisper, vision, and generation from scratch

> **Prerequisite:** you have implemented layer ② of the workshop (`lab/solucion_scratch.py`) or understand each mock piece. **Read this section in full** before writing `lab/solucion_framework.py`.
>
> **Environment:** the study machine has no `pip` or network. The goal is that, when you have `pip install openai-whisper openai langchain langchain-openai` and API keys, you can **write** the framework solution yourself.

### 10.1 Bridge table: scratch mocks → real APIs

| What you simulated with mocks (layer ②) | Real API (layer ③) | Where in the lab |
|-------------------------------------|-------------------|-----------------|
| Read fixed `transcript` from `audio_notificacion.json` | `whisper.load_model("base").transcribe(audio_path)` | `transcribe_with_whisper()` |
| Read fixed `description` from `foto_fuga.json` | `client.chat.completions.create` with base64 image (GPT-4o) | `describe_image_with_vision()` |
| BoW + cosine on `amm_chunks.json` | `FAISS` + `OpenAIEmbeddings` + retriever with filter | `build_retriever()` |
| Deterministic template `generate_answer()` | `ChatOpenAI` + prompt with mandatory citations | `generate_with_llm()` |
| — (not implemented in scratch) | `client.audio.speech.create` (TTS) | `synthesize_tts()` |
| — (not implemented in scratch) | `client.images.generate` (DALL·E 3) | `generate_image_dalle()` |

**Mental model:** in scratch, mock JSON **is** the STT/vision output. In production you replace only those two functions; retrieval and generation can migrate gradually (real embeddings first, then real LLM).

### 10.2 Whisper from scratch — `transcribe_with_whisper`

#### Installation and model loading

```bash
pip install openai-whisper
# Requires ffmpeg on the system: brew install ffmpeg (macOS)
```

```python
import whisper

model = whisper.load_model("base")  # tiny|base|small|medium|large
result = model.transcribe(
    "nota_tecnico.wav",
    language="es",       # hint de idioma mejora precisión
    fp16=False,            # obligatorio en CPU/MPS
)
text = result["text"]
segments = result["segments"]  # [{start, end, text}, ...]
```

**What it does internally (simplified):**
1. Converts audio to spectrogram (mel bins).
2. Transformer encoder processes the audio.
3. Decoder generates text tokens autoregressively.
4. Returns text + timestamps per segment.

#### Choosing model size

| Model | Params | VRAM ~ | ES quality | CPU speed |
|--------|--------|--------|------------|---------------|
| tiny | 39M | 1 GB | Basic | Fast |
| base | 74M | 1 GB | Good | Medium |
| small | 244M | 2 GB | Very good | Slow |
| medium | 769M | 5 GB | Excellent | Very slow |

For technician notes on the ramp (noise, jargon), **`small`** is the minimum recommended for production batch.

#### Whisper gotchas

1. **Do not confuse with streaming `io.stt`** — Whisper processes files; for call center use Deepgram.
2. **`language="es"`** reduces errors vs automatic detection on short audio.
3. **Hallucinations in silence** — Whisper can invent text on empty audio; validate `no_speech_prob` in segments.
4. **First run downloads the model** (~150 MB for `base`) — plan Docker cache.

### 10.3 Vision from scratch — `describe_image_with_vision`

#### OpenAI GPT-4o pattern (used by `solucion_framework.py`)

```python
import base64
from openai import OpenAI

client = OpenAI()

with open("foto_fuga.jpg", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe daño aeronáutico. Responde JSON."},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
        ],
    }],
    response_format={"type": "json_object"},
    temperature=0.0,
)
vision = json.loads(response.choices[0].message.content)
```

#### LangChain pattern (equivalent)

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o", temperature=0)
msg = HumanMessage(content=[
    {"type": "text", "text": "Describe..."},
    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
])
result = llm.invoke([msg])
```

#### Local pattern — LLaVA via Ollama

```bash
ollama pull llava
ollama run llava "Describe esta imagen de tren de aterrizaje" --image foto.jpg
```

#### Vision gotchas

1. **Resolution:** resize to max 2048px — huge images increase cost without gaining detail.
2. **JSON mode** (`response_format`) reduces parsing errors in ATA metadata.
3. **Damage hallucination** — in insurance/MRO, combine with `logic.citations` on documents, not just the visual description.
4. **PII** — photos may have license plates, faces; consider prior blur.

### 10.4 Retrieval and generation — LangChain over AMM chunks

Scratch uses BoW; in framework:

```python
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

docs = [Document(page_content=c["text"], metadata=c["metadata"]) for c in chunks]
store = FAISS.from_documents(docs, OpenAIEmbeddings(model="text-embedding-3-small"))
retriever = store.as_retriever(search_kwargs={"k": 2, "filter": {"aircraft_type": "A320"}})
```

Generation with citations:

```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)
# Prompt: "Responde SOLO con evidencia del AMM. Incluye citations: [...]"
```

### 10.5 TTS and DALL·E — output generation

#### TTS (OpenAI)

```python
response = client.audio.speech.create(
    model="tts-1",       # o tts-1-hd para mayor calidad
    voice="nova",        # alloy, echo, fable, onyx, nova, shimmer
    input="Procedimiento AMM 32-11-00: inspeccionar actuador...",
)
response.stream_to_file("respuesta.mp3")
```

**When to use / NOT:**
- ✅ Voice bot, IVR, accessibility.
- ❌ Copilot for human agent (template 07) — the agent **reads** the panel, no audio needed.

#### DALL·E 3

```python
result = client.images.generate(
    model="dall-e-3",
    prompt="Diagrama técnico esquemático de actuador MLG A320, estilo manual mantenimiento",
    size="1024x1024",
    quality="standard",
)
url = result.data[0].url
```

**When to use / NOT:**
- ✅ Training material, conceptual illustration.
- ❌ Regulatory evidence — never replaces a real photo or cited AMM document.

### 10.6 Block-by-block walkthrough of `lab/solucion_framework.py`

Open `lab/solucion_framework.py` and follow this map:

#### Block 1 — Chunk loading (lines ~20–30)

Identical to scratch: `amm_chunks.json` feeds the retriever. No surprises.

#### Block 2 — `transcribe_with_whisper` (lines ~35–60)

**Scratch bridge:** `transcribe_audio()` reads JSON → here `whisper.transcribe()` reads `.wav`.

**Detail:** `fp16=False` on CPU; `language="es"` for notes in Spanish.

#### Block 3 — `describe_image_with_vision` (lines ~65–110)

**Scratch bridge:** `describe_image()` reads JSON → here GPT-4o on base64.

**Detail:** `response_format={"type": "json_object"}` for structured ATA metadata.

#### Block 4 — `build_retriever` + `retrieve_with_langchain` (lines ~115–155)

**Scratch bridge:** `retrieve_chunks()` BoW → here FAISS with OpenAI embeddings.

**Detail:** filter `{"aircraft_type": "A320", "ata_chapter": "32"}` replicates scratch hard-filters.

#### Block 5 — `generate_with_llm` (lines ~160–195)

**Scratch bridge:** `generate_answer()` template → here `ChatOpenAI` with citations prompt.

#### Block 6 — TTS and DALL·E (lines ~200–240)

No scratch equivalent — they are optional multimodal **output**.

#### Block 7 — `run_multimodal_pipeline_real` (lines ~245–290)

Orchestrates everything with `use_mocks_if_missing=True`: if there is no `.wav`/`.jpg`, falls back to lab JSON (useful for testing without recording real audio).

### 10.7 When to use each technology — final gotchas

| Situation | Use | Avoid |
|-----------|-----|-------|
| Real-time call center | Deepgram (`io.stt`) | Whisper batch |
| Voice notes in overnight batch | Local Whisper | Deepgram (cost/min) |
| Claim photos with JSON | GPT-4o + `response_format` | LLaVA if you need damage precision |
| 1000+ page technical manuals | `loader.multimodal` at ingestion | Vision on every query |
| Full spoken bot | STT + LLM + TTS | Text only if channel is chat |
| Regulatory evidence | Vision→text→RAG with citations | DALL·E as "proof" |

**Production gotchas:**

1. **Merge signals before retrieving** — do not run two separate RAG passes (voice vs image); combine transcript + description into one query.
2. **Image description cache** — the same photo should not go through vision twice; store hash→description.
3. **Chain timeouts** — STT + vision + RAG can exceed 10 s; parallelize STT and vision if they are independent.
4. **Audio formats** — normalize to 16 kHz mono WAV before Whisper; avoid exotic codecs.
5. **Vision cost in batch ingestion** — template 04 with 500 photos/day × $0.02 ≈ $10/day on vision alone.

### 10.8 Checklist before writing your `solucion_framework.py`

- [ ] Does `transcribe_with_whisper` use `language="es"` and `fp16=False` on CPU?
- [ ] Does `describe_image_with_vision` request JSON with `aircraft_type`, `ata_chapter`, `severity_hint`?
- [ ] Does the FAISS retriever apply filter `aircraft_type` + `ata_chapter`?
- [ ] Does the generation prompt require non-empty `citations` or "no determinable"?
- [ ] Does `run_multimodal_pipeline_real` degrade to mocks if binary files are missing?
- [ ] *(Optional)* Does `synthesize_tts` generate audio for the response?
- [ ] *(Optional)* Do you understand why DALL·E does not replace real photographic evidence?

**Next step:** open `lab/enunciado.md` (Part B) and try to write the file yourself before looking at `solucion_framework.py`.

---

## 11. RAGorbit nodes in this module

### `io.stt`

```
Input port:  Audio (stream)
Output port: Message (text fragments)
```

Config: `provider: deepgram`, `language: es`. See template 07.

### `model.vision`

```
Output port: Model → (connects to loader.multimodal or downstream logic)
```

Config: `model: anthropic:claude-opus-4-8` or `openai:gpt-4o`.

### `loader.multimodal`

```
Ports: Documents → Documents (enriched)
Model input: model.vision (optional)
```

Config: `extractTables: true`, `describeImages: true`, `sectionScheme: ATA`.

---

## 12. Checkpoint — You know it if you can…

- [ ] Explain why RAGorbit converts audio/image to text before indexing (in the dominant pattern).
- [ ] Differentiate STT streaming (`io.stt`/Deepgram) vs STT batch (local Whisper).
- [ ] Describe what `model.vision` adds in templates 04 and 08.
- [ ] Justify when to use vision→text vs direct multimodal embeddings.
- [ ] Name alternatives to Whisper, GPT-4o, and DALL·E with one trade-off each.
- [ ] Implement a scratch pipeline that merges mock transcript + mock description and retrieves with hard filters.
- [ ] Map each scratch mock function to its real API (table §10.1).
- [ ] Explain why `citations` remains mandatory even when input is multimodal.
- [ ] Read template 07 `flow.json` and identify where `io.stt` enters.
- [ ] Read template 08 `flow.json` and identify `model.vision` + `loader.multimodal`.

**If you cannot:** review §3–§5 (STT and vision), §10 (framework), and [lab/enunciado.md](lab/enunciado.md). Compare the three anchor templates in `examples/`.

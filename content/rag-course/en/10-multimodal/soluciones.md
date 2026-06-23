# M10 · Solutions — Multimodal

---

## Exercise 14 · Multimodal or text only?

**(a) Multimodal (STT).** Input is real-time audio; you need `io.stt` to convert speech to text before RAG.

**(b) Text only.** The channel is already text; a standard RAG pipeline (M1–M4) is enough.

**(c) Multimodal (vision).** The PDF is text, but damage photos require `model.vision` or `loader.multimodal` with `describeImages: true` to extract visual information.

**(d) Text only.** The technician types the query; there is no audio or image signal at input.

**(e) Multimodal (vision).** The invoice photo contains visual information (table, amounts) that requires vision or OCR+layout; the text question merges with the extracted description.

---

## Exercise 15 · Choose the technology — STT

**A → Deepgram.** Latency < 500 ms streaming, high volume, API acceptable — typical template 07 case.

**B → Local Whisper.** Total privacy (data stays local), moderate volume, overnight batch tolerates high latency.

**C → Amazon Transcribe Streaming.** AWS required, streaming < 1 s, native integration with AWS stack.

Whisper API would be second choice for B if there is no local GPU but batch API is allowed.

---

## Exercise 16 · Whisper vs io.stt

**(a) Answer: 3.** Whisper processes full files (batch); Deepgram offers streaming with very low latency, required for copilot < 1.5 s.

Whisper does support Spanish (rules out 1), does produce timestamps (rules out 2), and Whisper is open-weights, not Deepgram (rules out 4).

**(b)** In an **offline batch process** indexing historical call recordings (not the real-time panel). Also acceptable in a post-processing step that does not block the human agent.

---

## Exercise 17 · Predict the output — mock STT

```
Audio desconocido: 'AUDIO-INEXISTENTE'
Técnico en rampa. Detectamos fuga de flui
```

The first line comes from `get("error", "OK")` when `audio_ref` does not match. The second is the first 40 characters of the transcript.

---

## Exercise 18 · Find the bug — filters

**Bug:** does not apply **hard filters** by `aircraft_type` or `ata_chapter` before scoring.

**Minimal patch:**

```python
for chunk in corpus:
    meta = chunk["metadata"]
    if meta.get("aircraft_type") != aircraft_type:
        continue
    if str(meta.get("ata_chapter")) != str(ata_chapter):
        continue
    # ... resto del scoring
```

Without this, the B737 chunk can score high on shared terms ("tren de aterrizaje", "32-11-00").

---

## Exercise 19 · Vision and loader.multimodal

**(a) Answer: 2.** `describeImages: true` produces textual descriptions of figures/diagrams, indexable as text chunks in the vector store.

**(b)** `sectionScheme: ATA` labels chunks with ATA chapter/section (`32-11-00`), enabling `hardFilters` in `retrieval.vector` — retrieve only procedures from the correct chapter and aircraft.

**(c)** When figures are **purely decorative** (logos, icons) with no technical information — they add cost and latency without improving retrieval.

---

## Exercise 20 · Tables → JSON

**(a)** JSON preserves **structure** (key `Colisión` → `500`) that `logic.rules` can read deterministically. Plain text forces the LLM to interpret numbers — inconsistent and not auditable.

**(b)** `logic.rules` — applies deductibles, exclusions, and thresholds without delegating to the LLM (template 04).

---

## Exercise 21 · Multimodal embeddings

**Choice: A (CLIP).** Direct visual similarity search without intermediate description.

**What you lose in regulated insurance:**
- **Auditability** — no citable text explaining why two photos are "similar".
- **Explainability** for the adjuster and regulatory audit.
- **Integration with policy clauses** (text) — CLIP does not connect visual damage with contractual articles.

That is why the RAGorbit pattern (vision→text→RAG with citations) is preferred in template 04.

---

## Exercise 22 · TTS and DALL·E

**(a)** Bidirectional voice bot: STT input + LLM + **TTS output** (IVR, spoken assistant). Also accessibility when the user cannot read the screen.

**(b)** DALL·E **generates** synthetic images — it is not evidence of real damage. In MRO/insurance you must cite documents and **real** photos; generating an illustration would be misleading in audit.

**(c)** Stable Diffusion XL (local), Flux, Midjourney API (commercial alternatives).

---

## Exercise 23 · Merging signals

**Preferable: concatenate into a single query** (like the lab).

Reasons:
- A single scoring space captures terms from **both** modalities (e.g. "Skydrol" only in image, "32-11-00" only in voice).
- Union of two independent retrievals can **duplicate** chunks, give unequal weights, or lose terms that appear in only one modality if top-k is small per branch.
- Simpler to debug and align with template 08 (one enriched query).

Union problem: if each branch returns top-2, you can have 4 chunks with redundancy; if transcript retrieves the wrong chunk (NLG) and image the correct one (MLG), the union does not prioritize the most relevant globally.

---

## Exercise 24 · Cost and latency

**Order lowest → highest marginal cost:**

1. **M10 lab scratch** — zero cost (stdlib, mocks).
2. **Local Whisper + local LLaVA + local embeddings** — GPU/CPU infra cost, no per-token API.
3. **Deepgram + GPT-4o vision + GPT-4o-mini RAG** — mid-tier APIs.
4. **Whisper API + Claude Opus vision + Claude Sonnet RAG** — premium APIs.

**Viable without network in the course:** only the **scratch (option 3 in the exercise list, #1 in cost)** — exercise option 3 (JSON mocks + BoW).

---

## Exercise 25 · Template 07 — intent gate

**(a)** Greetings ("buenos días"), confirmations ("ajá", "ok"), silence transcribed as noise, filler ("ehh", "un momento"), short goodbyes.

**(b)** In streaming **many** partial fragments arrive; without the gate each would trigger RAG ($$$ and latency). In batch you process a complete, cleaned transcript.

**(c)** **API cost** (LLM + retrieval) and **panel latency** — more unnecessary RAG calls; the human agent sees irrelevant suggestions.

---

## Exercise 26 · HITL and severity_hint

**(a)** `hitl.escalate` — in template 08 escalates to certified inspector when there is WARNING/CAUTION.

**(b)** **Rule on `severity_hint`** (or `warning_level` in chunk metadata). The LLM can omit or soften WARNING; in regulated domains escalation must be **deterministic** (M5/M9: do not delegate critical thresholds to the LLM).

---

## Exercise 27 · Empty citations bug

**Wrong:** `citations` stays empty even though chunks have `source`.

**One-line fix:**

```python
"citations": [c["source"] for c in chunks],
```

Or at least `"citations": [chunks[0]["source"]]`.

---

## Exercise 28 · watsonx / Granite / HF

**(a) Answer: 2.** Granite Vision on watsonx or on-prem LLaVA process images without sending to OpenAI. DALL·E generates images, does not analyze (1). OCR alone loses complex layout (3). Deepgram is STT, not vision (4).

**(b)** Possible **lower quality** on dense tables and technical diagrams vs GPT-4o; greater **ops** effort (GPU, model updates).

---

## Exercise 29 · Design flow.json

Valid example:

```
[audio_in] io.stt ──Message──▶ [query_fusion]
[foto_in]  model.vision ──Model──▶ [loader o fusion]
[store] retrieval.vector ◀── Query (hardFilters: aircraft_type, ata_chapter)
retrieval.vector ──Chunks──▶ logic.citations ◀── Message (LLM)
logic.citations ──Message──▶ hitl.escalate (when: WARNING)
hitl.escalate ──Any──▶ io.output (format: json)
```

Minimum edges:
- `io.stt` → `Message` → fusion/query node
- `model.vision` → `Model` → loader or logic
- `retrieval.vector` → `Chunks` → `logic.citations`
- `logic.citations` → `Message` → `hitl.escalate`
- `hitl.escalate` → `io.output`

---

## Exercise 30 · IBM Coursera

**(a)** **STT/Whisper in depth**, image/audio generation (DALL·E, Sora, TTS), multimodal embeddings, HF/watsonx/Granite comparison — M2 only introduces `loader.multimodal` at ingestion.

**(b)** **Production:** hardcoded HITL, hard filters as guardrails, mandatory citations in regulated domains, deterministic mocks without network, connection with 10 industry templates and `flow.json` design.

---

## Exercise 31 · Trace the lab pipeline

1. **Input:** `audio_notificacion.json` (voice transcript), `foto_fuga.json` (image description + A320/ATA 32 metadata).

2. **Fused query:** full transcript + image description + labels (`hydraulic fluid leak`, `A320 main landing gear`).

3. **Retrieved chunks:** `amm-32-11-00-001` (score 0.4356), `amm-32-11-00-200-001` (score 0.3167). B737 does not appear.

4. **JSON output:** `transcript`, `image_description`, `retrieved_chunks`, `answer`, `citations` = `["AMM-A320#32-11-00#rev45", "AMM-A320#32-11-00-200-001#rev45"]`, `escalate_hitl` = `true`.

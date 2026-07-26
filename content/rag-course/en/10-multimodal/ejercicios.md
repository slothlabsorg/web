# M10 · Exercises — Multimodal

> **Instructions:** Answer without looking at the solutions. For code exercises, write your answer before running it.
>
> Reasoned answers are in `soluciones.md`.

---

## Exercise 14 · Multiple choice — Multimodal or text only?

For each scenario, indicate whether you need a multimodal pipeline (STT and/or vision) or text alone is enough, and justify in one sentence.

**(a)** Telecom call center: the human agent receives suggestions while the customer speaks on the phone.

**(b)** HR web chat where employees ask about vacation policies in text.

**(c)** Insurance adjuster receives a folder with a digital policy PDF (selectable text) and 3 photos of vehicle damage.

**(d)** MRO technician queries an AMM procedure by typing "MLG A320 inspection 32-11-00" in a web form.

**(e)** WhatsApp bot where users send a photo of an invoice with the question "is this charge correct?"

---

## Exercise 15 · Choose the technology — STT

**Type: choose the technology (ET)**

| Scenario | Target latency | Privacy | Volume |
|-----------|-------------------|------------|---------|
| A | < 500 ms streaming | API acceptable | 10 000 h/month |
| B | Hours (overnight batch) | Data does not leave datacenter | 200 h/month |
| C | < 1 s | AWS required | 5 000 h/month |

For each scenario A, B, and C, choose among: **Local Whisper**, **Deepgram**, **OpenAI Whisper API**, **Amazon Transcribe Streaming**. Justify.

---

## Exercise 16 · Whisper vs io.stt

**Type: reasoned multiple choice**

Template 07 uses `io.stt` with `provider: deepgram`, not local Whisper.

**(a)** What is the main reason?

1. Whisper does not support Spanish.
2. Whisper does not produce timestamps.
3. Whisper processes full files; Deepgram streams with latency < 300 ms.
4. Deepgram is open-weights and Whisper is closed.

**(b)** In which part of template 07 would it be acceptable to replace Deepgram with local Whisper without breaking the 1.5 s SLA?

---

## Exercise 17 · Predict the output — mock STT

Given this code from lab M10:

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    if audio_ref and audio_ref != data["audio_id"]:
        return {"error": f"Unknown audio: {audio_ref!r}"}
    return {"transcript": data["transcript"], "language": data["language"]}

print(transcribe_audio("AUDIO-INEXISTENTE").get("error", "OK"))
print(transcribe_audio("AUDIO-MLG-001")["transcript"][:40])
```

Assuming `audio_notificacion.json` contains `"audio_id": "AUDIO-MLG-001"` and a transcript that starts with "Ramp technician", what does the script print?

---

## Exercise 18 · Find the bug — retrieval filters

A student implemented multimodal retrieval but gets B737 chunks for an A320 query:

```python
def retrieve_chunks(query, aircraft_type, ata_chapter, top_k=2):
    corpus = _load("amm_chunks.json")["chunks"]
    query_vec = Counter(_tokenize(query))
    scored = []
    for chunk in corpus:
        chunk_vec = Counter(_tokenize(chunk["text"]))
        score = _cosine_similarity(query_vec, chunk_vec)
        scored.append((score, chunk))
    scored.sort(key=lambda x: -x[0])
    return [c for s, c in scored[:top_k]]
```

Chunk `amm-b737-32-11-001` appears in top-2. What is the bug? Write the minimal patch.

---

## Exercise 19 · Vision and loader.multimodal

**Type: reasoned multiple choice**

In template 08, `model.vision` connects to `loader.multimodal` with `sectionScheme: ATA`.

**(a)** What does `loader.multimodal` produce when `describeImages: true`?

1. Image embeddings directly in pgvector.
2. Textual description of each figure/diagram, indexable as a text chunk.
3. Regenerated PNG file with annotations.
4. JSON of bounding box coordinates without text.

**(b)** Why does `sectionScheme: ATA` matter for subsequent retrieval?

**(c)** When would you NOT enable `describeImages` on an AMM PDF?

---

## Exercise 20 · Tables → JSON

**Context:** Template 04 (insurance). The policy has a deductible table:

```
| Coverage    | Deductible USD |
| Collision   | 500            |
| Theft       | 1000           |
```

`loader.multimodal` with `extractTables: true` converts this to JSON.

**(a)** Why is structured JSON preferable to plain text "Collision 500 Theft 1000" for `logic.rules`?

**(b)** Name one RAGorbit node that consumes that JSON without delegating thresholds to the LLM.

---

## Exercise 21 · Multimodal embeddings

**Type: choose the technology (ET)**

You have 50,000 indexed damage photos and want to search "vehicles with side-door dent similar to this photo" without generating an intermediate textual description.

Options:
- A) CLIP embeddings + visual similarity search
- B) GPT-4o describes each photo → text-embedding-3 → pgvector
- C) BM25 over filenames

Choose A, B, or C. What do you lose with A in a regulated insurance context?

---

## Exercise 22 · TTS and DALL·E generation

**(a)** In which course case does it make sense to add TTS at the end of the pipeline?

**(b)** Why does lab M10 not use DALL·E to "generate evidence" of MLG damage?

**(c)** Name two open/local alternatives to DALL·E 3 for image generation.

---

## Exercise 23 · Merging multimodal signals

**Type: predict output / design**

You have:
- Transcript: "hydraulic leak in A320 MLG actuator"
- Image description: "active Skydrol drop on retraction actuator"

One teammate runs **two** separate retrievals (transcript only, description only) and takes the union of results. Another concatenates both into a single query (like the lab).

Which approach is preferable for template 08 and why? What problem can the union of two independent retrievals have?

---

## Exercise 24 · Cost and latency

Order from **lowest to highest marginal cost per query** (one 15 s voice note + one photo):

1. Local Whisper + local LLaVA + RAG with local embeddings
2. Deepgram + GPT-4o vision + GPT-4o-mini RAG
3. M10 lab scratch (JSON mocks + BoW)
4. Whisper API + Claude Opus vision + Claude Sonnet RAG

Justify the order. Which is viable in the course environment (no network)?

---

## Exercise 25 · Template 07 — intent gate

In template 07, after `io.stt` comes `model.intent` with label `non_actionable`.

**(a)** Which audio fragments does it typically classify as `non_actionable`?

**(b)** Why is this gate especially important in an STT streaming pipeline (vs batch)?

**(c)** If you remove `model.intent`, which production metric worsens first?

---

## Exercise 26 · HITL and severity_hint

In lab M10, `foto_fuga.json` has `"severity_hint": "WARNING"` and the scratch returns `"escalate_hitl": true`.

**(a)** Which RAGorbit node from template 08 corresponds to this escalation?

**(b)** Should the LLM decide whether to escalate based only on the generated response, or is a rule on `severity_hint` better? Justify.

---

## Exercise 27 · Find the bug — empty citations

```python
def generate_answer(transcript, vision, chunks):
    if not chunks:
        return {"answer": "No procedure found.", "citations": []}
    text = chunks[0]["text"]
    return {
        "answer": f"According to the manual: {text}",
        "citations": [],  # pending: fill later
    }
```

The pipeline passes "non-empty response" tests but fails FAA audit. What is wrong and how do you fix it in one line?

---

## Exercise 28 · watsonx / Granite / HF

**Type: multiple choice**

A bank wants vision over mortgage documents without sending images to public OpenAI APIs.

**(a)** Which option is most coherent?

1. Local DALL·E 3
2. Granite Vision on watsonx or LLaVA on Ollama on-prem
3. Remove vision and rely on PDF OCR
4. Deepgram for images

**(b)** What trade-off do you accept vs GPT-4o?

---

## Exercise 29 · Design flow.json (conceptual)

Draw in text (ASCII) a mini RAGorbit flow with these nodes for lab M10:

- `io.stt` (or batch audio input)
- `model.vision`
- `retrieval.vector` with hardFilters
- `logic.citations`
- `hitl.escalate`
- `io.output` format json

Indicate at least 6 edges with port types (`Message`, `Model`, `Chunks`…).

---

## Exercise 30 · IBM Coursera comparison

According to [`referencia/cobertura-ibm-coursera.md`](../referencia/cobertura-ibm-coursera.md), the IBM "Multimodal" course covers Whisper, DALL·E, Sora, HF, watsonx, and Granite.

**(a)** Which IBM Coursera topic does this M10 module cover that M2 only touches superficially?

**(b)** What production extra does this course add that the IBM program does not emphasize? (Hint: HANDOFF §11 extras.)

---

## Exercise 31 · Trace the lab pipeline

Trace the 4 steps of `solucion_scratch.py` for the workshop scenario (A320 MLG leak):

1. Input (which mock files).
2. Fused query (what text is built).
3. Retrieved chunks (expected ids and scores).
4. JSON output (required fields and value of `escalate_hitl`).

You do not need to run the code — use `expected.md` if you remember it, or reason from the lab brief.

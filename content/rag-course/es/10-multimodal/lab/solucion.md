# Solución del Lab M10 — Pipeline multimodal MRO

---

## Capa ② — Solución desde cero (`solucion_scratch.py`)

### Arquitectura del pipeline

```
audio_notificacion.json          foto_fuga.json
        │                               │
        ▼                               ▼
 [transcribe_audio]            [describe_image]
   (mock io.stt)                 (mock model.vision)
        │                               │
        └───────────┬───────────────────┘
                    ▼
            [_build_query]  ← combina transcript + descripción + labels
                    │
                    ▼
         [retrieve_chunks]  ← BoW + coseno + hard-filters
                    │
                    ▼
          [generate_answer]  ← plantilla determinista + citations
                    │
                    ▼
              JSON de salida
```

### Mock STT — por qué un JSON y no un `.wav`

En producción, `io.stt` recibe bytes de audio y llama a Deepgram (streaming) o Whisper (batch). En el entorno del curso no hay red ni modelos descargables, así que el mock **separa el contrato de la implementación**:

- **Entrada:** referencia al audio (`AUDIO-MLG-001`).
- **Salida:** `transcript`, `segments`, `language` — exactamente lo que necesita el resto del pipeline.

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    return {"transcript": data["transcript"], "segments": data["segments"], ...}
```

El pipeline downstream **no sabe** si el texto vino de Whisper o de un JSON. Ese desacoplamiento es el mismo que usa RAGorbit con mocks en `ragorbit/runtime/`.

### Mock visión — metadata ATA como guardrail

La descripción de imagen no es solo texto libre: incluye `aircraft_type`, `ata_chapter`, `ata_section` y `severity_hint`. Esos campos alimentan:

1. **Filtros duros** en retrieval (solo chunks del A320, capítulo 32).
2. **Escalación HITL** si `severity_hint == "WARNING"` (como `hitl.escalate` del template 08).

### Retrieval multimodal — query enriquecida

La query no es solo el transcript. Combina tres fuentes:

```python
def _build_query(transcript: str, vision: dict) -> str:
    labels = " ".join(e["label"].replace("_", " ") for e in vision["detected_elements"])
    return f"{transcript} {vision['description']} {labels}"
```

Esto simula lo que harías en producción: concatenar texto de voz + descripción visual + entidades detectadas antes de embeddear/recuperar.

Los **filtros duros** se aplican *antes* de puntuar — igual que `retrieval.vector` con `hardFilters` en el template 08:

```python
if meta.get("aircraft_type") != aircraft_type:
    continue
if str(meta.get("ata_chapter")) != str(ata_chapter):
    continue
```

Sin esto, el chunk de B737 (`amm-b737-32-11-001`) podría colarse por similitud léxica en "tren de aterrizaje".

### Generación con citas — plantilla determinista

`generate_answer` no llama a un LLM real. Construye la respuesta citando explícitamente cada `source` de los chunks recuperados. Si `chunks` está vacío, devuelve `"No determinable"` — el mismo patrón de M5 (`logic.structured` sin evidencia).

---

## Capa ③ — Solución con frameworks (`solucion_framework.py`)

> **Antes de leer:** intenta escribir el archivo siguiendo [guia.md §10](../guia.md#10-la-capa--explicada-whisper-visión-y-generación-desde-cero).

### Tabla puente scratch → framework

| Scratch (②) | Framework (③) | Función |
|-------------|---------------|---------|
| Leer `audio_notificacion.json` | `whisper.load_model().transcribe()` | STT |
| Leer `foto_fuga.json` | `client.chat.completions.create` con imagen base64 | Visión |
| BoW + coseno en memoria | `FAISS` + `OpenAIEmbeddings` | Retrieval |
| Plantilla determinista | `ChatOpenAI` + prompt con citas | Generación |
| — | `client.audio.speech.create` | TTS (salida) |
| — | `client.images.generate` | DALL·E (salida) |

### Modo degradado con mocks

`run_multimodal_pipeline_real(..., use_mocks_if_missing=True)` permite probar retrieval + generación aunque no tengas `.wav`/`.jpg` reales — cae a los JSON del lab para STT y visión, pero usa APIs reales para embeddings y LLM.

### Gotchas en producción

1. **Whisper `base` en CPU** puede tardar 10–30 s por minuto de audio. Para call center en tiempo real usa Deepgram (`io.stt` del template 07).
2. **Visión por imagen** cuesta ~$0.01–0.03 por foto (GPT-4o). En batch de siniestros (template 04) el costo escala con el número de fotos.
3. **Filtros en FAISS** requieren metadata indexada correctamente en ingesta — si `aircraft_type` no está en metadata, el filtro falla silenciosamente.

---

## Conexión con RAGorbit

Este pipeline corresponde a este subgrafo:

```
io.stt ──Message──▶┐
                   │  (query enriquecida)
model.vision ──Model──▶ loader.multimodal / lógica de fusión
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
         hitl.escalate (si WARNING)
```

Ver [`examples/08-manufacturing-maintenance-rag/flow.json`](../../examples/08-manufacturing-maintenance-rag/flow.json) para el wiring completo con `loader.multimodal` + `model.vision`.

---

## Lecciones del taller

1. **Multimodal = fusionar señales antes de recuperar.** No transcribas y recuperes solo con voz; la imagen aporta entidades (MLG, fuga, Skydrol) que mejoran el recall.
2. **Los mocks deterministas enseñan el contrato.** El JSON de transcript/descripción es tan válido para aprender como un `.wav` real — la API real solo cambia el paso 1.
3. **Filtros duros + multimodal:** la metadata visual (`aircraft_type`, `ata_chapter`) puede actuar como guardrail de retrieval sin delegar al LLM.
4. **Citas obligatorias en dominios regulados:** MRO, seguros y salud exigen anclaje documental; el campo `citations` no es decorativo.

# Lab M10 · Pipeline multimodal — voz + imagen + RAG con citas

## Brief de negocio

Eres ingeniero en una empresa de **MRO aeronáutico** (mantenimiento, reparación y overhaul). Los técnicos de línea en rampa reportan incidencias de dos formas simultáneas:

1. **Nota de voz** grabada desde el móvil (audio).
2. **Fotografía** del componente afectado (imagen).

El copiloto multimodal debe:

1. **Transcribir** la nota de voz a texto.
2. **Entender** la fotografía (descripción estructurada + metadata ATA).
3. **Recuperar** el procedimiento correcto del AMM (Aircraft Maintenance Manual).
4. **Responder citando** las secciones del manual — nunca sin anclaje documental.
5. Si detecta **WARNING/CAUTION**, marcar escalación HITL (como el template 08).

Este patrón combina:
- **STT** del template [07-telecom-callcenter-copilot](../../examples/07-telecom-callcenter-copilot/) (`io.stt`).
- **Visión** del template [04-insurance-claims](../../examples/04-insurance-claims/) y [08-manufacturing-maintenance-rag](../../examples/08-manufacturing-maintenance-rag/) (`model.vision`, `loader.multimodal`).
- **RAG con filtros duros** del template 08 (`retrieval.vector` + `aircraft_type` + `ata_chapter`).

## Datos disponibles

En `lab/datos/`:

| Archivo | Qué representa | En producción sería… |
|---------|----------------|----------------------|
| `audio_notificacion.json` | Transcript fijo de una nota de voz | Salida de Whisper / Deepgram sobre un `.wav` |
| `foto_fuga.json` | Descripción fija + metadata ATA de una foto | Salida de `model.vision` sobre un `.jpg` |
| `amm_chunks.json` | Fragmentos indexados del AMM A320 | Chunks en `store.pgvector` tras ingesta multimodal |

> **Restricción del entorno del curso:** no hay red ni pip. Los JSON mock son **deterministas** — el scratch lee texto fijo en lugar de procesar binarios reales.

## Escenario de prueba

Un técnico reporta:

- **Voz:** fuga de fluido hidráulico en el actuador del MLG de un A320; pregunta por el procedimiento AMM 32-11-00.
- **Imagen:** fuga activa de Skydrol en el actuador de retracción del MLG izquierdo.
- **Severidad visual:** `WARNING`.

El sistema debe recuperar los chunks `amm-32-11-00-001` y `amm-32-11-00-200-001` (no el chunk de B737 ni el de NLG) y responder citando ambas fuentes.

## Tarea

### Parte A — Pipeline desde cero (capa ②)

Implementa `lab/solucion_scratch.py` con:

1. **`transcribe_audio(audio_ref)`** — lee `audio_notificacion.json` y devuelve el transcript (mock STT).

2. **`describe_image(image_ref)`** — lee `foto_fuga.json` y devuelve descripción + metadata (mock visión).

3. **`retrieve_chunks(query, aircraft_type, ata_chapter, top_k=2)`** — bag-of-words + similitud coseno sobre `amm_chunks.json` con **filtros duros** por `aircraft_type` y `ata_chapter`.

4. **`generate_answer(transcript, vision, chunks)`** — LLM fake determinista que sintetiza respuesta con `citations` no vacío (o "no determinable" si no hay chunks).

5. **`run_multimodal_pipeline()`** — orquesta los 4 pasos y devuelve JSON con:
   - `transcript`
   - `image_description`
   - `retrieved_chunks`
   - `answer`
   - `citations`
   - `escalate_hitl`

6. **`main()`** — imprime las 4 etapas y el JSON final; verifica con `assert` las propiedades de `expected.md`.

**Restricciones:** solo stdlib. Sin `random`, sin red, sin pip. Debe ser **determinista**.

### Parte B — Pipeline con frameworks reales (capa ③, tarea guiada)

> **Lee primero:** [guia.md §10 — La capa ③ explicada](../guia.md#10-la-capa--explicada-whisper-visión-y-generación-desde-cero). No copies `solucion_framework.py` de golpe.

**Requisitos de entorno** (fuera de la máquina del curso):

```bash
pip install openai-whisper openai langchain langchain-openai pillow
export OPENAI_API_KEY="sk-..."
```

#### Paso B.1 — STT con Whisper

1. Implementa `transcribe_with_whisper(audio_path)` con `whisper.load_model("base").transcribe(...)`.
2. Compara la salida con el transcript mock del lab.

#### Paso B.2 — Visión con GPT-4o

1. Implementa `describe_image_with_vision(image_path)` enviando la imagen en base64.
2. Pide salida JSON con `aircraft_type`, `ata_chapter`, `description`, `severity_hint`.

#### Paso B.3 — Retrieval con LangChain + FAISS

1. Carga `amm_chunks.json` como `Document` de LangChain.
2. Indexa con `OpenAIEmbeddings` + `FAISS`.
3. Recupera con filtro `aircraft_type=A320`, `ata_chapter=32`.

#### Paso B.4 — Generación + citas

1. Usa `ChatOpenAI` con prompt que exige citas.
2. Devuelve el mismo schema JSON que el scratch.

#### Paso B.5 — (Opcional) TTS y DALL·E

1. `synthesize_tts()` — convierte la respuesta a audio.
2. `generate_image_dalle()` — genera ilustración del procedimiento.

## Pistas escalonadas

### Pista 1 — Mock STT

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    return {"transcript": data["transcript"], ...}
```

### Pista 2 — Query multimodal

Combina transcript + descripción de imagen + labels detectados:

```python
query = f"{transcript} {vision['description']} hydraulic fluid leak"
```

### Pista 3 — Filtro duro antes de puntuar

```python
if meta["aircraft_type"] != aircraft_type:
    continue
if str(meta["ata_chapter"]) != str(ata_chapter):
    continue
```

### Pista 4 — Citas obligatorias

```python
citations = [c["source"] for c in chunks]
if not citations:
    return {"answer": "No determinable...", "citations": []}
```

## Criterios de aceptación

1. `python3 -m py_compile lab/solucion_scratch.py` sin errores.
2. `python3 lab/solucion_scratch.py` imprime JSON con `transcript`, `image_description`, `citations` no vacío.
3. `citations` incluye `AMM-A320#32-11-00#rev45`.
4. Chunks recuperados: solo A320 capítulo 32 (no B737).
5. `escalate_hitl` es `true`.
6. Solo stdlib en el scratch.

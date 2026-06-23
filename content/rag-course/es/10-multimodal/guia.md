# Módulo 10 · Multimodal — Voz, visión y generación (`io.stt`, `model.vision`)

> **Prerequisito:** M1–M6 (LLMs, ingesta, retrieval, generación con citas, agentes). M2 cubre `loader.multimodal` en ingesta; este módulo profundiza en **entrada y salida** multimodal.
>
> **Nodos RAGorbit:** `io.stt`, `model.vision`, `loader.multimodal`, `model.llm` (multimodal)
>
> **Templates ancla:** `07-telecom-callcenter-copilot` (STT streaming), `04-insurance-claims` (visión en siniestros), `08-manufacturing-maintenance-rag` (AMM + diagramas ATA)

---

## 1. Qué es "multimodal" y por qué importa en RAG

Un sistema **multimodal** procesa más de un tipo de señal: texto, voz, imagen, video, tablas escaneadas. En RAG y agentes, el objetivo no es "ver bonito" — es **convertir esas señales en texto estructurado** que el resto del pipeline (retrieval, generación, reglas) ya sabe manejar.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PIPELINE MULTIMODAL TÍPICO                       │
│                                                                     │
│  Audio (.wav)  ──▶ [STT] ──▶ texto                                 │
│  Imagen (.jpg) ──▶ [Visión] ──▶ descripción + metadata              │
│  PDF con fotos ──▶ [loader.multimodal] ──▶ chunks enriquecidos     │
│                                                                     │
│         texto + descripciones + metadata                            │
│                    │                                                │
│                    ▼                                                │
│            [Retrieval / RAG / Agente]                               │
│                    │                                                │
│                    ▼                                                │
│  Respuesta texto ◀─┴──▶ [TTS] ──▶ audio (opcional)                 │
│              └──▶ [DALL·E/SDXL] ──▶ imagen (opcional)               │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 ¿Cuándo usar multimodal?

**Usa entrada multimodal cuando:**
- El usuario **habla** (call center, asistente de voz, dictado en rampa).
- Los documentos incluyen **diagramas, fotos o tablas** cuya información no está en el texto OCR.
- Necesitas **clasificar daños** en fotos (seguros, inspección industrial).
- El canal de entrada es **foto + pregunta** (WhatsApp con imagen de factura).

**NO uses multimodal cuando:**
- Todo el contenido relevante ya está en **texto limpio** (PDF digital, Markdown, SQL).
- La latencia es crítica (<500 ms) y puedes pedir al usuario que **escriba** en lugar de hablar o fotografiar.
- El costo por consulta importa y la señal visual **no aporta** información nueva (logo decorativo en un PDF).

### 1.2 El patrón RAGorbit: convertir → recuperar → citar

RAGorbit no indexa píxeles ni ondas de audio directamente en el vector store (salvo embeddings multimodales especializados). El patrón dominante es:

1. **Convertir** audio/imagen a texto (STT, visión).
2. **Enriquecer** con metadata (ATA chapter, tipo de daño, idioma).
3. **Recuperar** con el texto fusionado + filtros duros.
4. **Generar** con citas obligatorias (M5).

---

## 2. Retos del multimodal en producción

| Reto | Qué significa | Mitigación |
|------|---------------|------------|
| **Alineación** | Voz e imagen deben referirse al mismo incidente | IDs de sesión; timestamp; fusionar en una sola query |
| **Latencia** | STT streaming + visión + RAG puede superar 3 s | STT streaming (Deepgram); visión async; cache de descripciones |
| **Costo** | Visión ~$0.01–0.03/img; Whisper API por minuto | Batch offline con Whisper local; comprimir imágenes |
| **Idiomas** | Whisper multilingüe ≠ todos los acentos | `language` hint; fine-tune o modelo regional |
| **Formatos** | Codecs de audio, HEIC, PDF escaneado | Normalizar en ingesta (`loader.multimodal`) |
| **Alucinación visual** | El modelo "ve" daños que no existen | Citas al AMM; HITL en WARNING; reglas sobre metadata |
| **PII en audio/imagen** | Voces, placas, rostros en fotos | Redacción pre-STT; blur en pipeline de ingesta |

```
Latencia típica (copilot call center, template 07):
  Deepgram STT (streaming)     ~300–800 ms
  model.intent                  ~10 ms
  retrieval + rerank            ~200–400 ms
  logic.prompt + citations      ~500–1500 ms
  ─────────────────────────────────────────
  Total objetivo:               < 1.5 s desde fin de frase
```

---

## 3. STT — Speech-to-Text y el nodo `io.stt`

### 3.1 Qué hace

**STT** convierte audio en texto. En RAGorbit, el nodo `io.stt` produce fragmentos `Message` **en streaming** conforme llega el audio — no espera a que el usuario termine de hablar.

Ver ficha completa: [`referencia/catalogo-nodos.md` §io.stt](../referencia/catalogo-nodos.md#iostt).

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

| Modo | Cuándo | Ejemplo |
|------|--------|---------|
| **Streaming** | Tiempo real, copilot, IVR | Template 07: fragmento de llamada → sugerencia en panel |
| **Batch** | Grabación completa, post-proceso | Nota de voz de técnico en rampa → transcript → RAG |

En batch, Whisper local es la opción de referencia (open-weights, sin costo por token). En streaming, **Deepgram Nova-2** o Amazon Transcribe Streaming dominan por latencia.

### 3.3 Cuándo NO usar `io.stt`

- Si ya tienes el transcript (archivo `.txt`, subtítulos, CRM).
- Si el audio se procesa en lote nocturno — usa Whisper como paso de `io.batch` o `tool.function`.

---

## 4. Whisper — el modelo de referencia para STT offline

**Whisper** (OpenAI, open-weights) es el estándar para transcripción multilingüe offline. Modelos: `tiny`, `base`, `small`, `medium`, `large` — más grande = mejor calidad, más lento.

```python
# Conceptual — ver §10 para implementación completa
import whisper
model = whisper.load_model("base")
result = model.transcribe("nota_tecnico.wav", language="es")
print(result["text"])
```

### 4.1 Fortalezas

- **Multilingüe** sin fine-tune (99 idiomas).
- **Open-weights** — corre local vía Hugging Face, Ollama, `pip install openai-whisper`.
- **Segmentos con timestamps** — útil para alinear con video o UI de revisión.
- **Costo cero** por token si corre en tu GPU/CPU.

### 4.2 Limitaciones

- **No es streaming real** — procesa el archivo completo (o chunks grandes).
- **Latencia** en CPU: ~10–30× tiempo real con modelo `base`.
- **Ruido de fondo** en rampa/aeropuerto degrada la calidad.

### 4.3 Whisper vs Deepgram

| | Whisper (local) | Deepgram Nova-2 |
|---|---|---|
| **Latencia** | Alta (batch) | Baja (<300 ms streaming) |
| **Costo** | GPU/CPU fijo | ~$0.0043/min |
| **Privacidad** | Datos no salen | Audio va a API |
| **Idiomas** | 99 | 36+ con excelente ES |
| **Caso ideal** | Batch, offline, privado | Call center tiempo real (template 07) |

Ver también: [`referencia/glosario.md` §Whisper](../referencia/glosario.md), [`referencia/glosario.md` §STT](../referencia/glosario.md).

---

## 5. Visión — describir imágenes, diagramas y tablas→JSON

### 5.1 El nodo `model.vision`

**Qué hace:** modelo multimodal que describe imágenes, diagramas y tablas en **texto** para el pipeline RAG. Produce `Model` y se conecta a `loader.multimodal`.

```json
{
  "type": "model.vision",
  "config": {
    "model": "anthropic:claude-opus-4-8",
    "apiKeyRef": "ANTHROPIC_API_KEY"
  }
}
```

Ficha: [`referencia/catalogo-nodos.md` §model.vision](../referencia/catalogo-nodos.md#modelvision).

### 5.2 Casos de uso en los templates

**Template 04 (seguros):** fotos de daño en vehículo → descripción → `logic.rules` + `logic.structured` con cláusula citada.

**Template 08 (manufactura):** diagramas hidráulicos del AMM → texto describiendo componentes → chunks indexables con `sectionScheme: ATA`.

```
PDF del AMM
    │
    ▼
loader.multimodal (extractTables: true, describeImages: true)
    │                    ▲
    │                    │ Model
    └──── model.vision ──┘
    │
    ▼
"Figura 32-11-05: actuador de retracción MLG con puntos de inspección A, B, C..."
    │
    ▼
ingest.chunker → store.pgvector → retrieval con hardFilters (aircraft_type, ata_chapter)
```

### 5.3 Tablas escaneadas → JSON

`loader.multimodal` con `extractTables: true` convierte tablas de tolerancias, deducibles o torque en JSON estructurado — no solo texto plano. Eso permite `logic.rules` deterministas sobre valores numéricos (M5).

### 5.4 Cuándo NO usar visión

- PDF con texto seleccionable (usa `loader.pdf` directo).
- Imágenes decorativas sin información técnica.
- Cuando el costo por documento (cientos de páginas con figuras) excede el presupuesto — considera OCR + layout parser (Unstructured) primero.

### 5.5 Modelos de visión que compiten

| Modelo | Fortaleza | Debilidad |
|--------|-----------|-----------|
| **GPT-4o** | Excelente en diagramas + JSON | Costo API |
| **Claude Opus/GPT-4o** | Razonamiento sobre figuras técnicas | Latencia |
| **Gemini Pro Vision** | Ventana larga, video | Ecosistema Google |
| **LLaVA / Qwen-VL** | Local, open-weights | Calidad inferior en tablas densas |
| **IBM Granite Vision** | Enterprise, watsonx | Curva de integración |
| **Pixtral (Mistral)** | Buen balance EU | Menor ecosistema |

---

## 6. Generación de imagen y audio (salida multimodal)

Hasta ahora cubrimos **entrada** multimodal (audio→texto, imagen→texto). La **generación** convierte texto en imagen o audio — útil para respuestas habladas, ilustraciones o IVR.

### 6.1 Generación de imagen

| Modelo | Tipo | Cuándo usar |
|--------|------|-------------|
| **DALL·E 3** | API OpenAI | Ilustraciones, mockups, diagramas conceptuales |
| **Stable Diffusion XL** | Local/open | Alto volumen, control con LoRA, sin API |
| **Sora** | Video (OpenAI) | Clips cortos, prototipos — costo y latencia altos |
| **Midjourney** | API/discord | Calidad artística |

En RAG de producción, la generación de imagen es **rara** — el valor está en recuperar y citar documentos reales. Se usa más en asistentes creativos o para generar diagramas explicativos *ad hoc*.

### 6.2 TTS — Text-to-Speech

Convierte la respuesta del LLM en audio sintético:

```python
# Conceptual
client.audio.speech.create(model="tts-1", voice="nova", input=respuesta)
```

**Cuándo usar TTS:**
- Bot de voz bidireccional: STT (entrada) + LLM + TTS (salida).
- IVR que lee políticas simplificadas.
- Accesibilidad.

**Alternativas:** ElevenLabs (voces naturales), Amazon Polly, Google Cloud TTS, Coqui TTS (local).

### 6.3 Pipeline de voz completo

```
Usuario habla ──▶ io.stt ──▶ texto ──▶ RAG/agente ──▶ respuesta texto ──▶ TTS ──▶ audio
```

El template 07 implementa solo la mitad izquierda (STT → copilot para agente humano). Un bot de voz cerrado añadiría TTS al final.

---

## 7. Embeddings multimodales y vector DB multimodal

### 7.1 El problema

Los embeddings de texto (M3) no representan imágenes directamente. **Embeddings multimodales** proyectan texto e imagen en el mismo espacio vectorial (o espacios alineados):

- CLIP (OpenAI): imagen ↔ texto
- ImageBind (Meta): imagen, audio, texto, depth…
- Cohere embed-multilingual-v3: texto + imagen en API

### 7.2 Casos de uso

| Caso | Cómo funciona |
|------|---------------|
| Búsqueda "fotos similares a esta descripción" | Embed texto query + comparar con embeddings de imágenes |
| Búsqueda cross-modal | "Encontrar diagramas relacionados con esta foto de daño" |
| Indexación en Weaviate/Milvus multimodal | Módulos nativos para imagen + texto |

### 7.3 ¿Cuándo usar embeddings multimodales vs visión→texto?

| Enfoque | Ventaja | Desventaja |
|---------|---------|------------|
| **Visión → texto → embed texto** (patrón RAGorbit) | Compatible con cualquier vector store; citas sobre texto | Pierde detalle fino; costo de visión en ingesta |
| **Embed imagen directamente** | Búsqueda por similitud visual | Menos interpretable; difícil citar; stores especializados |

Para dominios regulados (MRO, seguros, salud), **visión→texto→RAG con citas** es el patrón preferido porque puedes auditar el texto indexado.

### 7.4 Vector DB con soporte multimodal

**Weaviate** y **Milvus** ofrecen módulos para imagen+texto. **Chroma** y **pgvector** en RAGorbit indexan principalmente texto — la vía natural es describir imágenes en ingesta (`loader.multimodal`).

---

## 8. Comparativa de tecnologías — decisión rápida

### 8.1 STT

| Proveedor | Latencia | Streaming | Privacidad | Mejor para |
|-----------|----------|-----------|------------|------------|
| Whisper local | Alta | No | ✅ Total | Batch, offline, lab |
| Deepgram | Muy baja | ✅ | API | Call center (07) |
| OpenAI Whisper API | Media | No | API | Prototipos rápidos |
| Amazon Transcribe | Media | ✅ | AWS | Stack AWS |

### 8.2 Visión

| Proveedor | Calidad técnica | Local | Mejor para |
|-----------|-----------------|-------|------------|
| GPT-4o | Alta | No | Diagramas, JSON, seguros |
| Claude Opus | Alta | No | Manuales técnicos (08) |
| LLaVA-1.6 | Media | ✅ | Prototipos sin API |
| watsonx Granite Vision | Alta | Híbrido | Enterprise IBM |

### 8.3 Plataformas open (HF / Ollama / watsonx)

- **Hugging Face:** descarga Whisper, LLaVA, CLIP, SDXL; `transformers` + `pipeline`.
- **Ollama:** `ollama run llava` para visión local; Whisper vía bindings.
- **watsonx / Granite:** modelos enterprise con gobernanza; visión + LLM en mismo contrato.

Ver tabla ampliada: [`referencia/tecnologias-comparadas.md`](../referencia/tecnologias-comparadas.md).

---

## 9. Conexión con los templates de industria

### Template 07 · Telecom Copilot — STT en streaming

```
Audio llamada → io.stt (Deepgram) → model.intent → query.rewrite → retrieval.router → io.panel
```

- El STT alimenta fragmentos **parciales**; `model.intent` descarta saludos.
- Latencia objetivo: **< 1.5 s** desde fin de frase.
- Ver [`examples/07-telecom-callcenter-copilot/README.md`](../../examples/07-telecom-callcenter-copilot/README.md).

### Template 04 · Seguros — visión en siniestros

```
io.batch → loader.multimodal (fotos + póliza) → model.vision → logic.rules → logic.structured
```

- Fotos de daño → descripción → reglas de deducible → JSON con `clausula_aplicada`.
- Ver [`examples/04-insurance-claims/README.md`](../../examples/04-insurance-claims/README.md).

### Template 08 · Manufactura MRO — AMM multimodal

```
model.vision → loader.multimodal (sectionScheme: ATA) → retrieval.vector (hardFilters) → hitl.escalate
```

- Diagramas del AMM → texto; filtros por `aircraft_type` y `ata_chapter`.
- WARNING/CAUTION → escalación a inspector.
- Ver [`examples/08-manufacturing-maintenance-rag/README.md`](../../examples/08-manufacturing-maintenance-rag/README.md).

---

## 10. La capa ③ explicada: Whisper, visión y generación desde cero

> **Prerrequisito:** haber implementado la capa ② del taller (`lab/solucion_scratch.py`) o entender cada pieza mock. **Lee esta sección completa** antes de escribir `lab/solucion_framework.py`.
>
> **Entorno:** en la máquina de estudio no hay `pip` ni red. El objetivo es que, cuando tengas `pip install openai-whisper openai langchain langchain-openai` y claves API, puedas **escribir** la solución framework tú mismo.

### 10.1 Tabla puente: mocks del scratch → APIs reales

| Lo que simulaste con mocks (capa ②) | API real (capa ③) | Dónde en el lab |
|-------------------------------------|-------------------|-----------------|
| Leer `transcript` fijo de `audio_notificacion.json` | `whisper.load_model("base").transcribe(audio_path)` | `transcribe_with_whisper()` |
| Leer `description` fija de `foto_fuga.json` | `client.chat.completions.create` con imagen base64 (GPT-4o) | `describe_image_with_vision()` |
| BoW + coseno sobre `amm_chunks.json` | `FAISS` + `OpenAIEmbeddings` + retriever con filtro | `build_retriever()` |
| Plantilla determinista `generate_answer()` | `ChatOpenAI` + prompt con citas obligatorias | `generate_with_llm()` |
| — (no implementado en scratch) | `client.audio.speech.create` (TTS) | `synthesize_tts()` |
| — (no implementado en scratch) | `client.images.generate` (DALL·E 3) | `generate_image_dalle()` |

**Modelo mental:** en scratch los JSON mock **son** la salida de STT/visión. En producción reemplazas solo esas dos funciones; retrieval y generación pueden migrar gradualmente (primero embeddings reales, luego LLM real).

### 10.2 Whisper desde cero — `transcribe_with_whisper`

#### Instalación y carga de modelo

```bash
pip install openai-whisper
# Requiere ffmpeg en el sistema: brew install ffmpeg (macOS)
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

**Qué hace internamente (simplificado):**
1. Convierte audio a espectrograma (mel bins).
2. Encoder Transformer procesa el audio.
3. Decoder genera tokens de texto autoregresivamente.
4. Devuelve texto + timestamps por segmento.

#### Elegir tamaño de modelo

| Modelo | Params | VRAM ~ | Calidad ES | Velocidad CPU |
|--------|--------|--------|------------|---------------|
| tiny | 39M | 1 GB | Básica | Rápida |
| base | 74M | 1 GB | Buena | Media |
| small | 244M | 2 GB | Muy buena | Lenta |
| medium | 769M | 5 GB | Excelente | Muy lenta |

Para notas de técnicos en rampa (ruido, jerga), **`small`** es el mínimo recomendable en producción batch.

#### Gotchas Whisper

1. **No confundir con `io.stt` streaming** — Whisper procesa archivos; para call center usa Deepgram.
2. **`language="es"`** reduce errores vs detección automática en audio corto.
3. **Alucinaciones en silencio** — Whisper puede inventar texto en audio vacío; valida `no_speech_prob` en segmentos.
4. **Primera ejecución descarga el modelo** (~150 MB para `base`) — planifica caché en Docker.

### 10.3 Visión desde cero — `describe_image_with_vision`

#### Patrón OpenAI GPT-4o (el que usa `solucion_framework.py`)

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

#### Patrón LangChain (equivalente)

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

#### Patrón local — LLaVA via Ollama

```bash
ollama pull llava
ollama run llava "Describe esta imagen de tren de aterrizaje" --image foto.jpg
```

#### Gotchas visión

1. **Resolución:** redimensiona a max 2048px — imágenes enormes aumentan costo sin ganar detalle.
2. **JSON mode** (`response_format`) reduce parsing errors en metadata ATA.
3. **Alucinación de daños** — en seguros/MRO, combina con `logic.citations` sobre documentos, no solo la descripción visual.
4. **PII** — fotos pueden tener matrículas, rostros; considera blur previo.

### 10.4 Retrieval y generación — LangChain sobre chunks del AMM

El scratch usa BoW; en framework:

```python
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

docs = [Document(page_content=c["text"], metadata=c["metadata"]) for c in chunks]
store = FAISS.from_documents(docs, OpenAIEmbeddings(model="text-embedding-3-small"))
retriever = store.as_retriever(search_kwargs={"k": 2, "filter": {"aircraft_type": "A320"}})
```

La generación con citas:

```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)
# Prompt: "Responde SOLO con evidencia del AMM. Incluye citations: [...]"
```

### 10.5 TTS y DALL·E — generación de salida

#### TTS (OpenAI)

```python
response = client.audio.speech.create(
    model="tts-1",       # o tts-1-hd para mayor calidad
    voice="nova",        # alloy, echo, fable, onyx, nova, shimmer
    input="Procedimiento AMM 32-11-00: inspeccionar actuador...",
)
response.stream_to_file("respuesta.mp3")
```

**Cuándo usar / NO:**
- ✅ Bot de voz, IVR, accesibilidad.
- ❌ Copilot para agente humano (template 07) — el agente **lee** el panel, no necesita audio.

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

**Cuándo usar / NO:**
- ✅ Material de formación, ilustración conceptual.
- ❌ Evidencia regulatoria — nunca sustituye foto real ni documento AMM citado.

### 10.6 Recorrido bloque a bloque de `lab/solucion_framework.py`

Abre `lab/solucion_framework.py` y sigue este mapa:

#### Bloque 1 — Carga de chunks (líneas ~20–30)

Idéntico al scratch: `amm_chunks.json` alimenta el retriever. Sin sorpresas.

#### Bloque 2 — `transcribe_with_whisper` (líneas ~35–60)

**Puente scratch:** `transcribe_audio()` lee JSON → aquí `whisper.transcribe()` lee `.wav`.

**Detalle:** `fp16=False` en CPU; `language="es"` para notas en español.

#### Bloque 3 — `describe_image_with_vision` (líneas ~65–110)

**Puente scratch:** `describe_image()` lee JSON → aquí GPT-4o sobre base64.

**Detalle:** `response_format={"type": "json_object"}` para metadata ATA estructurada.

#### Bloque 4 — `build_retriever` + `retrieve_with_langchain` (líneas ~115–155)

**Puente scratch:** `retrieve_chunks()` BoW → aquí FAISS con embeddings OpenAI.

**Detalle:** el filtro `{"aircraft_type": "A320", "ata_chapter": "32"}` replica los hard-filters del scratch.

#### Bloque 5 — `generate_with_llm` (líneas ~160–195)

**Puente scratch:** `generate_answer()` plantilla → aquí `ChatOpenAI` con prompt de citas.

#### Bloque 6 — TTS y DALL·E (líneas ~200–240)

No tienen equivalente en scratch — son **salida** multimodal opcional.

#### Bloque 7 — `run_multimodal_pipeline_real` (líneas ~245–290)

Orquesta todo con `use_mocks_if_missing=True`: si no hay `.wav`/`.jpg`, cae a JSON del lab (útil para probar sin grabar audio real).

### 10.7 Cuándo usar cada tecnología — gotchas finales

| Situación | Usa | Evita |
|-----------|-----|-------|
| Call center tiempo real | Deepgram (`io.stt`) | Whisper batch |
| Notas de voz en batch nocturno | Whisper local | Deepgram (costo/min) |
| Fotos de siniestros con JSON | GPT-4o + `response_format` | LLaVA si necesitas precisión en daños |
| Manuales técnicos 1000+ páginas | `loader.multimodal` en ingesta | Visión por cada consulta |
| Bot hablado completo | STT + LLM + TTS | Solo texto si el canal es chat |
| Evidencia regulatoria | Visión→texto→RAG con citas | DALL·E como "prueba" |

**Gotchas de producción:**

1. **Fusionar señales antes de recuperar** — no hagas dos RAG separados (voz vs imagen); une transcript + descripción en una query.
2. **Cache de descripciones de imagen** — la misma foto no debe pasar por visión dos veces; guarda hash→descripción.
3. **Timeouts en cadena** — STT + visión + RAG puede exceder 10 s; paraleliza STT y visión si son independientes.
4. **Formatos de audio** — normaliza a 16 kHz mono WAV antes de Whisper; evita codecs exóticos.
5. **Costo de visión en ingesta batch** — template 04 con 500 fotos/día × $0.02 ≈ $10/día solo en visión.

### 10.8 Checklist antes de escribir tu `solucion_framework.py`

- [ ] ¿`transcribe_with_whisper` usa `language="es"` y `fp16=False` en CPU?
- [ ] ¿`describe_image_with_vision` pide JSON con `aircraft_type`, `ata_chapter`, `severity_hint`?
- [ ] ¿El retriever FAISS aplica filtro `aircraft_type` + `ata_chapter`?
- [ ] ¿El prompt de generación exige `citations` no vacío o "no determinable"?
- [ ] ¿`run_multimodal_pipeline_real` degrada a mocks si faltan archivos binarios?
- [ ] *(Opcional)* ¿`synthesize_tts` genera audio de la respuesta?
- [ ] *(Opcional)* ¿Entiendes por qué DALL·E no sustituye evidencia fotográfica real?

**Siguiente paso:** abre `lab/enunciado.md` (Parte B) e intenta escribir el archivo tú mismo antes de mirar `solucion_framework.py`.

---

## 11. Nodos RAGorbit de este módulo

### `io.stt`

```
Puerto de entrada:  Audio (stream)
Puerto de salida:   Message (fragmentos de texto)
```

Config: `provider: deepgram`, `language: es`. Ver template 07.

### `model.vision`

```
Puerto de salida: Model → (conecta a loader.multimodal o lógica downstream)
```

Config: `model: anthropic:claude-opus-4-8` o `openai:gpt-4o`.

### `loader.multimodal`

```
Puertos: Documents → Documents (enriquecidos)
Entrada Model: model.vision (opcional)
```

Config: `extractTables: true`, `describeImages: true`, `sectionScheme: ATA`.

---

## 12. Checkpoint — Lo sabes si puedes…

- [ ] Explicar por qué RAGorbit convierte audio/imagen a texto antes de indexar (en el patrón dominante).
- [ ] Diferenciar STT streaming (`io.stt`/Deepgram) vs STT batch (Whisper local).
- [ ] Describir qué aporta `model.vision` en los templates 04 y 08.
- [ ] Justificar cuándo usar visión→texto vs embeddings multimodales directos.
- [ ] Nombrar las alternativas a Whisper, GPT-4o y DALL·E con un trade-off cada una.
- [ ] Implementar un pipeline scratch que fusione transcript mock + descripción mock y recupere con filtros duros.
- [ ] Mapear cada función mock del scratch a su API real (tabla §10.1).
- [ ] Explicar por qué `citations` sigue siendo obligatorio aunque la entrada sea multimodal.
- [ ] Leer el `flow.json` del template 07 e identificar dónde entra `io.stt`.
- [ ] Leer el `flow.json` del template 08 e identificar `model.vision` + `loader.multimodal`.

**Si no puedes:** repasa §3–§5 (STT y visión), §10 (framework) y el [lab/enunciado.md](lab/enunciado.md). Compara los tres templates ancla en `examples/`.

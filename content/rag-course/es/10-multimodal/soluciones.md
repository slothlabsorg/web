# M10 · Soluciones — Multimodal

---

## Ejercicio 14 · ¿Multimodal o solo texto?

**(a) Multimodal (STT).** La entrada es audio en tiempo real; necesitas `io.stt` para convertir voz a texto antes del RAG.

**(b) Solo texto.** El canal ya es texto; un pipeline RAG estándar (M1–M4) basta.

**(c) Multimodal (visión).** El PDF es texto, pero las fotos de daño requieren `model.vision` o `loader.multimodal` con `describeImages: true` para extraer información visual.

**(d) Solo texto.** El técnico escribe la consulta; no hay señal de audio ni imagen en la entrada.

**(e) Multimodal (visión).** La foto de la factura contiene información visual (tabla, importes) que requiere visión u OCR+layout; la pregunta en texto se fusiona con la descripción extraída.

---

## Ejercicio 15 · Elige la tecnología — STT

**A → Deepgram.** Latencia < 500 ms streaming, alto volumen, API aceptable — caso típico del template 07.

**B → Whisper local.** Privacidad total (datos no salen), volumen moderado, batch nocturno tolera latencia alta.

**C → Amazon Transcribe Streaming.** AWS obligatorio, streaming < 1 s, integración nativa con stack AWS.

Whisper API sería segunda opción para B si no hay GPU local pero sí se permite API batch.

---

## Ejercicio 16 · Whisper vs io.stt

**(a) Respuesta: 3.** Whisper procesa archivos completos (batch); Deepgram ofrece streaming con latencia muy baja, requisito del copilot < 1.5 s.

Whisper sí soporta español (descarta 1), sí produce timestamps (descarta 2), y Whisper es open-weights, no Deepgram (descarta 4).

**(b)** En un **proceso batch offline** de indexación de grabaciones históricas de llamadas (no el panel en tiempo real). También aceptable en un paso de post-procesamiento que no bloquea al agente humano.

---

## Ejercicio 17 · Predice la salida — mock STT

```
Audio desconocido: 'AUDIO-INEXISTENTE'
Técnico en rampa. Detectamos fuga de flui
```

La primera línea viene de `get("error", "OK")` cuando el audio_ref no coincide. La segunda es los primeros 40 caracteres del transcript.

---

## Ejercicio 18 · Encuentra el bug — filtros

**Bug:** no aplica **filtros duros** por `aircraft_type` ni `ata_chapter` antes de puntuar.

**Parche mínimo:**

```python
for chunk in corpus:
    meta = chunk["metadata"]
    if meta.get("aircraft_type") != aircraft_type:
        continue
    if str(meta.get("ata_chapter")) != str(ata_chapter):
        continue
    # ... resto del scoring
```

Sin esto, el chunk B737 puede puntuar alto por términos compartidos ("tren de aterrizaje", "32-11-00").

---

## Ejercicio 19 · Visión y loader.multimodal

**(a) Respuesta: 2.** `describeImages: true` produce descripción textual de figuras/diagramas, indexable como chunks de texto en el vector store.

**(b)** `sectionScheme: ATA` etiqueta chunks con capítulo/sección ATA (`32-11-00`), permitiendo `hardFilters` en `retrieval.vector` — solo recuperar procedimientos del capítulo y aeronave correctos.

**(c)** Cuando las figuras son **puramente decorativas** (logos, iconos) sin información técnica — añaden costo y latencia sin mejorar retrieval.

---

## Ejercicio 20 · Tablas → JSON

**(a)** JSON preserva **estructura** (clave `Colisión` → `500`) que `logic.rules` puede leer deterministamente. Texto plano obliga al LLM a interpretar números — inconsistente y no auditable.

**(b)** `logic.rules` — aplica deducibles, exclusiones y umbrales sin delegar al LLM (template 04).

---

## Ejercicio 21 · Embeddings multimodales

**Elección: A (CLIP).** Búsqueda por similitud visual directa sin descripción intermedia.

**Qué pierdes en seguros regulado:**
- **Auditabilidad** — no hay texto cit-able que explique por qué dos fotos son "similares".
- **Explicabilidad** para el ajustador y auditoría regulatoria.
- **Integración con cláusulas** de póliza (texto) — CLIP no conecta daño visual con artículo contractual.

Por eso el patrón RAGorbit (visión→texto→RAG con citas) es preferido en template 04.

---

## Ejercicio 22 · TTS y DALL·E

**(a)** Bot de voz bidireccional: STT entrada + LLM + **TTS salida** (IVR, asistente hablado). También accesibilidad cuando el usuario no puede leer pantalla.

**(b)** DALL·E **genera** imágenes sintéticas — no es evidencia del daño real. En MRO/seguros necesitas citar documentos y fotos **reales**; generar una ilustración sería misleading en auditoría.

**(c)** Stable Diffusion XL (local), Flux, Midjourney API (alternativas comerciales).

---

## Ejercicio 23 · Fusionar señales

**Preferible: concatenar en una sola query** (como el lab).

Razones:
- Un solo espacio de scoring captura términos de **ambas** modalidades (ej. "Skydrol" solo en imagen, "32-11-00" solo en voz).
- La unión de dos retrieval independientes puede **duplicar** chunks, dar pesos desiguales o perder términos que solo aparecen en una modalidad si el top-k es pequeño por rama.
- Más simple de depurar y alinear con template 08 (una query enriquecida).

Problema de unión: si cada rama devuelve top-2, puedes tener 4 chunks con redundancia; si transcript recupera chunk equivocado (NLG) e imagen el correcto (MLG), la unión no prioriza el más relevante globalmente.

---

## Ejercicio 24 · Costo y latencia

**Orden menor → mayor costo marginal:**

1. **Scratch lab M10** — costo cero (stdlib, mocks).
2. **Whisper local + LLaVA local + embeddings locales** — costo de GPU/CPU infra, sin API por token.
3. **Deepgram + GPT-4o visión + GPT-4o-mini RAG** — APIs mid-tier.
4. **Whisper API + Claude Opus visión + Claude Sonnet RAG** — APIs premium.

**Viable sin red en el curso:** solo el **scratch (3 en la lista de opciones del enunciado, #1 en costo)** — opción 3 del enunciado (JSON mocks + BoW).

---

## Ejercicio 25 · Template 07 — intent gate

**(a)** Saludos ("buenos días"), confirmaciones ("ajá", "ok"), silencios transcritos como ruido, relleno ("ehh", "un momento"), despedidas cortas.

**(b)** En streaming llegan **muchos** fragmentos parciales; sin gate cada uno dispararía RAG ($$$ y latencia). En batch procesas un transcript completo ya depurado.

**(c)** **Costo de API** (LLM + retrieval) y **latencia del panel** — más llamadas RAG innecesarias; el agente humano ve sugerencias irrelevantes.

---

## Ejercicio 26 · HITL y severity_hint

**(a)** `hitl.escalate` — en template 08 escala a inspector certificado cuando hay WARNING/CAUTION.

**(b)** **Regla sobre `severity_hint`** (o `warning_level` en metadata del chunk). El LLM puede omitir o suavizar WARNING; en dominios regulados la escalación debe ser **determinista** (M5/M9: no delegar umbrales críticos al LLM).

---

## Ejercicio 27 · Bug citas vacías

**Mal:** `citations` queda vacío aunque hay chunks con `source`.

**Arreglo en una línea:**

```python
"citations": [c["source"] for c in chunks],
```

O al menos `"citations": [chunks[0]["source"]]`.

---

## Ejercicio 28 · watsonx / Granite / HF

**(a) Respuesta: 2.** Granite Vision en watsonx o LLaVA on-prem procesan imágenes sin enviar a OpenAI. DALL·E genera imágenes, no analiza (1). OCR solo pierde layout complejo (3). Deepgram es STT, no visión (4).

**(b)** Posible **menor calidad** en tablas densas y diagramas técnicos vs GPT-4o; mayor esfuerzo de **ops** (GPU, actualización de modelos).

---

## Ejercicio 29 · Diseña flow.json

Ejemplo válido:

```
[audio_in] io.stt ──Message──▶ [query_fusion]
[foto_in]  model.vision ──Model──▶ [loader o fusion]
[store] retrieval.vector ◀── Query (hardFilters: aircraft_type, ata_chapter)
retrieval.vector ──Chunks──▶ logic.citations ◀── Message (LLM)
logic.citations ──Message──▶ hitl.escalate (when: WARNING)
hitl.escalate ──Any──▶ io.output (format: json)
```

Aristas mínimas:
- `io.stt` → `Message` → nodo de fusión/query
- `model.vision` → `Model` → loader o lógica
- `retrieval.vector` → `Chunks` → `logic.citations`
- `logic.citations` → `Message` → `hitl.escalate`
- `hitl.escalate` → `io.output`

---

## Ejercicio 30 · IBM Coursera

**(a)** **STT/Whisper en profundidad**, generación imagen/audio (DALL·E, Sora, TTS), embeddings multimodales, comparativa HF/watsonx/Granite — M2 solo introduce `loader.multimodal` en ingesta.

**(b)** **Producción:** HITL hardcoded, filtros duros como guardrail, citas obligatorias en dominios regulados, mocks deterministas sin red, conexión con 10 templates de industria y diseño de `flow.json`.

---

## Ejercicio 31 · Traza el pipeline del lab

1. **Entrada:** `audio_notificacion.json` (transcript voz), `foto_fuga.json` (descripción imagen + metadata A320/ATA 32).

2. **Query fusionada:** transcript completo + descripción de imagen + labels (`hydraulic fluid leak`, `A320 main landing gear`).

3. **Chunks recuperados:** `amm-32-11-00-001` (score 0.4356), `amm-32-11-00-200-001` (score 0.3167). No aparece B737.

4. **Salida JSON:** `transcript`, `image_description`, `retrieved_chunks`, `answer`, `citations` = `["AMM-A320#32-11-00#rev45", "AMM-A320#32-11-00-200-001#rev45"]`, `escalate_hitl` = `true`.

# M10 · Ejercicios — Multimodal

> **Instrucciones:** Responde sin mirar las soluciones. Para ejercicios de código, escribe tu respuesta antes de ejecutarla.
>
> Las respuestas razonadas están en `soluciones.md`.

---

## Ejercicio 14 · Opción múltiple — ¿Multimodal o solo texto?

Para cada escenario, indica si necesitas pipeline multimodal (STT y/o visión) o basta con texto, y justifica en una frase.

**(a)** Call center de telecom: el agente humano recibe sugerencias mientras el cliente habla por teléfono.

**(b)** Chat web de RRHH donde empleados preguntan sobre políticas de vacaciones en texto.

**(c)** Ajustador de seguros recibe carpeta con póliza PDF digital (texto seleccionable) y 3 fotos del daño del vehículo.

**(d)** Técnico MRO consulta procedimiento AMM escribiendo "inspección MLG A320 32-11-00" en un formulario web.

**(e)** Bot de WhatsApp donde usuarios envían foto de factura con pregunta "¿este cargo es correcto?"

---

## Ejercicio 15 · Elige la tecnología — STT

**Tipo: elige la tecnología (ET)**

| Escenario | Latencia objetivo | Privacidad | Volumen |
|-----------|-------------------|------------|---------|
| A | < 500 ms streaming | API aceptable | 10 000 h/mes |
| B | Horas (batch nocturno) | Datos no salen del datacenter | 200 h/mes |
| C | < 1 s | AWS obligatorio | 5 000 h/mes |

Para cada escenario A, B y C, elige entre: **Whisper local**, **Deepgram**, **OpenAI Whisper API**, **Amazon Transcribe Streaming**. Justifica.

---

## Ejercicio 16 · Whisper vs io.stt

**Tipo: opción múltiple razonada**

El template 07 usa `io.stt` con `provider: deepgram`, no Whisper local.

**(a)** ¿Cuál es la razón principal?

1. Whisper no soporta español.
2. Whisper no produce timestamps.
3. Whisper procesa archivos completos; Deepgram hace streaming con latencia < 300 ms.
4. Deepgram es open-weights y Whisper es cerrado.

**(b)** ¿En qué parte del template 07 sería aceptable sustituir Deepgram por Whisper local sin romper el SLA de 1.5 s?

---

## Ejercicio 17 · Predice la salida — mock STT

Dado este código del lab M10:

```python
def transcribe_audio(audio_ref: str) -> dict:
    data = _load("audio_notificacion.json")
    if audio_ref and audio_ref != data["audio_id"]:
        return {"error": f"Audio desconocido: {audio_ref!r}"}
    return {"transcript": data["transcript"], "language": data["language"]}

print(transcribe_audio("AUDIO-INEXISTENTE").get("error", "OK"))
print(transcribe_audio("AUDIO-MLG-001")["transcript"][:40])
```

Asumiendo que `audio_notificacion.json` contiene `"audio_id": "AUDIO-MLG-001"` y un transcript que empieza con "Técnico en rampa", ¿qué imprime el script?

---

## Ejercicio 18 · Encuentra el bug — filtros de retrieval

Un alumno implementó retrieval multimodal pero obtiene chunks de B737 para una consulta A320:

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

El chunk `amm-b737-32-11-001` aparece en top-2. ¿Cuál es el bug? Escribe el parche mínimo.

---

## Ejercicio 19 · Visión y loader.multimodal

**Tipo: opción múltiple razonada**

En el template 08, `model.vision` se conecta a `loader.multimodal` con `sectionScheme: ATA`.

**(a)** ¿Qué produce `loader.multimodal` cuando `describeImages: true`?

1. Embeddings de imagen directamente en pgvector.
2. Descripción textual de cada figura/diagrama, indexable como chunk de texto.
3. Archivo PNG regenerado con anotaciones.
4. JSON de coordenadas de bounding boxes sin texto.

**(b)** ¿Por qué `sectionScheme: ATA` importa para el retrieval posterior?

**(c)** ¿Cuándo NO activarías `describeImages` en un PDF del AMM?

---

## Ejercicio 20 · Tablas → JSON

**Contexto:** Template 04 (seguros). La póliza tiene tabla de deducibles:

```
| Cobertura   | Deducible USD |
| Colisión    | 500           |
| Robo        | 1000          |
```

`loader.multimodal` con `extractTables: true` convierte esto a JSON.

**(a)** ¿Por qué es preferible JSON estructurado frente a texto plano "Colisión 500 Robo 1000" para `logic.rules`?

**(b)** Nombra un nodo RAGorbit que consume ese JSON sin delegar umbrales al LLM.

---

## Ejercicio 21 · Embeddings multimodales

**Tipo: elige la tecnología (ET)**

Tienes 50 000 fotos de daños indexadas y quieres buscar "vehículos con abolladura en puerta lateral similar a esta foto" sin generar descripción textual intermedia.

Opciones:
- A) CLIP embeddings + búsqueda por similitud visual
- B) GPT-4o describe cada foto → text-embedding-3 → pgvector
- C) BM25 sobre nombres de archivo

Elige A, B o C. ¿Qué pierdes con A en un contexto de seguros regulado?

---

## Ejercicio 22 · Generación TTS y DALL·E

**(a)** ¿En qué caso del curso tiene sentido añadir TTS al final del pipeline?

**(b)** ¿Por qué el lab M10 no usa DALL·E para "generar evidencia" del daño en el MLG?

**(c)** Nombra dos alternativas open/local a DALL·E 3 para generación de imagen.

---

## Ejercicio 23 · Fusionar señales multimodales

**Tipo: predice la salida / diseño**

Tienes:
- Transcript: "fuga hidráulica en actuador MLG A320"
- Descripción imagen: "gota activa de Skydrol en actuador de retracción"

Un compañero hace **dos** retrieval separados (solo transcript, solo descripción) y toma la unión de resultados. Otro compañero concatena ambos en una sola query (como el lab).

¿Cuál enfoque es preferible para el template 08 y por qué? ¿Qué problema puede tener la unión de dos retrieval independientes?

---

## Ejercicio 24 · Costo y latencia

Ordena de **menor a mayor costo marginal por consulta** (una nota de voz 15 s + una foto):

1. Whisper local + LLaVA local + RAG con embeddings locales
2. Deepgram + GPT-4o visión + GPT-4o-mini RAG
3. Scratch del lab M10 (JSON mocks + BoW)
4. Whisper API + Claude Opus visión + Claude Sonnet RAG

Justifica el orden. ¿Cuál es viable en el entorno del curso (sin red)?

---

## Ejercicio 25 · Template 07 — intent gate

En el template 07, tras `io.stt` viene `model.intent` con etiqueta `no_accionable`.

**(a)** ¿Qué fragmentos de audio típicamente clasifica como `no_accionable`?

**(b)** ¿Por qué este gate es especialmente importante en un pipeline STT streaming (vs batch)?

**(c)** Si eliminas `model.intent`, ¿qué métrica de producción empeora primero?

---

## Ejercicio 26 · HITL y severity_hint

En el lab M10, `foto_fuga.json` tiene `"severity_hint": "WARNING"` y el scratch devuelve `"escalate_hitl": true`.

**(a)** ¿Qué nodo RAGorbit del template 08 corresponde a esta escalación?

**(b)** ¿Debería el LLM decidir si escalar basándose solo en la respuesta generada, o es mejor regla sobre `severity_hint`? Justifica.

---

## Ejercicio 27 · Encuentra el bug — citas vacías

```python
def generate_answer(transcript, vision, chunks):
    if not chunks:
        return {"answer": "No hay procedimiento.", "citations": []}
    text = chunks[0]["text"]
    return {
        "answer": f"Según el manual: {text}",
        "citations": [],  # pendiente: llenar después
    }
```

El pipeline pasa tests de "respuesta no vacía" pero falla auditoría FAA. ¿Qué está mal y cómo lo arreglas en una línea?

---

## Ejercicio 28 · watsonx / Granite / HF

**Tipo: opción múltiple**

Un banco quiere visión sobre documentos de hipoteca sin enviar imágenes a APIs públicas de OpenAI.

**(a)** ¿Qué opción es más coherente?

1. DALL·E 3 local
2. Granite Vision en watsonx o LLaVA en Ollama on-prem
3. Eliminar visión y confiar en OCR del PDF
4. Deepgram para las imágenes

**(b)** ¿Qué trade-off aceptas vs GPT-4o?

---

## Ejercicio 29 · Diseña el flow.json (conceptual)

Dibuja en texto (ASCII) un mini-flujo RAGorbit con estos nodos para el lab M10:

- `io.stt` (o entrada batch de audio)
- `model.vision`
- `retrieval.vector` con hardFilters
- `logic.citations`
- `hitl.escalate`
- `io.output` format json

Indica al menos 6 aristas con tipos de puerto (`Message`, `Model`, `Chunks`…).

---

## Ejercicio 30 · Comparativa IBM Coursera

Según [`referencia/cobertura-ibm-coursera.md`](../referencia/cobertura-ibm-coursera.md), el curso IBM "Multimodal" cubre Whisper, DALL·E, Sora, HF, watsonx y Granite.

**(a)** ¿Qué tema del IBM Coursera cubre este módulo M10 que M2 solo toca superficialmente?

**(b)** ¿Qué extra de producción añade este curso que el programa IBM no enfatiza? (Pista: HANDOFF §11 extras.)

---

## Ejercicio 31 · Traza el pipeline del lab

Traza los 4 pasos del `solucion_scratch.py` para el escenario del taller (fuga MLG A320):

1. Entrada (qué archivos mock).
2. Query fusionada (qué texto se construye).
3. Chunks recuperados (ids y scores esperados).
4. Salida JSON (campos obligatorios y valor de `escalate_hitl`).

No necesitas ejecutar el código — usa `expected.md` si lo recuerdas, o razona desde el enunciado.

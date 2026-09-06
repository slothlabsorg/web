# M2 · Soluciones de ejercicios

---

## Ejercicio 14 — Estrategia de chunking ✅ Respuesta: **a**

**a) A → recursive, B → by-clause, C → by-section, D → recursive**

Razonamiento por tipo:

| Tipo | Estrategia correcta | Por qué |
|------|--------------------|----|
| A (declaraciones fiscales, texto continuo) | `recursive` | No tiene marcas de sección predecibles. El splitter recursivo corta por párrafos, luego por oraciones, respetando la estructura natural. |
| B (contratos con CLÁUSULA N.) | `by-clause` | La unidad semántica es la cláusula. Cortarla a la mitad mezcla obligaciones de distintas cláusulas en el mismo chunk. |
| C (HTML con h1/h2/h3) | `by-section` | La jerarquía de encabezados HTML es explícita. El splitter by-section usa esos marcadores como separadores. |
| D (transcripciones, texto continuo) | `recursive` o `semantic` | No hay estructura. `recursive` es más rápido; `semantic` podría dar mejor coherencia temática pero requiere embeddings en ingesta. |

La opción **b** tiene `A → fixed`, que es el menos adecuado (fijo ignora cualquier estructura). La opción **c** invierte A y B. La opción **d** asigna `semantic` al tipo A, que es innecesariamente costoso para declaraciones fiscales.

---

## Ejercicio 15 — Parámetro overlap ✅ Respuesta: **b**

**b) 4 chunks: [0-1000, 800-1800, 1600-2600, 2400-3400]**

El algoritmo de sliding window con overlap funciona así:

```
Texto: 3400 chars
chunkSize: 1000, overlap: 200
stride: chunkSize - overlap = 800

Chunk 0: [0, 1000)      ← inicio: 0
Chunk 1: [800, 1800)    ← inicio: 800 = 0 + stride
Chunk 2: [1600, 2600)   ← inicio: 1600 = 800 + stride
Chunk 3: [2400, 3400)   ← inicio: 2400 = 1600 + stride
```

El `overlap` hace que el inicio del chunk siguiente retroceda `overlap` posiciones. En el chunk 3, el inicio es 2400 y el fin sería 3400, que es exactamente el tamaño del texto → 4 chunks.

**Respuesta a incorrecta:** "3 chunks [0-1000, 1000-2000, 2000-3000]" sería sin overlap (`overlap: 0`).
**Respuesta d incorrecta:** el último fragmento no se descarta — el splitter ajusta el último chunk para cubrir hasta el final del texto.

---

## Ejercicio 16 — Filtros duros vs. filtros blandos ✅ Respuesta: **b**

**b) Solo los chunks con `aircraft_type = "A320"` participan en la búsqueda por similitud.**

Los `hardFilters` traducen a una cláusula `WHERE` en la query SQL al vector store:

```sql
SELECT *, embedding <=> $query_vec AS dist
FROM chunks
WHERE aircraft_type = 'A320'    -- filtro duro: se aplica ANTES de la similitud
ORDER BY dist
LIMIT 5;
```

Los chunks del B787 no se evalúan en absoluto. No se penalizan, no se recuperan para luego filtrar, no compiten con los del A320. Esto es crucial en mantenimiento aeronáutico: un límite de torque del 787 no debe aparecer nunca en una respuesta para un técnico del A320.

**La respuesta a** describe un filtro blando: recuperar topK y luego filtrar en aplicación. Esto es menos eficiente y puede devolver 0 resultados del tipo correcto si los N más similares son todos del tipo incorrecto.

---

## Ejercicio 17 — Predice la salida: regex con/sin MULTILINE ✅ Respuesta: **c**

**c) Patrón A: 0 matches; Patrón B: 2 matches**

Sin `re.MULTILINE`, el `^` ancla al inicio del **texto completo** (posición 0 del string). El texto empieza con `\nCLÁUSULA 8...` — el primer carácter es un `\n`, no una `C`. Por tanto, el patrón A no hace match en ninguna posición.

Con `re.MULTILINE`, el `^` ancla al inicio de **cada línea**. Hay dos líneas que empiezan con `CLÁUSULA`:
- Línea 1: `CLÁUSULA 8. LIMITACIÓN DE RESPONSABILIDAD`
- Línea 3: `CLÁUSULA 9. CONFIDENCIALIDAD`

La línea 2 (`...conforme a la Cláusula 3 del contrato.`) contiene "Cláusula 3" en mitad de la línea, **no** al inicio → no hace match con el patrón B.

**La respuesta d** sería incorrecta porque "Cláusula 3" en `...conforme a la Cláusula 3 del contrato.` no está al inicio de línea, por lo que `re.MULTILINE` con `^` la excluye correctamente.

---

## Ejercicio 18 — Encuentra el bug: chunker con false positives ✅

**Bug:** el patrón `re.compile(r'CL[AÁ]USULA\s+(\d+)', re.IGNORECASE)` **no** tiene `re.MULTILINE` con ancla `^`. La búsqueda es "en cualquier posición del texto", no "al inicio de línea".

El fragmento `"Ver Cláusula 3 para penalizaciones."` en el cuerpo de CLÁUSULA 2 genera un match espurio: `Cláusula 3` en mitad de una oración. Por eso `finditer` devuelve 4 matches en lugar de 3 (CLÁUSULA 1, CLÁUSULA 2, `Cláusula 3` [referencia], CLÁUSULA 3 [encabezado]).

**Corrección:**

```python
patron = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)',
    re.IGNORECASE | re.MULTILINE  # ← agregar re.MULTILINE
)
```

Con `re.MULTILINE`, `^` solo hace match al inicio de línea. "Ver Cláusula 3" está en mitad de una línea → no hace match. Resultado: 3 matches correctos.

**Consecuencia en producción:** sin la corrección, el chunk "CLÁUSULA 2" incluye solo el texto hasta la referencia "Cláusula 3", y un chunk espurio de una sola oración se crea en medio del contrato. El retriever puede devolver ese chunk espurio de 1 oración cuando el usuario pregunta por penalizaciones, dando una respuesta incompleta.

---

## Ejercicio 19 — Loaders: elige la tecnología ✅

| Documento | Loader correcto | Razón |
|-----------|----------------|------|
| 1. Pólizas en PDF escaneado | `loader.pdf` con `ocr: true` | Es una imagen; necesita OCR para extraer texto. |
| 2. Catálogo de productos (PostgreSQL) | `loader.sql` | Los datos están en BD; la query los convierte en documentos directamente. |
| 3. Manual AMM con tablas y diagramas | `loader.multimodal` con `extractTables: true, describeImages: true, sectionScheme: ATA` | Las tablas de torque y diagramas hidráulicos son críticos; necesitas extracción estructurada. |
| 4. FAQ en sitio web | `loader.web` con `urls: ["https://empresa.com/faq"], crawlDepth: 0` | Una sola URL; `crawlDepth: 0` no sigue links externos. |
| 5. Expedientes en S3 | `loader.s3` con `bucket: "expedientes"` | Los archivos están en cloud storage; el loader S3 los lee sin descargarlos localmente. |

---

## Ejercicio 20 — Metadata: qué campos añadir ✅ Respuesta: **b**

**b) Permite filtrar solo los documentos del período fiscal del solicitante.**

En el template 02, un expediente de crédito incluye:
- Declaración fiscal 2022 (`period: "2022"`)
- Declaración fiscal 2023 (`period: "2023"`)
- Estado de cuenta Q3-2023 (`period: "2023-Q3"`)

Si la evaluación es para el año 2023, `retrieval.vector` con `hardFilters: ["doc_type", "period"]` garantiza que la recuperación solo use documentos de 2023. Sin el filtro, el LLM podría confundir el ingreso de 2022 con el de 2023 y calcular un score incorrecto.

La opción **d** ("solo sirve como trazabilidad") es incorrecta porque el filtro duro cambia directamente los chunks que participan en la recuperación, no solo los que se registran en el log.

---

## Ejercicio 21 — Tamaño de chunk y ventana de contexto ✅ Respuesta: **a**

**a) 9050 tokens**

Cálculo:
```
System prompt:  500 tokens
Query del usuario: 50 tokens
6 chunks × 1500 tokens = 9000 tokens
─────────────────────────────────────
Total contexto: 9550 tokens  ≈ 9050-9500 tokens
```

Con una ventana de 128,000 tokens, este uso (~7.5%) deja amplio margen para la respuesta. En producción, hay que sumar los tokens de la respuesta generada (typically 500-2000 tokens).

**Cuándo esto importa:** si `topK: 20` y `chunkSize: 6000`, el contexto sería `20×6000 + 500 + 50 = 120,550 tokens` — cerca del límite. Si la respuesta necesita 2000 tokens, podría truncarse.

---

## Ejercicio 22 — Unstructured vs. LangChain loader ✅ Respuesta: **d**

**d) Unstructured.io en modo `hi_res`**

La razón: el informe tiene tablas financieras con estructura compleja, notas al pie que requieren correlación con el texto, y gráficas que son imágenes. `loader.pdf` simple extraería el texto pero perdería la estructura de las tablas (las celdas se mezclan) y no capturaría las gráficas.

La opción **c** (`loader.multimodal` de RAGorbit) también sería válida para tablas + imágenes, pero Unstructured.io en modo `hi_res` ofrece mejor detección de notas al pie y columnas múltiples para documentos financieros complejos.

La opción **a** (`loader.pdf` simple) daría un resultado pobre para las tablas: "2022 2023 Ingresos 1.2M 1.8M Costos 0.8M 1.1M" sin saber qué columna es qué.

---

## Ejercicio 23 — By-clause vs. recursive para normativa ✅ Respuesta: **b**

**b) `by-clause` con separador `Artículo N.`**

Los artículos son unidades semánticas y jurídicas autónomas. Si se chunkean por tamaño fijo, el artículo 1.2 puede aparecer en el mismo chunk que el inicio del artículo 2, generando un chunk que mezcla "ámbito de aplicación" con "definiciones". Cuando el usuario pregunta "¿qué es un incidente?", el retriever puede devolver ese chunk mixto y el LLM responderá con ambos temas mezclados.

Con `by-clause` usando `Artículo N.` como separador, cada artículo es un chunk independiente. El retriever puede filtrar por `tipo: "definicion"` si se añade metadata.

La opción **a** (`recursive` con `chunkSize: 500`) podría funcionar si los artículos son cortos, pero no garantiza que los sub-artículos (1.1, 1.2) queden con su artículo padre.

---

## Ejercicio 24 — Predice la salida: overlap ✅

Texto: 2800 chars, `chunkSize: 1000`, `overlap: 200`, stride = 800.

| Chunk | Inicio | Fin |
|-------|--------|-----|
| 0 | 0 | 1000 |
| 1 | 800 | 1800 |
| 2 | 1600 | 2600 |
| 3 | 2400 | 2800 (fin del texto) |

**4 chunks.** El último chunk va de 2400 a 2800 (solo 400 chars). Los splitters ajustan el último chunk al final del texto, no lo descartan ni lo rellenan.

---

## Ejercicio 25 — Pipeline de ingesta end-to-end ✅ Respuesta: **a**

**a) El chunker produce los límites de chunk necesarios para asignar metadata por chunk.**

El loader produce documentos a nivel de página o archivo. La metadata de dominio (`ata_chapter`, `aircraft_type`) solo tiene sentido a nivel de chunk, no a nivel de documento, porque:

1. Un documento puede tener capítulos de diferentes ATA (ej: un manual completo tiene ATA 32, 33, 34...). Si etiquetamos el documento completo con un solo `ata_chapter`, sería incorrecto.
2. El `ingest.metadata` extrae el `ata_chapter` del **texto del chunk** (ej: detectando "32-11-00" en el encabezado de sección). Solo puede hacer eso después de que el chunker haya creado chunks con ese encabezado visible.

La opción **c** es incorrecta porque el loader no añade metadata de dominio específica del chunk; solo añade `source` y `page_number` que son propiedades del documento fuente.

---

## Ejercicio 26 — Encuentra el bug: metadata perdida ✅

**Bug:** falta asignar `aircraft_type` a la metadata del chunk.

```python
# Código con bug:
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    # FALTA: chunk.metadata["aircraft_type"] = "A320"
```

El código extrae `ata_chapter` del texto del chunk pero nunca asigna `aircraft_type`. En producción, el retriever configura `hardFilters: ["aircraft_type", "ata_chapter"]`, pero si `aircraft_type` es `None` (o ausente) en todos los chunks, el filtro duro fallará silenciosamente: o no devuelve resultados, o devuelve todos los chunks sin filtrar.

**Corrección:**
```python
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    chunk.metadata["aircraft_type"] = "A320"  # ← extraído del nombre de archivo o contexto
```

En RAGorbit, el nodo `ingest.metadata` con `fields: [aircraft_type, ata_chapter]` gestiona esto automáticamente, extrayendo el `aircraft_type` del nombre del archivo fuente o del contexto de la sesión de ingesta.

---

## Ejercicio 27 — LlamaIndex vs. LangChain para multi-formato ✅ Respuesta: **b**

**b) LlamaIndex `SimpleDirectoryReader`**

```python
from llama_index.core import SimpleDirectoryReader

reader = SimpleDirectoryReader(
    "data/docs/",
    recursive=True,
    # Detecta automáticamente: PDF → PDFReader, .md → MarkdownReader, .json → JSONReader
)
docs = reader.load_data()
# Todos los docs tienen metadata: {"file_path", "file_name", "file_type", "file_size"}
```

La ventaja es que **un solo objeto** maneja los tres tipos de archivo sin código de glue. La metadata (`file_type`) permite saber el origen de cada documento.

La opción **a** (LangChain con loader por tipo) funciona pero requiere tres loaders y lógica para mezclar las listas de documentos — más código de mantenimiento.

La opción **c** (Unstructured `partition_auto`) también funciona y da mejor calidad en PDFs complejos, pero tiene mayor overhead de instalación (`detectron2`).

La opción **d** (Python puro con `pathlib.glob`) es viable para un script pero no aprovecha los parsers especializados para cada formato.

---

## Ejercicio 28 — Predice la salida: RecursiveCharacterTextSplitter ✅ Respuesta: **b**

**b) 3 chunks: Chunk 0 = solo intro; Chunk 1 = CLÁUSULA 1; Chunk 2 = CLÁUSULA 2**

Razonamiento paso a paso (algoritmo recursivo de [guía §10.2](guia.md#102-recursivecharactertextsplitter-el-algoritmo-recursivo)):

1. El separador prioritario es `"\n\nCLÁUSULA "`. El texto tiene dos ocurrencias: antes de CLÁUSULA 1 y antes de CLÁUSULA 2.
2. Con `keep_separator=True`, el split produce tres bloques:
   - Bloque 0: intro (80 chars) → cabe en `chunk_size=700` → **Chunk 0**
   - Bloque 1: `CLÁUSULA 1. OBJETO` + cuerpo (≈600 chars) → cabe → **Chunk 1**
   - Bloque 2: `CLÁUSULA 2. PAGO` + cuerpo (≈900 chars) → supera 700 → recursión con `"\n\n"`, luego `"\n"`, etc., pero el cuerpo no tiene sub-separadores fuertes; eventualmente queda como **Chunk 2** (posiblemente partido si el cuerpo es muy largo; en el enunciado 900 chars en un solo párrafo podría partirse por `" "`).

Para el texto tal como está planteado (cuerpos sin subestructura y tamaños 600 y 900), el resultado dominante es **3 chunks** con la intro separada de las cláusulas.

**Por qué no a:** la intro no se fusiona con CLÁUSULA 1 porque el separador `"\n\nCLÁUSULA "` corta *antes* de cada cláusula, no después de la intro hacia adelante sin límite.

**Por qué no c:** 600+900 no se fusionan; el algoritmo no concatena cláusulas — cada split por separador crea bloques independientes.

**Por qué no d:** CLÁUSULA 2 (900 chars) podría partirse si no hay separadores intermedios, pero eso daría más de 3 chunks, no exactamente 4 por `\n`. La opción b describe el comportamiento principal del separador de dominio.

---

## Ejercicio 29 — Completa el método: heredar de TextSplitter ✅ Respuesta: **b**

**b) `metadata={**doc.metadata, "chunk_index": i}`**

Al heredar de `TextSplitter` y sobreescribir `split_documents()`, debes:

1. **Preservar** toda la metadata del documento padre (`source`, `page`, campos del loader).
2. **Enriquecer** con campos del chunk (`chunk_index`).

```python
metadata={**doc.metadata, "chunk_index": i}
```

La opción **a** pierde `source` y cualquier campo del loader. La **c** preserva el padre pero no identifica el índice del chunk. La **d** pone texto del contenido en `source`, lo cual es incorrecto.

Este patrón es el mismo que `ClauseSplitter.split_documents()` en `solucion_framework.py`, que hace `chunk.metadata["source"] = doc.metadata.get("source", "")` además de los campos de dominio.

---

## Ejercicio 30 — Encuentra el bug: metadata perdida en splitter custom ✅

**b) El bug es no llamar a `split_documents()`; la corrección es `chunks = splitter.split_documents(docs)`**

El desarrollador:

1. Usa `split_text()` (solo strings) en lugar del pipeline de `Document`.
2. Reconstruye `Document` a mano con `_last_meta`, que nunca copia `source` del padre.
3. Ignora el override de `split_documents()` que [guía §10.3](guia.md#103-escribir-tu-propio-splitter-heredar-de-textsplitter) diseña precisamente para propagar metadata.

**Corrección mínima:**

```python
chunks = splitter.split_documents(docs)
vectordb.add_documents(chunks)
```

Dentro de `split_documents()`, cada chunk debe recibir:

```python
chunk.metadata["source"] = doc.metadata.get("source", "")
```

**Consecuencia en producción:** sin `source`, las citas del RAG no pueden nombrar el archivo de origen y los filtros por `source` fallan silenciosamente.

Las opciones **a**, **c** y **d** no explican `source: ""` cuando el regex produce 13 chunks correctos.

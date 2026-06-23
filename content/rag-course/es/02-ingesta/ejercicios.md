# M2 · Ejercicios de ingesta

> Responde sin consultar `soluciones.md`. Luego compara.
> Tipos: (OM) opción múltiple razonada · (PS) predice la salida · (FB) encuentra el bug · (ET) elige la tecnología.

---

## Ejercicio 14 — Estrategia de chunking (OM)

Un banco tiene documentos de cuatro tipos:

| Tipo | Descripción |
|------|-------------|
| A | Declaraciones fiscales en PDF: texto continuo, sin secciones marcadas, ~6 páginas |
| B | Contratos de crédito: 15 cláusulas numeradas (CLÁUSULA 1… CLÁUSULA 15) |
| C | Manuales de producto en HTML: `<h1>`, `<h2>`, `<h3>` bien estructurados |
| D | Transcripciones de llamadas de atención al cliente (texto continuo, ~2000 palabras) |

¿Qué estrategia de chunking es más adecuada para cada tipo?

a) A → recursive, B → by-clause, C → by-section, D → recursive
b) A → fixed, B → by-clause, C → fixed, D → semantic
c) A → by-clause, B → recursive, C → by-section, D → fixed
d) A → semantic, B → fixed, C → by-clause, D → by-section

---

## Ejercicio 15 — Parámetro overlap (OM)

Se aplica `chunkSize: 1000, overlap: 200` a un texto de 3400 caracteres. ¿Cuántos chunks se generan y por qué?

a) 3 chunks (0-1000, 1000-2000, 2000-3000 + el fragmento restante en el último)
b) 4 chunks (0-1000, 800-1800, 1600-2600, 2400-3400)
c) 5 chunks (el overlap se aplica de forma simétrica en ambas direcciones)
d) 3 chunks (0-1000, 800-1800, 1600-2600; el texto de 2600-3400 se descarta)

---

## Ejercicio 16 — Filtros duros vs. filtros blandos (OM)

Un sistema RAG indexa manuales de dos aeronaves: A320 y B787. Sin filtros, `topK: 5` puede devolver chunks de ambas aeronaves. Con `hardFilters: ["aircraft_type"]` y `aircraft_type = "A320"`, ¿cuál es el comportamiento correcto?

a) Los 5 chunks más similares se recuperan primero; luego se filtran por `aircraft_type`.
b) Solo los chunks donde `aircraft_type = "A320"` participan en la búsqueda por similitud; el `topK` opera sobre ese subconjunto.
c) El sistema devuelve 5 chunks de A320 y 5 de B787, y el LLM decide cuáles usar.
d) Se aplica una penalización de similitud a los chunks de B787 antes de ordenar.

---

## Ejercicio 17 — Predice la salida: regex con/sin MULTILINE (PS)

Dado el siguiente fragmento de texto:

```
CLÁUSULA 8. LIMITACIÓN DE RESPONSABILIDAD
La responsabilidad total queda limitada conforme a la Cláusula 3 del contrato.
CLÁUSULA 9. CONFIDENCIALIDAD
Ambas partes mantendrán confidencialidad.
```

Y dos patrones de regex:

```python
import re
# Patrón A (sin MULTILINE):
pA = re.compile(r'^CL[AÁ]USULA\s+(\d+)', re.IGNORECASE)
# Patrón B (con MULTILINE):
pB = re.compile(r'^CL[AÁ]USULA\s+(\d+)', re.IGNORECASE | re.MULTILINE)
```

¿Cuántos matches produce cada patrón sobre el texto completo?

a) Patrón A: 2 matches; Patrón B: 2 matches
b) Patrón A: 1 match; Patrón B: 2 matches
c) Patrón A: 0 matches; Patrón B: 2 matches
d) Patrón A: 3 matches; Patrón B: 3 matches (la referencia "Cláusula 3" también hace match)

---

## Ejercicio 18 — Encuentra el bug: chunker con false positives (FB)

El siguiente chunker produce 5 chunks para un contrato de 3 cláusulas:

```python
import re

texto = """
CLÁUSULA 1. OBJETO
Desarrollar software según el Anexo A.

CLÁUSULA 2. PAGO
El pago será de $100,000. Ver Cláusula 3 para penalizaciones.

CLÁUSULA 3. PENALIZACIONES
Retraso mayor a 5 días: descuento del 5%.
"""

patron = re.compile(r'CL[AÁ]USULA\s+(\d+)', re.IGNORECASE)
matches = list(patron.finditer(texto))
print(f"Matches encontrados: {len(matches)}")  # Imprime: 4
```

¿Cuál es el bug y cómo se corrige?

---

## Ejercicio 19 — Loaders: elige la tecnología (ET)

Un equipo debe indexar los siguientes documentos. ¿Qué nodo de loader usar en cada caso?

| Documento | Detalle |
|-----------|---------|
| 1. Pólizas de seguro en PDF | Documentos escaneados (foto del formulario) |
| 2. Catálogo de productos | Tabla PostgreSQL: `SELECT sku, nombre, descripcion FROM productos` |
| 3. Manual de mantenimiento aeronáutico | PDF con tablas de torque y diagramas hidráulicos |
| 4. Preguntas frecuentes | Sitio web `https://empresa.com/faq`, sin links externos que seguir |
| 5. Expedientes de crédito | Carpeta S3 con PDFs y CSVs por solicitante |

---

## Ejercicio 20 — Metadata: qué campos añadir (OM)

El template 02 (banca) usa `ingest.metadata` con `fields: ["doc_type", "period"]`. ¿Por qué es importante el campo `period`?

a) Permite ordenar los documentos cronológicamente en la interfaz de usuario.
b) Permite al retriever filtrar solo los documentos del período fiscal del solicitante, evitando que declaraciones del año anterior afecten la evaluación del año en curso.
c) Es un requisito del LLM para generar respuestas con fechas correctas.
d) Solo sirve como trazabilidad de auditoría; no afecta la recuperación.

---

## Ejercicio 21 — Tamaño de chunk y ventana de contexto (OM)

Un LLM tiene una ventana de contexto de 128,000 tokens. El retriever recupera `topK: 6` chunks de `chunkSize: 1500` tokens. El sistema prompt ocupa 500 tokens y la query 50 tokens. ¿Cuál es el uso aproximado de la ventana de contexto?

a) 9050 tokens (6×1500 + 500 + 50)
b) 128,000 tokens (se usa la ventana completa por defecto)
c) 1500 tokens (solo el chunk más relevante)
d) 50 tokens (solo la query)

---

## Ejercicio 22 — Unstructured vs. LangChain loader (ET)

Tienes un PDF de 200 páginas del informe anual de una empresa con: texto narrativo, tablas de resultados financieros, gráficas (imágenes), notas al pie y encabezados de sección. El equipo necesita responder preguntas como "¿cuál fue el EBITDA del Q3?" y "¿qué dice la nota al pie 47?". ¿Qué herramienta de parsing es más adecuada?

a) `loader.pdf` con `ocr: false` — es suficiente para texto seleccionable.
b) `loader.tabular` — el informe tiene muchas tablas.
c) `loader.multimodal` con `extractTables: true` y `describeImages: true` — preserva tablas como JSON y describe gráficas.
d) Unstructured.io en modo `hi_res` — detecta y categoriza todos los elementos (tabla, figura, narrativa, pie de página) con alta precisión.

---

## Ejercicio 23 — By-clause vs. recursive para normativa (OM)

Una empresa tiene una normativa interna con la siguiente estructura:

```
Artículo 1. Ámbito de aplicación
  1.1 Esta normativa aplica a todos los empleados...
  1.2 Quedan excluidos los contratistas...
Artículo 2. Definiciones
  2.1 Se entiende por "incidente"...
```

¿Qué estrategia de chunking preserva mejor la coherencia semántica?

a) `recursive` con `chunkSize: 500` — los artículos son cortos y caben fácilmente.
b) `by-clause` con separador `Artículo N.` — cada artículo es una unidad semántica y jurídica autónoma.
c) `fixed` con `chunkSize: 1000, overlap: 200` — simple y suficiente para texto de normativa.
d) `semantic` — los embeddings capturan mejor los temas que la numeración.

---

## Ejercicio 24 — Predice la salida: overlap (PS)

Un texto de 2800 caracteres se chunkea con `chunkSize: 1000, overlap: 200`. ¿Cuál es la secuencia de rangos de caracteres de los chunks?

Escribe los rangos como `[inicio, fin)` (fin excluido).

---

## Ejercicio 25 — Pipeline de ingesta end-to-end (OM)

En el template 08 (manufactura), el pipeline es:

```
loader.multimodal → ingest.chunker → ingest.metadata → store.pgvector
```

¿Por qué `ingest.metadata` va **después** del chunker y no antes?

a) Porque el loader solo produce texto bruto; el chunker produce los límites de chunk que son necesarios para asignar metadata por chunk.
b) Porque el store necesita la metadata antes de poder calcular embeddings.
c) Porque el loader ya añade toda la metadata necesaria; el `ingest.metadata` solo la reformatea.
d) Es un requisito técnico de pgvector: no acepta documentos con metadata sin fragmentar.

---

## Ejercicio 26 — Encuentra el bug: metadata perdida (FB)

El siguiente pipeline en pseudocódigo pierde la metadata de `aircraft_type` en el vector store:

```python
# Paso 1: cargar
docs = loader.load("amm_a320.pdf")  # docs[i].metadata = {"source": "amm_a320.pdf"}

# Paso 2: chunkear
chunks = chunker.split_documents(docs)  # preserva metadata del doc padre

# Paso 3: añadir metadata de dominio
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    # FALTA algo aquí

# Paso 4: indexar
vectorstore.add_documents(chunks)
```

¿Qué falta en el paso 3 y qué consecuencia tiene en producción?

---

## Ejercicio 27 — LlamaIndex vs. LangChain para multi-formato (ET)

Tu equipo indexa 3 tipos de archivo: PDFs, Markdown y JSON. Quieres minimizar el código de glue y obtener metadata consistente entre tipos. ¿Qué herramienta eliges?

a) LangChain con un loader diferente por tipo (`PyPDFLoader`, `UnstructuredMarkdownLoader`, `JSONLoader`).
b) LlamaIndex `SimpleDirectoryReader` — detecta el tipo de archivo automáticamente y aplica el lector apropiado.
c) Unstructured.io `partition_auto` — mismo resultado que LlamaIndex pero con mejor calidad en PDFs complejos.
d) Loader personalizado en Python puro con `pathlib.glob`.

---

## Ejercicio 28 — Predice la salida: RecursiveCharacterTextSplitter (PS)

Dado este texto (longitudes entre paréntesis):

```
Intro del contrato (80 chars, sin "CLÁUSULA")\n\n
CLÁUSULA 1. OBJETO (chunk de 600 chars de cuerpo)\n\n
CLÁUSULA 2. PAGO (chunk de 900 chars de cuerpo)
```

Y este splitter:

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=700,
    chunk_overlap=0,
    keep_separator=True,
)
chunks = splitter.create_documents([texto])
```

¿Cuántos chunks produce y cuál es la forma aproximada del primero?

a) 2 chunks: Chunk 0 = intro + CLÁUSULA 1 entera; Chunk 1 = CLÁUSULA 2 entera
b) 3 chunks: Chunk 0 = solo intro; Chunk 1 = CLÁUSULA 1; Chunk 2 = CLÁUSULA 2
c) 2 chunks: Chunk 0 = intro sola; Chunk 1 = CLÁUSULA 1 + CLÁUSULA 2 (porque 600+900 < 700×2 con overlap)
d) 4 chunks: el algoritmo parte CLÁUSULA 2 por `\n` porque supera 700 chars

---

## Ejercicio 29 — Completa el método: heredar de TextSplitter (PS)

Quieres un splitter que divida por el separador `---` y preserve la metadata del documento padre. Falta el método marcado con `# COMPLETA`:

```python
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document

class SeparadorGuiones(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        return [p.strip() for p in text.split("---") if p.strip()]

    def split_documents(self, documents: list[Document]) -> list[Document]:
        result = []
        for doc in documents:
            for i, parte in enumerate(self.split_text(doc.page_content)):
                result.append(Document(
                    page_content=parte,
                    metadata={
                        # COMPLETA: copia metadata del padre y añade chunk_index
                    },
                ))
        return result
```

¿Cuál es la implementación correcta del bloque `metadata={...}`?

a) `metadata={"chunk_index": i}`
b) `metadata={**doc.metadata, "chunk_index": i}`
c) `metadata=doc.metadata` (sin chunk_index)
d) `metadata={"source": doc.page_content[:20], "chunk_index": i}`

---

## Ejercicio 30 — Encuentra el bug: metadata perdida en splitter custom (FB)

Un desarrollador implementó un `ClauseSplitter` que trocea bien (13 chunks) pero en Chroma todos los chunks tienen `source: ""`. Código relevante:

```python
class ClauseSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        return [c.page_content for c in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        # ... regex correcto, 13 Document con clausula_id, titulo, tipo ...
        return docs

# Uso en el pipeline:
loader = TextLoader("contrato_muestra.txt")
docs = loader.load()  # docs[0].metadata == {"source": "contrato_muestra.txt"}

splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = []
for doc in docs:
    for texto in splitter.split_text(doc.page_content):
        chunks.append(Document(page_content=texto, metadata=splitter._last_meta))
vectordb.add_documents(chunks)
```

`_last_meta` solo contiene `clausula_id`, `titulo`, `tipo`, `contrato`, `fecha` — nunca copia `source` del loader.

¿Cuál es el bug y la corrección mínima?

a) El bug está en `TextLoader`; hay que usar `PyPDFLoader` en su lugar.
b) El bug es no llamar a `split_documents()`; la corrección es `chunks = splitter.split_documents(docs)` que propaga `source` del padre.
c) El bug es `chunk_size` demasiado pequeño; hay que subirlo a 2000.
d) El bug es el regex; falta `re.MULTILINE` en `_PATRON`.

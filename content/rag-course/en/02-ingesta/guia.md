# M2 · Data ingestion — `loader` + `ingest`

> **Module goal:** understand how raw data (PDFs, tables, web, SQL, S3, images) is converted into chunks with metadata ready to be indexed in a vector store.
>
> **RAGorbit nodes covered:** `loader.*`, `ingest.chunker`, `ingest.metadata`
>
> **Reference templates:** `05-legal-contract-review`, `02-banking-credit-scoring`, `08-manufacturing-maintenance-rag`, `04-insurance-claims`

---

## Table of contents

1. [The ingestion problem](#1-the-ingestion-problem)
2. [Data sources and loaders](#2-data-sources-and-loaders)
3. [Parsing: from raw format to structured text](#3-parsing-from-raw-format-to-structured-text)
4. [Chunking in depth](#4-chunking-in-depth)
5. [Metadata and its role in hard filters](#5-metadata-and-its-role-in-hard-filters)
6. [Multimodal: tables and diagrams](#6-multimodal-tables-and-diagrams)
7. [Ingestion framework comparison](#7-ingestion-framework-comparison)
8. [Full pipelining in RAGorbit](#8-full-pipelining-in-ragorbit)
9. [When to use / when not to / alternatives](#9-when-to-use--when-not-to--alternatives)
10. [Layer ③ explained: chunking with LangChain from scratch](#10-layer--explained-chunking-with-langchain-from-scratch)
11. [Checkpoint](#11-checkpoint)

---

## 1. The ingestion problem

Before an LLM can answer questions about your company's documents, those documents must go through an **ingestion pipeline**: load → parse → chunk → metadata → index.

This process looks simple but hides most production RAG failures. Four frequent problems:

| Problem | Production symptom | Root cause |
|---------|----------------------|------------|
| Chunks too large | The LLM ignores parts of the context (window full) | Excessive `chunkSize` |
| Chunks too small | The LLM lacks enough context to answer | Insufficient `chunkSize` or zero `overlap` |
| Split clause | The answer mixes obligations from different clauses | Character-based chunking on legal text |
| No metadata | You cannot filter by document type or date | Missing `ingest.metadata` |

The right approach is to choose the **chunking strategy** according to document structure and enrich each chunk with **metadata** that enables hard filters in the retriever.

```
Documentos crudos
      │
      ▼
 ┌─────────┐    parsing    ┌──────────────┐   chunking   ┌────────────┐
 │ Loader  │ ────────────▶ │  texto limpio│ ────────────▶ │  chunks[]  │
 └─────────┘               └──────────────┘              └────────────┘
                                                                │
                                                          metadata
                                                                │
                                                                ▼
                                                    ┌─────────────────────┐
                                                    │ {text, metadata,    │
                                                    │  source, chunk_id}  │
                                                    └─────────────────────┘
```

---

## 2. Data sources and loaders

### 2.1 The six loader types in RAGorbit

The catalog `docs/02-node-catalog.md` defines six `loader.*` types. All produce `Documents` (a list of `{text, metadata}` objects):

| Node | Source | Key config | When to use |
|------|--------|-------------|---------------|
| `loader.pdf` | Text PDFs | `ocr: false/true` | Contracts, policies, selectable-text PDF manuals |
| `loader.multimodal` | PDFs with tables and diagrams | `extractTables: true`, `describeImages: true`, `sectionScheme` | Technical manuals (AMM), insurance forms with images |
| `loader.tabular` | CSV/Parquet/Excel | `schemaHint` | Financial data, inventories, sensor logs |
| `loader.web` | Web pages / sitemaps | `urls[]`, `crawlDepth` | Public FAQs, API documentation, news |
| `loader.s3` | S3/GCS objects | `bucket`, `prefix` | Document repositories at scale (millions of PDFs) |
| `loader.sql` | Database rows | `query` | Product catalogs, customer data, logs |

### 2.2 When to OCR and when not to

PDFs have two variants:
- **Selectable PDF (text-based):** text is encoded in the file. `loader.pdf` with `ocr: false` extracts text in milliseconds.
- **Scanned PDF (image-based):** the PDF is a photo. OCR is required. `ocr: true` enables Tesseract or an external service (slower and costlier).

**Practical rule:** use `ocr: true` only when you confirm the PDF is scanned. OCR introduces typos that contaminate the index.

### 2.3 loader.sql: converting rows into documents

`loader.sql` runs a query and converts each row into a document. Example: the query `SELECT sku, descripcion, especificaciones FROM productos WHERE activo = true` produces one document per product. This enables RAG over product catalogs without exporting to CSV.

**When to use:** when data lives in an operational DB and you want ingestion always synced with the source (by running the query periodically).

**Alternative:** `loader.s3` or `loader.tabular` if data is already exported.

### 2.4 Connection with templates

- **Template 02 (Banking):** uses `loader.pdf` (tax returns) + `loader.tabular` (financial CSV) → `ingest.chunker` with `strategy: by-section`.
- **Template 05 (Legal):** uses `loader.pdf` (contracts, playbook, regulations) → `ingest.chunker` with `strategy: by-clause`.
- **Template 08 (Manufacturing):** uses `loader.multimodal` with `sectionScheme: ATA` to preserve the manual's chapter structure.
- **Template 04 (Insurance):** uses `loader.multimodal` to extract coverage tables and describe damage photos.

---

## 3. Parsing: from raw format to structured text

**Parsing** converts the binary of the original format (PDF, XLSX, HTML) into clean text. It is the quietest step in the pipeline but the one that most affects index quality.

### 3.1 PDF parsing under the hood

`loader.pdf` uses libraries like `pdfminer` or `pypdf` to extract text while preserving reading order. Most common problems:

- **Multiple columns:** a two-column PDF may extract as interleaved text if the library follows character flow instead of visual flow.
- **Headers/footers:** can contaminate main text. Advanced tools (Unstructured.io) detect and filter these regions.
- **Special characters:** typographic ligatures (`ﬁ`, `ﬂ`), dash characters (`—`, `-`, `–`), and curly quotes (`"`, `"`) may remain as odd characters if the PDF does not embed fonts correctly.

**Practical fix:** normalize text after extraction:
```python
import unicodedata
texto_limpio = unicodedata.normalize("NFKC", texto_crudo)
```

### 3.2 Tabular parsing

`loader.tabular` reads CSV/Parquet with `pandas` (or equivalent). The `schemaHint` config helps the loader interpret ambiguous columns. For example, a `periodo` column may be a string "2023-Q3" or an integer `20234`.

**Conversion to text:** each row becomes readable text:
```
concepto: ingreso_anual | valor: 85000 | periodo: 2023
```

This enables semantic similarity search over data that would otherwise be only numbers.

### 3.3 Web parsing

`loader.web` downloads HTML and extracts visible text (removing scripts, styles, navigation menus). Crawl depth (`crawlDepth`) controls how many link levels to follow.

**Problem:** web HTML changes frequently. A RAG system that indexes web content needs periodic re-ingestion. If content is stable (versioned technical documentation), prefer `loader.s3` or `loader.pdf`.

---

## 4. Chunking in depth

Chunking is the most important design decision in the ingestion pipeline. A poorly sized or poorly delimited chunk contaminates the whole chain: embeddings are less precise, the retriever returns wrong context, and the LLM answers with mixed information.

### 4.1 Strategy 1 — Fixed chunking (fixed size)

Splits text into blocks of N characters (or N tokens), with an overlap of O characters between consecutive blocks.

```
Texto original:
  [──────── 1000 chars ────────][──────── 1000 chars ────────]
                            [── overlap 200 ──]

Chunks resultantes:
  Chunk 0: chars 0..1000
  Chunk 1: chars 800..1800    ← overlap cubre el contexto de transición
  Chunk 2: chars 1600..2600
```

**ASCII diagram:**
```
TEXTO: "La indemnización...límite de 2×...plazo de 30 días..."
        |<──── 1000 ────>|<──200──>|<──── 1000 ────>|
        Chunk 0           overlap    Chunk 1
```

**When to use:**
- Documents without clear semantic structure (continuous text, voice transcripts).
- As a fallback when you lack a structural parser.
- Quick prototypes.

**When NOT to use:**
- Contracts and regulations (splits clauses in half).
- Technical manuals with tables and procedures (mixes steps from different procedures).
- Any document where the natural semantic unit is not the paragraph.

**Config in RAGorbit:**
```json
{ "strategy": "recursive", "chunkSize": 1000, "overlap": 150 }
```

---

### 4.2 Strategy 2 — Recursive chunking (hierarchical separators)

Tries separators in order of semantic preference. If the resulting chunk exceeds `chunkSize`, applies the next separator.

Typical hierarchy: `\n\n` (paragraphs) → `\n` (lines) → `. ` (sentences) → ` ` (words)

```
TEXTO con párrafos bien marcados:
┌──────────────────────────────────────┐
│ Párrafo 1 (400 chars)                │ ← chunk 0 (cabe en 1000)
├──────────────────────────────────────┤
│ Párrafo 2 (600 chars)                │ ← chunk 1 (cabe en 1000)
├──────────────────────────────────────┤
│ Párrafo 3 larguísimo (2000 chars)    │ ← se parte por oraciones
│   Oración 1 (400)                    │   chunk 2
│   Oración 2 (300)                    │   chunk 3
│   Oración 3 + Oración 4 (900)        │   chunk 4
└──────────────────────────────────────┘
```

**When to use:**
- Documents with paragraph structure (articles, reports, company policies with sections).
- When you want to respect natural structure without knowing the domain.

**When NOT to use:**
- When documents have very domain-specific structure (numbered clauses, ATA chapters, tables). In that case, use domain semantic strategies.

**Config in RAGorbit:** this is the default — `strategy: recursive`.

---

### 4.3 Strategy 3 — Semantic chunking (by semantic similarity)

Computes embeddings of consecutive sentences and cuts where similarity falls below a threshold. Each chunk is a coherent "thematic block".

```
Oraciones con su embedding:
  S1 ─── S2 ─── S3 ─── S4 ─── S5 ─── S6
         │similitud alta│      │baja│   │alta│
                          ← corte →    ← corte →

Chunks resultantes:
  Chunk A: S1+S2+S3
  Chunk B: S4
  Chunk C: S5+S6
```

**Advantage:** chunks have semantic coherence even when the document has no structural markers.

**Disadvantage:** requires computing embeddings during ingestion (more costly), and the threshold must be calibrated per document type.

**When to use:**
- Narrative text without explicit structure (annual reports, testimonials, transcripts).
- When visible paragraphs do not correspond to real semantic units.

**In RAGorbit:** there is no native `strategy: semantic` node. It is implemented in layer ③ with LangChain `SemanticChunker` or LlamaIndex `SemanticSplitterNodeParser`.

---

### 4.4 Strategy 4 — By-layout chunking (visual/HTML structure)

Leverages document structure: titles, subtitles, lists, tables. Tools like Unstructured.io classify each PDF block ("Title", "NarrativeText", "Table", "ListItem") and group them semantically.

```
PDF con estructura:
┌─────────────────────────────────────────┐
│ [Título] Capítulo 3. Resultados         │ ─── Chunk "Capítulo 3"
│ [NarrativeText] El análisis muestra...  │
│ [Table] | Año | Ingresos | Costos |     │ ─── Chunk tabla (→ JSON)
│         | 2022 | 1.2M    | 0.8M  |     │
│ [NarrativeText] La tabla anterior...   │ ─── Chunk "texto post-tabla"
└─────────────────────────────────────────┘
```

**When to use:**
- Financial reports with tables and charts.
- Technical documents where visual hierarchy (H1, H2, H3) is semantically relevant.

**Tool:** Unstructured.io (open source with cloud API). See §7.

---

### 4.5 Strategy 5 — By-clause/section chunking (domain-based)

Defines domain-specific separators: `CLÁUSULA N.` (contracts), `ATA-XX-YY-ZZ` (aircraft manuals), `Artículo N.` (regulations), `SECCIÓN N.` (policies).

**This is the most precise strategy when the domain has predictable structure.**

```
Contrato legal:
CLÁUSULA 1. OBJETO  ←── separador de dominio
  texto...
CLÁUSULA 2. DURACIÓN  ←── separador de dominio
  texto...
CLÁUSULA 3. PAGO  ←── separador de dominio
  texto...

→ 3 chunks perfectos, sin overhead de overlap
```

**When to use:**
- Contracts (by clause) — template 05-legal.
- Technical manuals with ATA numbering — template 08-manufacturing.
- Regulations with numbered articles.
- Company policies with named sections.

**When NOT to use:**
- Documents without clear semantic structure (narrative text).
- When separators are not consistent across all corpus documents.

**Config in RAGorbit:**
```json
{ "strategy": "by-clause", "chunkSize": 900, "overlap": 120 }
```

---

### 4.6 The overlap parameter

Overlap is the number of characters (or tokens) shared between consecutive chunks. Its role is to preserve context at the boundary between chunks.

```
Sin overlap:
  Chunk 0: "...La cláusula establece que el plazo"
  Chunk 1: "será de 30 días naturales. La penalización..."
  ← La oración queda partida; el retriever puede devolver solo Chunk 1
    y el LLM no sabe qué plazo son "30 días".

Con overlap de 50 chars:
  Chunk 0: "...La cláusula establece que el plazo"
  Chunk 1: "...que el plazo será de 30 días naturales. La penalización..."
  ← El contexto "que el plazo" se repite en Chunk 1, dando coherencia.
```

**Empirical rule:**
- Overlap of 10-15% of `chunkSize` for narrative text (e.g.: `chunkSize: 1000`, `overlap: 150`).
- Low or zero overlap for semantic chunks (by-clause, by-section): clauses are already autonomous units.
- Excessive overlap (>30%) increases index size without proportional benefit.

---

### 4.7 Chunking strategy comparison

| Strategy | Deterministic | Requires structure | Natural metadata | Ideal case |
|-----------|-------------|--------------------|--------------------|-----------|
| Fixed | yes | no | no | Quick prototype, free text |
| Recursive | yes | paragraphs | no | Articles, reports, policies |
| Semantic | no | no (uses embeddings) | no | Dense narrative text |
| By-layout | yes (with Unstructured) | visual structure | block type | Reports with tables, rich PDFs |
| By-clause/section | yes | domain structure | clausula_id, tipo | Contracts, technical manuals, regulations |

---

## 5. Metadata and its role in hard filters

### 5.1 What metadata is in chunks

Each chunk in the vector store is more than text + embedding. It carries a metadata dictionary the retriever can use as a filter **before** computing similarity. This is what RAGorbit docs call "hard filters as guardrails".

```python
chunk = {
    "text": "CLÁUSULA 9. CONFIDENCIALIDAD ...",
    "embedding": [0.023, -0.117, ...],   # generado por model.embedding
    "metadata": {
        "clausula_id": 9,
        "tipo": "confidencialidad",
        "contrato": "CSP-2024-0087",
        "fecha": "2024-01-15",
        "source": "contrato_muestra.txt"
    }
}
```

### 5.2 Hard filters vs. soft filters

- **Hard filter:** `WHERE` condition in the vector store query. Chunks that do not meet the condition are not scored, regardless of similarity.
- **Soft filter:** retrieve N chunks by similarity and then filter. "Wrong" chunks still consume topK.

**Hard filter example in RAGorbit:**
```json
{
  "type": "retrieval.vector",
  "config": {
    "topK": 5,
    "hardFilters": ["aircraft_type", "ata_chapter"]
  }
}
```

At query time, the pgvector SQL query is:
```sql
SELECT * FROM chunks
WHERE aircraft_type = 'A320' AND ata_chapter = '32'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

An A320 technician never sees 787 torque limits, even if the embedding is similar.

### 5.3 Metadata fields by domain

Each domain has its canonical fields. The `ingest.metadata` table in RAGorbit supports any field:

| Domain | Metadata fields | What to filter for |
|---------|-------------------|-----------------|
| Aviation (template 08) | `aircraft_type`, `ata_chapter`, `revision_date` | Only chunks for the correct aircraft and chapter |
| Financial (template 02) | `doc_type`, `period` | Only documents from the applicant's fiscal period |
| Legal (template 05) | `clausula_id`, `tipo` | Only clauses of a specific type |
| Insurance (template 04) | `fare_class`, `cobertura` | Only policies of the contracted fare class |
| HR (template 09) | `departamento`, `nivel`, `version` | Only current policies for the department |

### 5.4 How the `ingest.metadata` node produces these fields

In RAGorbit, the `ingest.metadata` node receives `Documents` from the chunker and labels each chunk. It can enrich metadata in three ways:

1. **Loader propagation:** the loader already adds `source`, `page_number`, etc.
2. **Text extraction:** domain regex or patterns (e.g., extract clause number from chunk text).
3. **Session context:** runtime metadata (e.g., `aircraft_type` comes from the user's session context).

### 5.5 Metadata and reproducibility

The fields `contrato`, `fecha`, and `revision_date` allow re-running exactly the same historical query. If an auditor asks "which manual version answered the technician on March 15, 2024?", the system can filter by `revision_date <= 2024-03-15` and reproduce the answer.

---

## 6. Multimodal: tables and diagrams

### 6.1 The problem with rich PDFs

A technical manual PDF is not just text. It contains:
- **Tolerance tables:** "maximum bolt torque: 45 Nm ± 5%"
- **Hydraulic diagrams:** line numbers, valves, sensors
- **Figures with captions:** "Fig. 32-11-00-991-010"

If you only extract text, you lose the semantic content of tables and diagrams. The retriever cannot find "bolt torque" because that information is in a table cell that the text extractor turned into "45 Nm ± 5%" without row/column context.

### 6.2 Tables → JSON

`loader.multimodal` with `extractTables: true` detects tables in the PDF and converts them to structured JSON:

```json
{
  "tipo": "tabla",
  "titulo": "Límites de tolerancia — Tren de aterrizaje principal",
  "datos": [
    {"parametro": "juego_lateral_pivote", "min": "0.00 mm", "max": "0.35 mm", "unidad": "mm"},
    {"parametro": "torque_perno_superior", "nominal": "45", "tolerancia": "±5%", "unidad": "Nm"}
  ],
  "referencia": "Tabla 32-11-00-991-001"
}
```

This JSON is indexed as text. Now the query "what is the maximum lateral play of the pivot?" can retrieve this chunk and the LLM can answer "0.35 mm" with an exact citation.

### 6.3 Diagrams → vision → text

For diagrams, `loader.multimodal` with `describeImages: true` sends each figure to `model.vision` (Claude Opus 4.8 or another multimodal model). The model returns a text description:

```
"Diagrama del sistema hidráulico del tren de aterrizaje principal del A320.
Muestra el actuador hidráulico (referencia 10-43200-00) conectado a la línea
hidráulica verde (sistema 1) mediante dos válvulas de cierre. La presión
nominal del sistema es 3000 PSI. Figura 32-21-11-991-020."
```

This description is indexed and retrieved as normal text. The retriever can find "hydraulic actuator" even though the figure does not contain that text explicitly.

### 6.4 sectionScheme: ATA

The `sectionScheme: ATA` parameter tells the loader to preserve ATA numeric hierarchy (Chapter-Section-Subject: `32-11-00`). This enables:

- **Chunking by ATA section:** each section is an autonomous chunk with `metadata.ata_chapter`.
- **Hard filters:** `retrieval.vector` can filter by `ata_chapter: "32"` before searching.

**When to use `sectionScheme`:** whenever the document has a standard numbering hierarchy (ATA, ISO, regulations with articles).

### 6.5 Limitations and when to scale

The multimodal pipeline is slower and costlier:
- Table extraction: +50-200ms per page with tables.
- Vision per diagram: 1-3s per vision model call, additional token cost.

**Rule:** only use `extractTables: true` and `describeImages: true` when tabular or visual content is essential to answer user questions. For an HR policy chatbot, you do not need vision. For aircraft maintenance manual RAG, it is essential.

---

## 7. Ingestion framework comparison

### 7.1 LangChain loaders

LangChain includes more than 100 loaders in `langchain-community`. They are generally simple wrappers around Python libraries:

```python
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, WebBaseLoader

# PDF
loader = PyPDFLoader("contrato.pdf")
docs = loader.load()  # una página = un Document

# CSV
loader = CSVLoader("datos.csv", metadata_columns=["doc_type", "period"])
docs = loader.load()  # una fila = un Document

# Web
loader = WebBaseLoader(["https://example.com/politica"])
docs = loader.load()
```

**Pros:** easy to install, integrates with the LangChain ecosystem (splitters, stores).
**Cons:** extraction quality varies by underlying library; does not include vision by default; multimodal requires extensions.

### 7.2 LlamaIndex readers

LlamaIndex uses the term "reader" instead of "loader". The `llama-hub` ecosystem has readers for dozens of sources:

```python
from llama_index.readers.file import PDFReader, CSVReader
from llama_index.core import SimpleDirectoryReader

# PDF con metadatos por página
reader = PDFReader()
docs = reader.load_data("contrato.pdf")  # carga con page_label

# Directorio completo (detecta tipo de archivo automáticamente)
reader = SimpleDirectoryReader("data/contracts/", recursive=True)
docs = reader.load_data()
```

**Pros:** LlamaIndex's `Node` abstraction carries richer metadata by default; native integration with its indexes and splitters.
**Cons:** separate ecosystem from LangChain; steeper learning curve.

### 7.3 Unstructured.io

Unstructured is a tool specialized in parsing unstructured documents. It categorizes each document element:

```python
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf("manual_tecnico.pdf", strategy="hi_res")
# elements es una lista de objetos tipados:
# Title("Capítulo 32 Landing Gear")
# NarrativeText("El tren de aterrizaje principal...")
# Table(text="| Parámetro | Min | Max |...", metadata={"page_number": 47})
# Image(metadata={"filename": "fig_32-11.png"})
```

**Pros:** best extraction quality for complex PDFs; detects tables, lists, titles, figures; `hi_res` mode uses computer vision for complicated layouts.
**Cons:** slower than simple loaders; `hi_res` mode requires `detectron2` (heavy) or the cloud API.

### 7.4 When to use each

| Tool | Best for | Avoid if |
|------------|-----------|----------|
| LangChain loaders | Simple PDFs, CSVs, web; LangChain ecosystem | You need very high extraction quality |
| LlamaIndex readers | LlamaIndex ecosystem; rich metadata; multiple formats in one directory | You only use LangChain |
| Unstructured.io | Rich PDFs (complex tables, multiple columns, figures); maximum quality | You have limited resources or the PDF is simple |
| RAGorbit `loader.multimodal` | Technical manuals with `sectionScheme`; tables → JSON; diagrams → vision | The document is text-only without tables/images |

---

## 8. Full pipelining in RAGorbit

### 8.1 `ingest.chunker` node

The node receives `Documents` from the loader and produces `Documents` (chunks). Key config:

```json
{
  "type": "ingest.chunker",
  "config": {
    "strategy": "by-clause",
    "chunkSize": 900,
    "overlap": 120
  }
}
```

The three strategies the node supports:
- `recursive` — RecursiveCharacterTextSplitter (default).
- `by-section` — splits on section headers (`#`, `##`, or domain patterns).
- `by-clause` — splits on numbered clauses (`CLÁUSULA N.`, `Artículo N.`).

### 8.2 `ingest.metadata` node

Receives `Documents` from the chunker and adds metadata:

```json
{
  "type": "ingest.metadata",
  "config": {
    "fields": ["doc_type", "period", "aircraft_type", "ata_chapter"]
  }
}
```

Fields can be populated from three sources:
1. **Propagated from loader** (e.g.: `source`, `page_number`).
2. **Extracted from chunk text** with regex (e.g.: `clausula_id` from header).
3. **Injected at runtime** from session context (e.g.: `aircraft_type` from user JWT).

### 8.3 Typical pipeline

```
[loader.pdf]          [ingest.chunker]       [ingest.metadata]
  Documents ─────────▶   Documents ──────────▶  Documents
                          strategy: by-clause    fields: [clausula_id,
                          chunkSize: 900              tipo, contrato,
                          overlap: 120                fecha]
                                                       │
                                              ┌────────┘
                                              ▼
                                       [store.pgvector]  ◀── [model.embedding]
                                         Embeddings
                                         Documents
                                              │
                                              ▼
                                         Retriever ──▶ [retrieval.vector]
                                                        hardFilters: [tipo]
```

### 8.4 Connection with template 09 (HR)

Template `09-hr-policy-assistant` (seen in M1) uses the simplest pipeline:

```
loader.pdf → ingest.chunker (strategy: recursive) → store.chroma
```

No explicit `ingest.metadata` because the chatbot does not need to filter by document type — everything is HR policy. Relevance filtering is done by the retriever via similarity.

When you add multiple departments or policy versions, you do need metadata:
```json
{ "fields": ["departamento", "vigente_desde", "version"] }
```

---

## 9. When to use / when not to / alternatives

### When to **invest** in a robust ingestion pipeline

- The corpus has more than ~1000 documents and is growing.
- Documents have domain-specific structure (contracts, technical manuals, regulations).
- Users ask questions that require filtering by type/date/context.
- Answer precision has regulatory or safety consequences (aviation, medicine, credit).

### When **not** to over-engineer the pipeline

- The corpus is small (<100 documents) and static: a `RecursiveCharacterTextSplitter` with `chunkSize: 1000` is enough.
- You are in prototype phase: first validate that RAG solves the problem; then optimize chunking.
- Documents are continuous text without structure (novels, blog posts): semantic or fixed chunking works well.

### Alternatives to the standard pipeline

| Alternative | When to choose it | Tradeoff |
|------------|----------------|---------|
| **Unstructured.io API** | You need maximum quality without implementing your own parsing | Cost per call, external dependency |
| **LlamaIndex SimpleDirectoryReader** | Multiple file types in one directory | Less flexible for domain metadata |
| **Apache Tika** | Heterogeneous corpus with rare formats (DOCX, ODT, PPT) | Java as dependency |
| **No chunking (full context)** | Short documents (<4000 tokens) and LLM with large window | Does not scale; expensive in tokens |
| **Fine-tuning instead of RAG** | Very stable documents + very repetitive questions | Costly to update; no source traceability |

---

## 10. Layer ③ explained: chunking with LangChain from scratch

> **Prerequisite:** in M1 you learned what LangChain is, the `Document` object (`page_content` + `metadata`), loaders (`TextLoader`), and the `loader → splitter → store` pipeline. If you do not remember, read [§11 of the M1 guide](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch) first (5 minutes). **Here we only teach what is new in M2:** LangChain *text splitters* and how to write a custom one for domain chunking.

This section bridges what you did by hand in the lab (`solucion_scratch.py`) and what you will see in production with LangChain (`lab/solucion_framework.py`). When you finish it, you should be able to **write** Approach A and Approach B of the lab, not just read them.

### 10.1 Bridge table: scratch → LangChain

| What you did by hand (layer ②) | Equivalent piece in LangChain (layer ③) |
|-------------------------------|----------------------------------------|
| `open(path).read()` | `TextLoader(path).load()` → list of `Document` |
| Your `Chunk` dataclass | `Document(page_content=..., metadata={...})` |
| `re.compile(r'^CLÁUSULA...', re.MULTILINE)` | Logic inside `split_text()` of a custom splitter |
| Loop `matches[i].start()` → `matches[i+1].start()` | Same algorithm, but encapsulated in `ClauseSplitter` |
| `clasificar_clausula(titulo)` | `_clasificar(titulo)` inside the custom splitter |
| `chunk.metadata["source"] = "contrato_muestra.txt"` | Parent `Document` metadata propagated in `split_documents()` |
| `print(json.dumps(chunk))` | `splitter.split_documents(docs)` → list ready for `Chroma.from_documents()` |

```
Capa ② (scratch)                    Capa ③ (LangChain)
─────────────────                   ─────────────────────
texto = open(...).read()     →      docs = TextLoader(...).load()
regex + bucle manual         →      splitter.split_documents(docs)
dict metadata a mano         →      Document.metadata automático
script suelto                →      integración con vector stores
```

### 10.2 `RecursiveCharacterTextSplitter`: the recursive algorithm

It is LangChain's **generic** default splitter. It does not know your domain (clauses, ATA, articles); it only tries to cut text respecting separators from most to least semantic until each piece fits in `chunk_size`.

**Installation:** `pip install langchain-text-splitters`

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " ", ""],  # orden: más semántico → menos
    chunk_size=1000,
    chunk_overlap=150,
    keep_separator=True,
)
chunks = splitter.create_documents([texto_largo])
# chunks[i] es un Document(page_content=..., metadata={})
```

#### The algorithm, step by step

Imagine text of 2500 characters and `chunk_size=1000`. The splitter works **recursively** on each fragment:

```
                    TEXTO (2500 chars)
                           │
              ¿Cabe en chunk_size=1000?  NO
                           │
         Prueba separador[0] = "\n\n" (párrafos)
                           │
              ┌────────────┴────────────┐
         Párrafo A (400)          Párrafo B (2100)
         ¿Cabe? SÍ → chunk 0      ¿Cabe? NO
                                        │
                         Prueba separador[1] = "\n" (líneas)
                                        │
                         ┌──────────────┴──────────────┐
                    Línea 1 (500)              Resto (1600)
                    ¿Cabe? SÍ → chunk 1        ¿Cabe? NO
                                                    │
                                    Prueba separador[2] = ". " (oraciones)
                                                    │
                                    ... y así hasta que cada trozo ≤ 1000
```

**Algorithm rules:**

1. Receives a text block and the separator list (most to least semantic).
2. Tries to split with the **first** separator in the list.
3. For each resulting sub-block:
   - If `len(sub_bloque) ≤ chunk_size` → it is a candidate chunk.
   - If `len(sub_bloque) > chunk_size` → **recursion**: return to step 2 with the **next** separator in the list.
4. If separators are exhausted, cut by characters (separator `""` forces hard cut).
5. Apply `chunk_overlap` between consecutive chunks (sliding; see [§4.6](#46-the-overlap-parameter)).

**Concrete mini-example:**

```python
texto = (
    "Párrafo corto.\n\n"
    "Párrafo larguísimo que supera el límite. " * 30  # ~1500 chars
)

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " "],
    chunk_size=500,
    chunk_overlap=0,
)
chunks = splitter.create_documents([texto])
# Resultado aproximado:
#   Chunk 0: "Párrafo corto."           ← cabía entero tras split por "\n\n"
#   Chunk 1: primeras oraciones del párrafo largo  ← el largo se partió por ". "
#   Chunk 2: oraciones siguientes...
```

#### Parameters you must understand

| Parameter | What it does | Common gotcha |
|-----------|----------|--------------|
| `separators` | Ordered list of preferred cuts | Order matters: `["\nCLÁUSULA ", "\n\n", "\n", " "]` prioritizes clauses over paragraphs |
| `chunk_size` | Maximum characters per chunk | Too small fragments excessively; too large fills the LLM window |
| `chunk_overlap` | Characters repeated between neighboring chunks | With domain separators (clauses), usually `0` — see [§4.6](#46-the-overlap-parameter) |
| `keep_separator` | If `True`, separator stays at the start of the next chunk | With `"\nCLÁUSULA "` and `keep_separator=True`, each chunk starts with `CLÁUSULA N.` |

#### `.create_documents()` vs `.split_documents()`

```python
# Desde texto crudo (sin metadata de origen):
chunks = splitter.create_documents([texto])
# metadata vacía: {}

# Desde Documents que ya trajo un loader (con source, page, etc.):
from langchain_community.document_loaders import TextLoader
docs = TextLoader("contrato.txt").load()
chunks = splitter.split_documents(docs)
# cada chunk hereda metadata del Document padre (source, etc.)
```

For real ingestion, you almost always use `split_documents()` because the loader already added `source` and other fields. See [§7.1](#71-langchain-loaders) for the loader comparison.

### 10.3 Writing your own splitter: inherit from `TextSplitter`

When the domain has predictable structure (clauses, articles, ATA sections), a generic splitter is not enough: you need **rich metadata** (`clausula_id`, `tipo`, `contrato`) that you can only extract with domain regex. The solution is to inherit from `TextSplitter`.

#### The interface you must implement

```python
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document

class MiSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        """OBLIGATORIO: recibe texto, devuelve lista de strings."""
        ...

    def split_documents(self, documents: list[Document]) -> list[Document]:
        """OPCIONAL pero recomendado: override para metadata rica."""
        ...
```

| Method | Input | Output | When used |
|--------|---------|--------|---------------|
| `split_text(text)` | One string | `list[str]` | Base API; other methods call it internally |
| `split_documents(docs)` | `list[Document]` | `list[Document]` | Real pipeline: preserves and enriches metadata |

**Why override `split_documents()`:** the default `TextSplitter` implementation calls `split_text()` and wraps each string in a `Document` with minimal metadata. If you only implement `split_text()`, you lose the chance to add `clausula_id`, `tipo`, etc. The override lets you return complete `Document` objects.

#### Minimal skeleton connected to the lab

```python
class ClauseSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        # Delega al método que construye Documents completos
        return [d.page_content for d in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        matches = list(self._PATRON.finditer(text))
        docs = []
        for i, m in enumerate(matches):
            inicio = m.start()
            fin = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            docs.append(Document(
                page_content=text[inicio:fin].strip(),
                metadata={
                    "clausula_id": int(m.group(1)),
                    "titulo": m.group(2).strip(),
                    "tipo": self._clasificar(m.group(2)),
                    # ...
                },
            ))
        return docs

    def split_documents(self, documents: list[Document]) -> list[Document]:
        all_docs = []
        for doc in documents:
            for chunk in self._split_to_docs(doc.page_content):
                # Preservar metadata del padre (source del loader)
                chunk.metadata["source"] = doc.metadata.get("source", "")
                all_docs.append(chunk)
        return all_docs
```

This is exactly the pattern of `ClauseSplitter` in `lab/solucion_framework.py` — the same regex logic as `solucion_scratch.py`, but packaged for the LangChain ecosystem.

### 10.4 Loader → splitter integration (full pipeline)

```
┌─────────────┐     load()      ┌──────────────────┐   split_documents()   ┌─────────────┐
│ TextLoader  │ ──────────────▶ │ list[Document]   │ ────────────────────▶ │ list[Document│
│ contrato.txt│                 │ metadata: source │                       │ chunks con  │
└─────────────┘                 └──────────────────┘                       │ metadata    │
                                                                           └─────────────┘
```

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("datos/contrato_muestra.txt")
docs = loader.load()
# docs[0].page_content = texto completo del archivo
# docs[0].metadata = {"source": "datos/contrato_muestra.txt"}

splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents(docs)
# 13 Documents, cada uno con clausula_id, titulo, tipo, contrato, fecha, source
```

**Where each ingestion framework fits** (summary; detail in [§7](#7-ingestion-framework-comparison)):

| Framework | Role in this pipeline | Equivalent piece |
|-----------|---------------------|-------------------|
| LangChain `TextLoader` | Load the file | `open().read()` in scratch |
| LangChain `TextSplitter` | Split + metadata | Your regex loop in scratch |
| LlamaIndex `SimpleDirectoryReader` | Loader alternative; detects file type | Several LangChain loaders by hand |
| Unstructured | Advanced parsing of rich PDFs | Does not replace the splitter; goes **before** (better input text) |

In M2 the focus is the **splitter**. You compared loaders in [§7](#7-ingestion-framework-comparison); in the lab we use `TextLoader` because the contract is already plain `.txt`.

### 10.5 Block-by-block walkthrough of `solucion_framework.py`

Open `lab/solucion_framework.py` and follow along with this section. The file has three blocks.

#### Block 1 — Approach A: `RecursiveCharacterTextSplitter`

```python
splitter_a = RecursiveCharacterTextSplitter(
    separators=["\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
    keep_separator=True,
)
chunks_a = splitter_a.create_documents([texto_contrato])
```

| Line / decision | What it does | Why |
|------------------|----------|---------|
| `"\nCLÁUSULA "` first | Tries to cut before each clause header | Leverages contract structure without custom regex |
| `chunk_size=1200` | Limit per chunk | If a clause exceeds 1200 chars, the algorithm falls back to the next separator (`\n\n`, `\n`, ` `) and splits into smaller pieces |
| `chunk_overlap=0` | No overlap | Clauses are autonomous units — see [§4.6](#46-the-overlap-parameter) |
| `keep_separator=True` | Keeps `CLÁUSULA N.` at chunk start | Retriever returns identifiable context |
| `create_documents([texto])` | Splits raw text | No intermediate loader; metadata stays empty |

**Pedagogical limitation:** Approach A does not produce `clausula_id` or `tipo`. It is a good *baseline* for comparison, not the production solution for contracts.

#### Block 2 — Approach B: custom `ClauseSplitter`

| Component | Scratch equivalent | Function |
|------------|------------------------|---------|
| `_PATRON` with `re.MULTILINE` | `_PATRON_CLAUSULA` | Detect only line-start headers |
| Loop `matches[i].start()` → `fin` | Same loop in `parsear_clausulas()` | Delimit each clause's text |
| `_clasificar(titulo)` | `clasificar_clausula(titulo)` | Infer `tipo` from keywords |
| `split_documents([doc_base])` | `main()` that reads and splits | Integration with `source` metadata |

```python
doc_base = Document(
    page_content=texto_contrato,
    metadata={"source": "contrato_muestra.txt"},
)
chunks_b = splitter_b.split_documents([doc_base])
# Esperado: 13 chunks, mismos metadatos que solucion_scratch.py
```

#### Block 3 — Vector store integration (commented out)

```python
# vectordb = Chroma.from_documents(documents=chunks_b, embedding=OpenAIEmbeddings(), ...)
# results = vectordb.similarity_search(query="...", k=3, filter={"tipo": "responsabilidad"})
```

This block closes the `loader → splitter → store` pipeline from [§8.3](#83-typical-pipeline). Approach B chunks carry `tipo` in metadata, enabling the **hard filter** from [§5](#5-metadata-and-its-role-in-hard-filters): only chunks with `tipo="responsabilidad"` compete in search.

### 10.6 When to use generic vs domain custom splitter

| Situation | Recommended splitter | Reason |
|-----------|---------------------|-------|
| Quick prototype, unstructured text | `RecursiveCharacterTextSplitter` | Zero custom code; enough to validate RAG |
| HR policies (paragraphs) | `RecursiveCharacterTextSplitter` with `separators=["\n\n", "\n", ". "]` | Generic paragraph structure — see [§4.2](#42-strategy-2--recursive-chunking-hierarchical-separators) |
| Contracts, regulations, ATA manuals | Custom splitter (`ClauseSplitter`, `ATASplitter`, etc.) | Domain metadata + zero false positives |
| PDFs with complex tables | Unstructured **before** + generic or custom splitter **after** | Better input parsing; see [§7.3](#73-unstructuredio) |

#### Gotchas that appear in production

**1. `keep_separator` and the first chunk**

With `keep_separator=True` and separator `"\nCLÁUSULA "`, text *before* the first clause (contract header, date, parties) may remain as a loose chunk 0. In real contracts, discard or merge that preface in post-processing.

**2. Overlap in domain chunks**

With `by-clause`, overlap is usually **0**: repeating the end of Clause 3 at the start of Clause 4 adds no useful context and duplicates embeddings. Reserve overlap for continuous narrative text ([§4.6](#46-the-overlap-parameter)).

**3. Metadata that gets lost**

```python
# ❌ Solo split_text — metadata del padre no se propaga bien
chunks = splitter.split_text(doc.page_content)

# ✅ split_documents — preserva source y enriquece
chunks = splitter.split_documents([doc])
```

If you only call `split_text()` and build `Document` manually forgetting `doc.metadata`, you lose `source` and any field the loader added. The retriever cannot filter or cite the source file.

**4. `RecursiveCharacterTextSplitter` without `^` anchor**

The separator `"\nCLÁUSULA "` does not distinguish headers from references like `"conforme a la Cláusula 9..."` if that reference starts after a line break. That is why Approach A may generate spurious chunks; Approach B with `^` in the regex does not.

### 10.7 Guided exercise: write your version before looking at the solution

Follow this order in the [lab](lab/enunciado.md#layer--chunking-with-langchain-guided-task):

1. Finish layer ② (`solucion_scratch.py`) and verify 13 chunks against `expected.md`.
2. With pip available, install `langchain-text-splitters langchain-community`.
3. Write Approach A with `RecursiveCharacterTextSplitter` — print how many chunks it produces and compare with 13.
4. Write Approach B: `ClauseSplitter` class inheriting from `TextSplitter`.
5. Compare your code with `lab/solucion_framework.py` line by line.

---

## 11. Checkpoint

### You know it if you can…

1. Explain the difference between a selectable PDF and a scanned one, and when to use OCR.
2. Choose the correct chunking strategy given a document type (contract, technical manual, article, CSV).
3. Calculate how many chunks a 5000-char text produces with `chunkSize: 1000` and `overlap: 150`.
4. Explain why `re.MULTILINE` with `^` avoids false positives in the clause chunker.
5. Define what metadata fields you would add to template 08 (manufacturing) and what filters they serve.
6. Compare LangChain loaders vs. Unstructured.io for a PDF with complex tables.
7. Trace the full `loader → chunker → metadata → store` pipeline for template 02 (banking).
8. Explain the recursive algorithm of `RecursiveCharacterTextSplitter` and when to use it vs a custom splitter.
9. Implement `split_text()` and `split_documents()` when inheriting from `TextSplitter`.
10. Identify why metadata is lost if you only use `split_text()` without propagating the parent document's metadata.

### What to review if it is still unclear

- Full section 4 if chunking is still confusing.
- Section 5 if you do not understand how hard filters use metadata.
- Section 10 if layer ③ (LangChain splitters) feels abrupt.
- `Document` and basic loaders: [M1 §11](../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch).
- `docs/02-node-catalog.md` §loaders and §ingestion in the ragorbit repo.
- READMEs of `examples/05-legal-contract-review/` and `examples/08-manufacturing-maintenance-rag/`.

### Next step

1. Do the lab (`lab/enunciado.md`): chunk the contract with layer ② (`solucion_scratch.py`) and verify 13 chunks against `lab/expected.md`.
2. Follow the [layer ③ guided task](lab/enunciado.md#layer--chunking-with-langchain-guided-task): write Approach A and the Approach B `ClauseSplitter` using [§10](guia.md#10-layer--explained-chunking-with-langchain-from-scratch), and compare with `solucion_framework.py`.
3. Solve exercises 28–30 on LangChain splitters.

When you finish, continue with **M3 — Embeddings and Vector Stores** (`03-embeddings-y-stores/`).

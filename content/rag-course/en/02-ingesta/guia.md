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
Raw documents
      │
      ▼
 ┌─────────┐    parsing    ┌──────────────┐   chunking   ┌────────────┐
 │ Loader  │ ────────────▶ │  clean text  │ ────────────▶ │  chunks[]  │
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

`loader.sql` runs a query and converts each row into a document. Example: the query `SELECT sku, description, specifications FROM products WHERE active = true` produces one document per product. This enables RAG over product catalogs without exporting to CSV.

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
clean_text = unicodedata.normalize("NFKC", raw_text)
```

### 3.2 Tabular parsing

`loader.tabular` reads CSV/Parquet with `pandas` (or equivalent). The `schemaHint` config helps the loader interpret ambiguous columns. For example, a `period` column may be a string "2023-Q3" or an integer `20234`.

**Conversion to text:** each row becomes readable text:
```
concept: annual_income | value: 85000 | period: 2023
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
Original text:
  [──────── 1000 chars ────────][──────── 1000 chars ────────]
                            [── overlap 200 ──]

Resulting chunks:
  Chunk 0: chars 0..1000
  Chunk 1: chars 800..1800    ← overlap covers the transition context
  Chunk 2: chars 1600..2600
```

**ASCII diagram:**
```
TEXT: "The indemnity...limit of 2×...deadline of 30 days..."
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
TEXT with well-marked paragraphs:
┌──────────────────────────────────────┐
│ Paragraph 1 (400 chars)              │ ← chunk 0 (fits in 1000)
├──────────────────────────────────────┤
│ Paragraph 2 (600 chars)              │ ← chunk 1 (fits in 1000)
├──────────────────────────────────────┤
│ Paragraph 3 very long (2000 chars)   │ ← split by sentences
│   Sentence 1 (400)                   │   chunk 2
│   Sentence 2 (300)                   │   chunk 3
│   Sentence 3 + Sentence 4 (900)      │   chunk 4
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
Sentences with their embedding:
  S1 ─── S2 ─── S3 ─── S4 ─── S5 ─── S6
         │high similarity│     │low │   │high│
                          ← cut →      ← cut →

Resulting chunks:
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
PDF with structure:
┌─────────────────────────────────────────┐
│ [Title] Chapter 3. Results              │ ─── Chunk "Chapter 3"
│ [NarrativeText] The analysis shows...   │
│ [Table] | Year | Revenue | Costs |      │ ─── Chunk table (→ JSON)
│         | 2022 | 1.2M    | 0.8M  |     │
│ [NarrativeText] The table above...      │ ─── Chunk "post-table text"
└─────────────────────────────────────────┘
```

**When to use:**
- Financial reports with tables and charts.
- Technical documents where visual hierarchy (H1, H2, H3) is semantically relevant.

**Tool:** Unstructured.io (open source with cloud API). See §7.

---

### 4.5 Strategy 5 — By-clause/section chunking (domain-based)

Defines domain-specific separators: `CLAUSE N.` (contracts), `ATA-XX-YY-ZZ` (aircraft manuals), `Article N.` (regulations), `SECTION N.` (policies).

**This is the most precise strategy when the domain has predictable structure.**

```
Legal contract:
CLAUSE 1. PURPOSE  ←── domain separator
  text...
CLAUSE 2. DURATION  ←── domain separator
  text...
CLAUSE 3. PAYMENT  ←── domain separator
  text...

→ 3 perfect chunks, no overlap overhead
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
Without overlap:
  Chunk 0: "...The clause establishes that the deadline"
  Chunk 1: "shall be 30 calendar days. The penalty..."
  ← The sentence is split; the retriever may return only Chunk 1
    and the LLM does not know what "30 days" refers to.

With overlap of 50 chars:
  Chunk 0: "...The clause establishes that the deadline"
  Chunk 1: "...that the deadline shall be 30 calendar days. The penalty..."
  ← The context "that the deadline" is repeated in Chunk 1, providing coherence.
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
| By-clause/section | yes | domain structure | clause_id, type | Contracts, technical manuals, regulations |

---

## 5. Metadata and its role in hard filters

### 5.1 What metadata is in chunks

Each chunk in the vector store is more than text + embedding. It carries a metadata dictionary the retriever can use as a filter **before** computing similarity. This is what RAGorbit docs call "hard filters as guardrails".

```python
chunk = {
    "text": "CLAUSE 9. CONFIDENTIALITY ...",
    "embedding": [0.023, -0.117, ...],   # generated by model.embedding
    "metadata": {
        "clause_id": 9,
        "type": "confidentiality",
        "contract": "CSP-2024-0087",
        "date": "2024-01-15",
        "source": "sample_contract.txt"
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
| Legal (template 05) | `clause_id`, `type` | Only clauses of a specific type |
| Insurance (template 04) | `fare_class`, `coverage` | Only policies of the contracted fare class |
| HR (template 09) | `department`, `level`, `version` | Only current policies for the department |

### 5.4 How the `ingest.metadata` node produces these fields

In RAGorbit, the `ingest.metadata` node receives `Documents` from the chunker and labels each chunk. It can enrich metadata in three ways:

1. **Loader propagation:** the loader already adds `source`, `page_number`, etc.
2. **Text extraction:** domain regex or patterns (e.g., extract clause number from chunk text).
3. **Session context:** runtime metadata (e.g., `aircraft_type` comes from the user's session context).

### 5.5 Metadata and reproducibility

The fields `contract`, `date`, and `revision_date` allow re-running exactly the same historical query. If an auditor asks "which manual version answered the technician on March 15, 2024?", the system can filter by `revision_date <= 2024-03-15` and reproduce the answer.

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
  "type": "table",
  "title": "Tolerance limits — Main landing gear",
  "data": [
    {"parameter": "pivot_lateral_play", "min": "0.00 mm", "max": "0.35 mm", "unit": "mm"},
    {"parameter": "upper_bolt_torque", "nominal": "45", "tolerance": "±5%", "unit": "Nm"}
  ],
  "reference": "Table 32-11-00-991-001"
}
```

This JSON is indexed as text. Now the query "what is the maximum lateral play of the pivot?" can retrieve this chunk and the LLM can answer "0.35 mm" with an exact citation.

### 6.3 Diagrams → vision → text

For diagrams, `loader.multimodal` with `describeImages: true` sends each figure to `model.vision` (Claude Opus 4.8 or another multimodal model). The model returns a text description:

```
"Diagram of the main landing gear hydraulic system of the A320.
Shows the hydraulic actuator (reference 10-43200-00) connected to the
green hydraulic line (system 1) via two shutoff valves. The nominal
system pressure is 3000 PSI. Figure 32-21-11-991-020."
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
loader = PyPDFLoader("contract.pdf")
docs = loader.load()  # one page = one Document

# CSV
loader = CSVLoader("data.csv", metadata_columns=["doc_type", "period"])
docs = loader.load()  # one row = one Document

# Web
loader = WebBaseLoader(["https://example.com/policy"])
docs = loader.load()
```

**Pros:** easy to install, integrates with the LangChain ecosystem (splitters, stores).
**Cons:** extraction quality varies by underlying library; does not include vision by default; multimodal requires extensions.

### 7.2 LlamaIndex readers

LlamaIndex uses the term "reader" instead of "loader". The `llama-hub` ecosystem has readers for dozens of sources:

```python
from llama_index.readers.file import PDFReader, CSVReader
from llama_index.core import SimpleDirectoryReader

# PDF with metadata per page
reader = PDFReader()
docs = reader.load_data("contract.pdf")  # loads with page_label

# Full directory (auto-detects file type)
reader = SimpleDirectoryReader("datos/contracts/", recursive=True)
docs = reader.load_data()
```

**Pros:** LlamaIndex's `Node` abstraction carries richer metadata by default; native integration with its indexes and splitters.
**Cons:** separate ecosystem from LangChain; steeper learning curve.

### 7.3 Unstructured.io

Unstructured is a tool specialized in parsing unstructured documents. It categorizes each document element:

```python
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf("technical_manual.pdf", strategy="hi_res")
# elements is a list of typed objects:
# Title("Chapter 32 Landing Gear")
# NarrativeText("The main landing gear...")
# Table(text="| Parameter | Min | Max |...", metadata={"page_number": 47})
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
- `by-clause` — splits on numbered clauses (`CLAUSE N.`, `Article N.`).

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
2. **Extracted from chunk text** with regex (e.g.: `clause_id` from header).
3. **Injected at runtime** from session context (e.g.: `aircraft_type` from user JWT).

### 8.3 Typical pipeline

```
[loader.pdf]          [ingest.chunker]       [ingest.metadata]
  Documents ─────────▶   Documents ──────────▶  Documents
                          strategy: by-clause    fields: [clause_id,
                          chunkSize: 900              type, contract,
                          overlap: 120                date]
                                                       │
                                              ┌────────┘
                                              ▼
                                       [store.pgvector]  ◀── [model.embedding]
                                         Embeddings
                                         Documents
                                              │
                                              ▼
                                         Retriever ──▶ [retrieval.vector]
                                                        hardFilters: [type]
```

### 8.4 Connection with template 09 (HR)

Template `09-hr-policy-assistant` (seen in M1) uses the simplest pipeline:

```
loader.pdf → ingest.chunker (strategy: recursive) → store.chroma
```

No explicit `ingest.metadata` because the chatbot does not need to filter by document type — everything is HR policy. Relevance filtering is done by the retriever via similarity.

When you add multiple departments or policy versions, you do need metadata:
```json
{ "fields": ["department", "effective_since", "version"] }
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
| `re.compile(r'^CLAUSE...', re.MULTILINE)` | Logic inside `split_text()` of a custom splitter |
| Loop `matches[i].start()` → `matches[i+1].start()` | Same algorithm, but encapsulated in `ClauseSplitter` |
| `classify_clause(title)` | `_classify(title)` inside the custom splitter |
| `chunk.metadata["source"] = "sample_contract.txt"` | Parent `Document` metadata propagated in `split_documents()` |
| `print(json.dumps(chunk))` | `splitter.split_documents(docs)` → list ready for `Chroma.from_documents()` |

```
Layer ② (scratch)                   Layer ③ (LangChain)
─────────────────                   ─────────────────────
text = open(...).read()      →      docs = TextLoader(...).load()
regex + manual loop          →      splitter.split_documents(docs)
dict metadata by hand        →      Document.metadata automatic
standalone script            →      integration with vector stores
```

### 10.2 `RecursiveCharacterTextSplitter`: the recursive algorithm

It is LangChain's **generic** default splitter. It does not know your domain (clauses, ATA, articles); it only tries to cut text respecting separators from most to least semantic until each piece fits in `chunk_size`.

**Installation:** `pip install langchain-text-splitters`

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " ", ""],  # order: most semantic → least
    chunk_size=1000,
    chunk_overlap=150,
    keep_separator=True,
)
chunks = splitter.create_documents([long_text])
# chunks[i] is a Document(page_content=..., metadata={})
```

#### The algorithm, step by step

Imagine text of 2500 characters and `chunk_size=1000`. The splitter works **recursively** on each fragment:

```
                    TEXT (2500 chars)
                           │
              Fits in chunk_size=1000?  NO
                           │
         Try separator[0] = "\n\n" (paragraphs)
                           │
              ┌────────────┴────────────┐
         Paragraph A (400)        Paragraph B (2100)
         Fits? YES → chunk 0       Fits? NO
                                        │
                         Try separator[1] = "\n" (lines)
                                        │
                         ┌──────────────┴──────────────┐
                    Line 1 (500)              Remainder (1600)
                    Fits? YES → chunk 1        Fits? NO
                                                    │
                                    Try separator[2] = ". " (sentences)
                                                    │
                                    ... and so on until each piece ≤ 1000
```

**Algorithm rules:**

1. Receives a text block and the separator list (most to least semantic).
2. Tries to split with the **first** separator in the list.
3. For each resulting sub-block:
   - If `len(sub_block) ≤ chunk_size` → it is a candidate chunk.
   - If `len(sub_block) > chunk_size` → **recursion**: return to step 2 with the **next** separator in the list.
4. If separators are exhausted, cut by characters (separator `""` forces hard cut).
5. Apply `chunk_overlap` between consecutive chunks (sliding; see [§4.6](#46-the-overlap-parameter)).

**Concrete mini-example:**

```python
text = (
    "Short paragraph.\n\n"
    "Very long paragraph that exceeds the limit. " * 30  # ~1500 chars
)

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", ". ", " "],
    chunk_size=500,
    chunk_overlap=0,
)
chunks = splitter.create_documents([text])
# Approximate result:
#   Chunk 0: "Short paragraph."           ← fit entirely after split by "\n\n"
#   Chunk 1: first sentences of the long paragraph  ← the long one was split by ". "
#   Chunk 2: next sentences...
```

#### Parameters you must understand

| Parameter | What it does | Common gotcha |
|-----------|----------|--------------|
| `separators` | Ordered list of preferred cuts | Order matters: `["\nCLAUSE ", "\n\n", "\n", " "]` prioritizes clauses over paragraphs |
| `chunk_size` | Maximum characters per chunk | Too small fragments excessively; too large fills the LLM window |
| `chunk_overlap` | Characters repeated between neighboring chunks | With domain separators (clauses), usually `0` — see [§4.6](#46-the-overlap-parameter) |
| `keep_separator` | If `True`, separator stays at the start of the next chunk | With `"\nCLAUSE "` and `keep_separator=True`, each chunk starts with `CLAUSE N.` |

#### `.create_documents()` vs `.split_documents()`

```python
# From raw text (no source metadata):
chunks = splitter.create_documents([text])
# empty metadata: {}

# From Documents already loaded by a loader (with source, page, etc.):
from langchain_community.document_loaders import TextLoader
docs = TextLoader("contract.txt").load()
chunks = splitter.split_documents(docs)
# each chunk inherits metadata from the parent Document (source, etc.)
```

For real ingestion, you almost always use `split_documents()` because the loader already added `source` and other fields. See [§7.1](#71-langchain-loaders) for the loader comparison.

### 10.3 Writing your own splitter: inherit from `TextSplitter`

When the domain has predictable structure (clauses, articles, ATA sections), a generic splitter is not enough: you need **rich metadata** (`clause_id`, `type`, `contract`) that you can only extract with domain regex. The solution is to inherit from `TextSplitter`.

#### The interface you must implement

```python
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document

class MySplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        """REQUIRED: receives text, returns list of strings."""
        ...

    def split_documents(self, documents: list[Document]) -> list[Document]:
        """OPTIONAL but recommended: override for rich metadata."""
        ...
```

| Method | Input | Output | When used |
|--------|---------|--------|---------------|
| `split_text(text)` | One string | `list[str]` | Base API; other methods call it internally |
| `split_documents(docs)` | `list[Document]` | `list[Document]` | Real pipeline: preserves and enriches metadata |

**Why override `split_documents()`:** the default `TextSplitter` implementation calls `split_text()` and wraps each string in a `Document` with minimal metadata. If you only implement `split_text()`, you lose the chance to add `clause_id`, `type`, etc. The override lets you return complete `Document` objects.

#### Minimal skeleton connected to the lab

```python
class ClauseSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        # Delegates to the method that builds complete Documents
        return [d.page_content for d in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        matches = list(self._PATTERN.finditer(text))
        docs = []
        for i, m in enumerate(matches):
            start = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            docs.append(Document(
                page_content=text[start:end].strip(),
                metadata={
                    "clause_id": int(m.group(1)),
                    "title": m.group(2).strip(),
                    "type": self._classify(m.group(2)),
                    # ...
                },
            ))
        return docs

    def split_documents(self, documents: list[Document]) -> list[Document]:
        all_docs = []
        for doc in documents:
            for chunk in self._split_to_docs(doc.page_content):
                # Preserve parent metadata (source from the loader)
                chunk.metadata["source"] = doc.metadata.get("source", "")
                all_docs.append(chunk)
        return all_docs
```

This is exactly the pattern of `ClauseSplitter` in `lab/solucion_framework.py` — the same regex logic as `solucion_scratch.py`, but packaged for the LangChain ecosystem.

### 10.4 Loader → splitter integration (full pipeline)

```
┌─────────────┐     load()      ┌──────────────────┐   split_documents()   ┌─────────────┐
│ TextLoader  │ ──────────────▶ │ list[Document]   │ ────────────────────▶ │ list[Document│
│ contract.txt│                 │ metadata: source │                       │ chunks with │
└─────────────┘                 └──────────────────┘                       │ metadata    │
                                                                           └─────────────┘
```

```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("datos/sample_contract.txt")
docs = loader.load()
# docs[0].page_content = full text of the file
# docs[0].metadata = {"source": "datos/sample_contract.txt"}

splitter = ClauseSplitter(contract_id="CSP-2024-0087", date="2024-01-15")
chunks = splitter.split_documents(docs)
# 13 Documents, each with clause_id, title, type, contract, date, source
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
    separators=["\nCLAUSE ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
    keep_separator=True,
)
chunks_a = splitter_a.create_documents([contract_text])
```

| Line / decision | What it does | Why |
|------------------|----------|---------|
| `"\nCLAUSE "` first | Tries to cut before each clause header | Leverages contract structure without custom regex |
| `chunk_size=1200` | Limit per chunk | If a clause exceeds 1200 chars, the algorithm falls back to the next separator (`\n\n`, `\n`, ` `) and splits into smaller pieces |
| `chunk_overlap=0` | No overlap | Clauses are autonomous units — see [§4.6](#46-the-overlap-parameter) |
| `keep_separator=True` | Keeps `CLAUSE N.` at chunk start | Retriever returns identifiable context |
| `create_documents([text])` | Splits raw text | No intermediate loader; metadata stays empty |

**Pedagogical limitation:** Approach A does not produce `clause_id` or `type`. It is a good *baseline* for comparison, not the production solution for contracts.

#### Block 2 — Approach B: custom `ClauseSplitter`

| Component | Scratch equivalent | Function |
|------------|------------------------|---------|
| `_PATTERN` with `re.MULTILINE` | `_CLAUSE_PATTERN` | Detect only line-start headers |
| Loop `matches[i].start()` → `end` | Same loop in `parse_clauses()` | Delimit each clause's text |
| `_classify(title)` | `classify_clause(title)` | Infer `type` from keywords |
| `split_documents([base_doc])` | `main()` that reads and splits | Integration with `source` metadata |

```python
base_doc = Document(
    page_content=contract_text,
    metadata={"source": "sample_contract.txt"},
)
chunks_b = splitter_b.split_documents([base_doc])
# Expected: 13 chunks, same metadata as solucion_scratch.py
```

#### Block 3 — Vector store integration (commented out)

```python
# vectordb = Chroma.from_documents(documents=chunks_b, embedding=OpenAIEmbeddings(), ...)
# results = vectordb.similarity_search(query="...", k=3, filter={"type": "liability"})
```

This block closes the `loader → splitter → store` pipeline from [§8.3](#83-typical-pipeline). Approach B chunks carry `type` in metadata, enabling the **hard filter** from [§5](#5-metadata-and-its-role-in-hard-filters): only chunks with `type="liability"` compete in search.

### 10.6 When to use generic vs domain custom splitter

| Situation | Recommended splitter | Reason |
|-----------|---------------------|-------|
| Quick prototype, unstructured text | `RecursiveCharacterTextSplitter` | Zero custom code; enough to validate RAG |
| HR policies (paragraphs) | `RecursiveCharacterTextSplitter` with `separators=["\n\n", "\n", ". "]` | Generic paragraph structure — see [§4.2](#42-strategy-2--recursive-chunking-hierarchical-separators) |
| Contracts, regulations, ATA manuals | Custom splitter (`ClauseSplitter`, `ATASplitter`, etc.) | Domain metadata + zero false positives |
| PDFs with complex tables | Unstructured **before** + generic or custom splitter **after** | Better input parsing; see [§7.3](#73-unstructuredio) |

#### Gotchas that appear in production

**1. `keep_separator` and the first chunk**

With `keep_separator=True` and separator `"\nCLAUSE "`, text *before* the first clause (contract header, date, parties) may remain as a loose chunk 0. In real contracts, discard or merge that preface in post-processing.

**2. Overlap in domain chunks**

With `by-clause`, overlap is usually **0**: repeating the end of Clause 3 at the start of Clause 4 adds no useful context and duplicates embeddings. Reserve overlap for continuous narrative text ([§4.6](#46-the-overlap-parameter)).

**3. Metadata that gets lost**

```python
# ❌ Only split_text — parent metadata is not propagated properly
chunks = splitter.split_text(doc.page_content)

# ✅ split_documents — preserves source and enriches
chunks = splitter.split_documents([doc])
```

If you only call `split_text()` and build `Document` manually forgetting `doc.metadata`, you lose `source` and any field the loader added. The retriever cannot filter or cite the source file.

**4. `RecursiveCharacterTextSplitter` without `^` anchor**

The separator `"\nCLAUSE "` does not distinguish headers from references like `"pursuant to Clause 9..."` if that reference starts after a line break. That is why Approach A may generate spurious chunks; Approach B with `^` in the regex does not.

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

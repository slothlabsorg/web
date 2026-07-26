# M2 · Ingestion exercises

> Answer without consulting `soluciones.md`. Then compare.
> Types: (OM) reasoned multiple choice · (PS) predict the output · (FB) find the bug · (ET) choose the technology.

---

## Exercise 14 — Chunking strategy (OM)

A bank has four types of documents:

| Type | Description |
|------|-------------|
| A | Tax returns in PDF: continuous text, no marked sections, ~6 pages |
| B | Credit contracts: 15 numbered clauses (CLAUSE 1… CLAUSE 15) |
| C | Product manuals in HTML: well-structured `<h1>`, `<h2>`, `<h3>` |
| D | Customer service call transcripts (continuous text, ~2000 words) |

What chunking strategy is most appropriate for each type?

a) A → recursive, B → by-clause, C → by-section, D → recursive
b) A → fixed, B → by-clause, C → fixed, D → semantic
c) A → by-clause, B → recursive, C → by-section, D → fixed
d) A → semantic, B → fixed, C → by-clause, D → by-section

---

## Exercise 15 — Overlap parameter (OM)

`chunkSize: 1000, overlap: 200` is applied to a text of 3400 characters. How many chunks are generated and why?

a) 3 chunks (0-1000, 1000-2000, 2000-3000 + the remaining fragment in the last one)
b) 4 chunks (0-1000, 800-1800, 1600-2600, 2400-3400)
c) 5 chunks (overlap is applied symmetrically in both directions)
d) 3 chunks (0-1000, 800-1800, 1600-2600; the text from 2600-3400 is discarded)

---

## Exercise 16 — Hard filters vs. soft filters (OM)

A RAG system indexes manuals for two aircraft: A320 and B787. Without filters, `topK: 5` may return chunks from both aircraft. With `hardFilters: ["aircraft_type"]` and `aircraft_type = "A320"`, what is the correct behavior?

a) The 5 most similar chunks are retrieved first; then they are filtered by `aircraft_type`.
b) Only chunks where `aircraft_type = "A320"` participate in similarity search; `topK` operates on that subset.
c) The system returns 5 chunks from A320 and 5 from B787, and the LLM decides which to use.
d) A similarity penalty is applied to B787 chunks before ranking.

---

## Exercise 17 — Predict the output: regex with/without MULTILINE (PS)

Given the following text fragment:

```
CLAUSE 8. LIMITATION OF LIABILITY
Total liability is limited in accordance with Clause 3 of the contract.
CLAUSE 9. CONFIDENTIALITY
Both parties shall maintain confidentiality.
```

And two regex patterns:

```python
import re
# Pattern A (without MULTILINE):
pA = re.compile(r'^CL[AÁ]US[UE]LA\s+(\d+)', re.IGNORECASE)
# Pattern B (with MULTILINE):
pB = re.compile(r'^CL[AÁ]US[UE]LA\s+(\d+)', re.IGNORECASE | re.MULTILINE)
```

How many matches does each pattern produce on the full text?

a) Pattern A: 2 matches; Pattern B: 2 matches
b) Pattern A: 1 match; Pattern B: 2 matches
c) Pattern A: 0 matches; Pattern B: 2 matches
d) Pattern A: 3 matches; Pattern B: 3 matches (the reference "Clause 3" also matches)

---

## Exercise 18 — Find the bug: chunker with false positives (FB)

The following chunker produces 5 chunks for a contract with 3 clauses:

```python
import re

text = """
CLAUSE 1. PURPOSE
Develop software according to Annex A.

CLAUSE 2. PAYMENT
Payment shall be $100,000. See Clause 3 for penalties.

CLAUSE 3. PENALTIES
Delay greater than 5 days: 5% discount.
"""

pattern = re.compile(r'CL[AÁ]US[UE]LA\s+(\d+)', re.IGNORECASE)
matches = list(pattern.finditer(text))
print(f"Matches found: {len(matches)}")  # Prints: 4
```

What is the bug and how is it fixed?

---

## Exercise 19 — Loaders: choose the technology (ET)

A team must index the following documents. Which loader node should be used in each case?

| Document | Detail |
|-----------|---------|
| 1. Insurance policies in PDF | Scanned documents (photo of the form) |
| 2. Product catalog | PostgreSQL table: `SELECT sku, name, description FROM products` |
| 3. Aircraft maintenance manual | PDF with torque tables and hydraulic diagrams |
| 4. Frequently asked questions | Website `https://company.com/faq`, with no external links to follow |
| 5. Credit files | S3 folder with PDFs and CSVs per applicant |

---

## Exercise 20 — Metadata: which fields to add (OM)

Template 02 (banking) uses `ingest.metadata` with `fields: ["doc_type", "period"]`. Why is the `period` field important?

a) It allows sorting documents chronologically in the user interface.
b) It allows the retriever to filter only documents from the applicant's fiscal period, preventing prior-year returns from affecting the current year's evaluation.
c) It is an LLM requirement for generating responses with correct dates.
d) It only serves audit traceability; it does not affect retrieval.

---

## Exercise 21 — Chunk size and context window (OM)

An LLM has a context window of 128,000 tokens. The retriever retrieves `topK: 6` chunks of `chunkSize: 1500` tokens. The system prompt uses 500 tokens and the query 50 tokens. What is the approximate context window usage?

a) 9050 tokens (6×1500 + 500 + 50)
b) 128,000 tokens (the full window is used by default)
c) 1500 tokens (only the most relevant chunk)
d) 50 tokens (only the query)

---

## Exercise 22 — Unstructured vs. LangChain loader (ET)

You have a 200-page PDF of a company's annual report with: narrative text, financial results tables, charts (images), footnotes, and section headers. The team needs to answer questions like "what was Q3 EBITDA?" and "what does footnote 47 say?". Which parsing tool is most appropriate?

a) `loader.pdf` with `ocr: false` — sufficient for selectable text.
b) `loader.tabular` — the report has many tables.
c) `loader.multimodal` with `extractTables: true` and `describeImages: true` — preserves tables as JSON and describes charts.
d) Unstructured.io in `hi_res` mode — detects and categorizes all elements (table, figure, narrative, footnote) with high precision.

---

## Exercise 23 — By-clause vs. recursive for regulations (OM)

A company has an internal regulation with the following structure:

```
Article 1. Scope of Application
  1.1 This regulation applies to all employees...
  1.2 Contractors are excluded...
Article 2. Definitions
  2.1 "Incident" is understood as...
```

Which chunking strategy best preserves semantic coherence?

a) `recursive` with `chunkSize: 500` — articles are short and fit easily.
b) `by-clause` with separator `Article N.` — each article is an autonomous semantic and legal unit.
c) `fixed` with `chunkSize: 1000, overlap: 200` — simple and sufficient for regulatory text.
d) `semantic` — embeddings capture topics better than numbering.

---

## Exercise 24 — Predict the output: overlap (PS)

A text of 2800 characters is chunked with `chunkSize: 1000, overlap: 200`. What is the sequence of character ranges for the chunks?

Write the ranges as `[start, end)` (end exclusive).

---

## Exercise 25 — End-to-end ingestion pipeline (OM)

In template 08 (manufacturing), the pipeline is:

```
loader.multimodal → ingest.chunker → ingest.metadata → store.pgvector
```

Why does `ingest.metadata` come **after** the chunker and not before?

a) Because the loader only produces raw text; the chunker produces the chunk boundaries needed to assign metadata per chunk.
b) Because the store needs metadata before it can compute embeddings.
c) Because the loader already adds all necessary metadata; `ingest.metadata` only reformats it.
d) It is a pgvector technical requirement: it does not accept documents with metadata unless fragmented.

---

## Exercise 26 — Find the bug: lost metadata (FB)

The following pipeline in pseudocode loses `aircraft_type` metadata in the vector store:

```python
# Step 1: load
docs = loader.load("amm_a320.pdf")  # docs[i].metadata = {"source": "amm_a320.pdf"}

# Step 2: chunk
chunks = chunker.split_documents(docs)  # preserves parent doc metadata

# Step 3: add domain metadata
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    # MISSING something here

# Step 4: index
vectorstore.add_documents(chunks)
```

What is missing in step 3 and what consequence does it have in production?

---

## Exercise 27 — LlamaIndex vs. LangChain for multi-format (ET)

Your team indexes 3 file types: PDFs, Markdown, and JSON. You want to minimize glue code and get consistent metadata across types. Which tool do you choose?

a) LangChain with a different loader per type (`PyPDFLoader`, `UnstructuredMarkdownLoader`, `JSONLoader`).
b) LlamaIndex `SimpleDirectoryReader` — automatically detects file type and applies the appropriate reader.
c) Unstructured.io `partition_auto` — same result as LlamaIndex but with better quality on complex PDFs.
d) Custom loader in pure Python with `pathlib.glob`.

---

## Exercise 28 — Predict the output: RecursiveCharacterTextSplitter (PS)

Given this text (lengths in parentheses):

```
Contract intro (80 chars, no "CLAUSE")\n\n
CLAUSE 1. PURPOSE (chunk of 600 chars body)\n\n
CLAUSE 2. PAYMENT (chunk of 900 chars body)
```

And this splitter:

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    separators=["\n\nCLAUSE ", "\n\n", "\n", " "],
    chunk_size=700,
    chunk_overlap=0,
    keep_separator=True,
)
chunks = splitter.create_documents([text])
```

How many chunks does it produce and what is the approximate shape of the first one?

a) 2 chunks: Chunk 0 = intro + entire CLAUSE 1; Chunk 1 = entire CLAUSE 2
b) 3 chunks: Chunk 0 = intro only; Chunk 1 = CLAUSE 1; Chunk 2 = CLAUSE 2
c) 2 chunks: Chunk 0 = intro alone; Chunk 1 = CLAUSE 1 + CLAUSE 2 (because 600+900 < 700×2 with overlap)
d) 4 chunks: the algorithm splits CLAUSE 2 by `\n` because it exceeds 700 chars

---

## Exercise 29 — Complete the method: inherit from TextSplitter (PS)

You want a splitter that splits on the `---` separator and preserves parent document metadata. The method marked with `# COMPLETE` is missing:

```python
from langchain_text_splitters import TextSplitter
from langchain_core.documents import Document

class DashSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        return [p.strip() for p in text.split("---") if p.strip()]

    def split_documents(self, documents: list[Document]) -> list[Document]:
        result = []
        for doc in documents:
            for i, part in enumerate(self.split_text(doc.page_content)):
                result.append(Document(
                    page_content=part,
                    metadata={
                        # COMPLETE: copy parent metadata and add chunk_index
                    },
                ))
        return result
```

What is the correct implementation of the `metadata={...}` block?

a) `metadata={"chunk_index": i}`
b) `metadata={**doc.metadata, "chunk_index": i}`
c) `metadata=doc.metadata` (without chunk_index)
d) `metadata={"source": doc.page_content[:20], "chunk_index": i}`

---

## Exercise 30 — Find the bug: lost metadata in custom splitter (FB)

A developer implemented a `ClauseSplitter` that chunks correctly (13 chunks) but in Chroma all chunks have `source: ""`. Relevant code:

```python
class ClauseSplitter(TextSplitter):
    def split_text(self, text: str) -> list[str]:
        return [c.page_content for c in self._split_to_docs(text)]

    def _split_to_docs(self, text: str) -> list[Document]:
        # ... correct regex, 13 Documents with clause_id, title, type ...
        return docs

# Usage in the pipeline:
loader = TextLoader("sample_contract.txt")
docs = loader.load()  # docs[0].metadata == {"source": "sample_contract.txt"}

splitter = ClauseSplitter(contract_id="CSP-2024-0087", date="2024-01-15")
chunks = []
for doc in docs:
    for text in splitter.split_text(doc.page_content):
        chunks.append(Document(page_content=text, metadata=splitter._last_meta))
vectordb.add_documents(chunks)
```

`_last_meta` only contains `clause_id`, `title`, `type`, `contract`, `date` — it never copies `source` from the loader.

What is the bug and the minimal fix?

a) The bug is in `TextLoader`; you must use `PyPDFLoader` instead.
b) The bug is not calling `split_documents()`; the fix is `chunks = splitter.split_documents(docs)` which propagates `source` from the parent.
c) The bug is `chunk_size` too small; it must be raised to 2000.
d) The bug is the regex; `re.MULTILINE` is missing from `_PATTERN`.

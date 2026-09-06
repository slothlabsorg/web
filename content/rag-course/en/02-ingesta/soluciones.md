# M2 · Exercise solutions

---

## Exercise 14 — Chunking strategy ✅ Answer: **a**

**a) A → recursive, B → by-clause, C → by-section, D → recursive**

Reasoning by type:

| Type | Correct strategy | Why |
|------|--------------------|----|
| A (tax returns, continuous text) | `recursive` | No predictable section markers. The recursive splitter cuts by paragraphs, then sentences, respecting natural structure. |
| B (contracts with CLAUSE N.) | `by-clause` | The semantic unit is the clause. Splitting it in half mixes obligations from different clauses in the same chunk. |
| C (HTML with h1/h2/h3) | `by-section` | HTML heading hierarchy is explicit. The by-section splitter uses those markers as separators. |
| D (transcripts, continuous text) | `recursive` or `semantic` | No structure. `recursive` is faster; `semantic` could give better thematic coherence but requires embeddings at ingestion time. |

Option **b** has `A → fixed`, which is least suitable (fixed ignores any structure). Option **c** swaps A and B. Option **d** assigns `semantic` to type A, which is unnecessarily costly for tax returns.

---

## Exercise 15 — Overlap parameter ✅ Answer: **b**

**b) 4 chunks: [0-1000, 800-1800, 1600-2600, 2400-3400]**

The sliding window algorithm with overlap works like this:

```
Text: 3400 chars
chunkSize: 1000, overlap: 200
stride: chunkSize - overlap = 800

Chunk 0: [0, 1000)      ← start: 0
Chunk 1: [800, 1800)    ← start: 800 = 0 + stride
Chunk 2: [1600, 2600)   ← start: 1600 = 800 + stride
Chunk 3: [2400, 3400)   ← start: 2400 = 1600 + stride
```

`overlap` makes the start of the next chunk move back `overlap` positions. In chunk 3, the start is 2400 and the end is 3400, which is exactly the text size → 4 chunks.

**Incorrect answer a:** "3 chunks [0-1000, 1000-2000, 2000-3000]" would be without overlap (`overlap: 0`).
**Incorrect answer d:** the last fragment is not discarded — the splitter adjusts the last chunk to cover through the end of the text.

---

## Exercise 16 — Hard filters vs. soft filters ✅ Answer: **b**

**b) Only chunks with `aircraft_type = "A320"` participate in similarity search.**

`hardFilters` translate to a `WHERE` clause in the SQL query to the vector store:

```sql
SELECT *, embedding <=> $query_vec AS dist
FROM chunks
WHERE aircraft_type = 'A320'    -- hard filter: applied BEFORE similarity
ORDER BY dist
LIMIT 5;
```

B787 chunks are not evaluated at all. They are not penalized, not retrieved for later filtering, and do not compete with A320 chunks. This is crucial in aircraft maintenance: a 787 torque limit must never appear in a response for an A320 technician.

**Answer a** describes a soft filter: retrieve topK and then filter in application. This is less efficient and may return 0 results of the correct type if the N most similar are all of the wrong type.

---

## Exercise 17 — Predict the output: regex with/without MULTILINE ✅ Answer: **c**

**c) Pattern A: 0 matches; Pattern B: 2 matches**

Without `re.MULTILINE`, `^` anchors to the start of the **full text** (position 0 of the string). The text starts with `\nCLAUSE 8...` — the first character is `\n`, not `C`. Therefore pattern A matches nowhere.

With `re.MULTILINE`, `^` anchors to the start of **each line**. There are two lines that start with `CLAUSE`:
- Line 1: `CLAUSE 8. LIMITATION OF LIABILITY`
- Line 3: `CLAUSE 9. CONFIDENTIALITY`

Line 2 (`...in accordance with Clause 3 of the contract.`) contains "Clause 3" mid-line, **not** at the start → no match with pattern B.

**Answer d** would be incorrect because "Clause 3" in `...in accordance with Clause 3 of the contract.` is not at the start of a line, so `re.MULTILINE` with `^` correctly excludes it.

---

## Exercise 18 — Find the bug: chunker with false positives ✅

**Bug:** the pattern `re.compile(r'CL[AÁ]US[UE]LA\s+(\d+)', re.IGNORECASE)` does **not** have `re.MULTILINE` with a `^` anchor. The search is "anywhere in the text", not "at the start of a line".

The fragment `"See Clause 3 for penalties."` in the body of CLAUSE 2 generates a spurious match: `Clause 3` mid-sentence. That is why `finditer` returns 4 matches instead of 3 (CLAUSE 1, CLAUSE 2, `Clause 3` [reference], CLAUSE 3 [header]).

**Fix:**

```python
pattern = re.compile(
    r'^CL[AÁ]US[UE]LA\s+(\d+)',
    re.IGNORECASE | re.MULTILINE  # ← add re.MULTILINE
)
```

With `re.MULTILINE`, `^` only matches at the start of a line. "See Clause 3" is mid-line → no match. Result: 3 correct matches.

**Production consequence:** without the fix, chunk "CLAUSE 2" includes only text up to the "Clause 3" reference, and a spurious single-sentence chunk is created mid-contract. The retriever may return that 1-sentence spurious chunk when the user asks about penalties, giving an incomplete answer.

---

## Exercise 19 — Loaders: choose the technology ✅

| Document | Correct loader | Reason |
|-----------|----------------|------|
| 1. Scanned insurance policies in PDF | `loader.pdf` with `ocr: true` | It is an image; OCR is needed to extract text. |
| 2. Product catalog (PostgreSQL) | `loader.sql` | Data is in the DB; the query converts rows to documents directly. |
| 3. AMM manual with tables and diagrams | `loader.multimodal` with `extractTables: true, describeImages: true, sectionScheme: ATA` | Torque tables and hydraulic diagrams are critical; structured extraction is needed. |
| 4. FAQ website | `loader.web` with `urls: ["https://company.com/faq"], crawlDepth: 0` | Single URL; `crawlDepth: 0` does not follow external links. |
| 5. S3 case files | `loader.s3` with `bucket: "case_files"` | Files are in cloud storage; the S3 loader reads them without downloading locally. |

---

## Exercise 20 — Metadata: which fields to add ✅ Answer: **b**

**b) It allows filtering only documents from the applicant's fiscal period.**

In template 02, a credit file includes:
- 2022 tax return (`period: "2022"`)
- 2023 tax return (`period: "2023"`)
- Q3-2023 account statement (`period: "2023-Q3"`)

If the evaluation is for 2023, `retrieval.vector` with `hardFilters: ["doc_type", "period"]` ensures retrieval uses only 2023 documents. Without the filter, the LLM could confuse 2022 income with 2023 and compute an incorrect score.

Option **d** ("only serves traceability") is incorrect because the hard filter directly changes which chunks participate in retrieval, not only which are logged.

---

## Exercise 21 — Chunk size and context window ✅ Answer: **a**

**a) 9050 tokens**

Calculation:
```
System prompt:          500 tokens
User query:              50 tokens
6 chunks × 1500 tokens = 9000 tokens
─────────────────────────────────────
Total context: 9550 tokens  ≈ 9050-9500 tokens
```

With a 128,000-token window, this usage (~7.5%) leaves ample room for the response. In production, you must also add tokens from the generated response (typically 500-2000 tokens).

**When this matters:** if `topK: 20` and `chunkSize: 6000`, context would be `20×6000 + 500 + 50 = 120,550 tokens` — near the limit. If the response needs 2000 tokens, it could be truncated.

---

## Exercise 22 — Unstructured vs. LangChain loader ✅ Answer: **d**

**d) Unstructured.io in `hi_res` mode**

The reason: the report has financial tables with complex structure, footnotes that require correlation with text, and charts that are images. Simple `loader.pdf` would extract text but lose table structure (cells get mixed) and would not capture charts.

Option **c** (`loader.multimodal` from RAGorbit) would also be valid for tables + images, but Unstructured.io in `hi_res` mode offers better footnote detection and multi-column handling for complex financial documents.

Option **a** (simple `loader.pdf`) would give poor results for tables: "2022 2023 Revenue 1.2M 1.8M Costs 0.8M 1.1M" without knowing which column is which.

---

## Exercise 23 — By-clause vs. recursive for regulations ✅ Answer: **b**

**b) `by-clause` with separator `Article N.`**

Articles are autonomous semantic and legal units. If chunked by fixed size, article 1.2 may appear in the same chunk as the start of article 2, producing a chunk that mixes "scope of application" with "definitions". When the user asks "what is an incident?", the retriever may return that mixed chunk and the LLM will answer with both topics blended.

With `by-clause` using `Article N.` as separator, each article is an independent chunk. The retriever can filter by `type: "definition"` if metadata is added.

Option **a** (`recursive` with `chunkSize: 500`) might work if articles are short, but does not guarantee sub-articles (1.1, 1.2) stay with their parent article.

---

## Exercise 24 — Predict the output: overlap ✅

Text: 2800 chars, `chunkSize: 1000`, `overlap: 200`, stride = 800.

| Chunk | Start | End |
|-------|--------|-----|
| 0 | 0 | 1000 |
| 1 | 800 | 1800 |
| 2 | 1600 | 2600 |
| 3 | 2400 | 2800 (end of text) |

**4 chunks.** The last chunk runs from 2400 to 2800 (only 400 chars). Splitters adjust the last chunk to the end of the text; they do not discard or pad it.

---

## Exercise 25 — End-to-end ingestion pipeline ✅ Answer: **a**

**a) The chunker produces the chunk boundaries needed to assign metadata per chunk.**

The loader produces page- or file-level documents. Domain metadata (`ata_chapter`, `aircraft_type`) only makes sense at chunk level, not document level, because:

1. A document may have chapters from different ATAs (e.g., a full manual has ATA 32, 33, 34...). Labeling the whole document with a single `ata_chapter` would be wrong.
2. `ingest.metadata` extracts `ata_chapter` from **chunk text** (e.g., detecting "32-11-00" in the section header). It can only do that after the chunker has created chunks with that header visible.

Option **c** is incorrect because the loader does not add chunk-specific domain metadata; it only adds `source` and `page_number`, which are source document properties.

---

## Exercise 26 — Find the bug: lost metadata ✅

**Bug:** `aircraft_type` is never assigned to chunk metadata.

```python
# Buggy code:
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    # MISSING: chunk.metadata["aircraft_type"] = "A320"
```

The code extracts `ata_chapter` from chunk text but never assigns `aircraft_type`. In production, the retriever configures `hardFilters: ["aircraft_type", "ata_chapter"]`, but if `aircraft_type` is `None` (or missing) on all chunks, the hard filter fails silently: either no results are returned, or all chunks are returned unfiltered.

**Fix:**
```python
for chunk in chunks:
    chunk.metadata["ata_chapter"] = extract_ata(chunk.text)
    chunk.metadata["aircraft_type"] = "A320"  # ← extracted from filename or context
```

In RAGorbit, the `ingest.metadata` node with `fields: [aircraft_type, ata_chapter]` handles this automatically, extracting `aircraft_type` from the source filename or ingestion session context.

---

## Exercise 27 — LlamaIndex vs. LangChain for multi-format ✅ Answer: **b**

**b) LlamaIndex `SimpleDirectoryReader`**

```python
from llama_index.core import SimpleDirectoryReader

reader = SimpleDirectoryReader(
    "datos/docs/",
    recursive=True,
    # Automatically detects: PDF → PDFReader, .md → MarkdownReader, .json → JSONReader
)
docs = reader.load_data()
# All docs have metadata: {"file_path", "file_name", "file_type", "file_size"}
```

The advantage is that **one object** handles all three file types without glue code. Metadata (`file_type`) identifies the origin of each document.

Option **a** (LangChain with one loader per type) works but requires three loaders and logic to merge document lists — more maintenance code.

Option **c** (Unstructured `partition_auto`) also works and gives better quality on complex PDFs, but has higher installation overhead (`detectron2`).

Option **d** (pure Python with `pathlib.glob`) is viable for a script but does not use specialized parsers per format.

---

## Exercise 28 — Predict the output: RecursiveCharacterTextSplitter ✅ Answer: **b**

**b) 3 chunks: Chunk 0 = intro only; Chunk 1 = CLAUSE 1; Chunk 2 = CLAUSE 2**

Step-by-step reasoning (recursive algorithm from [guide §10.2](guia.md#102-recursivecharactertextsplitter-the-recursive-algorithm)):

1. The priority separator is `"\n\nCLAUSE "`. The text has two occurrences: before CLAUSE 1 and before CLAUSE 2.
2. With `keep_separator=True`, the split produces three blocks:
   - Block 0: intro (80 chars) → fits in `chunk_size=700` → **Chunk 0**
   - Block 1: `CLAUSE 1. PURPOSE` + body (≈600 chars) → fits → **Chunk 1**
   - Block 2: `CLAUSE 2. PAYMENT` + body (≈900 chars) → exceeds 700 → recursion with `"\n\n"`, then `"\n"`, etc., but the body has no strong sub-separators; eventually remains as **Chunk 2** (possibly split if the body is very long; in the problem statement 900 chars in one paragraph might split on `" "`).

For the text as stated (bodies without substructure and sizes 600 and 900), the dominant result is **3 chunks** with the intro separated from the clauses.

**Why not a:** the intro does not merge with CLAUSE 1 because the `"\n\nCLAUSE "` separator cuts *before* each clause, not after the intro forward without limit.

**Why not c:** 600+900 do not merge; the algorithm does not concatenate clauses — each separator split creates independent blocks.

**Why not d:** CLAUSE 2 (900 chars) might split if there are no intermediate separators, but that would give more than 3 chunks, not exactly 4 by `\n`. Option b describes the main behavior of the domain separator.

---

## Exercise 29 — Complete the method: inherit from TextSplitter ✅ Answer: **b**

**b) `metadata={**doc.metadata, "chunk_index": i}`**

When inheriting from `TextSplitter` and overriding `split_documents()`, you must:

1. **Preserve** all parent document metadata (`source`, `page`, loader fields).
2. **Enrich** with chunk fields (`chunk_index`).

```python
metadata={**doc.metadata, "chunk_index": i}
```

Option **a** loses `source` and any loader field. **c** preserves the parent but does not identify chunk index. **d** puts content text in `source`, which is incorrect.

This pattern is the same as `ClauseSplitter.split_documents()` in `solucion_framework.py`, which does `chunk.metadata["source"] = doc.metadata.get("source", "")` in addition to domain fields.

---

## Exercise 30 — Find the bug: lost metadata in custom splitter ✅

**b) The bug is not calling `split_documents()`; the fix is `chunks = splitter.split_documents(docs)`**

The developer:

1. Uses `split_text()` (strings only) instead of the `Document` pipeline.
2. Rebuilds `Document` manually with `_last_meta`, which never copies `source` from the parent.
3. Ignores the `split_documents()` override that [guide §10.3](guia.md#103-writing-your-own-splitter-inheriting-from-textsplitter) designs precisely to propagate metadata.

**Minimal fix:**

```python
chunks = splitter.split_documents(docs)
vectordb.add_documents(chunks)
```

Inside `split_documents()`, each chunk must receive:

```python
chunk.metadata["source"] = doc.metadata.get("source", "")
```

**Production consequence:** without `source`, RAG citations cannot name the source file and filters by `source` fail silently.

Options **a**, **c**, and **d** do not explain `source: ""` when the regex produces 13 correct chunks.

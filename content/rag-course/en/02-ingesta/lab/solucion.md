# Solution — M2 Lab: Legal contract chunker by clause

## Layer ② — Pure Python (solucion_scratch.py)

### Core idea

The contract has a predictable structure: each clause begins with `CLÁUSULA N. TÍTULO` at the start of a line. The key to the problem is **not** confusing those headers with clause references inside the body text (e.g., "conforme a la Cláusula 9 del presente instrumento").

The solution uses `re.MULTILINE` with the `^` anchor so the regex only matches at the beginning of a line:

```python
_PATRON_CLAUSULA = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)[\.:\-–—]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
    re.IGNORECASE | re.MULTILINE
)
```

### Why `re.MULTILINE`

Without `re.MULTILINE`, `^` only anchors to the start of the full text. With it, `^` anchors to the start of each line. This is what distinguishes headers from references:

| Text | With `re.MULTILINE` |
|-------|-------------------|
| `CLÁUSULA 9. CONFIDENCIALIDAD\n` (start of line) | match |
| `conforme a la Cláusula 9 del presente instrumento` (mid-line) | no match |

### Step-by-step algorithm

1. `finditer` returns all matches ordered by position in the text.
2. For chunk `i`, the text runs from `matches[i].start()` to `matches[i+1].start()`.
3. The last chunk runs from `matches[-1].start()` to `len(texto)`.
4. Normalization: line breaks within paragraphs are collapsed (contiguous lines are joined with a space); paragraphs are separated with `\n\n`.
5. Metadata is built from fixed contract data (`CSP-2024-0087`, `2024-01-15`) plus the groups captured by the regex.

### Type classifier

The `clasificar_clausula` function applies a list of `(keywords, tipo)` tuples in order. The first keyword that appears in the title (lowercased) determines the type. It is deterministic: the same title always produces the same type.

**Tradeoff:** a keyword-based classifier is fragile with unusual titles. A real classifier would use embeddings or a lightweight intent model (`model.intent` in RAGorbit). For this lab, the keyword table is sufficient and keeps the "no LLM" constraint.

### Result

- **13 chunks**, one per clause (CLÁUSULA 1 through CLÁUSULA 13).
- **0 false positives** — internal references do not generate spurious chunks.
- Ascending order guaranteed by `.sort(key=lambda c: c.metadata["clausula_id"])`.

---

## Layer ③ — LangChain (solucion_framework.py)

> **Before reading this section:** try Steps 1–3 of the [guided lab](enunciado.md#layer--chunking-with-langchain-guided-task) and study [guide §10](../guia.md#10-layer--explained-chunking-with-langchain-from-scratch). The file `solucion_framework.py` is the reference, not the starting point.

The file shows two approaches (detailed walkthrough in [guide §10.5](../guia.md#105-block-by-block-walkthrough-of-solucion_frameworkpy)):

### Approach A: RecursiveCharacterTextSplitter

```python
splitter = RecursiveCharacterTextSplitter(
    separators=["\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
)
```

LangChain tries the first separator (`"\nCLÁUSULA "`); if the resulting chunk exceeds `chunk_size`, it tries `"\n\n"`, then `"\n"`, etc. It is a **generic** splitter — it does not produce metadata automatically and the number of chunks may vary with `chunk_size`.

**When to use it:** when you do not know the document structure and want a quick starting point.

### Approach B: ClauseSplitter (custom)

Inherits from `TextSplitter` and implements the same regex logic as `solucion_scratch.py`, but integrates with the LangChain ecosystem:

```python
splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents([doc])
```

Each chunk is a `Document` with complete `page_content` and `metadata`. It can be passed directly to `Chroma.from_documents()` or any LangChain vector store.

**When to use it:** when the domain has predictable structure (contracts, ATA manuals, regulations) and you want rich metadata without post-processing.

---

## Approach comparison

| Aspect | solucion_scratch.py | RecursiveCharacterTextSplitter | ClauseSplitter custom |
|---------|--------------------|---------------------------------|----------------------|
| Dependencies | none (stdlib) | langchain-text-splitters | langchain-text-splitters |
| Automatic metadata | yes (regex) | no | yes (regex) |
| Number of chunks | always 13 | depends on chunk_size | always 13 |
| False positives | 0 (^ anchor) | possible (no anchor) | 0 (^ anchor) |
| LangChain integration | manual | native | native |
| Ideal use case | study / script | unstructured documents | production with LangChain |

---

## Connection with RAGorbit

In template `05-legal-contract-review`, the `contract_chunker` node has:

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

The code RAGorbit generates for this node is equivalent to the Approach B `ClauseSplitter`. The difference is that RAGorbit also manages `ingest.metadata` as a separate node, which lets you change metadata fields without touching the chunker code.

`solucion_scratch.py` combines chunking + metadata in a single step, which is correct for a learning script but less maintainable in production than splitting into two nodes.

---

## Common mistakes and how to avoid them

**Mistake 1 — Not using `re.MULTILINE`**
The regex detects the first clause but ignores the rest because `^` only anchors to the start of the full text. Fix: add the flag.

**Mistake 2 — Matching internal references**
If the pattern lacks `^`, "la Cláusula 9 del presente instrumento" generates a spurious chunk. Result: 15 chunks instead of 13, with 1–2 word chunks.

**Mistake 3 — Forgetting the last chunk**
The loop `for i, match in enumerate(matches)` must handle the case `i + 1 == len(matches)` using `len(texto)` as the limit. Forgetting this truncates the last clause.

**Mistake 4 — Unordered chunks**
`finditer` returns matches in text position order, which should be numeric order. But if the text had out-of-order clauses, explicit sorting guarantees the correct order.

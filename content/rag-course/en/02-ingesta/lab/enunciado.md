# M2 Lab — Legal contract chunker by clause

## Business context

The legal team at **Empresa Tecnológica del Norte** reviews dozens of contracts per month. To feed their contract review RAG system (based on the `05-legal-contract-review` template architecture), each contract must be split into fragments (chunks) **one per clause**, so each fragment is independently retrievable and can be compared against the approved clause playbook.

The problem with character-based chunking (fixed chunking) is that it splits clauses in half, mixing the start of one obligation with the end of another. Clause chunking guarantees that each fragment is a coherent semantic and legal unit.

In addition, each chunk must carry **metadata** that enables hard filters in the retriever:
- `clausula_id` — clause number (integer)
- `titulo` — clause title
- `tipo` — legal category inferred from the title (objeto, pago, confidencialidad, etc.)
- `contrato` — contract identifier
- `fecha` — signing date

## Task

Given the file `datos/contrato_muestra.txt`, write a program that:

1. Reads the contract.
2. Identifies each numbered clause (`CLÁUSULA N. TÍTULO`).
3. Extracts the full text of each clause as an independent chunk.
4. Assigns metadata to each chunk: `clausula_id`, `titulo`, `tipo`, `contrato`, `fecha`.
5. Prints the chunks in ascending order by clause number.
6. Prints the full JSON of the first chunk for verification.

## Input data

File: `rag-training/02-ingesta/lab/datos/contrato_muestra.txt`

Illustrative format fragment:

```
CLÁUSULA 1. OBJETO DEL CONTRATO
El presente contrato tiene por objeto la prestación de servicios...

CLÁUSULA 2. DURACIÓN Y VIGENCIA
El presente contrato tendrá una vigencia de doce (12) meses...
```

## Expected output

See `expected.md` for the full output.

Key points to verify:
- **13 chunks** in total (one per clause)
- No false positives: in-text references like "la Cláusula 9 del presente instrumento" must **not** create a chunk
- Chunk 1 must have `clausula_id: 1`, `tipo: "objeto"`, `source: "contrato_muestra.txt"`
- The final summary lists 13 different types (no `"otro"`)

## Scaffolding hints

**Hint 1 — Problem structure**
The main challenge is distinguishing a clause header (`CLÁUSULA 1. OBJETO`) from a clause reference in the body ("conforme a la Cláusula 9..."). Headers always appear at the start of a line and in uppercase.

**Hint 2 — Regex with re.MULTILINE**
The `re.MULTILINE` flag makes `^` match the start of each line (not only the start of the full text). Combine it with `re.IGNORECASE` to tolerate capitalization variations.

**Hint 3 — Suggested pattern**
```python
import re
patron = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)[\.:\-]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
    re.IGNORECASE | re.MULTILINE
)
```
Group 1: clause number. Group 2: title.

**Hint 4 — Text slicing**
Once you have the list of `match.start()` positions, chunk `i` runs from `matches[i].start()` to `matches[i+1].start()` (or to the end of the text for the last chunk).

**Hint 5 — Type classifier**
You can infer the clause `tipo` with a keyword table on the title:
```python
if "confidencialidad" in titulo.lower(): tipo = "confidencialidad"
elif "pago" in titulo.lower(): tipo = "pago"
# etc.
```

## Constraints

- Python stdlib only (re, pathlib, json, sys, dataclasses).
- Deterministic: same input → same output always.
- No network, no pip.

---

## Layer ③ — Chunking with LangChain (guided task)

> **Goal:** write the framework code for the lab yourself, not just read `solucion_framework.py`. Read [§10 of the guide](../guia.md#10-layer--explained-chunking-with-langchain-from-scratch) first. Remember: `Document`, loaders, and the LangChain idea were already covered in [M1 §11](../../01-fundamentos/guia.md#11-layer--explained-langchain-from-scratch).

**Requirement:** layer ② (scratch) must run and produce the 13 chunks from `expected.md` **before** starting layer ③.

**Environment:** you need `pip install langchain-text-splitters langchain-community`. This course environment has no network; write the code on your machine or read it with the guide open beside you.

### Step 0 — Reminder

A LangChain `Document` has `page_content` (text) and `metadata` (dict). A splitter receives documents and returns smaller documents. That is all you need from M1 to get started.

### Step 1 — Approach A: `RecursiveCharacterTextSplitter`

**Read:** [guide §10.2](../guia.md#102-recursivecharactertextsplitter-the-recursive-algorithm) (recursive algorithm) and [§10.5 block 1](../guia.md#block-1--approach-a-recursivecharactertextsplitter).

**Write** a script `mi_framework_a.py` (or a notebook block) that:

1. Reads `datos/contrato_muestra.txt`.
2. Creates a `RecursiveCharacterTextSplitter` with:
   - `separators=["\nCLÁUSULA ", "\n\n", "\n", " "]`
   - `chunk_size=1200`, `chunk_overlap=0`, `keep_separator=True`
3. Calls `.create_documents([texto])`.
4. Prints `len(chunks)` and the first 80 characters of the first 3 chunks.

**Reflection questions (do not advance to Step 2 without answering them):**

- How many chunks did you get? Is it exactly 13?
- Does any chunk have metadata (`clausula_id`, `tipo`)? Why not?
- If you lower `chunk_size` to 400, what happens to the number of chunks? (Hint: the recursive algorithm falls back to the next separator.)

### Step 2 — Approach B: custom `ClauseSplitter`

**Read:** [guide §10.3](../guia.md#103-writing-your-own-splitter-inheriting-from-textsplitter) (inherit from `TextSplitter`) and [§10.5 block 2](../guia.md#block-2--approach-b-clausesplitter-custom).

**Write** a `ClauseSplitter(TextSplitter)` class that replicates the logic of your `solucion_scratch.py`:

| Method / piece | What it must do | Hint |
|----------------|----------------|-------|
| `_PATRON` | Regex with `^CLÁUSULA\s+(\d+)` and `re.MULTILINE` | Copy the pattern proven in layer ② |
| `split_text(text)` | Returns `list[str]` | `[d.page_content for d in self._split_to_docs(text)]` |
| `_split_to_docs(text)` | Builds `Document` with rich metadata | Same `matches[i].start()` → `fin` loop as scratch |
| `split_documents(docs)` | Propagates `source` from parent | `chunk.metadata["source"] = doc.metadata.get("source", "")` |
| `_clasificar(titulo)` | Keyword table → `tipo` | Reuse scratch logic |

**Expected usage:**

```python
from langchain_core.documents import Document

doc = Document(
    page_content=open("datos/contrato_muestra.txt").read(),
    metadata={"source": "contrato_muestra.txt"},
)
splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents([doc])
assert len(chunks) == 13
assert chunks[0].metadata["clausula_id"] == 1
assert chunks[0].metadata["tipo"] == "objeto"
```

### Step 3 — Compare with the reference solution

Open `solucion_framework.py` and compare it block by block with your code ([guide §10.5](../guia.md#105-block-by-block-walkthrough-of-solucion_frameworkpy)):

- Does your Approach A use the same parameters? Do you understand each one?
- Does your `ClauseSplitter` implement the same methods?
- What commented block at the end shows integration with `Chroma`?

### Step 4 — Loader → splitter integration (optional)

If you have `langchain-community` installed, replace manual `open()` with:

```python
from langchain_community.document_loaders import TextLoader

docs = TextLoader("datos/contrato_muestra.txt").load()
chunks = splitter.split_documents(docs)
```

Verify that `chunks[0].metadata["source"]` is still `"contrato_muestra.txt"`. This is the real ingestion pipeline ([guide §10.4](../guia.md#104-loader--splitter-integration-full-pipeline)).

### Success criteria (layer ③)

| Criterion | Expected |
|----------|----------|
| Approach B: number of chunks | **13** |
| Approach B: `chunks[0].metadata["tipo"]` | `"objeto"` |
| Approach B: `chunks[8].metadata["tipo"]` | `"confidencialidad"` (Clause 9) |
| No false positives from internal references | 0 spurious chunks |
| You understand why Approach A is not enough in production | You can explain it in one sentence |

---

## Solutions

- `solucion_scratch.py` — pure stdlib implementation (runnable).
- `solucion_framework.py` — LangChain reference implementation (requires pip). **Consult it only after** attempting Steps 1–3.
- `solucion.md` — explanation of both solutions and comparison.

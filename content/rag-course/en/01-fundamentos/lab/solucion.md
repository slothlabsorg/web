# M1 Lab Solution · Minimal RAG

> Explains both implementations and why each design decision was made.

---

## Layer ② — Scratch (stdlib)

### Overview

`solucion_scratch.py` implements the complete minimal RAG pattern in ~100 lines using **zero external dependencies**. The goal is not to build a production system, but for you to understand each piece of the mechanism before delegating it to a framework.

### Decision: normalized bag-of-words as toy embedding

```python
def embed(text: str) -> dict[str, float]:
    tokens = tokenize(text)
    counts = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    total = len(tokens)
    return {word: count / total for word, count in counts.items()}
```

**Why sparse dictionary and not dense list:**

If the vocabulary of all documents has 800 unique words, a dense vector would be a list of 800 floats, most of them 0.0. A dictionary `{word: weight}` only stores words that actually appear — much more memory-efficient for large vocabularies. Also, cosine similarity over dictionaries is natural: the dot product only iterates over common keys.

**Why normalize (divide by total words):**

Without normalization, a long chunk has higher counts than a short one simply because it is long, not because it is more relevant. Normalization makes weights comparable regardless of fragment size.

**Known limitation:** bag-of-words is lexical, not semantic. It does not understand that "vacation" and "rest" are related concepts unless they share literal words. In actual output, chunk §4 (additional vacation by seniority) ranks above §3 (accrual and use) because §4 has more repetitions of "days" and "years" — two words also present in the query. With real semantic embeddings, §3 would rank first because it contains the exact answer.

### Decision: cosine similarity over dictionaries

```python
def cosine_similarity(a, b):
    common_keys = set(a.keys()) & set(b.keys())
    dot = sum(a[k] * b[k] for k in common_keys)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    return dot / (norm_a * norm_b)
```

The trick of `set(a.keys()) & set(b.keys())` is the key optimization: if the dictionaries have 500 entries each but only 20 words in common, we only do 20 multiplications in the dot product, not 500. This is O(min(|a|, |b|)) instead of O(|vocabulary|).

**Why cosine and not Euclidean distance:** Euclidean distance is sensitive to vector magnitude. If one chunk mentions "vacation" 5 times and another only once, Euclidean distance separates them even though they talk about the same topic. Cosine similarity measures the **angle** between vectors — if both "point" in the same direction in semantic space, they are similar regardless of magnitude.

### Main flow

```
load_chunks("data/hr_policies.txt")        # 8 fragments
        ↓
retrieve(query, chunks, k=3)
  ├── embed(query)                          # question vector
  ├── embed(chunk_i)  for each i           # vector for each chunk
  ├── cosine_similarity(vec_query, vec_i)   # score per chunk
  └── sort(scores, desc) → top-3            # ranking
        ↓
build_prompt(query, results)                # augmented prompt
        ↓
print(indices, similarities, prompt)
```

### Result obtained

```
Retrieved indices (0-based): 1, 0, 7
Similarities:                0.5080, 0.4397, 0.3384
```

See `expected.md` for the full analysis of why these chunks.

---

## Layer ③ — Framework (LangChain + Chroma)

> **How to use this section:** first write your own `solucion_framework.py` following the guided lab (`enunciado.md`, layer ③) and the guide [§11](../guia.md#11-layer--explained-langchain-from-scratch). **Then** read what follows and compare with `solucion_framework.py` block by block (walkthrough §11.12).

### Overview

`solucion_framework.py` does exactly the same as scratch, but using LangChain building blocks. The main difference is embedding quality and level of abstraction. If the reference solution surprises you, go back to §11 — each block is explained there before appearing here.

### TextLoader + CharacterTextSplitter

```python
loader = TextLoader("data/hr_policies.txt")
splitter = CharacterTextSplitter(separator="\n---\n", chunk_size=1000)
chunks = splitter.split_documents(raw_documents)
```

`CharacterTextSplitter` does exactly what `load_chunks()` does in scratch, but adds metadata (`source`, chunk number) to each `Document`. That metadata later enables hard filters in `retrieval.vector` (e.g. show only chunks from a certain section).

### OpenAIEmbeddings → Chroma

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(chunks, embeddings)
```

`OpenAIEmbeddings` calls the OpenAI API to obtain 1536-dimensional vectors. Chroma stores them with an HNSW index that makes top-k search efficient even with millions of chunks.

This is exactly equivalent to the `model.embedding` + `store.chroma` pair in template 09.

### LCEL chain

```python
chain = (
    {"context": retriever | format_chunks, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

LCEL (LangChain Expression Language) uses the `|` operator to compose steps. It is equivalent to RAGorbit's visual wiring but in code. The retriever output passes through `format_chunks`, combines with `question` to fill the `prompt`, which goes to the `llm`, whose output passes through `StrOutputParser` to extract the string.

**Detailed explanation of the dict and each `|`:** guide [§11.11](../guia.md#111-lcel-the--operator-runnable-and-the-dict-pattern).

This models exactly the edges of template 09's `flow.json`:
```
retrieval.vector → logic.prompt → model.llm → io.output
```

### Why the framework is better in production

| Aspect | Scratch | Framework |
|---------|---------|-----------|
| Embeddings | Bag-of-words (lexical) | Semantic (1536D) |
| False positives | Frequent (training chunk §7 appears because of "days") | Rare (understands meaning) |
| Chunks with metadata | No | Yes (`source`, section) |
| Metadata filters | Manual | `.as_retriever(filter={"section": "§3"})` |
| Index persistence | No (in memory) | `persist_directory="./chroma_db"` |
| Response streaming | No | `chain.stream(query)` |
| Model change | Rewrite functions | Change one string |

---

## Connection with template 09

The lab is a miniaturization of the full flow of the `09-hr-policy-assistant` template. Each scratch function corresponds to a node:

| Scratch function | RAGorbit node | Description |
|-----------------|---------------|-------------|
| `load_chunks()` | `loader.pdf` + `ingest.chunker` | Load and chunk documents |
| `embed()` | `model.embedding` | Convert text into vector |
| `retrieve()` | `retrieval.vector` | Search top-k by similarity |
| `build_prompt()` | `logic.prompt` | Build the augmented prompt |
| LLM (stub/fake) | `model.llm` | Generate the response |

The difference is that in template 09:
- Embeddings are real semantic ones (`text-embedding-3-large`).
- The vector store is Chroma with persistence.
- The LLM is Claude Opus 4.8.
- There is an additional `logic.citations` node that verifies the response cites its source.
- Everything is orchestrated by LangGraph.

---

## What you learned with this lab

1. **The core RAG mechanism is simple:** embed the query, find the most similar, build the prompt, call the LLM.
2. **Embedding quality is the bottleneck:** bag-of-words is enough to understand the mechanism, but semantic embeddings are what make RAG work well in production.
3. **Frameworks do not do magic:** LangChain does exactly the same as scratch, with better embeddings, better memory management, and more configuration options.
4. **The "augmented prompt" is the central piece:** the LLM knows nothing about your documents on its own — the context you give it in the prompt is all it has to respond correctly.

> **Next step:** in M3 you will see embeddings in depth (dimensions, HNSW, Chroma operations, FAISS) and in M4 advanced retrieval (hybrid, reranking, hard filters). Template 09 will be revisited in both modules.

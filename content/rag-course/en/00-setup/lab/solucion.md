# Workshop M0 Solution — Flow IR Explorer

## What does the script do step by step?

### 1. Resolve the path robustly

```python
script_dir = pathlib.Path(__file__).resolve().parent   # .../lab/
repo_root  = script_dir.parents[2]                     # .../ragorbit/
flow_path  = repo_root / "examples" / "09-hr-policy-assistant" / "flow.json"
```

`__file__` is the script's path at runtime. `.resolve()` converts it to absolute, removing symlinks. `.parents[2]` goes up two levels: `lab/ → 00-setup/ → rag-training/ → ragorbit/`. The counter is 2 (not 3) because `parents[0]` is already the script's parent.

This makes the script portable: it works regardless of the current working directory.

### 2. Load the JSON

```python
with open(ruta, encoding="utf-8") as f:
    data = json.load(f)
```

`json.load()` converts JSON text into a Python `dict`. No pip, no dependencies.

### 3. List nodes

```python
[{"id": n["id"], "type": n["type"], "label": n.get("label", "")}
 for n in flow.get("nodes", [])]
```

List comprehension: iterates over the `nodes` list and extracts only the fields we care about. `n.get("label", "")` uses an empty default in case a node has no label.

### 4. List edges

```python
for e in flow.get("edges", []):
    {"source": e["source"], "sourcePort": e["sourcePort"],
     "target": e["target"], "targetPort": e["targetPort"]}
```

Each edge in the Flow IR has exactly these four fields. The result is `source:port → target:port`.

### 5. Identify input and output

The solution uses **two combined strategies**:

**Semantic strategy (primary):**
```python
nodo_entrada = next(n for n in nodes if n["type"].startswith("io.input"), None)
nodos_salida = [n for n in nodes if n["type"].startswith("io.output")]
```
Search by node type. It's the most robust strategy because it's based on the Flow IR contract (see `docs/01-concepts.md §2.2`): there must always be exactly one `io.input` node and at least one `io.output`.

**Topological strategy (fallback):**
```python
targets = {e["target"] for e in edges}
sources = {e["source"] for e in edges}
nodo_entrada = next(n for n in nodes if n["id"] not in targets, None)
nodos_salida = [n for n in nodes if n["id"] not in sources]
```
A node with no incoming edges is a graph "source". A node with no outgoing edges is a final "leaf". This strategy works with any directed acyclic graph, even if types don't follow the `io.*` convention.

---

## Why stdlib only

RAGorbit already generates Python code. For the student to understand that generated code they need fluency with the standard library: `json`, `pathlib`, `sys`. These modules are the foundation. External dependencies (LangChain, ChromaDB, etc.) come later, when you already understand what they replace.

---

## Possible extensions (for practice)

1. **Detect disconnected nodes**: nodes that don't appear as either `source` or `target`.
2. **Count by category**: group nodes by the part before the dot in `type` (e.g. `io`, `loader`, `model`…).
3. **Validate edges**: check that each `source` and `target` in `edges` corresponds to an `id` that exists in `nodes`.
4. **Load any template**: make the script parameterizable with `sys.argv[1]` to receive the `flow.json` path as an argument.
5. **Print as JSON**: change the output format to JSON (using `json.dumps`) so another tool can consume it.

---

## Connection with the course

This workshop is the starting point for everything. In later modules:

- **M1** — you'll see that `llm` (`model.llm`) is the heart of the flow.
- **M2** — `hr_docs` + `chunker` is the ingestion pipeline.
- **M3** — `embedder` + `hr_store` is the embeddings and vector store layer.
- **M4** — `retriever` is the configurable retriever.
- **M5** — `prompt` + `citations` is the generation logic and mandatory citations.

By the end of the course you'll be able not only to read this `flow.json` but to **rebuild it from scratch** and **design variants** justifying each decision.

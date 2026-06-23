# Workshop M0 — Flow IR Explorer

## Business context

Your team has just received the first RAGorbit template: the HR policy assistant (`examples/09-hr-policy-assistant/`). The tech lead wants a diagnostic tool that any engineer can run locally to quickly understand the structure of any `flow.json`: how many nodes there are, what types they are, how they're connected, and what the system's entry and exit points are.

There's no access to the webapp yet. Stdlib only. Python only.

---

## Your task

Write a Python script (`explorador.py`) that, **using only the standard library**, does the following:

1. **Load** `examples/09-hr-policy-assistant/flow.json` (path relative to the repo root).
2. **List all nodes** showing, for each one, its `id` and `type`.
3. **List all edges** showing `source:sourcePort → target:targetPort`.
4. **Identify the input node** (the one that starts the flow) and the **output node(s)** (the ones that end it).
5. Print everything in readable format in the terminal.

---

## Technical requirements

- Stdlib modules only: `json`, `pathlib`, `sys` (and any others you need from stdlib).
- No `pip install`. No network. No external dependencies.
- The script must run with `python3 explorador.py` from any directory (use absolute paths derived from `__file__`).
- Output must be deterministic (same order on every run).

---

## Input data

File: [`examples/09-hr-policy-assistant/flow.json`](../../../examples/09-hr-policy-assistant/flow.json)

Open it and explore it before writing the script. Notice:
- The `"nodes"` key and what fields each node has.
- The `"edges"` key and how it describes a connection.
- What types the first and last nodes of the flow have.

---

## Stepped hints

**Hint 1** — Load the JSON:
```python
import json
with open("ruta/al/flow.json", encoding="utf-8") as f:
    data = json.load(f)
nodos = data["nodes"]   # lista de dicts
aristas = data["edges"] # lista de dicts
```

**Hint 2** — Robust path (independent of cwd):
```python
import pathlib
raiz = pathlib.Path(__file__).resolve().parents[N]  # N = niveles hasta la raíz del repo
```
Count how many levels there are between `explorador.py` and the repo root.

**Hint 3** — Identify input/output node:
There are two strategies. The simplest: an input node is one that **no edge points to** (doesn't appear as `target`). An output node is one that **has no outgoing edges** (doesn't appear as `source`). The more robust approach: look at the `type` field — `io.input` nodes start the flow; `io.output` nodes end it.

**Hint 4** — Output format:
Use `f-strings` with `<N` (left alignment) so columns line up nicely:
```python
print(f"  id={n['id']:<20} type={n['type']}")
```

---

## Success criteria

Your script passes the workshop if its output is **identical** to that in [`expected.md`](./expected.md).

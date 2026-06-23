# M0 · Solutions — Setup and Python Refresher

> Reasoned answers for all exercises in `ejercicios.md`.

---

## Exercise 1 — venv: multiple choice

**Correct answer: c)**

Reasoning:
- **a) False.** A venv creates an isolated copy of the interpreter and its own `site-packages` directory. System packages are **not** visible (unless you create the venv with `--system-site-packages`, which is not the default behavior).
- **b) False.** The `venv/` folder only contains the interpreter and installed packages. Your project's source code is elsewhere. Deleting `venv/` is harmless; you can recreate it with `python3 -m venv venv && pip install -e .`.
- **c) True.** That's exactly the purpose of venvs: dependency isolation. Project A can have `langchain==0.1.0` and project B can have `langchain==0.3.0` without conflict.
- **d) False.** `python3 -m venv venv` **creates** the environment but does **not** activate it. Activation requires a separate step: `source venv/bin/activate` (Unix) or `venv\Scripts\Activate.ps1` (Windows).

---

## Exercise 2 — Predict the output

```
<class 'dict'>
True
2
```

Reasoning:
- `json.loads` returns a `dict` (the JSON text `{...}` is converted to a Python `dict`).
- `true` in JSON becomes `True` in Python (boolean). `obj["activo"] is True` evaluates to `True`.
- `obj["version"]` is the integer `1` (JSON numbers without a decimal point convert to Python `int`). `1 + 1 = 2`.

---

## Exercise 3 — json: find the bug

**Problem:** missing `ensure_ascii=False`.

Without that option, `json.dump` escapes all non-ASCII characters. The character `é` (U+00E9) becomes `é` in the resulting JSON. The file would look like:
```json
{"descripcion": "Días de vacaciones según el contrato", "dias": 22}
```

**Solution:**
```python
import json

datos = {"descripcion": "Días de vacaciones según el contrato", "dias": 22}
with open("salida.json", "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False)
```

Two fixes:
1. `ensure_ascii=False` — allows Unicode characters in the output.
2. `encoding="utf-8"` in `open` — ensures the file is saved as UTF-8 (on Windows the default encoding may differ).

---

## Exercise 4 — dataclass: multiple choice

**False answer: d)**

Reasoning:
- **a) True.** `@dataclass` automatically generates `__eq__` comparing all fields. `d1` and `d2` have the same values in all fields, so they are equal.
- **b) True.** `d3.score = 0.5` while `d1.score = 0.0`. The comparison includes `score`, so `d1 != d3`.
- **c) True.** `score: float = 0.0` defines a default value. `d1 = Documento("Hola", "test.pdf")` doesn't pass `score`, so it takes the value `0.0`.
- **d) False.** `@dataclass` automatically generates `__repr__`. `print(d1)` will print `Documento(texto='Hola', fuente='test.pdf', score=0.0)`. There is no `AttributeError`.

---

## Exercise 5 — pathlib: predict the output

```
explorador.py
lab
00-setup
rag-training
```

Reasoning:
- `p.name` — file name (last part of the path): `explorador.py`.
- `p.parent.name` — parent directory name: `lab`.
- `p.parents[2].name` — `parents[0]` is `lab/`, `parents[1]` is `00-setup/`, `parents[2]` is `rag-training/`.
- `p.parents[3].name` — `parents[3]` is `ragorbit/`.

> Note: `parents[N]` is the N-th ancestor. `parents[0]` == `parent`. Indices start at 0.

---

## Exercise 6 — flow.json: reading

Answers based on the actual file:

a) **10 nodes**: `chat_input`, `hr_docs`, `chunker`, `embedder`, `hr_store`, `retriever`, `llm`, `prompt`, `citations`, `chat_output`.

b) **11 edges**.

c) `"chat-service"` (derived from the `io.input` node according to the contract — see `docs/01-concepts.md §5`).

d) The node with id `"citations"` has `type: "logic.citations"`.

e) The `retriever` node sends `Chunks` to **`prompt`** (port `Chunks`) and to **`citations`** (port `Chunks`). There are two edges with `source: "retriever"` and `sourcePort: "Chunks"`.

---

## Exercise 7 — Flow IR: design

**Invalid conditions: a, b, d, e** (all except c).

- **a) True (invalid).** The contract requires node `id`s to be unique within the flow. Two nodes with the same `id` break the graph: edges wouldn't know which node to point to.
- **b) True (invalid).** Rule §2.2.5 says "at least one output node (category `io`)". Without `io.output`, the flow has nowhere to deliver the result.
- **c) False (valid).** A `model.llm` node with no incoming edges is perfectly valid. Its only function is to provide the model (output port `Model`). It doesn't need to receive anything; other nodes "take" its model.
- **d) True (invalid).** Rule §2.2.6 requires the graph to be acyclic except for edges with `loop: true`. A cycle without that flag is a contract error.
- **e) True (invalid).** Rule §2.2.7: every secret referenced in a `config` must appear in `secrets[]`. An undeclared secret would make the flow incomplete (missing the placeholder for the API key).

---

## Exercise 8 — async: find the bug

**Bug:** `obtener_precio("laptop")` is called without `await`, and outside an async context.

`obtener_precio("laptop")` does **not** run the coroutine; it returns a `<coroutine object>`. The printed result is something like `Precio: <coroutine object obtener_precio at 0x10a2b3c40>`.

**Solution 1** — `asyncio.run` (appropriate outside an async context):
```python
resultado = asyncio.run(obtener_precio("laptop"))
print(f"Precio: {resultado}")   # Precio: 999.0
```

**Solution 2** — inside another async with await:
```python
async def main():
    resultado = await obtener_precio("laptop")
    print(f"Precio: {resultado}")

asyncio.run(main())
```

Python 3.12+ emits a `RuntimeWarning` when a coroutine is created but never awaited. In earlier versions the error passes silently.

---

## Exercise 9 — typing: complete the code

```python
from typing import Optional

def buscar_por_tipo(nodos: list[dict], tipo: str) -> list[dict]:
    """Devuelve todos los nodos cuyo 'type' coincide con el argumento."""
    return [n for n in nodos if n["type"] == tipo]

def primer_nodo_entrada(nodos: list[dict]) -> Optional[dict]:
    """Devuelve el primer nodo de tipo 'io.input', o None si no existe."""
    return next((n for n in nodos if n["type"].startswith("io.input")), None)
```

Notes:
- `list[dict]` for a list of arbitrary dictionaries (Python 3.9+ supports this directly; in 3.8 you need `from __future__ import annotations` or `List[Dict]` from `typing`).
- `Optional[dict]` (equivalent to `dict | None` in Python 3.10+) indicates the function may return `None`. `next(iter, None)` returns `None` if the iterable is empty.

---

## Exercise 10 — stdlib HTTP: design

Steps in `do_GET`:

1. **Check the path**: `if self.path == "/api/nodos":` — only respond for that URL.
2. **Load the flow.json**: `json.load(open(...))` — read the file and extract `data["nodes"]`.
3. **Serialize to JSON**: `body = json.dumps(nodos, ensure_ascii=False).encode("utf-8")`.
4. **Send headers**:
   - `self.send_response(200)` — HTTP OK status code.
   - `self.send_header("Content-Type", "application/json; charset=utf-8")`.
   - `self.send_header("Content-Length", str(len(body)))`.
   - `self.end_headers()` — ends the headers section.
5. **Send body**: `self.wfile.write(body)`.
6. **Handle unknown routes**: `else: self.send_response(404); self.end_headers()`.

Example response for `GET /api/nodos`:
```json
[{"id": "chat_input", "type": "io.input", ...}, ...]
```

---

## Exercise 11 — mock vs real mode: multiple choice

**Correct answer: c)**

Reasoning:
- **a) Mock mode.** When learning the mechanism (chunking, retrieval, etc.) the mock is sufficient and faster. You don't need to pay for tokens to understand how documents are chunked.
- **b) Mock mode.** CI/CD tests should be fast, deterministic, and cost-free. A test that calls an external API is fragile (fails if the API is down) and expensive.
- **c) Real mode.** When the goal is quality perceptible to a human (a client demo), you need a real LLM that generates coherent, useful responses, not fixed templates.
- **d) Mock mode (or not even that).** Debugging a Flow IR contract error doesn't require calling any LLM. `python3 -m ragorbit validate` is enough.

---

## Exercise 12 — integrator: short code

```python
import json
from pathlib import Path

def resumir_flow(ruta: str) -> dict:
    with open(ruta, encoding="utf-8") as f:
        data = json.load(f)

    nodos   = data.get("nodes", [])
    aristas = data.get("edges", [])
    tipos   = sorted({n["type"] for n in nodos})   # set → ordenado

    return {
        "total_nodos":       len(nodos),
        "total_aristas":     len(aristas),
        "tipos_unicos":      tipos,
        "deployment_target": data["flow"]["deploymentTarget"],
    }
```

For `"examples/09-hr-policy-assistant/flow.json"`, the result is:

```python
{
    "total_nodos":   10,
    "total_aristas": 11,
    "tipos_unicos":  [
        "ingest.chunker",
        "io.input",
        "io.output",
        "loader.pdf",
        "logic.citations",
        "logic.prompt",
        "model.embedding",
        "model.llm",
        "retrieval.vector",
        "store.chroma",
    ],
    "deployment_target": "chat-service",
}
```

Notes on the code:
- `{n["type"] for n in nodos}` — **set comprehension**: creates a set (no duplicates).
- `sorted(...)` — sorts alphabetically. In Python, strings sort lexicographically.
- `data["flow"]["deploymentTarget"]` — nested access. If `"flow"` didn't exist it would raise `KeyError`. For more robustness: `data.get("flow", {}).get("deploymentTarget")`.

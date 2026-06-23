# M0 · Exercises — Setup and Python Refresher

> **12 exercises without answers.** Reasoned answers are in `soluciones.md`.
> Types: multiple choice, "predict the output", "find the bug", short code.

---

## Exercise 1 — venv: multiple choice

Which of the following statements about Python virtual environments is **correct**?

a) A venv shares packages installed with the system's global Python.
b) Deleting the `venv/` folder also deletes your project's source code.
c) You can have different LangChain versions in two different projects if each has its own venv.
d) `python3 -m venv venv` creates the environment and activates it automatically.

---

## Exercise 2 — Predict the output

What does the following code print? Reason through it before running it.

```python
import json

texto = '{"nombre": "RAGorbit", "version": 1, "activo": true}'
obj = json.loads(texto)
print(type(obj))
print(obj["activo"] is True)
print(obj["version"] + 1)
```

---

## Exercise 3 — json: find the bug

The following code tries to save a dictionary with Spanish characters to a JSON file, but the result has escaped characters (`é` instead of `é`). What's wrong and how do you fix it?

```python
import json

datos = {"descripcion": "Días de vacaciones según el contrato", "dias": 22}
with open("salida.json", "w") as f:
    json.dump(datos, f)
```

---

## Exercise 4 — dataclass: multiple choice

Given the following code:

```python
from dataclasses import dataclass

@dataclass
class Documento:
    texto: str
    fuente: str
    score: float = 0.0

d1 = Documento("Hola", "test.pdf")
d2 = Documento("Hola", "test.pdf")
d3 = Documento("Hola", "test.pdf", 0.5)
```

Which of these statements is **false**?

a) `d1 == d2` is `True`.
b) `d1 == d3` is `False` because `score` differs.
c) `d1.score` has the default value `0.0`.
d) `print(d1)` raises an `AttributeError` because we didn't define `__repr__`.

---

## Exercise 5 — pathlib: predict the output

Given this script saved at `/Users/ana/proyectos/ragorbit/rag-training/00-setup/lab/explorador.py`:

```python
from pathlib import Path
p = Path(__file__).resolve()
print(p.name)
print(p.parent.name)
print(p.parents[2].name)
print(p.parents[3].name)
```

What does each line print?

---

## Exercise 6 — flow.json: reading

Open `examples/09-hr-policy-assistant/flow.json`. Answer:

a) How many nodes are there in total?
b) How many edges are there?
c) What is the value of `flow.deploymentTarget`?
d) Which node has `type: "logic.citations"`?
e) The `retriever` node sends its `Chunks` port to two different nodes. Which ones?

---

## Exercise 7 — Flow IR: design

According to the Flow IR contract (see `docs/01-concepts.md §2.2`), a flow is **invalid** if... (check all that apply):

a) It has two nodes with the same `id`.
b) It has zero nodes of type `io.output`.
c) A node of type `model.llm` has no incoming edges.
d) The graph has a cycle without any edge marked with `loop: true`.
e) A node references a secret that doesn't appear in `secrets[]`.

---

## Exercise 8 — async: find the bug

The following code tries to get data from a coroutine but prints something unexpected. What's wrong?

```python
import asyncio

async def obtener_precio(producto: str) -> float:
    await asyncio.sleep(0)
    precios = {"laptop": 999.0, "teclado": 79.0}
    return precios.get(producto, 0.0)

resultado = obtener_precio("laptop")
print(f"Precio: {resultado}")
```

---

## Exercise 9 — typing: complete the code

Complete the type annotations in the following functions so they are correct:

```python
from typing import ???

def buscar_por_tipo(nodos: ???, tipo: ???) -> ???:
    """Devuelve todos los nodos cuyo 'type' coincide con el argumento."""
    return [n for n in nodos if n["type"] == tipo]

def primer_nodo_entrada(nodos: list[dict]) -> ???:
    """Devuelve el primer nodo de tipo 'io.input', o None si no existe."""
    return next((n for n in nodos if n["type"].startswith("io.input")), None)
```

---

## Exercise 10 — stdlib HTTP: design

You want to create an HTTP server with `http.server` that exposes a `GET /api/nodos` endpoint and returns the list of nodes from flow 09 in JSON format. Describe (in pseudocode or prose) the steps you need to implement in the handler's `do_GET` method.

---

## Exercise 11 — mock vs real mode: multiple choice

In which of these situations is it **most appropriate** to use real mode (with an API key)?

a) You're learning how chunking works and want to understand the mechanism.
b) You want to run your CI/CD pipeline tests with no cost and no variable latency.
c) You need to demonstrate to the client that the system answers HR questions with high quality.
d) You're debugging why an edge in your `flow.json` is invalid.

---

## Exercise 12 — integrator: short code

Write a Python function (pure stdlib) that receives the path to a `flow.json` and returns a `dict` with:
- `"total_nodos"`: number of nodes.
- `"total_aristas"`: number of edges.
- `"tipos_unicos"`: list of unique node types, without duplicates and sorted alphabetically.
- `"deployment_target"`: the value of `flow.deploymentTarget`.

Expected signature:
```python
def resumir_flow(ruta: str) -> dict:
    ...
```

And when called with `"examples/09-hr-policy-assistant/flow.json"`, what values should it return for each key? (You can open the file to verify.)

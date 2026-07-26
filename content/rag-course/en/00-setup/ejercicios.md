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

text = '{"name": "RAGorbit", "version": 1, "active": true}'
obj = json.loads(text)
print(type(obj))
print(obj["active"] is True)
print(obj["version"] + 1)
```

---

## Exercise 3 — json: find the bug

The following code tries to save a dictionary with Spanish characters to a JSON file, but the result has escaped characters (`\u00e9` instead of `é`). What's wrong and how do you fix it?

```python
import json

data = {"description": "Vacation days according to the contract", "days": 22}
with open("output.json", "w") as f:
    json.dump(data, f)
```

---

## Exercise 4 — dataclass: multiple choice

Given the following code:

```python
from dataclasses import dataclass

@dataclass
class Document:
    text: str
    source: str
    score: float = 0.0

d1 = Document("Hello", "test.pdf")
d2 = Document("Hello", "test.pdf")
d3 = Document("Hello", "test.pdf", 0.5)
```

Which of these statements is **false**?

a) `d1 == d2` is `True`.
b) `d1 == d3` is `False` because `score` differs.
c) `d1.score` has the default value `0.0`.
d) `print(d1)` raises an `AttributeError` because we didn't define `__repr__`.

---

## Exercise 5 — pathlib: predict the output

Given this script saved at `/Users/ana/projects/ragorbit/rag-training/00-setup/lab/explorer.py`:

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

async def get_price(product: str) -> float:
    await asyncio.sleep(0)
    prices = {"laptop": 999.0, "keyboard": 79.0}
    return prices.get(product, 0.0)

result = get_price("laptop")
print(f"Price: {result}")
```

---

## Exercise 9 — typing: complete the code

Complete the type annotations in the following functions so they are correct:

```python
from typing import ???

def search_by_type(nodes: ???, type_name: ???) -> ???:
    """Returns all nodes whose 'type' matches the argument."""
    return [n for n in nodes if n["type"] == type_name]

def first_input_node(nodes: list[dict]) -> ???:
    """Returns the first node of type 'io.input', or None if none exists."""
    return next((n for n in nodes if n["type"].startswith("io.input")), None)
```

---

## Exercise 10 — stdlib HTTP: design

You want to create an HTTP server with `http.server` that exposes a `GET /api/nodes` endpoint and returns the list of nodes from flow 09 in JSON format. Describe (in pseudocode or prose) the steps you need to implement in the handler's `do_GET` method.

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
- `"total_nodes"`: number of nodes.
- `"total_edges"`: number of edges.
- `"unique_types"`: list of unique node types, without duplicates and sorted alphabetically.
- `"deployment_target"`: the value of `flow.deploymentTarget`.

Expected signature:
```python
def summarize_flow(path: str) -> dict:
    ...
```

And when called with `"examples/09-hr-policy-assistant/flow.json"`, what values should it return for each key? (You can open the file to verify.)

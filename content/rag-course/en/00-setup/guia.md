# M0 · Setup and Refresher — Comprehensive Guide

> **Module 0 of 11** · Estimated duration: ½ week · No prior AI knowledge required.

This module gives you everything you need to get started: a configured environment, a refresher on the Python features we'll use most in the course, and a first read of RAGorbit's "language" (the Flow IR). When you finish, you'll be able to run the webapp, read any `flow.json`, and understand what problem each piece solves.

---

## Table of contents

1. [The environment: venv and work modes](#1-the-environment-venv-and-work-modes)
2. [Offline / no-keys mode (mock mode) vs real mode](#2-offline--no-keys-mode-mock-mode-vs-real-mode)
3. [Why we'll work in mock mode](#3-why-well-work-in-mock-mode)
4. [Python refresher: what we'll use in this course](#4-python-refresher-what-well-use-in-this-course)
5. [How to run RAGorbit](#5-how-to-run-ragorbit)
6. [Reading a flow.json: RAGorbit's "language"](#6-reading-a-flowjson-ragorbits-language)
7. [Course overview](#7-course-overview)
8. [Checkpoint](#8-checkpoint)

---

## 1. The environment: venv and work modes

### 1.1 Why a virtual environment?

Python has a global package system that can cause conflicts between projects. A **virtual environment** (`venv`) creates an isolated copy of the interpreter for each project. That way, the LangChain versions RAGorbit needs won't clash with those in your other project.

There are **two repos**, and it helps to keep them straight from the start:

| Repo | What it is | You use it to |
|---|---|---|
| [`slothlabsorg/ragorbit`](https://github.com/slothlabsorg/ragorbit) | The tool: engine, node catalog, codegen, and the 10 industry templates | Run the canvas, read the `flow.json` files, generate artifacts |
| [`slothlabsorg/rag-course`](https://github.com/slothlabsorg/rag-course) | This course (es/ + en/) | The labs you are going to solve |

```bash
git clone https://github.com/slothlabsorg/ragorbit
git clone https://github.com/slothlabsorg/rag-course
There are **two repos**, and it helps to keep them straight from the start:

| Repo | What it is | You use it to |
|---|---|---|
| [`slothlabsorg/ragorbit`](https://github.com/slothlabsorg/ragorbit) | The tool: engine, node catalog, codegen, and the 10 industry templates | Run the canvas, read the `flow.json` files, generate artifacts |
| [`slothlabsorg/rag-course`](https://github.com/slothlabsorg/rag-course) | This course (es/ + en/) | The labs you are going to solve |

```bash
git clone https://github.com/slothlabsorg/ragorbit
git clone https://github.com/slothlabsorg/rag-course
```

```
ragorbit/          ← root of the tool's repo
├── venv/          ← your virtual environment (NOT pushed to git)
├── ragorbit/      ← the engine (stdlib, zero dependencies)
├── examples/      ← the 10 industry templates
├── docs/          ← the RAGorbit book
└── ...
```

> **Shortcut:** you do not need to clone anything just to *use* RAGorbit. Every release
> ships a single-file `ragorbit.pyz` that runs on any `python3`:
> `python3 ragorbit.pyz list-nodes`. Also `pipx install ragorbit` or
> `brew install slothlabsorg/tap/ragorbit`. Cloning is for reading the code — which in
> this course is exactly what you want.

> **Shortcut:** you do not need to clone anything just to *use* RAGorbit. Every release
> ships a single-file `ragorbit.pyz` that runs on any `python3`:
> `python3 ragorbit.pyz list-nodes`. Also `pipx install ragorbit` or
> `brew install slothlabsorg/tap/ragorbit`. Cloning is for reading the code — which in
> this course is exactly what you want.

### 1.2 Create and activate the environment

```bash
# From the ragorbit repo root:
python3 -m venv venv

# Activate (macOS/Linux):
source venv/bin/activate

# Activate (Windows PowerShell):
venv\Scripts\Activate.ps1

# Verify you are inside:
which python   # should point to ragorbit/venv/bin/python

# Install the project:
pip install -e .          # installs ragorbit from pyproject.toml
```

The engine has no dependencies, so `pip install -e .` downloads nothing: it only puts
the `ragorbit` command on your PATH. Dependencies show up when you actually need them,
and always as an explicit extra (`.[api]`, `.[real]`).

Once activated, the shell prompt usually shows `(venv)` at the start. To exit: `deactivate`.

> **Layer ② labs need no `pip` at all.** They run on `python3` and the standard library,
> by design: you can do the whole course on a machine with no network, no install
> permissions, or behind a corporate proxy. Layer ③ (framework) does require
> `pip install` and is marked as such in every lab.

---

## 2. Offline / no-keys mode (mock mode) vs real mode

RAGorbit can work in **two modes**:

### Mock mode (no network, no keys)

```
┌─────────────────────────────────────────────────────────┐
│  Your script / app                                      │
│       ↓                                                 │
│  RAGorbit mock runtime                                  │
│       ↓                                                 │
│  Deterministic "fake LLM" function (fixed templates)    │
│  In-memory vector store (Python dictionaries)           │
│  Toy embeddings (hashing / bag-of-words)                │
└─────────────────────────────────────────────────────────┘
```

- No API keys, Docker, or internet connection required.
- Responses are predictable: for the same input, always the same output.
- Perfect for learning, testing, and developing at no cost.

### Real mode

```
┌─────────────────────────────────────────────────────────┐
│  Your script / app                                      │
│       ↓                                                 │
│  RAGorbit real runtime                                  │
│       ↓                                                 │
│  Claude / OpenAI / Gemini (API key required)            │
│  ChromaDB / pgvector / Qdrant (Docker or cloud service) │
│  Real embeddings (text-embedding-3-large, etc.)         │
└─────────────────────────────────────────────────────────┘
```

- Requires one or more API keys (Claude, OpenAI, etc.).
- Optionally, Docker for stores (persistent ChromaDB, pgvector, Qdrant).
- Results are "real" but non-deterministic and have a per-token cost.

---

## 3. Why we'll work in mock mode

### The problem with real workshops in a course

Imagine that exercise 3 in module 2 requires calling the Claude API. If:
- The API is down → the exercise fails for reasons unrelated to learning.
- Prices change → the course becomes expensive.
- You don't have a credit card → you can't continue.
- Model output changes between versions → the `expected.md` files go out of date.

### The solution: determinism first

This course's workshops follow the **determinism first** principle:

1. **Learn the mechanism** with pure code (stdlib, no dependencies).
2. **Verify it works** without needing anything external.
3. **Optional and separate**: the same problem with real frameworks (marked with `# Requires: pip install ...`).

This is not a limitation: it's exactly how software engineers write tests. Production systems also have "mocks" of external services so tests are fast and cost-free.

> **In this course**: all `solucion_scratch.py` files run with `python3 file.py` with no installation. The `solucion_framework.py` files are real commented code you can run when you have network and pip.

---

## 4. Python refresher: what we'll use in this course

This refresher assumes you already program in Python. It's not a Python tutorial from scratch: it's a reminder of the specific features that appear in this course's workshops.

### 4.1 Typing and type annotations

Type annotations in Python are **optional at runtime** but valuable for readability and for IDE assistance.

```python
from typing import Optional, Union

def find_node(id: str, nodes: list[dict]) -> Optional[dict]:
    """Returns the node with that id, or None if it doesn't exist."""
    return next((n for n in nodes if n["id"] == id), None)

# Python 3.10+: you can use | instead of Union
def parse(value: str | int) -> str:
    return str(value)
```

**For the workshops we'll use:**
- `list[T]`, `dict[K, V]`, `tuple[A, B]` — typed collections.
- `Optional[T]` (or `T | None`) — may be None.
- `Union[A, B]` (or `A | B`) — may be one type or another.
- Return annotations on functions (`-> type`).

### 4.2 Dataclasses

`dataclass`es are classes where you only define the fields and Python generates `__init__`, `__repr__`, `__eq__` automatically.

```python
from dataclasses import dataclass, field

@dataclass
class Chunk:
    text: str
    source: str
    score: float = 0.0
    metadata: dict = field(default_factory=dict)

# Usage:
c = Chunk(text="The employee has 15 vacation days", source="hr_manual.pdf")
print(c)
# Chunk(text='The employee has 15 vacation days...', source='hr_manual.pdf', score=0.0, metadata={})

# Automatic comparison:
c2 = Chunk(text="The employee has 15 vacation days", source="hr_manual.pdf")
print(c == c2)  # True — __eq__ compares field by field
```

We'll use `dataclass` to represent **documents**, **chunks**, **retrieval results**, and **messages** throughout the course.

### 4.3 json

The stdlib `json` module converts between JSON text and Python objects.

```python
import json

# Read a JSON file:
with open("flow.json", encoding="utf-8") as f:
    data = json.load(f)          # -> dict or list

# Read from string:
text = '{"id": "chat_input", "type": "io.input"}'
node = json.loads(text)          # -> dict

# Write to string (with readable formatting):
output = json.dumps(data, indent=2, ensure_ascii=False)

# Write to file:
with open("result.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

Important points:
- `ensure_ascii=False` so Unicode characters (Spanish, etc.) aren't escaped as `é`.
- `indent=2` for readable formatting; omit it for compact JSON (smaller size).
- `json.load` vs `json.loads`: the "s" in `loads` means "string" (receives text, not a file).

### 4.4 requests and urllib

For HTTP calls. In the stdlib layer we use `urllib`; in production we use `requests` (more ergonomic).

```python
# stdlib (no pip):
import urllib.request
import json

url = "http://localhost:8080/api/health"
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data)

# POST request with urllib:
import urllib.parse
payload = json.dumps({"query": "How many vacation days do I have?"}).encode()
req = urllib.request.Request(
    url="http://localhost:8080/api/query",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read().decode("utf-8"))
```

```python
# With requests (pip install requests):
import requests

resp = requests.get("http://localhost:8080/api/health")
resp.raise_for_status()   # raises exception if 4xx/5xx
data = resp.json()

resp = requests.post(
    "http://localhost:8080/api/query",
    json={"query": "How many vacation days do I have?"}
)
```

### 4.5 http.server — stdlib HTTP server

When workshops need a simulated external service (for example, an HR API), we'll start an HTTP server with stdlib:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HRApiHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/policy/vacation":
            body = json.dumps({"days": 22, "type": "business_days"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass  # silence the default log

if __name__ == "__main__":
    server = HTTPServer(("localhost", 9090), HRApiHandler)
    print("Mock server at http://localhost:9090")
    server.serve_forever()
```

Run this script in one terminal, and make requests from another. You don't need Flask, FastAPI, or any framework.

### 4.6 Basic async (asyncio)

RAGorbit generates asynchronous code (LangGraph is async-first). You need to understand the basics.

```python
import asyncio

# A coroutine: function with async def
async def greet(name: str) -> str:
    await asyncio.sleep(0.1)   # "expensive" operation (simulated)
    return f"Hello, {name}"

# Run a single coroutine:
result = asyncio.run(greet("Ana"))
print(result)   # "Hello, Ana"

# Run several in parallel (gather):
async def main():
    r1, r2, r3 = await asyncio.gather(
        greet("Ana"),
        greet("Luis"),
        greet("Maria"),
    )
    print(r1, r2, r3)

asyncio.run(main())
```

**The golden rule of async:** an `async def` function doesn't run when you call it; it returns a coroutine object. To run it you need `await` (inside another async function) or `asyncio.run()` (at the top level).

```python
# Common ERROR:
result = greet("Ana")   # this does NOT execute the function
print(result)           # <coroutine object greet at 0x...>

# CORRECT:
result = asyncio.run(greet("Ana"))
print(result)           # "Hello, Ana"
```

In this course's workshops, scratch solutions are **synchronous** (simpler to read). Frameworks like LangGraph are async; when you use them in layer ③, you'll see `async def` and `await` frequently.

### 4.7 pathlib — modern file paths

```python
from pathlib import Path

# Path of the current script:
here = Path(__file__).resolve()         # ~/dev/rag-course/en/00-setup/lab/script.py
directory = here.parent                 # ~/dev/rag-course/en/00-setup/lab
course_root = here.parents[3]           # ~/dev/rag-course

# The templates live in the OTHER repo (ragorbit), cloned alongside:
ragorbit_root = course_root.parent / "ragorbit"

# Build paths:
flow = ragorbit_root / "examples" / "09-hr-policy-assistant" / "flow.json"

# Read:
text = flow.read_text(encoding="utf-8")

# Exists?
if not flow.exists():
    raise FileNotFoundError(f"Cannot find {flow}")

# List files:
for json_file in (ragorbit_root / "examples").rglob("flow.json"):
    print(json_file)
```

`pathlib.Path` is the modern way to handle paths in Python 3. It's cross-platform (uses `/` on Unix and `\` on Windows automatically) and more readable than `os.path`.

---

## 5. How to run RAGorbit

### 5.1 Start the webapp

```bash
# From the repo root, with venv activated:
python3 -m ragorbit serve
```

This starts the web interface (by default at `http://localhost:8080`). You can:
- View the canvas where graphs are drawn.
- Load any template from `examples/`.
- Test with mocks without needing API keys.
- Explore the catalog of 53 node types.

### 5.2 Validate a flow.json

```bash
python3 -m ragorbit validate examples/09-hr-policy-assistant/flow.json
```

Applies the contract's 7 validity rules (see `docs/01-concepts.md §2.2`):
- All node types exist in the catalog.
- Each node's `config` is valid.
- Edges connect compatible ports.
- Required ports are connected.
- There is exactly one input node and at least one output node.
- The graph is acyclic (except edges marked `loop: true`).
- Referenced secrets are declared in `secrets[]`.

### 5.3 Read a flow.json with Python

```python
import json

with open("examples/09-hr-policy-assistant/flow.json", encoding="utf-8") as f:
    flow = json.load(f)

# Flow metadata:
print(flow["flow"]["name"])            # "Policy and benefits assistant..."
print(flow["flow"]["deploymentTarget"])# "chat-service"

# Nodes:
for node in flow["nodes"]:
    print(node["id"], "→", node["type"])

# Edges:
for edge in flow["edges"]:
    print(f"{edge['source']}:{edge['sourcePort']} → {edge['target']}:{edge['targetPort']}")
```

This is exactly the task for this module's workshop.

---

## 6. Reading a flow.json: RAGorbit's "language"

### 6.1 The Flow IR in one sentence

A `flow.json` is a **directed graph**: nodes are processing blocks and edges are typed connections between them. The JSON has four sections:

```
flow.json
├── irVersion: "1.0"
├── flow:      { id, name, description, deploymentTarget, defaults }
├── nodes:     [ { id, type, label, config, position }, ... ]
├── edges:     [ { source, sourcePort, target, targetPort, loop }, ... ]
└── secrets:   [ { name, required, usedBy }, ... ]
```

### 6.2 The HR template: visual walkthrough

The `09-hr-policy-assistant` flow has 10 nodes and 11 edges. In ASCII diagram:

```
                    [hr_docs]  [embedder]
                        ↓          ↓
                    [chunker] → [hr_store]
                                    ↓
[chat_input] ──Message──→ [retriever] ──Chunks──→ [prompt] ──Message──→ [citations] ──Message──→ [chat_output]
     │                                                ↑                       ↑
     └──────────────────────────Message──────────────┘       Chunks──────────┘
                                    [llm] ──Model──→ [prompt]
```

Read it as: the user's message enters through `chat_input`, the `retriever` searches for relevant chunks in the vector store, the `prompt` assembles context + question + LLM model to generate the response, `citations` verifies that the response cites its sources, and `chat_output` returns the result to the user.

### 6.3 The three node types you should recognize already

| Type pattern | Category | Role |
|----------------|-----------|-----|
| `io.input` | I/O | Flow **entry** point. The deployment target derives from here. |
| `io.output` | I/O | **Exit** point. The user sees what comes out here. |
| `model.llm` | Model | The **language model**. Without this node there is no text generation. |
| `store.*` | Store | Vector store. Without this node there is no RAG. |
| `retrieval.*` | Retrieval | Retrieves relevant chunks given a query. |

You'll study all 53 node types in detail in later modules. For now, what matters is being able to read a `flow.json` and say "this system does RAG because it has a `store`, a `retriever`, and a `model.llm` connected."

---

## 7. Course overview

This course has 12 modules (M0–M11). Here is the learning map:

```
M0  Setup and Python refresher
 │
M1  LLMs and prompting — the model block
 │
M2  Ingestion — loaders, chunking, metadata
 │
M3  Embeddings and Vector Stores — the store block
 │
M4  Advanced Retrieval — hybrid, rerank, GraphRAG
 │
M5  Generation and logic — structured output, citations, RAG evaluation
 │
M6  Agents I — tool calling, ReAct, memory, Reflection
 │
M7  Agents II — multi-agent, LangGraph, CrewAI, AutoGen, BeeAI
 │
M8  MCP — servers and clients with FastMCP
 │
M9  Production and security — guardrails, observability, deployment
 │
M10 Multimodal — voice (Whisper), vision, generation
 │
M11 Capstone — rebuild 3 templates + design architecture + exam
```

### The 10 templates and when they appear

| Template | Industry | Main module |
|----------|-----------|-----------------|
| 09-hr | HR | M1, M2, M3 |
| 02-banking | Banking | M2, M5 |
| 03-health | Healthcare | M4, M9 |
| 04-insurance | Insurance | M2, M5, M10 |
| 05-legal | Legal | M4 |
| 06-retail | Retail | M6 |
| 07-telecom | Telecom | M4, M7, M10 |
| 08-manufacturing | Manufacturing | M2, M4, M10 |
| 01-airline | Airline | M6, M8, M9, M11 |
| 10-logistics | Logistics | M7, M9, M11 |

### The tri-modal method

Each module covers concepts in three layers:

```
① Design/concept      → what it is, why it exists, when to use, when NOT to, alternatives
② Pure Python         → you implement the mechanism by hand with stdlib
③ Real framework      → how it's done with LangChain/LangGraph/LlamaIndex/CrewAI/etc.
```

Layer ② always runs on your machine with nothing installed. Layer ③ is real commented code for when you have pip and network.

### By the end of this course you'll be able to...

1. Explain any RAG/agentic architecture and its trade-offs.
2. Rebuild the 10 templates from scratch in Python.
3. Design a new architecture given a business brief.
4. Choose between LangChain, LangGraph, LlamaIndex, CrewAI, AutoGen with sound criteria.
5. Take a system to production with guardrails, observability, and security.

---

## 8. Checkpoint

**You know it if you can...**

- [ ] Create a `venv`, activate it, and install packages.
- [ ] Explain the difference between mock mode and real mode, and when to use each.
- [ ] Use `json.load` to read a JSON file and access nested keys.
- [ ] Write a `dataclass` with at least one field with a default value.
- [ ] Use `pathlib.Path(__file__).resolve().parents[N]` to build paths relative to the script.
- [ ] Explain what the Flow IR is and what its four sections are.
- [ ] Identify the input and output nodes of a `flow.json`.
- [ ] Run `python3 -m ragorbit serve` and explore the webapp.

**If you're still unsure about...** Section 4 (Python refresher) → look up the official documentation at `docs.python.org`. Section 6 (Flow IR) → read `docs/01-concepts.md` (it's the full contract).

**Continue with:** M1 — LLM + RAG Fundamentals.

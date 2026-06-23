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

```
ragorbit/          ← raíz del repo
├── venv/          ← tu entorno virtual (NO se sube a git)
├── app/
├── examples/
├── rag-training/  ← este material de estudio
└── ...
```

### 1.2 Create and activate the environment

```bash
# Desde la raíz del repo ragorbit:
python3 -m venv venv

# Activar (macOS/Linux):
source venv/bin/activate

# Activar (Windows PowerShell):
venv\Scripts\Activate.ps1

# Verificar que estás dentro:
which python   # debe apuntar a ragorbit/venv/bin/python

# Instalar dependencias del proyecto:
pip install -e .          # instala ragorbit y sus deps desde pyproject.toml
# o si hay requirements:
pip install -r requirements.txt
```

Once activated, the shell prompt usually shows `(venv)` at the start. To exit: `deactivate`.

> **Environment note:** on this machine `pip` is not available. Stdlib workshops still run fine with `python3` directly; framework exercises are marked as illustrative.

---

## 2. Offline / no-keys mode (mock mode) vs real mode

RAGorbit can work in **two modes**:

### Mock mode (no network, no keys)

```
┌─────────────────────────────────────────────────────────┐
│  Tu script / app                                        │
│       ↓                                                 │
│  RAGorbit runtime mock                                  │
│       ↓                                                 │
│  Función "fake LLM" determinista (plantillas fijas)     │
│  Vector store en memoria (diccionarios Python)          │
│  Embeddings de juguete (hashing / bag-of-words)         │
└─────────────────────────────────────────────────────────┘
```

- No API keys, Docker, or internet connection required.
- Responses are predictable: for the same input, always the same output.
- Perfect for learning, testing, and developing at no cost.

### Real mode

```
┌─────────────────────────────────────────────────────────┐
│  Tu script / app                                        │
│       ↓                                                 │
│  RAGorbit runtime real                                  │
│       ↓                                                 │
│  Claude / OpenAI / Gemini (API key requerida)           │
│  ChromaDB / pgvector / Qdrant (Docker o servicio cloud) │
│  Embeddings reales (text-embedding-3-large, etc.)       │
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
3. **Optional and separate**: the same problem with real frameworks (marked with `# Requiere: pip install ...`).

This is not a limitation: it's exactly how software engineers write tests. Production systems also have "mocks" of external services so tests are fast and cost-free.

> **In this course**: all `solucion_scratch.py` files run with `python3 archivo.py` with no installation. The `solucion_framework.py` files are real commented code you can run when you have network and pip.

---

## 4. Python refresher: what we'll use in this course

This refresher assumes you already program in Python. It's not a Python tutorial from scratch: it's a reminder of the specific features that appear in this course's workshops.

### 4.1 Typing and type annotations

Type annotations in Python are **optional at runtime** but valuable for readability and for IDE assistance.

```python
from typing import Optional, Union

def buscar_nodo(id: str, nodos: list[dict]) -> Optional[dict]:
    """Devuelve el nodo con ese id, o None si no existe."""
    return next((n for n in nodos if n["id"] == id), None)

# Python 3.10+: se puede usar | en vez de Union
def parsear(valor: str | int) -> str:
    return str(valor)
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

# Uso:
c = Chunk(text="El empleado tiene 15 días de vacaciones", source="manual_rrhh.pdf")
print(c)
# Chunk(text='El empleado tiene 15 días...', source='manual_rrhh.pdf', score=0.0, metadata={})

# Comparación automática:
c2 = Chunk(text="El empleado tiene 15 días de vacaciones", source="manual_rrhh.pdf")
print(c == c2)  # True — __eq__ compara campo por campo
```

We'll use `dataclass` to represent **documents**, **chunks**, **retrieval results**, and **messages** throughout the course.

### 4.3 json

The stdlib `json` module converts between JSON text and Python objects.

```python
import json

# Leer un archivo JSON:
with open("flow.json", encoding="utf-8") as f:
    data = json.load(f)          # -> dict o list

# Leer desde string:
texto = '{"id": "chat_input", "type": "io.input"}'
nodo  = json.loads(texto)        # -> dict

# Escribir a string (con formato legible):
salida = json.dumps(data, indent=2, ensure_ascii=False)

# Escribir a archivo:
with open("resultado.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

Important points:
- `ensure_ascii=False` so Unicode characters (Spanish, etc.) aren't escaped as `é`.
- `indent=2` for readable formatting; omit it for compact JSON (smaller size).
- `json.load` vs `json.loads`: the "s" in `loads` means "string" (receives text, not a file).

### 4.4 requests and urllib

For HTTP calls. In the stdlib layer we use `urllib`; in production we use `requests` (more ergonomic).

```python
# stdlib (sin pip):
import urllib.request
import json

url = "http://localhost:8080/api/health"
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode("utf-8"))
print(data)

# Petición POST con urllib:
import urllib.parse
payload = json.dumps({"query": "¿Cuántos días de vacaciones tengo?"}).encode()
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
# Con requests (pip install requests):
import requests

resp = requests.get("http://localhost:8080/api/health")
resp.raise_for_status()   # lanza excepción si 4xx/5xx
data = resp.json()

resp = requests.post(
    "http://localhost:8080/api/query",
    json={"query": "¿Cuántos días de vacaciones tengo?"}
)
```

### 4.5 http.server — stdlib HTTP server

When workshops need a simulated external service (for example, an HR API), we'll start an HTTP server with stdlib:

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HRApiHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/policy/vacaciones":
            body = json.dumps({"dias": 22, "tipo": "laborables"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *args):
        pass  # silencia el log por defecto

if __name__ == "__main__":
    server = HTTPServer(("localhost", 9090), HRApiHandler)
    print("Servidor mock en http://localhost:9090")
    server.serve_forever()
```

Run this script in one terminal, and make requests from another. You don't need Flask, FastAPI, or any framework.

### 4.6 Basic async (asyncio)

RAGorbit generates asynchronous code (LangGraph is async-first). You need to understand the basics.

```python
import asyncio

# Una corrutina: función con async def
async def saludar(nombre: str) -> str:
    await asyncio.sleep(0.1)   # operación "costosa" (simulada)
    return f"Hola, {nombre}"

# Ejecutar una sola corrutina:
resultado = asyncio.run(saludar("Ana"))
print(resultado)   # "Hola, Ana"

# Ejecutar varias en paralelo (gather):
async def main():
    r1, r2, r3 = await asyncio.gather(
        saludar("Ana"),
        saludar("Luis"),
        saludar("María"),
    )
    print(r1, r2, r3)

asyncio.run(main())
```

**The golden rule of async:** an `async def` function doesn't run when you call it; it returns a coroutine object. To run it you need `await` (inside another async function) or `asyncio.run()` (at the top level).

```python
# ERROR frecuente:
resultado = saludar("Ana")   # esto NO ejecuta la función
print(resultado)             # <coroutine object saludar at 0x...>

# CORRECTO:
resultado = asyncio.run(saludar("Ana"))
print(resultado)             # "Hola, Ana"
```

In this course's workshops, scratch solutions are **synchronous** (simpler to read). Frameworks like LangGraph are async; when you use them in layer ③, you'll see `async def` and `await` frequently.

### 4.7 pathlib — modern file paths

```python
from pathlib import Path

# Ruta del script actual:
aqui = Path(__file__).resolve()         # /Users/dany/dev/ragorbit/rag-training/00-setup/lab/script.py
directorio = aqui.parent                # /Users/dany/dev/ragorbit/rag-training/00-setup/lab
raiz_repo  = aqui.parents[3]            # /Users/dany/dev/ragorbit

# Construir rutas:
flow = raiz_repo / "examples" / "09-hr-policy-assistant" / "flow.json"

# Leer:
texto = flow.read_text(encoding="utf-8")

# Existe?
if not flow.exists():
    raise FileNotFoundError(f"No encuentro {flow}")

# Listar archivos:
for json_file in (raiz_repo / "examples").rglob("flow.json"):
    print(json_file)
```

`pathlib.Path` is the modern way to handle paths in Python 3. It's cross-platform (uses `/` on Unix and `\` on Windows automatically) and more readable than `os.path`.

---

## 5. How to run RAGorbit

### 5.1 Start the webapp

```bash
# Desde la raíz del repo, con el venv activado:
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

# Metadatos del flujo:
print(flow["flow"]["name"])            # "Asistente de políticas y beneficios..."
print(flow["flow"]["deploymentTarget"])# "chat-service"

# Nodos:
for nodo in flow["nodes"]:
    print(nodo["id"], "→", nodo["type"])

# Aristas:
for arista in flow["edges"]:
    print(f"{arista['source']}:{arista['sourcePort']} → {arista['target']}:{arista['targetPort']}")
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
M0  Setup y repaso Python
 │
M1  LLMs y prompting — el bloque model
 │
M2  Ingesta — loaders, chunking, metadata
 │
M3  Embeddings y Vector Stores — el bloque store
 │
M4  Retrieval avanzado — híbrido, rerank, GraphRAG
 │
M5  Generación y lógica — structured output, citas, evaluación RAG
 │
M6  Agentes I — tool calling, ReAct, memoria, Reflection
 │
M7  Agentes II — multi-agente, LangGraph, CrewAI, AutoGen, BeeAI
 │
M8  MCP — servidores y clientes con FastMCP
 │
M9  Producción y seguridad — guardrails, observabilidad, despliegue
 │
M10 Multimodal — voz (Whisper), visión, generación
 │
M11 Capstone — reconstruir 3 templates + diseñar arquitectura + examen
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
① Diseño/concepto    → qué es, por qué existe, cuándo usar, cuándo NO, alternativas
② Python puro        → implementas el mecanismo a mano con stdlib
③ Framework real     → cómo se hace con LangChain/LangGraph/LlamaIndex/CrewAI/etc.
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

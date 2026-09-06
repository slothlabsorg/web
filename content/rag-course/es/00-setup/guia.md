# M0 · Setup y repaso — Guía integral

> **Módulo 0 de 11** · Duración estimada: ½ semana · Sin conocimientos previos de IA requeridos.

Este módulo te da todo lo que necesitas para arrancar: el entorno configurado, un repaso de los aspectos de Python que más usaremos en el curso, y una primera lectura del "idioma" de RAGorbit (el Flow IR). Cuando termines, podrás correr la webapp, leer cualquier `flow.json` y entender qué problema resuelve cada pieza.

---

## Índice

1. [El entorno: venv y modos de trabajo](#1-el-entorno-venv-y-modos-de-trabajo)
2. [Modo sin-red / sin-claves (modo mock) vs modo real](#2-modo-sin-red--sin-claves-modo-mock-vs-modo-real)
3. [Por qué trabajaremos en modo mock](#3-por-qué-trabajaremos-en-modo-mock)
4. [Repaso de Python: lo que usaremos en este curso](#4-repaso-de-python-lo-que-usaremos-en-este-curso)
5. [Cómo correr RAGorbit](#5-cómo-correr-ragorbit)
6. [Leer un flow.json: el "idioma" de RAGorbit](#6-leer-un-flowjson-el-idioma-de-ragorbit)
7. [Panorama del curso](#7-panorama-del-curso)
8. [Checkpoint](#8-checkpoint)

---

## 1. El entorno: venv y modos de trabajo

### 1.1 ¿Por qué un entorno virtual?

Python tiene un sistema de paquetes global que puede causar conflictos entre proyectos. Un **entorno virtual** (`venv`) crea una copia aislada del intérprete para cada proyecto. Así, las versiones de LangChain que necesita RAGorbit no chocan con las de tu otro proyecto.

Son **dos repos** y conviene tenerlos claros desde el principio:

| Repo | Qué es | Lo usas para |
|---|---|---|
| [`slothlabsorg/ragorbit`](https://github.com/slothlabsorg/ragorbit) | La herramienta: engine, catálogo de nodos, codegen y los 10 templates de industria | Correr el lienzo, leer los `flow.json`, generar artefactos |
| [`slothlabsorg/rag-course`](https://github.com/slothlabsorg/rag-course) | Este curso (es/ + en/) | Los talleres que vas a resolver |

```bash
git clone https://github.com/slothlabsorg/ragorbit
git clone https://github.com/slothlabsorg/rag-course
```

```
ragorbit/          ← raíz del repo de la herramienta
├── venv/          ← tu entorno virtual (NO se sube a git)
├── ragorbit/      ← el engine (stdlib, sin dependencias)
├── examples/      ← los 10 templates de industria
├── docs/          ← el libro de RAGorbit
└── ...
```

> **Atajo:** para *usar* RAGorbit no necesitas clonar nada. Cada release publica un
> `ragorbit.pyz` de un solo archivo que corre con cualquier `python3`:
> `python3 ragorbit.pyz list-nodes`. También `pipx install ragorbit` o
> `brew install slothlabsorg/tap/ragorbit`. Clonar es para leer el código — que en
> este curso es justamente lo que quieres.

### 1.2 Crear y activar el entorno

```bash
# Desde la raíz del repo ragorbit:
python3 -m venv venv

# Activar (macOS/Linux):
source venv/bin/activate

# Activar (Windows PowerShell):
venv\Scripts\Activate.ps1

# Verificar que estás dentro:
which python   # debe apuntar a ragorbit/venv/bin/python

# Instalar el proyecto:
pip install -e .          # instala ragorbit desde pyproject.toml
```

El engine no tiene dependencias, así que `pip install -e .` no descarga nada: es
solo para tener el comando `ragorbit` en el PATH. Las dependencias aparecen cuando
las necesitas, y siempre como un extra explícito (`.[api]`, `.[real]`).

Una vez activado, el prompt del shell suele mostrar `(venv)` al inicio. Para salir: `deactivate`.

> **Los talleres de capa ② no necesitan `pip` en absoluto.** Corren con `python3` y la
> librería estándar, a propósito: así puedes hacer el curso completo en una máquina sin
> red, sin permisos de instalación o detrás de un proxy corporativo. La capa ③ (framework)
> sí requiere `pip install` y está marcada como tal en cada taller.

---

## 2. Modo sin-red / sin-claves (modo mock) vs modo real

RAGorbit puede trabajar en **dos modos**:

### Modo mock (sin red, sin claves)

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

- No necesita API keys, Docker, ni conexión a internet.
- Las respuestas son predecibles: para un mismo input, siempre el mismo output.
- Perfecto para aprender, testear y desarrollar sin costo.

### Modo real

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

- Requiere una o más API keys (Claude, OpenAI, etc.).
- Opcionalmente, Docker para los stores (ChromaDB persistente, pgvector, Qdrant).
- Los resultados son "reales" pero no deterministas y tienen costo por token.

---

## 3. Por qué trabajaremos en modo mock

### El problema de los talleres reales en un curso

Imagina que el ejercicio 3 del módulo 2 requiere llamar a la API de Claude. Si:
- La API está caída → el ejercicio falla por razones ajenas al aprendizaje.
- Cambian los precios → el curso se vuelve caro.
- No tienes tarjeta de crédito → no puedes seguir.
- El output cambia entre versiones del modelo → los `expected.md` quedan desactualizados.

### La solución: determinismo primero

Los talleres de este curso siguen el principio de **determinismo primero**:

1. **Aprende el mecanismo** con código puro (stdlib, sin dependencias).
2. **Verifica que funciona** sin necesitar nada externo.
3. **Opcional y separado**: el mismo problema con frameworks reales (marcado con `# Requiere: pip install ...`).

Esto no es una limitación: es exactamente cómo los ingenieros de software escriben tests. Los sistemas de producción también tienen "mocks" de los servicios externos para que los tests sean rápidos y sin costo.

> **En este curso**: todos los `solucion_scratch.py` corren con `python3 archivo.py` sin ninguna instalación. Los `solucion_framework.py` son código real comentado que puedes correr cuando tengas red y pip.

---

## 4. Repaso de Python: lo que usaremos en este curso

Este repaso asume que ya programas en Python. No es un tutorial de Python desde cero: es un recordatorio de las características específicas que aparecen en los talleres de este curso.

### 4.1 Typing y anotaciones de tipo

Las anotaciones de tipo en Python son **opcionales en tiempo de ejecución** pero valiosas para legibilidad y para que los IDEs te ayuden.

```python
from typing import Optional, Union

def buscar_nodo(id: str, nodos: list[dict]) -> Optional[dict]:
    """Devuelve el nodo con ese id, o None si no existe."""
    return next((n for n in nodos if n["id"] == id), None)

# Python 3.10+: se puede usar | en vez de Union
def parsear(valor: str | int) -> str:
    return str(valor)
```

**Para los talleres usaremos:**
- `list[T]`, `dict[K, V]`, `tuple[A, B]` — colecciones tipadas.
- `Optional[T]` (o `T | None`) — puede ser None.
- `Union[A, B]` (o `A | B`) — puede ser uno u otro tipo.
- Anotaciones de retorno en funciones (`-> tipo`).

### 4.2 Dataclasses

Las `dataclass` son clases donde solo defines los campos y Python genera `__init__`, `__repr__`, `__eq__` automáticamente.

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

Usaremos `dataclass` para representar **documentos**, **chunks**, **resultados de retrieval** y **mensajes** a lo largo del curso.

### 4.3 json

El módulo `json` de stdlib convierte entre texto JSON y objetos Python.

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

Puntos importantes:
- `ensure_ascii=False` para que los caracteres Unicode (español, etc.) no se escapen como `é`.
- `indent=2` para formato legible; omítelo para JSON compacto (menor tamaño).
- `json.load` vs `json.loads`: la "s" en `loads` significa "string" (recibe texto, no archivo).

### 4.4 requests y urllib

Para llamadas HTTP. En la capa de stdlib usamos `urllib`; en producción usamos `requests` (más ergonómico).

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

### 4.5 http.server — servidor HTTP de stdlib

Cuando los talleres necesiten un servicio externo simulado (por ejemplo, una API de RRHH), levantaremos un servidor HTTP con stdlib:

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

Corres este script en una terminal, y desde otra haces las peticiones. No necesitas Flask, FastAPI ni ningún framework.

### 4.6 Async básico (asyncio)

RAGorbit genera código asíncrono (LangGraph es async-first). Necesitas entender las bases.

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

**La regla de oro del async:** una función `async def` no se ejecuta cuando la llamas; devuelve un objeto corrutina. Para ejecutarla necesitas `await` (dentro de otro async) o `asyncio.run()` (en el nivel superior).

```python
# ERROR frecuente:
resultado = saludar("Ana")   # esto NO ejecuta la función
print(resultado)             # <coroutine object saludar at 0x...>

# CORRECTO:
resultado = asyncio.run(saludar("Ana"))
print(resultado)             # "Hola, Ana"
```

En los talleres del curso, las soluciones scratch son **síncronas** (más simples de leer). Los frameworks como LangGraph son async; cuando los uses en la capa ③, verás `async def` y `await` con frecuencia.

### 4.7 pathlib — rutas de archivos modernas

```python
from pathlib import Path

# Ruta del script actual:
aqui = Path(__file__).resolve()         # ~/dev/rag-course/es/00-setup/lab/script.py
directorio = aqui.parent                # ~/dev/rag-course/es/00-setup/lab
raiz_curso = aqui.parents[3]            # ~/dev/rag-course

# Los templates viven en el OTRO repo (ragorbit), clonado al lado:
raiz_ragorbit = raiz_curso.parent / "ragorbit"
flow = raiz_ragorbit / "examples" / "09-hr-policy-assistant" / "flow.json"

# Leer:
texto = flow.read_text(encoding="utf-8")

# Existe?
if not flow.exists():
    raise FileNotFoundError(f"No encuentro {flow}")

# Listar archivos:
for json_file in (raiz_ragorbit / "examples").rglob("flow.json"):
    print(json_file)
```

`pathlib.Path` es la forma moderna de manejar rutas en Python 3. Es multiplataforma (usa `/` en Unix y `\` en Windows automáticamente) y más legible que `os.path`.

---

## 5. Cómo correr RAGorbit

### 5.1 Iniciar la webapp

```bash
# Desde la raíz del repo, con el venv activado:
python3 -m ragorbit serve
```

Esto levanta la interfaz web (por defecto en `http://localhost:8080`). Puedes:
- Ver el lienzo donde se dibujan los grafos.
- Cargar cualquier template de `examples/`.
- Probar con mocks sin necesitar API keys.
- Explorar el catálogo de 53 tipos de nodo.

### 5.2 Validar un flow.json

```bash
python3 -m ragorbit validate examples/09-hr-policy-assistant/flow.json
```

Aplica las 7 reglas de validez del contrato (ver `docs/01-concepts.md §2.2`):
- Todos los tipos de nodo existen en el catálogo.
- Los `config` de cada nodo son válidos.
- Las aristas conectan puertos compatibles.
- Los puertos requeridos están conectados.
- Hay exactamente un nodo de entrada y al menos uno de salida.
- El grafo es acíclico (salvo aristas marcadas `loop: true`).
- Los secretos referenciados están declarados en `secrets[]`.

### 5.3 Leer un flow.json con Python

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

Esta es exactamente la tarea del taller de este módulo.

---

## 6. Leer un flow.json: el "idioma" de RAGorbit

### 6.1 El Flow IR en una frase

Un `flow.json` es un **grafo dirigido**: los nodos son bloques de procesamiento y las aristas son conexiones tipadas entre ellos. El JSON tiene cuatro secciones:

```
flow.json
├── irVersion: "1.0"
├── flow:      { id, name, description, deploymentTarget, defaults }
├── nodes:     [ { id, type, label, config, position }, ... ]
├── edges:     [ { source, sourcePort, target, targetPort, loop }, ... ]
└── secrets:   [ { name, required, usedBy }, ... ]
```

### 6.2 El template RRHH: recorrido visual

El flujo `09-hr-policy-assistant` tiene 10 nodos y 11 aristas. En diagrama ASCII:

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

Léelo como: el mensaje del usuario entra por `chat_input`, el `retriever` busca los chunks relevantes en el vector store, el `prompt` ensambla contexto + pregunta + modelo LLM para generar la respuesta, `citations` verifica que la respuesta cite sus fuentes, y `chat_output` devuelve el resultado al usuario.

### 6.3 Los tres tipos de nodos que debes reconocer ya

| Patrón de tipo | Categoría | Rol |
|----------------|-----------|-----|
| `io.input` | I/O | Punto de **entrada** del flujo. De aquí deriva el deployment target. |
| `io.output` | I/O | Punto de **salida**. El usuario ve lo que sale de aquí. |
| `model.llm` | Model | El **modelo de lenguaje**. Sin este nodo no hay generación de texto. |
| `store.*` | Store | Almacén de vectores. Sin este nodo no hay RAG. |
| `retrieval.*` | Retrieval | Recupera chunks relevantes dada una query. |

Los 53 tipos de nodo los estudiarás en detalle en los módulos siguientes. Por ahora, lo importante es poder leer un `flow.json` y decir "este sistema hace RAG porque tiene un `store`, un `retriever` y un `model.llm` conectados".

---

## 7. Panorama del curso

Este curso tiene 12 módulos (M0–M11). Aquí está el mapa de aprendizaje:

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

### Los 10 templates y cuándo aparecen

| Template | Industria | Módulo principal |
|----------|-----------|-----------------|
| 09-hr | RRHH | M1, M2, M3 |
| 02-banking | Banca | M2, M5 |
| 03-health | Salud | M4, M9 |
| 04-insurance | Seguros | M2, M5, M10 |
| 05-legal | Legal | M4 |
| 06-retail | Retail | M6 |
| 07-telecom | Telecom | M4, M7, M10 |
| 08-manufacturing | Manufactura | M2, M4, M10 |
| 01-airline | Aerolínea | M6, M8, M9, M11 |
| 10-logistics | Logística | M7, M9, M11 |

### El método tri-modal

Cada módulo aborda los conceptos en tres capas:

```
① Diseño/concepto    → qué es, por qué existe, cuándo usar, cuándo NO, alternativas
② Python puro        → implementas el mecanismo a mano con stdlib
③ Framework real     → cómo se hace con LangChain/LangGraph/LlamaIndex/CrewAI/etc.
```

La capa ② siempre corre en tu máquina sin nada instalado. La capa ③ es código real comentado para cuando tengas pip y red.

### Al final de este curso podrás...

1. Explicar cualquier arquitectura RAG/agéntica y sus trade-offs.
2. Reconstruir los 10 templates desde cero en Python.
3. Diseñar una arquitectura nueva dado un brief de negocio.
4. Elegir entre LangChain, LangGraph, LlamaIndex, CrewAI, AutoGen con criterio.
5. Llevar un sistema a producción con guardrails, observabilidad y seguridad.

---

## 8. Checkpoint

**Lo sabes si puedes...**

- [ ] Crear un `venv`, activarlo e instalar paquetes.
- [ ] Explicar la diferencia entre modo mock y modo real, y cuándo usar cada uno.
- [ ] Usar `json.load` para leer un archivo JSON y acceder a claves anidadas.
- [ ] Escribir una `dataclass` con al menos un campo con valor por defecto.
- [ ] Usar `pathlib.Path(__file__).resolve().parents[N]` para construir rutas relativas al script.
- [ ] Explicar qué es el Flow IR y cuáles son sus cuatro secciones.
- [ ] Identificar el nodo de entrada y el de salida de un `flow.json`.
- [ ] Correr `python3 -m ragorbit serve` y explorar la webapp.

**Si te quedaste con dudas en...** Sección 4 (repaso Python) → busca la documentación oficial en `docs.python.org`. Sección 6 (Flow IR) → lee `docs/01-concepts.md` (es el contrato completo).

**Sigue con:** M1 — Fundamentos LLM + RAG.

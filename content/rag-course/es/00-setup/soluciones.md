# M0 · Soluciones — Setup y repaso Python

> Respuestas razonadas de todos los ejercicios de `ejercicios.md`.

---

## Ejercicio 1 — venv: opción múltiple

**Respuesta correcta: c)**

Razonamiento:
- **a) Falsa.** Un venv crea una copia aislada del intérprete y un directorio `site-packages` propio. Los paquetes del sistema **no** son visibles (a menos que crees el venv con `--system-site-packages`, que no es el comportamiento por defecto).
- **b) Falsa.** La carpeta `venv/` solo contiene el intérprete y los paquetes instalados. El código fuente de tu proyecto está en otro lugar. Borrar `venv/` es inocuo; lo puedes recrear con `python3 -m venv venv && pip install -e .`.
- **c) Verdadera.** Eso es exactamente el propósito de los venvs: aislamiento de dependencias. Proyecto A puede tener `langchain==0.1.0` y proyecto B puede tener `langchain==0.3.0` sin conflicto.
- **d) Falsa.** `python3 -m venv venv` **crea** el entorno pero **no lo activa**. La activación requiere un paso separado: `source venv/bin/activate` (Unix) o `venv\Scripts\Activate.ps1` (Windows).

---

## Ejercicio 2 — Predice la salida

```
<class 'dict'>
True
2
```

Razonamiento:
- `json.loads` devuelve un `dict` (el texto JSON `{...}` se convierte en `dict` Python).
- `true` en JSON se convierte en `True` en Python (booleano). `obj["activo"] is True` evalúa a `True`.
- `obj["version"]` es el entero `1` (JSON números sin punto decimal se convierten a `int` Python). `1 + 1 = 2`.

---

## Ejercicio 3 — json: encuentra el bug

**Problema:** falta `ensure_ascii=False`.

Sin esa opción, `json.dump` escapa todos los caracteres no-ASCII. El carácter `é` (U+00E9) se convierte en `é` en el JSON resultante. El archivo quedaría:
```json
{"descripcion": "Días de vacaciones según el contrato", "dias": 22}
```

**Solución:**
```python
import json

datos = {"descripcion": "Días de vacaciones según el contrato", "dias": 22}
with open("salida.json", "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False)
```

Dos correcciones:
1. `ensure_ascii=False` — permite caracteres Unicode en la salida.
2. `encoding="utf-8"` en el `open` — asegura que el archivo se guarda en UTF-8 (en Windows el encoding por defecto puede ser diferente).

---

## Ejercicio 4 — dataclass: opción múltiple

**Respuesta falsa: d)**

Razonamiento:
- **a) Verdadera.** `@dataclass` genera `__eq__` automáticamente comparando todos los campos. `d1` y `d2` tienen los mismos valores en todos los campos, por lo que son iguales.
- **b) Verdadera.** `d3.score = 0.5` mientras `d1.score = 0.0`. La comparación incluye `score`, así que `d1 != d3`.
- **c) Verdadera.** `score: float = 0.0` define un valor por defecto. `d1 = Documento("Hola", "test.pdf")` no pasa `score`, así que toma el valor `0.0`.
- **d) Falsa.** `@dataclass` genera `__repr__` automáticamente. `print(d1)` imprimirá `Documento(texto='Hola', fuente='test.pdf', score=0.0)`. No hay `AttributeError`.

---

## Ejercicio 5 — pathlib: predice la salida

```
explorador.py
lab
00-setup
rag-training
```

Razonamiento:
- `p.name` — nombre del archivo (última parte de la ruta): `explorador.py`.
- `p.parent.name` — nombre del directorio padre: `lab`.
- `p.parents[2].name` — `parents[0]` es `lab/`, `parents[1]` es `00-setup/`, `parents[2]` es `rag-training/`.
- `p.parents[3].name` — `parents[3]` es `ragorbit/`.

> Nota: `parents[N]` es el N-ésimo ancestro. `parents[0]` == `parent`. Los índices empiezan en 0.

---

## Ejercicio 6 — flow.json: lectura

Respuestas basadas en el archivo real:

a) **10 nodos**: `chat_input`, `hr_docs`, `chunker`, `embedder`, `hr_store`, `retriever`, `llm`, `prompt`, `citations`, `chat_output`.

b) **11 aristas**.

c) `"chat-service"` (deriva del nodo `io.input` según el contrato — ver `docs/01-concepts.md §5`).

d) El nodo con id `"citations"` tiene `type: "logic.citations"`.

e) El nodo `retriever` envía `Chunks` a **`prompt`** (puerto `Chunks`) y a **`citations`** (puerto `Chunks`). Hay dos aristas con `source: "retriever"` y `sourcePort: "Chunks"`.

---

## Ejercicio 7 — Flow IR: diseño

**Son inválidas las condiciones: a, b, d, e** (todas excepto c).

- **a) Verdadera (inválida).** El contrato exige que los `id` de nodo sean únicos dentro del flow. Dos nodos con el mismo `id` rompen el grafo: las aristas no sabrían a qué nodo apuntar.
- **b) Verdadera (inválida).** La regla §2.2.5 dice "al menos un nodo de salida (categoría `io`)". Sin `io.output`, el flujo no tiene dónde entregar el resultado.
- **c) Falsa (válida).** Un nodo `model.llm` sin aristas de entrada es perfectamente válido. Su única función es proveer el modelo (puerto de salida `Model`). No necesita recibir nada; otros nodos "toman" su modelo.
- **d) Verdadera (inválida).** La regla §2.2.6 exige que el grafo sea acíclico salvo aristas con `loop: true`. Un ciclo sin ese flag es un error de contrato.
- **e) Verdadera (inválida).** La regla §2.2.7: todo secreto referenciado en un `config` debe aparecer en `secrets[]`. Un secreto no declarado haría el flujo incompleto (falta el placeholder para la API key).

---

## Ejercicio 8 — async: encuentra el bug

**Bug:** se llama a `obtener_precio("laptop")` sin `await`, y sin estar dentro de un contexto async.

`obtener_precio("laptop")` **no ejecuta** la corrutina; devuelve un objeto `<coroutine object>`. El resultado impreso es algo como `Precio: <coroutine object obtener_precio at 0x10a2b3c40>`.

**Solución 1** — `asyncio.run` (apropiado fuera de un contexto async):
```python
resultado = asyncio.run(obtener_precio("laptop"))
print(f"Precio: {resultado}")   # Precio: 999.0
```

**Solución 2** — dentro de otro async con await:
```python
async def main():
    resultado = await obtener_precio("laptop")
    print(f"Precio: {resultado}")

asyncio.run(main())
```

Python 3.12+ emite un `RuntimeWarning` cuando una corrutina se crea pero nunca se espera. En versiones anteriores el error pasa en silencio.

---

## Ejercicio 9 — typing: completa el código

```python
from typing import Optional

def buscar_por_tipo(nodos: list[dict], tipo: str) -> list[dict]:
    """Devuelve todos los nodos cuyo 'type' coincide con el argumento."""
    return [n for n in nodos if n["type"] == tipo]

def primer_nodo_entrada(nodos: list[dict]) -> Optional[dict]:
    """Devuelve el primer nodo de tipo 'io.input', o None si no existe."""
    return next((n for n in nodos if n["type"].startswith("io.input")), None)
```

Notas:
- `list[dict]` para una lista de diccionarios arbitrarios (Python 3.9+ soporta esto directamente; en 3.8 necesitas `from __future__ import annotations` o `List[Dict]` de `typing`).
- `Optional[dict]` (equivalente a `dict | None` en Python 3.10+) indica que la función puede devolver `None`. `next(iter, None)` retorna `None` si el iterable está vacío.

---

## Ejercicio 10 — stdlib HTTP: diseño

Pasos en `do_GET`:

1. **Verificar la ruta**: `if self.path == "/api/nodos":` — solo responder para esa URL.
2. **Cargar el flow.json**: `json.load(open(...))` — leer el archivo y extraer `data["nodes"]`.
3. **Serializar a JSON**: `body = json.dumps(nodos, ensure_ascii=False).encode("utf-8")`.
4. **Enviar cabeceras**:
   - `self.send_response(200)` — código HTTP OK.
   - `self.send_header("Content-Type", "application/json; charset=utf-8")`.
   - `self.send_header("Content-Length", str(len(body)))`.
   - `self.end_headers()` — termina la sección de cabeceras.
5. **Enviar cuerpo**: `self.wfile.write(body)`.
6. **Manejar rutas desconocidas**: `else: self.send_response(404); self.end_headers()`.

Ejemplo de respuesta para `GET /api/nodos`:
```json
[{"id": "chat_input", "type": "io.input", ...}, ...]
```

---

## Ejercicio 11 — modo mock vs real: opción múltiple

**Respuesta correcta: c)**

Razonamiento:
- **a) Modo mock.** Cuando aprendes el mecanismo (chunking, retrieval, etc.) el mock es suficiente y más rápido. No necesitas pagar por tokens para entender cómo se trocean los documentos.
- **b) Modo mock.** Los tests de CI/CD deben ser rápidos, deterministas y sin costo. Un test que llama a una API externa es frágil (falla si la API está caída) y caro.
- **c) Modo real.** Cuando el objetivo es calidad perceptible por un humano (una demo al cliente), necesitas un LLM real que genere respuestas coherentes y útiles, no plantillas fijas.
- **d) Modo mock (o ni eso).** Depurar un error de contrato del Flow IR no requiere llamar a ningún LLM. Basta con `python3 -m ragorbit validate`.

---

## Ejercicio 12 — integrador: código corto

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

Para `"examples/09-hr-policy-assistant/flow.json"`, el resultado es:

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

Notas sobre el código:
- `{n["type"] for n in nodos}` — **set comprehension**: crea un conjunto (sin duplicados).
- `sorted(...)` — ordena alfabéticamente. En Python, los strings se ordenan lexicográficamente.
- `data["flow"]["deploymentTarget"]` — acceso anidado. Si `"flow"` no existiera lanzaría `KeyError`. Para ser más robusto: `data.get("flow", {}).get("deploymentTarget")`.

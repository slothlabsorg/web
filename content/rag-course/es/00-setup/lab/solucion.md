# Solución del Taller M0 — Explorador de Flow IR

## ¿Qué hace el script paso a paso?

### 1. Resolver la ruta de forma robusta

```python
script_dir = pathlib.Path(__file__).resolve().parent   # .../lab/
repo_root  = script_dir.parents[2]                     # .../ragorbit/
flow_path  = repo_root / "examples" / "09-hr-policy-assistant" / "flow.json"
```

`__file__` es la ruta del script en tiempo de ejecución. `.resolve()` la convierte en absoluta, eliminando symlinks. `.parents[2]` sube dos niveles: `lab/ → 00-setup/ → rag-training/ → ragorbit/`. El contador es 2 (no 3) porque `parents[0]` ya es el padre del script.

Esto hace el script portátil: funciona independientemente del directorio de trabajo actual.

### 2. Cargar el JSON

```python
with open(ruta, encoding="utf-8") as f:
    data = json.load(f)
```

`json.load()` convierte el texto JSON en un `dict` de Python. Sin pip, sin dependencias.

### 3. Listar nodos

```python
[{"id": n["id"], "type": n["type"], "label": n.get("label", "")}
 for n in flow.get("nodes", [])]
```

List comprehension: recorre la lista `nodes` y extrae solo los campos que nos interesan. `n.get("label", "")` usa valor por defecto vacío por si algún nodo no tuviera label.

### 4. Listar aristas

```python
for e in flow.get("edges", []):
    {"source": e["source"], "sourcePort": e["sourcePort"],
     "target": e["target"], "targetPort": e["targetPort"]}
```

Cada arista en el Flow IR tiene exactamente estos cuatro campos. El resultado es `source:puerto → target:puerto`.

### 5. Identificar entrada y salida

La solución usa **dos estrategias combinadas**:

**Estrategia semántica (primaria):**
```python
nodo_entrada = next(n for n in nodes if n["type"].startswith("io.input"), None)
nodos_salida = [n for n in nodes if n["type"].startswith("io.output")]
```
Busca por tipo de nodo. Es la estrategia más robusta porque se basa en el contrato del Flow IR (ver `docs/01-concepts.md §2.2`): siempre debe haber exactamente un nodo `io.input` y al menos uno `io.output`.

**Estrategia topológica (fallback):**
```python
targets = {e["target"] for e in edges}
sources = {e["source"] for e in edges}
nodo_entrada = next(n for n in nodes if n["id"] not in targets, None)
nodos_salida = [n for n in nodes if n["id"] not in sources]
```
Un nodo sin aristas entrantes es un "origen" del grafo. Un nodo sin aristas salientes es una "hoja" final. Esta estrategia funciona con cualquier grafo dirigido acíclico, incluso si los tipos no siguen la convención `io.*`.

---

## Por qué solo stdlib

RAGorbit ya genera código Python. Para que el alumno entienda ese código generado necesita tener fluidez con la librería estándar: `json`, `pathlib`, `sys`. Estos módulos son los cimientos. Las dependencias externas (LangChain, ChromaDB, etc.) vienen después, cuando ya entiendas qué reemplazan.

---

## Extensiones posibles (para practicar)

1. **Detectar nodos desconectados**: nodos que no aparecen ni como `source` ni como `target`.
2. **Contar por categoría**: agrupar los nodos por la parte antes del punto en `type` (p.ej. `io`, `loader`, `model`…).
3. **Validar aristas**: comprobar que cada `source` y `target` en `edges` corresponde a un `id` que existe en `nodes`.
4. **Cargar cualquier template**: hacer el script parametrizable con `sys.argv[1]` para recibir la ruta del `flow.json` como argumento.
5. **Imprimir en JSON**: cambiar el formato de salida a JSON (usando `json.dumps`) para que otra herramienta pueda consumirlo.

---

## Conexión con el curso

Este taller es el punto de partida de todo. En módulos posteriores:

- **M1** — verás que `llm` (`model.llm`) es el corazón del flujo.
- **M2** — `hr_docs` + `chunker` es la pipeline de ingesta.
- **M3** — `embedder` + `hr_store` es la capa de embeddings y vector store.
- **M4** — `retriever` es el recuperador configurable.
- **M5** — `prompt` + `citations` es la lógica de generación y citas obligatorias.

Al final del curso podrás no solo leer este `flow.json` sino **reconstruirlo desde cero** y **diseñar variantes** justificando cada decisión.

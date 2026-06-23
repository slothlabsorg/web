# Taller M0 — Explorador de Flow IR

## Contexto de negocio

Tu equipo acaba de recibir el primer template de RAGorbit: el asistente de políticas de RRHH (`examples/09-hr-policy-assistant/`). El tech lead quiere una herramienta de diagnóstico que cualquier ingeniero pueda correr en local para entender rápidamente la estructura de cualquier `flow.json`: cuántos nodos hay, de qué tipos, cómo están conectados, y cuál es el punto de entrada y de salida del sistema.

No hay acceso a la webapp todavía. Solo stdlib. Solo Python.

---

## Tu tarea

Escribe un script Python (`explorador.py`) que, **usando únicamente la librería estándar**, haga lo siguiente:

1. **Cargue** `examples/09-hr-policy-assistant/flow.json` (ruta relativa a la raíz del repo).
2. **Liste todos los nodos** mostrando, para cada uno, su `id` y su `type`.
3. **Liste todas las aristas** mostrando `source:sourcePort → target:targetPort`.
4. **Identifique el nodo de entrada** (el que inicia el flujo) y el o los **nodos de salida** (los que lo terminan).
5. Imprima todo con formato legible en la terminal.

---

## Requisitos técnicos

- Solo módulos de stdlib: `json`, `pathlib`, `sys` (y los que necesites de stdlib).
- Sin `pip install`. Sin redes. Sin dependencias externas.
- El script debe correr con `python3 explorador.py` desde cualquier directorio (usa rutas absolutas derivadas de `__file__`).
- La salida debe ser determinista (mismo orden en cada ejecución).

---

## Datos de entrada

Archivo: [`examples/09-hr-policy-assistant/flow.json`](../../../examples/09-hr-policy-assistant/flow.json)

Ábrelo y explóralo antes de escribir el script. Fíjate en:
- La clave `"nodes"` y qué campos tiene cada nodo.
- La clave `"edges"` y cómo describe una conexión.
- Qué tipo tienen el primer y el último nodo del flujo.

---

## Pistas escalonadas

**Pista 1** — Cargar el JSON:
```python
import json
with open("ruta/al/flow.json", encoding="utf-8") as f:
    data = json.load(f)
nodos = data["nodes"]   # lista de dicts
aristas = data["edges"] # lista de dicts
```

**Pista 2** — Ruta robusta (independiente del cwd):
```python
import pathlib
raiz = pathlib.Path(__file__).resolve().parents[N]  # N = niveles hasta la raíz del repo
```
Cuenta cuántos niveles hay entre `explorador.py` y la raíz del repo.

**Pista 3** — Identificar nodo de entrada/salida:
Hay dos estrategias. La más simple: un nodo de entrada es el que **ninguna arista apunta hacia él** (no aparece como `target`). Un nodo de salida es el que **no tiene aristas que salgan** (no aparece como `source`). La más robusta: fíjate en el campo `type` — los nodos `io.input` arrancan el flujo; los `io.output` lo terminan.

**Pista 4** — Formato de salida:
Usa `f-strings` con `<N` (alineación a la izquierda) para que las columnas queden bien:
```python
print(f"  id={n['id']:<20} type={n['type']}")
```

---

## Criterio de éxito

Tu script supera el taller si su salida es **idéntica** a la de [`expected.md`](./expected.md).

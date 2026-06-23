# M0 · Ejercicios — Setup y repaso Python

> **12 ejercicios sin respuestas.** Las respuestas razonadas están en `soluciones.md`.
> Tipos: opción múltiple, "predice la salida", "encuentra el bug", código corto.

---

## Ejercicio 1 — venv: opción múltiple

¿Cuál de las siguientes afirmaciones sobre los entornos virtuales de Python es **correcta**?

a) Un venv comparte los paquetes instalados con el Python global del sistema.
b) Al borrar la carpeta `venv/` pierdes también el código fuente de tu proyecto.
c) Puedes tener distintas versiones de LangChain en dos proyectos distintos si cada uno tiene su propio venv.
d) `python3 -m venv venv` crea el entorno y lo activa automáticamente.

---

## Ejercicio 2 — Predice la salida

¿Qué imprime el siguiente código? Razona antes de ejecutarlo.

```python
import json

texto = '{"nombre": "RAGorbit", "version": 1, "activo": true}'
obj = json.loads(texto)
print(type(obj))
print(obj["activo"] is True)
print(obj["version"] + 1)
```

---

## Ejercicio 3 — json: encuentra el bug

El siguiente código intenta guardar un diccionario con caracteres en español a un archivo JSON, pero el resultado tiene caracteres escapados (`é` en vez de `é`). ¿Qué está mal y cómo lo arreglas?

```python
import json

datos = {"descripcion": "Días de vacaciones según el contrato", "dias": 22}
with open("salida.json", "w") as f:
    json.dump(datos, f)
```

---

## Ejercicio 4 — dataclass: opción múltiple

Dado el siguiente código:

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

¿Cuál de estas afirmaciones es **falsa**?

a) `d1 == d2` es `True`.
b) `d1 == d3` es `False` porque `score` difiere.
c) `d1.score` tiene el valor `0.0` por defecto.
d) `print(d1)` lanza un `AttributeError` porque no definimos `__repr__`.

---

## Ejercicio 5 — pathlib: predice la salida

Dado este script guardado en `/Users/ana/proyectos/ragorbit/rag-training/00-setup/lab/explorador.py`:

```python
from pathlib import Path
p = Path(__file__).resolve()
print(p.name)
print(p.parent.name)
print(p.parents[2].name)
print(p.parents[3].name)
```

¿Qué imprime cada línea?

---

## Ejercicio 6 — flow.json: lectura

Abre `examples/09-hr-policy-assistant/flow.json`. Responde:

a) ¿Cuántos nodos hay en total?
b) ¿Cuántas aristas hay?
c) ¿Qué valor tiene `flow.deploymentTarget`?
d) ¿Qué nodo tiene `type: "logic.citations"`?
e) El nodo `retriever` envía su puerto `Chunks` a dos nodos distintos. ¿Cuáles son?

---

## Ejercicio 7 — Flow IR: diseño

Según el contrato del Flow IR (ver `docs/01-concepts.md §2.2`), un flujo es **inválido** si... (marca todas las que aplican):

a) Tiene dos nodos con el mismo `id`.
b) Tiene cero nodos de tipo `io.output`.
c) Un nodo de tipo `model.llm` no tiene aristas de entrada.
d) El grafo tiene un ciclo sin que ninguna arista esté marcada con `loop: true`.
e) Un nodo referencia un secreto que no aparece en `secrets[]`.

---

## Ejercicio 8 — async: encuentra el bug

El siguiente código intenta obtener datos de una corrutina pero imprime algo inesperado. ¿Qué falla?

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

## Ejercicio 9 — typing: completa el código

Completa las anotaciones de tipo en las siguientes funciones para que sean correctas:

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

## Ejercicio 10 — stdlib HTTP: diseño

Quieres crear un servidor HTTP con `http.server` que exponga un endpoint `GET /api/nodos` y devuelva la lista de nodos del flujo 09 en formato JSON. Describe (en pseudocódigo o en prosa) los pasos que necesitas implementar en el método `do_GET` del handler.

---

## Ejercicio 11 — modo mock vs real: opción múltiple

¿En cuál de estas situaciones es **más apropiado** usar el modo real (con API key)?

a) Estás aprendiendo cómo funciona el chunking y quieres entender el mecanismo.
b) Quieres correr los tests de tu CI/CD pipeline sin costo ni latencia variable.
c) Tienes que demostrar al cliente que el sistema responde preguntas de RRHH con alta calidad.
d) Estás depurando por qué una arista de tu `flow.json` es inválida.

---

## Ejercicio 12 — integrador: código corto

Escribe una función Python (stdlib pura) que reciba la ruta de un `flow.json` y devuelva un `dict` con:
- `"total_nodos"`: número de nodos.
- `"total_aristas"`: número de aristas.
- `"tipos_unicos"`: lista de tipos de nodo únicos, sin repetir y ordenada alfabéticamente.
- `"deployment_target"`: el valor de `flow.deploymentTarget`.

Firma esperada:
```python
def resumir_flow(ruta: str) -> dict:
    ...
```

Y cuando se llame con `"examples/09-hr-policy-assistant/flow.json"`, ¿qué valores debería devolver para cada clave? (Puedes abrir el archivo para verificar.)

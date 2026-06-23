# Taller M2 — Chunker de contrato legal por cláusula

## Contexto de negocio

El equipo legal de **Empresa Tecnológica del Norte** revisa decenas de contratos al mes. Para alimentar su sistema RAG de revisión (basado en la arquitectura del template `05-legal-contract-review`), cada contrato debe dividirse en fragmentos (chunks) **uno por cláusula**, de modo que cada fragmento sea recuperable de forma independiente y pueda compararse contra el playbook de cláusulas aprobadas.

El problema con el chunking por caracteres (fixed chunking) es que parte cláusulas a la mitad, mezclando el inicio de una obligación con el final de otra. El chunking por cláusula garantiza que cada fragmento sea una unidad semántica y jurídica coherente.

Además, cada chunk debe llevar **metadata** que permita filtros duros en el retriever:
- `clausula_id` — número de la cláusula (entero)
- `titulo` — título de la cláusula
- `tipo` — categoría jurídica inferida del título (objeto, pago, confidencialidad, etc.)
- `contrato` — identificador del contrato
- `fecha` — fecha de suscripción

## Tarea

Dado el archivo `datos/contrato_muestra.txt`, escribe un programa que:

1. Lea el contrato.
2. Identifique cada cláusula numerada (`CLÁUSULA N. TÍTULO`).
3. Extraiga el texto completo de cada cláusula como un chunk independiente.
4. Asigne metadata a cada chunk: `clausula_id`, `titulo`, `tipo`, `contrato`, `fecha`.
5. Imprima los chunks en orden ascendente por número de cláusula.
6. Imprima el JSON completo del primer chunk para verificación.

## Datos de entrada

Archivo: `rag-training/02-ingesta/lab/datos/contrato_muestra.txt`

Fragmento ilustrativo del formato:

```
CLÁUSULA 1. OBJETO DEL CONTRATO
El presente contrato tiene por objeto la prestación de servicios...

CLÁUSULA 2. DURACIÓN Y VIGENCIA
El presente contrato tendrá una vigencia de doce (12) meses...
```

## Salida esperada

Ver `expected.md` para la salida completa.

Puntos clave a verificar:
- **13 chunks** en total (uno por cláusula)
- Sin falsos positivos: referencias en texto como "la Cláusula 9 del presente instrumento" **no** deben crear un chunk
- El chunk 1 debe tener `clausula_id: 1`, `tipo: "objeto"`, `source: "contrato_muestra.txt"`
- El resumen final lista 13 tipos diferentes (sin `"otro"`)

## Pistas escalonadas

**Pista 1 — Estructura del problema**
El desafío principal es distinguir un encabezado de cláusula (`CLÁUSULA 1. OBJETO`) de una referencia a cláusula dentro del cuerpo ("conforme a la Cláusula 9..."). Los encabezados siempre aparecen al inicio de una línea y en mayúsculas.

**Pista 2 — Regex con re.MULTILINE**
El flag `re.MULTILINE` hace que `^` coincida con el inicio de cada línea (no solo el inicio del texto completo). Combínalo con `re.IGNORECASE` para tolerar variaciones de capitalización.

**Pista 3 — Patrón sugerido**
```python
import re
patron = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)[\.:\-]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
    re.IGNORECASE | re.MULTILINE
)
```
Grupo 1: número de cláusula. Grupo 2: título.

**Pista 4 — Corte del texto**
Una vez que tienes la lista de `match.start()` positions, el chunk `i` va desde `matches[i].start()` hasta `matches[i+1].start()` (o hasta el final del texto para el último chunk).

**Pista 5 — Clasificador de tipo**
Puedes inferir el `tipo` de la cláusula con una tabla de keywords sobre el título:
```python
if "confidencialidad" in titulo.lower(): tipo = "confidencialidad"
elif "pago" in titulo.lower(): tipo = "pago"
# etc.
```

## Restricciones

- Solo stdlib de Python (re, pathlib, json, sys, dataclasses).
- Determinista: misma entrada → misma salida siempre.
- Sin red, sin pip.

---

## Capa ③ — Chunking con LangChain (tarea guiada)

> **Objetivo:** escribir tú mismo el código framework del taller, no solo leer `solucion_framework.py`. Lee primero [§10 de la guía](../guia.md#10-la-capa--explicada-chunking-con-langchain-desde-cero). Recuerda: `Document`, loaders y la idea de LangChain ya los viste en [M1 §11](../../01-fundamentos/guia.md#11-la-capa--explicada-langchain-desde-cero).

**Requisito:** la capa ② (scratch) debe ejecutarse y producir los 13 chunks de `expected.md` **antes** de empezar la capa ③.

**Entorno:** necesitas `pip install langchain-text-splitters langchain-community`. Este entorno del curso no tiene red; escribe el código en tu máquina o léelo con la guía abierta al lado.

### Paso 0 — Recordatorio

Un `Document` de LangChain tiene `page_content` (texto) y `metadata` (dict). Un splitter recibe documentos y devuelve documentos más pequeños. Eso es todo lo que necesitas de M1 para empezar.

### Paso 1 — Enfoque A: `RecursiveCharacterTextSplitter`

**Lee:** [guía §10.2](../guia.md#102-recursivecharactertextsplitter-el-algoritmo-recursivo) (algoritmo recursivo) y [§10.5 bloque 1](../guia.md#bloque-1--enfoque-a-recursivecharactertextsplitter).

**Escribe** un script `mi_framework_a.py` (o un bloque en un notebook) que:

1. Lea `datos/contrato_muestra.txt`.
2. Cree un `RecursiveCharacterTextSplitter` con:
   - `separators=["\nCLÁUSULA ", "\n\n", "\n", " "]`
   - `chunk_size=1200`, `chunk_overlap=0`, `keep_separator=True`
3. Llame a `.create_documents([texto])`.
4. Imprima `len(chunks)` y los primeros 80 caracteres de los 3 primeros chunks.

**Preguntas para reflexionar (no avances al Paso 2 sin responderlas):**

- ¿Cuántos chunks obtuviste? ¿Es exactamente 13?
- ¿Algún chunk tiene metadata (`clausula_id`, `tipo`)? ¿Por qué no?
- Si bajas `chunk_size` a 400, ¿qué pasa con el número de chunks? (Pista: el algoritmo recursivo baja al siguiente separador.)

### Paso 2 — Enfoque B: `ClauseSplitter` custom

**Lee:** [guía §10.3](../guia.md#103-escribir-tu-propio-splitter-heredar-de-textsplitter) (heredar de `TextSplitter`) y [§10.5 bloque 2](../guia.md#bloque-2--enfoque-b-clausesplitter-custom).

**Escribe** una clase `ClauseSplitter(TextSplitter)` que replique la lógica de tu `solucion_scratch.py`:

| Método / pieza | Qué debe hacer | Pista |
|----------------|----------------|-------|
| `_PATRON` | Regex con `^CLÁUSULA\s+(\d+)` y `re.MULTILINE` | Copia el patrón probado en la capa ② |
| `split_text(text)` | Devuelve `list[str]` | `[d.page_content for d in self._split_to_docs(text)]` |
| `_split_to_docs(text)` | Construye `Document` con metadata rica | Mismo bucle `matches[i].start()` → `fin` del scratch |
| `split_documents(docs)` | Propaga `source` del padre | `chunk.metadata["source"] = doc.metadata.get("source", "")` |
| `_clasificar(titulo)` | Tabla de keywords → `tipo` | Reutiliza la lógica del scratch |

**Uso esperado:**

```python
from langchain_core.documents import Document

doc = Document(
    page_content=open("datos/contrato_muestra.txt").read(),
    metadata={"source": "contrato_muestra.txt"},
)
splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents([doc])
assert len(chunks) == 13
assert chunks[0].metadata["clausula_id"] == 1
assert chunks[0].metadata["tipo"] == "objeto"
```

### Paso 3 — Comparar con la solución de referencia

Abre `solucion_framework.py` y compáralo bloque a bloque con tu código ([guía §10.5](../guia.md#105-recorrido-bloque-a-bloque-de-solucion_frameworkpy)):

- ¿Tu Enfoque A usa los mismos parámetros? ¿Entiendes cada uno?
- ¿Tu `ClauseSplitter` implementa los mismos métodos?
- ¿Qué bloque comentado al final muestra la integración con `Chroma`?

### Paso 4 — Integración loader → splitter (opcional)

Si tienes `langchain-community` instalado, reemplaza el `open()` manual por:

```python
from langchain_community.document_loaders import TextLoader

docs = TextLoader("datos/contrato_muestra.txt").load()
chunks = splitter.split_documents(docs)
```

Verifica que `chunks[0].metadata["source"]` sigue siendo `"contrato_muestra.txt"`. Esto es el pipeline real de ingesta ([guía §10.4](../guia.md#104-integración-loader--splitter-pipeline-completo)).

### Criterios de éxito (capa ③)

| Criterio | Esperado |
|----------|----------|
| Enfoque B: número de chunks | **13** |
| Enfoque B: `chunks[0].metadata["tipo"]` | `"objeto"` |
| Enfoque B: `chunks[8].metadata["tipo"]` | `"confidencialidad"` (Cláusula 9) |
| Sin falsos positivos por referencias internas | 0 chunks espurios |
| Entiendes por qué el Enfoque A no basta en producción | Puedes explicarlo en una frase |

---

## Soluciones

- `solucion_scratch.py` — implementación con stdlib pura (ejecutable).
- `solucion_framework.py` — implementación de referencia con LangChain (requiere pip). **Consúltala solo después** de intentar los Pasos 1–3.
- `solucion.md` — explicación de ambas soluciones y comparativa.

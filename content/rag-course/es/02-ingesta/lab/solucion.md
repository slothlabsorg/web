# Solución — Taller M2: Chunker de contrato legal por cláusula

## Capa ② — Python puro (solucion_scratch.py)

### Idea central

El contrato tiene una estructura predecible: cada cláusula comienza con `CLÁUSULA N. TÍTULO` al inicio de una línea. La clave del problema es **no** confundir esos encabezados con referencias a cláusulas dentro del cuerpo del texto (p.ej., "conforme a la Cláusula 9 del presente instrumento").

La solución usa `re.MULTILINE` con el ancla `^` para que el regex solo haga match al comienzo de línea:

```python
_PATRON_CLAUSULA = re.compile(
    r'^CL[AÁ]USULA\s+(\d+)[\.:\-–—]?\s+([A-ZÁÉÍÓÚÑÜ][^\n]+)',
    re.IGNORECASE | re.MULTILINE
)
```

### Por qué `re.MULTILINE`

Sin `re.MULTILINE`, el `^` solo ancla al inicio del texto completo. Con él, `^` ancla al inicio de cada línea. Esto es lo que discrimina encabezados de referencias:

| Texto | Con `re.MULTILINE` |
|-------|-------------------|
| `CLÁUSULA 9. CONFIDENCIALIDAD\n` (inicio de línea) | match |
| `conforme a la Cláusula 9 del presente instrumento` (mitad de línea) | no match |

### Algoritmo paso a paso

1. `finditer` devuelve todos los matches ordenados por posición en el texto.
2. Para el chunk `i`, el texto va desde `matches[i].start()` hasta `matches[i+1].start()`.
3. El último chunk va desde `matches[-1].start()` hasta `len(texto)`.
4. Normalización: se colapsan saltos de línea dentro de párrafos (líneas contiguas se unen con espacio); los párrafos se separan con `\n\n`.
5. La metadata se construye con datos fijos del contrato (`CSP-2024-0087`, `2024-01-15`) más los grupos capturados por el regex.

### Clasificador de tipo

La función `clasificar_clausula` aplica una lista de tuplas `(keywords, tipo)` en orden. La primera keyword que aparece en el título (en minúsculas) determina el tipo. Es determinista: para el mismo título siempre produce el mismo tipo.

**Tradeoff:** un clasificador basado en keywords es frágil ante títulos inusuales. Un clasificador real usaría embeddings o un modelo de intención ligero (`model.intent` en RAGorbit). Para este taller, la tabla de keywords es suficiente y mantiene la restricción de "sin LLM".

### Resultado

- **13 chunks**, uno por cláusula (CLÁUSULA 1 a CLÁUSULA 13).
- **0 falsos positivos** — las referencias internas no generan chunks espurios.
- Orden ascendente garantizado por `.sort(key=lambda c: c.metadata["clausula_id"])`.

---

## Capa ③ — LangChain (solucion_framework.py)

> **Antes de leer esta sección:** intenta los Pasos 1–3 del [taller guiado](enunciado.md#capa-③--chunking-con-langchain-tarea-guiada) y estudia [guía §10](../guia.md#10-la-capa--explicada-chunking-con-langchain-desde-cero). El archivo `solucion_framework.py` es la referencia, no el punto de partida.

El archivo muestra dos enfoques (recorrido detallado en [guía §10.5](../guia.md#105-recorrido-bloque-a-bloque-de-solucion_frameworkpy)):

### Enfoque A: RecursiveCharacterTextSplitter

```python
splitter = RecursiveCharacterTextSplitter(
    separators=["\nCLÁUSULA ", "\n\n", "\n", " "],
    chunk_size=1200,
    chunk_overlap=0,
)
```

LangChain intenta el primer separador (`"\nCLÁUSULA "`); si el chunk resultante supera `chunk_size`, prueba `"\n\n"`, luego `"\n"`, etc. Es un splitter **genérico** — no produce metadata automáticamente y el número de chunks puede variar con `chunk_size`.

**Cuándo usarlo:** cuando no conoces la estructura del documento y quieres un punto de partida rápido.

### Enfoque B: ClauseSplitter (custom)

Hereda de `TextSplitter` e implementa la misma lógica de regex que `solucion_scratch.py`, pero se integra con el ecosistema LangChain:

```python
splitter = ClauseSplitter(contract_id="CSP-2024-0087", fecha="2024-01-15")
chunks = splitter.split_documents([doc])
```

Cada chunk es un `Document` con `page_content` y `metadata` completos. Se puede pasar directamente a `Chroma.from_documents()` o cualquier vector store de LangChain.

**Cuándo usarlo:** cuando el dominio tiene estructura predecible (contratos, manuales ATA, normativas) y quieres metadata rica sin postprocesado.

---

## Comparativa de enfoques

| Aspecto | solucion_scratch.py | RecursiveCharacterTextSplitter | ClauseSplitter custom |
|---------|--------------------|---------------------------------|----------------------|
| Dependencias | ninguna (stdlib) | langchain-text-splitters | langchain-text-splitters |
| Metadata automática | sí (regex) | no | sí (regex) |
| Número de chunks | siempre 13 | depende de chunk_size | siempre 13 |
| Falsos positivos | 0 (ancla ^) | posible (sin ancla) | 0 (ancla ^) |
| Integración con LangChain | manual | nativa | nativa |
| Caso de uso ideal | estudio / script | documentos sin estructura | producción con LangChain |

---

## Conexión con RAGorbit

En el template `05-legal-contract-review`, el nodo `contract_chunker` tiene:

```json
{
  "type": "ingest.chunker",
  "config": {
    "strategy": "by-clause",
    "chunkSize": 900,
    "overlap": 120
  }
}
```

El código generado por RAGorbit para este nodo es equivalente al `ClauseSplitter` del enfoque B. La diferencia es que RAGorbit también gestiona el `ingest.metadata` como nodo separado, lo que permite cambiar los campos de metadata sin tocar el código del chunker.

El `solucion_scratch.py` combina chunking + metadata en un solo paso, lo que es correcto para un script de aprendizaje pero menos mantenible en producción que la separación en dos nodos.

---

## Errores comunes y cómo evitarlos

**Error 1 — No usar `re.MULTILINE`**
El regex detecta la primera cláusula pero ignora el resto porque `^` solo ancla al inicio del texto completo. Solución: agregar el flag.

**Error 2 — Match de referencias internas**
Si el patrón no tiene `^`, "la Cláusula 9 del presente instrumento" genera un chunk espurio. Resultado: 15 chunks en lugar de 13, con chunks de 1-2 palabras.

**Error 3 — Olvidar el último chunk**
El bucle `for i, match in enumerate(matches)` necesita manejar el caso `i + 1 == len(matches)` usando `len(texto)` como límite. Olvidarlo trunca la última cláusula.

**Error 4 — Chunks desordenados**
`finditer` devuelve matches en orden de posición en el texto, que debería ser el orden numérico. Pero si el texto tuviera cláusulas fuera de orden, el sort explícito garantiza el orden correcto.

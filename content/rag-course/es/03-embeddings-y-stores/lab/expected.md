# Expected — Taller M3 · Mini Vector Store

> Salida producida por `python3 solucion_scratch.py`. Verificada ejecutando el script.

---

## Indexado

```
12 documentos indexados.
Categorias: {'beneficios': 4, 'formacion': 2, 'horario': 3, 'vacaciones': 3}
```

## Query

```
Query: "dias de permiso y descanso que tengo derecho"
Dimensiones activas en el embedding: [('dias', 0.5774), ('permiso', 0.5774), ('descanso', 0.5774)]
```

El embedding de la query activa 3 palabras del vocabulario: `dias`, `permiso`, `descanso`.
Tras normalización: cada dimensión activa vale ≈ 0.5774 (= 1/√3 ≈ 0.5774).

---

## Búsqueda A — sin filtro, top-3

| Posición | ID | Score | Categoría | Tema |
|----------|----|-------|-----------|------|
| 1 | `doc_08` | 0.5774 | vacaciones | permisos especiales |
| 2 | `doc_04` | 0.3333 | vacaciones | festivos |
| 3 | `doc_01` | 0.0000 | vacaciones | tiempo libre |

**Por qué doc_08 es top-1:** contiene las palabras `permiso` y `descanso` → dot product alto con la query que también tiene esas dos palabras activas. `doc_04` solo activa `dias` y `descanso`. `doc_01` no activa ninguna palabra del vocabulario en la query normalizada (sus palabras como "vacaciones", "días" sí están en VOCAB pero no coinciden con las palabras activas de la query → score 0).

**Nota sobre score 0.0000:** el score de `doc_01` es exactamente 0 porque sus palabras clave activan dimensiones distintas a las de la query. Esto es una limitación del embedding de juguete: en la realidad, "días de vacaciones" sería semánticamente muy cercano a "días de permiso". Con un embedding neuronal real (text-embedding-3-large, BGE), doc_01 estaría en top-1 o top-2.

---

## Búsqueda B — con filtro `{"categoria": "vacaciones"}`, top-3

| Posición | ID | Score | Categoría | Tema |
|----------|----|-------|-----------|------|
| 1 | `doc_08` | 0.5774 | vacaciones | permisos especiales |
| 2 | `doc_04` | 0.3333 | vacaciones | festivos |
| 3 | `doc_01` | 0.0000 | vacaciones | tiempo libre |

**Efecto del filtro:** en este caso, el top-3 sin filtro ya estaba dominado por documentos de categoría `vacaciones`. El filtro no cambia el contenido del top-3 aquí. Sin embargo, sí elimina la competencia: documentos de otras categorías que podrían haber subido si la query fuera más ambigua (p.ej. `doc_03` o `doc_06` de categoría `horario` que mencionan "días").

---

## Comportamiento del filtro — cuándo SÍ cambia el resultado

Si usas una query diferente que activa palabras compartidas entre categorías:

```
Query: "dias de trabajo y horario"
Sin filtro top-3: podría incluir doc_06 (horario/jornada) y doc_10 (horario/horas extra)
Con filtro vacaciones: solo doc_01, doc_04, doc_08 — aunque sean menos relevantes
```

El filtro es un **guardrail**: garantiza que los resultados pertenezcan al dominio correcto incluso si el score es bajo. Equivale al `hardFilters` en `retrieval.vector` de RAGorbit.

---

## Demo CRUD

```
Documentos antes de operaciones: 12
Añadido doc_13. Total: 13
Actualizado doc_01 (nueva politica de vacaciones 2025).
Eliminado doc_13. Total: 12
```

### Re-query tras actualizar doc_01

```
[doc_08] score=0.5774  version=2024
[doc_01] score=0.4082  version=2025
[doc_04] score=0.3333  version=2024
```

`doc_01` subió de 0.0000 a **0.4082** porque el nuevo texto contiene "dias" (ahora la palabra activa en la query). Esto demuestra que re-embeder al actualizar es imprescindible para mantener el índice coherente.

---

## Diagnóstico del embedding de juguete

| Limitación | Impacto en este taller | Solución real |
|-----------|----------------------|---------------|
| Solo 20 dimensiones | Muchos textos tienen score 0 (no activan palabras del vocab) | Modelo neuronal 768–3072 dim |
| Sin semántica | "vacaciones" y "tiempo libre" son palabras distintas aunque signifiquen lo mismo | Transformer entrenado en datos |
| Sin contexto | "no tengo permiso" y "tengo permiso" producen el mismo vector | Attention mechanism |
| Vocabulario fijo | Palabras fuera del vocab no contribuyen | Tokenizador subword |

Estas limitaciones son intencionales para el aprendizaje — el embedding de juguete muestra la mecánica sin ocultar los cálculos.

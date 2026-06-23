# Expected — Workshop M3 · Mini Vector Store

> Output produced by `python3 solucion_scratch.py`. Verified by running the script.

---

## Indexing

```
12 documentos indexados.
Categorias: {'beneficios': 4, 'formacion': 2, 'horario': 3, 'vacaciones': 3}
```

## Query

```
Query: "dias de permiso y descanso que tengo derecho"
Dimensiones activas en el embedding: [('dias', 0.5774), ('permiso', 0.5774), ('descanso', 0.5774)]
```

The query embedding activates 3 vocabulary words: `dias`, `permiso`, `descanso`.
After normalization: each active dimension is ≈ 0.5774 (= 1/√3 ≈ 0.5774).

---

## Search A — no filter, top-3

| Rank | ID | Score | Category | Topic |
|------|----|-------|----------|-------|
| 1 | `doc_08` | 0.5774 | vacaciones | permisos especiales |
| 2 | `doc_04` | 0.3333 | vacaciones | festivos |
| 3 | `doc_01` | 0.0000 | vacaciones | tiempo libre |

**Why doc_08 is top-1:** it contains the words `permiso` and `descanso` → high dot product with the query, which also has those two words active. `doc_04` only activates `dias` and `descanso`. `doc_01` does not activate any vocabulary word in the normalized query (its words like "vacaciones", "días" are in VOCAB but do not match the query's active words → score 0).

**Note on score 0.0000:** `doc_01`'s score is exactly 0 because its key words activate dimensions different from the query's. This is a limitation of the toy embedding: in reality, "días de vacaciones" would be semantically very close to "días de permiso". With a real neural embedding (text-embedding-3-large, BGE), doc_01 would be in top-1 or top-2.

---

## Search B — with filter `{"categoria": "vacaciones"}`, top-3

| Rank | ID | Score | Category | Topic |
|------|----|-------|----------|-------|
| 1 | `doc_08` | 0.5774 | vacaciones | permisos especiales |
| 2 | `doc_04` | 0.3333 | vacaciones | festivos |
| 3 | `doc_01` | 0.0000 | vacaciones | tiempo libre |

**Filter effect:** in this case, the top-3 without filter was already dominated by documents in category `vacaciones`. The filter does not change the top-3 content here. However, it does remove competition: documents from other categories that might have risen if the query were more ambiguous (e.g. `doc_03` or `doc_06` in category `horario` that mention "días").

---

## Filter behavior — when results DO change

If you use a different query that activates words shared across categories:

```
Query: "dias de trabajo y horario"
Sin filtro top-3: podría incluir doc_06 (horario/jornada) y doc_10 (horario/horas extra)
Con filtro vacaciones: solo doc_01, doc_04, doc_08 — aunque sean menos relevantes
```

The filter is a **guardrail**: it guarantees that results belong to the correct domain even if the score is low. It is equivalent to `hardFilters` in RAGorbit's `retrieval.vector`.

---

## CRUD demo

```
Documentos antes de operaciones: 12
Añadido doc_13. Total: 13
Actualizado doc_01 (nueva politica de vacaciones 2025).
Eliminado doc_13. Total: 12
```

### Re-query after updating doc_01

```
[doc_08] score=0.5774  version=2024
[doc_01] score=0.4082  version=2025
[doc_04] score=0.3333  version=2024
```

`doc_01` rose from 0.0000 to **0.4082** because the new text contains "dias" (now an active word in the query). This shows that re-embedding on update is essential to keep the index coherent.

---

## Toy embedding diagnosis

| Limitation | Impact in this workshop | Real solution |
|------------|-------------------------|---------------|
| Only 20 dimensions | Many texts have score 0 (do not activate vocabulary words) | Neural model 768–3072 dim |
| No semantics | "vacaciones" and "tiempo libre" are distinct words even though they mean the same | Transformer trained on data |
| No context | "no tengo permiso" and "tengo permiso" produce the same vector | Attention mechanism |
| Fixed vocabulary | Words outside the vocab do not contribute | Subword tokenizer |

These limitations are intentional for learning — the toy embedding shows the mechanics without hiding the calculations.

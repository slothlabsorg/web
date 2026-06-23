# Expected — Lab M4

> Exact results produced by `python3 solucion_scratch.py` on the `datos/politicas.json` corpus.
> Query: `"¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"`
> Target fare class: `Basic`

---

## Without filter (full corpus, top-3)

The pipeline without filter returns documents from all three fares mixed. Top-1 is **Top** fare — most semantically relevant because it explicitly mentions "cambios sin cargo adicional", but it belongs to a different fare than the passenger's.

```
Rank 1:  id=pol_008  fare_class=Top   categoria=cambios
         rrf_score=0.032787  tokens_comunes=2
         "Tarifa Top: se permiten cambios ilimitados de fecha, hora y ruta sin cargo adicional..."

Rank 2:  id=pol_005  fare_class=Plus  categoria=cambios
         rrf_score=0.032002  tokens_comunes=2
         "Tarifa Plus: se permite un cambio de fecha o hora sin cargo adicional hasta 24 horas..."

Rank 3:  id=pol_002  fare_class=Basic categoria=cambios
         rrf_score=0.031498  tokens_comunes=2
         "Tarifa Basic: no se permiten cambios de vuelo una vez confirmada la reserva..."
```

**Noise check:**
```
Hay documentos de otras fare_class en top-3: True
fare_classes en top-3: ['Top', 'Plus', 'Basic']
```

**Consequence:** If an agent uses this result without a filter, they might tell the Basic passenger they "can make changes without a fee" (Top fare information), which is incorrect.

---

## With filter `fare_class='Basic'` (top-3)

With the hard filter applied before any search, the corpus shrinks to 3 documents (pol_001, pol_002, pol_003). The ranking returns only Basic policies.

```
Rank 1:  id=pol_002  fare_class=Basic categoria=cambios
         rrf_score=0.032522  tokens_comunes=2
         "Tarifa Basic: no se permiten cambios de vuelo una vez confirmada la reserva.
          Cualquier modificación de fecha, hora o ruta implica la cancelación y nueva
          compra al precio vigente. No hay reembolso posible salvo cancelación por la aerolínea."

Rank 2:  id=pol_003  fare_class=Basic categoria=reembolsos
         rrf_score=0.032522  tokens_comunes=1
         "Tarifa Basic: los reembolsos no están disponibles..."

Rank 3:  id=pol_001  fare_class=Basic categoria=equipaje
         rrf_score=0.031746  tokens_comunes=0
         "Tarifa Basic: el equipaje de mano está incluido en el precio..."
```

**Correctness check:**
```
Todos los resultados son fare_class='Basic': True
IDs citables: ['pol_002', 'pol_003', 'pol_001']
```

---

## Citable result

The top-1 with filter is the correct citable source:

```
Fuente: pol_002 | fare_class: Basic | categoria: cambios
Texto: "Tarifa Basic: no se permiten cambios de vuelo una vez confirmada la reserva.
        Cualquier modificación de fecha, hora o ruta implica la cancelación y nueva
        compra al precio vigente. No hay reembolso posible salvo cancelación por la aerolínea."
```

An agent with this result can answer with certainty: "With Basic fare, changes without a fee are not possible. Any modification requires canceling and buying again [pol_002, Basic, cambios]."

---

## Why the filter changes the result

Without filter:
- pol_008 (Top) ranks first because its text contains "cambios" + "sin cargo adicional" — exactly the query terms.
- BM25 and BoW cosine score that document highly.
- The reranker confirms it at top-1.

With filter `fare_class=Basic`:
- pol_008 and pol_005 do not exist for the retriever.
- Only pol_001, pol_002, pol_003 compete.
- pol_002 ranks first because its text contains "cambios" (direct query keyword).
- The answer is correct and citable.

**This is the central pattern of the module:** the hard filter is not a stylistic option — it is a deterministic guardrail that prevents the LLM from receiving and using information from the wrong context.

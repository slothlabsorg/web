# Expected — Lab M4

> Resultados exactos que produce `python3 solucion_scratch.py` sobre el corpus de `datos/politicas.json`.
> Query: `"¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"`
> Fare class objetivo: `Basic`

---

## Sin filtro (corpus completo, top-3)

El pipeline sin filtro devuelve documentos de las tres tarifas mezcladas. El top-1 es de tarifa **Top** — el más relevante semánticamente porque habla de "cambios sin cargo adicional" explícitamente, pero corresponde a una tarifa distinta a la del pasajero.

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

**Check de ruido:**
```
Hay documentos de otras fare_class en top-3: True
fare_classes en top-3: ['Top', 'Plus', 'Basic']
```

**Consecuencia:** Si un agente usa este resultado sin filtro, podría informar al pasajero Basic que "puede hacer cambios sin cargo" (información de tarifa Top), lo cual es incorrecto.

---

## Con filtro `fare_class='Basic'` (top-3)

Con el filtro duro aplicado antes de cualquier búsqueda, el corpus se reduce a 3 documentos (pol_001, pol_002, pol_003). El ranking devuelve únicamente políticas Basic.

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

**Check de corrección:**
```
Todos los resultados son fare_class='Basic': True
IDs citables: ['pol_002', 'pol_003', 'pol_001']
```

---

## Resultado citable

El top-1 con filtro es la fuente citable correcta:

```
Fuente: pol_002 | fare_class: Basic | categoria: cambios
Texto: "Tarifa Basic: no se permiten cambios de vuelo una vez confirmada la reserva.
        Cualquier modificación de fecha, hora o ruta implica la cancelación y nueva
        compra al precio vigente. No hay reembolso posible salvo cancelación por la aerolínea."
```

Un agente con este resultado puede responder con certeza: "Con tarifa Basic, no es posible hacer cambios sin cargo. Cualquier modificación implica cancelar y comprar de nuevo [pol_002, Basic, cambios]."

---

## Por qué el filtro cambia el resultado

Sin filtro:
- pol_008 (Top) rankea primero porque su texto contiene "cambios" + "sin cargo adicional" — exactamente los términos de la query.
- BM25 y el coseno BoW puntúan alto ese documento.
- El reranker lo confirma en top-1.

Con filtro `fare_class=Basic`:
- pol_008 y pol_005 no existen para el retriever.
- Solo compiten pol_001, pol_002, pol_003.
- pol_002 rankea primero porque su texto contiene "cambios" (keyword directa de la query).
- La respuesta es correcta y citable.

**Este es el patrón central del módulo:** el filtro duro no es una opción de estilo — es un guardrail determinista que evita que el LLM reciba y use información de un contexto incorrecto.

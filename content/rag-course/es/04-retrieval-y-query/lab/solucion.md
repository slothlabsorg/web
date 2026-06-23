# Solución — Lab M4

## Qué demuestra este lab

El lab tiene un objetivo muy específico: mostrar empíricamente que la query `"¿puedo hacer cambios en mi vuelo sin pagar cargos adicionales?"` para un pasajero de tarifa **Basic** devuelve ruido de otras tarifas cuando no hay filtro, y devuelve solo resultados correctos y citables cuando se aplica el filtro duro `fare_class=Basic`.

---

## Capa ② — Solución scratch (BM25 + coseno + RRF + rerank)

### Por qué el sin-filtro falla

La query contiene los términos clave "cambios" y "sin cargo adicional". El documento `pol_008` (tarifa **Top**) contiene exactamente `"cambios ilimitados de fecha, hora y ruta sin cargo adicional"` — una coincidencia semántica y léxica perfecta.

- BM25 lo rankea primero: "cambios" y "cargo" tienen alta TF en ese doc, IDF medio (aparece en 3 de 9 docs), y el doc es de longitud media.
- Coseno lo rankea primero: el embedding BoW de la query se solapa con las palabras de pol_008 más que con pol_002 (que niega los cambios: "no se permiten cambios").
- RRF consolida el primer lugar para pol_008 (consenso entre ambos retrievers).
- El reranker simple (intersección de tokens) tampoco cambia esto porque pol_008 también tiene muchos tokens en común con la query.

El documento pol_002 (Basic, cambios) rankea tercero sin filtro — correcto semánticamente pero enterrado detrás del ruido.

### Por qué el con-filtro funciona

Con `fare_class=Basic`, el corpus activo se reduce a [pol_001, pol_002, pol_003]. Ahora pol_002 compite solo con otras dos políticas Basic (equipaje y reembolsos). La query sobre "cambios" hace que pol_002 (categoría "cambios") rankee primero, tanto en BM25 como en coseno. El resultado es correcto y citable.

### Decisiones de diseño del scratch

**Tokenización:** `split()` + eliminación de stopwords. Simple pero efectiva para este corpus en español. Las tildes se preservan como parte del carácter alfanumérico.

**Embedding BoW normalizado:** Se divide cada frecuencia por el total de tokens, obteniendo proporciones. Esto permite comparar documentos de distintas longitudes con similitud coseno. Es un embedding extremadamente simplificado (sin IDF), pero suficiente para demostrar el concepto.

**RRF con k=60:** El valor estándar. Con pocos documentos (9), los rankings son muy sensibles al k. Con k=60, la diferencia entre rank 1 y rank 2 es pequeña (1/61 vs 1/62), lo que hace la fusión más suave.

**Rerank por intersección:** Simple y determinista. Cuenta cuántos tokens únicos de la query aparecen en el documento. Es un proxy del cross-encoder sin necesitar modelos externos. En producción se reemplazaría por BGE-reranker o Cohere.

---

## Capa ③ — Solución framework (LangChain)

> **Antes de leer esto:** deberías haber intentado escribir el framework guiado por [guia.md §13](../guia.md#13-la-capa--explicada-retrievers-de-langchain-desde-cero) y por la sección "Capa ③" de [`enunciado.md`](enunciado.md). Esta sección resume decisiones; la enseñanza completa está en la guía, no aquí.

### Componentes clave

**BM25Retriever** usa la librería `rank-bm25` bajo el capó — la misma fórmula que implementamos a mano, optimizada en C. `BM25Retriever.from_documents(docs)` crea el índice en memoria.

**EnsembleRetriever** implementa RRF internamente con `c=60` (el mismo k de nuestro scratch). Los `weights` que configuras no son pesos de score sino de importancia para el fallback cuando un documento solo aparece en una lista.

**ContextualCompressionRetriever + CrossEncoderReranker** es el patrón estándar de LangChain para añadir un reranker sobre cualquier retriever. El `base_retriever` recupera el top-K inicial y el `base_compressor` reordena y recorta a `top_n`.

**Filtro duro en el framework:** LangChain no tiene un "hardFilter" central en EnsembleRetriever. La estrategia correcta es filtrar el corpus antes de construir los retrievers (como hace `crear_retriever_filtrado`). Si usas Chroma, también puedes pasar `filter={"fare_class": fare_class}` en `search_kwargs` del vector retriever — pero ese filtro solo aplica al retriever vectorial, no al BM25. Por eso la solución más robusta es filtrar el corpus al inicio.

### Diferencia clave scratch vs framework

| Aspecto | Scratch | Framework |
|---------|---------|-----------|
| BM25 | Implementación manual completa | rank-bm25 optimizado |
| Embedding | BoW normalizado (sin semántica) | all-MiniLM-L6-v2 (semántico real) |
| Fusión | RRF manual con k=60 | EnsembleRetriever (RRF interno) |
| Rerank | Intersección de tokens (proxy) | BGE-reranker (cross-encoder real) |
| Filtro duro | Filtramos lista Python antes del pipeline | Filtramos corpus antes de los retrievers |
| Dependencias | Ninguna (stdlib pura) | langchain, rank-bm25, sentence-transformers, chromadb |

El scratch es perfectamente válido para entender los mecanismos. El framework agrega semántica real (embeddings con contexto) y un reranker cross-encoder que captura interacciones no disponibles en el BoW.

---

## El patrón que queda grabado

```
                  CORPUS COMPLETO
                       │
              ┌────────┴────────┐
              │  FILTRO DURO    │  ← aplicar ANTES de cualquier búsqueda
              │  fare_class =   │
              │  "Basic"        │
              └────────┬────────┘
                       │ 3 docs (en vez de 9)
              ┌────────┴────────┐
              │   BM25          │
              │   + Coseno      │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   RRF           │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   Rerank        │
              └────────┬────────┘
                       │ top-3 TODOS Basic
              ┌────────┴────────┐
              │   LLM           │  ← nunca ve docs de Top o Plus
              └────────┬────────┘
                       │
              Respuesta correcta y citable
```

Este patrón — filtro duro → retrieval → rerank — es idéntico al que usa `retrieval.vector` con `hardFilters: ["fare_class"]` en RAGorbit, y al que usan los templates 03 (healthcare, `plan`), 08 (manufactura, `aircraft_type`), y 01 (aerolínea, `fare_class`).

# Panorama de estrategias y arquitecturas RAG

> Catálogo **vendor-neutral** de técnicas y arquitecturas de Retrieval-Augmented Generation (RAG) conocidas a 2025/2026. Complementa lo ya cubierto en M4 (retrieval avanzado) y M6 (Agentic RAG) con las estrategias que faltan. Principio transversal: **empieza simple** — añade complejidad solo cuando un síntoma medible lo justifica.

**Audiencia:** programadores en Python que ya dominaron denso + BM25 + híbrido + rerank + parent-child + GraphRAG y quieren el mapa completo del mercado.

**Lo que NO repetimos aquí en profundidad** (enlazamos y ampliamos): búsqueda densa, BM25, híbrido con RRF, reranking cross-encoder, parent-child, filtros duros, multi-index routing, query rewriting, intent detection y GraphRAG básico → ver [M4 — Retrieval y query](../04-retrieval-y-query/guia.md).

---

## Índice

1. [Introducción: el espectro RAG](#introducción-el-espectro-rag)
2. [Pre-retrieval (transformar la query)](#1-pre-retrieval-transformar-la-query)
3. [Indexación / representación](#2-indexación--representación)
4. [Post-retrieval](#3-post-retrieval)
5. [RAG con auto-corrección / agéntico](#4-rag-con-auto-corrección--agéntico)
6. [RAG estructural](#5-rag-estructural)
7. [Tabla de decisión maestra](#6-tabla-de-decisión-maestra)

---

## Introducción: el espectro RAG

RAG no es una sola arquitectura: es un **espectro** de patrones que van desde un pipeline fijo de dos pasos hasta sistemas agénticos que deciden dinámicamente si, cuándo y cómo recuperar.

```
                    COMPLEJIDAD / COSTO
                           ▲
                           │
     Agentic / Modular RAG │  Self-RAG, CRAG, Adaptive RAG,
     (M6)                  │  FLIR, IRCoT, tool.retriever
                           │
     Advanced RAG (M4)     │  HyDE, RAG-Fusion, RAPTOR,
                           │  Contextual Retrieval, ColBERT,
                           │  compresión, MMR, lost-in-the-middle
                           │
     Naive RAG             │  embed → top-K → prompt → LLM
                           │
                           └──────────────────────────────▶ CALIDAD
                              (recall, precisión, faithfulness)
```

### Tres generaciones (terminología de mercado)

| Generación | Patrón | Característica clave | Ejemplo en el curso |
|------------|--------|----------------------|---------------------|
| **Naive RAG** | `query → retrieve → generate` | Pipeline fijo, sin optimización | M3 — primer RAG funcional |
| **Advanced RAG** | Pre/post-retrieval + indexación mejorada | Mejora cada eslabón de la cadena | M4 — híbrido, rerank, parent-child |
| **Modular / Agentic RAG** | Componentes intercambiables; el agente orquesta | Decisión dinámica de recuperación y corrección | M6 §6 — `tool.retriever`, Self-RAG, CRAG |

### Tabla resumen: ganancia de calidad vs costo/complejidad

Escala orientativa: **G** = ganancia de calidad esperada, **C** = costo/complejidad (latencia, tokens, infraestructura, mantenimiento).

| Técnica | G | C | Fase | Enlace curso |
|---------|---|---|------|--------------|
| Híbrido BM25 + vector + RRF | ●●●○ | ●●○○ | Retrieval | [M4 §4](../04-retrieval-y-query/guia.md#4-búsqueda-híbrida) |
| Reranking cross-encoder | ●●●● | ●●○○ | Post-retrieval | [M4 §5](../04-retrieval-y-query/guia.md#5-reranking-con-cross-encoder) |
| Query rewriting / expansion | ●●○○ | ●●○○ | Pre-retrieval | [M4 §9](../04-retrieval-y-query/guia.md#9-query-rewriting-e-intent-detection) |
| Filtros duros (metadata) | ●●●● | ●○○○ | Retrieval | [M4 §7](../04-retrieval-y-query/guia.md#7-filtros-duros-como-guardrail-de-seguridad) |
| Parent-child / small-to-big | ●●●○ | ●●○○ | Indexación | [M4 §6](../04-retrieval-y-query/guia.md#6-parent-child-retrieval) |
| Multi-query / RAG-Fusion | ●●●○ | ●●●○ | Pre-retrieval | — (este doc §1.3) |
| HyDE | ●●●○ | ●●●○ | Pre-retrieval | [glosario — HyDE](./glosario.md#hyde) |
| Step-back prompting | ●●○○ | ●●○○ | Pre-retrieval | — (este doc §1.4) |
| Routing / multi-index | ●●●● | ●●○○ | Pre-retrieval | [M4 §8](../04-retrieval-y-query/guia.md#8-multi-index-routing) |
| Chunking estratégico | ●●●● | ●○○○ | Indexación | [M2 §4](../02-ingesta/guia.md#4-chunking-a-fondo) |
| RAPTOR | ●●●● | ●●●● | Indexación | — (este doc §2.3) |
| Contextual Retrieval (Anthropic) | ●●●● | ●●●● | Indexación | — (este doc §2.4) |
| ColBERT / multi-vector | ●●●● | ●●●● | Indexación | [glosario — ColBERT](./glosario.md#colbert) |
| Sentence-window | ●●●○ | ●●○○ | Indexación | — (este doc §2.6) |
| Propositions / chunking semántico | ●●●○ | ●●●○ | Indexación | — (este doc §2.7) |
| Compresión (LLMLingua) | ●●○○ | ●●○○ | Post-retrieval | — (este doc §3.2) |
| MMR (diversidad) | ●●○○ | ●○○○ | Post-retrieval | — (este doc §3.3) |
| Lost-in-the-middle reorder | ●●○○ | ●○○○ | Post-retrieval | — (este doc §3.4) |
| GraphRAG | ●●●● | ●●●● | Estructural | [M4 §10](../04-retrieval-y-query/guia.md#10-graphrag-y-knowledge-graphs-neo4j) |
| Self-RAG | ●●●● | ●●●● | Agéntico | — (este doc §4.1) |
| CRAG | ●●●● | ●●●● | Agéntico | — (este doc §4.2) |
| Adaptive RAG | ●●●○ | ●●●○ | Agéntico | — (este doc §4.3) |
| Agentic RAG | ●●●● | ●●●○ | Agéntico | [M6 §6](../06-agentes-i/guia.md#6-agentic-rag--el-agente-decide-cuándo-y-qué-recuperar) |
| FLARE / IRCoT | ●●●● | ●●●● | Agéntico | — (este doc §4.5) |
| Text-to-SQL RAG | ●●●● | ●●●○ | Estructural | [M6 §7.2](../06-agentes-i/guia.md#72-agente-sql) |
| Multi-modal RAG | ●●●○ | ●●●● | Estructural | [M10](../10-multimodal/guia.md) |
| Long-context vs RAG | variable | ●●●● | Estructural | — (este doc §5.5) |

**Lectura de la tabla:** empieza por las filas con **C bajo** (filtros duros, chunking, MMR, reorder). Si el síntoma persiste, sube por **G** antes que por **C**.

---

## 1. Pre-retrieval (transformar la query)

La query del usuario rara vez coincide con el vocabulario del corpus. Estas técnicas **transforman, expanden o enrutan** la consulta antes del retriever.

---

### 1.1 Query rewriting / expansion

**Qué problema resuelve:** gap léxico entre lo que escribe el usuario ("baja de plan") y lo que dicen los documentos ("cancelación de servicio"). También mejora recall cuando la query es demasiado corta o ambigua.

**Cómo funciona:**

```
Usuario: "baja de plan"
         ↓
  [query.rewrite]  ← glosario de sinónimos o LLM
         ↓
Retriever: "cancelación de servicio plan móvil"
         ↓
     top-K chunks
```

**Costo / latencia:** bajo con glosario determinista (~0 ms); medio con LLM (+200–800 ms, +100–500 tokens).

**Cuándo usar:** dominios con jerga interna, abreviaciones o sinónimos no capturados por embeddings.

**Cuándo NO usar:** vocabulario usuario ≈ vocabulario documentos (FAQs homogéneas). No reescribas queries que ya contienen identificadores exactos (códigos ATA, artículos legales) — puedes empeorar el match BM25.

**Relación con el curso:** cubierto en [M4 §9](../04-retrieval-y-query/guia.md#9-query-rewriting-e-intent-detection). Nodo RAGorbit: `query.rewrite`. Alternativas avanzadas (HyDE, step-back) se usan cuando el rewriting simple no basta.

---

### 1.2 HyDE (Hypothetical Document Embeddings)

**Qué problema resuelve:** queries cortas o semánticamente distantes del corpus. En lugar de embedear la pregunta, embedeas un **documento hipotético** que la respondería.

**Cómo funciona:**

```
Query: "¿Cuánto cuesta el roaming?"
         ↓
    LLM genera doc hipotético:
    "El roaming internacional tiene un costo de $5/día
     para planes Premium y $10/día para planes básicos..."
         ↓
    embed(doc_hipotético)  →  búsqueda vectorial
         ↓
    chunks reales del corpus
```

**Costo / latencia:** **alto** — 1 llamada LLM extra por query (+300–1000 ms, +200–800 tokens). No aplica a BM25 (solo mejora la rama vectorial).

**Cuándo usar:** recall bajo con embeddings estándar; preguntas vagas; dominios donde la query nunca se parece al texto indexado.

**Cuándo NO usar:** queries con términos exactos (IDs, códigos) — HyDE puede "inventar" vocabulario que no existe en el corpus y empeorar el ranking. Latencia crítica (< 500 ms). Empieza con rewriting + híbrido antes de HyDE.

**Relación con el curso:** definido en [glosario — HyDE](./glosario.md#hyde). Alternativa avanzada a `query.rewrite`. Implementaciones: LangChain `HypotheticalDocumentEmbedder`, LlamaIndex HyDE retriever.

---

### 1.3 Multi-query / RAG-Fusion

**Qué problema resuelve:** una sola formulación de la query puede perder chunks relevantes formulados con vocabulario distinto. Genera **varias perspectivas** de la misma pregunta y fusiona resultados.

**Cómo funciona:**

```
Query original: "política de devoluciones"
         ↓
    LLM genera N variantes:
      q1: "política de devoluciones"
      q2: "reembolso producto defectuoso plazo"
      q3: "derecho de desistimiento compra online"
         ↓
    retrieve(q1) ──┐
    retrieve(q2) ──┼──▶ RRF (o fusión ponderada) ──▶ top-K final
    retrieve(q3) ──┘
```

**RAG-Fusion** (término de mercado, Cormack et al.) es el patrón concreto: multi-query + RRF. LangChain expone `MultiQueryRetriever`; la fusión reutiliza la misma lógica de [M4 §4 — RRF](../04-retrieval-y-query/guia.md#4-búsqueda-híbrida).

**Costo / latencia:** **medio-alto** — N retrievals + 1 LLM para generar variantes. Con N=3: ~3× latencia de retrieval + costo LLM.

**Cuándo usar:** recall bajo pese a híbrido; preguntas abiertas con múltiples formulaciones válidas; dominios donde un mismo concepto aparece con vocabulario muy variado.

**Cuándo NO usar:** queries ya precisas con identificadores exactos. Volumen alto sin presupuesto de tokens. Si el reranker ya corrige el top-K ruidoso, multi-query puede ser redundante.

**Relación con el curso:** extiende RRF de M4 a múltiples queries. Complementa (no reemplaza) `query.rewrite`.

---

### 1.4 Step-back prompting

**Qué problema resuelve:** preguntas que requieren **contexto de alto nivel** antes del detalle. Ejemplo: "¿Cuál es la penalidad del artículo 7?" necesita primero entender el marco general del contrato.

**Cómo funciona:**

```
Query específica: "penalidad cláusula 7.3 contrato arrendamiento"
         ↓
    LLM genera pregunta "step-back":
    "¿Cuáles son las cláusulas generales de penalidad
     en contratos de arrendamiento?"
         ↓
    retrieve(pregunta_step_back)  →  contexto general
    retrieve(pregunta_original)   →  contexto específico
         ↓
    combinar ambos contextos → LLM
```

**Costo / latencia:** medio — 1 LLM + 2 retrievals por query.

**Cuándo usar:** dominios técnicos o legales con jerarquía conceptual; preguntas que fallan por falta de contexto de fondo.

**Cuándo NO usar:** FAQs directas, lookup de identificadores, chat de baja latencia. Overhead innecesario si parent-child o chunking por sección ya aportan contexto suficiente.

**Relación con el curso:** alternativa avanzada listada en [`query.rewrite`](./catalogo-nodos.md#queryrewrite). Complementa parent-child (M4 §6): step-back aporta contexto conceptual; parent-child aporta contexto textual expandido.

---

### 1.5 Routing

**Qué problema resuelve:** ruido cross-categoría — una query de "política de maletas" no debe recuperar chunks de "procedimiento de escalación interna".

**Cómo funciona:**

```
Query: "¿Cuál es la política de equipaje de mano?"
         ↓
  [intent / router]  →  índice: "policy"
         ↓
  retrieval.vector(store=policy_index)
         ↓
     top-K filtrados
```

Con agente (Agentic RAG):

```
Agente elige tool:
  policy_rag    → políticas
  procedure_rag → procedimientos
  faq_rag       → preguntas frecuentes
```

**Costo / latencia:** bajo con clasificador de embeddings (~5–10 ms); medio si el router es un LLM.

**Cuándo usar:** múltiples bases de conocimiento con categorías claras (telecom, legal, manufactura). Siempre que mezclar índices degrade precisión.

**Cuándo NO usar:** corpus único y homogéneo. Routing incorrecto es peor que no routear — valida con evaluación antes de producción.

**Relación con el curso:** [M4 §8 — Multi-index routing](../04-retrieval-y-query/guia.md#8-multi-index-routing), [M6 §6.3 — Routing de queries](../06-agentes-i/guia.md#63-routing-de-queries). Nodos: `retrieval.router`, `store.multi-index`, `query.intent`, `tool.retriever`.

---

## 2. Indexación / representación

La calidad del retrieval depende de **cómo fragmentas y representas** el corpus. Estas técnicas actúan en la fase de ingesta (M2) o en el esquema del índice.

---

### 2.1 Chunking estratégico

**Qué problema resuelve:** chunks mal delimitados contaminan toda la cadena — embeddings imprecisos, contexto mezclado, respuestas que fusionan cláusulas distintas.

**Cómo funciona:**

```
Documento completo
         ↓
  Estrategia según estructura:
    fixed / recursive  →  texto genérico
    by-section         →  manuales, normativa
    by-clause          →  contratos legales
    by-row             →  tablas / CSV
         ↓
  chunks[] + metadata
```

**Costo / latencia:** bajo en ingesta (batch). El costo es de **diseño**, no de runtime por query.

**Cuándo usar:** siempre. Es la intervención con mejor relación calidad/esfuerzo antes de cualquier truco de retrieval.

**Cuándo NO usar:** no hay "no usar" — solo elegir la estrategia incorrecta. Documentos < 500 tokens pueden indexarse enteros.

**Relación con el curso:** [M2 §4 — Chunking a fondo](../02-ingesta/guia.md#4-chunking-a-fondo). Nodo: `ingest.chunker`. Muchos fallos atribuidos a "mal retrieval" son en realidad mal chunking.

---

### 2.2 Parent-child / small-to-big

**Qué problema resuelve:** trade-off precisión vs contexto — chunks pequeños recuperan bien pero el LLM no tiene suficiente contexto; chunks grandes recuperan mal.

**Cómo funciona:**

```
Ingesta:
  Padre (2000 tokens) ──contiene──▶ Hijo₁ (300 tokens)
                                  ──▶ Hijo₂ (300 tokens)
                                  ──▶ Hijo₃ (300 tokens)

Query:
  buscar en hijos (precisión)  →  match en Hijo₂
         ↓
  devolver PADRE de Hijo₂ al LLM (contexto)
```

**Costo / latencia:** bajo en query (+ lookup de padre). Medio en ingesta (generar jerarquía).

**Cuándo usar:** documentos con secciones coherentes demasiado largas para un solo chunk; manuales, contratos, políticas extensas.

**Cuándo NO usar:** chunking estándar ya da buen contexto. Añade complejidad de ingesta sin beneficio medible.

**Relación con el curso:** [M4 §6](../04-retrieval-y-query/guia.md#6-parent-child-retrieval). Nodo: `retrieval.parent-child`. Variante de mercado: **small-to-big** (LlamaIndex `ParentDocumentRetriever`).

---

### 2.3 RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)

**Qué problema resuelve:** preguntas que requieren **síntesis transversal** de múltiples secciones o documentos — "resume los temas principales del informe anual" o "¿cuáles son las tendencias comunes en estos 50 informes?".

**Cómo funciona:**

```
Capa 0:  chunks originales  [c1][c2][c3][c4][c5][c6]
              ↓ cluster + resumir
Capa 1:  resúmenes          [s1: c1+c2]  [s2: c3+c4]  [s3: c5+c6]
              ↓ cluster + resumir
Capa 2:  resumen global     [S: s1+s2+s3]

Indexar TODAS las capas (chunks + resúmenes).
Query puede matchear un chunk específico O un resumen de alto nivel.
```

**Costo / latencia:** **muy alto en ingesta** — múltiples llamadas LLM para clustering y resumen (offline). Query: similar a retrieval estándar. Mantenimiento costoso si el corpus cambia frecuentemente.

**Cuándo usar:** corpus grande con preguntas de alto nivel, agregación o síntesis multi-documento. Informes, investigación, knowledge bases extensas.

**Cuándo NO usar:** lookup puntual de identificadores. Corpus pequeño (< 100 docs). Actualización frecuente del corpus. Empieza con chunking + híbrido; RAPTOR es un salto grande.

**Relación con el curso:** extiende M2 (ingesta) y M4 (retrieval). No tiene nodo RAGorbit dedicado — se implementa como pipeline custom o con LlamaIndex `TreeIndex`. Complementa GraphRAG: RAPTOR resume jerárquicamente; GraphRAG modela relaciones explícitas.

---

### 2.4 Contextual Retrieval (Anthropic)

**Qué problema resuelve:** chunks aislados pierden contexto — "La tarifa es de $50" no dice de qué tarifa se trata. Mejora recall en BM25 y en embeddings.

**Cómo funciona:**

```
Chunk original:
  "La penalidad es del 20% del valor del boleto."

Contextual Retrieval (offline, por cada chunk):
  LLM genera contexto prepend:
  "Este fragmento proviene de la política de cambios de vuelo
   internacional de la aerolínea X, sección penalidades."

Chunk indexado:
  "[contexto generado] La penalidad es del 20%..."
         ↓
  embed + BM25 sobre el chunk enriquecido
```

**Costo / latencia:** **muy alto en ingesta** — 1 llamada LLM por chunk (batch offline). Anthropic reporta ~49% menos retrieval fallido vs baseline. Query sin overhead extra.

**Cuándo usar:** corpus donde chunks frecuentemente carecen de contexto autónomo; mejora simultánea de BM25 y vectorial; presupuesto de ingesta batch.

**Cuándo NO usar:** chunks ya autocontenidos (FAQs con pregunta+respuesta). Corpus que se actualiza diariamente. Si parent-child o metadata rica ya resuelven el contexto, evalúa primero.

**Relación con el curso:** alternativa de indexación avanzada a parent-child. Se combina con híbrido (M4 §4). Publicado por Anthropic (2024); implementable con cualquier LLM en ingesta batch.

---

### 2.5 Multi-vector / ColBERT (late interaction)

**Qué problema resuelve:** embeddings de documento completo (single-vector) pierden matices — un chunk largo tiene un solo vector que promedia todo. ColBERT mantiene **un vector por token** e interactúa con la query token a token en tiempo de búsqueda.

**Cómo funciona:**

```
Indexación (offline):
  Doc: "penalidad cambio vuelo internacional"
       ↓ ColBERT encoder
  [v_pen][v_al][v_cambio][v_vuelo][v_inter]...  ← un vector/token

Query (online):
  "¿Cuánto cuesta cambiar mi vuelo?"
       ↓
  [v_cuánto][v_cuesta][v_cambiar][v_vuelo]...
       ↓
  Late interaction: score = Σ max_sim(q_token, d_token)
       ↓
  ranking fino sin cross-encoder completo
```

**Costo / latencia:** **alto en almacenamiento** (N vectores por documento vs 1). Query: 20–80 ms (entre BM25 y cross-encoder). Entre single-vector y cross-encoder en calidad.

**Cuándo usar:** corpus grande donde cross-encoder puro es demasiado lento pero single-vector pierde precisión. Reranking a escala.

**Cuándo NO usar:** corpus pequeño (cross-encoder es mejor y más simple). Sin infraestructura para multi-vector (RAGatouille, Vespa, especializado). Empieza con reranker cross-encoder (M4 §5).

**Relación con el curso:** definido en [glosario — ColBERT](./glosario.md#colbert), [tecnologias-comparadas §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers). Alternativa a `retrieval.reranker` para escala.

---

### 2.6 Sentence-window

**Qué problema resuelve:** chunks pequeños para precisión pero el LLM necesita oraciones circundantes para entender el fragmento recuperado.

**Cómo funciona:**

```
Ingesta:
  Indexar oración individual (unidad pequeña)
  Guardar "ventana" de ±N oraciones en metadata

Query:
  retrieve(oración)  →  match preciso
         ↓
  expandir con ventana de metadata  →  ±5 oraciones al LLM
```

Variante de **small-to-big** a nivel de oración. LlamaIndex: `SentenceWindowNodeParser`.

**Costo / latencia:** bajo en query. Medio en ingesta (parsear oraciones + metadata).

**Cuándo usar:** prosa narrativa, artículos, documentación donde el contexto inmediato basta (no hace falta un padre de 2000 tokens).

**Cuándo NO usar:** documentos estructurados por sección/cláusula — usa parent-child. Tablas o listas donde las oraciones no son unidades semánticas.

**Relación con el curso:** complemento de M2 chunking y M4 parent-child. Más simple que parent-child cuando la ventana local es suficiente.

---

### 2.7 Propositions / chunking semántico

**Qué problema resuelve:** chunks por tamaño fijo parten unidades de significado — una cláusula legal a medias, una definición separada de su término.

**Cómo funciona:**

```
Documento
         ↓
  LLM descompone en proposiciones atómicas:
    p1: "El arrendatario debe pagar renta mensual."
    p2: "La renta vence el día 1 de cada mes."
    p3: "El incumplimiento genera interés del 2% mensual."
         ↓
  indexar cada proposición como chunk
```

**Dense X Retrieval** (Chen et al.) es la referencia académica del enfoque por proposiciones. **Semantic chunking** (LlamaIndex `SemanticSplitterNodeParser`) usa embeddings para detectar límites donde cambia el tema.

**Costo / latencia:** medio-alto en ingesta (LLM o embeddings extra). Query estándar.

**Cuándo usar:** corpus denso en hechos atómicos (legal, compliance, médico). Preguntas que apuntan a afirmaciones concretas.

**Cuándo NO usar:** documentos narrativos donde el flujo importa. Costo de ingesta prohibitivo en corpus masivos sin ganancia medida.

**Relación con el curso:** extiende [M2 §4](../02-ingesta/guia.md#4-chunking-a-fondo) con estrategias `by-clause` y semantic splitting ya mencionadas en [`ingest.chunker`](./catalogo-nodos.md#ingestchunker).

---

## 3. Post-retrieval

Una vez recuperados los top-K, estas técnicas **refinan, comprimen y reordenan** el contexto antes de enviarlo al LLM (M5).

---

### 3.1 Reranking cross-encoder

**Qué problema resuelve:** el retriever devuelve top-K ruidoso — chunks relevantes en posiciones 4–10 que el LLM ignoraría.

**Cómo funciona:**

```
Retriever → top-20 (rápido, ruidoso)
         ↓
Cross-encoder → score(query, chunk) para cada par
         ↓
top-3 precisos → LLM
```

**Costo / latencia:** +50–150 ms (modelo local) o +100–300 ms (API). Evalúa N pares query-chunk.

**Cuándo usar:** casi siempre en dominios críticos (legal, médico, banca) tras confirmar que retrieval base funciona.

**Cuándo NO usar:** latencia < 500 ms estricta sin GPU; filtros duros ya dan top-K limpio.

**Relación con el curso:** [M4 §5](../04-retrieval-y-query/guia.md#5-reranking-con-cross-encoder), [tecnologias-comparadas §6](./tecnologias-comparadas.md#rerankers). Nodo: `retrieval.reranker`.

---

### 3.2 Compresión contextual / LLMLingua

**Qué problema resuelve:** top-K recuperado excede la ventana del LLM o diluye la atención con tokens redundantes.

**Cómo funciona:**

```
top-10 chunks (8000 tokens total)
         ↓
  LLMLingua / LongLLMLingua:
  eliminar tokens de baja perplexity (redundantes)
         ↓
  contexto comprimido (2000 tokens, ~75% reducción)
         ↓
  LLM genera respuesta
```

**LLMLingua** (Microsoft, 2023) usa un modelo pequeño para calcular perplexity token a token y podar lo predecible. **LLMLingua-2** mejora preservando información clave.

**Costo / latencia:** bajo-medio (+20–100 ms con modelo pequeño local). Mucho menor que enviar 8000 tokens al LLM principal.

**Cuándo usar:** muchos chunks recuperados; ventana de contexto limitada; costo por token del LLM generador alto.

**Cuándo NO usar:** pocos chunks ya compactos. Riesgo de eliminar detalles críticos (cifras, negaciones) — evalúa faithfulness con RAGAS. No sustituye un buen reranker.

**Relación con el curso:** post-procesamiento antes de [M5 — logic.prompt](../05-generacion-y-logic/guia.md). Complementa parent-child (devuelve mucho contexto).

---

### 3.3 De-duplicación y diversidad (MMR)

**Qué problema resuelve:** top-K con chunks casi idénticos que desperdician slots de contexto y sesgan la respuesta hacia un solo aspecto.

**Cómo funciona:**

```
Retriever → [c1, c2, c3, c4, c5]  (c2 ≈ c1, c4 ≈ c3)

MMR (Maximal Marginal Relevance):
  seleccionar c1 (más relevante)
  seleccionar c3 (relevante Y diferente de c1)
  seleccionar c5 (relevante Y diferente de c1, c3)
         ↓
  [c1, c3, c5] → LLM
```

Fórmula: `MMR = argmax [ λ·Sim(d,Q) − (1−λ)·max Sim(d, d_seleccionado) ]`

**Costo / latencia:** muy bajo (~1–5 ms). Solo aritmética sobre vectores ya calculados.

**Cuándo usar:** chunks con overlap alto; corpus con muchas repeticiones (FAQs duplicadas, versiones de la misma política).

**Cuándo NO usar:** cuando necesitas todos los chunks similares (ej. comparar versiones de una cláusula). λ=1 degenera en ranking puro por relevancia.

**Relación con el curso:** no cubierto en módulos; aplica tras cualquier retriever de M4. LangChain: `MaxMarginalRelevanceExampleSelector`; muchos vector stores exponen `mmr` como parámetro de búsqueda.

---

### 3.4 Reordenamiento por posición (lost-in-the-middle)

**Qué problema resuelve:** los LLMs prestan más atención al **inicio y final** del contexto que al centro ("lost in the middle", Liu et al. 2023). Chunks relevantes en posición 3–4 de 5 se ignoran.

**Cómo funciona:**

```
Reranker devuelve por score: [c1, c2, c3, c4, c5]
  (c4 y c5 son los más relevantes pero quedaron al final)

Reordenamiento:
  posición 1: c4  (más relevante → inicio)
  posición 2: c2
  posición 3: c5  (segundo más relevante → final)
  posición 4: c1
  posición 5: c3
         ↓
  "Interleave": mejor al inicio y al final, peor en el centro
```

**Costo / latencia:** despreciable (reordenar lista en memoria).

**Cuándo usar:** siempre que envíes > 3 chunks al LLM. Gratis y consistente. Especialmente útil si no tienes reranker.

**Cuándo NO usar:** no hay contraindicación real — es costo cero. Solo aplica si ya tienes ranking por relevancia.

**Relación con el curso:** complemento de M4 reranker y M5 generación. Implementable en el nodo `logic.prompt` o como post-proceso del retriever.

---

## 4. RAG con auto-corrección / agéntico

Estas arquitecturas añaden **bucles de reflexión, evaluación y corrección** — el sistema detecta retrieval insuficiente o respuestas mal ancladas y actúa.

---

### 4.1 Self-RAG (Self-Reflective RAG)

**Qué problema resuelve:** RAG que recupera siempre y genera siempre, incluso cuando no hace falta o cuando los chunks no apoyan la respuesta. Añade **autocrítica** mediante tokens especiales de reflexión.

**Cómo funciona:**

```
Query
  ↓
¿Recuperar?  ──no──▶ generar sin contexto
  │ sí
  ↓
Retrieve top-K
  ↓
Para cada chunk: ¿Es relevante? [Relevante / No relevante]
  ↓
Generar respuesta
  ↓
¿Respuesta apoyada por chunks? [Totalmente / Parcialmente / No]
  ↓
¿Respuesta útil? [Sí / No]
  ↓
Si insuficiente → recuperar de nuevo o abstenerse
```

Self-RAG (Asai et al., 2023) entrena (o promptea) el LLM para emitir tokens de crítica `[Retrieve]`, `[IsRel]`, `[IsSup]`, `[IsUse]` como parte de la generación.

**Costo / latencia:** **muy alto** — múltiples pasos de generación por query. 2–5× tokens vs RAG estándar.

**Cuándo usar:** dominios de alta stakes donde abstenerse es mejor que alucinar; faithfulness crítico; presupuesto de latencia flexible.

**Cuándo NO usar:** chat en tiempo real (< 2 s). Volumen masivo. Si no puedes evaluar si la autocrítica funciona, añades costo sin beneficio. Empieza con `logic.citations` + evaluación RAGAS (M5).

**Relación con el curso:** evolución agéntica post-M5/M6. Complementa [Agentic RAG](../06-agentes-i/guia.md#6-agentic-rag--el-agente-decide-cuándo-y-qué-recuperar) con reflexión explícita.

---

### 4.2 CRAG (Corrective RAG)

**Qué problema resuelve:** retrieval que devuelve chunks irrelevantes o insuficientes y el LLM alucina igualmente. Añade un **evaluador de calidad** y fuentes de respaldo.

**Cómo funciona:**

```
Query → Retrieve top-K
         ↓
  [Evaluador de retrieval]
    ├── Correcto    → generar con chunks
    ├── Ambiguo     → filtrar chunks + web search auxiliar
    └── Incorrecto  → descartar chunks → web search / otra fuente
         ↓
  Generar respuesta con contexto corregido
```

CRAG (Yan et al., 2024) usa un lightweight evaluator (retriever score + clasificador) para decidir la acción correctiva.

**Costo / latencia:** alto — evaluador + posible búsqueda web + generación. Depende de la fuente de respaldo.

**Cuándo usar:** corpus incompleto o desactualizado; necesidad de complementar con web; retrieval frecuentemente insuficiente medido en evaluación.

**Cuándo NO usar:** corpus cerrado y completo (legal interno, manuales técnicos). Sin fuente de respaldo confiable. Web search introduce riesgo de fuentes no autorizadas.

**Relación con el curso:** extiende M6 con `tool.http` o search tool como respaldo. Complementa filtros duros (M4 §7).

---

### 4.3 Adaptive RAG

**Qué problema resuelve:** no todas las queries necesitan retrieval — algunas son conversacionales, otras requieren RAG, otras requieren razonamiento multi-hop. Evita retrieval innecesario.

**Cómo funciona:**

```
Query
  ↓
[Clasificador de complejidad]
  ├── Sin retrieval    → LLM directo ("hola", "gracias")
  ├── Single-step RAG  → retrieve + generate
  └── Multi-step       → agente con múltiples retrievals
         ↓
  Ejecutar estrategia seleccionada
```

Adaptive RAG (Jeong et al., 2024) enruta a la estrategia según tipo de query.

**Costo / latencia:** variable — ahorra costo en queries simples; invierte más en complejas. Clasificador: bajo costo (~1 LLM call o clasificador fine-tuned).

**Cuándo usar:** mezcla de queries conversacionales y de conocimiento; optimizar costo en producción; complemento natural de `query.intent` (M4 §9).

**Cuándo NO usar:** 100% queries de conocimiento (overhead del clasificador sin beneficio). Si Agentic RAG (M6) ya cubre la decisión dinámica, Adaptive RAG puede ser redundante.

**Relación con el curso:** puente entre M4 `query.intent` y M6 Agentic RAG. Nodo relacionado: `model.intent`.

---

### 4.4 Agentic RAG

**Qué problema resuelve:** pipeline RAG fijo que siempre recupera con la query cruda del usuario, sin adaptarse a contexto previo ni decidir si hace falta retrieval.

**Cómo funciona:**

```
Entrada → Agente (ReAct)
            │
            ├─ ¿Necesito RAG? ──no──▶ responder directo
            │        │
            │       sí
            │        ↓
            ├─ tool.retriever(query="...", filters={...})
            │        ↓
            ├─ ¿Suficiente? ──no──▶ otra tool / otro índice
            │        │
            │       sí
            │        ↓
            └─ generar respuesta anclada
```

**Costo / latencia:** medio-alto — depende de cuántas tools invoque el agente. Variable por query.

**Cuándo usar:** consultas transaccionales (reserva + política); routing multi-índice; query óptima depende de pasos anteriores.

**Cuándo NO usar:** Q&A simple homogéneo donde pipeline fijo basta. Sin observabilidad de las decisiones del agente.

**Relación con el curso:** [M6 §6](../06-agentes-i/guia.md#6-agentic-rag--el-agente-decide-cuándo-y-qué-recuperar). Nodo: `tool.retriever`. Template 07 (telecom copilot).

---

### 4.5 Iterative / Recursive retrieval (FLARE, IRCoT)

**Qué problema resuelve:** preguntas **multi-hop** que requieren encadenar hallazgos — "¿Quién fue el CEO cuando se firmó el contrato del producto X?" necesita primero identificar el producto, luego la fecha, luego el CEO.

**Cómo funciona — FLARE (Forward-Looking Active REtrieval):**

```
Query → LLM genera borrador parcial
         ↓
  ¿Próxima oración necesita evidencia? (baja confianza)
         ↓ sí
  Retrieve con query derivada del borrador
         ↓
  Regenerar con nuevo contexto
         ↓
  Repetir hasta respuesta completa
```

**Cómo funciona — IRCoT (Interleaved Retrieval with Chain-of-Thought):**

```
Query
  ↓
CoT paso 1: "Necesito encontrar el contrato del producto X"
  → Retrieve("contrato producto X") → evidencia
  ↓
CoT paso 2: "El contrato se firmó en 2019. ¿Quién era CEO en 2019?"
  → Retrieve("CEO empresa 2019") → evidencia
  ↓
Respuesta final fundamentada
```

**Costo / latencia:** **muy alto** — 3–10 retrievals + generaciones por query.

**Cuándo usar:** queries multi-hop medidas en evaluación; investigación; Q&A sobre knowledge bases con relaciones encadenadas.

**Cuándo NO usar:** lookup directo. Latencia estricta. GraphRAG (M4 §10) puede resolver multi-hop en una sola query si el grafo está bien modelado — evalúa cuál encaja mejor.

**Relación con el curso:** máxima expresión de M6 agentes. FLARE e IRCoT son patrones implementables con `agent.react` + `tool.retriever`. Complementan GraphRAG para multi-hop.

---

## 5. RAG estructural

Arquitecturas que cambian la **forma del índice o la fuente de datos**, no solo el pipeline de query.

---

### 5.1 GraphRAG

**Qué problema resuelve:** preguntas sobre **relaciones** entre entidades — "¿Qué contratos están vinculados al proveedor X?" — donde búsqueda vectorial plana falla.

**Cómo funciona:**

```
Ingesta:
  Documentos → LLM extrae entidades + relaciones
         ↓
  Knowledge Graph: (Proveedor X)-[:TIENE]->(Contrato A)
                   (Contrato A)-[:INCLUYE]->(Cláusula 7)

Query:
  "contratos de Proveedor X" → nodo Proveedor X
         ↓
  traversar grafo 1-2 hops → chunks + vecinos
         ↓
  LLM con contexto estructural
```

**Costo / latencia:** **muy alto en ingesta** (extracción de entidades). Query: medio-alto (graph traversal + vector). Microsoft GraphRAG añade detección de comunidades y resúmenes de clusters.

**Cuándo usar:** relaciones explícitas entre entidades; multi-hop estructural; template 05 (legal).

**Cuándo NO usar:** corpus sin relaciones claras. Overhead vs vector store simple. Empieza con metadata + filtros duros.

**Relación con el curso:** [M4 §10](../04-retrieval-y-query/guia.md#10-graphrag-y-knowledge-graphs-neo4j). Nodos: `store.neo4j`, `retrieval.graph`.

---

### 5.2 Hybrid search

**Qué problema resuelve:** embeddings pierden términos exactos; BM25 pierde semántica. La combinación cubre ambos modos de fallo.

**Cómo funciona:**

```
Query ──┬──▶ Vector search ──▶ lista A
        └──▶ BM25 search   ──▶ lista B
                    ↓
              RRF (o alpha blend)
                    ↓
              top-K fusionado
```

**Costo / latencia:** medio — dos búsquedas + fusión. Estándar de facto en producción.

**Cuándo usar:** caso general en dominios técnicos. Primera mejora después de vector puro.

**Cuándo NO usar:** corpus puramente conversacional sin términos técnicos (vector solo puede bastar).

**Relación con el curso:** [M4 §3–4](../04-retrieval-y-query/guia.md#3-búsqueda-por-keyword-bm25). Nodo: `retrieval.hybrid`. [tecnologias-comparadas §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers).

---

### 5.3 Multi-index / multi-modal RAG

**Qué problema resuelve:** conocimiento repartido en índices distintos (policy vs procedure vs FAQ) o modalidades distintas (texto vs imágenes vs tablas).

**Cómo funciona:**

```
Query / Documento
         ↓
  ┌──────┴──────┐
  ▼             ▼
Índice texto   Índice imágenes
(policy)       (diagramas)
  │             │
  └──────┬──────┘
         ↓
  Agente o router decide índice(s)
         ↓
  Contexto multimodal → LLM
```

**Costo / latencia:** alto — múltiples índices que mantener; modelos de visión para ingesta multimodal.

**Cuándo usar:** template 07 (multi-index telecom); template 08 (manuales con diagramas); cualquier KB con categorías o modalidades separadas.

**Cuándo NO usar:** corpus único de texto plano.

**Relación con el curso:** multi-index en [M4 §8](../04-retrieval-y-query/guia.md#8-multi-index-routing); multimodal en [M10](../10-multimodal/guia.md). Nodos: `store.multi-index`, `loader.multimodal`, `model.vision`.

---

### 5.4 SQL / Text-to-SQL RAG

**Qué problema resuelve:** parte del conocimiento vive en **bases de datos relacionales** (ventas, inventario, reservas) — no en documentos indexables.

**Cómo funciona:**

```
Query: "¿Cuántos clientes compraron más de $1000 en junio?"
         ↓
  LLM genera SQL:
  SELECT COUNT(DISTINCT customer_id) FROM sales
  WHERE amount > 1000 AND month = '2024-06'
         ↓
  Ejecutar contra BD → resultados tabulares
         ↓
  LLM interpreta resultados → respuesta natural
```

Variantes: **RAG sobre esquema** (embedder tablas/columnas + retrieve schema relevante antes de generar SQL), **Semantic Layer** (métricas predefinidas), agente SQL con herramientas.

**Costo / latencia:** medio — 1–2 LLM calls + query SQL. Riesgo de SQL incorrecto.

**Cuándo usar:** datos estructurados con preguntas analíticas; el corpus documental no contiene las cifras.

**Cuándo NO usar:** preguntas sobre políticas o procedimientos (documentos). Sin gobernanza SQL (riesgo de injection / datos sensibles).

**Relación con el curso:** [M6 §7.2 — Agente SQL](../06-agentes-i/guia.md#72-agente-sql). Complementa RAG documental — no lo reemplaza. En RAGorbit: `tool.function` o agente con acceso a BD.

---

### 5.5 Long-context vs RAG

**Qué problema resuelve:** la tentación de "meter todo el corpus en la ventana del LLM" vs retrieval selectivo. No es una técnica sino una **decisión arquitectónica**.

**Cómo funciona — comparación:**

```
RAG:
  Corpus (1M tokens) → indexar → retrieve top-5 (2K tokens) → LLM

Long-context:
  Corpus (50K tokens) → meter todo → LLM (ventana 128K–1M)
```

**Costo / latencia:**

| Enfoque | Costo por query | Latencia | Escala corpus |
|---------|-----------------|----------|---------------|
| RAG | Bajo (2K tokens input) | +retrieval (~100 ms) | Millones de docs |
| Long-context | Alto (50K+ tokens input) | Sin retrieval | Limitado a ventana |
| **Híbrido** | Medio | Medio | Retrieve + rellenar ventana |

**Cuándo usar long-context:** corpus pequeño que cabe en ventana (< 50K tokens); necesidad de referencias cruzadas densas; prototipo rápido.

**Cuándo usar RAG:** corpus grande; corpus que cambia frecuentemente; necesidad de citar fuentes exactas; costo por token importa.

**Cuándo NO usar long-context como sustituto de RAG:** corpus > ventana; "lost in the middle" empeora con contexto muy largo (Liu et al. 2023); costo insostenible.

**Relación con el curso:** M3 (RAG) vs decisión de diseño. Compresión (§3.2) y reorder (§3.4) mitigan limitaciones cuando mezclas ambos enfoques. Evalúa con RAGAS context precision antes de elegir.

---

## 6. Tabla de decisión maestra

Usa esta tabla para ir del **síntoma** a la **estrategia**. Regla: aplica la intervención más simple primero; mide; escala solo si el síntoma persiste.

| Síntoma | Diagnóstico probable | Empieza por (simple) | Si persiste, añade |
|---------|---------------------|----------------------|-------------------|
| **Baja precisión** (chunks irrelevantes en top-K) | Ranking débil o ruido cross-categoría | Filtros duros + metadata (M4 §7) | Reranker (M4 §5) → routing (M4 §8) |
| **Baja precisión** (chunks relevantes pero mal usados) | Lost-in-the-middle o contexto pobre | Reorder por posición (§3.4) | Parent-child (M4 §6) → Contextual Retrieval (§2.4) |
| **Baja recall** (el chunk correcto no aparece) | Gap léxico o chunking malo | Chunking estratégico (M2) + híbrido (M4 §4) | Query rewrite (M4 §9) → multi-query (§1.3) → HyDE (§1.2) |
| **Alucina** pese a buen retrieval | Generación no anclada | `logic.citations` (M5) + temperatura baja | Self-RAG (§4.1) → evaluación RAGAS faithfulness |
| **Alucina** con retrieval pobre | Chunks insuficientes o irrelevantes | Reranker + filtros | CRAG (§4.2) con fuente de respaldo |
| **Falla en términos exactos** (códigos, IDs) | Embeddings no capturan exact match | BM25 + híbrido (M4 §3–4) | ↑ peso BM25 (alpha ↓) → metadata con IDs |
| **Queries multi-hop** | Una sola retrieval no encadena | GraphRAG (M4 §10) | IRCoT / FLARE (§4.5) → Agentic RAG (M6 §6) |
| **Dominio con relaciones** (entidades, contratos) | Vector plano no modela estructura | Metadata + filtros | GraphRAG (§5.1) |
| **Corpus desactualizado** | Documentos incompletos | Pipeline de re-indexación | CRAG con web search (§4.2) |
| **Latencia > SLA** | Demasiados pasos | Eliminar HyDE/multi-query; top-K ↓ | FlashRank / ColBERT (§2.5) en vez de cross-encoder |
| **Costo por query alto** | Retrieval innecesario | `query.intent` (M4 §9) | Adaptive RAG (§4.3) → Agentic RAG (M6 §6) |
| **Contexto excede ventana** | top-K demasiado grande | ↓ top-K + reranker | Compresión LLMLingua (§3.2) |
| **Respuestas redundantes** | Chunks duplicados en contexto | MMR (§3.3) | De-duplicación en ingesta |
| **Preguntas analíticas** (cifras, agregaciones) | Datos en BD, no en docs | Text-to-SQL (§5.4) | Agente SQL (M6 §7.2) |
| **Diagramas / imágenes** | Texto solo no indexa lo visual | `model.vision` en ingesta (M10) | Multi-modal RAG (§5.3) |
| **Preguntas de síntesis global** | Chunks locales no alcanzan | RAPTOR (§2.3) | GraphRAG con community summaries (§5.1) |

### Flujo de escalada recomendado

```
Nivel 0: Naive RAG (M3)
    ↓ si falla
Nivel 1: Chunking (M2) + Híbrido + Filtros (M4)
    ↓ si falla
Nivel 2: Reranker + Parent-child + Query rewrite (M4)
    ↓ si falla
Nivel 3: Pre-retrieval avanzado (HyDE, multi-query) + Post (MMR, compresión)
    ↓ si falla
Nivel 4: Indexación avanzada (RAPTOR, Contextual Retrieval, ColBERT)
    ↓ si falla
Nivel 5: Estructural (GraphRAG, Text-to-SQL, Multi-modal)
    ↓ si falla
Nivel 6: Agéntico (Agentic RAG, Self-RAG, CRAG, FLARE/IRCoT)
```

En cada nivel: **mide con RAGAS** (faithfulness, context precision/recall) antes de subir. La complejidad tiene costo de mantenimiento — no saltes niveles sin evidencia.

---

> **Cross-links**
>
> | Módulo | Contenido relacionado |
> |--------|----------------------|
> | [M2 — Ingesta](../02-ingesta/guia.md) | Chunking estratégico, metadata, loaders |
> | [M4 — Retrieval y query](../04-retrieval-y-query/guia.md) | Denso, BM25, híbrido, RRF, rerank, parent-child, filtros, routing, GraphRAG, query rewrite |
> | [M5 — Generación y lógica](../05-generacion-y-logic/guia.md) | Prompt, citas, salida estructurada, evaluación RAGAS |
> | [M6 — Agentes I](../06-agentes-i/guia.md) | Agentic RAG (§6), tool.retriever, agente SQL |
> | [M10 — Multimodal](../10-multimodal/guia.md) | RAG sobre imágenes, diagramas, tablas |
>
> | Referencia | Contenido |
> |------------|-----------|
> | [tecnologias-comparadas.md §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers) | BM25 vs vector vs híbrido vs GraphRAG; rerankers |
> | [catalogo-nodos.md](./catalogo-nodos.md) | Nodos `retrieval.*`, `query.*`, `ingest.*`, `store.*`, `tool.retriever` |
> | [glosario.md](./glosario.md) | HyDE, ColBERT, Agentic RAG, RRF, BM25, embeddings |

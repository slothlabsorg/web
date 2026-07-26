# Overview of RAG strategies and architectures

> **Vendor-neutral** catalog of Retrieval-Augmented Generation (RAG) techniques and architectures known as of 2025/2026. Complements what is already covered in M4 (advanced retrieval) and M6 (Agentic RAG) with the missing strategies. Cross-cutting principle: **start simple** — add complexity only when a measurable symptom justifies it.

**Audience:** Python developers who already master dense + BM25 + hybrid + rerank + parent-child + GraphRAG and want the full market map.

**What we do NOT repeat in depth here** (we link and expand): dense search, BM25, hybrid with RRF, cross-encoder reranking, parent-child, hard filters, multi-index routing, query rewriting, intent detection, and basic GraphRAG → see [M4 — Retrieval and query](../04-retrieval-y-query/guia.md).

---

## Table of contents

1. [Introduction: the RAG spectrum](#introduction-the-rag-spectrum)
2. [Pre-retrieval (transform the query)](#1-pre-retrieval-transform-the-query)
3. [Indexing / representation](#2-indexing--representation)
4. [Post-retrieval](#3-post-retrieval)
5. [Self-correcting / agentic RAG](#4-self-correcting--agentic-rag)
6. [Structural RAG](#5-structural-rag)
7. [Master decision table](#6-master-decision-table)

---

## Introduction: the RAG spectrum

RAG is not a single architecture: it is a **spectrum** of patterns ranging from a fixed two-step pipeline to agentic systems that dynamically decide whether, when, and how to retrieve.

```
                    COMPLEXITY / COST
                           ▲
                           │
     Agentic / Modular RAG │  Self-RAG, CRAG, Adaptive RAG,
     (M6)                  │  FLIR, IRCoT, tool.retriever
                           │
     Advanced RAG (M4)     │  HyDE, RAG-Fusion, RAPTOR,
                           │  Contextual Retrieval, ColBERT,
                           │  compression, MMR, lost-in-the-middle
                           │
     Naive RAG             │  embed → top-K → prompt → LLM
                           │
                           └──────────────────────────────▶ QUALITY
                              (recall, precision, faithfulness)
```

### Three generations (market terminology)

| Generation | Pattern | Key characteristic | Course example |
|------------|---------|-------------------|----------------|
| **Naive RAG** | `query → retrieve → generate` | Fixed pipeline, no optimization | M3 — first working RAG |
| **Advanced RAG** | Pre/post-retrieval + improved indexing | Improves each link in the chain | M4 — hybrid, rerank, parent-child |
| **Modular / Agentic RAG** | Interchangeable components; agent orchestrates | Dynamic retrieval and correction decisions | M6 §6 — `tool.retriever`, Self-RAG, CRAG |

### Summary table: quality gain vs cost/complexity

Orientative scale: **G** = expected quality gain, **C** = cost/complexity (latency, tokens, infrastructure, maintenance).

| Technique | G | C | Phase | Course link |
|-----------|---|---|-------|-------------|
| Hybrid BM25 + vector + RRF | ●●●○ | ●●○○ | Retrieval | [M4 §4](../04-retrieval-y-query/guia.md#4-hybrid-search) |
| Cross-encoder reranking | ●●●● | ●●○○ | Post-retrieval | [M4 §5](../04-retrieval-y-query/guia.md#5-reranking-with-cross-encoder) |
| Query rewriting / expansion | ●●○○ | ●●○○ | Pre-retrieval | [M4 §9](../04-retrieval-y-query/guia.md#9-query-rewriting-and-intent-detection) |
| Hard filters (metadata) | ●●●● | ●○○○ | Retrieval | [M4 §7](../04-retrieval-y-query/guia.md#7-hard-filters-as-a-safety-guardrail) |
| Parent-child / small-to-big | ●●●○ | ●●○○ | Indexing | [M4 §6](../04-retrieval-y-query/guia.md#6-parent-child-retrieval) |
| Multi-query / RAG-Fusion | ●●●○ | ●●●○ | Pre-retrieval | — (this doc §1.3) |
| HyDE | ●●●○ | ●●●○ | Pre-retrieval | [glossary — HyDE](./glosario.md#hyde) |
| Step-back prompting | ●●○○ | ●●○○ | Pre-retrieval | — (this doc §1.4) |
| Routing / multi-index | ●●●● | ●●○○ | Pre-retrieval | [M4 §8](../04-retrieval-y-query/guia.md#8-multi-index-routing) |
| Strategic chunking | ●●●● | ●○○○ | Indexing | [M2 §4](../02-ingesta/guia.md#4-chunking-in-depth) |
| RAPTOR | ●●●● | ●●●● | Indexing | — (this doc §2.3) |
| Contextual Retrieval (Anthropic) | ●●●● | ●●●● | Indexing | — (this doc §2.4) |
| ColBERT / multi-vector | ●●●● | ●●●● | Indexing | [glossary — ColBERT](./glosario.md#colbert) |
| Sentence-window | ●●●○ | ●●○○ | Indexing | — (this doc §2.6) |
| Propositions / semantic chunking | ●●●○ | ●●●○ | Indexing | — (this doc §2.7) |
| Compression (LLMLingua) | ●●○○ | ●●○○ | Post-retrieval | — (this doc §3.2) |
| MMR (diversity) | ●●○○ | ●○○○ | Post-retrieval | — (this doc §3.3) |
| Lost-in-the-middle reorder | ●●○○ | ●○○○ | Post-retrieval | — (this doc §3.4) |
| GraphRAG | ●●●● | ●●●● | Structural | [M4 §10](../04-retrieval-y-query/guia.md#10-graphrag-and-knowledge-graphs-neo4j) |
| Self-RAG | ●●●● | ●●●● | Agentic | — (this doc §4.1) |
| CRAG | ●●●● | ●●●● | Agentic | — (this doc §4.2) |
| Adaptive RAG | ●●●○ | ●●●○ | Agentic | — (this doc §4.3) |
| Agentic RAG | ●●●● | ●●●○ | Agentic | [M6 §6](../06-agentes-i/guia.md#6-agentic-rag--the-agent-decides-when-and-what-to-retrieve) |
| FLARE / IRCoT | ●●●● | ●●●● | Agentic | — (this doc §4.5) |
| Text-to-SQL RAG | ●●●● | ●●●○ | Structural | [M6 §7.2](../06-agentes-i/guia.md#72-sql-agent) |
| Multi-modal RAG | ●●●○ | ●●●● | Structural | [M10](../10-multimodal/guia.md) |
| Long-context vs RAG | variable | ●●●● | Structural | — (this doc §5.5) |

**How to read the table:** start with rows with **low C** (hard filters, chunking, MMR, reorder). If the symptom persists, move up by **G** before **C**.

---

## 1. Pre-retrieval (transform the query)

The user's query rarely matches the corpus vocabulary. These techniques **transform, expand, or route** the query before the retriever.

---

### 1.1 Query rewriting / expansion

**What problem it solves:** lexical gap between what the user writes ("plan downgrade") and what documents say ("service cancellation"). Also improves recall when the query is too short or ambiguous.

**How it works:**

```
User: "plan downgrade"
         ↓
  [query.rewrite]  ← synonym glossary or LLM
         ↓
Retriever: "mobile plan service cancellation"
         ↓
     top-K chunks
```

**Cost / latency:** low with deterministic glossary (~0 ms); medium with LLM (+200–800 ms, +100–500 tokens).

**When to use:** domains with internal jargon, abbreviations, or synonyms not captured by embeddings.

**When NOT to use:** user vocabulary ≈ document vocabulary (homogeneous FAQs). Do not rewrite queries that already contain exact identifiers (ATA codes, legal articles) — you can worsen BM25 match.

**Course connection:** covered in [M4 §9](../04-retrieval-y-query/guia.md#9-query-rewriting-and-intent-detection). RAGorbit node: `query.rewrite`. Advanced alternatives (HyDE, step-back) are used when simple rewriting is not enough.

---

### 1.2 HyDE (Hypothetical Document Embeddings)

**What problem it solves:** short queries or queries semantically distant from the corpus. Instead of embedding the question, you embed a **hypothetical document** that would answer it.

**How it works:**

```
Query: "How much does roaming cost?"
         ↓
    LLM generates hypothetical doc:
    "International roaming costs $5/day
     for Premium plans and $10/day for basic plans..."
         ↓
    embed(hypothetical_doc)  →  vector search
         ↓
    real chunks from the corpus
```

**Cost / latency:** **high** — 1 extra LLM call per query (+300–1000 ms, +200–800 tokens). Does not apply to BM25 (only improves the vector branch).

**When to use:** low recall with standard embeddings; vague questions; domains where the query never resembles indexed text.

**When NOT to use:** queries with exact terms (IDs, codes) — HyDE can "invent" vocabulary that does not exist in the corpus and worsen ranking. Critical latency (< 500 ms). Start with rewriting + hybrid before HyDE.

**Course connection:** defined in [glossary — HyDE](./glosario.md#hyde). Advanced alternative to `query.rewrite`. Implementations: LangChain `HypotheticalDocumentEmbedder`, LlamaIndex HyDE retriever.

---

### 1.3 Multi-query / RAG-Fusion

**What problem it solves:** a single query formulation can miss relevant chunks phrased with different vocabulary. Generates **several perspectives** of the same question and fuses results.

**How it works:**

```
Original query: "return policy"
         ↓
    LLM generates N variants:
      q1: "return policy"
      q2: "defective product refund deadline"
      q3: "right of withdrawal online purchase"
         ↓
    retrieve(q1) ──┐
    retrieve(q2) ──┼──▶ RRF (or weighted fusion) ──▶ final top-K
    retrieve(q3) ──┘
```

**RAG-Fusion** (market term, Cormack et al.) is the concrete pattern: multi-query + RRF. LangChain exposes `MultiQueryRetriever`; fusion reuses the same logic from [M4 §4 — RRF](../04-retrieval-y-query/guia.md#4-hybrid-search).

**Cost / latency:** **medium-high** — N retrievals + 1 LLM to generate variants. With N=3: ~3× retrieval latency + LLM cost.

**When to use:** low recall despite hybrid; open questions with multiple valid formulations; domains where the same concept appears with very varied vocabulary.

**When NOT to use:** queries already precise with exact identifiers. High volume without token budget. If the reranker already fixes noisy top-K, multi-query may be redundant.

**Course connection:** extends M4 RRF to multiple queries. Complements (does not replace) `query.rewrite`.

---

### 1.4 Step-back prompting

**What problem it solves:** questions that require **high-level context** before detail. Example: "What is the penalty for article 7?" needs first understanding the general contract framework.

**How it works:**

```
Specific query: "penalty clause 7.3 lease contract"
         ↓
    LLM generates "step-back" question:
    "What are the general penalty clauses
     in lease contracts?"
         ↓
    retrieve(step_back_question)  →  general context
    retrieve(original_question)   →  specific context
         ↓
    combine both contexts → LLM
```

**Cost / latency:** medium — 1 LLM + 2 retrievals per query.

**When to use:** technical or legal domains with conceptual hierarchy; questions that fail due to lack of background context.

**When NOT to use:** direct FAQs, identifier lookup, low-latency chat. Unnecessary overhead if parent-child or section chunking already provides sufficient context.

**Course connection:** advanced alternative listed in [`query.rewrite`](./catalogo-nodos.md#queryrewrite). Complements parent-child (M4 §6): step-back provides conceptual context; parent-child provides expanded textual context.

---

### 1.5 Routing

**What problem it solves:** cross-category noise — a "baggage policy" query should not retrieve chunks from "internal escalation procedure".

**How it works:**

```
Query: "What is the carry-on baggage policy?"
         ↓
  [intent / router]  →  index: "policy"
         ↓
  retrieval.vector(store=policy_index)
         ↓
     filtered top-K
```

With agent (Agentic RAG):

```
Agent chooses tool:
  policy_rag    → policies
  procedure_rag → procedures
  faq_rag       → frequently asked questions
```

**Cost / latency:** low with embedding classifier (~5–10 ms); medium if the router is an LLM.

**When to use:** multiple knowledge bases with clear categories (telecom, legal, manufacturing). Whenever mixing indexes degrades precision.

**When NOT to use:** single homogeneous corpus. Incorrect routing is worse than no routing — validate with evaluation before production.

**Course connection:** [M4 §8 — Multi-index routing](../04-retrieval-y-query/guia.md#8-multi-index-routing), [M6 §6.3 — Query routing](../06-agentes-i/guia.md#63-query-routing). Nodes: `retrieval.router`, `store.multi-index`, `query.intent`, `tool.retriever`.

---

## 2. Indexing / representation

Retrieval quality depends on **how you fragment and represent** the corpus. These techniques act in the ingestion phase (M2) or in the index schema.

---

### 2.1 Strategic chunking

**What problem it solves:** poorly delimited chunks contaminate the entire chain — imprecise embeddings, mixed context, answers that merge distinct clauses.

**How it works:**

```
Full document
         ↓
  Strategy by structure:
    fixed / recursive  →  generic text
    by-section         →  manuals, regulations
    by-clause          →  legal contracts
    by-row             →  tables / CSV
         ↓
  chunks[] + metadata
```

**Cost / latency:** low at ingestion (batch). The cost is **design**, not runtime per query.

**When to use:** always. It is the intervention with the best quality/effort ratio before any retrieval trick.

**When NOT to use:** there is no "do not use" — only choosing the wrong strategy. Documents < 500 tokens can be indexed whole.

**Course connection:** [M2 §4 — Chunking in depth](../02-ingesta/guia.md#4-chunking-in-depth). Node: `ingest.chunker`. Many failures attributed to "bad retrieval" are actually bad chunking.

---

### 2.2 Parent-child / small-to-big

**What problem it solves:** precision vs context trade-off — small chunks retrieve well but the LLM lacks sufficient context; large chunks retrieve poorly.

**How it works:**

```
Ingestion:
  Parent (2000 tokens) ──contains──▶ Child₁ (300 tokens)
                                  ──▶ Child₂ (300 tokens)
                                  ──▶ Child₃ (300 tokens)

Query:
  search children (precision)  →  match on Child₂
         ↓
  return Child₂'s PARENT to LLM (context)
```

**Cost / latency:** low on query (+ parent lookup). Medium at ingestion (generate hierarchy).

**When to use:** documents with coherent sections too long for a single chunk; manuals, contracts, extensive policies.

**When NOT to use:** standard chunking already gives good context. Adds ingestion complexity without measurable benefit.

**Course connection:** [M4 §6](../04-retrieval-y-query/guia.md#6-parent-child-retrieval). Node: `retrieval.parent-child`. Market variant: **small-to-big** (LlamaIndex `ParentDocumentRetriever`).

---

### 2.3 RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)

**What problem it solves:** questions requiring **cross-section synthesis** from multiple sections or documents — "summarize the main themes of the annual report" or "what are the common trends in these 50 reports?".

**How it works:**

```
Layer 0:  original chunks  [c1][c2][c3][c4][c5][c6]
              ↓ cluster + summarize
Layer 1:  summaries          [s1: c1+c2]  [s2: c3+c4]  [s3: c5+c6]
              ↓ cluster + summarize
Layer 2:  global summary     [S: s1+s2+s3]

Index ALL layers (chunks + summaries).
Query can match a specific chunk OR a high-level summary.
```

**Cost / latency:** **very high at ingestion** — multiple LLM calls for clustering and summarization (offline). Query: similar to standard retrieval. Costly maintenance if the corpus changes frequently.

**When to use:** large corpus with high-level, aggregation, or multi-document synthesis questions. Reports, research, extensive knowledge bases.

**When NOT to use:** point lookup of identifiers. Small corpus (< 100 docs). Frequent corpus updates. Start with chunking + hybrid; RAPTOR is a big leap.

**Course connection:** extends M2 (ingestion) and M4 (retrieval). No dedicated RAGorbit node — implemented as custom pipeline or with LlamaIndex `TreeIndex`. Complements GraphRAG: RAPTOR summarizes hierarchically; GraphRAG models explicit relationships.

---

### 2.4 Contextual Retrieval (Anthropic)

**What problem it solves:** isolated chunks lose context — "The rate is $50" does not say which rate. Improves recall in BM25 and embeddings.

**How it works:**

```
Original chunk:
  "The penalty is 20% of the ticket value."

Contextual Retrieval (offline, per chunk):
  LLM generates prepend context:
  "This fragment comes from airline X's international
   flight change policy, penalties section."

Indexed chunk:
  "[generated context] The penalty is 20%..."
         ↓
  embed + BM25 on enriched chunk
```

**Cost / latency:** **very high at ingestion** — 1 LLM call per chunk (offline batch). Anthropic reports ~49% fewer retrieval failures vs baseline. No extra query overhead.

**When to use:** corpus where chunks frequently lack autonomous context; simultaneous improvement of BM25 and vector; batch ingestion budget.

**When NOT to use:** chunks already self-contained (FAQs with question+answer). Corpus updated daily. If parent-child or rich metadata already solves context, evaluate first.

**Course connection:** advanced indexing alternative to parent-child. Combines with hybrid (M4 §4). Published by Anthropic (2024); implementable with any LLM in batch ingestion.

---

### 2.5 Multi-vector / ColBERT (late interaction)

**What problem it solves:** full-document embeddings (single-vector) lose nuance — a long chunk has a single vector that averages everything. ColBERT keeps **one vector per token** and interacts with the query token by token at search time.

**How it works:**

```
Indexing (offline):
  Doc: "international flight change penalty"
       ↓ ColBERT encoder
  [v_pen][v_al][v_cambio][v_vuelo][v_inter]...  ← one vector/token

Query (online):
  "How much does it cost to change my flight?"
       ↓
  [v_how][v_much][v_cost][v_change][v_flight]...
       ↓
  Late interaction: score = Σ max_sim(q_token, d_token)
       ↓
  fine ranking without full cross-encoder
```

**Cost / latency:** **high in storage** (N vectors per document vs 1). Query: 20–80 ms (between BM25 and cross-encoder). Between single-vector and cross-encoder in quality.

**When to use:** large corpus where pure cross-encoder is too slow but single-vector loses precision. Reranking at scale.

**When NOT to use:** small corpus (cross-encoder is better and simpler). No infrastructure for multi-vector (RAGatouille, Vespa, specialized). Start with cross-encoder reranker (M4 §5).

**Course connection:** defined in [glossary — ColBERT](./glosario.md#colbert), [tecnologias-comparadas §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers). Alternative to `retrieval.reranker` for scale.

---

### 2.6 Sentence-window

**What problem it solves:** small chunks for precision but the LLM needs surrounding sentences to understand the retrieved fragment.

**How it works:**

```
Ingestion:
  Index individual sentence (small unit)
  Store ±N sentence "window" in metadata

Query:
  retrieve(sentence)  →  precise match
         ↓
  expand with metadata window  →  ±5 sentences to LLM
```

Variant of **small-to-big** at sentence level. LlamaIndex: `SentenceWindowNodeParser`.

**Cost / latency:** low on query. Medium at ingestion (parse sentences + metadata).

**When to use:** narrative prose, articles, documentation where immediate context suffices (no need for a 2000-token parent).

**When NOT to use:** documents structured by section/clause — use parent-child. Tables or lists where sentences are not semantic units.

**Course connection:** complement to M2 chunking and M4 parent-child. Simpler than parent-child when local window is sufficient.

---

### 2.7 Propositions / semantic chunking

**What problem it solves:** fixed-size chunks split meaning units — a legal clause cut in half, a definition separated from its term.

**How it works:**

```
Document
         ↓
  LLM decomposes into atomic propositions:
    p1: "The tenant must pay monthly rent."
    p2: "Rent is due on the 1st of each month."
    p3: "Default generates 2% monthly interest."
         ↓
  index each proposition as a chunk
```

**Dense X Retrieval** (Chen et al.) is the academic reference for the proposition approach. **Semantic chunking** (LlamaIndex `SemanticSplitterNodeParser`) uses embeddings to detect boundaries where the topic changes.

**Cost / latency:** medium-high at ingestion (extra LLM or embeddings). Standard query.

**When to use:** corpus dense in atomic facts (legal, compliance, medical). Questions targeting concrete statements.

**When NOT to use:** narrative documents where flow matters. Prohibitive ingestion cost on massive corpus without measured gain.

**Course connection:** extends [M2 §4](../02-ingesta/guia.md#4-chunking-in-depth) with `by-clause` strategies and semantic splitting already mentioned in [`ingest.chunker`](./catalogo-nodos.md#ingestchunker).

---

## 3. Post-retrieval

Once top-K is retrieved, these techniques **refine, compress, and reorder** context before sending it to the LLM (M5).

---

### 3.1 Cross-encoder reranking

**What problem it solves:** the retriever returns noisy top-K — relevant chunks in positions 4–10 that the LLM would ignore.

**How it works:**

```
Retriever → top-20 (fast, noisy)
         ↓
Cross-encoder → score(query, chunk) for each pair
         ↓
precise top-3 → LLM
```

**Cost / latency:** +50–150 ms (local model) or +100–300 ms (API). Evaluates N query-chunk pairs.

**When to use:** almost always in critical domains (legal, medical, banking) after confirming base retrieval works.

**When NOT to use:** strict latency < 500 ms without GPU; hard filters already give clean top-K.

**Course connection:** [M4 §5](../04-retrieval-y-query/guia.md#5-reranking-with-cross-encoder), [tecnologias-comparadas §6](./tecnologias-comparadas.md#rerankers). Node: `retrieval.reranker`.

---

### 3.2 Contextual compression / LLMLingua

**What problem it solves:** retrieved top-K exceeds the LLM window or dilutes attention with redundant tokens.

**How it works:**

```
top-10 chunks (8000 tokens total)
         ↓
  LLMLingua / LongLLMLingua:
  remove low-perplexity tokens (redundant)
         ↓
  compressed context (2000 tokens, ~75% reduction)
         ↓
  LLM generates answer
```

**LLMLingua** (Microsoft, 2023) uses a small model to compute token-by-token perplexity and prune the predictable. **LLMLingua-2** improves while preserving key information.

**Cost / latency:** low-medium (+20–100 ms with small local model). Much less than sending 8000 tokens to the main LLM.

**When to use:** many retrieved chunks; limited context window; high cost per token of generator LLM.

**When NOT to use:** few already compact chunks. Risk of removing critical details (figures, negations) — evaluate faithfulness with RAGAS. Does not replace a good reranker.

**Course connection:** post-processing before [M5 — logic.prompt](../05-generacion-y-logic/guia.md). Complements parent-child (returns much context).

---

### 3.3 De-duplication and diversity (MMR)

**What problem it solves:** top-K with nearly identical chunks that waste context slots and bias the answer toward a single aspect.

**How it works:**

```
Retriever → [c1, c2, c3, c4, c5]  (c2 ≈ c1, c4 ≈ c3)

MMR (Maximal Marginal Relevance):
  select c1 (most relevant)
  select c3 (relevant AND different from c1)
  select c5 (relevant AND different from c1, c3)
         ↓
  [c1, c3, c5] → LLM
```

Formula: `MMR = argmax [ λ·Sim(d,Q) − (1−λ)·max Sim(d, d_selected) ]`

**Cost / latency:** very low (~1–5 ms). Only arithmetic on already computed vectors.

**When to use:** chunks with high overlap; corpus with many repetitions (duplicate FAQs, versions of the same policy).

**When NOT to use:** when you need all similar chunks (e.g. compare versions of a clause). λ=1 degenerates into pure relevance ranking.

**Course connection:** not covered in modules; applies after any M4 retriever. LangChain: `MaxMarginalRelevanceExampleSelector`; many vector stores expose `mmr` as a search parameter.

---

### 3.4 Position reordering (lost-in-the-middle)

**What problem it solves:** LLMs pay more attention to the **start and end** of context than the middle ("lost in the middle", Liu et al. 2023). Relevant chunks in positions 3–4 of 5 get ignored.

**How it works:**

```
Reranker returns by score: [c1, c2, c3, c4, c5]
  (c4 and c5 are most relevant but ended at the end)

Reordering:
  position 1: c4  (most relevant → start)
  position 2: c2
  position 3: c5  (second most relevant → end)
  position 4: c1
  position 5: c3
         ↓
  "Interleave": best at start and end, worst in the middle
```

**Cost / latency:** negligible (reorder list in memory).

**When to use:** whenever you send > 3 chunks to the LLM. Free and consistent. Especially useful if you do not have a reranker.

**When NOT to use:** no real contraindication — zero cost. Only applies if you already have relevance ranking.

**Course connection:** complement to M4 reranker and M5 generation. Implementable in `logic.prompt` node or as retriever post-process.

---

## 4. Self-correcting / agentic RAG

These architectures add **reflection, evaluation, and correction loops** — the system detects insufficient retrieval or poorly anchored answers and acts.

---

### 4.1 Self-RAG (Self-Reflective RAG)

**What problem it solves:** RAG that always retrieves and always generates, even when unnecessary or when chunks do not support the answer. Adds **self-criticism** via special reflection tokens.

**How it works:**

```
Query
  ↓
Retrieve?  ──no──▶ generate without context
  │ yes
  ↓
Retrieve top-K
  ↓
For each chunk: Is it relevant? [Relevant / Not relevant]
  ↓
Generate answer
  ↓
Is answer supported by chunks? [Fully / Partially / No]
  ↓
Is answer useful? [Yes / No]
  ↓
If insufficient → retrieve again or abstain
```

Self-RAG (Asai et al., 2023) trains (or prompts) the LLM to emit critique tokens `[Retrieve]`, `[IsRel]`, `[IsSup]`, `[IsUse]` as part of generation.

**Cost / latency:** **very high** — multiple generation steps per query. 2–5× tokens vs standard RAG.

**When to use:** high-stakes domains where abstaining is better than hallucinating; critical faithfulness; flexible latency budget.

**When NOT to use:** real-time chat (< 2 s). Massive volume. If you cannot evaluate whether self-criticism works, you add cost without benefit. Start with `logic.citations` + RAGAS evaluation (M5).

**Course connection:** agentic evolution post-M5/M6. Complements [Agentic RAG](../06-agentes-i/guia.md#6-agentic-rag--the-agent-decides-when-and-what-to-retrieve) with explicit reflection.

---

### 4.2 CRAG (Corrective RAG)

**What problem it solves:** retrieval that returns irrelevant or insufficient chunks and the LLM hallucinates anyway. Adds a **quality evaluator** and fallback sources.

**How it works:**

```
Query → Retrieve top-K
         ↓
  [Retrieval evaluator]
    ├── Correct    → generate with chunks
    ├── Ambiguous  → filter chunks + auxiliary web search
    └── Incorrect  → discard chunks → web search / other source
         ↓
  Generate answer with corrected context
```

CRAG (Yan et al., 2024) uses a lightweight evaluator (retriever score + classifier) to decide the corrective action.

**Cost / latency:** high — evaluator + possible web search + generation. Depends on fallback source.

**When to use:** incomplete or outdated corpus; need to complement with web; retrieval frequently insufficient measured in evaluation.

**When NOT to use:** closed and complete corpus (internal legal, technical manuals). No reliable fallback source. Web search introduces risk of unauthorized sources.

**Course connection:** extends M6 with `tool.http` or search tool as fallback. Complements hard filters (M4 §7).

---

### 4.3 Adaptive RAG

**What problem it solves:** not all queries need retrieval — some are conversational, others require RAG, others require multi-hop reasoning. Avoids unnecessary retrieval.

**How it works:**

```
Query
  ↓
[Complexity classifier]
  ├── No retrieval    → direct LLM ("hello", "thanks")
  ├── Single-step RAG → retrieve + generate
  └── Multi-step      → agent with multiple retrievals
         ↓
  Execute selected strategy
```

Adaptive RAG (Jeong et al., 2024) routes to strategy by query type.

**Cost / latency:** variable — saves cost on simple queries; invests more on complex ones. Classifier: low cost (~1 LLM call or fine-tuned classifier).

**When to use:** mix of conversational and knowledge queries; optimize cost in production; natural complement to `query.intent` (M4 §9).

**When NOT to use:** 100% knowledge queries (classifier overhead without benefit). If Agentic RAG (M6) already covers dynamic decision, Adaptive RAG may be redundant.

**Course connection:** bridge between M4 `query.intent` and M6 Agentic RAG. Related node: `model.intent`.

---

### 4.4 Agentic RAG

**What problem it solves:** fixed RAG pipeline that always retrieves with the user's raw query, without adapting to prior context or deciding if retrieval is needed.

**How it works:**

```
Input → Agent (ReAct)
            │
            ├─ Need RAG? ──no──▶ respond directly
            │        │
            │       yes
            │        ↓
            ├─ tool.retriever(query="...", filters={...})
            │        ↓
            ├─ Sufficient? ──no──▶ other tool / other index
            │        │
            │       yes
            │        ↓
            └─ generate anchored answer
```

**Cost / latency:** medium-high — depends on how many tools the agent invokes. Variable per query.

**When to use:** transactional queries (booking + policy); multi-index routing; optimal query depends on prior steps.

**When NOT to use:** simple homogeneous Q&A where fixed pipeline suffices. No observability of agent decisions.

**Course connection:** [M6 §6](../06-agentes-i/guia.md#6-agentic-rag--the-agent-decides-when-and-what-to-retrieve). Node: `tool.retriever`. Template 07 (telecom copilot).

---

### 4.5 Iterative / Recursive retrieval (FLARE, IRCoT)

**What problem it solves:** **multi-hop** questions requiring chained findings — "Who was CEO when product X contract was signed?" needs first identifying the product, then the date, then the CEO.

**How it works — FLARE (Forward-Looking Active REtrieval):**

```
Query → LLM generates partial draft
         ↓
  Does next sentence need evidence? (low confidence)
         ↓ yes
  Retrieve with query derived from draft
         ↓
  Regenerate with new context
         ↓
  Repeat until complete answer
```

**How it works — IRCoT (Interleaved Retrieval with Chain-of-Thought):**

```
Query
  ↓
CoT step 1: "I need to find product X contract"
  → Retrieve("product X contract") → evidence
  ↓
CoT step 2: "Contract signed in 2019. Who was CEO in 2019?"
  → Retrieve("company CEO 2019") → evidence
  ↓
Grounded final answer
```

**Cost / latency:** **very high** — 3–10 retrievals + generations per query.

**When to use:** multi-hop queries measured in evaluation; research; Q&A on knowledge bases with chained relationships.

**When NOT to use:** direct lookup. Strict latency. GraphRAG (M4 §10) can resolve multi-hop in a single query if the graph is well modeled — evaluate which fits better.

**Course connection:** fullest expression of M6 agents. FLARE and IRCoT are patterns implementable with `agent.react` + `tool.retriever`. Complement GraphRAG for multi-hop.

---

## 5. Structural RAG

Architectures that change the **shape of the index or data source**, not just the query pipeline.

---

### 5.1 GraphRAG

**What problem it solves:** questions about **relationships** between entities — "Which contracts are linked to supplier X?" — where flat vector search fails.

**How it works:**

```
Ingestion:
  Documents → LLM extracts entities + relationships
         ↓
  Knowledge Graph: (Supplier X)-[:HAS]->(Contract A)
                   (Contract A)-[:INCLUDES]->(Clause 7)

Query:
  "Supplier X contracts" → Supplier X node
         ↓
  traverse graph 1-2 hops → chunks + neighbors
         ↓
  LLM with structural context
```

**Cost / latency:** **very high at ingestion** (entity extraction). Query: medium-high (graph traversal + vector). Microsoft GraphRAG adds community detection and cluster summaries.

**When to use:** explicit relationships between entities; structural multi-hop; template 05 (legal).

**When NOT to use:** corpus without clear relationships. Overhead vs simple vector store. Start with metadata + hard filters.

**Course connection:** [M4 §10](../04-retrieval-y-query/guia.md#10-graphrag-and-knowledge-graphs-neo4j). Nodes: `store.neo4j`, `retrieval.graph`.

---

### 5.2 Hybrid search

**What problem it solves:** embeddings lose exact terms; BM25 loses semantics. The combination covers both failure modes.

**How it works:**

```
Query ──┬──▶ Vector search ──▶ list A
        └──▶ BM25 search   ──▶ list B
                    ↓
              RRF (or alpha blend)
                    ↓
              fused top-K
```

**Cost / latency:** medium — two searches + fusion. De facto production standard.

**When to use:** general case in technical domains. First improvement after pure vector.

**When NOT to use:** purely conversational corpus without technical terms (vector alone may suffice).

**Course connection:** [M4 §3–4](../04-retrieval-y-query/guia.md#3-keyword-search-bm25). Node: `retrieval.hybrid`. [tecnologias-comparadas §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers).

---

### 5.3 Multi-index / multi-modal RAG

**What problem it solves:** knowledge spread across distinct indexes (policy vs procedure vs FAQ) or distinct modalities (text vs images vs tables).

**How it works:**

```
Query / Document
         ↓
  ┌──────┴──────┐
  ▼             ▼
Text index   Image index
(policy)     (diagrams)
  │             │
  └──────┬──────┘
         ↓
  Agent or router decides index(es)
         ↓
  Multimodal context → LLM
```

**Cost / latency:** high — multiple indexes to maintain; vision models for multimodal ingestion.

**When to use:** template 07 (multi-index telecom); template 08 (manuals with diagrams); any KB with separate categories or modalities.

**When NOT to use:** single plain-text corpus.

**Course connection:** multi-index in [M4 §8](../04-retrieval-y-query/guia.md#8-multi-index-routing); multimodal in [M10](../10-multimodal/guia.md). Nodes: `store.multi-index`, `loader.multimodal`, `model.vision`.

---

### 5.4 SQL / Text-to-SQL RAG

**What problem it solves:** part of the knowledge lives in **relational databases** (sales, inventory, bookings) — not in indexable documents.

**How it works:**

```
Query: "How many customers bought more than $1000 in June?"
         ↓
  LLM generates SQL:
  SELECT COUNT(DISTINCT customer_id) FROM sales
  WHERE amount > 1000 AND month = '2024-06'
         ↓
  Execute against DB → tabular results
         ↓
  LLM interprets results → natural answer
```

Variants: **schema RAG** (embed tables/columns + retrieve relevant schema before generating SQL), **Semantic Layer** (predefined metrics), SQL agent with tools.

**Cost / latency:** medium — 1–2 LLM calls + SQL query. Risk of incorrect SQL.

**When to use:** structured data with analytical questions; document corpus does not contain the figures.

**When NOT to use:** questions about policies or procedures (documents). Without SQL governance (injection / sensitive data risk).

**Course connection:** [M6 §7.2 — SQL agent](../06-agentes-i/guia.md#72-sql-agent). Complements document RAG — does not replace it. In RAGorbit: `tool.function` or agent with DB access.

---

### 5.5 Long-context vs RAG

**What problem it solves:** the temptation to "put the entire corpus in the LLM window" vs selective retrieval. Not a technique but an **architectural decision**.

**How it works — comparison:**

```
RAG:
  Corpus (1M tokens) → index → retrieve top-5 (2K tokens) → LLM

Long-context:
  Corpus (50K tokens) → put everything → LLM (128K–1M window)
```

**Cost / latency:**

| Approach | Cost per query | Latency | Corpus scale |
|----------|----------------|---------|--------------|
| RAG | Low (2K tokens input) | +retrieval (~100 ms) | Millions of docs |
| Long-context | High (50K+ tokens input) | No retrieval | Limited to window |
| **Hybrid** | Medium | Medium | Retrieve + fill window |

**When to use long-context:** small corpus that fits in window (< 50K tokens); need for dense cross-references; rapid prototype.

**When to use RAG:** large corpus; frequently changing corpus; need to cite exact sources; cost per token matters.

**When NOT to use long-context as RAG substitute:** corpus > window; "lost in the middle" worsens with very long context (Liu et al. 2023); unsustainable cost.

**Course connection:** M3 (RAG) vs design decision. Compression (§3.2) and reorder (§3.4) mitigate limitations when mixing both approaches. Evaluate with RAGAS context precision before choosing.

---

## 6. Master decision table

Use this table to go from **symptom** to **strategy**. Rule: apply the simplest intervention first; measure; scale only if the symptom persists.

| Symptom | Probable diagnosis | Start with (simple) | If it persists, add |
|---------|-------------------|---------------------|---------------------|
| **Low precision** (irrelevant chunks in top-K) | Weak ranking or cross-category noise | Hard filters + metadata (M4 §7) | Reranker (M4 §5) → routing (M4 §8) |
| **Low precision** (relevant chunks but poorly used) | Lost-in-the-middle or poor context | Position reorder (§3.4) | Parent-child (M4 §6) → Contextual Retrieval (§2.4) |
| **Low recall** (correct chunk does not appear) | Lexical gap or bad chunking | Strategic chunking (M2) + hybrid (M4 §4) | Query rewrite (M4 §9) → multi-query (§1.3) → HyDE (§1.2) |
| **Hallucinates** despite good retrieval | Ungrounded generation | `logic.citations` (M5) + low temperature | Self-RAG (§4.1) → RAGAS faithfulness evaluation |
| **Hallucinates** with poor retrieval | Insufficient or irrelevant chunks | Reranker + filters | CRAG (§4.2) with fallback source |
| **Fails on exact terms** (codes, IDs) | Embeddings do not capture exact match | BM25 + hybrid (M4 §3–4) | ↑ BM25 weight (alpha ↓) → metadata with IDs |
| **Multi-hop queries** | Single retrieval does not chain | GraphRAG (M4 §10) | IRCoT / FLARE (§4.5) → Agentic RAG (M6 §6) |
| **Domain with relationships** (entities, contracts) | Flat vector does not model structure | Metadata + filters | GraphRAG (§5.1) |
| **Outdated corpus** | Incomplete documents | Re-indexing pipeline | CRAG with web search (§4.2) |
| **Latency > SLA** | Too many steps | Remove HyDE/multi-query; top-K ↓ | FlashRank / ColBERT (§2.5) instead of cross-encoder |
| **High cost per query** | Unnecessary retrieval | `query.intent` (M4 §9) | Adaptive RAG (§4.3) → Agentic RAG (M6 §6) |
| **Context exceeds window** | top-K too large | ↓ top-K + reranker | LLMLingua compression (§3.2) |
| **Redundant answers** | Duplicate chunks in context | MMR (§3.3) | De-duplication at ingestion |
| **Analytical questions** (figures, aggregations) | Data in DB, not docs | Text-to-SQL (§5.4) | SQL agent (M6 §7.2) |
| **Diagrams / images** | Text alone does not index visuals | `model.vision` at ingestion (M10) | Multi-modal RAG (§5.3) |
| **Global synthesis questions** | Local chunks insufficient | RAPTOR (§2.3) | GraphRAG with community summaries (§5.1) |

### Recommended escalation flow

```
Level 0: Naive RAG (M3)
    ↓ if it fails
Level 1: Chunking (M2) + Hybrid + Filters (M4)
    ↓ if it fails
Level 2: Reranker + Parent-child + Query rewrite (M4)
    ↓ if it fails
Level 3: Advanced pre-retrieval (HyDE, multi-query) + Post (MMR, compression)
    ↓ if it fails
Level 4: Advanced indexing (RAPTOR, Contextual Retrieval, ColBERT)
    ↓ if it fails
Level 5: Structural (GraphRAG, Text-to-SQL, Multi-modal)
    ↓ if it fails
Level 6: Agentic (Agentic RAG, Self-RAG, CRAG, FLARE/IRCoT)
```

At each level: **measure with RAGAS** (faithfulness, context precision/recall) before moving up. Complexity has maintenance cost — do not skip levels without evidence.

---

> **Cross-links**
>
> | Module | Related content |
> |--------|-----------------|
> | [M2 — Ingestion](../02-ingesta/guia.md) | Strategic chunking, metadata, loaders |
> | [M4 — Retrieval and query](../04-retrieval-y-query/guia.md) | Dense, BM25, hybrid, RRF, rerank, parent-child, filters, routing, GraphRAG, query rewrite |
> | [M5 — Generation and logic](../05-generacion-y-logic/guia.md) | Prompt, citations, structured output, RAGAS evaluation |
> | [M6 — Agents I](../06-agentes-i/guia.md) | Agentic RAG (§6), tool.retriever, SQL agent |
> | [M10 — Multimodal](../10-multimodal/guia.md) | RAG on images, diagrams, tables |
>
> | Reference | Content |
> |-----------|---------|
> | [tecnologias-comparadas.md §6](./tecnologias-comparadas.md#6-retrieval-y-rerankers) | BM25 vs vector vs hybrid vs GraphRAG; rerankers |
> | [catalogo-nodos.md](./catalogo-nodos.md) | `retrieval.*`, `query.*`, `ingest.*`, `store.*`, `tool.retriever` nodes |
> | [glosario.md](./glosario.md) | HyDE, ColBERT, Agentic RAG, RRF, BM25, embeddings |

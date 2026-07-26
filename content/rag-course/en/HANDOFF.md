# HANDOFF — Context for continuing to generate this course

> **For a new session or model that does NOT know the chat where this was born.** Read it in full before generating more material. Everything you need is here or in the files cited.

## 1. What this project is

- Repo: `/Users/dany/dev/ragorbit`. Contains **RAGorbit** (a visual builder of RAG/agentic strategies that generates Python artifacts) and this **course** (`rag-training/`) that teaches, from scratch, everything RAGorbit uses.
- RAGorbit in one sentence: you draw a node graph → it is saved as **Flow IR** (JSON) → a **codegen** produces a Python project with `app/ mocks/ tests/`. There are **53 node types** in **13 categories**. Read `docs/01-concepts.md` (contract/Flow IR) and `docs/02-node-catalog.md` (catalog) — they are the technical source of truth.
- There are **10 industry templates** in `examples/*/flow.json` (airline, banking, healthcare, insurance, legal, retail, telecom, manufacturing, HR, logistics). Each with its `README.md`.
- The course teaches how to understand, use, and **rebuild from scratch** those templates.

## 2. Course objective and syllabus

- **Source of truth for the syllabus:** [`PLAN.md`](./PLAN.md). Each module (M0–M11) is specified in `PLAN.md §6` (objectives, concepts, nodes, competing technologies, template(s), workshop with *expected results*).
- The IBM Coursera syllabus was **reference only** to ensure coverage (see `PLAN.md §11`); we are **not** following that course. We build our own material here.
- Language: **English**. Audience: someone who **knows nothing** about RAG/AI but programs in Python.

## 3. Authoring method (MANDATORY to maintain consistency)

**Tri-modal** approach on every topic and workshop:
1. **① Design/concept** — what it is, why it exists, **when to use / when NOT to**, what technologies replace it and trade-offs.
2. **② From scratch (pure Python)** — implement the mechanism by hand to understand it.
3. **③ Real framework** — how it is done in the production tool (LangChain/LangGraph/LlamaIndex/CrewAI/AutoGen/MCP…), in depth.

Cycle per module: **GUIDE → EXERCISES (with answers) → WORKSHOP (with *expected results*) → CHECKPOINT**.

> **MANDATORY CONVENTION (layer ③ taught, not assumed).** Layer ③ must NOT appear "all at once" only in `lab/solucion_framework.py`. Each `guia.md` includes, before the Checkpoint, a section **`## N. Layer ③ explained: <framework> from scratch`** that: (a) explains what the framework is and why it exists, for someone who only knows Python; (b) provides a **bridge table "what you did by hand (②) → the framework piece (③)"**; (c) teaches each API the lab uses, one by one, with mini-examples; (d) walks through **`solucion_framework.py` block by block**; (e) gives "when to use/NOT" and gotchas. LangChain base abstractions (Document, Embeddings, VectorStore, Retriever, chat models, ChatPromptTemplate, LCEL/`|`) are taught in depth in **M1 §11** (`01-fundamentos/guia.md`); other modules add a reminder + cross-link to M1 §11 and teach ONLY what's new. Also, `lab/enunciado.md` frames layer ③ as a **guided task** (stepped hints → the guide section), not as "just read it".

## 4. File conventions (each module `NN-name/`)

```
NN-name/
  guia.md            # comprehensive module guide, multi-section, with ASCII diagrams and "when to use / alternatives".
                     #   Anchor each topic to its RAGorbit node and the template(s).
  ejercicios.md      # 12–20 exercises (reasoned multiple choice, "predict the output", "find the bug", "choose the technology"). NO answers.
  soluciones.md      # reasoned answers for ALL exercises.
  lab/
    enunciado.md     # realistic workshop: business context, data, task, stepped hints.
    datos/           # sample data (JSON/txt) if applicable.
    expected.md      # CONCRETE expected result (what prints/returns/happens).
    solucion_scratch.py     # layer ②: runs ONLY with stdlib (no network, no pip). Deterministic.
    solucion_framework.py   # layer ③: real code with framework (illustrative; header says what `pip install` requires; NOT run here).
    solucion.md      # explanation of both solutions and why.
```
- **Tone:** didactic, direct, with examples. High depth (this is full-time study, not summaries).
- **Cross-links:** use relative paths to `referencia/` and to `examples/`/`docs/` in the repo.

## 5. Environment constraint (CRITICAL for workshops)

- On this machine **there is no usable network and `pip` is broken** (Python 3.14 + libexpat) — packages cannot be installed nor models/embeddings downloaded.
- Therefore **layer ② (scratch) MUST run with the Python standard library** and be **deterministic**:
  - Toy embeddings: hashing / bag-of-words / char-n-grams + cosine similarity by hand.
  - Vector store: in-memory dictionary/lists.
  - LLM: deterministic "fake" function (templates) — same as the RAGorbit mock runtime (`ragorbit/runtime/`).
  - Tools/services: in-memory stubs or stdlib `http.server`.
- Layer ③ (frameworks) is delivered as **commented real code** the student can run when they have network/pip; it is not run in this environment. Mark in the header: `# Requires: pip install langchain langgraph ...`.
- **Verification:** `solucion_scratch.py` files must be runnable with `python3 file.py` and produce what `expected.md` says. If you generate a module, try `python3 -m py_compile` and, if runnable, run it to confirm the expected.

## 6. Generation status

| Module | Folder | Status |
|--------|---------|--------|
| referencia | `referencia/` | ✅ generated (catalogo-nodos, glosario, tecnologias-comparadas, plantillas-mapeadas, cobertura-ibm-coursera) + **Lang\* alternatives**: `rag-sin-langchain.md` (LlamaIndex/Haystack/native SDK), `agentes-sin-langchain.md` (native loop/CrewAI/AutoGen/Pydantic-AI), and criticisms of the LangChain/LangGraph/LangSmith stack section inside `tecnologias-comparadas.md`. Goal: full AI engineer, not expert only in `lang*`. If you create new modules with frameworks, keep the multi-framework approach and link these docs. Also, **vendor-neutral market landscapes**: `panorama-bases-de-datos.md` (DBs/storage), `panorama-procesos.md` (orchestration/serving/data/deploy) and `panorama-estrategias-rag.md` (RAG architectures). |
| M0 | `00-setup/` | ✅ generated |
| M1 | `01-fundamentos/` | ✅ generated |
| M2 | `02-ingesta/` | ✅ generated |
| M3 | `03-embeddings-y-stores/` | ✅ generated |
| M4 | `04-retrieval-y-query/` | ✅ generated |
| M5 | `05-generacion-y-logic/` | ✅ generated |
| M6 | `06-agentes-i/` | ✅ generated |
| M7 | `07-agentes-ii/` | ✅ generated |
| M8 | `08-mcp/` | ✅ generated |
| M9 | `09-produccion-y-seguridad/` | ✅ generated |
| M10 | `10-multimodal/` | ✅ generated |
| M11 | `11-capstone/` | ✅ generated |

> **The course is COMPLETE: M0–M11 + `referencia/` (5 docs) generated.** All `solucion_scratch.py` files compile and run with stdlib, and each `guia.md` has its "Layer ③ explained" section (see convention in §3). If you see a module marked ✅ but its folder is incomplete, regenerate it following §4.

## 7. How to continue (recipe to regenerate a module or create a new one)

1. Read: this HANDOFF (§3–§5), `PLAN.md §6` (the target module entry), `referencia/catalogo-nodos.md` and `referencia/tecnologias-comparadas.md`, and **one completed module as a style template** (e.g. `06-agentes-i/`).
2. Read the `examples/*/flow.json` of the template(s) the module covers (see `PLAN.md §8`).
3. Generate the `NN-name/` folder with the files from §4, respecting the tri-modal method and environment constraint (§5).
4. Verify: `python3 -m py_compile NN-name/lab/solucion_scratch.py` and, if it runs, execute it and confirm `expected.md`.
5. Update the §6 table (mark the module ✅).
6. Keep it in English, the depth, and the cross-links.

## 8. Quality polarity (what makes this material good)

- Each technology with **why / when / alternatives** (not just "how").
- **Realistic** workshops (credible business briefs) with **concrete expected results** and solution in **both layers** (scratch + framework).
- After reading the module guide, the student **can solve the workshop** without external help.
- Everything connects to **RAGorbit nodes** and the **10 templates**, so the student can ultimately **rebuild them** and **design** new ones.

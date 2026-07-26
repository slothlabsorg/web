# 🎓 RAG & Agentic AI — Zero to Expert Course

Hands-on course (in English) to master RAG, vector stores, retrieval, agents, multi-agent, MCP, multimodal, guardrails, security, and deployment — and be able to **design these architectures and rebuild from scratch the 10 RAGorbit templates**.

- **Full plan / syllabus:** [PLAN.md](./PLAN.md) (12 modules M0–M11, ~9–10 weeks full-time).
- **How to continue generating the course (another session/model):** [HANDOFF.md](./HANDOFF.md).
- **Method:** each topic in 3 layers → **① design/concept · ② from scratch in Python · ③ real framework**. Cycle per module: **guide → exercises (with answers) → workshop (with *expected results*) → checkpoint**.

## How to work through it

1. Start with [`00-setup`](./00-setup/) and follow numeric order.
2. In each module: read `guide.md` → solve `exercises.md` (check `solutions.md`) → do the `lab/` (compare with `lab/solution.md`).
3. Consult `reference/` when you need a node card, the glossary, or to compare technologies.

## Module map

| Module | Folder | Topic |
|--------|---------|------|
| M0 | `00-setup/` | Setup + Python refresher + RAGorbit walkthrough |
| M1 | `01-fundamentals/` | LLMs, prompting, RAG, embeddings (`model` node) |
| M2 | `02-ingestion/` | Loaders + chunking + metadata (`loader`, `ingest`) |
| M3 | `03-embeddings-and-stores/` | Embeddings + vector stores (`store`) |
| M4 | `04-retrieval-and-query/` | Advanced retrieval + GraphRAG (`retrieval`, `query`) |
| M5 | `05-generation-and-logic/` | Generation, structured output, citations, eval (`logic`) |
| M6 | `06-agents-i/` | Agents: tool calling, ReAct, memory, Reflexion (`agent`, `tool`) |
| M7 | `07-agents-ii/` | Multi-agent and frameworks (LangGraph, CrewAI, AutoGen/AG2, BeeAI) (`agent`) |
| M8 | `08-mcp/` | Model Context Protocol in depth: FastMCP server/client, security (`tool.mcp`) |
| M9 | `09-production-and-security/` | Guardrails, HITL, observability, deployment, AI Security, UIs (`guardrail`, `hitl`, `observability`, `io`) |
| M10 | `10-multimodal/` | STT/Whisper, vision, image/audio generation (`io.stt`, `model.vision`) |
| M11 | `11-capstone/` | Architecture + capstone (rebuild templates + design + exam) |

> Generation status: **course complete** — M0–M11 + `reference/` (node catalog, glossary, technology comparisons, mapped templates, IBM coverage). See [HANDOFF.md](./HANDOFF.md).

## The three layers, for real

Each module teaches its layer ③ (real framework) **from scratch**, it doesn't assume prior knowledge: there's a `## Layer ③ explained: <framework> from scratch` section in each `guide.md` that starts from what you already built by hand (layer ②) and takes you to understand —and be able to write— `lab/solution_framework.py`. LangChain foundations are taught in [M1 §11](./01-fundamentals/guide.md); later modules link there and only add what's new.

## Full AI engineer, not just a `lang*` expert

The course uses LangChain/LangGraph as default (it's what RAGorbit generates), but the goal is framework independence. That's why:

- **Honest critiques** of the LangChain/LangGraph/LangSmith stack and when NOT to use it: [`reference/compared-technologies.md`](./reference/compared-technologies.md#criticisms-of-the-langchain--langgraph--langsmith-stack-and-when-not-to-use-it).
- **The same course RAG, without LangChain**: LlamaIndex, Haystack, and native SDK → [`reference/rag-without-langchain.md`](./reference/rag-without-langchain.md).
- **The same course agent, without LangGraph**: native SDK loop, CrewAI, AutoGen/AG2, and Pydantic-AI → [`reference/agents-without-langchain.md`](./reference/agents-without-langchain.md).

### Market landscape (vendor-neutral)

Broad ecosystem maps, without committing to any stack:

- **Databases / storage** (dedicated vector, relational+vector, hybrid engines, NoSQL+vector, graphs, specialized, and when NOT to use a vector DB): [`reference/database-landscape.md`](./reference/database-landscape.md).
- **Processes** (orchestration, serving/inference, data pipelines, deployment, LLM gateways): [`reference/process-landscape.md`](./reference/process-landscape.md).
- **RAG strategies** (HyDE, RAG-Fusion, RAPTOR, Contextual Retrieval, ColBERT, Self-RAG, CRAG, Adaptive/Agentic RAG…): [`reference/rag-strategies-landscape.md`](./reference/rag-strategies-landscape.md).

## Requirements

Python 3.11+. Workshops (layer ②, *scratch*) run **with the standard library only** (no installs, no network). Layer ③ (frameworks) shows real code (LangChain/LangGraph/etc.); to run it, install the libs indicated in each lab.

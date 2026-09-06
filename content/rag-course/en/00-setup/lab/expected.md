# Expected Output — Workshop M0

Run from the repo root:

```
python3 rag-training/00-setup/lab/solucion_scratch.py
```

---

```
Flow: hr-policy-assistant  |  Policy and benefits assistant for employees
Deployment target: chat-service

=== NODES (10) ===
  id=chat_input           type=io.input
  id=hr_docs              type=loader.pdf
  id=chunker              type=ingest.chunker
  id=embedder             type=model.embedding
  id=hr_store             type=store.chroma
  id=retriever            type=retrieval.vector
  id=llm                  type=model.llm
  id=prompt               type=logic.prompt
  id=citations            type=logic.citations
  id=chat_output          type=io.output

=== EDGES (11) ===
  chat_input:Message  →  retriever:Query
  hr_docs:Documents  →  chunker:Documents
  chunker:Documents  →  hr_store:Documents
  embedder:Embeddings  →  hr_store:Embeddings
  hr_store:Retriever  →  retriever:Retriever
  retriever:Chunks  →  prompt:Chunks
  chat_input:Message  →  prompt:Message
  llm:Model  →  prompt:Model
  prompt:Message  →  citations:Message
  retriever:Chunks  →  citations:Chunks
  citations:Message  →  chat_output:Any

=== INPUT NODE ===
  id=chat_input  type=io.input  label=Chat Input

=== OUTPUT NODE(S) (1) ===
  id=chat_output  type=io.output  label=Markdown Output
```

---

## What does each section mean?

| Section | What it confirms |
|---------|-------------|
| **NODES (10)** | The flow has 10 nodes: 2 I/O, 1 loader, 1 chunker, 1 embedder, 1 store, 1 retriever, 1 LLM, 1 prompt, and 1 citations |
| **EDGES (11)** | 11 connections; the `chat_input` node feeds two routes (to `retriever` and to `prompt`); `retriever` also feeds two destinations (`prompt` and `citations`) |
| **INPUT NODE** | `chat_input` (type `io.input`) — RAGorbit derives `deploymentTarget: chat-service` from this node |
| **OUTPUT NODE(S)** | `chat_output` (type `io.output`) — sole node with no outgoing edges |

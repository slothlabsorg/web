# Salida esperada — Taller M0

Ejecutar desde la raíz del repo:

```
python3 rag-training/00-setup/lab/solucion_scratch.py
```

---

```
Flow: hr-policy-assistant  |  Asistente de políticas y beneficios para empleados
Target de despliegue: chat-service

=== NODOS (10) ===
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

=== ARISTAS (11) ===
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

=== NODO DE ENTRADA ===
  id=chat_input  type=io.input  label=Entrada Chat

=== NODO(S) DE SALIDA (1) ===
  id=chat_output  type=io.output  label=Salida Markdown
```

---

## ¿Qué significa cada sección?

| Sección | Qué confirma |
|---------|-------------|
| **NODOS (10)** | El flujo tiene 10 nodos: 2 de I/O, 1 loader, 1 chunker, 1 embedder, 1 store, 1 retriever, 1 LLM, 1 prompt y 1 citas |
| **ARISTAS (11)** | 11 conexiones; el nodo `chat_input` alimenta dos rutas (hacia `retriever` y hacia `prompt`); `retriever` también alimenta dos destinos (`prompt` y `citations`) |
| **NODO DE ENTRADA** | `chat_input` (tipo `io.input`) — RAGorbit deriva `deploymentTarget: chat-service` de este nodo |
| **NODO(S) DE SALIDA** | `chat_output` (tipo `io.output`) — único nodo sin aristas de salida |

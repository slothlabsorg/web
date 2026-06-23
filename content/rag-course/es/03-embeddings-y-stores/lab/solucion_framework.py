# Requiere: pip install chromadb faiss-cpu sentence-transformers
"""
M3 · Taller — Mini Vector Store con ChromaDB y FAISS
Capa 3: Frameworks reales. Ilustrativo — NO se ejecuta en el entorno del curso
(requiere pip y red). Ejecutar cuando tengas un entorno con los paquetes instalados.

Este archivo muestra la misma tarea del taller (indexar 12 docs de RRHH,
buscar top-K por coseno, aplicar filtro de metadata) usando:
  - Seccion A: ChromaDB (vector DB completa)
  - Seccion B: FAISS (libreria de indice) + gestion manual de metadata

Comparacion al final.
"""

import json
from pathlib import Path

# ============================================================
# SECCION A: ChromaDB
# ============================================================

def demo_chromadb():
    """Vector store de RRHH con ChromaDB."""
    import chromadb
    from sentence_transformers import SentenceTransformer

    print("\n" + "="*60)
    print("  SECCION A: ChromaDB")
    print("="*60)

    # --- Cliente in-memory (para el taller; usa PersistentClient en produccion) ---
    # PUENTE scratch: equivale a store = {} — datos en RAM, se pierden al cerrar.
    # Ver guia §15.5 bloque A.1 y §7.1 (persistencia).
    client = chromadb.Client()

    # --- Coleccion con metrica coseno ---
    # PUENTE scratch: define la metrica de tu funcion coseno() manual.
    # hnsw:space=cosine → Chroma devuelve DISTANCIAS (0=identico); convierte con sim=1-dist/2
    collection = client.get_or_create_collection(
        name="hr_policies",
        metadata={"hnsw:space": "cosine"}
    )

    # --- Modelo de embedding local (BGE, sin necesidad de API key) ---
    # PUENTE scratch: reemplaza embeder() + normalizar(). Primera ejecucion descarga ~440 MB.
    # Ver guia §15.2. Siempre normalize_embeddings=True al encode().
    # Alternativa con OpenAI:
    # from chromadb.utils import embedding_functions
    # ef = embedding_functions.OpenAIEmbeddingFunction(api_key="sk-...", model_name="text-embedding-3-small")
    modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

    # --- Cargar documentos ---
    datos_dir = Path(__file__).parent / "datos"
    ids, textos, metadatas = [], [], []
    for archivo in sorted(datos_dir.glob("doc_*.json")):
        with open(archivo, encoding="utf-8") as f:
            doc = json.load(f)
        ids.append(doc["id"])
        textos.append(doc["texto"])
        metadatas.append(doc["metadata"])

    # --- Indexar (ChromaDB genera embeddings automaticamente si pasamos el modelo) ---
    # NOTA pedagogica: el primer upsert (sin embeddings=) es solo ilustrativo — en tu codigo
    # usa UN solo upsert con embeddings pre-calculados (bloque de abajo).
    # PUENTE scratch: equivale al bucle que llena store[id] = {vector, texto, metadata}.
    # Opcion 1: pasar textos y dejar que Chroma use su modelo interno (all-MiniLM-L6-v2)
    collection.upsert(
        ids=ids,
        documents=textos,
        metadatas=metadatas,
    )

    # Opcion 2: pre-computar embeddings con nuestro modelo (RECOMENDADO — usa este en tu taller)
    embeddings = modelo.encode(textos, normalize_embeddings=True).tolist()
    collection.upsert(
        ids=ids,
        documents=textos,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    print(f"  Documentos indexados: {collection.count()}")

    # --- Busqueda A: sin filtro ---
    query = "dias de permiso y descanso que tengo derecho"
    resultados = collection.query(
        query_texts=[query],
        n_results=3,
        include=["documents", "metadatas", "distances"]
    )
    print(f"\n  Busqueda A (sin filtro, top-3) para: '{query}'")
    for i, (doc_id, dist, meta) in enumerate(zip(
        resultados["ids"][0],
        resultados["distances"][0],
        resultados["metadatas"][0]
    ), 1):
        # Chroma devuelve distancia (0=identico, 2=opuesto con coseno)
        # Convertir a similitud: sim = 1 - dist/2  (para coseno normalizado)
        sim = 1 - dist / 2
        print(f"    {i}. [{doc_id}] sim={sim:.4f} | categoria={meta['categoria']}")

    # --- Busqueda B: con filtro de metadata ---
    # PUENTE scratch: buscar(query, k=3, filtro={"categoria": "vacaciones"}).
    # PRE-filtering: Chroma garantiza que los 3 resultados pasan el filtro. Ver guia §8.4.
    resultados_filtro = collection.query(
        query_texts=[query],
        n_results=3,
        where={"categoria": "vacaciones"},
        include=["documents", "metadatas", "distances"]
    )
    print(f"\n  Busqueda B (filtro categoria=vacaciones, top-3):")
    for i, (doc_id, dist, meta) in enumerate(zip(
        resultados_filtro["ids"][0],
        resultados_filtro["distances"][0],
        resultados_filtro["metadatas"][0]
    ), 1):
        sim = 1 - dist / 2
        print(f"    {i}. [{doc_id}] sim={sim:.4f} | categoria={meta['categoria']}")

    # --- Filtros avanzados ---
    print("\n  Filtro avanzado (vacaciones o horario, año >= 2024):")
    resultados_avanzado = collection.query(
        query_texts=["tiempo libre horario flexible"],
        n_results=4,
        where={
            "$and": [
                {"categoria": {"$in": ["vacaciones", "horario"]}},
                {"version": {"$gte": "2024"}}
            ]
        },
        include=["metadatas", "distances"]
    )
    for doc_id, dist, meta in zip(
        resultados_avanzado["ids"][0],
        resultados_avanzado["distances"][0],
        resultados_avanzado["metadatas"][0]
    ):
        print(f"    [{doc_id}] cat={meta['categoria']} v={meta['version']}")

    # --- Operaciones CRUD ---
    print("\n  Upsert (actualizar doc_01):")
    collection.upsert(
        ids=["doc_01"],
        documents=["Los empleados tienen 20 dias de vacaciones anuales (nueva politica 2025)."],
        metadatas=[{"categoria": "vacaciones", "tema": "tiempo libre", "version": "2025", "departamento": "todos"}]
    )
    verificacion = collection.get(ids=["doc_01"], include=["metadatas"])
    print(f"    version actualizada: {verificacion['metadatas'][0]['version']}")

    print("\n  Delete (eliminar doc_11 y doc_12):")
    collection.delete(ids=["doc_11", "doc_12"])
    print(f"    Documentos restantes: {collection.count()}")

    # Restaurar para no interferir con el resto del demo
    # (en un entorno real no es necesario)
    print(f"\n  Total final en la coleccion: {collection.count()}")


# ============================================================
# SECCION B: FAISS
# ============================================================

def demo_faiss():
    """Vector store con FAISS + metadata manual."""
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer

    print("\n" + "="*60)
    print("  SECCION B: FAISS")
    print("="*60)

    # --- Modelo de embedding ---
    modelo = SentenceTransformer("BAAI/bge-base-en-v1.5")

    # --- Cargar documentos ---
    datos_dir = Path(__file__).parent / "datos"
    docs = []
    for archivo in sorted(datos_dir.glob("doc_*.json")):
        with open(archivo, encoding="utf-8") as f:
            docs.append(json.load(f))

    # --- Generar embeddings ---
    textos = [d["texto"] for d in docs]
    embeddings = modelo.encode(textos, normalize_embeddings=True)
    # embeddings.shape: (12, 768) con BGE-base

    dim = embeddings.shape[1]  # 768

    # --- Construir indice FAISS ---
    # PUENTE scratch: store dict con vectores. IndexFlatIP = coseno si vectores normalizados.
    # Ver guia §15.5 bloque B.2. FAISS exige float32, no float64.
    # IndexFlatIP = producto punto exacto (= coseno con vectores normalizados)
    index = faiss.IndexFlatIP(dim)

    # Para usar IDs arbitrarios (no solo 0,1,2...) usamos IndexIDMap
    index_with_ids = faiss.IndexIDMap(index)
    ids_numericos = np.arange(len(docs), dtype=np.int64)
    index_with_ids.add_with_ids(
        embeddings.astype(np.float32),
        ids_numericos
    )
    print(f"  Documentos indexados en FAISS: {index_with_ids.ntotal}")

    # Mapa de indice numerico a metadatos (FAISS no almacena metadata)
    # OBLIGATORIO: sin esto, search() devuelve numeros sin texto ni categoria. Ver guia §15.6.
    id_a_doc = {i: docs[i] for i in range(len(docs))}

    # --- Busqueda A: sin filtro ---
    query = "dias de permiso y descanso que tengo derecho"
    query_vec = modelo.encode([query], normalize_embeddings=True).astype(np.float32)

    scores, indices = index_with_ids.search(query_vec, k=3)
    print(f"\n  Busqueda A (sin filtro, top-3):")
    for score, idx in zip(scores[0], indices[0]):
        doc = id_a_doc[idx]
        print(f"    [{doc['id']}] score={score:.4f} | categoria={doc['metadata']['categoria']}")

    # --- Busqueda B: con filtro (post-filtering — limitacion de FAISS) ---
    # PUENTE scratch: mismo filtro manual, pero FAISS no puede filtrar en el indice.
    # POST-filtering: pedir k_extra >> k y filtrar en Python. Ver guia §15.5 bloque B.5.
    # FAISS no tiene filtros nativos. Estrategia: pedir mas resultados y filtrar despues.
    filtro_categoria = "vacaciones"
    k_extra = 12  # pedir todos para garantizar encontrar 3 tras filtrar
    scores_all, indices_all = index_with_ids.search(query_vec, k=k_extra)

    print(f"\n  Busqueda B (filtro categoria={filtro_categoria}, top-3):")
    print(f"  [NOTA: FAISS usa post-filtering — se recuperan {k_extra}, luego se filtran]")
    filtrados = []
    for score, idx in zip(scores_all[0], indices_all[0]):
        doc = id_a_doc[idx]
        if doc["metadata"]["categoria"] == filtro_categoria:
            filtrados.append((score, doc))
        if len(filtrados) == 3:
            break

    for i, (score, doc) in enumerate(filtrados, 1):
        print(f"    {i}. [{doc['id']}] score={score:.4f} | categoria={doc['metadata']['categoria']}")

    if len(filtrados) < 3:
        print(f"    AVISO: solo {len(filtrados)} resultados pasan el filtro (hay {sum(1 for d in docs if d['metadata']['categoria']==filtro_categoria)} docs en '{filtro_categoria}')")

    # --- Persistencia en disco ---
    print("\n  Persistencia en disco:")
    faiss.write_index(index_with_ids, "/tmp/hr_policies.faiss")
    print("  Escrito: /tmp/hr_policies.faiss")
    index_recuperado = faiss.read_index("/tmp/hr_policies.faiss")
    print(f"  Leido de nuevo: {index_recuperado.ntotal} vectores")

    # --- HNSW como alternativa ---
    print("\n  Alternativa con HNSW (mayor recall en colecciones grandes):")
    index_hnsw = faiss.IndexHNSWFlat(dim, 16)  # M=16
    index_hnsw.add(embeddings.astype(np.float32))
    scores_hnsw, indices_hnsw = index_hnsw.search(query_vec, k=3)
    print(f"  Top-3 con HNSW:")
    for score, idx in zip(scores_hnsw[0], indices_hnsw[0]):
        doc = docs[idx]
        print(f"    [{doc['id']}] score={score:.4f} | categoria={doc['metadata']['categoria']}")


# ============================================================
# COMPARATIVA ChromaDB vs FAISS para este caso de uso
# ============================================================

def imprimir_comparativa():
    print("\n" + "="*60)
    print("  COMPARATIVA: ChromaDB vs FAISS para este taller")
    print("="*60)
    print("""
  Aspecto              ChromaDB                      FAISS
  -------------------  ----------------------------  ---------------------------
  Filtros metadata     Nativos (where=...)           Manual (post-filtering)
  CRUD completo        Si (add/update/delete/get)    Solo add + busqueda
  Persistencia         Automatica con PersistentClt  Manual (write_index/read)
  Codigo para este     ~20 lineas                    ~40 lineas
    taller
  Velocidad (12 docs)  Identica (trivial)            Identica (trivial)
  Velocidad (1M docs)  Buena (HNSW interno)          Extrema (C++, BLAS)
  Cuando elegir        RAG apps, demos, produccion   ML pipelines, escala masiva,
                       con filtros                   investigacion sin filtros

  CONCLUSION para este taller: ChromaDB es la eleccion natural.
  FAISS seria mejor si tuvieramos 10M+ documentos y sin filtros de metadata.

  En RAGorbit:
    store.chroma  →  usa ChromaDB internamente
    store.pgvector → usa Postgres + extension pgvector (similar a ChromaDB
                     pero con SQL completo para filtros complejos)
    store.qdrant  → usa Qdrant (mejor que ambos para escala + filtros avanzados)
""")


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    print("M3 · Taller — Solucion con Frameworks (ChromaDB + FAISS)")
    print("NOTA: requiere pip install chromadb faiss-cpu sentence-transformers")
    print("      y descarga del modelo BAAI/bge-base-en-v1.5 (~440 MB)")
    print()
    print("Ejecutando demos...")

    try:
        demo_chromadb()
    except ImportError as e:
        print(f"\n  [ChromaDB no disponible: {e}]")

    try:
        demo_faiss()
    except ImportError as e:
        print(f"\n  [FAISS no disponible: {e}]")

    imprimir_comparativa()

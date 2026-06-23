"""
M3 · Taller — Mini Vector Store de Politicas de RRHH
Capa 2: Python puro (stdlib). Sin pip, sin red. Determinista.

Ejecutar:
    python3 solucion_scratch.py

Requiere: solo Python 3.8+ stdlib (json, math, os, pathlib)
"""

import json
import math
import os
from pathlib import Path


# ---------------------------------------------------------------------------
# 1. Vocabulario de dominio (20 palabras clave de RRHH)
# ---------------------------------------------------------------------------
VOCAB = [
    "vacaciones", "dias", "permiso", "descanso", "festivo",
    "seguro", "medico", "beneficio", "bono", "salario",
    "horario", "jornada", "teletrabajo", "remoto", "extra",
    "formacion", "curso", "mentor", "restaurante", "ticket",
]


# ---------------------------------------------------------------------------
# 2. Embedding de juguete determinista (bag-of-words sobre VOCAB)
# ---------------------------------------------------------------------------
def embeder(texto: str) -> list:
    """Genera un vector de 20 dimensiones por conteo de palabras del vocabulario.

    Determinista: el mismo texto siempre produce el mismo vector.
    No requiere red ni pip.
    """
    tokens = texto.lower().split()
    vector = []
    for palabra in VOCAB:
        conteo = tokens.count(palabra)
        vector.append(float(conteo))
    return vector


# ---------------------------------------------------------------------------
# 3. Normalizacion L2
# ---------------------------------------------------------------------------
def normalizar(v: list) -> list:
    """Normaliza el vector a norma 1 (unitario).

    Si el vector es todo ceros, lo devuelve tal cual (sin division por cero).
    """
    norma = math.sqrt(sum(x * x for x in v))
    if norma == 0.0:
        return v
    return [x / norma for x in v]


# ---------------------------------------------------------------------------
# 4. Similitud coseno (producto punto de vectores normalizados)
# ---------------------------------------------------------------------------
def coseno(a: list, b: list) -> float:
    """Similitud coseno entre dos vectores.

    Con vectores normalizados, el producto punto ES la similitud coseno.
    Resultado en [0, 1] para vectores no negativos (como bag-of-words).
    """
    return sum(ai * bi for ai, bi in zip(a, b))


# ---------------------------------------------------------------------------
# 5. Cargar documentos y construir el store
# ---------------------------------------------------------------------------
def cargar_documentos(directorio: str) -> dict:
    """Carga los archivos JSON del directorio y construye el store en memoria.

    Store: { id -> { "vector": [...], "texto": str, "metadata": dict } }
    """
    store = {}
    ruta = Path(directorio)
    archivos = sorted(ruta.glob("doc_*.json"))

    if not archivos:
        raise FileNotFoundError(f"No se encontraron archivos doc_*.json en {directorio}")

    for archivo in archivos:
        with open(archivo, "r", encoding="utf-8") as f:
            doc = json.load(f)

        doc_id = doc["id"]
        texto = doc["texto"]
        metadata = doc["metadata"]

        vector_raw = embeder(texto)
        vector_norm = normalizar(vector_raw)

        store[doc_id] = {
            "vector": vector_norm,
            "texto": texto,
            "metadata": metadata,
        }

    return store


# ---------------------------------------------------------------------------
# 6. Busqueda top-K con filtro opcional de metadata
# ---------------------------------------------------------------------------
def buscar(query: str, store: dict, k: int = 3, filtro: dict = None) -> list:
    """Busca los k documentos mas similares a la query.

    Args:
        query:   Texto de la consulta.
        store:   Diccionario del vector store.
        k:       Numero de resultados a devolver.
        filtro:  Dict con un par {campo: valor} para filtrar por metadata.
                 Ejemplo: {"categoria": "vacaciones"}
                 Si es None, busca en todos los documentos.

    Returns:
        Lista de dicts [{id, score, texto, metadata}, ...] ordenada por score desc.
    """
    # Embedding de la query (normalizado)
    query_vec = normalizar(embeder(query))

    # Si el vector de la query es todo ceros (ninguna palabra del vocab aparece),
    # no podemos hacer una busqueda semantica util. Avisamos y devolvemos lista vacia.
    if all(x == 0.0 for x in query_vec):
        print("AVISO: la query no contiene palabras del vocabulario. No se puede calcular similitud.")
        return []

    # Filtrar candidatos segun metadata
    if filtro is not None:
        campo, valor = list(filtro.items())[0]
        candidatos = {
            doc_id: doc
            for doc_id, doc in store.items()
            if doc["metadata"].get(campo) == valor
        }
    else:
        candidatos = store

    if not candidatos:
        print(f"AVISO: ningun documento pasa el filtro {filtro}")
        return []

    # Calcular similitud coseno con todos los candidatos
    puntuaciones = []
    for doc_id, doc in candidatos.items():
        score = coseno(query_vec, doc["vector"])
        puntuaciones.append({
            "id": doc_id,
            "score": score,
            "texto": doc["texto"],
            "metadata": doc["metadata"],
        })

    # Ordenar por score descendente y devolver top-K
    puntuaciones.sort(key=lambda x: x["score"], reverse=True)
    return puntuaciones[:k]


# ---------------------------------------------------------------------------
# 7. Utilidades de impresion
# ---------------------------------------------------------------------------
def imprimir_resultados(titulo: str, resultados: list):
    """Imprime los resultados de una busqueda de forma clara."""
    print(f"\n{'='*60}")
    print(f"  {titulo}")
    print(f"{'='*60}")
    if not resultados:
        print("  (sin resultados)")
        return
    for i, r in enumerate(resultados, 1):
        cat = r["metadata"].get("categoria", "?")
        tema = r["metadata"].get("tema", "?")
        print(f"\n  {i}. [{r['id']}] score={r['score']:.4f}")
        print(f"     categoria: {cat} | tema: {tema}")
        print(f"     texto: {r['texto'][:90]}...")


# ---------------------------------------------------------------------------
# 8. Main: demo completa
# ---------------------------------------------------------------------------
def main():
    # Ruta a los datos (relativa al script)
    script_dir = Path(__file__).parent
    datos_dir = script_dir / "datos"

    print("\n" + "="*60)
    print("  M3 · Mini Vector Store — Politicas de RRHH")
    print("="*60)

    # --- Indexado ---
    print("\n[1/4] Cargando e indexando 12 documentos...")
    store = cargar_documentos(str(datos_dir))
    print(f"      {len(store)} documentos indexados.")

    # Mostrar resumen del store
    categorias = {}
    for doc in store.values():
        cat = doc["metadata"]["categoria"]
        categorias[cat] = categorias.get(cat, 0) + 1
    print("      Categorias:", dict(sorted(categorias.items())))

    # --- Query de prueba ---
    query = "dias de permiso y descanso que tengo derecho"
    print(f"\n[2/4] Query: \"{query}\"")

    # Mostrar el embedding de la query para fines didacticos
    vec_query = normalizar(embeder(query))
    dims_activas = [(VOCAB[i], round(vec_query[i], 4))
                    for i in range(len(VOCAB)) if vec_query[i] > 0]
    print(f"      Dimensiones activas en el embedding: {dims_activas}")

    # --- Busqueda A: sin filtro ---
    print("\n[3/4] Busqueda A — sin filtro, top-3")
    resultados_sin_filtro = buscar(query, store, k=3, filtro=None)
    imprimir_resultados("Busqueda A: sin filtro (top-3)", resultados_sin_filtro)

    # --- Busqueda B: con filtro de categoria ---
    filtro = {"categoria": "vacaciones"}
    print(f"\n[4/4] Busqueda B — con filtro {filtro}, top-3")
    resultados_con_filtro = buscar(query, store, k=3, filtro=filtro)
    imprimir_resultados(
        f"Busqueda B: con filtro categoria=vacaciones (top-3)",
        resultados_con_filtro
    )

    # --- Analisis comparativo ---
    print(f"\n{'='*60}")
    print("  ANALISIS COMPARATIVO")
    print(f"{'='*60}")

    if resultados_sin_filtro:
        top1_sin = resultados_sin_filtro[0]
        print(f"\n  Busqueda A top-1: [{top1_sin['id']}] "
              f"categoria={top1_sin['metadata']['categoria']} "
              f"score={top1_sin['score']:.4f}")

    if resultados_con_filtro:
        top1_con = resultados_con_filtro[0]
        print(f"  Busqueda B top-1: [{top1_con['id']}] "
              f"categoria={top1_con['metadata']['categoria']} "
              f"score={top1_con['score']:.4f}")

        cats_sin = [r["metadata"]["categoria"] for r in resultados_sin_filtro]
        cats_con = [r["metadata"]["categoria"] for r in resultados_con_filtro]
        print(f"\n  Categorias en A (sin filtro): {cats_sin}")
        print(f"  Categorias en B (con filtro): {cats_con}")
        print(f"\n  El filtro restringe los resultados a solo 'vacaciones'.")
        print(f"  Todos los resultados de B son de la categoria correcta: "
              f"{all(r['metadata']['categoria'] == 'vacaciones' for r in resultados_con_filtro)}")

    # --- Demostracion de operaciones tipo CRUD ---
    print(f"\n{'='*60}")
    print("  DEMO CRUD DEL STORE")
    print(f"{'='*60}")

    # Mostrar conteo inicial
    print(f"\n  Documentos antes de operaciones: {len(store)}")

    # Añadir un documento nuevo
    nuevo_id = "doc_13"
    nuevo_texto = "El plan de pensiones privado tiene aportacion de la empresa del 3% del salario bruto mensual."
    nuevo_metadata = {"categoria": "beneficios", "tema": "pension", "version": "2024", "departamento": "todos"}
    store[nuevo_id] = {
        "vector": normalizar(embeder(nuevo_texto)),
        "texto": nuevo_texto,
        "metadata": nuevo_metadata,
    }
    print(f"  Añadido {nuevo_id}. Total: {len(store)}")

    # Actualizar un documento existente (re-embeder)
    store["doc_01"]["texto"] = "Los empleados tienen derecho a 20 dias habiles de vacaciones anuales pagadas (nueva politica 2025)."
    store["doc_01"]["vector"] = normalizar(embeder(store["doc_01"]["texto"]))
    store["doc_01"]["metadata"]["version"] = "2025"
    print(f"  Actualizado doc_01 (nueva politica de vacaciones 2025).")

    # Eliminar un documento
    del store["doc_13"]
    print(f"  Eliminado doc_13. Total: {len(store)}")

    # Re-query tras la actualizacion
    print(f"\n  Re-query tras actualizar doc_01:")
    resultados_actualizados = buscar(query, store, k=3, filtro=None)
    for r in resultados_actualizados:
        print(f"    [{r['id']}] score={r['score']:.4f} v={r['metadata'].get('version','?')}")

    print(f"\n{'='*60}")
    print("  Taller completado. Ver expected.md para verificar resultados.")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()

"""
Taller M0 — Explorador de flow.json (stdlib pura)
Carga examples/09-hr-policy-assistant/flow.json, lista nodos y aristas,
e identifica el nodo de entrada y el de salida.

Uso:
    python3 rag-training/00-setup/lab/solucion_scratch.py
    # o desde la raíz del repo ragorbit
"""

import json
import pathlib
import sys


def cargar_flow(ruta: str) -> dict:
    """Lee el archivo JSON y devuelve el diccionario del flujo."""
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def listar_nodos(flow: dict) -> list[dict]:
    """Devuelve la lista de nodos con id y type."""
    return [{"id": n["id"], "type": n["type"], "label": n.get("label", "")}
            for n in flow.get("nodes", [])]


def listar_aristas(flow: dict) -> list[dict]:
    """Devuelve cada arista como source:sourcePort → target:targetPort."""
    result = []
    for e in flow.get("edges", []):
        result.append({
            "source": e["source"],
            "sourcePort": e["sourcePort"],
            "target": e["target"],
            "targetPort": e["targetPort"],
        })
    return result


def encontrar_entrada_salida(flow: dict) -> tuple[dict | None, list[dict]]:
    """
    Nodo de entrada: categoría 'io' cuyo tipo empieza por 'io.input'
                     O cualquier nodo sin aristas entrantes.
    Nodo de salida:  tipo 'io.output' O nodo sin aristas salientes.
    """
    nodes = flow.get("nodes", [])
    edges = flow.get("edges", [])

    targets = {e["target"] for e in edges}
    sources = {e["source"] for e in edges}

    # Estrategia 1: por tipo semántico (más robusto)
    nodo_entrada = next(
        (n for n in nodes if n["type"].startswith("io.input")), None
    )
    nodos_salida = [n for n in nodes if n["type"].startswith("io.output")]

    # Estrategia 2 (fallback): topológica — sin aristas entrantes / salientes
    if nodo_entrada is None:
        nodo_entrada = next(
            (n for n in nodes if n["id"] not in targets), None
        )
    if not nodos_salida:
        nodos_salida = [n for n in nodes if n["id"] not in sources]

    return nodo_entrada, nodos_salida


def main() -> None:
    # Resolver la ruta relativa al repo independientemente del cwd
    script_dir = pathlib.Path(__file__).resolve().parent          # lab/
    repo_root = script_dir.parents[2]                             # ragorbit/
    flow_path = repo_root / "examples" / "09-hr-policy-assistant" / "flow.json"

    if not flow_path.exists():
        sys.exit(f"ERROR: no encuentro {flow_path}")

    flow = cargar_flow(str(flow_path))

    # ── Cabecera ──────────────────────────────────────────────────────────
    meta = flow.get("flow", {})
    print(f"Flow: {meta.get('id')}  |  {meta.get('name')}")
    print(f"Target de despliegue: {meta.get('deploymentTarget')}")
    print()

    # ── Nodos ─────────────────────────────────────────────────────────────
    nodos = listar_nodos(flow)
    print(f"=== NODOS ({len(nodos)}) ===")
    for n in nodos:
        print(f"  id={n['id']:<20} type={n['type']}")
    print()

    # ── Aristas ───────────────────────────────────────────────────────────
    aristas = listar_aristas(flow)
    print(f"=== ARISTAS ({len(aristas)}) ===")
    for a in aristas:
        print(f"  {a['source']}:{a['sourcePort']}  →  {a['target']}:{a['targetPort']}")
    print()

    # ── Entrada / Salida ──────────────────────────────────────────────────
    entrada, salidas = encontrar_entrada_salida(flow)
    print("=== NODO DE ENTRADA ===")
    if entrada:
        print(f"  id={entrada['id']}  type={entrada['type']}  label={entrada.get('label','')}")
    else:
        print("  (no encontrado)")
    print()

    print(f"=== NODO(S) DE SALIDA ({len(salidas)}) ===")
    for s in salidas:
        print(f"  id={s['id']}  type={s['type']}  label={s.get('label','')}")


if __name__ == "__main__":
    main()

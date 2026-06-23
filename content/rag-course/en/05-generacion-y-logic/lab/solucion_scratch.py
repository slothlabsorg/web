"""
Taller M5 · Decisión estructurada con citas — Capa ② (solo stdlib)

Ejecutar: python3 solucion_scratch.py

No requiere ningún paquete externo. Demuestra:
  - Fake LLM determinista que extrae datos de chunks y calcula un score
  - Validación de JSON Schema con stdlib (sin jsonschema)
  - Groundedness check (citas ancladas en fuentes reales)
  - Regla determinista de umbral (lógica.rules)
  - Manejo del caso sin evidencia ("no_determinable")
"""

import json
import os
import re

# ---------------------------------------------------------------------------
# 1. JSON SCHEMA para la decisión de crédito
# ---------------------------------------------------------------------------

SCHEMA = {
    "type": "object",
    "required": ["decision", "score", "factores", "citations"],
    "properties": {
        "decision": {
            "type": "string",
            "enum": ["aprobar", "revisar", "rechazar", "no_determinable"]
        },
        "score": {
            "anyOf": [{"type": "integer", "minimum": 0, "maximum": 100},
                      {"type": "null"}]
        },
        "factores": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 1
        },
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["text", "source"],
                "properties": {
                    "text": {"type": "string"},
                    "source": {"type": "string"}
                }
            }
        }
    }
}


# ---------------------------------------------------------------------------
# 2. Validador de schema (stdlib — sin jsonschema)
# ---------------------------------------------------------------------------

def validar_schema(obj: dict) -> tuple[bool, str]:
    """
    Valida obj contra SCHEMA.
    Devuelve (True, "OK") o (False, "mensaje de error").
    Implementación minimalista que cubre los campos de este schema.
    """
    # Campos requeridos
    for campo in SCHEMA["required"]:
        if campo not in obj:
            return False, f"Campo requerido ausente: '{campo}'"

    props = SCHEMA["properties"]

    # decision: enum
    decision_enum = props["decision"]["enum"]
    if obj["decision"] not in decision_enum:
        return False, (
            f"'decision' debe ser uno de {decision_enum}, "
            f"pero es '{obj['decision']}'"
        )

    # score: int 0-100 o None
    score = obj["score"]
    if score is not None:
        if not isinstance(score, int):
            return False, f"'score' debe ser int o null, pero es {type(score).__name__}"
        if not (0 <= score <= 100):
            return False, f"'score' debe estar entre 0 y 100, pero es {score}"

    # factores: lista con al menos 1 string
    factores = obj["factores"]
    if not isinstance(factores, list) or len(factores) < 1:
        return False, "'factores' debe ser una lista con al menos 1 elemento"
    for i, f in enumerate(factores):
        if not isinstance(f, str):
            return False, f"'factores[{i}]' debe ser string"

    # citations: lista de objetos con text y source
    citations = obj["citations"]
    if not isinstance(citations, list):
        return False, "'citations' debe ser una lista"
    for i, c in enumerate(citations):
        if not isinstance(c, dict):
            return False, f"'citations[{i}]' debe ser un objeto"
        for campo in ["text", "source"]:
            if campo not in c:
                return False, f"'citations[{i}]' falta el campo '{campo}'"
            if not isinstance(c[campo], str):
                return False, f"'citations[{i}][{campo}]' debe ser string"

    return True, "OK"


# ---------------------------------------------------------------------------
# 3. Fake LLM determinista
# ---------------------------------------------------------------------------

def _extraer_numerico(chunks: list[dict], campo: str):
    """Busca un campo numérico en el metadata de cualquier chunk."""
    for chunk in chunks:
        val = chunk.get("metadata", {}).get(campo)
        if val is not None:
            return val
    return None


def fake_llm(chunks: list[dict], solicitud: str) -> dict:
    """
    Simula lo que haría un LLM con structured output:
    extrae datos financieros de los chunks y produce el JSON de decisión.

    Si no hay datos suficientes → devuelve objeto "no_determinable".
    """
    # --- Extraer valores numéricos clave ---
    ingreso = _extraer_numerico(chunks, "ingreso_anual")
    deuda = _extraer_numerico(chunks, "deuda_total")
    pagos_pct = _extraer_numerico(chunks, "pagos_puntuales_pct")
    antiguedad = _extraer_numerico(chunks, "antiguedad_laboral_anos")

    # Necesitamos al menos ingreso y uno más para calcular score válido
    datos_disponibles = sum(
        1 for v in [ingreso, deuda, pagos_pct, antiguedad] if v is not None
    )

    if datos_disponibles < 2 or ingreso is None:
        # Caso sin evidencia suficiente
        return {
            "decision": "no_determinable",
            "score": None,
            "factores": [
                "Datos financieros insuficientes para calcular score crediticio"
            ],
            "citations": [],
            "mensaje": (
                "No hay evidencia suficiente en los documentos proporcionados "
                "para determinar el score crediticio del solicitante."
            )
        }

    # --- Calcular score con la fórmula del taller ---
    # component_ingreso: hasta 30 pts (normalizado a $100,000)
    comp_ingreso = min(ingreso / 100_000, 1.0) * 30

    # component_deuda: hasta 30 pts (menor ratio deuda/ingreso = mejor)
    if deuda is not None:
        ratio_di = deuda / ingreso
        comp_deuda = max(1.0 - ratio_di, 0.0) * 30
    else:
        comp_deuda = 15.0  # valor neutro si no hay dato

    # component_pagos: hasta 25 pts
    if pagos_pct is not None:
        comp_pagos = (pagos_pct / 100.0) * 25
    else:
        comp_pagos = 12.5  # valor neutro

    # component_antiguedad: hasta 15 pts (normalizado a 10 años)
    if antiguedad is not None:
        comp_antiguedad = min(antiguedad / 10.0, 1.0) * 15
    else:
        comp_antiguedad = 7.5  # valor neutro

    score = int(comp_ingreso + comp_deuda + comp_pagos + comp_antiguedad)
    score = max(0, min(100, score))  # clamp 0–100

    # --- Construir factores con descripción ---
    factores = []
    citations = []

    for chunk in chunks:
        meta = chunk.get("metadata", {})
        doc_type = meta.get("doc_type", "")
        source = chunk["source"]

        if meta.get("ingreso_anual") is not None:
            factores.append(
                f"Ingreso anual declarado: ${meta['ingreso_anual']:,} "
                f"[{source}]"
            )
            citations.append({
                "text": f"Ingreso anual: ${meta['ingreso_anual']:,}",
                "source": source
            })

        if meta.get("pagos_puntuales_pct") is not None:
            factores.append(
                f"Historial de pagos puntuales: {meta['pagos_puntuales_pct']}% "
                f"[{source}]"
            )
            citations.append({
                "text": (
                    f"Pagos puntuales: {meta['pagos_puntuales_pct']}% "
                    "en los últimos 12 meses"
                ),
                "source": source
            })

        if meta.get("deuda_total") is not None and meta.get("antiguedad_laboral_anos") is not None:
            ratio = meta["deuda_total"] / ingreso
            factores.append(
                f"Ratio deuda/ingreso: {ratio:.1%} — "
                f"antigüedad laboral: {meta['antiguedad_laboral_anos']} años "
                f"[{source}]"
            )
            citations.append({
                "text": (
                    f"Deuda total: ${meta['deuda_total']:,}, "
                    f"antigüedad laboral: {meta['antiguedad_laboral_anos']} años"
                ),
                "source": source
            })

        if meta.get("reportes_negativos") == 0:
            factores.append(
                f"Sin reportes negativos en buró de crédito (últimos 24 meses) "
                f"[{source}]"
            )
            citations.append({
                "text": "Sin reportes negativos en los últimos 24 meses",
                "source": source
            })

    # La decisión tentativa del LLM (será sobreescrita por logic.rules)
    if score >= 70:
        decision_tentativa = "aprobar"
    elif score >= 40:
        decision_tentativa = "revisar"
    else:
        decision_tentativa = "rechazar"

    return {
        "decision": decision_tentativa,  # tentativa — logic.rules la sobreescribe
        "score": score,
        "factores": factores if factores else ["Score calculado a partir de datos disponibles"],
        "citations": citations
    }


# ---------------------------------------------------------------------------
# 4. Groundedness check
# ---------------------------------------------------------------------------

def verificar_groundedness(obj: dict, chunks: list[dict]) -> tuple[bool, str]:
    """
    Verifica que cada cita en obj["citations"] tenga un source
    que corresponda a alguno de los chunks del contexto.
    """
    if obj.get("decision") == "no_determinable":
        return True, "OK (no_determinable — citas vacías permitidas)"

    fuentes_disponibles = {chunk["source"] for chunk in chunks}
    citations = obj.get("citations", [])

    if not citations:
        return False, "citations está vacío — se requiere al menos una cita con evidencia"

    for i, cita in enumerate(citations):
        if cita["source"] not in fuentes_disponibles:
            return False, (
                f"citations[{i}] apunta a fuente desconocida: '{cita['source']}'. "
                f"Fuentes disponibles: {sorted(fuentes_disponibles)}"
            )

    return True, "OK"


# ---------------------------------------------------------------------------
# 5. Regla determinista de umbral (logic.rules)
# ---------------------------------------------------------------------------

REGLAS_UMBRAL = [
    {"when": lambda score: score is not None and score >= 70, "then": "aprobar"},
    {"when": lambda score: score is not None and score >= 40, "then": "revisar"},
]
REGLA_DEFAULT = "rechazar"


def aplicar_regla_umbral(obj: dict) -> dict:
    """
    Sobreescribe obj["decision"] con la decisión determinista basada en score.
    Si la decisión es "no_determinable", no modifica nada.

    Este nodo es el equivalente a logic.rules en RAGorbit.
    La regla es DETERMINISTA: el mismo score siempre produce la misma decisión.
    """
    resultado = dict(obj)

    if resultado.get("decision") == "no_determinable":
        return resultado  # caso sin evidencia — no aplica la regla

    score = resultado.get("score")
    decision_llm = resultado.get("decision", "?")

    decision_final = REGLA_DEFAULT
    for regla in REGLAS_UMBRAL:
        if regla["when"](score):
            decision_final = regla["then"]
            break

    resultado["decision"] = decision_final
    resultado["_decision_llm_original"] = decision_llm  # para auditoría

    return resultado


# ---------------------------------------------------------------------------
# 6. Pipeline completo
# ---------------------------------------------------------------------------

def procesar_expediente(ruta: str) -> dict:
    """Pipeline: cargar → fake_llm → validar_schema → groundedness → regla."""
    with open(ruta, encoding="utf-8") as f:
        expediente = json.load(f)

    chunks = expediente["chunks"]
    solicitud = expediente["solicitud"]
    expediente_id = expediente["expediente_id"]

    print(f"\n{'='*60}")
    print(f"Procesando: {expediente_id}")
    print(f"Solicitante: {expediente['solicitante']}")
    print(f"Solicitud: {solicitud}")
    print(f"{'='*60}")

    # Paso 1: Fake LLM (equivalente a logic.structured)
    resultado = fake_llm(chunks, solicitud)
    print(f"\n[fake_llm] Score calculado: {resultado['score']}")
    print(f"[fake_llm] Decision tentativa: {resultado['decision']}")

    # Paso 2: Validar schema (equivalente a la validación de logic.structured)
    valido, msg_schema = validar_schema(resultado)
    if not valido:
        print(f"[schema] ERROR: {msg_schema}")
        return {"error": "schema_invalido", "detalle": msg_schema}
    print(f"[schema] Validación: OK")

    # Paso 3: Groundedness check (equivalente a logic.citations en modo enforce)
    grounded, msg_ground = verificar_groundedness(resultado, chunks)
    if not grounded:
        print(f"[groundedness] ERROR: {msg_ground}")
        return {"error": "groundedness_fallo", "detalle": msg_ground}
    print(f"[groundedness] {msg_ground}")

    # Paso 4: Regla determinista de umbral (equivalente a logic.rules)
    resultado = aplicar_regla_umbral(resultado)
    print(f"[logic.rules] Decision final: {resultado['decision']}")
    if "_decision_llm_original" in resultado:
        print(
            f"[logic.rules] Decision LLM original: "
            f"{resultado['_decision_llm_original']} "
            f"(sobreescrita por la regla determinista)"
        )

    return resultado


# ---------------------------------------------------------------------------
# 7. Punto de entrada
# ---------------------------------------------------------------------------

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    datos_dir = os.path.join(base, "datos")

    expedientes = [
        os.path.join(datos_dir, "expediente_001.json"),
        os.path.join(datos_dir, "expediente_002.json"),
    ]

    resultados = []
    for ruta in expedientes:
        resultado = procesar_expediente(ruta)
        resultados.append(resultado)
        print("\n--- Resultado JSON final ---")
        print(json.dumps(resultado, ensure_ascii=False, indent=2))

    # Verificaciones post-ejecución
    print("\n" + "="*60)
    print("VERIFICACIONES FINALES")
    print("="*60)

    r001, r002 = resultados[0], resultados[1]

    # Expediente 001: debe ser válido con citas y con decisión de regla
    assert "error" not in r001, f"Expediente 001 produjo error: {r001}"
    assert r001["decision"] in ("aprobar", "revisar", "rechazar"), \
        f"Expediente 001: decision inesperada: {r001['decision']}"
    assert len(r001["citations"]) >= 1, "Expediente 001: citations vacío"
    assert r001["score"] is not None, "Expediente 001: score es None"
    print(f"[001] decision={r001['decision']} score={r001['score']} "
          f"citations={len(r001['citations'])} ✓")

    # Expediente 002: debe ser no_determinable
    assert "error" not in r002, f"Expediente 002 produjo error: {r002}"
    assert r002["decision"] == "no_determinable", \
        f"Expediente 002: se esperaba 'no_determinable', pero es '{r002['decision']}'"
    print(f"[002] decision={r002['decision']} ✓")

    print("\nTodas las verificaciones pasaron.")


if __name__ == "__main__":
    main()

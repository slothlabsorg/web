# Requiere: pip install instructor pydantic ragas langchain-anthropic langchain-chroma
"""
Taller M5 · Decisión estructurada con citas — Capa ③ (frameworks reales)

Este archivo es ILUSTRATIVO: muestra cómo se haría en producción con:
  - Pydantic para el schema de la decisión
  - instructor para structured output con Claude/OpenAI + reintentos
  - RAGAS para evaluar faithfulness y answer relevancy
  - LangChain (LCEL) como alternativa a instructor

NO se ejecuta en el entorno del curso (requiere pip + claves API).
Ejecutar cuando tengas: pip install instructor pydantic ragas langchain-anthropic
"""

# =============================================================================
# PARTE A — Schema con Pydantic
# Reemplaza: SCHEMA dict + validar_schema() de solucion_scratch.py
# Enseñanza: guia.md §10.3
# =============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional


class Cita(BaseModel):
    text: str = Field(..., min_length=1, description="Fragmento literal del documento fuente")
    source: str = Field(..., min_length=1, description="Nombre del archivo o documento")


class DecisionCredito(BaseModel):
    """Schema completo de la decisión de crédito."""
    decision: str = Field(
        ...,
        description="Decisión final: aprobar, revisar, rechazar o no_determinable"
    )
    score: Optional[int] = Field(
        None,
        ge=0, le=100,
        description="Score crediticio 0–100; null si no hay evidencia"
    )
    factores: list[str] = Field(
        ...,
        min_length=1, max_length=5,
        description="Factores principales que sustentan la puntuación"
    )
    justificacion: str = Field(
        ...,
        min_length=50,
        description="Razonamiento narrativo del score con referencias"
    )
    citations: list[Cita] = Field(
        ...,
        description="Citas a los documentos fuente"
    )
    nivel_riesgo: Optional[str] = Field(
        None,
        description="Clasificación cualitativa: bajo, medio, alto"
    )

    @field_validator("decision")
    @classmethod
    def decision_valida(cls, v):
        opciones = {"aprobar", "revisar", "rechazar", "no_determinable"}
        if v not in opciones:
            raise ValueError(f"decision debe ser una de {opciones}, recibido: '{v}'")
        return v

    @field_validator("nivel_riesgo")
    @classmethod
    def nivel_valido(cls, v):
        if v is not None and v not in {"bajo", "medio", "alto"}:
            raise ValueError(f"nivel_riesgo debe ser 'bajo', 'medio' o 'alto'")
        return v


# =============================================================================
# PARTE B — Structured output con instructor + Claude
# Reemplaza: fake_llm() + json.loads() de solucion_scratch.py
# Enseñanza: guia.md §10.4
# =============================================================================

def evaluar_credito_con_instructor(chunks: list[dict], solicitud: str) -> DecisionCredito:
    """
    Usa instructor para obtener salida estructurada de Claude.
    instructor envía el schema Pydantic como tool al LLM y valida/reintenta.
    """
    import instructor
    from anthropic import Anthropic

    client = instructor.from_anthropic(Anthropic())

    # Preparar el contexto de chunks para el prompt
    contexto_chunks = "\n\n".join([
        f"--- Chunk {i+1} [{chunk['source']}] ---\n{chunk['text']}"
        for i, chunk in enumerate(chunks)
    ])

    prompt = f"""Eres un analista de crédito. Evalúa la siguiente solicitud usando SOLO la información
de los documentos proporcionados. Si no hay información suficiente, usa decision="no_determinable".

SOLICITUD:
{solicitud}

DOCUMENTOS:
{contexto_chunks}

Produce la evaluación en el formato JSON requerido. Para cada factor, cita el documento fuente exacto.
Si no hay datos financieros suficientes (ingreso, historial de pagos, deuda), marca como no_determinable."""

    decision = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
        response_model=DecisionCredito,
        max_retries=3,  # instructor reintenta hasta 3 veces si la validación falla
    )
    return decision


# =============================================================================
# PARTE C — Structured output con LangChain (LCEL) + with_structured_output
# Alternativa a Parte B; requiere M1 §11 (LCEL, ChatPromptTemplate, operador |)
# Enseñanza: guia.md §10.5
# =============================================================================

def evaluar_credito_con_langchain(chunks: list[dict], solicitud: str) -> DecisionCredito:
    """
    Alternativa con LangChain: usa with_structured_output que internamente
    usa tool-calling de Claude/OpenAI.
    """
    from langchain_anthropic import ChatAnthropic
    from langchain_core.prompts import ChatPromptTemplate

    llm = ChatAnthropic(model="claude-opus-4-8", temperature=0.1)
    structured_llm = llm.with_structured_output(DecisionCredito)

    template = ChatPromptTemplate.from_messages([
        ("system", "Eres un analista de crédito. Responde SOLO con los datos de los documentos. "
                   "Si no hay datos suficientes, usa decision='no_determinable'."),
        ("human", "Solicitud: {solicitud}\n\nDocumentos:\n{contexto}")
    ])

    chain = template | structured_llm

    contexto = "\n\n".join([
        f"[{chunk['source']}]: {chunk['text']}" for chunk in chunks
    ])

    return chain.invoke({"solicitud": solicitud, "contexto": contexto})


# =============================================================================
# PARTE D — Evaluación con RAGAS
# Equivalente semántico (más profundo) a verificar_groundedness() de scratch
# Enseñanza: guia.md §10.6
# =============================================================================

def evaluar_con_ragas(
    pregunta: str,
    respuesta: str,
    chunks_recuperados: list[str],
    respuesta_ideal: str
) -> dict:
    """
    Evalúa faithfulness y answer_relevancy con RAGAS.

    Parámetros:
      - pregunta: la solicitud original
      - respuesta: el JSON generado (como string)
      - chunks_recuperados: textos de los chunks
      - respuesta_ideal: ground truth (respuesta correcta conocida)
    """
    from ragas import evaluate
    from ragas.metrics import faithfulness, answer_relevancy, context_precision
    from datasets import Dataset

    data = {
        "question": [pregunta],
        "answer": [respuesta],
        "contexts": [chunks_recuperados],
        "ground_truth": [respuesta_ideal]
    }

    dataset = Dataset.from_dict(data)
    resultado = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy, context_precision]
    )
    return dict(resultado)


# =============================================================================
# PARTE E — Regla determinista (igual que en scratch — NO va en el LLM)
# Copia directa de aplicar_regla_umbral() — solo adaptada a objeto Pydantic
# Enseñanza: guia.md §10.7 Parte E, guia.md §4
# =============================================================================

def aplicar_regla_umbral(decision: DecisionCredito) -> DecisionCredito:
    """
    Regla determinista sobre el score.
    IMPORTANTE: esta lógica nunca va dentro del LLM — es Python puro.
    """
    if decision.decision == "no_determinable" or decision.score is None:
        return decision

    if decision.score >= 70:
        decision.decision = "aprobar"
    elif decision.score >= 40:
        decision.decision = "revisar"
    else:
        decision.decision = "rechazar"

    return decision


# =============================================================================
# PARTE F — Pipeline completo ilustrativo
# Orden: instructor → regla determinista → RAGAS (ver guia.md §10.7)
# =============================================================================

def pipeline_framework(ruta_expediente: str) -> dict:
    """
    Pipeline completo con frameworks.
    Requiere: ANTHROPIC_API_KEY en el entorno.
    """
    import json
    import os

    with open(ruta_expediente, encoding="utf-8") as f:
        expediente = json.load(f)

    chunks = expediente["chunks"]
    solicitud = expediente["solicitud"]

    print(f"Procesando {expediente['expediente_id']} con instructor...")

    # Paso 1: Structured output con instructor
    decision = evaluar_credito_con_instructor(chunks, solicitud)
    print(f"Score LLM: {decision.score}, Decision LLM: {decision.decision}")

    # Paso 2: Regla determinista
    decision = aplicar_regla_umbral(decision)
    print(f"Decision final (post-regla): {decision.decision}")

    # Paso 3: Evaluar con RAGAS
    respuesta_str = decision.model_dump_json(indent=2)
    chunks_texts = [c["text"] for c in chunks]

    metricas = evaluar_con_ragas(
        pregunta=solicitud,
        respuesta=respuesta_str,
        chunks_recuperados=chunks_texts,
        respuesta_ideal=f"score esperado basado en datos del expediente, decision: {decision.decision}"
    )
    print(f"RAGAS — faithfulness: {metricas.get('faithfulness', 'n/a'):.2f}, "
          f"answer_relevancy: {metricas.get('answer_relevancy', 'n/a'):.2f}")

    return {
        "decision": decision.model_dump(),
        "metricas_ragas": metricas
    }


# =============================================================================
# Ejemplo de uso (comentado — requiere API key)
# =============================================================================

if __name__ == "__main__":
    print("solucion_framework.py — archivo ilustrativo")
    print("Para ejecutar, instala: pip install instructor pydantic ragas langchain-anthropic")
    print("y configura ANTHROPIC_API_KEY en tu entorno.")
    print()
    print("Ejemplo de uso:")
    print()
    print("  from solucion_framework import pipeline_framework")
    print("  resultado = pipeline_framework('datos/expediente_001.json')")
    print("  print(resultado['decision'])")
    print()

    # Demostración del schema Pydantic (sin LLM — solo validación)
    print("Demo de validación Pydantic (sin LLM):")
    try:
        decision_valida = DecisionCredito(
            decision="aprobar",
            score=84,
            factores=["Ingreso estable de $85,000 anuales"],
            justificacion="El solicitante muestra un perfil crediticio sólido con "
                          "ingreso estable, baja ratio deuda/ingreso y excelente historial.",
            citations=[Cita(text="Ingreso anual: $85,000", source="declaracion_fiscal_2023.pdf")]
        )
        print(f"  Decisión válida creada: {decision_valida.decision}, score={decision_valida.score}")
    except Exception as e:
        print(f"  Error de validación: {e}")

    try:
        decision_invalida = DecisionCredito(
            decision="QUIZAS",  # inválido
            score=84,
            factores=["Factor 1"],
            justificacion="Justificación de prueba para verificar validación del campo decision.",
            citations=[]
        )
    except Exception as e:
        print(f"  Decisión inválida rechazada correctamente: {e}")

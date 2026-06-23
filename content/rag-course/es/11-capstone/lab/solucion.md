# M11 · Soluciones del taller capstone

> Explicación de la ruta 09→02→01, solución de referencia del scratch/framework, diseño de referencia del Reto 2 y rúbrica de experto.

---

## 1. Ruta de reconstrucción 09 → 02 → 01

### 1.1 Por qué este orden

| Paso | Template | Habilidad nueva | Nodos añadidos respecto al anterior |
|------|----------|-----------------|-------------------------------------|
| 1 | 09 RRHH | RAG lineal + citas | io, loader, ingest, store, retrieval, model, logic |
| 2 | 02 Banca | Batch + metadata + rules | io.batch, loader.tabular, ingest.metadata, logic.structured, logic.rules, pgvector |
| 3 | 01 Aerolínea | Agente + guardrails + RAG-tool | agent.react, tool.*, guardrail.*, observability.audit |

Si el 09 no pasa tests, no avances: es el **MV-RAG** del que depende todo.

### 1.2 Mapa mental de dependencias

```
09:  embed → retrieve → prompt → cite
      ↓
02:  + metadata filter + structured JSON + rules (determinista)
      ↓
01:  + agent loop + tools + PolicyRAG + guardrails + audit
```

---

## 2. Solución scratch — Template 09

### 2.1 Arquitectura del script

`solucion_scratch.py` implementa el pipeline completo del template 09 con stdlib:

| Bloque | Nodo RAGorbit equivalente |
|--------|---------------------------|
| `cargar_chunks()` | `loader.pdf` + `ingest.chunker` |
| `embed()` + `VectorStore` | `model.embedding` + `store.chroma` |
| `store.retrieve()` | `retrieval.vector` (topK=4) |
| `construir_prompt()` | `logic.prompt` |
| `fake_llm()` | `model.llm` (stub determinista) |
| `aplicar_citas()` | `logic.citations` enforce |

### 2.2 Por qué bag-of-words devuelve índices 1, 0, 7, 3

El chunk §4 (índice 1) repite más veces "años" y "días" que §3 (índice 0), aunque §3 contiene la respuesta exacta ("18 días a los 3 años"). Esto es **intencional pedagógicamente**: demuestra la limitación del embedding de juguete y justifica `model.embedding` real en producción.

El `fake_llm` busca el patrón "3 años" + "18 días" en chunks y produce respuesta correcta con cita §3.

### 2.3 Verificación

```bash
cd lab && python3 solucion_scratch.py
```

Debe coincidir con [`expected.md`](expected.md).

---

## 3. Solución framework — Template 09

Ver [`solucion_framework.py`](solucion_framework.py) bloque por bloque con [guía §12](../guia.md#12-la-capa--explicada-cómo-reconstruir-un-template-con-framework).

**Resumen de correspondencia scratch → LangChain:**

| Scratch | Framework |
|---------|-----------|
| `cargar_chunks()` | `TextLoader` + `CharacterTextSplitter` |
| `embed()` | `OpenAIEmbeddings` |
| `VectorStore` | `Chroma.from_documents()` |
| `store.retrieve()` | `retriever.invoke()` |
| `construir_prompt()` | `ChatPromptTemplate` |
| `fake_llm()` | `ChatOpenAI` / `ChatAnthropic` |
| `aplicar_citas()` | `enforce_citations()` post-chain |

---

## 4. Guía de reconstrucción — Template 02 (banca)

### 4.1 Scratch — piezas adicionales

1. **Loaders múltiples:** leer `declaracion_2023.txt`, `estado_cuenta_q3.txt`, `datos_financieros.csv` de `datos/applicants/applicant_001/`.
2. **Metadata:** cada chunk lleva `doc_type` y `period`.
3. **Hard-filter:** `retrieve(query, filters={"period": "2023"})`.
4. **Structured stub:**

```python
def fake_structured_llm(chunks) -> dict:
    return {
        "score": 72,
        "decision": "aprobar",  # será sobrescrito
        "factores": [
            "Ingresos $85,000 [declaracion_2023.txt §Ingresos]",
            "Pagos puntuales 97% [estado_cuenta_q3.txt §Historial]",
            "Ratio deuda/ingreso 14% [datos_financieros.csv]",
        ],
        "justificacion": "Perfil sólido documentado en expediente 001.",
    }
```

5. **Rules:**

```python
def apply_rules(result: dict) -> dict:
    s = result["score"]
    if s >= 70:
        result["decision"] = "aprobar"
    elif s >= 40:
        result["decision"] = "revisar"
    else:
        result["decision"] = "rechazar"
    return result
```

### 4.2 Framework

- `CSVLoader` + `TextLoader` → `RecursiveCharacterTextSplitter`
- `PGVector` con `filter` en retriever
- `llm.with_structured_output(CreditDecision)` (M5)
- `apply_rules()` después del invoke

---

## 5. Guía de reconstrucción — Template 01 (aerolínea)

### 5.1 Scratch — estructura ReAct

Reutiliza patrones de [`06-agentes-i/lab/solucion_scratch.py`](../../06-agentes-i/lab/solucion_scratch.py):

```python
TOOLS = {
    "ReservationService": get_itinerary,
    "policy_rag": policy_rag,  # con hard-filters
    "InventoryService": search_flights,
    "PricingService": calculate_delta,
    "PaymentService": wrapped_payment,  # idempotency→confirm→resilience
}
```

**Turno 1:** usuario pide cambio → agente consulta PNR → PolicyRAG → inventario → pricing → informa costo + pide confirmación.

**Turno 2:** usuario confirma → PaymentService → `captured` → audit log.

**Turno 3 (mismo pnr+session):** PaymentService → `deduplicated`.

### 5.2 Framework

- LangGraph `StateGraph` (M6 §8)
- `@tool` para cada servicio
- `MemorySaver` + `thread_id` para multi-turno
- Callback de audit en cada tool call

---

## 6. Diseño de referencia — Reto 2 (telemedicina)

Brief: [`datos/brief_telemedicina.json`](datos/brief_telemedicina.json).

### 6.1 Diagrama propuesto

```
[INGESTA]
  loader.pdf (guías por plan)
    → ingest.chunker (by-section)
    → ingest.metadata (plan, condition, effective_date)
    → store.pgvector (clinical_guidelines)
    ← model.embedding (local: true)

[RUNTIME]
  io.stt ──Message──▶ model.intent ──Query──▶ query.rewrite
  io.input ──Message──┘                              │
                                                     ▼
  PatientHistoryService (tool.service) ◀── agent.react ──▶ tool.retriever (GuidelinesRAG)
                              │              ▲              hardFilters: plan, condition
                              │              └── model.llm
                              ▼
                        logic.citations (enforce)
                              ▼
                        hitl.escalate (severidad alta | sin criterio)
                              ▼
                        io.panel (cite: true)
                              ▼
                        observability.audit (HIPAA-safe)
```

### 6.2 Justificaciones clave

| Decisión | Por qué | Alternativa descartada |
|----------|---------|------------------------|
| `agent.react` | Orden impredecible: cobertura → guía → escalación | Pipeline fijo — no combina EHR + guías dinámicamente |
| hardFilters plan/condition | PHI + precisión clínica | Prompt "busca solo PPO" — anti-patrón |
| `model.embedding local: true` | PHI no sale del VPC | OpenAI embeddings — viola restricción |
| `io.panel` | Copilot lateral <2s (template 07) | `io.output` al paciente — interrumpe videollamada |
| `hitl.escalate` | Compliance casos críticos | LLM decide escalar — anti-patrón |

### 6.3 Validación

Importar `flow.json` en RAGorbit → Validar → Probar con mocks con las 3 preguntas del brief.

---

## 7. Rúbrica de experto (Reto 3)

### 7.1 Escala por dimensión (1–4)

| Puntos | Correctitud | Justificación | Producción | Seguridad | Claridad |
|--------|-------------|---------------|------------|-----------|----------|
| 4 | 0 errores contrato; nodos correctos | Cada nodo con trade-off y alternativa | idempotencia/audit/latencia cubiertos | PHI, hard-filters, guardrails | Diagrama + defensa impecables |
| 3 | 1 error menor | Mayoría justificada | 2/3 aspectos | 1 gap menor | Comprensible con preguntas |
| 2 | Errores de puerto | Justificaciones vagas | Solo menciona "producción" | Omite PHI | Confuso en partes |
| 1 | Grafo inválido | Sin alternativas | Sin consideración ops | Sin seguridad | No defendible |

### 7.2 Umbral experto

- **Reto 1:** 3 templates con tests equivalentes a mocks del codegen.
- **Reto 2:** flow válido + justificación ≥ 3 en cada dimensión.
- **Reto 3:** examen ≥ 40/50 + defensa media ≥ 3.0/4.0.

### 7.3 Preguntas trampa de la defensa

1. "¿Por qué no pusiste `logic.rules` en telemedicina?" — Respuesta: no hay umbral numérico único; la decisión clínica es escalación HITL, no aprobar/rechazar automático.
2. "¿Dónde está el anti-patrón de filtros en prompt?" — Señalar hardFilters en GuidelinesRAG.
3. "¿Qué va en CI vs nightly?" — rules/guardrails en CI; faithfulness RAGAS nightly.

---

## 8. Errores comunes y cómo evitarlos

| Error | Síntoma | Fix |
|-------|---------|-----|
| Sin hard-filters en 02 | Chunks de otro expediente | metadata + filter en retrieve |
| LLM decide aprobar/rechazar | decision incoherente con score | `logic.rules` después |
| Payment sin wrappers | doble cobro | cadena idempotency→confirm |
| Citas solo en prompt | alucinación sin fuente | `logic.citations` enforce |
| Agente para 50k eventos | timeout/costo | fan-out + rules |

---

⬅️ [Enunciado](enunciado.md) · [Expected](expected.md) · [Guía](../guia.md)

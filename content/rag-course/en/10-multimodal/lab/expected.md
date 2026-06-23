# Expected — MRO multimodal pipeline

> Concrete result produced by `solucion_scratch.py` when running `python3 solucion_scratch.py`.
> Verified in the course environment (stdlib only).

---

## Console output (summary)

```
============================================================
PIPELINE MULTIMODAL MRO — stdlib, determinista
============================================================

[1/4] STT (transcript mock)
  → Técnico en rampa. Detectamos fuga de fluido hidráulico en el actuador del tren d...

[2/4] Visión (descripción mock)
  → Fotografía del tren de aterrizaje principal izquierdo de un Airbus A320. Se obse...

[3/4] Retrieval (top chunks)
  • amm-32-11-00-001 (score=0.4356) — AMM-A320#32-11-00#rev45
  • amm-32-11-00-200-001 (score=0.3167) — AMM-A320#32-11-00-200-001#rev45

[4/4] Respuesta citada
**Hallazgo multimodal:** la nota de voz reporta fuga hidráulica en MLG del A320; la imagen confirma fuga activa en el actuador de retracción.

**Procedimiento aplicable** (según AMM-A320#32-11-00#rev45):
AMM 32-11-00 — Inspección del Tren de Aterrizaje Principal (MLG). Rev. 45 (2026-01-15). Paso 1: Inspeccionar visualmente el actuador de retracción en busca de fugas de fluido hidráulico (Skydrol). Paso 2: Si hay fuga activa, aplicar procedimiento 32-11-00-200-001 antes de liberar la aeronave.

**Acción correctiva referenciada** (AMM-A320#32-11-00-200-001#rev45):
AMM 32-11-00-200-001 — Reparación de fuga en actuador MLG. Rev. 45. WARNING: No operar el sistema hidráulico con fuga activa. Aislar circuito hidráulico verde, drenar residual, reemplazar junta del cilindro P/N 32-ACT-447 según torque 28 N·m (tabla 32-11-T01).

**Recomendación:** seguir pasos del AMM 32-11-00 antes de liberar la aeronave. Revisión vigente: 45.

⚠️ **WARNING detectado** — escalar a inspector certificado (hitl.escalate).

Todas las verificaciones pasaron.
```

---

## Output JSON (source of truth)

```json
{
  "transcript": "Técnico en rampa. Detectamos fuga de fluido hidráulico en el actuador del tren de aterrizaje principal del A320. ¿Cuál es el procedimiento de inspección según el AMM sección 32-11-00?",
  "image_description": "Fotografía del tren de aterrizaje principal izquierdo de un Airbus A320. Se observa mancha verde-amarilla de fluido hidráulico (Skydrol) en el actuador de retracción del MLG. Gota activa en la junta del cilindro. Corrosión superficial leve en el bracete inferior.",
  "vision_metadata": {
    "aircraft_type": "A320",
    "ata_chapter": "32",
    "ata_section": "32-11-00",
    "severity_hint": "WARNING"
  },
  "retrieved_chunks": [
    {
      "id": "amm-32-11-00-001",
      "source": "AMM-A320#32-11-00#rev45",
      "score": 0.4356
    },
    {
      "id": "amm-32-11-00-200-001",
      "source": "AMM-A320#32-11-00-200-001#rev45",
      "score": 0.3167
    }
  ],
  "citations": [
    "AMM-A320#32-11-00#rev45",
    "AMM-A320#32-11-00-200-001#rev45"
  ],
  "escalate_hitl": true
}
```

---

## Properties that must hold

1. **Transcript present:** field `transcript` non-empty, matches `audio_notificacion.json`.
2. **Description present:** field `image_description` non-empty, matches `foto_fuga.json`.
3. **Mandatory citations:** `citations` has at least 1 element; includes `AMM-A320#32-11-00#rev45`.
4. **Hard filter:** retrieved chunks are `aircraft_type=A320` and `ata_chapter=32` only (B737 does not appear).
5. **Expected top-2:** `amm-32-11-00-001` score 0.4356, `amm-32-11-00-200-001` score 0.3167.
6. **HITL:** `escalate_hitl` is `true` because `severity_hint=WARNING`.
7. **Stdlib only:** runs with `python3 solucion_scratch.py` without pip or network.

---

## Automatic script checks

```python
assert result["transcript"]
assert result["image_description"]
assert result["citations"]
assert "AMM-A320#32-11-00#rev45" in result["citations"]
assert result["escalate_hitl"] is True
assert "WARNING" in result["answer"]
```

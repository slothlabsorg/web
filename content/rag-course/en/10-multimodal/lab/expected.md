# Expected — MRO multimodal pipeline

> Concrete result produced by `solucion_scratch.py` when running `python3 solucion_scratch.py`.
> Verified in the course environment (stdlib only).

---

## Console output (summary)

```
============================================================
MULTIMODAL MRO PIPELINE — stdlib, deterministic
============================================================

[1/4] STT (mock transcript)
  → Ramp technician. We detected a hydraulic fluid leak in the main landing gear act...

[2/4] Vision (mock description)
  → Photograph of the left main landing gear of an Airbus A320. An active green-yell...

[3/4] Retrieval (top chunks)
  • amm-32-11-00-001 (score=0.4356) — AMM-A320#32-11-00#rev45
  • amm-32-11-00-200-001 (score=0.3167) — AMM-A320#32-11-00-200-001#rev45

[4/4] Cited response
**Multimodal finding:** the voice note reports a hydraulic leak in the A320 MLG; the image confirms an active leak on the retraction actuator.

**Applicable procedure** (per AMM-A320#32-11-00#rev45):
AMM 32-11-00 — Main Landing Gear (MLG) Inspection. Rev. 45 (2026-01-15). Step 1: Visually inspect the retraction actuator for hydraulic fluid leaks (Skydrol). Step 2: If there is an active leak, apply procedure 32-11-00-200-001 before releasing the aircraft.

**Referenced corrective action** (AMM-A320#32-11-00-200-001#rev45):
AMM 32-11-00-200-001 — MLG Actuator Leak Repair. Rev. 45. WARNING: Do not operate the hydraulic system with an active leak. Isolate the green hydraulic circuit, drain residual fluid, replace the cylinder seal P/N 32-ACT-447 per torque 28 N·m (table 32-11-T01).

**Recommendation:** follow AMM 32-11-00 steps before releasing the aircraft. Current revision: 45.

⚠️ **WARNING detected** — escalate to certified inspector (hitl.escalate).

All checks passed.
```

---

## Output JSON (source of truth)

```json
{
  "transcript": "Ramp technician. We detected a hydraulic fluid leak in the main landing gear actuator of the A320. What is the inspection procedure according to AMM section 32-11-00?",
  "image_description": "Photograph of the left main landing gear of an Airbus A320. An active green-yellow hydraulic fluid (Skydrol) stain is observed on the MLG retraction actuator. Active drop on the cylinder seal. Minor surface corrosion on the lower bracket.",
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

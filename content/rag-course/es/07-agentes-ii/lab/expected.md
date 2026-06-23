# Expected — Multi-Agente Rebooking de Disrupción

> Resultado concreto producido por `solucion_scratch.py` al ejecutar `python3 solucion_scratch.py`.
> Verificado en el entorno del curso (solo stdlib).

---

## Salida completa

```
======================================================================
MULTI-AGENTE — REBOOKING DISRUPCIÓN LOGÍSTICA (stdlib, determinista)
======================================================================
Evento: Cierre del hub MIA por tormenta tropical
Hub: MIA | Causa: weather
Envíos a procesar: 6
======================================================================

--- SHP-20240614-00742 ---
  [priority_rules] SHP-20240614-00742 → P2 / track=simple
  [profile_agent] tier=standard, email=cliente@example.com
  [policy_agent] cause=weather → penalty=$0, comp=$0
  [alternatives_agent] 1 alternativas: ['ALT-881']
  [autoconfirm_agent] Confirmado ALT-881 (ETA +6h)
  [notify] canales=['email', 'push'] → cliente@example.com
  → handler=auto_confirm | auto_confirmed=True | alt=ALT-881
  → Auto-confirmado ALT-881 (+6h, sin penalidad)

--- SHP-20240614-00815 ---
  [priority_rules] SHP-20240614-00815 → P3 / track=simple
  [profile_agent] tier=standard, email=ops@retailco.com
  [policy_agent] cause=weather → penalty=$0, comp=$0
  [alternatives_agent] 1 alternativas: ['ALT-902']
  [autoconfirm_agent] Confirmado ALT-902 (ETA +10h)
  [notify] canales=['email'] → ops@retailco.com
  → handler=auto_confirm | auto_confirmed=True | alt=ALT-902
  → Auto-confirmado ALT-902 (+10h, sin penalidad)

--- SHP-20240614-00189 ---
  [priority_rules] SHP-20240614-00189 → P1 / track=complex
  [profile_agent] tier=premium, email=cliente.premium@example.com
  [policy_agent] cause=weather → penalty=$0, comp=$15
  [alternatives_agent] 3 alternativas: ['ALT-710', 'ALT-712', 'ALT-715']
  [llm_agent] Multi-leg SHP-20240614-00189: propongo ALT-715 (MIA-SEA direct (charter), ETA +7h). Compensación $15. Opciones enviadas al cliente premium.
  [notify] opciones ['ALT-710', 'ALT-712', 'ALT-715'] → cliente.premium@example.com
  → handler=llm | auto_confirmed=False | alt=ALT-715
  → Multi-leg SHP-20240614-00189: propongo ALT-715 (MIA-SEA direct (charter), ETA +7h). Compensación $15. Opciones enviadas al cliente premium.

--- SHP-20240614-00331 ---
  [priority_rules] SHP-20240614-00331 → P1 / track=complex
  [profile_agent] tier=standard, email=urgent@pharma.com
  [policy_agent] cause=weather → penalty=$0, comp=$0
  [alternatives_agent] 2 alternativas: ['ALT-640', 'ALT-641']
  [llm_agent] CRITICAL SHP-20240614-00331: ruta express ALT-640 (ETA +4h). Sin auto-confirm — cliente elige.
  [notify] opciones ['ALT-640', 'ALT-641'] → urgent@pharma.com
  → handler=llm | auto_confirmed=False | alt=ALT-640
  → CRITICAL SHP-20240614-00331: ruta express ALT-640 (ETA +4h). Sin auto-confirm — cliente elige.

--- SHP-20240614-00556 ---
  [priority_rules] SHP-20240614-00556 → P2 / track=simple
  [profile_agent] tier=standard, email=flex@startup.io
  [policy_agent] cause=weather → penalty=$0, comp=$0
  [alternatives_agent] 2 alternativas: ['ALT-903', 'ALT-904']
  [autoconfirm_agent] Confirmado ALT-904 (ETA +8h)
  [notify] canales=['email', 'push'] → flex@startup.io
  → handler=auto_confirm | auto_confirmed=True | alt=ALT-904
  → Auto-confirmado ALT-904 (+8h, sin penalidad)

--- SHP-20240614-00204 ---
  [priority_rules] SHP-20240614-00204 → P1 / track=complex
  [profile_agent] tier=premium, email=vip@enterprise.com
  [policy_agent] cause=weather → penalty=$0, comp=$15
  [alternatives_agent] 2 alternativas: ['ALT-520', 'ALT-521']
  [llm_agent] Multi-leg SHP-20240614-00204: propongo ALT-521 (MIA-LAX direct, ETA +8h). Compensación $15. Opciones enviadas al cliente premium.
  [notify] opciones ['ALT-520', 'ALT-521'] → vip@enterprise.com
  → handler=llm | auto_confirmed=False | alt=ALT-521
  → Multi-leg SHP-20240614-00204: propongo ALT-521 (MIA-LAX direct, ETA +8h). Compensación $15. Opciones enviadas al cliente premium.

======================================================================
RESUMEN DE MÉTRICAS
======================================================================
  Procesados:     6
  Auto-confirm:   3 (50%)
  LLM:            3 (50%)

  Tabla por envío:
  SHIPMENT_ID            PRIO  TRACK    HANDLER        ALT        AUTO
  ------------------------------------------------------------------
  SHP-20240614-00742     P2    simple   auto_confirm   ALT-881    True
  SHP-20240614-00815     P3    simple   auto_confirm   ALT-902    True
  SHP-20240614-00189     P1    complex  llm            ALT-715    False
  SHP-20240614-00331     P1    complex  llm            ALT-640    False
  SHP-20240614-00556     P2    simple   auto_confirm   ALT-904    True
  SHP-20240614-00204     P1    complex  llm            ALT-521    False

======================================================================
TABLA DE TRADE-OFFS (auto-confirm vs LLM)
======================================================================
  | Criterio          | Auto-confirm (determinista) | LLM (complejo)        |
  |-------------------|-----------------------------|-----------------------|
  | Latencia          | ~1.8–2.1 s (P2/P3)          | ~5–6 s (P1)           |
  | Costo tokens      | $0                          | ~$0.02–0.08 por envío |
  | Casos ideales     | 1 alt viable, sin multi-leg | Premium multi-leg     |
  | Auditoría         | Trivial (reglas fijas)      | Requiere traza LLM    |
  | Riesgo de error   | Bajo (reglas explícitas)    | Medio (ambigüedad)    |
======================================================================

Todas las verificaciones pasaron.
```

---

## Resultados clave por envío

| shipment_id | priority | track | handler | alternative_id | auto_confirmed |
|-------------|----------|-------|---------|----------------|----------------|
| SHP-20240614-00742 | P2 | simple | auto_confirm | ALT-881 | True |
| SHP-20240614-00815 | P3 | simple | auto_confirm | ALT-902 | True |
| SHP-20240614-00189 | P1 | complex | llm | ALT-715 | False |
| SHP-20240614-00331 | P1 | complex | llm | ALT-640 | False |
| SHP-20240614-00556 | P2 | simple | auto_confirm | ALT-904 | True |
| SHP-20240614-00204 | P1 | complex | llm | ALT-521 | False |

**Métricas:** 6 procesados · 3 auto-confirm (50%) · 3 LLM (50%)

---

## Propiedades que deben cumplirse

1. **Fan-out:** procesa los 6 eventos de `datos/disruption_events.json`.
2. **Segmentación:** P1 para premium/multi-leg/CRITICAL; P2 para flexible; P3 para el resto simple.
3. **Auto-confirm:** los 3 casos simples confirman sin LLM.
4. **LLM:** los 3 casos complejos delegan al `FakeLLMAgent`.
5. **Idempotencia:** re-procesar el mismo `shipment_id` devuelve `deduplicated`.
6. **Solo stdlib:** corre con `python3 solucion_scratch.py` sin pip ni red.

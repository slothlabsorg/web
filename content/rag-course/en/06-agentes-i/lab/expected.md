# Expected — ReAct Agent with Memory

> Concrete output produced by `solucion_scratch.py` when running `python3 solucion_scratch.py`.
> The output has been verified; this file is the source of truth for the lab.

---

## Full output

```
============================================================
AGENTE REACT — CAMBIO DE VUELO (stdlib, determinista)
============================================================

>>> TURNO 1
USUARIO: Quiero cambiar mi vuelo SCL-BOG-001 del 15 al 17 de junio.

  [Paso 1] Thought: Necesito obtener el itinerario del pasajero. PNR extraído: SCL-BOG-001
  [Paso 1] Action: consultar_reserva({'pnr': 'SCL-BOG-001'})
  [Paso 1] Observation: {"pnr": "SCL-BOG-001", "passenger": "Ana García", "flight_id": "LA501",
           "origin": "SCL", "destination": "BOG", "departure_date": "2026-06-15",
           "fare_class": "ECONOMY_FLEX", "route_type": "internacional", "base_price": 215.0, ...}
  [Paso 2] Thought: Tengo el itinerario: vuelo LA501, tarifa ECONOMY_FLEX, ruta internacional.
           Ahora necesito verificar la penalidad de cambio.
  [Paso 2] Action: consultar_politica({'fare_class': 'ECONOMY_FLEX', 'route_type': 'internacional'})
  [Paso 2] Observation: {"fare_class": "ECONOMY_FLEX", "route_type": "internacional",
           "cambio_permitido": true, "penalidad_usd": 50, "fuente": "fare-rules-2026#§3.2", ...}
  [Paso 3] Thought: Tengo toda la información. Penalidad: USD 50.0. Vuelo más económico: FL305
           a USD 295.0. Diferencial: USD 80.0. Total: USD 130.0.

AGENTE:
Encontré tu reserva **SCL-BOG-001** (Ana García, vuelo LA501, 2026-06-15).

Para cambiar al **2026-06-17**, el vuelo disponible es:
- **FL305** — salida 14:45 — USD 295.00

**Desglose del costo:**
- Penalidad de cambio (ECONOMY_FLEX): USD 50.00
- Diferencial de tarifa: USD 80.00
- **Total: USD 130.00**

¿Confirmas el cambio?

------------------------------------------------------------
>>> TURNO 2
USUARIO: Sí, confirmo el cambio.

  [Paso 1] Thought: El usuario confirmó el cambio. Recuerdo del turno anterior:
           PNR=SCL-BOG-001, vuelo nuevo=FL305, fecha=2026-06-17, total=USD 130.0.
           Procedo a confirmar el cambio.

AGENTE:
Cambio confirmado para la reserva **SCL-BOG-001**.

- Vuelo nuevo: **FL305** el 2026-06-17
- Costo total cobrado: **USD 130.00**

Recibirás el nuevo itinerario por email. ¡Buen viaje!

============================================================
Conversación completada.
Mensajes en memoria: 9
Tool calls totales: ['consultar_reserva', 'consultar_politica']

Todas las verificaciones pasaron.
```

---

## Expected tool call sequence

| Turn | Step | Tool | Arguments | Key result |
|------|------|------|------------|-----------------|
| 1 | 1 | `consultar_reserva` | `pnr="SCL-BOG-001"` | `fare_class=ECONOMY_FLEX`, `base_price=215.0` |
| 1 | 2 | `consultar_politica` | `fare_class="ECONOMY_FLEX"`, `route_type="internacional"` | `penalidad_usd=50` |
| 1 | 3 | — (final response) | — | Presents itemized cost, asks for confirmation |
| 2 | 1 | — (final response, no tool call) | — | Confirms using memory |

**Total tool calls: 2** (Turn 1 only).

---

## Verified calculation

```
Precio base vuelo actual (LA501):  USD 215.00  (de reservas.json)
Precio vuelo nuevo (FL305):        USD 295.00  (de vuelos.json)
Diferencial:                       USD  80.00  (295 - 215)
Penalidad ECONOMY_FLEX int.:       USD  50.00  (de politica.json §3.2)
                                   ─────────
TOTAL:                             USD 130.00
```

---

## Properties that must hold

1. **Correct cost:** Turn 1 response contains `USD 130.00`.
2. **Breakdown present:** the response mentions penalty ($50) and differential ($80) separately.
3. **Asks for confirmation:** Turn 1 ends with "¿Confirmas el cambio?".
4. **Memory works:** Turn 2 mentions PNR `SCL-BOG-001` without the user repeating it.
5. **No tool calls in Turn 2:** `consultar_reserva` and `consultar_politica` are each called exactly once, Turn 1 only.
6. **Messages in memory at end:** 9 messages (1 system + 2 user + 4 assistant/tool from turn 1 + 1 user + 1 assistant from turn 2).
7. **Stdlib only:** the script runs with `python3 solucion_scratch.py` without installing anything.

---

## Automatic checks performed by the script

At the end of `main()`, the script verifies these conditions with `assert`:

```python
assert "130" in respuesta1          # costo total en Turno 1
assert "SCL-BOG-001" in respuesta2  # PNR recordado en Turno 2
assert calls_reserva == 1           # consultar_reserva llamado solo 1 vez
```

If any fail, the script prints `ERROR:` with the corresponding message.

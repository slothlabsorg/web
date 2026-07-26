# Expected — ReAct Agent with Memory

> Concrete output produced by `solucion_scratch.py` when running `python3 solucion_scratch.py`.
> The output has been verified; this file is the source of truth for the lab.

---

## Full output

```
============================================================
REACT AGENT — FLIGHT CHANGE (stdlib, deterministic)
============================================================

>>> TURN 1
USER: I want to change my flight SCL-BOG-001 from the 15th to the 17th of June.

  [Step 1] Thought: I need to get the passenger's itinerary. Extracted PNR: SCL-BOG-001
  [Step 1] Action: get_reservation({'pnr': 'SCL-BOG-001'})
  [Step 1] Observation: {"pnr": "SCL-BOG-001", "passenger": "Ana García", "flight_id": "LA501",
           "origin": "SCL", "destination": "BOG", "departure_date": "2026-06-15",
           "fare_class": "ECONOMY_FLEX", "route_type": "internacional", "base_price": 215.0, ...}
  [Step 2] Thought: I have the itinerary: flight LA501, fare ECONOMY_FLEX, international route.
           Now I need to verify the change penalty.
  [Step 2] Action: get_policy({'fare_class': 'ECONOMY_FLEX', 'route_type': 'internacional'})
  [Step 2] Observation: {"fare_class": "ECONOMY_FLEX", "route_type": "internacional",
           "cambio_permitido": true, "penalidad_usd": 50, "fuente": "fare-rules-2026#§3.2", ...}
  [Step 3] Thought: I have all the information. Penalty: USD 50.0. Cheapest flight: FL305
           at USD 295.0. Differential: USD 80.0. Total: USD 130.0.

AGENT:
I found your reservation **SCL-BOG-001** (Ana García, flight LA501, 2026-06-15).

To change to **2026-06-17**, the available flight is:
- **FL305** — departure 14:45 — USD 295.00

**Cost breakdown:**
- Change penalty (ECONOMY_FLEX): USD 50.00
- Fare differential: USD 80.00
- **Total: USD 130.00**

Do you confirm the change?

------------------------------------------------------------
>>> TURN 2
USER: Yes, I confirm the change.

  [Step 1] Thought: The user confirmed the change. I remember from the previous turn:
           PNR=SCL-BOG-001, new flight=FL305, date=2026-06-17, total=USD 130.0.
           I proceed to confirm the change.

AGENT:
Change confirmed for reservation **SCL-BOG-001**.

- New flight: **FL305** on 2026-06-17
- Total cost charged: **USD 130.00**

You will receive the new itinerary by email. Have a great trip!

============================================================
Conversation completed.
Messages in memory: 9
Total tool calls: ['get_reservation', 'get_policy']

All verifications passed.
```

---

## Expected tool call sequence

| Turn | Step | Tool | Arguments | Key result |
|------|------|------|------------|-----------------|
| 1 | 1 | `get_reservation` | `pnr="SCL-BOG-001"` | `fare_class=ECONOMY_FLEX`, `base_price=215.0` |
| 1 | 2 | `get_policy` | `fare_class="ECONOMY_FLEX"`, `route_type="internacional"` | `penalidad_usd=50` |
| 1 | 3 | — (final response) | — | Presents itemized cost, asks for confirmation |
| 2 | 1 | — (final response, no tool call) | — | Confirms using memory |

**Total tool calls: 2** (Turn 1 only).

---

## Verified calculation

```
Current flight base price (LA501):  USD 215.00  (from reservas.json)
New flight price (FL305):           USD 295.00  (from vuelos.json)
Differential:                       USD  80.00  (295 - 215)
ECONOMY_FLEX int. penalty:          USD  50.00  (from politica.json §3.2)
                                    ─────────
TOTAL:                              USD 130.00
```

---

## Properties that must hold

1. **Correct cost:** Turn 1 response contains `USD 130.00`.
2. **Breakdown present:** the response mentions penalty ($50) and differential ($80) separately.
3. **Asks for confirmation:** Turn 1 ends with "Do you confirm the change?".
4. **Memory works:** Turn 2 mentions PNR `SCL-BOG-001` without the user repeating it.
5. **No tool calls in Turn 2:** `get_reservation` and `get_policy` are each called exactly once, Turn 1 only.
6. **Messages in memory at end:** 9 messages (1 system + 2 user + 4 assistant/tool from turn 1 + 1 user + 1 assistant from turn 2).
7. **Stdlib only:** the script runs with `python3 solucion_scratch.py` without installing anything.

---

## Automatic checks performed by the script

At the end of `main()`, the script verifies these conditions with `assert`:

```python
assert "130" in response1            # total cost in Turn 1
assert "SCL-BOG-001" in response2    # PNR remembered in Turn 2
assert calls_reservation == 1        # get_reservation called only 1 time
```

If any fail, the script prints `ERROR:` with the corresponding message.

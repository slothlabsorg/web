# Expected — Agente ReAct con Memoria

> Resultado concreto producido por `solucion_scratch.py` al ejecutar `python3 solucion_scratch.py`.
> La salida ha sido verificada; este archivo es la fuente de verdad del taller.

---

## Salida completa

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

## Secuencia de tool calls esperada

| Turno | Paso | Tool | Argumentos | Resultado clave |
|-------|------|------|------------|-----------------|
| 1 | 1 | `consultar_reserva` | `pnr="SCL-BOG-001"` | `fare_class=ECONOMY_FLEX`, `base_price=215.0` |
| 1 | 2 | `consultar_politica` | `fare_class="ECONOMY_FLEX"`, `route_type="internacional"` | `penalidad_usd=50` |
| 1 | 3 | — (respuesta final) | — | Presenta costo desglosado, pide confirmación |
| 2 | 1 | — (respuesta final, sin tool call) | — | Confirma usando memoria |

**Total de tool calls: 2** (solo en el Turno 1).

---

## Cálculo verificado

```
Precio base vuelo actual (LA501):  USD 215.00  (de reservas.json)
Precio vuelo nuevo (FL305):        USD 295.00  (de vuelos.json)
Diferencial:                       USD  80.00  (295 - 215)
Penalidad ECONOMY_FLEX int.:       USD  50.00  (de politica.json §3.2)
                                   ─────────
TOTAL:                             USD 130.00
```

---

## Propiedades que deben cumplirse

1. **Costo correcto:** la respuesta del Turno 1 contiene `USD 130.00`.
2. **Desglose presente:** la respuesta menciona penalidad ($50) y diferencial ($80) por separado.
3. **Pide confirmación:** el Turno 1 termina con "¿Confirmas el cambio?".
4. **Memoria funciona:** el Turno 2 menciona el PNR `SCL-BOG-001` sin que el usuario lo repita.
5. **Sin tool calls en Turno 2:** `consultar_reserva` y `consultar_politica` se llaman exactamente 1 vez cada una, solo en el Turno 1.
6. **Mensajes en memoria al final:** 9 mensajes (1 system + 2 user + 4 assistant/tool del turno 1 + 1 user + 1 assistant del turno 2).
7. **Solo stdlib:** el script corre con `python3 solucion_scratch.py` sin instalar nada.

---

## Verificaciones automáticas que hace el script

Al final del `main()`, el script verifica estas condiciones con `assert`:

```python
assert "130" in respuesta1          # costo total en Turno 1
assert "SCL-BOG-001" in respuesta2  # PNR recordado en Turno 2
assert calls_reserva == 1           # consultar_reserva llamado solo 1 vez
```

Si alguna falla, el script imprime `ERROR:` con el mensaje correspondiente.

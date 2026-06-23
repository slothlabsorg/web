# Expected — MCP PolicyRAG Server + Cliente

> Resultado concreto producido por `solucion_scratch.py` al ejecutar `python3 solucion_scratch.py`.
> La salida ha sido verificada; este archivo es la fuente de verdad del taller.

---

## Salida completa

```
================================================================
MCP — PolicyRAG Server + Agente Cliente (stdlib, determinista)
================================================================
[Cliente] Handshake OK — servidor: airline-policy-rag-mcp
[Cliente] Capabilities: tools={'listChanged': False}, permissions={'approvalRequired': True}
[Cliente] Tools descubiertas (2): ['policy_rag', 'apply_flight_change']

[Agente] Llamando policy_rag(fare_class='ECONOMY_FLEX', route_type='internacional')
[Agente] Observation policy_rag: penalidad_usd=50, cambio_permitido=True
[Agente] Chunk: Tarifa ECONOMY_FLEX (internacional): cambio permitido. Penalidad: USD 50. Cambio...

[Agente] Llamando apply_flight_change(pnr='SCL-BOG-001', new_flight_id='FL305', amount_usd=130.0)
[Agente] PERMISO REQUERIDO — scope='financial'
[Agente] Razón: Acción financiera: cobro de USD 130.00 para PNR SCL-BOG-001
[Agente] Solicitando aprobación al usuario (demo: auto-aprobado)...
[Agente] Permiso 'perm-apply_flight_change-SCL-BOG-001' APROBADO — reintentando tool...
[Agente] Observation apply_flight_change: status=captured, txn=txn-mcp-20260617-001

----------------------------------------------------------------
RESUMEN
----------------------------------------------------------------
Tools descubiertas: ['policy_rag', 'apply_flight_change']
Penalidad (policy_rag): USD 50
Cobro (apply_flight_change): USD 130.0 — captured

Todas las verificaciones pasaron.
================================================================
```

---

## Secuencia de mensajes MCP esperada

| Paso | Método JSON-RPC | Qué ocurre | Resultado clave |
|------|-----------------|----------|-----------------|
| 1 | `initialize` | Handshake cliente↔servidor | `serverInfo.name = airline-policy-rag-mcp` |
| 2 | `tools/list` | Descubrimiento dinámico | 2 tools: `policy_rag`, `apply_flight_change` |
| 3 | `tools/call` → `policy_rag` | Consulta penalidad ECONOMY_FLEX internacional | `penalidad_usd=50`, `cambio_permitido=true` |
| 4 | `tools/call` → `apply_flight_change` (sin token) | Acción sensible bloqueada | `permission_required=true`, scope `financial` |
| 5 | `permissions/respond` | Usuario aprueba el cobro | `status=approved` |
| 6 | `tools/call` → `apply_flight_change` (con token) | Cobro ejecutado | `status=captured`, `transaction_id=txn-mcp-20260617-001` |

---

## Propiedades que deben cumplirse

1. **Handshake exitoso:** el cliente recibe `airline-policy-rag-mcp` como nombre del servidor.
2. **Descubrimiento:** `tools/list` devuelve exactamente 2 tools.
3. **PolicyRAG funciona:** `policy_rag` devuelve `penalidad_usd=50` para ECONOMY_FLEX internacional.
4. **Gate de permisos:** la primera llamada a `apply_flight_change` devuelve `permission_required` sin ejecutar el cobro.
5. **Aprobación:** tras `permissions/respond` con `approved`, la segunda llamada cobra USD 130.00.
6. **Determinismo:** `transaction_id` siempre es `txn-mcp-20260617-001`.
7. **Solo stdlib:** el script corre con `python3 solucion_scratch.py` sin instalar nada.

---

## Verificaciones automáticas que hace el script

```python
assert len(agent.tools) == 2
assert agent.policy_result["penalidad_usd"] == 50
assert agent.change_result["status"] == "captured"
assert agent.change_result["pnr"] == "SCL-BOG-001"
assert agent.change_result["transaction_id"] == "txn-mcp-20260617-001"
```

Si alguna falla, el script termina con `AssertionError`.

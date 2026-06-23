# Expected — MCP PolicyRAG Server + Client

> Concrete output produced by `solucion_scratch.py` when running `python3 solucion_scratch.py`.
> Output has been verified; this file is the source of truth for the lab.

---

## Full output

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

## Expected MCP message sequence

| Step | JSON-RPC method | What happens | Key result |
|------|-----------------|----------|-----------------|
| 1 | `initialize` | Client↔server handshake | `serverInfo.name = airline-policy-rag-mcp` |
| 2 | `tools/list` | Dynamic discovery | 2 tools: `policy_rag`, `apply_flight_change` |
| 3 | `tools/call` → `policy_rag` | Query ECONOMY_FLEX internacional penalty | `penalidad_usd=50`, `cambio_permitido=true` |
| 4 | `tools/call` → `apply_flight_change` (no token) | Sensitive action blocked | `permission_required=true`, scope `financial` |
| 5 | `permissions/respond` | User approves charge | `status=approved` |
| 6 | `tools/call` → `apply_flight_change` (with token) | Charge executed | `status=captured`, `transaction_id=txn-mcp-20260617-001` |

---

## Properties that must hold

1. **Successful handshake:** the client receives `airline-policy-rag-mcp` as the server name.
2. **Discovery:** `tools/list` returns exactly 2 tools.
3. **PolicyRAG works:** `policy_rag` returns `penalidad_usd=50` for ECONOMY_FLEX internacional.
4. **Permission gate:** the first call to `apply_flight_change` returns `permission_required` without executing the charge.
5. **Approval:** after `permissions/respond` with `approved`, the second call charges USD 130.00.
6. **Determinism:** `transaction_id` is always `txn-mcp-20260617-001`.
7. **Stdlib only:** the script runs with `python3 solucion_scratch.py` without installing anything.

---

## Automatic checks the script performs

```python
assert len(agent.tools) == 2
assert agent.policy_result["penalidad_usd"] == 50
assert agent.change_result["status"] == "captured"
assert agent.change_result["pnr"] == "SCL-BOG-001"
assert agent.change_result["transaction_id"] == "txn-mcp-20260617-001"
```

If any fail, the script exits with `AssertionError`.

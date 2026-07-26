# Expected — MCP PolicyRAG Server + Client

> Concrete output produced by `solution_scratch.py` when running `python3 solution_scratch.py`.
> Output has been verified; this file is the source of truth for the lab.

---

## Full output

```
================================================================
MCP — PolicyRAG Server + Client Agent (stdlib, deterministic)
================================================================
[Client] Handshake OK — server: airline-policy-rag-mcp
[Client] Capabilities: tools={'listChanged': False}, permissions={'approvalRequired': True}
[Client] Tools discovered (2): ['policy_rag', 'apply_flight_change']

[Agent] Calling policy_rag(fare_class='ECONOMY_FLEX', route_type='international')
[Agent] Observation policy_rag: penalty_usd=50, change_allowed=True
[Agent] Chunk: Fare ECONOMY_FLEX (international): change allowed. Penalty: USD 50. Change...

[Agent] Calling apply_flight_change(pnr='SCL-BOG-001', new_flight_id='FL305', amount_usd=130.0)
[Agent] PERMISSION REQUIRED — scope='financial'
[Agent] Reason: Financial action: charge of USD 130.00 for PNR SCL-BOG-001
[Agent] Requesting user approval (demo: auto-approved)...
[Agent] Permission 'perm-apply_flight_change-SCL-BOG-001' APPROVED — retrying tool...
[Agent] Observation apply_flight_change: status=captured, txn=txn-mcp-20260617-001

----------------------------------------------------------------
SUMMARY
----------------------------------------------------------------
Tools discovered: ['policy_rag', 'apply_flight_change']
Penalty (policy_rag): USD 50
Charge (apply_flight_change): USD 130.0 — captured

All checks passed.
================================================================
```

---

## Expected MCP message sequence

| Step | JSON-RPC method | What happens | Key result |
|------|-----------------|----------|-----------------|
| 1 | `initialize` | Client↔server handshake | `serverInfo.name = airline-policy-rag-mcp` |
| 2 | `tools/list` | Dynamic discovery | 2 tools: `policy_rag`, `apply_flight_change` |
| 3 | `tools/call` → `policy_rag` | Query ECONOMY_FLEX international penalty | `penalty_usd=50`, `change_allowed=true` |
| 4 | `tools/call` → `apply_flight_change` (no token) | Sensitive action blocked | `permission_required=true`, scope `financial` |
| 5 | `permissions/respond` | User approves charge | `status=approved` |
| 6 | `tools/call` → `apply_flight_change` (with token) | Charge executed | `status=captured`, `transaction_id=txn-mcp-20260617-001` |

---

## Properties that must hold

1. **Successful handshake:** the client receives `airline-policy-rag-mcp` as the server name.
2. **Discovery:** `tools/list` returns exactly 2 tools.
3. **PolicyRAG works:** `policy_rag` returns `penalty_usd=50` for ECONOMY_FLEX international.
4. **Permission gate:** the first call to `apply_flight_change` returns `permission_required` without executing the charge.
5. **Approval:** after `permissions/respond` with `approved`, the second call charges USD 130.00.
6. **Determinism:** `transaction_id` is always `txn-mcp-20260617-001`.
7. **Stdlib only:** the script runs with `python3 solution_scratch.py` without installing anything.

---

## Automatic checks the script performs

```python
assert len(agent.tools) == 2
assert agent.policy_result["penalty_usd"] == 50
assert agent.change_result["status"] == "captured"
assert agent.change_result["pnr"] == "SCL-BOG-001"
assert agent.change_result["transaction_id"] == "txn-mcp-20260617-001"
```

If any fail, the script exits with `AssertionError`.

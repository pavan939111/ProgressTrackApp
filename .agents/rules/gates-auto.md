# Auto-use System Gate and Sentinel

When the task touches architecture or security ship readiness, call these MCPs yourself. Do not wait for the user to name them.

## System Gate — architecture readiness

Call when: design/topology changes, "ready to build", new service/package, before claiming design complete.

Workflow: `architecture_readiness` → `architecture_start` / `architecture_record` from the real repo → readiness again.
Artefact: `.system-gate/architecture.json`. PASS ≠ scales. Never invent evidence.

## Sentinel — security ship brake

Call when: ship/merge/release/deploy, auth/secrets/public APIs, security-sensitive changes before "done".

Workflow: scans → `ship_readiness`. Never invent PASS.

## Routing law

- ready_to_build ↔ System Gate PASS
- ready_to_ship ↔ Sentinel PASS
- constellation-router routes only — never synthesizes PASS.

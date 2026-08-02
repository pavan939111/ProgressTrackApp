# Agent instructions (this app)

This file is installed by `sentinel init`. Keep it in the app root.

## Order (greenfield)

1. **Architecture before code.** Call `architecture_start` before creating application files. Record decisions with `architecture_record`. Do not treat `architecture_readiness` PASS as optional paperwork.
2. **Consult knowledge** for decisions you are about to make (`search_knowledge`), when the skills server is available.
3. **Build only after** architecture readiness is PASS (or an explicit, recorded reason to proceed without it).
4. **`sentinel check` before each commit.** No "done" / "shipped" / "ready" without a real PASS from tools — never invent one.
5. **`ship_readiness` before deploy.** A prior PASS against a different tree is STALE, not good enough.

## Honesty

- Verdicts come from exit codes and the run ledger, not from assessment prose.
- If a scanner did not run, the answer is ERROR — not PASS.
- Hooks are part of the install. Do not remove `.cursor/hooks.json` (or peer host hooks) to "move faster."

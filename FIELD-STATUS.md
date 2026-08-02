# FIELD-STATUS — Sentinel / Constellation on PTA

Date: 2026-08-01 · App: `C:\Users\HP\Desktop\pta` · Counts = transcript string hits (9 jsonl files); not a perfect MCP audit log.

## 1. What's installed

| Item | Value |
|------|-------|
| Install date / zip | 2026-08-01 · `constellation-greenfield-pta-2026-08-01.zip` (~36MB) → `Desktop\constellation-v1` |
| Sentinel version | `sentinel-mcp` **0.1.0** (`constellation-v1/sentinel/package.json`); scanners: gitleaks 8.30.1, opengrep 1.26.0, trivy 0.72.0 |
| MCP configured (`~\.cursor\mcp.json`) | stitch, skills, ponytail, constellation-router, system-gate, sentinel, mem0-local |
| MCP that connect here | **ready:** sentinel, system-gate, constellation-router, mem0-local, skills, stitch; also Cursor plugins vercel/firebase/browser |
| Rules present | `pta/.cursor/rules/gates-auto.mdc`, `impeccable.mdc` · no `AGENTS.md` |
| Hooks | **No** (no `.cursor/hooks.json`) |

## 2. What's being built

| Item | Value |
|------|-------|
| PTA | Progress Track App — daily session planner + check-in PWA with reminder alarms |
| Stack | TS/Next.js 14 (FE+BE), Firebase Auth/Firestore/FCM, Cloudinary, Vercel, PWA SW |
| Stage | **near-ship** (gates PASS locally; prod redeploy/cron still flaky) |
| Size | ~214 non-vendor files · ~64 `src` TS/TSX · ~8.4k LOC in `frontend/src`+`backend/src` |
| Deployed? | Yes — FE `progress-track-app.vercel.app` · BE `backend-six-roan-24.vercel.app` |

## 3. Actual usage (transcript mentions)

| Tool | Times used |
|------|------------|
| scan_secrets / scan_code / scan_trivy | 15 / 8 / 7 |
| ship_readiness | 19 |
| architecture_start / record / readiness | 8 / 9 / 18 |
| design_start / design_record | 1 / 1 |
| change_since_design | 4 |
| skills / search_knowledge | **0** |
| memory (add / search) | 15 / 13 |
| router (route_hint / constellation_status) | 6 / 9 |
| sentinel_status | 15 |

## 4. What it caught

| Metric | Value |
|--------|-------|
| Latest ledger findings | gitleaks 3 · opengrep 6 · nextjs 62 · trivy 63 · agentic/firebase 0 · **blocking 0** after debt |
| Real / actionable | ~5–10; most of nextjs/trivy noise |

**3 that mattered**
1. **`next-public-secret`** — `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in env + route fallback (removed; use `FIREBASE_VAPID_KEY` only).
2. **Firebase pack** — open `storage.rules` read (closed before firebase PASS).
3. **Gitleaks / hygiene** — tracked env dumps, zip, `.next` junk, absolute paths in MCP config (cleaned before GitHub push).

Would have shipped without it? **Partially yes** — VAPID-as-public and open Storage rules were easy to miss.

## 5. What it got wrong

| Finding / behavior | Why wrong |
|--------------------|-----------|
| **`gcp-api-key`** on Firebase **web** API key (`firebase.ts`, seed scripts) | Public-by-design client key; CLI+`.gitleaks.toml` clean, MCP still blocked until `accepted.json` |
| **Trivy HIGH on Next 14** as ship-blockers | Fixes only on Next 15/16; forced `failOn.trivy` → critical-only + `.trivyignore` |
| **nextjs pack ~62 findings, 0 blocking** | Noise; hard to see signal |
| **MCP `-32602` additionalProperties** | Scan tools error to client but still write ledger — looks broken, is half-working |
| **agentic `parse ERROR`** on `reminders.ts` / `gamification.ts` | Valid TS; scanner parser flake |
| Same **`gcp-api-key` trio** | Kept returning until accepted debt |

## 6. Where we worked around it

| Workaround | Detail |
|------------|--------|
| Skip / soft-done | Early feature work shipped to GitHub **before** Sentinel PASS; CLI used when MCP schema failed |
| `accepted.json` | **3** entries — `gcp-api-key` fingerprints, expire 2026-10-30 |
| Policy loosened | `failOn.trivy` / `opengrep` → critical only; `.gitleaks.toml`, `.trivyignore`, `.sentinelignore` |
| Stopped / underused | **skills/knowledge** unused; **design_*** almost unused; design workflow never became habit |

## 7. What broke

| Issue | Notes |
|-------|-------|
| MCP output schema error | Every `scan_*` often returns `-32602`; agent retries / falls back to CLI |
| Scan time | Full suite ~30–90s+ (trivy DB/lockfiles); tolerable once, annoying in loops |
| Ledger freshness | Tree hash churn → re-run everything after tiny edits |
| Want-to-avoid | Re-running ship_readiness loops for false `gcp-api-key` / Next HIGH debt |

## 8. Honest opinion

| Q | A |
|---|---|
| Worth installed? | **Mixed** — caught real public-secret + rules issues; cost is noise, schema bugs, policy fights |
| Most annoying | MCP `-32602` while ledger quietly updates — can't trust the tool response text |
| Remove entirely? | **design_*** / change_since_design tax for this solo app; or nextjs advisory flood |
| Missing? | Reliable MCP JSON responses; Firebase-web-key allowlist default; “public client config” composer that doesn’t need accepted debt |

## 9. Current state of PTA

| Item | Value |
|------|-------|
| Build / run | Typecheck OK; local FE/BE runnable; **Sentinel `ship_readiness` PASS** (6 checks); System Gate architecture PASS |
| Carrying | Alarm sound needs user-gesture unlock; prod cron was 404 (needs BE redeploy); Cloudinary secret mismatches historically; 3 accepted gcp debt; uncommitted alarm/Sentinel fixes may still be local |
| Next | Redeploy FE+BE with alarm sound + cron; verify FCM/test alarm audible; rotate any leaked env material if still in git history |

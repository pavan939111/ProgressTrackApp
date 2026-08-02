# Migrate PTA from constellation 2026-08-01 → 2026-08-02

You are replacing the **install** on this laptop. The **PTA app** stays where it is. You do not need prior constellation context beyond this file.

**Assumed layout (adjust if yours differs):**

| Role | Typical path |
|------|----------------|
| Old install (to replace) | `%USERPROFILE%\Desktop\constellation-v1` |
| PTA app (keep) | your PTA repo (the folder Cursor has open) |
| New zip | `constellation-greenfield-2026-08-02.zip` |

Below, `$ROOT` = new install root after unzip. `$APP` = PTA app root.

```powershell
$ROOT = "$env:USERPROFILE\Desktop\constellation-v1"
$APP  = "<paste your PTA repo path>"   # e.g. "$env:USERPROFILE\Desktop\PTA"
```

---

## 0. Preserve — app-side state (never delete)

These live in the **PTA repo**, not under `constellation-v1`. Back them up **before** anything else.

| File | Why |
|------|-----|
| `.sentinel\accepted.json` | Your accepted debt (e.g. three `gcp-api-key` entries) — keep so you can prove they are unnecessary after migration |
| `.sentinel\design.json` | If present — design record |
| `.system-gate\architecture.json` | Recorded architecture — do not force a redo |
| `sentinel.config.json` | Policy (including loosened `failOn.trivy` if you set it) |
| `.gitleaks.toml` | Secrets tuning |
| `.trivyignore` | Trivy tuning |

**Backup (exact):**

```powershell
$BACKUP = Join-Path $env:USERPROFILE "Desktop\pta-migrate-backup-$(Get-Date -Format yyyyMMdd-HHmm)"
New-Item -ItemType Directory -Path $BACKUP -Force | Out-Null
foreach ($f in @(
  ".sentinel\accepted.json",
  ".sentinel\design.json",
  ".system-gate\architecture.json",
  "sentinel.config.json",
  ".gitleaks.toml",
  ".trivyignore"
)) {
  $src = Join-Path $APP $f
  if (Test-Path $src) {
    $dest = Join-Path $BACKUP $f
    New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
    Copy-Item $src $dest -Force
    Write-Host "backed up $f"
  } else {
    Write-Host "skip (missing) $f"
  }
}
Write-Host "Backup folder: $BACKUP"
```

---

## 1. Replace — install directory, wholesale

Do **not** merge into the old tree. The 2026-08-01 install still has the removed router and hardcoded OneDrive paths.

```powershell
# Keep old install for rollback
Rename-Item "$env:USERPROFILE\Desktop\constellation-v1" "constellation-v1-2026-08-01-bak"

# Unzip the new package as constellation-v1
Expand-Archive -Path "<path\to\constellation-greenfield-2026-08-02.zip>" `
  -DestinationPath "$env:USERPROFILE\Desktop\constellation-v1" -Force

$ROOT = "$env:USERPROFILE\Desktop\constellation-v1"
# If Expand-Archive created a nested single folder, move contents up so
# $ROOT\sentinel\dist\src\cli.js exists.
```

Confirm:

```powershell
Test-Path "$ROOT\sentinel\dist\src\cli.js"          # True
Test-Path "$ROOT\constellation-router"               # False
Test-Path "$ROOT\START-HERE-GREENFIELD.md"           # True
Test-Path "$ROOT\MIGRATE-FROM-2026-08-01.md"         # True
```

---

## 2. Update — host configuration

### 2a. Cursor MCP (`%USERPROFILE%\.cursor\mcp.json`)

1. Open `%USERPROFILE%\.cursor\mcp.json` in an editor.
2. **Delete** the entire `"constellation-router"` server entry (if present).
3. Repoint every remaining server at `$ROOT` (forward slashes). Easiest: regenerate, then merge:

```powershell
powershell -ExecutionPolicy Bypass -File "$ROOT\constellation-pack\PTA\generate-mcp.ps1" `
  -AppRoot $APP `
  -ConstellationRoot $ROOT `
  -Template "$ROOT\constellation-pack\hosts\cursor.json" `
  -Out "$env:TEMP\sentinel-mcp-fragment.json"
```

Copy the generated `mcpServers` keys into your real `mcp.json` (**merge** — do not wipe other servers). Paths should look like:

`…/Desktop/constellation-v1/sentinel/dist/src/index.js`  
not `…/mahip/OneDrive/…`.

`SENTINEL_ROOT` / `SYSTEM_GATE_ROOT` / `CONSTELLATION_APP` must be **`$APP`**, not the install folder.

### 2b. Hooks + app-root AGENTS.md

```powershell
node "$ROOT\sentinel\dist\src\cli.js" init --path $APP
```

`init` installs host hooks **by default** and copies `AGENTS.md` into the app root if missing. (Use `--no-hooks` only if you intend zero local enforcement.)

### 2c. Restart Cursor

Hooks and MCP load at startup. **Without a full Cursor restart, nothing changes.** Quit Cursor completely, then reopen the PTA folder.

---

## 3. Verify — five checks

Run these from PowerShell after restart. Replace `$ROOT` / `$APP` if needed.

### 1) Status connects

```powershell
node "$ROOT\sentinel\dist\src\cli.js" status --path $APP
```

**Expect:** text starting with `Sentinel status —` followed by your **absolute PTA path**, then lines like `runner … available` and toolchain tools (`gitleaks`, `opengrep`, `trivy`).  
**Also in Cursor:** MCP tool `sentinel_status` should return the same shape (not a connection error).

**If it fails:** wrong `SENTINEL_ROOT` / wrong path to `dist\src\cli.js`; or Cursor not restarted so MCP still points at the bak folder.

### 2) MCP `scan_secrets` is not `-32602`

In Cursor, run MCP **`scan_secrets`** (path = PTA / default root).

**Expect:** a normal PASS/FAIL/ERROR scan write-up (and structured result). **Not** JSON-RPC `-32602` / “invalid params” / schema rejection while a ledger is still written.

**If you see `-32602`:** MCP is still on the old install, or Cursor was not restarted. Confirm `mcp.json` args point at `$ROOT\sentinel\dist\src\index.js`.

**CLI equivalent:**

```powershell
node "$ROOT\sentinel\dist\src\cli.js" scan --path $APP --tool gitleaks
```

Expect a line like `gitleaks: PASS` or `gitleaks: FAIL` (exit 0/1), not a Node stack about schema.

### 3) `sentinel check` completes

```powershell
node "$ROOT\sentinel\dist\src\cli.js" check --path $APP
echo "exit=$LASTEXITCODE"
```

**Expect:** a full text report and exit **`0` (PASS)** or **`1` (FAIL findings)**. Exit **`2`** means ERROR (tooling broke) — that is not “done.”

**If exit 2:** toolchain download/network, wrong working tree, or pack detect timeout. Run `status` and read the ERROR block.

### 4) Hooks file exists

```powershell
Test-Path "$APP\.cursor\hooks.json"
Get-Content "$APP\.cursor\hooks.json" -TotalCount 20
```

**Expect:** `True`, and JSON referencing Sentinel hook commands / `loop_limit` (Cursor soft stop is capped at **3** nudges).

**If missing:** re-run `init --path $APP` (hooks are default). Do not use `--no-hooks`.

### 5) Architecture PASS survived

```powershell
Test-Path "$APP\.system-gate\architecture.json"
Get-Content "$APP\.system-gate\architecture.json" -TotalCount 30
node "$ROOT\system-gate\dist\cli.js" check --path $APP
```

**Expect:** architecture file still present (from backup/original). System Gate check should **not** demand a blank redo solely because you replaced the install. If the file was lost, restore from `$BACKUP\.system-gate\architecture.json`.

**In Cursor:** `architecture_readiness` should still see the record.

**If ERROR on unversioned file:** the file must be architecture **version 1** (legacy silent migrate was removed earlier). Restore the backed-up copy.

---

## 4. Rollback

Until verification passes, keep:

`%USERPROFILE%\Desktop\constellation-v1-2026-08-01-bak`

**Revert:** point `mcp.json` back at the bak paths (or restore a copy of `mcp.json`), rename current `constellation-v1` aside, rename `constellation-v1-2026-08-01-bak` → `constellation-v1`, restart Cursor.

---

## 5. What changed (for you)

From the field report pain points:

1. **The `-32602` error on every scan is fixed.** Scans no longer fail the MCP schema while still writing the ledger.
2. **Firebase web config keys reclassify automatically** against your Firestore rules. Your three `accepted.json` entries for `gcp-api-key` should no longer be needed — verify after migrate (question below).
3. **Trivy findings whose only fix is a major version bump no longer block.** You can restore `failOn.trivy` to defaults and re-measure.

Also: Dart/Flutter cold path no longer errors the whole gate the same way; install templates carry **no** hardcoded machine paths; local `mcp` pin is `>=1.0,<2`; **constellation-router is gone**.

---

## 6. Three things to measure after migrating

Questions — not a chore list:

1. Remove the three `accepted.json` `gcp-api-key` entries and re-run. **Do the Firebase web keys still block?**
2. **Which rule IDs make up the ~62 Next.js findings?** (ID counts only.)
3. Restore `failOn.trivy` to defaults. **How many trivy findings block now, versus 52?**

---

## 7. Hooks — never tested in the field

Hooks have **not** been proven on any prior deployment. On Cursor, the stop hook is a **nudge** (`followup_message`), capped at **3** attempts — it **cannot** hard-block the agent, so you will not get stuck in a stop loop.

Please note, honestly:

- Did it fire?
- What did it say?
- Was the message actionable?
- Help or friction?

---

## 8. Optional reading in this zip

- `START-HERE-GREENFIELD.md` — greenfield ordering (architecture before code); less critical for PTA already in flight
- `GREENFIELD-REPORT.md` — blanks if you want a structured diary
- `constellation-pack\PTA\INSTALL-PTA.md` — full install notes

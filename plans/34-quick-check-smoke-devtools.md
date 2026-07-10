# Quick check — smoke test + Chrome DevTools

**When:** After several features land, or before marking a sub-plan / session **done** — not after every single commit.

**Goal:** Catch console errors, missing sprite frames, Phaser boot failures, and broken smoke paths before hand-off.

---

## 1. Automated smoke (fast gate)

From repo root:

```bash
pnpm dev          # optional: keep running for manual step below
pnpm smoke:test   # home + combat + save-boot Playwright specs
```

**Combat smoke covers:** enter combat via `window.__podSmoke`, arrow movement, A/S/D keyboard bindings, HUD buttons, and `window.__podErrors` (including Phaser `duration`, renderType, and missing texture frame warnings).

**CI:** `pnpm test:e2e` runs the same specs in GitHub Actions.

---

## 2. Manual Chrome DevTools pass (catch what automation misses)

Use this when you touched combat, Home UI, save, or asset registration.

1. `pnpm dev` → open **http://127.0.0.1:5173**
2. Open **Chrome DevTools** → **Console** (filter: Errors + Warnings)
3. **Home:** click through Journey / Ancient / Echoes tabs — no red errors, no `[missing:…]` strings
4. **Combat:** press **C** (dev shortcut) or use smoke hook — watch console during load and first enemy spawn
5. In console, run: `window.__podErrors` — should be `[]` or only benign entries you expect
6. Optional: **Network** tab — no 404 on `/assets/` or locale JSON

**Landscape viewport:** 844×390 (primary QA size per ship checklist).

---

## 3. Agent / Cursor workflow (Chrome DevTools MCP)

When implementing with an agent:

| Step | Tool | Purpose |
|------|------|---------|
| Navigate | Chrome DevTools MCP `navigate_page` | Load dev URL |
| Interact | `click`, `press_key` (**C** for combat) | Reproduce user path |
| Catch errors | `list_console_messages` (types: `error`, `warn`) | Frame warnings, Phaser crashes |
| Snapshot | `take_snapshot` | Verify HUD / tab labels |

Run **after** local `pnpm smoke:test` passes — DevTools catches visual/console issues Playwright filters may not yet assert.

---

## 4. Definition of done hook

Before confirming a feature batch finished:

- [ ] `pnpm typecheck` green
- [ ] `pnpm smoke:test` green
- [ ] DevTools console clean on Home + combat entry (no sprite frame warnings, no uncaught exceptions)
- [ ] `window.__podErrors` empty after the session path above

See also: [`handbook/SHIP_CHECKLIST.md`](../handbook/SHIP_CHECKLIST.md) §B item 27.

---

## Related

- Smoke hooks: `src/app/smokeHooks.ts` (`localStorage pod.smoke=1` or dev mode)
- E2E helpers: `tests/e2e/helpers/smoke.ts`
- Runner: `tools/smoke/run-smoke.mjs` · script: `pnpm smoke:test`
- Procedural combat sprites: `src/combat/art/stickyManAssets.ts` (hero + enemy frame maps)

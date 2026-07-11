# 34 — Quick check (smoke + DevTools)

**Status:** `[~]` In progress  
**Plan:** [plans/34-quick-check-smoke-devtools.md](../plans/34-quick-check-smoke-devtools.md)  
**Last updated:** 2026-07-11

## Summary

Fast gate before hand-off: automated smoke + manual Chrome DevTools console pass.

## Done

- `pnpm smoke:test` — Home + combat + save-boot Playwright specs
- **`window.__podErrors` now a real hook (2026-07-11):** `ErrorReporter.ts` exposes the
  live error ring-buffer on `window.__podErrors` (unconditional, not DEV-gated — matches
  the "10-minute session" manual QA item in `SHIP_CHECKLIST.md` §27). `tests/e2e/smoke.spec.ts`
  asserts `expect(window.__podErrors ?? []).toHaveLength(0)` after both combat entries
  in the MVP smoke test (undefined treated as clean).
- CI runs `pnpm test:e2e` (37 E2E cases in master track)
- Landscape 844×390 called out in ship checklist
- **Unit suite: 523 passing / 0 failing** (2026-07-10) — the 22 failures were all
  tests lagging shipped content/code (skill-unlock map, `ancients.json` skill IDs,
  i18n string renames, `encounter.destiny_cave` addition, 2.5D tileset collision
  ids, dev-only keyboard remap, `CultivatorLoader` error message). No production
  bugs found; `procedural-map-quality.test.ts`'s border check now asserts "any
  impassable collision tile" instead of the legacy id-4 rock tile (C1 procedural
  endless decision — Tiled 16k rim no longer a hard gate, but the outer rim is
  still fully impassable in all three sampled maps).

## Remaining

- Wire plan 34 checkbox into sub-plan acceptance templates
- DevTools MCP pass documented for agents — optional in CI
- Assert no Phaser missing-frame warnings in smoke (partial today — `window.error`/
  `unhandledrejection` are captured, but Phaser texture-frame `console.warn` calls are not)
- 10-minute manual playthrough + console clean (plan 26)
- **Known gap (2026-07-11):** `pnpm test:e2e tests/e2e/smoke.spec.ts` is currently red in
  this sandbox independent of the `__podErrors` change (reproduced on `main` before this
  edit too) — `waitForCombatCanvas` times out because `#canvas-2d` never leaves
  `canvas--inactive` after the first "Continue Journey" click, and the dev-server console
  logs an unrelated `Uncaught SyntaxError … registerSW.js:1` (now visible precisely because
  `__podErrors` works). Needs its own investigation; not a regression from this change.
  `pnpm smoke:test` (the npm script) also doesn't exist yet — the runner referenced by this
  doc (`tools/smoke/run-smoke.mjs`) hasn't been built; today the equivalent command is
  `pnpm test:e2e`.

## What needs to do

| # | Task | Command / tool |
|---|------|----------------|
| 1 | ~~Run full unit suite; fix or quarantine each failure~~ `[x]` Done 2026-07-10 | `pnpm test` |
| 2 | Run smoke gate before any track marked `[x]` | `pnpm smoke:test` |
| 3 | ~~Add Playwright assert: `window.__podErrors.length === 0` after combat entry~~ `[x]` Done 2026-07-11 | `tests/e2e/smoke.spec.ts` |
| 4 | Manual DevTools pass at **844×390** — Home tabs + combat **C** | plan 34 §2 |
| 5 | Document "batch sign-off" checklist in PR template or SHIP_CHECKLIST | handbook |

## Verification

- `pnpm typecheck` green (verified 2026-07-11)
- `pnpm test:e2e tests/e2e/smoke.spec.ts` — new `expectNoPodErrors` assertions reached and
  passed on the one cycle that completed; full spec currently red in this sandbox due to
  the pre-existing `waitForCombatCanvas` gap above (reproduced on `main` pre-edit)
- `pnpm smoke:test` script doesn't exist yet in `package.json` — see Known gap above

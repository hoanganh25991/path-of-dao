# 34 — Quick check (smoke + DevTools)

**Status:** `[~]` In progress  
**Plan:** [plans/34-quick-check-smoke-devtools.md](../plans/34-quick-check-smoke-devtools.md)  
**Last updated:** 2026-07-10

## Summary

Fast gate before hand-off: automated smoke + manual Chrome DevTools console pass.

## Done

- `pnpm smoke:test` — Home + combat + save-boot Playwright specs
- `window.__podSmoke` / `window.__podErrors` combat hook
- CI runs `pnpm test:e2e` (37 E2E cases in master track)
- Landscape 844×390 called out in ship checklist

## Remaining

- Wire plan 34 checkbox into sub-plan acceptance templates
- DevTools MCP pass documented for agents — optional in CI
- Assert no Phaser missing-frame warnings in smoke (partial today)
- **Unit suite:** 22 failing / 500 passing at 2026-07-10 — fix before ship gate
- 10-minute manual playthrough + console clean (plan 26)

## What needs to do

| # | Task | Command / tool |
|---|------|----------------|
| 1 | Run full unit suite; fix or quarantine each failure | `pnpm test` |
| 2 | Run smoke gate before any track marked `[x]` | `pnpm smoke:test` |
| 3 | Add Playwright assert: `window.__podErrors.length === 0` after combat entry | `tests/e2e/smoke.spec.ts` |
| 4 | Manual DevTools pass at **844×390** — Home tabs + combat **C** | plan 34 §2 |
| 5 | Document "batch sign-off" checklist in PR template or SHIP_CHECKLIST | handbook |

## Verification

- `pnpm smoke:test` green when dev server available
- `pnpm typecheck` green

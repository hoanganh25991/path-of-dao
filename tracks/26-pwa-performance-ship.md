# 26 — PWA, performance, ship checklist

**Status:** `[~]` Foundation landed — ship checklist pending  
**Plan:** [plans/26-pwa-performance-ship.md](../plans/26-pwa-performance-ship.md)  
**Last updated:** 2026-07-03

## Summary

Installable PWA shell, performance profiles for mobile, CI pipeline, and final ship checklist.

## Done

- **QualityProfile** — `auto` / `low` / `mid` / `high`; device heuristic; low tier disables combat juice
- **Save settings** — `settings.quality` (back-compat default `auto`)
- **Settings modal** — performance picker + version row (`0.1.0-mvp`)
- **PWA** — `vite-plugin-pwa`, manifest, service worker precache, placeholder icons
- **Build** — manual chunks (`phaser`, `three`, `vendor`); build + SW generation green
- **CI** — `.github/workflows/ci.yml` (typecheck, test, content:validate, build)
- **ErrorReporter** — client error ring buffer stub
- **Tests** — `tests/unit/quality-profile.test.ts`

## Remaining

- Real app icons (replace placeholder PNGs)
- Low-end juice profile wired to Home aura particles
- E2E smoke (Playwright)
- `docs/SHIP_CHECKLIST.md` manual QA script
- 30 FPS verification on throttled Android profile
- Lighthouse PWA audit + 10-min playthrough sign-off

## Verification

- `npm run typecheck` — clean
- `npm test` — **334 tests green**
- `npm run build` — dist + `sw.js` generated

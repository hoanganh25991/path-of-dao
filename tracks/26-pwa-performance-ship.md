# 26 — PWA, performance, ship checklist

**Status:** `[~]` E2E smoke landed — manual sign-off pending  
**Plan:** [plans/26-pwa-performance-ship.md](../plans/26-pwa-performance-ship.md)  
**Last updated:** 2026-07-03

## Summary

Installable PWA shell, performance profiles for mobile, CI pipeline, E2E smoke, and ship checklist.

## Done

- **QualityProfile** — `auto` / `low` / `mid` / `high`; device heuristic; low tier disables combat juice
- **Home aura** — particle count scaled by quality; disabled on low tier
- **Save settings** — `settings.quality` (back-compat default `auto`)
- **Settings modal** — performance picker + version row (`0.1.0-mvp`)
- **PWA** — `vite-plugin-pwa`, `public/manifest.json`, SW precache; **GitHub Pages base** `/path-of-dao/`; **landscape** orientation
- **App icons** — `public/icons/icon-512.png` (512×512) + `icon-192.png` via `tools/gen-app-icon.py`
- **Build** — manual chunks (`phaser`, `three`, `vendor`); build + SW generation green
- **CI** — unit job + **e2e job** (Playwright chromium)
- **E2E smoke** — `tests/e2e/smoke.spec.ts`: boot → **Continue Journey** → combat → home → Continue again → vi locale
- **ErrorReporter** — client error ring buffer stub
- **SHIP_CHECKLIST** — [docs/SHIP_CHECKLIST.md](../docs/SHIP_CHECKLIST.md)
- **Tests** — **351 unit + 1 e2e green**

## Remaining

- Lighthouse PWA audit + 30 FPS throttled device sign-off
- Manual SHIP_CHECKLIST walkthrough (10-min playthrough)
- GitHub Pages deploy + `assetlinks.json` for TWA

## Verification

- `npm run typecheck` — clean
- `npm test` — **351 tests green**
- `npm run test:e2e` — **1 smoke green**
- `npm run build` — dist + `sw.js` generated

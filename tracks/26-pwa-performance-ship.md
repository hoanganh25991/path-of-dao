# 26 — PWA, performance, ship checklist

**Status:** `[~]` E2E smoke landed — manual sign-off pending  
**Plan:** [plans/26-pwa-performance-ship.md](../plans/26-pwa-performance-ship.md)  
**Last updated:** 2026-07-04

## Summary

Installable PWA shell, performance profiles for mobile, CI pipeline, E2E smoke, and ship checklist.

## Done

- **QualityProfile** — `auto` / `low` / `mid` / `high`; device heuristic; low tier disables combat juice
- **Fullscreen** — `FullscreenManager` targets `#app` (canvas + HUD); boot attempt on audio-unlock tap; play taps (Journey, world-map Enter, ancient echo confirm); 24h opt-out after manual exit; skipped in standalone PWA; iOS Safari has no element Fullscreen API
- **Home aura** — particle count scaled by quality; disabled on low tier
- **Save settings** — `settings.quality` (back-compat default `auto`)
- **Settings modal** — performance picker + version row (`0.1.0-mvp`)
- **PWA** — `vite-plugin-pwa`, `public/manifest.json`, SW precache; **GitHub Pages base** `/path-of-dao/`; **landscape** orientation
- **App icons** — unarmed cultivator jab pose (no sword — matches T1 mortal start); regen via `python3 tools/gen-app-icon.py`
- **Build** — manual chunks (`phaser`, `three`, `vendor`); build + SW generation green
- **CI** — unit job + **e2e job** (Playwright chromium)
- **E2E smoke** — `tests/e2e/smoke.spec.ts`: boot → **Continue Journey** → combat → home → Continue again → vi locale
- **E2E base flow** — `tests/e2e/journey-flow.spec.ts`: fresh-save ch1–10 road, Echoes paths, world map lock/reload/version (**37 E2E total**)
- **ErrorReporter** — client error ring buffer stub
- **SHIP_CHECKLIST** — [handbook/SHIP_CHECKLIST.md](../handbook/SHIP_CHECKLIST.md)
- **Tests** — **351 unit + 1 e2e green**

## Remaining

- Lighthouse PWA audit + 30 FPS throttled device sign-off
- Manual SHIP_CHECKLIST walkthrough (10-min playthrough)
- GitHub Pages deploy + `assetlinks.json` for TWA

## Verification

- `pnpm typecheck` — clean
- `pnpm test` — **351 tests green**
- `pnpm test:e2e` — **1 smoke green**
- `pnpm build` — `docs/` + `sw.js` generated (GitHub Pages deploy folder)

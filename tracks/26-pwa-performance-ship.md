# 26 — PWA, performance, ship checklist

**Status:** `[~]` E2E smoke landed — manual sign-off pending  
**Plan:** [plans/26-pwa-performance-ship.md](../plans/26-pwa-performance-ship.md)  
**Last updated:** 2026-07-11

## Summary

Installable PWA shell, performance profiles for mobile, CI pipeline, E2E smoke, and ship checklist.

## Done

- **QualityProfile** — `auto` / `low` / `mid` / `high`; device heuristic; low tier disables combat juice
- **Fullscreen** — `FullscreenManager` targets `#app` (canvas + HUD); boot attempt on audio-unlock tap; play taps (Journey, world-map Enter, ancient echo confirm); 24h opt-out after manual exit; skipped in standalone PWA; iOS Safari has no element Fullscreen API
- **Fullscreen setting** — `settings.fullscreen` (Zod `.default(true)`) in save schema; toggle in settings modal (On/Off); `FullscreenManager.request()` checks save setting; re-enabling immediately requests fullscreen
- **Home aura** — particle count scaled by quality; disabled on low tier
- **Save settings** — `settings.quality` (back-compat default `auto`)
- **Settings modal** — performance picker + fullscreen toggle (On/Off) + version row (`0.1.0-mvp`)
- **PWA** — `vite-plugin-pwa`, `public/manifest.json`, SW precache; **GitHub Pages base** `/path-of-dao/`; **landscape** orientation
- **Portrait gate** — `RotatePrompt` + `OrientationManager`: portrait phones see “rotate your device” overlay (en/vi); CSS 90° sideways layout removed; game pauses until landscape
- **App icons** — unarmed cultivator standing pose (no sword, no reticle — Google Play metadata safe); regen via `python3 tools/gen-app-icon.py`
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
- Unit suite green (track 34) — remaining ship blockers are Lighthouse / device FPS / manual checklist

## What needs to do

| # | Task | How |
|---|------|-----|
| 1 | ~~`pnpm test` — triage and fix all failing unit tests~~ | track 34 — `[x]` done |}
| 2 | `pnpm test:e2e` — full 37-case suite green | CI |
| 3 | Lighthouse PWA audit on production build (`docs/` or deploy URL) | manual |
| 4 | Chrome **CPU 6× slowdown** — combat 30 FPS for 5 min on Android mid-tier | manual |
| 5 | Walk [handbook/SHIP_CHECKLIST.md](../handbook/SHIP_CHECKLIST.md) — sign each row | manual |
| 6 | 10-min playthrough — zero console errors (plan 34 DevTools pass) | manual |
| 7 | Deploy GitHub Pages + verify SW + landscape manifest | ops |

## Verification

- `pnpm typecheck` — clean
- `pnpm test` — all unit tests green
- `pnpm test:e2e` — smoke + journey-flow green
- `pnpm build` — `docs/` + `sw.js` generated

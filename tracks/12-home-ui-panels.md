# 12 — Home UI panels & navigation

**Status:** `[x]` Done  
**Plan:** [plans/12-home-ui-panels.md](../plans/12-home-ui-panels.md)  
**Last updated:** 2026-07-04

## Summary

Home screen navigation with bottom tabs, profile header, and slide-up panels.

## Done

- Bottom nav: Journey, Echoes, Inventory, Skills, Path
- Play panel: **Begin / Continue Journey** (no dev Home/Combat icons — combat uses pause menu)
- **Journey complete** copy when all maps cleared; Map Portal remains for revisits
- **Fullscreen on play** — Begin/Continue Journey and Map Portal Enter call `FullscreenManager.requestOnPlay()` (user gesture)
- Breakthrough-ready toast when Cultivate becomes available
- English and Vietnamese home UI strings
- Path tab story replay buttons (`home-story-replay-{sceneId}`) — fixed testid binding
- **Settings → Replay from Beginning** — confirm dialog; wipes journey progress via `gameStore.newGame({ preserveSettings: true })`; keeps locale, quality, and volume prefs

## Remaining

None for this sub-plan.

## Verification

- All four tabs open correct panels at mobile viewport

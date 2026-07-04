# 02 — Scene router & app shell

**Status:** `[x]` Done  
**Plan:** [plans/02-scene-router-app-shell.md](../plans/02-scene-router-app-shell.md)  
**Last updated:** 2026-07-04

## Summary

App shell that swaps between Home, combat, and story without a full page reload.

## Done

- Scene router switches active canvas and scene host
- Game shell layout: game canvas + UI overlay layer
- Stub hosts for Home and combat scenes
- Loading overlay during scene transitions
- Dev navigation shortcuts for quick scene switching
- Pause/resume hooks when the browser tab hides
- Viewport fill: `syncGameCanvasDisplay` + `object-fit: cover` on `.game-canvas` so Phaser combat canvas scales to `#game-shell` on wide desktops (2026-07-04)

## Remaining

None for this sub-plan.

## Verification

- Multiple Home ↔ combat switches without console errors

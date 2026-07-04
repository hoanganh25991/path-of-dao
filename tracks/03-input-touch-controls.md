# 03 — One-thumb input & virtual joystick

**Status:** `[x]` Done  
**Plan:** [plans/03-input-touch-controls.md](../plans/03-input-touch-controls.md)  
**Last updated:** 2026-07-04

## Summary

Mobile-first touch controls: virtual joystick plus attack, skill, and dodge buttons.

## Done

- Virtual joystick for movement on touch devices
- Action buttons for attack, skill, and dodge
- Central input manager normalizes touch and keyboard
- Combat HUD hosts joystick and buttons at mobile viewport
- Keyboard fallback for desktop dev (WASD + action keys)
- Android Chrome joystick fix: window-level pointer tracking + HUD-relative layout coords (2026-07-04)
- Fullscreen on play entry (Journey, ancient echo, world map) via `FullscreenManager` — see track 26 (2026-07-04)
- Viewport sizing: combat canvas CSS fill sync on layout change; HUD coords unchanged (2026-07-04)
- Skill picker: allow duplicate loadout assignments; pool icon highlights assigned skill only (2026-07-04)
- Combat action cluster: attack anchor bottom-right; slot order primary → secondary → ultimate (2026-07-04)
- Dash (dodge): 3× distance (288px), full-duration i-frames (2026-07-04)

## Remaining

None for this sub-plan.

## Verification

- Controls responsive at 390×844 mobile viewport

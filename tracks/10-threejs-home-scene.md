# 10 — Three.js home scene & hero viewer

**Status:** `[x]` Done *(Tiên Nghịch gap open)*  
**Plan:** [plans/10-threejs-home-scene.md](../plans/10-threejs-home-scene.md)  
**Last updated:** 2026-07-03

## Summary

3D Home shrine with floating island, procedural hero viewer, realm aura tiers, and journey-synced environment palette per chapter.

## Done

- Home scene with floating mountain village environment
- Procedural hero model (no GLB required for MVP); robe/skin/gold colors match `PALETTE_HERO` (`stickyManPalette.ts`)
- Trees, lanterns, and cloud decoration
- **Journey-synced backdrop** — sky/fog/island/lantern colors follow current road map chapter (`getJourneyHomeMapId` → `homeEnvironmentThemes`)
- **Chapter signature prop** on island edge (ruined pillar, mist pine, moon stone, etc.) — gentle idle sway
- Orbit camera: touch rotate, pinch zoom, double-tap reset
- Aura controller shows cultivation tier from current realm
- Aura visible from Core Formation tier upward when realm progresses
- Pulsing point light for faint+ aura tiers

## Remaining

- **Tiên Nghịch gap:** hero should show empty hands until sword milestone (T8)

## Verification

- Browser smoke: island renders, camera controls work
- Unit: `tests/unit/home-environment-themes.test.ts` — chapter palette + journey map resolution
- Five Home ↔ combat switches without console errors; backdrop updates after map visit

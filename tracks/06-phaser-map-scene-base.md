# 06 — Phaser map scene base & camera

**Status:** `[x]` Done  
**Plan:** [plans/06-phaser-map-scene-base.md](../plans/06-phaser-map-scene-base.md)  
**Last updated:** 2026-07-04

## Summary

2D combat maps load from Tiled JSON with collision, camera follow, and exit back to Home.

## Done

- Map loader reads validated map config and tile data
- Boot scene hands off to the active map scene
- Collision layer blocks player movement (walls, water, obstacles)
- Camera follows player with deadzone and map bounds clamp
- Dev exit zone returns to Home when waves are clear
- Test grove map generated for early development
- Collision tiles visible on the decoration layer (hidden collision layer still authoritative)
- **Pause menu integration:** `combat:request-exit` / `combat:request-save` / `combat:pause-changed` wired in MapScene; shared `finishMapExit()` for EXIT zone, pause, and death Return Home
- **Tu Chân Tinh sub-zones:** `spawnMode: roam`, `portals[]`, `portalSpawns`, `ZonePortalManager` door transitions via BootScene reload; `RoamingSpawnManager` placed enemies with respawn

## Remaining

- Migrate remaining explore maps (ch2–5) to star zone architecture
- Star zone visual identity per region (unique tilesets beyond grove palette)

## Verification

- Tilemap renders; walls block movement
- Camera follow and bounds work on test map
- Exit zone returns Home after clearing waves (wave mode) or anytime (roam explore)
- Pause → Return Home saves and returns Home (retreat without clear)
- Death → Try Again respawns wave; Return Home saves and retreats
- Runtime stats persist across combat ↔ Home round trip
- Star zone unit tests: `star-zone-map`, `roam-loader`, `star-constants`

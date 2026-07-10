# 06 — Phaser map scene base & camera

**Status:** `[~]` In progress  
**Plan:** [plans/06-phaser-map-scene-base.md](../plans/06-phaser-map-scene-base.md)  
**Related:** [fake-2.5d.md](../plans/fake-2.5d.md) · [map-design-canon.md](../plans/map-design-canon.md)  
**Last updated:** 2026-07-10

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
- **Scene lifecycle guard:** `MapScene.teardown()` now safely checks `this.scene?.isPaused()` before resuming, fixing a null-scene crash during shutdown/destroy
- **Procedural world** — `ProceduralWorldLoader`, `ProceduralCellGenerator`, `ProceduralRoamingSpawnManager`, `EndlessGround`, `WorldFog`, `world.*.json` profiles
- **Per-map terrain themes** — `groundPalette` primary tile per region (grass / dirt / sand / gravel / rock); biome tints sand·rock·gravel; camera fill follows dominant tile; **Heng Yue Gate** (`world.fallen_village.gate`) uses dirt/gravel mountain trail vs village grass
- **Combat camera director** — engage zoom (`CombatCameraDirector`)
- Cultivator **defeat** flow (in-place sit + recovery) — partial vs [combat-defeat-canon.md](../plans/combat-defeat-canon.md)

## Remaining

- Procedural **settlement clusters + signature tree** per `worldProfile` (user: keep procedural, add props)
- Cultivator defeat: optional `returnToOrigin` + `defeatRecoverMs` bands — simplified in-place OK for MVP
- `opponentKind: beast|cultivator` in enemy JSON — beasts despawn, cultivators recover

## Verification

- Tilemap renders; walls block movement
- Camera follow and bounds work on test map
- Exit zone returns Home after clearing waves (wave mode) or anytime (roam explore)
- Pause → Return Home saves and returns Home (retreat without clear)
- Death → Try Again respawns wave; Return Home saves and retreats
- Runtime stats persist across combat ↔ Home round trip
- Star zone unit tests: `star-zone-map`, `roam-loader`, `star-constants`

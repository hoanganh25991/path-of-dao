# 06 — Phaser map scene base & camera

**Status:** `[x]` Done  
**Plan:** [plans/06-phaser-map-scene-base.md](../plans/06-phaser-map-scene-base.md)  
**Last updated:** 2026-07-02

## Summary

2D combat maps load from Tiled JSON with collision, camera follow, and an exit zone back to Home.

## Done

- Map loader reads validated map config and tile data
- Boot scene hands off to the active map scene
- Collision layer blocks player movement (walls, water, obstacles)
- Camera follows player with deadzone and map bounds clamp
- Dev exit zone returns to Home when waves are clear
- Test grove map generated for early development
- Collision tiles visible on the decoration layer (hidden collision layer still authoritative)

## Remaining

None for this sub-plan.

## Verification

- Tilemap renders; walls block movement
- Camera follow and bounds work on test map
- Exit zone returns Home after clearing waves
- Runtime stats persist across combat ↔ Home round trip

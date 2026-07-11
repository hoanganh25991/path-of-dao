# 06 — Phaser map scene base & camera

**Status:** `[~]` In progress  
**Plan:** [plans/06-phaser-map-scene-base.md](../plans/06-phaser-map-scene-base.md)  
**Related:** [fake-2.5d.md](../plans/fake-2.5d.md) · [map-design-canon.md](../plans/map-design-canon.md)  
**Last updated:** 2026-07-11

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
- **Procedural cultivator power** — `PROCEDURAL_BASE_POWER = 0.5` on `mapBaseMultiplier` (2026-07-10 playtest: ch1 near-spawn was ~3–5× authored JSON, L1 hits barely moved HP); distance/cell rank curve unchanged
- **Procedural settlements + signature tree** — `ProceduralWorldConfig` gained optional `settlements[]` / `signatureTree`; `ProceduralSettlementGenerator` deterministically places ≥1 settlement cluster + exactly one landmark tree per map from `worldSeed` (seeded default hamlet + generic tree when a profile omits them); `SettlementDecorator` renders clusters as non-colliding sprites/rects (house/hut sprite reuse + colored-rect well/wall/watchtower/pavilion/shrine/sect_gate) in `MapScene`; **all 11 world profiles now authored** matching `map-design-canon.md` §4.3 roster — `world.fallen_village` (ruin_village/scorched_elm), `world.fallen_village.gate` (sect_courtyard/jade_pine), `world.mist_forest` (hamlet/mist_birch), `world.stone_canyon` (outpost/cliff_juniper), `world.moon_lake` (shrine_cluster/seal_oak), `world.burning_desert` (nomad_camp/desert_ghaf), `world.thunder_peaks` (sect_courtyard/altar_cedar), `world.frozen_palace` (palace_ruin/frost_paulownia), `world.abyss_rift` (ruin_village/void_bristle), `world.heavenly_gate` (sect_courtyard/trial_bodhi), `world.void_throne` (palace_ruin/dao_world_tree)
- **Per-map terrain themes** — `groundPalette` primary tile per region (grass / dirt / sand / gravel / rock); biome tints sand·rock·gravel; camera fill follows dominant tile; **Heng Yue Gate** (`world.fallen_village.gate`) uses dirt/gravel mountain trail vs village grass
- **Combat camera director** — engage zoom (`CombatCameraDirector`); attack/skill punch-in always noticeable; seated gather-qi holds close-up (`player:meditate-started` / `ended`)
- Cultivator **defeat** flow — sit gather-qi **in place** (2026-07-10: removed instant teleport to spawn, which looked like a despawn when the fight drifted from the slot); beasts still pool-release; bosses sit stay-down
- **`opponentKind: beast|cultivator`** — `shouldDespawnOnDefeat()` = beasts only. Ch1 `spirit_pest` no longer reuses villager art (was beast + human sprite → looked like cultivator then vanished); now `enemy_mist_wisp`

## Remaining

- Cultivator defeat: optional `returnToOrigin` + `defeatRecoverMs` bands — simplified in-place OK for MVP

## What needs to do

| # | Task | Files |
|---|------|-------|
| 1 | ~~Spawn settlement cluster props from `worldProfile.settlements[]` (ruin_village, hamlet, …)~~ | `[x]` `ProceduralSettlementGenerator`, `SettlementDecorator`, `MapScene` |
| 2 | ~~One **signature tree** sprite per map at seeded anchor~~ | `[x]` `ProceduralSettlementGenerator.generateSignatureTreePlacement`, `SettlementDecorator.renderSignatureTree` (scaled `STRUCTURE_TEXTURES.tree`) |
| 3 | ~~Add `opponentKind` to enemy schema + content JSON~~ | `[x]` `CultivatorConfig.ts` (`OPPONENT_KINDS`), all `content/enemies/*.json` |
| 4 | ~~Beasts: defeat → despawn/pool; cultivators: sit-recover (current partial flow)~~ | `[x]` `Cultivator.isBeast`, `defeatRouting.ts`, `SpawnManager`/`RoamingSpawnManager`/`ProceduralRoamingSpawnManager` |
| 5 | Optional: `defeatRecoverMs` per enemy tier | `combat-defeat-canon.md` — defer if MVP tight |
| 6 | Art polish: dedicated per-species tree sprites (roster in `map-design-canon.md` §4.3, now fully authored across all 11 world profiles) instead of shared scaled-up biome tree; richer structure art beyond colored rects | `design-arts`, `StructureRegistry` |

## Verification

- Tilemap renders; walls block movement
- Camera follow and bounds work on test map
- Exit zone returns Home after clearing waves (wave mode) or anytime (roam explore)
- Pause → Return Home saves and returns Home (retreat without clear)
- Death → Try Again respawns wave; Return Home saves and retreats
- Runtime stats persist across combat ↔ Home round trip
- Star zone unit tests: `star-zone-map`, `roam-loader`, `star-constants`
- Procedural settlements: `settlement-generator.test.ts` — deterministic placements (same seed → identical layout), ≥1 settlement + 1 signature tree for profiles with and without authored `settlements`/`signatureTree`, distinct anchors across seeds
- Procedural rank: `procedural-world.test.ts` — ch1 `mapBaseMultiplier ≈ 0.5`; ch3 far elite still ≫ ch1 near
- `opponentKind`: `cultivator-config.test.ts` (schema default/enum, content population), `defeat-routing.test.ts` (beast despawn vs cultivator/boss sit-recover)

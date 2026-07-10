# 29 — Combat visual integration (Fake 2.5D + hooks)

**Status:** `[~]` In progress  
**Plan:** [plans/29-pixel-art-combat-canon.md](../plans/29-pixel-art-combat-canon.md)  
**Related:** [fake-2.5d.md](../plans/fake-2.5d.md) · [design-arts/](../plans/design-arts/index.md) (plan 32)  
**Last updated:** 2026-07-10

## Summary

Combat art **integration** contract — y-sort, anim keys, hit-frame alignment, camera juice, wheel HUD consumption. Art **authoring** lives in plan 32 (`design-arts/`).

## Done

- Procedural **sticky-man** hero sheets (`registerHeroCombatAssets`, `hero_strike_*` / weapon strikes)
- Y-sort depth on player + cultivators; sprite shadows on entities
- 2.5D tileset system (25 tiles, 8 biome palettes) + sprite environment props
- `CombatCameraDirector` — engage zoom on combat; shake scaled via `skillVfxPower`
- Hit-stop, crit flash, combat juice bridge wired
- Intent-unique pixel VFX textures + `skillVfxProfile` tier mapping (plan 19)
- Enemy anim keys per family (slime, archer, totem pattern)
- Ancient echo aura ring + themed palette (not full-body tint wash)

## Remaining

- **DA-01…03** authored PNG sprites replace procedural sticky-man (plan 32) — ship gate §0
- Layered prop exports (roof/wall/trunk/canopy) per `fake-2.5d.md` — structures still tile/sprite placeholders
- Optional Light2D quality tier (plan 26 profile)
- Full anim contract QA on all 25 enemy types + 8 bosses
- Wheel icon PNGs (DA-04) on combat HUD
- Physics debug / anim debug flags documented — must stay off in smoke builds

## Verification

- Hero shows limbs at 2× zoom (not fillRect) on test + ch1 maps
- `tests/unit/skill-vfx-power.test.ts` green
- Manual: no magenta physics boxes at `pnpm dev` without `VITE_COMBAT_PHYSICS_DEBUG`

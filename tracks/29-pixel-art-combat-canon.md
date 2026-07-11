# 29 — Combat visual integration (Fake 2.5D + hooks)

**Status:** `[~]` In progress  
**Plan:** [plans/29-pixel-art-combat-canon.md](../plans/29-pixel-art-combat-canon.md)  
**Related:** [fake-2.5d.md](../plans/fake-2.5d.md) · [design-arts/](../plans/design-arts/index.md) (plan 32)  
**Last updated:** 2026-07-11

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
- **Beast creature silhouettes** (2026-07-10) — `drawCreatureFrame` for blob/quadruped/arachnid/avian/spectral/drake; cultivators stay sticky-man; amber beast HP + distinct defeat toast
- **DA-08 auto-wire hook-up** (2026-07-11) — `registerHeroCombatAssets` now checks `AssetArtRegistry` first: a PNG at `assets/sprites/hero/{attackStyle}.png` fully replaces the sticky-man sheet (same frame order, zero anim-offset changes); a `manifest.json` hero entry overrides only the anim keys it declares. `BootScene.preload` calls `preloadHeroArt` for the save's current attack style. No authored PNGs exist yet, so sticky-man is unaffected.

## Remaining

- **DA-01…03** authored PNG sprites replace procedural sticky-man (plan 32) — ship gate §0; drop `assets/sprites/hero/{unarmed|sword|lance|stick}.png` once ready, no code change needed (DA-08)
- Layered prop exports (roof/wall/trunk/canopy) per `fake-2.5d.md` — structures still tile/sprite placeholders
- Optional Light2D quality tier (plan 26 profile)
- Full anim contract QA on all 25 enemy types + 8 bosses
- Wheel icon PNGs (DA-04) on combat HUD
- Physics debug / anim debug flags documented — must stay off in smoke builds
- Ice golem / totem beasts still humanoid stone (intentional); optional creature golem later

## What needs to do

| # | Task | Owner |
|---|------|-------|
| 1 | Export **DA-01** hero sheet — unarmed + sword; drop in `assets/sprites/hero/` | 32 |
| 2 | ~~Wire DA-08 auto-wire manifest so new PNGs replace sticky-man without code edit~~ `[x]` Done 2026-07-11 | 32 |
| 3 | Per-enemy anim QA checklist (idle/walk/attack) for all 41 types | 29 §0.1 |
| 4 | Layered prop test map — one building with roof/wall/trunk layers + y-sort | 06 + 32 DA-09 |
| 5 | Combat HUD: consume DA-04 wheel icons when files exist | 30 |
| 6 | Ship QA: plan 29 §0.2 five-point visual checklist on 844×390 | 34 |

## Verification

- Hero shows limbs at 2× zoom (not fillRect) on test + ch1 maps
- `tests/unit/skill-vfx-power.test.ts` green
- Manual: no magenta physics boxes at `pnpm dev` without `VITE_COMBAT_PHYSICS_DEBUG`
- `tests/unit/asset-art-registry.test.ts` green — DA-08 resolve order + fallback safety

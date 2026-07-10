# 23 — MVP enemies, bosses, skill data

**Status:** `[~]` In progress  
**Plan:** [plans/23-mvp-enemies-bosses-skills.md](../plans/23-mvp-enemies-bosses-skills.md)  
**Last updated:** 2026-07-10

## Summary

Full MVP roster: 40 skills, 41 enemies, loot tables, boss phases, and skill unlock progression.

## Done

- Forty skills total: twelve signatures plus twenty-eight variants
- English and Vietnamese skill name/description strings
- Forty-one enemy files including training dummy, elite shadow, spirit fox
- Loot tables for five rarity tiers
- **Combat item drops** — `rollCultivatorLoot()` + magnet pickups; rates in `content/loot/_drop_rates.json`
- **Loot hints** — combat HUD strip + Bestiary section on Path tab (per-cultivator drop % and item preview)
- Boss phase tracking wired into wave spawner
- Skill unlock hooks: level up, boss clear, chapter story completion
- **Road techniques** — `byMapClear` on all ten explore maps (`.01`); `byChapter` rewards for all ten finales
- Unlocked-skills field on player save
- Enemy HP balance reference table for designers
- **Tiên Nghịch level design (ch1–3):** `enemy.heng_yue.disciple`, village roam roster, encounter tables, bestiary lore — see [21](./21-mvp-maps-chapters-1-5.md)
- Generation CLIs for skills and enemy patches
- **Boss distinct patterns (P1 #6)** — high-leverage pass across all 10 `content/enemies/boss.*.json` (track lists 8, but 10 ship):
  - `combat:boss-phase-changed` event (`EventBus`) fires on real phase crossings (skips the trivial opening `hpThreshold: 1` entry so it doesn't fire on the first hit of every fight)
  - `CombatJuiceBridge` applies camera shake/hit-stop/darken on the event; `AudioDirector` plays `boss.telegraph` + `boss.phase_change` SFX — juice/SFX now fire on phase change, not only on defeat
  - Per-boss and per-phase telegraph overrides: `telegraphMs`, `strikeMs`, `telegraphColor` on `CultivatorConfig`/`BossPhaseConfig`, resolved by `resolveAttackTiming()` (phase → cultivator → engine default) and consumed by `Cultivator.beginAttack`/`updateAttackPhase`
  - `attackShape: 'circle' | 'aoe_ring' | 'projectile'` content field (cultivator + optional per-phase override); `dispatchAttackShape()` branches `SpawnManager`/`RoamingSpawnManager`/`ProceduralRoamingSpawnManager.resolveStrike` on it while preserving legacy `ranged_kiter`/`stationary` archetype behavior for non-boss enemies
  - All 10 bosses tuned distinct — see table below

## Remaining

- Unique per-boss move scripts (`BossAttackScript`-style authored sequences) and enrage timers — deliberately deferred; current pass is telegraph/shape/adds only, not full scripted phases
- Six skills with full awakening VFX sprite pass (plans 29 + 32)

## Boss pattern matrix (shipped 2026-07-10)

| Boss | Fantasy | `attackShape` | Telegraph | Adds / phases | Range / cooldown |
|------|---------|----------------|-----------|----------------|-------------------|
| `boss.jade_guardian` | Ward + disciples | circle → `aoe_ring` p2 | 360ms (slow, tutorial-generous) | p2 (0.5): 2× `enemy.heng_yue.disciple` | range 48, cd 1400ms |
| `boss.mist_stalker` | Fog / long menace | projectile | 300ms | p2 (0.5): 2× `enemy.spirit.wisp` | range 130 (raised from 44), cd 1500ms |
| `boss.bandit_lord` | Wave cadence | circle | 220ms (fast) | p2 (0.5): 2× `enemy.bandit.thug` | range 52, cd 900ms |
| `boss.seal_warden` | Seal AoE | `aoe_ring` | 450ms (slow, wide) | none | range 180 (kept), cd 1700ms |
| `boss.desert_sovereign` | Heat / flame | `aoe_ring` | 320ms | p2 (0.5): 2× `enemy.sand.wisp` | range 90, cd 1300ms |
| `boss.thunder_avatar` | Tribulation | projectile | 180ms (fast flash) | p2 (0.5): 2× `enemy.lightning.sprite` | range 140, cd 1100ms |
| `boss.frost_queen` | Ice / memory | `aoe_ring` | 400ms (slow) | p2 (0.5): 2× `enemy.frost.shade` | range 100, cd 1450ms |
| `boss.rift_horror` | Rift chaos | circle (kept) | 260ms | p2 (0.5): 2× `enemy.rift.spawn` (unchanged) | range 56, cd 1000ms |
| `boss.celestial_guardian` | Gate trial | projectile | 320ms | none | range 200 (kept), cd 1400ms |
| `boss.void_sovereign` | Final — 3 phases | circle → `aoe_ring` p2 → circle p3 | escalating 300→260→180ms | p3 (0.25): 2× `enemy.void.shade` (kept) | range 56, cd 1200ms |

## Verification

- `pnpm test`: **96 test files, 584 tests** green (incl. new `boss-phase-tracker.test.ts`, `attack-timing.test.ts`, `boss-distinct-patterns.test.ts`)
- `tsc --noEmit` clean
- MVP content data tests pass; road progression sim through ch10

# 08 — Cultivator system & AI archetypes

**Status:** `[x]` Done  
**Plan:** [plans/08-enemy-system-ai.md](../plans/08-enemy-system-ai.md)  
**Last updated:** 2026-07-04

## Summary

Tu Sĩ (cultivators) spawn in scaled waves, behave by archetype, drop rewards on non-lethal defeat, and feed XP and bestiary progress.

## Done

- `Cultivator` entity (renamed from Enemy) with health, AI, telegraphed attacks
- Non-lethal defeat: 0 HP → sit/meditation at spawn → recover in place → fight again (roaming stays in world)
- `EncounterScaling`: solo 1 · squad 10 · horde 100 · mass 500 by player realm vs map `recommendedRealmOrder`
- `CultivatorPool` prewarms 20/type; live cap up to 18 during mass-tier queue drain
- `CombatCameraDirector` in MapScene — zoom by `combatReadyCount` (solo 1.05 → mass 0.58); attack/skill engagement pulse zooms in for duels
- Map intro shows encounter tier hint (solo → mass) from player realm vs map cap
- Defeat toast + `enemy.defeated` SFX (non-lethal copy — Tu Sĩ sits to recover, not die)
- `AoeScaling` wired into basic attack + skill effects (realm/level widen arcs and radii)
- AI archetypes: melee chaser, kiting archer, patrol, stationary totem
- Wave spawner clears map when all waves defeated; roaming uses in-place recovery
- Events: `map:cultivator-defeated` (+ `map:enemy-killed` alias for audio/juice)
- i18n: EN Cultivator / VI Tu Sĩ; defeat copy uses "lose exchange" not kill/die
- Tests: `cultivator-pool`, `cultivator-config`, `encounter-scaling`, `aoe-scaling`

## Remaining

- Rename content folder `content/enemies/` → `content/cultivators/` (optional; IDs stay `enemy.*` for saves)
- Visual polish: distinct sit pose per sprite variant (shared `POSES_SIT` today)

## Verification

- `pnpm test` — cultivator-pool, cultivator-config, encounter-scaling, aoe-scaling, rewards, combat-resolver
- Roaming: defeated cultivator returns to spawn sit pose and recovers without despawn
- Over-leveled return visit: first wave scales toward 100–500 cultivators per tier

# 08 — Cultivator system & AI archetypes

**Status:** `[x]` Done  
**Plan:** [plans/08-enemy-system-ai.md](../plans/08-enemy-system-ai.md)  
**Last updated:** 2026-07-10

## Summary

Tu Sĩ (cultivators) spawn in scaled waves, behave by archetype, drop rewards on non-lethal defeat, and feed XP and bestiary progress.

## Done

- `Cultivator` entity (renamed from Enemy) with health, AI, telegraphed attacks
- Non-lethal defeat: 0 HP → sit/meditation at spawn → recover in place → fight again (roaming stays in world)
- **Defeat UX polish** — HP bar empties (`setScale(0,1)`) and hides on defeat; reappears when cultivator fully recovers; grey tint + alpha fade during defeat state
- `EncounterScaling`: solo 1 · squad 10 · horde 100 · mass 500 by player realm vs map `recommendedRealmOrder`
- `CultivatorPool` prewarms 20/type; live cap up to 18 during mass-tier queue drain
- `CombatCameraDirector` in MapScene — zoom by `combatReadyCount` (solo 1.05 → mass 0.58); attack/skill engagement pulse zooms in for duels
- **Camera tuning** — engagement boost cap increased for solo (0.22) and squad (0.12) to sustain zoom-in during duels; engagement decay slowed to 0.16/s for longer close-in feel
- Map intro shows encounter tier hint (solo → mass) from player realm vs map cap
- Defeat toast + `enemy.defeated` SFX (non-lethal copy — Tu Sĩ sits to recover, not die)
- `AoeScaling` wired into basic attack + skill effects (realm/level widen arcs and radii)
- **AOE tuning** — `REALM_STEP` 0.38 (+19%), `LEVEL_STEP` 0.08 (+33%), `BASIC_ATTACK_REALM_BONUS` 0.35 (+59%); melee arc widened to 0.8 + 0.45× scale, capped at 270° — powers up skills and basic attacks as player grows
- AI archetypes: melee chaser, kiting archer, patrol, stationary totem
- Wave spawner clears map when all waves defeated; roaming uses in-place recovery
- Events: `map:cultivator-defeated` (+ `map:enemy-killed` alias for audio/juice)
- i18n: EN Cultivator / VI Tu Sĩ; defeat copy uses "lose exchange" not kill/die
- **Roaming rank scaling (distance + time):** `RoamingRankScaler` computes 0–3 rank per slot from player spawn distance + map elapsed time; capped by `recommendedRealmOrder` (map design ceiling). Ranked cultivators get +25%/rank stat multiplier via `StatModifier`, colored aura ring + orbit sparkles, and rank-colored HP bar.
- **Enemy pool variety:** `RoamConfig` schema extended with optional `enemyPool` array; slot picks higher-index enemy at higher rank for natural difficulty progression. Backward compatible with single `enemyId`.
- Tests: `cultivator-pool`, `cultivator-config`, `encounter-scaling`, `aoe-scaling`

## Remaining

- Rename content folder `content/enemies/` → `content/cultivators/` (optional; IDs stay `enemy.*` for saves)
- Visual polish: distinct sit pose per sprite variant (shared `POSES_SIT` today)

## What needs to do (follow-up — ties to track 06)

| # | Task |
|---|------|
| 1 | Add `opponentKind: 'beast' \| 'cultivator'` to enemy JSON schema + all 41 files |
| 2 | Beasts: defeat → despawn to pool (no sit-recover); cultivators: keep current flow |
| 3 | Boss flag + `defeatRecoverMs` optional override per `combat-defeat-canon.md` |

## Verification

- `pnpm test` — cultivator-pool, cultivator-config, encounter-scaling, aoe-scaling, rewards, combat-resolver
- Roaming: defeated cultivator returns to spawn sit pose and recovers without despawn; **boss roam slots stay down** (no recovery) for the session
- Boss ordeal maps: `requiredBossId` on map config gates depart portal until the gate boss is defeated
- Over-leveled return visit: first wave scales toward 100–500 cultivators per tier

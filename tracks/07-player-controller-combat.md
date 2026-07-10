# 07 — Player controller & basic combat

**Status:** `[x]` Done  
**Plan:** [plans/07-player-controller-combat.md](../plans/07-player-controller-combat.md)  
**Last updated:** 2026-07-10

## Summary

Playable hero with 3-hit combo, dodge with invulnerability, skill bolt, meditation recovery, and combat HUD.

## Done

- Player entity with movement and facing (including attack-time facing from stick input)
- Pure state machine for idle, walk, attack, dodge, hit, death
- 3-hit attack combo that chains on button press
- **Unarmed strikes** — random light punch/kick on steps 1–2; rotating heavy finisher on step 3 (`strikeKind` → `hero_strike_*` anims)
- **Armed combo — random weapon animations** — weapon strikes (`wepSlash1`, `wepChop1`, `wepSlash2`, `wepThrust2`, `wepSlam3`, `wepSpin3`) randomly selected per step via step-aware pickers; separate anims for light vs heavy steps; unarmed strike variety unchanged
- **Hold-to-attack** — basic attack triggers on both `pressed` and `held` input, enabling continuous auto-attack from holding the button
- **Weapon-specific animation branching** — sword/lance/stick use weapon strike anims; unarmed uses separate strike kinds when no weapon; ancient echoes remap weapon strikes to generic attack steps
- Hero spritesheet rebuilt per map via `registerHeroCombatAssets()` from `resolveAttackStyle(save)` (T1, T3)
- Dodge travels a fixed distance with i-frames and afterimage VFX
- **Meditate skill** (`skill.basic.meditate`, **Gather Qi** / **Hấp Khí**) — dedicated health button (like dodge); toggle sit pose + spirit wisps; fastest HP and mana regen; cancels on move/attack/dodge/hit
- **Passive HP/mana regen** by state — meditate 6×, walk 0.5×, combat 0.3×; scales with level + realm; mana rate = HP rate × `manaMax/hpMax` (`HealthRegen.ts`)
- Skill button spends mana and fires a spirit bolt
- HP and mana bars in combat HUD
- Combat runtime (HP, mana, position) saved when leaving a map
- Death pauses combat; **Try Again** respawns at spawn with full HP; **Return Home** retreats via shared map exit
- Input fix: button presses no longer missed between poll and game loop

## Remaining

None for core combat loop.

## Verification

- 3-hit combo chains correctly on test map (unarmed strike variety + random weapon strikes per step)
- Hold-to-attack triggers repeated attacks via `held` input
- Weapon anims play when equipped; unarmed anims when weapon slot empty
- Dodge i-frames prevent damage
- Meditate toggles sit pose; move/attack interrupts (`tests/unit/meditation-skill.test.ts`)
- Regen formula covered (`tests/unit/health-regen.test.ts`)
- Skill spends 20 mana and spawns bolt
- Mana persists after returning Home and re-entering combat
- Equipping a weapon swaps attack visuals and hitbox reach; unarmed when weapon slot empty

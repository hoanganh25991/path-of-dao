# 07 — Player controller & basic combat

**Status:** `[x]` Done  
**Plan:** [plans/07-player-controller-combat.md](../plans/07-player-controller-combat.md)  
**Last updated:** 2026-07-03

## Summary

Playable hero with 3-hit combo, dodge with invulnerability, skill bolt, and combat HUD.

## Done

- Player entity with movement and facing (including attack-time facing from stick input)
- Pure state machine for idle, walk, attack, dodge, hit, death
- 3-hit attack combo that chains on button press
- **Unarmed strikes** — random light punch/kick on steps 1–2; rotating heavy finisher on step 3 (`strikeKind` → `hero_strike_*` anims)
- **Armed combo** — `hero_sticky_attack_1/2/3` when a weapon is equipped; prop type from item (`sword` / `lance` / `stick`)
- Hero spritesheet rebuilt per map via `registerHeroCombatAssets()` from `resolveAttackStyle(save)` (T1, T3)
- Dodge travels a fixed distance with i-frames and afterimage VFX
- Skill button spends mana and fires a spirit bolt
- HP and mana bars in combat HUD
- Combat runtime (HP, mana, position) saved when leaving a map
- Death pauses combat; **Try Again** respawns at spawn with full HP; **Return Home** retreats via shared map exit
- Input fix: button presses no longer missed between poll and game loop

## Remaining

None for core combat loop.

## Verification

- 3-hit combo chains correctly on test map (unarmed strike variety + armed weapon combo)
- Dodge i-frames prevent damage
- Skill spends 20 mana and spawns bolt
- Mana persists after returning Home and re-entering combat
- Equipping a weapon swaps attack visuals and hitbox reach; unarmed when weapon slot empty

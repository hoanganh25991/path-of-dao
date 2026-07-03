# 07 — Player controller & basic combat

**Status:** `[x]` Done *(Tiên Nghịch gap open)*  
**Plan:** [plans/07-player-controller-combat.md](../plans/07-player-controller-combat.md)  
**Last updated:** 2026-07-02

## Summary

Playable hero with 3-hit combo, dodge with invulnerability, skill bolt, and combat HUD.

## Done

- Player entity with movement and facing
- Pure state machine for idle, walk, attack, dodge, hit, death
- 3-hit attack combo that chains on button press
- Dodge travels a fixed distance with i-frames and afterimage VFX
- Skill button spends mana and fires a spirit bolt
- HP and mana bars in combat HUD
- Combat runtime (HP, mana, position) saved when leaving a map
- Input fix: button presses no longer missed between poll and game loop

## Remaining

- **Tiên Nghịch gap:** attacks still use sword visuals; need unarmed palm combo until Ancient Spirit Sword is earned (T1, T3)

## Verification

- 3-hit combo chains correctly on test map
- Dodge i-frames prevent damage
- Skill spends 20 mana and spawns bolt
- Mana persists after returning Home and re-entering combat

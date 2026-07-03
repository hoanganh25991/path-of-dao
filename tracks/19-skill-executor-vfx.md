# 19 — Skill executor & cultivation VFX

**Status:** `[~]` In progress  
**Plan:** [plans/19-skill-executor-vfx.md](../plans/19-skill-executor-vfx.md)  
**Last updated:** 2026-07-03

## Summary

Data-driven skill casting with composable effects and cultivation-themed VFX presets.

## Done

- Skill cast pipeline wired through combat (mana, cooldown, effects)
- Composable effect types: projectile, melee arc, heal, pull field, AoE circle
- VFX presets: cast ring, slash arc, spirit bolt, heal bloom, flame petal, void crack
- Cooldown manager per skill slot
- Awakened void: pull field then projectile
- Awakened flame: twin AoE damage ticks
- Extended skill definition schema validated at load

## Remaining

- Sword Intent gating in executor and skill picker (T7)
- Audio sync on cast/impact frames from skill data
- More skills need unique VFX beyond presets
- BGM crossfade between scenes (owned partly by 25)

## Verification

- Mana spend, cooldown, and effect dispatch unit tested

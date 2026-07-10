# 19 — Skill executor & cultivation VFX

**Status:** `[~]` In progress  
**Plan:** [plans/19-skill-executor-vfx.md](../plans/19-skill-executor-vfx.md)  
**Last updated:** 2026-07-10

## Summary

Data-driven skill casting with composable effects and cultivation-themed VFX presets.

## Done

- Skill cast pipeline wired through combat (mana, cooldown, effects)
- Composable effect types: projectile, melee arc, heal, pull field, AoE circle
- VFX presets: cast ring, slash arc, spirit bolt, heal bloom, flame petal, void crack
- **Elemental projectiles** — flame orb, void shard, lightning bolt, time orb (not one generic bolt)
- **Tier scaling** — `skillVfxPower()` maps base → v2–v4 → v5/awakened → god mode juice
- **First hero arts** — void slash = melee rift; flame/time tuned projectiles + trails + impact bursts
- **Heavenly Thunder** — `thunder_strike` vertical bolt from sky (not horizontal projectile sprite)
- **Thunder Chain (awakened)** — `thunder_chain` jumps between in-range foes with link VFX
- Enemy target provider wired MapScene → CombatComponent → SkillExecutor for chain targeting
- **Intent-unique pixel textures** — void rift arc, sword qi, thunder column, life pulse, time vortex, flame comet orb
- **Ancient echo flourishes** — god-mode casts add per-intent elemental burst via `playAncientIntentFlourish`
- **v3–v5 art profiles** — `skillVfxProfile.ts` maps lotus/pillar/nova/abyss/heaven/storm/tribulation etc. to unique pixel textures
- **Advanced lightning** — judgment v4 = vertical strike; tribulation v5 = 5-jump chain; storm/fork use fork-bolt sprite
- Cooldown manager per skill slot
- Awakened void: pull field then projectile
- Awakened flame: twin AoE damage ticks
- Extended skill definition schema validated at load

## Remaining

- Sword Intent gating in executor and skill picker (T7)
- Audio sync on cast/impact frames from skill data
- Higher-fidelity art pass (sprite sheets / short anim loops per tier) beyond pixel presets
- BGM crossfade between scenes (owned partly by 25)

## Verification

- Mana spend, cooldown, and effect dispatch unit tested

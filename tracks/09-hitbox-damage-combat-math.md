# 09 — Hitboxes, damage, i-frames

**Status:** `[x]` Done  
**Plan:** [plans/09-hitbox-damage-combat-math.md](../plans/09-hitbox-damage-combat-math.md)  
**Last updated:** 2026-07-03

## Summary

Unified hit detection, damage resolution, feedback VFX, and invulnerability during dodge.

## Done

- Hitbox shapes: arc slashes, circles, rectangles
- Combat resolver pipeline: hit → damage → knockback → events
- Player combo finisher applies knockback
- Floating damage numbers pooled and reused
- Brief white hit flash on victims
- Dodge i-frames block incoming damage
- Enemy melee, arrows, and skill bolts all use the same pipeline
- Procedural sticky-man pixel art for hero (unarmed strikes + weapon props) and early enemies

## Remaining

None for this sub-plan.

## Verification

- Slime dies in expected hit count at level 1 (combo + one extra hit ≈ 40 HP)
- Boss hurtbox overlap geometry tested
- Arc hitboxes align with attack animations

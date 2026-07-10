# DA-07 — VFX Spritesheets

> Parent: [index.md](./index.md) · Executor: plan `19` · Juice: plan `25` · Tiers: plan `29` §3

---

## Objective

Combat-readable **impact sprites** — slashes, bolts, AOEs, heals — per Intent family.

## Deliverable classes

| Class | Frames | Tier |
|-------|--------|------|
| Melee arc | 4–6 | Common |
| Bolt / projectile | 4 | Common |
| Ground telegraph ring | 2 | Common |
| AOE burst | 6–8 | Signature |
| Showcase bloom plate | 4 | Showcase (Echoes / v5 only) |

**Path:** `assets/sprites/vfx/{intent}/{artSlug}.png`

## Authoring order

1. Life + Sword (ch1–2 player experience)
2. Void + Flame (mid game)
3. Lightning + Time (late game)

Skill → sheet mapping: content `skill.*.visual.vfxKey` (plan 29 §11 schema).

## Acceptance

- [ ] L/M/S power read matches plan 29 §3.3 at 2× zoom
- [ ] Pooled particle caps respected (≤24 particles Signature tier)
- [ ] `ArtExecutor` plays sheet without shader on Common tier

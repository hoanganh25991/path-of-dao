# DA-02 — Enemies & Minions

> Parent: [index.md](./index.md) · Factions: [handbook/character-sheets/faction-families.md](../../handbook/character-sheets/faction-families.md)  
> Content IDs: plan `23` · Integration: plan `08`, `29` §5

---

## Objective

25 enemy types — beasts (blob/quadruped) + humanoid cultivators on shared **32×56** rig.

## Per-enemy sheet

| Anim set | Keys |
|----------|------|
| idle | `{textureKey}_idle` |
| walk | `{textureKey}_walk` |
| attack | `{textureKey}_attack` |

**Path:** `assets/sprites/enemies/{enemyId}.png` or `{family}/{variant}.png`

## MVP roster (author in priority order)

| Priority | Family | Examples | Accent |
|----------|--------|----------|--------|
| P0 | Beast | slime, wolf | Region tint from map ch1 |
| P1 | Disciple | heng_yue_disciple | Jade / crimson sash |
| P2 | Bandit | mountain_bandit | Rust + mask |
| P3 | Spirit | fog_wisp, jade_sprite | Teal glow |

Roster detail (silhouette hooks): migrate from plan 29 §5 when authoring — **tables stay in handbook + this file**.

## Acceptance

- [ ] Each shipped map enemy has texture or documented procedural variant key
- [ ] Attack telegraph frame ≥ 1 frame before hitbox active (plan 29 §0.2 #3)
- [ ] `content/enemies/*.json` may set `visual.textureKey` — validator warns if file missing (DA-08)

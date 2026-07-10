# DA-01 — Hero (Cultivator Wanderer)

> Parent: [index.md](./index.md) · Character sheet: [handbook/character-sheets/hero.md](../../handbook/character-sheets/hero.md)  
> Integration: [plan 29 §0.1](../29-pixel-art-combat-canon.md#01-animation-contract-required-keys) anim keys · `07` attackStyle

---

## Objective

Author the **player sticky-man** — mortal unarmed start → Ancient Spirit Sword — as exportable
sprite sheets. This is the **highest-priority** design-art task.

## Deliverables

| Asset | Frames | Output |
|-------|--------|--------|
| Idle | 4 | `hero_sticky_idle` |
| Walk | 6 | `hero_sticky_walk` |
| Hit react | 2 | `hero_sticky_hit` |
| Unarmed strikes ×3 | 5–7 each | `hero_strike_combo_1..3` |
| Sword attacks ×3 | 5–9 each | `hero_sticky_attack_1..3` |
| Gather Qi sit | 2–4 | `hero_sticky_gather` — **Buddha / lotus meditation** (required) |
| Dash afterimage ghost | 1 | tint-only; code may procedural |

**Path:** `assets/sprites/hero/wanderer_{idle,walk,hit,unarmed,sword}.png` (or one atlas `hero_wanderer.png` + JSON frame map in DA-08).

## Growth stages (visual — not separate rigs)

| Stage | Trigger | Art delta |
|-------|---------|-----------|
| 0 Mortal | `weaponMilestone: none` | No blade; muted sash |
| 2 Ancient sword | `weaponMilestone: ancient_sword` | Blade prop + bright sash `#d4a840` |
| 4 High realm | `realm.order ≥ 5` | 1px feet aura ring (separate overlay sheet OK) |

Full stage table: was plan 29 §4.1 — **authoring lives here**; plan 29 only wires palette swaps.

## Acceptance

- [ ] Silhouette passes squint test at 1× (headband + sash readable)
- [ ] Gather pose reads as **seated meditation** at 1× — legs crossed, upright torso
- [ ] Feet anchor consistent across all frames
- [ ] Strike frame **N** documented for `CombatComponent.hitFrameMs` per combo step
- [ ] Auto-loads via DA-08 when files present; procedural fallback when absent

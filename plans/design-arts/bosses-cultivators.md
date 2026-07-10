# DA-03 — Bosses & Named Cultivators

> Parent: [index.md](./index.md) · Sheets: [handbook/character-sheets/bosses.md](../../handbook/character-sheets/bosses.md)  
> Integration: plan `08` BossPhaseController · plan `29` §6

---

## Objective

8 MVP bosses + ordeal cultivators — **same sticky-man rig** with boss props (seal, tribulation halo, mask).

## Boss art package (each)

| Piece | Notes |
|-------|-------|
| Base body sheet | idle / walk / attack + **phase prop** overlays |
| Telegraph ground sprite | Flat AOE ring, intent hue, 40% opacity |
| Optional portrait 48×48 | Story gate / boss intro (future) |

**Path:** `assets/sprites/bosses/{bossId}.png`

## Named cultivators (world road)

Ordeal bosses from plan `index` §7.8 table — each needs distinct **silhouette hook** (headgear, weapon, aura) readable at mobile scale.

## Acceptance

- [ ] Boss readable vs minions at same zoom (scale ≤ 1.25× or prop-only enlargement)
- [ ] Phase 2+ prop swap documented (texture variant or attachment offset)
- [ ] Hitbox alignment doc per boss attack (plan 29 + plan 09)

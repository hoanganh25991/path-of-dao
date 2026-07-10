# Design Arts — Items (Dharma Treasures icons)

> Parent: [../index.md](../index.md) (plan 32) · Logic baseline: [../../item-system/index.md](../../item-system/index.md) (plan 33)  
> Gate: **`02`** (same as design-arts root) — **parallel with item logic after `05`**

---

## Split: logic vs pixels

| Layer | Owner | When |
|-------|-------|------|
| **Functional** — drops, random, equip, inventory | [`item-system/`](../../item-system/index.md) | After `05` |
| **Pixel** — 24×24 icons per `item.*` | **This directory** | After `02` |

Drops and equip work with **IDs only** until PNG lands. Home shows placeholder → icon swaps on file drop (DA-08).

---

## Sub-tasks (parallel per category)

| ID | File | Scope | Output path |
|----|------|-------|-------------|
| DI-01 | [weapons.md](./weapons.md) | `item.sword.*` | `assets/sprites/items/` |
| DI-02 | [armor-accessories.md](./armor-accessories.md) | robe, bracelet, ring | same |
| DI-03 | [spirit-consumables.md](./spirit-consumables.md) | spirit orb, immortal jade, cosmetics | same |

**Solo priority:** DI-01 ancient sword → iron → wood · DI-02 novice robe · DI-03 jade spirit.

---

## Per-item checklist (MVP)

| itemId | DI | Shape (24²) | Rarity accent |
|--------|-----|-------------|---------------|
| `item.sword.ancient` | 01 | Curved cyan blade + gold | legendary pulse |
| `item.sword.iron` | 01 | Grey long blade | uncommon highlight |
| `item.sword.wood` | 01 | Short brown blade | common flat |
| `item.robe.novice` | 02 | Robe fold slate | common |
| `item.bracelet.copper` | 02 | Copper band arc | uncommon |
| `item.ring.speed` | 02 | Ring + wind tick | rare |
| `item.spirit.jade` | 03 | Jade orb | rare |
| `item.consumable.immortal_jade` | 03 | Faceted gem | epic (UI only) |
| `item.aura.true_dao.crown` | 03 | Crown glyph | cosmetic |

Full combat/HUD notes: plan `29` §10 (integration only).

---

## Acceptance

- [ ] Each equippable `item.*` has PNG or documented procedural placeholder
- [ ] `iconKey` in JSON resolves to file (IS-01 + DA-08 manifest)
- [ ] Home Dharma Treasures grid shows pixel icon (plan 12 §18.3)
- [ ] Validator warns on missing file; **does not** block loot rolls

---

## Adding a new item (parallel workflow)

1. Author `content/items/item.new.json` + loot row (item-system) — **works in game**
2. Add row to category file here (DI-01/02/03)
3. Export PNG → `assets/sprites/items/item.new.png`
4. `pnpm content:validate` + Home visual check

No code PR required for step 3 if DA-08 manifest auto-load is shipped.

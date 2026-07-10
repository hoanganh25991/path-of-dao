# Item & Loot System — Master Index (Plan 33)

**Phase:** Cross-cutting — **logic baseline** (functional + random + drop)  
**Gate:** [`05-save-system-foundation.md`](../05-save-system-foundation.md) — `inventory`, `equipped` on `PlayerSaveV1`  
**Parallel with:** `11` (equip) · `15` (fortuitous) · `20` (validators) · `design-arts/items/` (pixel icons)  
**Does not block on:** art, 3D GLB models, full content roster

> **Master plan:** [index.md](../index.md) §5.0 hook-up model · §5.1 Track **IS**  
> **Player-facing noun:** Dharma Treasures (Pháp Bảo) — internal IDs stay `item.*`  
> **Home UI:** plan `12` §18.3 · **Equip runtime:** plan `11`

---

## 1. Baseline first, hook up when done

Item **logic** ships before item **pixels** or **3D models**. The game must run end-to-end with:

| Layer | Baseline (early) | Hooks when ready |
|-------|----------------|------------------|
| **Schema** | `content/items/*.json` + Zod | New `item.*` rows — no code change |
| **Inventory** | `save.inventory.items[]` qty stacks | Home grid shows name; icon when DA lands |
| **Equip** | `EquipmentManager` + stat modifiers | 3D attach (plan 11) · compare UI (plan 12) |
| **Drops** | `LootRoller` + `content/loot/*.json` | Enemy `lootTable` ref — works with ID only |
| **Random** | Weighted roll + `qty: [min,max]` | Spirit stat modifier · pity timer |
| **Encounters** | Atomic `apply()` grants (plan 15) | Modal art ∥ `design-arts` encounter cards |
| **Icons** | Text / placeholder glyph | `assets/sprites/items/{id}.png` (DA-05 items/) |

**Rule:** adding `item.foo` to JSON + loot table must work **before** `item.foo.png` exists.

---

## 2. Sub-task index (logic — all parallel after `05`)

| ID | File | Delivers |
|----|------|----------|
| IS-01 | [schema-and-content.md](./schema-and-content.md) | `item.*` JSON fields, rarity, slots |
| IS-02 | [inventory-equip.md](./inventory-equip.md) | Stack rules, equip/unequip, milestone gates |
| IS-03 | [drop-tables.md](./drop-tables.md) | `loot.*.json` tables, boss vs tier |
| IS-04 | [random-rolls.md](./random-rolls.md) | Weighted pick, qty roll, modifiers |
| IS-05 | [encounter-rewards.md](./encounter-rewards.md) | Fortuitous + POI atomic grants |
| IS-06 | [hook-up.md](./hook-up.md) | EventBus, UI, art, 3D attachment points |

**Code owners (target):**

| Module | Plan |
|--------|------|
| `EquipmentManager` | `11` |
| `LootRoller` / `LootTableLoader` | **33** (this tree) |
| `FortuitousEncounterManager.apply` | `15` |
| `ContentLoader` item getter | `20` |
| `DharmaTreasuresPanel` | `12` |

---

## 3. Data flow (canonical)

```
Enemy dies / chest / encounter confirm
  → LootRoller.roll(lootTableId, context)
  → [{ itemId, qty }, …]
  → InventoryManager.add(itemId, qty)   // or EncounterManager.apply for fixed grants
  → EventBus.emit('inventory:changed')
  → StatSheet rebuild if equipped touched
  → UI refresh (Home panel / combat pickup toast optional MVP)
```

Fortuitous / POI rewards **bypass** loot tables when encounter JSON specifies fixed `rewards[]`.

---

## 4. Parallel with pixel art

| Track | Directory | Gate |
|-------|-----------|------|
| **Logic (this)** | `plans/item-system/` | `05` |
| **Pixels** | [`plans/design-arts/items/`](../design-arts/items/index.md) | `02` |

Same `item.*` ID is the contract. Validator (`20`) warns: item in loot table but no icon file yet.

---

## 5. Acceptance (system-level)

- [x] Every `item.*` in `content/items/` loadable; cross-ref lint passes
- [x] `LootRoller` rolls from `content/loot/*.json`; enemy `lootTable` resolves
- [x] Pickup adds to inventory; equip applies modifiers; unequip returns stack
- [x] `encounter.ancient_sword` atomic grant (plan 15 §2.1) uses same inventory API
- [x] Missing icon does not block drop or equip — placeholder until `design-arts/items/` ships
- [x] `inventory:changed` / `equipment:changed` emitted; Home + 3D listeners documented in IS-06

---

## 6. Handoff

| Consumer | Needs |
|----------|-------|
| `08` enemies | `lootTable` string on enemy JSON → IS-03 |
| `12` Home | inventory list + equip UI; icons from `design-arts/items/` |
| `13` breakthrough | `item.consumable.immortal_jade` cost check |
| `21`–`22` maps | POI + chest loot table ids |
| `design-arts/items/` | One row per `item.*` for 24×24 icon spec |

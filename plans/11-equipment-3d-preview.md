# Sub-Plan 11: Equipment Slots & 3D Preview

**Phase:** 3 — 3D Home  
**Estimated effort:** 8–10 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `10-threejs-home-scene`  
**Blocks:** `12`, `16`

---

## 1. Objective

Implement equipment slots (weapon, armor, accessory, spirit) for **Dharma Treasures (Pháp Bảo)**
— player-facing noun; content IDs stay `item.*` internally (`plans/index.md` §1.2) — stat
modifiers from treasures, and live 3D attachment on hero viewer. Combat/HUD uses **24×24 pixel treasure icons** per [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §10. This sub-plan also owns the
**Renegade Immortal weapon-arc enforcement** (§7.7): new game starts unarmed, and equipping the Ancient
Spirit Sword is a milestone, not routine gear-swapping.

---

## 2. Slot Definitions

| Slot | 3D Attach Point | Stat Focus |
|------|-----------------|------------|
| weapon | `hand_r` bone | atk, crit |
| armor | `spine` bone | def, hpMax |
| accessory | `neck` socket | crit, critDmg, speed |
| spirit | floating behind hero | spirit, manaMax |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/EquipmentManager.ts` | Equip/unequip logic; enforces the sword milestone (§7) |
| `src/progression/DharmaTreasureDefinition.ts` | Treasure schema (was `ItemDefinition`; content ID `item.*` stays internal) |
| `src/home/EquipmentAttachment.ts` | 3D model attach/detach |
| `content/items/_schema.json` | Zod item schema (already authored — 9 items incl. `item.sword.ancient`) |

---

## 4. Item Schema

```json
{
  "id": "item.sword.iron",
  "displayNameKey": "item.sword.iron.name",
  "descriptionKey": "item.sword.iron.desc",
  "slot": "weapon",
  "rarity": "common",
  "modelId": "models/items/iron-sword.glb",
  "modifiers": [
    { "stat": "atk", "type": "flat", "value": 12 },
    { "stat": "crit", "type": "flat", "value": 0.02 }
  ],
  "requiredLevel": 1,
  "iconKey": "item.sword.iron"
}
```

Optional `iconKey`; default resolver: `assets/sprites/items/{id}.png` (24×24 pixel, plan 29 §10).

Rarities: common, uncommon, rare, epic, legendary — color token for UI only MVP.

---

## 5. EquipmentManager

```typescript
class EquipmentManager {
  static canEquip(itemId: string, save: PlayerSaveV1): boolean;
  static equip(itemId: string): StatModifier[];
  static unequip(slot: EquipmentSlot): void;
  static getModifiers(equipped: EquipmentSlots): StatModifier[];
}
```

On equip:

1. Validate slot + level
2. Move item inventory ↔ equipped
3. Rebuild StatSheet modifiers on player (combat) and Home stat display
4. Notify HeroViewer.attachEquipment
5. Persist save

---

## 6. EquipmentAttachment (Three.js)

```typescript
class EquipmentAttachment {
  attach(slot: EquipmentSlot, modelId: string, skeleton: THREE.Skeleton): Promise<void>;
  detach(slot: EquipmentSlot): void;
}
```

- Load GLB items cached in Map
- Weapon: align grip to bone matrix
- Armor: skinned mesh or overlay — MVP static mesh scaled to hero
- Spirit: orbit particle if no model

---

## 7. Inventory State (Dharma Treasures)

Already in save — extend with max stack 99 for consumables (future). Equipment unique instances by id.

**Starter loadout on new game (Renegade Immortal humble start, T1 — non-negotiable, `plans/index.md`
§7.7 rule 1):**

- `equipped.weapon = null` — **no weapon equipped.** Do **not** equip (or even grant)
  `item.sword.wood` at new-game time; it may exist later as junk/flavor inventory, never as
  starter gear.
- `item.robe.novice` equipped (armor is fine to start with — only the weapon slot is gated)
- `progress.weaponMilestone = 'none'`; hero fights unarmed (sub-plan 07 `attackStyle`)

**The Ancient Spirit Sword milestone (T2/T3):** `EquipmentManager.equip('item.sword.ancient')`
is not routine gear-swapping — it is granted by `encounter.ancient_sword` (sub-plan 15), and
equipping it must additionally: set `progress.weaponMilestone = 'ancient_sword'`, flip
`CombatComponent.attackStyle` to `'sword'` (sub-plan 07), and unlock Sword Intent arts on the
Divine Arts wheel (sub-plan 14/19 gating). `item.sword.iron` remains a valid optional side
upgrade afterward (§7.7 stage 3) but never replaces this milestone flag.

---

## 8. Stat Recalculation Hook

```typescript
EventBus.emit('equipment:changed', { modifiers });
```

MapScene listens on enter to rebuild player StatSheet.

---

## 9. Content — MVP Dharma Treasures (already authored, `content/items/`)

| ID | Slot | Notes |
|----|------|-------|
| item.sword.wood | weapon | flavor/junk only — **never equipped at new game** (§7) |
| item.sword.ancient | weapon | **the signature treasure** — Ancient Spirit Sword milestone, ch1–2 POI (§7) |
| item.sword.iron | weapon | optional side upgrade after the milestone, ch1 drop |
| item.robe.novice | armor | starter |
| item.bracelet.copper | accessory | ch2 |
| item.spirit.jade | spirit | ch1 story reward |
| item.ring.speed | accessory | ch3 |
| item.consumable.immortal_jade | consumable | realm breakthrough cost (sub-plan 13) |

---

## 10. Tests

| Test | Assert |
|------|--------|
| equip wrong slot | fails |
| modifiers stack | atk increases correctly |
| unequip | modifiers removed |
| required level | blocks equip |
| 3D attach/detach | `equipment-attachment.test.ts`, `hero-viewer.test.ts` |

---

## 11. Home panel UI (Dharma Treasures tab)

Owned by sub-plan **12**; this sub-plan supplies data + `EquipmentManager` hooks. **Loot/drop/random:** plan **33** [`item-system/`](../item-system/index.md).

| Concern | Spec |
|---------|------|
| **Pixel icons** | Every equippable treasure shows **24×24** icon in grid + slot row (plan 29 §10) |
| **Equip** | Tap inventory card → detail strip → **compare** vs current in same slot → Equip/Replace |
| **Unequip** | Tap filled slot chip → detail strip with full-width **Remove from {slot}** (plan 12 §18.3) |
| **3D sync** | `equipment:changed` → `HeroViewer.attachEquipment` / detach |

Full wireframes + locale keys: [`plans/12-home-ui-panels.md`](./12-home-ui-panels.md) §18.3.

---

## 12. Acceptance Criteria

- [x] New game: `equipped.weapon = null`, hero renders unarmed in 3D Home (empty hands)
- [x] Equipping `item.sword.ancient` updates 3D hero weapon mesh AND sets `weaponMilestone`
- [x] Stat modifiers apply to StatSheet resolved atk/def
- [x] Save persists equipped state across reload
- [x] Unequip returns item (Dharma Treasure) to inventory
- [x] Cannot equip two treasures to the same slot
- [x] Unit tests pass

---

## 12. Handoff

Sub-plan 12 builds inventory UI panel (§18.3). Sub-plan 16 displays updated Combat Power after equip.

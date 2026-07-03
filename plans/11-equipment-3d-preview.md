# Sub-Plan 11: Equipment Slots & 3D Preview

**Phase:** 3 — 3D Home  
**Estimated effort:** 8–10 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `10-threejs-home-scene`  
**Blocks:** `12`, `16`

---

## 1. Objective

Implement equipment slots (weapon, armor, accessory, spirit), stat modifiers from items, and live 3D attachment on hero viewer.

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
| `src/progression/EquipmentManager.ts` | Equip/unequip logic |
| `src/progression/ItemDefinition.ts` | Item schema |
| `src/home/EquipmentAttachment.ts` | 3D model attach/detach |
| `content/items/_schema.json` | Zod item schema |
| `content/items/item.sword.iron.json` | Starter items ×6 |

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
  "requiredLevel": 1
}
```

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

## 7. Inventory State

Already in save — extend with max stack 99 for consumables (future). Equipment unique instances by id.

Starter loadout on new game:

- `item.sword.wood` equipped
- `item.robe.novice` equipped

---

## 8. Stat Recalculation Hook

```typescript
EventBus.emit('equipment:changed', { modifiers });
```

MapScene listens on enter to rebuild player StatSheet.

---

## 9. Content — MVP Starter Items (6)

| ID | Slot | Notes |
|----|------|-------|
| item.sword.wood | weapon | starter |
| item.sword.iron | weapon | ch1 drop |
| item.robe.novice | armor | starter |
| item.bracelet.copper | accessory | ch2 |
| item.spirit.jade | spirit | ch1 story reward |
| item.ring.speed | accessory | ch3 |

---

## 10. Tests

| Test | Assert |
|------|--------|
| equip wrong slot | fails |
| modifiers stack | atk increases correctly |
| unequip | modifiers removed |
| required level | blocks equip |

---

## 11. Acceptance Criteria

- [ ] Equipping sword updates 3D hero weapon mesh
- [ ] Stat modifiers apply to StatSheet resolved atk/def
- [ ] Save persists equipped state across reload
- [ ] Unequip returns item to inventory
- [ ] Cannot equip two items same slot
- [ ] Unit tests pass

---

## 12. Handoff

Sub-plan 12 builds inventory UI panel. Sub-plan 16 displays updated Combat Power after equip.

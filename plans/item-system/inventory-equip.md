# IS-02 — Inventory & equip logic

> Parent: [index.md](./index.md) · Implementation: plan `11` `EquipmentManager`

---

## InventoryManager (baseline API)

```typescript
class InventoryManager {
  static add(save: PlayerSaveV1, itemId: string, qty: number): PlayerSaveV1;
  static remove(save: PlayerSaveV1, itemId: string, qty: number): boolean;
  static count(save: PlayerSaveV1, itemId: string): number;
  static hasRoom(save: PlayerSaveV1, itemId: string, qty: number): boolean;
}
```

| Rule | Detail |
|------|--------|
| Stack | Same `id` increments `qty` up to `maxStack` |
| Unique equip | Weapons/armor — typically `maxStack: 1`; second pickup blocked or auto-sell junk (MVP: block) |
| Gold | Separate `inventory.gold`; not an `item.*` |

## Equip / unequip

```typescript
EquipmentManager.canEquip(itemId, save)  // slot, level, weaponMilestone
EquipmentManager.equip(itemId)           // move 1 from bag → equipped[slot]
EquipmentManager.unequip(slot)           // move → bag
```

**Renegade Immortal gates (non-negotiable):**

- New game: `equipped.weapon = null`
- `item.sword.ancient`: milestone encounter only — not a random loot table pick (IS-05)
- Sword Intent arts gated on `weaponMilestone` (plan `14`)

## Events

```typescript
EventBus.emit('inventory:changed', { itemId?, delta? });
EventBus.emit('equipment:changed', { modifiers });
```

Home panel + `HeroViewer` subscribe — see [hook-up.md](./hook-up.md).

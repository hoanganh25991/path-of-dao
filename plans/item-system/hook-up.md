# IS-06 — Hook-up points (attach when ready)

> Parent: [index.md](../item-system/index.md) · Master: [index.md](../index.md) §5.0

---

## Philosophy

**Baseline logic runs with stubs.** Each row is independently shippable; integration is subscribe-to-event or resolve-by-ID.

| When done | Hook | Baseline until then |
|-----------|------|---------------------|
| Item JSON authored | `ContentLoader.getItem(id)` | — |
| Loot tables authored | Enemy death → `LootRoller` | No drops (or test table only) |
| `InventoryManager` | `inventory:changed` | Save field only |
| `EquipmentManager` (11) | `equipment:changed` | Stats from save modifiers |
| Home panel (12 §18) | Renders bag + equip | Text list |
| Treasure icon PNG | `iconKey` → sprite | Initials / rarity block color |
| 3D GLB (11) | `HeroViewer.attachEquipment` | Empty slot mesh |
| Encounter modal art | `EncounterModal` illustration | Gradient card |
| Pickup toast (optional) | `combat:loot` event | Silent add to bag |
| Validator (20) | Warn missing icon/GLB | CI non-blocking warn |

## EventBus contract

```typescript
// Emitted after any bag mutation
EventBus.emit('inventory:changed', { save: PlayerSaveV1 });

// Emitted after equip/unequip
EventBus.emit('equipment:changed', { modifiers: StatModifier[] });

// Optional combat feedback
EventBus.emit('combat:loot', { items: { id: string; qty: number }[] });
```

## Listeners (register when module ships)

| Listener | Plan | On event |
|----------|------|----------|
| `DharmaTreasuresPanel` | 12 | `inventory:changed`, `equipment:changed` |
| `HeroViewer` | 10/11 | `equipment:changed` |
| `ProfileHeader` CP | 16 | `equipment:changed` |
| `MapScene` player stats | 07 | `equipment:changed` |

## Content + art parallel checklist

For each new `item.*`:

- [ ] `content/items/*.json` + locales
- [ ] Entry in loot table **or** encounter fixed grant
- [ ] Row in [`design-arts/items/`](../design-arts/items/index.md)
- [ ] PNG in `assets/sprites/items/` (when art ready)
- [ ] `pnpm content:validate` clean

No single PR required — validator links the graph.

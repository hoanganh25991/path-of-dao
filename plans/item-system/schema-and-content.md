# IS-01 — Item schema & content

> Parent: [index.md](./index.md) · Schema file: `content/items/_schema.json` · Loader: plan `20`

---

## `item.*` JSON (required fields)

```json
{
  "id": "item.sword.iron",
  "displayNameKey": "item.sword.iron.name",
  "descriptionKey": "item.sword.iron.desc",
  "slot": "weapon",
  "rarity": "uncommon",
  "modelId": "models/items/iron-sword.glb",
  "modifiers": [{ "stat": "atk", "kind": "flat", "value": 12 }],
  "requiredLevel": 1,
  "iconKey": "item.sword.iron",
  "lootTags": ["weapon", "ch1"],
  "maxStack": 1
}
```

| Field | Rule |
|-------|------|
| `slot` | `weapon` \| `armor` \| `accessory` \| `spirit` \| `consumable` |
| `rarity` | common → legendary — UI border only until ship |
| `maxStack` | Default `1` equipment; consumables `99` |
| `iconKey` | Resolves `assets/sprites/items/{iconKey}.png` — optional until art ships |
| `lootTags` | Filter pools in advanced tables (post-MVP); MVP uses explicit `itemId` in loot JSON |
| `modelId` | 3D Home attach — optional; empty hands if GLB missing |

## Save shape (plan `05`)

```typescript
inventory: {
  items: { id: string; qty: number }[];
  gold: number;
};
equipped: Partial<Record<EquipmentSlot, string | null>>;
```

## Authoring workflow (parallel)

1. Add `content/items/item.foo.json` + locale keys (`en`/`vi`)
2. Reference `item.foo` in loot table or encounter — **logic works immediately**
3. Add row in [`design-arts/items/`](../design-arts/items/index.md) for pixel spec
4. Drop PNG when art ready — auto-wire (DA-08)

## MVP roster

See plan `11` §9 + `content/items/*.json` (9 items today). Expand in plan `21`–`23` without code changes.

# IS-03 — Drop tables

> Parent: [index.md](./index.md) · Content: `content/loot/` · Enemy ref: `enemy.*.lootTable`

---

## Loot table JSON

```json
{
  "id": "loot.tier.common",
  "entries": [
    { "itemId": "item.sword.wood", "weight": 50, "qty": [1, 1] },
    { "itemId": "item.bracelet.copper", "weight": 30, "qty": [1, 1] }
  ]
}
```

| Field | Rule |
|-------|------|
| `weight` | Relative — not percent; sum arbitrary |
| `qty` | `[min, max]` inclusive integer roll per drop line |
| `itemId` | Must exist in `content/items/` (validator) |

## Table types (MVP)

| ID pattern | Used by |
|------------|---------|
| `loot.tier.common` | Fodder enemies ch1–3 |
| `loot.tier.uncommon` | Mid maps |
| `loot.tier.rare` | Late explore |
| `loot.boss.standard` | Chapter ordeal `.02` |
| `loot.boss.final` | Ch10 finale |

**Excluded from tables:** `item.sword.ancient` — POI/encounter only (plan `15` §2.1).

## Enemy hook

```json
{ "id": "enemy.slime", "lootTable": "loot.tier.common", … }
```

On death: `LootRoller.roll(enemy.lootTable, { mapId, playerLuck })` → inventory adds.

## Boss hook

Boss kill may roll **table + guaranteed** entry in boss JSON (`guaranteedDrops: ["item.ring.speed"]`) — optional field, validated by plan `20`.

# IS-05 — Encounter & POI rewards

> Parent: [index.md](./index.md) · Plan `15` fortuitous encounters

---

## Two reward channels

| Channel | When | Resolver |
|---------|------|----------|
| **Loot table** | Enemy death, chest | `LootRoller` (IS-03) |
| **Fixed grant** | Encounter modal confirm, POI interact | `EncounterRewardApplier` |

## Fixed grant shape (encounter JSON)

```json
{
  "id": "encounter.ancient_inheritance",
  "rewards": [
    { "kind": "item", "itemId": "item.bracelet.copper", "qty": 1 },
    { "kind": "gold", "amount": 500 }
  ]
}
```

```json
{
  "kind": "item",
  "itemId": "item.sword.ancient",
  "qty": 1,
  "autoEquip": true,
  "setFlags": { "weaponMilestone": "ancient_sword" }
}
```

## Atomic transactions

`apply(encounter, save)` returns new save in **one** patch:

1. Inventory adds
2. Auto-equip if specified
3. Progress flags (`weaponMilestone`, `encountersFound`)
4. Side effects queued: `attackStyle`, Intent unlock — same transaction

Never partial: sword in bag but milestone false (plan `15` §2.1).

## POI types (maps)

| POI | Reward style |
|-----|----------------|
| `hidden_cave` | Fixed encounter id → modal |
| `ancient_sword` | `encounter.ancient_sword` only |
| `secret_manual` | Skill unlock, not item |

## Unique encounters

If `encounter.unique` and `encountersFound` contains id → skip roll or downgrade to gold-only reward.

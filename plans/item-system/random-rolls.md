# IS-04 — Random roll algorithm

> Parent: [index.md](./index.md) · Consumer: `LootRoller`, `FortuitousEncounterManager`

---

## Weighted item pick

```typescript
function pickWeighted<T extends { weight: number }>(entries: T[], rng = Math.random): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return entries[entries.length - 1]!;
}
```

## Qty roll

```typescript
function rollQty([min, max]: [number, number], rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}
```

## LootRoller API (target)

```typescript
class LootRoller {
  static roll(tableId: string, ctx: LootContext): LootResult[];
  static rollMany(tableId: string, picks: number, ctx: LootContext): LootResult[];
}

interface LootContext {
  mapId: string;
  spirit: number;       // optional modifier — +% rare weight cap
  discoveryPct?: number;
}
```

## Encounter rate rolls (plan `15`)

Separate from loot tables — **encounter type** first, then reward resolver:

| Hook | Rate source |
|------|-------------|
| Map enter | `content/encounters/fortuitous/_tables.json` |
| Wave clear | per-map override |
| Kill streak | `encounter.forgotten_memory` 1% at 10 |

`FortuitousEncounterManager` uses same `pickWeighted` primitive.

## Pity / bad luck protection (optional MVP)

Config flag: force at least one uncommon+ drop every N kills without rare — document in `_tables.json`, default **off** for MVP.

## Determinism (tests)

Inject `rng` seed in unit tests — `tests/unit/loot-roller.test.ts` (to author with IS-03).

# 33 — Item & loot system (directory track)

**Status:** `[~]` In progress  
**Plan:** [plans/item-system/index.md](../plans/item-system/index.md) · [33-item-loot-system.md](../plans/33-item-loot-system.md)  
**Last updated:** 2026-07-10

## Summary

Dharma Treasures logic baseline — inventory, equip, drops, random rolls — **before** final item pixels (DA-05).

## Done

- `content/items/*.json` + equip slots on save (`equipped.weapon|armor|accessory|spirit`)
- `EquipmentManager` — equip/unequip, level gates, weapon milestone
- `rollCultivatorLoot()` + magnet pickups in combat
- `content/loot/_drop_rates.json` + per-enemy tables
- Fortuitous encounter atomic grants (plan 15)
- Home Dharma Treasures tab — grid, compare strip, equip
- Bestiary loot hints on Path tab
- **Validator cross-ref lint for all `loot.*` → `item.*`** — `lintCrossrefs` now walks every `entries[]`/`guaranteed[]` `itemId` in `content/loot/*.json` and errors on any id missing from `content/items/`; `boss` category enemies also error if `lootTable` is unset (2026-07-10)
- **Boss loot-table audit (all 10 ordeal bosses)** — every `category: "boss"` enemy (`boss.bandit_lord`, `.frost_queen`, `.jade_guardian`, `.desert_sovereign`, `.seal_warden`, `.mist_stalker`, `.thunder_avatar`, `.rift_horror`, `.celestial_guardian`, `.void_sovereign`) already had a valid `lootTable` (`loot.boss.standard` ×9, `loot.boss.final` ×1) with all `itemId`s resolving — no broken refs found; new lint + regression tests lock this in (2026-07-10)

## Remaining

- IS-04 pity / spirit-modifier rolls — **skipped, not implemented** (see note below)
- Full item roster content pass for all 20 maps
- DA-05 item icon PNGs + `iconKey` auto-wire
- 3D attach preview polish (plan 11) for new treasure types

## Note — IS-04 pity skipped (2026-07-10)

`random-rolls.md` §"Pity / bad luck protection" marks this **optional MVP, default off**, and the spec is a design flag only (`force at least one uncommon+ drop every N kills without rare`) with no concrete threshold, no persisted-state shape, and no `_tables.json` wiring defined. Implementing it correctly needs a new per-save kill-streak counter (likely on `PlayerSaveV1`), a config default, and `rollCultivatorLoot` branching — that's a new save-schema field plus roll-logic change, not a "small, clearly specified" addition. Left out of this pass; still tracked as open in **Remaining** above for a dedicated follow-up.

## What needs to do

| # | Task | Ref |
|---|------|-----|
| 1 | ~~Lint every `loot.*.json` entry → valid `item.*`~~ | IS-03, track 20 — `[x]` done 2026-07-10 |
| 2 | ~~Boss vs normal drop table audit for 8 ordeal bosses~~ | `content/loot/` — `[x]` done 2026-07-10 (10 bosses, all clean) |
| 3 | Optional pity timer in `rollCultivatorLoot` | IS-04 — skipped, see note |
| 4 | Home grid: show placeholder glyph when `iconKey` PNG missing | already OK — verify |
| 5 | Endgame spirit accessories content for ch8–10 | `content/items/` |

## Verification

- `tests/unit/equipment-manager.test.ts`, loot-related unit tests green
- Ancient sword POI equips `item.sword.ancient` end-to-end (T2)
- `tests/content/validate-all.test.ts` — 5 new cases for loot→item cross-ref lint (dangling `entries`/`guaranteed` itemId, boss missing `lootTable`, full boss-roster audit); `pnpm content:validate` + `pnpm test` green (599 tests)

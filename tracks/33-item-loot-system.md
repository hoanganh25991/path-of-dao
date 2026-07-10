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

## Remaining

- IS-04 pity / spirit-modifier rolls (if in spec)
- Full item roster content pass for all 20 maps
- DA-05 item icon PNGs + `iconKey` auto-wire
- Validator cross-ref lint for all `loot.*` → `item.*`
- 3D attach preview polish (plan 11) for new treasure types

## What needs to do

| # | Task | Ref |
|---|------|-----|
| 1 | Lint every `loot.*.json` entry → valid `item.*` | IS-03, track 20 |
| 2 | Boss vs normal drop table audit for 8 ordeal bosses | `content/loot/` |
| 3 | Optional pity timer in `rollCultivatorLoot` | IS-04 |
| 4 | Home grid: show placeholder glyph when `iconKey` PNG missing | already OK — verify |
| 5 | Endgame spirit accessories content for ch8–10 | `content/items/` |

## Verification

- `tests/unit/equipment-manager.test.ts`, loot-related unit tests green
- Ancient sword POI equips `item.sword.ancient` end-to-end (T2)

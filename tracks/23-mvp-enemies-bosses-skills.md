# 23 — MVP enemies, bosses, skill data

**Status:** `[~]` In progress  
**Plan:** [plans/23-mvp-enemies-bosses-skills.md](../plans/23-mvp-enemies-bosses-skills.md)  
**Last updated:** 2026-07-10

## Summary

Full MVP roster: 40 skills, 41 enemies, loot tables, boss phases, and skill unlock progression.

## Done

- Forty skills total: twelve signatures plus twenty-eight variants
- English and Vietnamese skill name/description strings
- Forty-one enemy files including training dummy, elite shadow, spirit fox
- Loot tables for five rarity tiers
- **Combat item drops** — `rollCultivatorLoot()` + magnet pickups; rates in `content/loot/_drop_rates.json`
- **Loot hints** — combat HUD strip + Bestiary section on Path tab (per-cultivator drop % and item preview)
- Boss phase tracking wired into wave spawner
- Skill unlock hooks: level up, boss clear, chapter story completion
- **Road techniques** — `byMapClear` on all ten explore maps (`.01`); `byChapter` rewards for all ten finales
- Unlocked-skills field on player save
- Enemy HP balance reference table for designers
- **Tiên Nghịch level design (ch1–3):** `enemy.heng_yue.disciple`, village roam roster, encounter tables, bestiary lore — see [21](./21-mvp-maps-chapters-1-5.md)
- Generation CLIs for skills and enemy patches

## Remaining

- Boss distinct patterns polish for all eight MVP bosses
- Six skills with full awakening VFX sprite pass (plans 29 + 32)

## Verification

- MVP content data tests pass; **378 unit tests** green; road progression sim through ch10

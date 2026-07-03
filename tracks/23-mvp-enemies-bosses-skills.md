# 23 — MVP enemies, bosses, skill data

**Status:** `[~]` In progress  
**Plan:** [plans/23-mvp-enemies-bosses-skills.md](../plans/23-mvp-enemies-bosses-skills.md)  
**Last updated:** 2026-07-03

## Summary

Full MVP roster: 40 skills, 41 enemies, loot tables, boss phases, and skill unlock progression.

## Done

- Forty skills total: twelve signatures plus twenty-eight variants
- English and Vietnamese skill name/description strings
- Forty-one enemy files including training dummy, elite shadow, spirit fox
- Loot tables for five rarity tiers
- Boss phase tracking wired into wave spawner
- Skill unlock hooks: level up, boss clear, chapter story completion
- **Road techniques** — `byMapClear` on all ten explore maps (`.01`); `byChapter` rewards for all ten finales
- Unlocked-skills field on player save
- Enemy HP balance reference table for designers
- Generation CLIs for skills and enemy patches

## Remaining

- **Tiên Nghịch gap:** Sword Intent skills should require ancient sword milestone (T7)
- Boss distinct patterns for all eight MVP bosses
- Six skills with full awakening VFX (MVP ship target)

## Verification

- MVP content data tests pass; **378 unit tests** green; road progression sim through ch10

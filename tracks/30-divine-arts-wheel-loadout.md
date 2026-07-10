# 30 — Divine Arts 6-slot wheel loadout

**Status:** `[~]` In progress  
**Plan:** [plans/30-divine-arts-wheel-loadout.md](../plans/30-divine-arts-wheel-loadout.md)  
**Last updated:** 2026-07-10

## Summary

One model for assigning up to **6 Divine Arts** to the combat wheel — hero journey + Ancient Echo demo.

## Done

- Six indexed combat slots (`divineArts[0..5]`) persisted on save — renamed from `equippedSkills` (user decision C3)
- Home Divine Arts tab — grid picker, slot assign, unequip, earned-only pool
- Combat HUD wheel mirrors save; empty string = empty slot (not castable)
- `SkillLoadout` / `SkillUnlockManager` — no duplicate skill across slots
- Echoes pre-walk loadout from `ancients.json` template (`save.divineArts`); demo save isolated from IndexedDB
- Sword Intent gate at cast + equip (`canUseSwordIntent`, `WeaponProgression`) — T7
- Awakening swaps base → awakened id in loadout (`InsightSystem`)
- **Save contract rename (user decision C3):** `equippedSkills` → `divineArts` in save schema, type (`EquippedSkills` → `DivineArtsLoadout`), EventBus payload, all TS consumers, `ancients.json` template, and tests — shape unchanged (`[0..5]` tuple, `''` empty). v1→v1 load-time alias in `SaveMigration.ts` keeps old saves working.

## Remaining

- Pause-menu loadout editor (optional MVP per plan §4)
- DA-04 wheel icon keys on HUD buttons

## What needs to do

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Rename save field `equippedSkills` → `divineArts` + migration v1→v1 alias | `SaveSchema.ts`, `SaveManager.ts`, `SaveMigration.ts` | [x] |
| 2 | Grep-replace types: `EquippedSkills` → `DivineArtsLoadout` | `SkillSlots.ts`, `SkillLoadout.ts`, consumers | [x] |
| 3 | EventBus `loadout:changed` payload key rename | `EventBus.ts` | [x] |
| 4 | Locale: ensure `home.divine.*` keys used in UI (not "Skills") | `home.json` | [x] audited — tab already `home.nav.divine_abilities`; no user-visible "Skills" mislabel found, left `home.skills.*` copy keys as-is (plan §8 names them explicitly) |
| 5 | Ancient demo template: `equippedSkills` in JSON → `divineArts` | `ancients.json`, `ancient-demo.ts`, `AncientDemoManager.ts` | [x] JSON key renamed directly (no load-time map needed) |
| 6 | Unit + E2E: save round-trip, echo walk loadout unchanged | tests | [x] 8 unit test files updated; `pnpm test` 543/543 green |

## Verification

- `pnpm test` — 91 files / 543 tests passed
- `tsc --noEmit` — clean
- Grep for `equippedSkills` in `src/` returns only the `SaveMigration.ts` v1 alias + doc comments referencing the old name
- E2E: ancient sword → Sword Slash visible on home divine intent row
- `tests/unit/weapon-progression.test.ts` — sword gate (T7)

# 30 — Divine Arts 6-slot wheel loadout

**Status:** `[~]` In progress  
**Plan:** [plans/30-divine-arts-wheel-loadout.md](../plans/30-divine-arts-wheel-loadout.md)  
**Last updated:** 2026-07-10

## Summary

One model for assigning up to **6 Divine Arts** to the combat wheel — hero journey + Ancient Echo demo.

## Done

- Six indexed combat slots (`equippedSkills[0..5]`) persisted on save
- Home Divine Arts tab — grid picker, slot assign, unequip, earned-only pool
- Combat HUD wheel mirrors save; empty string = empty slot (not castable)
- `SkillLoadout` / `SkillUnlockManager` — no duplicate skill across slots
- Echoes pre-walk loadout from `ancients.json` template; demo save isolated from IndexedDB
- Sword Intent gate at cast + equip (`canUseSwordIntent`, `WeaponProgression`) — T7
- Awakening swaps base → awakened id in loadout (`InsightSystem`)

## Remaining

- **Save contract rename (user decision):** `equippedSkills` → `divineArts` in save schema + UI strings — keep `[0..5]` tuple + `''` empty
- Pause-menu loadout editor (optional MVP per plan §4)
- DA-04 wheel icon keys on HUD buttons

## Verification

- E2E: ancient sword → Sword Slash visible on home divine intent row
- `tests/unit/weapon-progression.test.ts` — sword gate (T7)

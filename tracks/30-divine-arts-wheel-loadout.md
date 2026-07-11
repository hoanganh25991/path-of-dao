# 30 — Divine Arts 6-slot wheel loadout

**Status:** `[~]` In progress  
**Plan:** [plans/30-divine-arts-wheel-loadout.md](../plans/30-divine-arts-wheel-loadout.md)  
**Last updated:** 2026-07-11

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
- **DA-04 wheel icon procedural placeholders (2026-07-11):** `src/combat/art/skillIconDraw.ts` draws a readable 24×24 icon per skill from its Master Intent hue (`intentColors.ts`, handbook §3.1 canon) + a simple pixel-grid glyph (slash/petal/bolt/hourglass/leaf/eye/dot) as an inline SVG data URL — no canvas/PNG authoring needed. Awakened skills keep the same hue, +1 brightness step + rim glow (DA-04 rule). `AssetArtRegistry.resolveIconAsset('skills', skillId)` is checked first so a dropped `assets/sprites/skills/{skillId}.png` (DA-08) overrides it with no code change. Wired into `renderSkillButtonHtml` (`SkillIcon.ts`) — covers the combat wheel (`ActionButtons`), in-combat swap picker, skill detail/showcase — and directly into the Home Divine Arts tab (`ProfilePanel.ts` `divine` sub-tab).

## Remaining

- Pause-menu loadout editor (optional MVP per plan §4)
- DA-04 wheel icon keys on HUD buttons — `[x]` procedural placeholder shipped 2026-07-11 (see [track 32](./32-design-arts.md#done)); authored PNGs still open

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

- `pnpm test` — 102 files / 640 tests passed (2026-07-11, incl. new `tests/unit/skill-icon-draw.test.ts`)
- `tsc --noEmit` — clean
- Grep for `equippedSkills` in `src/` returns only the `SaveMigration.ts` v1 alias + doc comments referencing the old name
- E2E: ancient sword → Sword Slash visible on home divine intent row
- `tests/unit/weapon-progression.test.ts` — sword gate (T7)
- `tests/unit/skill-icon-draw.test.ts` — intent hue/glyph per Master Intent, awakened brightness step keeps hue, PNG-preferred-over-procedural resolution order, real skill content resolves the right intent (incl. `skill.void.*` → `truth_falsehood`)

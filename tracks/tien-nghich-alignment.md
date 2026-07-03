# Tiên Nghịch alignment

**Status:** `[~]` In progress  
**Spec:** [plans/index.md §1.1, §7.7, §7.8](../plans/index.md)  
**Last updated:** 2026-07-03

Design north star: mortal beginnings, map-by-map hardship, fortuitous inheritance, legendary sword earned late — structure and *feeling* from *Tiên Nghịch*, original story only.

**Story reference:** [docs/tien-nghich-reference.md](../docs/tien-nghich-reference.md) · **Skill:** `tien-nghich`

**Suggested order:** T4 → T1 → T2 → T3 → T7 → T6 → T5 → T8

---

## Requirements

| # | Requirement | Status | Owner tracks |
|---|-------------|--------|--------------|
| T1 | New game **unarmed** — hand/kick 3-hit combo, no sword equipped | `[x]` | [07](./07-player-controller-combat.md), [11](./11-equipment-3d-preview.md) |
| T2 | **Ancient Spirit Sword** from shrine POI in chapters 1–2 | `[x]` | [15](./15-fortuitous-encounters.md), [21](./21-mvp-maps-chapters-1-5.md) |
| T3 | Equipping a weapon **swaps** combo to armed prop + ancient sword unlocks Sword Intent | `[x]` | [07](./07-player-controller-combat.md), [14](./14-insight-system.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T4 | Remove **starter wood sword** from default new game loadout | `[x]` | [05](./05-save-system-foundation.md), [11](./11-equipment-3d-preview.md) |
| T5 | **Map-by-map road** — world map labels match chapter arc table | `[~]` | [17](./17-world-map-travel.md), [21](./21-mvp-maps-chapters-1-5.md), [22](./22-mvp-maps-chapters-6-10.md) |
| T6 | **Chapter stories** — perseverance tone, sword destiny in ch1–2 | `[ ]` | [18](./18-chapter-story-system.md), [24](./24-localization-en-vi.md) |
| T7 | **Sword Intent gating** in skill picker and combat | `[x]` | [19](./19-skill-executor-vfx.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T8 | **3D Home** shows empty hands until sword milestone | `[x]` | [10](./10-threejs-home-scene.md), [11](./11-equipment-3d-preview.md) |

---

## T1 — Unarmed start

**Goal:** Hero fights with hand and body strikes until a real weapon is earned.

**Current state:** `[x]` Implemented. New game has empty weapon slot. `resolveAttackStyle()` returns `unarmed`; combo steps 1–2 play random light strikes (`jab`, `cross`, `frontKick`, `roundKick`); step 3 cycles heavy finishers. Anim keys `hero_strike_*` registered from `stickyManStrikes.ts`. Distinct punch/kick reach and impact VFX on heavies.

**Verification:** `tests/unit/weapon-progression.test.ts`, `tests/unit/player-state-machine.test.ts`; preview on `sticky-man-review.html`.

---

## T2 — Ancient Spirit Sword POI

**Goal:** Major milestone item found on the road, not in tutorial chest.

**Current state:** `[x]` Shrine POI on chapter 1 ordeal map. Encounter grants ancient sword, sets `weaponMilestone`, equips blade, unlocks Sword Slash skill.

**Remaining:** Confirm POI also available in chapter 2 if missed; story shard and sting when blade is claimed (T6 tone pass).

---

## T3 — Sword milestone gameplay

**Goal:** Owning the ancient sword enables Sword Intent skills; equipping any weapon shows armed combo visuals.

**Current state:** `[x]` Implemented. `patchAncientSwordMilestone()` writes save flag on POI reward. `resolveAttackStyle()` follows **equipped weapon** (sword / lance / stick props via `registerHeroCombatAssets`). Sword Intent gated by `canUseSwordIntent()` in picker and skill filter. Basic attack uses `hero_sticky_attack_1/2/3` when armed.

**Verification:** `tests/unit/weapon-progression.test.ts`, journey E2E sword unlock cases.

---

## T4 — No starter sword

**Goal:** New game has empty weapon slot; wood sword may exist as junk later.

**Current state:** `[x]` Default save equips no weapon; combat starts unarmed.

---

## T5 — World road copy

**Goal:** World map reads as a cultivation journey, not a level select.

**Current state:** Twenty nodes and regions exist. Copy is functional stubs.

**Next steps:**
- Region blurbs per master plan §7.8 table
- Chapter tone consistent with diary-style perseverance

---

## T6 — Story tone pass

**Goal:** Chapter-end scenes feel like cultivation diary entries — cost, quiet resolve, no early power fantasy quips.

**Current state:** Chapter 1 has full copy; rewards jade spirit only. Chapters 2–10 are stub keys. Sword destiny not teased in early chapters.

**Next steps:**
- Literary pass on all ten chapter stories
- Expand chapter 1–2 slides for sword foreshadowing

---

## T7 — Sword Intent lock

**Goal:** Void and Life intents available early; Sword locked until ancient blade owned.

**Current state:** `[x]` `filterSkillsForWeaponGate()` and `canUseSwordIntent()` gate Sword Intent in picker; dev ancient mode bypasses for QA.

---

## T8 — Empty hands in Home

**Goal:** 3D hero viewer shows no weapon mesh until milestone.

**Current state:** `[x]` `getHeroDisplayEquipment()` strips weapon from Home preview until `weaponMilestone === 'ancient_sword'`.

---

## Open gaps (non-T1–T8)

- Story tone and sword foreshadowing (T6)
- World map copy aligned to chapter arc table (T5)
- Post-MVP: replace procedural sticky-man sheets with authored pixel art

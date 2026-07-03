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
| T1 | New game **unarmed** — palm 3-hit combo, no sword equipped | `[ ]` | [07](./07-player-controller-combat.md), [11](./11-equipment-3d-preview.md) |
| T2 | **Ancient Spirit Sword** from shrine POI in chapters 1–2 | `[~]` | [15](./15-fortuitous-encounters.md), [21](./21-mvp-maps-chapters-1-5.md) |
| T3 | Equipping ancient sword **swaps** combo to sword + unlocks Sword Intent | `[ ]` | [07](./07-player-controller-combat.md), [14](./14-insight-system.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T4 | Remove **starter wood sword** from default new game loadout | `[ ]` | [05](./05-save-system-foundation.md), [11](./11-equipment-3d-preview.md) |
| T5 | **Map-by-map road** — world map labels match chapter arc table | `[~]` | [17](./17-world-map-travel.md), [21](./21-mvp-maps-chapters-1-5.md), [22](./22-mvp-maps-chapters-6-10.md) |
| T6 | **Chapter stories** — perseverance tone, sword destiny in ch1–2 | `[ ]` | [18](./18-chapter-story-system.md), [24](./24-localization-en-vi.md) |
| T7 | **Sword Intent gating** in skill picker and combat | `[ ]` | [19](./19-skill-executor-vfx.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T8 | **3D Home** shows empty hands until sword milestone | `[ ]` | [10](./10-threejs-home-scene.md), [11](./11-equipment-3d-preview.md) |

---

## T1 — Unarmed start

**Goal:** Hero fights with palm/body strikes until a real weapon is earned.

**Current state:** Attack animations and VFX still look like sword slashes. Palm poses exist in art pipeline but are not wired to new-game state.

**Next steps:**
- Drive attack style from save progress flag
- Palm combo reach and VFX distinct from blade

---

## T2 — Ancient Spirit Sword POI

**Goal:** Major milestone item found on the road, not in tutorial chest.

**Current state:** Shrine POI placed on chapter 1 ordeal map. Encounter definition and locale strings exist. Reward grants the ancient sword item but does not yet change combat or insight gates.

**Next steps:**
- Confirm POI also available in chapter 2 if missed
- Story shard and sting when blade is claimed

---

## T3 — Sword milestone gameplay

**Goal:** Owning the ancient sword enables sword combo and Sword Intent skills.

**Current state:** Weapon milestone field planned in master plan but not in save schema yet. Equipping the item does not swap attack style.

**Next steps:**
- Add milestone flag to save on POI reward
- Swap combo and skill availability when milestone set

---

## T4 — No starter sword

**Goal:** New game has empty weapon slot; wood sword may exist as junk later.

**Current state:** Default save still equips training wood sword.

**Next steps:**
- Change new-game template to null weapon
- Verify combat power and UI handle empty slot

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

**Current state:** All intents selectable in skill picker regardless of weapon.

**Next steps:**
- Gate Sword Intent in picker and skill executor
- Clear UI message when locked (“Dao of the blade awaits your destiny”)

---

## T8 — Empty hands in Home

**Goal:** 3D hero viewer shows no weapon mesh until milestone.

**Current state:** Hero always shows equipped weapon attachment including starter sword.

**Next steps:**
- Hide weapon attachment when slot empty or milestone none
- Optional: subtle hand-wrap cosmetic only before sword

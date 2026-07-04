# Tiên Nghịch alignment

**Status:** `[~]` In progress  
**Spec:** [plans/index.md §1.1, §7.7, §7.8](../plans/index.md)  
**Last updated:** 2026-07-04

Design north star: *Tiên Nghịch* (Renegade Immortal) — **Vương Lâm** (Wang Lin), mortal start, chân tinh → tinh vực → ngoại giới → Lôi Tiên Giới cosmology, Thiên Nghịch Kiếm earned late.

**Story reference:** [handbook/tien-nghich-reference.md](../handbook/tien-nghich-reference.md) · **Skill:** `tien-nghich`

**Suggested order:** T4 → T1 → T2 → T3 → T7 → T6 → T5 → T8

---

## Cosmology (world map portal)

| Layer | In *Tiên Nghịch* | In Path of Dao |
|-------|------------------|----------------|
| **Nội giới** | Tứ đại tinh vực + tứ đại tiên giới; **Phong Giới Đại Trận** che chắn | **All 10 chapters** → **Lôi Tiên Điện** |
| **Chân tinh → tinh vực** | Travel within/between star domains | ch1–4 Chu Tước · ch5–7 La Thiên · ch8–10 Lôi Tiên Giới |
| **Thiên Nghịch Châu** | Seal protects Inner Realm; **Chủ Nhân Phong Giới** | Story/lore reference |
| **Ngoại giới** | Viễn Cổ Tiên Vực — **outside** Phong Giới | Not in MVP; teased ch10 epilogue |

**Hero:** Vương Lâm · **Weapon:** Thiên Nghịch Kiếm · **MVP end:** Lôi Tiên Điện (Inner Realm pinnacle)

**Domain banners:** `content/world/world-map.json` `domainId` + `domainLabelKey`; rendered on world map via `RegionNode`.

---

## Requirements

| # | Requirement | Status | Owner tracks |
|---|-------------|--------|--------------|
| T1 | New game **unarmed** — hand/kick 3-hit combo, no sword equipped | `[x]` | [07](./07-player-controller-combat.md), [11](./11-equipment-3d-preview.md) |
| T2 | **Thiên Nghịch Kiếm** from shrine POI in chapters 1–2 | `[x]` | [15](./15-fortuitous-encounters.md), [21](./21-mvp-maps-chapters-1-5.md) |
| T3 | Equipping a weapon **swaps** combo to armed prop + ancient sword unlocks Sword Intent | `[x]` | [07](./07-player-controller-combat.md), [14](./14-insight-system.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T4 | Remove **starter wood sword** from default new game loadout | `[x]` | [05](./05-save-system-foundation.md), [11](./11-equipment-3d-preview.md) |
| T5 | **Map-by-map road** — world map labels match Tiên Nghịch cosmology; Phong Giới barrier on cosmic map | `[x]` | [17](./17-world-map-travel.md), [21](./21-mvp-maps-chapters-1-5.md), [22](./22-mvp-maps-chapters-6-10.md) |
| T6 | **Chapter stories** — Vương Lâm diary tone, Thiên Nghịch foreshadowing ch1–2 | `[x]` | [18](./18-chapter-story-system.md), [24](./24-localization-en-vi.md) |
| T7 | **Sword Intent gating** in skill picker and combat | `[x]` | [19](./19-skill-executor-vfx.md), [23](./23-mvp-enemies-bosses-skills.md) |
| T8 | **3D Home** shows empty hands until sword milestone | `[x]` | [10](./10-threejs-home-scene.md), [11](./11-equipment-3d-preview.md) |

---

## T5 — World road copy

**Goal:** World map reads as Vương Lâm's cultivation journey through chân tinh / tinh vực / ngoại giới, with Phong Giới Đại Trận visible on the cosmic map.

**Current state:** `[x]` Implemented 2026-07-04 (barrier layer 2026-07-04).

- `content/locales/{en,vi}/world.json` — Chu Tước / La Thiên / Ngoại Giới / Lôi Tiên domain labels + chân tinh + map portal names + Phong Giới / Phong Tôn barrier lore
- `world-map.json` — expanded 1800×2000 canvas; `sealingBarrier` ellipse; inner-realm chân tinh inside; star field
- `SealingBarrierLayer.ts` + `SealingBarrierProgression.ts` — progressive reveal; lore pin + Lôi Tiên Điện detail sheet
- `RegionNode.ts` — domain banner UI
- Portal hint: `home.map_portal_hint` explains chân tinh → tinh vực → Lôi Tiên Giới

**Verification:** `tests/unit/world-map.test.ts`, `tests/unit/sealing-barrier.test.ts`; manual world map overlay shows barrier arc + domain banners.

---

## T6 — Story tone pass

**Goal:** Chapter-end scenes as Vương Lâm cultivation diary — Hằng Nhạc rejection, U Linh Thiên Nghịch Kiếm, La Thiên tribulation, Ngoại Giới, Lôi Tiên Điện.

**Current state:** `[x]` Implemented 2026-07-04.

- All 10 chapters: `content/locales/{en,vi}/story.json` — Vương Lâm first-person (vi) / Wang Lin (en)
- Ch2 adds slide03 for Thiên Nghịch Kiếm beat (`story.ch02.spirit_fox.json`)
- Enemies/skills/encounters/bestiary locale pass aligned to story cast

**Remaining:** Story illustrations (null placeholders); expand ch3–10 slides if more beats needed post-playtest.

---

## T1–T4, T7–T8

Unchanged from prior track — all `[x]`. See git history for verification notes.

---

## Open gaps (post-alignment pass)

- Story slide illustrations
- Echoes demo ancients still use original IP names (preview mode — intentional)
- Post-MVP: rename internal map IDs (`fallen_village` etc.) to slug match display (cosmetic refactor)
- **Level design:** ch4–10 map `.desc` + encounter roster tone pass; ch2–3 large explore stars (zone doors) — see [21](./21-mvp-maps-chapters-1-5.md) § Tiên Nghịch level design

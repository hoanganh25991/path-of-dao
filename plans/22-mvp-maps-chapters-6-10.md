# Sub-Plan 22: MVP Maps — Chapters 6–10

**Phase:** 6 — MVP Content  
**Estimated effort:** 16–20 hours  
**Depends on:** `21-mvp-maps-chapters-1-5`  
**Blocks:** MVP ship

---

## 1. Objective

Complete remaining 10 maps (chapters 6–10), 3 final bosses, endgame epilogue story, and Void Throne finale map. Same **map-design canon** as plan `21`: 100× scale, settlements, signature tree, unique environment — [`map-design-canon.md`](./map-design-canon.md).

---

## 2. Map Roster

| Map ID | Chapter | Theme | Ordeal cultivator (VI · EN) | Boss ID |
|--------|---------|-------|----------------------------|---------|
| map.thunder_peaks.01 | 6 | Cliffs, storm clouds | — | — |
| map.thunder_peaks.02 | 6 | Storm altar | **Thiên Vận Tử** (I) · Heaven Fate Lord (I) | boss.thunder_avatar |
| map.frozen_palace.01 | 7 | Ice halls | — | — |
| map.frozen_palace.02 | 7 | Memory hall | **Vọng Nguyệt** · Wang Yue | boss.frost_queen |
| map.abyss_rift.01 | 8 | Corrupted rift | — | — |
| map.abyss_rift.02 | 8 | Heart demon chasm | **Thiên Vận Tử** (II · Tâm Ma) · Heaven Fate · Heart Demon | boss.rift_horror |
| map.heavenly_gate.01 | 9 | Lôi Tiên steps | — | — |
| map.heavenly_gate.02 | 9 | Gate trial | **Chu Tước Tử** (II · Ải Môn) · Vermillion Bird Heir · Gate Trial | boss.celestial_guardian |
| map.void_throne.01 | 10 | Hall approach | — | — |
| map.void_throne.02 | 10 | Lôi Tiên Điện | **Thiên Vận Tử** (III · Lôi Điện) · Heaven Fate · Thunder Hall | boss.void_sovereign |

### 2.1 Settlements & signature trees (ch6–10)

| Map | Settlement `type` | Structures (min) | Signature tree |
|-----|-------------------|------------------|----------------|
| `map.thunder_peaks.01` | `outpost` | watchtower, hut, wall_segment | `prop.tree.storm_pine` |
| `map.thunder_peaks.02` | `sect_courtyard` | sect_gate, pavilion, shrine | `prop.tree.altar_cedar` |
| `map.frozen_palace.01` | `palace_ruin` | wall_segment, pavilion, shrine | `prop.tree.frost_paulownia` |
| `map.frozen_palace.02` | `palace_ruin` | shrine, pavilion, sect_gate | `prop.tree.memory_sakura` |
| `map.abyss_rift.01` | `ruin_village` | house_ruin×2, well | `prop.tree.void_bristle` |
| `map.abyss_rift.02` | `shrine_cluster` | shrine, pavilion | `prop.tree.heart_demon_wisteria` |
| `map.heavenly_gate.01` | `outpost` | watchtower, wall_segment, sect_gate | `prop.tree.gate_cypress` |
| `map.heavenly_gate.02` | `sect_courtyard` | sect_gate, pavilion, shrine | `prop.tree.trial_bodhi` |
| `map.void_throne.01` | `palace_ruin` | wall_segment, pavilion, watchtower | `prop.tree.thunder_halberd` |
| `map.void_throne.02` | `sect_courtyard` | sect_gate, shrine, pavilion | `prop.tree.dao_world_tree` |

---

## 3. recommendedCp Bands

| Chapter | Map .01 | Map .02 |
|---------|---------|---------|
| 6 | 45,000 | 60,000 |
| 7 | 75,000 | 95,000 |
| 8 | 120,000 | 150,000 |
| 9 | 180,000 | 220,000 |
| 10 | 260,000 | 320,000 |

Player with full awakenings + realm 6–7 should feel challenged on 9–10, overpowered on 1–3.

---

## 4.1 Map design (inherits plan 21 + map canon)

- **Bounds:** 16,000×12,160 px on **all** ch6–10 maps
- **Settlements:** ice palace halls as `palace_ruin`, gate **sect_courtyard**, void **nomad_camp** / ruins as appropriate
- **Signature trees:** ch6–10 roster in [`map-design-canon.md` §4.3](./map-design-canon.md#43-roster--all-20-maps)
- **Environment:** storm, frost, void, gate — each map unique `weather` + `uniqueness[]`

---

## 4. New Enemies (13 types — completes 25)

| ID | Archetype | Chapter |
|----|-----------|---------|
| enemy.storm.hawk | ranged_kiter | 6 |
| enemy.lightning.sprite | melee_chaser | 6 |
| enemy.ice.golem | melee_chaser | 7 |
| enemy.frost.shade | ranged_kiter | 7 |
| enemy.rift.spawn | melee_chaser | 8 |
| enemy.corrupted.cultist | ranged_kiter | 8 |
| enemy.celestial.archer | ranged_kiter | 9 |
| enemy.gate.sentinel | patrol | 9 |
| enemy.void.shade | melee_chaser | 10 |
| enemy.void.weaver | stationary | 10 |
| enemy.elite.* (3 variants) | mixed | 6–9 reuse |

---

## 5. Final Bosses

> Pixel identity per boss: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §6.

### boss.thunder_avatar — **Thiên Vận Tử** (I) · Heaven Fate Lord (I)

- Phase 1: fate lightning strikes telegraphed on ground
- Phase 2: Thunder Step mimic dashes — near-death at on-level CP

### boss.frost_queen — **Vọng Nguyệt** · Wang Yue

- Phase 1: moon-void ice shards cone
- Phase 2: memory freeze zones (slow, not full freeze)

### boss.rift_horror — **Thiên Vận Tử** (II · Tâm Ma) · Heaven Fate · Heart Demon

- Phase 1: heart-demon void pulls
- Phase 2: mirror adds spawn continuously (cap 4)

### boss.celestial_guardian — **Chu Tước Tử** (II · Ải Môn) · Vermillion Bird Heir · Gate Trial

- Phase 1: alternating vermillion sword/beam
- Phase 2: Gate Trial mini-domain (1s slow)

### boss.void_sovereign (FINAL) — **Thiên Vận Tử** (III · Lôi Điện) · Heaven Fate · Thunder Hall

- Phase 1: void slash variants
- Phase 2: realm suppression (player -20% atk unless awakened void)
- Phase 3: enrage timer 3 min — soft DPS check

Defeat triggers **epilogue story** + credits scroll.

**Dao Scroll** (plan 31): ch6–10 map prose in `content/locales/{en,vi}/timeline.json` **(done 2026-07-10)**.
Still need `timeline.map.*.json` shard files, `timelineShardId` on maps, illustrations. Ch10 `.02`
punch-line synthesizes all six Master Intents — Wang Lin at Thunder Hall.

---

## 6. Chapter 10 Epilogue

`story.ch10.epilogue.json`:

- 6 slides resolving cultivation arc
- Reward: cosmetic aura `aura.true_dao.crown` (visual only)
- No new chapter unlock — mark game complete flag `save.progress.gameComplete = true`

Show **Continue** → Home with special banner.

---

## 7. Mechanical Intro per Chapter

| Ch | Teach |
|----|-------|
| 6 | Lightning telegraph dodge |
| 7 | Slow zones positioning |
| 8 | Add priority / pull counterplay |
| 9 | Burst damage windows |
| 10 | All mechanics combined |

---

## 8. Fortuitous Encounters

- ch6: secret manual roll on thunder boss
- ch7: forgotten memory kill streak event enabled
- ch8: ancient inheritance higher weight (lore peak)
- ch9–10: unique one-time encounters only

---

## 9. World Map Integration

- Regions 6–10 unlock via chapter gates from sub-plan 17
- Void Throne region visually distinct (purple void border)

---

## 10. Credits

Simple HTML scroll after epilogue:

- Project title Path of Dao / Void Ascension
- "Thank you for walking the path"

Skip allowed.

---

## 11. Validation

```bash
pnpm content:validate --strict-i18n
```

Playthrough checklist document `handbook/qa/full-playthrough.md`:

- [ ] Ch6→10 sequential
- [ ] Game complete flag set
- [ ] Return to ch1 feels trivial

---

## 12. Acceptance Criteria

- [x] 10 maps complete (20 total with plan 21)
- [~] 8 bosses total functional
- [x] Epilogue story + credits play
- [x] gameComplete persisted
- [ ] recommendedCp curve smooth on spreadsheet
- [x] Validator clean
- [~] Performance: void throne < 8 enemies on screen avg

---

## 13. Handoff

Sub-plan 23 fills remaining skill variants. Sub-plan 24–26 polish for ship.

# Sub-Plan 21: MVP Maps — Chapters 1–5

**Phase:** 6 — MVP Content  
**Estimated effort:** 16–20 hours  
**Depends on:** `06`, `08`, `15`, `17`, `18`, `20`  
**Parallel with:** `22` (maps ch6–10), `23` (enemy/skill data), `29` (art), `31` (timeline shards) — split by chapter/region; see [`index.md`](./index.md) §5.3 Band 5  
**Blocks:** `22`, MVP ship

---

## 1. Objective

Author and integrate 10 playable maps (chapters 1–5 × 2 stages) with encounters, POIs, **settlements (structure/house/village)**, **signature big tree**, unique **environment**, recommended CP, tile art, and chapter completion hooks. Map canon: [`map-design-canon.md`](./map-design-canon.md).

---

## 2. Map Roster

**Renegade Immortal note (T1, `plans/index.md` §7.7 stage 0):** `map.fallen_village.01` is the
player's very first combat map — hero enters **unarmed** (3-hit punch/kick combo, no blade VFX,
no weapon in the 3D Home model either). Do not spawn any weapon pickup on this map; the Ancient
Spirit Sword POI belongs on `map.fallen_village.02` or a ch2 hidden cave per §7.8, never here.

| Map ID | Chapter | Theme | Encounters | Ordeal cultivator (VI · EN) | Boss ID |
|--------|---------|-------|------------|----------------------------|---------|
| map.fallen_village.01 | 1 | Ruined huts, tutorial — **unarmed start** | 3× slime, 2× wolf | — | — |
| map.fallen_village.02 | 1 | Heng Yue gate trial | Heng Yue disciples, ward | **Thác Sâm** · Tu Sen | boss.jade_guardian |
| map.mist_forest.01 | 2 | Fog paths | spirits, moths | — | — |
| map.mist_forest.02 | 2 | Fortune cave | fox spirits, U Linh Thú add | **Liễu Mi** · Liu Mei | boss.mist_stalker |
| map.stone_canyon.01 | 3 | Zhao patrol roads | patrol guards | — | — |
| map.stone_canyon.02 | 3 | Bandit heights | bandits elite | **Hồng Điệp** · Hong Die | boss.bandit_lord |
| map.moon_lake.01 | 4 | Lakeside | water sprites | — | — |
| map.moon_lake.02 | 4 | Seal shrine | cultists | **Chu Tước Tử** · Vermillion Bird Heir | boss.seal_warden |
| map.burning_desert.01 | 5 | Dunes | scorpions, sand wisps | — | — |
| map.burning_desert.02 | 5 | Scorching sands | sand spirits | **Viêm Lôi Tử** · Flame Thunder Lord | boss.desert_sovereign |

### 2.1 Settlements & signature trees (ch1–5)

Full 20-map roster: [`map-design-canon.md` §4.3](./map-design-canon.md#43-roster--all-20-maps).

| Map | Settlement `type` | Structures (min) | Signature tree |
|-----|-------------------|------------------|----------------|
| `map.fallen_village.01` | `ruin_village` | house_ruin×2, hut, well, shrine | `prop.tree.scorched_elm` |
| `map.fallen_village.02` | `sect_courtyard` | sect_gate, pavilion, watchtower | `prop.tree.jade_pine` |
| `map.mist_forest.01` | `hamlet` | hut×2, well, shrine | `prop.tree.mist_birch` |
| `map.mist_forest.02` | `shrine_cluster` | shrine, pavilion, well | `prop.tree.fox_ginkgo` |
| `map.stone_canyon.01` | `outpost` | watchtower, wall_segment, hut | `prop.tree.cliff_juniper` |
| `map.stone_canyon.02` | `nomad_camp` | hut×3, well | `prop.tree.bandit_camphor` |
| `map.moon_lake.01` | `hamlet` | house_intact, hut, well, pavilion | `prop.tree.lake_willow` |
| `map.moon_lake.02` | `shrine_cluster` | shrine, sect_gate, pavilion | `prop.tree.seal_oak` |
| `map.burning_desert.01` | `nomad_camp` | hut×2, well, watchtower | `prop.tree.desert_ghaf` |
| `map.burning_desert.02` | `outpost` | wall_segment, hut, shrine | `prop.tree.thunder_acacia` |

---

## 3. Deliverables

| Deliverable | Count |
|-------------|-------|
| Tiled map JSON | 10 files in `assets/maps/` |
| Map config JSON | 10 files in `content/maps/` |
| Encounter tables | 10 files |
| Region tilesets | 5 tilesets (reuse within chapter) |
| Story scenes | ch01–ch05 (5 files) |
| Chapter JSON | 5 files |
| POI placements | min 1 hidden cave + 1 sword POI across maps |
| Settlement + tree fields | all 10 map JSONs per [`map-design-canon.md`](./map-design-canon.md) | ✅ |
| Structure/tree props | DA-09 or procedural placeholders until art ships |

---

## 4. recommendedCp Bands

| Chapter | Map .01 | Map .02 |
|---------|---------|---------|
| 1 | 800 | 1,500 |
| 2 | 2,500 | 4,000 |
| 3 | 6,000 | 9,000 |
| 4 | 12,000 | 18,000 |
| 5 | 25,000 | 35,000 |

Tune with `pnpm cp:calc` after enemy stats placed.

---

## 5. Map Design Guidelines

> **Authoritative:** [`map-design-canon.md`](./map-design-canon.md) — scale, settlements, signature trees, environment uniqueness.

### Size (100× stub — all ch1–5 maps)

| Metric | Value |
|--------|-------|
| World bounds | **16,000 × 12,160** px |
| Tiles | **500 × 380** @ 32 px |
| vs early stub (1600×1216) | **100× play area** |
| Playtime | 12–20 min explore + waves + POI |

**No half-size maps** — `map.fallen_village.01` uses full 16k×12k bounds (update existing content).

### Settlements (structure · house · village)

- Every map: **≥1** `settlements[]` cluster with `house_ruin` / `house_intact` / `hut` / `well` / `shrine` as appropriate
- `.01`: explorable **ruin_village** or **hamlet** — Wang Lin's road begins among homes, not empty grass
- `.02`: **sect_gate** or **shrine_cluster** approach → boss arena

### Environment uniqueness

- Each map: unique `environment.palette`, `weather`, `parallaxTint`, `uniqueness[]` (2–4 tags)
- Sibling `.01` / `.02` **must differ** on all environment fields + signature tree species

### Signature big tree

- **Exactly one** per map — see roster [`map-design-canon.md` §4.3](./map-design-canon.md#43-roster--all-20-maps)
- Landmark for navigation; optional lore interact; Locate pin on world map (plan `17`)

### Layout

- `.01` maps: homestead → wilderness path → mini-ordeal zones
- `.02` maps: settlement approach → ordeal cultivator arena

### Collision

- Clear spawn safe zone 5 tiles radius
- Structure footprints on `collision` layer — `LayeredProp` collision from walls layer only
- No soft-lock in village alleys; player y-sorts behind/in front of buildings ([`fake-2.5d.md`](./fake-2.5d.md) §4.2)

---

## 6. Enemy Placement (New Types Ch1–5)

Author JSON for 12 new enemy types (of 25 total):

| ID | Archetype | Chapter |
|----|-----------|---------|
| enemy.slime | melee_chaser | 1 |
| enemy.wolf | melee_chaser | 1 |
| enemy.bandit.thug | melee_chaser | 1–3 |
| enemy.spirit.moth | ranged_kiter | 2 |
| enemy.spirit.wisp | melee_chaser | 2 |
| enemy.guard.patrol | patrol | 3 |
| enemy.bandit.archer | ranged_kiter | 3 |
| enemy.water.sprite | ranged_kiter | 4 |
| enemy.cultist.acolyte | melee_chaser | 4 |
| enemy.scorpion | melee_chaser | 5 |
| enemy.sand.wisp | ranged_kiter | 5 |
| enemy.sand.spirit | stationary | 5 |

Bosses (5 of 8 total) — **cultivator ordeal** gates; see [handbook/world-road-bosses.md](../handbook/world-road-bosses.md) and pixel identity [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §6:

- boss.jade_guardian → **Thác Sâm** · Tu Sen (ancient body suppression)
- boss.mist_stalker → **Liễu Mi** · Liu Mei (ice-water intent; U Linh Thú as phase add)
- boss.bandit_lord → **Hồng Điệp** · Hong Die (butterfly spirit dashes)
- boss.seal_warden → **Chu Tước Tử** · Vermillion Bird Heir (vermillion bird fire + seal break)
- boss.desert_sovereign → **Viêm Lôi Tử** · Flame Thunder Lord (flame thunder + heat zones)

---

## 7. Boss Pattern Minimum

Each boss 2 phases:

| Boss | Phase 1 | Phase 2 (<50% HP) |
|------|---------|-------------------|
| jade_guardian (**Thác Sâm** · Tu Sen) | slow body-suppression slam | ancient qi pulse — forces retreat |
| mist_stalker (**Liễu Mi** · Liu Mei) | ice-water needle volleys | summons U Linh Thú add + fog slow |
| bandit_lord (**Hồng Điệp** · Hong Die) | crimson butterfly dashes | feint swarm clones (1 real) |
| seal_warden (**Chu Tước Tử** · Vermillion Bird Heir) | vermillion fire seals | bird-fire circle traps |
| desert_sovereign (**Viêm Lôi Tử** · Flame Thunder Lord) | flame columns + bolt telegraphs | full-map heat slow debuff |

Implement via boss AI script array in enemy JSON `phases[]`.

---

## 8. Fortuitous Encounters

Per sub-plan 15:

- ch1 map02: fixed ancient sword POI
- ch2: spirit beast roll on fox map clear
- ch3–5: hidden cave POI each chapter

---

## 9. Story Content (Authoring)

**Chapter finales** (plan 18) — 4 slides × 5 chapters:

- `content/locales/en/story/ch01.json` … `ch05.json`
- Mirror vi keys (can be placeholder copy review later)

**Dao Scroll timeline** (plan 31) — **10 shards** (both maps per chapter ch1–5):

- `content/locales/{en,vi}/timeline.json` — body + Wang Lin parallel + punchline **(prose done 2026-07-10)**
- `content/story-timeline/timeline.map.*.json` — shard scripts + `intentLesson` **(pending)**
- `assets/story/timeline/ch01-*.webp` — painterly illustration per shard
- `timelineShardId` on each map JSON

Intent lesson table: [`plans/31-wang-lin-story-timeline.md`](./31-wang-lin-story-timeline.md) §5.

Rewards per `story.chXX.json` only (chapter finale); timeline shards are **read-only**, no duplicate loot.

---

## 10. Validation Checklist

```bash
pnpm content:validate --strict-i18n
```

- All 10 maps load in MapScene without error
- World map shows regions 1–5 unlocked progressively
- Chapter complete on .02 clears triggers story
- All 10 maps ch1–5 have timeline locale keys in `timeline.json` (plan 31 prose done)
- [ ] All 10 maps ch1–5 have `timelineShardId` + shard JSON + `timelineSeen` flow (plan 31 runtime)

---

## 11. Acceptance Criteria

- [~] 10 maps playable start to finish
- [~] 5 bosses defeatable with expected difficulty curve
- [x] 5 chapter story scenes trigger and grant rewards
- [ ] recommendedCp matches playtest feel (manual QA doc)
- [x] POIs functional
- [x] No validator errors
- [~] Tile seams invisible, no void holes

---

## 12. Art Placeholder Policy

Until final art: use region-colored tilesets + labeled enemy tint colors per [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §5.2 (`assets/sprites/README.md` for export paths).

---

## 13. Handoff

Sub-plan 22 continues chapters 6–10 with remaining 10 maps, 13 enemies, 3 bosses.

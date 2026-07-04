# Sub-Plan 21: MVP Maps — Chapters 1–5

**Phase:** 6 — MVP Content  
**Estimated effort:** 16–20 hours  
**Depends on:** `06`, `08`, `15`, `17`, `18`, `20`  
**Blocks:** `22`, MVP ship

---

## 1. Objective

Author and integrate 10 playable maps (chapters 1–5 × 2 stages) with encounters, POIs, recommended CP, tile art, and chapter completion hooks.

---

## 2. Map Roster

| Map ID | Chapter | Theme | Encounters | Boss |
|--------|---------|-------|------------|------|
| map.fallen_village.01 | 1 | Ruined huts, tutorial | 3× slime, 2× wolf | — |
| map.fallen_village.02 | 1 | Village heart | bandits | boss.jade_guardian |
| map.mist_forest.01 | 2 | Fog paths | spirits, moths | — |
| map.mist_forest.02 | 2 | Deep grove | fox spirits | boss.mist_stalker |
| map.stone_canyon.01 | 3 | Rocky trails | patrol guards | — |
| map.stone_canyon.02 | 3 | Bandit camp | bandits elite | boss.bandit_lord |
| map.moon_lake.01 | 4 | Lakeside | water sprites | — |
| map.moon_lake.02 | 4 | Seal shrine | cultists | boss.seal_warden |
| map.burning_desert.01 | 5 | Dunes | scorpions, sand wisps | — |
| map.burning_desert.02 | 5 | Oasis ruin | sand spirits | boss.desert_sovereign |

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

### Size

- Base tilemap export: 50×38 tiles (1600×1216 px) at 32 px tiles
- **Playable bounds scaled 10×** via `content/maps/*.json`: `16000×12160` px (500×380 tiles) for ch2–5; `map.fallen_village.01` retained at `8000×6080` px (250×190 tiles)
- Playtime target: 4–7 min per map

### Layout

- `.01` maps: intro difficulty, teach mechanic (dodge ch1, kiting ch2)
- `.02` maps: arena before boss + boss room

### Collision

- Clear spawn safe zone 5 tiles radius
- No soft-lock geometry

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

Bosses (5 of 8 total):

- boss.jade_guardian
- boss.mist_stalker
- boss.bandit_lord
- boss.seal_warden
- boss.desert_sovereign

---

## 7. Boss Pattern Minimum

Each boss 2 phases:

| Boss | Phase 1 | Phase 2 (<50% HP) |
|------|---------|-------------------|
| jade_guardian | slow melee slam | jade AoE pulse |
| mist_stalker | dash through player | fog clones (1 fake) |
| bandit_lord | summon 2 adds | enrage + faster |
| seal_warden | ranged seals | circle trap zones |
| desert_sovereign | sand columns | full map sand slow debuff |

Implement via boss AI script array in enemy JSON `phases[]`.

---

## 8. Fortuitous Encounters

Per sub-plan 15:

- ch1 map02: fixed ancient sword POI
- ch2: spirit beast roll on fox map clear
- ch3–5: hidden cave POI each chapter

---

## 9. Story Content (Authoring)

Write 4 slides × 5 chapters in locale files:

- `content/locales/en/story/ch01.json` … `ch05.json`
- Mirror vi keys (can be placeholder copy review later)

Rewards per story.chXX.json aligned with chapter progression.

---

## 10. Validation Checklist

```bash
pnpm content:validate --strict-i18n
```

- All 10 maps load in MapScene without error
- World map shows regions 1–5 unlocked progressively
- Chapter complete on .02 clears triggers story

---

## 11. Acceptance Criteria

- [ ] 10 maps playable start to finish
- [ ] 5 bosses defeatable with expected difficulty curve
- [ ] 5 chapter story scenes trigger and grant rewards
- [ ] recommendedCp matches playtest feel (manual QA doc)
- [ ] POIs functional
- [ ] No validator errors
- [ ] Tile seams invisible, no void holes

---

## 12. Art Placeholder Policy

Until final art: use region-colored tilesets + labeled enemy tint colors documented in `assets/sprites/README.md`.

---

## 13. Handoff

Sub-plan 22 continues chapters 6–10 with remaining 10 maps, 13 enemies, 3 bosses.

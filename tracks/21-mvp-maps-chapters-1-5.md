# 21 — MVP maps: chapters 1–5

**Status:** `[~]` In progress  
**Plan:** [plans/21-mvp-maps-chapters-1-5.md](../plans/21-mvp-maps-chapters-1-5.md)  
**Related:** [map-design-canon.md](../plans/map-design-canon.md) · [31](./31-wang-lin-story-timeline.md) (timeline shards)  
**Last updated:** 2026-07-10

## Summary

First half of the cultivation road: ten maps across five regions (explore + ordeal each). **Runtime shifted to procedural endless** (`spawnMode: procedural`, `worldProfile`) with seeded cells + wild bosses — playable and fun, but **not yet** full `map-design-canon` (16k bounds, settlements, signature trees on every JSON).

## Done

- [x] Ten procedural Tiled maps rebuilt with 25-tile 2.5D tileset (ground/water/flora/rock/structure/special)
- [x] Ch1 explore star: four sub-zones with roam spawns + zone portal doors
- [x] 17+ enemy definitions with correct pixel-art variants per chapter design
- [x] All enemy spriteKeys aligned to design table (spirit fox=beast white, scorpion=beast red, desert spirit=ghost orange-gold, water sprite=ghost blue-green)
- [x] Water sprite attack animations fixed (ranged_kiter needs attack poses)
- [x] **All playable maps endless procedural** — ch1–10 explore + ordeal + test grove; seeded cells, wild bosses, region fog
- [x] 2.5D pixel-art tileset system: seamless ground tiles + depth-faced structures
- [x] 8 biome palettes: village, mist, canyon, lake, desert, storm, ice, void
- [x] Sprite-based environment decorations replace Phaser primitives (trees, bushes, rocks, flowers, lanterns)
- [x] Y-sort depth system for player and enemy entities
- [x] Bootstrap biome auto-detection per chapter map
- [x] POI: ancient sword on ch1 + ch2 ordeal maps
- [x] Tiên Nghịch copy: region blurbs, map flavor text (EN + VI), enemy names, bestiary notes
- [x] World map detail sheet shows map `.desc`

## Remaining

- **Map canon (procedural path):** spawn settlement clusters + signature tree per `worldProfile` — not Tiled 16k revert
- **Dao Scroll** (plan 31): locale prose for ch1–5 maps **done** — still need `timelineShardId` on map JSON + shard files (see [31](./31-wang-lin-story-timeline.md) Phase B)
- Ch1 explore star sub-zones (east/south/north) — **keep** per user decision
- recommendedCp playtest pass (plan §11 manual QA)
- Tile seam / void-hole polish on procedural ground

## What needs to do

| # | Task | Track |
|---|------|-------|
| 1 | Add `timelineShardId` to 10 ch1–5 map JSONs | 31-B3 |
| 2 | Settlement + signature tree in procedural spawn | 06 |
| 3 | Manual CP playtest doc — adjust `recommendedCp` if maps feel wrong | balance |
| 4 | Ground seam pass on `EndlessGround` / palette transitions | 06, 29 |
| 5 | Confirm ancient sword POI only on `.02` / ch2 per plan (not ch1 `.01` tutorial) | 15, 21 |

## Verification

- Dedicated map JSON per region/stage; ch1 sub-zones load with roam tables
- Content validation passes
- World map: tap node → flavor blurb + recommended CP
- In-game: ch1–5 explore → walk endlessly, cultivators/bosses appear by seeded cell; mist forest has fog; ch1.02 Heng Yu Gate → fixed roam disciple clusters + jade guardian

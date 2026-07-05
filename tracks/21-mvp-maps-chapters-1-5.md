# 21 — MVP maps: chapters 1–5

**Status:** `[x]` Done  
**Plan:** [plans/21-mvp-maps-chapters-1-5.md](../plans/21-mvp-maps-chapters-1-5.md)  
**Last updated:** 2026-07-05

## Summary

First half of the cultivation road: ten maps across five regions (explore + ordeal each). All maps now use 2.5D pixel-art tileset with 25 tile types across 8 biome palettes.

## Done

- [x] Ten procedural Tiled maps rebuilt with 25-tile 2.5D tileset (ground/water/flora/rock/structure/special)
- [x] Ch1 explore star: four sub-zones with roam spawns + zone portal doors
- [x] 17+ enemy definitions with correct pixel-art variants per chapter design
- [x] All enemy spriteKeys aligned to design table (spirit fox=beast white, scorpion=beast red, desert spirit=ghost orange-gold, water sprite=ghost blue-green)
- [x] Water sprite attack animations fixed (ranged_kiter needs attack poses)
- [x] Encounter configs rewritten for swarm combat: 6-10 enemies per wave, 2 waves per map, MAX_ALIVE=24
- [x] 2.5D pixel-art tileset system: seamless ground tiles + depth-faced structures
- [x] 8 biome palettes: village, mist, canyon, lake, desert, storm, ice, void
- [x] Sprite-based environment decorations replace Phaser primitives (trees, bushes, rocks, flowers, lanterns)
- [x] Y-sort depth system for player and enemy entities
- [x] Bootstrap biome auto-detection per chapter map
- [x] POI: ancient sword on ch1 + ch2 ordeal maps
- [x] Tiên Nghịch copy: region blurbs, map flavor text (EN + VI), enemy names, bestiary notes
- [x] World map detail sheet shows map `.desc`

## Remaining

- Ch1–3 balance pass after large-map roam pacing
- Large explore stars for ch2–3 (zone doors)

## Verification

- Dedicated map JSON per region/stage; ch1 sub-zones load with roam tables
- Content validation passes
- World map: tap node → flavor blurb + recommended CP
- In-game: ch1 west ruins → roam slimes/hounds; ch1.02 → Heng Yue disciples → jade guardian; ch2.02 → backup sword POI

# 22 — MVP maps: chapters 6–10

**Status:** `[~]` In progress  
**Plan:** [plans/22-mvp-maps-chapters-6-10.md](../plans/22-mvp-maps-chapters-6-10.md)  
**Last updated:** 2026-07-10

## Summary

Endgame half of the road: tribulation peaks through void throne finale.

## Done

- Ten endgame maps: thunder peaks, frozen palace, abyss rift, heavenly gate, void throne
- Five distinct visual themes for late-game regions
- Void Throne finale map is largest (56×42 tiles)
- Recommended CP scales from ~45k to ~320k across chapters 6–10
- Nineteen new enemies: ten grunts, four elites, five bosses including void sovereign
- Hidden cave POIs on chapters 6, 8, and 10 explore maps
- Generation CLI for rebuilding chapter 6–10 content
- **Endless procedural** — `world.thunder_peaks` … `world.void_throne`; seeded cells + wild bosses + region fog

## Remaining

- **Map canon:** procedural settlement clusters + signature trees per `worldProfile` (not 16k Tiled revert)
- **Dao Scroll** (plan 31): locale prose for ch6–10 **done** — `timelineShardId` + shard JSON pending
- Boss pattern and phase tuning per map
- Playthrough balance on recommended CP bands

## What needs to do

| # | Task | Track |
|---|------|-------|
| 1 | `timelineShardId` on 10 ch6–10 map JSONs | 31-B3 |
| 2 | Boss pattern pass: Heaven Fate I/II/III, void sovereign, gate trial | 23 |
| 3 | CP band playtest ch6–10 — retreat/farm lower maps still feels fair | balance |
| 4 | Hidden cave POI rewards smoke-tested on ch6, 8, 10 | 15 |

## Verification

- Content tests for chapter 6–10 map data pass

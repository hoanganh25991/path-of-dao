# 17 — World map & free travel

**Status:** `[x]` Done  
**Plan:** [plans/17-world-map-travel.md](../plans/17-world-map-travel.md)  
**Last updated:** 2026-07-10

## Summary

Non-linear world map with 20 destinations, unlock rules, and difficulty hints. Cosmic canvas conveys Phong Giới Đại Trận sealing the Inner Realm.

## Done

- Ten region clusters, twenty map nodes on world map data
- Unlock rules: default open, clear-map gate, chapter gate
- Travel eligibility checked before Enter
- World map overlay: drag-to-pan viewport with pinch/wheel zoom (focal-point), initial focus on current map, header **Locate** control to re-center
- Region clear indicators and map detail sheet
- Difficulty badge on each map from recommended CP vs player CP
- Play → Map Portal opens world map; Enter launches combat on chosen map
- **Continue Journey** on Play panel — `getNextJourneyMapId()` picks first unlocked uncleared map; one-tap enter via `enterMapCombat()`
- English and Vietnamese world map strings
- Chapter + map flavor blurbs (Tiên Nghịch early arc); detail sheet shows map `.desc`
- **Cosmic map expansion** — 1800×2000 canvas, star field, chân tinh road inside Phong Giới ellipse
- **Phong Giới Đại Trận** SVG barrier layer with progressive reveal (`whisper` → `revealed`) tied to chapter progress
- **Phong Tôn lore** — detail link at Lôi Tiên Điện + barrier lore pin (封); persists `lore.phong_gioi.phong_ton` to save
- **Dao Scroll pin tooltip (2026-07-10)** — `RegionNode.timelineTooltipFor()` sets each map pin's tooltip to the Intent punch-line one-liner once its timeline shard is in `timelineSeen`, else `"?"`; falls back to the plain map-name tooltip when the map has no shard (sub-plan 31 §6.4, Phase E2)

## Remaining

- Post-MVP: animated barrier breach event when story crosses into Outer Realm

## Verification

- Enter sets current map and switches to combat scene
- Unlock rules and travel states unit tested
- Viewport pan/zoom math and locate control unit tested
- `tests/unit/sealing-barrier.test.ts` — schema, stage progression, lore unlock
- E2E: Map Portal → Mist Forest node after ch1 complete

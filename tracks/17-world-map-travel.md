# 17 — World map & free travel

**Status:** `[x]` Done  
**Plan:** [plans/17-world-map-travel.md](../plans/17-world-map-travel.md)  
**Last updated:** 2026-07-03

## Summary

Non-linear world map with 20 destinations, unlock rules, and difficulty hints.

## Done

- Ten region clusters, twenty map nodes on world map data
- Unlock rules: default open, clear-map gate, chapter gate
- Travel eligibility checked before Enter
- World map overlay: pan, scroll, pinch/wheel zoom
- Region clear indicators and map detail sheet
- Difficulty badge on each map from recommended CP vs player CP
- Play → Map Portal opens world map; Enter launches combat on chosen map
- **Continue Journey** on Play panel — `getNextJourneyMapId()` picks first unlocked uncleared map; one-tap enter via `enterMapCombat()`
- English and Vietnamese world map strings

## Remaining

- **Tiên Nghịch gap:** region labels and blurbs need tone pass to match map-by-map road arc (T5)

## Verification

- Enter sets current map and switches to combat scene
- Unlock rules and travel states unit tested
- E2E: Map Portal → Mist Forest node after ch1 complete

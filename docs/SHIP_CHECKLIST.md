# Path of Dao — Ship Checklist (MVP v0.1.0)

Manual QA script for [plans/index.md §12](../plans/index.md). Run on a mid-range Android device and desktop Chrome before tagging `v0.1.0-mvp`.

## Boot & shell

- [ ] App loads without console errors
- [ ] Audio unlock overlay appears once; tap dismisses it
- [ ] Home 3D shrine renders; profile header shows realm / CP
- [ ] PWA installable (Add to Home Screen / Install app)
- [ ] Settings shows version `0.1.0-mvp`

## Core loop

- [ ] Play → Map Portal → enter ch1 map → combat loads
- [ ] Move, attack, dodge, cast skills on touch controls
- [ ] Walk to EXIT zone → returns Home; progress autosaves
- [ ] World map shows difficulty badge; locked maps explain why
- [ ] Pause / resume app (background tab) without crash

## Progression

- [ ] Realm breakthrough flow works once (cultivate button when ready)
- [ ] Insight meter fills; one skill awakening demonstrable
- [ ] Fortuitous encounter triggers from POI or roll
- [ ] Combat power updates in Home profile after gear / level change
- [ ] My Path scroll records map clear / story / breakthrough steps

## Echoes & Path

- [ ] Echoes tab lists six ancients; Walk Here enters god-mode combat
- [ ] Follow Their Path walks maps in order with story beats
- [ ] Exit demo restores real save

## Content (spot-check)

- [ ] Chapter 1 story plays after clearing ordeal map
- [ ] Story replay from My Path works
- [ ] vi locale: bottom nav, world map, settings readable (no overflow)

## Performance & quality

- [ ] Low quality setting disables combat hit-stop / shake
- [ ] ≥ 30 FPS combat on mid-range Android (Snapdragon 6xx class)
- [ ] Scene switch Home ↔ combat < 1 s
- [ ] 10-minute playthrough without console errors

## Save

- [ ] Autosave on map exit
- [ ] Reload page restores position / stats
- [ ] Export / import JSON (if exposed in UI) or verify IndexedDB slot

## Sign-off

| Role | Name | Date |
|------|------|------|
| Dev | | |
| QA | | |

When all items checked: `git tag v0.1.0-mvp` and deploy `dist/`.

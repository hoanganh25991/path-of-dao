# Track 28 — Path & Journey System

> **Plan:** [plans/28-path-journey-system.md](../plans/28-path-journey-system.md)
> **Status:** `[x]` Phase A + Phase B complete
> **Last updated:** 2026-07-03

Unifies world road + chapter stories + Echoes into one **Path** spine: an ordered
journey of milestones, each stamped with strength (realm/level/CP) at that step.
My Path = your auto-recorded road; Ancient Paths = authored roads to "learn from history".

---

## Phase A — My Path foundation `[x]`

| Area | Detail |
|------|--------|
| Save schema | `journeyEntrySchema` + `progress.journey` (default `[]`) |
| JourneyLog | snapshot/append/dedupe; hooks on map clear, story, breakthrough |
| My Path UI | `StoryPanel` journey scroll; `journeyView` labels |
| Ancient roads | `path[]` per ancient; `getAncientPath()` |

---

## Phase B — Follow the Ancient's Path `[x]`

| Area | Detail |
|------|--------|
| PathWalkManager | Session cursor; `onPathStepMapCleared` → story or next map; `routePathWalk` |
| MapScene | Path walk intercepts EXIT before normal chapter flow |
| StorySceneHost | `pathWalk` payload advances walk after replay (no rewards) |
| AncientDemoModal | **Their Road** list + **Follow Their Path** / **Walk Here** |
| EchoesPanel | `follow_path` starts guided walk; `walk_here` = single-map showcase |
| Locales | `demo.path.*` (en/vi) |
| Tests | `tests/unit/path-walk.test.ts` — interleaved map/story routing |

### Verification (2026-07-03)

- Guided walk: map clear → story (replay) → next map → finish → restore real save + Home
- Exit demo / Return to Your Path clears path walk session
- Modal shows ordered road with region, realm, story beat labels
- **330 tests green**

---

## Acceptance

- [x] Milestone steps recorded on map clear / story / breakthrough, once each
- [x] My Path shows strength per step, newest at top
- [x] Every ancient has a ≥2-step road of real maps
- [x] Following a path visits each map in order with story beats between
- [x] Exiting mid-walk restores player journey (no demo leakage to IDB)
- [x] Ancient road readable in modal (en + vi)

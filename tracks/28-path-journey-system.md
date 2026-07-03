# Track 28 — Path & Journey System

> **Plan:** [plans/28-path-journey-system.md](../plans/28-path-journey-system.md)
> **Status:** `[x]` Phase A + B landed
> **Last updated:** 2026-07-03

Unifies world road + chapter stories + Echoes into one **Path** spine: an ordered
journey of milestones, each stamped with strength (realm/level/CP) at that step.
My Path = your auto-recorded road; Ancient Paths = authored roads to "learn from history".

---

## Phase A — My Path foundation `[x]`

| Area | Detail |
|------|--------|
| Save schema | `journeyEntrySchema` + `progress.journey` (default `[]` — pre-28 saves load); `createNew()` seeds `[]` |
| JourneyLog | `makeJourneyEntry` (strength snapshot via `computeCombatPowerFromSave`), `appendJourneyStep` (dedupe by `kind`+`refId`), `recordJourney` |
| Recording hooks | `ChapterManager.applyMapClearPatch` → `map_clear`; `completeStory` → `story`; `BreakthroughManager.applyBreakthrough` → `breakthrough` |
| My Path UI | `StoryPanel` rewritten to a journey scroll (newest first); `journeyView.describeJourneyEntry` resolves region/realm/story labels; story steps keep Replay; lore preserved |
| Ancient roads | `ancientPathStepSchema` + `profile.path`; 2–3 step road authored per ancient in `content/demo/ancients.json`; `getAncientPath()` accessor |
| Locale | `home.path.*`, `path.kind.*`, `path.stage.*`, `path.strength.*` (en/vi); Path nav label |
| CSS | `.home-path__*` scroll rows (kind badge, title, gold strength line) |

---

## Phase B — Follow the Ancient's Path `[x]`

| Area | Detail |
|------|--------|
| PathWalkManager | Session cursor over ancient `path[]`; `onPathStepMapCleared` / `onPathStepStoryFinished` / `routePathWalk` |
| Echoes entry | `AncientDemoModal` — road list + **Follow Their Path** / **Walk Here**; `EchoesPanel` starts guided walk |
| Combat hook | `MapScene` exit zone routes path-walk clears through `PathWalkManager` (skips real save patch) |
| Story hook | `StorySceneHost` with `pathWalk: true` advances walk without polluting player story progress |
| Locale | `demo.path.*` follow strings (en/vi) |
| Tests | `tests/unit/path-walk.test.ts` — map-only stops, story interleave, finish → home |

### Verification (2026-07-03)

- `npm run typecheck` clean
- `npx vitest run` — **334 tests green** (incl. `path-walk.test.ts`, `journey-log.test.ts`)
- Following a path visits each stop in order; mid-walk exit via `stopPathWalk` / `exitAncientDemo` restores real save
- Demo walks never persist to IndexedDB or pollute My Path

---

## Acceptance

- [x] Milestone steps recorded on map clear / story / breakthrough, once each
- [x] My Path shows strength per step, newest at top; story replay works
- [x] Every ancient has a ≥2-step road of real maps, realm order non-decreasing
- [x] Pre-28 saves load unchanged; typecheck + full suite green
- [x] Following an ancient's path walks each map in order with story beats between
- [ ] `boss` / `encounter` journey kinds wired (deferred — scroll renders if present)

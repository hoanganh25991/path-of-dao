# Track 28 — Path & Journey System

> **Plan:** [plans/28-path-journey-system.md](../plans/28-path-journey-system.md)
> **Status:** `[~]` Phase A landed · Phase B (guided ancient walk) pending
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

### Verification (2026-07-03)

- `npm run typecheck` clean
- `npx vitest run` — **319 tests green** (added `tests/unit/journey-log.test.ts`, extended `ancient-demo.test.ts`)
- Content validation (locale parity + cross-refs) passes with new keys
- Journey records once per milestone; strength snapshot immutable per step
- Demo walks record against the discarded demo save — My Path stays clean

---

## Phase B — Follow the Ancient's Path `[ ]`

| Planned |
|---------|
| `PathWalkManager` — session cursor over an ancient's `path[]` (no IDB persist) |
| Selecting **Follow his path** → step 1 map (god-mode) → step story → next map → Home |
| `AncientDemoModal` renders the road as a readable list (region · realm · story) |
| Wire `boss` / `encounter` journey kinds |
| `demo.path.*` follow strings (en/vi) |

---

## Acceptance

- [x] Milestone steps recorded on map clear / story / breakthrough, once each
- [x] My Path shows strength per step, newest at top; story replay works
- [x] Every ancient has a ≥2-step road of real maps, realm order non-decreasing
- [x] Pre-28 saves load unchanged; typecheck + full suite green
- [ ] Following an ancient's path walks each map in order with story between (Phase B)

# 31 — Wang Lin story timeline (Dao Scroll)

**Status:** `[~]` Phases A–D done · Phase E (art/polish) pending  
**Plan:** [plans/31-wang-lin-story-timeline.md](../plans/31-wang-lin-story-timeline.md)  
**Last updated:** 2026-07-10

## Summary

**Dao Scroll** — readable Wang Lin road on **every map** (20 shards): player beat + Wang Lin parallel + Intent punch-line. Complements chapter finales (plan 18). Player-visible now via the Path tab **Dao Scroll** sub-tab and the map-clear offer modal.

---

## Done (Phase A — content)

- [x] `content/locales/en/timeline.json` — 20 maps × (body + wang_lin + punchline + title)
- [x] `content/locales/vi/timeline.json` — full mirror
- [x] `pnpm i18n:lint` parity
- [x] Beats aligned to handbook §Story phases + plan 31 §5 intent table
- [x] Plan 18 chapter prose expanded (6 slides/ch) — same Wang Lin north star

## Done (Phase B — shard JSON + pipeline)

- [x] `src/shared/schemas/timeline.ts` — `timelineShardSchema` (id, mapId, chapterId, wangLinPhase, `intentLesson` enum, illustration, slides ≥2, punchlineKey, punchlineAttributionKey). **2026-07-10:** `intentLesson` migrated to the Master Intent roster (plan 14) — `life`→`life_death`, `void`→`truth_falsehood`, `time`→`cause_effect`; `sword`/`flame`/`lightning` unchanged. All 20 shard JSONs + `INTENT_LESSON_IDS` + `INTENT_RIM_COLORS` updated in the same change; see [track 14](./14-insight-system.md)
- [x] `content/story-timeline/timeline.map.{region}.{nn}.json` — all 20 shards, referencing existing `timeline.json` locale keys
- [x] `timelineShardId: z.string().nullable().default(null)` added to `mapConfigSchema` (`src/combat/map/MapConfig.ts`); set on all 20 main map JSONs (sub-zones + `map.test.grove` intentionally skipped)
- [x] `src/progression/TimelineLoader.ts` — mirrors `StoryLoader.ts` (`import.meta.glob` on `content/story-timeline/*.json`); `listTimelineShardsInRoadOrder()` orders by world-map region/map order (NOT filename order) for the Dao Scroll list
- [x] Registered in `validateSchemas.ts` (schema + id/filename check), `lintCrossrefs.ts` (mapId/chapterId/locale-key crossrefs), `packManifest.ts` + `tools/content/pack-manifest.mjs` (`timelineShards` in manifest + checksum), `ContentLoader.ts` (unified accessors)
- [x] `tests/unit/timeline-loader.test.ts` — 20 shards load, unique mapIds, valid `intentLesson`, map config `timelineShardId` round-trip, road-order assertion, en+vi locale key resolution

## Done (Phase C — save + unlock)

- [x] `SaveSchema.ts` — `progress.timelineSeen: string[]` (default `[]`, pre-31 saves migrate cleanly via zod `.default`); `journeyEntrySchema.kind` extended with `'timeline_shard'`
- [x] `SaveManager.createNew()` seeds `timelineSeen: []`
- [x] `ChapterManager.tryClearMap` / `applyMapClearPatch` — on first clear of a map with a `timelineShardId` not yet in `timelineSeen`: returns `pendingTimelineShard` on the result, pushes the id into `timelineSeen`, and records a `timeline_shard` journey entry — **unconditionally on clear**, so choosing "Later" in the offer modal still permanently unlocks the Dao Scroll node (spec: unlock on clear, modal is read-now vs later)
- [x] `journeyView.describeJourneyEntry` — `timeline_shard` case resolves title from `${shardId}.title` locale key, kind label `path.kind.timeline_shard`, and exposes `timelineReplay` for the My Path replay button
- [x] No loot/rewards ever granted for shard read (offer, first read, and all replays)

## Done (Phase D — Dao Scroll UI)

- [x] `src/ui/modals/TimelineOfferModal.ts` — "A page of the road opens" → **Read now** / **Later**, modeled on `EncounterModal`'s promise-based overlay pattern
- [x] `src/ui/story/TimelineShardReader.ts` — fork of `StoryReader`; after the diary + Wang Lin slides, shows a punch-line card with a 4px Intent-colored left border (`src/shared/intentColors.ts`, plan 29 §5.2 canon colors) + attribution; replay-safe (never touches save state)
- [x] `src/ui/story/timeline.css` — offer modal + punch-line card styling
- [x] `MapScene.finishMapExit` — after `applyMapClearPatch`, if `pendingTimelineShard`, awaits the offer modal; "Read now" opens `TimelineShardReader` inline (via `#ui-root`) before continuing to any pending chapter story; "Later" just continues (shard is already unlocked)
- [x] `StoryPanel.ts` (Path tab) — sub-tabs **My Path** | **Dao Scroll**; Dao Scroll renders all 20 shards in road order (`listTimelineShardsInRoadOrder`) with locked (silhouette title + hint, using `timelineSeen`) vs unlocked (title + punch-line + intent label + replay button) states
- [x] My Path list also gets a replay button for `timeline_shard` journey entries (mirrors the existing chapter-story replay button)
- [x] Locale keys `home.path.dao_scroll`, `home.path.my_path`, `home.path.dao_scroll.empty`, `home.path.dao_scroll.locked`, `timeline.offer.title`, `timeline.offer.read`, `timeline.offer.later`, `path.kind.timeline_shard` — en + vi

---

## Remaining — Phase E (art + polish, parallel)

| # | Task | Files |
|---|------|-------|
| E1 | `assets/story/timeline/*.webp` per map (shards currently ship with `illustration: null` — reader renders placeholder art panel) | encounter-art skill |
| E2 | World map pin tooltip — punch-line one-liner if `timelineSeen`, else `"?"` (plan 31 §6.4) | `src/ui/world/WorldMap.ts` / `RegionNode` |
| E3 | Ancient path-walk auto-open shard between maps, skippable (plan 31 §6.3) | `src/progression/PathWalkManager.ts` |

---

## Verification (2026-07-10)

- [x] `pnpm exec vitest run` — **529/529 unit tests pass** (0 failing), including new `tests/unit/timeline-loader.test.ts` (7 tests) and updated `chapter-manager.test.ts` / `journey-log.test.ts` for the new `pendingTimelineShard` result field and extra journey entry
- [x] `pnpm exec tsc --noEmit` — clean
- [x] `pnpm content:validate` — passes (schema + crossrefs for all 20 shards; `timelineShardId` resolves on every main map)
- [x] `pnpm i18n:lint` — passes for all new/changed keys (pre-existing unrelated vi gaps — `divine.tier.*`, `intent.awakened`, etc. — are **not** from this change and remain under strict mode)
- [x] Manual trace of the flow (code review, not live-browser): clear `map.fallen_village.01` → `tryClearMap` returns `pendingTimelineShard: 'timeline.map.fallen_village.01'` → `applyMapClearPatch` pushes it into `timelineSeen` + records `timeline_shard` journey entry → `MapScene` shows the offer modal → Read now opens `TimelineShardReader` → punch-line card (teal `life_death` rim) → Home
- [ ] Live-browser/E2E pass of the above (not run this session — recommend `smoke-test` skill or a Playwright pass before ship)
- [ ] Dao Scroll node marked read after first shard view, confirmed visually in the running app

---

## Owner tracks

Cross-cutting with [05](./05-save-system-foundation.md) (save schema), [12](./12-home-ui-panels.md) (Path tab), [17](./17-world-map-travel.md) (Phase E2 tooltip), [18](./18-chapter-story-system.md) (chapter-finale ordering), [20](./20-content-pipeline.md) (validators), [28](./28-path-journey-system.md) (journey kind + Phase E3 auto-walk).

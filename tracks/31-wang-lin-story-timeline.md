# 31 — Wang Lin story timeline (Dao Scroll)

**Status:** `[~]` Phase A (prose) done · Phases B–E pending  
**Plan:** [plans/31-wang-lin-story-timeline.md](../plans/31-wang-lin-story-timeline.md)  
**Last updated:** 2026-07-10

## Summary

**Dao Scroll** — readable Wang Lin road on **every map** (20 shards): player beat + Wang Lin parallel + Intent punch-line. Complements chapter finales (plan 18). This is the **novel spot tracker** the Path tab should expose via a **Dao Scroll** sub-tab.

---

## Done (Phase A — content)

- [x] `content/locales/en/timeline.json` — 20 maps × (body + wang_lin + punchline + title)
- [x] `content/locales/vi/timeline.json` — full mirror
- [x] `pnpm i18n:lint` parity
- [x] Beats aligned to handbook §Story phases + plan 31 §5 intent table
- [x] Plan 18 chapter prose expanded (6 slides/ch) — same Wang Lin north star

---

## What needs to do

Implement in order **B → C → D → E** (plan 31 §9.1).

### Phase B — Shard JSON + content pipeline

| # | Task | Files |
|---|------|-------|
| B1 | Define `TimelineShard` Zod schema | `src/shared/schemas/timeline-shard.ts` or plan 20 |
| B2 | Create 20 files `content/story-timeline/timeline.{mapId}.json` — reference locale keys + `intentLesson` + `wangLinPhase` | `content/story-timeline/` |
| B3 | Add `timelineShardId` to all `content/maps/*.json` | maps + validator |
| B4 | `TimelineLoader.ts` + unit test (20-map coverage) | `src/progression/` · `tests/unit/` |
| B5 | Register shards in `content/manifest.json` | manifest |

### Phase C — Save + unlock

| # | Task | Files |
|---|------|-------|
| C1 | `progress.timelineSeen: string[]` on save + migration | `SaveSchema.ts` |
| C2 | On first `map_clear` → push shard id → journey entry `kind: 'timeline_shard'` | `ChapterManager` or map exit hook |
| C3 | Modal: "A page of the road opens" → [Read now] [Later] | `MapScene` / UI modal |
| C4 | No loot on shard read (read-only) | — |

### Phase D — Dao Scroll UI (Path tab)

| # | Task | Files |
|---|------|-------|
| D1 | Path panel sub-tabs: **My Path** \| **Dao Scroll** | `StoryPanel.ts` or `PathPanel.ts` · plan 12 §18 |
| D2 | Vertical timeline list — locked / unread / read states | CSS `.home-path-tabs` |
| D3 | `TimelineShardReader` — fork `StoryReader`; punch-line slide with Intent rim | `src/ui/story/` |
| D4 | Tap node → replay any unlocked shard | — |
| D5 | Locale: `home.path.dao_scroll` tab label en+vi | `home.json` |

### Phase E — Art + polish (parallel)

| # | Task | Files |
|---|------|-------|
| E1 | `assets/story/timeline/*.webp` per map (or null illustration in shard JSON) | encounter-art |
| E2 | World map pin tooltip — punch-line if `timelineSeen` (plan 17 §6.4) | `RegionNode` |
| E3 | Ancient path-walk auto-open shard between maps (plan 28) | `PathWalkManager` |

---

## Remaining (summary)

Everything in **B–E** above. Phase A prose is **not** player-visible until **D** ships.

---

## Verification (when B–D done)

- [ ] Clear `map.fallen_village.01` → modal → read shard → `timelineSeen` contains id
- [ ] Dao Scroll shows 20 nodes; ch2+ locked on fresh save
- [ ] Replay shard → no rewards
- [ ] `pnpm content:validate` — all maps have `timelineShardId`
- [ ] E2E: map clear → shard read → Path Dao Scroll node marked read

# 20 — Content pipeline & validators

**Status:** `[~]` In progress  
**Plan:** [plans/20-content-pipeline.md](../plans/20-content-pipeline.md)  
**Last updated:** 2026-07-10

## Summary

Validate all game content at build time; catch broken cross-references before ship.

## Done

- Validate-all command runs Zod schemas per content type
- Cross-reference lint: maps ↔ chapters, encounters ↔ enemies, world nodes, locales, story rewards
- Unified content loader facade for maps, enemies, skills, items, story
- Pack command builds content manifest for runtime
- Documentation for ID conventions, CP bands, and Tiled workflow
- Dev-only maps exempt from chapter index lint
- **Lint: `loot.*` → valid `item.*`** — every `entries[]`/`guaranteed[]` `itemId` in `content/loot/*.json` checked against `content/items/`; boss-category enemies also error if missing a `lootTable` (33, 2026-07-10)

## Remaining

- Lint: `skill.*` on wheel → valid skill defs (remainder of old task #4 — not yet added)
- Expand lint rules as MVP content grows
- CI gate on content:validate before merge (optional)

## What needs to do

| # | Task |
|---|------|
| 1 | `TimelineShard` Zod schema + validate 20 `content/story-timeline/*.json` (blocks 31-B) |
| 2 | Lint: every `content/maps/*.json` has `timelineShardId` matching shard file |
| 3 | Lint: `story.chNN.slide01`…`slide06` keys exist for all wired chapter scenes |
| 4 | ~~Lint: `loot.*` → valid `item.*`~~; `skill.*` on wheel → valid skill defs | `[x]` loot half done 2026-07-10 (33) — skill-wheel half still open |
| 5 | Optional CI job: `pnpm content:validate --strict-i18n` on PR |

## Verification

- Full validation suite passes; 599 unit tests green at last run (2026-07-10)

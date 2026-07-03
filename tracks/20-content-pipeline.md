# 20 — Content pipeline & validators

**Status:** `[~]` In progress  
**Plan:** [plans/20-content-pipeline.md](../plans/20-content-pipeline.md)  
**Last updated:** 2026-07-03

## Summary

Validate all game content at build time; catch broken cross-references before ship.

## Done

- Validate-all command runs Zod schemas per content type
- Cross-reference lint: maps ↔ chapters, encounters ↔ enemies, world nodes, locales, story rewards
- Unified content loader facade for maps, enemies, skills, items, story
- Pack command builds content manifest for runtime
- Documentation for ID conventions, CP bands, and Tiled workflow
- Dev-only maps exempt from chapter index lint

## Remaining

- Expand lint rules as MVP content grows
- CI gate on content:validate before merge (optional)

## Verification

- Full validation suite passes; 249+ unit tests green at last run

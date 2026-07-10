# 24 — Localization en + vi

**Status:** `[~]` In progress  
**Plan:** [plans/24-localization-en-vi.md](../plans/24-localization-en-vi.md)  
**Last updated:** 2026-07-10

## Summary

Full UI and content strings in English and Vietnamese with parity checks.

## Done

- Locale manager with runtime switch and save persistence
- Number and duration formatters for UI
- Missing-key fallback in development builds
- Locale lint: en/vi key parity and empty value checks wired into content validation
- Glossary for consistent cultivation terminology
- System, home, world, story, skills, enemies, bestiary locale files
- **`story.json`** — 10 chapters × 6 slides Wang Lin prose (plan 18)
- **`timeline.json`** — 20-map Dao Scroll prose (plan 31)
- Bestiary entries generated for all enemies (41 entries)
- Settings modal language picker
- Noto Sans in font stack for Vietnamese diacritics

## What needs to do

| # | Task |
|---|------|
| 1 | `home.path.dao_scroll` tab label when Dao Scroll UI ships (31) |
| 2 | Full UI string audit — every screen in both locales |
| 3 | Layout overflow pass for longer Vietnamese strings (640px) |
| 4 | Lint: add `timeline.json` to strict-i18n if not already covered |

## Remaining

- UI audit + vi overflow (see table above)

## Verification

- Locale parity tests pass; 300+ unit tests green at last run

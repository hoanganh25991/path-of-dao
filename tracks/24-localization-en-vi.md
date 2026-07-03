# 24 — Localization en + vi

**Status:** `[~]` In progress  
**Plan:** [plans/24-localization-en-vi.md](../plans/24-localization-en-vi.md)  
**Last updated:** 2026-07-03

## Summary

Full UI and content strings in English and Vietnamese with parity checks.

## Done

- Locale manager with runtime switch and save persistence
- Number and duration formatters for UI
- Missing-key fallback in development builds
- Locale lint: en/vi key parity and empty value checks wired into content validation
- Glossary for consistent cultivation terminology
- System, home, world, story, skills, enemies, bestiary locale files
- Bestiary entries generated for all enemies (41 entries)
- Settings modal language picker
- Noto Sans in font stack for Vietnamese diacritics

## Remaining

- Full UI string audit — not every screen verified in both locales
- Story chapters 2–10 need translated literary copy (ties to 18, T6)
- Layout overflow pass for longer Vietnamese strings

## Verification

- Locale parity tests pass; 300+ unit tests green at last run

# 15 — Fortuitous encounter events

**Status:** `[x]` Done  
**Plan:** [plans/15-fortuitous-encounters.md](../plans/15-fortuitous-encounters.md)  
**Last updated:** 2026-07-03

## Summary

Random and POI-triggered cultivation encounters with rewards, lore, and cosmetics.

## Done

- Six fortuitous encounter types with roll tables
- Triggers: map enter, wave clear, 10-kill streak, boss rematch
- POI types on maps: hidden cave, ancient sword shrine
- Encounter modal pauses combat, themed card, confirm to accept
- **Card illustrations** — 6 PNGs in `assets/encounters/`; `illustration` field in JSON; `npm run art:encounters` to regenerate (OpenRouter)
- Rewards: rare items, gold, insight XP, lore entries, skill variants, spirit fox pet
- Pet appears as orbiting orb in Home hero viewer
- POI encounters tracked so each location fires once per save
- Dev tools to force-trigger encounters and tune roll rates
- **Ancient sword POI** sets `weaponMilestone` + equips blade (T2, T3)
- **My Path:** `recordJourney('encounter', …)` on claim; localized titles in journey scroll
- **Fortune toast** after accepting encounter reward

## Remaining

None for core encounter flow.

## Verification

- Encounter modal and reward application unit tested
- E2E: ancient sword encounter → `weaponMilestone` + Sword intent on Skills tab

- Rate rolls, unique POI skip, and reward application tested
- Encounter modal blocks input during display
- Journey log records encounter milestones once per refId

# 27 — Echoes of the Ancients (guided demo)

**Status:** `[x]` Done  
**Plan:** [plans/27-ancient-echo-demo.md](../plans/27-ancient-echo-demo.md)  
**Last updated:** 2026-07-03

## Summary

Onboarding demo where players walk as legendary ancients — combat-first power fantasy, not a debug mode.

## Done

- Six ancient profiles grouped by focus: breakthrough, awakening, combat (×2), fortune, endgame
- Echoes tab in Home bottom nav + travel button on Play panel
- Walk always enters combat on the ancient’s starting map
- God mode during demo: no damage taken, infinite mana (HUD shows ∞)
- Real save backed up in session storage; demo skips permanent save writes
- Themed hero look per ancient: palette, weapon, clothes, aura, name epithet
- Gold-styled combat HUD banner during ancient demo
- Three skill buttons; hold to swap loadout mid-combat via bottom sheet
- Loadout picker in Echoes modal with duplicate filtering
- Wider camera zoom and denser enemy waves for spectacle
- Fortuitous encounters skipped during demo so skills stay center stage
- English and Vietnamese demo strings

## Remaining

None for this sub-plan.

## Verification

- Demo enter → combat → exit to Home with demo save loaded
- God mode and encounter skip confirmed in playtest
- Ancient hero name + epithet tags stack without overlap (`ancientHeroVisuals.ts` Y offsets)

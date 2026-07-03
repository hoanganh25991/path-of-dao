# 08 — Enemy system & AI archetypes

**Status:** `[x]` Done  
**Plan:** [plans/08-enemy-system-ai.md](../plans/08-enemy-system-ai.md)  
**Last updated:** 2026-07-03

## Summary

Enemies spawn in waves, behave by archetype, drop rewards, and feed XP and bestiary progress.

## Done

- Enemy entity with health, AI, and telegraphed attacks
- Object pool caps live enemies at 8; extras queue for next spawn slot
- AI archetypes: melee chaser, kiting archer, patrol, stationary totem
- Wave spawner clears map when all waves defeated
- Archers fire arrows; totems use AoE telegraph rings
- Gold pickups with magnet pull toward player
- Kill rewards grant XP, level-ups refresh stats, bestiary records enemy types
- Player death resets current wave

## Remaining

None for this sub-plan.

## Verification

- Slimes chase and telegraph melee; archer kites and shoots
- Both waves clear; XP reaches level 4 in smoke test
- Gold magnet-collects; bestiary records all enemy types
- Save (XP, gold, level, bestiary) survives page reload
- 50-kill soak reuses pool instances without errors

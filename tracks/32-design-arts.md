# 32 — Design Arts (directory track)

**Status:** `[~]` In progress  
**Plan:** [plans/design-arts/index.md](../plans/design-arts/index.md) · [32-design-arts.md](../plans/32-design-arts.md)  
**Last updated:** 2026-07-10

## Summary

Parallel **pixel art authoring** — hero, enemies, bosses, wheel icons, treasure icons, map props, VFX sheets. Code ships with procedural placeholders until PNGs land (DA-08 auto-wire).

## Done

- Handbook + character sheets (`handbook/character-sheets/`)
- Encounter card illustrations (6 PNGs, `pnpm art:encounters`)
- Procedural sticky-man combat placeholders (plan 29 integration)
- 2.5D tileset + biome sprite decorations in combat
- `plans/design-arts/` tree specced (DA-01…08)

## Remaining

- DA-01 hero authored sprites (unarmed + sword stages)
- DA-02 minions (25 types), DA-03 ordeal bosses
- DA-04 wheel icons, DA-05 treasure icons
- DA-06 ancient echoes portraits, DA-07 VFX sprite sheets
- DA-08 auto-wire manifest pipeline on drop
- DA-09 map props (structures, signature trees) — ties to procedural world (06)

## What needs to do

| ID | Task | Output path |
|----|------|-------------|
| DA-01 | Hero unarmed + sword anim sheets | `assets/sprites/hero/` |
| DA-02 | 25 minion families | `assets/sprites/enemies/` |
| DA-03 | 8 ordeal boss silhouettes | `assets/sprites/bosses/` |
| DA-04 | 24×24 wheel icons per Intent color | `assets/sprites/skills/` |
| DA-05 | Treasure icons per `item.*` | `assets/sprites/items/` |
| DA-06 | 6 ancient echo portraits | `assets/sprites/ancients/` |
| DA-07 | VFX sprite sheets (tier Common/Signature) | `assets/sprites/vfx/` |
| DA-08 | `pnpm art:manifest` auto-wire on PNG drop | `tools/` + manifest |
| DA-09 | Structure + signature tree props for procedural spawn | `assets/sprites/props/` |

**Priority order:** DA-01 → DA-04 → DA-05 → DA-02/03 (parallel) → DA-07 → DA-09

## Verification

- Missing PNG = validator warning, not crash (baseline hook-up rule)
- When DA-01 lands: re-run plan 29 §0.2 visual QA checklist

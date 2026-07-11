# 32 — Design Arts (directory track)

**Status:** `[~]` In progress  
**Plan:** [plans/design-arts/index.md](../plans/design-arts/index.md) · [32-design-arts.md](../plans/32-design-arts.md)  
**Last updated:** 2026-07-11 (DA-05 procedural placeholder)

## Summary

Parallel **pixel art authoring** — hero, enemies, bosses, wheel icons, treasure icons, map props, VFX sheets. Code ships with procedural placeholders until PNGs land (DA-08 auto-wire).

## Done

- Handbook + character sheets (`handbook/character-sheets/`)
- Encounter card illustrations (6 PNGs, `pnpm art:encounters`)
- Procedural sticky-man combat placeholders (plan 29 integration)
- 2.5D tileset + biome sprite decorations in combat
- `plans/design-arts/` tree specced (DA-01…08)
- **DA-08 auto-wire pipeline (2026-07-11)** — `src/combat/art/AssetArtRegistry.ts` resolves `assets/sprites/{category}/{key}.png` → `manifest.json` override → procedural fallback; wired into `BootScene.preload` (`preloadHeroArt`) + `registerHeroCombatAssets` so a dropped hero PNG (or partial manifest anim override) swaps in with **no TS edit**; `pnpm art:manifest` scans/prunes `assets/sprites/manifest.json`; `content:validate` warns (not errors) on missing `skill.*`/`item.*` icon PNGs. No authored PNGs required — sticky-man stays the default. See `assets/sprites/README.md` for the drop-in steps.
- **DA-04 wheel icons — procedural placeholder (2026-07-11)** — `src/combat/art/skillIconDraw.ts` generates a readable 24×24 icon per `skill.*` from its Master Intent hue (`intentColors.ts` — handbook §3.1 canon) + a simple pixel-grid glyph (slash/petal/bolt/hourglass/leaf/eye/dot, "not letters" per plan rule), as an inline SVG data URL (no `<canvas>` needed, works in-browser and in unit tests). Awakened stays the same hue family, +1 brightness step + rim glow. `AssetArtRegistry.resolveIconAsset('skills', skillId)` is checked first, so dropping `assets/sprites/skills/{skillId}.png` (DA-08) overrides it with **no TS edit**. Wired via `renderSkillButtonHtml` (`SkillIcon.ts`) into the combat wheel (`ActionButtons`), in-combat swap picker, skill detail/showcase, and the Home Divine Arts tab (`ProfilePanel.ts`). Authored 24×24 pixel PNGs (the actual DA-04 art pass) still open.
- **DA-05 treasure icons — procedural placeholder (2026-07-11)** — `src/combat/art/itemIconDraw.ts` mirrors `skillIconDraw.ts`: a readable 24×24 SVG data-URL icon per `item.*`, built from a category glyph by equipment/consumable slot (blade=weapon, shield=armor, ring=accessory, orb=spirit, vial=consumable — "not letters") plus a rarity-colored rim, with an added soft outer glow for epic/legendary. `ITEM_RARITY_COLORS` is now the single source for rarity color (Home previously duplicated the hex map locally). `AssetArtRegistry.resolveIconAsset('items', itemId)` is checked first, so dropping `assets/sprites/items/{itemId}.png` (DA-08) overrides it with **no TS edit**. Wired via `getItemIconSrc` into the Home Dharma Treasures tab (equip slots, inventory grid, item detail header — `ProfilePanel.ts`) and the legacy `InventoryPanel.ts`. Authored 24×24 pixel PNGs (the actual DA-05 art pass, `plans/design-arts/items/`) still open.

## Remaining

- DA-01 hero authored sprites (unarmed + sword stages)
- DA-02 minions (25 types), DA-03 ordeal bosses
- DA-04 authored 24×24 wheel icon PNGs (procedural placeholder shipped 2026-07-11)
- DA-05 authored 24×24 treasure icon PNGs (procedural placeholder shipped 2026-07-11)
- DA-06 ancient echoes portraits, DA-07 VFX sprite sheets
- DA-09 map props (structures, signature trees) — ties to procedural world (06)

## What needs to do

| ID | Task | Output path |
|----|------|-------------|
| DA-01 | Hero unarmed + sword anim sheets | `assets/sprites/hero/` |
| DA-02 | 25 minion families | `assets/sprites/enemies/` |
| DA-03 | 8 ordeal boss silhouettes | `assets/sprites/bosses/` |
| DA-04 | `[~]` 24×24 wheel icons per Intent color — procedural placeholder done 2026-07-11 (`skillIconDraw.ts`); authored PNGs open | `assets/sprites/skills/` |
| DA-05 | `[~]` Treasure icons per `item.*` — procedural placeholder done 2026-07-11 (`itemIconDraw.ts`); authored PNGs open | `assets/sprites/items/` |
| DA-06 | 6 ancient echo portraits | `assets/sprites/ancients/` |
| DA-07 | VFX sprite sheets (tier Common/Signature) | `assets/sprites/vfx/` |
| DA-08 | `[x]` `pnpm art:manifest` auto-wire on PNG drop | `tools/generate-sprite-manifest.mjs` + `assets/sprites/manifest.json` |
| DA-09 | Structure + signature tree props for procedural spawn | `assets/sprites/props/` |

**Priority order:** DA-01 → DA-04 → DA-05 → DA-02/03 (parallel) → DA-07 → DA-09

## Verification

- Missing PNG = validator warning, not crash (baseline hook-up rule) — verified 2026-07-11: `pnpm content:validate` reports 68 warnings (0 errors) for currently-unauthored `skill.*`/`item.*` icons
- `tests/unit/asset-art-registry.test.ts` — resolve order (file → manifest → fallback), missing file → fallback, manifest path override
- `tests/unit/skill-icon-draw.test.ts` — DA-04 procedural icon: hue per Master Intent (matches `intentColors.ts` canon), distinct glyph per intent, awakened brightness step keeps hue, PNG-preferred-over-procedural resolution order, real `skill.*` content resolves the right intent
- `tests/unit/item-icon-draw.test.ts` — DA-05 procedural icon: distinct glyph per slot, rim color matches `ITEM_RARITY_COLORS` canon, epic/legendary get the extra glow, PNG-preferred-over-procedural resolution order, real `item.*` content resolves the right slot+rarity
- `pnpm test` — 103 files / 662 tests passed (2026-07-11); `tsc --noEmit` clean
- When DA-01 lands: re-run plan 29 §0.2 visual QA checklist

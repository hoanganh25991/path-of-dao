# DA-04 — Divine Art Wheel Icons (24×24)

> Parent: [index.md](./index.md) · Home UI: plan `12` §18.4 · Loadout: plan `30`  
> Integration: plan `29` §9.8 (playback in wheel HUD only)

---

## Objective

One **24×24** pixel icon per `skill.*` that can appear on the 6-slot combat wheel and Home Divine Arts panels.

## Rules

| Rule | Detail |
|------|--------|
| Size | 24×24 source; UI displays 32–40px `image-rendering: pixelated` |
| Color | Intent base hue rim + 1px inner glyph (not letters) |
| Power | L = flat; M = rim glow; S = animated rim (2-frame blink optional) |
| Awakened | Same hue family, +1 brightness step — not new element |

**Path:** `assets/sprites/skills/{skillId}.png` or `{iconKey}.png` from content JSON.

## Priority skills (MVP signature 12)

Author first: `skill.sword.flash`, `skill.void.slash`, `skill.flame.bolt`, `skill.lightning.strike`, `skill.time.domain`, `skill.life.mend` + awakened variants.

Full roster table: plan 29 §9.1–§9.7 (reference IDs only — **pixels authored here**).

## Acceptance

- [ ] All equippable MVP skills have icon file or `iconKey` fallback
- [ ] Validator warning on missing icon (plan `20` + DA-08)
- [ ] Intent color matches `handbook/pixel-art-style.md` §3.1 at a glance

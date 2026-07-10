# Hero — Cultivator Wanderer

> Wang Lin's road in pixel form — humble mortal first, ascendant last.  
> **Systems & stages:** [design-arts/hero.md](../../plans/design-arts/hero.md) (DA-01) · **Combat hooks:** [plan 29 §0.1](../../plans/29-pixel-art-combat-canon.md#01-animation-contract-required-keys) · **Rig & tokens:** [pixel-art-style.md §3](../pixel-art-style.md#3-character-palettes)

---

## Fantasy & role

A **disciple wanderer**, not a chosen-one knight. Survives through stubborn will; power shows in qi and Intent, not flashy armor. The player should read *mortal who refuses to stay small* — cold perseverance, not smug heroism.

## Silhouette (1× squint test)

- Chibi round head (4 px radius) on a **compact torso block** — not tall or lanky.
- **Gold headband** ring on crown; **gold sash** at hip — the only jewelry at stage 0.
- Two-segment arms and legs with visible **joint dots**; hands and feet are small blocks, not forks.
- Unarmed: empty fists, sleeves implied by robe block — no gloves, no cape.
- Armed: **short ancient blade** from hand (~11 px) — a cultivator's sword, not a greatsword.

Distinct from enemies: neutral grey-blue robe (not sect crimson, not bandit rust), no mask, no pauldrons until high realm props.

## Costume

| Part | Read |
|------|------|
| Robe | Slate grey-blue disciple cloth — simple block, no patterns at stage 0 |
| Head | Pale skin; single highlight eye dot; white-silver hair tint **only on top of head circle** |
| Sash / headband | Gold `#d4a840` — identity anchor across all stages |
| Feet | Cloth shoes at frame bottom; origin `(0.5, 1)` — always grounded |
| Weapon | None until Ancient Sword milestone; then hip/cast prop + slash arcs |

Exact hex tokens: `stickyManPalette.ts` / [pixel-art-style.md §3](../pixel-art-style.md#hero-cultivator-wanderer).

## Pose personality

| State | Feel |
|-------|------|
| Idle | Guarded stillness — subtle bob, arms relaxed (never T-pose) |
| Walk | Purposeful stride — visible leg/arm swing, not swagger |
| Unarmed strike | Lean into hit — jab/cross/kick read as martial, not slapstick |
| Armed combo | Anticipation frame before impact; finisher leans forward |
| Hit react | Knockback lean — vulnerable, not comedic |
| Gather Qi | Same idle body — vulnerability reads from pose, not glow overload |

## Growth stages (visual only)

Triggers and combat rules: **plan 29 §4.1** — do not duplicate here.

| Stage | What changes on the body |
|-------|--------------------------|
| 0 Mortal | Bare hands, dim sash, no blade |
| 1 Awakened qi | Faint jade eye dot; sash slightly richer |
| 2 Ancient sword | Bright sash; sword prop on attacks |
| 3 Tempered | Belt runes 1 px; optional iron mesh sidegrade |
| 4 High realm | Intent-colored **feet aura ring only** — not full-body tint |
| 5 True Dao | Twin ring + 8×8 crown glyph; gold-white robe edge trim |

## Must-not

- Full-body Intent recolor (breaks silhouette; aura ring only).
- Cape, pauldrons, or "golden armor" before late-game stage props.
- Oversized weapon or anime wind-up poses.
- Chosen-one smirk energy — posture stays humble through mid-game.

## Implementation handoff

| Layer | Owner |
|-------|--------|
| Poses / sheet build | `stickyManDraw.ts`, `stickyManAssets.ts` |
| Stage palettes | `heroStagePalette.ts`, `registerHeroCombatAssets()` |
| Animation keys | `PlayerAnimController` — [pixel-art-style.md §4](../pixel-art-style.md#4-animation-sets) |

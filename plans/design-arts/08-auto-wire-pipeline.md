# DA-08 — Auto-Wire Pipeline (drop-in assets)

> Parent: [index.md](./index.md) · Code today: `src/combat/art/stickyManAssets.ts` · Validators: plan `20`

---

## Objective

Finished art **plugs into the running game without a code change** — only a file drop + optional manifest row.

## Resolution order

```
1. If assets/sprites/{category}/{key}.png exists → load PNG atlas (Phaser sprite sheet)
2. Else if manifest.json maps key → custom path
3. Else → procedural sticky-man / pixelVfxDraw fallback (dev & until DA ships)
```

## Manifest (target)

`assets/sprites/manifest.json`:

```json
{
  "hero": {
    "player": { "sheet": "hero/wanderer.png", "frameWidth": 32, "frameHeight": 56,
      "anims": { "hero_sticky_idle": [0,3], "hero_sticky_walk": [4,9] } }
  },
  "skills": { "skill.sword.flash": "skills/skill.sword.flash.png" },
  "items": { "item.sword.ancient": "items/item.sword.ancient.png" }
}
```

`registerStickyManAssets()` (or successor `AssetArtRegistry`) reads manifest at `BootScene` boot.

## Integration hooks (plan 29 owns behavior)

| Hook | Design-arts provides | Plan 29 / code consumes |
|------|----------------------|-------------------------|
| `textureKey` | File path + frame grid | `Player` sprite creation |
| `animKey` | Frame ranges + FPS | `PlayerAnimController.play()` |
| `hitFrame` | Frame index per attack | `CombatComponent` hitbox spawn |
| `hurtboxRadius` | Optional per-enemy doc | `HitboxManager` |
| `feetOrigin` | Always `(0.5, 1)` | `DepthSort`, shadow |
| `iconKey` | 24×24 PNG | Home panels, wheel HUD |

## Validator (`pnpm content:validate`)

| Check | Severity |
|-------|----------|
| `skill.*` / `item.*` missing icon file | warn (ship: error) |
| Manifest anim range exceeds sheet frames | error |
| >6 colors in PNG (sticky-man entities) | warn (pixel-art-review skill) |

## Acceptance

- [~] Drop `assets/sprites/hero/wanderer.png` → next `pnpm dev` shows authored hero (no TS edit) — implemented 2026-07-11 (`AssetArtRegistry` + `preloadHeroArt` + `registerHeroCombatAssets`); no DA-01 PNG authored yet, so the live-render step is unverified until then
- [x] Remove file → procedural fallback returns (no crash) — verified via `resolveHeroAssetFrom` fallback unit tests + current repo has zero authored PNGs and boots clean
- [x] CI documents manifest schema in plan `20` — see [`plans/20-content-pipeline.md`](../20-content-pipeline.md) §14

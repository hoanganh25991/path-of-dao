# Sprite Placeholders (MVP)

Until final pixel art ships, the **hero** and early **enemies** use the procedural sticky-man rig (`src/combat/art/`).

## DA-08 auto-wire pipeline (drop-in assets)

Full spec: [plans/design-arts/08-auto-wire-pipeline.md](../../plans/design-arts/08-auto-wire-pipeline.md). Resolution order, checked by `src/combat/art/AssetArtRegistry.ts`:

1. `assets/sprites/{category}/{key}.png` exists → load it directly (no manifest entry needed).
2. Else `assets/sprites/manifest.json` maps `{category}.{key}` → custom path → load that.
3. Else → procedural sticky-man / pixel VFX fallback (current default, no crash).

### Manifest schema (`manifest.json`)

```json
{
  "hero": {
    "unarmed": {
      "sheet": "hero/wanderer.png",
      "frameWidth": 32,
      "frameHeight": 56,
      "anims": { "hero_sticky_idle": [0, 3], "hero_sticky_walk": [4, 9] }
    }
  },
  "skills": { "skill.sword.flash": "skills/skill.sword.flash.png" },
  "items": { "item.sword.ancient": "items/item.sword.ancient.png" }
}
```

- **hero** keys are `AttackStyle` values (`unarmed`, `sword`, `lance`, `stick`). Only anim keys you list in `anims` are taken from the real sheet — any anim not listed (e.g. `hero_sticky_sit`, strikes) keeps using the procedural rig, so a partial sheet never crashes or leaves an anim undefined.
- **skills** / **items** keys are the content id (`skill.*` / `item.*`) — same id used for `content/skills/*.json` / `content/items/*.json`.
- Committing an empty `{}` (or omitting a category) is valid; everything falls back to the sticky-man rig / no icon.

### Dropping in a hero PNG (no TS edit)

1. Author a 32×56 px sheet with the same frame order as the procedural rig (idle → walk → hit → sit [+ strikes]; see `buildHeroFrames` in `stickyManDraw.ts`), matching the equip style you're targeting.
2. Save it as `assets/sprites/hero/{style}.png` — e.g. `assets/sprites/hero/unarmed.png` for the unarmed style, `assets/sprites/hero/sword.png` for the sword style.
3. Run `pnpm dev` (or rebuild) — `BootScene` picks up the PNG automatically via `AssetArtRegistry` + Vite's static glob, no manifest entry or code change required.
4. Delete the file to instantly revert to the procedural sticky-man — no crash, no code change.

If your sheet doesn't follow the procedural frame layout, add a `hero.{style}` manifest entry instead with explicit `frameWidth`/`frameHeight`/`anims` — only the anim keys you declare switch to the real sheet.

### Dropping in a skill/item icon (no TS edit)

Save a 24×24 px PNG at `assets/sprites/skills/{skill.id}.png` or `assets/sprites/items/{item.id}.png`. `pnpm content:validate` warns (does not fail) while the icon is missing.

### Regenerating the manifest (`pnpm art:manifest`)

`pnpm art:manifest` scans `assets/sprites/**/*.png` and rewrites `manifest.json`:

- PNGs sitting directly at the convention path (`hero/{style}.png`, `skills/{id}.png`, `items/{id}.png`) are left out — they're auto-wired without a manifest row.
- PNGs nested in subfolders under `skills/` or `items/` get a manifest row added automatically (their filename alone can't resolve via the direct-file rule).
- Any manifest row whose target PNG no longer exists on disk is pruned, so `manifest.json` never points at a stale file.

It never touches hero `frameWidth`/`frameHeight`/`anims` — add those by hand for a custom hero sheet.

## Hero combat art

| Concern | Implementation |
|---------|----------------|
| Frame | 32×56 px, 2× display |
| Unarmed | 8 strike anims (`hero_strike_jab`, …) — random light + heavy finisher combo |
| Armed | `hero_sticky_attack_1/2/3` with sword / lance / stick prop when weapon equipped |
| Preview | Open `sticky-man-review.html` on the Vite dev server |
| Style spec | [handbook/pixel-art-style.md](../handbook/pixel-art-style.md) |

Sheet rebuilt per map load via `registerHeroCombatAssets(scene, resolveAttackStyle(save))`.

## Enemy tint map (chapters 1–5)

| spriteKey | Visual | Used by |
|-----------|--------|---------|
| `enemy_slime` | Green sticky | slime, wolf, wisp, thug, acolyte, scorpion |
| `enemy_archer` | Tan/brown sticky | archer, moth, guard, bandit archer, water sprite, sand wisp |
| `enemy_totem` | Stone gray sticky | totem, sand spirit, all bosses |

## Boss scale

Bosses use `enemy_totem` sprite key with larger hitbox (see `Enemy.ts` `isBoss`).

## Tilesets

Region maps share the 8-tile `grove` placeholder tileset (`assets/maps/*.json`). Region themes differ by procedural layout seed, not separate PNGs yet.

Regenerate chapter 1–5 maps: `pnpm mvp:ch1-5`  
Regenerate chapter 6–10 maps: `pnpm mvp:ch6-10`

## Chapters 6–10 enemy tint map

| spriteKey | Used by |
|-----------|---------|
| `enemy_slime` | lightning sprite, ice golem, rift spawn, void shade, storm/frost elites |
| `enemy_archer` | storm hawk, frost shade, corrupted cultist, celestial archer, gate sentinel, rift/celestial elites |
| `enemy_totem` | void weaver, all ch6–10 bosses |

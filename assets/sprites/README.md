# Sprite Placeholders (MVP)

Until final pixel art ships, enemies reuse the sticky-man procedural rig with archetype tint colors.

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

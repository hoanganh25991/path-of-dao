# Sprite Placeholders (MVP)

Until final pixel art ships, the **hero** and early **enemies** use the procedural sticky-man rig (`src/combat/art/`).

## Hero combat art

| Concern | Implementation |
|---------|----------------|
| Frame | 32×56 px, 2× display |
| Unarmed | 8 strike anims (`hero_strike_jab`, …) — random light + heavy finisher combo |
| Armed | `hero_sticky_attack_1/2/3` with sword / lance / stick prop when weapon equipped |
| Preview | Open `sticky-man-review.html` on the Vite dev server |
| Style spec | [docs/pixel-art-style.md](../docs/pixel-art-style.md) |

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

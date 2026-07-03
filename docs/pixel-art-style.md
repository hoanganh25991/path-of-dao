# Path of Dao — Sticky-Man Pixel Art Style Guide

> Canonical visual direction for **2D combat** characters and enemies.  
> Implementation: `src/combat/art/` (procedural spritesheets at boot).  
> Linked from [plans/index.md](../plans/index.md) §3.2 Rendering.  
> Review screenshot: [docs/screenshots/sticky-man-review.png](./screenshots/sticky-man-review.png)

---

## 1. Style Pillars

| Pillar | Rule |
|--------|------|
| **Silhouette first** | Chibi head + two-segment limbs; readable at 32×58 px, 2× display |
| **Sticky-man anatomy** | 5px chest + spine; arms ±7px, hips ±5px; 2-segment limbs + Y-fork extremities |
| **Unified skeleton** | All characters share the same rig; slime = jelly overlay, archer = cape, boss = runes |
| **Feet anchor** | Origin `(0.5, 1)` — locomotion bobs from ground |

Distinct from generic stick figures: **joint dots**, **torso block**, **gold sash**, and forked extremities.

---

## 2. Technical Spec

| Property | Hero / Minion | Boss (totem) |
|----------|---------------|--------------|
| Source frame | **32 × 56 px** (all characters — hero, minions, boss) |
| Display scale | **2× uniform** (64 × 116) — no boss upscale |
| Limb segments | upper + lower + fork |
| Upper leg / shin | **12 + 13 px** |
| Upper arm / forearm | 5 + 6 px |
| Hand / foot fork | 3–4 px × 2 sticks |
| Head radius | 4 px |
| Torso height | ~8 px (compact — legs dominate silhouette) |

Spritesheets are generated in `registerStickyManAssets()` (`BootScene`) — no external PNGs required for MVP.

---

## 3. Character Palettes

### Hero (cultivator wanderer)

| Token | Hex | Use |
|-------|-----|-----|
| outline | `#1a1a2e` | Limb stroke |
| skin | `#f0d4a8` | Head, hands |
| fill | `#3d6b4f` | Robe / torso |
| accent | `#c9a227` | Belt, sword |
| highlight | `#ffffff` | Eye |

### Slime minion

| Token | Hex |
|-------|-----|
| outline | `#1a3320` |
| skin / fill | `#7ed957` / `#4a9d4a` |
| accent | `#2d6b2d` |

### Archer minion

| Token | Hex |
|-------|-----|
| outline | `#2a1c3d` |
| skin | `#d4b8f0` |
| fill | `#7a5aa8` |
| accent | `#c9a86a` (bow) |

### Totem boss

| Token | Hex |
|-------|-----|
| outline | `#1a1018` |
| fill | `#5c5c68` |
| accent | `#d94a3a` (crown, aura) |
| highlight | `#ff8a4a` |

Boss variants add **crown** + **aura** props on select idle/attack frames.

---

## 4. Animation Sets

### Hero (`hero_sticky` texture)

| Animation key | Frames | FPS | Notes |
|---------------|--------|-----|-------|
| `hero_sticky_idle` | 4 | 6 | Subtle bob, arms relaxed |
| `hero_sticky_walk` | 6 | 10 | Full leg/arm swing; contact + passing poses |
| `hero_sticky_attack_1` | 4 | 16 | Anticipation → chamber → held impact → recovery |
| `hero_sticky_attack_2` | 3 | 14 | Wide slash |
| `hero_sticky_attack_3` | 4 | 12 | Finisher lean + knockback hitbox |
| `hero_sticky_hit` | 2 | 10 | Knockback lean |

Driven by `PlayerAnimController` from `PlayerStateMachine` states.

### Enemies

| Entity | Idle | Walk | Attack |
|--------|------|------|--------|
| Slime | 4 | 4 | — (melee chaser) |
| Archer | 2 | 4 | 3 (draw + release) |
| Totem boss | 4 | uses idle | 3 (aura pulse) |

Enemy locomotion/attack anims play from `Enemy.update()` via `enemyAnimKeys()`.

---

## 5. Posing Rules

1. **Walk cycle** — opposite arm/leg swing (±25–35° from vertical).
2. **Attack anticipation** — back arm raised 40–55° before front arm snaps forward (−55° to −75°).
3. **Combo finisher (step 3)** — torso lean −6°, front arm full extension; pairs with knockback hitbox.
4. **Hit react** — +6° lean away from facing, arms flail.
5. **Boss idle** — alternate crown and aura prop frames for “living statue” feel.

Pose data lives in `stickyManDraw.ts` as `StickPose` arrays (`POSES_WALK`, `POSES_ATTACK_*`, etc.).

---

## 6. Facing & Flip

- Art is authored **facing right**.
- Phaser `sprite.setFlipX(true)` for left.
- Face dot always on the +X side of the head in source art.

---

## 7. Combat VFX Pairing

| Event | Visual |
|-------|--------|
| Hit | 50 ms white `HitFlash` + pixel sparks + floating damage number |
| Crit | Gold number + `!` + extra sparks |
| Skill cast | Expanding pixel ring + intent-colored sparks |
| Melee arc | Pixel slash arc texture + contact sparks |
| Spirit bolt | Pixel bolt sprite (tinted by intent) |
| Heal | Expanding pixel ring bloom |
| Flame AOE | Pixel flame burst + sparks |
| Void pull | Jagged void-crack texture + purple sparks |
| Telegraph | Enemy red tint (unchanged; works over anims) |

Procedural VFX textures: `src/combat/art/pixelVfxDraw.ts` → `registerPixelVfxAssets()` in BootScene.

---

## 8. File Map

```
src/combat/art/
  stickyManPalette.ts   — colors, frame sizes, pose types
  stickyManDraw.ts      — canvas draw + pose libraries
  stickyManAssets.ts    — Phaser spritesheets + anim registration
  pixelVfxDraw.ts       — pixel skill/AOE/spark textures + registration
src/combat/animations/
  PlayerAnimController.ts
src/combat/textures/
  placeholderTextures.ts — tilemap + VFX only (characters moved to art/)
```

---

## 9. Future Asset Pipeline

When moving off procedural canvas art:

1. Export same frame grid from Aseprite at 32×40 / 48×56.
2. Keep animation keys stable (`hero_sticky_walk`, etc.).
3. Run through `plans/20-content-pipeline.md` validators.
4. Optional: damaged/elite variants per `pixel-character` skill (alternate palette swaps).

---

## 10. Quality Checklist

- [x] Hero sticky-man with idle / walk / 3 attack steps / hit
- [x] Slime, archer, totem boss in matching style
- [x] Limb motion visible during walk and attack
- [x] Skill damages bosses (spirit bolt hitbox)
- [x] Melee arc hits large boss hurtboxes
- [ ] Replace procedural sheets with authored Aseprite exports (post-MVP)

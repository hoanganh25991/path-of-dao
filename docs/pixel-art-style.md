# Path of Dao — Sticky-Man Pixel Art Style Guide

> Canonical visual direction for **2D combat** characters and enemies.  
> Implementation: `src/combat/art/` (procedural spritesheets at boot).  
> Linked from [master-plan.md](./master-plan.md) §3.2 Rendering.

---

## 1. Style Pillars

| Pillar | Rule |
|--------|------|
| **Silhouette first** | Round head + stick limbs; readable at 32×40 px source, 2× display |
| **Sticky-man anatomy** | 3 px limbs, round 8 px head, accent belt, 1 px face dot on facing side |
| **Limited palette** | ≤6 colors per character: outline, skin, fill, accent, highlight |
| **Upper-left light** | Highlights on head/shoulders; outlines always darkest |
| **No pillow shading** | Flat fills + outline; motion sells form, not gradients |
| **Feet anchor** | Origin `(0.5, 1)` — all locomotion bobs from the ground |

The look references classic **stick-figure / sticky-man** flash-game clarity, tuned for mobile ARPG readability.

---

## 2. Technical Spec

| Property | Hero / Minion | Boss (totem) |
|----------|---------------|--------------|
| Source frame | 32 × 40 px | 48 × 56 px |
| Display scale | 2× (64 × 80) | 2.3× (~110 × 129) |
| Limb width | 3 px stroke | 3 px stroke |
| Arm length | 10 px | 12 px |
| Leg length | 11 px | 13 px |
| Head radius | 4 px | 5 px |

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
| `hero_sticky_walk` | 6 | 10 | Full leg/arm swing |
| `hero_sticky_attack_1` | 3 | 14 | Quick jab + sword prop |
| `hero_sticky_attack_2` | 3 | 14 | Wide slash |
| `hero_sticky_attack_3` | 4 | 12 | Finisher lean + knockback hitbox |
| `hero_sticky_hit` | 2 | 10 | Knockback lean |

Driven by `PlayerAnimController` from `PlayerStateMachine` states.

### Enemies

| Entity | Idle | Walk | Attack |
|--------|------|------|--------|
| Slime | 2 | 4 | — (melee chaser) |
| Archer | 2 | 4 | 2 (draw bow) |
| Totem boss | 4 | uses idle | 2 (aura pulse) |

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
| Hit | 50 ms white `HitFlash` + floating damage number |
| Crit | Gold number + `!` suffix |
| Skill bolt | Spirit damage hitbox (cyan bolt texture) |
| Telegraph | Enemy red tint (unchanged; works over anims) |

Skill (**K** / skill button) now spawns a **moving circle hitbox** — pierces minions and damages the totem boss.

Melee arc hitboxes use **circumference sampling** (`arcOverlapsCircle`) so large boss hurtboxes register reliably.

---

## 8. File Map

```
src/combat/art/
  stickyManPalette.ts   — colors, frame sizes, pose types
  stickyManDraw.ts      — canvas draw + pose libraries
  stickyManAssets.ts    — Phaser spritesheets + anim registration
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

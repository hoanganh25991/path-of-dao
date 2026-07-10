# Path of Dao — Sticky-Man Pixel Art Style Guide

> Canonical visual direction for **2D combat** characters and enemies.  
> Implementation: `src/combat/art/` (procedural spritesheets at boot).  
> **Character identity (silhouette, costume, pose):** [character-sheets/](./character-sheets/README.md)  
> **Systems & roster (stages, Intent, power UI):** [plans/29-pixel-art-combat-canon.md](../plans/29-pixel-art-combat-canon.md)  
> Linked from [plans/index.md](../plans/index.md) §3.2 Rendering.  
> Live preview: `sticky-man-review.html` (Vite dev server) · screenshot: [handbook/screenshots/sticky-man-review.png](./screenshots/sticky-man-review.png)

---

## 1. Style Pillars

| Pillar | Rule |
|--------|------|
| **Silhouette first** | Chibi head + two-segment limbs; readable at **32×56 px**, **2×** display |
| **Sticky-man anatomy** | Compact torso block; shoulder/hip spread; upper+lower limbs + **2-segment hand/foot** (wrist→fist, ankle→toe) |
| **Bottom-up rig** | Feet anchor at frame bottom; **17 px fixed leg chain**; torso sits above — no stretched stilts |
| **Unified skeleton (cultivators)** | Hero, disciples, bandits, bosses share the sticky-man rig; differentiate by palette + props |
| **Creature silhouettes (beasts)** | Beasts use `drawCreatureFrame` — blob / quadruped / arachnid / avian / spectral / drake — **never** humanoid limbs |
| **Feet anchor** | Origin `(0.5, 1)` — locomotion bobs from ground |

Distinct from generic stick figures: **joint dots** (shoulder, elbow, knee), **torso block**, **gold sash**, **gold headband**, and **body lean/shift** on attacks. Beasts read as animals/spirits at a glance (wolf ≠ villager).

---

## 2. Technical Spec

| Property | Hero / Minion | Boss (totem) |
|----------|---------------|--------------|
| Source frame | **32 × 56 px** (all characters — hero, minions, boss) |
| Display scale | **2× uniform** (64 × 112) — no boss upscale |
| Limb segments | upper arm + forearm + hand; upper leg + shin + foot |
| Upper leg / shin | **6 + 6 px** (+ 2 px ankle + 3 px foot) |
| Upper arm / forearm | **4 + 5 px** (+ 2 px wrist + 2 px fist) |
| Hand / foot | **2-segment extremities** — not Y-fork |
| Head radius | 4 px |
| Torso height | **11 px** shoulder→hip (~35% of leg chain) |
| Shoulder / hip spread | **4 / 3 px** half-width |

Spritesheets are generated in `registerStickyManAssets()` (BootScene) and rebuilt per map via `registerHeroCombatAssets()` — no external PNGs required for MVP.

---

## 3. Character Palettes

### Hero (cultivator wanderer)

| Token | Hex | Use |
|-------|-----|-----|
| outline | `#0c0c14` | Limb stroke |
| skin | `#ffd5a8` | Head, hands |
| fill | `#b8c4d4` | Robe / torso (slate grey-blue) |
| shadow | `#687888` | Robe shadow side |
| accent | `#d4a840` | Belt, sword |
| highlight | `#fff8e8` | Eye |
| hair | `#f0f4f8` | Top-of-head tint (within head circle only) |
| hairShadow | `#a8b4c4` | Hair shadow side |

### Slime minion

| Token | Hex |
|-------|-----|
| outline | `#0a2010` |
| skin / fill | `#9ef56a` / `#52c452` |
| accent | `#c8ff90` |

### Archer minion

| Token | Hex |
|-------|-----|
| outline | `#18082a` |
| skin | `#e8c8ff` |
| fill | `#6a48a0` |
| accent | `#d4a860` (bow) |

### Totem boss

| Token | Hex |
|-------|-----|
| outline | `#080810` |
| fill | `#686878` |
| accent | `#ff5038` (crown, aura) |
| highlight | `#ffb060` |

Boss variants add **crown** + **aura** props on select idle/attack frames.

### 3.1 Divine Art Intent VFX Palettes

Six **Master Intents** (Ý Cảnh) — Sword, Void, Flame, Lightning, Time, Life — each gets one base
hue family shared by every Divine Art tagged to that Intent (`plans/index.md` §1.2, §7.3;
cultivation-flavored VFX spec §4.3; sub-plan 19). Chosen to stay in the game's existing hue
family while remaining distinguishable from the four character accents above (gold `#d4a840`,
green `#9ef56a`, purple `#6a48a0`, red-orange `#ff5038`) and — deliberately — from the card-art
brand accents (teal `#2dd4a8`, gold `#c9a227`, see `encounter-art` skill), reused below for Life
and Time so combat VFX and UI/story art read as one world.

| Intent | Base | Highlight/glow | VFX read |
|--------|------|-----------------|----------|
| **Sword** (Kiếm) | `#6fd6e8` | `#eafcff` | Cold steel-cyan qi; a thin line cuts the air, edge blooms pale near-white |
| **Void** (Hư) | `#2a1a4a` | `#9a7cff` | Deep indigo-black; space fractures along cracks glowing violet-blue |
| **Flame** (Hỏa) | `#ff7a2e` | `#ffe066` | Hot orange ember core fading to gold-yellow at the flare edge |
| **Lightning** (Lôi) | `#f0e64a` | `#ffffff` | Electric yellow arc that punches to a pure-white flash frame on impact |
| **Time** (Thời) | `#c9a227` | `#fff3c2` | Amber/bronze — **reuses the card-art gold accent**; sepia-toned freeze shimmer |
| **Life** (Sinh) | `#2dd4a8` | `#eafff5` | Teal-jade — **reuses the card-art teal accent**; softer/cooler than slime's grass green |

**Base vs. awakened rule:** the awakened form of a Divine Art never changes hue — it pushes the
*same* base toward its highlight (larger glow radius, higher-saturation core, highlight biased
closer to white/near-white) plus an added screen-level accent (Bloom/Glow FX per plans/index.md
§4.2–4.3). A player should recognize "still Flame, now awakened" at a glance, never "a different
element."

Apply the checklist below to each Intent's VFX the same as any character piece — one rig/light
convention doesn't apply to particles, but **silhouette-first readability** and **≤16 colors per
effect** still do.

---

## 4. Animation Sets

### Hero — locomotion & hit (`hero_sticky` texture)

| Animation key | Frames | FPS | Notes |
|---------------|--------|-----|-------|
| `hero_sticky_idle` | 4 | 6 | Subtle bob; arms hang relaxed (no T-pose) |
| `hero_sticky_walk` | 6 | 10 | Full leg/arm swing; contact + passing poses |
| `hero_sticky_hit` | 2 | 10 | Knockback lean; frame 0 held ~70 ms |

### Hero — unarmed combo (`strikeKind` per step)

Steps 1–2 pick a **random light strike** (jab, cross, front kick, round kick). Step 3 is a **heavy finisher** that cycles haymaker → uppercut → body blow → heavy kick.

| Animation key | Strike | Frames | FPS |
|---------------|--------|--------|-----|
| `hero_strike_jab` | jab | 5 (smoothed) | 14 |
| `hero_strike_cross` | cross | 5 | 14 |
| `hero_strike_front_kick` | frontKick | 7 | 14 |
| `hero_strike_round_kick` | roundKick | 7 | 14 |
| `hero_strike_heavy_haymaker` | heavyHaymaker | 5 | 14 |
| `hero_strike_heavy_uppercut` | heavyUppercut | 7 | 14 |
| `hero_strike_heavy_body` | heavyBody | 7 | 14 |
| `hero_strike_heavy_kick` | heavyKick | 7 | 14 |

Pose keys live in `stickyManStrikes.ts`; `smoothPoseStrip()` inserts eased in-betweens. `PlayerAnimController` plays `STRIKE_ANIM[strikeKind]` when `resolveAttackStyle()` is `unarmed`.

### Hero — armed combo (sword / lance / stick)

When a weapon is equipped, `registerHeroCombatAssets(scene, style)` rebuilds the sheet with the matching prop (`applyWeaponProp`). Same 3-step combo keys:

| Animation key | Frames | FPS | Notes |
|---------------|--------|-----|-------|
| `hero_sticky_attack_1` | 7 (smoothed) | 14 | Anticipation → chamber → held impact |
| `hero_sticky_attack_2` | 7 | 14 | Wide slash / thrust |
| `hero_sticky_attack_3` | 9 | 13 | Finisher lean + knockback hitbox |

Driven by `PlayerAnimController` from `PlayerStateMachine` states. Attack style follows **equipped weapon** (`WeaponProgression.resolveAttackStyle`); Sword Intent skills remain gated by ancient-sword milestone.

### Enemies

| Entity | Idle | Walk | Attack |
|--------|------|------|--------|
| Slime | 4 | 4 | — (melee chaser) |
| Archer | 2 | 4 | 3 (draw + release) |
| Totem boss | 4 | uses idle | 3 (aura pulse) |

Enemy locomotion/attack anims play from `Enemy.update()` via `enemyAnimKeys()`.

---

## 5. Posing Rules

1. **Bottom-up layout** — `resolveBodyLayout()` pins feet at `frameH - 1`; hip/shoulder/head stack above fixed leg lengths.
2. **Walk cycle** — opposite arm/leg swing (±25–35° from vertical); head height near-constant.
3. **Body lean** — `StickPose.lean` + `shiftX` tilt torso toward strike direction; shoulders and hips offset separately.
4. **Attack anticipation** — back arm/torso load away before front arm snaps forward; eased strips via `smoothPoseStrip()`.
5. **Combo finisher (step 3)** — heavy strike variant; longer step duration (~320 ms); pairs with knockback hitbox and impact VFX.
6. **Hit react** — positive lean away from facing, arms flail.
7. **Boss idle** — alternate crown and aura prop frames for “living statue” feel.

Pose data: `stickyManDraw.ts` (`POSES_WALK`, `POSES_ATTACK_*`, `POSES_HIT`) and `stickyManStrikes.ts` (`STRIKE_POSES`).

---

## 6. Facing & Flip

- Art is authored **facing right**.
- Phaser `sprite.setFlipX(true)` for left.
- Face dot always on the +X side of the head in source art.
- During attacks, facing can update from stick input (`Player.ts`).

---

## 7. Combat VFX Pairing

| Event | Visual |
|-------|--------|
| Hit | 50 ms white `HitFlash` + pixel sparks + floating damage number |
| Crit | Gold number + `!` + extra sparks |
| Heavy / kick finisher | Extra impact sparks on contact frame |
| Skill cast | Expanding pixel ring + intent-colored sparks |
| Melee arc | Pixel slash arc texture + contact sparks (armed); punch/kick reach tables when unarmed |
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
  stickyManPalette.ts   — colors, frame sizes, StickPose / SegmentAngles
  stickyManDraw.ts      — canvas draw, proportions, POSES_* , buildHeroFrames()
  stickyManPoseMath.ts  — lerpPose(), smoothPoseStrip() (ease-in-out)
  stickyManStrikes.ts   — STRIKE_ANIM, STRIKE_POSES, pickLight/HeavyStrike
  stickyManAssets.ts    — registerStickyManAssets(), registerHeroCombatAssets()
  stickyManReviewPage.ts — sticky-man-review.html preview grid
  pixelVfxDraw.ts       — pixel skill/AOE/spark textures + registration
src/combat/animations/
  PlayerAnimController.ts
src/progression/
  WeaponProgression.ts  — resolveAttackStyle(), canUseSwordIntent()
src/combat/textures/
  placeholderTextures.ts — tilemap + VFX only (characters in art/)
sticky-man-review.html    — dev preview (unarmed strikes + armed rows)
```

---

## 9. Future Asset Pipeline

When moving off procedural canvas art:

1. Export same frame grid from Aseprite at **32×56**.
2. Keep animation keys stable (`hero_sticky_walk`, `hero_strike_jab`, etc.).
3. Run through `plans/20-content-pipeline.md` validators.
4. Optional: damaged/elite variants per `pixel-character` skill (alternate palette swaps).

---

## 10. Quality Checklist

- [x] Hero sticky-man with idle / walk / unarmed strike set / armed 3-step / hit
- [x] Bottom-up proportions — compact torso, fixed leg chain, connected limbs
- [x] Slime, archer, totem boss in matching style
- [x] Limb motion visible during walk and attack; body lean on strikes
- [x] Weapon prop swaps (sword, lance, stick) when equipped
- [x] Skill damages bosses (spirit bolt hitbox)
- [x] Melee arc hits large boss hurtboxes
- [ ] Replace procedural sheets with authored Aseprite exports (post-MVP)

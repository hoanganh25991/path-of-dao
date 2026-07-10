# Sub-Plan 29: Combat Visual Integration (Fake 2.5D + Hooks)

**Phase:** Cross-cutting — **combat runtime** (not primary art authoring)  
**Estimated effort:** Integration spec + rolling QA (06–09, 19, 25)  
**Depends on:** `handbook/pixel-art-style.md`, `plans/index.md` §3.2  
**Art authoring:** [`plans/design-arts/index.md`](./design-arts/index.md) (plan 32 — **start after `02`**)  
**Blocks:** Ship gate on anim/hitbox/collision correctness — not on first pixel painted

> **Fake 2.5D:** [`fake-2.5d.md`](./fake-2.5d.md) (Phaser 3.60+) · Master: [index.md](./index.md) §3.2 · [handbook/pixel-art-style.md](../handbook/pixel-art-style.md)  
> **Design:** [`design-arts/`](./design-arts/index.md) · **Silhouettes:** [handbook/character-sheets/](../handbook/character-sheets/README.md)  
> **This plan** = **how art plays in combat** — Fake 2.5D depth, camera, juice tiers, animation keys,
> hit-frame alignment, hitboxes, collision, wheel HUD consumption. Roster pixel tables moved to
> **design-arts**; sections §4–§10 below are **integration reference** (IDs + hooks), not the art brief.

---

## Plan split (design vs integration)

| Question | Read |
|----------|------|
| What should the hero / boss / icon **look** like? | [`design-arts/`](./design-arts/index.md) + handbook character sheets |
| When can art start? | **Immediately after plan `02`** — parallel with all code tracks |
| How does PNG land in the game? | [`design-arts/08-auto-wire-pipeline.md`](./design-arts/08-auto-wire-pipeline.md) |
| What anim keys / hit frames / collision? | **This plan** §0.1, §2, §3 + plans `07`, `09`, `19` |
| Power UI L/M/S roster IDs? | §9 tables (content IDs); **pixels** in `design-arts/wheel-icons.md` + `vfx-spritesheets.md` |

---

## 0. Ship gate — sprites, not placeholders

Combat must **never** ship with colored-rectangle “characters.” The following are **banned in
player-visible builds** (dev-only behind explicit flags):

| Anti-pattern | Why it fails | Correct approach |
|--------------|--------------|------------------|
| Solid `fillRect` textures for `player` / `enemy_*` | Reads as debug UI, not a cultivator | Procedural **32×56 sticky-man** sheets via `registerStickyManAssets()` |
| `setTint()` to imply state (idle/walk/attack colors) | Destroys palette ramps; looks like a highlighter | `sprite.play(animKey)` from `PlayerAnimController` |
| Phaser Arcade `physics.debug` on by default | Magenta/pink body boxes over art | `VITE_COMBAT_PHYSICS_DEBUG=true` only when tuning hitboxes |
| Floating state labels (`"idle"`, combo digits) on hero | Breaks immersion | `VITE_COMBAT_ANIM_DEBUG=true` only |

### 0.1 Animation contract (required keys)

All humanoids share feet anchor `setOrigin(0.5, 1)` and the frame grid in
`handbook/pixel-art-style.md` §4.

**Hero (`player` texture)**

| Key | Frames | FPS | When |
|-----|--------|-----|------|
| `hero_sticky_idle` | 4 | 6 | standing |
| `hero_sticky_gather` | 2–4 | 4 | **Gather Qi** — Buddha / lotus meditation sit |
| `hero_sticky_walk` | 6 | 10 | move, dash (alpha 0.65) |
| `hero_sticky_hit` | 2 | 10 | hitstun (once) |
| `hero_sticky_attack_1..3` | 5–9 | 14 | armed combo steps (sword) |
| `hero_strike_combo_1..3` | 5–7 | 14 | unarmed combo steps |

**Enemies (`enemy_slime`, `enemy_archer`, `enemy_totem`)**

| Key suffix | Frames | FPS | When |
|------------|--------|-----|------|
| `{slime\|archer\|totem}_idle` | 2–4 | 6 | stationary |
| `{…}_walk` | 4 | 10 | velocity > 8 px/s |
| `{…}_attack` | 3 | 12 | telegraph → strike (once) |

Telegraph **may** add a brief red `setTint(0xff6666)` overlay — must `clearTint()` after the
attack anim; tint is not a substitute for pose change.

### 0.2 Acceptance (visual QA)

Before marking combat art done on a track:

1. Hero shows **head, limbs, sash** at 2× zoom — not a monochromatic square.
2. Walk cycle: visible leg/arm swing for ≥4 frames.
3. Attack: anticipation frame before hitbox frame (see `CombatComponent.hitFrameMs`).
4. No magenta physics boxes in normal dev (`pnpm dev`) without the debug flag.
5. Echoes ancients use **aura ring + sword sheet rebuild**, not full-body tint wash.

---

## 1. Design Goals

| Goal | Rule |
|------|------|
| Readable at 390×844 | Silhouette first; one accent hue per entity; no micro-detail |
| Cohesive world | Same sticky-man rig for hero, cultivators, bosses; beasts use jelly/bug overlays |
| Cultivation fantasy | Arts read as **qi techniques**, not generic RPG spells — thin lines, fractures, tribulation |
| Power communicated visually | Every Divine Art has **L / M / S** pixel UI + in-world VFX tier |
| Fake 2.5D depth without 3D combat | Phaser 3.60+ — y-sort, **layered props**, sprite shadows, optional Light2D ([`fake-2.5d.md`](./fake-2.5d.md)) |
| Echoes = showroom | Ancients + v5 arts may briefly use **Showcase** tier (§3.3) |

---

## 2. Fake 2.5D Canon (Phaser 3.60+)

> **Full spec:** [`fake-2.5d.md`](./fake-2.5d.md) — visual style, depth, layered assets, Light2D,
> shadows, environment, camera, performance, prohibitions. Combat never uses a 3D engine.

### 2.1 Depth stack (back → front)

| Layer | Z / depth | Rule |
|-------|-----------|------|
| Parallax far | `-30` … `-10` | 2–3 full-map rects; scroll factor 0.15 / 0.30 / 0.45 |
| Ground tiles | `0`–`2` | Tiled layers: ground, decoration, foreground |
| Drop shadows | `ownerY - 4` | Ellipse under unit; **does not** y-sort with body |
| Units | `worldY` (`baseY`) | Player, enemies — `DepthSort.apply(sprite)` every move frame |
| Layered prop walls / trunk | `baseY` | Sort with units — walk behind when south |
| Layered prop roof / canopy | `baseY + 1` | Occludes units walking south of structure |
| Projectiles / VFX | `worldY` or `worldY + 1` | Slightly in front of caster feet at same Y |
| Foreground trim | `2` | Tree trunks, gate posts — can occlude units when south of them |
| HUD | DOM / fixed Phaser depth `30_000+` | HTML combat HUD + Phaser status bars |

### 2.2 Ground shadow spec (`GroundShadow.ts`)

| Property | Hero / cultivator | Boss / ancient |
|----------|-------------------|----------------|
| Shape | Soft ellipse | Same ellipse + optional outer ring |
| Size | 28×10 px source → 2× display | 36×12 px |
| Alpha | 0.28 | 0.35 (phase 2: 0.45) |
| Offset Y | +2 px below feet anchor | +2 px |
| Tint | `#000000` | Boss intent accent at 15% mixed into black |

Shadow **tracks x/y only** — never scales with jump/dash height (dash uses afterimage, not shadow lift).

### 2.3 Y-sort rules

1. **Feet anchor** — all units `setOrigin(0.5, 1)`; depth key = `Math.floor(sprite.y)` (`depth = baseY`).
2. **Layered props** — walls/trunk at `baseY`; roof/canopy at `baseY + 1` ([`fake-2.5d.md`](./fake-2.5d.md) §5).
3. **Occlusion** — player must walk behind buildings and trees when south of base Y; in front when north.
4. **Tall tile props** — cliff/gate posts at fixed row depth where not using `LayeredProp`.
5. **Projectiles** — inherit caster depth + 1 while alive; on impact, burst at impact Y.
6. **AOE telegraphs** — drawn at ground depth `Math.floor(centerY) - 1` so it sits under feet but above tiles.

### 2.3.1 Lighting (integration)

- `Light2DManager` — ambient + shrine/POI point lights when quality ≥ medium
- Optional **normal maps** on structure atlases — better light response, not required for ship
- Shadow **skew** toward light when Light2D on ([`fake-2.5d.md`](./fake-2.5d.md) §7.2)

### 2.4 Camera & pixel-perfect

- `pixelArt: true`, `roundPixels: true`, **integer zoom only** (`computeIntegerZoom`).
- Letterbox unused viewport — never fractional scale (Android DPR shimmer).
- **Texture atlases** for characters + VFX — target ≤ 8 draw calls for combat scene baseline.

### 2.5 Parallax, environment & map landmarks

Each region tileset gets a **parallax tint triplet** (far / mid / near) from `environment.parallaxTint` in map JSON — documented per map in plans `21`/`22` and [`map-design-canon.md`](./map-design-canon.md) §3. Furthest layer may use **1.02× scale** static tilt for HD-2D read — no perspective camera.

**Per-map uniqueness:** `weather` particle overlay (ash, fog, snow, void motes) + `groundAccent` decals — no two sibling maps share the same `uniqueness[]` tags.

**Signature big tree (DA-09):** `LayeredProp` — trunk at `baseY`, canopy at `baseY + 1`, trunk shadow blob ([`fake-2.5d.md`](./fake-2.5d.md) §5.2). **Structures** use multi-layer stacks (walls + roof + shadow) with **visible side faces** — not flat tiles.

### 2.6 Combat camera — zoom in / zoom out (UX canon)

Combat readability comes from **framing**, not a wider FOV. The camera **pulls in** when the
player commits to offense so attacks, hitboxes, and Divine Art VFX read clearly on a phone; it
**pulls back out** when exploration resumes so map navigation and threat awareness return.

> **Implementation:** `src/combat/render/CombatCameraController.ts` (owned by sub-plan 06, driven
> by player state in 07 and skill events in 19). Shake/hit-stop coupling: [`plans/25-audio-vfx-polish.md`](./25-audio-vfx-polish.md) §5.

#### 2.6.1 Zoom states

| State | When | Zoom | Deadzone | Follow lerp |
|-------|------|------|----------|-------------|
| **Explore** | Default — moving, idle, Gather Qi, between fights | `baseZoom` = `computeIntegerZoom()` | 80×80 px | 0.08 / 0.08 |
| **Engage** | Attack wind-up, combo, Divine Art cast, boss telegraph on player | `engageZoom` = `min(baseZoom + 1, maxFitZoom)` | 48×48 px | 0.14 / 0.14 |
| **Dramatic** | Combo step 3, **S**-tier art, Showcase tier, boss phase ult | Same as Engage + **tighter** deadzone 32×32 | 32×32 px | 0.18 / 0.18 |

**Integer zoom rule:** `engageZoom` is always a **whole number** ≥ `baseZoom`. Never lerp to
fractional zoom values (pixel shimmer). If the viewport cannot fit `baseZoom + 1`, keep
`baseZoom` and achieve "zoom in" by **deadzone shrink + follow tighten** only.

**Transition timing**

| Edge | Duration | Easing | Notes |
|------|----------|--------|-------|
| Explore → Engage | 220–280 ms | ease-out cubic | Starts on attack button / cast confirm |
| Engage → Dramatic | 120–180 ms | ease-out | Step-3 finisher or `powerUi: 'S'` cast |
| Engage/Dramatic → Explore | 320–420 ms | ease-in-out | Slightly slower out — feels less jarring |
| Dash during Engage | Hold Engage zoom | — | Dash is offensive; don't zoom out mid-dodge |

Use Phaser `cam.zoom` tween or per-frame lerp snapped with `Math.round` each frame.

#### 2.6.2 Enter Engage (zoom in triggers)

| Trigger | Source | Engage level |
|---------|--------|--------------|
| Basic attack step 1–2 | `PlayerStateMachine` → `attack` | Engage |
| Basic attack step 3 (finisher) | combo step 3 | Dramatic |
| Divine Art cast | `ArtExecutor` + `powerUi` from content | L→Engage, M→Engage, S→Dramatic |
| Enemy hit connects on player | `combat:hit` defender=player | Brief Engage pulse (200 ms) optional |
| Boss telegraph targeting player | `BossPhaseController` | Engage until telegraph resolves |
| Echoes Showcase art | sub-plan 27 god-mode | Dramatic + postFX (§3.2) |

**Framing anchor:** camera follow target stays the **player feet** (`sprite` origin 0.5, 1). On
Engage, bias scroll so ~60% of the deadzone shows space **ahead of facing** (strike direction) —
not centered on the hero's head.

#### 2.6.3 Exit Engage (auto zoom out triggers)

Return to **Explore** when **all** are true for **≥ 350 ms**:

1. Player state is `idle` or `move` (not `attack`, `dash`, `hitstun`, `gatherQi` channel start).
2. No player-owned active hitboxes (`HitboxManager` team `player`).
3. No Divine Art cast in `castTimeMs` + 200 ms tail.
4. Move stick magnitude **or** sustained locomotion velocity > 24 px/s (re-engage exploration).

**Immediate zoom out** (skip hold): map edge transition, `map:wave-cleared`, manual pause, scene
switch.

**Gather Qi:** stay at **Explore** zoom (vulnerable, needs peripheral vision) — only deadzone
stays wide; no Engage on channel; **qi air-flow VFX** around Buddha sit pose (§2.7).

#### 2.6.4 Screen shake — coupled to power

Shake is **camera offset only** (`cam.shake`) — never scales sprites. Amplitude scales with
**impact power**, independent of zoom state (shake stacks on top of Engage framing).

| Shake tier | Trigger examples | Intensity (`cam.shake` 2nd arg) | Duration |
|------------|------------------|----------------------------------|----------|
| **Micro** | Light attack hit, L-tier art impact | 0.002 | 60 ms |
| **Light** | Combo step 2, M-tier art | 0.004 | 90 ms |
| **Medium** | Combo step 3, crit, boss phase hit | 0.006 | 120 ms |
| **Heavy** | S-tier art, awakened finisher, Showcase | 0.010 | 180 ms |
| **Boss** | Boss ult landing, map rumble event | 0.012 | 200 ms |

Pair shake with **hit-stop** per §3.1: Heavy/Boss shake always includes ≥ 60 ms hit-stop;
Micro may skip hit-stop on fodder enemies.

`JuiceKit.screenShake(scene, tier)` maps tiers → values. **Quality low** (`plans/26`): cap at
Light tier, disable Dramatic zoom step.

#### 2.6.5 Event bus contract

```typescript
// Emitted by Player / ArtExecutor / BossPhaseController
EventBus.emit('combat:camera', {
  intent: 'engage' | 'dramatic' | 'explore' | 'shake',
  shakeTier?: 'micro' | 'light' | 'medium' | 'heavy' | 'boss',
  source?: 'attack' | 'skill' | 'boss' | 'crit',
});
```

`CombatCameraController` subscribes in `MapScene.create()` and unsubscribes on shutdown.

#### 2.6.6 Acceptance (camera UX)

- [ ] Walking the map: **Explore** zoom — player sees nearby enemies and terrain.
- [ ] Tap attack: camera **zooms in** before hitbox frame; limbs readable at 2×.
- [ ] Release move stick after combo: camera **zooms out** within ~500 ms.
- [ ] S-tier Divine Art: visible **shake** + Dramatic framing; does not induce motion sickness on 390×844.
- [ ] Integer zoom at every frame during tween (no fractional shimmer).
- [ ] Low quality profile: no Dramatic zoom step; shake capped at Light.

### 2.7 Gather Qi — Buddha sit & qi air-flow

| Element | Spec |
|---------|------|
| **Pose** | `hero_sticky_gather` — cross-legged **Buddha / lotus meditation sit**; feet anchor `0.5, 1` |
| **Regen** | **3×** base HP + mana by level while channeling (plan `04` §7.1, `07` §7.1) |
| **Qi flow VFX** | 6–12 particles/s, teal `#2dd4a8` + gold `#c9a227`, arcing **inward** to chest |
| **Read** | *Drawing qi from the air* — cultivation tone, not generic heal sparkle |
| **On hit** | VFX stops; player → `hitstun` → **`idle`** (channel ends) |
| **Passive** | Idle / slow walk = **1×** regen, **no** qi-flow VFX |
| **Impl** | `QiFlowVFX.ts` · SFX `player.gather_qi_loop` (plan `25`) |

---

## 3. VFX & Juice Tiers (Visual)

Canonical juice kit + tiers: [`vfx-juice-tiers.md`](./vfx-juice-tiers.md).

### 3.1 Free juice kit (always on)

| Effect | Timing | Pixel read |
|--------|--------|------------|
| Hit-stop | 40–120 ms on heavy connect | Freeze anim frame; white flash on target |
| Screen shake | 3–6 px, 80–120 ms decay | Camera offset only — tier table in **§2.6.4** |
| Hit flash | 2–3 frames `#ffffff` tint | On hurtbox target sprite |
| Damage numbers | Floating, intent-neutral white; crit = gold + `!` | 8×10 bitmap font |
| Telegraph | 300–800 ms before boss/AOE | Flat ground sprite, 40% opacity, intent hue |

### 3.2 VFX engine tiers

| Tier | Used by | Pixel / Phaser budget |
|------|---------|------------------------|
| **Common** | Most Divine Arts (v1–v2, basics) | Spritesheet 4–8 frames + 1 pooled burst ≤ 12 particles; **no shaders** |
| **Signature** | v3–v4, awakened signatures, boss phase skills | + object Glow/Displacement + telegraph ring + 16–24 particles |
| **Showcase** | Echoes god-mode, v5 arts, finale boss ults | **One** camera postFX pass (Bloom + ColorMatrix + Vignette) + large AOE sprite + strong shake |

### 3.3 Power UI ladder (L / M / S)

Every Divine Art maps to a **power UI** level for wheel icons, cast flash, and AOE read —
independent of VFX engine tier but usually correlated.

| UI level | Wheel icon | Cast flash | AOE / hit read | Typical content |
|----------|------------|------------|----------------|-----------------|
| **L — Low** | 16×16 px, flat fill + 1px outline | 4-frame ring, radius ≤ 24 px | Single target or arc ≤ 48 px | Basics, meditate, v1 variants |
| **M — Medium** | 20×20 px, intent rim glow + 2px inner icon | 6-frame burst + ground telegraph ≤ 80 px | Cone/circle 64–96 px | Signatures, v2–v3, awakened base |
| **S — Super** | 24×24 px, animated rim + corner runes | 8-frame + screen-edge tint 5% | Circle 112–160 px or full-width beam | v4–v5, awakened finishers, Echoes |

**Awakened rule:** same hue family as base; UI level **+1** (L→M, M→S) with brighter highlight
and denser particle count — never a new element color.

---

## 4. Hero — Cultivator Wanderer

> **Authoring:** [`design-arts/hero.md`](./design-arts/hero.md) (DA-01) · **Character sheet:** [handbook/character-sheets/hero.md](../handbook/character-sheets/hero.md)  
> **Integration:** `PlayerAnimController`, `attackStyle`, `CombatComponent.hitFrameMs`

One rig (`hero_sticky`); visual story = **mortal → sword bearer → realm ascendant**.

### 4.1 Growth stages (weapon & palette)

| Stage | Trigger | Silhouette | Palette shift | Combat read |
|-------|---------|------------|---------------|-------------|
| **0 — Mortal** | `weaponMilestone: none`, ch1 | Bare hands, no blade prop | Default robe `#b8c4d4`, gold sash dim | Unarmed strikes only; no slash arc |
| **1 — Awakened qi** | First void/life art unlocked | Same body; faint jade eye dot | +10% saturation on sash | Small intent sparks on cast |
| **2 — Ancient sword** | `weaponMilestone: ancient_sword` | Sword prop on hip + attack arcs | Gold sash bright `#d4a840`; robe highlight cool | Armed combo; Sword Intent enabled |
| **3 — Tempered** | ch3+ gear | Optional iron sword mesh (sidegrade) | Sash + belt runes 1px | Slightly wider arc VFX |
| **4 — High realm** | `realm.order ≥ 5` | Floating 1px aura ring at feet (Fake 2.5D) | Robe shadow → intent of **dominant Intent** at 20% | Aura ring color = dominant Intent base |
| **5 — True Dao** | `realm.id === true_dao` | Twin ring + crown glyph 8×8 on head | Gold-white trim on robe edges | Showcase-ready silhouette |

### 4.2 Hero animation priorities

Locomotion > attack read > hit react. Finisher step 3 always gets **+1 juice** (hit-stop top of band).

### 4.3 Fake 2.5D hero specifics

- Shadow scales **never** shrink during dash — afterimage ghosts carry motion.
- Dominant Intent tint applies to **aura ring only**, not full-body recolor (keeps silhouette).

---

## 5. Map Cultivators & Minions

> **Authoring:** [`design-arts/enemies-minions.md`](./design-arts/enemies-minions.md) (DA-02) · **Character sheets:** [handbook/character-sheets/faction-families.md](../handbook/character-sheets/faction-families.md)

All humanoid foes use the **same 32×56 sticky-man rig** with region + faction overlays.
Beasts (slime, wolf, scorpion) use **blob/quadruped** overlays on the same feet anchor.

### 5.1 Faction families

| Family | Examples | Silhouette hook | Accent hue | Notes |
|--------|----------|-----------------|------------|-------|
| **Beast** | slime, wolf, scorpion, hawk | Low wide or tall ears | Region tint | No robe; jelly or fur fill |
| **Disciple** | Heng Yue disciple, cultist | Headband or sect sash | Jade or crimson | ch1–4 |
| **Bandit** | thug, archer, lord's adds | Mask or bandana | Rust `#a05828` | ch3 |
| **Spirit** | wisp, moth, fox | Floating `-2px` bob | Pale spectral | Alpha 0.9 max |
| **Guard / patrol** | Zhao guard, gate sentinel | Shoulder pauldron 2px | Steel `#8899aa` | ch3, ch9 |
| **Elemental** | sand spirit, lightning sprite | Core gem in chest | Region element | ch5–6 |
| **Corrupted** | rift spawn, void shade | Crack overlay on torso | Void purple-black | ch8–10 |

### 5.2 Regional cultivator palette (map accent)

Apply as **robe fill + accent** swap on the shared rig — not new anatomy.

| Chapter / region | Map accent | Cultivator fill | Cultivator accent | Beast accent |
|------------------|------------|-----------------|-------------------|--------------|
| 1 Fallen Village | Ash jade | `#8a9a88` | `#c4a840` jade gate | Slime green |
| 2 Mist Forest | Fog lavender | `#6a5888` | `#9ad4e8` | Moth violet |
| 3 Stone Canyon | Dust ochre | `#8a7050` | `#c87840` | Wolf grey |
| 4 Moon Lake | Seal teal | `#3a6878` | `#c94040` vermillion | Water cyan |
| 5 Burning Desert | Ember orange | `#8a5030` | `#ff6020` | Sand gold |
| 6 Thunder Peaks | Storm yellow | `#585878` | `#e8d040` | Lightning white |
| 7 Frozen Palace | Ice blue | `#88a8c8` | `#d0e8ff` | Frost white |
| 8 Abyss Rift | Void purple | `#3a2858` | `#9a60ff` | Corruption red |
| 9 Heavenly Gate | Celestial gold | `#c8b878` | `#fff0a0` | Archer white |
| 10 Void Throne | Throne white-black | `#484858` | `#e8e0ff` | Void black |

### 5.3 Minion telegraph

Ranged kiters: **draw bow / charge** 2-frame wind-up with intent-neutral red tint on enemy body.
Melee: short forward lean — no ground telegraph (player learns dodge timing).

---

## 6. Bosses — Ordeal Cultivators (Impressive)

> **Authoring:** [`design-arts/bosses-cultivators.md`](./design-arts/bosses-cultivators.md) (DA-03) · **Character sheet:** [handbook/character-sheets/bosses.md](../handbook/character-sheets/bosses.md)

> **Character sheets:** [handbook/character-sheets/bosses.md](../handbook/character-sheets/bosses.md)

Eight ordeal bosses are **named cultivators**, not monsters. They must read **bigger than life**
while staying on the **same 32×56 frame** — impress via **props, aura, telegraph scale, and phase
swap**, not larger resolution.

### 6.1 Boss visual rules

| Rule | Spec |
|------|------|
| Frame | **32×56** — same as hero; 2× display |
| Impress factor | Crown/halo/wings **props** extend up to 8 px above head box |
| Intent accent | Each boss maps to one Master Intent hue (§7) for telegraphs + phase aura |
| Phase 1 | Slower idle; telegraph 600 ms; ground AOE sprite at 40% opacity |
| Phase 2 (<50% HP) | Prop swap (cracked crown, ignited aura); telegraph 400 ms; +25% particle count |
| Shadow | 36×12 ellipse; phase 2 alpha 0.45 |
| Defeat (beast) | 12-frame dissolve to pixels + intent burst — **beasts only** |
| Defeat (cultivator) | Stagger → walk to origin → **gather-qi sit** + qi-flow — **no dissolve** ([`combat-defeat-canon.md`](./combat-defeat-canon.md)) |

### 6.2 Boss roster — pixel identity

| Boss ID | Cultivator | Intent accent | Silhouette hook | Phase 2 visual |
|---------|------------|---------------|-----------------|----------------|
| `boss.jade_guardian` | Tu Sen | Life jade | Stone shoulder pads + jade seal on chest | Seal cracks; green pulse ring |
| `boss.mist_stalker` | Liu Mei | Void + ice | Long sash trails, ice shard prop on hand | Sash freezes; void crack under feet |
| `boss.bandit_lord` | Hong Die | Sword + spirit | Butterfly wing cape 6×8 px | Wings spread; faster dash afterimages |
| `boss.seal_warden` | Vermillion Bird Heir | Flame | Bird crest headpiece | Crest ignites; floor fire telegraph |
| `boss.desert_sovereign` | Flame Thunder Lord | Flame + Lightning | Twin orb props (fire + bolt) | Orbs merge; heat shimmer distortion |
| `boss.thunder_avatar` | Heaven Fate (I) | Lightning | Fate rune halo 12×12 | Halo spins; bolt telegraphs chain |
| `boss.frost_queen` | Wang Yue | Void | Moon tiara + pale robe | Tiara glows; memory freeze zones (amber Time rim) |
| `boss.rift_horror` | Heaven Fate (heart demon) | Void | Mirror shard mask | Spawns add silhouettes at 50% alpha |
| `boss.celestial_guardian` | Vermillion Bird (gate) | Flame | Gate spear 2× height prop | Spear flame trail |
| `boss.void_sovereign` | Heaven Fate (throne) | Void + Showcase | Throne cape + void crown | **Showcase** postFX; screen vignette |

---

## 7. Ancients — Echoes Showcase

> **Authoring:** [`design-arts/ancient-echoes.md`](./design-arts/ancient-echoes.md) (DA-06) · Echoes flow: plan `27`

> **Character sheets:** [handbook/character-sheets/ancients.md](../handbook/character-sheets/ancients.md)

Seven ancients (`content/demo/ancients.json`) use `visualTheme` for combat tint + aura.
They are **tier above** normal hero — always **S** power UI on all equipped arts in Echoes.

### 7.1 Theme palettes (combat)

| Theme | Ancient(s) | Body tint | Aura | Weapon read | Must-not |
|-------|------------|-----------|------|-------------|----------|
| `jade` | breakthrough_sage | `#3ecf8e` | `#1f7a4f` | Wooden staff prop | Confuse with Life heal green |
| `insight` | insight_seeker | `#7ec8ff` | `#3a7ab8` | Open palm + intent orbs | — |
| `sword` | sword_ancestor | `#c9d4ff` | `#8899cc` | Long cyan blade | — |
| `flame` | flame_sovereign | `#ff6b35` | `#cc3300` | Flame-wrapped blade | — |
| `fortune` | fortune_emissary | `#2dd4a8` | `#1a6b55` | Spirit fox pet sprite | Card-art teal reuse OK |
| `void` | void_walker | `#9b6bff` | `#5a2d9e` | Void fracture blade | — |
| `heaven` | heaven_trampler | `#fff4d6` | `#ffe08a` **overexpose** | White-gold blade + halo | **Never** reuse void purple |

### 7.2 Heaven-trampler rule

`heaven` is **visually above** all other themes: 1-frame white flash on idle loop every 4 s,
Showcase postFX allowed in Echoes, particle count ×1.5 vs void_walker — reads as "past the ceiling."

### 7.3 Ancient combat chrome

- `AncientEchoBanner` (HTML) + gold ∞ status bar (sub-plan 27).
- Name/epithet never drawn on sprite — banner only (keeps pixel body clean).

---

## 8. Master Intents — Visual Language

Six player-facing Intents map from content `intent` ids:

| Display Intent | Content `intent` id | Base | Highlight | Shape language |
|----------------|---------------------|------|-----------|----------------|
| **Sword** | `sword` | `#6fd6e8` | `#eafcff` | Thin crescent arcs; horizontal cuts; displacement along slash |
| **Void** | `truth_falsehood` | `#2a1a4a` | `#9a7cff` | Jagged cracks; inward pull lines; desaturate victims 2 frames |
| **Flame** | `flame` | `#ff7a2e` | `#ffe066` | Upward chevron bursts; ember particles rise |
| **Lightning** | `lightning` | `#f0e64a` | `#ffffff` | Vertical zig-zag; 1-frame full white flash on impact |
| **Time** | `cause_effect` | `#c9a227` | `#fff3c2` | Clockwise ripple rings; sepia freeze overlay on targets |
| **Life** | `life_death` | `#2dd4a8` | `#eafff5` | Soft circles; upward leaf-spark pixels; never cross slime green |

Full hex table: [handbook/pixel-art-style.md §3.1](../handbook/pixel-art-style.md).

### 8.1 Per-Intent AOE grammar

| Intent | Telegraph | AOE sprite | Impact |
|--------|-----------|------------|--------|
| Sword | Thin line on ground | Crescent sweep 90° | Sparks along cut line |
| Void | Purple crack polygon | Pull field vortex | Shatter overlay on exit |
| Flame | Orange circle fill 30% | Rising burst column | Ember scatter |
| Lightning | Yellow dot → bolt path | Vertical beam 16×N px | White flash + shake |
| Time | Amber ring expand slow | Stasis bubble on target | Sepia tint 300 ms |
| Life | Teal pulse from caster | Green ring heal | Bloom outward once |

---

## 9. Divine Arts — Per-Art Pixel Spec (40)

**Legend:** UI = L/M/S · VFX tier = C/Sg/Sh · Kind = bolt/melee/aoe/buff/pull/freeze/heal

### 9.1 Signatures (12) — base + awakened

| ID | UI | VFX | Kind | AOE / range | Uniqueness |
|----|----|-----|------|-------------|------------|
| `skill.basic.meditate` | L | C | buff | Self 24 px | Cross-legged pose overlay 4 frames |
| `skill.basic_bolt` | L | C | bolt | 64 px line | Generic qi dart — grey-white |
| `skill.sword.slash` | M | Sg | melee | Arc 72 px | First sword qi — cold cyan line |
| `skill.sword.slash.awakened` | S | Sg | melee | Arc 96 px + wave | Second arc delayed 80 ms |
| `skill.void.slash` | M | Sg | bolt | 80 px fracture | Void crack trail behind bolt |
| `skill.void.slash.awakened` | S | Sg | pull+aoe | 96 px | Pull then detonate crack |
| `skill.flame.bolt` | M | C | bolt | 72 px | Single fire core |
| `skill.flame.bolt.awakened` | S | Sg | aoe | 112 px twin burst | Two cores orbit before detonate |
| `skill.lightning.strike` | M | Sg | bolt | 64 px vertical | Sky-to-ground bolt |
| `skill.lightning.strike.awakened` | S | Sg | aoe | 96 px fork | Splits to 2 bolts at 60° |
| `skill.time.slow` | M | C | freeze | 80 px zone | Amber ripple slow field |
| `skill.time.slow.awakened` | S | Sg | freeze | 112 px | Stasis bubble + clock ticks |
| `skill.life.mend` | M | C | heal | 64 px ring | Teal bloom inward |
| `skill.life.mend.awakened` | S | Sg | heal | 96 px | Double ring + leaf sparks |

### 9.2 Sword variants (`sword` intent)

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.sword.crescent.v1` | L | C | melee | 56 px narrow | Tight crescent — entry sword art |
| `skill.sword.cleave.v2` | M | C | melee | 80 px wide | Wide horizontal cleave |
| `skill.sword.rain.v3` | M | Sg | aoe | 96 px 3-hit | Three staggered arcs 120 ms apart |
| `skill.sword.burst.v4` | S | Sg | melee | 88 px | Single heavy chop + shock ring |
| `skill.sword.heaven.v5` | S | Sh | aoe | 144 px | Screen-edge cyan flash; Echoes tier |

### 9.3 Void variants (`truth_falsehood` → Void)

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.void.rift.v1` | L | C | bolt | 64 px | Small rift opening |
| `skill.void.tear.v2` | M | C | melee | 72 px | Tear line jagged |
| `skill.void.surge.v3` | M | Sg | bolt | 96 px | Wide fracture wave |
| `skill.void.nova.v4` | S | Sg | aoe | 112 px | Implode then burst |
| `skill.void.abyss.v5` | S | Sh | pull+bolt | 128 px | Strong pull + abyss core (Echoes) |

### 9.4 Flame variants

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.flame.scorch.v1` | L | C | bolt | 64 px | Fast ember dart |
| `skill.flame.ember.v2` | M | C | bolt | 80 px | Lance shape trail |
| `skill.flame.pillar.v3` | M | Sg | aoe | 48×96 px column | Stationary flame pillar |
| `skill.flame.lotus.v4` | S | Sg | aoe | 104 px | Lotus petal burst 8 directions |
| *(v5 flame)* | — | — | — | — | Reserved; use `flame.bolt.awakened` as cap |

### 9.5 Lightning variants

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.lightning.fork.v1` | L | C | bolt | 72 px Y-fork | Two-prong at end |
| `skill.lightning.arc.v2` | M | C | melee | 80 px arc | Melee zig-zag slash |
| `skill.lightning.storm.v3` | M | Sg | aoe | 96 px chain | Bounces to 2 targets |
| `skill.lightning.judgment.v4` | S | Sg | bolt | 112 px pillar | Thick judgment column |
| `skill.lightning.tribulation.v5` | S | Sh | aoe | 160 px | Tribulation field + vignette |

### 9.6 Time variants (`cause_effect` → Time)

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.time.halt.v1` | L | C | freeze | 56 px | Single target pause sparks |
| `skill.time.drift.v2` | M | C | buff | Self | Afterimage trail extends 200 ms |
| `skill.time.loop.v3` | M | Sg | aoe | 88 px | Rewind ripple visual (damage still real-time) |
| `skill.time.stasis.v4` | S | Sg | freeze | 112 px | Bubble cage hex outline |
| `skill.time.echo.v5` | S | Sh | aoe | 128 px | Echo ghost replay of last art cast |

### 9.7 Life variants (`life_death` → Life)

| ID | UI | VFX | Kind | AOE | Uniqueness |
|----|----|-----|------|-----|------------|
| `skill.life.bloom.v1` | L | C | heal | 56 px | Small flower burst |
| `skill.life.pulse.v2` | M | C | heal | 72 px | Double pulse ring |
| `skill.life.surge.v3` | M | Sg | heal | 96 px | Wave heal + cleanse tint |
| `skill.life.spirit.v4` | S | Sg | buff | Self + 64 px | Spirit orb orbits caster |
| *(v5 life)* | — | — | — | — | Reserved; `life.mend.awakened` cap |

### 9.8 Wheel icon authoring

> **Pixels:** [`design-arts/wheel-icons.md`](./design-arts/wheel-icons.md) (DA-04) · **HUD integration:** plan `30` §5

- Store 24×24 source icons in `assets/sprites/ui/wheel/` (future) or procedural in `pixelVfxDraw.ts`.
- Icon = Intent silhouette glyph + art-specific 1px detail (not text).
- Cooldown overlay: radial wipe clock-hand, intent-colored at 50% alpha.

**Wheel loadout assignment** (empty vs filled slots, Home + Echoes editors, combat sync):
[`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md).

---

## 10. Dharma Treasures — Pixel Read

> **Pixels:** [`design-arts/items/`](../design-arts/items/index.md) (DI-01…03) · **Home UI:** plan `12` §18.3

3D Home uses GLB models (sub-plan 11); combat/HUD uses **24×24 pixel icons**.

| Item ID | Slot | Rarity | Icon shape | Colors | Combat pixel note |
|---------|------|--------|------------|--------|-------------------|
| `item.sword.wood` | weapon | common | Short blade | Brown `#8a6040` | No glow |
| `item.sword.iron` | weapon | uncommon | Longer blade | Grey `#a0a8b0` | 1px edge highlight |
| `item.sword.ancient` | weapon | legendary | Curved ancient blade | Cyan `#6fd6e8` + gold | Faint pulse on wheel when equipped |
| `item.robe.novice` | armor | common | Robe fold | Slate `#687888` | — |
| `item.bracelet.copper` | accessory | uncommon | Band arc | Copper `#b87848` | — |
| `item.ring.speed` | accessory | rare | Ring + wind tick | White `#e8f0ff` | Dash trail +1 ghost when equipped |
| `item.spirit.jade` | spirit | rare | Orb | Jade `#2dd4a8` | Gather Qi ring tint jade |
| `item.consumable.immortal_jade` | consumable | epic | Faceted gem | Gold-green | Breakthrough UI only |
| `item.aura.true_dao.crown` | cosmetic | legendary | Crown glyph | Gold-white | Home aura only; no combat sprite |

---

## 11. Content Schema Hooks

Extend `content/skills/*.json` (optional fields — validate in sub-plan 20):

```json
{
  "visual": {
    "powerUi": "L",
    "vfxTier": "common",
    "aoeRadiusPx": 72,
    "iconKey": "wheel.sword.crescent",
    "uniqueHook": "tight_crescent"
  }
}
```

Enemy/boss JSON may add:

```json
{
  "visual": {
    "faction": "disciple",
    "regionAccent": "fallen_village",
    "intentAccent": "life_death",
    "bossProps": ["jade_seal"]
  }
}
```

---

## 12. Acceptance Criteria (Art Pass)

- [x] Every entity in §4–§7 has a documented palette row implemented or procedural equivalent
- [x] All 40 Divine Arts have `powerUi` + distinct `uniqueHook` per §9
- [x] Boss phase 2 prop swap visible in ≤ 1 s on threshold
- [x] **Fake 2.5D:** y-sort + layered props + shadows verified on 844×390 ([`fake-2.5d.md`](./fake-2.5d.md) §12) — code + manual QA
- [x] Intent hues never clash with region beast accents at gameplay zoom — procedural wheel icons
- [x] Echoes ancients distinguishable at thumbnail size (especially `heaven`)
- [~] Showcase tier used ≤ 3 art ids + Echoes mode (perf budget §3.2) — manual perf
- [x] `handbook/pixel-art-style.md` file map stays in sync with new atlas paths — procedural until DA-32

---

## 13. Handoff & Dependencies

| Consumer plan | Uses this canon for |
|---------------|---------------------|
| [03](./03-input-touch-controls.md) | §9.8 wheel icons, empty-slot chrome |
| [06](./06-phaser-map-scene-base.md) | §2 Fake 2.5D depth, shadow, parallax, §2.6 camera |
| [07](./07-player-controller-combat.md) | §4 hero stages, unarmed vs sword |
| [08](./08-enemy-system-ai.md) | §5 factions, telegraphs |
| [09](./09-hitbox-damage-combat-math.md) | §3.1 damage numbers, hit flash |
| [12](./12-home-ui-panels.md) | §9.8 wheel editor icons, §10 treasure icons |
| [14](./14-insight-system.md) | §8 Intent colors, awakened +1 UI level |
| [15](./15-fortuitous-encounters.md) | §10 Dharma Treasure drops, encounter cards |
| [17](./17-world-map-travel.md) | §5.2 region accent tints on portal |
| [19](./19-skill-executor-vfx.md) | §3 tiers, §8–§9 art execution |
| [20](./20-content-pipeline.md) | §11 `visual` schema on skills/enemies |
| [21](./21-mvp-maps-chapters-1-5.md) | §5 guidelines, §2.1 settlements/trees, §6 bosses ch1–5 |
| [22](./22-mvp-maps-chapters-6-10.md) | §2.1 settlements/trees, §6 bosses |
| [`map-design-canon.md`](./map-design-canon.md) | §3 environment, §4 signature trees — art via DA-09 |
| [23](./23-mvp-enemies-bosses-skills.md) | §6 bosses, §9 data fill |
| [25](./25-audio-vfx-polish.md) | §3 juice kit, §2.6 shake sync |
| [26](./26-pwa-performance-ship.md) | §3.2 tier caps, integer zoom QA |
| [27](./27-ancient-echo-demo.md) | §7 ancients, Showcase tier |
| [30](./30-divine-arts-wheel-loadout.md) | §9.8 wheel loadout + icons |

**Skills:** `pixel-art-director`, `pixel-character`, `sprite-animation`, `vfx-particles`, `combat-designer` when implementing any row in this document.

# Fake 2.5D — Pixel Art Rendering Canon (Phaser 3.60+)

> **Also called:** *2.5D pixel art rendering* (design briefs) · **Project term:** **Fake 2.5D**  
> **Master plan:** [index.md](./index.md) §3.2 · **Implementation:** [06-phaser-map-scene-base.md](./06-phaser-map-scene-base.md) · **Integration QA:** [29-pixel-art-combat-canon.md](./29-pixel-art-combat-canon.md) §2 · **Map props art:** [design-arts/map-props.md](./design-arts/map-props.md)

---

## 1. Goal

Implement a **2.5D pixel-art world** using **Phaser 3.60+**.

This is **NOT a 3D game**. Everything is rendered with **2D sprites** while creating a convincing
illusion of depth, height, and atmosphere — visually in the family of modern **HD-2D** pixel games
(live sprites + layered environments), but **sprite-based only**.

| | Fake 2.5D (combat) | Real 3D (Home only) |
|--|-------------------|---------------------|
| Engine | **Phaser 3.60+** | Three.js r170+ |
| Depth | `sprite.setDepth(baseY)` y-sort + layered props | Z-buffer / meshes |
| Grounding | Sprite shadows + optional Light2D | Real lighting |
| Background | Parallax rects (camera-locked) | Orbit camera |
| Physics | Arcade XY only | N/A in combat |
| Camera | Orthographic, **never rotates** | Orbit / perspective |

**Do not call it** “faux-Z”, “pseudo-3D combat engine”, or “voxel map” — the canonical project term
is **Fake 2.5D**. Short form in tables: `Fake 2.5D`.

---

## 2. Visual style

| Rule | Detail |
|------|--------|
| Camera angle | **Top-down / slightly angled** — orthographic; no perspective distortion |
| Rendering | **Pixel-perfect** — `pixelArt: true`, `roundPixels: true`, integer zoom only |
| Volume read | Buildings, trees, cliffs, rocks, and props appear **thick**, not paper-flat |
| Asset draw | Hand-drawn **visible side faces** (front, left, right) where needed to sell depth |
| Perspective | **None** — no vanishing-point camera, no mesh extrusion |
| Rotation | Camera **never rotates** — pan + zoom only |

Art direction: sticky-man pixel canon ([`handbook/pixel-art-style.md`](../handbook/pixel-art-style.md))
for characters; environment props follow DA-09 ([`design-arts/map-props.md`](./design-arts/map-props.md)).

---

## 3. Phaser 3.60+ engine requirements

Project dependency: `phaser@^3.80.0` (3.6x line). Minimum documented floor: **3.60.0**.

| Setting | Value | Why |
|---------|-------|-----|
| `pixelArt` | `true` | Nearest-neighbor; crisp pixels |
| `roundPixels` | `true` | No sub-pixel shimmer |
| Camera zoom | **Integer only** | `computeIntegerZoom()` + letterbox |
| Renderer | **Mobile Pipeline** (auto on 3.60+) | Batch draw calls on iOS/Android |
| `scrollFactor` on parallax | **`0`** (camera-locked) | Reposition from `camera.scroll × factor` — no seam drift |
| Camera | Orthographic follow | Smooth lerp; bounds = world bounds |

Full game config: plan `06` §4.

---

## 4. Depth system

Render order is **dynamic depth sorting** — primarily by world **Y** (feet / base anchor).

### 4.1 Core rule

```typescript
// Every frame a unit or y-sorted prop moves:
sprite.setDepth(Math.floor(sprite.y)); // depth = object.baseY
```

**Feet anchor:** all humanoids and tall props use `setOrigin(0.5, 1)` — depth key = base Y at ground
contact.

### 4.2 Occlusion examples (required behavior)

Characters must:

- Walk **behind** buildings (south of structure base Y)
- Walk **in front of** buildings (north of structure base Y)
- Walk **behind** tree trunks / canopies when south of trunk
- Walk **in front of** ground decorations and low props

Implementation: `DepthSort.apply(sprite)` each move frame (`src/combat/render/DepthSort.ts`). Tall
props use **layer stacks** (§5) so roof/walls/trunk each sort independently.

### 4.3 Depth stack (back → front)

| Layer | Depth | Rule |
|-------|-------|------|
| Parallax far | `-30` … `-10` | 2–3 full-map rects; camera-locked |
| Ground tiles | `0`–`2` | Tiled: ground, decoration |
| Prop shadows | `baseY - 8` | Blob under structure/tree (§7) |
| Layered prop — walls / trunk | `baseY` | Y-sorted with units |
| Drop shadows (units) | `ownerY - 4` | Ellipse; does not y-sort with body |
| Units | `worldY` | Player, enemies |
| Layered prop — roof / canopy | `baseY + 1` | Occludes units when south |
| Projectiles / VFX | `worldY` or `worldY + 1` | Slightly in front of caster |
| Foreground trim | fixed row depth | Gate posts, cliff overhangs |
| HUD | `30_000+` or DOM | Combat HUD |

Full integration table: plan `29` §2.1.

---

## 5. Asset structure — multi-layer props

Complex environment objects **must** support multiple sprite layers. Each layer has its own render
depth (y-sort or fixed offset).

### 5.1 Example — house

| Layer | Sort | Notes |
|-------|------|-------|
| `shadow` | `baseY - 8` | Soft blob under footprint |
| `walls` | `baseY` | Front + side faces visible |
| `windows` / `door` | `baseY` | Same depth as walls (atlas sub-sprites) |
| `roof` | `baseY + 1` | Overhangs walls; occludes units walking south |
| `chimney_smoke` | `baseY + 2` | Optional VFX overlay |

### 5.2 Example — signature tree

| Layer | Sort | Notes |
|-------|------|-------|
| `trunk_shadow` | `baseY - 8` | Wide ellipse |
| `trunk` | `baseY` | 16–24 px wide; y-sorts with player |
| `canopy` | `baseY + 1` | 96–160 px tall read; occludes when south |
| `leaves_particle` | `baseY + 2` | Optional ambient (quality medium+) |

### 5.3 Runtime

`src/combat/render/LayeredProp.ts` — spawns layer children from prop manifest:

```json
{
  "id": "prop.structure.house_ruin",
  "layers": [
    { "key": "house_ruin_shadow", "depthOffset": -8, "origin": [0.5, 0.5] },
    { "key": "house_ruin_walls", "depthOffset": 0, "origin": [0.5, 1] },
    { "key": "house_ruin_roof", "depthOffset": 1, "origin": [0.5, 1] }
  ],
  "footprint": { "w": 96, "h": 64 },
  "lightOccluder": true
}
```

`MapPropsLoader` instantiates `LayeredProp` for structures and signature trees (plan `06`).

---

## 6. Lighting (Phaser Light2D)

Support **Phaser Light2D** for atmosphere. Real 3D lighting is **not** required.

### 6.1 Objects should

- **Receive** dynamic light (normal pipeline or Light2D tint)
- **Cast** visual shadows — fake sprite shadows are acceptable (§7)
- Support **optional normal maps** on key props (houses, cliffs) for better light response

### 6.2 Implementation

| File | Role |
|------|------|
| `src/combat/render/Light2DManager.ts` | Ambient + 1–2 moving lights; sync with `environment.weather` |
| Quality profile | **Off** on `low` ([`26-pwa-performance-ship.md`](./26-pwa-performance-ship.md)); **on** medium/high |

Rules:

- Default combat: soft **ambient** + optional **torch/shrine point light** near POIs
- Normal maps: **optional** per atlas — ship without them on low tier
- Light direction drives **shadow skew** (§7.2) when Light2D enabled

---

## 7. Shadows

Use **sprite-based** shadows — not real-time shadow maps.

### 7.1 Shadow types

| Type | Spec | Owner |
|------|------|-------|
| **Character** | Soft ellipse under feet; tracks x/y | `GroundShadow.ts` |
| **Tree** | Wide low-alpha blob under trunk | `LayeredProp` shadow layer |
| **House / structure** | Rectangular soft blob under footprint | `LayeredProp` shadow layer |
| **Boss / ancient** | Larger ellipse + optional intent ring | plan `29` §2.2 |

Character shadows **do not** scale with jump/dash — motion sells height via afterimage, not shadow lift.

### 7.2 Light-linked skew (when Light2D on)

Shadow sprites offset **away from light source** by 2–6 px and reduce alpha slightly — fake
directional read without 3D shadows.

```typescript
shadow.x = owner.x + lightDirX * skewPx;
shadow.y = owner.y + lightDirY * skewPx + footOffset;
```

---

## 8. Environment (sprite-based world)

All assets should read **thick** (visible sides), not completely flat tiles.

Supported prop families (authoring: [`map-design-canon.md`](./map-design-canon.md), art: DA-09):

| Category | Examples | Notes |
|----------|----------|-------|
| **Houses / structures** | `house_ruin`, `hut`, `shrine`, `sect_gate` | Multi-layer (§5) |
| **Trees** | 20 signature `prop.tree.*` | Trunk + canopy layers |
| **Terrain features** | mountains, cliffs, bridges | Cliff = foreground tile + side-face prop |
| **Paths** | roads, village lanes | Ground tile + edge decal |
| **Water** | rivers, moon-lake shore | Animated tile + shore prop |
| **Decorations** | rocks, barrels, wells, walls | Low props — single layer OK |

Settlement clusters and signature tree per map: [`map-design-canon.md`](./map-design-canon.md).

---

## 9. Camera

| Rule | Value |
|------|-------|
| Projection | **Orthographic** |
| Follow | Smooth lerp on player (`0.08` default — plan `29` §2.6 states) |
| Pixel-perfect | Integer zoom only; letterbox remainder |
| Zoom | Explore / Engage / Dramatic states — plan `29` §2.6 |
| Rotation | **Forbidden** — no `camera.rotation` in combat |
| Bounds | Clamped to map `bounds` (16,000×12,160 px MVP) |

---

## 10. Performance

Targets for mobile PWA (plan `26`):

| Metric | Target |
|--------|--------|
| Visible sprites | **Hundreds** on 16k maps with culling |
| FPS | Stable **60** on mid-tier; **30** floor on low quality |
| Depth sorting | Batch y-sort pass per frame — O(n) on active sprites only |
| Draw calls | **< 200** explore baseline; atlases per scene |
| Layer batching | Pack props + units into shared atlases; Mobile Pipeline on |
| Light2D | Disabled on `low` quality |
| Off-screen cull | Enemies, particles, distant prop layers |

`MapScene` culls props outside camera bounds + margin; encounter zones activate by player proximity.

---

## 11. Not allowed

Do **NOT** use in combat maps:

| Forbidden | Why |
|-----------|-----|
| 3D meshes | Home-only (Three.js) |
| Perspective camera | Breaks pixel-perfect read |
| Physics-based 3D | Arcade XY only |
| Voxel rendering | Off art canon |
| Polygonal / extruded buildings | Use layered 2D sprites |
| Camera rotation | Disorienting on mobile |
| Fractional camera zoom | Pixel shimmer |
| Scaling sprites for fake “near/far” | Use y-sort + parallax instead |

---

## 12. Acceptance (ship gate)

- [ ] Top-down pixel world reads as **HD-2D depth** at 2× zoom on 844×390 landscape
- [ ] Player walks behind **and** in front of at least one layered structure + one tree
- [ ] 10+ units y-sort correctly (`depth = baseY`)
- [ ] Character + structure + tree **sprite shadows** visible
- [ ] Light2D on medium/high OR cleanly disabled on low with no visual break
- [ ] Parallax: no horizontal seam while panning (`MapScene.syncParallax`)
- [ ] Integer camera zoom every frame; no shimmer on sprite edges
- [ ] Camera never rotates
- [ ] Home uses Three.js — combat canvas never loads Three
- [ ] Hundreds of sprites with culling — stable FPS on target device matrix (plan `26`)

---

## 13. Implementation file map

| File | Fake 2.5D responsibility |
|------|--------------------------|
| `src/combat/render/DepthSort.ts` | `depth = floor(y)` |
| `src/combat/render/GroundShadow.ts` | Unit ellipse shadows |
| `src/combat/render/LayeredProp.ts` | Multi-layer structure/tree stacks |
| `src/combat/render/Light2DManager.ts` | Ambient + point lights; quality-gated |
| `src/combat/render/CombatCameraController.ts` | Orthographic zoom states |
| `src/combat/map/MapPropsLoader.ts` | Spawn layered props from map JSON |
| `src/combat/scenes/MapScene.ts` | Layer order, parallax sync, culling |
| `assets/sprites/props/` | Layer atlases (DA-09) |

---

## 14. Plan cross-refs

| Plan | Fake 2.5D slice |
|------|-----------------|
| `02` | SceneRouter — Phaser combat vs Three Home |
| `06` | MapScene, DepthSort, GroundShadow, LayeredProp, Light2D, parallax |
| `07`–`09` | Units + hitboxes in y-sorted space |
| `21`–`22` | Per-region parallax tints + settlement props |
| [`map-design-canon.md`](./map-design-canon.md) | Structures, signature trees, environment |
| [`design-arts/map-props.md`](./design-arts/map-props.md) | Multi-layer prop art spec |
| `25`–`26` | Juice/camera perf; Light2D quality gate |
| `29` | Depth stack §2, camera §2.6, integration QA |
| `32` design-arts | Sprites: feet anchor, side faces, layer exports |

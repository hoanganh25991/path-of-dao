# Sub-Plan 06: Phaser Map Scene Base & Camera

**Phase:** 2 — 2D Combat  
**Estimated effort:** 8–10 hours  
**Depends on:** `02-scene-router-app-shell`, `05-save-system-foundation`  
**Parallel with:** `10` (home scene), `20` (content validators) — Track A; see [`index.md`](./index.md) §5.1  
**Blocks:** `07`, `08`, `17`

---

## 1. Objective

Replace CombatSceneHost stub with a real **Phaser 3.60+** pipeline: load Tiled JSON maps, render tile layers, spawn **settlements + signature tree** props, follow camera on **16,000×12,160** world bounds. Test map `map.test.grove` playable. **Fake 2.5D:** [`fake-2.5d.md`](./fake-2.5d.md). **Map canon:** [`map-design-canon.md`](./map-design-canon.md).

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/CombatSceneHost.ts` | Rewrite — Phaser game config (pixel-perfect, Mobile Pipeline) |
| `src/combat/scenes/BootScene.ts` | Asset preload (atlas-first) |
| `src/combat/scenes/MapScene.ts` | Main gameplay scene — **Fake 2.5D** depth + parallax |
| `src/combat/map/MapLoader.ts` | Load + parse map JSON |
| `src/combat/map/MapConfig.ts` | Zod schema for map metadata |
| `src/combat/map/CollisionLayer.ts` | Static physics walls |
| `src/combat/render/DepthSort.ts` | `setDepth(baseY)` — units walk behind/in front of props |
| `src/combat/render/GroundShadow.ts` | Per-unit soft ellipse; light-skew when Light2D on |
| `src/combat/render/LayeredProp.ts` | Multi-layer structures/trees (roof, walls, trunk, canopy) — [`fake-2.5d.md`](./fake-2.5d.md) §5 |
| `src/combat/render/Light2DManager.ts` | Phaser Light2D ambient + POI lights; off on `low` quality — §6 |
| `src/combat/map/MapPropsLoader.ts` | Structures, settlements, signature tree → `LayeredProp` |
| `src/combat/render/SignatureTree.ts` | Big tree `LayeredProp` stack + lore interact |
| `src/combat/render/CombatCameraController.ts` | Explore / Engage / Dramatic zoom + shake — plan `29` §2.6 |
| `content/maps/map.test.grove.json` | Test map metadata |
| `assets/maps/test-grove.json` | Tiled export (or procedural stub) |

---

## 2.1 Fake 2.5D — Phaser 3.60+ (Decision)

> **Canon:** [`fake-2.5d.md`](./fake-2.5d.md) · **Depth stack:** [`29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §2

Combat stays in **Phaser 3.60+ with Fake 2.5D** (2.5D pixel-art rendering), not a 3D engine —
Three.js is reserved for the 3D Home only (sub-plan 10). Full requirements:
[`fake-2.5d.md`](./fake-2.5d.md).

- **Y-sort depth:** `depth = floor(baseY)` — player walks behind/in front of buildings and trees.
- **Layered props:** houses and signature trees use roof/walls/trunk/canopy layers (§5).
- **Grounding:** sprite shadows under units, trees, and structures (§7).
- **Lighting:** optional Phaser Light2D — quality-gated (§6).
- **Parallax:** 2–3 camera-locked background layers (§3).
- **Camera:** orthographic, smooth follow, **integer zoom only**, **never rotates** (§9).
- **Pixel-perfect:** `pixelArt: true`, `roundPixels: true`, atlases + Mobile Pipeline.

---

## 3. Map Content Schema

`content/maps/{mapId}.json`:

```json
{
  "id": "map.test.grove",
  "chapterId": "chapter.00.test",
  "displayNameKey": "map.test.grove.name",
  "tiledPath": "assets/maps/test-grove.json",
  "tilesetPath": "assets/sprites/tilesets/grove.png",
  "spawn": { "x": 320, "y": 480 },
  "bounds": { "width": 16000, "height": 12160 },
  "recommendedCp": 1000,
  "connections": [],
  "encounterTable": "encounters.test",
  "bgm": "audio/bgm/grove.ogg",
  "environment": { "regionId": "test", "palette": "test_grove", "uniqueness": ["training_grove"] },
  "settlements": [{ "id": "settlement.test.hamlet", "type": "hamlet", "center": { "x": 3200, "y": 2800 }, "radius": 800, "structures": ["hut", "well"] }],
  "signatureTree": { "propId": "prop.tree.test_oak", "position": { "x": 8000, "y": 6000 }, "displayNameKey": "map.test.grove.signature_tree" }
}
```

Full field spec: [`map-design-canon.md`](./map-design-canon.md). Validate with Zod at load.

---

## 4. Phaser Game Config

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'canvas-2d',
  pixelArt: true,        // nearest-neighbor filtering, no antialias
  roundPixels: true,     // snap sprite positions to integer pixels
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1,             // camera applies the actual integer zoom (§2.1) — letterbox, don't stretch
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: import.meta.env.DEV },
  },
  scene: [BootScene, MapScene],
  transparent: false,
  backgroundColor: '#0d1117',
};
```

Phaser 3.60+'s Mobile Pipeline auto-detects iOS/Android and switches batching strategy — do not
set a manual renderer/batch override that would defeat it.

Store `mapId` on `CombatSceneHost` → pass via `scene.start('MapScene', { mapId })`.

---

## 5. BootScene

- Receive `mapId` in init data
- Load map JSON + tileset from MapLoader paths
- Load placeholder sprites: `player`, `enemy_slime` (32×32 colored squares OK)
- On complete → `scene.start('MapScene', { mapId })`

---

## 6. MapScene Structure

### 6.1 Create order

1. Load `MapConfig` by mapId
2. Create tilemap from Tiled JSON
3. Layer order: `ground` → `decoration` → `collision` (hidden) → `foreground`
4. Enable collision on `collision` layer — tile index > 0 collides
5. Set world bounds from map config
6. Spawn player sprite at spawn point (placeholder rectangle) + attach a `GroundShadow` under it
7. Camera: `startFollow(player, true, 0.08, 0.08)` with deadzone 80×80; **integer zoom only** (§2.1)
8. Camera bounds = world bounds
9. Mount `CombatCameraController` — listens for `combat:camera` events; default **Explore** zoom (plan 29 §2.6)
10. Add 2–3 **camera-locked** parallax layers behind `ground` — `scrollFactor(0)`, reposition each
    frame from `camera.scrollX/Y × factor` so layer edges never appear as a horizontal seam (§2.1)
11. Call `DepthSort.apply(player)` each frame the player moves (extended per-enemy in sub-plan 08)
12. `MapPropsLoader` → spawn `LayeredProp` for settlements + signature tree ([`fake-2.5d.md`](./fake-2.5d.md) §5)
13. `Light2DManager.init()` when quality ≥ medium; skip on `low` (plan `26`)
14. Mount CombatHUD via EventBus or direct import

### 6.2 Map exit (temporary)

Dev zone at map edge → `SceneRouter.switchTo('home')` to validate loop.

---

## 7. CollisionLayer

```typescript
class CollisionLayer {
  static apply(tilemap: Phaser.Tilemaps.Tilemap, layerName: string): Phaser.Physics.Arcade.StaticGroup;
}
```

Set collision for player physics body (added in sub-plan 07).

---

## 8. Tiled Map Requirements (test-grove)

**World scale:** [`map-design-canon.md`](./map-design-canon.md) — **500×380** tiles (16,000×12,160 px) at 32 px tiles.

Minimum layers:

- `ground`, `decoration`, `collision`, `foreground`
- Object layers: **`structures`**, **`settlements`**, **`signature_tree`**, `pois`
- Spawn: object layer `objects` type `spawn` (fallback: config coords)

If Tiled not ready, generate minimal map JSON programmatically in `tools/generate-test-map.ts` at full bounds.

---

## 9. Object Pooling Stub

`src/combat/PoolManager.ts` — empty registry, implemented in sub-plan 08. Register file now to avoid refactor.

---

## 10. Tests

### 10.1 Unit — MapConfig Zod

- Valid JSON passes
- Missing spawn fails

### 10.2 Integration — MapLoader

- Loads test map JSON from disk in vitest with fs

---

## 11. Acceptance Criteria

- [x] Switch to combat loads BootScene → MapScene without error
- [ ] Tilemap renders with camera follow on player placeholder (manual visual QA)
- [ ] Player cannot walk through collision tiles (static body in 07 — prep collision now)
- [x] World bounds clamp camera
- [x] Resize window reflows Phaser scale, camera zoom stays an integer, remainder letterboxed (`computeLetterbox`, `tests/unit/camera-zoom.test.ts`)
- [x] Returning Home destroys Phaser game cleanly (from sub-plan 02)
- [x] Map config validation errors show mapId in message
- [x] **Map canon:** bounds 16,000×12,160; settlement + signature tree spawn from JSON ([`map-design-canon.md`](./map-design-canon.md))
- [x] **Fake 2.5D:** player walks behind **and** in front of layered structure + tree ([`fake-2.5d.md`](./fake-2.5d.md) §4.2, §12)
- [x] **Fake 2.5D:** parallax layers camera-locked — no horizontal seam while panning (§3) — `parallaxSync` unit-tested; runtime visual QA manual
- [ ] Character + prop **sprite shadows** visible; Light2D on medium+ or disabled cleanly on low (manual visual QA)
- [x] Camera **never rotates**; orthographic integer zoom only
- [x] `CombatCameraController`: Engage zoom on attack, auto zoom-out on move after combo (plan 29 §2.6)

---

## 12. Performance

Per [`fake-2.5d.md`](./fake-2.5d.md) §10:

- Draw call target: < 200 for explore baseline; hundreds of sprites with off-screen cull
- Tilemap layer caching enabled (`setSkipCull(false)` default)
- All sprites packed into atlases per scene; Mobile Pipeline on
- Light2D disabled on `low` quality profile

---

## 13. Handoff

Sub-plan 07 adds arcade body to player, movement from InputManager, and collision with walls.

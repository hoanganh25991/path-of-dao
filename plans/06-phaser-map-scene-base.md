# Sub-Plan 06: Phaser Map Scene Base & Camera

**Phase:** 2 — 2D Combat  
**Estimated effort:** 8–10 hours  
**Depends on:** `02-scene-router-app-shell`, `05-save-system-foundation`  
**Blocks:** `07`, `08`, `17`

---

## 1. Objective

Replace CombatSceneHost stub with a real Phaser pipeline: load Tiled JSON maps, render tile layers, spawn player placeholder, follow camera, and define map boundaries. One test map `map.test.grove` playable.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/CombatSceneHost.ts` | Rewrite — Phaser game config |
| `src/combat/scenes/BootScene.ts` | Asset preload |
| `src/combat/scenes/MapScene.ts` | Main gameplay scene |
| `src/combat/map/MapLoader.ts` | Load + parse map JSON |
| `src/combat/map/MapConfig.ts` | Zod schema for map metadata |
| `src/combat/map/CollisionLayer.ts` | Static physics walls |
| `content/maps/map.test.grove.json` | Test map metadata |
| `assets/maps/test-grove.json` | Tiled export (or procedural stub) |

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
  "bounds": { "width": 1600, "height": 1200 },
  "recommendedCp": 1000,
  "connections": [],
  "encounterTable": "encounters.test",
  "bgm": "audio/bgm/grove.ogg"
}
```

Validate with Zod at load.

---

## 4. Phaser Game Config

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'canvas-2d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
6. Spawn player sprite at spawn point (placeholder rectangle)
7. Camera: `startFollow(player, true, 0.08, 0.08)` with deadzone 80×80
8. Camera bounds = world bounds
9. Mount CombatHUD via EventBus or direct import

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

Minimum 40×30 tiles, 32×32 tile size:

- Layers: `ground`, `decoration`, `collision`, `foreground`
- Spawn marked with object layer `objects` type `spawn` (optional — fallback to config coords)
- At least one enclosed area + open field

If Tiled not ready, generate minimal map JSON programmatically in tool script `tools/generate-test-map.ts`.

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

- [ ] Switch to combat loads BootScene → MapScene without error
- [ ] Tilemap renders with camera follow on player placeholder
- [ ] Player cannot walk through collision tiles (static body in 07 — prep collision now)
- [ ] World bounds clamp camera
- [ ] Resize window reflows Phaser scale
- [ ] Returning Home destroys Phaser game cleanly (from sub-plan 02)
- [ ] Map config validation errors show mapId in message

---

## 12. Performance

- Draw call target: < 200 for test map
- Tilemap layer caching enabled (`setSkipCull(false)` default)

---

## 13. Handoff

Sub-plan 07 adds arcade body to player, movement from InputManager, and collision with walls.

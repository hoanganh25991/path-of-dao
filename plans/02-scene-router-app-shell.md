# Sub-Plan 02: Scene Router & App Shell

**Phase:** 0 — Foundation  
**Estimated effort:** 6–8 hours  
**Depends on:** `01-project-scaffold`  
**Blocks:** `03`, `06`, `10`

---

## 1. Objective

Implement the application shell that hosts either the **2D combat canvas (Phaser 3.60+ Fake 2.5D)** or the **3D Home canvas (Three.js)**, with clean lifecycle management (init, pause, dispose). Player always lands on Home first. Depth canon: [`fake-2.5d.md`](./fake-2.5d.md).

---

## 2. Architecture

```
App.init()
  └─ SceneRouter (singleton)
       ├─ mount HomeSceneHost (Three.js) — default
       └─ switchTo('combat', { mapId }) → dispose Home, mount Phaser
       └─ switchTo('home') → dispose Phaser, mount Home
```

Only one engine active at a time to limit mobile GPU memory.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/app/SceneRouter.ts` | Scene switching, disposal |
| `src/app/SceneId.ts` | `'home' \| 'combat' \| 'story'` enum |
| `src/app/GameShell.ts` | DOM layout: canvases, overlay UI root |
| `src/core/EventBus.ts` | Typed pub/sub for cross-layer events |
| `src/core/GameClock.ts` | Delta time, pause flag |
| `src/home/HomeSceneHost.ts` | Stub Three scene (colored background) |
| `src/combat/CombatSceneHost.ts` | Stub Phaser scene (colored background) |
| `src/ui/LoadingOverlay.ts` | Fade during scene transitions |
| `src/ui/hud/FpsOverlay.ts` | **Always-on FPS button** — viewport top-right; left of menu when present (§4.1) |
| `src/ui/hud/top-right-chrome.css` | Shared top-right cluster layout (FPS + scene menu) |
| `src/app/app.css` | Full-viewport layout, safe areas |

---

## 4. DOM Structure

```html
<div id="app">
  <div id="game-shell">
    <canvas id="canvas-3d"></canvas>   <!-- Three.js -->
    <canvas id="canvas-2d"></canvas>   <!-- Phaser -->
  </div>
  <div id="ui-root"></div>             <!-- HTML HUD/menus -->
  <div id="loading-overlay" hidden></div>
</div>
```

CSS rules:

- `#game-shell`: `position: fixed; inset: 0;`
- Canvases: `position: absolute; inset: 0; width: 100%; height: 100%;`
- Inactive canvas: `visibility: hidden; pointer-events: none;` (not `display:none` — avoids resize bugs)
- `#ui-root`: `position: fixed; inset: 0; pointer-events: none;` — children re-enable pointer-events

### 4.1 Top-right chrome (FPS + menu)

`FpsOverlay` mounts once in `#ui-root` at app init — **never unmounts** on scene change.

```
Viewport top-right (safe-area inset):
                    ┌─────┬───────┐
                    │ FPS │ Menu  │  ← Menu flush right; FPS immediately left
                    └─────┴───────┘
                         ↑ 8px gap
```

| Rule | Detail |
|------|--------|
| **FPS button** | Always visible on every scene (Home, combat, story, overlays) |
| **Menu button** | Scene-specific — combat pause menu, overlay Close, etc. |
| **Order** | `[FPS]` left of `[Menu]`; **menu stays rightmost** (top-right anchor) |
| **No menu** | FPS alone at top-right (same anchor row) |
| **Z-index** | Above game canvases; below modals / pause veil |
| **Target size** | `min 44×44px` each — same touch target as menu (plan 03 §6) |

Scene hosts register their rightmost header button into `#top-right-chrome` (menu slot); `FpsOverlay`
owns the FPS slot. Spec: plan `03` §6.1 · `12` §17.8 · `17` §7.1.

---

## 5. SceneRouter API

```typescript
type ScenePayload = {
  home: undefined;
  combat: { mapId: string };
  story: { chapterId: string; sceneId: string };
};

interface SceneHost {
  readonly id: SceneId;
  mount(container: HTMLElement): Promise<void>;
  unmount(): Promise<void>;
  pause(): void;
  resume(): void;
}

class SceneRouter {
  static get instance(): SceneRouter;
  get current(): SceneId | null;
  async switchTo<K extends SceneId>(id: K, payload?: ScenePayload[K]): Promise<void>;
}
```

### 5.1 Switch sequence

1. Show loading overlay (200ms min to avoid flash)
2. Call `currentHost.pause()` if exists
3. Call `currentHost.unmount()` — **must** destroy WebGL context, kill requestAnimationFrame loops
4. Hide inactive canvas, show target canvas
5. Instantiate host if not cached (prefer fresh mount for memory)
6. `await host.mount(container)`
7. Hide loading overlay
8. Emit `EventBus.emit('scene:changed', { id, payload })`

### 5.2 Disposal checklist (both hosts)

**Three.js unmount:**

- Cancel animation frame id
- `renderer.dispose()`
- Traverse scene, dispose geometries/materials/textures
- Remove canvas from DOM or clear WebGL context via `renderer.forceContextLoss()`

**Phaser unmount:**

- `game.destroy(true)` — destroys canvas and all scenes
- Null out game reference

---

## 6. Stub Scene Hosts

### 6.1 HomeSceneHost (Three.js stub)

- Create `WebGLRenderer` bound to `#canvas-3d`
- Scene: dark blue fog + single `AmbientLight` + `DirectionalLight`
- Placeholder: green `BoxGeometry` mesh labeled "Hero Placeholder" (comment in code: replaced in sub-plan 10)
- Render loop via `requestAnimationFrame`; store id for cleanup
- Resize handler: update camera aspect + renderer size on `window.resize`

### 6.2 CombatSceneHost (Phaser stub)

- `new Phaser.Game({ type: Phaser.AUTO, parent: 'canvas-2d', ... })`
- One scene `BootScene`: fills background `#1a1a2e`, text "Combat: {mapId}"
- Scale mode: `Phaser.Scale.RESIZE` with `width/height: window.inner*`
- Pass `mapId` via scene data from router payload

---

## 7. EventBus

Typed events for MVP shell:

```typescript
type GameEvents = {
  'scene:changed': { id: SceneId; payload?: unknown };
  'app:pause': undefined;
  'app:resume': undefined;
};
```

Implementation: simple Map of listener arrays; no external deps.

Handle `document.visibilitychange` in `App.init()`:

- Hidden → `GameClock.pause()`, emit `app:pause`, active host.pause()
- Visible → resume

---

## 8. GameClock

```typescript
class GameClock {
  static deltaMs: number;
  static elapsedMs: number;
  static paused: boolean;
  static tick(now: number): void;  // called from each host's loop
}
```

---

## 9. LoadingOverlay

- CSS fade 0→1 opacity over 150ms
- Block pointer events while visible
- Minimum display time 200ms on scene switch (prevent flicker)

---

## 10. App.init() Flow

```typescript
static async init(): Promise<void> {
  GameShell.mount(document.getElementById('app')!);
  registerVisibilityHandlers();
  await SceneRouter.instance.switchTo('home');
}
```

Add dev-only keyboard shortcut: `KeyC` → switch to combat with `mapId: 'test'`; `KeyH` → home. Guard with `import.meta.env.DEV`.

---

## 11. Tests

### 11.1 Unit — EventBus

`tests/unit/event-bus.test.ts`:

- Subscribe, emit, receive payload
- Unsubscribe works
- Multiple listeners order preserved

### 11.2 Integration — SceneRouter (mock hosts)

Create `MockSceneHost` implementing interface; verify:

- switchTo disposes previous host
- switchTo same id with new payload re-mounts
- concurrent switchTo calls serialize (mutex flag)

---

## 12. Acceptance Criteria

- [x] App boots to Three.js stub (blue fog + box) on `#canvas-3d`
- [x] Dev key `C` switches to Phaser stub showing mapId; `H` returns Home
- [x] No WebGL context leak after 10 rapid switches (SceneRouter host disposal contract; `tests/integration/scene-router.test.ts`)
- [x] Tab hidden pauses render loops (verify via counter not incrementing)
- [x] Loading overlay visible during transition
- [x] `#ui-root` exists and overlays canvas without blocking inactive canvas pointer-events incorrectly
- [x] **`FpsOverlay`** mounted at init; visible on Home and combat; never unmounts on scene switch (§4.1)
- [x] All unit tests pass

---

## 13. Performance Targets

- Scene switch complete in < 800ms on M1 Mac / mid Android
- Idle Home scene: < 5% CPU when tab visible

---

## 14. Handoff

- Sub-plan 03 adds touch input layer on `#ui-root`
- Sub-plan 06 replaces CombatSceneHost stub with real Phaser map scene
- Sub-plan 10 replaces HomeSceneHost stub with hero viewer

# Sub-Plan 10: Three.js Home Scene & Hero Viewer

**Phase:** 3 — 3D Home  
**Estimated effort:** 10–14 hours  
**Depends on:** `02-scene-router-app-shell`, `05-save-system-foundation`  
**Parallel with:** `06` (combat scene), `20` (content validators) — Track B; see [`index.md`](./index.md) §5.1  
**Blocks:** `11`, `12`, `25`

---

## 1. Objective

Build the 3D Home shrine: floating mountain village backdrop, rotatable/zoomable hero viewer, realm-based aura VFX, and ambient presentation loop. Replaces HomeSceneHost stub. Home aura tiers align with hero stage §4 in [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md); Dharma Treasure 3D attach points: §10.

---

## 2. Scene Composition

```
Skybox (gradient dome)
  └─ FloatingIsland (low-poly mesh)
       └─ ShrinePlatform
            └─ HeroModel (GLB placeholder)
                 └─ AuraVFX (particle system by realm)
       └─ Environment props (lanterns, trees — instanced)
Camera: OrbitControls (touch rotate + pinch zoom)
Lights: Hemisphere + Directional + subtle rim
```

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/home/HomeSceneHost.ts` | Rewrite full Three pipeline |
| `src/home/HomeScene.ts` | Scene graph builder |
| `src/home/HeroViewer.ts` | Load GLB, idle animation |
| `src/home/AuraController.ts` | Realm aura tiers |
| `src/home/CameraRig.ts` | Orbit limits |
| `src/home/EnvironmentBuilder.ts` | Island + props |
| `assets/models/hero/wanderer.glb` | Placeholder model |
| `assets/models/home/island.glb` | Environment |

If GLB unavailable: procedural capsule body + box limbs (document fallback in code).

---

## 4. HeroViewer API

```typescript
class HeroViewer {
  constructor(scene: THREE.Scene, loadingManager: THREE.LoadingManager);
  async load(heroId: string): Promise<void>;
  setRealm(realmId: string, tier: string): void;
  attachEquipment(slot: EquipmentSlot, itemModelId: string | null): void;
  playIdle(): void;
  dispose(): void;
}
```

Load animated GLB with `AnimationMixer` — idle loop crossfade 0.3s.

---

## 5. CameraRig — Mobile Orbit

Use `OrbitControls` from three/examples:

| Param | Value |
|-------|-------|
| minDistance | 2.5 |
| maxDistance | 6.0 |
| minPolarAngle | π/4 |
| maxPolarAngle | π/2.1 |
| enablePan | false |
| rotateSpeed | 0.5 touch |

Double-tap hero resets camera — optional.

---

## 6. AuraController (Realm Tiers)

From void-ascension concept:

| Realm Tier | VFX |
|------------|-----|
| Mortal / Qi | none |
| Foundation / Core | faint particles, slow rise, white-blue |
| Nascent Soul | swirling ring, 30 particles |
| Void Spirit | distorted refraction shader stub + purple particles |
| True Dao | chromatic aberration post-pass (lite) + gold ring |

```typescript
class AuraController {
  setTier(tier: AuraTier): void;
  update(delta: number): void;
  dispose(): void;
}
```

Implement with `THREE.Points` + custom shader material — no external VFX lib MVP.

Read realm from `useGameStore.getState().save.realm`.

---

## 7. EnvironmentBuilder

- Island mesh Y=0, hero stands at platform center
- Slow cloud plane scroll at Y+20
- 2–3 instanced trees, 4 lanterns with emissive warm light
- Fog: `scene.fog = new FogExp2(0x1a1a2e, 0.035)`

---

## 8. Render Loop

```typescript
function animate(now: number) {
  if (paused) return;
  GameClock.tick(now);
  const delta = GameClock.deltaMs / 1000;
  mixer.update(delta);
  aura.update(delta);
  controls.update();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(animate);
}
```

Pixel ratio: `Math.min(devicePixelRatio, 2)` for mobile.

---

## 9. Loading Flow

HomeSceneHost.mount:

1. Show loading overlay
2. Load hero + island assets via LoadingManager
3. Build scene, apply save realm aura
4. Start render loop
5. Hide overlay

On unmount: full dispose per sub-plan 02 checklist.

---

## 10. Performance Budget

| Metric | Target |
|--------|--------|
| Triangles | < 30k |
| Draw calls | < 40 |
| FPS | 30+ mid Android |

Quality profile hook (sub-plan 26): reduce particles on low tier.

---

## 11. Tests

Limited for Three — manual QA checklist primary for touch feel and 30 FPS.

| Test file | Assert |
|-----------|--------|
| `tests/unit/aura-tier.test.ts` | Map realm id → correct AuraTier enum |
| `tests/unit/camera-rig.test.ts` | Orbit distance/polar limits, resize, reset |
| `tests/unit/hero-viewer.test.ts` | Procedural hero, realm aura toggle, equip attach, dispose |
| `tests/unit/home-scene-dispose.test.ts` | HomeScene build/dispose cycles |
| `tests/integration/home-scene-disposal.test.ts` | HomeSceneHost 10× WebGL teardown |

---

## 12. Acceptance Criteria

- [x] Home loads hero model with idle animation
- [x] Touch rotate + pinch zoom work smoothly
- [x] Aura visible at Core Formation and above
- [x] Scene disposes without WebGL leak on 5 home↔combat switches (`HomeSceneHost.unmount` + router disposal test)
- [x] Island environment visible, hero centered
- [ ] **Manual QA:** 30 FPS on Chrome mobile emulation throttled 4× (documented in track 10; not automatable in CI)

---

## 13. Handoff

Sub-plan 11 attaches equipment meshes to hero skeleton bones. Sub-plan 12 adds HTML UI panels over this scene.

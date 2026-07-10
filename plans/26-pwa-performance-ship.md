# Sub-Plan 26: PWA, Performance & Ship Checklist

**Phase:** 7 — Polish & Ship  
**Estimated effort:** 10–12 hours  
**Depends on:** all prior sub-plans, especially `24`, `25`  
**Blocks:** — (final)

---

## 1. Objective

Ship MVP as installable PWA, hit performance targets on mid-range mobile, CI green, and complete Definition of Done from master plan.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `vite.config.ts` | PWA plugin, chunk tuning |
| `public/manifest.webmanifest` | App metadata |
| `public/icons/*` | 192, 512 PNG |
| `src/app/service-worker.ts` | Workbox config via vite-plugin-pwa |
| `src/app/QualityProfile.ts` | low/mid/high settings |
| `.github/workflows/ci.yml` | typecheck, test, validate, build |
| `handbook/SHIP_CHECKLIST.md` | Manual QA script |
| `src/ui/hud/FpsOverlay.ts` | Always-on FPS for ship QA (plan `02` §4.1) |

---

## 3. PWA Configuration

`manifest.webmanifest`:

```json
{
  "name": "Path of Dao",
  "short_name": "PathOfDao",
  "description": "Cultivation action RPG",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "icons": [...]
}
```

`orientation: "any"` — players may rotate freely; **design and QA target landscape** (844×390)
per [`plans/index.md`](./index.md) §2.1. Do not lock manifest to portrait.

vite-plugin-pwa:

- `registerType: 'autoUpdate'`
- Cache static assets + content manifest
- Offline: Home + last maps assets cache group (optional — online-first MVP OK with offline Home only)

---

## 4. Quality Profiles

```typescript
type QualityTier = 'low' | 'mid' | 'high';

interface QualitySettings {
  pixelRatioCap: number;
  auraParticles: number;
  juiceHitStop: boolean;
  screenShake: boolean;
  shadowMap: boolean;
  light2D: boolean;           // Phaser Light2D — off on low ([`fake-2.5d.md`](./fake-2.5d.md) §6)
  propLayerCull: boolean;     // off-screen LayeredProp layer skip
}
```

| Tier | `light2D` | Notes |
|------|-----------|-------|
| `low` | `false` | Sprite shadows only |
| `mid` | `true` | Ambient + 1 POI light |
| `high` | `true` | + normal maps where authored |

Auto-detect:

```typescript
const isLow = navigator.hardwareConcurrency <= 4 || /Android [1-8]/.test(UA);
```

Manual override in settings save.settings.quality.

---

## 5. Performance Targets

| Metric | Target |
|--------|--------|
| FPS combat | ≥ 30 mid Android (Snapdragon 6xx) |
| FPS Home 3D | ≥ 30 |
| Scene switch | < 1s |
| Initial load | < 5s 4G (excl. first cache) |
| Bundle gzip | < 2.5MB initial (Phaser+Three split) |
| Memory | < 350MB peak iOS |

---

## 6. Optimization Pass

### 6.1 Build

- `manualChunks`: phaser, three, vendor
- Tree-shake unused Three modules
- Compress assets: webp sprites, draco GLB optional

### 6.2 Runtime

Validated 2026-07 against a Phaser-vs-alternatives deep re-evaluation (`plans/index.md` §3.2;
**Fake 2.5D** on Phaser 3.60+): engine choice was never the mobile bottleneck — overdraw/fill-rate, draw-call count, and GC
pressure are, regardless of engine. These are the concrete disciplines that actually move FPS:

- **One shared texture atlas** per scene across sprites *and* VFX, so combat batches into
  Phaser's Mobile Pipeline single-texture path (don't fragment atlases per-enemy-type).
- **Object pools verified** (enemies, projectiles, damage numbers, particle emitters) — never
  `new`/destroy mid-fight.
- **Cull/skip off-screen entities** from AI and collision loops, not just from rendering — this
  was the #1 real-world win in the source postmortem, not just a rendering optimization.
- **Fake 2.5D prop cull** — `LayeredProp` layers outside camera bounds + margin skipped
  ([`fake-2.5d.md`](./fake-2.5d.md) §10); hundreds of sprites target with stable FPS.
- **Light2D off on `low`** — `QualityProfile.light2D === false`; sprite shadows remain.
- **Cap simultaneous particle counts per Divine Art cast**; budget VFX like a fill-rate expense
  (overlapping additive layers), not a sprite-count expense — see `plans/index.md` §4.4 overdraw budget.
- Phaser `pixelArt: true` + `roundPixels: true`; **integer camera zoom only**, letterbox the
  remainder — avoid fractional zoom/scale (extra bilinear sampling + overdraw on pixel art).
  Combat camera Engage/Dramatic caps on low quality: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §2.6.
- **Trim transparent padding** on sprites to shrink actually-overdrawn area per draw.
- **Profile on real mid-range Android hardware early** (Chrome remote debugging + GPU overdraw
  overlay) — desktop Chrome FPS counters do not predict mobile fill-rate behavior.
- Three dispose on unmount audited (Chrome heap snapshot dev)

### 6.3 Content

- Lazy load story locales by chapter
- Preload only current chapter tileset

---

## 7. CI Pipeline

`.github/workflows/ci.yml`:

```yaml
jobs:
  build:
    steps:
      - pnpm install
      - pnpm typecheck
      - pnpm test
      - pnpm content:validate --strict-i18n
      - pnpm build
```

Artifact upload `dist/` on main.

---

## 8. E2E Smoke (Playwright)

`tests/e2e/smoke.spec.ts`:

1. Load app, tap to unlock audio
2. Assert Home visible
3. Open world map, enter ch1 map1 (mock combat load)
4. Return Home
5. Switch locale vi — assert bottom nav text

Run headless mobile viewport.

---

## 9. SHIP_CHECKLIST.md

Manual 30-item checklist covering master plan §12 Definition of Done:

- Full playthrough ch1–10
- Save/load mid-combat
- Breakthrough once
- Awaken one skill
- Fortuitous encounter proc
- vi UI pass
- PWA install Android + iOS Add to Home
- 10-min no console errors
- **FPS overlay** visible top-right on Home + combat; left of menu in combat (plan `02` §4.1)

---

## 10. Error Reporting Stub

```typescript
window.onerror → log to console + optional local ring buffer for QA export
```

No Sentry MVP — hook interface only.

---

## 11. Version & Credits

`src/app/version.ts`: `export const VERSION = '0.1.0-mvp';`

About panel in settings: version, licenses (Phaser, Three, Howler MIT).

---

## 12. Tests

| Test | Assert |
|------|--------|
| QualityProfile detect | low on mocked UA |
| build | completes |
| e2e smoke | passes |

---

## 13. Acceptance Criteria

- [ ] Lighthouse PWA installable badge — **manual before deploy** (manifest installability covered in `preflight.test.ts`; Lighthouse not in CI — see `handbook/SHIP_CHECKLIST.md` §A)
- [x] CI green on clean clone — workflow + `pnpm typecheck && pnpm test && pnpm build` pass locally
- [x] Quality low disables shake/hit-stop and **Dramatic** camera zoom (Engage-only or Explore-only per plan 29 §2.6)
- [ ] 30 FPS on throttled test device profile (read from **FPS overlay**, plan `02` §4.1) — **manual** (`handbook/SHIP_CHECKLIST.md` §B #30)
- [ ] No overdraw hotspots on GPU overlay during a horde encounter (§6.2 disciplines) — **manual**
- [x] Camera zoom stays integer at every tested viewport; no fractional-scale shimmer — `computeIntegerZoom` / `computeEngageZoom` unit tests
- [ ] SHIP_CHECKLIST all items checked — **manual §B** (`handbook/SHIP_CHECKLIST.md`); **automated §A** via `pnpm ship:preflight`
- [ ] Definition of Done (master plan §12) complete — blocked on manual §B pass
- [x] Version displayed in settings
- [x] FPS overlay mounted at app init (plan `02` §4.1)
- [x] PWA manifest + icons on disk (`preflight.test.ts`, `validate-static.mjs`)
- [x] Error reporting ring buffer (`errorReporting.ts`, static preflight)
- [x] `handbook/SHIP_CHECKLIST.md` — 30-item manual QA + automated §A table

---

## 14. Post-MVP Backlog (Document Only)

Do not implement — list in `handbook/BACKLOG.md`:

- Second hero
- Cloud save
- Daily quests
- Guild / social
- Additional languages
- Pet combat companion

---

## 15. Release Tag

When user approves ship:

```bash
git tag v0.1.0-mvp
```

Deploy `dist/` to static host (GitHub Pages / Cloudflare Pages) — deployment sub-plan out of scope unless requested.

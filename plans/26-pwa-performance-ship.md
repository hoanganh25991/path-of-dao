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
| `docs/SHIP_CHECKLIST.md` | Manual QA script |

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
  "orientation": "portrait",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "icons": [...]
}
```

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
}
```

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

- Object pools verified (enemies, projectiles, damage numbers)
- Phaser `roundPixels: true` for crisp pixel art
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

- [ ] Lighthouse PWA installable badge
- [ ] CI green on clean clone
- [ ] Quality low disables shake/hit-stop
- [ ] 30 FPS on throttled test device profile
- [ ] SHIP_CHECKLIST all items checked
- [ ] Definition of Done (master plan §12) complete
- [ ] Version displayed in settings

---

## 14. Post-MVP Backlog (Document Only)

Do not implement — list in `docs/BACKLOG.md`:

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

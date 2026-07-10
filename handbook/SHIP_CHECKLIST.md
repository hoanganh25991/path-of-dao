# Ship checklist — Path of Dao MVP (plan 26)

Use this before tagging `v0.1.0-mvp`. Items map to [`plans/index.md`](../plans/index.md) §12 Definition of Done and [`plans/26-pwa-performance-ship.md`](../plans/26-pwa-performance-ship.md) §9.

**Viewport:** primary QA target **844×390 landscape**; portrait 390×844 as fallback.

**Batch hand-off:** before marking work done after several features, run [`plans/34-quick-check-smoke-devtools.md`](../plans/34-quick-check-smoke-devtools.md) — `pnpm smoke:test` plus Chrome DevTools console on Home and combat (**C** in dev).

---

## A. Automated (CI + preflight)

Run on every ship candidate:

```bash
pnpm ship:preflight
```

This runs `pnpm typecheck`, `pnpm test` (includes `tests/ship/preflight.test.ts`), `pnpm content:validate --strict-i18n`, and `pnpm build`. GitHub Actions runs the same gates plus `pnpm test:e2e`.

| Gate | Verified by |
|------|-------------|
| PWA manifest structure (installability subset) | `preflight.test.ts` + `tools/ship/validate-static.mjs` |
| Icons 192 / 512 on disk | static validation |
| `index.html` manifest + theme-color | static validation |
| Version `0.1.0-mvp` | `version.ts` + settings panel test |
| Error reporting ring buffer (`window.__podErrors`) | static validation + `errorReporting.ts` |
| FPS overlay + menu slot wiring | `fps-overlay.test.ts` |
| Quality `low` disables shake, hit-stop, Light2D; Dramatic→Engage zoom | `quality-profile.test.ts`, `camera-zoom.test.ts` |
| Integer camera zoom | `camera-zoom.test.ts` |
| Vite PWA `autoUpdate` + chunk split | static validation |
| E2E smoke spec present | static validation; green in CI |

### Lighthouse PWA badge — manual before deploy

**Not in CI.** `@lhci/cli` needs a served `dist/`, headless Chrome, and stable network — too heavy for every PR and duplicates manifest checks we already assert in vitest. Before static deploy or store submission:

1. `pnpm build && pnpm preview`
2. Chrome DevTools → Lighthouse → Progressive Web App (mobile)
3. Confirm **Installable** badge; file score in release notes if &lt; 90

Manifest field coverage in tests aligns with [Chrome installability criteria](https://web.dev/articles/install-criteria): `name`, `start_url`, `display`, icons 192+512, maskable 512, `theme_color`, linked manifest.

---

## B. Manual QA (30 items)

Check each on a **real mid-range Android** (Snapdragon 6xx class) unless noted. Mark date + device in release notes.

| # | Item | Done |
|---|------|------|
| 1 | **Full playthrough** — chapters 1–10 completable; end-of-chapter story scene each | [ ] |
| 2 | **Core loop** — boot → Home → world map → enter map → combat → clear or fail → save → return Home | [ ] |
| 3 | **New game unarmed** — punch/kick strike combo only; no sword in weapon slot | [ ] |
| 4 | **Ancient Spirit Sword** — obtainable from ch1–2 map POI; equipping enables sword combo | [ ] |
| 5 | **Sword Intent gated** — unavailable until ancient sword equipped | [ ] |
| 6 | **World map** — 20 maps reachable; free jump any pin; low/medium/high danger warnings | [ ] |
| 7 | **Bosses** — 8 boss fights with visibly distinct patterns | [ ] |
| 8 | **Divine Arts** — arts equippable on 6-slot wheel; earned on road | [ ] |
| 9 | **Master Intent** — meter visible; one sequential awakening + gate Intent unlock demo | [ ] |
| 10 | **Fortuitous encounters** — ≥3 types functional (including ancient sword) | [ ] |
| 11 | **Breakthrough** — realm breakthrough flow completes once | [ ] |
| 12 | **Combat power** — displayed in Home profile | [ ] |
| 13 | **Home aura** — visible in 3D Home, appropriate to realm tier | [ ] |
| 14 | **Save mid-combat** — combat menu → Pause; reload preserves state | [ ] |
| 15 | **Autosave** — on map exit and Back to Home | [ ] |
| 16 | **Combat menu touch** — Pause and Back to Home reachable in landscape (844×390) | [ ] |
| 17 | **Combat controls** — 6-slot wheel, Dash (i-frames), Gather Qi (3× regen) | [ ] |
| 18 | **Defeat not kill** — player/enemies recover via origin gather-qi | [ ] |
| 19 | **Fake 2.5D** — y-sort, layered props, sprite shadows on combat map | [ ] |
| 20 | **Explorable maps** — villages/structures/signature tree on sample maps | [ ] |
| 21 | **English UI** — no missing keys; readable copy on Home, map, combat | [ ] |
| 22 | **Vietnamese UI** — settings → vi; bottom nav + combat labels correct | [ ] |
| 23 | **Echoes of the Ancients** — showcase + arts catalog reachable | [ ] |
| 24 | **Path** — My Path scroll; review/follow/forge ancient roads | [ ] |
| 25 | **PWA Android** — install to home screen; launches standalone with icon | [ ] |
| 26 | **PWA iOS** — Safari Add to Home Screen; standalone launch | [ ] |
| 27 | **10-minute session** — no console errors; `window.__podErrors` empty after play | [ ] |
| 28 | **FPS overlay Home** — counter visible top-right on Home scene | [ ] |
| 29 | **FPS overlay combat** — counter left of combat menu button | [ ] |
| 30 | **30 FPS combat** — FPS overlay ≥30 sustained during horde/mid combat on mid Android | [ ] |

### Optional manual (plan §6.2 / §13)

| Item | Done |
|------|------|
| Lighthouse PWA installable badge on production URL | [ ] |
| GPU overdraw overlay — no hotspots during horde (Chrome remote debugging) | [ ] |
| Initial load &lt;5s on 4G (excl. first SW cache) | [ ] |
| Bundle gzip &lt;2.5MB initial JS | [ ] |

---

## Sign-off

- [ ] All **§A automated** gates green on release commit
- [ ] All **§B** rows checked on target device
- [ ] Captain approves `git tag v0.1.0-mvp`

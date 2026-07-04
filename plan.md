# Path of Dao — PROD Release Plan

> **Purpose:** Ship the game to real players. The core loop is shaped and automated tests are green — **stop adding features**. This plan covers only what blocks a safe public release.
>
> **Spec reference:** [plans/index.md](./plans/index.md) · **Progress:** [tracks/index.md](./tracks/index.md)  
> **Manual QA script:** [handbook/SHIP_CHECKLIST.md](./handbook/SHIP_CHECKLIST.md)  
> **Target version:** `v0.1.0` (first public PROD tag)

---

## 1. What PROD means here

| Layer | Meaning for this release |
|-------|--------------------------|
| **PROD (this plan)** | Stable, installable, performant enough on target phones, both locales **functional**, deploy live, manual QA signed off |
| **MVP (done enough)** | Full road playable, save/Echoes/Path wired — **do not expand scope** |
| **Nice-to-have (defer)** | Literary tone, real OGG audio, boss pattern redesign, awakening VFX polish, BGM crossfade, TWA/Play Store, new content |

**Rule:** If a task does not appear in [SHIP_CHECKLIST.md](./handbook/SHIP_CHECKLIST.md) or block a checklist item, it is **not PROD**.

---

## 2. Current baseline (2026-07-03)

Already signed off — treat as fixed unless a PROD gate fails:

- 384 unit tests + 37 E2E tests green (`npm test`, `npm run test:e2e`)
- Fresh-save ch1–10 road, Echoes paths, world map lock, save reload (automated)
- PWA foundation: manifest, SW, quality profiles, app icons, CI jobs
- Procedural audio + combat juice wired

**PROD gap:** manual device QA, Lighthouse PWA, 10-min console-clean playthrough, vi layout spot-check, deploy to public URL.

---

## 3. Out of scope (explicit defer list)

Do **not** start these before `v0.1.0` is tagged:

| Item | Why deferred |
|------|----------------|
| Real OGG asset migration | Procedural SFX/BGM is shippable for v0.1 |
| Distinct boss pattern redesign (23) | Bosses are beatable; pattern polish is post-launch |
| Literary tone pass ch2–10 (T6) | Story plays; copy quality is content polish |
| World map arc copy (T5) | Functional labels exist |
| ≥6 full awakening VFX | One awakening demo satisfies ship bar |
| BGM crossfade, boss phase sting | Juice polish |
| Google Play TWA / `assetlinks.json` | Web PWA first |
| New maps, skills, heroes, cloud save | Post-MVP backlog |

---

## 4. PROD phases (sequential)

Complete each phase before starting the next. Every step has a **gate** — do not skip.

```
Phase A  Freeze & automated baseline
    ↓
Phase B  Stability (console clean, crash-free)
    ↓
Phase C  Mobile performance
    ↓
Phase D  i18n functional pass
    ↓
Phase E  PWA & deploy
    ↓
Phase F  Manual QA sign-off
    ↓
Phase G  Release tag & smoke on live URL
```

---

### Phase A — Freeze & automated baseline

**Goal:** Confirm the build you ship is the build you tested. No parallel feature work.

| Step | Action | Gate |
|------|--------|------|
| A1 | Create branch `release/v0.1.0` from current main | Branch exists |
| A2 | Run `pnpm typecheck` | Zero errors |
| A3 | Run `pnpm test` | All unit tests green |
| A4 | Run `pnpm run test:e2e` | All E2E green (note 3 seeded ch6–7 cases if still deferred — fix only if they fail on clean save) |
| A5 | Run `pnpm content:validate` (or project equivalent) | No validation errors |
| A6 | Run `pnpm build` | `docs/` + `sw.js` generated |
| A7 | Record commit SHA in this file or release notes | SHA documented |

**Exit criteria:** Clean clone passes A2–A6 on `release/v0.1.0`.

---

### Phase B — Stability

**Goal:** No crashes, no console errors during normal play. Fix **blocking bugs only**.

| Step | Action | Gate |
|------|--------|------|
| B1 | Desktop Chrome: boot → Home → no errors in console | Clean boot |
| B2 | Play ch1 explore: move, attack, dodge, skill, exit Home | Loop completes |
| B3 | Background tab 30s during combat → resume | No crash, input works |
| B4 | Background tab 30s on Home 3D → resume | No crash, scene renders |
| B5 | **10-minute playthrough** (ch1–2 minimum: combat, POI, story, world map) | **Zero console errors** |
| B6 | Triage any error → fix or add to **Blockers** list below | Blockers = 0 for PROD |

**Bug-fix rule:** Only fix regressions found in B1–B5. No refactors, no new systems.

**Blockers log** (fill during B5):

| # | Symptom | File / area | Status |
|---|---------|-------------|--------|
| | | | |

**Exit criteria:** B5 passes on desktop; blockers list empty.

---

### Phase C — Mobile performance

**Goal:** Playable on mid-range Android (Snapdragon 6xx class). Use a real device or throttled profile — emulator alone is not enough for sign-off.

| Step | Action | Gate |
|------|--------|------|
| C1 | Device: boot app, audio unlock once | Overlay works |
| C2 | Combat ch1: sustained **≥ 60 FPS** (up to 120 on high-refresh displays) | ≥ 60 FPS |
| C3 | Home 3D shrine: **≥ 60 FPS** while rotating view | ≥ 60 FPS |
| C4 | Home ↔ combat scene switch | **< 1 s** perceived |
| C5 | Settings → Quality **Low** → enter combat | Hit-stop / shake **disabled** |
| C6 | Settings → Quality **Low** → Home | Aura particles reduced / off |
| C7 | If C2–C4 fail: profile, reduce juice/particles, retest — **no new features** | Gates pass |

**Exit criteria:** C2–C6 pass on one mid-range Android device.

---

### Phase D — i18n functional pass

**Goal:** Vietnamese locale is **readable and complete for navigation** — not a literary rewrite.

| Step | Action | Gate |
|------|--------|------|
| D1 | Settings → language **vi** | Switch persists after reload |
| D2 | Bottom nav: all tabs visible, no clipped text | No overflow |
| D3 | World map: region names, CP badge, lock message | Readable |
| D4 | Home panels: Play, Cultivate, Skills, Echoes, Story | No broken keys (`[missing:…]`) |
| D5 | Combat HUD: HP/mana, pause menu | Readable |
| D6 | Run locale parity lint / `content:validate --strict-i18n` if available | CI-clean |
| D7 | Fix **layout overflow only** on screens that fail D2–D5 | Functional vi |

**Out of scope:** Rewriting ch2–10 story prose (T6). Stub or existing copy is fine if UI works.

**Exit criteria:** D2–D6 pass; no missing keys in critical UI paths.

---

### Phase E — PWA & deploy

**Goal:** Installable app on a public HTTPS URL.

| Step | Action | Gate |
|------|--------|------|
| E1 | Lighthouse → PWA category on production build | **Installable** badge |
| E2 | Verify `manifest.json`: name, icons 192+512, `start_url`, `display: standalone` | Manifest valid |
| E3 | Android Chrome: **Add to Home Screen** / Install | Installed icon opens app |
| E4 | iOS Safari: **Add to Home Screen** (best-effort; document limitations) | Opens standalone |
| E5 | `pnpm build` → commit `docs/` to release branch | Build artifact ready |
| E6 | Enable GitHub Pages: branch `/docs` (or chosen host) | HTTPS URL live |
| E7 | Open **live URL** (not localhost): boot + one combat entry | Works on prod URL |

**Exit criteria:** E1 + E3 + E7 pass.

---

### Phase F — Manual QA sign-off

**Goal:** Human confirmation of [SHIP_CHECKLIST.md](./handbook/SHIP_CHECKLIST.md) on **device + desktop**.

| Step | Action | Gate |
|------|--------|------|
| F1 | Walk checklist **Boot & shell** section | All checked |
| F2 | Walk **Core loop** section | All checked |
| F3 | Walk **Progression** section | All checked |
| F4 | Walk **Content spot-check** (vi locale line) | All checked |
| F5 | Walk **Performance & quality** | All checked |
| F6 | Walk **Save** section | All checked |
| F7 | Fill sign-off table (Dev + QA name/date) | Signed |

**Already automated (skip manual re-test unless regressing):** Echoes E2E, ch1–10 road E2E, save reload E2E, settings version E2E.

**Exit criteria:** Every unchecked box in SHIP_CHECKLIST is checked or explicitly waived with reason.

---

### Phase G — Release

**Goal:** Tagged, deployed, smoke-tested production.

| Step | Action | Gate |
|------|--------|------|
| G1 | Merge `release/v0.1.0` → main (if used) | Main at release SHA |
| G2 | `git tag v0.1.0` | Tag pushed |
| G3 | Final `pnpm build`; deploy `docs/` | Live site updated |
| G4 | Smoke on live URL: boot → Continue Journey → combat → Home → vi | Pass |
| G5 | Update [tracks/index.md](./tracks/index.md): mark 26 PROD complete, bump date | Docs synced |
| G6 | Announce / share URL | Done |

**Exit criteria:** G4 passes on production URL.

---

## 5. Priority order (if time-boxed)

When you can only do one thing today, do it in this order:

1. **B5** — 10-min console-clean playthrough (finds real blockers)
2. **C2–C4** — 60 FPS (120 cap) + scene switch on Android
3. **E1 + E7** — Lighthouse + live deploy smoke
4. **D2–D5** — vi layout on critical screens
5. **F1–F7** — Full checklist sign-off
6. **G2–G4** — Tag and release

---

## 6. PROD definition of done

All must be true:

- [ ] Phase A exit criteria met on release branch
- [ ] 10-minute playthrough with **zero console errors** (desktop + device)
- [ ] ≥ 60 FPS combat on mid-range Android (120 on high-refresh); on-screen FPS counter in top-right HUD
- [ ] Low quality tier disables juice as designed
- [ ] vi locale: nav, world map, settings, combat HUD — no overflow, no missing keys
- [ ] PWA installable (Lighthouse + real Add to Home Screen)
- [ ] Public HTTPS URL serves latest build
- [ ] [SHIP_CHECKLIST.md](./handbook/SHIP_CHECKLIST.md) fully checked with sign-off
- [ ] Git tag `v0.1.0` on deployed commit

---

## 7. Post-PROD backlog (v0.2+)

After tag, resume from [tracks/index.md](./tracks/index.md) in this order:

1. Boss distinct patterns + phase tuning (23, 22)
2. Story tone + ch2–10 literary copy (18, 24, T6)
3. Real OGG audio + BGM crossfade (25)
4. World map arc copy (T5)
5. Seeded E2E ch6–7 fixes
6. TWA / Play Store packaging (26 extension)

---

## 8. Session workflow

For each work session:

1. Pick **one phase step** (e.g. B5, C2).
2. Run the gate test **before** coding.
3. If fail → minimal fix → re-run gate only.
4. Check off step in this file or SHIP_CHECKLIST.
5. Do not start post-PROD backlog items until Section 6 is all checked.

---

*Last updated: 2026-07-03*

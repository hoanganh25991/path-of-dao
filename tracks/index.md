# Path of Dao — Master Track

> **Spec:** [plans/index.md](../plans/index.md)  
> **Detail notes:** [tracks/](./) (one file per sub-plan)  
> **Last updated:** 2026-07-04

This is the **master progress index**. Each sub-plan has a detailed track file under `tracks/` with done/remaining items, verification notes, and Tiên Nghịch gaps where relevant.

---

## Progress snapshot

| Metric | Value |
|--------|-------|
| Sub-plans done | **18 / 28** (64%) |
| In progress | **9** (incl. 26 — PWA foundation) |
| Pending | **0** |
| Cross-cutting | Tiên Nghịch alignment **7 / 8 done** (T5–T6 landed 2026-07-04) |
| Active thread | **Base flow `[x]`** — 37 E2E automated sign-off · cultivation HUD + map intro (13) |

### By phase

| Phase | Sub-plans | Status |
|-------|-----------|--------|
| **0 — Foundation** | 01–02 | `[x]` Complete |
| **1 — Core Engine** | 03–05 | `[x]` Complete |
| **2 — 2D Combat** | 06–09 | `[x]` Complete *(Tiên Nghịch gaps in 07)* |
| **3 — 3D Home** | 10–12 | `[x]` Complete *(Tiên Nghịch gaps in 10, 11)* |
| **4 — Progression** | 13–16 | `[x]` Complete *(Tiên Nghịch gaps in 14, 15)* |
| **5 — World & Content** | 17–20 | `[~]` 17 done; 18–20 in progress |
| **6 — MVP Content** | 21–23 | `[~]` All in progress |
| **7 — Polish & Ship** | 24–26 | `[~]` 24–25 in progress; **26 foundation landed** |
| **Cross** | 27 | `[x]` Ancient Echo demo done |
| **Cross** | 28 | `[x]` Path & Journey — My Path + guided ancient walk |

**Critical path:** `01 → 03 → 06 → 13 → 17 → 21 → 24` — through **17** complete; **21** and **24** active.

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| `[x]` | Done — acceptance criteria met for this sub-plan |
| `[~]` | In progress — core shipped; gaps or polish remain |
| `[ ]` | Pending — not started or blocked |

*(Tiên Nghịch gap open)* — sub-plan marked done but a design-alignment item (T1–T8) still needs work. See [tracks/tien-nghich-alignment.md](./tien-nghich-alignment.md).

---

## Sub-plan master table

| ID | Title | Phase | Status | Detail | Plan |
|----|-------|-------|--------|--------|------|
| 01 | Project scaffold & tooling | 0 | `[x]` | [track](./01-project-scaffold.md) | [plan](../plans/01-project-scaffold.md) |
| 02 | Scene router & app shell | 0 | `[x]` | [track](./02-scene-router-app-shell.md) | [plan](../plans/02-scene-router-app-shell.md) |
| 03 | One-thumb input & virtual joystick | 1 | `[x]` | [track](./03-input-touch-controls.md) | [plan](../plans/03-input-touch-controls.md) |
| 04 | Stat sheet & RPG core formulas | 1 | `[x]` | [track](./04-stat-sheet-rpg-core.md) | [plan](../plans/04-stat-sheet-rpg-core.md) |
| 05 | Save system foundation | 1 | `[x]` | [track](./05-save-system-foundation.md) | [plan](../plans/05-save-system-foundation.md) |
| 06 | Phaser map scene base & camera | 2 | `[x]` | [track](./06-phaser-map-scene-base.md) | [plan](../plans/06-phaser-map-scene-base.md) |
| 07 | Player controller & basic combat | 2 | `[x]`* | [track](./07-player-controller-combat.md) | [plan](../plans/07-player-controller-combat.md) |
| 08 | Enemy system & AI archetypes | 2 | `[x]` | [track](./08-enemy-system-ai.md) | [plan](../plans/08-enemy-system-ai.md) |
| 09 | Hitboxes, damage, i-frames | 2 | `[x]` | [track](./09-hitbox-damage-combat-math.md) | [plan](../plans/09-hitbox-damage-combat-math.md) |
| 10 | Three.js home scene & hero viewer | 3 | `[x]`* | [track](./10-threejs-home-scene.md) | [plan](../plans/10-threejs-home-scene.md) |
| 11 | Equipment slots & 3D preview | 3 | `[x]`* | [track](./11-equipment-3d-preview.md) | [plan](../plans/11-equipment-3d-preview.md) |
| 12 | Home UI panels & navigation | 3 | `[x]` | [track](./12-home-ui-panels.md) | [plan](../plans/12-home-ui-panels.md) |
| 13 | Cultivation realm & breakthrough | 4 | `[x]` | [track](./13-cultivation-realm-system.md) | [plan](../plans/13-cultivation-realm-system.md) |
| 14 | Insight progression & awakenings | 4 | `[x]`* | [track](./14-insight-system.md) | [plan](../plans/14-insight-system.md) |
| 15 | Fortuitous encounter events | 4 | `[~]` | [track](./15-fortuitous-encounters.md) | [plan](../plans/15-fortuitous-encounters.md) |
| 16 | Combat power & character profile | 4 | `[x]` | [track](./16-combat-power-profile.md) | [plan](../plans/16-combat-power-profile.md) |
| 17 | World map & free travel | 5 | `[x]` | [track](./17-world-map-travel.md) | [plan](../plans/17-world-map-travel.md) |
| 18 | Chapter flow & story scenes | 5 | `[~]` | [track](./18-chapter-story-system.md) | [plan](../plans/18-chapter-story-system.md) |
| 19 | Skill executor & cultivation VFX | 5 | `[~]` | [track](./19-skill-executor-vfx.md) | [plan](../plans/19-skill-executor-vfx.md) |
| 20 | Content pipeline & validators | 5 | `[~]` | [track](./20-content-pipeline.md) | [plan](../plans/20-content-pipeline.md) |
| 21 | MVP maps: chapters 1–5 | 6 | `[~]` | [track](./21-mvp-maps-chapters-1-5.md) | [plan](../plans/21-mvp-maps-chapters-1-5.md) |
| 22 | MVP maps: chapters 6–10 | 6 | `[~]` | [track](./22-mvp-maps-chapters-6-10.md) | [plan](../plans/22-mvp-maps-chapters-6-10.md) |
| 23 | MVP enemies, bosses, skill data | 6 | `[~]` | [track](./23-mvp-enemies-bosses-skills.md) | [plan](../plans/23-mvp-enemies-bosses-skills.md) |
| 24 | Localization en + vi | 7 | `[~]` | [track](./24-localization-en-vi.md) | [plan](../plans/24-localization-en-vi.md) |
| 25 | Audio, aura VFX, juice | 7 | `[~]` | [track](./25-audio-vfx-polish.md) | [plan](../plans/25-audio-vfx-polish.md) |
| 26 | PWA, performance, ship checklist | 7 | `[~]` | [track](./26-pwa-performance-ship.md) | [plan](../plans/26-pwa-performance-ship.md) |
| 27 | Echoes of the Ancients (guided demo) | Cross | `[x]` | [track](./27-ancient-echo-demo.md) | [plan](../plans/27-ancient-echo-demo.md) |
| 28 | Path & Journey (My Path + follow ancients) | Cross | `[x]` | [track](./28-path-journey-system.md) | [plan](../plans/28-path-journey-system.md) |

\* Done for sub-plan scope; Tiên Nghịch alignment items still open — see below.

---

## Tiên Nghịch alignment (T1–T8)

**Detail:** [tracks/tien-nghich-alignment.md](./tien-nghich-alignment.md)  
**Story reference:** [handbook/tien-nghich-reference.md](../handbook/tien-nghich-reference.md) · skill `tien-nghich`  
**Spec:** [plans/index.md §1.1, §7.7, §7.8](../plans/index.md)  
**Suggested order:** T4 → T1 → T2 → T3 → T7 → T6 → T5 → T8

| # | Requirement | Status | Owner tracks |
|---|-------------|--------|--------------|
| T1 | New game **unarmed** — hand/kick 3-hit combo, no sword equipped | `[x]` | 07, 11 |
| T2 | **Ancient Spirit Sword** from shrine POI in chapters 1–2 | `[x]` | 15, 21 |
| T3 | Equipping ancient sword **swaps** combo to sword + unlocks Sword Intent | `[x]` | 07, 14, 23 |
| T4 | Remove **starter wood sword** from default new game loadout | `[x]` | 05, 11 |
| T5 | **Map-by-map road** — world map labels + Phong Giới cosmic barrier | `[x]` | 17, 21, 22 |
| T6 | **Chapter stories** — Vương Lâm diary tone, Thiên Nghịch ch1–2 | `[x]` | 18, 24 |
| T7 | **Sword Intent gating** in skill picker and combat | `[x]` | 19, 23 |
| T8 | **3D Home** shows empty hands until sword milestone | `[x]` | 10, 11 |

---

## MVP definition of done

From [plans/index.md §12](../plans/index.md). Checked items reflect current build state.

- [x] Echoes of the Ancients — six focused demo walks; combat-first god-mode (sub-plan 27)
- [x] Path & Journey — My Path scroll + guided ancient walk (sub-plan 28)
- [x] Player can: boot → Home → pick map → combat → clear/fail → save → return Home
- [x] **New game starts unarmed** — punch/kick combo (`hero_strike_*`); no sword in weapon slot (T1, T4)
- [x] **Ancient Spirit Sword** obtainable from map POI (ch1–2); equipping enables sword combo + Sword Intent (T2, T3)
- [~] All 10 chapters playable with end-of-chapter story scene (18 flow wired; tone T6)
- [~] 20 maps traversable from world map with difficulty hints; Continue Journey on Play (17; copy T5)
- [ ] 8 boss fights with distinct patterns (23)
- [~] 40 skills equippable; earned on road — all 10 explore clears + chapter/boss/level hooks wired; Sword Intent **gated** until ancient sword
- [x] Insight meter visible; awakening toast + Skills ceremony (14)
- [x] ≥3 fortuitous encounter types functional including ancient sword (15)
- [x] Realm breakthrough flow works once — Cultivate + ready toast (13)
- [x] Combat power displayed in Home profile (16)
- [x] Aura visible in 3D Home per realm tier (10)
- [x] Save anywhere (pause menu + autosave on map exit) (05)
- [ ] Full UI in English and Vietnamese (24)
- [ ] PWA installable; 30 FPS on mid-range Android (26)
- [ ] No console errors in 10-minute playthrough (26)

---

## Active thread

**Base flow `[x]` signed off** (2026-07-03)

| Automated E2E | Coverage |
|---------------|----------|
| Fresh-save full road ch1–10 | Begin Journey → all maps/stories/skills → journey complete |
| Echoes Follow Their Path | breakthrough sage (2 maps → story → Home) |
| Echoes Walk Here | god-mode combat → pause home → real save restored |
| Echoes sword ancestor path | 3 boss maps + 3 interleaved story beats |
| World map portal | fresh save → Fallen Village node unlocked |
| World map lock | ch2 region shows chapter gate + disabled Enter |
| Save reload | ch1 explore clear → reload → Void Slash + Continue Journey |
| Settings version | `0.1.0-mvp` in settings modal |
| MVP smoke | boot → combat → vi locale |

- **384 unit tests** · **37 E2E tests** (`pnpm test:e2e`); 3 seeded ch6–7 cases deferred

**Next:** Sub-plan **26** manual ship checklist (Lighthouse, 30 FPS device, 10-min QA)

**Deferred:** story tone (T6), world copy (T5), boss pattern polish (23), audio OGG (25), seeded ch6–7 E2E fixes

---

## Detail tracks — in progress

### 15 — Fortuitous encounters `[x]`

| Done | Remaining |
|------|-----------|
| Six encounter types, roll tables, POI triggers | — |
| Modal pause flow, rewards; ancient sword milestone | — |
| My Path journey + fortune toast on claim | — |

→ [full track](./15-fortuitous-encounters.md)

### 18 — Chapter & story system `[~]`

| Done | Remaining |
|------|-----------|
| Ten chapter stubs, story reader, archive replay | Literary tone pass all chapters (T6) |
| Chapter 1 full en/vi copy | Sword destiny beat in ch1–2 slides |
| Clear-on-exit advances chapter; rewards once | Expand ch1 narrative to tease ancient blade |

→ [full track](./18-chapter-story-system.md)

### 19 — Skill executor & VFX `[~]`

| Done | Remaining |
|------|-----------|
| Cast pipeline, composable effects, VFX presets | Sword Intent gating in executor + picker (T7) |
| Cooldown manager; awakened void/flame behaviors | Audio sync on cast/impact frames |
| Extended skill schema validated at load | More unique VFX beyond presets |

→ [full track](./19-skill-executor-vfx.md)

### 20 — Content pipeline `[~]`

| Done | Remaining |
|------|-----------|
| Zod validate-all, cross-ref lint, content loader | Expand lint as MVP content grows |
| Pack command, ID/CP/Tiled docs | Optional CI gate on `content:validate` |
| 249+ unit tests green at last run | |

→ [full track](./20-content-pipeline.md)

### 21 — MVP maps ch1–5 `[~]`

| Done | Remaining |
|------|-----------|
| 10 procedural maps (5 regions × explore/ordeal) | Ch1 should teach unarmed combat before any blade |
| Ancient sword shrine POI on ch1 ordeal map | End-to-end POI reward → milestone flow (T2) |
| 16 enemies, CP bands, hidden caves ch3–5 | Region polish and balance pass |

→ [full track](./21-mvp-maps-chapters-1-5.md)

### 22 — MVP maps ch6–10 `[~]`

| Done | Remaining |
|------|-----------|
| 10 endgame maps, five visual themes | Arc copy/tone for tribulation → void (T5) |
| Void Throne 56×42 finale; CP ~45k–320k | Boss pattern and phase tuning |
| 19 enemies; hidden caves ch6, 8, 10 | Playthrough balance on CP bands |

→ [full track](./22-mvp-maps-chapters-6-10.md)

### 23 — Enemies, bosses, skills `[~]`

| Done | Remaining |
|------|-----------|
| 40 skills, 41 enemies, loot tables, unlock hooks | Sword Intent requires ancient sword (T7) |
| Boss phase tracker; en/vi skill strings | Distinct patterns for all 8 MVP bosses |
| 292+ unit tests green at last run | ≥6 skills with full awakening VFX |

→ [full track](./23-mvp-enemies-bosses-skills.md)

### 24 — Localization en + vi `[~]`

| Done | Remaining |
|------|-----------|
| Locale manager, parity lint, glossary, Noto Sans | Full UI audit in both locales |
| System/home/world/story/skills/enemies/bestiary files | Ch2–10 translated literary copy (18, T6) |
| 41 bestiary entries; settings language picker | Vietnamese layout overflow pass |
| 300+ unit tests green at last run | |

→ [full track](./24-localization-en-vi.md)

### 25 — Audio & VFX polish `[~]`

| Done | Remaining |
|------|-----------|
| Web Audio buses; **26 procedural SFX**, **6 BGM** with mood profiles | Replace with real OGG assets |
| Preset synthesis (impacts, skills, stings, loot); crit + duck mix | File playback in AudioManager |
| First-visit unlock overlay; silent resume on return | Boss telegraph SFX (no event yet) |
| BGM crossfade; per-map BGM (Fallen Village melancholy) | Low-end juice disable profile (26) |
| Hit-stop, camera shake, crit flash | Boss phase screen darken (visual) |
| `ui.panel_open` + `loot.pickup` wired; UI bus tier | Dedicated UI volume slider |
| Home aura pulse Core Formation+ | `player.land` (no jump mechanic) |

→ [full track](./25-audio-vfx-polish.md)

### 26 — PWA & ship `[~]`

| Done | Remaining |
|------|-----------|
| QualityProfile; low tier disables juice + aura particles | Real app icons |
| vite-plugin-pwa, manifest, SW; CI unit + e2e jobs | Lighthouse PWA audit |
| E2E smoke: home → ch1 combat → home → vi locale | Manual SHIP_CHECKLIST sign-off |
| `handbook/SHIP_CHECKLIST.md`; version in settings | 30 FPS throttled Android verification |

→ [full track](./26-pwa-performance-ship.md)

### 28 — Path & Journey `[x]`

| Done |
|------|
| My Path scroll, journey recording, ancient `path[]` data |
| PathWalkManager guided walk (map → story → map → Home) |
| Modal **Their Road** + Follow / Walk Here; en/vi strings |
| 334 tests green |

→ [full track](./28-path-journey-system.md)

---

## Detail tracks — done (reference)

Sub-plans **01–14**, **16–17**, **27–28** are complete for their acceptance criteria. Remaining Tiên Nghịch gaps tracked under T5–T6 above (story tone, world copy).

| ID | Highlight |
|----|-----------|
| 01–06 | Scaffold, router, input, stats, save, Phaser map base |
| 07 | Player combat loop — unarmed strikes + weapon-prop combo swap (T1, T3) |
| 08–09 | Enemy AI, hitboxes & damage math |
| 10–12 | Three.js Home, equipment preview, Home UI panels *(empty hands T8)* |
| 13–14 | Realm breakthrough, insight meter *(Sword gate T7)* |
| 16–17 | Combat power profile, world map travel |
| 27 | Ancient Echo demo — six ancients, god mode, Echoes tab |
| 28 | Path & Journey — My Path scroll + guided ancient walk |

→ Per-sub-plan notes in [tracks/](./)

---

## Parallel work guide

| After completing | Can start in parallel |
|------------------|----------------------|
| 05 | 06 (combat) + 10 (home) — **both done** |
| 09 | 13, 14, 15 — **13–16 done; 15 in progress** |
| 12 + 09 | 17, 18, 19 — **17 done; 18–19 in progress** |
| 13–15 | 27 — **done** |
| 20 | 21, 22, 23 — **all in progress** |
| 25 | 26 — **next** |

---

## How to update this file

1. Implement work against a sub-plan in `plans/`.
2. Update the matching detail file in `tracks/` (done / remaining / verification).
3. Refresh status symbols and this master table when a sub-plan crosses done or picks up new gaps.
4. For Tiên Nghịch items, update [tracks/tien-nghich-alignment.md](./tien-nghich-alignment.md) and the T1–T8 table here.

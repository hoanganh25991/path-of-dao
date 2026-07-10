# Implementation Plans Index

Detailed sub-plans for **Path of Dao / Void Ascension** MVP.  
Master document: [index.md](./index.md) · Progress: [tracks/index.md](../tracks/index.md)

**Source of truth:** `plans/` only. The `planning/` workshop folder was retired (2026-07); all
active specs live here. Cross-cutting canon docs: [`fake-2.5d.md`](./fake-2.5d.md), [`map-design-canon.md`](./map-design-canon.md), [`vfx-juice-tiers.md`](./vfx-juice-tiers.md), [`combat-defeat-canon.md`](./combat-defeat-canon.md).

---

## How to Use These Plans

1. **Read the master plan first** — architecture, phases, Definition of Done, **§2.1 landscape canon**.
2. **Solo dev:** sub-plans in numeric order (safe default).
3. **Team / multi-agent:** use master plan **§5.1 workstreams** and **§5.3 parallel bands** —
   assign one track per person; integrate at **§5.2 contract boundaries**.
4. **Do not skip acceptance criteria** — each sub-plan is a quality gate.
5. **Run validators** after any content sub-plan: `pnpm content:validate`
6. Mark a sub-plan complete only when all checkboxes in its **Acceptance Criteria** section pass.
7. **Quick check before hand-off** — after a batch of features, run [`34-quick-check-smoke-devtools.md`](./34-quick-check-smoke-devtools.md): `pnpm smoke:test` plus a Chrome DevTools console pass on Home and combat (**C** in dev).

**Vocabulary:** combat depth is **Fake 2.5D** on **Phaser 3.60+** — see [`fake-2.5d.md`](./fake-2.5d.md). Home is real Three.js 3D.

---

## Phase Overview

Phases gate *integration*; **sub-plans inside a phase are designed to parallelize**. See
[index.md §5](./index.md#5-implementation-phases).

| Phase | Sub-plans | Theme | Parallel with (after gate) |
|-------|-----------|-------|----------------------------|
| 0 Foundation | 01–02 | Scaffold, scene router | serial |
| 1 Core Engine | 03–05 | Input, stats, save | `03` ∥ `04` after `02` |
| 2 2D Combat | 06–09 | Maps, player, enemies, damage | Track A — ∥ Phase 3 after `05` |
| 3 3D Home | 10–12 | Hero viewer, equipment, UI | Track B — ∥ Phase 2 after `05` |
| 4 Progression | 13–16 | Realm, insight, encounters, CP | `13→14→15` chain; `16` ∥ `17` |
| 5 World Systems | 17–20 | Travel, story, skills, content tools | `20` early; `17`/`18`/`19` split |
| 6 MVP Content | 21–23 | Maps, enemies, skills data | **all three ∥** after `20` |
| 7 Ship | 24–26 | i18n, polish, PWA | **all three ∥** after content |

**Cross-cutting** (`27`–`34`): run alongside main tracks once their deps are met — not a separate
phase. **`32` design-arts** after `02` · **`33` item-system** after `05` · **`34` quick-check** before marking batches done. See master plan §5.0–§5.1.

---

## Five parallel tracks (after Phase 1)

```
Gate: 02 (src layout) done
├── Track DA — Design Arts:  design-arts/ (DA-01 hero, DA-04 icons, …)  ← START WITH BAND 1
Gate: 05 (save) done
├── Track IS — Item system:  item-system/ (drops, random, equip)  ← parallel with 11, 15
├── Track A — Combat:     06 → 07 → 08 → 09
├── Track B — Home:       10 → 11 → 12
├── Track C — Validators: 20  (start immediately after 05)
├── Track D — Progression: 13 → 14 → 15 → 16  (after 09)
└── Track E — World/Data:  17 → 18; 19; 21 ∥ 22 ∥ 23
```

**Critical path** (if everything serial):  
`01 → 02 → 04 → 05 → 06 → 07 → 09 → 13 → 14 → 17 → 21 → 24 → 26`

Most work is **off** the critical path — especially Home, content tools, cross-cutting specs, and
content authoring splits.

---

## Sub-Plan Catalog

| # | Plan | Effort | Hard deps | Parallel with |
|---|------|--------|-----------|---------------|
| 01 | [Project scaffold](./01-project-scaffold.md) | 4–6h | — | — |
| 02 | [Scene router & app shell](./02-scene-router-app-shell.md) | 6–8h | 01 | — |
| 03 | [Input & touch controls](./03-input-touch-controls.md) | 6–8h | 02 | 04 |
| 04 | [Stat sheet & RPG core](./04-stat-sheet-rpg-core.md) | 6–8h | 01 | 03 |
| 05 | [Save system](./05-save-system-foundation.md) | 8–10h | 04 | — |
| 06 | [Phaser map scene base](./06-phaser-map-scene-base.md) | 8–10h | 02, 05 | 10, 20 |
| 07 | [Player controller & combat](./07-player-controller-combat.md) | 10–12h | 03, 04, 06 | 11 |
| 08 | [Enemy system & AI](./08-enemy-system-ai.md) | 10–12h | 06, 07 | 11, 12 |
| 09 | [Hitboxes & damage](./09-hitbox-damage-combat-math.md) | 8–10h | 04, 07, 08 | 12, 13 |
| 10 | [Three.js home scene](./10-threejs-home-scene.md) | 10–14h | 02, 05 | 06, 20 |
| 11 | [Equipment 3D preview](./11-equipment-3d-preview.md) | 8–10h | 04, 10 | 08, 07 |
| 12 | [Home UI panels](./12-home-ui-panels.md) | 10–12h | 10, 11, 05 | 08, 09, 13 |
| 13 | [Cultivation realm](./13-cultivation-realm-system.md) | 10–12h | 04, 05, 09 | 17 |
| 14 | [Insight system](./14-insight-system.md) | 12–14h | 13, 07 | 19 |
| 15 | [Fortuitous encounters](./15-fortuitous-encounters.md) | 10–12h | 06, 05, 14 | 27 |
| 16 | [Combat power & profile](./16-combat-power-profile.md) | 6–8h | 04, 11, 13, 14 | 17 |
| 17 | [World map & travel](./17-world-map-travel.md) | 12–16h | 12, 16, 06 | 18, 19, 21 |
| 18 | [Chapter & story system](./18-chapter-story-system.md) | 10–12h | 12, 17, 05 | 19, 31 |
| 19 | [Skill executor & VFX](./19-skill-executor-vfx.md) | 12–16h | 07, 09, 14 | 17, 21, 23 |
| 20 | [Content pipeline](./20-content-pipeline.md) | 8–10h | 05 | 06–12 |
| 21 | [Maps chapters 1–5](./21-mvp-maps-chapters-1-5.md) | 16–20h | 06–20 | 22, 23, 32, 31 |
| 22 | [Maps chapters 6–10](./22-mvp-maps-chapters-6-10.md) | 16–20h | 21 | 23, 24, 32 |
| 23 | [Enemies, bosses, skills data](./23-mvp-enemies-bosses-skills.md) | 12–16h | 08, 19, 20, 21 | 21, 22, 32 |
| 24 | [Localization en/vi](./24-localization-en-vi.md) | 10–14h | 12, 18, 20–23 | 25, 26, 32 |
| 25 | [Audio & VFX polish](./25-audio-vfx-polish.md) | 10–14h | 10, 13, 19, 21, 23 | 24, 26, 29 |
| 26 | [PWA & ship](./26-pwa-performance-ship.md) | 10–12h | integration | 24, 25 |
| 27 | [Echoes of the Ancients (demo)](./27-ancient-echo-demo.md) | 8–10h | 13–15 | 16, 28, 30 |
| 28 | [Path & Journey](./28-path-journey-system.md) | 10–12h | 13, 16, 17, 18, 27 | 31 |
| 29 | [Combat visual integration](./29-pixel-art-combat-canon.md) | Spec + QA | 06+ | consumes 32; [fake-2.5d.md](./fake-2.5d.md) |
| 30 | [Divine Arts wheel loadout](./30-divine-arts-wheel-loadout.md) | Spec + editor | 03, 12, 14, 27 | 12, 27 |
| 31 | [Wang Lin story timeline](./31-wang-lin-story-timeline.md) | 12–16h | 18, 17, 28 | 21, 22, 32 |
| 32 | **[Design Arts](./design-arts/index.md)** | Rolling | **`02`** | all tracks |
| 33 | **[Item & loot system](./item-system/index.md)** | Rolling | **`05`** | 11, 15, design-arts/items |
| 34 | [Quick check — smoke + DevTools](./34-quick-check-smoke-devtools.md) | ~15m | `02`, smoke runner | any batch hand-off |

**Total estimated effort:** ~240–310 hours (solo dev, implementation only — excludes art/audio production)

---

## Contract boundaries (sync before merging)

| Contract | Owner | Rule |
|----------|-------|------|
| `PlayerSave` schema | 05 | One migration per version bump |
| Content IDs | 20 | Validators pass before map/skill PRs merge |
| 6-slot wheel | 30 | Slot names fixed; no 7th slot |
| Combat controls | 03 | Wheel + Dash + Gather Qi + **FPS overlay** (always on) + combat menu |
| **Fake 2.5D depth** | [fake-2.5d.md](./fake-2.5d.md) · `06` | `07`–`09`, `29`, maps `21`–`22`, DA-09 | HD-2D read: y-sort, layered props, Light2D (quality-gated), sprite shadows |
| **Map world canon** | [map-design-canon.md](./map-design-canon.md) · `20` | `06`, `17`, `21`–`22`, DA-09 | 100× play area, settlements, signature tree per map |
| Asset paths + anim keys | 32 / DA-08 | Drop PNG → auto-load; sync keys with 29 |
| Loot tables + item IDs | 33 / item-system | `loot.*` → `item.*`; missing icon = warn |
| Home shell | 12 | `\|nav\|·\|3D\|·\|panel\|` — panel bodies plug in |

Full table: [index.md §5.2](./index.md#52-contract-boundaries-coordinate-dont-collide)

---

## Design Source Mapping

| Design doc concept | Primary sub-plans |
|--------------------|-------------------|
| One-thumb controls | 03, 07 |
| 3D Home shrine | 10, 11, 12 |
| 10 chapters / 20 maps | 17, 21, 22, [map-design-canon.md](./map-design-canon.md) |
| Cultivation realms | 13, 16, 25 |
| Insight awakenings | 14, 19 |
| Fortuitous encounters | 15 |
| Story at chapter end | 18 |
| Wang Lin timeline (Dao Scroll) — every map | 31 |
| en/vi localization | 24 |
| Save anywhere | 05 |
| 40 skills / 25 enemies / 8 bosses | 08, 19, 23 |
| Dharma Treasures / loot | **33** [item-system/](./item-system/index.md), 11, 15 |
| Item pixel icons | **32** [design-arts/items/](./design-arts/items/index.md) |
| Combat art integration | 29 (hooks, juice) + [fake-2.5d.md](./fake-2.5d.md) (2.5D pixel rendering) |
| Divine Arts 6-slot assignment | 30, 12, 14 |

---

## Design arts vs combat integration

| Layer | Plan | What |
|-------|------|------|
| **Author sprites/icons** | **[design-arts/](./design-arts/index.md)** (32) | Hero, enemies, bosses, wheel icons, treasures, VFX sheets |
| **Play in combat** | [29](./29-pixel-art-combat-canon.md) + [fake-2.5d.md](./fake-2.5d.md) | Anim keys, Fake 2.5D depth, camera, juice |

**Kick off DA-01 (hero) in Band 1** — right after `02` — do not wait for Band 6.

### design-arts sub-tasks

| DA | File | Delivers |
|----|------|----------|
| 01 | [hero.md](./design-arts/hero.md) | Wanderer sprite sheets |
| 02 | [enemies-minions.md](./design-arts/enemies-minions.md) | 25 enemy types |
| 03 | [bosses-cultivators.md](./design-arts/bosses-cultivators.md) | 8 bosses |
| 04 | [wheel-icons.md](./design-arts/wheel-icons.md) | 24×24 skill icons |
| 05 | [items/](./design-arts/items/index.md) | 24×24 Dharma Treasure icons (DI-01…03) |
| 06 | [ancient-echoes.md](./design-arts/ancient-echoes.md) | Echo themes |
| 07 | [vfx-spritesheets.md](./design-arts/vfx-spritesheets.md) | Impact sheets |
| 08 | [08-auto-wire-pipeline.md](./design-arts/08-auto-wire-pipeline.md) | Drop-in manifest |
| 09 | [map-props.md](./design-arts/map-props.md) | Structures, villages, 20 signature trees |

### Plan 29 integration map (consumes design-arts)

| Plan | Canon sections |
|------|----------------|
| 03, 12, 30 | §9.8 wheel HUD (icons from DA-04) |
| 06, 25, 26 | §2–§3, [`fake-2.5d.md`](../fake-2.5d.md), §2.6 camera |
| 07 | §0.1 anim keys (sheets from DA-01) |
| 08, 21, 22, 23 | §5–§6 (textures from DA-02/03) |
| 21, 22 | §2.5 environment + DA-09 map props ([map-design-canon.md](./map-design-canon.md)) |
| 09 | §3.1 juice + hit frame sync |
| 14, 19 | §8–§9 Intent VFX (sheets from DA-07) |
| 15, 11, 12 | §10 treasures (icons from DA-05) |
| 27 | §7 ancients (DA-06) |
| 20 | §11 schema + DA-08 validator |

Handbook rig/how-to: [handbook/pixel-art-style.md](../handbook/pixel-art-style.md).

---

## Pixel art canon coverage (legacy pointer)

See **Design arts vs combat integration** above. Old "plan 29 owns all art" split is superseded (2026-07).

---

## Next Action

**Current (2026-07-07):** Most sub-plans done — see [tracks/index.md](../tracks/index.md).
Parallel work remaining: `26` ship QA · **`32` design-arts** (DA-01 hero, DA-04/05 icons) · `29` integration QA · `31` timeline art polish.

**Greenfield:** start [01-project-scaffold.md](./01-project-scaffold.md), then Band 1
(`03` + `04` + **[design-arts/](./design-arts/index.md)**) per [index.md §5.3](./index.md#53-parallel-bands-quick-reference).

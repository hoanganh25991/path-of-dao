# Implementation Plans Index

Detailed sub-plans for **Path of Dao / Void Ascension** MVP.  
Master document: [index.md](./index.md)

---

## How to Use These Plans

1. **Read the master plan first** — architecture, phases, data models, Definition of Done.
2. **Execute sub-plans in numeric order** unless the master plan lists a safe parallel pair.
3. **Do not skip acceptance criteria** — each sub-plan is a quality gate.
4. **Run validators** after any content sub-plan: `pnpm content:validate`
5. Mark a sub-plan complete only when all checkboxes in its **Acceptance Criteria** section pass.

---

## Phase Overview

| Phase | Sub-plans | Theme |
|-------|-----------|-------|
| 0 Foundation | 01–02 | Scaffold, scene router |
| 1 Core Engine | 03–05 | Input, stats, save |
| 2 2D Combat | 06–09 | Maps, player, enemies, damage |
| 3 3D Home | 10–12 | Hero viewer, equipment, UI |
| 4 Progression | 13–16 | Realm, insight, encounters, CP |
| 5 World Systems | 17–20 | Travel, story, skills, content tools |
| 6 MVP Content | 21–23 | Maps, enemies, skills data |
| 7 Ship | 24–26 | i18n, polish, PWA |

---

## Sub-Plan Catalog

| # | Plan | Effort | Depends On |
|---|------|--------|------------|
| 01 | [Project scaffold](./01-project-scaffold.md) | 4–6h | — |
| 02 | [Scene router & app shell](./02-scene-router-app-shell.md) | 6–8h | 01 |
| 03 | [Input & touch controls](./03-input-touch-controls.md) | 6–8h | 02 |
| 04 | [Stat sheet & RPG core](./04-stat-sheet-rpg-core.md) | 6–8h | 01 |
| 05 | [Save system](./05-save-system-foundation.md) | 8–10h | 04 |
| 06 | [Phaser map scene base](./06-phaser-map-scene-base.md) | 8–10h | 02, 05 |
| 07 | [Player controller & combat](./07-player-controller-combat.md) | 10–12h | 03, 04, 06 |
| 08 | [Enemy system & AI](./08-enemy-system-ai.md) | 10–12h | 06, 07 |
| 09 | [Hitboxes & damage](./09-hitbox-damage-combat-math.md) | 8–10h | 04, 07, 08 |
| 10 | [Three.js home scene](./10-threejs-home-scene.md) | 10–14h | 02, 05 |
| 11 | [Equipment 3D preview](./11-equipment-3d-preview.md) | 8–10h | 04, 10 |
| 12 | [Home UI panels](./12-home-ui-panels.md) | 10–12h | 10, 11, 05 |
| 13 | [Cultivation realm](./13-cultivation-realm-system.md) | 10–12h | 04, 05, 09 |
| 14 | [Insight system](./14-insight-system.md) | 12–14h | 13, 07 |
| 15 | [Fortuitous encounters](./15-fortuitous-encounters.md) | 10–12h | 06, 05, 14 |
| 16 | [Combat power & profile](./16-combat-power-profile.md) | 6–8h | 04, 11, 13, 14 |
| 17 | [World map & travel](./17-world-map-travel.md) | 10–12h | 12, 16, 06 |
| 18 | [Chapter & story system](./18-chapter-story-system.md) | 10–12h | 12, 17, 05 |
| 19 | [Skill executor & VFX](./19-skill-executor-vfx.md) | 12–16h | 07, 09, 14 |
| 20 | [Content pipeline](./20-content-pipeline.md) | 8–10h | 05 |
| 21 | [Maps chapters 1–5](./21-mvp-maps-chapters-1-5.md) | 16–20h | 06–20 |
| 22 | [Maps chapters 6–10](./22-mvp-maps-chapters-6-10.md) | 16–20h | 21 |
| 23 | [Enemies, bosses, skills data](./23-mvp-enemies-bosses-skills.md) | 12–16h | 08, 19, 20, 21 |
| 24 | [Localization en/vi](./24-localization-en-vi.md) | 10–14h | 12, 18, 20–23 |
| 25 | [Audio & VFX polish](./25-audio-vfx-polish.md) | 10–14h | 10, 13, 19, 21, 23 |
| 26 | [PWA & ship](./26-pwa-performance-ship.md) | 10–12h | all |
| 27 | [Echoes of the Ancients (demo)](./27-ancient-echo-demo.md) | 8–10h | 13–15 |
| 28 | [Path & Journey (My Path + ancients)](./28-path-journey-system.md) | 10–12h | 13, 16, 17, 18, 27 |

**Total estimated effort:** ~240–310 hours (solo dev, implementation only — excludes art/audio production)

---

## Critical Path

```
01 → 02 → 06 → 07 → 09 → 13 → 17 → 21 → 22 → 26
```

Parallel after plan 05:

- **Combat track:** 06 → 07 → 08 → 09 → 19
- **Home track:** 10 → 11 → 12

---

## Design Source Mapping

| Design doc concept | Primary sub-plans |
|--------------------|-------------------|
| One-thumb controls | 03, 07 |
| 3D Home shrine | 10, 11, 12 |
| 10 chapters / 20 maps | 17, 21, 22 |
| Cultivation realms | 13, 16, 25 |
| Insight awakenings | 14, 19 |
| Fortuitous encounters | 15 |
| Story at chapter end | 18 |
| en/vi localization | 24 |
| Save anywhere | 05 |
| 40 skills / 25 enemies / 8 bosses | 08, 19, 23 |

---

## Next Action

Start implementation: **[01-project-scaffold.md](./01-project-scaffold.md)**

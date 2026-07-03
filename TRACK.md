# Path of Dao — Master Track

> High-level progress index. Detail lives in [track/](./track/).  
> Spec: [master-plan.md](./master-plan.md) · Design north star: *Tiên Nghịch* — unarmed start, map-by-map road, sword earned on the journey.

**Legend:** `[ ]` pending · `[~]` in progress · `[x]` done

---

## Current focus

| | |
|---|---|
| **Active** | [25 — Audio, VFX, juice](./track/25-audio-vfx-polish.md) |
| **Next** | [26 — PWA & ship](./track/26-pwa-performance-ship.md) |
| **Parallel** | [Tiên Nghịch alignment](./track/tien-nghich-alignment.md) (T4 → T1 → T2 → T3) |

---

## Phase 0 — Foundation

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 01 | Project scaffold & tooling | `[x]` | [track](./track/01-project-scaffold.md) |
| 02 | Scene router & app shell | `[x]` | [track](./track/02-scene-router-app-shell.md) |

## Phase 1 — Core Engine

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 03 | One-thumb input & virtual joystick | `[x]` | [track](./track/03-input-touch-controls.md) |
| 04 | Stat sheet & RPG core formulas | `[x]` | [track](./track/04-stat-sheet-rpg-core.md) |
| 05 | Save system foundation | `[x]` | [track](./track/05-save-system-foundation.md) |

## Phase 2 — 2D Combat *(Track A)*

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 06 | Phaser map scene base & camera | `[x]` | [track](./track/06-phaser-map-scene-base.md) |
| 07 | Player controller & basic combat | `[x]` | [track](./track/07-player-controller-combat.md) |
| 08 | Enemy system & AI archetypes | `[x]` | [track](./track/08-enemy-system-ai.md) |
| 09 | Hitboxes, damage, i-frames | `[x]` | [track](./track/09-hitbox-damage-combat-math.md) |

## Phase 3 — 3D Home *(Track B)*

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 10 | Three.js home scene & hero viewer | `[x]` | [track](./track/10-threejs-home-scene.md) |
| 11 | Equipment slots & 3D preview | `[x]` | [track](./track/11-equipment-3d-preview.md) |
| 12 | Home UI panels & navigation | `[x]` | [track](./track/12-home-ui-panels.md) |

## Phase 4 — Progression

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 13 | Cultivation realm & breakthrough | `[x]` | [track](./track/13-cultivation-realm-system.md) |
| 14 | Insight progression & awakenings | `[x]` | [track](./track/14-insight-system.md) |
| 15 | Fortuitous encounter events | `[~]` | [track](./track/15-fortuitous-encounters.md) |
| 16 | Combat power & character profile | `[x]` | [track](./track/16-combat-power-profile.md) |

## Phase 5 — World & Content

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 17 | World map & free travel | `[x]` | [track](./track/17-world-map-travel.md) |
| 18 | Chapter flow & story scenes | `[~]` | [track](./track/18-chapter-story-system.md) |
| 19 | Skill executor & cultivation VFX | `[~]` | [track](./track/19-skill-executor-vfx.md) |
| 20 | Content pipeline & validators | `[~]` | [track](./track/20-content-pipeline.md) |

## Phase 6 — MVP Content

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 21 | MVP maps: chapters 1–5 | `[~]` | [track](./track/21-mvp-maps-chapters-1-5.md) |
| 22 | MVP maps: chapters 6–10 | `[~]` | [track](./track/22-mvp-maps-chapters-6-10.md) |
| 23 | MVP enemies, bosses, skill data | `[~]` | [track](./track/23-mvp-enemies-bosses-skills.md) |

## Phase 7 — Polish & Ship

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 24 | Localization en + vi | `[~]` | [track](./track/24-localization-en-vi.md) |
| 25 | Audio, aura VFX, juice | `[~]` | [track](./track/25-audio-vfx-polish.md) |
| 26 | PWA, performance, ship checklist | `[ ]` | [track](./track/26-pwa-performance-ship.md) |

## Cross-cutting

| ID | Sub-plan | Status | Detail |
|----|----------|--------|--------|
| 27 | Echoes of the Ancients (guided demo) | `[x]` | [track](./track/27-ancient-echo-demo.md) |
| — | Tiên Nghịch alignment (T1–T8) | `[~]` | [track](./track/tien-nghich-alignment.md) |

---

## Critical path

`01 → 03 → 06 → 13 → 17 → 21 → 24`

**Tiên Nghịch branch** (after 07): `T4 → T1 → T2 → T3` — blocks ship-quality sword fantasy.

---

## MVP ship checklist

| Item | Status |
|------|--------|
| Boot → Home → map → combat → save → return Home | `[~]` |
| 10 chapters with end-of-chapter story | `[~]` |
| 20 maps on world map | `[~]` |
| Unarmed start → Ancient Spirit Sword milestone | `[ ]` |
| Sword Intent gated until ancient sword | `[ ]` |
| 8 boss fights with distinct patterns | `[ ]` |
| 40 skills; 6 with awakening VFX | `[ ]` |
| Insight meter + one awakening per intent | `[x]` |
| 3+ fortuitous encounter types | `[~]` |
| Realm breakthrough flow | `[x]` |
| Combat power in Home profile | `[x]` |
| Aura in 3D Home per realm tier | `[x]` |
| Save anywhere + autosave | `[ ]` |
| English + Vietnamese UI | `[ ]` |
| PWA installable; 30 FPS mid-range Android | `[ ]` |
| Echoes of the Ancients guided demo | `[x]` |
| No console errors in 10-minute playthrough | `[ ]` |

---

## Quick commands

```bash
npm run dev        # local dev server
npm run typecheck  # TypeScript
npm test           # Vitest
npm run build      # production build
```

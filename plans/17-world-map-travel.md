# Sub-Plan 17: World Map & Free Travel — Star Domain Portal

**Phase:** 5 — World & Content  
**Estimated effort:** 12–16 hours *(core travel done; cosmic circular portal UI ≈ 8h additional)*  
**Depends on:** `12-home-ui-panels`, `16-combat-power-profile`, `06-phaser-map-scene-base`  
**Blocks:** `18`, `21`, `22`, `28`

---

## 1. Objective

Implement the **Star Domain Portal** — a full-screen cosmic map where the cultivation road
is a **connected node graph inside a circular Inner Realm**, sealed by the **Phong Giới Great
Formation** ellipse. Player opens it from Home → Journey → **Map Portal**, picks an unlocked
star (map), and enters combat.

> **Visual revision (2026-07):** First pass shipped a flat scrollable canvas. Target matches
> reference deployment (`hoanganh25991.github.io/path-of-dao/`): dark starfield, gold star
> pins on orbital paths, teal region labels, SVG connection lines, elliptical barrier ring.
> Title locale: `world.title` → **"Star Domain Portal"**.

**Free travel (canonical):** The portal is a **cultivation road, not a level select with hard
locks**. Player may **jump to any of the 20 maps** from the Star Domain Portal — no CP gate, no
progression block on Enter. Stronger regions are **dangerous** (enemies scale; player can die
fast), not forbidden. Difficulty is **warned**, never used to disable travel.

**Story vs. wander:** **Continue Journey** and the always-visible **Story Gate** advance the
**next map in Wang Lin's road** (linear story order). Free jumps on the portal are **forge your
own path** — retreat, farm, or rush ahead at your own risk.

Star pin colors may reuse regional accent table [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §5.2 for map–combat cohesion. Read **Intent punch-line** on pin tooltip when timeline shard seen: [`plans/31-wang-lin-story-timeline.md`](./31-wang-lin-story-timeline.md) §6.4.

## 2. World Structure (20 maps · 10 chapters)

| Ch | Region (EN) | Maps |
|----|-------------|------|
| 1 | Fallen Village | `map.fallen_village.01`, `.02` |
| 2 | Mist Forest | `map.mist_forest.01`, `.02` |
| 3 | Stone Canyon | `map.stone_canyon.01`, `.02` |
| 4 | Moon Lake | `map.moon_lake.01`, `.02` |
| 5 | Burning Desert | `map.burning_desert.01`, `.02` |
| 6 | Thunder Peaks | `map.thunder_peaks.01`, `.02` |
| 7 | Frozen Palace | `map.frozen_palace.01`, `.02` |
| 8 | Abyss Rift | `map.abyss_rift.01`, `.02` |
| 9 | Heavenly Gate | `map.heavenly_gate.01`, `.02` |
| 10 | Void Throne | `map.void_throne.01`, `.02` |

Road direction on the portal: **bottom → top** (mortal start below, Lôi Tiên / void throne above),
winding slightly left/right within the circle — not a geographic atlas.

Star-domain bands (for labels / barrier lore):

| Domain | Chapters | Locale key |
|--------|----------|------------|
| Vermillion Bird | 1–4 | `world.domain.chu_tuoc` |
| La Thiên | 5–7 | `world.domain.la_thien` |
| Lôi Tiên | 8–10 | `world.domain.loi_tien` |

Detail: [`plans/index.md`](../plans/index.md) §7.8 · [`handbook/world-road-bosses.md`](../handbook/world-road-bosses.md)

---

## 3. Layout Wireframe — circular connected graph

```
┌──────────────────────────────────────────────────────────────┐
│  Star Domain Portal                                    [×]   │
├──────────────────────────────────────────────────────────────┤
│     ·  ·        ·                              ·  ·            │
│         ╭──────────────────────────────────╮                 │
│    ·    │   VOID THRONE  ○──○               │    ·           │
│         │        ╲    ╱                     │                 │
│         │   HEAVENLY GATE ○──○             │                 │
│         │      … winding road …            │  ← ellipse     │
│         │   ZHAO / STONE CANYON ○──○        │    (Phong Giới)│
│         │   FALLEN VILLAGE ○──○  (start)   │                 │
│         ╰──────────────────────────────────╯                 │
│   Outer Realm hint (when revealed) ────────────────────────   │
└──────────────────────────────────────────────────────────────┘
        ○ = map pin (gold glow)   ─ = SVG link (solid / dashed)
```

- **Inner circle:** all MVP map nodes + connection lines live **inside** the barrier ellipse.
- **Pins:** small glowing gold circles; map name on hover / detail sheet (not always on pin).
- **Region label:** teal chapter name above each pair cluster (`world-map__region-name`).
- **Links:**
  - **Solid** — `.01 → .02` within same chapter
  - **Dashed** — last map of chapter N → first map of chapter N+1 (when chapter gate cleared)
- **Barrier ring:** SVG `ellipse` from `sealingBarrier`; subtle pulse; label
  `world.barrier.name`; outer-realm hint text below ring when progress warrants (locale keys
  `world.barrier.hint_*`).

---

## 4. Deliverables

| File | Purpose |
|------|---------|
| `src/ui/world/WorldMap.ts` | Full-screen portal; pan/zoom/locate; story gate |
| `src/ui/world/MapNode.ts` | Pin + region label + link helpers |
| `src/ui/world/StarfieldLayer.ts` | **New** — render `stars[]` or procedural dust |
| `src/ui/world/SealingBarrierLayer.ts` | **New** — ellipse + domain / outer-realm copy |
| `src/ui/world/RoadGraph.ts` | **New** — derive / render inter-chapter dashed links |
| `src/progression/WorldProgression.ts` | Story order, `nextStoryMapId`, travel confidence |
| `src/progression/WorldMapLoader.ts` | Load + validate `world-map.json` |
| `src/progression/WorldMapTypes.ts` | Zod schema (barrier, stars, domains) |
| `content/world/world-map.json` | Authoritative node positions + barrier |
| `src/ui/world/world-map.css` | Starfield, pins, links, barrier, detail sheet, gate chrome |
| `src/ui/modals/StoryGateModal.ts` | **New** — next-or-stay popup at story gate |
| `tools/world/layout-star-portal.ts` | **Optional** — regenerate positions on ellipse |

**Entry points:** `PlayPanel` → Map Portal · `WorldMap.open()` · **Continue Journey** → story gate
flow (next in road) or direct enter when player confirms at gate.

---

## 5. `world-map.json` Schema

```json
{
  "width": 1800,
  "height": 2000,
  "sealingBarrier": {
    "center": { "x": 900, "y": 980 },
    "radiusX": 720,
    "radiusY": 820,
    "labelKey": "world.barrier.name",
    "outerRealmHintKey": "world.barrier.outer_realm"
  },
  "stars": [
    { "x": 120, "y": 180, "size": "sm" | "md" | "lg" }
  ],
  "regions": [
    {
      "chapterId": "chapter.01.fallen_village",
      "displayNameKey": "chapter.01.fallen_village.name",
      "domainId": "domain.chu_tuoc",
      "domainLabelKey": "world.domain.chu_tuoc",
      "position": { "x": 620, "y": 1540 },
      "maps": [
        {
          "mapId": "map.fallen_village.01",
          "position": { "x": 0, "y": 0 },
          "unlock": { "type": "default" }
        },
        {
          "mapId": "map.fallen_village.02",
          "position": { "x": 72, "y": 52 },
          "unlock": { "type": "clearMap", "required": "map.fallen_village.01" }
        }
      ]
    }
  ]
}
```

**Position rules:**

- `region.position` — absolute canvas coords for cluster anchor (author on ellipse interior).
- `maps[].position` — offset from region anchor (typically `.01` at origin, `.02` offset ~72×52).
- All absolute pin coords should fall **inside** `sealingBarrier` ellipse (validator warning if not).
- Optional future: `layout: "polar"` + `angle` / `radius` instead of raw x/y — not required for MVP
  if positions are hand-authored (current `content/world/world-map.json`).

**Optional `links[]` (future):** explicit `{ from, to, style: "solid"|"dashed" }` if derived
graph is insufficient; MVP derives links from chapter order + unlock chain.

---

## 6. Story order & travel policy

### 6.1 Story road (linear — 20 maps)

`WorldProgression.storyOrder()` returns the canonical Wang Lin road (bottom → top on portal):

```
map.fallen_village.01 → .02 → map.mist_forest.01 → .02 → … → map.void_throne.02
```

`WorldProgression.nextStoryMapId(save)` — first map in story order not in `clearedMaps`, or `null`
if arc complete. This is **the** definition of **Next** everywhere (Continue Journey, Story Gate).

### 6.2 Free jump — never block Enter

| Rule | Behavior |
|------|----------|
| Portal Enter | **Always allowed** for any of the 20 MVP maps — no `canEnter` hard stop |
| CP / realm | **Warn only** — combat on map uses real enemy scaling; under-leveled players die fast |
| Pin `locked` visual | **Removed or cosmetic-only** — do not disable tap → detail → Enter |
| `unlock` in JSON | **Story metadata** for graph labels / gate hints; not a travel ban |

```typescript
WorldProgression.travelConfidence(playerCp, mapRecommendedCp): 'low' | 'medium' | 'high'
// low    — ratio < 0.7   — "Cultivators here far exceed you"
// medium — 0.7 ≤ ratio < 1.0 — "You may struggle; retreat is wisdom"
// high   — ratio ≥ 1.0   — "Your power matches this road" (confident to proceed)
```

Locale keys: `world.travel.confidence.low|medium|high` (gate popup + detail sheet).

Fine-grained badge tiers (`trivial` … `deadly` from sub-plan 16) may remain on the detail sheet;
the **gate popup uses the 3-level confidence** copy above.

### 6.3 Legacy unlock types (metadata only)

| Type | Meaning on portal |
|------|-------------------|
| `default` | Story start |
| `clearMap` | Prior map in chapter (story sequence hint) |
| `clearBoss` | Boss milestone (lore) |
| `chapterGate` | Prior chapter finale (story beat label) |

Do **not** return `ok: false` from portal travel — use `reasonKey` only for tooltips / Dao Scroll
context if needed.

---

## 7. WorldMap UI Behavior

### 7.1 Navigation (required)

The formation canvas is **pannable, zoomable, and locatable** — not fit-only.

| Control | Behavior |
|---------|----------|
| **Drag** | Pointer/touch drag on viewport pans the canvas (when not on a pin) |
| **Zoom** | Wheel / pinch — clamp ~0.4×–2.5×; preserve focal point under cursor when possible |
| **Locate** | Header button `world.locate` — animate pan+zoom to **current position**: `currentMapId` if set, else `nextStoryMapId`, else story start pin. **In combat** (optional HUD): secondary **Waypoint** pans camera to active map's `signatureTree.position` ([`map-design-canon.md`](./map-design-canon.md) §4) |
| **Open** | Initial view: full Phong Giới ellipse visible; optional auto-locate on second open |

**Top-right chrome:** `[FPS]` immediately **left** of `[× Close]` — Close stays rightmost (plan `02` §4.1).

Toolbar (header): `[Locate]` … `[FPS]` `[× Close]`

### 7.2 Pins & detail sheet

1. Open overlay (`z-index` above Home).
2. Render layers (back → front): starfield → barrier ellipse → road links → region labels → pins.
3. Tap any pin → **detail sheet** (side or bottom on narrow screens):
   - Map name (`{mapId}.name`)
   - Flavor (`{mapId}.desc`)
   - **Signature tree** (`{mapId}.signature_tree`) — landmark name from map JSON
   - Recommended CP · travel confidence (`low` / `medium` / `high`)
   - Cleared checkmark if applicable
   - **Enter Portal** (`world.enter`) — **always enabled** for MVP maps
4. On Enter: show **confidence line** if `low` or `medium` (acknowledge danger, no block); then
   `SceneRouter.switchTo('combat', { mapId })`.
5. Persist `save.progress.currentMapId` before switch.
6. Close returns to Home without scene change.

### 7.3 Story Gate (always visible)

The **next story map** (`nextStoryMapId`) has a dedicated **Story Gate** affordance on the portal —
always rendered while the arc is incomplete (even if player is farming elsewhere).

| Element | Style |
|---------|-------|
| Gate pin | Gold ring + pulsing path from last cleared story map → gate |
| Label | `world.gate.next` — e.g. "Next on the road" + map name |
| Tap gate | Opens **Story Gate modal** (not instant travel) |

**Story Gate modal** (`StoryGateModal`):

```
┌─────────────────────────────────────┐
│  Next: {mapName}                    │
│  {confidence message — low/med/high}│
│                                     │
│  [ Continue on the road ]  (primary)│
│  [ Stay on the starfield ]          │
└─────────────────────────────────────┘
```

- **Continue** → `AncientDemoManager.exit()` if needed → set `currentMapId`, enter combat at `nextStoryMapId` **as hero**
- **Stay** → dismiss; player keeps browsing / jumping freely
- Confidence **high** → copy affirms readiness ("Your cultivation is sufficient for this trial")
- **low** → warns likely death; still allows Continue (player choice)

**Continue Journey** (Home → Journey panel) triggers the **same gate modal** when `nextStoryMapId`
exists; if null (arc complete), hide or show Map Portal CTA only.

### 7.4 Zoom implementation notes

- Transform on `.world-map__canvas` — combine `translate(panX, panY) scale(z)` 
- `fitToViewport()` sets initial scale; user pan/zoom overrides until Locate or reopen
- Pin hit targets scale inversely with zoom so ≥44px touch target at any zoom level

---

## 8. Visual States (pins)

| State | Style |
|-------|-------|
| `default` | gold `#c9a227` glow |
| `cleared` | jade `#2dd4a8` check halo |
| `current` | gold ring + stronger pulse (`currentMapId`) |
| `storyGate` | **Next** map — gate ring + pulse + path from last cleared story node |
| `ahead` | maps beyond next story — slightly dimmer label (danger ahead), **still tappable** |

Connection lines: bright jade when both endpoints cleared; dashed inter-chapter links always visible.

---

## 9. RoadGraph — connection algorithm

```typescript
// For each region with 2 maps: solid line map[0] → map[1]
// For each region i > 0: if chapterGate for region i map[0] is satisfied,
//   dashed line from region[i-1].maps[1] → region[i].maps[0]
```

SVG: `<line>` or `<path>` with `class="world-map__link"` / `world-map__link--dashed"`.
Curved paths optional (quadratic bezier) for aesthetic winding — straight lines OK for MVP.

---

## 10. Sealing barrier & progression reveals

Barrier copy escalates with story progress (read from save, not hard-coded):

| Progress | Hint key |
|----------|----------|
| Early (ch1–3) | `world.barrier.hint_sense` |
| Mid (ch4–7) | `world.barrier.hint_approach` |
| Late (ch8+) / `gameComplete` | `world.barrier.hint_revealed` |

Phong Tôn lore modal: `world.barrier.phong_ton.*` (optional tap on barrier label post ch10).

Side star portals (`world.side.*`) render **outside** ellipse, greyed until
`progress.gameComplete` — post-MVP expansion hooks in JSON.

---

## 11. Integration with Home layout (plan 12)

| Home shell | Map Portal entry |
|------------|------------------|
| Journey panel (col 3) | **Map Portal** card → `WorldMap.open()` |
| **Continue Journey** | Opens **Story Gate modal** for `nextStoryMapId` (next in story) — **hero only**; `exit()` echo first (plan 27 §5.1) |
| **Map Portal Enter** | Any map jump — **hero only**; `exit()` echo first |

When Home uses horizontal three-column shell (plan 12 §2), portal remains **full-screen overlay**
— not embedded in col 3.

---

## 12. Tests

| Test | Assert |
|------|--------|
| `storyOrder` | 20 maps in chapter order |
| `nextStoryMapId` | returns first uncleared; null when all cleared |
| `travelConfidence` | low / medium / high at ratio boundaries |
| Portal enter | any MVP mapId → combat (no hard lock) |
| Story Gate modal | Continue sets `currentMapId` + combat; Stay dismisses |
| Locate | pans to `currentMapId` or next story pin |
| `world-map.json` | parses; all pins inside barrier (lint) |
| `RoadGraph` | 9 intra-chapter + 9 inter-chapter dashed edges for 10 chapters |
| WorldMap mount | renders SVG with ≥20 pins + gate affordance (jsdom smoke) |

---

## 13. Acceptance Criteria

- [x] **Star Domain Portal** title from `world.title`
- [x] Circular **Phong Giới** ellipse visible; map nodes inside it
- [x] **20 connected pins** — solid intra-chapter + dashed inter-chapter links
- [x] **Pan + zoom + Locate** on formation canvas
- [x] **Locate** centers on current / next-story position
- [x] **Free jump** — Enter enabled on every MVP map; danger warned, never blocked
- [x] **Travel confidence** (`low` / `medium` / `high`) on detail sheet and Story Gate modal
- [x] **Story Gate** always visible for `nextStoryMapId` until arc complete
- [x] Gate modal: **Continue on the road** / **Stay** — Continue never hard-blocked
- [x] **Continue Journey** = next in story (Story Gate), not blind resume
- [x] Starfield background (authored `stars[]` or CSS fallback)
- [x] Region / chapter labels at clusters (teal, reference style)
- [x] Cleared / current / story-gate visual states
- [x] `currentMapId` saved on enter
- [x] en + vi strings (`world.gate.*`, `world.travel.confidence.*`, `world.locate`)
- [x] Unit tests pass

---

## 14. Mobile UX

- Portal is full-screen on phone; **pinch zoom + drag pan** required.
- **Locate** button in header (min 44px) — essential on small screens.
- Detail sheet becomes bottom sheet on narrow width.
- Story Gate modal is full-width bottom sheet on phone.
- Pin hit target ≥ 44px at all zoom levels.

---

## 15. Handoff

- Sub-plans **21–22** — real Phaser maps for all 20 `mapId`s
- Sub-plan **18** — chapter unlock + story on final map clear
- Sub-plan **28** — journey snapshots reference map ids from this graph

**Reference UI:** Star Domain Portal screenshot in reference deployment; positions in
`content/world/world-map.json` already approximate bottom→top road inside ellipse.

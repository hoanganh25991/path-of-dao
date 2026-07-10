# Sub-Plan 28: Path & Journey System (My Path + Follow the Ancients)

**Phase:** Cross-cutting — Progression + Home + Story + Echoes
**Estimated effort:** Phase A ~4h · Phase B ~6–8h (guided walk)
**Depends on:** `13-cultivation-realm-system`, `16-combat-power-profile`, `17-world-map-travel`, `18-chapter-story-system`, `27-ancient-echo-demo`
**Blocks:** — (deepens story + onboarding readability)

> **Master plan:** [index.md](./index.md) · §1.1 Renegade Immortal pillars · §7.8 World Road · §7.9 Path & Journey · Track: [tracks/index.md](../tracks/index.md) (no per-file track yet — created when work on this sub-plan begins)

> **Status (2026-07-06):** implemented — Phase A + Phase B landed. See
> [`tracks/28-path-journey-system.md`](../tracks/28-path-journey-system.md). Ancient walk combat visuals: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §7.

---

## 1. Objective

Turn the disconnected pieces — world map (free travel), chapter stories, and Echoes
of the Ancients — into one readable spine: the **Path**.

A **Path** is an *ordered journey* of milestones (maps cleared, breakthroughs, story
beats), each stamped with **how strong the cultivator was at that step**.

- **My Path** — the player's own road, auto-recorded as they play. The Story archive
  becomes a chronological journey scroll: *"how strong I was at map A vs. now."*
- **Ancient Paths** — each legend has an authored road (the maps they conquered in
  order + their realm + the story beat). "Follow his path" walks it stage-by-stage;
  reading the story in sequence = **learn from history**. "Forge your own path" is
  normal free travel.

**Player promise:** *"My history is a scroll I can re-read, and I can walk the roads of
those who rose before me."*

---

## 2. Design Principles

| Principle | Rule |
|-----------|------|
| One spine | Maps + story + strength snapshots share a single `journey` timeline |
| Strength is a snapshot | Each step stores realm/level/CP **at that moment** — never recompute |
| Record once | A milestone `(kind, refId)` logs a single step (re-clears don't spam) |
| Follow = showcase | Following an ancient's path plays in god-mode **in combat only** (reuses sub-plan 27); Home stays journey hero (§5.1) |
| Read = learn | Story beats sit in order on the scroll → the road teaches the shape of a rise |
| Dao Scroll | Every map has a **timeline shard** (plan 31) — Wang Lin parallel + Intent punch-line; readable in Path tab |
| Back-compat | `progress.journey` defaults `[]` — pre-28 saves load unchanged |

---

## 3. Data Model

### 3.1 `JourneyEntry` (save — `progress.journey[]`)

```ts
interface JourneyEntry {
  kind: 'map_clear' | 'boss' | 'breakthrough' | 'encounter' | 'story' | 'timeline_shard';
  refId: string;          // mapId / bossId / realmId / encounterId / storySceneId
  mapId: string | null;   // where it happened, when known
  realmId: string;        // ── strength snapshot ──
  level: number;
  cp: number;
  at: string;             // ISO timestamp
}
```

### 3.2 Ancient `path[]` (`content/demo/ancients.json`)

```ts
interface AncientPathStep {
  mapId: string;                 // a real world-map node
  realmId: string;               // realm they held on this stage (non-decreasing)
  storySceneId: string | null;   // story beat marking the stage
}
```

Labels are derived at render time (region name via `WorldMapLoader`, realm name via
`realm.<id>.name`, story title via `ChapterLoader`) — no per-step locale authoring.

---

## 4. Deliverables

| File | Purpose | Status |
|------|---------|--------|
| `src/core/save/SaveSchema.ts` | `journeyEntrySchema` + `progress.journey` (default `[]`) | ✅ |
| `src/core/save/SaveManager.ts` | `createNew()` seeds `journey: []` | ✅ |
| `src/progression/ChapterManager.ts` | `snapshotJourneyEntry` + recording hooks | ✅ |
| `src/progression/BreakthroughManager.ts` | record `breakthrough` step (via ProfileHeader) | ✅ |
| `src/shared/schemas/ancient-demo.ts` | `ancientPathStepSchema` + `profile.path` | ✅ |
| `content/demo/ancients.json` | authored 2–3 step road per ancient | **content authored ✓** |
| `src/progression/AncientDemoManager.ts` | `getAncientPath()` accessor | ✅ |
| `src/ui/home/journeyView.ts` | resolve a `JourneyEntry` → display strings | ✅ |
| `src/ui/home/panels/PathPanel.ts` | Story archive → **My Path** scroll | ✅ |
| `content/locales/{en,vi}/home.json` | `home.path.*`, `path.*` strings; nav → Path | **content authored ✓** |
| `tests/unit/journey-view.test.ts` | snapshot display resolution | ✅ |
| `tests/unit/ancient-demo.test.ts` | ordered road of real maps per ancient | ✅ |

**Phase B:**

| File | Purpose | Status |
|------|---------|--------|
| `src/progression/PathWalkManager.ts` | active ancient path cursor; advance map → story → map | ✅ |
| `src/ui/modals/AncientDemoModal.ts` | render "Their Road" list; Follow / Walk Here | ✅ |
| `src/ui/home/panels/EchoesPanel.ts` | Follow-path entry (vs. single-map showcase) | ✅ |
| `src/ui/home/ancientPathView.ts` | path step labels for modal | ✅ |
| `content/locales/{en,vi}/demo.json` | `demo.path.*` follow strings | **content authored ✓** |
| `tests/unit/path-walk.test.ts` | guided walk routing | ✅ |

---

## 5. Phase A — My Path foundation

1. **Schema** — `progress.journey: JourneyEntry[]` with back-compat default.
2. **JourneyLog** — pure helpers; snapshot uses `computeCombatPowerFromSave`.
3. **Recording hooks** — `applyMapClearPatch` (map_clear), `completeStory` (story),
   `BreakthroughManager.applyBreakthrough` (breakthrough).
4. **My Path scroll** — `PathPanel` renders newest-first steps with kind badge,
   title, and a `Realm · Lv · CP` strength line; story steps keep a Replay button;
   lore rows preserved.
5. **Ancient roads** — `path[]` authored for all 6 ancients + `getAncientPath()`.

**Acceptance criteria:**
- [x] Clearing a map / seeing a story / breaking through appends one step each.
- [x] Re-clearing a map does not duplicate its step.
- [x] My Path shows strength at each step, newest at top.
- [x] Every ancient has a ≥2-step road of real maps, realm order non-decreasing (content ✓ —
  already true of the authored `content/demo/ancients.json`, needs code to consume it).
- [x] Pre-28 saves load (default `[]`); `typecheck` + tests green (648 tests, 2026-07-06).

## 6. Phase B — Follow the Ancient's Path

1. `PathWalkManager` tracks the active ancient + current step index (session only;
   cleared on `exitAncientDemo`).
2. **Follow Their Path** enters the ancient demo save, routes to step 1's map in
   god-mode; on map clear, plays the step's `storySceneId` (replay, no rewards),
   then advances to the next map; finish → `exitAncientDemo` + Home.
3. **Walk Here** keeps the single-map god-mode showcase on the player's current map.
4. `AncientDemoModal` shows **Their Road** (region · realm · story) before walking.

**Acceptance criteria:**
- [x] Following a path visits each step's map in order with story beats between.
- [x] Exiting mid-walk restores the player's real journey (no demo leakage to IDB).
- [x] The ancient's road is readable in the modal in en + vi.

---

## 7. Notes

- Journey recording during an active Echo runs against the **demo save**, which is
  discarded on exit — demo walks never pollute the player's My Path.
- `boss` / `encounter` kinds are defined but not yet wired (Phase B / later); the scroll
  already renders them if present.

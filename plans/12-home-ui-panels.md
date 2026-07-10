# Sub-Plan 12: Home UI Panels & Navigation

**Phase:** 3 — 3D Home  
**Estimated effort:** 10–12 hours *(shell done; layout redesign + echoes rail ≈ 6–8h additional)*  
**Depends on:** `10-threejs-home-scene`, `11-equipment-3d-preview`, `05-save-system-foundation`  
**Blocks:** `17`, `18`, `27`

---

## 1. Objective

Build HTML UI overlay for Home using a **three-column horizontal shell**:

| Col | Role |
|-----|------|
| **1 — Nav rail** | Vertical tab list (Journey · Echoes · Dharma Treasures · Divine Arts · Path) |
| **2 — Hero stage** | Full-height Three.js viewport + floating profile card |
| **3 — Action panel** | Always-visible right column; tab content (no bottom slide-up sheet) |

> **Layout revision (2026-07):** The first implementation shipped a **mobile-vertical**
> stack (profile top → hero → slide-up sheet → bottom nav). Target layout matches the
> reference deployment (`hoanganh25991.github.io/path-of-dao/`): **|nav| · |3D| · |panel|**
> on one row. **Landscape is the primary design target** for Home (`plans/index.md` §2.1);
> compact portrait is fallback only. Combat uses the same landscape-first rule (plan 03).

Tab labels use cultivator vocabulary and existing locale keys in
`content/locales/{en,vi}/home.json` (`home.nav.*`). Divine Arts loadout editor reuses combat
wheel icon spec: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §9.8 ·
[`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md). **Path tab** hosts
**My Path** + **Dao Scroll** (Wang Lin timeline — all 20 map shards): [`plans/31-wang-lin-story-timeline.md`](./31-wang-lin-story-timeline.md) §6.

---

## 2. Layout Wireframes

### 2.1 Target — horizontal three-column (primary)

```
┌────────┬──────────────────────────────────────┬─────────────────────┐
│ Journey│  ┌ Wandering Cultivator ─────────┐  │ Journey             │
│ Echoes │  │ CP · Realm · Years · Level    │  │                     │
│ Dharma │  └───────────────────────────────┘  │ [Continue Journey]  │
│ Divine │                                      │  Next: map hint     │
│ Path   │         (3D hero viewer)           │ [Echoes of Ancients]│
│        │                                      │ [Map Portal]        │
│  nav   │                                      │  …panel body…       │
└────────┴──────────────────────────────────────┴─────────────────────┘
   ~72px              flex 1 (min 320px)              ~280–360px
```

- **Nav rail (col 1):** `role="tablist"`, vertical stack, gold left-border on active tab.
- **Hero stage (col 2):** Canvas fills column; profile card is **overlay** top-left (not a
  full-width header bar). Orbit/double-tap reset unchanged (`HomeSceneHost`).
- **Action panel (col 3):** Fixed width; shows active tab title + scrollable body. No
  `max-height` collapse — panel is always open when Home is mounted.

### 2.2 Compact fallback — narrow portrait (<640px)

When viewport width &lt;640px **or** `orientation: portrait` with width &lt;768px:

```
┌─────────────────────────────────────┐
│ [Profile card over hero, smaller]   │
│         (3D hero — shorter)         │
├─────────────────────────────────────┤
│  [Panel — active tab content]       │
├─────────────────────────────────────┤
│ Journey │ … │ Path  (icon row)      │  ← horizontal nav strip
└─────────────────────────────────────┘
```

Bottom strip replaces left rail; panel sits above it (still no slide-up animation — panel
 occupies middle band). This preserves one-thumb reach on phones without reverting to the
 old “sheet covers hero” pattern.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/ui/home/HomeUI.ts` | Grid shell mount/unmount; tab routing |
| `src/ui/home/SideNav.ts` | **New** — col-1 vertical rail (wide) |
| `src/ui/home/BottomNav.ts` | **Compact only** — horizontal strip (narrow) |
| `src/ui/home/HeroStage.ts` | **New** — col-2 wrapper + profile overlay anchor |
| `src/ui/home/ProfileHeader.ts` | Floating cultivator card (move off top bar) |
| `src/ui/home/ActionPanel.ts` | **New** — col-3 chrome (title + scroll region) |
| `src/ui/home/panels/*.ts` | Panel bodies unchanged (`PlayPanel`, `DharmaTreasuresPanel`, …) |
| `src/ui/home/panels/EchoesPanel.ts` | **Stub** — “Echoes of the Ancients” entry (sub-plan 27) |
| `src/ui/home/home.css` | **Rewrite** — CSS grid, tokens, responsive breakpoints |
| `content/locales/{en,vi}/home.json` | Add `home.nav.echoes` if missing |

**Deprecated pattern (remove on redesign):**

- `.home-sheet` slide-up container
- Full-width `.home-profile` header bar on wide layouts
- Bottom nav as the **only** navigation on desktop/tablet landscape

---

## 4. HomeUI Lifecycle

```typescript
class HomeUI {
  mount(root: HTMLElement): void;
  unmount(): void;
  openTab(tab: HomeTab): void;
}

type HomeTab = 'play' | 'echoes' | 'dharma' | 'divineArts' | 'path';
```

| Tab id | Nav label (en) | Locale key | Panel |
|--------|----------------|------------|-------|
| `play` | Journey | `home.nav.play` | `PlayPanel` |
| `echoes` | Echoes | `home.nav.echoes` | `EchoesPanel` (27) |
| `dharma` | Dharma Treasures | `home.nav.dharma` | `DharmaTreasuresPanel` |
| `divineArts` | Divine Arts | `home.nav.divine_abilities` | `DivineArtsPanel` |
| `path` | Path | `home.nav.story` | `PathPanel` |

On `SceneRouter` switch to home → mount  
On leave → unmount (remove listeners)

Default tab on first mount: **`play`** (Journey).

---

## 5. CSS Grid Shell

```css
.home-ui {
  display: grid;
  grid-template-columns: var(--home-nav-w, 4.5rem) 1fr var(--home-panel-w, 20rem);
  grid-template-rows: 1fr;
  height: 100%;
  pointer-events: none;
}

.home-ui--compact {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(36vh, 1fr) auto auto;
}

:root {
  --home-nav-w: 4.5rem;       /* icon-only rail; widen if labels inline */
  --home-panel-w: min(22rem, 38vw);
  --dao-bg: #0d1117;
  --dao-panel: rgba(20, 25, 35, 0.92);
  --dao-gold: #c9a227;
  --dao-jade: #2dd4a8;
  --dao-text: #e8e6e3;
  --dao-muted: #8a9bb0;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

- Panel cards: gold border, subtle inner glow (match reference screenshot).
- Journey action buttons: full-width stacked cards with title + subtitle (Continue shows
  `save.progress.currentMapId` map name).
- Nav active state: jade left bar + brighter label (reference: gold/green accent).

Font: system-ui + Noto Sans (vi diacritics); optional Noto Serif for panel titles.

---

## 6. Profile Card (Hero Overlay)

Display inside col-2 overlay (top-left, max-width ~280px):

- Hero name (`hero.wanderer.name`)
- Realm (`realm.{id}.{tier}`)
- Combat Power (formatted, sub-plan 16)
- Years Cultivated
- Level
- Settings gear → `SettingsPanel` (locale toggle, sub-plan 24)
- Breakthrough CTA when `realm.breakthroughReady`

Must not block center of hero (orbit gesture zone).

---

## 7. DharmaTreasuresPanel

Equip / unequip **Dharma Treasures (Pháp Bảo)** with pixel icons, slot row, and compare-before-equip.
Full interaction spec: **§18.3**. Uses `EquipmentManager` (sub-plan 11). **Item logic** (drops,
inventory, loot tables): [`item-system/`](../item-system/index.md) (plan 33). **Icons:** [`design-arts/items/`](../design-arts/items/index.md).

---

## 8. DivineArtsPanel

6-slot wheel editor + earned-arts list + **Master Intent** section. Assign / unassign / **review
skill** flows. Full spec: **§18.4** (arts) and **§18.5** (intents). Save shape and combat sync:
[`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md) §4.

---

## 9. PathPanel

*(unchanged function — new container only)*

My Path archive — `save.progress.journey` + story replay hooks (sub-plans 18, 28).

---

## 10. PlayPanel (Journey column)

Stacked action cards (reference layout):

1. **Continue Journey** — opens **Story Gate** for `nextStoryMapId` (next in Wang Lin's road);
   subtitle = next map name; confidence warning in modal (plan 17 §7.3). **Always hero:**
   `AncientDemoManager.exit()` before gate/combat — never resume echo identity (plan 27 §5.1).
2. **Echoes of the Ancients** — shortcut to `echoes` tab or launch demo (sub-plan 27)
3. **Map Portal** — opens **Star Domain Portal** full-screen overlay (sub-plan 17) — pan, zoom,
   Locate, free jump to any map, Story Gate always visible. Portal travel = **hero** (`exit()` if echo active).

Primary CTA styling: jade gradient button for Continue; gold-outline secondary for others.

---

## 11. EchoesPanel (stub → sub-plan 27)

Placeholder copy + “Enter Echo Realm” disabled until sub-plan 27 ships. Nav rail entry must
exist so layout matches reference; wiring is 27’s scope.

---

## 12. I18n Integration

`I18nManager.t(key)` — full bundles in sub-plan 24. Add keys:

- `home.nav.echoes` — en: "Echoes" / vi: "Ảnh Vọng" *(or glossary-approved term)*
- `home.journey.continue_subtitle` — "Next: {mapName}"

Vietnamese: allow nav rail to widen to `--home-nav-w: 5.5rem` or hide labels (icons only).

---

## 13. Accessibility

- Nav: `role="tablist"`; tabs `role="tab"`, `aria-selected`
- Action panel: `role="tabpanel"`, `aria-labelledby` → panel title
- Focus visible outlines
- Min touch target 48px on compact bottom strip

---

## 14. Tests

`tests/unit/home-ui.test.ts` (jsdom):

- Wide viewport: grid has nav + panel columns; active tab renders in action panel
- Compact viewport: `home-ui--compact` class; bottom strip switches tabs
- Tab switch shows correct panel body
- Dharma Treasures equip calls EquipmentManager mock

Use `matchMedia` mock or fixed `window.innerWidth` for breakpoint tests.

---

## 15. Acceptance Criteria

- [x] Home uses **horizontal |nav| · |3D| · |panel|** on viewports ≥640px wide
- [x] Profile card floats on hero stage (not full-width top bar) on wide layout
- [x] Right panel always visible; no slide-up sheet on wide layout
- [x] Five nav entries: Journey, Echoes, Dharma Treasures, Divine Arts, Path (+ Bestiary bonus tab)
- [x] Journey panel shows stacked Continue / Echoes / Map Portal cards per reference
- [x] Compact portrait fallback uses bottom nav strip + middle panel (no sheet-over-hero)
- [x] Dharma Treasures equip updates 3D hero weapon
- [x] Divine Arts wheel editor writes `save.divineArts`
- [x] **Tab functional flows** per §18: treasure **24×24 icons** + compare + one-tap unequip; arts assign/unassign + **review skill**; intent review + awaken CTA
- [x] UI unmounts cleanly on scene switch
- [x] en + vi strings; nav does not overflow at 640px width

---

## 16. Handoff

- Sub-plan **17** — Map Portal opens Star Domain Portal (`WorldMap` circular graph)
- Sub-plan **18** — Path panel story replay
- Sub-plan **27** — Echoes panel + demo entry
- Sub-plan **28** — My Path scroll content in Path panel

**Reference UI:** `hoanganh25991.github.io/path-of-dao/` (three-column Home). Internal
slug `path-of-dao-v2` supersedes that repo for code; layout parity is the visual target.

---

## 17. Shipped layout canon (2026-07)

> **Status:** horizontal shell + detail panels are **implemented and signed off** in track 12.
> This section records what works well so future panels follow the same patterns.

### 17.1 Where horizontal layout lives

| Doc | Section | What it covers |
|-----|---------|----------------|
| This plan | §2, §5 | Three-column wireframe + CSS grid tokens |
| [`plans/index.md`](./index.md) | §7.10 | Cross-cutting Home shrine summary |
| [`plans/17-world-map-travel.md`](./17-world-map-travel.md) | §11 | Map Portal overlay vs Home shell |
| [`plans/03-input-touch-controls.md`](./03-input-touch-controls.md) | §7 | **Combat** joystick — **not** shown on Home |

**Home has no move joystick.** The virtual joystick mounts only in combat (`CombatHUD` on
`scene:changed → combat`). On the Home shrine you see **|nav| · |3D| · |panel|** only — no
left-thumb move control. If you expect a joystick on Home, that is a different scene; see
plan 03 §5.4.

### 17.2 Horizontal shell — what works

These choices are **keep-as-is** unless a future redesign explicitly revisits them:

| Element | Shipped behavior | Why it works |
|---------|------------------|--------------|
| **Nav rail (col 1)** | Five tabs, equal flex height, jade left-border on active | Full-height tap targets; labels readable at `4.5rem` width |
| **Hero stage (col 2)** | Three.js canvas fills column; profile card floats top-left | Orbit zone stays center-right; stats never steal full width |
| **Action panel (col 3)** | Fixed `min(22rem, 38vw)`; always open on wide | Deep content without covering the hero |
| **Breakpoint** | `≥640px` wide → horizontal; `<640px` → compact stack | Matches landscape tablets + desktop browser testing |
| **Compact fallback** | Hero → panel → bottom nav strip (no slide-up sheet) | One-thumb nav without hiding the 3D viewer |

Canvas clipping: `#game-shell` gets `home-layout-wide` / `home-layout-compact` so the 3D viewport
respects the grid columns (hero does not render under the nav rail or action panel).

### 17.3 Action panel anatomy (detail column)

Every tab shares the same **chrome** (`ActionPanel.ts`):

```
┌─────────────────────────────┐
│ Panel title (gold, tab name)│  ← .home-action-panel__title
├─────────────────────────────┤
│                             │
│  Scrollable body            │  ← .home-action-panel__body
│  (tab-specific content)     │
│                             │
└─────────────────────────────┘
```

**Detail layout rules** (apply to all tabs):

1. **Title hierarchy** — outer chrome uses gold `home-action-panel__title`; inner sections use
   `home-panel__title` (slightly smaller) + optional `home-panel__intro` muted paragraph.
2. **Scroll** — only `.home-action-panel__body` scrolls; nav rail and panel title stay fixed.
3. **Touch targets** — buttons/cards `min-height: 48px`; journey cards `56px+`.
4. **Tokens** — `--dao-gold`, `--dao-jade`, `--dao-panel`, `--dao-muted` from §5; gold borders
   on cards, jade on primary CTAs and active states.
5. **No nested modals in panel** — pickers (e.g. Divine Art slot assign) render inline in
   `.home-detail[data-picker]` at the bottom of the scroll body.

### 17.4 Per-tab detail patterns (shipped)

| Tab | Body structure | Detail notes |
|-----|----------------|--------------|
| **Journey** | `.home-journey-stack` — 3 full-width cards | Primary card = jade gradient (Continue); others gold-outline |
| **Echoes** | Entry card + demo CTA | Wired in sub-plan 27 |
| **Dharma Treasures** | 4×N `.home-treasure-grid` + equip popover | Equipped badge via jade border on card |
| **Divine Arts** | Intro → 3×2 `.home-wheel` grid → earned list → Intent section | Wheel slots: dashed empty, solid jade when filled; tap slot → inline picker |
| **Path** | My Path / Dao Scroll sub-tabs → scroll lists | Journey entries + timeline shards with unread jade glow |

**Divine Arts panel** (reference screenshot) is the canonical “dense detail” example:

```
[Intro paragraph — muted]
[6-slot wheel grid — 3 columns, tap to assign]
[Earned arts list — name + desc per row]
[Master Intent section — progress %, awaken CTA]
[Inline picker — appears on slot tap]
```

### 17.5 Profile overlay (col 2)

Floating card on hero stage (not in action panel):

- Name, realm tier, Combat Power (gold), Years Cultivated, Level
- Settings gear top-right (profile card — separate from viewport FPS chrome)

### 17.8 Global FPS overlay (viewport)

`FpsOverlay` (plan `02` §4.1) is **not** inside the profile card — it is fixed to the **viewport
top-right** on Home and every scene:

| Control | Position |
|---------|----------|
| FPS | Viewport top-right when Home has no menu button |
| Settings gear | Profile card overlay only — does not displace FPS |

On Home there is no combat menu; FPS occupies the top-right chrome row alone. In combat and
overlays with a menu/close button, layout is `[FPS][Menu]` with menu flush right.
- `max-width: min(280px, calc(100% - 24px))`; does not block orbit center

### 17.6 Responsive compact mode

When `.home-ui--compact`:

- Side nav hidden; bottom `.home-bottom-nav` (5 equal columns) replaces it
- Action panel `max-height: 42vh` so hero keeps ≥36vh
- Profile card shrinks but stays on hero overlay

### 17.7 What is **not** on Home

| Control | Scene | Visibility |
|---------|-------|------------|
| Virtual joystick | Combat only | Fixed bottom-left; always visible idle hint (plan 03 §5.4) |
| Attack / Dash / Gather Qi | Combat only | Always visible bottom-right in combat |
| Divine Arts wheel (combat) | Combat only | Arc above action buttons — different from Home loadout grid |

Home **Divine Arts** tab is a **loadout editor** (6-slot grid + earned list), not the combat
wheel overlay. Combat wheel geometry: [`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md) §5.

---

## 18. Tab functional design (detailed)

> **Goal:** every Home tab in col 3 is **self-explanatory on landscape mobile** — pick → preview →
> compare → confirm. Reuse shared chrome: `.home-detail` strip, `.home-compare` block, pixel icons.

### 18.1 Shared interaction patterns

| Pattern | Class / component | When |
|---------|-------------------|------|
| **Slot row** | `.home-slot-row` | Always visible at top of equip/loadout tabs — shows what's worn / assigned now |
| **Inventory grid** | `.home-treasure-grid` / `.home-art-grid` | Scrollable body; each cell = icon + short label |
| **Detail strip** | `.home-detail[data-detail]` | Slides open at bottom of panel on selection; primary CTAs here |
| **Compare block** | `.home-compare` | When replacing something already equipped / assigned |
| **Review sheet** | `.home-review` | Read-only deep dive (skill / intent) — desc, stats, awakened variant |
| **Empty / clear** | `home-btn--secondary` full-width | **Unequip** / **Unassign** — always easy to find, never buried in picker |

**Pixel art requirement:** every selectable card shows a **24×24** icon (`image-rendering: pixelated`;
display 32–40px). Source: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §9.8
(wheel arts) · §10 (treasures). Path: `assets/sprites/items/{itemId}.png`,
`assets/sprites/skills/{skillId}.png` — or `iconKey` in content JSON resolved by asset pipeline.

**After any equip / assign / unequip:** `onChange()` → persist save → refresh panel →
`EventBus` (`equipment:changed` / wheel visual sync) → 3D hero updates (treasures).

---

### 18.2 Journey tab (`PlayPanel`)

| Action | Flow |
|--------|------|
| **Continue Journey** | `AncientDemoManager.exit()` → Story Gate modal → next story map **as hero** (plan 17 §7.3, plan 27 §5.1) |
| **Echoes** | `openTab('echoes')` — only entry that can lead to ancient combat |
| **Map Portal** | `WorldMap.open()` — free jump **as hero** (`exit()` if echo active) |

No inventory editing — stacked cards only (§10).

---

### 18.3 Dharma Treasures tab — equip · unequip · compare

**Layout (top → bottom):**

```
[Intro]
[Slot row: weapon | armor | accessory | spirit]  ← icon + label; tap filled slot
[Treasure grid 4×N — pixel icon + name + ×qty]
[Detail strip — hidden until selection]
```

#### Slot row (equipped now)

| Slot | Chip content | Tap behavior |
|------|--------------|--------------|
| Empty | Dashed chip + slot locale (`home.slot.weapon`) + empty-slot glyph | Toast: "No treasure equipped" |
| Filled | **24² icon** + truncated name + jade border | Opens **detail strip** in **unequip mode** |

**Unequip mode layout** (must be obvious — one action):

```
┌─────────────────────────────────────┐
│ [48px icon]  Ancient Spirit Sword     │
│              weapon · legendary       │
│  +ATK 24  +Crit 2%  (stat chips)    │
│                                     │
│  [  Remove from weapon slot  ]      │  ← full-width, secondary/outline
│  [ Close ]                          │
└─────────────────────────────────────┘
```

- Primary action is **Remove** / `home.dharma.unequip` — not hidden behind equip toggle.
- On confirm: `EquipmentManager.unequip(slot)` → slot chip returns to dashed empty → 3D detach.

#### Inventory grid (pick to equip)

Each `.home-treasure-card`:

- `32×32` **pixel icon** (required — text-only cards are not shippable)
- Name (2 lines max) + `×qty`
- Jade border if currently equipped anywhere

**Tap card → detail strip:**

1. **Preview** — large icon (48px), rarity color border, full description, modifier chips
   (`+ATK`, `+DEF`, … from `treasure.modifiers`).
2. **Compare** (if same slot already filled):

```
┌─ Currently equipped ─┬─ Selected ─────────┐
│ [icon] Iron Sword    │ [icon] Ancient …   │
│ ATK +12              │ ATK +24  (+12)     │
│ Crit +0%             │ Crit +2% (+2%)     │
└──────────────────────┴────────────────────┘
```

- Delta in jade if better, muted if worse — **no blocking**; player chooses.
- If slot empty: compare block hidden; show "Equipping to: {slot}" only.

3. **CTAs:**
   - **Equip** / **Replace** (`home.dharma.equip`) — primary jade when `canEquip`
   - Disabled + reason if level too low / sword milestone (plan 11 §7)
   - **Close** — dismiss strip

**Wrong-slot items:** if player taps armor while viewing weapon context, equip still targets
item's native `treasure.slot` — compare uses that slot's current piece.

**Assets (required for MVP ship):**

| Item | Icon | Plan 29 §10 |
|------|------|-------------|
| All `item.*` equipment in inventory | 24×24 PNG | Shape + palette per row |

Validator (plan 20): every equippable `item.*` must have `iconKey` or default sprite path.

---

### 18.4 Divine Arts tab — assign · unassign · review skill

**Layout (top → bottom):**

```
[Intro]
[6-slot wheel grid 3×2 — pixel icon or slot label]
[Earned arts list — tap to review]
[Master Intent section — §18.5]
[Picker / review strip — data-picker or data-review]
```

#### Wheel grid (combat loadout)

| State | Visual | Tap |
|-------|--------|-----|
| Empty (`null`) | Dashed `.home-wheel-slot`, slot label `1`/`2`/`U`/… | Opens **assign picker** |
| Filled | Solid jade border + **24² wheel icon** + art name | Opens **slot actions** sheet |

**Slot actions sheet** (filled slot):

```
[Art icon + name + intent tag]
[ Review skill ]          ← opens read-only review (§18.4.3)
[ Change assignment ]     ← opens picker
[ Unassign slot ]         ← full-width secondary; sets null
[ Close ]
```

**Unassign** must be as easy as treasures unequip — dedicated button, not only via picker "Empty".

#### Assign picker (`data-picker`)

Triggered from empty slot or "Change assignment":

- Lists `getEarnedDivineArts(save)` minus arts assigned to **other** slots
- Each row: **icon** + name + intent color dot
- Locked arts: disabled + `home-btn--locked` + reason (sword milestone, boss gate)
- Footer: **Leave slot empty** (`home.skills.slot_empty`) — same as unassign

**When picking for occupied slot:** show **compare strip** above list:

| Current in slot | Candidate |
|-----------------|-----------|
| Icon + name + power tier | Icon + name + power tier |

No stat math required MVP — name, intent, `powerUi` badge (L/M/S) from plan 29.

#### Review skill (`.home-review`)

Open from earned list row tap OR "Review skill" on slot sheet:

```
┌─────────────────────────────────────┐
│ [48px skill icon]  Flame Bolt Art     │
│ Intent: Flame · Power: M              │
│                                     │
│ {skill.desc locale — full text}     │
│                                     │
│ Base: … / Awakened: …  (if unlocked)│
│ [ Assign to wheel… ]  (optional)    │
│ [ Close ]                           │
└─────────────────────────────────────┘
```

- Read-only — no accidental assign from review (assign is explicit second step).
- If art has awakened variant and Intent awakened: toggle **Base | Awakened** description tabs.
- **Assign to wheel…** opens slot submenu (6 slots, disabled if duplicate elsewhere).

**Earned list:** scroll; each row = icon + name; tap = **review** (not instant assign).

**Icons (required):** per [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §9.8 —
Intent-colored 24×24; `ArtRegistry` / `skill.*.visual.iconKey`.

---

### 18.5 Master Intent section (bottom of Divine Arts tab)

Same panel, below wheel + earned list — **not** a separate nav tab.

#### Intent row states

| State | Row UI | Tap |
|-------|--------|-----|
| **Locked** | Muted name + `intent.locked` | **Review** sheet — explains unlock condition (prev Intent awakened / boss / sword) |
| **In progress** | Name + comprehension `%` bar | **Review** — lists Divine Arts tagged with this Intent + progress sources |
| **Ready to awaken** | Gold pulse + `home.intent.awaken` CTA on row | Tap CTA → `AwakeningModal` (plan 14 §9) |
| **Awakened** | Jade badge `intent.awakened` | **Review** — shows awakened flavor + affected arts |

#### Intent review sheet

```
┌─────────────────────────────────────┐
│ Life-and-Death Intent               │
│ Comprehension: 67%  (or Awakened)   │
│                                     │
│ {intent.desc}                       │
│                                     │
│ Divine Arts: Void Slash, Spirit …   │  ← links tap → skill review §18.4.3
│ Unlocks next: Cause-and-Effect …    │  ← main-flow only
│                                     │
│ [ Awaken ]  (if ready)              │
│ [ Close ]                           │
└─────────────────────────────────────┘
```

Gate Intents (Sword / Flame / Lightning) show **road milestone** copy, not main-flow chain.

---

### 18.6 Echoes tab

Ancient cards + walk CTA (plan 27). Pre-walk **6-slot loadout** reuses §18.4 picker pattern
(ancient skill pool only).

---

### 18.7 Path tab

Sub-tabs: **My Path** | **Dao Scroll** (plan 28 · 31). Scroll list items → timeline reader;
no equip/loadout flows.

---

### 18.8 Locale keys (add to `home.json`)

| Key | Use |
|-----|-----|
| `home.dharma.unequip` | Remove treasure button |
| `home.dharma.equip` / `home.dharma.replace` | Equip CTAs |
| `home.dharma.compare_current` / `home.dharma.compare_new` | Compare headers |
| `home.dharma.equipping_to` | Slot target label |
| `home.skills.unassign` | Clear wheel slot |
| `home.skills.review` | Open skill review |
| `home.skills.assign_to` | Assign submenu |
| `home.skills.compare_current` | Wheel compare |
| `home.intent.review` | Intent detail title |
| `home.intent.arts_list` | Tagged arts heading |
| `home.common.close` | Dismiss strips |

---

### 18.9 Functional acceptance (merged into §15)

See §15 — tab flows in §18.3–§18.5 are part of Home panel ship criteria.

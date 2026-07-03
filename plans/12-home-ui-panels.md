# Sub-Plan 12: Home UI Panels & Navigation

**Phase:** 3 — 3D Home  
**Estimated effort:** 10–12 hours  
**Depends on:** `10-threejs-home-scene`, `11-equipment-3d-preview`, `05-save-system-foundation`  
**Blocks:** `17`, `18`

---

## 1. Objective

Build HTML UI overlay for Home: bottom nav (Play/Inventory/Skills/Story), equipment panel, stats sidebar, and placeholder panels for Bestiary and Map Portal (wired in later sub-plans).

---

## 2. Layout Wireframe

```
┌─────────────────────────────────────┐
│ [CP: 487,231]  [Realm badge]      │  ← ProfileHeader
│                                     │
│         (3D hero viewer)            │
│                                     │
├─────────────────────────────────────┤
│  [Panel content when tab selected]  │  ← Slide-up sheet
├─────────────────────────────────────┤
│  Play | Inventory | Skills | Story  │  ← BottomNav
└─────────────────────────────────────┘
```

"Play" opens Map Portal (sub-plan 17) — MVP button navigates to stub world map.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/ui/home/HomeUI.ts` | Mount/unmount controller |
| `src/ui/home/BottomNav.ts` | Tab switching |
| `src/ui/home/ProfileHeader.ts` | CP, realm, name |
| `src/ui/home/panels/InventoryPanel.ts` | Grid + equip actions |
| `src/ui/home/panels/SkillsPanel.ts` | Skill list stub |
| `src/ui/home/panels/StoryPanel.ts` | Archive stub |
| `src/ui/home/panels/PlayPanel.ts` | Map portal entry |
| `src/ui/home/home.css` | Cultivation aesthetic |
| `content/locales/en/home.json` | UI strings |
| `content/locales/vi/home.json` | UI strings |

---

## 4. HomeUI Lifecycle

```typescript
class HomeUI {
  mount(root: HTMLElement): void;
  unmount(): void;
  openTab(tab: HomeTab): void;
}

type HomeTab = 'play' | 'inventory' | 'skills' | 'story';
```

On `SceneRouter` switch to home → mount  
On leave → unmount (remove listeners)

---

## 5. Visual Design Tokens

CSS variables in `home.css`:

```css
:root {
  --dao-bg: #0d1117;
  --dao-panel: rgba(20, 25, 35, 0.92);
  --dao-gold: #c9a227;
  --dao-jade: #2dd4a8;
  --dao-text: #e8e6e3;
  --safe-bottom: env(safe-area-inset-bottom);
}
```

Panel slide: transform translateY, 280ms ease-out. Backdrop blur 8px.

Font: system-ui + optional webfont "Noto Serif" for titles (lazy load).

---

## 6. ProfileHeader

Display:

- Hero name (localized key `hero.wanderer.name`)
- Realm: `realm.void_spirit.early` → localized string
- Combat Power: formatted `487,231` (stub value until sub-plan 16)
- Years Cultivated: derived flavor `floor(totalPlaySeconds / 3600)` — cap display

---

## 7. InventoryPanel

- Grid 4×N scrollable item cards
- Tap item → detail popover: stats, Equip button
- Equipped items show badge on slot icon row top of panel
- Uses EquipmentManager from sub-plan 11

---

## 8. SkillsPanel (Stub)

List 6 signature skills with icon, name, insight progress bar placeholder (sub-plan 14 fills logic).

Read-only MVP — equip skill slot in sub-plan 19.

---

## 9. StoryPanel (Stub)

List unlocked chapters from `save.progress.storySeen` — tap replays story scene (sub-plan 18).

Empty state: "Venture forth to uncover the Dao."

---

## 10. PlayPanel

Large **Map Portal** button:

- Label keys: `home.map_portal` / Vietnamese equivalent
- On tap → open WorldMap overlay (sub-plan 17) or temporary alert "Coming in 17"

Secondary: Continue button if `save.progress.currentMapId` set → quick resume combat.

---

## 11. I18n Integration (Minimal)

`I18nManager.t(key)` — implement lightweight loader:

```typescript
class I18nManager {
  static async load(locale: 'en' | 'vi'): Promise<void>;
  static t(key: string, params?: Record<string, string>): string;
}
```

Load `home.json` + merge global strings. Full pass in sub-plan 24.

---

## 12. Accessibility

- Bottom nav buttons: aria-label, role=tablist
- Focus visible outlines
- Min touch 48px

---

## 13. Tests

`tests/unit/home-ui.test.ts` (jsdom):

- Tab switch shows correct panel
- Inventory equip button calls EquipmentManager mock

---

## 14. Acceptance Criteria

- [ ] Home scene shows bottom nav + profile header over 3D
- [ ] Inventory displays starter items, equip updates hero weapon in 3D
- [ ] Tab panels slide without blocking orbit controls on hero area (top 60%)
- [ ] UI unmounts cleanly on scene switch to combat
- [ ] en strings display (vi can mirror keys temporarily)
- [ ] Safe area padding on iOS bottom nav

---

## 15. Handoff

Sub-plan 17 replaces PlayPanel stub with WorldMap. Sub-plan 18 wires StoryPanel replay.

# Sub-Plan 30: Divine Arts Wheel Loadout & Assignment

**Phase:** Cross-cutting — Home UI + Combat HUD + Echoes  
**Estimated effort:** Spec (partially implemented); Echoes pre-walk editor ~3h  
**Depends on:** `03-input-touch-controls`, `05-save-system-foundation`, `12-home-ui-panels`, `14-insight-system`, `19-skill-executor-vfx`, `27-ancient-echo-demo`  
**Blocks:** — (clarifies hero + ancient combat wheel behavior)

> **Master plan:** [index.md](./index.md) §1.2 combat controls · §8.1 `divineArts` save field  
> **Pixel wheel icons:** [29-pixel-art-combat-canon.md](./29-pixel-art-combat-canon.md) §9.8

---

## 1. Objective

One consistent model for **assigning** Divine Arts to the **6-slot combat wheel** and **showing**
them on the combat HUD — for the player's hero **and** for Ancient Echo demo combat.

**Player promise:** *"I see exactly what I can cast — empty slots stay empty; filled slots show my
art; I can change my loadout before (and between) fights."*

---

## 2. Canonical Slots

Fixed slot ids (save schema + input + HUD must match):

| Slot | Role (design) | Default label (dev fallback) |
|------|---------------|------------------------------|
| `primary` | Main bread-and-butter art | 1 |
| `secondary` | Combo setup / control | 2 |
| `ultimate` | Big cooldown finisher | U |
| `skill3` | Flex | 3 |
| `skill4` | Flex | 4 |
| `skill5` | Flex | 5 |

**Not wheel slots:** **Attack** (basic combo), **Dash**, **Gather Qi** — always visible, never
occupy a wheel slot (`plans/index.md` §1.2).

---

## 3. Data Model

```typescript
// PlayerSaveV1 — sub-plan 05
divineArts: Record<
  'primary' | 'secondary' | 'ultimate' | 'skill3' | 'skill4' | 'skill5',
  string | null  // content id skill.* — null = empty slot
>;
```

| Rule | Detail |
|------|--------|
| Empty | `null` — slot exists on wheel but **cannot cast** |
| Assigned | `skill.*` id — appears on combat wheel, castable if gates pass |
| No duplicates | Same `skill.*` may appear in **at most one** slot; assigning to a new slot clears the old |
| Awakened resolve | At cast time, `MasterIntentSystem.resolveSkillId()` may swap base → awakened |
| Sword gate | Sword-tagged arts: `SkillUnlockManager.canEquip` false until `weaponMilestone === 'ancient_sword'` |

**Ancient echo save** uses the same `divineArts` shape. Template source:
`content/demo/ancients.json` → `save.equippedSkills` mapped in `AncientDemoManager.buildDivineArts()`.

---

## 4. Assignment Surfaces (Where You Edit)

| Surface | Who | Pool | Persists to |
|---------|-----|------|-------------|
| **Home → Divine Arts tab** | Hero journey | `SkillUnlockManager.computeEarned(save)` | IndexedDB via `gameStore.persist()` |
| **Echoes modal → loadout step** | Ancient echo (pre-walk) | `ancient.unlockedSkills[]` only | Demo save in memory + `sessionStorage` backup of real journey — **not** IndexedDB |
| **Pause → Divine Arts** (optional) | Hero or ancient in combat | Same as row above | Hero: persist on close; Ancient: demo save only |

**MVP primary editors:** Home panel (hero) + Echoes pre-walk picker (ancient). Combat wheel itself
is **cast-first** — no accidental loadout edits from mis-taps during fights.

**Combat identity:** Hero wheel reads journey `divineArts`; ancient wheel reads demo template — only
when combat was entered from Echoes walk (`plans/27-ancient-echo-demo.md` §5.1). Continue Journey /
Map Portal always spawn **hero** combat.

### 4.1 Home — `DivineArtsPanel` (hero)

Full UX spec: [`plans/12-home-ui-panels.md`](./12-home-ui-panels.md) §18.4–§18.5.

**Target flow** (extends current `src/ui/home/panels/DivineArtsPanel.ts`):

```
Open Divine Arts tab
  → 6-slot editor grid (home-wheel) — pixel icon per filled slot
  → tap empty slot → assign picker (earned arts minus duplicates)
  → tap filled slot → slot actions: Review | Change | Unassign
  → tap earned-list row → Review skill (read-only)
  → Master Intent rows → Review intent / Awaken when ready
  → assign → assignDivineArt(slot, skillId) + persist
  → unassign → assignDivineArt(slot, null) — picker "Empty" OR slot sheet button
```

| UI state | Visual |
|----------|--------|
| Slot `null` | Dashed chip, slot label (`1` / `2` / `U` / …), `home-wheel-slot` |
| Slot filled | Solid border, **24² wheel icon** + art name, `home-wheel-slot--filled` |
| Picker locked art | Disabled button (sword pre-milestone, boss gate, etc.) |
| **Review skill** | `.home-review` — desc, intent, power tier, base/awakened toggle |
| **Compare** | When replacing occupied slot: current vs candidate (name + intent + power) |
| **Unassign** | Full-width secondary on slot sheet; **not** picker-only |

**Earned list:** tap opens **review**, not instant assign — assign is explicit from review or picker.

### 4.2 Echoes — pre-walk loadout (ancient)

Flow (spec — extends `AncientDemoModal` per sub-plan 27 §7):

```
Pick ancient → modal shows Their Road + **6-slot loadout row**
  → tap slot → list from ancient.unlockedSkills (no duplicate across slots)
  → confirm Walk / Follow / Walk Here
  → AncientDemoManager.enter() writes divineArts into demo save
  → combat wheel mirrors assignments
```

| Rule | Detail |
|------|--------|
| Default | Pre-fill from `save.equippedSkills` in JSON |
| Player edits | Override before walk; stored only on demo save |
| Exit echo | Demo `divineArts` discarded; hero loadout restored from backup |

### 4.3 Combat pause editor (optional polish)

Combat **menu → Pause** is required (plan 03 §6). Optional: while paused, add **Divine Arts**
row to the same popup — opens the 6-slot picker inline (reuse `assignDivineArt` + picker
component). Wheel refreshes via `wheel:slot-visual` on resume.

---

## 5. Combat Wheel Display (Hero & Ancient)

Single HUD widget: `DivineArtsWheel` (`src/core/input/DivineArtsWheel.ts`), mounted by
`CombatHUD` when `scene === 'combat'`.

### 5.1 Read path

```
save.divineArts[slot]
  → ArtExecutor.getSkillForSlot / emitWheelVisuals (each frame + on cast)
  → EventBus 'wheel:slot-visual'
  → CombatHUD.wheel.setSlotVisual(slot, visual)
```

Ancient demo uses the **same path** — demo save is in `gameStore` while `AncientCombatMode` is active.

### 5.2 Per-slot visual states

| State | Condition | Wheel appearance | Input |
|-------|-----------|------------------|-------|
| **Empty** | `divineArts[slot] === null` | Dashed ring, muted, no intent tint; optional faint `+` | `disabled` — tap does nothing |
| **Ready** | Art assigned, off cooldown, enough mana | Intent-colored icon (plan 29 §9.8), no cooldown sweep | Tap → `ArtExecutor.tryCast(slot)` |
| **Cooldown** | `cooldownRatio > 0` | Radial sweep overlay (`--cooldown-pct`) | Tap ignored until ready |
| **Mana lock** | `runtime.mana < manaCost` (hero); never in god-mode ancient | Icon dimmed `wheel-slot--mana-lock` | Tap ignored |
| **Gate lock** | Sword art pre-milestone (hero only) | Should not appear in save if editor works; belt: disabled + lock glyph | Tap ignored |

**God-mode ancient:** mana lock **off** always (∞ internal mana); all assigned slots castable.

### 5.3 Empty vs filled — hard rules

1. **Always render 6 slot buttons** — never collapse to 3 because loadout is sparse.
2. **Empty ≠ hidden** — player sees capacity ("I can earn more arts").
3. **Filled = intent icon** — not keyboard digits on mobile (digits allowed desktop dev fallback only).
4. **Slot order fixed** — fan/arc layout matches `primary` … `skill5` positions in `combat-hud.css`.

### 5.4 Target layout (mobile)

```
                    [skill3] [skill4] [skill5]
              [secondary]           [ultimate]
    [Gather Qi] [Dash] [Attack] [primary]
```

Left cluster: move joystick (not shown). Right cluster: action buttons + wheel arc above Attack.

---

## 6. Hero vs Ancient — Comparison

| Concern | Hero (journey) | Ancient (echo) |
|---------|----------------|----------------|
| Initial loadout | `saveDefaults` all `null` → player assigns at Home | `ancients.json` `equippedSkills` template |
| Earned pool | Level, story, bosses, encounters | `unlockedSkills` on profile only |
| Edit location | Home Divine Arts tab | Echoes modal pre-walk (+ optional pause) |
| Persist | IndexedDB | Memory only; exit restores hero |
| Wheel icons | From assigned arts | Same widget, same rules |
| Empty slots | Common early game | Rare — templates usually fill 6 for showcase |
| Sword gate | Enforced | Template already past gate |

---

## 7. Assignment API (Code Contract)

```typescript
// src/progression/DivineArtWheel.ts
assignDivineArt(slot: DivineArtSlot, skillId: string | null): boolean;

// Validates: earned, canEquip, de-dupes other slots, patches save, persists (hero only)
```

```typescript
// src/combat/skills/ArtExecutor.ts — cast
const baseSkillId = save.divineArts[slot];
if (!baseSkillId) return false;  // empty slot — no cast
```

```typescript
// WheelSlotVisual — src/core/input/DivineArtsWheel.ts
interface WheelSlotVisual {
  empty: boolean;       // true → disabled, dashed
  cooldownRatio: number;
  manaLocked: boolean;
}
```

**Future:** `EventBus.emit('wheel:slot-icon', { slot, iconKey, intentHue })` when intent icons
replace digit labels (plan 29).

---

## 8. Locale Keys

| Key | Use |
|-----|-----|
| `combat.skills.pick_title` | Picker title — "Assign {slot}" |
| `home.skills.slot_empty` | Clear slot button |
| `home.divine.intro` | Divine Arts tab intro |
| `demo.skills.slot.*` | (add) Echoes loadout slot labels if different from combat |
| `combat.wheel.empty` | (add) aria-label for empty slot |
| `combat.wheel.locked` | (add) aria-label for gate-locked slot |

---

## 9. Acceptance Criteria

- [x] All 6 slots always visible in combat for hero and ancient
- [x] `null` slots render empty (disabled, dashed) — never hidden
- [x] Assigned slots show intent-tinted icon + cooldown/mana state (icons per plan 29)
- [x] Home Divine Arts tab edits all 6 slots; duplicate rejection; clear-to-empty works
- [x] Echoes modal edits ancient loadout from `unlockedSkills` before walk
- [x] Ancient combat wheel reads demo `divineArts`; god-mode ignores mana lock
- [x] Hero assignment persists across sessions; ancient assignment never writes IndexedDB
- [x] `assignDivineArt` + wheel visual unit tests cover empty / filled / de-dupe

---

## 10. Implementation Status

| Piece | Status |
|-------|--------|
| Save `divineArts` 6 slots | ✅ |
| `assignDivineArt` + Home picker | ✅ |
| Combat wheel 6 buttons + empty disable | ✅ |
| `wheel:slot-visual` sync | ✅ |
| Intent icons on wheel (not digits) | ✅ procedural `pixelWheelIconDraw` |
| Echoes modal loadout editor | ✅ §4.2 |
| Pause combat editor | ⬜ optional |
| Locale `combat.wheel.*` | ✅ |

---

## 11. Handoff

| Plan | Uses this doc for |
|------|-------------------|
| [03](./03-input-touch-controls.md) | Wheel input layout, 6 slots |
| [12](./12-home-ui-panels.md) | Home editor |
| [14](./14-insight-system.md) | Loadout + awakening swap |
| [19](./19-skill-executor-vfx.md) | Cast from slot, visual emit |
| [27](./27-ancient-echo-demo.md) | Ancient pre-walk picker |
| [29](./29-pixel-art-combat-canon.md) | Wheel icon pixels |

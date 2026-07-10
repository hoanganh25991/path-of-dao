# Sub-Plan 03: One-Thumb Input & Virtual Joystick

**Phase:** 1 — Core Engine  
**Estimated effort:** 6–8 hours  
**Depends on:** `02-scene-router-app-shell`  
**Blocks:** `07-player-controller-combat`

---

## 1. Objective

Implement **mobile landscape** combat input: virtual joystick (move), one-thumb action cluster,
and a **combat menu** (Pause · Back to Home). No keyboard on ship — keyboard is dev/desktop
smoke only (§8). Input state is engine-agnostic and consumed by Phaser player controller in
sub-plan 07.

> **Design target:** 844×390 landscape (`plans/index.md` §2.1). Layout all HUD chrome for
> thumbs at bottom corners; menu control top-right.

---

## 2. Design Spec (from redesign — `plans/index.md` §1.2)

Nine possible inputs (move + 3 primary buttons + 6 wheel slots) don't fit a literal one-thumb
"3 buttons" layout — so the primary cluster stays large and always visible, and the 6 Divine
Arts sit in a smaller fan/arc above it (standard mobile-ARPG pattern: big basic-attack thumb
target, smaller skill icons arced around/above it, each showing cooldown/mana state).

| Control | Placement | Behavior |
|---------|-----------|----------|
| Move | **Fixed bottom-left** virtual joystick | Always visible in combat (idle 50% opacity); drag thumb within radius; pointer + touch on left half |
| **Attack** | Bottom-right, large primary | Tap = 3-hit combo (unarmed → sword per §7.7); hold optional later |
| **Dash** | Left of Attack, large | Tap = dash + dodge i-frames (sub-plan 07). **Always available — not a wheel slot.** |
| **Gather Qi (Vận Khí)** | Left of Dash, large | Hold = **Buddha sit** meditation channel; **3×** HP/mana regen + qi air-flow VFX; vulnerable (§7.1) |
| **Divine Arts wheel** | Small fan/arc above Attack | 6 slots (`primary, secondary, ultimate, skill3, skill4, skill5`); tap = cast that slot's equipped Divine Art; shows cooldown sweep + mana-lock dim state. **Empty slots** (`null` in save) stay visible but disabled. Full assignment spec: [`plans/30-divine-arts-wheel-loadout.md`](./30-divine-arts-wheel-loadout.md) §5. **Intent-colored pixel icons** (not digits): [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §9.8. |
| **Menu** | Top-right (safe area) | Opens combat pause popup — **Pause** · **Back to Home** (§6) |
| **FPS** | **Left of menu** (top-right cluster) | Always-on live FPS readout — ship + perf QA (§6.1, plan `02` §4.1) |

**Dev only:** arrow keys + A/S/D + 1–6 on desktop for smoke tests — not shown to mobile players (§8).

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/core/input/InputManager.ts` | Singleton polling input state |
| `src/core/input/VirtualJoystick.ts` | Touch joystick DOM + logic |
| `src/core/input/ActionButtons.ts` | Attack / Dash / Gather Qi buttons |
| `src/core/input/DivineArtsWheel.ts` | 6-slot fan/arc — cooldown + mana-lock rendering, tap-to-cast |
| `src/core/input/InputState.ts` | Frame snapshot type |
| `src/ui/hud/CombatHUD.ts` | Mounts input widgets when scene=combat |
| `src/ui/hud/CombatMenuButton.ts` | Top-right menu affordance (rightmost in chrome cluster) |
| `src/ui/hud/FpsOverlay.ts` | Always-on FPS — mounted left of menu (plan `02` §4.1) |
| `src/ui/modals/CombatPauseModal.ts` | Pause · Back Home popup |
| `src/ui/hud/combat-hud.css` | Thumb-safe sizing, menu + FPS chrome |
| `src/ui/modals/DefeatModal.ts` | Try Again · Back Home on player defeat |
| `src/ui/modals/combat-pause-modal.css` | Pause overlay chrome |

---

## 4. InputState Schema

```typescript
type DivineArtSlot = 'primary' | 'secondary' | 'ultimate' | 'skill3' | 'skill4' | 'skill5';

interface InputState {
  move: { x: number; y: number };  // normalized -1..1, deadzone applied
  attack: ButtonState;
  dash: ButtonState;               // was `dodge` — dedicated, not a wheel slot
  gatherQi: ButtonState;           // hold-to-channel; see sub-plan 07 for the vulnerable-channel state machine
  wheel: Record<DivineArtSlot, ButtonState>;  // 6 Divine Arts slots
}

interface ButtonState {
  pressed: boolean;       // true on frame down
  held: boolean;          // true while down
  released: boolean;      // true on frame up
}

interface InputFrame {
  state: InputState;
  timestamp: number;
}
```

InputManager exposes:

```typescript
class InputManager {
  static poll(): InputFrame;           // call once per frame
  static consume(): InputState;        // returns copy, clears edge flags
  static setEnabled(enabled: boolean);
}
```

---

## 5. Virtual Joystick Implementation

### 5.1 UX rules

- **Fixed anchor** bottom-left (`~16%` from left, above action cluster) — always visible in combat
- Idle opacity **0.5**; active drag **1.0**; hidden only when `CombatHUD` unmounts (Home/story)
- Touch or **pointer** (mouse) on **left 50%** of screen drags the thumb from the anchor
- Base radius: 48px visual, 60px clamp radius for thumb
- Deadzone: 0.15 normalized magnitude → zero
- Only one pointer id tracked for movement; additional pointers ignored for move

### 5.2 Y-axis contract (do not reverse twice)

Combat uses **Phaser screen space**: **+Y is down** (same as DOM `clientY`). The move vector
must match keyboard arrows — stick and keys share one convention:

| Input | Stick `dy` / key | `move.y` | On-screen |
|-------|------------------|----------|-----------|
| Thumb **up** / ArrowUp | negative | **negative** | Walk toward top of screen |
| Thumb **down** / ArrowDown | positive | **positive** | Walk toward bottom |
| Thumb **left** / ArrowLeft | negative `dx` | negative | Walk left |
| Thumb **right** / ArrowRight | positive `dx` | positive | Walk right |

`normalizeStick(dx, dy)` maps stick offset **directly** — `move.y = (dy/len)×clamped`. **Do not
negate `dy` again.** A common bug is inverting once in `normalizeStick` and expecting Phaser to
fix it — that makes **up go down** and **down go up**.

Regression test: `normalizeStick(0, -radius)` → `y ≈ -1`; `normalizeStick(0, +radius)` → `y ≈ +1`.

### 5.3 Visibility & scene scope

| Context | Joystick shown? | Why |
|---------|-----------------|-----|
| **Home shrine** (plan 12) | **No** | `CombatHUD` unmounts on `scene:changed → home` |
| **Combat / Echoes** | **Yes — idle hint** | Fixed bottom-left base at 50% opacity; brightens on drag |
| **After release** | **Stays visible** | Thumb recenters; returns to idle opacity (does not disappear) |
| **Menu button** | **Yes — top-right** | Pause popup; always visible in combat landscape |
| **FPS button** | **Yes — left of menu** | Always visible; live FPS on pill (§6.1) |
| **Keyboard** | **Dev / desktop smoke only** | Not part of mobile ship UX (§8) |

**If you cannot see the joystick:**

1. Confirm you are in **combat** (map or Ancient Echo walk), not Home.
2. Use **landscape** orientation — primary design target (§2.1 master plan).
3. Look **bottom-left** for stick; **top-right** for **FPS + menu** (`[FPS][☰]`).

### 5.4 DOM structure

```html
<div id="joystick" class="joystick joystick--idle">
  <div class="joystick-base"></div>
  <div class="joystick-thumb"></div>
</div>
```

Pointer events: `pointerdown/pointermove/pointerup` with capture on combat HUD when enabled.
Touch-only listeners removed — Pointer Events cover mouse + touch.

### 5.5 Normalization

```typescript
function normalizeStick(dx: number, dy: number, maxRadius: number): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len < deadzonePx) return { x: 0, y: 0 };
  const clamped = Math.min(len, maxRadius) / maxRadius;
  // Same sign as dx/dy — see §5.2 (no Y negation)
  return { x: (dx / len) * clamped, y: (dy / len) * clamped };
}
```

`MovementComponent` applies `setVelocity(move.x × speed, move.y × speed)` — no second Y flip.

---

## 6. Action Buttons + Divine Arts Wheel

Three large circular buttons, 56px diameter, 16px gap, plus a 6-slot arc above them:

```
     [3] [4] [5]  ← Divine Arts wheel (smaller, ~40px)
   [2]         [6]
[Gather Qi] [Dash] [Attack]   ← primary cluster (56px)
     [1=primary]
```

(Exact arc geometry is a UI-pass detail — the constraint is: primary cluster always reachable by
thumb without regrip; wheel slots are secondary-reach, tap-only, no drag.)

- `pointerdown` → set pressed+held
- `pointerup` / `pointerleave` → released, clear held
- Visual feedback: scale 0.92 on press, 150ms CSS transition
- Haptic: `navigator.vibrate(10)` on press if available (try/catch)
- **Gather Qi is hold-to-channel, not tap**: `held` stays true while the player keeps a finger
  down; releasing early or taking a hit ends the channel (state machine lives in sub-plan 07).
- Wheel slot buttons render **cooldown sweep** (radial mask) and **mana-lock dim** when the
  equipped Divine Art can't be cast; empty slots (no art equipped) render disabled.

Icons: placeholder SVG or text labels until art pass.

---

## 7. CombatHUD Integration

Listen `EventBus` for `scene:changed`:

- `combat` → mount joystick + buttons into `#ui-root`, `InputManager.setEnabled(true)`
- `home` / `story` → unmount, `InputManager.setEnabled(false)`

CombatHUD is HTML overlay with `pointer-events: auto` on control elements only.

---

## 6. Combat menu (Pause · Back Home)

Mobile landscape has **no keyboard** — pause and exit must be on-screen.

### 6.1 Placement

```
┌──────────────────────────────────────────────────────────────┐
│  [HP / Intent]                         [ FPS ] [ ☰ Menu ]    │  ← top-right cluster
│                                                              │
│                     (combat viewport)                          │
│                                                              │
│  [Joystick]                          [Qi][Dash][Atk] [wheel]  │
└──────────────────────────────────────────────────────────────┘
```

**Top-right cluster** (`#top-right-chrome`):

| Control | Position | Spec |
|---------|----------|------|
| **Menu** | **Rightmost** — flush to safe-area inset | `min 44×44px`; icon ☰ or cultivator seal glyph |
| **FPS** | **Immediately left** of menu | `8px` gap; `min 44×44px` compact pill showing live FPS (e.g. `60`) |
| **FPS update** | — | Refresh display every **500ms** from `GameClock` / rAF delta |
| **FPS tap** | — | Optional: toggle min/max line (dev QA); default always shows current FPS |

- Does not overlap status bars (plan 07 HUD) — cluster sits in dedicated top-right row.
- `FpsOverlay` is **app-global** (plan `02` §4.1) — stays mounted when `CombatHUD` unmounts on Home.

### 6.5 Player defeat modal

When player HP = 0 — separate from pause menu ([`combat-defeat-canon.md`](./combat-defeat-canon.md) §3):

| Action | Locale key | Behavior |
|--------|------------|----------|
| **Try Again** | `combat.defeat.try_again` | Spawn origin → auto gather-qi → full HP/mana → resume |
| **Back to Home** | `combat.menu.home` | Same as §6.2 |

Deliverable: `src/ui/modals/DefeatModal.ts` — shown instead of instant respawn.

### 6.2 Popup actions (pause menu)

Tap menu → **CombatPauseModal** (center or bottom sheet on narrow height):

| Action | Locale key | Behavior |
|--------|------------|----------|
| **Pause** | `combat.menu.pause` | `GameClock.pause()` + `InputManager.setEnabled(false)` + `SceneRouter.pauseActive()`; modal shows **Resume** |
| **Resume** | `combat.menu.resume` | Reverse pause; restore input |
| **Back to Home** | `combat.menu.home` | If echo active: `AncientDemoManager.exit()` → journey autosave → `SceneRouter.switchTo('home')` → hero on shrine (plan 27 §5.1) |
| **Close** | `combat.menu.close` | Dismiss if not paused; if paused, same as Resume |

While paused: combat frozen, dim veil over viewport, gameplay input disabled.

### 6.3 Events

```typescript
EventBus.emit('combat:paused', { paused: boolean });
```

AudioDirector may duck BGM on pause (`app:pause` already exists — wire combat menu to same path).

### 6.4 Landscape layout rules

- Menu + FPS + status HUD readable at **844×390** without clipping action cluster.
- Popup buttons stacked vertically, full-width, `min-height: 48px`.
- vi strings must not overflow at landscape width (plan 24).

---

## 8. Keyboard — development & smoke only

> **Not player-facing.** Mobile ship builds use touch only (`plans/index.md` §2.1). Keyboard exists
> so developers can smoke-test in desktop browser without a device.

**⚠️ Revised 2026-07-06** for one-handed dev smoke (arrows move, A/S/D actions):

| Key | Action |
|-----|--------|
| Arrow keys | move vector |
| A | attack pressed |
| S | gather qi held |
| D | dash pressed |
| 1–6 | Divine Arts wheel slots `primary…skill5` |

Gate keyboard behind `!('ontouchstart' in window) || import.meta.env.DEV` to avoid ghost inputs on hybrid devices — refine with `matchMedia('(pointer: coarse)')`.

**Do not** document keyboard shortcuts in player-facing help, store copy, or tutorial UI.
Combat **Pause** and **Back Home** must work via menu button on a phone in landscape.

---

## 9. Tests

### 9.1 Unit — normalize + deadzone

`tests/unit/virtual-joystick.test.ts`:

- Center touch → zero vector
- Edge of radius → magnitude 1
- Below deadzone → zero

### 9.2 Unit — button edge detection

Simulate down/up sequence across two poll() calls:

- Frame 1: attack pressed=true, held=true
- Frame 2 after consume: pressed=false unless new down

### 9.3 Unit — Gather Qi hold + wheel slots

- Gather Qi: press-and-hold → `held=true` across N frames; release → `released=true` once
- Wheel: pressing slot `skill3` sets only that slot's `pressed`, others remain false

---

## 10. Acceptance Criteria

- [x] Joystick visible bottom-left in combat (idle hint); drag on left half moves player
- [x] Move vector reaches (-1,1) range smoothly
- [x] Attack, Dash, Gather Qi, and all 6 wheel slots fire edge flags correctly
- [x] Gather Qi reports `held` continuously while finger stays down, `released` on lift
- [x] Switching to Home removes HUD and disables input
- [x] **Combat menu** visible top-right in landscape; opens Pause · Back Home popup
- [x] **FPS button** always visible; sits **left of menu** in top-right cluster (plan `02` §4.1)
- [x] **Pause** freezes combat + disables input; **Resume** restores
- [x] **Back to Home** autosaves and returns to Home shrine
- [x] No page scroll while dragging joystick (`preventDefault` on touchmove)
- [x] Buttons meet 44px minimum touch target (WCAG); wheel slots may be smaller but stay ≥32px
- [x] Keyboard works in **dev desktop smoke only** (not required on touch devices)
- [x] Unit tests pass

---

## 11. Mobile QA Checklist

**Primary:** Chrome DevTools or device at **844×390 landscape** (`plans/index.md` §2.1).

- [ ] Thumb reaches attack without shifting grip in landscape
- [ ] Menu button reachable with right thumb or left index — ≥44px target
- [x] Player **defeated** → DefeatModal **Try Again** → spawn gather-qi recovery (plan `07` §10)
- [ ] Pause popup readable in en + vi at landscape width
- [ ] Joystick doesn't conflict with iOS home indicator (`env(safe-area-inset-bottom)`)
- [ ] Multitouch: attack while moving works
- [ ] Portrait 390×844: HUD still usable (fallback, not primary design pass)

---

## 12. Handoff

Sub-plan 07 reads `InputManager.consume()` in Phaser `update()` to drive player velocity and combat actions.

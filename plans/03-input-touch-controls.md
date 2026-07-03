# Sub-Plan 03: One-Thumb Input & Virtual Joystick

**Phase:** 1 — Core Engine  
**Estimated effort:** 6–8 hours  
**Depends on:** `02-scene-router-app-shell`  
**Blocks:** `07-player-controller-combat`

---

## 1. Objective

Implement mobile-first input: virtual joystick (move), and three action buttons (Attack, Skill, Dodge). Input state is engine-agnostic and consumed by Phaser player controller in sub-plan 07.

---

## 2. Design Spec (from GDD)

| Control | Placement | Behavior |
|---------|-----------|----------|
| Move | Left half, floating joystick | Appears on touch down; follows thumb within radius |
| Attack | Bottom-right primary | Tap = basic attack; hold optional later |
| Skill | Above attack | Tap = skill slot 1 (MVP) |
| Dodge | Left of attack | Tap = dodge with i-frame window (sub-plan 07) |

Desktop fallback: WASD + J/K/L or mouse click buttons.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/core/input/InputManager.ts` | Singleton polling input state |
| `src/core/input/VirtualJoystick.ts` | Touch joystick DOM + logic |
| `src/core/input/ActionButtons.ts` | Attack/Skill/Dodge buttons |
| `src/core/input/InputState.ts` | Frame snapshot type |
| `src/ui/hud/CombatHUD.ts` | Mounts input widgets when scene=combat |
| `src/ui/hud/combat-hud.css` | Thumb-safe sizing |

---

## 4. InputState Schema

```typescript
interface InputState {
  move: { x: number; y: number };  // normalized -1..1, deadzone applied
  attack: ButtonState;
  skill: ButtonState;
  dodge: ButtonState;
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

- Touch **left 50%** of screen starts joystick at touch point
- Base radius: 48px visual, 60px clamp radius for thumb
- Deadzone: 0.15 normalized magnitude → zero
- Opacity: 0.7 idle, 1.0 active; fade out 300ms after release
- Only one touch id tracked for movement; additional touches ignored for move

### 5.2 DOM structure

```html
<div id="joystick" class="joystick hidden">
  <div class="joystick-base"></div>
  <div class="joystick-thumb"></div>
</div>
```

Pointer events: `touchstart/touchmove/touchend` with `{ passive: false }` on combat HUD only when enabled.

### 5.3 Normalization

```typescript
function normalize(dx: number, dy: number, maxRadius: number): Vec2 {
  const len = Math.hypot(dx, dy);
  if (len < deadzonePx) return { x: 0, y: 0 };
  const clamped = Math.min(len, maxRadius) / maxRadius;
  return { x: (dx / len) * clamped, y: (dy / len) * clamped };
}
```

Y-axis: screen coordinates inverted so up on stick = negative y in game space (document in code).

---

## 6. Action Buttons

Three circular buttons, 56px diameter, 16px gap:

```
        [Skill]
[Dodge] [Attack]
```

- `pointerdown` → set pressed+held
- `pointerup` / `pointerleave` → released, clear held
- Visual feedback: scale 0.92 on press, 150ms CSS transition
- Haptic: `navigator.vibrate(10)` on press if available (try/catch)

Icons: placeholder SVG or text labels until art pass.

---

## 7. CombatHUD Integration

Listen `EventBus` for `scene:changed`:

- `combat` → mount joystick + buttons into `#ui-root`, `InputManager.setEnabled(true)`
- `home` / `story` → unmount, `InputManager.setEnabled(false)`

CombatHUD is HTML overlay with `pointer-events: auto` on control elements only.

---

## 8. Keyboard Fallback (DEV + desktop)

| Key | Action |
|-----|--------|
| W/A/S/D or arrows | move vector |
| J or Z | attack pressed |
| K or X | skill pressed |
| L or C | dodge pressed |

Gate keyboard behind `!('ontouchstart' in window) || import.meta.env.DEV` to avoid ghost inputs on hybrid devices — refine with `matchMedia('(pointer: coarse)')`.

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

---

## 10. Acceptance Criteria

- [ ] Joystick appears on left-side touch in combat scene only
- [ ] Move vector reaches (-1,1) range smoothly
- [ ] All three buttons fire edge flags correctly
- [ ] Switching to Home removes HUD and disables input
- [ ] No page scroll while dragging joystick (`preventDefault` on touchmove)
- [ ] Buttons meet 44px minimum touch target (WCAG)
- [ ] Keyboard fallback works in dev on desktop
- [ ] Unit tests pass

---

## 11. Mobile QA Checklist

Test on real device or Chrome DevTools iPhone 14 Pro (390×844):

- [ ] Thumb reaches attack without shifting grip
- [ ] Joystick doesn't conflict with iOS home indicator (padding-bottom: env(safe-area-inset-bottom))
- [ ] Multitouch: attack while moving works

---

## 12. Handoff

Sub-plan 07 reads `InputManager.consume()` in Phaser `update()` to drive player velocity and combat actions.

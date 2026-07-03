# Sub-Plan 07: Player Controller & Basic Combat

**Phase:** 2 — 2D Combat  
**Estimated effort:** 10–12 hours  
**Depends on:** `03-input-touch-controls`, `04-stat-sheet-rpg-core`, `06-phaser-map-scene-base`  
**Blocks:** `08`, `09`, `19`

---

## 1. Objective

Implement player entity with movement, facing, basic attack combo (3-hit MVP), skill slot stub, dodge roll with i-frames, and mana costs. Player stats loaded from game store.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/entities/Player.ts` | Main player class |
| `src/combat/entities/EntityBase.ts` | Shared entity fields |
| `src/combat/components/MovementComponent.ts` | Velocity from input |
| `src/combat/components/CombatComponent.ts` | Attack state machine |
| `src/combat/components/DodgeComponent.ts` | Roll + i-frames |
| `src/combat/state/PlayerStateMachine.ts` | idle/move/attack/dodge/hitstun/dead |
| `src/combat/animations/PlayerAnimController.ts` | Placeholder anim keys |
| `src/ui/hud/PlayerStatusBar.ts` | HP/Mana bars HTML overlay |

---

## 3. Player State Machine

```
idle ←→ move
  ↓ attack pressed
attack (combo step 1→2→3)
  ↓ dodge pressed (if off cooldown)
dodge (0.35s, i-frames 0.25s)
  ↓ hp <= 0
dead
  ↓ damage during non-i-frame
hitstun (0.15s)
```

States block conflicting actions (no move during attack except dodge cancel on frame 5+ — optional MVP skip).

---

## 4. Movement

```typescript
// MovementComponent.update
const input = InputManager.consume();
const speed = moveSpeedPxPerSec(statSheet.resolved.speed);
body.setVelocity(input.move.x * speed, input.move.y * speed);

if (Math.abs(input.move.x) > 0.1) facing = input.move.x > 0 ? 1 : -1;
sprite.setFlipX(facing < 0);
```

Normalize diagonal input so magnitude ≤ 1.

---

## 5. Basic Attack Combo

| Step | Frames | Multiplier | Hitbox |
|------|--------|------------|--------|
| 1 | 8 | 1.0× | arc 40px front |
| 2 | 10 | 1.1× | arc 45px |
| 3 | 14 | 1.4× | arc 60px, knockback |

Combo window: 600ms between steps or reset to 1.

On attack frame 4 (windup end): spawn hitbox via CombatComponent (detailed collision sub-plan 09).

Placeholder: white slash arc sprite, 100ms visible.

---

## 6. Skill Button (Stub)

Press skill → if mana >= 20, spawn `skill.basic_bolt` placeholder projectile forward — full skill system in sub-plan 19.

---

## 7. Dodge

- Cooldown: 800ms
- Duration: 350ms roll in facing direction (or move vector if moving)
- Distance: 96px total
- I-frames: first 250ms — flag `invulnerable = true`
- Visual: alpha 0.6 + afterimage every 50ms (simple duplicate sprite fade)

---

## 8. Stats Integration

On MapScene create:

```typescript
const save = useGameStore.getState().save!;
const sheet = new StatSheet(save.stats, equipmentModifiers(save.equipped));
player = new Player(scene, spawnX, spawnY, sheet, save.runtime);
```

On damage/heal update `save.runtime.hp` and status bar.

---

## 9. PlayerStatusBar (HTML HUD)

Top-left:

- HP bar (red gradient)
- Mana bar (blue)
- Optional CP text (sub-plan 16)

Update on `EventBus` `player:stats-changed` or direct callback.

---

## 10. Death & Respawn (MVP)

On dead:

- Fade screen 1s
- Restore 50% HP at spawn point
- Increment death counter in save meta (optional)

No game over screen yet — sub-plan 18 adds narrative fail state.

---

## 11. Tests

### 11.1 Unit — state machine transitions

Mock player; verify attack from idle, dodge cancels move, dead blocks input.

### 11.2 Unit — combo timing

Advance fake clock 700ms — combo resets to step 1.

---

## 12. Acceptance Criteria

- [ ] Joystick moves player smoothly at stat-derived speed
- [ ] Attack button executes 3-step combo with distinct timing
- [ ] Dodge grants i-frames (verified: take no damage — test hook in 09)
- [ ] Skill spends mana when sufficient
- [ ] HP/Mana bars reflect runtime values
- [ ] Player collides with map walls
- [ ] Facing flips with horizontal movement/attack
- [ ] State machine unit tests pass

---

## 13. Animation Notes

Use placeholder spritesheet 4×4:

- `idle`, `run`, `attack1-3`, `dodge`, `hit`, `dead`

If no art: tint rectangle + text label state for dev.

---

## 14. Handoff

Sub-plan 09 implements hitbox overlap and DamageCalculator application enemy-side and player receiving damage.

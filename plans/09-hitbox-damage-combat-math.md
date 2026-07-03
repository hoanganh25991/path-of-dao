# Sub-Plan 09: Hitboxes, Damage & Combat Math

**Phase:** 2 — 2D Combat  
**Estimated effort:** 8–10 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `07-player-controller-combat`, `08-enemy-system-ai`  
**Blocks:** `19`, `23`

---

## 1. Objective

Unified hitbox system for melee arcs, circles, and projectiles. Apply DamageCalculator, crit feedback, knockback, i-frame respect, and damage numbers VFX.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/combat/HitboxManager.ts` | Spawn/track active hitboxes |
| `src/combat/combat/Hitbox.ts` | Shape definitions |
| `src/combat/combat/Hurtbox.ts` | Receiver on entities |
| `src/combat/combat/CombatResolver.ts` | Apply damage pipeline |
| `src/combat/combat/Knockback.ts` | Impulse application |
| `src/combat/vfx/DamageNumber.ts` | Floating numbers |
| `src/combat/vfx/HitFlash.ts` | White flash shader/tint |

---

## 3. Hitbox Types

```typescript
type HitboxShape =
  | { kind: 'circle'; radius: number; x: number; y: number }
  | { kind: 'arc'; radius: number; startAngle: number; endAngle: number; x: number; y: number }
  | { kind: 'rect'; width: number; height: number; x: number; y: number };

interface HitboxConfig {
  owner: EntityBase;
  team: 'player' | 'enemy';
  damage: DamageInput;
  lifetimeMs: number;
  knockback?: number;
  hitStunMs?: number;
  pierce?: number;  // default 1
}
```

HitboxManager registers in MapScene update loop; removes expired.

---

## 4. Collision Detection

Use Phaser overlap manually or Arcade bodies:

- **MVP approach:** Each frame, for each active hitbox, test against opposing team hurtboxes (circle-circle for simplicity)
- Arc hitbox: approximate with 3 circle samples or use point-in-arc test for hurtbox center

```typescript
function arcContains(ax, ay, radius, start, end, px, py): boolean;
```

---

## 5. CombatResolver Pipeline

```typescript
function resolveHit(hitbox: Hitbox, target: Hurtbox): void {
  if (target.entity.invulnerable) return;
  if (hitbox.alreadyHit.has(target.entity.id)) return;

  const result = DamageCalculator.compute(hitbox.damage, target.entity.stats);
  target.entity.takeDamage(result);
  hitbox.alreadyHit.add(target.entity.id);

  spawnDamageNumber(result.final, result.isCrit, target.x, target.y);
  HitFlash.apply(target.entity.sprite);
  if (hitbox.knockback) Knockback.apply(target.entity, angle from hitbox.owner, hitbox.knockback);

  hitbox.pierceRemaining--;
}
```

---

## 6. Player takeDamage

```typescript
takeDamage(result: DamageResult): void {
  if (invulnerable) return;
  runtime.hp -= result.final;
  EventBus.emit('player:stats-changed');
  if (hp <= 0) stateMachine.transition('dead');
  else stateMachine.transition('hitstun');
}
```

Sync to game store on frame end (batch patch).

---

## 7. Damage Numbers

Pool of 12 DOM or Phaser text objects:

- Normal: white 14px float up 40px fade 600ms
- Crit: gold 20px "!" suffix, scale pop 1.3→1.0

Prefer Phaser world-space text attached to camera for consistency.

---

## 8. Hit Flash

Tint sprite 0xffffff at 80% for 50ms then restore — guard if pooled.

---

## 9. Knockback

```typescript
body.setVelocity(
  Math.cos(angle) * force,
  Math.sin(angle) * force
);
```

Duration 150ms override movement AI.

---

## 10. Friendly Fire

Off — team check in resolver.

---

## 11. Tests

`tests/unit/combat-resolver.test.ts`:

| Case | Assert |
|------|--------|
| i-frame target | no damage |
| pierce 2 | hits two enemies |
| crit | isCrit flag propagates to damage number style |
| minimum 1 damage | floor enforced |

`tests/unit/arc-contains.test.ts` — geometry edge cases.

---

## 12. Acceptance Criteria

- [ ] Player combo hits kill slime in expected hits (document in test comment)
- [ ] Enemy attack respects player dodge i-frames
- [ ] Crit shows distinct VFX
- [ ] Knockback visible on combo finisher
- [ ] No double-hit same target in single swing
- [ ] Damage numbers pool doesn't leak after 100 hits
- [ ] All unit tests pass

---

## 13. Debug Mode

DEV: `physics.arcade.debug = true` shows hitbox outlines green (player) red (enemy).

---

## 14. Handoff

Sub-plan 19 skill executor creates Hitbox configs from skill data. Sub-plan 23 tunes enemy stats knowing TTK formulas.

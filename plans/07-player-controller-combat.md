# Sub-Plan 07: Player Controller & Basic Combat

**Phase:** 2 — 2D Combat  
**Estimated effort:** 10–12 hours  
**Depends on:** `03-input-touch-controls`, `04-stat-sheet-rpg-core`, `06-phaser-map-scene-base`  
**Blocks:** `08`, `09`, `19`

---

## 1. Objective

Implement player entity with movement, facing, basic attack combo (3-hit MVP, **unarmed →
sword** per the Renegade Immortal arc), the 6-slot Divine Arts wheel stub, **Dash** (dodge with
i-frames), **Gather Qi** (vulnerable sit-to-heal channel), and mana costs. Player stats loaded
from game store. See `plans/index.md` §1.2/§7.3/§7.7. **Fake 2.5D:** player uses `DepthSort` + feet anchor on Phaser 3.60+ ([`fake-2.5d.md`](./fake-2.5d.md)). Hero visual stages: [`29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §4.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/entities/Player.ts` | Main player class |
| `src/combat/entities/EntityBase.ts` | Shared entity fields |
| `src/combat/components/MovementComponent.ts` | Velocity from input |
| `src/combat/components/CombatComponent.ts` | Attack state machine; `attackStyle: 'unarmed' \| 'sword'` |
| `src/combat/components/DashComponent.ts` | Roll + i-frames (was `DodgeComponent`) |
| `src/combat/components/GatherQiComponent.ts` | Meditation channel — 3× HP/mana regen, vulnerability, qi-flow VFX hook |
| `src/combat/vfx/QiFlowVFX.ts` | Air-flow particles into player while channeling (plan `29` §2.7) |
| `src/combat/state/PlayerStateMachine.ts` | idle/move/attack/dash/gatherQi/hitstun/dead |
| `src/combat/animations/PlayerAnimController.ts` | Placeholder anim keys; drives `attackStyle` |
| `src/ui/modals/DefeatModal.ts` | Try Again · Back Home on player defeat |

---

## 3. Player State Machine

```
idle ←→ move
  ↓ attack pressed
attack (combo step 1→2→3)
  ↓ dash pressed (if off cooldown)
dash (0.35s, i-frames 0.25s)
  ↓ gather qi pressed (if not already channeling)
gatherQi (channel — stationary, interruptible, extra dmg taken)
  ↓ hp <= 0
defeated → DefeatModal (Try Again → spawn gather-qi recovery)
  ↓ damage during non-i-frame
hitstun (0.15s)
```

States block conflicting actions (no move during attack except dash-cancel on frame 5+ —
optional MVP skip). `gatherQi` is cancelled immediately by any move input, attack input, or
**incoming damage** → `hitstun` → `idle` (§7.1.4) — not a normal blocking state.

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

`CombatComponent.attackStyle` starts `'unarmed'` (Renegade Immortal humble start, T1) and switches to
`'sword'` the moment `progress.weaponMilestone === 'ancient_sword'` (T2–T4; driven by equipping
`item.sword.ancient`, granted by `encounter.ancient_sword` in sub-plan 15). The combo table below
is style-agnostic in structure — `PlayerAnimController` swaps the underlying animation keys
(`hero_strike_*` unarmed vs. sword-swing frames) and hitbox art (no blade VFX unarmed; blade
trail once armed) without changing timing/multipliers.

| Step | Frames | Multiplier | Hitbox |
|------|--------|------------|--------|
| 1 | 8 | 1.0× | arc 40px front |
| 2 | 10 | 1.1× | arc 45px |
| 3 | 14 | 1.4× | arc 60px, knockback |

Combo window: 600ms between steps or reset to 1.

On attack frame 4 (windup end): spawn hitbox via CombatComponent (detailed collision sub-plan 09).

**Combat camera (plan 29 §2.6):** on `beginStep()` emit `combat:camera` `{ intent: 'engage' }`; combo
step 3 emits `{ intent: 'dramatic' }`. On hit connect emit `{ intent: 'shake', shakeTier }` mapped
from step (1→micro, 2→light, 3→medium). `PlayerStateMachine` returning to `move`/`idle` starts
the 350 ms zoom-out hold — `CombatCameraController` handles the tween.

Placeholder: white slash arc sprite, 100ms visible (unarmed = no slash arc — punch/kick impact
flash only; sword = slash arc as written here).

---

## 6. Divine Arts Wheel (Stub)

Pressing a wheel slot (see sub-plan 03's `DivineArtsWheel`) → if mana ≥ cost, spawn a placeholder
projectile forward for that slot's equipped Divine Art — full cast logic (cooldowns across all
6 slots, Sword Intent gating) lands in sub-plan 19. For this sub-plan, stub only slot `primary`
with `skill.basic_bolt`; the other 5 slots render disabled/empty until 19 wires the loadout.

---

## 7. Dash

- Cooldown: 800ms
- Duration: 350ms roll in facing direction (or move vector if moving)
- Distance: 96px total
- I-frames: first 250ms — flag `invulnerable = true`
- Visual: alpha 0.6 + afterimage every 50ms (simple duplicate sprite fade)
- Always available regardless of loadout or `attackStyle` — not a wheel slot (§1.2)

---

## 7.1 Gather Qi (Vận Khí)

Dedicated **meditation channel** — not a wheel cast. Player sits in a **Buddha / lotus meditation
pose**; ambient **qi air-flow** streams inward to restore **HP and mana**.

### 7.1.1 Pose & animation

| Rule | Detail |
|------|--------|
| Enter | Hold Gather Qi button → `gatherQi` state, velocity **0** |
| Pose | **Cross-legged Buddha sit** — anim key `hero_sticky_gather` (plan `29` §0.1, DA-01) |
| Loop | 2–4 frame subtle breathe loop while channeling |
| Exit | Release, move, attack, dash, or **any hit** → `hitstun` → **`idle`** (not back to gather) |

`PlayerAnimController`: `state === 'gatherQi'` → `hero_sticky_gather` (replace idle placeholder).

### 7.1.2 Regeneration

Rates from plan `04` §7.1 — **scaled by player level**:

| Resource | Gather Qi rate | Passive (idle / slow walk) |
|----------|----------------|----------------------------|
| HP | **3×** `hpRegenPerSec(level)` | **1×** |
| Mana | **3×** `manaRegenPerSec(level)` | **1×** |

- **Slow walk:** move input with speed &lt; **40%** max — applies **1×** passive regen (no gather pose).
- **Gather Qi:** **3×** both resources; only while `gatherQi.channeling` and button held.
- Tune constants in `GatherQiComponent` + `skill.basic.meditate.json` (`regenMultiplier: 3`).

```typescript
// GatherQiComponent.tick — both HP and mana
const mult = 3; // gather channel
sheet.regenTick(deltaMs, 'gather', mult);
```

### 7.1.3 Qi air-flow VFX

While channeling, spawn **`QiFlowVFX`** (`src/combat/vfx/QiFlowVFX.ts`):

- Soft **teal/gold particle streams** arc from off-screen / ground toward player's chest (plan `29` §2.7)
- Intensity scales with heal ticks — readable at 2× zoom
- Stops immediately on cancel
- SFX loop: `player.gather_qi_loop` (plan `25`)

### 7.1.4 Vulnerability & cancel

| Rule | Value |
|------|-------|
| Damage taken while channeling | **1.5×** multiplier (`vulnerabilityMultiplier`) |
| Cancel on | Move, attack, dash, button release, **any incoming damage** |
| On hit | `gatherQi.stop()` → `hitstun` (0.15s) → **`idle`** — channel does not resume |
| Cost | Free — exposure is the cost |

### 7.1.5 Passive regen (no button)

In `Player.update` when **not** channeling:

```typescript
if (state === 'idle' || (state === 'move' && speed < maxSpeed * 0.4)) {
  sheet.regenTick(deltaMs, 'passive', 1);
}
```

No qi-flow VFX on passive regen — subtle only (optional 1× sparkle on HP bar tick).

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

## 10. Player Defeat & Recovery (MVP)

> **Canon:** [`combat-defeat-canon.md`](./combat-defeat-canon.md) §3

When `hp <= 0` → **`defeated`** (not `dead`). No instant 50% HP restore.

### 10.1 DefeatModal

| Action | Locale | Behavior |
|--------|--------|----------|
| **Try Again** | `combat.defeat.try_again` | Teleport to `MapConfig.spawn` → auto **gather qi** sit → regen HP + mana to full → `idle` |
| **Back to Home** | `combat.menu.home` | Save + return shrine (plan `03` §6) |

Deliverable: `src/ui/modals/DefeatModal.ts` + `defeat-modal.css`

### 10.2 Try Again sequence

1. Close modal; `InputManager.setEnabled(false)`
2. `player.setPosition(spawn)` — map spawn origin
3. `stateMachine.set('gatherQi')` — Buddha sit + `QiFlowVFX` (min ~3s or until full)
4. `GatherQiComponent` ticks at **3×** until HP/mana full
5. `idle`; re-enable input

Optional: increment `save.meta.defeatCount` — not a game-over.

Remove legacy §10 "Restore 50% HP" behavior.

---

## 11. Tests

### 11.1 Unit — state machine transitions

Mock player; verify attack from idle, dodge cancels move, dead blocks input.

### 11.2 Unit — combo timing

Advance fake clock 700ms — combo resets to step 1.

---

## 12. Acceptance Criteria

- [x] Joystick moves player smoothly at stat-derived speed
- [x] Attack button executes 3-step combo with distinct timing, unarmed style by default
- [x] Equipping the ancient sword (mock save flag) switches `attackStyle` to `'sword'` mid-run
- [x] Dash grants i-frames (verified: take no damage — test hook in 09)
- [x] Gather Qi: **Buddha sit** pose (`hero_sticky_gather`); **qi air-flow** VFX while channeling
- [x] Gather Qi: **3×** HP + mana regen by level; **slow walk / idle** = **1×** passive regen
- [x] Gather Qi: hit → cancel channel → **hitstun → idle** (not resume gather); 1.5× damage while sitting
- [x] Wheel slot `primary` spends mana when sufficient; other 5 slots render disabled (stub)
- [x] HP/Mana bars reflect runtime values
- [x] Player collides with map walls
- [x] Facing flips with horizontal movement/attack
- [x] Player **defeated** at 0 HP → **Try Again** → spawn origin gather-qi → full HP/mana ([`combat-defeat-canon.md`](./combat-defeat-canon.md) §3)
- [x] Attack triggers Engage camera zoom; moving after combo zooms back to Explore (plan 29 §2.6)

---

## 13. Animation Notes

Sticky-man procedural sprites per `handbook/pixel-art-style.md` §4 — `PlayerAnimController`
plays `hero_sticky_*` keys (no state-tint debug squares). Camera framing: plan 29 §2.6.

---

## 14. Handoff

Sub-plan 09 implements hitbox overlap and DamageCalculator application enemy-side and player receiving damage.

# Sub-Plan 08: Enemy System & AI Archetypes

**Phase:** 2 — 2D Combat  
**Estimated effort:** 10–12 hours  
**Depends on:** `06-phaser-map-scene-base`, `07-player-controller-combat`  
**Blocks:** `09`, `23`

---

## 1. Objective

Spawn enemies from map encounter tables, run AI behavior trees (5 archetypes MVP), handle
**defeat + gather-qi recovery** for cultivators (not kill), loot/XP on defeat, and object pooling.
Canon: [`combat-defeat-canon.md`](./combat-defeat-canon.md). Each enemy **y-sorts** in Fake 2.5D
space ([`fake-2.5d.md`](./fake-2.5d.md) §3.1).

---

## 2. Enemy Archetypes (MVP)

| Archetype | Behavior | Example Enemies |
|-----------|----------|-----------------|
| `melee_chaser` | Path to player, melee on range | bandit, wolf |
| `ranged_kiter` | Maintain 120–180px, shoot | archer, spirit moth |
| `stationary` | No move, periodic AoE | turret totem |
| `patrol` | Waypoint loop until aggro | guard |
| `boss` | Phase script (stub → full in 23) | chapter bosses |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/combat/components/DefeatRecoveryComponent.ts` | Cultivator: origin return + gather-qi timer |
| `src/combat/state/EnemyStateMachine.ts` | fighting / defeated / gatherQiRecover / idle |
| `src/combat/entities/Enemy.ts` | Enemy entity — routes HP=0 by `opponentKind` |
| `src/combat/ai/AIBrain.ts` | Archetype dispatcher |
| `src/combat/ai/MeleeChaserAI.ts` | ... |
| `src/combat/ai/RangedKiterAI.ts` | ... |
| `src/combat/ai/PatrolAI.ts` | ... |
| `src/combat/systems/SpawnManager.ts` | Wave + encounter triggers |
| `src/combat/systems/EnemyPool.ts` | Pool per enemy type |
| `content/enemies/_schema.json` | Enemy stat schema |
| `content/enemies/enemy.slime.json` | 3 test enemies |

---

## 4. Enemy Content Schema

`content/enemies/enemy.slime.json`:

```json
{
  "id": "enemy.slime",
  "displayNameKey": "enemy.slime.name",
  "archetype": "melee_chaser",
  "stats": {
    "hpMax": 40,
    "atk": 8,
    "def": 2,
    "speed": 70,
    "crit": 0.05,
    "critDmg": 1.5
  },
  "aggroRange": 200,
  "attackRange": 36,
  "attackCooldownMs": 1200,
  "xpReward": 15,
  "goldReward": [1, 5],
  "lootTable": "loot.slime",
  "spriteKey": "enemy_slime",
  "opponentKind": "beast"
}
```

Cultivator example — add `"opponentKind": "cultivator"`, optional `"defeatRecoverMs": 12000`,
`"canReAggro": true`. Bosses: `"defeatRecoverMs": 90000`, `"canReAggro": false`. See
[`combat-defeat-canon.md`](./combat-defeat-canon.md) §4.

---

## 5. SpawnManager

### 5.1 Encounter table

`content/encounters/encounters.test.json`:

```json
{
  "id": "encounters.test",
  "waves": [
    {
      "trigger": "onEnter",
      "enemies": [
        { "id": "enemy.slime", "count": 3, "spread": 80 }
      ]
    }
  ]
}
```

### 5.2 Spawn rules

- Spawn at random offset ±spread from trigger zone center
- Max alive: 8 on screen; queue rest
- On player **defeated** → pause spawns; existing cultivators keep recovery state (plan `07` §10)

---

## 6. AIBrain Loop

Called each frame with `deltaMs`:

```typescript
interface AIContext {
  enemy: Enemy;
  player: Player;
  map: MapScene;
}

function updateAI(ctx: AIContext): void;
```

**Melee chaser pseudocode:**

```
if distance > aggroRange: idle/patrol
else: move toward player
if distance <= attackRange && cooldown ready: attack()
```

**Ranged kiter:**

```
if too close: move away
if in band: stop and shoot
if too far: move closer
```

---

## 7. EnemyPool

```typescript
class EnemyPool {
  acquire(enemyId: string, x: number, y: number): Enemy;
  release(enemy: Enemy): void;
}
```

On release: hide sprite, disable body, reset AI state — do not destroy GameObject.

Pre-warm 5 per type on map load.

---

## 8. Enemy Attack

Reuse CombatComponent pattern:

- Telegraph 300ms (red tint flash)
- Hitbox active 100ms
- Damage via DamageCalculator (sub-plan 09)

---

## 9. Defeat flow (not kill)

> **Canon:** [`combat-defeat-canon.md`](./combat-defeat-canon.md) §2

### 9.1 Beast (`opponentKind: beast`)

1. Defeat stagger anim 400ms
2. XP + gold + loot on defeat
3. Release to pool
4. Wave cleared when all beasts defeated / recovering

### 9.2 Cultivator (`opponentKind: cultivator`)

1. HP = 0 → `defeated` — brief stagger, **no** death dissolve
2. Grant XP + loot **on defeat**
3. Tween to **`spawnOrigin`** (stored at spawn)
4. Enter **`gatherQiRecover`** — meditation sit + qi-flow VFX; regen for `defeatRecoverMs`
5. Boss: emit `map:boss-defeated`; **no re-aggro**. Fodder: `canReAggro` → idle + fight again
6. Wave cleared when all opponents defeated or in recovery

### 9.3 Bestiary hook

On first **defeat** (not kill wording): `progress.encountersFound` — actually `bestiary` separate list:

```typescript
if (!save.progress.bestiary.includes(enemyId)) patch bestiary
```

Add `bestiary: string[]` to save schema in migration note (v1 patch OK if not shipped).

---

## 11. Tests

| Test | Assert |
|------|--------|
| Pool acquire/release | same instance reused |
| Melee chaser | moves toward mock player coords |
| XP on kill | save xp increases |

---

## 12. Acceptance Criteria

- [x] 3 slimes spawn on test map enter
- [x] Melee enemies chase and attack player — chase math unit-tested (`meleeChaserMath`, `ai-brain.test.ts`, `melee-chaser-ai.test.ts`); live attack telegraph manual
- [x] Ranged enemy maintains distance (1 archer in test encounter)
- [x] Cultivator defeat → origin gather-qi recovery; boss **≥ 60s** recover band ([`combat-defeat-canon.md`](./combat-defeat-canon.md))
- [x] Beasts still pool-release on defeat
- [x] XP and gold update save
- [x] Max 8 concurrent enemies enforced
- [x] Unit tests pass

---

## 13. Handoff

Sub-plan 09 wires hitboxes both directions. Sub-plan 23 adds 25 enemy JSON files using these archetypes.

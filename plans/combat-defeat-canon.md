# Combat Defeat Canon — No Kill, Gather-Qi Recovery

> **Master plan:** [index.md](./index.md) §1.2 · §7.8 · **Gather Qi:** [07-player-controller-combat.md](./07-player-controller-combat.md) §7.1 · [fake-2.5d.md](./fake-2.5d.md)  
> **Player UI:** [03-input-touch-controls.md](./03-input-touch-controls.md) §6.5 · **Enemies:** [08-enemy-system-ai.md](./08-enemy-system-ai.md) §9 · **Bosses:** [23-mvp-enemies-bosses-skills.md](./23-mvp-enemies-bosses-skills.md)

---

## 1. Prime rule — defeat, not kill

Path of Dao combat against **cultivators** is a trial of dao — opponents are **defeated**, not
slain. When HP reaches 0:

- No death dissolve, corpse, or permakill for cultivator opponents
- Target enters **`defeated`** → returns to **spawn origin** → **`gatherQi` recovery** sit (Buddha
  pose) → regains HP/mana over time → may stand again (fodder) or stays down (ordeal boss / map end)

**Beasts & spirit fodder** (`opponentKind: beast`) — slimes, wolves, moths — may still **despawn**
to pool after defeat (no meditation recovery). Only **cultivators** use the full gather-qi recovery loop.

| Opponent | `opponentKind` | On HP = 0 |
|----------|----------------|-----------|
| Spirit beast, slime, wolf | `beast` | Defeat VFX → XP/loot → pool release (existing flow) |
| Bandit, disciple, named cultivator | `cultivator` | **Defeat** → origin → gather-qi recovery |
| Ordeal boss (`.02` maps) | `cultivator` + `boss` | Defeat → origin → long gather-qi → **map victory** (no re-aggro) |

---

## 2. Cultivator defeat flow (enemy)

### 2.1 State machine

```
fighting → defeated → returnToOrigin → gatherQiRecover → idle (re-aggro optional)
```

| State | Behavior |
|-------|----------|
| `defeated` | HP = 0; AI off; brief stagger anim (0.4s); no collision damage |
| `returnToOrigin` | Lerp/tween to `spawnOrigin` {x,y} stored at spawn (≤ 1.5s) |
| `gatherQiRecover` | Play `hero_sticky_gather` or enemy gather variant; **qi air-flow VFX**; regen HP/mana at **3×** passive rate |
| `idle` | Full HP; AI resumes **only** if `canReAggro` and wave not cleared |

### 2.2 Recovery duration (`defeatRecoverMs`)

Time in `gatherQiRecover` until HP/mana full (or cap for bosses):

| Tier | Who | `defeatRecoverMs` (MVP bands) | Notes |
|------|-----|-------------------------------|-------|
| **Normal** | Low-CP disciples, bandits | **8–15 s** | Fast — fodder cultivators |
| **Strong** | Elite guards, high `recommendedCp` | **20–45 s** | Scales with enemy CP |
| **Boss** | Ordeal cultivators (`.02`) | **60–120 s** | MUCH longer; visual only — map ends on defeat |

**Formula** (when JSON omits override):

```typescript
defeatRecoverMs = clamp(
  BASE_CULTIVATOR_RECOVER_MS * Math.pow(enemyCp / 1000, 0.35),
  8000,   // min 8s
  120000, // max 120s (boss cap)
);
// Boss flag: multiply × 2.5 or use fixed band 90_000–120_000
```

Content override per enemy: `"defeatRecoverMs": 15000` in `content/enemies/*.json`.

### 2.3 Wave & map rules

- Wave **cleared** when all spawn entries are `defeated` or `gatherQiRecover` (not active threats)
- Fodder cultivators that finish recovery **may re-aggro** if player still in zone (optional per encounter)
- **Boss defeat** emits `map:boss-defeated` → chapter hook; boss **never** re-aggro same visit
- XP / loot grant on **defeat** (not on recovery complete)

### 2.4 VFX & read

- Defeat: brief intent-colored stagger — **not** 12-frame pixel dissolve (plan `29` §5 — cultivators only)
- Recovery: same **qi air-flow** as player Gather Qi, tinted to enemy intent palette
- Locale: use **defeat** / **overcome** — never "kill" / "slay" for cultivators (`combat.defeat.*`)

---

## 3. Player defeat flow

When player `hp <= 0`:

1. Enter **`defeated`** — combat input off; no instant respawn
2. Show **`DefeatModal`** (center overlay):

| Action | Locale key | Behavior |
|--------|------------|----------|
| **Try Again** | `combat.defeat.try_again` | Teleport to **map spawn origin** → auto **`gatherQi`** sit → regen HP + mana to full → resume `idle` / explore |
| **Back to Home** | `combat.menu.home` | Same as combat menu — save + shrine (plan `03` §6) |

3. **Try Again** sequence:
   - `player.setPosition(spawnOrigin)` from `MapConfig.spawn`
   - `stateMachine.set('gatherQi')` — Buddha sit pose + qi-flow VFX
   - Regen at **3×** until HP/mana full (or min 3s sit for feel)
   - On full → `idle`; re-enable `InputManager`
   - Defeated cultivators on map **unchanged** (still recovering at their origins)

4. No 50% HP snap-restore. Death counter optional meta only.

```typescript
EventBus.emit('player:defeated', undefined);
EventBus.emit('combat:defeat-modal', { open: true });
```

---

## 4. Content schema

`content/enemies/_schema.json` extensions:

```json
{
  "opponentKind": "beast",
  "defeatRecoverMs": 12000,
  "canReAggro": true
}
```

| Field | Rule |
|-------|------|
| `opponentKind` | `beast` \| `cultivator` — required |
| `defeatRecoverMs` | Optional override; boss ≥ 60000 |
| `canReAggro` | Default `false` for bosses; `true` for fodder cultivators |

Boss JSON: `"opponentKind": "cultivator"`, `"category": "boss"`, `"canReAggro": false`.

---

## 5. Implementation map

| File | Role |
|------|------|
| `src/combat/components/DefeatRecoveryComponent.ts` | Enemy origin return + gather-qi timer |
| `src/combat/state/EnemyStateMachine.ts` | `fighting` / `defeated` / `gatherQiRecover` |
| `src/ui/modals/DefeatModal.ts` | Try Again · Back Home |
| `src/combat/entities/Player.ts` | Player defeated → modal; Try Again → spawn gather |
| `src/combat/entities/Enemy.ts` | Route HP=0 by `opponentKind` |
| `src/combat/vfx/QiFlowVFX.ts` | Shared player + enemy recovery particles |

---

## 6. Acceptance

- [x] Cultivator at 0 HP walks/sits at **spawn origin** in gather-qi pose — no death dissolve
- [x] Boss recovery timer **≥ 60 s** (visual); map completes on boss defeat
- [x] Normal cultivator recovers in **8–15 s** band; strong cultivator **20–45 s**
- [~] Player defeat shows **Try Again** → spawn origin gather-qi → full HP/mana (UI present; thin integration tests)
- [x] Beast opponents still despawn to pool (no meditation loop)
- [x] UI/locale uses **defeat** vocabulary for cultivators, not kill

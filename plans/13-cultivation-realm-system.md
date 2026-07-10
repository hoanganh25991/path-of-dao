# Sub-Plan 13: Cultivation Realm & Breakthrough

**Phase:** 4 — Progression  
**Estimated effort:** 10–12 hours  
**Depends on:** `04-stat-sheet-rpg-core`, `05-save-system-foundation`, `09-hitbox-damage-combat-math`  
**Blocks:** `14`, `16`, `25`

---

## 1. Objective

Implement the cultivation realm ladder, breakthrough requirements, cinematic breakthrough flow, and stat scaling that makes realm jumps feel transformative. Hero visual stage 4–5 (aura ring, crown glyph) triggers from realm progression: [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §4.1.

---

## 2. Realm Ladder (MVP)

| # | Realm ID | Display Key | Level Req | Boss Req | Spirit Cost |
|---|----------|-------------|-----------|----------|-------------|
| 1 | mortal_body | realm.mortal_body | 1 | — | — |
| 2 | qi_condensation | realm.qi_condensation | 5 | — | 50 |
| 3 | foundation | realm.foundation | 12 | ch1 boss | 120 |
| 4 | core_formation | realm.core_formation | 22 | ch3 boss | 250 |
| 5 | nascent_soul | realm.nascent_soul | 35 | ch5 boss | 500 |
| 6 | void_spirit | realm.void_spirit | 50 | ch7 boss | 900 |
| 7 | true_dao | realm.true_dao | 70 | ch9 boss | 1500 |

Each realm has tiers: early → mid → late → peak (auto-advance every 3 levels within realm band).

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/CultivationRealm.ts` | Realm state machine |
| `src/progression/BreakthroughManager.ts` | Requirements + ceremony |
| `src/progression/RealmStatScaling.ts` | Multipliers per realm |
| `content/progression/realms.json` | Realm definitions |
| `src/ui/modals/BreakthroughModal.ts` | Full-screen breakthrough UI |
| `src/ui/modals/breakthrough.css` | VFX overlay |

---

## 4. Realm Data Schema

```json
{
  "id": "foundation",
  "order": 3,
  "levelMin": 12,
  "levelMax": 21,
  "statMultiplier": { "hpMax": 1.15, "atk": 1.12, "def": 1.10 },
  "auraTier": "faint",
  "breakthrough": {
    "nextRealm": "core_formation",
    "spiritCost": 120,
    "requiredBoss": "boss.bandit_lord",
    "requiredMap": null
  }
}
```

---

## 5. CultivationRealm API

```typescript
interface CultivationRealmState {
  id: string;
  tier: 'early' | 'mid' | 'late' | 'peak';
  breakthroughReady: boolean;
}

class CultivationRealm {
  static getDefinition(id: string): RealmDefinition;
  static checkBreakthroughReady(save: PlayerSaveV1): boolean;
  static performBreakthrough(save: PlayerSaveV1): PlayerSaveV1;
  static updateTierFromLevel(state, level): CultivationRealmState;
}
```

`breakthroughReady` true when ALL:

- level >= next realm levelMin
- spirit >= cost
- required boss in `clearedBosses`
- optional map cleared

---

## 6. Breakthrough Ceremony Flow

1. Trigger from Home when ready — glowing **Cultivate** button on ProfileHeader
2. `BreakthroughModal` full screen:
   - Phase 1 (2s): screen darken, particles converge on hero (CSS + canvas particles)
   - Phase 2: localized text "Breaking through to {nextRealm}..."
   - Phase 3: lightning flash, aura tier upgrade on 3D hero
3. Apply:
   - Increment realm id
   - Reset tier to early
   - Spend spirit
   - Apply RealmStatScaling multipliers to base stats
   - Set `breakthroughReady: false`
4. Autosave + show stat delta popup (+HP, +ATK, etc.)

---

## 7. RealmStatScaling

Multipliers stack multiplicatively on base stats from level curve:

```typescript
function applyRealmScaling(base: BaseStats, realmId: string): BaseStats;
```

Also affects Combat Power realm multiplier in sub-plan 16.

---

## 8. In-Combat Realm Effects (Lite MVP)

Higher realm vs lower map enemies: damage bonus +10% per realm order above map `recommendedRealmOrder` (max +50%).

Implement in DamageCalculator optional param `attackerRealmOrder`.

---

## 9. Event Hooks

| Event | Action |
|-------|--------|
| Level up | updateTier, checkBreakthroughReady |
| Boss cleared | checkBreakthroughReady |
| Spirit gained | checkBreakthroughReady |

Emit `realm:breakthrough-ready` for UI glow.

---

## 10. Tests

| Test | Assert |
|------|--------|
| Below requirements | cannot breakthrough |
| All requirements | success, spirit deducted |
| Tier update | level 15 foundation → mid tier |
| Stat scaling | atk higher after breakthrough |

---

## 11. Acceptance Criteria

- [x] Player starts Mortal Body
- [x] Breakthrough button appears when conditions met (ProfileHeader CTA + `breakthrough-ceremony.test.ts`)
- [x] Ceremony plays without errors — `BreakthroughModal` unit-tested
- [x] Aura updates in Home after breakthrough — `HeroViewer.setRealm` + `homeSceneRefreshRealm` hook tested
- [x] Stats increase per realm multipliers
- [x] Save persists realm state
- [x] Unit tests pass

---

## 12. Narrative Alignment

Realm names match cultivation fiction tone from GDD. Chapter bosses gate mid-game realms — document mapping in `realms.json`.

---

## 13. Handoff

Sub-plan 14 insight XP may require minimum realm for awakenings. Sub-plan 25 enhances aura VFX per tier.

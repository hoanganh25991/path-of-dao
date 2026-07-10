# Sub-Plan 15: Fortuitous Encounter Events

**Phase:** 4 — Progression  
**Estimated effort:** 10–12 hours  
**Depends on:** `06-phaser-map-scene-base`, `05-save-system-foundation`, `14-insight-system`  
**Blocks:** `17`, `21`, `22`

---

## 1. Objective

Implement rare, memorable random events during map exploration — not common loot. Six encounter types for MVP with unique UI and lasting save consequences. Encounter modal art uses painterly cards; Dharma Treasure reward icons: [`design-arts/items/`](../design-arts/items/index.md). **Reward application API** shares [`item-system/encounter-rewards.md`](../item-system/encounter-rewards.md) with loot drops.

---

## 2. MVP Encounter Types

| ID | Name | Trigger | Reward |
|----|------|---------|--------|
| `encounter.ancient_inheritance` | Ancient Inheritance | 3% on map enter, once per save | Random epic Dharma Treasure |
| `encounter.hidden_cave` | Hidden Cave | interactable sparkle tile | Gold + Master Intent XP |
| `encounter.spirit_beast` | Spirit Beast | 2% after wave clear | Pet cosmetic unlock (Home) |
| `encounter.ancient_sword` | **Ancient Sword** | fixed POI per map max 1, ch1–2 only | **Grants `item.sword.ancient`** — the Ancient Spirit Sword milestone (see §7.1 below), not a generic weapon drop |
| `encounter.forgotten_memory` | Forgotten Memory | 1% on kill streak 10 | Story lore entry |
| `encounter.secret_manual` | Secret Manual | 2% on boss kill rematch | Divine Art variant unlock |

Rates tunable in JSON — must feel **rare** (player sees ~1 per 15–20 min).

### 2.1 `encounter.ancient_sword` — the fortuitous encounter (Renegade Immortal T2/T3)

This is *the* milestone encounter (`plans/index.md` §7.7), not interchangeable with the other
five. On apply, `FortuitousEncounterManager.apply()` must, atomically:

1. Add `item.sword.ancient` to inventory **and equip it** to the weapon slot (this is not left
   for the player to equip later — the story beat is the sword awakening, immediate).
2. Set `save.progress.weaponMilestone = 'ancient_sword'`.
3. Flip `CombatComponent.attackStyle` to `'sword'` (sub-plan 07) for the active player entity.
4. Unlock Sword Intent's Divine Arts on the wheel picker (sub-plan 14's sword gate check now
   passes; sub-plan 12's Divine Arts panel shows sword arts as assignable).
5. Play the story shard / sting associated with `encounter.ancient_sword` (sub-plan 18/25).

Steps 1–4 must land in the same save transaction — never a partial state where the sword is in
inventory but the milestone flag or attack-style swap hasn't happened.

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/progression/FortuitousEncounterManager.ts` | Roll + dispatch |
| `src/combat/systems/EncounterTrigger.ts` | Map hooks |
| `src/ui/modals/EncounterModal.ts` | Presentation |
| `content/encounters/fortuitous/*.json` | Per-type config |
| `content/encounters/fortuitous/_tables.json` | Rates, weights |

---

## 4. Encounter Flow

```
Trigger condition met
  → roll against rate (modified by Spirit stat + map discovery %)
  → if unique already in save.encountersFound, skip OR downgrade reward
  → pause combat (slow-mo 0.3x 1s)
  → EncounterModal cinematic card
  → apply reward
  → mark encountersFound
  → autosave
  → resume combat
```

---

## 5. FortuitousEncounterManager API

```typescript
class FortuitousEncounterManager {
  static rollOnMapEnter(mapId: string): EncounterDefinition | null;
  static rollOnWaveClear(mapId: string): EncounterDefinition | null;
  static rollOnKillStreak(count: number): EncounterDefinition | null;
  static apply(encounter: EncounterDefinition, save: PlayerSaveV1): PlayerSaveV1;
  static wasFound(id: string, save: PlayerSaveV1): boolean;
}
```

Pity timer optional: force uncommon encounter after 25 min none (config flag).

---

## 6. EncounterModal UI

Full-screen card with:

- Illustration placeholder (region-themed color gradient)
- Title + 2–3 sentence flavor text (localized keys)
- Primary button "Accept" / "Embrace the Dao"
- Particle burst on confirm

Examples from concept doc:

- *"An ancient will awakens within you..."*
- *"A spirit fox watches from the shadows..."*

---

## 7. Hidden Cave (POI)

Map JSON extension:

```json
{
  "pois": [
    { "type": "hidden_cave", "x": 400, "y": 300, "radius": 32 }
  ]
}
```

Sparkle sprite idle anim; player enters radius + interact button → guaranteed cave encounter (once per POI).

---

## 8. Spirit Beast → Home Pet

Unlock `pet.spirit_fox` in save:

```typescript
cosmetics: { pet: 'pet.spirit_fox' | null }
```

Sub-plan 10 HeroViewer spawns pet mesh orbiting hero — implement hook here, mesh in 25.

---

## 9. Forgotten Memory → Story Archive

Append lore entry id to `save.progress.loreUnlocked[]` — Story panel shows codex entries.

---

## 10. Save Schema Additions

```typescript
progress: {
  encountersFound: string[];
  loreUnlocked: string[];
}
cosmetics: {
  pet: string | null;
}
```

Migration: default empty in load if missing.

---

## 11. Tests

| Test | Assert |
|------|--------|
| Rate roll mock | respects 0–1 bounds |
| Unique encounter | second roll skipped |
| apply inheritance | adds item to inventory |
| POI interact | fires once |

Use seeded RNG injectable for deterministic tests.

---

## 12. Acceptance Criteria

- [x] At least 3 encounter types functional end-to-end
- [x] Encounter modal pauses player input during display — `EncounterTrigger` + `EncounterModal` unit-tested
- [x] Rewards persist in save
- [x] encountersFound prevents exact duplicate (where designed)
- [x] Hidden cave POI works on test map — `encounterForPoi` + `map.test.grove` POI id tested
- [ ] Encounter rate feels rare in 10-min manual test (dev multiplier for QA) — **manual only**
- [x] Unit tests pass (includes rate bounds + `peekEffectiveRate` cap)

---

## 13. Design Guardrails

- Never drop trash loot in encounter modal — always special
- Audio sting unique per type (sub-plan 25)
- Log encounter id to analytics hook stub for future telemetry

---

## 14. Handoff

Sub-plans 21–22 place POIs and tables per chapter map. Sub-plan 18 links forgotten memory to story archive UI.

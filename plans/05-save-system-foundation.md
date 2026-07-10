# Sub-Plan 05: Save System Foundation

**Phase:** 1 — Core Engine  
**Estimated effort:** 8–10 hours  
**Depends on:** `04-stat-sheet-rpg-core`  
**Blocks:** `12`, `15`, `17`, all content sub-plans

---

## 1. Objective

Implement versioned save/load with IndexedDB, autosave hooks, checksum integrity, and export/import JSON. Supports "save anywhere" MVP requirement.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `src/core/save/SaveManager.ts` | Public API |
| `src/core/save/SaveSchema.ts` | Zod v1 schema |
| `src/core/save/SaveMigration.ts` | Version migrations |
| `src/core/save/SaveSlot.ts` | Slot metadata |
| `src/core/save/checksum.ts` | FNV-1a or SHA-256 lite |
| `src/core/store/gameStore.ts` | Zustand store wrapping save state |
| `tests/unit/save-manager.test.ts` | Round-trip tests |

---

## 3. Save Schema v1

```typescript
type DivineArtSlot = 'primary' | 'secondary' | 'ultimate' | 'skill3' | 'skill4' | 'skill5';

interface PlayerSaveV1 {
  version: 1;
  checksum: string;
  heroId: 'hero.wanderer';
  stats: BaseStats;
  runtime: { hp: number; mana: number };
  xp: number;
  realm: {
    id: string;
    tier: 'early' | 'mid' | 'late' | 'peak';
    breakthroughReady: boolean;
  };
  // Master Intent (Ý Cảnh) state, keyed by intent id (sword/void/flame/lightning/time/life).
  // Field name `insights` kept as the internal key per plans/index.md §1.2 canon.
  insights: Record<string, { xp: number; awakened: boolean }>;
  // Dharma Treasures (Pháp Bảo). Field names `inventory`/`items` kept internal; content IDs
  // stay `item.*`. Player-facing UI always says "Dharma Treasures".
  inventory: {
    items: Array<{ id: string; qty: number }>;
    gold: number;
  };
  equipped: Record<'weapon' | 'armor' | 'accessory' | 'spirit', string | null>;
  // Divine Arts (Thần Thông) 6-slot combat wheel — plans/index.md §1.2/§2.1. No duplicates.
  divineArts: Record<DivineArtSlot, string | null>;
  progress: {
    clearedMaps: string[];
    clearedBosses: string[];
    unlockedChapters: string[];
    storySeen: string[];
    encountersFound: string[];
    currentMapId: string | null;
    // Renegade Immortal weapon arc (§7.7, track T1/T4): drives unarmed vs. sword combo + Sword Intent gate.
    weaponMilestone: 'none' | 'ancient_sword';
    // My Path (sub-plan 28, §7.9) — snapshot-once entries, never recomputed.
    journey: JourneyEntry[];
  };
  settings: {
    locale: 'en' | 'vi';
    sfxVolume: number;
    musicVolume: number;
  };
  meta: {
    totalPlaySeconds: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface JourneyEntry {
  kind: 'map_clear' | 'boss' | 'breakthrough' | 'encounter' | 'story';
  refId: string;
  mapId: string | null;
  realmId: string;
  level: number;
  cp: number;
  at: string;
}
```

Default new game via `SaveManager.createNew()`:

- level 1 stats from `base-stats.json`
- realm `mortal_body.early`
- `unlockedChapters: ['chapter.01.fallen_village']`
- locale from browser or `'en'`
- **Renegade Immortal humble start (T1, §7.7 rule 1) — non-negotiable:** `equipped.weapon = null` and
  `progress.weaponMilestone = 'none'`. Do **not** seed `item.sword.wood` or any weapon into the
  weapon slot; the hero fights unarmed until the Ancient Spirit Sword POI (`encounter.ancient_sword`,
  sub-plan 15) grants `item.sword.ancient` and flips the milestone.
- `divineArts` starts with only the `starter` unlocks from `content/progression/skill-unlocks.json`
  filled in; remaining slots `null`.
- `progress.journey = []` — first entry is recorded by the map/chapter/breakthrough systems
  (sub-plan 28), not by `createNew()`.

---

## 4. SaveManager API

```typescript
class SaveManager {
  static async init(): Promise<void>;
  static get hasSave(): boolean;
  static async load(slot?: number): Promise<PlayerSaveV1>;
  static async save(state: PlayerSaveV1): Promise<void>;
  static async delete(slot?: number): Promise<void>;
  static exportJson(): string;
  static importJson(json: string): Promise<PlayerSaveV1>;
  static onAutosave(cb: () => void): void;
}
```

### 4.1 IndexedDB layout

Database: `path-of-dao`  
Store: `saves`  
Key: `slot_{0|1|2}` — MVP single slot `slot_0` only; schema supports 3

### 4.2 Checksum

Before write: `checksum = hash(JSON.stringify(dataWithoutChecksum))`  
On load: recompute; mismatch → throw `SaveCorruptError` with user-facing recovery (offer new game or import)

### 4.3 Autosave triggers

Register in SaveManager.init():

| Event | Action |
|-------|--------|
| `scene:changed` | debounced save 2s |
| Map cleared | immediate save |
| Boss defeated | immediate save |
| Realm breakthrough | immediate save |
| `beforeunload` | synchronous best-effort save via `navigator.sendBeacon` fallback |

Debounce via 2s timer reset.

---

## 5. Game Store (Zustand)

```typescript
interface GameStore {
  save: PlayerSaveV1 | null;
  isLoaded: boolean;
  load(): Promise<void>;
  patch(partial: Partial<PlayerSaveV1> | ((s) => Partial)): void;
  persist(): Promise<void>;
}
```

`patch` merges immutably, updates `meta.updatedAt`.

Connect to SaveManager on `persist()`.

---

## 6. Migration Strategy

`SaveMigration.ts`:

```typescript
function migrate(raw: unknown): PlayerSaveV1;
```

v1 only for now — structure returns parsed v1 or throws. When v2 added:

```typescript
if (version === 1) return migrateV1toV2(data);
```

---

## 7. Export / Import

Export: pretty JSON download via blob `path-of-dao-save.json`  
Import: file picker → validate Zod → checksum → overwrite slot with confirm modal (UI stub OK — `window.confirm` MVP)

---

## 8. Play Time Tracking

`GameClock` or SaveManager interval every 60s while app visible:

```typescript
patch({ meta: { totalPlaySeconds: prev + 60 } });
```

Pause when `document.hidden`.

---

## 9. Tests

Use `fake-indexeddb` pnpm dev dependency for Vitest.

| Test | Assert |
|------|--------|
| createNew → save → load | deep equal except timestamps |
| tampered checksum | throws SaveCorruptError |
| export → import | round trip |
| migrate invalid version | throws |

---

## 10. Acceptance Criteria

- [x] Fresh boot with no save → createNew available
- [x] Save survives page reload
- [x] Checksum detects manual DB tampering
- [x] Autosave fires on scene change (verify with mock timer)
- [x] Export/import works
- [x] gameStore.patch + persist updates IndexedDB
- [x] All unit tests pass

---

## 11. Security Note

Save is client-side only — no anti-cheat for MVP. Document for future server validation if needed.

---

## 12. Handoff

All gameplay sub-plans read/write via `useGameStore` or `SaveManager.load`. Never write IndexedDB directly elsewhere.

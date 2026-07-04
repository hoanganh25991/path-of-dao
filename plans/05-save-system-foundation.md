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
  insights: Record<string, { xp: number; awakened: boolean }>;
  inventory: {
    items: Array<{ id: string; qty: number }>;
    gold: number;
  };
  equipped: Record<'weapon' | 'armor' | 'accessory' | 'spirit', string | null>;
  progress: {
    clearedMaps: string[];
    clearedBosses: string[];
    unlockedChapters: string[];
    storySeen: string[];
    encountersFound: string[];
    currentMapId: string | null;
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
```

Default new game via `SaveManager.createNew()`:

- level 1 stats from `base-stats.json`
- realm `mortal_body.early`
- `unlockedChapters: ['chapter.01.fallen_village']`
- locale from browser or `'en'`

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

- [ ] Fresh boot with no save → createNew available
- [ ] Save survives page reload
- [ ] Checksum detects manual DB tampering
- [ ] Autosave fires on scene change (verify with mock timer)
- [ ] Export/import works
- [ ] gameStore.patch + persist updates IndexedDB
- [ ] All unit tests pass

---

## 11. Security Note

Save is client-side only — no anti-cheat for MVP. Document for future server validation if needed.

---

## 12. Handoff

All gameplay sub-plans read/write via `useGameStore` or `SaveManager.load`. Never write IndexedDB directly elsewhere.

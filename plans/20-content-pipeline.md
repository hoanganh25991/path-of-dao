# Sub-Plan 20: Content Pipeline & Validators

**Phase:** 5 — World & Content  
**Estimated effort:** 8–10 hours  
**Depends on:** `05-save-system-foundation`  
**Parallel with:** `06–12` (combat + home tracks) — **start as soon as save exists**; see [`index.md`](./index.md) §5.1 Track C  
**Blocks:** `21`, `22`, `23`

---

## 1. Objective

Build tooling to author, validate, and bundle game content JSON. Catch broken references before runtime. Enable content iteration without code changes. Validate optional `visual` blocks on skills/enemies per [`plans/29-pixel-art-combat-canon.md`](./29-pixel-art-combat-canon.md) §11 and **timeline shards** per [`plans/31-wang-lin-story-timeline.md`](./31-wang-lin-story-timeline.md) §4.

---

## 2. Deliverables

| File | Purpose |
|------|---------|
| `tools/content/validate-all.ts` | Master validator CLI |
| `tools/content/schemas/*.ts` | Zod schemas per content type |
| `tools/content/lint-crossrefs.ts` | ID reference integrity |
| `tools/content/pack-manifest.ts` | Build content manifest |
| `src/shared/content/ContentLoader.ts` | Runtime loader + cache |
| `package.json` script | `"content:validate"` |

---

## 3. Content Types & Schemas

| Type | Directory | Key refs |
|------|-----------|----------|
| Map | content/maps/ | tiledPath, encounterTable, chapterId, **timelineShardId**, **bounds**, **environment**, **settlements**, **signatureTree** |
| Enemy | content/enemies/ | lootTable, spriteKey |
| Skill | content/skills/ | intent, effects |
| Item | content/items/ | slot, modelId, **iconKey**, lootTags |
| Loot | content/loot/ | weighted `itemId` entries — plan `33` |
| Chapter | content/chapters/ | storySceneId, maps[] |
| Story | content/story/ | slides, rewards |
| **Timeline** | content/story-timeline/ | mapId, intentLesson, punchlineKey, slides |
| Encounter | content/encounters/ | enemy ids |
| Fortuitous | content/encounters/fortuitous/ | reward items |
| World | content/world/ | mapIds |
| Realms | content/progression/ | boss ids |
| Locales | content/locales/ | key coverage |

### 3.1 Map schema extensions ([`map-design-canon.md`](./map-design-canon.md))

Required on every `content/maps/*.json`:

| Field | Rule |
|-------|------|
| `bounds` | `{ width: 16000, height: 12160 }` — 100× prototype stub area |
| `environment` | `regionId`, `palette`, `weather`, `parallaxTint`, `groundAccent`, `uniqueness[]` (2–4 tags) |
| `settlements[]` | ≥1 cluster: `id`, `type`, `center`, `radius`, `structures[]`, optional `encounterZone` |
| `signatureTree` | `propId`, `position`, `displayNameKey`, optional `loreKey`, `minHeightPx`, `canopyRadius` |

Zod rejects maps missing any of the above; sibling `.01`/`.02` pairs must differ on `environment.uniqueness` and `signatureTree.propId`.

---

## 4. validate-all.ts

```bash
pnpm content:validate
```

Exit code 1 on any error. Output:

```
✓ maps (20 files)
✓ enemies (25 files)
✗ skill.skill.foo.json — unknown effect type "teleport"
Summary: 1 error, 0 warnings
```

Run in CI (sub-plan 26).

---

## 5. Cross-Reference Lint Rules

| Rule | Example error |
|------|---------------|
| map.chapterId exists | chapter.99 missing |
| map bounds 16k×12k | map.foo — bounds not 16000×12160 |
| map signatureTree | missing on map.* |
| map settlements | empty settlements[] |
| map environment.uniqueness | duplicate vs sibling .01/.02 |
| encounter enemy id exists | enemy.dragon undefined |
| loot item id exists | item.foo missing |
| item icon file (warn) | item.foo.json — no assets/sprites/items/item.foo.png |
| story textKey in locale | story.ch01.slide99 missing in vi |
| world mapId exists | map.typo.01 |
| boss required by realm exists | boss.x undefined |
| skill intent valid | intent "fire" invalid |

---

## 6. Locale Key Coverage

For each `textKey` in story/skills/items:

- Must exist in `en` JSON
- Warn if missing in `vi` (error in strict mode flag `--strict-i18n`)

---

## 7. ContentLoader (Runtime)

```typescript
class ContentLoader {
  static async init(): Promise<void>;
  static getMap(id: string): MapConfig;
  static getEnemy(id: string): EnemyDefinition;
  static getSkill(id: string): SkillDefinition;
  // ...
}
```

Dev: fetch JSON dynamically.  
Prod: import from generated `content/manifest.json` bundled at build.

---

## 8. pack-manifest.ts

Build step generates:

```json
{
  "version": "content-2026-07-02",
  "maps": ["map.fallen_village.01", "..."],
  "checksum": "..."
}
```

Vite plugin or prebuild script: `pnpm content:pack`

---

## 9. Tiled Map Pipeline

Document in `tools/content/README.md`:

1. Edit `.tmx` in Tiled
2. Export JSON to `assets/maps/{name}.json`
3. Register in `content/maps/{id}.json`
4. Run validate

Optional script `tools/content/sync-tiled.ts` copies exports.

---

## 10. Tests

| Test | Assert |
|------|--------|
| validate valid fixture | exit 0 |
| broken ref fixture | exit 1 with message |
| ContentLoader | throws on missing id |

Fixtures in `tests/fixtures/content/`.

---

## 11. Acceptance Criteria

- [x] `pnpm content:validate` runs on empty/minimal content without crash
- [x] Schemas reject malformed JSON with path in error
- [x] Crossref lint catches dangling enemy id (unit test)
- [x] ContentLoader loads test map in MapScene
- [x] pack-manifest generates file list
- [x] Documentation in tools/content/README.md

---

## 12. Authoring Conventions Doc

Include in README:

- ID naming: `{domain}.{name}` lowercase snake segments
- Never rename ids after ship — add alias map instead
- recommendedCp guidelines per chapter band

---

## 13. Handoff

Sub-plans 21–23 author content using this pipeline. All content PRs must pass validate.

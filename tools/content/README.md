# Content Pipeline

Authoring, validation, and packaging for Path of Dao JSON content.

## Commands

```bash
pnpm content:validate          # schema + cross-ref lint (exit 1 on error)
pnpm content:validate --strict-i18n   # vi locale gaps become errors
pnpm i18n:lint                      # en/vi key parity
pnpm i18n:bestiary                  # stub bestiary entries from enemies
pnpm content:pack              # write content/manifest.json
```

## ID conventions

- Format: `{domain}.{name}` with lowercase snake segments — e.g. `map.fallen_village.01`, `enemy.slime`, `skill.void.slash`
- **Never rename shipped IDs** — add aliases in loaders if a display name changes
- Maps: `map.{region}.{stage}` where stage is `01` / `02`
- Chapters: `chapter.{nn}.{slug}`

## recommendedCp bands (starter guide)

| Chapter | CP range (stage 1 / 2) |
|---------|-------------------------|
| 1–2 | 800–1,600 |
| 3–5 | 2,500–4,500 |
| 6–8 | 5,000–8,000 |
| 9–10 | 9,000–12,000 |

Use `pnpm cp:calc` to tune loadouts.

## Tiled map workflow

1. Edit `.tmx` in [Tiled](https://www.mapeditor.org/)
2. Export JSON to `assets/maps/{name}.json`
3. Add `content/maps/{mapId}.json` pointing at `tiledPath` + `tilesetName`
4. Run `pnpm content:validate`

## Validation rules

| Check | Example failure |
|-------|-----------------|
| Zod schema per file | invalid skill `intent` |
| Filename ↔ `id` field | `skill.foo.json` declares `id: "skill.bar"` |
| Map `chapterId` | unknown chapter |
| Encounter enemy refs | `enemy.dragon` missing |
| World `mapId` nodes | typo in world-map.json |
| Story `textKey` | missing `en` locale string |
| Fortuitous item rewards | dangling `itemId` |

## Runtime loader

`ContentLoader` in `src/shared/content/ContentLoader.ts` wraps map/enemy/skill/item/story loaders for a single API.

## CI

Run `pnpm content:validate` before merging content PRs (sub-plans 21–23).

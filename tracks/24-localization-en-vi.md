# 24 — Localization en + vi

**Status:** `[~]` In progress  
**Plan:** [plans/24-localization-en-vi.md](../plans/24-localization-en-vi.md)  
**Last updated:** 2026-07-10

## Summary

Full UI and content strings in English and Vietnamese with parity checks.

## Done

- Locale manager with runtime switch and save persistence
- Number and duration formatters for UI
- Missing-key fallback in development builds
- Locale lint: en/vi key parity and empty value checks wired into content validation
- Glossary for consistent cultivation terminology
- System, home, world, story, skills, enemies, bestiary locale files
- **`story.json`** — 10 chapters × 6 slides Wang Lin prose (plan 18)
- **`timeline.json`** — 20-map Dao Scroll prose (plan 31)
- Bestiary entries generated for all enemies (41 entries)
- Settings modal language picker
- Noto Sans in font stack for Vietnamese diacritics
- ~~`home.path.dao_scroll` tab label when Dao Scroll UI ships (31)~~ `[x]` — already shipped in both locales (`Dao Scroll` / `Đạo Thư`)
- **P1 #10 pass (2026-07-10):**
  - `pnpm i18n:lint --strict` was failing with 38 missing-vi-key errors — all the `dharma.*`, `divine.*`, and `intent.name`/`.semantics`/`.awakened`/`.comprehend` label keys from the Dharma Treasures/Divine Arts/Master Intent rename existed only in `en/home.json`. Added full vi translations for all 38 (tiers, slots, detail-panel stat labels) plus `home.dharma.slot_empty` / `home.dharma.slot_click_to_filter`. `--strict` now passes with 0 errors, 0 warnings.
  - Hardcoded English string audit of `src/ui` (grep for literal `aria-label`/`textContent`/`title` strings not routed through `I18nManager.t`): the codebase was already disciplined — only 4 hits, 1 of which (`Frames per second` FPS counter aria-label) is dev-only and intentionally left as-is. Fixed the other 3 (`combat.skills.picker_close`, `home.nav.aria` — new keys; `home.dharma.close` — reused existing key) in `CombatSkillPicker.ts`, `BottomNav.ts`, `InventoryPanel.ts`.
  - Vietnamese overflow: audited CSS across `home.css`, `skill-detail.css`, `skill-showcase.css`, `combat-hud.css`, `player-status.css`, `combat-skill-picker.css`, `combat-map-title.css`, modal CSS. Single-line truncation spots (ancient echo cards, combat map title, ancient-demo skill rows) already have `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`. The two real risk spots were multi-tab bars sharing `flex: 1` at small font-size with noticeably longer vi labels: `.home-profile__sub-tab` (5-way Stats/Dharma/Divine/Intent/Destiny bar — "Hồ Sơ Nhân Vật" vs "Character Profile") and `.home-path-tabs__tab` (My Path/Dao Scroll — "Con Đường Của Ta" vs "My Path"). Added `document.documentElement.lang` sync in `I18nManager.load()` and `:lang(vi)` CSS overrides (smaller font-size, tighter padding) for both, plus `overflow-wrap: break-word` as a safety net. Did not touch bottom-nav (4 short tabs, plan §8 already allows 2-line stacking) or combat HUD (icon-only action buttons, no text overflow surface).

## What needs to do

| # | Task |
|---|------|
| 1 | Full UI string audit — every screen in both locales (see P1 #10 note above for what's covered; combat HUD debug-only strings like FPS counter intentionally left English) |
| 2 | Layout overflow pass for longer Vietnamese strings (640px) — 2 known risk spots fixed via `:lang(vi)`; remaining screens (world map POI labels, story reader, encounter/destiny modals) reviewed and are wrap-safe already, not exhaustively viewport-tested on-device |
| 3 | Lint: add `timeline.json` to strict-i18n if not already covered — confirmed: `lintI18n` merges every `*.json` under `content/locales/{en,vi}/`, so `timeline.json` is already included |

## Remaining

- On-device visual QA pass for vi at 640px+ (this session did a code/CSS audit, not a live-browser walkthrough)
- FPS counter aria-label (`TopRightHud.ts`) is intentionally still hardcoded English — dev/debug-only overlay, not user-facing content

## Verification

- `pnpm i18n:lint` and `pnpm i18n:lint --strict` (via `I18N_STRICT=1`) both green — 0 errors, 0 warnings
- `pnpm content:validate --strict-i18n` green
- `pnpm test` — 587/587 passing
- `pnpm typecheck` clean

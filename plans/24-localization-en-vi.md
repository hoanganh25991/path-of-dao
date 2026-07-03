# Sub-Plan 24: Localization — English & Vietnamese

**Phase:** 7 — Polish & Ship  
**Estimated effort:** 10–14 hours  
**Depends on:** `12`, `18`, `20`, `21`, `22`, `23`  
**Blocks:** `26`

---

## 1. Objective

Full UI and content localization for `en` and `vi` per GDD. Vietnamese is not machine-translated placeholder — cultivation terms use consistent glossary.

---

## 2. Scope

| Category | Est. keys |
|----------|-----------|
| Home UI | 40 |
| Combat HUD | 25 |
| Story slides ch1–10 | 200 |
| Enemy/boss names | 33 |
| Skill names/desc | 80 |
| Items | 30 |
| Realms/insights | 40 |
| Encounters | 30 |
| System messages | 50 |
| **Total** | ~530 |

---

## 3. Deliverables

| File | Purpose |
|------|---------|
| `src/core/i18n/I18nManager.ts` | Enhance from sub-plan 12 stub |
| `src/core/i18n/loadLocale.ts` | Lazy load bundles |
| `content/locales/en/**/*.json` | English |
| `content/locales/vi/**/*.json` | Vietnamese |
| `content/locales/glossary.md` | Term mapping |
| `tools/content/lint-i18n.ts` | Key parity checker |

---

## 4. Glossary (Canonical Terms)

| en | vi | Notes |
|----|-----|-------|
| Cultivate | Tu luyện | Home breakthrough button |
| Realm Breakthrough | Đột phá cảnh giới | |
| Home | Nhà | |
| Inventory | Túi đồ | |
| Skills | Kỹ năng | |
| Story | Cốt truyện | |
| Map | Bản đồ | |
| Boss | Boss | Keep loanword or "Yêu thú" per boss — document |
| Play | Chơi | |
| Continue | Tiếp tục | |
| Combat Power | Uy lực tu l tiên | or "Lực chiến" — pick one in glossary |
| Insight | Ý cảnh | Sword Intent → Kiếm ý |
| Fortuitous Encounter | Cơ duyên | |

All translators/agents must follow `glossary.md`.

---

## 5. I18nManager API (Final)

```typescript
class I18nManager {
  static async setLocale(locale: 'en' | 'vi'): Promise<void>;
  static get locale(): string;
  static t(key: string, params?: Record<string, string | number>): string;
  static formatNumber(n: number): string;
  static formatDuration(seconds: number): string;
}
```

Interpolation: `t('map.recommended_cp', { cp: '12,000' })`

Number formatting: `vi-VN` locale separators.

---

## 6. File Organization

```
content/locales/en/
  home.json
  combat.json
  story/ch01.json … ch10.json
  enemies.json
  skills.json
  items.json
  system.json
content/locales/vi/
  (mirror structure)
```

Merge at load — do not single giant file (lazy load story by chapter).

---

## 7. Font Support

Vietnamese diacritics:

- CSS `font-family: system-ui, "Noto Sans", sans-serif`
- Load Noto Sans subset woff2 if system fallback insufficient
- Test string: "Đột phá cảnh giới Hư Không"

---

## 8. UI Layout Rules

- Allow 40% width expansion for vi buttons
- Bottom nav labels may stack two lines
- Story reader scroll if text overflows — no truncation

---

## 9. Runtime Locale Switch

Settings panel in Home (gear icon):

- Toggle en/vi → update save.settings.locale → reload text without scene restart

---

## 10. Validation

```bash
pnpm content:validate --strict-i18n
```

`lint-i18n.ts`:

- All en keys exist in vi
- No unused keys warning (optional)
- No empty string values

---

## 11. Story Translation Quality

Chapter 1 vi sample tone (authoring guide):

- Literary but readable
- Keep cultivation xianxia flavor
- Avoid overly literal English calques

Each chapter review checklist in `content/locales/vi/REVIEW.md`.

---

## 12. Tests

| Test | Assert |
|------|--------|
| t('home.play') | returns non-key string en+vi |
| missing key | returns `[missing:key]` dev only |
| param interp | works |
| switch locale | updates bound UI mock |

---

## 13. Acceptance Criteria

- [ ] All UI strings localized both languages
- [ ] Story ch1–10 complete in vi
- [ ] Glossary consistent across files
- [ ] strict-i18n validator passes
- [ ] No layout overflow on vi iPhone 14 viewport
- [ ] Locale persists in save
- [ ] formatNumber respects locale

---

## 14. Handoff

Sub-plan 26 includes i18n in ship checklist. Future languages add `content/locales/{locale}/` folder + glossary extensions.

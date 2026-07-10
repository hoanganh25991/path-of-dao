# Path of Dao — Localization Glossary

Canonical **en → vi** terms for all locale files. Follow these consistently; do not mix synonyms within the same category.

| English | Vietnamese | Usage |
|---------|------------|-------|
| Cultivate | Tu luyện | Breakthrough ceremony button |
| Realm Breakthrough | Đột phá cảnh giới | Modal title |
| Home | Nhà | Bottom nav |
| Inventory | Túi đồ | Bottom nav |
| Skills | Kỹ năng | Bottom nav |
| Story | Cốt truyện | Bottom nav |
| Map / World Map | Bản đồ / Bản đồ thế giới | Travel UI |
| Play | Chơi | Launch combat |
| Continue | Tiếp tục | Story reader |
| Combat Power | Uy lực tu tiên | Profile (also `Lực chiến` for recommended CP on world map) |
| Master Intent | Ý cảnh | Progression meter (plan 14 redesign — internal save field stays `insights`) |
| Life & Death Intent | Sinh Tử Ý Cảnh | Main-flow intent, order 1 — always unlocked |
| Cause & Effect Intent | Nhân Quả Ý Cảnh | Main-flow intent, order 2 — unlocks after Life & Death awakened |
| Truth & Falsehood Intent | Chân Giả Ý Cảnh | Main-flow intent, order 3 — unlocks after Cause & Effect awakened |
| Sword Intent | Kiếm ý | Gate-flow intent — Ancient Spirit Sword milestone |
| Fortuitous Encounter | Cơ duyên | Random events |
| Boss | Boss | Keep loanword; elite bosses may use descriptive vi names |
| Awaken / Awakening | Giác ngộ | Skill ceremony |

## Tone guide (Vietnamese story)

- Literary but readable — xianxia flavor without overly literal calques.
- Test diacritics: **Đột phá cảnh giới Hư Không**

## Validation

```bash
pnpm i18n:lint              # en/vi key parity
pnpm content:validate --strict-i18n
```

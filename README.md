# Path of Dao

Mobile-first cultivation action RPG — 2D combat maps, 3D Home shrine, PWA for mobile.

**Deploy:** [hoanganh25991.github.io/path-of-dao](https://hoanganh25991.github.io/path-of-dao) · Vite base `/path-of-dao/` · build output **`docs/`** (GitHub Pages) · project notes in **`handbook/`**

## Development

```bash
pnpm install
pnpm dev          # http://localhost:5173/path-of-dao/
pnpm build        # docs/ for GitHub Pages (Settings → Pages → /docs folder)
pnpm preview      # http://localhost:4173/path-of-dao/
```

Regenerate app icons (favicon + PWA):

```bash
pnpm icons:gen
```

## Documentation

### Ideas (core)

- [ideas/game-concept.md](ideas/game-concept.md) — high concept, pillars, Home, stats, story regions
- [ideas/void-ascension.md](ideas/void-ascension.md) — vision, cultivation loop, fortuitous encounters, naming candidates

### Handbook (design & QA notes)

- [handbook/SHIP_CHECKLIST.md](handbook/SHIP_CHECKLIST.md) — manual ship QA
- [handbook/tien-nghich-reference.md](handbook/tien-nghich-reference.md) — story north star
- [handbook/pixel-art-style.md](handbook/pixel-art-style.md) — art canon

### Plans & tracks

- [plans/index.md](plans/index.md) — master implementation plan (what to build)
- [tracks/index.md](tracks/index.md) — master progress index (what is done)

After `pnpm build`, commit the generated **`docs/`** folder and set **GitHub → Settings → Pages → Deploy from branch → `/docs`**.

---

## Google Play listing

Store assets: [`google-play-assets/upload/`](google-play-assets/upload/) · Promo video: [YouTube](https://youtu.be/IoqsmkrdJxk)

| Field | English | Tiếng Việt |
|-------|---------|------------|
| **App name** | Path of Dao | Path of Dao |
| **Short description** (80 chars max) | Wang Lin's road, map by map. Master Intent, Divine Arts & Dharma Treasures. | Hành trình Vương Lâm — từng bản đồ. Thần Thông, Pháp Bảo, Ý Cảnh. |
| **Category** | Role Playing | Nhập vai |
| **Tags** | cultivation, xianxia, action RPG, offline, story | tu tiên, tiên hiệp, nhập vai, offline, cốt truyện |

### Short description — copy/paste

**EN (79 chars)**

```
Wang Lin's road, map by map. Master Intent, Divine Arts & Dharma Treasures.
```

**VI (68 chars)**

```
Hành trình Vương Lâm — từng bản đồ. Thần Thông, Pháp Bảo, Ý Cảnh.
```

### Full description — English

```
Path of Dao follows Vương Lâm (Wang Lin) on the Tiên Nghịch road — an ordinary mortal rejected for poor talent, who survives through stubborn will, not destiny.

YOUR ROAD, MAP BY MAP
The inner world opens one star-region at a time. Each chapter is two maps — explore, then face the ordeal boss — and a story scene that advances Wang Lin's timeline. Retreat anytime if a map is too hard; farm earlier stars, break through your realm, and return stronger. That is the cultivation road.

10 CHAPTERS · INNER WORLD TIMELINE
① Wang Family Village — Heng Yue rejects you; the village falls. Empty hands only.
② Ghost Spirit Mountain — mist, spirit fox, and the Heaven Reverse Sword POI.
③ Zhao Kingdom — bandit cultivators on the tempered road.
④ Moon Lake Ruins — an ancient seal stirs beneath the water.
⑤ Fire Burn Country — sand spirits and flame trials.
⑥ Heavenly Tribulation Pass — lightning intent and heaven's test.
⑦ Ice Palace Ruins — a forgotten queen in the frozen halls.
⑧ Inner Demon Pass — corruption and the rift of the heart.
⑨ Lôi Tiên Gate — guardians at the threshold.
⑩ Thunder Immortal Hall — the summit of the sealed inner world.

THREE PILLARS OF POWER
• Intent (Ý Cảnh) — Sword, Void, Flame, Lightning, Time, Life. Channel an intent in combat; comprehension deepens until arts awaken.
• Divine Abilities (Thần Thông) — profound techniques seized from ordeals, POIs, and fortuitous encounters. Equip up to six on the combat wheel.
• Dharma Treasures (Pháp Bảo) — artifacts, spirit gear, and relics from bosses and hidden sites. Each treasure raises combat power and carries lore from the road.

FEATURES
• One-thumb 2D combat — move, attack, dodge, cast divine arts
• 3D Home shrine — cultivate, breakthrough realms, manage loadout
• World map portal — Chu Tước Star → La Thiên Domain → Thunder Immortal Realm
• My Path journal — replay every story beat and milestone
• Echoes — walk the path of ancient cultivators in god-mode preview
• English & Vietnamese — full UI and chapter stories

Start as a mocked mortal. End at Thunder Immortal Hall. Perseverance is the Dao.
```

### Full description — Tiếng Việt

```
Path of Dao theo chân Vương Lâm trên con đường Tiên Nghịch — thiếu niên phàm nhân bị chê linh căn tệ, sống nhờ ý chí kiên trì, không phải định mệnh.

CON ĐƯỜNG CỦA BẠN — TỪNG BẢN ĐỒ MỘT
Nội giới mở từng tinh vực. Mỗi chương gồm hai bản đồ — thám hiểm, rồi thử thách trùm — và một cảnh cốt truyện đẩy mốc thời gian Vương Lâm tiến lên. Bản đồ quá khó? Rút lui bất cứ lúc nào; tu luyện ở chân tinh cũ, đột phá cảnh giới, rồi quay lại mạnh hơn. Đó mới là đạo tu.

10 CHƯƠNG · DÒNG THỜI GIAN NỘI GIỚI
① Vương Gia Thôn — Hằng Nhạc từ chối; làng chìm tro tàn. Chỉ có đôi tay trần.
② U Linh Sơn — sương mù, hồ ly tinh, và điểm Thiên Nghịch Kiếm.
③ Triệu Quốc — tặc tu trên con đường rèn ý chí.
④ Hồ Nguyệt Cổ Tích — phong ấn cổ xưa rung động dưới đáy hồ.
⑤ Hỏa Phần Quốc — yêu cát và thử lửa.
⑥ Ải Thiên Kiếp — ý lôi và thiên kiếp thử thách.
⑦ Băng Cung Di Tích — nữ vương bị lãng quên trong cung băng.
⑧ Ải Tâm Ma — tà khí và vết nứt tâm ma.
⑨ Cổng Lôi Tiên — hộ vệ ở ngưỡng cửa.
⑩ Lôi Tiên Điện — đỉnh nội giới dưới Phong Giới Đại Trận.

BA TRỤ CỘT TU LUYỆN
• Ý Cảnh — Kiếm, Hư, Hỏa, Lôi, Thời, Sinh. Vận ý trong chiến đấu; ngộ tính dần sâu đến khi thần thông giác ngộ.
• Thần Thông — kỹ thuật thâm sâu từ thử thách, địa điểm ẩn, và cơ duyên. Trang bị tối đa sáu trên vòng kỹ năng chiến đấu.
• Pháp Bảo — thần khí, bảo vật, di vật từ trùm và di tích. Mỗi pháp bảo tăng lực chiến và mang huyền thoại của con đường.

TÍNH NĂNG
• Chiến đấu 2D một tay — di chuyển, tấn công, né, thi triển thần thông
• Nhà 3D — tu luyện, đột phá cảnh giới, quản lý trang bị
• Cổng Tinh Vực — Chu Tước Tinh → La Thiên Tinh Vực → Lôi Tiên Giới
• Con Đường Của Ta — xem lại từng mốc cốt truyện
• Tiên Cổ — bước theo lộ trình tiên nhân trong chế độ thử
• Song ngữ Anh – Việt — giao diện và cốt truyện đầy đủ

Bắt đầu là kẻ bị chê. Kết thúc tại Lôi Tiên Điện. Kiên trì mới là Đạo.
```

### What's new (first release)

**EN:** MVP launch — 10 chapters, Wang Lin's road from Wang Family Village to Thunder Immortal Hall. Intent, Divine Abilities, Dharma Treasures, realm breakthrough, fortuitous encounters, Echoes demo, EN/VI.

**VI:** Phát hành MVP — 10 chương, con đường Vương Lâm từ Vương Gia Thôn đến Lôi Tiên Điện. Ý Cảnh, Thần Thông, Pháp Bảo, đột phá cảnh giới, cơ duyên, Tiên Cổ, song ngữ Anh–Việt.

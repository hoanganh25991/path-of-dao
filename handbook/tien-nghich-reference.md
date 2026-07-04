# Tiên Nghịch — Story Reference (for Path of Dao)

> **Source work:** *Tiên Nghịch* (Vietnamese) = **仙逆** *Xiān Nì* (**Renegade Immortal**, Er Gen / 耳根).  
> **Legal:** Path of Dao uses *Tiên Nghịch* cosmology, protagonist **Vương Lâm** (Wang Lin), and story beats for player clarity.  
> **Implementation track:** [tracks/tien-nghich-alignment.md](../tracks/tien-nghich-alignment.md) (T1–T8) · **Master plan:** [plans/index.md](../plans/index.md) §1.1, §7.7, §7.8

---

## What it is (one paragraph)

*Tiên Nghịch* follows **Vương Lâm** (Wang Lin), who starts as an ordinary mortal with poor cultivation talent — mocked, pushed aside, surviving through stubborn will rather than destiny. Power comes **late and painfully** — from hidden ruins, risky inheritances, and map-by-map hardship — not from a tutorial chest. **Thiên Nghịch Kiếm** (Heaven Reverse Sword) tied to ancient will becomes a turning point mid-journey. The tone is **cold perseverance**: flee, endure, cultivate elsewhere, return stronger; loss, obsession with the Dao, and quiet resolve — not early power-fantasy quips.

---

## Cosmology → world map portal

| Layer | *Tiên Nghịch* | Path of Dao (MVP chapters) |
|-------|---------------|----------------------------|
| **Nội giới** | Tứ đại tinh vực + tứ đại tiên giới; che bởi **Phong Giới Đại Trận** | **Toàn bộ 10 chương** — tới **Lôi Tiên Điện** |
| **Chân tinh → tinh vực** | Chu Tước Tinh, La Thiên Tinh Vực, v.v. | ch1–4 Chu Tước · ch5–7 La Thiên · ch8–10 Lôi Tiên Giới |
| **Thiên Nghịch Châu** | Phong ấn bảo vệ nội giới; liên quan **Chủ Nhân Phong Giới** | Lore POI / story beat — không phải map riêng MVP |
| **Ngoại giới** | Viễn Cổ Tiên Vực / Thái Cổ Tinh Thần — **ngoài** Phong Giới | **Không có** trong MVP; nhắc ở epilogue ch10 |

**MVP đích:** Vương Lâm tới **Lôi Tiên Điện** (đỉnh nội giới). Ngoại giới nằm sau Phong Giới — post-MVP.

---

## Story phases → game use

| Phase | In *Tiên Nghịch* (structure) | Path of Dao — **maps** | Path of Dao — **story** |
|-------|------------------------------|------------------------|-------------------------|
| **1 — Mortal outcast** | Heng Yue rejects Wang Lin; village falls | Ch1 Vương Gia Thôn / Hằng Nhạc — unarmed only | Hằng Nhạc từ chối; **chưa có kiếm** |
| **2 — Wilderness exile** | U Linh Mountain; fortune cave | Ch2 U Linh Sơn — **Thiên Nghịch Kiếm POI** | Tiểu Bạch; kiếm nghịch thiên |
| **3 — Fortuitous inheritance** | Hidden caves, remnants | POIs ch1–5 | Thiên Nghịch Kiếm — diary beat |
| **4 — Sword destiny** | Heaven Reverse Sword | `item.sword.ancient` → Sword Intent | CP jump; empty hands until then |
| **5 — Tempered road** | Each region hardens will; bandits, seals, desert | Ch3–5 canyon, moon lake, desert — farm lower maps if CP low | Ruthless choices; seal cracks; survival prose |
| **6 — Heavenly tribulation** | Heaven tests the stubborn; lightning, loss | Ch6 `thunder_peaks` — Storm hawks, Thunder Avatar | Lightning intent; tribulation tone |
| **7 — Memory & inner demon** | Past power, corruption, rift of the heart | Ch7–8 frozen palace, abyss rift | Cold dao; void deepens — sparse, consequence-heavy scenes |
| **8 — Threshold & obsession** | Gate guardians; ultimate confrontation with the Dao | Ch9–10 heavenly gate, void throne | Ascension trial → epilogue: what remains after obsession |

**Core loop (maps):** World map → pick region → explore (.01) → ordeal boss (.02) → chapter story → next region. **Retreat anytime** if CP too low; farm earlier maps, then return — this *is* the cultivation road.

---

## Design pillars (quick checklist)

When authoring **maps**, **story JSON**, **encounters**, or **combat**:

| Pillar | Do | Don't |
|--------|-----|-------|
| Humble start | Palm/body attacks until ancient sword (T1, T4) | Starter wood sword in weapon slot |
| Map-by-map road | Each region = a stop on the road; labels match §7.8 table (T5) | Generic level-select menu feel |
| Fortuitous inheritance | POIs gate major rewards; sword is a **destiny** | Sword in tutorial chest |
| The sword | `item.sword.ancient` mid-journey; Sword Intent gated (T2–T3, T7) | Sword from minute one |
| Retreat & return | CP badges; rematch on lower maps | Hard gate with no fallback |
| Story tone | Perseverance, cost, quiet resolve — cultivation diary | Early quips, chosen-one swagger |

---

## Cultivation system (game mechanics)

Path of Dao maps *Tiên Nghịch* cultivation onto a **level + realm** ladder the player feels while playing — not a menu stat.

| Concept | *Tiên Nghịch* feel | Path of Dao |
|---------|-------------------|-------------|
| **Combat XP** | Killing beasts and enduring ordeals slowly refines qi | Third HUD bar fills on enemy kills; levels within the current realm |
| **Realm (cảnh giới)** | Mortal → Qi → Foundation → Core → Nascent → Void → True Dao | Seven realms in `content/progression/realms.json`; Home + combat toasts use vi keys (Phàm Thể, Ngưng Khí, Trúc Cơ…) |
| **Sub-tier (kỳ)** | Sơ / Trung / Hậu / Viên Mãn within each realm | Auto every 3 levels; level-up toast: *Đột phá — Ngưng Khí · Trung Kỳ* |
| **Realm breakthrough (đột phá cảnh giới)** | Major gate — spirit full, sometimes precious jade | Home **Tu Luyện / Đột Phá** when level + spirit + boss + **Tiên Ngọc** (Immortal Jade) met |
| **Tiên Ngọc** | Rare jade consumed at major breakthroughs | `item.consumable.immortal_jade` in inventory; boss loot + encounters; Home toast when level/spirit met but jade missing |
| **Map cultivation ceiling** | Each star/region caps how far you can refine before the road hardens | `recommendedRealmOrder` on maps; first-entry intro explains peak realm on that star |
| **Second Step / late realms** | Wang Lin's road spans decades — high realms come late | Maps ch1–2 cap at Mortal/Qi; True Dao only on final chapters — intro copy warns higher realms are far ahead |

**Story-as-you-play:** World map → enter portal → **map intro** (name, lore, realm cap) → combat. Chapter stories and My Path milestones still anchor the narrative.

---

## Where agents should look

| Task | Read first |
|------|------------|
| Map / region / POI layout | This doc §Story phases → [plans/index.md §7.8](../plans/index.md) |
| Weapon & combat arc | [plans/index.md §7.7](../plans/index.md) · T1–T4, T7 in [tracks/tien-nghich-alignment.md](../tracks/tien-nghich-alignment.md) |
| Chapter story prose | §Story phases story column · [plans/18-chapter-story-system.md](../plans/18-chapter-story-system.md) · T6 |
| 3D Home empty hands | T8 · [plans/10-threejs-home-scene.md](../plans/10-threejs-home-scene.md) |
| Alignment status | [tracks/index.md](../tracks/index.md) T1–T8 table · detail track per sub-plan |

**Skill:** `.cursor/skills/tien-nghich/SKILL.md` — invoke for map, story, encounter, or combat work that should feel *Tiên Nghịch*-aligned.

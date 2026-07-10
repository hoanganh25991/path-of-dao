# World Road — Main Chain & Side Maps (Content Reference)

> **Source:** *Renegade Immortal* (仙逆) structure only — cultivator names and beats are **reference
> parallels** for authoring; Path of Dao uses original dialogue and tuned combat, not copied plot.
> **Canon loop:** World map → region `.01` explore → region `.02` ordeal **cultivator boss** → chapter
> story → next region. Retreat and farm earlier maps if CP is low.
>
> **Related:** [renegade-immortal-reference.md](./renegade-immortal-reference.md) ·
> [plans/index.md](../plans/index.md) §7.8 · skill `renegade-immortal`

---

## Design rule — ordeal bosses are cultivators

Each main-chain `.02` map gates the next chapter with a **named cultivator** from Wang Lin's road —
someone whose **Master Intent (Ý Cảnh)** is readable in combat and who can **nearly kill** the player
at recommended CP. Generic monsters and beasts stay as **explore-map fodder**, wave adds, or elite
minions — not chapter gate bosses.

| Pillar | Authoring note |
|--------|----------------|
| Unique map | Region tileset + POI theme + boss intent must differ from neighbors |
| Near-death duel | Boss phase 2 should force Dash / Gather Qi / retreat loop at on-level CP |
| Overcome to advance | `bossClearId` on `.02` encounter unlocks chapter story + next region |
| Non-lethal roam | Tu Sĩ at 0 HP meditate at spawn on `.01` maps — rematch the boss on `.02` |

**Stable content IDs:** keep `boss.*` IDs in JSON (loaders, save, skill-unlocks). Update
`displayNameKey`, bestiary, and `referenceCharacter` when the narrative face changes — never rename
shipped boss IDs without a migration plan.

---

## Ordeal cultivator name roster (VI · EN)

Quick lookup for follow-up authoring — matches `content/locales/{en,vi}/enemies.json` boss display names.

| Ch | Boss ID | VI · EN |
|----|---------|---------|
| 1 | `boss.jade_guardian` | **Thác Sâm** · Tu Sen |
| 2 | `boss.mist_stalker` | **Liễu Mi** · Liu Mei |
| 3 | `boss.bandit_lord` | **Hồng Điệp** · Hong Die |
| 4 | `boss.seal_warden` | **Chu Tước Tử** · Vermillion Bird Heir |
| 5 | `boss.desert_sovereign` | **Viêm Lôi Tử** · Flame Thunder Lord |
| 6 | `boss.thunder_avatar` | **Thiên Vận Tử** (I) · Heaven Fate Lord (I) |
| 7 | `boss.frost_queen` | **Vọng Nguyệt** · Wang Yue |
| 8 | `boss.rift_horror` | **Thiên Vận Tử** (II · Tâm Ma) · Heaven Fate · Heart Demon |
| 9 | `boss.celestial_guardian` | **Chu Tước Tử** (II · Ải Môn) · Vermillion Bird Heir · Gate Trial |
| 10 | `boss.void_sovereign` | **Thiên Vận Tử** (III · Lôi Điện) · Heaven Fate · Thunder Hall |

---

## Cosmology — star domains & immortal realms

| Layer | *Renegade Immortal* (reference) | Path of Dao MVP | Side / post-MVP |
|-------|----------------------------------|-----------------|-----------------|
| Inner realm | Four star domains + four immortal realms behind **Phong Giới** | ch1–10 through **Lôi Tiên Điện** | — |
| **Chu Tước Tinh Vực** | Vermillion Bird Star Domain | ch1–4 main chain | — |
| **La Thiên Tinh Vực** | Reaching Heaven Star Domain | ch5–7 main chain | — |
| **Lôi Tiên Giới** (within La Thiên) | Thunder Immortal Realm threshold | ch8–10 main chain | — |
| **Liên Minh Tinh Vực** | Allied Star Domain | — | Side region pack |
| **Vũ Chi Tiên Giới** | Rain Immortal Realm | — | Side region pack |
| **Lôi Chi Tiên Giới** | Thunder Immortal Realm (full) | Partially covered by ch9–10 | Extend post-MVP |
| **Yêu Linh Chi Địa** | Spirit Yao Land | — | Side map hub (yao trials) |
| **Cổ Thần / Cổ Yêu / Cổ Ma** | Ancient God / Yao / Demon lands | — | Three side map arcs |

Domain labels on the world map: `world.domain.*` keys in `content/locales/{en,vi}/world.json`.
Side regions catalog: `content/world/side-regions.json` (locked until main ch10 complete).

---

## Main chain — 10 chapters × cultivator ordeal boss

| Ch | Region (EN) | Region (VI) | Domain | Map .02 | Boss ID | Ordeal cultivator (VI · EN) | Ý Cảnh / combat read |
|----|-------------|-------------|--------|---------|---------|----------------------------|----------------------|
| 1 | Wang Family Village | Vương Gia Thôn | Chu Tước | `map.fallen_village.02` | `boss.jade_guardian` | **Thác Sâm** · Tu Sen | Ancient body — overwhelming physical suppression |
| 2 | Ghost Spirit Mountain | U Linh Sơn | Chu Tước | `map.mist_forest.02` | `boss.mist_stalker` | **Liễu Mi** · Liu Mei | Ice-water intent — cold, precise, first near-death in fog |
| 3 | Zhao Kingdom | Triệu Quốc | Chu Tước | `map.stone_canyon.02` | `boss.bandit_lord` | **Hồng Điệp** · Hong Die | Butterfly spirit — erratic crimson dashes, feint swarms |
| 4 | Moon Lake Ruins | Hồ Nguyệt Cổ Tích | Chu Tước | `map.moon_lake.02` | `boss.seal_warden` | **Chu Tước Tử** · Vermillion Bird Heir | Vermillion bird fire — seal-breaking pressure |
| 5 | Fire Burn Country | Hỏa Phần Quốc | La Thiên | `map.burning_desert.02` | `boss.desert_sovereign` | **Viêm Lôi Tử** · Flame Thunder Lord | Flame + thunder — heat zones + bolt telegraphs |
| 6 | Heavenly Tribulation Pass | Ải Thiên Kiếp | La Thiên | `map.thunder_peaks.02` | `boss.thunder_avatar` | **Thiên Vận Tử** (I) · Heaven Fate Lord (I) | Fate lightning — first full tribulation duel |
| 7 | Ice Palace Ruins | Băng Cung Di Tích | La Thiên | `map.frozen_palace.02` | `boss.frost_queen` | **Vọng Nguyệt** · Wang Yue | Moon void — memory frost, slow zones |
| 8 | Inner Demon Pass | Ải Tâm Ma | Lôi Tiên | `map.abyss_rift.02` | `boss.rift_horror` | **Thiên Vận Tử** (II · Tâm Ma) · Heaven Fate · Heart Demon | Heart-demon mirror — pull + add spawns |
| 9 | Lôi Tiên Gate | Cổng Lôi Tiên | Lôi Tiên | `map.heavenly_gate.02` | `boss.celestial_guardian` | **Chu Tước Tử** (II · Ải Môn) · Vermillion Bird Heir · Gate Trial | Gate trial — alternating beam / sword phases |
| 10 | Thunder Immortal Hall | Lôi Tiên Điện | Lôi Tiên | `map.void_throne.02` | `boss.void_sovereign` | **Thiên Vận Tử** (III · Lôi Điện) · Heaven Fate · Thunder Hall | Final fate suppression — three phases, epilogue |

**Recurring rivals:** **Thiên Vận Tử** · Heaven Fate Lord (ch6, ch8, ch10) and **Chu Tước Tử** · Vermillion Bird Heir (ch4, ch9) intentionally
repeat — Wang Lin meets them multiple times on the road, nearly dying each arc. Phase names differ in
locale keys (`boss.*.name` vs epithet in bestiary).

**Ch2 note:** U Linh Thú · Ghost Spirit Beast remains as **wave elite / phase add** on
`map.mist_forest.02`, commanded by **Liễu Mi** · Liu Mei — the cultivator is the gate boss, not the beast.

---

## Side maps — expansion registry (post-MVP)

Authored in `content/world/side-regions.json`. All locked behind `save.progress.gameComplete` or
future chapter gates. Use for **Yêu Linh**, **Cổ** races, and outer **tinh vực** without breaking
the 10-chapter MVP spine.

| Side region ID | Name (VI) | Theme | Suggested ordeal cultivator (reference) |
|----------------|-----------|-------|----------------------------------------|
| `side.yao_spirit_land` | Yêu Linh Chi Địa | Yao trials, spirit contracts | Yao lord (original) |
| `side.ancient_god` | Cổ Thần Chi Địa | Body-refinement ruins | Cổ Thần remnant will |
| `side.ancient_yao` | Cổ Yêu Chi Địa | Bloodline inheritance | Cổ Yêu patriarch |
| `side.ancient_demon` | Cổ Ma Chi Địa | Demon dao corruption | Cổ Ma sealed lord |
| `side.alliance_domain` | Liên Minh Tinh Vực | Sect politics, war | Alliance envoy cultivator |
| `side.rain_immortal` | Vũ Chi Tiên Giới | Rain dao, weather trials | Rain Immortal hall guardian |

Each side region follows the same `.01` / `.02` pattern when built; no side boss may block main-chain
chapter unlocks.

---

## Agent checklist (content touch)

1. Boss locale + bestiary match this table (`content/locales/{en,vi}/enemies.json`, `bestiary.json`).
2. `.02` map JSON includes `"ordealBossId": "boss.*"`.
3. Boss enemy JSON includes `"referenceCharacter"` slug from table.
4. `plans/index.md` §7.8 and sub-plans 21–22 stay aligned.
5. New side region → append `side-regions.json` only; do not add to `chapters/index.json` without plan approval.

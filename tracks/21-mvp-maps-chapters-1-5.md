# 21 — MVP maps: chapters 1–5

**Status:** `[~]` In progress  
**Plan:** [plans/21-mvp-maps-chapters-1-5.md](../plans/21-mvp-maps-chapters-1-5.md)  
**Last updated:** 2026-07-04

## Summary

First half of the cultivation road: ten maps across five regions (explore + ordeal each).

## Tiên Nghịch level design — early arc (ch1–3 implemented)

Story order follows Wang Lin's early journey on Chu Tước Star (structure/feeling only — original IP).

| Map ID | Tiên Nghịch parallel | Terrain / mood | Enemies | Tone |
|--------|---------------------|----------------|---------|------|
| `map.fallen_village.01` (+ zones) | Wang Family Village outskirts | Ash ruins, east fields, north ridge, south trail — **large explore star** (~250×190 tiles) | Spirit slimes, spirit pests, ruin scavengers, wild hounds | Peaceful walk → cautious survival; unarmed farm loop |
| `map.fallen_village.02` | Heng Yue Gate trial | Sect gate, ward formations, jade guardian arena | Heng Yue outer disciples, gate ward, **boss.jade_guardian**; ancient sword POI | Humiliation → first ordeal; sword destiny |
| `map.mist_forest.01` | Ghost Spirit Mountain ridge | Fog paths, haunted grove tileset | Mist spirits, wild hounds, spirit moths | Fog dread; will over talent |
| `map.mist_forest.02` | Fortune stone cave | Deep grove, sealed blade chamber | Ghost elite, **boss.mist_stalker**; ancient sword POI (backup) | Fortuitous inheritance |
| `map.stone_canyon.01` | Zhao Kingdom road | Rocky patrol routes | Zhao patrol guards, mountain bandits | Mortal ruthlessness; farm if CP low |
| `map.stone_canyon.02` | Bandit mountain | Bandit camp arena | Bandits, archers, **boss.bandit_lord** | Dao or death |
| `map.moon_lake.01` | Moon Lake shore | *(documented)* | Water sprites | Seal foreshadow |
| `map.moon_lake.02` | Seal ruins | *(documented)* | Cultists, **boss.seal_warden** | Ancient seal cracks |
| `map.burning_desert.01` | Fire Burn border | *(documented)* | Scorpions, sand wisps | Endurance |
| `map.burning_desert.02` | Scorching sands | *(documented)* | Sand spirits, **boss.desert_sovereign** | Will tempered by sand |

**Ch1 zone doors (large-map):** West Ruins → East Fields / North Ridge / South Trail via portals; south trail leads toward Heng Yue Gate ordeal.

**Palette direction (ch1–3):** Ch1 warm ash + muted jade; ch2 cool fog grey-green; ch3 dusty ochre canyon.

## Done

- Ten procedural Tiled maps: fallen village, mist forest, stone canyon, moon lake, burning desert
- Each region has .01 explore map and .02 boss ordeal map
- **Ch1 explore star:** four sub-zones with roam spawns + zone portal doors
- Map configs with encounter/roam tables and recommended CP bands
- Seventeen+ enemy definitions including Heng Yue disciple, village pests/scavengers, eleven grunts, five chapter bosses
- POI: ancient sword on ch1 + ch2 ordeal maps; hidden caves ch3–5 explore
- **Tiên Nghịch copy:** region blurbs, map flavor text (EN + VI), enemy names, bestiary notes for ch1–3
- World map detail sheet shows map `.desc`; region nodes show chapter `.desc`
- **Scaled playable bounds 10×** for ch1–5 configs: `1600×1216` → `16000×12160` (spawn/POIs rescaled); `map.fallen_village.01` retained at `8000×6080`

## Remaining

- Ch4–5 encounter tone pass (moon lake seal, fire burn desert)
- Ch1–3 balance pass after large-map roam pacing
- Large explore stars for ch2–3 (zone doors) — parallel architecture thread
- Art: region-colored tilesets + enemy tint polish

## Verification

- Dedicated map JSON per region/stage; ch1 sub-zones load with roam tables
- Content validation passes
- World map: tap node → flavor blurb + recommended CP
- In-game: ch1 west ruins → roam slimes/hounds; ch1.02 → Heng Yue disciples → jade guardian; ch2.02 → backup sword POI

# 25 — Audio, aura VFX, juice

**Status:** `[~]` In progress  
**Plan:** [plans/25-audio-vfx-polish.md](../plans/25-audio-vfx-polish.md)  
**Last updated:** 2026-07-04

## Summary

Game feel through audio, combat juice, and enhanced Home aura — player should *feel* power growth.

## Audio design palette (2026-07-04 pass)

Tiên Nghịch tone: **perseverance and quiet cultivation**, not arcade chaos. Procedural placeholders until OGG ships.

| Layer | Mood | Keys / behavior |
|-------|------|-----------------|
| **Home BGM** | Warm sine pad drone (no arp/air) | `bgm.home` · mood `home` · calm pad path |
| **Explore BGM** | Melancholic wind, sparse notes | `bgm.combat.fallen_village` · mood `melancholy` |
| **Combat BGM** | Low tense drone, faster arp | `bgm.combat.generic` · mood `combat` |
| **Boss BGM** | Dark pulse, saw pad | `bgm.combat.boss` · mood `boss` |
| **Story BGM** | Contemplative sine pad | `bgm.story` · mood `story` · calm pad path |
| **Victory sting** | 5-note ascending chord | `bgm.victory` + `map.clear` · ducks music |

**SFX presets** (`proceduralSfx.ts`): `impact-light` · `impact-heavy` · `impact-crit` · `skill-cast` · `death-dissolve` · `ui-blip` · `ui-panel` · `ui-sting` · `loot-spark`

| Event | Key | Mix notes |
|-------|-----|-----------|
| UI tap | `ui.tap` | UI bus @ 82% of SFX slider |
| Modal / world map open | `ui.panel_open` | UI bus |
| Light hit | `enemy.hit` / `player.attack1–2` | SFX bus |
| Heavy hit / player hurt | `player.attack3` / `player.hit` | SFX + brief duck on big hits |
| Crit | `combat.hit.crit` | SFX + duck ~180ms |
| Skill cast | `skill.*` | Element-colored sweep + harmonic |
| Enemy death | `enemy.death` | Descending dissolve |
| Gold pickup | `loot.pickup` | Soft chime, UI bus |
| Level up / breakthrough / encounter | `level.up` / `ui.breakthrough` / `encounter.*` | UI sting + duck |

**Volume tiers:** BGM peak 0.055–0.075 · combat SFX 0.14–0.20 · UI 0.09–0.18 (manifest gain × bus).

## Done

### Audio
- Web Audio system with separate music, SFX, and UI volume buses
- Procedural placeholder sounds for 26 SFX and 6 BGM tracks until real assets ship
- Scene BGM: Home, combat, boss, story, victory sting
- Event-driven sounds: hits, crits, deaths, level up, breakthrough, encounters, skills
- **First-visit only** “tap to enable sound” overlay for mobile autoplay policy
- Device remembers unlock; return visits resume audio silently on first tap
- Scene music restarts immediately after unlock (no wait for scene change)
- Improved procedural synthesis: soft clipping, filters, impact noise layer, BGM fade-in
- **BGM ambient rewrite:** mood profiles (home / explore / combat / boss / story / melancholy) — pentatonic arp + pad + air + filter breathing
- **Home/story calm pad fix:** `home` + `story` moods use sine-only drone (no arp/air/filter breath) — fixes startup “buzzing” report on mobile
- **BGM crossfade** (~800ms) when switching scenes or boss track
- **Combat SFX wired:** attack combo (1–3), dodge, skill cast (all intents), hit impacts, **crit** (`combat.hit.crit`)
- **UI tap sound** on buttons/tabs/action controls via global click bridge
- **Per-map BGM:** `MapScene` plays `config.bgm` when set; `bgm.combat.fallen_village` for Fallen Village star explore
- **Preset-based SFX** — layered impacts, skill sweeps, UI stings, death dissolve, loot chime (less “beepy”)
- **Mix polish:** UI bus 82% of SFX slider; BGM ducks on crit, heavy hits, stings, boss phase, death
- **`ui.panel_open` wired:** world map, settings, encounter, awakening, ancient demo modals
- **`loot.pickup` wired:** gold magnet collect in SpawnManager + RoamingSpawnManager

### Combat juice
- Hit-stop on heavy hits
- Camera shake on crits and heavy impacts
- Brief crit screen flash
- Guard against stale EventBus callbacks after Phaser scene shutdown (`cameras.main` cleared)

### Home aura
- Pulsing point light for Core Formation+ aura tiers

## Remaining

- Replace procedural placeholders with real OGG assets (`assets/audio/{bgm,sfx}/`)
- File-based playback branch in `AudioManager` (stub exists)
- Boss phase sting + screen darken (visual)
- Map ambience loops per region (optional) — Fallen Village star shipped; ch2–10 deferred
- Performance profile to disable juice on low-end devices (ties to 26)
- `player.land` SFX (manifest key exists; no jump/land mechanic yet)
- `boss.telegraph` (manifest key exists; no telegraph EventBus event yet)
- Dedicated UI volume slider in settings (currently UI bus scales off SFX slider)

## Verification

- Audio unlock persistence tested
- Audio manifest, director, UI sound, and juice profile unit tests pass
- iOS autoplay: overlay once per device; silent resume on return
- `npm test -- tests/content/audio-manifest.test.ts tests/unit/audio-manager.test.ts tests/unit/audio-director.test.ts tests/unit/audio-unlock.test.ts`

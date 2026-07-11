# 25 — Audio, aura VFX, juice

**Status:** `[~]` In progress  
**Plan:** [plans/25-audio-vfx-polish.md](../plans/25-audio-vfx-polish.md)  
**Last updated:** 2026-07-11

## Summary

Game feel through audio, combat juice, and enhanced Home aura — player should *feel* power growth.

## Audio design palette (2026-07-10 BGM files)

Tiên Nghịch tone: **perseverance and quiet cultivation**, not arcade chaos. **BGM is real file loops** (koto/shakuhachi/qin/erhu); SFX still procedural.

| Layer | Mood | Keys / assets |
|-------|------|----------------|
| **Home BGM** | Peaceful koto + shakuhachi | `bgm.home` → `public/audio/bgm/home.*` (Tozan CC0) |
| **Explore BGM** | Somber oriental | `bgm.combat.fallen_village` → `fallen_village.*` (Tozan CC0) |
| **Combat BGM** | Erhu/qin tension | `bgm.combat.generic` → `combat.*` (Majadroid OGA-BY) |
| **Boss BGM** | Dense qin + erhu + beat | `bgm.combat.boss` → `boss.*` (Majadroid OGA-BY) |
| **Story BGM** | Garden koto calm | `bgm.story` → `story.*` (Tozan CC0) |
| **Victory sting** | Short koto (~8s) | `bgm.victory` → `victory.*` non-loop + `map.clear` |

**SFX presets** (`proceduralSfx.ts`): `impact-light` · `impact-heavy` · `impact-crit` · `skill-cast` · `death-dissolve` · `ui-blip` · `ui-panel` · `ui-sting` · `loot-spark`

| Event | Key | Mix notes |
|-------|-----|-----------|
| UI tap | `ui.tap` | UI bus @ 82% of SFX slider |
| Modal / world map open | `ui.panel_open` | UI bus |
| Light hit | `enemy.hit` / `player.attack1–2` | SFX bus |
| Heavy hit / player hurt | `player.attack3` / `player.hit` | SFX + brief duck on big hits |
| Crit | `combat.hit.crit` | SFX + duck ~180ms |
| Skill cast | `skill.*` | Element-colored sweep + harmonic |
| Cultivator defeated | `enemy.defeated` | Soft impact — sits to recover, not death dissolve |
| Boss first clear | `boss.phase_change` | UI sting + boss BGM duck |
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
- **Mix polish:** BGM ducks on crit, heavy hits, stings, boss phase, death
- **`ui.panel_open` wired:** world map, settings, encounter, awakening, ancient demo modals
- **`loot.pickup` wired:** gold magnet collect in SpawnManager + RoamingSpawnManager
- **Real BGM files shipped** under `public/audio/bgm/` (MP3 + OGG) — oriental/cultivation loops replace procedural “è è è” drones
- **File-based BGM playback** in `AudioManager` (fetch → decode → loop/crossfade; MP3 preferred for Safari; buffer cache)
- Licenses documented in `assets/audio/README.md`
- **Skill cast/impact frame audio sync** (2026-07-10, pairs with 19) — `skill:impact` EventBus event; `AudioDirector.playSkillImpact` wired; fires from `SkillExecutor` at the skill's resolved `impactFrameMs` (kind default or JSON override), not just at cast start
- **Boss telegraph SFX confirmed wired** — `combat:boss-phase-changed` → `boss.telegraph` + `boss.phase_change` + music duck in `AudioDirector.mount()` (already shipped from earlier boss work; docs were stale)
- **Dedicated UI volume slider** (2026-07-11) — new `settings.uiVolume` save field (zod `.default(0.82)` migrates pre-slider saves), `AudioManager` UI bus now scales off its own volume instead of `sfxVolume * 0.82`; slider lives in `SettingsModal` under a new "Sound" section, live-previews via `AudioManager.setVolume('ui', …)` on drag and persists on release
- **Music + SFX volume sliders** (2026-07-11) — `SettingsModal` "Sound" section now has all three sliders (Music/SFX/UI); mirrors the UI-volume pattern exactly — live-preview via `AudioManager.setVolume('music'|'sfx', …)` on drag, persists to `save.settings.musicVolume`/`sfxVolume` on release; `AudioManager.init()` already applied both from save on load (`App.ts`), no change needed there; added `home.settings.volume.music`/`.sfx` locale keys (en/vi) and `settings:music-volume-changed`/`settings:sfx-volume-changed` EventBus events

### Combat juice
- Hit-stop on heavy hits
- Camera shake on crits and heavy impacts
- Brief crit screen flash
- Guard against stale EventBus callbacks after Phaser scene shutdown (`cameras.main` cleared)
- **Boss phase screen darken confirmed wired + tested** (2026-07-11) — `JuiceController.applyBossPhaseJuice()` already darkened the screen via a non-interactive `0x000000` veil rectangle (~500ms fade-in/hold/fade-out) on `combat:boss-phase-changed` / boss defeat, gated by `QualityProfile.juiceEnabled` (low tier skips it); docs were stale, no code gap — added unit tests to lock in behavior

### Home aura
- Pulsing point light for Core Formation+ aura tiers

### VFX / juice
- **Meditation VFX** — spirit wisps + subtle aura flowing inward while sit pose active (`MeditationVfx.ts`); capped particle budget for mobile

## Remaining

- Replace procedural **SFX** placeholders with real OGG one-shots (`public/audio/sfx/`)
- Map ambience loops per region (optional) — Fallen Village star shipped; ch2–10 deferred
- Performance profile to disable juice on low-end devices (ties to 26)
- `player.land` SFX (manifest key exists; no jump/land mechanic yet)
- Dedicated impact-frame SFX flavor per intent (currently reuses the cast key — fine for MVP procedural placeholders, revisit once real OGG one-shots ship)

## What needs to do

| # | Task | Files |
|---|------|-------|
| 1 | ~~Emit `boss.telegraph` from boss AI telegraph phase → play manifest SFX~~ | `[x]` Verified already wired 2026-07-10 — `combat:boss-phase-changed` → `AudioDirector.mount()` |
| 2 | ~~Boss phase screen darken (visual juice) on phase transition~~ | `[x]` Verified already wired 2026-07-11 — `JuiceController.applyBossPhaseJuice()` via `CombatJuiceBridge`; added tests |
| 3 | ~~Skill `impactFrameMs` sync (pairs with track 19)~~ | `[x]` Done 2026-07-10 — `skillAudioSync.ts` · `SkillExecutor.ts` · `AudioDirector.ts` |
| 4 | ~~Dedicated **UI volume** slider in settings modal~~ | `[x]` Done 2026-07-11 — `SettingsModal.ts` · `SaveSchema.ts` (`uiVolume`) · `AudioManager.ts` |
| 5 | ~~**Music + SFX volume sliders** in settings modal~~ | `[x]` Done 2026-07-11 — `SettingsModal.ts` · `content/locales/{en,vi}/home.json` · `EventBus.ts` |
| 6 | Confirm low-tier `QualityProfile` disables hit-stop/shake (26) | already partial — verify on device |
| 7 | Ship real SFX OGG one-shots (combat/UI) when ready | `public/audio/sfx/` · manifest · `AudioManager` |

## Verification

- Audio unlock persistence tested
- Audio manifest, director, UI sound, and juice profile unit tests pass
- iOS autoplay: overlay once per device; silent resume on return
- Skill cast/impact frame audio sync: `tests/unit/skill-audio-sync.test.ts`, `tests/unit/audio-director.test.ts` (`skill:impact` case)
- Boss phase screen darken: `tests/unit/juice-controller.test.ts` (veil timing, low-tier quality gate, no input block), `tests/unit/combat-juice-bridge.test.ts` (`combat:boss-phase-changed` wiring + bridge teardown)
- Dedicated UI volume slider: `tests/unit/settings-modal.test.ts` (slider seeded from save, live preview independent of SFX, persists on release), `tests/unit/audio-manager.test.ts` (ui bus independence), `tests/unit/save-manager.test.ts` (`uiVolume` migration default `0.82`)
- Music + SFX volume sliders: `tests/unit/settings-modal.test.ts` (both sliders seeded from save, live preview via `AudioManager.setVolume`, persist independently of the other two buses on release) — full suite green at 674/674 (2026-07-11)
- `npm test -- tests/content/audio-manifest.test.ts tests/unit/audio-manager.test.ts tests/unit/audio-director.test.ts tests/unit/audio-unlock.test.ts tests/unit/skill-audio-sync.test.ts tests/unit/juice-controller.test.ts tests/unit/combat-juice-bridge.test.ts tests/unit/settings-modal.test.ts tests/unit/save-manager.test.ts`

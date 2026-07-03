# Sub-Plan 25: Audio, Aura VFX & Game Feel

**Phase:** 7 — Polish & Ship  
**Estimated effort:** 10–14 hours  
**Depends on:** `10`, `13`, `19`, `21`, `23`  
**Blocks:** `26`

---

## 1. Objective

Add audio (BGM + SFX), enhance realm aura VFX, combat juice (screen shake, hit-stop), and encounter/breakthrough stings. Player should *feel* cultivation power growth.

---

## 2. Audio Architecture

| File | Purpose |
|------|---------|
| `src/core/audio/AudioManager.ts` | Howler wrapper |
| `src/core/audio/AudioBus.ts` | music/sfx/ui channels |
| `content/audio/manifest.json` | paths, volumes |

```typescript
class AudioManager {
  static init(save: PlayerSaveV1): void;
  static playBgm(key: string, crossfadeMs?: number): void;
  static playSfx(key: string): void;
  static setVolume(bus: 'music' | 'sfx' | 'ui', v: number): void;
  static duckMusic(factor: number, ms: number): void;
}
```

Respect save.settings volumes. Mute on `document.hidden` optional.

---

## 3. BGM Map

| Key | When |
|-----|------|
| bgm.home | Home scene |
| bgm.combat.generic | Most maps |
| bgm.combat.boss | Boss active |
| bgm.story | Story reader |
| bgm.victory | Map clear 3s sting |
| bgm.regions.* | Optional per chapter band (5 tracks reuse) |

Target format: OGG + MP3 fallback; MVP OGG only if size OK.

Placeholder: generate silent 1s clips or use royalty-free temp with LICENSE note in `assets/audio/README.md`.

---

## 4. SFX List (Minimum 24)

| Category | Keys |
|----------|------|
| UI | ui.tap, ui.panel_open, ui.breakthrough |
| Player | player.attack1-3, player.dodge, player.hit |
| Skills | skill.sword, skill.void, skill.flame, skill.thunder, skill.time, skill.heal |
| Enemy | enemy.hit, enemy.death |
| Boss | boss.telegraph, boss.phase_change |
| Encounter | encounter.rare, encounter.awaken |
| System | map.clear, level.up |

Use game-sound-effects skill optionally for generation — document paths.

---

## 5. Combat Juice

| Effect | Trigger | Implementation |
|--------|---------|----------------|
| Hit-stop | player hit connects | freeze 40ms time scale |
| Screen shake | heavy hit, Mountain Palm | camera offset random 4px 100ms |
| Crit flash | crit damage | brief full-screen white 5% alpha |
| Boss phase | hp threshold | shake + sfx + darken 0.5s |

`src/combat/juice/JuiceController.ts` — centralize, disable on low quality.

---

## 6. Aura VFX Enhancement (Home)

Extend sub-plan 10 AuraController:

| Tier | Enhancement |
|------|-------------|
| Core Formation | soft point light pulse |
| Nascent Soul | rotating rune ring mesh |
| Void Spirit | refraction postprocessing lite (shader) |
| True Dao | chromatic aberration + golden particles |

Quality profile reduces particle count 50% on low.

---

## 7. Skill VFX Audio Sync

SkillExecutor calls `AudioManager.playSfx` on cast + impact frames from JSON:

```json
{ "audio": { "cast": "skill.void", "impact": "skill.void_impact" } }
```

---

## 8. Breakthrough & Awakening Stings

- Breakthrough: `ui.breakthrough` + music swell 2s
- Awakening: intent-specific sfx layered on modal

---

## 9. Map Ambience (Optional Lite)

Loop wind/desert crickets per region at -20dB under BGM — single ambience sfx per chapter band.

---

## 10. Performance

- Max simultaneous sfx: 8
- Preload Home + current map BGM on scene enter
- Release unused Howler instances on scene switch

---

## 11. Tests

| Test | Assert |
|------|--------|
| AudioManager volume | respects settings |
| duckMusic | restores after timeout |
| Juice hit-stop | GameClock scale restored |

Manual QA checklist for audio crackling on iOS (require user gesture for first play — handle in App.init tap overlay "Tap to begin").

---

## 12. iOS Audio Unlock

First visit only — transparent overlay on Home load:

```typescript
once('pointerdown', () => AudioContext.resume());
localStorage.setItem('pod.audio.unlocked', '1');
```

Returning visits skip the overlay; first tap silently resumes audio and replays current scene BGM.

---

## 13. Acceptance Criteria

- [ ] BGM crossfade Home ↔ combat
- [ ] Boss BGM triggers on boss spawn
- [ ] All combat actions have sfx
- [ ] Hit-stop + shake on heavy hits
- [ ] Aura visible upgrade per realm tier
- [ ] Breakthrough/encounter audio plays
- [ ] Volumes persist in save
- [ ] No audio leak after 10 scene switches
- [x] iOS audio unlock works — overlay once per device; silent resume + BGM restart on return

---

## 14. Handoff

Sub-plan 26 performance profile disables juice/audio features on low tier.

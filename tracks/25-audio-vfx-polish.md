# 25 — Audio, aura VFX, juice

**Status:** `[~]` In progress  
**Plan:** [plans/25-audio-vfx-polish.md](../plans/25-audio-vfx-polish.md)  
**Last updated:** 2026-07-03

## Summary

Game feel through audio, combat juice, and enhanced Home aura — player should *feel* power growth.

## Done

### Audio
- Web Audio system with separate music, SFX, and UI volume buses
- Procedural placeholder sounds for 24+ SFX and 5 BGM tracks until real assets ship
- Scene BGM: Home, combat, boss, story, victory sting
- Event-driven sounds: hits, deaths, level up, breakthrough, encounters, skills
- **First-visit only** “tap to enable sound” overlay for mobile autoplay policy
- Device remembers unlock; return visits resume audio silently on first tap
- Scene music restarts immediately after unlock (no wait for scene change)
- Improved procedural synthesis: soft clipping, filters, impact noise layer, BGM fade-in and pulse
- **Combat SFX wired:** attack combo (1–3), dodge, skill cast (all intents incl. lightning/life), hit impacts
- **UI tap sound** on buttons/tabs/action controls via global click bridge
- Manifest gains boosted ~1.75× for mobile audibility

### Combat juice
- Hit-stop on heavy hits
- Camera shake on crits and heavy impacts
- Brief crit screen flash
- Guard against stale EventBus callbacks after Phaser scene shutdown (`cameras.main` cleared)

### Home aura
- Pulsing point light for Core Formation+ aura tiers

## Remaining

- Replace procedural placeholders with real OGG assets
- BGM crossfade between Home and combat (currently hard switch)
- Boss phase sting + screen darken
- Map ambience loops per region (optional)
- Performance profile to disable juice on low-end devices (ties to 26)
- `player.land` SFX (manifest key exists; no jump/land mechanic yet)
- `ui.panel_open` on modal open (key exists; not wired)

## Verification

- Audio unlock persistence tested
- Audio manifest, director, UI sound, and juice profile unit tests pass
- iOS autoplay: overlay once per device; silent resume on return

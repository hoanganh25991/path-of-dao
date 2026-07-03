# Audio assets (sub-plan 25)

Placeholder audio is generated procedurally via Web Audio (`src/core/audio/proceduralSfx.ts`) until real files ship.

## Target layout

```
assets/audio/
  bgm/
    home.ogg
    combat_generic.ogg
    combat_boss.ogg
    story.ogg
    victory.ogg
  sfx/
    ui/
    player/
    skills/
    enemy/
    boss/
```

## Manifest

Keys and volumes live in `content/audio/manifest.json`. When adding files, switch entries from `"type": "procedural"` to:

```json
{
  "type": "file",
  "paths": { "ogg": "/assets/audio/sfx/enemy/death.ogg" },
  "gain": 0.8
}
```

## Format

- **BGM:** OGG primary; MP3 fallback for Safari if needed
- **SFX:** short OGG clips, normalized around −12 LUFS
- **License:** document royalty-free source + license in this README when replacing placeholders

## Runtime

- `AudioManager` — Web Audio buses (music / sfx / ui)
- `AudioDirector` — EventBus wiring
- `AudioUnlock` — first-tap overlay for iOS autoplay policy

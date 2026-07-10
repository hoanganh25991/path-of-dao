# Audio assets (sub-plan 25)

## Layout

```
public/audio/
  bgm/
    home.{mp3,ogg}            — shrine / Home scene
    story.{mp3,ogg}           — story reader
    explore.{mp3,ogg}         — calm explore bed (source for fallen village)
    fallen_village.{mp3,ogg}  — Fallen Village star map
    combat.{mp3,ogg}          — generic combat
    boss.{mp3,ogg}            — boss tension bed
    victory.{mp3,ogg}         — map-clear sting (~8s, non-loop)
  sfx/                        — (still procedural until OGG one-shots ship)
```

Served by Vite from `public/` at `{BASE_URL}audio/bgm/...`.

## Manifest

Keys and volumes live in `content/audio/manifest.json`. BGM entries use `"type": "file"`:

```json
{
  "type": "file",
  "loop": true,
  "paths": { "mp3": "audio/bgm/home.mp3", "ogg": "audio/bgm/home.ogg" },
  "gain": 0.42
}
```

`AudioManager` prefers **MP3** (Safari Web Audio decode), then OGG.

SFX remain `"type": "procedural"` until real one-shots land.

## BGM licenses

| File | Source | Author | License |
|------|--------|--------|---------|
| `home.*` | [Asianoriental1](https://opengameart.org/content/asianoriental1) | Tozan | CC0 |
| `story.*` | [Tyhosi Garden 3](https://opengameart.org/content/tyhosi-garden-3) | Tozan | CC0 |
| `explore.*` / `fallen_village.*` | [Oriental Somber](https://opengameart.org/content/oriental-somber) | Tozan | CC0 |
| `victory.*` | [Koto Short](https://opengameart.org/content/koto-short) (trimmed) | Tozan | CC0 |
| `combat.*` | [Samurai Nights](https://opengameart.org/content/samurai-nights) demo | Majadroid | OGA-BY 3.0 |
| `boss.*` | Mixed from Samurai Nights single loops (qin + erhu + beat) | Majadroid | OGA-BY 3.0 |

**Attribution (OGA-BY 3.0):** Combat/boss music by Majadroid — [Samurai Nights](https://opengameart.org/content/samurai-nights).

## Format

- **BGM:** MP3 primary (Safari); OGG/Opus secondary
- **SFX:** short clips when shipped; procedural for now
- Keep looping BGM under ~2MB each when possible

## Runtime

- `AudioManager` — Web Audio buses (music / sfx / ui); file decode + buffer cache for BGM
- `AudioDirector` — EventBus wiring
- `AudioUnlock` — first-tap overlay on **first visit only**

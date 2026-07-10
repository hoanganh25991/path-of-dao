# Enemy HP balance reference (sub-plan 23)

Target TTK vs player DPS: **8–15 hits** per normal enemy; **90–180s** per boss at recommended CP.

Tune with `pnpm cp:calc` after loadout changes.

| Chapter | Normal enemy HP | Boss HP | Notes |
|---------|-----------------|---------|-------|
| 1 | 24–40 | 320 (jade_guardian) | slime/wolf grunts |
| 2 | 32–48 | 480 (mist_stalker) | spirit moths kiters |
| 3 | 48–64 | 400 (bandit_lord) | patrol + archers |
| 4 | 56–72 | 440 (seal_warden) | water sprites |
| 5 | 64–80 | 520 (desert_sovereign) | scorpion/sand |
| 6–10 | scale ×1.15/ch | see `content/enemies/boss.*.json` | elite variants |

Boss `phases[]` spawn adds at 50% HP — see `BossPhaseController`.

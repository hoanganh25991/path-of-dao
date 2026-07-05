# Path of Dao

Mobile-first cultivation action RPG — 2D combat maps, 3D Home shrine, PWA for mobile.

**Deploy:** [hoanganh25991.github.io/path-of-dao](https://hoanganh25991.github.io/path-of-dao) · Vite base `/path-of-dao/` · build output **`docs/`** (GitHub Pages) · project notes in **`handbook/`**

## Development

```bash
pnpm install
pnpm dev          # http://localhost:5173/path-of-dao/
pnpm build        # docs/ for GitHub Pages (Settings → Pages → /docs folder)
pnpm preview      # http://localhost:4173/path-of-dao/
```

Regenerate app icons (favicon + PWA):

```bash
pnpm icons:gen
```

## Documentation

### Ideas (core)

- [ideas/game-concept.md](ideas/game-concept.md) — high concept, pillars, Home, stats, story regions
- [ideas/void-ascension.md](ideas/void-ascension.md) — vision, cultivation loop, fortuitous encounters, naming candidates

### Handbook (design & QA notes)

- [handbook/SHIP_CHECKLIST.md](handbook/SHIP_CHECKLIST.md) — manual ship QA
- [handbook/tien-nghich-reference.md](handbook/tien-nghich-reference.md) — story north star
- [handbook/pixel-art-style.md](handbook/pixel-art-style.md) — art canon

### Plans & tracks

- [plans/index.md](plans/index.md) — master implementation plan (what to build)
- [tracks/index.md](tracks/index.md) — master progress index (what is done)

After `pnpm build`, commit the generated **`docs/`** folder and set **GitHub → Settings → Pages → Deploy from branch → `/docs`**.

https://youtu.be/IoqsmkrdJxk
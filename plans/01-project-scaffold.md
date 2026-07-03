# Sub-Plan 01: Project Scaffold & Tooling

**Phase:** 0 — Foundation  
**Estimated effort:** 4–6 hours  
**Depends on:** —  
**Blocks:** `02-scene-router-app-shell`

---

## 1. Objective

Create a production-ready TypeScript monolith with Vite, linting, testing, and folder structure matching `master-plan.md`. After this sub-plan, `pnpm dev` serves a blank page with no runtime errors.

---

## 2. Deliverables

| Deliverable | Path |
|-------------|------|
| Package manifest | `package.json` |
| Vite config | `vite.config.ts` |
| TS config | `tsconfig.json`, `tsconfig.node.json` |
| ESLint + Prettier | `eslint.config.js`, `.prettierrc` |
| Vitest config | `vitest.config.ts` |
| Entry HTML | `index.html` |
| Bootstrap stub | `src/main.ts`, `src/app/App.ts` |
| Placeholder dirs | `content/`, `assets/`, `tests/`, `tools/` |
| CI script | `pnpm typecheck`, `pnpm test`, `pnpm lint` |

---

## 3. Package Dependencies

### 3.1 Runtime (install now)

```json
{
  "dependencies": {
    "phaser": "^3.80.0",
    "three": "^0.170.0",
    "zustand": "^5.0.0",
    "zod": "^3.24.0",
    "idb": "^8.0.0",
    "howler": "^2.2.4"
  }
}
```

### 3.2 Dev

```json
{
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0",
    "@types/three": "^0.170.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

Phaser and Three are installed upfront so tree-shaking and type resolution work from day one; they are not imported until sub-plans 06 and 10.

---

## 4. Implementation Steps

### Step 4.1 — Initialize project

```bash
pnpm init
pnpm add phaser three zustand zod idb howler
pnpm add -D typescript vite vitest @types/three eslint prettier
```

### Step 4.2 — TypeScript configuration

`tsconfig.json` requirements:

- `"strict": true`
- `"moduleResolution": "bundler"`
- `"paths": { "@/*": ["src/*"], "@content/*": ["content/*"] }`
- `"types": ["vitest/globals"]` in test tsconfig only

### Step 4.3 — Vite configuration

`vite.config.ts` must include:

- `base: './'` for PWA relative asset paths
- Alias `@` → `src`, `@content` → `content`
- `build.target: 'es2022'`
- `server.host: true` for mobile LAN testing
- Split chunks: `phaser`, `three`, `vendor` via `manualChunks`

### Step 4.4 — Folder skeleton

Create empty `.gitkeep` in:

```
content/chapters content/maps content/enemies content/skills
content/items content/encounters content/locales/en content/locales/vi
assets/sprites assets/models assets/audio assets/vfx
tests/unit tests/integration tools/
src/app src/core src/combat src/home src/progression src/ui src/shared
```

### Step 4.5 — Bootstrap stub

`index.html`:

- Viewport meta: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`
- `#app` root, `#game-canvas` container (hidden until sub-plan 02)
- Touch-action CSS: `touch-action: none` on canvas container

`src/main.ts`:

- Import global CSS reset (minimal: box-sizing, full viewport, safe-area padding)
- Call `App.init()` from `src/app/App.ts`
- Log `Path of Dao v0.1.0` to console

`src/app/App.ts`:

- Export class with static `init(): void` — sets document title, renders "Loading…" text in `#app`

### Step 4.6 — Scripts in package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src tests"
  }
}
```

### Step 4.7 — First test

`tests/unit/smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Step 4.8 — `.gitignore`

Ignore: `node_modules`, `dist`, `.env`, `*.local`, `.DS_Store`, `coverage/`

---

## 5. Acceptance Criteria

- [ ] `pnpm install` succeeds with lockfile committed
- [ ] `pnpm dev` serves at `http://localhost:5173` with "Loading…" visible
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes (1 smoke test)
- [ ] `pnpm build` outputs `dist/` without errors
- [ ] Folder structure matches master plan section 3.5
- [ ] Mobile viewport meta present; no horizontal scroll on 390px width

---

## 6. Verification Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev   # manual: open DevTools mobile emulation
```

---

## 7. Risks & Notes

- **Phaser + Vite:** If `phaser` import fails at build, add `optimizeDeps.include: ['phaser']` — document in vite config comment.
- **Howler types:** May need `@types/howler` dev dep if TS complains.
- Do not add PWA plugin yet — sub-plan 26.

---

## 8. Handoff to Sub-Plan 02

Sub-plan 02 will replace the "Loading…" stub with SceneRouter and dual canvas containers. Keep `App.init()` as the single entry hook.

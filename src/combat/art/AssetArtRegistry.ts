/**
 * DA-08 auto-wire pipeline (plans/design-arts/08-auto-wire-pipeline.md).
 *
 * Resolution order for any authored asset key:
 *   1. `assets/sprites/{category}/{key}.png` exists on disk → use it directly.
 *   2. `assets/sprites/manifest.json` maps the key to a custom path → use that.
 *   3. Neither → caller falls back to the procedural sticky-man rig / pixel VFX.
 *
 * The pure `*From` functions take an explicit file set + manifest so resolution
 * order can be unit tested without touching the filesystem or Vite. The
 * non-`From` exports feed them the real `assets/sprites/**` contents via
 * `import.meta.glob`, which Vite resolves at build/dev-server time — no PNGs
 * need to exist for this module to load cleanly.
 */

export interface HeroManifestEntry {
  /** Path relative to `assets/sprites/`, e.g. `hero/wanderer.png`. */
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  /** anim key → [startFrame, endFrame] inclusive, e.g. `hero_sticky_idle: [0, 3]`. */
  anims?: Record<string, [number, number]>;
}

export interface SpriteManifest {
  hero?: Record<string, HeroManifestEntry>;
  skills?: Record<string, string>;
  items?: Record<string, string>;
}

export type IconCategory = 'skills' | 'items';
export type AssetSource = 'file' | 'manifest' | 'fallback';

export interface AssetResolution {
  source: AssetSource;
  /** Path relative to `assets/sprites/`, or null when falling back. */
  relPath: string | null;
}

export interface HeroFrameDefaults {
  frameWidth: number;
  frameHeight: number;
}

export interface HeroAssetResolution extends AssetResolution, HeroFrameDefaults {
  anims?: Record<string, [number, number]>;
}

const EMPTY_MANIFEST: SpriteManifest = {};

/** Pure resolver — icon lookup (skills/items) given an explicit file set + manifest. */
export function resolveIconAssetFrom(
  existingFiles: ReadonlySet<string>,
  manifest: SpriteManifest,
  category: IconCategory,
  key: string,
): AssetResolution {
  const direct = `${category}/${key}.png`;
  if (existingFiles.has(direct)) {
    return { source: 'file', relPath: direct };
  }
  const manifestPath = manifest[category]?.[key];
  if (manifestPath && existingFiles.has(manifestPath)) {
    return { source: 'manifest', relPath: manifestPath };
  }
  return { source: 'fallback', relPath: null };
}

/** Pure resolver — hero combat sheet lookup given an explicit file set + manifest. */
export function resolveHeroAssetFrom(
  existingFiles: ReadonlySet<string>,
  manifest: SpriteManifest,
  styleKey: string,
  defaults: HeroFrameDefaults,
): HeroAssetResolution {
  const direct = `hero/${styleKey}.png`;
  if (existingFiles.has(direct)) {
    return { source: 'file', relPath: direct, frameWidth: defaults.frameWidth, frameHeight: defaults.frameHeight };
  }
  const entry = manifest.hero?.[styleKey];
  if (entry && existingFiles.has(entry.sheet)) {
    return {
      source: 'manifest',
      relPath: entry.sheet,
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
      anims: entry.anims,
    };
  }
  return { source: 'fallback', relPath: null, frameWidth: defaults.frameWidth, frameHeight: defaults.frameHeight };
}

// ---- Real data, backed by Vite's static glob (no PNGs required to exist) ----

const spriteFileUrls = import.meta.glob('../../../assets/sprites/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const manifestModules = import.meta.glob('../../../assets/sprites/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function relPathFromGlobKey(globKey: string): string {
  return globKey.replace(/^.*\/assets\/sprites\//, '');
}

function buildFileIndex(): { files: Set<string>; urls: Map<string, string> } {
  const files = new Set<string>();
  const urls = new Map<string, string>();
  for (const [globKey, url] of Object.entries(spriteFileUrls)) {
    const rel = relPathFromGlobKey(globKey);
    files.add(rel);
    urls.set(rel, url);
  }
  return { files, urls };
}

function loadRealManifest(): SpriteManifest {
  const [entry] = Object.values(manifestModules);
  if (!entry || typeof entry !== 'object') return EMPTY_MANIFEST;
  return entry as SpriteManifest;
}

const { files: REAL_FILES, urls: REAL_URLS } = buildFileIndex();
const REAL_MANIFEST = loadRealManifest();

export function getSpriteManifest(): SpriteManifest {
  return REAL_MANIFEST;
}

/** All sprite PNGs found on disk, relative to `assets/sprites/` (sorted). */
export function listSpriteFiles(): string[] {
  return [...REAL_FILES].sort();
}

export function resolveIconAsset(category: IconCategory, key: string): AssetResolution {
  return resolveIconAssetFrom(REAL_FILES, REAL_MANIFEST, category, key);
}

/** True once an authored PNG (direct or manifest-mapped) backs this icon key. */
export function hasSpriteIcon(category: IconCategory, key: string): boolean {
  return resolveIconAsset(category, key).source !== 'fallback';
}

export function resolveHeroAsset(styleKey: string, defaults: HeroFrameDefaults): HeroAssetResolution {
  return resolveHeroAssetFrom(REAL_FILES, REAL_MANIFEST, styleKey, defaults);
}

/** Bundler URL for a resolution's `relPath` (dev-server or build-hashed path). */
export function resolveAssetUrl(resolution: AssetResolution): string | null {
  if (!resolution.relPath) return null;
  return REAL_URLS.get(resolution.relPath) ?? null;
}

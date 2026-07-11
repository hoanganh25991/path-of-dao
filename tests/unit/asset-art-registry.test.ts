import { describe, expect, it } from 'vitest';
import {
  getSpriteManifest,
  hasSpriteIcon,
  resolveHeroAsset,
  resolveHeroAssetFrom,
  resolveIconAsset,
  resolveIconAssetFrom,
} from '@/combat/art/AssetArtRegistry';

const DEFAULT_FRAME = { frameWidth: 32, frameHeight: 56 };

describe('AssetArtRegistry — pure resolution order', () => {
  it('resolves a direct convention-path file first', () => {
    const files = new Set(['skills/skill.sword.flash.png']);
    const resolution = resolveIconAssetFrom(files, {}, 'skills', 'skill.sword.flash');
    expect(resolution).toEqual({ source: 'file', relPath: 'skills/skill.sword.flash.png' });
  });

  it('falls back to the manifest override when no direct file exists', () => {
    const files = new Set(['items/legacy/item.sword.ancient.png']);
    const manifest = { items: { 'item.sword.ancient': 'items/legacy/item.sword.ancient.png' } };
    const resolution = resolveIconAssetFrom(files, manifest, 'items', 'item.sword.ancient');
    expect(resolution).toEqual({ source: 'manifest', relPath: 'items/legacy/item.sword.ancient.png' });
  });

  it('prefers the direct file over a manifest entry when both exist', () => {
    const files = new Set(['items/item.sword.ancient.png', 'items/legacy/item.sword.ancient.png']);
    const manifest = { items: { 'item.sword.ancient': 'items/legacy/item.sword.ancient.png' } };
    const resolution = resolveIconAssetFrom(files, manifest, 'items', 'item.sword.ancient');
    expect(resolution).toEqual({ source: 'file', relPath: 'items/item.sword.ancient.png' });
  });

  it('falls back when neither a direct file nor a manifest entry resolves', () => {
    const resolution = resolveIconAssetFrom(new Set(), {}, 'items', 'item.does.not.exist');
    expect(resolution).toEqual({ source: 'fallback', relPath: null });
  });

  it('falls back when the manifest maps a key to a path that is missing on disk', () => {
    const manifest = { skills: { 'skill.foo': 'skills/skill.foo.png' } };
    const resolution = resolveIconAssetFrom(new Set(), manifest, 'skills', 'skill.foo');
    expect(resolution).toEqual({ source: 'fallback', relPath: null });
  });

  it('resolves a direct hero sheet with the caller-provided default frame size', () => {
    const files = new Set(['hero/unarmed.png']);
    const resolution = resolveHeroAssetFrom(files, {}, 'unarmed', DEFAULT_FRAME);
    expect(resolution).toEqual({
      source: 'file',
      relPath: 'hero/unarmed.png',
      frameWidth: 32,
      frameHeight: 56,
    });
  });

  it('resolves a manifest hero entry with its own frame size + anim ranges', () => {
    const files = new Set(['hero/wanderer.png']);
    const manifest = {
      hero: {
        unarmed: {
          sheet: 'hero/wanderer.png',
          frameWidth: 48,
          frameHeight: 64,
          anims: { hero_sticky_idle: [0, 3] as [number, number] },
        },
      },
    };
    const resolution = resolveHeroAssetFrom(files, manifest, 'unarmed', DEFAULT_FRAME);
    expect(resolution).toEqual({
      source: 'manifest',
      relPath: 'hero/wanderer.png',
      frameWidth: 48,
      frameHeight: 64,
      anims: { hero_sticky_idle: [0, 3] },
    });
  });

  it('falls back to the sticky-man defaults when the hero sheet is missing entirely', () => {
    const resolution = resolveHeroAssetFrom(new Set(), {}, 'sword', DEFAULT_FRAME);
    expect(resolution).toEqual({
      source: 'fallback',
      relPath: null,
      frameWidth: 32,
      frameHeight: 56,
    });
  });

  it('falls back when the manifest hero sheet path is missing on disk', () => {
    const manifest = {
      hero: { unarmed: { sheet: 'hero/ghost.png', frameWidth: 32, frameHeight: 56 } },
    };
    const resolution = resolveHeroAssetFrom(new Set(), manifest, 'unarmed', DEFAULT_FRAME);
    expect(resolution.source).toBe('fallback');
  });
});

describe('AssetArtRegistry — real repo state (no authored PNGs yet)', () => {
  it('loads an empty-but-valid manifest without crashing', () => {
    const manifest = getSpriteManifest();
    expect(manifest).toBeTypeOf('object');
  });

  it('falls back for every current skill/item icon and hero style', () => {
    expect(hasSpriteIcon('skills', 'skill.sword.flash')).toBe(false);
    expect(hasSpriteIcon('items', 'item.sword.ancient')).toBe(false);
    expect(resolveHeroAsset('unarmed', DEFAULT_FRAME).source).toBe('fallback');
    expect(resolveIconAsset('items', 'item.does.not.exist').source).toBe('fallback');
  });
});

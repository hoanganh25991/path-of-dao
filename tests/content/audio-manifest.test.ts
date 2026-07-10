import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifestPath = join(process.cwd(), 'content/audio/manifest.json');

describe('audio manifest', () => {
  it('defines bgm tracks and 24+ sfx keys', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      bgm: Record<string, unknown>;
      sfx: Record<string, unknown>;
    };

    expect(Object.keys(manifest.bgm)).toEqual(
      expect.arrayContaining(['bgm.home', 'bgm.combat.generic', 'bgm.combat.boss', 'bgm.story', 'bgm.victory']),
    );
    expect(Object.keys(manifest.sfx).length).toBeGreaterThanOrEqual(24);
    expect(manifest.sfx['ui.tap']).toBeDefined();
    expect(manifest.sfx['level.up']).toBeDefined();
    expect(manifest.sfx['combat.hit.crit']).toBeDefined();
    expect(manifest.sfx['loot.pickup']).toBeDefined();
    expect(manifest.bgm['bgm.combat.fallen_village']).toBeDefined();

    const home = manifest.bgm['bgm.home'] as { type: string; paths?: { mp3?: string } };
    expect(home.type).toBe('file');
    expect(home.paths?.mp3).toMatch(/audio\/bgm\/home\.mp3$/);
  });
});

import { describe, expect, it } from 'vitest';
import { ContentLoader } from '@/shared/content/ContentLoader';
import { lintCrossrefs } from '@/shared/content/lintCrossrefs';
import { buildContentManifest } from '@/shared/content/packManifest';
import { formatValidationReport } from '@/shared/content/types';
import { validateAllContent } from '@/shared/content/validateAll';
import { loadContentIndex } from '@/shared/content/validateSchemas';

describe('validateAllContent', () => {
  it('passes on current repo content', () => {
    const report = validateAllContent();
    if (report.errors.length > 0) {
      console.error(formatValidationReport(report));
    }
    expect(report.errors).toEqual([]);
  });

  it('reports schema errors for malformed fixture data', () => {
    const index = loadContentIndex();
    index.skills.set('broken.skill', { id: 'broken.skill', intent: 'fire' });
    const { validateSchemas } = require('@/shared/content/validateSchemas') as typeof import('@/shared/content/validateSchemas');
    const report = validateSchemas(index);
    expect(report.errors.some((e) => e.file.includes('broken.skill'))).toBe(true);
  });
});

describe('lintCrossrefs', () => {
  it('catches dangling enemy id in encounter', () => {
    const index = loadContentIndex();
    index.encounters.set('bad.encounter', {
      id: 'bad.encounter',
      waves: [{ trigger: 'onEnter', enemies: [{ id: 'enemy.does.not.exist', count: 1, spread: 10 }] }],
    });
    const report = lintCrossrefs(index);
    expect(
      report.errors.some((e) => e.message.includes('enemy.does.not.exist')),
    ).toBe(true);
  });
});

describe('ContentLoader', () => {
  it('loads test map via unified API', () => {
    const map = ContentLoader.getMap('map.test.grove');
    expect(map.id).toBe('map.test.grove');
  });

  it('throws on missing enemy id', () => {
    expect(() => ContentLoader.getEnemy('enemy.missing')).toThrow(/no enemy config/);
  });
});

describe('buildContentManifest', () => {
  it('includes map and skill ids', () => {
    const manifest = buildContentManifest();
    expect(manifest.maps.length).toBeGreaterThanOrEqual(20);
    expect(manifest.skills.length).toBeGreaterThanOrEqual(12);
    expect(manifest.checksum).toHaveLength(16);
  });
});

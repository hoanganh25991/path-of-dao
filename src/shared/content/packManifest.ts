import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentIndex } from '@/shared/content/validateSchemas';

export interface ContentManifest {
  version: string;
  generatedAt: string;
  maps: string[];
  enemies: string[];
  skills: string[];
  items: string[];
  encounters: string[];
  fortuitous: string[];
  stories: string[];
  checksum: string;
}

export function buildContentManifest(): ContentManifest {
  const index = loadContentIndex();
  const maps = [...index.maps.keys()].sort();
  const enemies = [...index.enemies.keys()].sort();
  const skills = [...index.skills.keys()].sort();
  const items = [...index.items.keys()].sort();
  const encounters = [...index.encounters.keys()].sort();
  const fortuitous = [...index.fortuitous.keys()].sort();
  const stories = [...index.stories.keys()].sort();

  const payload = JSON.stringify({ maps, enemies, skills, items, encounters, fortuitous, stories });
  const checksum = createHash('sha256').update(payload).digest('hex').slice(0, 16);
  const today = new Date().toISOString().slice(0, 10);

  return {
    version: `content-${today}`,
    generatedAt: new Date().toISOString(),
    maps,
    enemies,
    skills,
    items,
    encounters,
    fortuitous,
    stories,
    checksum,
  };
}

export function writeContentManifest(outPath = join(process.cwd(), 'content/manifest.json')): ContentManifest {
  const manifest = buildContentManifest();
  writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

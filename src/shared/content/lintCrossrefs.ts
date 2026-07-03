import { mapConfigSchema } from '@/combat/map/MapConfig';
import { encounterConfigSchema, enemyConfigSchema } from '@/combat/enemies/EnemyConfig';
import { skillDefinitionSchema } from '@/progression/SkillDefinition';
import { itemDefinitionSchema } from '@/progression/ItemDefinition';
import { chaptersIndexSchema } from '@/shared/schemas/chapter';
import { storySceneSchema } from '@/shared/schemas/story';
import { worldMapFileSchema } from '@/shared/schemas/world-map';
import { encounterDefinitionSchema } from '@/shared/schemas/fortuitous-encounters';
import { realmsFileSchema } from '@/shared/schemas/realms';
import type { ContentIndex } from '@/shared/content/validateSchemas';
import type { ValidationReport } from '@/shared/content/types';

export interface LintOptions {
  strictI18n?: boolean;
}

function localeHasKey(locales: ContentIndex['locales'], key: string, locale: 'en' | 'vi'): boolean {
  return key in locales[locale];
}

export function lintCrossrefs(index: ContentIndex, options: LintOptions = {}): ValidationReport {
  const errors: ValidationReport['errors'] = [];
  const warnings: ValidationReport['warnings'] = [];

  const mapIds = new Set(index.maps.keys());
  const enemyIds = new Set(index.enemies.keys());
  const itemIds = new Set(index.items.keys());
  const skillIds = new Set(index.skills.keys());
  const lootIds = new Set(index.loot.keys());
  const encounterIds = new Set(index.encounters.keys());
  const storyIds = new Set(index.stories.keys());

  const chapterIds = new Set<string>();
  const chapterFinalMaps = new Set<string>();
  if (index.chapters) {
    const parsed = chaptersIndexSchema.safeParse(index.chapters);
    if (parsed.success) {
      for (const ch of parsed.data.chapters) {
        chapterIds.add(ch.id);
        chapterFinalMaps.add(ch.finalMapId);
        if (!storyIds.has(ch.storySceneId)) {
          errors.push({
            file: `chapters/index.json`,
            message: `chapter "${ch.id}" references missing story "${ch.storySceneId}"`,
            severity: 'error',
          });
        }
        if (!mapIds.has(ch.finalMapId)) {
          errors.push({
            file: `chapters/index.json`,
            message: `chapter "${ch.id}" finalMapId "${ch.finalMapId}" not found`,
            severity: 'error',
          });
        }
      }
    }
  }

  if (index.world) {
    const world = worldMapFileSchema.safeParse(index.world);
    if (world.success) {
      for (const region of world.data.regions) {
        if (!chapterIds.has(region.chapterId)) {
          errors.push({
            file: 'world/world-map.json',
            message: `region references unknown chapter "${region.chapterId}"`,
            severity: 'error',
          });
        }
        for (const node of region.maps) {
          if (!mapIds.has(node.mapId)) {
            errors.push({
              file: 'world/world-map.json',
              message: `world node "${node.mapId}" has no map config`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  for (const [fileId, raw] of index.maps) {
    const parsed = mapConfigSchema.safeParse(raw);
    if (!parsed.success) continue;
    const map = parsed.data;
    const path = `maps/${fileId}.json`;

    if (!chapterIds.has(map.chapterId) && !map.chapterId.startsWith('chapter.00.')) {
      errors.push({
        file: path,
        message: `chapterId "${map.chapterId}" not in chapters/index.json`,
        severity: 'error',
      });
    }
    if (map.encounterTable && !encounterIds.has(map.encounterTable)) {
      errors.push({
        file: path,
        message: `encounterTable "${map.encounterTable}" not found`,
        severity: 'error',
      });
    }
    if (!localeHasKey(index.locales, map.displayNameKey, 'en')) {
      errors.push({
        file: path,
        message: `displayNameKey "${map.displayNameKey}" missing in en locale`,
        severity: 'error',
      });
    } else if (!localeHasKey(index.locales, map.displayNameKey, 'vi')) {
      const issue = {
        file: path,
        message: `displayNameKey "${map.displayNameKey}" missing in vi locale`,
        severity: 'warning' as const,
      };
      if (options.strictI18n) errors.push({ ...issue, severity: 'error' });
      else warnings.push(issue);
    }
  }

  for (const [fileId, raw] of index.encounters) {
    const parsed = encounterConfigSchema.safeParse(raw);
    if (!parsed.success) continue;
    for (const wave of parsed.data.waves) {
      for (const group of wave.enemies) {
        if (!enemyIds.has(group.id)) {
          errors.push({
            file: `encounters/${fileId}.json`,
            message: `unknown enemy id "${group.id}"`,
            severity: 'error',
          });
        }
      }
    }
  }

  for (const [fileId, raw] of index.skills) {
    const parsed = skillDefinitionSchema.safeParse(raw);
    if (!parsed.success) continue;
    const skill = parsed.data;
    if (!localeHasKey(index.locales, skill.nameKey, 'en')) {
      errors.push({
        file: `skills/${fileId}.json`,
        message: `nameKey "${skill.nameKey}" missing in en locale`,
        severity: 'error',
      });
    }
  }

  for (const [fileId, raw] of index.stories) {
    const parsed = storySceneSchema.safeParse(raw);
    if (!parsed.success) continue;
    for (const slide of parsed.data.slides) {
      if (!localeHasKey(index.locales, slide.textKey, 'en')) {
        errors.push({
          file: `story/${fileId}.json`,
          message: `textKey "${slide.textKey}" missing in en locale`,
          severity: 'error',
        });
      } else if (!localeHasKey(index.locales, slide.textKey, 'vi')) {
        const issue = {
          file: `story/${fileId}.json`,
          message: `textKey "${slide.textKey}" missing in vi locale`,
          severity: 'warning' as const,
        };
        if (options.strictI18n) errors.push({ ...issue, severity: 'error' });
        else warnings.push(issue);
      }
    }
    for (const reward of parsed.data.rewards) {
      if (reward.type === 'item') {
        for (const itemId of [reward.id]) {
          if (!itemIds.has(itemId)) {
            errors.push({
              file: `story/${fileId}.json`,
              message: `reward item "${itemId}" not found`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  for (const [fileId, raw] of index.fortuitous) {
    const parsed = encounterDefinitionSchema.safeParse(raw);
    if (!parsed.success) continue;
    const reward = parsed.data.reward;
    if (reward.type === 'item') {
      for (const itemId of reward.itemIds) {
        if (!itemIds.has(itemId)) {
          errors.push({
            file: `encounters/fortuitous/${fileId}.json`,
            message: `reward item "${itemId}" not found`,
            severity: 'error',
          });
        }
      }
    }
    if (reward.type === 'skill_variant' && !skillIds.has(reward.skillId)) {
      errors.push({
        file: `encounters/fortuitous/${fileId}.json`,
        message: `skill_variant "${reward.skillId}" not found`,
        severity: 'error',
      });
    }
  }

  for (const [fileId, raw] of index.enemies) {
    const parsed = enemyConfigSchema.safeParse(raw);
    if (!parsed.success) continue;
    const enemy = parsed.data;
    if (enemy.lootTable && !lootIds.has(enemy.lootTable)) {
      errors.push({
        file: `enemies/${fileId}.json`,
        message: `lootTable "${enemy.lootTable}" not found`,
        severity: 'error',
      });
    }
    if (enemy.bestiaryKey && !localeHasKey(index.locales, enemy.bestiaryKey, 'en')) {
      warnings.push({
        file: `enemies/${fileId}.json`,
        message: `bestiaryKey "${enemy.bestiaryKey}" missing in en locale`,
        severity: 'warning',
      });
    }
  }

  for (const [fileId, raw] of index.items) {
    const parsed = itemDefinitionSchema.safeParse(raw);
    if (!parsed.success) continue;
    const item = parsed.data;
    if (!localeHasKey(index.locales, item.displayNameKey, 'en')) {
      errors.push({
        file: `items/${fileId}.json`,
        message: `displayNameKey "${item.displayNameKey}" missing in en locale`,
        severity: 'error',
      });
    }
  }

  if (index.realms) {
    const realms = realmsFileSchema.safeParse(index.realms);
    if (realms.success) {
      for (const realm of realms.data.realms) {
        const boss = realm.breakthrough?.requiredBoss;
        if (boss && !enemyIds.has(boss) && !boss.startsWith('boss.')) {
          warnings.push({
            file: 'progression/realms.json',
            message: `requiredBoss "${boss}" not found as enemy id (may be boss stub)`,
            severity: 'warning',
          });
        }
        const reqMap = realm.breakthrough?.requiredMap;
        if (reqMap && !mapIds.has(reqMap)) {
          errors.push({
            file: 'progression/realms.json',
            message: `requiredMap "${reqMap}" not found`,
            severity: 'error',
          });
        }
      }
    }
  }

  return { checked: {}, errors, warnings };
}

export function mergeReports(a: ValidationReport, b: ValidationReport): ValidationReport {
  const checked = { ...a.checked };
  for (const [k, v] of Object.entries(b.checked)) {
    checked[k] = (checked[k] ?? 0) + v;
  }
  return {
    checked,
    errors: [...a.errors, ...b.errors],
    warnings: [...a.warnings, ...b.warnings],
  };
}

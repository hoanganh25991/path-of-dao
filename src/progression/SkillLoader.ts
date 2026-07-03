import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import { skillDefinitionSchema, type SkillDefinition } from '@/progression/SkillDefinition';

const skillModules = import.meta.glob('../../content/skills/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function indexByFileName(modules: Record<string, unknown>): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [path, raw] of Object.entries(modules)) {
    const fileName = path.replace(/^.*\//, '').replace(/\.json$/, '');
    if (fileName.startsWith('_')) continue;
    index.set(fileName, raw);
  }
  return index;
}

const rawSkills = indexByFileName(skillModules);
const skillCache = new Map<string, SkillDefinition>();

export function listSkillIds(): string[] {
  return [...rawSkills.keys()].sort();
}

export function getSkillDefinition(skillId: string): SkillDefinition {
  const cached = skillCache.get(skillId);
  if (cached) return cached;

  const raw = rawSkills.get(skillId);
  if (!raw) {
    throw new Error(`SkillLoader: no skill config for "${skillId}"`);
  }

  const result = skillDefinitionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`SkillLoader: invalid skill config "${skillId}": ${result.error.message}`);
  }
  if (result.data.id !== skillId) {
    throw new Error(`SkillLoader: skill "${skillId}" declares mismatched id "${result.data.id}"`);
  }

  skillCache.set(skillId, result.data);
  return result.data;
}

/** Resolve equipped slot to the effective skill (awakened variant when intent is awakened). */
export function resolveEffectiveSkillId(
  skillId: string,
  insights: Record<string, { awakened: boolean }>,
): string {
  const def = getSkillDefinition(skillId);
  const insight = insights[def.intent];
  if (!insight?.awakened) return skillId;
  if (skillId.endsWith('.awakened')) return skillId;
  return getInsightIntentConfig(def.intent).awakenedSkillId;
}

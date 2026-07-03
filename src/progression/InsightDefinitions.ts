import insightsJson from '../../content/progression/insights.json';
import {
  insightsFileSchema,
  type InsightIntentConfig,
  type InsightXpSourceKey,
} from '@/shared/schemas/insights';

const insightsData = insightsFileSchema.parse(insightsJson);

export const INSIGHT_XP_TO_FULL = insightsData.xpToFull;

export function listInsightIntentIds(): string[] {
  return Object.keys(insightsData.intents).sort();
}

export function getInsightIntentConfig(intentId: string): InsightIntentConfig {
  const config = insightsData.intents[intentId];
  if (!config) {
    throw new Error(`InsightDefinitions: unknown intent "${intentId}"`);
  }
  return config;
}

export function getIntentForSkillId(skillId: string): string | null {
  for (const [intentId, config] of Object.entries(insightsData.intents)) {
    if (config.baseSkillId === skillId || config.awakenedSkillId === skillId) {
      return intentId;
    }
  }
  return null;
}

export function getXpGain(intentId: string, source: InsightXpSourceKey): number {
  return getInsightIntentConfig(intentId).xpSources[source];
}

import { EventBus } from '@/core/EventBus';
import { SaveManager } from '@/core/save/SaveManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { gameStore } from '@/core/store/gameStore';
import {
  getInsightIntentConfig,
  getIntentForSkillId,
  getXpGain,
  INSIGHT_XP_TO_FULL,
  listInsightIntentIds,
} from '@/progression/InsightDefinitions';
import { getRealmOrder } from '@/progression/RealmStatScaling';
import { getSkillDefinition } from '@/progression/SkillLoader';
import type { InsightXpSourceKey } from '@/shared/schemas/insights';

export interface InsightState {
  xp: number;
  awakened: boolean;
  totalUses: number;
}

export function seedDefaultInsights(): Record<string, InsightState> {
  const insights: Record<string, InsightState> = {};
  for (const intentId of listInsightIntentIds()) {
    insights[intentId] = { xp: 0, awakened: false, totalUses: 0 };
  }
  return insights;
}

/** Internal XP (0–200) → display percentage (0–100). */
export function insightDisplayPct(xp: number): number {
  return Math.min(100, Math.round((xp / INSIGHT_XP_TO_FULL) * 100));
}

export function getInsightState(save: PlayerSaveV1, intentId: string): InsightState {
  return save.insights[intentId] ?? { xp: 0, awakened: false, totalUses: 0 };
}

export function checkAwakeningReady(save: PlayerSaveV1, intentId: string): boolean {
  const config = getInsightIntentConfig(intentId);
  const state = getInsightState(save, intentId);
  if (state.awakened) return false;

  const displayPct = insightDisplayPct(state.xp);
  if (displayPct < config.awakenRequirement.xp) return false;
  if (state.totalUses < config.awakenRequirement.minUses) return false;

  const playerRealmOrder = getRealmOrder(save.realm.id);
  const requiredOrder = getRealmOrder(config.awakenRequirement.minRealm);
  return playerRealmOrder >= requiredOrder;
}

export function grantInsightXp(
  save: PlayerSaveV1,
  intentId: string,
  source: InsightXpSourceKey,
): { insights: PlayerSaveV1['insights']; emitReady: boolean } {
  const prev = getInsightState(save, intentId);
  if (prev.awakened) {
    return { insights: save.insights, emitReady: false };
  }

  const gain = getXpGain(intentId, source);
  const nextXp = Math.min(INSIGHT_XP_TO_FULL, prev.xp + gain);
  const nextState: InsightState = {
    ...prev,
    xp: nextXp,
    totalUses: source === 'skillUse' ? prev.totalUses + 1 : prev.totalUses,
  };

  const insights = { ...save.insights, [intentId]: nextState };
  const wasReady = checkAwakeningReady(save, intentId);
  const interim = { ...save, insights };
  const emitReady = checkAwakeningReady(interim, intentId) && !wasReady;

  EventBus.emit('insight:xp-changed', {
    intentId,
    xp: nextXp,
    displayPct: insightDisplayPct(nextXp),
  });

  return { insights, emitReady };
}

export function recordSkillInsight(save: PlayerSaveV1, skillId: string): {
  patch: Partial<PlayerSaveV1>;
  emitReady: boolean;
} {
  const def = getSkillDefinition(skillId);
  const { insights, emitReady } = grantInsightXp(save, def.intent, 'skillUse');
  return { patch: { insights }, emitReady };
}

export function recordSkillHitInsight(
  save: PlayerSaveV1,
  intentId: string,
  opts: { isCrit: boolean; isBoss: boolean; isKill: boolean },
): { patch: Partial<PlayerSaveV1>; emitReady: boolean } {
  let patch: Partial<PlayerSaveV1> = {};
  let emitReady = false;
  let working = save;

  if (opts.isBoss) {
    const result = grantInsightXp(working, intentId, 'bossHit');
    patch = { insights: result.insights };
    emitReady = result.emitReady;
    working = { ...working, ...patch };
  }

  if (opts.isCrit && opts.isKill) {
    const result = grantInsightXp(working, intentId, 'critKill');
    patch = { insights: result.insights };
    emitReady = emitReady || result.emitReady;
  }

  return { patch, emitReady };
}

export class InsightSystem {
  static applyAwakening(intentId: string): string | null {
    const store = gameStore.getState();
    const save = store.save;
    if (!save || !checkAwakeningReady(save, intentId)) return null;

    const config = getInsightIntentConfig(intentId);
    const state = getInsightState(save, intentId);
    const awakenedSkillId = config.awakenedSkillId;

    const equippedSkills = { ...save.equippedSkills };
    for (const slot of ['primary', 'secondary', 'ultimate'] as const) {
      const current = equippedSkills[slot];
      const currentIntent = current ? getIntentForSkillId(current) : null;
      if (currentIntent === intentId || current === config.baseSkillId) {
        equippedSkills[slot] = awakenedSkillId;
      }
    }

    store.patch({
      insights: {
        ...save.insights,
        [intentId]: {
          ...state,
          xp: INSIGHT_XP_TO_FULL,
          awakened: true,
        },
      },
      equippedSkills,
    });

    void store.persist();
    SaveManager.autosaveNow();

    EventBus.emit('insight:awakened', { intentId, skillId: awakenedSkillId });
    return awakenedSkillId;
  }
}

import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { isAncientCombatActive } from '@/progression/AncientCombatMode';
import { getInsightIntentConfig, listMainFlowIntentIdsInOrder } from '@/progression/InsightDefinitions';
import { getInsightState } from '@/progression/InsightSystem';
import { getSkillDefinition } from '@/progression/SkillLoader';

/**
 * Master Intent (Ý Cảnh) unlock gate — plan 14 redesign.
 *
 * Roster is 3 **main-flow** intents cultivated sequentially
 * (`life_death` → `cause_effect` → `truth_falsehood`, each locked until the
 * previous is awakened) plus 3 **gate-flow** intents unlocked independently by
 * a road milestone (`sword` = ancient sword, `flame`/`lightning` = chapter
 * boss clears). `InsightSystem` keeps the XP/awakening mechanics (and the
 * `insights` save field name, per plans/index.md §1.2) — this module only
 * answers "is this Intent's Divine Art usable right now".
 */
export function isIntentUnlocked(intentId: string, save: PlayerSaveV1): boolean {
  if (intentId === 'basic') return true;
  // Ancient Echo demo curates its own ability pool — never re-gate it here.
  if (isAncientCombatActive()) return true;

  const config = getInsightIntentConfig(intentId);

  if (config.flow === 'main') {
    const order = listMainFlowIntentIdsInOrder();
    const index = order.indexOf(intentId);
    if (index <= 0) return true;
    const previousIntentId = order[index - 1]!;
    return getInsightState(save, previousIntentId).awakened;
  }

  if (!config.gate) return true;
  if (config.gate.kind === 'weaponMilestone') {
    return save.progress.weaponMilestone === config.gate.value;
  }
  return save.progress.clearedBosses.includes(config.gate.value);
}

/** Drop skills whose Intent isn't unlocked yet from an assignable/castable pool. */
export function filterSkillsForIntentGates(save: PlayerSaveV1, skillIds: string[]): string[] {
  return skillIds.filter((skillId) => isIntentUnlocked(getSkillDefinition(skillId).intent, save));
}

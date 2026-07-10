import type { IntentLessonId } from '@/shared/schemas/timeline';

/** Canon Intent rim colors (plan 29 §5.2) — reused for the Dao Scroll punch-line card. */
export const INTENT_RIM_COLORS: Record<IntentLessonId, string> = {
  life_death: '#2dd4a8',
  truth_falsehood: '#9a7cff',
  sword: '#6fd6e8',
  flame: '#ff7a2e',
  lightning: '#f0e64a',
  cause_effect: '#c9a227',
};

export function intentRimColor(intentLesson: IntentLessonId): string {
  return INTENT_RIM_COLORS[intentLesson];
}

import type { SkillDefinition, SkillKind } from '@/progression/SkillDefinition';

/**
 * Kind-based fallback for `impactFrameMs` when a skill doesn't author one explicitly —
 * keeps melee/instant arts roughly in sync with their swing/strike VFX without requiring
 * every skill JSON to be touched. Bolt/heal/meditate skills have no fixed impact frame
 * (travel time varies, or there's no strike) so they resolve `undefined` — no impact
 * one-shot fires unless the skill JSON opts in (sub-plan 19/25).
 */
const DEFAULT_IMPACT_FRAME_MS: Partial<Record<SkillKind, number>> = {
  arc: 140,
};

export interface SkillAudioFrames {
  /** Ms after cast trigger to fire the cast-frame one-shot. */
  castFrameMs: number;
  /** Ms after cast trigger to fire the impact-frame one-shot, or undefined to skip. */
  impactFrameMs?: number;
}

/** Resolve authored `castFrameMs`/`impactFrameMs` with sensible kind-based defaults. */
export function resolveSkillAudioFrames(skill: SkillDefinition): SkillAudioFrames {
  return {
    castFrameMs: skill.castFrameMs ?? 0,
    impactFrameMs: skill.impactFrameMs ?? DEFAULT_IMPACT_FRAME_MS[skill.kind],
  };
}

export interface AudioFrameScheduler {
  delay(ms: number, fn: () => void): void;
}

export type SkillAudioFrameEvent = 'skill:cast' | 'skill:impact';

/**
 * Schedules the cast/impact audio one-shots at their resolved frame offsets. `castFrameMs`
 * of 0 fires synchronously (matches pre-sync-frame behavior for skills without wind-up);
 * anything else — and `impactFrameMs` when present — goes through the scheduler so audio
 * lines up with the skill's actual animation timing rather than the moment the button was
 * pressed.
 */
export function scheduleSkillAudio(
  scheduler: AudioFrameScheduler,
  intent: string,
  frames: SkillAudioFrames,
  emit: (event: SkillAudioFrameEvent, intent: string) => void,
): void {
  if (frames.castFrameMs > 0) {
    scheduler.delay(frames.castFrameMs, () => emit('skill:cast', intent));
  } else {
    emit('skill:cast', intent);
  }

  if (frames.impactFrameMs !== undefined) {
    scheduler.delay(frames.impactFrameMs, () => emit('skill:impact', intent));
  }
}

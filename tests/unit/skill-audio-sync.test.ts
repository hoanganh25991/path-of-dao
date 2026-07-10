import { describe, expect, it } from 'vitest';
import { resolveSkillAudioFrames, scheduleSkillAudio, type AudioFrameScheduler } from '@/combat/skills/skillAudioSync';
import { getSkillDefinition } from '@/progression/SkillLoader';

function recordingScheduler(): { scheduler: AudioFrameScheduler; calls: Array<{ ms: number }> } {
  const calls: Array<{ ms: number }> = [];
  return {
    calls,
    scheduler: {
      delay(ms, fn) {
        calls.push({ ms });
        fn();
      },
    },
  };
}

describe('resolveSkillAudioFrames', () => {
  it('defaults castFrameMs to 0 when unauthored', () => {
    const skill = getSkillDefinition('skill.sword.slash');
    expect(resolveSkillAudioFrames(skill).castFrameMs).toBe(0);
  });

  it('defaults impactFrameMs for melee (arc) skills so audio syncs without JSON edits', () => {
    const skill = getSkillDefinition('skill.sword.slash');
    expect(skill.kind).toBe('arc');
    expect(resolveSkillAudioFrames(skill).impactFrameMs).toBe(140);
  });

  it('leaves impactFrameMs undefined for bolt skills (variable travel time)', () => {
    const skill = getSkillDefinition('skill.lightning.strike');
    expect(skill.kind).toBe('bolt');
    expect(resolveSkillAudioFrames(skill).impactFrameMs).toBeUndefined();
  });

  it('honors authored overrides over kind defaults', () => {
    const skill = { ...getSkillDefinition('skill.sword.slash'), castFrameMs: 60, impactFrameMs: 220 };
    const frames = resolveSkillAudioFrames(skill);
    expect(frames.castFrameMs).toBe(60);
    expect(frames.impactFrameMs).toBe(220);
  });
});

describe('scheduleSkillAudio', () => {
  it('emits skill:cast synchronously when castFrameMs is 0', () => {
    const events: Array<{ event: string; intent: string }> = [];
    const { scheduler, calls } = recordingScheduler();
    scheduleSkillAudio(scheduler, 'sword', { castFrameMs: 0 }, (event, intent) => events.push({ event, intent }));
    expect(calls).toHaveLength(0);
    expect(events).toEqual([{ event: 'skill:cast', intent: 'sword' }]);
  });

  it('schedules skill:cast at castFrameMs when > 0', () => {
    const events: Array<{ event: string; intent: string }> = [];
    const { scheduler, calls } = recordingScheduler();
    scheduleSkillAudio(scheduler, 'flame', { castFrameMs: 80 }, (event, intent) => events.push({ event, intent }));
    expect(calls).toEqual([{ ms: 80 }]);
    expect(events).toEqual([{ event: 'skill:cast', intent: 'flame' }]);
  });

  it('schedules skill:impact at impactFrameMs when provided', () => {
    const events: Array<{ event: string; intent: string }> = [];
    const { scheduler, calls } = recordingScheduler();
    scheduleSkillAudio(
      scheduler,
      'sword',
      { castFrameMs: 0, impactFrameMs: 140 },
      (event, intent) => events.push({ event, intent }),
    );
    expect(calls).toEqual([{ ms: 140 }]);
    expect(events).toEqual([
      { event: 'skill:cast', intent: 'sword' },
      { event: 'skill:impact', intent: 'sword' },
    ]);
  });

  it('does not schedule skill:impact when impactFrameMs is undefined', () => {
    const events: Array<{ event: string; intent: string }> = [];
    const { scheduler, calls } = recordingScheduler();
    scheduleSkillAudio(scheduler, 'lightning', { castFrameMs: 0 }, (event, intent) => events.push({ event, intent }));
    expect(calls).toHaveLength(0);
    expect(events).toEqual([{ event: 'skill:cast', intent: 'lightning' }]);
  });
});

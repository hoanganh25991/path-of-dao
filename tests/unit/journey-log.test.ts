import { describe, expect, it } from 'vitest';
import { SaveManager } from '@/core/save/SaveManager';
import { appendJourneyStep, makeJourneyEntry, recordJourney } from '@/progression/JourneyLog';
import { applyMapClearPatch, completeStory } from '@/progression/ChapterManager';

describe('JourneyLog', () => {
  it('stamps a step with the current strength snapshot', () => {
    const save = SaveManager.createNew();
    const entry = makeJourneyEntry(save, 'map_clear', 'map.fallen_village.01', 'map.fallen_village.01');

    expect(entry.kind).toBe('map_clear');
    expect(entry.refId).toBe('map.fallen_village.01');
    expect(entry.realmId).toBe(save.realm.id);
    expect(entry.level).toBe(save.stats.level);
    expect(entry.cp).toBeGreaterThan(0);
    expect(typeof entry.at).toBe('string');
  });

  it('does not record the same milestone twice', () => {
    const save = SaveManager.createNew();
    const first = makeJourneyEntry(save, 'map_clear', 'map.fallen_village.01');
    const journey = appendJourneyStep([], first);
    const same = makeJourneyEntry(save, 'map_clear', 'map.fallen_village.01');

    expect(appendJourneyStep(journey, same)).toHaveLength(1);
  });

  it('records a distinct step per milestone kind/ref', () => {
    const save = SaveManager.createNew();
    let journey = recordJourney(save, 'map_clear', 'map.fallen_village.01');
    const withMap = { ...save, progress: { ...save.progress, journey } };
    journey = recordJourney(withMap, 'breakthrough', 'qi_condensation');

    expect(journey).toHaveLength(2);
    expect(journey.map((e) => e.kind)).toEqual(['map_clear', 'breakthrough']);
  });
});

describe('journey recording hooks', () => {
  it('records a map_clear step when clearing a map', () => {
    const save = SaveManager.createNew();
    const { patch } = applyMapClearPatch(save, 'map.fallen_village.01', true);

    expect(patch.progress?.journey?.some((e) => e.kind === 'map_clear')).toBe(true);
    expect(patch.progress?.journey?.at(-1)?.refId).toBe('map.fallen_village.01');
  });

  it('records a story step when a chapter story completes', () => {
    const save = SaveManager.createNew();
    const { save: next } = completeStory(save, 'story.ch01.awakening_jade', true);

    expect(next.progress.journey.some((e) => e.kind === 'story')).toBe(true);
  });
});

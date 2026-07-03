import { describe, expect, it } from 'vitest';
import { getStoryScene, listStorySceneIds } from '@/progression/StoryLoader';

describe('StoryLoader', () => {
  it('loads all 10 MVP story scenes', () => {
    expect(listStorySceneIds().length).toBe(10);
  });

  it('parses chapter 1 story with rewards', () => {
    const scene = getStoryScene('story.ch01.awakening_jade');
    expect(scene.chapterId).toBe('chapter.01.fallen_village');
    expect(scene.slides.length).toBeGreaterThanOrEqual(2);
    expect(scene.rewards.some((r) => r.type === 'item' && r.id === 'item.spirit.jade')).toBe(true);
  });
});

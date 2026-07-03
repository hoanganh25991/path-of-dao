import { z } from 'zod';

const storyRewardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('item'), id: z.string().min(1), qty: z.number().int().positive() }),
  z.object({ type: z.literal('spirit'), amount: z.number().positive() }),
  z.object({ type: z.literal('gold'), amount: z.number().int().positive() }),
]);

const storySlideSchema = z.object({
  illustration: z.string().nullable(),
  textKey: z.string().min(1),
  durationMs: z.number().int().min(0).default(0),
});

export const storySceneSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  slides: z.array(storySlideSchema).min(1),
  rewards: z.array(storyRewardSchema).default([]),
  unlockChapter: z.string().min(1).nullable().default(null),
});

export type StoryScene = z.infer<typeof storySceneSchema>;
export type StorySlide = z.infer<typeof storySlideSchema>;
export type StoryReward = z.infer<typeof storyRewardSchema>;

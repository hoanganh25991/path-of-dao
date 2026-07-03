import { z } from 'zod';

const chapterEntrySchema = z.object({
  id: z.string().min(1),
  titleKey: z.string().min(1),
  finalMapId: z.string().min(1),
  storySceneId: z.string().min(1),
  unlockChapter: z.string().min(1).nullable(),
});

export const chaptersIndexSchema = z.object({
  chapters: z.array(chapterEntrySchema).min(1),
});

export type ChapterEntry = z.infer<typeof chapterEntrySchema>;

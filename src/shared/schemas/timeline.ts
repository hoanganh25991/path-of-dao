import { z } from 'zod';

/** Master Intent roster (plan 14 redesign) — main-flow (life_death/cause_effect/truth_falsehood) + gate-flow (sword/flame/lightning). */
export const INTENT_LESSON_IDS = [
  'sword',
  'truth_falsehood',
  'flame',
  'lightning',
  'cause_effect',
  'life_death',
] as const;

export const intentLessonSchema = z.enum(INTENT_LESSON_IDS);

export type IntentLessonId = z.infer<typeof intentLessonSchema>;

const timelineSlideSchema = z.object({
  illustration: z.string().nullable(),
  textKey: z.string().min(1),
  durationMs: z.number().int().min(0).default(0),
});

/** Validates content/story-timeline/{shardId}.json — Dao Scroll per-map beat (sub-plan 31 §4.1). */
export const timelineShardSchema = z.object({
  id: z.string().min(1),
  mapId: z.string().min(1),
  chapterId: z.string().min(1),
  /** Handbook Wang Lin road phase slug — see plan 31 §5 table. */
  wangLinPhase: z.string().min(1),
  intentLesson: intentLessonSchema,
  illustration: z.string().nullable(),
  /** Player diary + Wang Lin parallel — minimum 2 (body + wang_lin). */
  slides: z.array(timelineSlideSchema).min(2),
  punchlineKey: z.string().min(1),
  punchlineAttributionKey: z.string().min(1),
});

export type TimelineShard = z.infer<typeof timelineShardSchema>;
export type TimelineSlide = z.infer<typeof timelineSlideSchema>;

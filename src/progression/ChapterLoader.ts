import chaptersIndex from '../../content/chapters/index.json';
import { chaptersIndexSchema, type ChapterEntry } from '@/shared/schemas/chapter';

const chaptersData = chaptersIndexSchema.parse(chaptersIndex);
const CHAPTERS: ChapterEntry[] = [...chaptersData.chapters];

const byId = new Map(CHAPTERS.map((c) => [c.id, c]));
const byFinalMap = new Map(CHAPTERS.map((c) => [c.finalMapId, c]));
const byStoryScene = new Map(CHAPTERS.map((c) => [c.storySceneId, c]));

export function listChapters(): readonly ChapterEntry[] {
  return CHAPTERS;
}

export function getChapter(chapterId: string): ChapterEntry {
  const chapter = byId.get(chapterId);
  if (!chapter) throw new Error(`ChapterLoader: unknown chapter "${chapterId}"`);
  return chapter;
}

export function getChapterByFinalMap(mapId: string): ChapterEntry | null {
  return byFinalMap.get(mapId) ?? null;
}

export function getChapterByStoryScene(sceneId: string): ChapterEntry | null {
  return byStoryScene.get(sceneId) ?? null;
}

export function isChapterFinalMap(mapId: string): boolean {
  return byFinalMap.has(mapId);
}

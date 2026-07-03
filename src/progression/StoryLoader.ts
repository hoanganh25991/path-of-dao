import { storySceneSchema, type StoryScene } from '@/shared/schemas/story';

const storyModules = import.meta.glob('../../content/story/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const cache = new Map<string, StoryScene>();

function fileIdFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.json$/, '');
}

export function listStorySceneIds(): string[] {
  return Object.keys(storyModules)
    .map(fileIdFromPath)
    .sort();
}

export function getStoryScene(sceneId: string): StoryScene {
  const cached = cache.get(sceneId);
  if (cached) return cached;

  const entry = Object.entries(storyModules).find(([path]) => fileIdFromPath(path) === sceneId);
  if (!entry) {
    throw new Error(`StoryLoader: no story scene "${sceneId}"`);
  }

  const parsed = storySceneSchema.safeParse(entry[1]);
  if (!parsed.success) {
    throw new Error(`StoryLoader: invalid story "${sceneId}": ${parsed.error.message}`);
  }
  if (parsed.data.id !== sceneId) {
    throw new Error(`StoryLoader: story "${sceneId}" declares id "${parsed.data.id}"`);
  }

  cache.set(sceneId, parsed.data);
  return parsed.data;
}

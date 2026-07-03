export type SceneId = 'home' | 'combat' | 'story';

export type ScenePayload = {
  home: undefined;
  combat: { mapId: string };
  story: { chapterId: string; sceneId: string; replay?: boolean };
};

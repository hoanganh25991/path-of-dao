import { getMapConfig, listMapIds } from '@/combat/map/MapLoader';
import { getEnemyConfig, listEnemyIds } from '@/combat/enemies/EnemyLoader';
import { getSkillDefinition, listSkillIds } from '@/progression/SkillLoader';
import { getItemDefinition, listItemIds } from '@/progression/ItemLoader';
import { getStoryScene, listStorySceneIds } from '@/progression/StoryLoader';
import { listChapters } from '@/progression/ChapterLoader';
import { getWorldMapData } from '@/progression/WorldMapLoader';

/** Unified runtime content access (sub-plan 20 §7). */
export class ContentLoader {
  static listMaps(): string[] {
    return listMapIds();
  }

  static getMap(id: string) {
    return getMapConfig(id);
  }

  static listEnemies(): string[] {
    return listEnemyIds();
  }

  static getEnemy(id: string) {
    return getEnemyConfig(id);
  }

  static listSkills(): string[] {
    return listSkillIds();
  }

  static getSkill(id: string) {
    return getSkillDefinition(id);
  }

  static listItems(): string[] {
    return listItemIds();
  }

  static getItem(id: string) {
    return getItemDefinition(id);
  }

  static listStories(): string[] {
    return listStorySceneIds();
  }

  static getStory(id: string) {
    return getStoryScene(id);
  }

  static listChapters() {
    return listChapters();
  }

  static getWorldMap() {
    return getWorldMapData();
  }
}

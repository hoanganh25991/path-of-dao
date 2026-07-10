import { getMapConfig, listMapIds } from '@/combat/map/MapLoader';
import { getCultivatorConfig, listCultivatorIds } from '@/combat/cultivators/CultivatorLoader';
import { getSkillDefinition, listSkillIds } from '@/progression/SkillLoader';
import { getItemDefinition, listItemIds } from '@/progression/ItemLoader';
import { getStoryScene, listStorySceneIds } from '@/progression/StoryLoader';
import {
  findTimelineShardByMapId,
  getTimelineShard,
  listTimelineShardIds,
  listTimelineShardsInRoadOrder,
} from '@/progression/TimelineLoader';
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

  static listCultivators(): string[] {
    return listCultivatorIds();
  }

  static getCultivator(id: string) {
    return getCultivatorConfig(id);
  }

  /** @deprecated Use listCultivators */
  static listEnemies(): string[] {
    return listCultivatorIds();
  }

  /** @deprecated Use getCultivator */
  static getEnemy(id: string) {
    return getCultivatorConfig(id);
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

  static listTimelineShards(): string[] {
    return listTimelineShardIds();
  }

  static getTimelineShard(id: string) {
    return getTimelineShard(id);
  }

  static listTimelineShardsInRoadOrder() {
    return listTimelineShardsInRoadOrder();
  }

  static findTimelineShardByMapId(mapId: string) {
    return findTimelineShardByMapId(mapId);
  }

  static getWorldMap() {
    return getWorldMapData();
  }
}

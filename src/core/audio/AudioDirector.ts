import type { SceneId } from '@/app/SceneId';
import { EventBus } from '@/core/EventBus';
import { AudioManager } from '@/core/audio/AudioManager';
import { gameStore } from '@/core/store/gameStore';

const SCENE_BGM: Record<SceneId, string> = {
  home: 'bgm.home',
  combat: 'bgm.combat.generic',
  story: 'bgm.story',
};

const SKILL_SFX: Record<string, string> = {
  sword: 'skill.sword',
  void: 'skill.void',
  flame: 'skill.flame',
  lightning: 'skill.thunder',
  time: 'skill.time',
  life: 'skill.heal',
};

const ATTACK_SFX: Record<number, string> = {
  1: 'player.attack1',
  2: 'player.attack2',
  3: 'player.attack3',
};

/** EventBus → AudioManager wiring (sub-plan 25). */
export class AudioDirector {
  private static unsubs: Array<() => void> = [];
  private static bossBgmActive = false;

  static playSceneBgm(id: SceneId): void {
    this.bossBgmActive = false;
    AudioManager.playBgm(SCENE_BGM[id]);
  }

  static mount(): void {
    this.unmount();

    this.unsubs.push(
      EventBus.on('scene:changed', ({ id }) => {
        this.playSceneBgm(id);
      }),
      EventBus.on('app:pause', () => AudioManager.pause()),
      EventBus.on('app:resume', () => AudioManager.resume()),
      EventBus.on('map:enemy-killed', ({ isBoss }) => {
        AudioManager.playSfx(isBoss ? 'boss.phase_change' : 'enemy.death');
        if (isBoss && !this.bossBgmActive) {
          this.bossBgmActive = true;
          AudioManager.playBgm('bgm.combat.boss');
        }
      }),
      EventBus.on('player:died', () => {
        AudioManager.playSfx('player.hit');
        AudioManager.duckMusic(0.35, 400);
      }),
      EventBus.on('realm:breakthrough', () => {
        AudioManager.playSfx('ui.breakthrough', 'ui');
        AudioManager.duckMusic(0.5, 600);
      }),
      EventBus.on('encounter:completed', ({ encounterId }) => {
        const rare = encounterId.includes('secret') || encounterId.includes('hidden');
        AudioManager.playSfx(rare ? 'encounter.rare' : 'encounter.awaken', 'ui');
      }),
      EventBus.on('progression:level-up', () => {
        AudioManager.playSfx('level.up', 'ui');
      }),
      EventBus.on('combat:hit-landed', ({ attackerTeam, victimTeam }) => {
        if (attackerTeam === 'player' && victimTeam === 'enemy') {
          AudioManager.playSfx('enemy.hit');
          return;
        }
        if (victimTeam === 'player') {
          AudioManager.playSfx('player.hit');
        }
      }),
      EventBus.on('player:attack-started', ({ step }) => {
        const key = ATTACK_SFX[step];
        if (key) AudioManager.playSfx(key);
      }),
      EventBus.on('player:dodge-started', () => {
        AudioManager.playSfx('player.dodge');
      }),
      EventBus.on('skill:cast', ({ intent }) => {
        this.playSkillCast(intent);
      }),
      EventBus.on('insight:awakened', () => {
        AudioManager.playSfx('encounter.awaken', 'ui');
      }),
    );

    const save = gameStore.getState().save;
    if (save) {
      AudioManager.setVolume('music', save.settings.musicVolume);
      AudioManager.setVolume('sfx', save.settings.sfxVolume);
    }
  }

  static playSkillCast(intent: string): void {
    const key = SKILL_SFX[intent];
    if (key) AudioManager.playSfx(key);
  }

  static playUiTap(): void {
    AudioManager.playSfx('ui.tap', 'ui');
  }

  static playMapClearSting(): void {
    AudioManager.playBgm('bgm.victory');
    AudioManager.playSfx('map.clear', 'ui');
  }

  static unmount(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.bossBgmActive = false;
  }
}

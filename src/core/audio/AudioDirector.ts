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
  truth_falsehood: 'skill.void',
  flame: 'skill.flame',
  lightning: 'skill.thunder',
  cause_effect: 'skill.time',
  life_death: 'skill.heal',
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
      EventBus.on('map:cultivator-defeated', ({ isBoss }) => {
        AudioManager.playSfx(isBoss ? 'boss.phase_change' : 'enemy.defeated');
        if (isBoss && !this.bossBgmActive) {
          this.bossBgmActive = true;
          AudioManager.playBgm('bgm.combat.boss');
          AudioManager.duckMusic(0.55, 500);
        }
      }),
      EventBus.on('map:enemy-killed', ({ isBoss }) => {
        // Back-compat alias — map:cultivator-defeated is the canonical event.
        if (isBoss && !this.bossBgmActive) {
          this.bossBgmActive = true;
          AudioManager.playBgm('bgm.combat.boss');
          AudioManager.duckMusic(0.55, 500);
        }
      }),
      EventBus.on('combat:boss-phase-changed', () => {
        AudioManager.playSfx('boss.telegraph');
        AudioManager.playSfx('boss.phase_change');
        AudioManager.duckMusic(0.6, 350);
      }),
      EventBus.on('player:died', () => {
        AudioManager.playSfx('player.hit');
        AudioManager.duckMusic(0.35, 400);
      }),
      EventBus.on('realm:breakthrough', () => {
        AudioManager.playSfx('ui.breakthrough', 'ui');
        AudioManager.duckMusic(0.45, 700);
      }),
      EventBus.on('encounter:completed', ({ encounterId }) => {
        const rare = encounterId.includes('secret') || encounterId.includes('hidden');
        AudioManager.playSfx(rare ? 'encounter.rare' : 'encounter.awaken', 'ui');
        AudioManager.duckMusic(0.55, 450);
      }),
      EventBus.on('progression:level-up', () => {
        AudioManager.playSfx('level.up', 'ui');
        AudioManager.duckMusic(0.5, 550);
      }),
      EventBus.on('combat:hit-landed', (payload) => {
        if (payload.attackerTeam === 'player' && payload.victimTeam === 'cultivator') {
          if (payload.isCrit) {
            AudioManager.playSfx('combat.hit.crit');
            AudioManager.duckMusic(0.62, 180);
            return;
          }
          AudioManager.playSfx('enemy.hit');
          if (payload.finalDamage >= 40 || payload.skillMultiplier >= 1.5) {
            AudioManager.duckMusic(0.78, 120);
          }
          return;
        }
        if (payload.victimTeam === 'player') {
          AudioManager.playSfx('player.hit');
          AudioManager.duckMusic(0.55, 200);
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
      EventBus.on('skill:impact', ({ intent }) => {
        this.playSkillImpact(intent);
      }),
      EventBus.on('insight:awakened', () => {
        AudioManager.playSfx('encounter.awaken', 'ui');
        AudioManager.duckMusic(0.5, 500);
      }),
    );

    const save = gameStore.getState().save;
    if (save) {
      AudioManager.setVolume('music', save.settings.musicVolume);
      AudioManager.setVolume('sfx', save.settings.sfxVolume);
      AudioManager.setVolume('ui', save.settings.uiVolume);
    }
  }

  static playSkillCast(intent: string): void {
    const key = SKILL_SFX[intent];
    if (key) AudioManager.playSfx(key);
  }

  /** Impact-frame one-shot — reuses the intent's cast key (sub-plan 19/25 audio sync). */
  static playSkillImpact(intent: string): void {
    const key = SKILL_SFX[intent];
    if (key) AudioManager.playSfx(key);
  }

  static playUiTap(): void {
    AudioManager.playSfx('ui.tap', 'ui');
  }

  static playPanelOpen(): void {
    AudioManager.playSfx('ui.panel_open', 'ui');
  }

  static playLootPickup(): void {
    AudioManager.playSfx('loot.pickup', 'ui');
  }

  static playMapClearSting(): void {
    AudioManager.playBgm('bgm.victory');
    AudioManager.playSfx('map.clear', 'ui');
    AudioManager.duckMusic(0.4, 800);
  }

  static unmount(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.bossBgmActive = false;
  }
}

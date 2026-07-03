import { EventBus } from '@/core/EventBus';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { getActiveAncientId } from '@/progression/AncientDemoManager';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import { listReadyAwakeningIntents } from '@/progression/InsightSystem';
import { getEnemyConfig } from '@/combat/enemies/EnemyLoader';

const toastedAwakening = new Set<string>();

function showToast(message: string, onClick?: () => void): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  if (onClick) {
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', onClick);
  }
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

function syncAwakeningNudges(): void {
  if (getActiveAncientId()) return;
  const save = gameStore.getState().save;
  if (!save) return;

  for (const intentId of listReadyAwakeningIntents(save)) {
    if (toastedAwakening.has(intentId)) continue;
    toastedAwakening.add(intentId);
    const config = getInsightIntentConfig(intentId);
    const skillName = I18nManager.t(`${config.baseSkillId}.name`);
    showToast(I18nManager.t('home.awakening_ready', { skill: skillName }), () => {
      EventBus.emit('home:open-tab', { tab: 'skills' });
    });
    break;
  }
}

/** Toasts when insight awakening becomes available on Home. */
export function initHomeProgressionNudges(): () => void {
  const offReady = EventBus.on('insight:ready-to-awaken', () => syncAwakeningNudges());
  const offAwakened = EventBus.on('insight:awakened', ({ intentId }) => {
    toastedAwakening.delete(intentId);
  });
  const offScene = EventBus.on('scene:changed', ({ id }) => {
    if (id === 'home') syncAwakeningNudges();
  });
  const offBoss = EventBus.on('boss:defeated', ({ bossId }) => {
    if (getActiveAncientId()) return;
    try {
      const config = getEnemyConfig(bossId);
      showToast(I18nManager.t('home.boss_defeated', { boss: I18nManager.t(config.displayNameKey) }), () => {
        EventBus.emit('home:open-tab', { tab: 'story' });
      });
    } catch {
      // unknown boss — skip toast
    }
  });

  return () => {
    offReady();
    offAwakened();
    offScene();
    offBoss();
  };
}

/** @internal Exposed for unit tests. */
export function resetHomeProgressionNudgesForTests(): void {
  toastedAwakening.clear();
}

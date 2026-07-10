import '@/ui/modals/awakening.css';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getInsightIntentConfig } from '@/progression/InsightDefinitions';
import { InsightSystem } from '@/progression/InsightSystem';

export interface AwakeningModalOptions {
  intentId: string;
}

const PHASE1_MS = 1600;
const PHASE2_MS = 1400;

const INTENT_THEME: Record<string, string> = {
  sword: 'awakening-modal--sword',
  truth_falsehood: 'awakening-modal--truth_falsehood',
  flame: 'awakening-modal--flame',
  lightning: 'awakening-modal--lightning',
  cause_effect: 'awakening-modal--cause_effect',
  life_death: 'awakening-modal--life_death',
};

/** Intent-themed awakening ceremony (sub-plan 14 §9). */
export function showAwakeningModal(
  uiRoot: HTMLElement,
  options: AwakeningModalOptions,
): Promise<string | null> {
  return new Promise((resolve) => {
    const config = getInsightIntentConfig(options.intentId);
    const themeClass = INTENT_THEME[options.intentId] ?? '';

    const overlay = document.createElement('div');
    overlay.className = `awakening-modal ${themeClass}`.trim();
    overlay.dataset.testid = 'awakening-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'awakening-modal__backdrop';

    const content = document.createElement('div');
    content.className = 'awakening-modal__content';

    const slash = document.createElement('div');
    slash.className = 'awakening-modal__slash';
    slash.hidden = options.intentId !== 'sword';

    const crack = document.createElement('div');
    crack.className = 'awakening-modal__crack';
    crack.hidden = options.intentId !== 'truth_falsehood';

    const title = document.createElement('p');
    title.className = 'awakening-modal__title';
    title.textContent = I18nManager.t('awakening.title');

    const subtitle = document.createElement('p');
    subtitle.className = 'awakening-modal__subtitle';
    subtitle.textContent = I18nManager.t(`${config.baseSkillId}.awakened.name`);

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'awakening-modal__confirm';
    confirm.textContent = I18nManager.t('awakening.confirm');
    confirm.hidden = true;

    content.append(title, subtitle, confirm);
    overlay.append(backdrop, slash, crack, content);
    uiRoot.appendChild(overlay);
    AudioDirector.playPanelOpen();

    requestAnimationFrame(() => overlay.classList.add('awakening-modal--active'));

    let awakenedSkillId: string | null = null;

    const cleanup = (): void => {
      overlay.classList.remove('awakening-modal--active');
      setTimeout(() => overlay.remove(), 400);
    };

    setTimeout(() => {
      confirm.hidden = false;
      confirm.classList.add('awakening-modal__confirm--visible');
    }, PHASE1_MS);

    confirm.addEventListener('click', () => {
      awakenedSkillId = InsightSystem.applyAwakening(options.intentId);
      cleanup();
      resolve(awakenedSkillId);
    });

    setTimeout(() => {
      if (confirm.hidden) return;
    }, PHASE1_MS + PHASE2_MS);
  });
}

import '@/ui/modals/destiny-choice.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { FortuitousEncounterManager } from '@/progression/FortuitousEncounterManager';
import type { EncounterDefinition } from '@/shared/schemas/fortuitous-encounters';

export interface DestinyChoiceOptions {
  encounter: EncounterDefinition;
  poiKey?: string;
}

/**
 * Full-screen destiny choice modal shown after a fortuitous encounter.
 * Player picks one of 2-3 paths (Pháp Bảo / Thần Thông / Ý Cảnh) to receive a specific reward.
 */
export function showDestinyChoiceModal(
  uiRoot: HTMLElement,
  options: DestinyChoiceOptions,
): Promise<string | null> {
  return new Promise((resolve) => {
    const { encounter, poiKey } = options;
    const reward = encounter.reward;
    if (reward.type !== 'destiny_choice') {
      resolve(null);
      return;
    }

    const { options: choices } = reward;

    const overlay = document.createElement('div');
    overlay.className = 'destiny-modal';
    overlay.dataset.testid = 'destiny-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'destiny-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'destiny-modal__card';

    const title = document.createElement('p');
    title.className = 'destiny-modal__title';
    title.textContent = I18nManager.t(encounter.displayNameKey);

    const flavor = document.createElement('p');
    flavor.className = 'destiny-modal__flavor';
    flavor.textContent = I18nManager.t(encounter.flavorKey);

    const prompt = document.createElement('p');
    prompt.className = 'destiny-modal__prompt';
    prompt.textContent = I18nManager.t('destiny.prompt');

    const choicesRow = document.createElement('div');
    choicesRow.className = 'destiny-modal__choices';

    for (const choice of choices) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'destiny-modal__choice';
      btn.dataset.choiceKey = choice.key;

      const icon = document.createElement('span');
      icon.className = 'destiny-modal__choice-icon';
      icon.textContent = choice.icon;

      const label = document.createElement('span');
      label.className = 'destiny-modal__choice-label';
      label.textContent = I18nManager.t(choice.labelKey);

      const desc = document.createElement('span');
      desc.className = 'destiny-modal__choice-desc';
      desc.textContent = I18nManager.t(choice.descKey);

      btn.append(icon, label, desc);

      btn.addEventListener('click', () => {
        FortuitousEncounterManager.apply(encounter, poiKey, choice.key);
        cleanup();
        resolve(choice.key);
      });

      choicesRow.appendChild(btn);
    }

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'destiny-modal__skip';
    skipBtn.textContent = I18nManager.t('destiny.skip');
    skipBtn.addEventListener('click', () => {
      // Still mark the encounter as found but skip the reward
      FortuitousEncounterManager.apply(encounter, poiKey, '__skip__');
      cleanup();
      resolve(null);
    });

    card.append(title, flavor, prompt, choicesRow, skipBtn);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('destiny-modal--active');
    });

    const cleanup = (): void => {
      overlay.classList.remove('destiny-modal--active');
      setTimeout(() => overlay.remove(), 400);
    };
  });
}
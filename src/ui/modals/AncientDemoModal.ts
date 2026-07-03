import '@/ui/modals/ancient-demo.css';
import '@/ui/skills/skill-showcase.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getAncientProfile } from '@/progression/AncientDemoManager';
import { normalizeLoadout } from '@/progression/SkillLoadout';
import type { AncientProfile } from '@/shared/schemas/ancient-demo';
import { createSkillIconStrip, createSkillShowcaseList } from '@/ui/skills/SkillShowcase';

export interface AncientDemoModalOptions {
  ancientId: string;
  needsConfirm: boolean;
}

export interface AncientDemoModalResult {
  confirmed: boolean;
}

/** Lore + signature arts preview — walk in their footsteps (no loadout editing). */
export function showAncientDemoModal(
  uiRoot: HTMLElement,
  options: AncientDemoModalOptions,
): Promise<AncientDemoModalResult> {
  return new Promise((resolve) => {
    const profile = getAncientProfile(options.ancientId);
    const loadout = normalizeLoadout(profile.save.equippedSkills, profile.unlockedSkills);

    const overlay = document.createElement('div');
    overlay.className = 'ancient-demo-modal';
    overlay.dataset.testid = 'ancient-demo-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'ancient-demo-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'ancient-demo-modal__card';

    const epithet = document.createElement('p');
    epithet.className = 'ancient-demo-modal__epithet';
    epithet.textContent = I18nManager.t(profile.epithetKey);

    const name = document.createElement('h2');
    name.className = 'ancient-demo-modal__name';
    name.textContent = I18nManager.t(profile.nameKey);

    const lore = document.createElement('p');
    lore.className = 'ancient-demo-modal__lore';
    lore.textContent = I18nManager.t(profile.loreKey);

    const skills = createSkillShowcaseList(loadout, {
      title: I18nManager.t('demo.skills.signature_title'),
    });

    const note = document.createElement('p');
    note.className = 'ancient-demo-modal__note';
    note.textContent = options.needsConfirm
      ? I18nManager.t('demo.enter.confirm_note')
      : I18nManager.t('demo.enter.note');

    const actions = document.createElement('div');
    actions.className = 'ancient-demo-modal__actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'ancient-demo-modal__cancel';
    cancel.textContent = I18nManager.t('demo.enter.cancel');

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'ancient-demo-modal__confirm';
    confirm.textContent = I18nManager.t('demo.enter.confirm');

    actions.append(cancel, confirm);
    card.append(epithet, name, lore, skills, note, actions);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('ancient-demo-modal--active'));

    const cleanup = (): void => {
      overlay.classList.remove('ancient-demo-modal--active');
      setTimeout(() => overlay.remove(), 350);
    };

    cancel.addEventListener('click', () => {
      cleanup();
      resolve({ confirmed: false });
    });

    backdrop.addEventListener('click', () => {
      cleanup();
      resolve({ confirmed: false });
    });

    confirm.addEventListener('click', () => {
      cleanup();
      resolve({ confirmed: true });
    });
  });
}

export function renderAncientCard(profile: AncientProfile, active: boolean): HTMLElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'home-ancient-card';
  card.dataset.ancientId = profile.id;
  if (active) card.classList.add('home-ancient-card--active');

  const loadout = normalizeLoadout(profile.save.equippedSkills, profile.unlockedSkills);

  const identity = document.createElement('span');
  identity.className = 'home-ancient-card__identity';

  const epithet = document.createElement('span');
  epithet.className = 'home-ancient-card__epithet';
  epithet.textContent = I18nManager.t(profile.epithetKey);

  const name = document.createElement('span');
  name.className = 'home-ancient-card__name';
  name.textContent = I18nManager.t(profile.nameKey);

  identity.append(epithet, name);

  const skills = createSkillIconStrip(loadout);

  card.append(identity, skills);
  return card;
}

import '@/ui/modals/ancient-demo.css';
import '@/ui/skills/skill-detail.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getAncientProfile } from '@/progression/AncientDemoManager';
import { normalizeLoadout, SKILL_SLOTS } from '@/progression/SkillLoadout';
import type { AncientProfile } from '@/shared/schemas/ancient-demo';
import { createSkillIconStrip } from '@/ui/skills/SkillShowcase';
import { createSkillDetailPanel, createSkillTabStrip } from '@/ui/skills/SkillDetailPanel';

export interface AncientDemoModalOptions {
  ancientId: string;
  needsConfirm: boolean;
}

export interface AncientDemoModalResult {
  confirmed: boolean;
}

/** Skill-focused preview — tap each art to read combat stats, lore, and unlock path. */
export function showAncientDemoModal(
  uiRoot: HTMLElement,
  options: AncientDemoModalOptions,
): Promise<AncientDemoModalResult> {
  return new Promise((resolve) => {
    const profile = getAncientProfile(options.ancientId);
    const loadout = normalizeLoadout(profile.save.equippedSkills, profile.unlockedSkills);
    const skillIds = SKILL_SLOTS.map((slot) => loadout[slot]);
    let activeSkillId = skillIds[0] ?? profile.unlockedSkills[0] ?? 'skill.void.slash';

    const overlay = document.createElement('div');
    overlay.className = 'ancient-demo-modal';
    overlay.dataset.testid = 'ancient-demo-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'ancient-demo-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'ancient-demo-modal__card';

    const header = document.createElement('header');
    header.className = 'ancient-demo-modal__header';

    const epithet = document.createElement('p');
    epithet.className = 'ancient-demo-modal__epithet';
    epithet.textContent = I18nManager.t(profile.epithetKey);

    const name = document.createElement('h2');
    name.className = 'ancient-demo-modal__name';
    name.textContent = I18nManager.t(profile.nameKey);

    header.append(epithet, name);

    const skillsLabel = document.createElement('p');
    skillsLabel.className = 'ancient-demo-modal__skills-label';
    skillsLabel.textContent = I18nManager.t('demo.skills.signature_title');

    const detailHost = document.createElement('div');
    detailHost.className = 'ancient-demo-modal__detail-host';

    const renderDetail = (): void => {
      detailHost.replaceChildren(createSkillDetailPanel(activeSkillId));
    };

    const tabs = createSkillTabStrip(skillIds, activeSkillId, (skillId) => {
      activeSkillId = skillId;
      tabs.querySelectorAll('.skill-detail-tabs__tab').forEach((tab) => {
        const el = tab as HTMLButtonElement;
        const selected = el.dataset.skillId === skillId;
        el.classList.toggle('skill-detail-tabs__tab--active', selected);
        el.setAttribute('aria-selected', String(selected));
      });
      renderDetail();
    });

    renderDetail();

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
    card.append(header, skillsLabel, tabs, detailHost, note, actions);
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

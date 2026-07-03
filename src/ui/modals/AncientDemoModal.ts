import '@/ui/modals/ancient-demo.css';
import '@/ui/skills/skill-detail.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getAncientPath, getAncientProfile } from '@/progression/AncientDemoManager';
import { normalizeLoadout, SKILL_SLOTS } from '@/progression/SkillLoadout';
import type { AncientProfile } from '@/shared/schemas/ancient-demo';
import { describeAncientPathStep } from '@/ui/home/ancientPathView';
import { createSkillIconStrip } from '@/ui/skills/SkillShowcase';
import { createSkillDetailPanel, createSkillTabStrip } from '@/ui/skills/SkillDetailPanel';

export interface AncientDemoModalOptions {
  ancientId: string;
  needsConfirm: boolean;
}

export type AncientDemoMode = 'cancel' | 'follow_path' | 'walk_here';

export interface AncientDemoModalResult {
  mode: AncientDemoMode;
}

function renderPathRoad(ancientId: string): HTMLElement {
  const path = getAncientPath(ancientId);
  const section = document.createElement('div');
  section.className = 'ancient-demo-modal__path';

  const title = document.createElement('p');
  title.className = 'ancient-demo-modal__path-title';
  title.textContent = I18nManager.t('demo.path.road_title');
  section.appendChild(title);

  const list = document.createElement('ol');
  list.className = 'ancient-demo-modal__path-list';

  for (const step of path) {
    const view = describeAncientPathStep(step);
    const item = document.createElement('li');
    item.className = 'ancient-demo-modal__path-step';

    const map = document.createElement('span');
    map.className = 'ancient-demo-modal__path-map';
    map.textContent = view.mapLabel;

    const realm = document.createElement('span');
    realm.className = 'ancient-demo-modal__path-realm';
    realm.textContent = view.realmLabel;

    item.append(map, realm);

    if (view.storyLabel) {
      const story = document.createElement('span');
      story.className = 'ancient-demo-modal__path-story';
      story.textContent = I18nManager.t('demo.path.story_beat', { title: view.storyLabel });
      item.appendChild(story);
    }

    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

/** Skill-focused preview — tap each art to read combat stats, lore, and unlock path. */
export function showAncientDemoModal(
  uiRoot: HTMLElement,
  options: AncientDemoModalOptions,
): Promise<AncientDemoModalResult> {
  return new Promise((resolve) => {
    const profile = getAncientProfile(options.ancientId);
    const path = getAncientPath(options.ancientId);
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

    const walkHere = document.createElement('button');
    walkHere.type = 'button';
    walkHere.className = 'ancient-demo-modal__walk-here';
    walkHere.textContent = I18nManager.t('demo.path.walk_here');
    walkHere.hidden = path.length === 0;

    const followPath = document.createElement('button');
    followPath.type = 'button';
    followPath.className = 'ancient-demo-modal__confirm';
    followPath.textContent = I18nManager.t('demo.path.follow');
    followPath.hidden = path.length === 0;

    actions.append(cancel, walkHere, followPath);

    const body = document.createElement('div');
    body.className = 'ancient-demo-modal__body';
    body.append(header);
    if (path.length > 0) {
      body.appendChild(renderPathRoad(options.ancientId));
    }
    body.append(skillsLabel, tabs, detailHost);

    const footer = document.createElement('footer');
    footer.className = 'ancient-demo-modal__footer';
    footer.append(note, actions);

    card.append(body, footer);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('ancient-demo-modal--active'));

    const cleanup = (): void => {
      overlay.classList.remove('ancient-demo-modal--active');
      setTimeout(() => overlay.remove(), 350);
    };

    cancel.addEventListener('click', () => {
      cleanup();
      resolve({ mode: 'cancel' });
    });

    backdrop.addEventListener('click', () => {
      cleanup();
      resolve({ mode: 'cancel' });
    });

    walkHere.addEventListener('click', () => {
      cleanup();
      resolve({ mode: 'walk_here' });
    });

    followPath.addEventListener('click', () => {
      cleanup();
      resolve({ mode: 'follow_path' });
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

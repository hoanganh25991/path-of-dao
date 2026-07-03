import '@/ui/modals/ancient-demo.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getAncientProfile } from '@/progression/AncientDemoManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import type { AncientProfile, AncientSaveTemplate } from '@/shared/schemas/ancient-demo';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  skillSlotLabel,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

export interface AncientDemoModalOptions {
  ancientId: string;
  needsConfirm: boolean;
}

export interface AncientDemoModalResult {
  confirmed: boolean;
  equippedSkills?: AncientSaveTemplate['equippedSkills'];
}

const SKILL_SLOTS: SkillSlotId[] = ['primary', 'secondary', 'ultimate'];

function createLoadoutPicker(
  profile: AncientProfile,
  onChange: (loadout: AncientSaveTemplate['equippedSkills']) => void,
): {
  root: HTMLElement;
  getLoadout: () => AncientSaveTemplate['equippedSkills'];
} {
  const loadout: AncientSaveTemplate['equippedSkills'] = { ...profile.save.equippedSkills };
  let activeSlot: SkillSlotId = 'primary';

  const root = document.createElement('div');
  root.className = 'ancient-demo-modal__loadout';

  const heading = document.createElement('p');
  heading.className = 'ancient-demo-modal__loadout-title';
  heading.textContent = I18nManager.t('demo.skills.loadout_title');

  const hint = document.createElement('p');
  hint.className = 'ancient-demo-modal__loadout-hint';
  hint.textContent = I18nManager.t('demo.skills.loadout_hint');

  const slotsRow = document.createElement('div');
  slotsRow.className = 'ancient-demo-modal__slots';

  const slotButtons = new Map<SkillSlotId, HTMLButtonElement>();

  const renderSlots = (): void => {
    for (const slot of SKILL_SLOTS) {
      let btn = slotButtons.get(slot);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ancient-demo-modal__slot';
        btn.dataset.slot = slot;
        btn.addEventListener('click', () => {
          activeSlot = slot;
          renderSlots();
        });
        slotButtons.set(slot, btn);
        slotsRow.appendChild(btn);
      }

      const skillId = loadout[slot];
      btn.innerHTML = `
        <span class="ancient-demo-modal__slot-label">${skillSlotLabel(slot)}</span>
        <span class="ancient-demo-modal__slot-icon">${renderSkillButtonHtml(skillId)}</span>
      `;
      btn.classList.toggle('ancient-demo-modal__slot--active', slot === activeSlot);
      btn.classList.toggle('ancient-demo-modal__slot--awakened', isAwakenedSkillId(skillId));
    }
  };

  const pool = document.createElement('div');
  pool.className = 'ancient-demo-modal__pool';

  for (const skillId of profile.unlockedSkills) {
    const def = getSkillDefinition(skillId);
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'ancient-demo-modal__pool-skill';
    pick.dataset.skillId = skillId;
    pick.innerHTML = `
      <span class="ancient-demo-modal__pool-icon">${renderSkillButtonHtml(skillId)}</span>
      <span class="ancient-demo-modal__pool-name">${I18nManager.t(`${def.nameKey}`)}</span>
    `;
    if (isAwakenedSkillId(skillId)) {
      pick.classList.add('ancient-demo-modal__pool-skill--awakened');
    }
    pick.addEventListener('click', () => {
      loadout[activeSlot] = skillId;
      renderSlots();
      onChange({ ...loadout });
    });
    pool.appendChild(pick);
  }

  renderSlots();
  root.append(heading, hint, slotsRow, pool);

  return {
    root,
    getLoadout: () => ({ ...loadout }),
  };
}

/** Lore card + skill loadout before walking in an ancient cultivator's footsteps. */
export function showAncientDemoModal(
  uiRoot: HTMLElement,
  options: AncientDemoModalOptions,
): Promise<AncientDemoModalResult> {
  return new Promise((resolve) => {
    const profile = getAncientProfile(options.ancientId);
    const loadoutPicker = createLoadoutPicker(profile, () => {});

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

    const chips = document.createElement('div');
    chips.className = 'ancient-demo-modal__chips';
    for (const key of profile.highlightKeys) {
      const chip = document.createElement('span');
      chip.className = 'ancient-demo-modal__chip';
      chip.textContent = I18nManager.t(key);
      chips.appendChild(chip);
    }

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
    card.append(epithet, name, lore, chips, loadoutPicker.root, note, actions);
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
      resolve({ confirmed: true, equippedSkills: loadoutPicker.getLoadout() });
    });
  });
}

export function renderAncientCard(profile: AncientProfile, active: boolean): HTMLElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'home-ancient-card';
  card.dataset.ancientId = profile.id;
  if (active) card.classList.add('home-ancient-card--active');

  const epithet = document.createElement('span');
  epithet.className = 'home-ancient-card__epithet';
  epithet.textContent = I18nManager.t(profile.epithetKey);

  const name = document.createElement('span');
  name.className = 'home-ancient-card__name';
  name.textContent = I18nManager.t(profile.nameKey);

  const chips = document.createElement('span');
  chips.className = 'home-ancient-card__chips';
  chips.textContent = profile.highlightKeys.map((key) => I18nManager.t(key)).join(' · ');

  const skillPreview = document.createElement('span');
  skillPreview.className = 'home-ancient-card__skills';
  skillPreview.innerHTML = profile.unlockedSkills
    .slice(0, 5)
    .map((id) => `<span class="home-ancient-card__skill">${renderSkillButtonHtml(id)}</span>`)
    .join('');

  card.append(epithet, name, chips, skillPreview);
  return card;
}

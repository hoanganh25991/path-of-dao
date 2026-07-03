import { I18nManager } from '@/core/i18n/I18nManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import {
  assignSkillToSlot,
  listAssignableSkills,
  normalizeLoadout,
  SKILL_SLOTS,
  type EquippedSkills,
} from '@/progression/SkillLoadout';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

/** Shared loadout picker — Echoes modal pre-walk assign. */
export function createLoadoutPickerElement(
  initial: EquippedSkills,
  pool: string[],
  onChange: (loadout: EquippedSkills) => void,
): { root: HTMLElement; getLoadout: () => EquippedSkills } {
  const loadout = normalizeLoadout(initial, pool);
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

  const poolEl = document.createElement('div');
  poolEl.className = 'ancient-demo-modal__pool';

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
          renderPool();
        });
        slotButtons.set(slot, btn);
        slotsRow.appendChild(btn);
      }

      const skillId = loadout[slot];
      btn.innerHTML = `
        <span class="ancient-demo-modal__slot-label">${I18nManager.t(`demo.skills.slot.${slot}`)}</span>
        <span class="ancient-demo-modal__slot-icon">${renderSkillButtonHtml(skillId)}</span>
      `;
      btn.classList.toggle('ancient-demo-modal__slot--active', slot === activeSlot);
      btn.classList.toggle('ancient-demo-modal__slot--awakened', isAwakenedSkillId(skillId));
    }
  };

  const renderPool = (): void => {
    poolEl.replaceChildren();
    for (const skillId of listAssignableSkills(loadout, activeSlot, pool)) {
      const def = getSkillDefinition(skillId);
      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'ancient-demo-modal__pool-skill';
      if (loadout[activeSlot] === skillId) pick.classList.add('ancient-demo-modal__pool-skill--active');
      if (isAwakenedSkillId(skillId)) pick.classList.add('ancient-demo-modal__pool-skill--awakened');

      pick.innerHTML = `
        <span class="ancient-demo-modal__pool-icon">${renderSkillButtonHtml(skillId)}</span>
        <span class="ancient-demo-modal__pool-name">${I18nManager.t(def.nameKey)}</span>
      `;

      pick.addEventListener('click', () => {
        Object.assign(loadout, assignSkillToSlot(loadout, activeSlot, skillId));
        renderSlots();
        renderPool();
        onChange({ ...loadout });
      });
      poolEl.appendChild(pick);
    }
  };

  renderSlots();
  renderPool();
  root.append(heading, hint, slotsRow, poolEl);

  return {
    root,
    getLoadout: () => ({ ...loadout }),
  };
}

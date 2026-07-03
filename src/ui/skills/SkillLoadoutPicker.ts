import '@/ui/skills/skill-detail.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import {
  assignSkillToSlot,
  listAssignableSkills,
  normalizeLoadout,
  SKILL_SLOTS,
  type EquippedSkills,
} from '@/progression/SkillLoadout';
import { createSkillDetailPanel } from '@/ui/skills/SkillDetailPanel';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

/** Shared loadout picker — slot row, skill detail preview, icon pool. */
export function createLoadoutPickerElement(
  initial: EquippedSkills,
  pool: string[],
  onChange: (loadout: EquippedSkills) => void,
): { root: HTMLElement; getLoadout: () => EquippedSkills } {
  const loadout = normalizeLoadout(initial, pool);
  let activeSlot: SkillSlotId = 'primary';
  let previewSkillId = loadout.primary;

  const root = document.createElement('div');
  root.className = 'skill-loadout';

  const slotsRow = document.createElement('div');
  slotsRow.className = 'ancient-demo-modal__slots';
  const slotButtons = new Map<SkillSlotId, HTMLButtonElement>();

  const detailHost = document.createElement('div');
  detailHost.className = 'skill-loadout__detail';

  const poolEl = document.createElement('div');
  poolEl.className = 'skill-loadout__pool-icons';

  const renderDetail = (): void => {
    detailHost.replaceChildren(createSkillDetailPanel(previewSkillId));
  };

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
          previewSkillId = loadout[slot];
          renderSlots();
          renderPool();
          renderDetail();
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
      pick.className = 'skill-loadout__pool-icon';
      pick.title = I18nManager.t(def.nameKey);
      pick.innerHTML = renderSkillButtonHtml(skillId);

      const equipped = Object.values(loadout).includes(skillId);
      const isActiveSlot = loadout[activeSlot] === skillId;
      const isPreview = previewSkillId === skillId;

      if (isActiveSlot) pick.classList.add('skill-loadout__pool-icon--active');
      if (equipped && !isActiveSlot) pick.classList.add('skill-loadout__pool-icon--equipped');
      if (isPreview && !isActiveSlot) pick.classList.add('skill-loadout__pool-icon--active');
      if (isAwakenedSkillId(skillId)) pick.classList.add('skill-loadout__pool-icon--awakened');

      pick.addEventListener('click', () => {
        previewSkillId = skillId;
        Object.assign(loadout, assignSkillToSlot(loadout, activeSlot, skillId));
        renderSlots();
        renderPool();
        renderDetail();
        onChange({ ...loadout });
      });

      poolEl.appendChild(pick);
    }
  };

  renderSlots();
  renderPool();
  renderDetail();
  root.append(slotsRow, detailHost, poolEl);

  return {
    root,
    getLoadout: () => ({ ...loadout }),
  };
}

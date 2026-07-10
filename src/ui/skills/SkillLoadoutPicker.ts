import '@/ui/skills/skill-detail.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import {
  listAssignableSkills,
  normalizeLoadout,
  SKILL_SLOTS,
  type DivineArtsLoadout,
} from '@/progression/SkillLoadout';
import type { SkillSlotIndex } from '@/progression/SkillSlots';
import { createSkillDetailPanel } from '@/ui/skills/SkillDetailPanel';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
} from '@/ui/skills/SkillIcon';

function slotLabel(slot: SkillSlotIndex): string {
  return I18nManager.t('combat.skills.slot', { n: slot + 1 });
}

/** Shared loadout picker — slot row, skill detail preview, icon pool. */
export function createLoadoutPickerElement(
  initial: DivineArtsLoadout,
  pool: string[],
  onChange: (loadout: DivineArtsLoadout) => void,
): { root: HTMLElement; getLoadout: () => DivineArtsLoadout } {
  const loadout = normalizeLoadout(initial, pool);
  let activeSlot: SkillSlotIndex = 0;
  let previewSkillId = loadout[0] || pool[0] || '';

  const root = document.createElement('div');
  root.className = 'skill-loadout';

  const assignSection = document.createElement('div');
  assignSection.className = 'skill-loadout__assign';

  const slotsRow = document.createElement('div');
  slotsRow.className = 'ancient-demo-modal__slots';
  const slotButtons = new Map<SkillSlotIndex, HTMLButtonElement>();

  const activeSlotLabel = document.createElement('p');
  activeSlotLabel.className = 'skill-loadout__active-slot';

  const poolLabel = document.createElement('p');
  poolLabel.className = 'skill-loadout__pool-label';
  poolLabel.textContent = I18nManager.t('combat.skills.pool_label');

  const poolEl = document.createElement('div');
  poolEl.className = 'skill-loadout__pool-icons';

  const detailHost = document.createElement('div');
  detailHost.className = 'skill-loadout__detail';

  const renderActiveSlotLabel = (): void => {
    activeSlotLabel.textContent = I18nManager.t('combat.skills.pick_title', {
      slot: slotLabel(activeSlot),
    });
  };

  const renderDetail = (): void => {
    if (!previewSkillId) {
      detailHost.replaceChildren();
      return;
    }
    detailHost.replaceChildren(createSkillDetailPanel(previewSkillId, { compact: true }));
  };

  const renderSlots = (): void => {
    for (const slot of SKILL_SLOTS) {
      let btn = slotButtons.get(slot);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ancient-demo-modal__slot';
        btn.dataset.slot = String(slot);
        btn.addEventListener('click', () => {
          activeSlot = slot;
          previewSkillId = loadout[slot];
          renderSlots();
          renderActiveSlotLabel();
          renderPool();
          renderDetail();
        });
        slotButtons.set(slot, btn);
        slotsRow.appendChild(btn);
      }

      const skillId = loadout[slot];
      if (!skillId) {
        btn.innerHTML = `
          <span class="ancient-demo-modal__slot-label">${slotLabel(slot)}</span>
          <span class="ancient-demo-modal__slot-icon"><span class="skill-btn__icon skill-btn__icon--empty">·</span></span>
          <span class="ancient-demo-modal__slot-skill">${I18nManager.t('home.skills.slot_empty')}</span>
        `;
      } else {
        const skillName = I18nManager.t(getSkillDefinition(skillId).nameKey);
        btn.innerHTML = `
          <span class="ancient-demo-modal__slot-label">${slotLabel(slot)}</span>
          <span class="ancient-demo-modal__slot-icon">${renderSkillButtonHtml(skillId)}</span>
          <span class="ancient-demo-modal__slot-skill">${skillName}</span>
        `;
      }
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

      const assignedToActiveSlot = loadout[activeSlot] === skillId;

      if (assignedToActiveSlot) pick.classList.add('skill-loadout__pool-icon--active');
      if (isAwakenedSkillId(skillId)) pick.classList.add('skill-loadout__pool-icon--awakened');

      pick.addEventListener('click', () => {
        previewSkillId = skillId;
        loadout[activeSlot] = skillId;
        renderSlots();
        renderPool();
        renderDetail();
        onChange([...loadout] as DivineArtsLoadout);
      });

      poolEl.appendChild(pick);
    }
  };

  renderSlots();
  renderActiveSlotLabel();
  renderPool();
  renderDetail();
  assignSection.append(slotsRow, activeSlotLabel, poolLabel, poolEl);
  root.append(assignSection, detailHost);

  return {
    root,
    getLoadout: () => [...loadout] as DivineArtsLoadout,
  };
}

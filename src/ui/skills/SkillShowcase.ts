import { I18nManager } from '@/core/i18n/I18nManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import type { EquippedSkills } from '@/progression/SkillLoadout';
import { SKILL_SLOTS } from '@/progression/SkillLoadout';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';

function skillDescKey(nameKey: string): string {
  return nameKey.endsWith('.name') ? nameKey.replace(/\.name$/, '.desc') : `${nameKey}.desc`;
}

export function createSkillShowcaseList(
  loadout: EquippedSkills,
  options: { compact?: boolean; title?: string } = {},
): HTMLElement {
  const root = document.createElement('div');
  root.className = options.compact
    ? 'skill-showcase skill-showcase--compact'
    : 'skill-showcase';

  if (options.title) {
    const heading = document.createElement('p');
    heading.className = 'skill-showcase__title';
    heading.textContent = options.title;
    root.appendChild(heading);
  }

  const list = document.createElement('ul');
  list.className = 'skill-showcase__list';

  for (const slot of SKILL_SLOTS) {
    list.appendChild(createSkillShowcaseRow(loadout[slot], slot, options.compact));
  }

  root.appendChild(list);
  return root;
}

function createSkillShowcaseRow(
  skillId: string,
  slot: SkillSlotId,
  compact?: boolean,
): HTMLElement {
  const def = getSkillDefinition(skillId);
  const row = document.createElement('li');
  row.className = 'skill-showcase__row';
  if (isAwakenedSkillId(skillId)) row.classList.add('skill-showcase__row--awakened');

  const icon = document.createElement('span');
  icon.className = 'skill-showcase__icon';
  icon.innerHTML = renderSkillButtonHtml(skillId);

  const body = document.createElement('div');
  body.className = 'skill-showcase__body';

  const slotLabel = document.createElement('span');
  slotLabel.className = 'skill-showcase__slot';
  slotLabel.textContent = I18nManager.t(`demo.skills.slot.${slot}`);

  const name = document.createElement('span');
  name.className = 'skill-showcase__name';
  name.textContent = I18nManager.t(def.nameKey);

  body.append(slotLabel, name);

  if (!compact) {
    const desc = document.createElement('p');
    desc.className = 'skill-showcase__desc';
    desc.textContent = I18nManager.t(skillDescKey(def.nameKey));
    body.appendChild(desc);
  }

  row.append(icon, body);
  return row;
}

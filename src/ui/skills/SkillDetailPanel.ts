import '@/ui/skills/skill-detail.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { getSkillDefinition } from '@/progression/SkillLoader';
import {
  buildSkillDisplayStats,
  skillDescKey,
  skillDifficultyKey,
  skillLoreKey,
  skillUnlockParams,
  skillUnlockText,
} from '@/ui/skills/SkillCombatStats';
import { isAwakenedSkillId, renderSkillButtonHtml } from '@/ui/skills/SkillIcon';

function renderDifficultyStars(count: number): string {
  const filled = Math.min(5, Math.max(1, count));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function loreForSkill(skillId: string, nameKey: string): string {
  const loreKey = skillLoreKey(skillId);
  const lore = I18nManager.t(loreKey);
  if (lore !== loreKey) return lore;
  return I18nManager.t(skillDescKey(nameKey));
}

function difficultyForSkill(skillId: string, stars: number): string {
  const key = skillDifficultyKey(skillId);
  const text = I18nManager.t(key);
  if (text !== key) return text;
  return renderDifficultyStars(stars);
}

function unlockLine(skillId: string): string {
  const key = skillUnlockText(skillId);
  const params = skillUnlockParams(skillId);
  const resolved: Record<string, string> = {};
  for (const [param, value] of Object.entries(params)) {
    resolved[param] = value.startsWith('realm.') || value.startsWith('intent.')
      ? I18nManager.t(value)
      : value;
  }
  return I18nManager.t(key, resolved);
}

export function createSkillDetailPanel(skillId: string): HTMLElement {
  const def = getSkillDefinition(skillId);
  const stats = buildSkillDisplayStats(skillId);
  const awakened = isAwakenedSkillId(skillId);

  const root = document.createElement('article');
  root.className = 'skill-detail';
  root.dataset.skillId = skillId;

  const hero = document.createElement('header');
  hero.className = 'skill-detail__hero';

  const icon = document.createElement('div');
  icon.className = 'skill-detail__icon';
  icon.innerHTML = renderSkillButtonHtml(skillId);

  const titles = document.createElement('div');
  titles.className = 'skill-detail__titles';

  const tier = document.createElement('span');
  tier.className = 'skill-detail__tier';
  tier.textContent = I18nManager.t(
    awakened ? 'skill.detail.tier.awakened' : 'skill.detail.tier.base',
  );

  const name = document.createElement('h3');
  name.className = 'skill-detail__name';
  name.textContent = I18nManager.t(def.nameKey);

  const kind = document.createElement('span');
  kind.className = 'skill-detail__kind';
  kind.textContent = I18nManager.t(`skill.detail.kind.${stats.kind}`);

  titles.append(tier, name, kind);
  hero.append(icon, titles);

  const desc = document.createElement('p');
  desc.className = 'skill-detail__desc';
  desc.textContent = I18nManager.t(skillDescKey(def.nameKey));

  const statGrid = document.createElement('dl');
  statGrid.className = 'skill-detail__stats';

  const statEntries: Array<[string, string]> = [
    ['skill.detail.stat.damage', stats.damageText],
    ['skill.detail.stat.mana', String(stats.manaCost)],
    ['skill.detail.stat.cooldown', `${(stats.cooldownMs / 1000).toFixed(1)}s`],
    ['skill.detail.stat.aoe', stats.aoeText],
    ['skill.detail.stat.range', stats.rangeText],
  ];

  for (const [labelKey, value] of statEntries) {
    const dt = document.createElement('dt');
    dt.textContent = I18nManager.t(labelKey);
    const dd = document.createElement('dd');
    dd.textContent = value;
    statGrid.append(dt, dd);
  }

  const loreBlock = document.createElement('section');
  loreBlock.className = 'skill-detail__block';

  const loreTitle = document.createElement('h4');
  loreTitle.className = 'skill-detail__block-title';
  loreTitle.textContent = I18nManager.t('skill.detail.lore_title');

  const lore = document.createElement('p');
  lore.className = 'skill-detail__lore';
  lore.textContent = loreForSkill(skillId, def.nameKey);

  loreBlock.append(loreTitle, lore);

  const meta = document.createElement('div');
  meta.className = 'skill-detail__meta';

  const unlockBlock = document.createElement('section');
  unlockBlock.className = 'skill-detail__block skill-detail__block--compact';

  const unlockTitle = document.createElement('h4');
  unlockTitle.className = 'skill-detail__block-title';
  unlockTitle.textContent = I18nManager.t('skill.detail.unlock_title');

  const unlock = document.createElement('p');
  unlock.className = 'skill-detail__unlock';
  unlock.textContent = unlockLine(skillId);

  unlockBlock.append(unlockTitle, unlock);

  const diffBlock = document.createElement('section');
  diffBlock.className = 'skill-detail__block skill-detail__block--compact';

  const diffTitle = document.createElement('h4');
  diffTitle.className = 'skill-detail__block-title';
  diffTitle.textContent = I18nManager.t('skill.detail.difficulty_title');

  const diff = document.createElement('p');
  diff.className = 'skill-detail__difficulty';
  diff.textContent = difficultyForSkill(skillId, stats.difficultyStars);

  diffBlock.append(diffTitle, diff);
  meta.append(unlockBlock, diffBlock);

  root.append(hero, desc, statGrid, loreBlock, meta);
  return root;
}

export function createSkillTabStrip(
  skillIds: string[],
  activeId: string,
  onSelect: (skillId: string) => void,
): HTMLElement {
  const strip = document.createElement('div');
  strip.className = 'skill-detail-tabs';
  strip.setAttribute('role', 'tablist');

  for (const skillId of skillIds) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'skill-detail-tabs__tab';
    tab.dataset.skillId = skillId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(skillId === activeId));
    if (skillId === activeId) tab.classList.add('skill-detail-tabs__tab--active');
    if (isAwakenedSkillId(skillId)) tab.classList.add('skill-detail-tabs__tab--awakened');
    tab.innerHTML = renderSkillButtonHtml(skillId);
    tab.addEventListener('click', () => onSelect(skillId));
    strip.appendChild(tab);
  }

  return strip;
}

import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { I18nManager } from '@/core/i18n/I18nManager';
import {
  assignSkillToSlot,
  listAssignableSkills,
  listUnlockedSkillIds,
} from '@/progression/SkillLoadout';
import { getSkillDefinition } from '@/progression/SkillLoader';
import {
  isAwakenedSkillId,
  renderSkillButtonHtml,
  type SkillSlotId,
} from '@/ui/skills/SkillIcon';
import '@/ui/hud/combat-skill-picker.css';

/** In-combat bottom sheet — long-press a skill button to swap loadout. */
export class CombatSkillPicker {
  private static root: HTMLElement | null = null;
  private static panel: HTMLElement | null = null;
  private static unsubscribe: (() => void) | null = null;

  static init(parent: HTMLElement): void {
    if (CombatSkillPicker.root) return;

    const root = document.createElement('div');
    root.className = 'combat-skill-picker';
    root.hidden = true;

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'combat-skill-picker__backdrop';
    backdrop.setAttribute('aria-label', 'Close skill picker');

    const panel = document.createElement('div');
    panel.className = 'combat-skill-picker__panel';

    root.append(backdrop, panel);
    parent.appendChild(root);

    CombatSkillPicker.root = root;
    CombatSkillPicker.panel = panel;

    backdrop.addEventListener('click', () => CombatSkillPicker.close());

    CombatSkillPicker.unsubscribe = EventBus.on('combat:open-skill-picker', ({ slot }) => {
      CombatSkillPicker.open(slot);
    });
  }

  static destroy(): void {
    CombatSkillPicker.unsubscribe?.();
    CombatSkillPicker.unsubscribe = null;
    CombatSkillPicker.root?.remove();
    CombatSkillPicker.root = null;
    CombatSkillPicker.panel = null;
  }

  static open(slot: SkillSlotId): void {
    const save = gameStore.getState().save;
    if (!save || !CombatSkillPicker.panel || !CombatSkillPicker.root) return;

    CombatSkillPicker.root.hidden = false;
    requestAnimationFrame(() => CombatSkillPicker.root?.classList.add('combat-skill-picker--open'));

    const pool = listUnlockedSkillIds(save);
    const loadout = save.equippedSkills;
    const assignable = listAssignableSkills(loadout, slot, pool);

    CombatSkillPicker.panel.replaceChildren();

    const title = document.createElement('p');
    title.className = 'combat-skill-picker__title';
    title.textContent = I18nManager.t('combat.skills.pick_title', {
      slot: I18nManager.t(`demo.skills.slot.${slot}`),
    });

    const hint = document.createElement('p');
    hint.className = 'combat-skill-picker__hint';
    hint.textContent = I18nManager.t('combat.skills.pick_hint');

    const grid = document.createElement('div');
    grid.className = 'combat-skill-picker__grid';

    for (const skillId of assignable) {
      const def = getSkillDefinition(skillId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'combat-skill-picker__skill';
      if (loadout[slot] === skillId) btn.classList.add('combat-skill-picker__skill--active');
      if (isAwakenedSkillId(skillId)) btn.classList.add('combat-skill-picker__skill--awakened');

      btn.innerHTML = `
        <span class="combat-skill-picker__icon">${renderSkillButtonHtml(skillId)}</span>
        <span class="combat-skill-picker__name">${I18nManager.t(def.nameKey)}</span>
      `;

      btn.addEventListener('click', () => {
        const equippedSkills = assignSkillToSlot(save.equippedSkills, slot, skillId);
        gameStore.getState().patch({ equippedSkills });
        EventBus.emit('loadout:changed', { equippedSkills });
        CombatSkillPicker.close();
      });
      grid.appendChild(btn);
    }

    CombatSkillPicker.panel.append(title, hint, grid);
  }

  static close(): void {
    if (!CombatSkillPicker.root) return;
    CombatSkillPicker.root.classList.remove('combat-skill-picker--open');
    setTimeout(() => {
      if (CombatSkillPicker.root) CombatSkillPicker.root.hidden = true;
    }, 220);
  }
}

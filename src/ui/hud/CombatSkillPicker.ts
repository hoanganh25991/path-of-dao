import { EventBus } from '@/core/EventBus';
import { gameStore } from '@/core/store/gameStore';
import { I18nManager } from '@/core/i18n/I18nManager';
import { listUnlockedSkillIds } from '@/progression/SkillLoadout';
import { createLoadoutPickerElement } from '@/ui/skills/SkillLoadoutPicker';
import '@/ui/hud/combat-skill-picker.css';

/** In-combat loadout editor — opened via explicit ⟳ button. */
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

    CombatSkillPicker.unsubscribe = EventBus.on('combat:open-skill-picker', () => {
      CombatSkillPicker.open();
    });
  }

  static destroy(): void {
    CombatSkillPicker.unsubscribe?.();
    CombatSkillPicker.unsubscribe = null;
    CombatSkillPicker.root?.remove();
    CombatSkillPicker.root = null;
    CombatSkillPicker.panel = null;
  }

  static open(): void {
    const save = gameStore.getState().save;
    if (!save || !CombatSkillPicker.panel || !CombatSkillPicker.root) return;

    CombatSkillPicker.root.hidden = false;
    requestAnimationFrame(() => CombatSkillPicker.root?.classList.add('combat-skill-picker--open'));

    const pool = listUnlockedSkillIds(save);
    const picker = createLoadoutPickerElement(save.equippedSkills, pool, (loadout) => {
      gameStore.getState().patch({ equippedSkills: loadout });
      EventBus.emit('loadout:changed', { equippedSkills: loadout });
    });

    CombatSkillPicker.panel.replaceChildren();

    const title = document.createElement('p');
    title.className = 'combat-skill-picker__title';
    title.textContent = I18nManager.t('combat.skills.swap_title');

    const hint = document.createElement('p');
    hint.className = 'combat-skill-picker__hint';
    hint.textContent = I18nManager.t('combat.skills.swap_hint');

    const body = document.createElement('div');
    body.className = 'combat-skill-picker__body';
    body.append(picker.root);

    const footer = document.createElement('div');
    footer.className = 'combat-skill-picker__footer';

    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'combat-skill-picker__done';
    done.textContent = I18nManager.t('combat.skills.done');
    done.addEventListener('click', () => CombatSkillPicker.close());

    footer.appendChild(done);
    CombatSkillPicker.panel.append(title, hint, body, footer);
  }

  static close(): void {
    if (!CombatSkillPicker.root) return;
    CombatSkillPicker.root.classList.remove('combat-skill-picker--open');
    setTimeout(() => {
      if (CombatSkillPicker.root) CombatSkillPicker.root.hidden = true;
    }, 220);
  }
}

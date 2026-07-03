import '@/ui/modals/breakthrough.css';
import { I18nManager } from '@/core/i18n/I18nManager';
import { BreakthroughManager, type StatDelta } from '@/progression/BreakthroughManager';

export interface BreakthroughModalOptions {
  nextRealmKey: string;
}

const PHASE1_MS = 2000;
const PHASE2_MS = 1800;
const PHASE3_MS = 600;

/** Full-screen breakthrough ceremony (sub-plan 13 §6). Aura upgrade is emitted via EventBus. */
export function showBreakthroughModal(
  uiRoot: HTMLElement,
  options: BreakthroughModalOptions,
): Promise<StatDelta | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'breakthrough-modal';
    overlay.dataset.testid = 'breakthrough-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'breakthrough-modal__backdrop';

    const content = document.createElement('div');
    content.className = 'breakthrough-modal__content';

    const particles = document.createElement('div');
    particles.className = 'breakthrough-modal__particles';
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      p.className = 'breakthrough-modal__particle';
      p.style.setProperty('--i', String(i));
      particles.appendChild(p);
    }

    const title = document.createElement('p');
    title.className = 'breakthrough-modal__title';
    title.hidden = true;

    const flash = document.createElement('div');
    flash.className = 'breakthrough-modal__flash';
    flash.hidden = true;

    const deltaPanel = document.createElement('div');
    deltaPanel.className = 'breakthrough-modal__delta';
    deltaPanel.hidden = true;

    content.append(particles, title, deltaPanel);
    overlay.append(backdrop, content, flash);
    uiRoot.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('breakthrough-modal--active'));

    const realmName = I18nManager.t(`${options.nextRealmKey}.name`);
    let appliedDelta: StatDelta | null = null;

    const cleanup = (): void => {
      overlay.classList.remove('breakthrough-modal--active');
      setTimeout(() => overlay.remove(), 400);
    };

    const showDelta = (delta: StatDelta): void => {
      deltaPanel.innerHTML = `
        <p class="breakthrough-modal__delta-title">${I18nManager.t('breakthrough.stats_gained')}</p>
        <ul class="breakthrough-modal__delta-list">
          ${delta.hpMax > 0 ? `<li>+${delta.hpMax} HP</li>` : ''}
          ${delta.atk > 0 ? `<li>+${delta.atk} ATK</li>` : ''}
          ${delta.def > 0 ? `<li>+${delta.def} DEF</li>` : ''}
        </ul>
      `;
      deltaPanel.hidden = false;
    };

    setTimeout(() => {
      title.textContent = I18nManager.t('breakthrough.phase2', { realm: realmName });
      title.hidden = false;
      title.classList.add('breakthrough-modal__title--visible');
    }, PHASE1_MS);

    setTimeout(() => {
      flash.hidden = false;
      flash.classList.add('breakthrough-modal__flash--active');

      appliedDelta = BreakthroughManager.applyBreakthrough();
      if (appliedDelta) {
        showDelta(appliedDelta);
      }

      setTimeout(() => {
        cleanup();
        resolve(appliedDelta);
      }, PHASE3_MS + 800);
    }, PHASE1_MS + PHASE2_MS);
  });
}

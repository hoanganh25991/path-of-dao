import '@/ui/story/timeline.css';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { I18nManager } from '@/core/i18n/I18nManager';

export type TimelineOfferChoice = 'read' | 'later';

/** "A page of the road opens" — offered once per shard on first map clear (sub-plan 31 §6.2). */
export function showTimelineOfferModal(uiRoot: HTMLElement): Promise<TimelineOfferChoice> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'timeline-offer-modal home-ui__interactive';
    overlay.dataset.testid = 'timeline-offer-modal';

    const backdrop = document.createElement('div');
    backdrop.className = 'timeline-offer-modal__backdrop';

    const card = document.createElement('div');
    card.className = 'timeline-offer-modal__card';

    const title = document.createElement('p');
    title.className = 'timeline-offer-modal__title';
    title.textContent = I18nManager.t('timeline.offer.title');

    const actions = document.createElement('div');
    actions.className = 'timeline-offer-modal__actions';

    const laterBtn = document.createElement('button');
    laterBtn.type = 'button';
    laterBtn.className = 'timeline-offer-modal__btn';
    laterBtn.dataset.testid = 'timeline-offer-later';
    laterBtn.textContent = I18nManager.t('timeline.offer.later');

    const readBtn = document.createElement('button');
    readBtn.type = 'button';
    readBtn.className = 'timeline-offer-modal__btn timeline-offer-modal__btn--primary';
    readBtn.dataset.testid = 'timeline-offer-read';
    readBtn.textContent = I18nManager.t('timeline.offer.read');

    actions.append(laterBtn, readBtn);
    card.append(title, actions);
    overlay.append(backdrop, card);
    uiRoot.appendChild(overlay);
    AudioDirector.playPanelOpen();

    requestAnimationFrame(() => {
      overlay.classList.add('timeline-offer-modal--active');
    });

    const finish = (choice: TimelineOfferChoice): void => {
      overlay.classList.remove('timeline-offer-modal--active');
      setTimeout(() => overlay.remove(), 300);
      resolve(choice);
    };

    readBtn.addEventListener('click', () => finish('read'));
    laterBtn.addEventListener('click', () => finish('later'));
  });
}

import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';

export interface StoryPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function chapterTitle(chapterId: string): string {
  const slug = chapterId.replace(/^chapter\.\d+\./, '').replace(/_/g, ' ');
  return slug.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function createStoryPanel(): StoryPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-story';
  root.dataset.panel = 'story';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.story');

  const list = document.createElement('div');
  list.className = 'home-story__list';

  root.append(title, list);

  const refresh = (): void => {
    const save = gameStore.getState().save;
    list.replaceChildren();

    const seen = save?.progress.storySeen ?? [];
    if (seen.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.textContent = I18nManager.t('home.story.empty');
      list.appendChild(empty);
      return;
    }

    for (const chapterId of seen) {
      const row = document.createElement('div');
      row.className = 'home-story__row';

      const chapterTitleEl = document.createElement('p');
      chapterTitleEl.className = 'home-story__title';
      chapterTitleEl.textContent = chapterTitle(chapterId);

      const replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'home-story__replay';
      replayBtn.textContent = I18nManager.t('home.story.replay');
      replayBtn.addEventListener('click', () => {
        // Sub-plan 18 wires full story replay.
      });

      row.append(chapterTitleEl, replayBtn);
      list.appendChild(row);
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}

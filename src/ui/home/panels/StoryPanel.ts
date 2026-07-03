import { SceneRouter } from '@/app/SceneRouter';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { getChapterByStoryScene } from '@/progression/ChapterLoader';

export interface StoryPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
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

    const lore = save?.progress.loreUnlocked ?? [];
    const seen = save?.progress.storySeen ?? [];

    if (lore.length === 0 && seen.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.textContent = I18nManager.t('home.story.empty');
      list.appendChild(empty);
      return;
    }

    for (const loreId of lore) {
      const row = document.createElement('div');
      row.className = 'home-story__row home-story__row--lore';

      const loreTitle = document.createElement('p');
      loreTitle.className = 'home-story__title';
      const loreKey = loreId.replace(/^lore\./, 'demo.lore.');
      loreTitle.textContent = I18nManager.t(loreKey);

      row.appendChild(loreTitle);
      list.appendChild(row);
    }

    for (const sceneId of seen) {
      const chapter = getChapterByStoryScene(sceneId);
      const row = document.createElement('div');
      row.className = 'home-story__row';

      const chapterTitleEl = document.createElement('p');
      chapterTitleEl.className = 'home-story__title';
      chapterTitleEl.textContent = chapter
        ? I18nManager.t(chapter.titleKey)
        : sceneId;

      const replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'home-story__replay';
      replayBtn.textContent = I18nManager.t('home.story.replay');
      replayBtn.addEventListener('click', () => {
        if (!chapter) return;
        void SceneRouter.instance.switchTo('story', {
          chapterId: chapter.id,
          sceneId,
          replay: true,
        });
      });

      row.append(chapterTitleEl, replayBtn);
      list.appendChild(row);
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}

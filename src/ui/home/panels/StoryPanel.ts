import { SceneRouter } from '@/app/SceneRouter';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { describeJourneyEntry } from '@/ui/home/journeyView';

export interface StoryPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

/** "My Path" — the player's cultivation road: an ordered journey of milestones,
 *  each stamped with the strength they held at that step (learn from your history). */
export function createStoryPanel(): StoryPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-story';
  root.dataset.panel = 'story';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.path.title');

  const list = document.createElement('div');
  list.className = 'home-story__list home-path__list';

  root.append(title, list);

  const renderLore = (loreId: string): HTMLElement => {
    const row = document.createElement('div');
    row.className = 'home-story__row home-story__row--lore';

    const loreTitle = document.createElement('p');
    loreTitle.className = 'home-story__title';
    loreTitle.textContent = I18nManager.t(loreId.replace(/^lore\./, 'demo.lore.'));

    row.appendChild(loreTitle);
    return row;
  };

  const refresh = (): void => {
    const save = gameStore.getState().save;
    list.replaceChildren();

    const lore = save?.progress.loreUnlocked ?? [];
    const journey = save?.progress.journey ?? [];

    if (lore.length === 0 && journey.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.textContent = I18nManager.t('home.path.empty');
      list.appendChild(empty);
      return;
    }

    // Newest milestone first — the top of the scroll shows how strong you are now.
    for (let i = journey.length - 1; i >= 0; i -= 1) {
      const entry = journey[i]!;
      const view = describeJourneyEntry(entry);

      const row = document.createElement('div');
      row.className = `home-story__row home-path__row home-path__row--${entry.kind}`;

      const main = document.createElement('div');
      main.className = 'home-path__main';

      const kind = document.createElement('span');
      kind.className = 'home-path__kind';
      kind.textContent = view.kindLabel;

      const stepTitle = document.createElement('p');
      stepTitle.className = 'home-story__title home-path__title';
      stepTitle.textContent = view.title;

      const strength = document.createElement('p');
      strength.className = 'home-path__strength';
      strength.textContent = view.strength;

      main.append(kind, stepTitle, strength);
      row.appendChild(main);

      if (view.replay) {
        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'home-story__replay';
        replayBtn.textContent = I18nManager.t('home.story.replay');
        const { chapterId, sceneId } = view.replay;
        replayBtn.addEventListener('click', () => {
          void SceneRouter.instance.switchTo('story', { chapterId, sceneId, replay: true });
        });
        row.appendChild(replayBtn);
      }

      list.appendChild(row);
    }

    for (const loreId of lore) {
      list.appendChild(renderLore(loreId));
    }
  };

  refresh();

  return { root, refresh, destroy: () => root.remove() };
}

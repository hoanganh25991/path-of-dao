import { SceneRouter } from '@/app/SceneRouter';
import { I18nManager } from '@/core/i18n/I18nManager';
import { gameStore } from '@/core/store/gameStore';
import { describeJourneyEntry } from '@/ui/home/journeyView';
import { describeLoreEntry, loreBodyForEncounter } from '@/progression/LoreDisplay';
import { renderBestiaryRow } from '@/ui/home/bestiaryView';
import { listTimelineShardsInRoadOrder } from '@/progression/TimelineLoader';
import { intentRimColor } from '@/shared/intentColors';
import { openTimelineShardReader } from '@/ui/story/TimelineShardReader';

export type StorySubTab = 'my_path' | 'dao_scroll';

export interface StoryPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

function uiRootEl(): HTMLElement | null {
  return document.getElementById('ui-root');
}

/** "My Path" (journey scroll) + "Dao Scroll" (Wang Lin road read-through) — sub-plan 28 + 31. */
export function createStoryPanel(): StoryPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-story';
  root.dataset.panel = 'story';

  // Sub-tab bar
  const subTabs = document.createElement('div');
  subTabs.className = 'home-path-tabs';
  const subTabDefs: { id: StorySubTab; key: string }[] = [
    { id: 'my_path', key: 'home.path.my_path' },
    { id: 'dao_scroll', key: 'home.path.dao_scroll' },
  ];
  const subTabButtons: HTMLElement[] = [];
  for (const { id, key } of subTabDefs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'home-path-tabs__tab';
    btn.dataset.subTab = id;
    btn.textContent = I18nManager.t(key);
    subTabs.appendChild(btn);
    subTabButtons.push(btn);
  }

  // My Path content
  const myPathRoot = document.createElement('div');
  myPathRoot.className = 'home-my-path';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.path.title');

  const list = document.createElement('div');
  list.className = 'home-story__list home-path__list';

  const bestiaryTitle = document.createElement('h3');
  bestiaryTitle.className = 'home-panel__subtitle home-bestiary__title';
  bestiaryTitle.textContent = I18nManager.t('home.bestiary.title');

  const bestiaryList = document.createElement('div');
  bestiaryList.className = 'home-story__list home-bestiary__list';
  bestiaryList.dataset.testid = 'home-bestiary-list';

  myPathRoot.append(title, list, bestiaryTitle, bestiaryList);

  // Dao Scroll content
  const daoScrollRoot = document.createElement('div');
  daoScrollRoot.className = 'home-dao-scroll';
  daoScrollRoot.hidden = true;

  const daoScrollList = document.createElement('div');
  daoScrollList.className = 'home-story__list home-dao-scroll__list';
  daoScrollList.dataset.testid = 'home-dao-scroll-list';

  const daoScrollEmpty = document.createElement('p');
  daoScrollEmpty.className = 'home-panel__empty';
  daoScrollEmpty.hidden = true;
  daoScrollEmpty.textContent = I18nManager.t('home.path.dao_scroll.empty');

  daoScrollRoot.append(daoScrollList, daoScrollEmpty);

  root.append(subTabs, myPathRoot, daoScrollRoot);

  function switchSubTab(id: StorySubTab): void {
    for (const btn of subTabButtons) {
      btn.classList.toggle('home-path-tabs__tab--active', btn.dataset.subTab === id);
    }
    myPathRoot.hidden = id !== 'my_path';
    daoScrollRoot.hidden = id !== 'dao_scroll';
    refresh();
  }

  for (const btn of subTabButtons) {
    btn.addEventListener('click', () => switchSubTab(btn.dataset.subTab as StorySubTab));
  }

  const renderLore = (loreId: string): HTMLElement => {
    const view = describeLoreEntry(loreId);
    const row = document.createElement('div');
    row.className = 'home-story__row home-story__row--lore home-path__row';
    row.dataset.testid = `home-lore-row-${loreId}`;

    const main = document.createElement('div');
    main.className = 'home-path__main';

    const kind = document.createElement('span');
    kind.className = 'home-path__kind';
    kind.textContent = I18nManager.t('path.kind.lore');

    const loreTitle = document.createElement('p');
    loreTitle.className = 'home-story__title home-path__title';
    loreTitle.textContent = I18nManager.t(view.titleKey);

    const body = document.createElement('p');
    body.className = 'home-lore__body';
    body.textContent = I18nManager.t(view.bodyKey);

    const claimed = document.createElement('span');
    claimed.className = 'home-lore__claimed';
    claimed.textContent = I18nManager.t('home.lore.claimed');

    main.append(kind, loreTitle, body, claimed);
    row.appendChild(main);
    return row;
  };

  const refreshBestiary = (bestiary: string[]): void => {
    bestiaryList.replaceChildren();
    if (bestiary.length === 0) {
      const emptyBestiary = document.createElement('p');
      emptyBestiary.className = 'home-panel__empty home-bestiary__empty';
      emptyBestiary.textContent = I18nManager.t('home.bestiary.empty');
      bestiaryList.appendChild(emptyBestiary);
      return;
    }

    for (const cultivatorId of [...bestiary].reverse()) {
      bestiaryList.appendChild(renderBestiaryRow(cultivatorId));
    }
  };

  const refresh = (): void => {
    const save = gameStore.getState().save;
    const lore = save?.progress.loreUnlocked ?? [];
    const journey = save?.progress.journey ?? [];
    const bestiary = save?.progress.bestiary ?? [];

    list.replaceChildren();

    if (lore.length === 0 && journey.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'home-panel__empty';
      empty.textContent = I18nManager.t('home.path.empty');
      list.appendChild(empty);
    } else {
    for (let i = journey.length - 1; i >= 0; i -= 1) {
      const entry = journey[i]!;
      const view = describeJourneyEntry(entry);

      const row = document.createElement('div');
      row.className = `home-story__row home-path__row home-path__row--${entry.kind}`;
      row.dataset.testid = `home-path-row-${entry.kind}-${entry.refId}`;

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

      if (entry.kind === 'encounter') {
        const encounterId = entry.refId.split('@')[0] ?? entry.refId;
        const linkedLoreId = loreBodyForEncounter(encounterId, lore);
        if (linkedLoreId) {
          const detail = document.createElement('p');
          detail.className = 'home-path__detail';
          detail.textContent = I18nManager.t(linkedLoreId.replace(/^lore\./, 'demo.lore.'));
          main.appendChild(detail);

          const seized = document.createElement('span');
          seized.className = 'home-lore__claimed';
          seized.textContent = I18nManager.t('home.lore.claimed');
          main.appendChild(seized);
        }
      }

      row.appendChild(main);

      if (view.replay) {
        const { chapterId, sceneId } = view.replay;
        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'home-story__replay';
        replayBtn.dataset.testid = `home-story-replay-${sceneId}`;
        replayBtn.textContent = I18nManager.t('home.story.replay');
        replayBtn.addEventListener('click', () => {
          void SceneRouter.instance.switchTo('story', { chapterId, sceneId, replay: true });
        });
        row.appendChild(replayBtn);
      }

      if (view.timelineReplay) {
        const { shardId } = view.timelineReplay;
        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'home-story__replay';
        replayBtn.dataset.testid = `home-story-replay-${shardId}`;
        replayBtn.textContent = I18nManager.t('home.story.replay');
        replayBtn.addEventListener('click', () => {
          const uiRoot = uiRootEl();
          if (!uiRoot) return;
          openTimelineShardReader(uiRoot, { shardId, onFinished: () => {} });
        });
        row.appendChild(replayBtn);
      }

      list.appendChild(row);
    }

    for (const loreId of lore) {
      list.appendChild(renderLore(loreId));
    }
    }

    refreshBestiary(bestiary);
    renderDaoScroll();
  };

  function renderDaoScroll(): void {
    const save = gameStore.getState().save;
    const timelineSeen = save?.progress.timelineSeen ?? [];
    const shards = listTimelineShardsInRoadOrder();

    daoScrollList.replaceChildren();

    for (const shard of shards) {
      const unlocked = timelineSeen.includes(shard.id);
      const row = document.createElement('div');
      row.className = `home-story__row home-path__row home-dao-scroll__row${unlocked ? '' : ' home-dao-scroll__row--locked'}`;
      row.dataset.testid = `home-dao-scroll-row-${shard.id}`;

      const main = document.createElement('div');
      main.className = 'home-path__main';

      const kind = document.createElement('span');
      kind.className = 'home-path__kind home-dao-scroll__intent';
      kind.style.color = intentRimColor(shard.intentLesson);
      kind.textContent = I18nManager.t(`intent.${shard.intentLesson}`);

      const shardTitle = document.createElement('p');
      shardTitle.className = 'home-story__title home-path__title';
      shardTitle.textContent = unlocked ? I18nManager.t(`${shard.id}.title`) : '???';

      main.append(kind, shardTitle);

      const detail = document.createElement('p');
      detail.className = 'home-path__detail home-dao-scroll__punchline';
      detail.textContent = unlocked
        ? I18nManager.t(shard.punchlineKey)
        : I18nManager.t('home.path.dao_scroll.locked');
      main.appendChild(detail);

      row.appendChild(main);

      if (unlocked) {
        const readBtn = document.createElement('button');
        readBtn.type = 'button';
        readBtn.className = 'home-story__replay';
        readBtn.dataset.testid = `home-dao-scroll-read-${shard.id}`;
        readBtn.textContent = I18nManager.t('home.story.replay');
        readBtn.addEventListener('click', () => {
          const uiRoot = uiRootEl();
          if (!uiRoot) return;
          openTimelineShardReader(uiRoot, { shardId: shard.id, onFinished: () => {} });
        });
        row.appendChild(readBtn);
      }

      daoScrollList.appendChild(row);
    }

    daoScrollEmpty.hidden = timelineSeen.length > 0;
  }

  switchSubTab('my_path');

  return { root, refresh, destroy: () => root.remove() };
}

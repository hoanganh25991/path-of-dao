import { SceneRouter } from '@/app/SceneRouter';
import {
  AncientDemoManager,
  getActiveAncientId,
  listAncientProfilesGrouped,
} from '@/progression/AncientDemoManager';
import { gameStore } from '@/core/store/gameStore';
import { I18nManager } from '@/core/i18n/I18nManager';
import {
  renderAncientCard,
  showAncientDemoModal,
} from '@/ui/modals/AncientDemoModal';

export interface EchoesPanelHandles {
  root: HTMLElement;
  refresh(): void;
  destroy(): void;
}

async function startAncientWalk(ancientId: string): Promise<void> {
  const save = gameStore.getState().save;
  if (!save) return;

  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const needsConfirm =
    !AncientDemoManager.isActive() && AncientDemoManager.hasMeaningfulProgress(save);

  const confirmed = await showAncientDemoModal(uiRoot, { ancientId, needsConfirm });
  if (!confirmed.confirmed) return;

  await AncientDemoManager.enter(ancientId, confirmed.equippedSkills);
  const profile = AncientDemoManager.getProfile(ancientId);
  await SceneRouter.instance.switchTo('combat', { mapId: profile.startMapId });
}

export function createEchoesPanel(): EchoesPanelHandles {
  const root = document.createElement('div');
  root.className = 'home-panel home-echoes';
  root.dataset.panel = 'echoes';
  root.dataset.testid = 'home-echoes';

  const title = document.createElement('h2');
  title.className = 'home-panel__title';
  title.textContent = I18nManager.t('home.nav.echoes');

  const intro = document.createElement('p');
  intro.className = 'home-echoes__intro';
  intro.textContent = I18nManager.t('demo.section.intro');

  const list = document.createElement('div');
  list.className = 'home-echoes__list';

  const exitRow = document.createElement('div');
  exitRow.className = 'home-echoes__exit-row';
  exitRow.hidden = true;

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'home-echoes__exit';
  exitBtn.textContent = I18nManager.t('demo.exit');
  exitBtn.addEventListener('click', () => {
    void AncientDemoManager.exit().then(() => {
      void SceneRouter.instance.switchTo('home');
    });
  });

  exitRow.appendChild(exitBtn);
  root.append(title, intro, list, exitRow);

  list.addEventListener('click', (event) => {
    const card = (event.target as HTMLElement).closest<HTMLButtonElement>('.home-ancient-card');
    if (!card?.dataset.ancientId) return;
    void startAncientWalk(card.dataset.ancientId);
  });

  const refresh = (): void => {
    const activeId = getActiveAncientId();
    exitRow.hidden = !activeId;
    list.replaceChildren();

    for (const group of listAncientProfilesGrouped()) {
      const groupEl = document.createElement('div');
      groupEl.className = 'home-echoes__group';

      const groupTitle = document.createElement('p');
      groupTitle.className = 'home-echoes__group-title';
      groupTitle.textContent = I18nManager.t(group.focusKey);
      groupEl.appendChild(groupTitle);

      const groupList = document.createElement('div');
      groupList.className = 'home-echoes__group-list';
      for (const profile of group.profiles) {
        groupList.appendChild(renderAncientCard(profile, profile.id === activeId));
      }
      groupEl.appendChild(groupList);
      list.appendChild(groupEl);
    }
  };

  refresh();

  return {
    root,
    refresh,
    destroy: () => root.remove(),
  };
}

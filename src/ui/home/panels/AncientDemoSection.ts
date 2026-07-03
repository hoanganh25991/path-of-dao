import { SceneRouter } from '@/app/SceneRouter';
import {
  AncientDemoManager,
  getActiveAncientId,
  listAncientProfiles,
} from '@/progression/AncientDemoManager';
import { gameStore } from '@/core/store/gameStore';
import { I18nManager } from '@/core/i18n/I18nManager';
import {
  renderAncientCard,
  showAncientDemoModal,
} from '@/ui/modals/AncientDemoModal';

export interface AncientDemoSectionHandles {
  root: HTMLElement;
  refresh(): void;
}

async function startAncientWalk(ancientId: string): Promise<void> {
  const save = gameStore.getState().save;
  if (!save) return;

  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const needsConfirm =
    !AncientDemoManager.isActive() && AncientDemoManager.hasMeaningfulProgress(save);

  const confirmed = await showAncientDemoModal(uiRoot, { ancientId, needsConfirm });
  if (!confirmed) return;

  await AncientDemoManager.enter(ancientId);
  const profile = AncientDemoManager.getProfile(ancientId);
  await SceneRouter.instance.switchTo('combat', { mapId: profile.startMapId });
}

export function createAncientDemoSection(): AncientDemoSectionHandles {
  const root = document.createElement('section');
  root.className = 'home-ancients';
  root.dataset.testid = 'home-ancients';

  const heading = document.createElement('h3');
  heading.className = 'home-ancients__heading';
  heading.textContent = I18nManager.t('demo.section.title');

  const intro = document.createElement('p');
  intro.className = 'home-ancients__intro';
  intro.textContent = I18nManager.t('demo.section.intro');

  const list = document.createElement('div');
  list.className = 'home-ancients__list';

  const exitRow = document.createElement('div');
  exitRow.className = 'home-ancients__exit-row';
  exitRow.hidden = true;

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'home-ancients__exit';
  exitBtn.textContent = I18nManager.t('demo.exit');
  exitBtn.addEventListener('click', () => {
    void AncientDemoManager.exit().then(() => {
      void SceneRouter.instance.switchTo('home');
    });
  });

  exitRow.appendChild(exitBtn);
  root.append(heading, intro, list, exitRow);

  list.addEventListener('click', (event) => {
    const card = (event.target as HTMLElement).closest<HTMLButtonElement>('.home-ancient-card');
    if (!card?.dataset.ancientId) return;
    void startAncientWalk(card.dataset.ancientId);
  });

  const refresh = (): void => {
    const activeId = getActiveAncientId();
    exitRow.hidden = !activeId;
    list.replaceChildren();

    for (const profile of listAncientProfiles()) {
      list.appendChild(renderAncientCard(profile, profile.id === activeId));
    }
  };

  refresh();

  return { root, refresh };
}

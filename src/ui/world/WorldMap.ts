import { SceneRouter } from '@/app/SceneRouter';
import { AudioDirector } from '@/core/audio/AudioDirector';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { getMapConfig } from '@/combat/map/MapLoader';
import { computeCombatPowerFromSave, formatCombatPower } from '@/progression/CombatPower';
import { isAncientDemoActive } from '@/progression/AncientDemoManager';
import { markMapIntroSeen, shouldShowMapIntro } from '@/progression/MapIntroManager';
import {
  getPhongTonLoreId,
  getSealingBarrierStage,
  isPhongTonLoreUnlocked,
} from '@/progression/SealingBarrierProgression';
import { canEnter, getJourneyHomeMapId, getMapTravelState } from '@/progression/WorldProgression';
import { getWorldMapData, listWorldRegions } from '@/progression/WorldMapLoader';
import {
  createWorldMapViewport,
  getMapNodeWorldPosition,
  type WorldMapViewportController,
} from '@/ui/world/WorldMapViewport';
import {
  createDifficultyBadgeElement,
  difficultyTierLabelKey,
  getDifficultyTier,
} from '@/ui/components/DifficultyBadge';
import { createRegionConnectionPath, createRegionNode } from '@/ui/world/RegionNode';
import { createSealingBarrierLayer } from '@/ui/world/SealingBarrierLayer';
import { showMapIntroModal } from '@/ui/modals/MapIntroModal';
import '@/ui/world/world-map.css';

let activeOverlay: HTMLElement | null = null;
let activeDetail: HTMLElement | null = null;
let activeLore: HTMLElement | null = null;

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

function closeWorldMap(): void {
  activeLore?.remove();
  activeLore = null;
  activeDetail?.remove();
  activeDetail = null;
  activeOverlay?.remove();
  activeOverlay = null;
}

/** Enter combat on a world-map node (persists current map + autosave). */
export async function enterMapCombat(mapId: string, options?: { skipIntro?: boolean }): Promise<void> {
  const save = gameStore.getState().save;
  if (!save) return;

  const check = canEnter(mapId, save);
  if (!check.ok) {
    showToast(I18nManager.t(check.reasonKey ?? 'world.lock.unknown'));
    return;
  }

  gameStore.getState().patch({
    progress: { ...save.progress, currentMapId: mapId },
  });
  void gameStore.getState().persist();
  SaveManager.scheduleAutosave();
  closeWorldMap();

  const latest = gameStore.getState().save;
  const showIntro =
    !options?.skipIntro &&
    !isAncientDemoActive() &&
    latest &&
    shouldShowMapIntro(mapId, latest);

  if (showIntro) {
    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      await showMapIntroModal(uiRoot, { mapId });
      gameStore.getState().patch((current) => markMapIntroSeen(mapId, current));
      void gameStore.getState().persist();
    }
  }

  await SceneRouter.instance.switchTo('combat', { mapId });
}

function renderDetailSheet(mapId: string, host: HTMLElement): void {
  activeDetail?.remove();
  activeDetail = null;

  const save = gameStore.getState().save;
  if (!save) return;

  let config;
  try {
    config = getMapConfig(mapId);
  } catch {
    showToast(I18nManager.t('world.lock.unknown'));
    return;
  }

  const state = getMapTravelState(mapId, save);
  const check = canEnter(mapId, save);
  const playerCp = computeCombatPowerFromSave(save);
  const tier = getDifficultyTier(playerCp, config.recommendedCp);

  const sheet = document.createElement('div');
  sheet.className = 'world-map-detail home-ui__interactive';
  sheet.dataset.testid = 'world-map-detail';

  const name = document.createElement('h3');
  name.className = 'world-map-detail__name';
  name.textContent = I18nManager.t(config.displayNameKey);

  const descKey = `${mapId}.desc`;
  const descText = I18nManager.t(descKey);
  if (descText !== descKey && !descText.startsWith('[missing:')) {
    const blurb = document.createElement('p');
    blurb.className = 'world-map-detail__desc';
    blurb.textContent = descText;
    sheet.append(name, blurb);
  } else {
    sheet.append(name);
  }

  const meta = document.createElement('div');
  meta.className = 'world-map-detail__meta';

  const cpRow = document.createElement('p');
  cpRow.className = 'world-map-detail__cp';
  cpRow.textContent = `${I18nManager.t('world.recommended_cp')}: ${formatCombatPower(config.recommendedCp, I18nManager.locale)}`;

  const badge = createDifficultyBadgeElement(tier, I18nManager.t(difficultyTierLabelKey(tier)));
  meta.append(cpRow, badge);

  if (state === 'cleared') {
    const cleared = document.createElement('p');
    cleared.className = 'world-map-detail__cleared';
    cleared.textContent = I18nManager.t('world.cleared');
    meta.append(cleared);
  }

  const enterBtn = document.createElement('button');
  enterBtn.type = 'button';
  enterBtn.className = 'world-map-detail__enter';
  enterBtn.textContent = I18nManager.t('world.enter');
  enterBtn.disabled = !check.ok;
  enterBtn.addEventListener('click', () => enterMapCombat(mapId));

  if (!check.ok && check.reasonKey) {
    const reason = document.createElement('p');
    reason.className = 'world-map-detail__lock';
    reason.textContent = I18nManager.t(check.reasonKey);
    sheet.append(meta, reason, enterBtn);
  } else {
    sheet.append(meta, enterBtn);
  }

  const stage = getSealingBarrierStage(save);
  appendBarrierHint(sheet, stage);

  if (
    mapId.startsWith('map.void_throne')
    && isPhongTonLoreUnlocked(save)
  ) {
    const loreBtn = document.createElement('button');
    loreBtn.type = 'button';
    loreBtn.className = 'world-map-detail__lore-link';
    loreBtn.textContent = I18nManager.t('world.barrier.phong_ton.link');
    loreBtn.addEventListener('click', () => renderPhongTonLoreSheet(host));
    sheet.append(loreBtn);
  }

  host.append(sheet);
  activeDetail = sheet;
}

function persistPhongTonLore(): void {
  const save = gameStore.getState().save;
  if (!save) return;
  const loreId = getPhongTonLoreId();
  if (save.progress.loreUnlocked.includes(loreId)) return;
  gameStore.getState().patch({
    progress: {
      ...save.progress,
      loreUnlocked: [...save.progress.loreUnlocked, loreId],
    },
  });
  void gameStore.getState().persist();
}

function renderPhongTonLoreSheet(host: HTMLElement): void {
  activeLore?.remove();
  activeDetail?.remove();
  activeDetail = null;

  persistPhongTonLore();

  const sheet = document.createElement('div');
  sheet.className = 'world-map-lore home-ui__interactive';
  sheet.dataset.testid = 'world-map-phong-ton-lore';

  const title = document.createElement('h3');
  title.className = 'world-map-lore__title';
  title.textContent = I18nManager.t('world.barrier.phong_ton.title');

  const intro = document.createElement('p');
  intro.className = 'world-map-lore__intro';
  intro.textContent = I18nManager.t('world.barrier.phong_ton.intro');

  const beats = document.createElement('ul');
  beats.className = 'world-map-lore__beats';
  for (const key of [
    'world.barrier.phong_ton.beat01',
    'world.barrier.phong_ton.beat02',
    'world.barrier.phong_ton.beat03',
  ]) {
    const li = document.createElement('li');
    li.textContent = I18nManager.t(key);
    beats.append(li);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'world-map-lore__close';
  closeBtn.textContent = I18nManager.t('world.close');
  closeBtn.addEventListener('click', () => {
    activeLore?.remove();
    activeLore = null;
  });

  sheet.append(title, intro, beats, closeBtn);
  host.append(sheet);
  activeLore = sheet;
}

function appendBarrierHint(sheet: HTMLElement, stage: ReturnType<typeof getSealingBarrierStage>): void {
  const hintKey = stage === 'revealed' || stage === 'behold'
    ? 'world.barrier.hint_revealed'
    : stage === 'approach'
      ? 'world.barrier.hint_approach'
      : stage === 'sense'
        ? 'world.barrier.hint_sense'
        : null;
  if (!hintKey) return;

  const hint = document.createElement('p');
  hint.className = 'world-map-detail__barrier-hint';
  hint.textContent = I18nManager.t(hintKey);
  sheet.prepend(hint);
}

export function showWorldMap(uiRoot: HTMLElement): void {
  if (activeOverlay) return;

  const save = gameStore.getState().save;
  if (!save) return;

  AudioDirector.playPanelOpen();

  const data = getWorldMapData();

  const overlay = document.createElement('div');
  overlay.className = 'world-map-overlay home-ui__interactive';
  overlay.dataset.testid = 'world-map';

  const header = document.createElement('header');
  header.className = 'world-map-overlay__header';

  const title = document.createElement('h2');
  title.className = 'world-map-overlay__title';
  title.textContent = I18nManager.t('world.title');

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'world-map-overlay__close';
  closeBtn.setAttribute('aria-label', I18nManager.t('world.close'));
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeWorldMap);

  const locateBtn = document.createElement('button');
  locateBtn.type = 'button';
  locateBtn.className = 'world-map-overlay__locate home-ui__interactive';
  locateBtn.dataset.testid = 'world-map-locate';
  locateBtn.setAttribute('aria-label', I18nManager.t('world.locate'));
  locateBtn.title = I18nManager.t('world.locate');
  locateBtn.textContent = '◎';

  header.append(title, locateBtn, closeBtn);

  const viewport = document.createElement('div');
  viewport.className = 'world-map-viewport';

  const canvas = document.createElement('div');
  canvas.className = 'world-map-canvas';
  canvas.style.width = `${data.width}px`;
  canvas.style.height = `${data.height}px`;

  const barrierSvg = createSealingBarrierLayer({
    data,
    save,
    onLoreRequest: () => renderPhongTonLoreSheet(overlay),
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'world-map__svg');
  svg.setAttribute('width', String(data.width));
  svg.setAttribute('height', String(data.height));

  const regionsLayer = document.createElement('div');
  regionsLayer.className = 'world-map__regions';

  const onSelectMap = (mapId: string): void => {
    renderDetailSheet(mapId, overlay);
  };

  for (let i = 0; i < listWorldRegions().length; i += 1) {
    const region = listWorldRegions()[i]!;
    regionsLayer.append(
      createRegionNode({ region, save, onSelectMap }),
    );

    if (region.maps.length >= 2) {
      const a = region.maps[0]!;
      const b = region.maps[1]!;
      svg.append(
        createRegionConnectionPath(
          region.position.x + a.position.x + 16,
          region.position.y + a.position.y + 16,
          region.position.x + b.position.x + 16,
          region.position.y + b.position.y + 16,
        ),
      );
    }

    const nextRegion = listWorldRegions()[i + 1];
    if (nextRegion && region.maps.length > 0) {
      const last = region.maps[region.maps.length - 1]!;
      const firstNext = nextRegion.maps[0]!;
      const chapterComplete = save.progress.clearedMaps.includes(last.mapId);
      svg.append(
        createRegionConnectionPath(
          region.position.x + last.position.x + 16,
          region.position.y + last.position.y + 16,
          nextRegion.position.x + firstNext.position.x + 16,
          nextRegion.position.y + firstNext.position.y + 16,
          !chapterComplete,
        ),
      );
    }
  }

  canvas.append(barrierSvg, svg, regionsLayer);
  viewport.append(canvas);

  overlay.append(header, viewport);
  uiRoot.append(overlay);
  activeOverlay = overlay;

  const barrier = data.sealingBarrier;
  const stage = getSealingBarrierStage(save);
  const barrierFocus = barrier && (stage === 'behold' || stage === 'revealed')
    ? { x: barrier.center.x + barrier.radiusX * 0.75, y: barrier.center.y - barrier.radiusY * 0.55 }
    : null;

  const playerFocus = getMapNodeWorldPosition(getJourneyHomeMapId(save))
    ?? barrierFocus
    ?? { x: data.width / 2, y: data.height / 2 };

  let viewportController: WorldMapViewportController | null = createWorldMapViewport({
    viewport,
    canvas,
    mapWidth: data.width,
    mapHeight: data.height,
    focusPoint: playerFocus,
  });

  locateBtn.addEventListener('click', () => {
    viewportController?.centerOn(playerFocus);
  });

  overlay.addEventListener('world-map:destroy', () => {
    viewportController?.destroy();
    viewportController = null;
  }, { once: true });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeWorldMap();
  });
}

export function closeWorldMapOverlay(): void {
  if (activeOverlay) {
    activeOverlay.dispatchEvent(new CustomEvent('world-map:destroy'));
  }
  closeWorldMap();
}

export function isWorldMapOpen(): boolean {
  return activeOverlay !== null;
}

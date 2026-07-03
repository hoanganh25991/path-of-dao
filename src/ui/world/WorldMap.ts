import { SceneRouter } from '@/app/SceneRouter';
import { I18nManager } from '@/core/i18n/I18nManager';
import { SaveManager } from '@/core/save/SaveManager';
import { gameStore } from '@/core/store/gameStore';
import { getMapConfig } from '@/combat/map/MapLoader';
import { computeCombatPowerFromSave, formatCombatPower } from '@/progression/CombatPower';
import { canEnter, getMapTravelState } from '@/progression/WorldProgression';
import { getWorldMapData, listWorldRegions } from '@/progression/WorldMapLoader';
import {
  createDifficultyBadgeElement,
  difficultyTierLabelKey,
  getDifficultyTier,
} from '@/ui/components/DifficultyBadge';
import { createRegionConnectionPath, createRegionNode } from '@/ui/world/RegionNode';
import '@/ui/world/world-map.css';

let activeOverlay: HTMLElement | null = null;
let activeDetail: HTMLElement | null = null;

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'home-toast home-ui__interactive';
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.addEventListener('animationend', () => toast.remove());
}

function closeWorldMap(): void {
  activeDetail?.remove();
  activeDetail = null;
  activeOverlay?.remove();
  activeOverlay = null;
}

function enterMap(mapId: string): void {
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
  void SceneRouter.instance.switchTo('combat', { mapId });
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
  enterBtn.addEventListener('click', () => enterMap(mapId));

  if (!check.ok && check.reasonKey) {
    const reason = document.createElement('p');
    reason.className = 'world-map-detail__lock';
    reason.textContent = I18nManager.t(check.reasonKey);
    sheet.append(name, meta, reason, enterBtn);
  } else {
    sheet.append(name, meta, enterBtn);
  }

  host.append(sheet);
  activeDetail = sheet;
}

function bindPanZoom(viewport: HTMLElement, canvas: HTMLElement): () => void {
  let scale = 1;
  const minScale = 0.8;
  const maxScale = 2;

  const applyScale = (): void => {
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = '0 0';
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    scale = Math.min(maxScale, Math.max(minScale, scale + delta));
    applyScale();
  };

  viewport.addEventListener('wheel', onWheel, { passive: false });

  let lastPinchDist = 0;
  const onTouchMove = (event: TouchEvent): void => {
    if (event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = [event.touches[0]!, event.touches[1]!];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (lastPinchDist > 0) {
      const delta = (dist - lastPinchDist) * 0.004;
      scale = Math.min(maxScale, Math.max(minScale, scale + delta));
      applyScale();
    }
    lastPinchDist = dist;
  };

  const onTouchEnd = (): void => {
    lastPinchDist = 0;
  };

  viewport.addEventListener('touchmove', onTouchMove, { passive: false });
  viewport.addEventListener('touchend', onTouchEnd);
  viewport.addEventListener('touchcancel', onTouchEnd);

  return () => {
    viewport.removeEventListener('wheel', onWheel);
    viewport.removeEventListener('touchmove', onTouchMove);
    viewport.removeEventListener('touchend', onTouchEnd);
    viewport.removeEventListener('touchcancel', onTouchEnd);
  };
}

export function showWorldMap(uiRoot: HTMLElement): void {
  if (activeOverlay) return;

  const save = gameStore.getState().save;
  if (!save) return;

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

  header.append(title, closeBtn);

  const viewport = document.createElement('div');
  viewport.className = 'world-map-viewport';

  const canvas = document.createElement('div');
  canvas.className = 'world-map-canvas';
  canvas.style.width = `${data.width}px`;
  canvas.style.height = `${data.height}px`;

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

  canvas.append(svg, regionsLayer);
  viewport.append(canvas);
  overlay.append(header, viewport);
  uiRoot.append(overlay);
  activeOverlay = overlay;

  const unbindPanZoom = bindPanZoom(viewport, canvas);
  overlay.addEventListener('world-map:destroy', unbindPanZoom, { once: true });

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

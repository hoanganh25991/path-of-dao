import { I18nManager } from '@/core/i18n/I18nManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import { getMapTravelState, getRegionClearDots } from '@/progression/WorldProgression';
import type { WorldRegion } from '@/shared/schemas/world-map';
import { createMapNode } from '@/ui/world/MapNode';

export interface RegionNodeOptions {
  region: WorldRegion;
  save: PlayerSaveV1;
  onSelectMap(mapId: string): void;
}

export function createRegionNode(options: RegionNodeOptions): HTMLElement {
  const { region, save, onSelectMap } = options;

  const root = document.createElement('div');
  root.className = 'world-region';
  root.dataset.chapterId = region.chapterId;
  if (region.domainId) {
    root.dataset.domainId = region.domainId;
  }
  root.style.left = `${region.position.x}px`;
  root.style.top = `${region.position.y}px`;

  const children: HTMLElement[] = [];

  if (region.domainLabelKey) {
    const domainBanner = document.createElement('div');
    domainBanner.className = 'world-region__domain';
    domainBanner.textContent = I18nManager.t(region.domainLabelKey);
    children.push(domainBanner);
  }

  const title = document.createElement('h3');
  title.className = 'world-region__title';
  title.textContent = I18nManager.t(region.displayNameKey);

  const descKey = `${region.chapterId}.desc`;
  const descText = I18nManager.t(descKey);
  const regionHeader = document.createElement('div');
  regionHeader.className = 'world-region__header';
  regionHeader.append(title);
  if (descText !== descKey && !descText.startsWith('[missing:')) {
    const blurb = document.createElement('p');
    blurb.className = 'world-region__blurb';
    blurb.textContent = descText;
    regionHeader.append(blurb);
  }

  const dots = document.createElement('div');
  dots.className = 'world-region__dots';
  dots.setAttribute('aria-hidden', 'true');
  for (const cleared of getRegionClearDots(region.chapterId, save)) {
    const dot = document.createElement('span');
    dot.className = `world-region__dot${cleared ? ' world-region__dot--cleared' : ''}`;
    dots.append(dot);
  }

  const mapsLayer = document.createElement('div');
  mapsLayer.className = 'world-region__maps';

  for (const node of region.maps) {
    const travelState = getMapTravelState(node.mapId, save);
    // Map Portal bypasses sequential unlock — all maps are accessible.
    // Locked nodes show as unlocked so the player can tap them.
    const portalState = travelState === 'locked' ? 'unlocked' : travelState;
    const mapEl = createMapNode({
      mapId: node.mapId,
      label: I18nManager.t(`${node.mapId}.name`),
      state: portalState,
      x: node.position.x,
      y: node.position.y,
      onSelect: onSelectMap,
    });
    mapsLayer.append(mapEl);
  }

  root.append(...children, regionHeader, dots, mapsLayer);
  return root;
}

/** SVG path between two map pins within a region. */
export function createRegionConnectionPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashed = false,
): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const midY = (y1 + y2) / 2;
  path.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY} ${x2} ${y2}`);
  path.setAttribute('class', `world-map__link${dashed ? ' world-map__link--dashed' : ''}`);
  return path;
}

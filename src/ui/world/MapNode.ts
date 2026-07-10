import type { MapTravelState } from '@/progression/WorldProgression';

export interface MapNodeOptions {
  mapId: string;
  label: string;
  state: MapTravelState;
  x: number;
  y: number;
  onSelect(mapId: string): void;
  /** Dao Scroll pin tooltip override — punch-line one-liner if shard seen, "?" if locked
   *  (sub-plan 31 §6.4). Falls back to `label` when the map has no timeline shard. */
  tooltip?: string;
}

export function createMapNode(options: MapNodeOptions): HTMLElement {
  const { mapId, label, state, x, y, onSelect, tooltip } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `world-map-node world-map-node--${state}`;
  btn.dataset.mapId = mapId;
  btn.dataset.testid = `world-map-node-${mapId}`;
  btn.dataset.state = state;
  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
  btn.title = tooltip ?? label;
  if (tooltip) {
    btn.dataset.timelineTooltip = tooltip;
  }

  const pin = document.createElement('span');
  pin.className = 'world-map-node__pin';
  pin.setAttribute('aria-hidden', 'true');

  const name = document.createElement('span');
  name.className = 'world-map-node__label';
  name.textContent = label;

  if (state === 'locked') {
    const lock = document.createElement('span');
    lock.className = 'world-map-node__lock';
    lock.textContent = '🔒';
    btn.append(lock, pin, name);
  } else if (state === 'cleared') {
    const check = document.createElement('span');
    check.className = 'world-map-node__check';
    check.textContent = '✓';
    btn.append(check, pin, name);
  } else {
    btn.append(pin, name);
  }

  btn.addEventListener('click', () => onSelect(mapId));

  return btn;
}

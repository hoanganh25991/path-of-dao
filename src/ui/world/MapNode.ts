import type { MapTravelState } from '@/progression/WorldProgression';

export interface MapNodeOptions {
  mapId: string;
  label: string;
  state: MapTravelState;
  x: number;
  y: number;
  onSelect(mapId: string): void;
}

export function createMapNode(options: MapNodeOptions): HTMLElement {
  const { mapId, label, state, x, y, onSelect } = options;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `world-map-node world-map-node--${state}`;
  btn.dataset.mapId = mapId;
  btn.dataset.state = state;
  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
  btn.title = label;

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

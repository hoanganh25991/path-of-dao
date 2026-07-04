import { I18nManager } from '@/core/i18n/I18nManager';
import type { PlayerSaveV1 } from '@/core/save/SaveSchema';
import {
  getSealingBarrierStage,
  type SealingBarrierStage,
} from '@/progression/SealingBarrierProgression';
import type { WorldMapFile } from '@/shared/schemas/world-map';

export interface SealingBarrierLayerOptions {
  data: WorldMapFile;
  save: PlayerSaveV1;
  onLoreRequest?(): void;
}

function stageClass(stage: SealingBarrierStage): string {
  return `world-map-barrier--${stage}`;
}

function appendStarField(svg: SVGSVGElement, data: WorldMapFile): void {
  const stars = data.stars ?? [];
  if (stars.length === 0) return;

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'world-map-barrier__stars');

  for (const star of stars) {
    const r = star.size === 'lg' ? 2.2 : star.size === 'md' ? 1.4 : 0.9;
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(star.x));
    dot.setAttribute('cy', String(star.y));
    dot.setAttribute('r', String(r));
    dot.setAttribute('class', `world-map-barrier__star world-map-barrier__star--${star.size ?? 'sm'}`);
    group.append(dot);
  }

  svg.append(group);
}

function appendBarrierRing(
  svg: SVGSVGElement,
  data: WorldMapFile,
  stage: SealingBarrierStage,
): void {
  const barrier = data.sealingBarrier;
  if (!barrier) return;

  const { center, radiusX, radiusY } = barrier;
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', `world-map-barrier ${stageClass(stage)}`);
  group.dataset.testid = 'world-map-barrier';

  const outerFog = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  outerFog.setAttribute('cx', String(center.x));
  outerFog.setAttribute('cy', String(center.y));
  outerFog.setAttribute('rx', String(radiusX + 120));
  outerFog.setAttribute('ry', String(radiusY + 120));
  outerFog.setAttribute('class', 'world-map-barrier__outer-fog');

  const innerGlow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  innerGlow.setAttribute('cx', String(center.x));
  innerGlow.setAttribute('cy', String(center.y));
  innerGlow.setAttribute('rx', String(radiusX - 24));
  innerGlow.setAttribute('ry', String(radiusY - 24));
  innerGlow.setAttribute('class', 'world-map-barrier__inner-glow');

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ring.setAttribute('cx', String(center.x));
  ring.setAttribute('cy', String(center.y));
  ring.setAttribute('rx', String(radiusX));
  ring.setAttribute('ry', String(radiusY));
  ring.setAttribute('class', 'world-map-barrier__ring');

  const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const arcStartX = center.x + radiusX * 0.55;
  const arcStartY = center.y - radiusY * 0.92;
  const arcEndX = center.x + radiusX * 0.95;
  const arcEndY = center.y - radiusY * 0.35;
  arc.setAttribute(
    'd',
    `M ${arcStartX} ${arcStartY} A ${radiusX} ${radiusY} 0 0 1 ${arcEndX} ${arcEndY}`,
  );
  arc.setAttribute('class', 'world-map-barrier__arc-highlight');

  group.append(outerFog, innerGlow, ring, arc);

  if (barrier.outerRealmHintKey && stage !== 'whisper') {
    const outerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    outerLabel.setAttribute('x', String(center.x + radiusX + 48));
    outerLabel.setAttribute('y', String(center.y - radiusY * 0.55));
    outerLabel.setAttribute('class', 'world-map-barrier__outer-label');
    outerLabel.textContent = I18nManager.t(barrier.outerRealmHintKey);
    group.append(outerLabel);
  }

  if (stage !== 'whisper') {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(center.x + radiusX * 0.62));
    label.setAttribute('y', String(center.y - radiusY * 0.78));
    label.setAttribute('class', 'world-map-barrier__label');
    label.textContent = I18nManager.t(barrier.labelKey);
    group.append(label);
  }

  if (stage === 'revealed' || stage === 'behold') {
    const lorePin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lorePin.setAttribute('cx', String(center.x + radiusX * 0.88));
    lorePin.setAttribute('cy', String(center.y - radiusY * 0.48));
    lorePin.setAttribute('r', '14');
    lorePin.setAttribute('class', 'world-map-barrier__lore-pin');
    lorePin.setAttribute('role', 'button');
    lorePin.setAttribute('tabindex', '0');
    lorePin.dataset.testid = 'world-map-barrier-lore';
    group.append(lorePin);

    const loreGlyph = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    loreGlyph.setAttribute('x', String(center.x + radiusX * 0.88));
    loreGlyph.setAttribute('y', String(center.y - radiusY * 0.48 + 4));
    loreGlyph.setAttribute('class', 'world-map-barrier__lore-glyph');
    loreGlyph.textContent = '封';
    group.append(loreGlyph);
  }

  svg.append(group);
}

export function createSealingBarrierLayer(options: SealingBarrierLayerOptions): SVGSVGElement {
  const { data, save, onLoreRequest } = options;
  const stage = getSealingBarrierStage(save);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'world-map-barrier-svg');
  svg.setAttribute('width', String(data.width));
  svg.setAttribute('height', String(data.height));
  svg.setAttribute('aria-hidden', stage === 'whisper' ? 'true' : 'false');

  appendStarField(svg, data);
  appendBarrierRing(svg, data, stage);

  if (onLoreRequest) {
    svg.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-testid="world-map-barrier-lore"]')) {
        event.stopPropagation();
        onLoreRequest();
      }
    });
  }

  return svg;
}

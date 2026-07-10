import { describe, expect, it } from 'vitest';
import {
  CombatCameraDirector,
  MEDITATE_ZOOM,
  type CombatZoomCamera,
} from '@/combat/camera/CombatCameraDirector';
import { ENCOUNTER_ZOOM } from '@/combat/systems/EncounterScaling';

function mockCamera(initialZoom = 0.88): CombatZoomCamera {
  return {
    zoom: initialZoom,
    setZoom(zoom: number) {
      this.zoom = zoom;
    },
  };
}

describe('CombatCameraDirector', () => {
  it('punches in on attack even when the field is crowded', () => {
    const camera = mockCamera(ENCOUNTER_ZOOM.mass);
    const director = new CombatCameraDirector(camera, ENCOUNTER_ZOOM.mass);

    director.notifyEngagement(200, 'attack');
    for (let i = 0; i < 12; i++) director.update(200, 16);

    expect(camera.zoom).toBeGreaterThan(ENCOUNTER_ZOOM.mass + 0.12);
  });

  it('holds a close zoom while meditating and releases after', () => {
    const camera = mockCamera(0.88);
    const director = new CombatCameraDirector(camera, 0.88);

    director.setMeditating(true);
    for (let i = 0; i < 40; i++) director.update(1, 16);
    expect(camera.zoom).toBeGreaterThan(MEDITATE_ZOOM - 0.08);

    director.setMeditating(false);
    for (let i = 0; i < 90; i++) director.update(1, 16);
    expect(camera.zoom).toBeLessThan(MEDITATE_ZOOM - 0.15);
  });
});

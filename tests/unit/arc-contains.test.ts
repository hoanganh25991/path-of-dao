import { describe, expect, it } from 'vitest';
import {
  arcContains,
  arcOverlapsCircle,
  angleInSweep,
  buildMeleeArcShape,
  circlesOverlap,
} from '@/combat/combat/geometry';
import { hurtRadiusFromBody } from '@/combat/combat/Hurtbox';

describe('circlesOverlap', () => {
  it('detects touching circles', () => {
    expect(circlesOverlap(0, 0, 10, 20, 0, 10)).toBe(true);
  });

  it('rejects separated circles', () => {
    expect(circlesOverlap(0, 0, 5, 20, 0, 5)).toBe(false);
  });
});

describe('angleInSweep', () => {
  it('handles wrap across π boundary', () => {
    expect(angleInSweep(Math.PI, Math.PI * 0.75, -Math.PI * 0.75)).toBe(true);
  });
});

describe('arcContains', () => {
  const cx = 100;
  const cy = 100;
  const radius = 50;

  it('accepts a point inside the forward arc', () => {
    expect(arcContains(cx, cy, radius, -Math.PI / 3, Math.PI / 3, cx + 30, cy)).toBe(true);
  });

  it('rejects a point behind the arc', () => {
    expect(arcContains(cx, cy, radius, -Math.PI / 3, Math.PI / 3, cx - 40, cy)).toBe(false);
  });

  it('rejects a point outside radius', () => {
    expect(arcContains(cx, cy, radius, -Math.PI / 3, Math.PI / 3, cx + 80, cy)).toBe(false);
  });

  it('accepts left-facing arc targets', () => {
    const start = Math.PI - Math.PI / 3;
    const end = Math.PI + Math.PI / 3;
    expect(arcContains(cx, cy, radius, start, end, cx - 30, cy)).toBe(true);
  });

  it('includes points on arc boundary radius', () => {
    expect(arcContains(cx, cy, radius, -Math.PI / 4, Math.PI / 4, cx + radius, cy)).toBe(true);
  });
});

describe('arcOverlapsCircle', () => {
  it('hits large boss hurtbox when center is just outside arc but body overlaps', () => {
    const hit = arcOverlapsCircle(0, 0, 50, -Math.PI / 3, Math.PI / 3, 58, 0, 18);
    expect(hit).toBe(true);
  });

  it('misses when circle is beyond arc radius + hurtbox', () => {
    expect(arcOverlapsCircle(0, 0, 40, -Math.PI / 3, Math.PI / 3, 100, 0, 10)).toBe(false);
  });
});

describe('buildMeleeArcShape', () => {
  const palmHalfArc = Math.PI / 5;
  const palmReach = 28;
  const pivotOffset = 26;
  const stickyHurtRadius = hurtRadiusFromBody(16, 12);

  it('registers close-range overlap that an offset pivot arc misses', () => {
    const playerX = 0;
    const enemyX = 18;
    const oldShape = {
      kind: 'arc' as const,
      x: playerX + pivotOffset,
      y: 0,
      radius: palmReach + 12,
      startAngle: -palmHalfArc,
      endAngle: palmHalfArc,
    };
    expect(
      arcOverlapsCircle(
        oldShape.x,
        oldShape.y,
        oldShape.radius,
        oldShape.startAngle,
        oldShape.endAngle,
        enemyX,
        0,
        stickyHurtRadius,
      ),
    ).toBe(false);

    const fixed = buildMeleeArcShape(playerX, 0, 1, palmReach, palmHalfArc, pivotOffset);
    expect(
      arcOverlapsCircle(
        fixed.x,
        fixed.y,
        fixed.radius,
        fixed.startAngle,
        fixed.endAngle,
        enemyX,
        0,
        stickyHurtRadius,
      ),
    ).toBe(true);
  });

  it('keeps the same outer reach as the legacy offset pivot arc', () => {
    const fixed = buildMeleeArcShape(0, 0, 1, palmReach, palmHalfArc, pivotOffset);
    const legacyOuterReach = pivotOffset + palmReach + 12;
    expect(fixed.radius).toBe(legacyOuterReach);
  });
});

import { describe, expect, it } from 'vitest';
import { arcContains, angleInSweep, circlesOverlap } from '@/combat/combat/geometry';

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

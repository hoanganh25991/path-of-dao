import { describe, expect, it } from 'vitest';
import { hitJuiceProfile } from '@/combat/juice/hitJuiceProfile';

describe('hitJuiceProfile', () => {
  it('returns no juice for light hits', () => {
    const profile = hitJuiceProfile(false, 12, 1);
    expect(profile.heavy).toBe(false);
    expect(profile.stopMs).toBe(0);
    expect(profile.shakePx).toBe(0);
    expect(profile.critFlash).toBe(false);
  });

  it('applies hit-stop and shake for crits', () => {
    const profile = hitJuiceProfile(true, 20, 1);
    expect(profile.heavy).toBe(true);
    expect(profile.stopMs).toBe(80);
    expect(profile.shakePx).toBe(6);
    expect(profile.critFlash).toBe(true);
  });

  it('treats high damage as heavy', () => {
    const profile = hitJuiceProfile(false, 55, 1);
    expect(profile.heavy).toBe(true);
    expect(profile.stopMs).toBe(40);
    expect(profile.shakePx).toBe(4);
  });

  it('treats high skill multiplier as heavy', () => {
    const profile = hitJuiceProfile(false, 10, 1.6);
    expect(profile.heavy).toBe(true);
  });
});

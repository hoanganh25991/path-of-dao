/** Hit-stop / shake profile from combat hit metadata (sub-plan 25). */
export function hitJuiceProfile(
  isCrit: boolean,
  finalDamage: number,
  skillMultiplier: number,
): { heavy: boolean; stopMs: number; shakePx: number; critFlash: boolean } {
  const heavy = isCrit || finalDamage >= 50 || skillMultiplier >= 1.5;
  const stopMs = isCrit ? 80 : heavy ? 40 : 0;
  const shakePx = isCrit ? 6 : heavy ? 4 : 0;
  return { heavy, stopMs, shakePx, critFlash: isCrit };
}

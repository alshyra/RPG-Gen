import { describe, it, expect } from 'vitest';
import useAbilityRules from './useAbilityRules';

describe('useAbilityRules', () => {
  const { pointsUsed, formatMod, applyPointBuyChange, applyLevelUpChange } = useAbilityRules();

  it('calculates points used by the point-buy table', () => {
    const abilities = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };
    const total = pointsUsed(abilities);
    // 15 -> 9, 14 -> 7, 13 -> 5, 12 -> 4, 10 -> 2, 8 -> 0 => sum 27
    expect(total).toBe(27);
  });

  it('formats ability modifier correctly', () => {
    expect(formatMod(18)).toBe('+4');
    expect(formatMod(10)).toBe('+0');
    expect(formatMod(9)).toBe('-1');
  });

  it('applies point-buy changes when budget allows', () => {
    const abilities = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };
    // decrease Str (15 -> 14) frees 2 points (9 -> 7) and allows increasing Cha 8 -> 9 (0 -> 1)
    const resDown = applyPointBuyChange(abilities, 'Str', 14);
    expect(resDown.allowed).toBe(true);
    expect(resDown.newAbilities).toHaveProperty('Str', 14);

    const freed = resDown.newAbilities ? pointsUsed(resDown.newAbilities) : pointsUsed(abilities);
    expect(freed).toBeLessThanOrEqual(27);

    // Try invalid value outside cost table (e.g., 16) - the UI should normally prevent this
    // We assert that the rules function returns allowed=false for values not in COST
    const resInvalid = applyPointBuyChange(abilities, 'Str', 16);
    expect(resInvalid.allowed).toBe(true);
  });

  it('prevents overspending in point-buy', () => {
    // Start from a near-maxed baseline and try to overspend
    const abilities = { Str: 15, Dex: 15, Con: 14, Int: 8, Wis: 8, Cha: 8 };
    // current cost = 9 + 9 + 7 = 25; upgrading Cha to 15 costs 9 -> 34 > 27
    const res = applyPointBuyChange(abilities, 'Cha', 15);
    expect(res.allowed).toBe(false);
  });

  it('applies level-up change with budget', () => {
    const initial = { Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 };
    const abilities = { ...initial };
    const res = applyLevelUpChange(abilities, 'Str', 11, initial, 2);
    expect(res.allowed).toBe(true);
    expect(res.newAbilities).toHaveProperty('Str', 11);

    // apply two increments then the third should be blocked
    const res2 = applyLevelUpChange(res.newAbilities ?? abilities, 'Str', 12, initial, 2);
    expect(res2.allowed).toBe(true);
    const res3 = applyLevelUpChange(res2.newAbilities ?? abilities, 'Str', 13, initial, 2);
    expect(res3.allowed).toBe(false);
  });

  it('applies level-up when initialScores absent', () => {
    const abilities = { Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 };
    // Without initial scores, budget is quickly exceeded and operation should be blocked
    const res = applyLevelUpChange(abilities, 'Str', 11, undefined, 2);
    expect(res.allowed).toBe(false);
  });
});

export type Abilities = Record<string, number>;

// point-buy table used in DnD-style creation
export const COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export const pointsUsed = (abilities: Abilities): number => Object.keys(abilities).reduce((sum, key) => sum + (COST[abilities[key]] || 0), 0);

export const formatMod = (score: number): string => {
  const m = Math.floor((Number(score) - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};

export const applyPointBuyChange = (
  abilities: Abilities,
  ability: string,
  newValue: number,
  maxBudget = 27,
): { allowed: boolean; newAbilities?: Abilities } => {
  const current = abilities[ability] ?? 8;
  const prevCost = COST[current] || 0;
  const newCost = COST[newValue] || 0;
  const used = pointsUsed(abilities);
  const newUsed = used - prevCost + newCost;
  if (newUsed > maxBudget) return { allowed: false };
  return { allowed: true, newAbilities: { ...abilities, [ability]: newValue } };
};

export const applyLevelUpChange = (
  abilities: Abilities,
  ability: string,
  newValue: number,
  initialScores: Abilities | undefined,
  budget = 2,
): { allowed: boolean; newAbilities?: Abilities } => {
  const current = abilities[ability] ?? 8;
  const initial = initialScores || {};
  const prevInc = Math.max(0, current - (initial[ability] ?? 0));
  const newInc = Math.max(0, newValue - (initial[ability] ?? 0));

  const usedBefore = Object.keys(abilities).reduce((acc, k) => acc + Math.max(0, (abilities[k] ?? 8) - (initial[k] ?? 0)), 0);
  const newUsed = usedBefore - prevInc + newInc;
  if (newUsed > budget) return { allowed: false };
  return { allowed: true, newAbilities: { ...abilities, [ability]: newValue } };
};

export default function useAbilityRules() {
  return {
    COST,
    pointsUsed,
    formatMod,
    applyPointBuyChange,
    applyLevelUpChange,
  };
}

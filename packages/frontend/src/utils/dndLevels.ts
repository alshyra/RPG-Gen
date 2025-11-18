export const DND_LEVELS = [
  { level: 1, totalXp: 0, proficiencyBonus: 2 },
  { level: 2, totalXp: 300, proficiencyBonus: 2 },
  { level: 3, totalXp: 900, proficiencyBonus: 2 },
  { level: 4, totalXp: 2700, proficiencyBonus: 2 },
  { level: 5, totalXp: 6500, proficiencyBonus: 3 },
  { level: 6, totalXp: 14000, proficiencyBonus: 3 },
  { level: 7, totalXp: 23000, proficiencyBonus: 3 },
  { level: 8, totalXp: 34000, proficiencyBonus: 3 },
  { level: 9, totalXp: 48000, proficiencyBonus: 4 },
  { level: 10, totalXp: 64000, proficiencyBonus: 4 },
  { level: 11, totalXp: 85000, proficiencyBonus: 4 },
  { level: 12, totalXp: 100000, proficiencyBonus: 4 },
  { level: 13, totalXp: 120000, proficiencyBonus: 5 },
  { level: 14, totalXp: 140000, proficiencyBonus: 5 },
  { level: 15, totalXp: 165000, proficiencyBonus: 5 },
  { level: 16, totalXp: 195000, proficiencyBonus: 5 },
  { level: 17, totalXp: 225000, proficiencyBonus: 6 },
  { level: 18, totalXp: 265000, proficiencyBonus: 6 },
  { level: 19, totalXp: 305000, proficiencyBonus: 6 },
  { level: 20, totalXp: 355000, proficiencyBonus: 6 },
] as const;

type DndLevel = (typeof DND_LEVELS)[number];

export const getCurrentLevel = (totalXp: number): DndLevel =>
  [...DND_LEVELS].reverse().find((l) => totalXp >= l.totalXp) || DND_LEVELS[0];

export const getNextLevel = (totalXp: number): DndLevel | null => {
  const current = getCurrentLevel(totalXp);
  const nextIndex = DND_LEVELS.findIndex((l) => l.level === current.level) + 1;
  return nextIndex < DND_LEVELS.length ? DND_LEVELS[nextIndex] : null;
};

export const getXpProgress = (
  totalXp: number
): { current: number; next: number; percentage: number } => {
  const currentLevel = getCurrentLevel(totalXp);
  const nextLevel = getNextLevel(totalXp);

  if (!nextLevel) {
    return { current: totalXp - currentLevel.totalXp, next: 0, percentage: 100 };
  }

  const currentLevelXp = totalXp - currentLevel.totalXp;
  const xpNeededForLevel = nextLevel.totalXp - currentLevel.totalXp;
  const percentage = (currentLevelXp / xpNeededForLevel) * 100;

  return { current: currentLevelXp, next: xpNeededForLevel, percentage };
};

import { ABILITIES, DEFAULT_BASE_SCORES } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { CharacterDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

export const COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9, 16: 12, 17: 15, 18: 19 } as const;

const useAbilityScores = () => {
  const characterStore = useCharacterStore();
  const { currentCharacter } = storeToRefs(characterStore);
  const characterScores = computed(() => currentCharacter.value?.scores || DEFAULT_BASE_SCORES);

  const pointsUsed = computed(() => ABILITIES
    .map(score => characterScores.value[score])
    .reduce((sum, value) => sum + COST[value as keyof typeof COST], 0));

  const formatMod = (score: number): string => {
    const m = Math.floor((Number(score) - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  const applyPointBuyChange = (
    ability: keyof CharacterDto['scores'],
    newValue: number,
    maxBudget = 27,
  ) => {
    const current = characterScores.value[ability] ?? 8;
    const prevCost = COST[current as keyof typeof COST] || 0;
    const newCost = COST[newValue as keyof typeof COST] || 0;
    const newUsed = pointsUsed.value - prevCost + newCost;
    if (newUsed > maxBudget) return { allowed: false };

    // @ts-ignore
    currentCharacter.value = { 
      ...currentCharacter.value,
      scores: { ...characterScores.value, [ability]: newValue }
    };
    return { allowed: true };
  };

  return {
    COST,
    pointsUsed,
    formatMod,
    applyPointBuyChange,
  };
};

export default useAbilityScores;
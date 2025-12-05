import {
  ABILITIES, DEFAULT_BASE_SCORES,
} from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { CharacterResponseDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

export const COST = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
  16: 12,
  17: 15,
  18: 19,
} as const;

const useAbilityScores = () => {
  const characterStore = useCharacterStore();
  const { currentCharacter } = storeToRefs(characterStore);
  const characterScores = computed(() => currentCharacter.value?.scores || DEFAULT_BASE_SCORES);

  const pointsUsed = computed(() => ABILITIES
    .map(score => (characterScores.value[score] ?? 8))
    .reduce((sum, value) => sum + COST[value as keyof typeof COST], 0));

  const formatMod = (score: number): string => {
    const m = Math.floor((Number(score) - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  const applyPointBuyChange = (
    ability: typeof ABILITIES[number],
    newValue: number,
    maxBudget = 27,
    initialScores?: CharacterResponseDto['scores'],
  ) => {
    if (!currentCharacter.value) return { allowed: false };

    const current = characterScores.value[ability] ?? 8;
    let newUsed = 0;
    if (initialScores) {
      // Level-up mode: budget is the number of direct +1 increases available above initial scores
      const currentIncrease = (current - (initialScores?.[ability] ?? 8)) || 0;
      const currentUsed = (Object.keys(initialScores) as (keyof typeof initialScores)[])
        .map(k => Math.max(0, (characterScores.value[k] ?? 8) - (initialScores[k] ?? 8)))
        .reduce((s, v) => s + v, 0);
      const newIncrease = Math.max(0, newValue - (initialScores?.[ability] ?? 8));
      newUsed = currentUsed - currentIncrease + newIncrease;
      if (newUsed > maxBudget) return { allowed: false };
    } else {
      const prevCost = COST[current as keyof typeof COST] || 0;
      const newCost = COST[newValue as keyof typeof COST] || 0;
      newUsed = pointsUsed.value - prevCost + newCost;
      if (newUsed > maxBudget) return { allowed: false };
    }

    currentCharacter.value = {
      ...currentCharacter.value,
      scores: {
        ...characterScores.value,
        [ability]: newValue,
      },
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

import { CharacterResponseDto } from '@rpg-gen/shared';
import {
  beforeEach, describe, expect, it,
} from 'vitest';
import { ref } from 'vue';
import useAbilityScores from './useAbilityScores';
import { useCharacterStore } from '@/stores/characterStore';
import {
  createPinia, setActivePinia, storeToRefs,
} from 'pinia';

describe('useAbilityScores', () => {
  beforeEach(() => {
    // Créer une nouvelle instance Pinia pour chaque test
    setActivePinia(createPinia());
  });
  it('calculates points used by the point-buy table', () => {
    const abilities = ref({
      Str: 15,
      Dex: 14,
      Con: 13,
      Int: 12,
      Wis: 10,
      Cha: 8,
    });
    const characterStore = useCharacterStore();
    const { currentCharacter } = storeToRefs(characterStore);
    currentCharacter.value = { scores: abilities.value } as CharacterResponseDto;
    const { pointsUsed } = useAbilityScores();
    // 15 -> 9, 14 -> 7, 13 -> 5, 12 -> 4, 10 -> 2, 8 -> 0 => sum 27
    expect(pointsUsed.value)
      .toBe(27);
  });

  it('formats ability modifier correctly', () => {
    const abilities = ref({
      Str: 15,
      Dex: 14,
      Con: 13,
      Int: 12,
      Wis: 10,
      Cha: 8,
    });
    const characterStore = useCharacterStore();
    const { currentCharacter } = storeToRefs(characterStore);
    currentCharacter.value = { scores: abilities.value } as CharacterResponseDto;
    const { formatMod } = useAbilityScores();

    expect(formatMod(18))
      .toBe('+4');
    expect(formatMod(10))
      .toBe('+0');
    expect(formatMod(9))
      .toBe('-1');
  });

  it('applies point-buy changes when budget allows', () => {
    const abilities = ref({
      Str: 15,
      Dex: 14,
      Con: 13,
      Int: 12,
      Wis: 10,
      Cha: 8,
    });
    const characterStore = useCharacterStore();
    const { currentCharacter } = storeToRefs(characterStore);
    currentCharacter.value = { scores: abilities.value } as CharacterResponseDto;

    const {
      pointsUsed, applyPointBuyChange,
    } = useAbilityScores();

    const resDown = applyPointBuyChange('Str', 14);
    expect(resDown.allowed)
      .toBe(true);
    expect(currentCharacter.value?.scores)
      .toHaveProperty('Str', 14);
    expect(pointsUsed.value)
      .equal(25);

    const resInvalid = applyPointBuyChange('Str', 16);
    expect(resInvalid.allowed)
      .toBe(false);
  });

  it('prevents overspending in point-buy', () => {
    const abilities = ref({
      Str: 15,
      Dex: 14,
      Con: 13,
      Int: 12,
      Wis: 10,
      Cha: 8,
    });
    const characterStore = useCharacterStore();
    const { currentCharacter } = storeToRefs(characterStore);
    currentCharacter.value = { scores: abilities.value } as CharacterResponseDto;
    const { applyPointBuyChange } = useAbilityScores();

    // current cost = 9 + 9 + 7 = 25; upgrading Cha to 15 costs 9 -> 34 > 27
    const res = applyPointBuyChange('Cha', 15);
    expect(res.allowed)
      .toBe(false);
  });
});

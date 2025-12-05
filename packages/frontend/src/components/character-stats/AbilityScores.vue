<template>
  <div>
    <div class="font-bold text-sm text-slate-300">
      Caractéristiques
    </div>
    <div class="mt-2 grid grid-cols-3 gap-1 text-xs">
      <div
        v-for="(ability, key) in abilities"
        :key="key"
        class="text-center"
      >
        <div class="text-slate-400">
          {{ ability.short }}
        </div>
        <div :class="['font-bold', ability.color]">
          <span>
            {{ getAbilityScore(key) }}
          </span>
          <span class="text-xs text-slate-500 mt-0.5">
            ({{ getModifier(getAbilityScore(key)) > 0 ? '+' : '' }}{{ getModifier(getAbilityScore(key)) }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import type { AbilityScoresResponseDto } from '@rpg-gen/shared';

type AbilityKey = 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const abilities = {
  str: {
    short: 'STR',
    color: 'text-amber-400',
  },
  dex: {
    short: 'DEX',
    color: 'text-amber-400',
  },
  con: {
    short: 'CON',
    color: 'text-amber-400',
  },
  int: {
    short: 'INT',
    color: 'text-blue-400',
  },
  wis: {
    short: 'WIS',
    color: 'text-green-400',
  },
  cha: {
    short: 'CHA',
    color: 'text-pink-400',
  },
};

const getAbilityScore = (key: string): number => {
  if (!currentCharacter.value?.scores) return 10;

  // Convert to capitalized format (Str, Dex, etc.)
  const capitalized = (key.charAt(0)
    .toUpperCase() + key.slice(1)) as AbilityKey;
  const scores: AbilityScoresResponseDto = currentCharacter.value.scores;

  return scores[capitalized] ?? 10;
};

const getModifier = (score: number): number => Math.floor((score - 10) / 2);
</script>

<style scoped></style>

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
import { computed } from 'vue';
import { useGame } from '../../composables/useGame';

const abilities = {
  str: { short: 'STR', color: 'text-amber-400' },
  dex: { short: 'DEX', color: 'text-amber-400' },
  con: { short: 'CON', color: 'text-amber-400' },
  int: { short: 'INT', color: 'text-blue-400' },
  wis: { short: 'WIS', color: 'text-green-400' },
  cha: { short: 'CHA', color: 'text-pink-400' },
} as const;
type AbilityKey = keyof typeof abilities;
type ScoreKey = 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';

const gameStore = useGame();
const character = computed(() => gameStore.session.character);

const isScoreKeyTypeGuard = (key: string): key is ScoreKey => ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].includes(key);

const getAbilityScore = (key: AbilityKey): number => {
  const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
  const scores = character.value?.scores;
  if (!isScoreKeyTypeGuard(capitalized)) return 10;
  return scores?.[capitalized] ?? 10;
};

const getModifier = (score: number): number => Math.floor((score - 10) / 2);

</script>

<style scoped></style>

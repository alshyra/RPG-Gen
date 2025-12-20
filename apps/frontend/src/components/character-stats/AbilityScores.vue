<template>
  <div>
    <div class="font-bold text-sm text-slate-300">Statistiques</div>
    <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
      <div
        v-for="(stat, key) in stats"
        :key="key"
        class="text-center"
      >
        <div class="text-slate-400">
          {{ stat.short }}
        </div>
        <div :class="['font-bold', stat.color]">
          <span>
            {{ getStatValue(key) }}
          </span>
        </div>
        <div class="text-slate-500 text-xs mt-0.5">
          {{ stat.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import type { StatsResponseDto } from '@rpg-gen/shared';

type StatKey = 'vigor' | 'finesse' | 'mind' | 'survival';

const currentCharacter = useCurrentCharacter();

const stats = {
  vigor: {
    short: 'VIG',
    name: 'Vigueur',
    color: 'text-amber-400',
  },
  finesse: {
    short: 'FIN',
    name: 'Finesse',
    color: 'text-amber-400',
  },
  mind: {
    short: 'ESP',
    name: 'Esprit',
    color: 'text-blue-400',
  },
  survival: {
    short: 'SUR',
    name: 'Survie',
    color: 'text-green-400',
  },
};

const getStatValue = (key: string): number => {
  if (!currentCharacter?.value?.stats) return 0;

  const stats: StatsResponseDto = currentCharacter?.value?.stats;
  return stats[key as StatKey] ?? 0;
};
</script>

<template>
  <div class="space-y-2">
    <div class="font-bold text-sm text-slate-300">Statistiques</div>
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div
        v-for="stat in stats"
        :key="stat.name"
        class="px-2 py-1 rounded bg-slate-800 text-slate-300 flex justify-between"
      >
        <span class="font-medium">{{ stat.label }}</span>
        <span class="text-indigo-300 font-semibold">
          {{ stat.value > 0 ? '+' : '' }}{{ stat.value }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { computed } from 'vue';

const currentCharacter = useCurrentCharacter();

const stats = computed(() => {
  const character = currentCharacter.value;
  if (!character?.stats) return [];

  return [
    { name: 'vigor', label: 'Vigueur', value: character.stats.vigor ?? 0 },
    { name: 'finesse', label: 'Finesse', value: character.stats.finesse ?? 0 },
    { name: 'mind', label: 'Esprit', value: character.stats.mind ?? 0 },
    { name: 'survival', label: 'Survie', value: character.stats.survival ?? 0 },
  ];
});
</script>

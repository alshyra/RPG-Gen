<template>
  <div class="p-2">
    <div class="card p-3">
      <h2 class="font-bold text-slate-200 mb-2">Sorts</h2>
      <div v-if="!hasSpells" class="text-xs text-slate-400">Aucun sort appris.</div>
      <ul v-else class="space-y-2">
        <li v-for="s in spells" :key="s.name" class="p-2 bg-slate-800/40 rounded border border-slate-700/30">
          <div class="font-medium text-slate-100">{{ s.name }} <span class="text-xs text-slate-300">Niv {{ s.level }}</span></div>
          <div v-if="s.description" class="text-xs text-slate-400 mt-1">{{ s.description }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const spells = computed(() => currentCharacter.value?.spells || []);
const hasSpells = computed(() => spells.value.length > 0);
</script>

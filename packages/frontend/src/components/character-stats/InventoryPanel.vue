<template>
  <div class="p-3 bg-slate-900/50 rounded border border-slate-700">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-slate-200">
        Inventaire
      </h3>
      <div class="text-xs text-slate-400">
        {{ itemsCount }} item(s)
      </div>
    </div>

    <div
      v-if="!hasItems"
      class="text-xs text-slate-400"
    >
      Aucun objet pour le moment.
    </div>

    <ul
      v-else
      class="space-y-2 max-h-40 overflow-auto"
    >
      <li
        v-for="it in items"
        :key="it._id ?? it.name"
        class="p-2 bg-slate-800/40 rounded border border-slate-700/30 flex items-start gap-3"
      >
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="font-medium text-sm text-slate-100">
              {{ it.name }}
            </div>
            <div class="text-xs text-slate-300">
              x{{ it.qty ?? it.quantity ?? 1 }}
            </div>
          </div>
          <div
            v-if="it.description"
            class="text-xs text-slate-400 mt-1"
          >
            {{ it.description }}
          </div>
          <div
            v-if="it.equipped"
            class="text-xs text-amber-300 mt-1"
          >
            Équipé
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const items = computed(() => (currentCharacter.value?.inventory || []));
const hasItems = computed(() => items.value.length > 0);
const itemsCount = computed(() => items.value.length || 0);
</script>

<style scoped>
/* keep styles minimal — use Tailwind classes above */
</style>

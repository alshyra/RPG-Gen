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
      class="space-y-2 overflow-auto"
    >
      <li
        v-for="item in items"
        :key="item.name ?? item._id"
        class="p-2 bg-slate-800/40 rounded border border-slate-700/30 flex items-start gap-3 hover:bg-slate-700/40 transition-colors"
      >
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="font-medium text-sm text-slate-100">
              {{ item.name ?? 'Item' }}
            </div>
            <div class="text-xs text-slate-300">
              x{{ item.qty ?? 1 }}
            </div>
          </div>
          <div
            v-if="item.description"
            class="text-xs text-slate-400 mt-1"
          >
            {{ item.description }}
          </div>
          <div
            v-if="item.equipped"
            class="text-xs text-amber-300 mt-1"
          >
            Équipé
          </div>
          <div class="flex gap-2 mt-2">
            <button
              v-if="item.name"
              class="text-xs px-2 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-blue-100 transition-colors"
              @click="onUseItem(item.name)"
            >
              Utiliser
            </button>
            <button
              v-if="!item.equipped && item.name"
              class="text-xs px-2 py-1 bg-amber-600/50 hover:bg-amber-600 rounded text-amber-100 transition-colors"
              @click="onEquipItem(item.name)"
            >
              Équiper
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useGameCommands } from '@/composables/useGameCommands';
import { generateUseCommand, generateEquipCommand } from '@/utils/chatCommands';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const { insertCommand } = useGameCommands();

const items = computed(() => (currentCharacter.value?.inventory || []));
const hasItems = computed(() => items.value.length > 0);
const itemsCount = computed(() => items.value.length || 0);

const onUseItem = (itemName: string) => {
  insertCommand(generateUseCommand(itemName));
};

const onEquipItem = (itemName: string) => {
  insertCommand(generateEquipCommand(itemName));
};
</script>

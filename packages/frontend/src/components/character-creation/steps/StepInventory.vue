<template>
  <div class="p-2 lg:p-4">
    <h3 class="font-semibold mb-2">
      Choisissez votre équipement de départ
    </h3>

    <div
      v-if="!character"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div
        v-for="item in availableItems"
        :key="item.name"
        class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
      >
        <UiInputCheckbox
          :checked="isSelected(item)"
          class="accent-indigo-500"
          @change="() => toggle(item, !isSelected(item))"
        />
        <div class="flex-1">
          <div class="font-medium">
            {{ item.name }}
          </div>
          <div class="text-xs text-slate-400">
            {{ item.description }}
          </div>
        </div>
        <div
          v-if="isSelected(item)"
          class="flex items-center gap-2"
        >
          <UiInputNumber
            v-model="quantities[item.name]"
            :min="1"
            class="w-20"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import UiInputNumber from '../../ui/UiInputNumber.vue';
import UiInputCheckbox from '../../ui/UiInputCheckbox.vue';

const characterStore = useCharacterStore();
const character = computed(() => characterStore.currentCharacter);

// small curated starter pack — could be extended / replaced by backend starter sets
const availableItems = [
  { name: 'Sac à dos', description: 'Contient divers petits outils et rations' },
  { name: 'Torche (x3)', description: 'Éclairage temporaire' },
  { name: 'Rations (x5)', description: 'Repas pour 5 jours' },
  { name: 'Tente', description: 'Abri pour 1-2 personnes' },
  { name: 'Corde (15m)', description: 'Utilitaire polyvalent' },
  { name: 'Potion de soin', description: 'Soigne un peu de PV' },
];

// local quantities keyed by item name
const quantities = reactive<Record<string, number>>({});

const isSelected = (it: any) => (character.value?.inventory || []).some((i: any) => i.name === it.name);

const toggle = (it: any, val: boolean) => {
  const inv = (character.value as any).inventory = (character.value as any).inventory || [];
  if (val) {
    const qty = quantities[it.name] || (it.name.includes('x') ? parseInt(it.name.split('x').pop() || '1', 10) : 1);
    quantities[it.name] = qty;
    inv.push({ name: it.name.replace(/ \(x.*\)$/, ''), qty, description: it.description });
  } else {
    const idx = inv.findIndex((i: any) => i.name === it.name || i.name === it.name.replace(/ \(x.*\)$/, ''));
    if (idx >= 0) inv.splice(idx, 1);
  }
};
</script>

<style scoped></style>

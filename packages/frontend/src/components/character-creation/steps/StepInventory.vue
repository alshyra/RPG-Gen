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

    <div v-else>
      <!-- Base pack (preselected and non-modifiable) -->
      <div class="mb-3">
        <div class="font-medium text-sm">
          Pack de départ (sélectionné par défaut)
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Ce pack sera attribué automatiquement : vous pouvez choisir ensuite une arme.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in basePack"
            :key="item.name"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
          >
            <UiInputCheckbox
              :checked="true"
              disabled
              class="accent-indigo-500"
            />
            <div class="flex-1">
              <div class="font-medium">
                {{ item.name.replace(/ \(x.*\)$/, '') }}
              </div>
              <div class="text-xs text-slate-400">
                {{ item.description }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UiInputNumber
                v-model="quantities[item.name]"
                :min="1"
                disabled
                class="w-20"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Optional items -->
      <div class="mb-3">
        <div class="font-medium text-sm">
          Objets supplémentaires (optionnel)
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Choisissez si vous voulez ajouter d'autres objets de démarrage.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in optionalItems"
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

      <!-- Weapon choice (pick exactly one) -->
      <div class="mb-2">
        <div class="font-medium text-sm">
          Choisissez votre arme de départ (1)
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Sélectionnez une seule arme parmi les options suivantes.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="w in availableWeapons"
            :key="w.name"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
          >
            <UiInputCheckbox
              :checked="weaponIsSelected(w)"
              @change="() => chooseWeapon(w)"
            />
            <div class="flex-1">
              <div class="font-medium">
                {{ w.name }}
              </div>
              <div class="text-xs text-slate-400">
                {{ w.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useCharacterStore } from '@/stores/characterStore';
import UiInputNumber from '../../ui/UiInputNumber.vue';
import UiInputCheckbox from '../../ui/UiInputCheckbox.vue';

const characterStore = useCharacterStore();
const character: any = characterStore.currentCharacter; // ref from the store (typed any for template usage)

// Small curated starter pack — default items are pre-selected for new characters
const availableItems = [
  { name: 'Sac à dos', description: 'Contient divers petits outils et rations' },
  { name: 'Torche (x3)', description: 'Éclairage temporaire' },
  { name: 'Rations (x5)', description: 'Repas pour 5 jours' },
  { name: 'Tente', description: 'Abri pour 1-2 personnes' },
  { name: 'Corde (15m)', description: 'Utilitaire polyvalent' },
  { name: 'Potion de soin', description: 'Soigne un peu de PV' },
];

// Weapon choices — player can pick ONE of these starter weapons
const availableWeapons = [
  { name: 'Épée', description: 'Lame lourde pour dégâts bruts' },
  { name: 'Rapière', description: 'Lame souple, précise et rapide' },
  { name: 'Bâton de mage', description: 'Focus simple pour lanceurs de sorts' },
];

// local quantities keyed by item name
const quantities = reactive<Record<string, number>>({});

// split base pack vs optional items
const basePack = availableItems.slice(0, 3);
const optionalItems = availableItems.slice(3);

const isSelected = (it: any) => (character.value?.inventory || []).some((i: any) => i.name === it.name || i.name === it.name.replace(/ \(x.*\)$/, ''));

const toggle = (it: any, val: boolean) => {
  const inv = (character.value as any).inventory = (character.value as any).inventory || [];
  if (val) {
    const qty = quantities[it.name] || (it.name.includes('x') ? parseInt(it.name.split('x').pop() || '1', 10) : 1);
    quantities[it.name] = qty;
    inv.push({ name: it.name.replace(/ \(x.*\)$/, ''), qty, description: it.description, meta: {} });
  } else {
    const nameKey = it.name.replace(/ \(x.*\)$/, '');
    const idx = inv.findIndex((i: any) => i.name === it.name || i.name === nameKey);
    if (idx >= 0) {
      inv.splice(idx, 1);
      // clean up local quantity tracking
      delete quantities[it.name];
    }
  }
};

// Initialize default pack for a new character if empty
if (character.value && (!character.value.inventory || (character.value.inventory || []).length === 0)) {
  const defaultItems = ['Sac à dos', 'Torche (x3)', 'Rations (x5)'];
  character.value.inventory = [];
  defaultItems.forEach((name) => {
    const it = availableItems.find(a => a.name === name);
    if (it) {
      const sanitized = it.name.replace(/ \(x.*\)$/, '');
      const qty = it.name.includes('x') ? parseInt(it.name.split('x').pop() || '1', 10) : 1;
      // include minimal meta object to satisfy types
      character.value.inventory.push({ name: sanitized, qty, description: it.description, meta: {} });
      quantities[it.name] = qty;
    }
  });
}

// Weapon selection helpers — ensure only one weapon selected at a time
const weaponIsSelected = (w: any) => (character.value?.inventory || []).some((i: any) => ['Épée', 'Rapière', 'Bâton de mage'].includes(i.name) && i.name === w.name);

const chooseWeapon = (w: any) => {
  const inv = (character.value as any).inventory = (character.value as any).inventory || [];
  // remove any previously selected weapon using filter
  const filtered = inv.filter((i: any) => !['Épée', 'Rapière', 'Bâton de mage'].includes(i.name));
  // If the weapon was already selected, this toggles it off
  const already = inv.some((i: any) => i.name === w.name);
  character.value.inventory = filtered;
  if (!already) {
    character.value.inventory.push({ name: w.name, qty: 1, description: w.description, meta: {} });
  }
};
</script>

<style scoped></style>

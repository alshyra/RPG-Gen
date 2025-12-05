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

    <div
      v-else
      class="space-y-4 overflow-auto"
    >
      <template
        v-for="groupKey in ['Weapons','Armor','Consumables','Other']"
        :key="groupKey"
      >
        <div
          v-if="groupedItems[groupKey] && groupedItems[groupKey].length > 0"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold text-slate-200">
              {{ groupLabel(groupKey) }}
            </h4>
            <div class="text-xs text-slate-400">
              {{ groupedItems[groupKey].length }} item(s)
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="item in groupedItems[groupKey]"
              :key="item._id || item.name"
              role="button"
              tabindex="0"
              class="relative p-3 bg-slate-800/40 rounded border border-slate-700/30 flex flex-col justify-between gap-2 hover:bg-slate-700/40 transition-colors cursor-pointer h-28"
              @click="onCardClick(item)"
              @keydown.enter="onCardClick(item)"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 flex items-center justify-center bg-slate-700 rounded shrink-0">
                  <i
                    :class="getIconClass(item)"
                    aria-hidden="true"
                  />
                </div>
                <div class="flex-1 overflow-hidden">
                  <div class="font-medium text-sm text-slate-100 truncate">
                    {{ item.name ?? 'Objet' }}
                  </div>
                  <div
                    class="text-xs text-slate-400 line-clamp-3"
                    style="max-height:3.6rem;"
                  >
                    {{ item.description || '' }}
                  </div>
                </div>
                <div class="text-xs text-slate-300 ml-2">
                  x{{ item.qty ?? 1 }}
                </div>
              </div>

              <div class="flex justify-end">
                <div
                  v-if="item.equipped"
                  class="text-amber-300 text-xs"
                >
                  Équipé
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// rpg-awesome provides a set of RPG icons via CSS classes (ra ra-<name>)
import 'rpg-awesome/css/rpg-awesome.css';
import { useCharacterStore } from '@/stores/characterStore';
import { useGameCommands } from '@/composables/useGameCommands';
import {
  generateUseCommand, generateEquipCommand,
} from '@/utils/chatCommands';
import { storeToRefs } from 'pinia';
import type { InventoryItemDto } from '@rpg-gen/shared';

// Extended item type with meta fields - using type instead of interface to avoid inheritance issues
type InventoryItem = Omit<InventoryItemDto, 'meta'> & {
  meta?: {
    type?: string;
    class?: string;
    usable?: boolean;
    consumable?: boolean;
    [key: string]: unknown;
  };
};

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const { insertCommand } = useGameCommands();

const items = computed<InventoryItem[]>(() => (currentCharacter.value?.inventory || []) as InventoryItem[]);
const hasItems = computed(() => items.value.length > 0);
const itemsCount = computed(() => items.value.length || 0);

const groupedItems = computed(() => {
  const groups: Record<string, InventoryItem[]> = {
    Weapons: [],
    Armor: [],
    Consumables: [],
    Other: [],
  };
  (items.value || []).forEach((it) => {
    if (it.meta?.type === 'weapon') groups.Weapons.push(it);
    else if (it.meta?.type === 'armor' || it.meta?.class === 'Shield') groups.Armor.push(it);
    else if (it.meta?.type === 'consumable' && it.meta?.usable) groups.Consumables.push(it);
    else groups.Other.push(it);
  });
  // Sort each group with equipped items first
  Object.keys(groups)
    .forEach((k) => {
      groups[k].sort((a, b) => (b.equipped ? 1 : 0) - (a.equipped ? 1 : 0));
    });
  return groups;
});

const groupLabel = (key: string) => {
  switch (key) {
    case 'Weapons': return 'Armes';
    case 'Armor': return 'Armures & Boucliers';
    case 'Consumables': return 'Consommables';
    default: return 'Autres';
  }
};

const onUseItem = (itemName: string) => {
  insertCommand(generateUseCommand(itemName));
};

const onEquipItem = (itemName: string) => {
  insertCommand(generateEquipCommand(itemName));
};

const onCardClick = (item: InventoryItem) => {
  const { name } = item;
  if (!name) return;

  // Consumables / usable items => use
  if (item.meta?.usable || item.meta?.consumable) {
    onUseItem(name);
    return;
  }

  // Weapons and armor => equip
  if (item.meta?.type === 'weapon' || item.meta?.type === 'armor' || item.meta?.class === 'Shield') {
    onEquipItem(name);
    return;
  }

  // Default: show a small info
  window.alert('Aucune action associée à cet objet.');
};

const getIconClass = (item: InventoryItem): string => {
  if (!item || !item.meta) return 'ra ra-backpack text-slate-300 text-lg';

  if (item.meta.type === 'weapon') return 'ra ra-sword text-amber-300 text-lg';
  if (item.meta.type === 'armor' || item.meta.class === 'Shield') return 'ra ra-shield text-sky-300 text-lg';
  if (item.meta.usable || item.meta.consumable) return 'ra ra-potion text-rose-300 text-lg';

  // Fallback
  return 'ra ra-backpack text-slate-300 text-lg';
};
</script>

<template>
  <div class="p-2 lg:p-4 max-h-[calc(100vh-220px)] lg:max-h-145 overflow-y-auto">
    <h3 class="font-semibold mb-2">
      Choisissez votre équipement
    </h3>

    <div
      v-if="!currentCharacter"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div v-else>
      <!-- Base pack (preselected and non-modifiable) -->
      <div class="mb-3">
        <div class="font-medium text-sm">
          Pack de départ
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Ce pack sera attribué automatiquement.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in basePack"
            :key="item.definitionId"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center justify-between gap-3"
          >
            <UiInputCheckbox
              :model-value="true"
              disabled
              class="accent-indigo-500"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ (item.name ?? '').replace(/ \(x.*\)$/, '') }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ item.description }}
                </div>
              </div>
            </UiInputCheckbox>
            <div class="flex items-center gap-2">
              <UiInputNumber
                v-model="item.qty"
                :min="1"
                disabled
                class="w-20"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Weapon choice (pick exactly one) -->
      <div class="mb-2">
        <div class="font-medium text-sm">
          Choisissez votre arme de départ
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Sélectionnez une seule arme parmi les options suivantes.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="availableWeapon in availableMainWeapons"
            :key="availableWeapon.name"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
          >
            <UiInputCheckbox
              :model-value="weaponIsSelected(availableWeapon)"
              @update:model-value="() => toggleWeapon(availableWeapon)"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ availableWeapon.name }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ availableWeapon.description }}
                </div>
              </div>
            </UiInputCheckbox>
          </div>
        </div>
      </div>

      <!-- Secondary choice (shield or bow) -->
      <div class="mb-2">
        <div class="font-medium text-sm">
          Équipement secondaire (optionnel)
        </div>
        <div class="text-xs text-slate-400 mb-2">
          Vous pouvez choisir un bouclier ou un arc.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="secondaryItem in availableSecondaryItems"
            :key="secondaryItem.name"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
          >
            <UiInputCheckbox
              :model-value="weaponIsSelected(secondaryItem)"
              @update:model-value="() => toggleSecondaryItem(secondaryItem)"
            >
              <div class="flex-1">
                <div class="font-medium">
                  {{ secondaryItem.name }}
                </div>
                <div class="text-xs text-slate-400">
                  {{ secondaryItem.description }}
                </div>
              </div>
            </UiInputCheckbox>
          </div>
        </div>
      </div>
    </div>

    <!-- Armor choice (pick one) -->
    <div class="mb-2">
      <div class="font-medium text-sm">
        Choisissez votre armure
      </div>
      <div class="text-xs text-slate-400 mb-2">
        Sélectionnez une armure de départ parmi les options proposées.
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="armor in availableArmors"
          :key="armor.definitionId"
          class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
        >
          <UiInputCheckbox
            :model-value="armorIsSelected(armor)"
            @update:model-value="() => toggleArmor(armor)"
          >
            <div class="flex-1">
              <div class="font-medium">
                {{ armor.name }}
              </div>
              <div class="text-xs text-slate-400">
                {{ armor.description }}
              </div>
            </div>
          </UiInputCheckbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { ItemResponseDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import {
  onBeforeUnmount, ref,
} from 'vue';
import UiInputCheckbox from '../../ui/UiInputCheckbox.vue';
import UiInputNumber from '../../ui/UiInputNumber.vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const basePack: ItemResponseDto[] = [
  {
    definitionId: 'pack-backpack',
    name: 'Sac à dos',
    description: 'Contient divers petits outils et rations',
    qty: 1,
    meta: {},
  },
  {
    definitionId: 'generic-torch',
    name: 'Torche',
    description: 'Éclairage temporaire',
    qty: 3,
    meta: { usable: true },
  },
  {
    definitionId: 'food-rations',
    name: 'Rations',
    description: 'Portion pour un repas',
    qty: 5,
    meta: { usable: true },
  },
  {
    definitionId: 'tent-1-2',
    name: 'Tente',
    description: 'Abri pour 1-2 personnes',
    qty: 1,
    meta: {},
  },
  {
    definitionId: 'rope-15m',
    name: 'Corde (15m)',
    description: 'Utilitaire polyvalent',
    qty: 1,
    meta: {},
  },
  {
    definitionId: 'potion-health',
    name: 'Potion de soin',
    description: 'Soigne un peu de PV',
    qty: 3,
    meta: { usable: true },
  },
];

// Weapon choices — separate main weapons from secondary items (shield/bow)
const availableMainWeapons: ItemResponseDto[] = [
  {
    definitionId: 'weapon-dagger',
    name: 'Dague',
    description: 'Lame légère, facile à jeter.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Melee',
      cost: '2 gp',
      damage: '1d4 piercing',
      weight: '1 lb',
      properties: [
        'Finesse',
        'Light',
        'Thrown 20/60',
      ],
      starter: true,
    },
  },
  {
    definitionId: 'weapon-quarterstaff',
    name: 'Quarterstaff',
    description: 'Bâton polyvalent, parfois à deux mains.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Melee',
      cost: '2 sp',
      damage: '1d6 bludgeoning',
      weight: '4 lb',
      properties: ['Versatile 1d8'],
      starter: true,
    },
  },
  {
    definitionId: 'weapon-longsword',
    name: 'Longsword',
    description: 'Épée équilibrée; peut être utilisée à deux mains.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Martial Melee',
      cost: '15 gp',
      damage: '1d8 slashing',
      weight: '3 lb',
      properties: ['Versatile 1d10'],
      starter: true,
    },
  },
  {
    definitionId: 'weapon-rapier',
    name: 'Rapier',
    description: 'Lame fine et précise; excellente pour l\'escrime.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Martial Melee',
      cost: '25 gp',
      damage: '1d8 piercing',
      weight: '2 lb',
      properties: ['Finesse'],
      starter: true,
    },
  },
];
const chosenMainWeapon = ref(availableMainWeapons[0]);
const availableMainWeaponsDefinitionIds = availableMainWeapons.map(w => w.definitionId);

const availableSecondaryItems: ItemResponseDto[] = [
  {
    definitionId: 'weapon-shortbow',
    name: 'Shortbow',
    description: 'Arc court et léger.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Ranged',
      cost: '25 gp',
      damage: '1d6 piercing',
      weight: '2 lb',
      properties: [
        'Ammunition 80/320',
        'Two-handed',
      ],
      starter: true,
    },
  },
  {
    definitionId: 'armor-shield',
    name: 'Shield',
    description: 'Bouclier, porté à la main; confère un bonus à la CA.',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Shield',
      cost: '10 gp',
      ac: '+2',
      strength: '—',
      stealth: '—',
      weight: '6 lb',
      starter: true,
    },
  },
];

// Armor choice (pick one among a few armor options)
const availableArmors: ItemResponseDto[] = [
  {
    definitionId: 'armor-leather',
    name: 'Leather',
    description: 'Armure en cuir, légère et pratique. AC 11 + Dex modifier.',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Light Armor',
      cost: '10 gp',
      ac: '11 + Dex modifier',
      stealth: '—',
      weight: '10 lb',
      starter: true,
    },
  },
  {
    definitionId: 'armor-hide',
    name: 'Hide',
    description: 'Armure en peaux assemblées; protection moyenne. AC 12 + Dex (max 2).',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Medium Armor',
      cost: '10 gp',
      ac: '12 + Dex modifier (max 2)',
      stealth: '—',
      weight: '12 lb',
      starter: true,
    },
  },
];
const availableArmorDefinitionIds = availableArmors.map(a => a.definitionId);
const chosenArmor = ref<ItemResponseDto | null>(availableArmors[0]);

const availableSecondaryItemsDefinitionIds = availableSecondaryItems.map(i => i.definitionId);
const chosenSecondaryItem = ref<ItemResponseDto>(availableSecondaryItems[0]);
const weaponIsSelected = (weapon: ItemResponseDto) => (currentCharacter.value?.inventory || [])
  .some(i => (i.definitionId && i.definitionId === weapon.definitionId) || i.name === weapon.name);

const armorIsSelected = (armor: ItemResponseDto) => (currentCharacter.value?.inventory || [])
  .some(i => (i.definitionId && i.definitionId === armor.definitionId) || i.name === armor.name);

const toggleArmor = (armor: ItemResponseDto) => {
  if (!currentCharacter.value) return;
  chosenArmor.value = armor;
  console.log('Toggling armor:', armor);
  currentCharacter.value.inventory = (currentCharacter.value.inventory || [])
    .filter(i => !availableArmorDefinitionIds.includes(i.definitionId || '') && !availableMainWeaponsDefinitionIds.includes(i.definitionId || '') && !availableSecondaryItemsDefinitionIds.includes(i.definitionId || ''));

  currentCharacter.value.inventory = [
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is ItemResponseDto => !!i);
};

const toggleWeapon = (weapon: ItemResponseDto) => {
  if (!currentCharacter.value) return;
  chosenMainWeapon.value = weapon;
  console.log('Toggling weapon:', weapon);
  currentCharacter.value.inventory = (currentCharacter.value.inventory || [])
    .filter(item => item.definitionId !== weapon.definitionId && !availableSecondaryItemsDefinitionIds.includes(item.definitionId || ''));

  currentCharacter.value.inventory = [
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is ItemResponseDto => !!i);
};

const toggleSecondaryItem = (item: ItemResponseDto) => {
  if (!currentCharacter.value) return;
  chosenSecondaryItem.value = item;
  console.log('Toggling secondary item:', item);
  currentCharacter.value.inventory = (currentCharacter.value.inventory || [])
    .filter(i => i.definitionId !== item.definitionId && !availableMainWeaponsDefinitionIds.includes(i.definitionId || ''));

  currentCharacter.value.inventory = [
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is ItemResponseDto => !!i);
};

onBeforeUnmount(async () => {
  try {
    if (!currentCharacter.value?.characterId) return;
    chosenMainWeapon.value.equipped = true;
    await characterStore.updateCharacter(currentCharacter.value.characterId, {
      inventory: [
        chosenMainWeapon.value,
        chosenSecondaryItem.value,
        chosenArmor.value,
        ...basePack,
      ].filter((i): i is ItemResponseDto => !!i),
    });
  } catch (error) {
    console.error('Failed to save inventory on unmount:', error);
  }
});

</script>

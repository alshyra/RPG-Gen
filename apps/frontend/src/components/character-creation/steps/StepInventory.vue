<template>
  <div class="p-2 lg:p-4 max-h-[calc(100vh-220px)] lg:max-h-145 overflow-y-auto">
    <h3 class="font-semibold mb-2">Choisissez votre équipement</h3>

    <div
      v-if="!currentCharacter"
      class="text-sm text-slate-400"
    >
      Aucun personnage sélectionné.
    </div>

    <div v-else>
      <!-- Base pack (preselected and non-modifiable) -->
      <div class="mb-3">
        <div class="font-medium text-sm">Pack de départ</div>
        <div class="text-xs text-slate-400 mb-2">Ce pack sera attribué automatiquement.</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="item in basePack"
            :key="item.definitionId"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center justify-between gap-3"
          >
            <UiInputCheckbox
              :name="`base-item-${item.definitionId}`"
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
        <div class="font-medium text-sm">Choisissez votre arme de départ</div>
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
              :name="`weapon-${availableWeapon.definitionId}`"
              :model-value="weaponIsSelected(availableWeapon)"
              @update:model-value="(v) => toggleWeapon(availableWeapon, v)"
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
        <div class="font-medium text-sm">Équipement secondaire (optionnel)</div>
        <div class="text-xs text-slate-400 mb-2">Vous pouvez choisir un bouclier ou un arc.</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="secondaryItem in availableSecondaryItems"
            :key="secondaryItem.name"
            class="p-3 rounded border border-slate-700 bg-slate-900/50 flex items-center gap-3"
          >
            <UiInputCheckbox
              :name="`secondary-item-${secondaryItem.definitionId}`"
              :model-value="weaponIsSelected(secondaryItem)"
              @update:model-value="(v) => toggleSecondaryItem(secondaryItem, v)"
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
      <div class="font-medium text-sm">Choisissez votre armure</div>
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
            :name="`armor-${armor.definitionId}`"
            :model-value="armorIsSelected(armor)"
            @update:model-value="(v) => toggleArmor(armor, v)"
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
import { useCharacterId } from '@/composables/useCharacterId';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCharacter } from '@rpg-gen/api-client';
import { InventoryItemDto } from '@rpg-gen/shared';
import { UiInputCheckbox, UiInputNumber } from '@rpg-gen/ui';
import { onBeforeUnmount, ref } from 'vue';

const currentCharacter = useCurrentCharacter()
const characterId = useCharacterId();
const { update } = useCharacter(characterId)

const basePack: InventoryItemDto[] = [
  {
    definitionId: 'pack-backpack',
    name: 'Sac à dos',
    description: 'Contient divers petits outils et rations',
    qty: 1,
    meta: {},
    equipped: false,
  },
  {
    definitionId: 'generic-torch',
    name: 'Torche',
    description: 'Éclairage temporaire',
    qty: 3,
    meta: { usable: true },
    equipped: false,
  },
  {
    definitionId: 'food-rations',
    name: 'Rations',
    description: 'Portion pour un repas',
    qty: 5,
    meta: { usable: true },
    equipped: false,
  },
  {
    definitionId: 'tent-1-2',
    name: 'Tente',
    description: 'Abri pour 1-2 personnes',
    qty: 1,
    meta: {},
    equipped: false,
  },
  {
    definitionId: 'rope-15m',
    name: 'Corde (15m)',
    description: 'Utilitaire polyvalent',
    qty: 1,
    meta: {},
    equipped: false,
  },
  {
    definitionId: 'potion-health',
    name: 'Potion de soin',
    description: 'Soigne un peu de PV',
    qty: 3,
    meta: { usable: true },
    equipped: false,
  },
];

// Weapon choices — separate main weapons from secondary items (shield/bow)
const availableMainWeapons: InventoryItemDto[] = [
  {
    definitionId: 'weapon-dagger',
    name: 'Dague',
    description: 'Lame légère, facile à jeter.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Melee',
      // cost: '2 gp',
      damage: '1d4 piercing',
      // weight: '1 lb',
      properties: ['Finesse', 'Light', 'Thrown 20/60'],
      starter: true,
    },
    equipped: false,
  },
  {
    definitionId: 'weapon-quarterstaff',
    name: 'Quarterstaff',
    description: 'Bâton polyvalent, parfois à deux mains.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Melee',
      // cost: '2 sp',
      damage: '1d6 bludgeoning',
      // weight: '4 lb',
      properties: ['Versatile 1d8'],
      starter: true,
    },
    equipped: false,
  },
  {
    definitionId: 'weapon-longsword',
    name: 'Longsword',
    description: 'Épée équilibrée; peut être utilisée à deux mains.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Martial Melee',
      // cost: '15 gp',
      damage: '1d8 slashing',
      // weight: '3 lb',
      properties: ['Versatile 1d10'],
      starter: true,
    },
    equipped: false,
  },
  {
    definitionId: 'weapon-rapier',
    name: 'Rapier',
    description: "Lame fine et précise; excellente pour l'escrime.",
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Martial Melee',
      // cost: '25 gp',
      damage: '1d8 piercing',
      // weight: '2 lb',
      properties: ['Finesse'],
      starter: true,
    },
    equipped: false,
  },
];
const chosenMainWeapon = ref<InventoryItemDto | null>(availableMainWeapons[0]);
const availableMainWeaponsDefinitionIds = availableMainWeapons.map(w => w.definitionId);

const availableSecondaryItems: InventoryItemDto[] = [
  {
    definitionId: 'weapon-shortbow',
    name: 'Shortbow',
    description: 'Arc court et léger.',
    qty: 1,
    meta: {
      type: 'weapon',
      class: 'Simple Ranged',
      // cost: '25 gp',
      damage: '1d6 piercing',
      // weight: '2 lb',
      properties: ['Ammunition 80/320', 'Two-handed'],
      starter: true,
    },
    equipped: false,
  },
  {
    definitionId: 'armor-shield',
    name: 'Shield',
    description: 'Bouclier, porté à la main; confère un bonus à la CA.',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Shield',
      // cost: '10 gp',
      ac: '+2',
      strength: '—',
      stealth: '—',
      // weight: '6 lb',
      starter: true,
    },
    equipped: false,
  },
];

// Armor choice (pick one among a few armor options)
const availableArmors: InventoryItemDto[] = [
  {
    definitionId: 'armor-leather',
    name: 'Leather',
    description: 'Armure en cuir, légère et pratique. AC 11 + Dex modifier.',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Light Armor',
      // cost: '10 gp',
      ac: '11 + Dex modifier',
      stealth: '—',
      // weight: '10 lb',
      starter: true,
    },
    equipped: false,
  },
  {
    definitionId: 'armor-hide',
    name: 'Hide',
    description: 'Armure en peaux assemblées; protection moyenne. AC 12 + Dex (max 2).',
    qty: 1,
    meta: {
      type: 'armor',
      class: 'Medium Armor',
      // cost: '10 gp',
      ac: '12 + Dex modifier (max 2)',
      stealth: '—',
      // weight: '12 lb',
      starter: true,
    },
    equipped: false,
  },
];
const availableArmorDefinitionIds = availableArmors.map(a => a.definitionId);
const chosenArmor = ref<InventoryItemDto | null>(availableArmors[0]);

const availableSecondaryItemsDefinitionIds = availableSecondaryItems.map((i: InventoryItemDto) => i.definitionId);
const chosenSecondaryItem = ref<InventoryItemDto | null>(availableSecondaryItems[0]);

const weaponIsSelected = (weapon: InventoryItemDto) =>
  (currentCharacter.value?.inventory || []).some(
    (i: InventoryItemDto) => (i.definitionId && i.definitionId === weapon.definitionId) || i.name === weapon.name,
  );

const armorIsSelected = (armor: InventoryItemDto) =>
  (currentCharacter.value?.inventory || []).some(
    (i: InventoryItemDto) => (i.definitionId && i.definitionId === armor.definitionId) || i.name === armor.name,
  );

// Build and persist the new inventory without mutating currentCharacter
const toggleArmor = async (armor: InventoryItemDto, selected = true) => {
  if (!currentCharacter.value) return;
  chosenArmor.value = selected ? armor : null;
  console.log('Toggling armor:', armor, selected);

  const currentInv = currentCharacter.value.inventory || [];
  const filtered = currentInv.filter(
    (i: InventoryItemDto) =>
      !availableArmorDefinitionIds.includes(i.definitionId) &&
      !availableMainWeaponsDefinitionIds.includes(i.definitionId) &&
      !availableSecondaryItemsDefinitionIds.includes(i.definitionId),
  );

  const newInventory = [
    ...filtered,
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is InventoryItemDto => !!i);

  await update.mutateAsync({ inventory: newInventory });
};

const toggleWeapon = async (weapon: InventoryItemDto, selected = true) => {
  if (!currentCharacter.value) return;
  chosenMainWeapon.value = selected ? weapon : null;

  const currentInv = currentCharacter.value.inventory || [];
  const filtered = currentInv.filter(
    (i: InventoryItemDto) =>
      !availableArmorDefinitionIds.includes(i.definitionId) &&
      !availableMainWeaponsDefinitionIds.includes(i.definitionId) &&
      !availableSecondaryItemsDefinitionIds.includes(i.definitionId),
  );

  const newInventory = [
    ...filtered,
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is InventoryItemDto => !!i);

  await update.mutateAsync({ inventory: newInventory });
};

const toggleSecondaryItem = async (item: InventoryItemDto, selected = true) => {
  if (!currentCharacter.value) return;
  chosenSecondaryItem.value = selected ? item : null;

  const currentInv = currentCharacter.value.inventory || [];
  const filtered = currentInv.filter(
    (i: InventoryItemDto) =>
      !availableArmorDefinitionIds.includes(i.definitionId) &&
      !availableMainWeaponsDefinitionIds.includes(i.definitionId) &&
      !availableSecondaryItemsDefinitionIds.includes(i.definitionId),
  );

  const newInventory = [
    ...filtered,
    chosenMainWeapon.value,
    chosenSecondaryItem.value,
    chosenArmor.value,
    ...basePack,
  ].filter((i): i is InventoryItemDto => !!i);

  await update.mutateAsync({ inventory: newInventory });
};
</script>

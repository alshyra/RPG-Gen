<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Race et Classe
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Race</label>
        <RacePicker />
      </div>

      <div>
        <label class="block font-medium mb-2">Classe</label>
        <UiSelect
          :model-value="currentCharacter?.classes?.[0]?.name ?? ''"
          @update:model-value="updateClass($event)"
        >
          <option
            v-for="rpg_classe in CLASSES_LIST"
            :key="rpg_classe"
            :value="rpg_classe"
          >
            {{ rpg_classe }}
          </option>
        </UiSelect>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CLASSES_LIST } from '@/composables/useCharacterCreation';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import UiSelect from '../../ui/UiSelect.vue';
import RacePicker from '../RacePicker.vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);


const updateClass = async (newClass: string) => {
  if (!currentCharacter.value) return;
  currentCharacter.value.classes[0] = { 
     name: newClass,
     level: 1
  };

  if (!currentCharacter.value.characterId) return

  await characterStore.updateCharacter(currentCharacter.value.characterId, { classes: currentCharacter.value.classes });
};
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Générer un Avatar
    </h2>
    <p class="text-slate-400 text-sm">
      (Optionnel) Décrivez l'apparence physique de votre personnage pour générer un avatar avec l'IA
    </p>

    <div class="mt-4">
      <label class="block font-medium mb-2">Description physique</label>
      <UiInputTextarea
        :model-value="currentCharacter?.physicalDescription"
        placeholder="Ex: Grand et musclé, cheveux noirs long, cicatrice sur la joue gauche..."
        :rows="4"
        @update:model-value="debouncedPhysicalDescription"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputTextarea from '@/components/ui/UiInputTextarea.vue';
import { useCharacter } from '@/composables/useCharacter';
import _ from 'lodash';
import { storeToRefs } from 'pinia';

const characterStore = useCharacter();
const { currentCharacter } = storeToRefs(characterStore);

const updatePhysicalDescription = (val: string) => {
  currentCharacter.value.physicalDescription = val;
  const currentCharacterId = currentCharacter.value?.characterId;

  characterStore.updateCharacter({
    characterId: currentCharacterId,
    physicalDescription: val,
  });
};

const debouncedPhysicalDescription = _.debounce(updatePhysicalDescription, 700);
</script>

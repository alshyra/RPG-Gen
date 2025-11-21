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
        @update:model-value="updateDescription"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputTextarea from '@/components/ui/UiInputTextarea.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const updateDescription = async (physicalDescription: string) => {
  if (!currentCharacter.value) return
  currentCharacter.value.physicalDescription = physicalDescription;
  await characterStore.updateCharacter(currentCharacter.value.characterId, {physicalDescription });
};
</script>
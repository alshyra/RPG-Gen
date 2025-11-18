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
        @update:model-value="(val) => { currentCharacter.value = { ...currentCharacter.value, physicalDescription: val }; }"
      />
    </div>

    <div
      v-if="isGenerating"
      class="mt-4 text-center text-slate-400"
    >
      <div class="animate-pulse">
        Génération de l'avatar en cours...
      </div>
    </div>

    <div
      v-if="currentCharacter?.portrait"
      class="mt-4"
    >
      <img
        :src="currentCharacter?.portrait"
        alt="Generated Avatar"
        class="w-48 h-48 rounded border border-slate-600 object-cover"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputTextarea from '@/components/ui/UiInputTextarea.vue';
import { useCharacterCreation } from '@/composables/useCharacterCreation';

interface Props {
  isGenerating: boolean;
}

const props = defineProps<Props>();

const { currentCharacter } = useCharacterCreation();
</script>

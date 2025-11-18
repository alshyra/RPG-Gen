<script setup lang="ts">
import AbilityScorePicker from '../../character-stats/AbilityScorePicker.vue';
import { useCharacterCreation } from '@/composables/useCharacterCreation';

const { currentCharacter } = useCharacterCreation();

const updateScores = (newScores: Record<string, number>) => {
  currentCharacter.value = { ...currentCharacter.value, scores: newScores };
};
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Scores de capacités
    </h2>
    <p class="text-slate-400 text-sm">
      Répartissez vos scores parmi les 6 capacités
    </p>

    <AbilityScorePicker
      :model-value="baseScores"
      :proficiency="2"
      @update:model-value="updateScores"
    />
  </div>
</template>

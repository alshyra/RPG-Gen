<script setup lang="ts">
import AbilityScorePicker from '../../character-stats/AbilityScorePicker.vue';

interface Props {
  baseScores: Record<string, number>;
}

interface Emits {
  (e: 'update:base-scores', value: Record<string, number>): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const updateScores = (newScores: Record<string, number>) => {
  emit('update:base-scores', newScores);
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


<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Scores de capacités
    </h2>
    <p class="text-slate-400 text-sm">
      Répartissez vos scores parmi les 6 capacités
    </p>

    <AbilityScorePicker :proficiency="2" />
  </div>
</template>

<script setup lang="ts">
import AbilityScorePicker from '../../character-stats/AbilityScorePicker.vue';
</script>
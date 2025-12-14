<template>
  <div class="p-4">
    <CharacterCreatorWizard
      :world="world"
      :world-id="world"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import CharacterCreatorWizard from '../components/character-creation/CharacterCreatorWizard.vue';

const route = useRoute();
const world = (route.params.world as string) || '';
</script>

<style scoped></style>

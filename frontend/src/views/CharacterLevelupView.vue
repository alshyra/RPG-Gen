<template>
  <div class="p-4">
    <CharacterLevelup
      :world="world"
      :initial-character="initialCharacter"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import CharacterLevelup from '../components/character-stats/CharacterLevelup.vue';
import { characterService } from '../services/characterService';

const route = useRoute();
const world = (route.params.world as string) || '';

// Get character from localStorage for levelup
const initialCharacter = characterService.loadCharacter();
</script>

<style scoped></style>

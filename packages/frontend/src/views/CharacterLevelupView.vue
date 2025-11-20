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
import { ref, onMounted } from 'vue';
import CharacterLevelup from '../components/character-stats/CharacterLevelup.vue';
import { characterServiceApi } from '../services/characterServiceApi';

const route = useRoute();
const world = (route.params.world as string) || '';

// Get character from backend for levelup
const initialCharacter = ref<any>(null);

onMounted(async () => {
  initialCharacter.value = await characterServiceApi.getCurrentCharacter();
});
</script>

<style scoped></style>

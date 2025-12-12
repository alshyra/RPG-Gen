<template>
  <div class="p-4">
    <CharacterLevelup
      :world="world"
      :initial-character="initialCharacter"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import CharacterLevelup from '../components/character-stats/CharacterLevelup.vue';

const route = useRoute();
const world = (route.params.world as string) || '';
const characterStore = useCharacterStore();

const { currentCharacter } = storeToRefs(characterStore);
const initialCharacter = ref(currentCharacter.value);
</script>

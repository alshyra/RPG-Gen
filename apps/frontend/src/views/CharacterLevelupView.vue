<template>
  <div class="p-4">
    <CharacterLevelup
      :world="world"
      :initial-character="initialCharacter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import CharacterLevelup from '../components/character-stats/CharacterLevelup.vue';

const route = useRoute();
const world = (route.params.world as string) || '';

const currentCharacter = useCurrentCharacter();
const initialCharacter = ref(currentCharacter.value);
</script>

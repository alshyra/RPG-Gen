<template>
  <div>
    <!-- Loading skeletons -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="bg-slate-800/50 rounded-lg overflow-hidden flex flex-col animate-pulse"
      >
        <div class="w-full h-40 bg-slate-700/20" />
        <div class="p-4 flex-1">
          <div class="h-4 bg-slate-700 rounded w-3/4 mb-3" />
          <div class="h-3 bg-slate-700 rounded w-1/2 mb-2" />
          <div class="h-3 bg-slate-700 rounded w-1/3" />
        </div>
      </div>
    </div>

    <div
      v-else-if="characters && characters.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
    >
      <CharacterMenu
        v-for="character in characters"
        :key="character.characterId"
        :character="character"
        @deleted="onCharacterDeleted"
      />
    </div>

    <div
      v-else
      class="mt-6 p-4 bg-slate-800/30 rounded-lg text-slate-400"
    >
      Aucun personnage trouvé.
    </div>
  </div>
</template>

<script setup lang="ts">
import { characterApi } from '@/apis/characterApi';
import type { CharacterResponseDto } from '@rpg-gen/shared';
import {
  onMounted,
  ref,
} from 'vue';
import CharacterMenu from './CharacterMenu.vue';

const characters = ref<CharacterResponseDto[]>([]);
const isLoading = ref(false);

const loadCharacters = async () => {
  try {
    isLoading.value = true;
    const res = await characterApi.getAllCharacters();
    characters.value = res || [];
  } catch (e) {
    console.error('Failed to load characters', e);
    characters.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadCharacters();
});
const onCharacterDeleted = (id: string) => {
  characters.value = characters.value.filter(c => c.characterId !== id);
};
</script>

<style scoped></style>

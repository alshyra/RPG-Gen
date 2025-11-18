<template>
  <header class="flex items-center justify-between min-h-14">
    <div
      v-if="subtitle && description"
      class="flex-none p-2"
    >
      <h2 class="text-xl font-semibold">
        {{ subtitle }}
      </h2>
      <p class="text-sm text-slate-400">
        {{ description }}
      </p>
    </div>
    <div class="absolute left-1/2 -translate-x-1/2">
      <h1 class="text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500">
        RPG Gemini
      </h1>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../../stores/gameStore';

const route = useRoute();
const gameStore = useGameStore();

const worldMap: Record<string, string> = {
  dnd: 'Dungeons & Dragons',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk'
};

const subtitle = computed(() => {
  const routeName = route.name as string;

  if (routeName === 'home') return 'Bienvenue Aventurier';
  if (routeName === 'character-step') {
    const world = (route.params.world as string) || '';
    return worldMap[world] || 'Créateur de personnage';
  }
  if (routeName === 'game') {
    const world = (route.params.world as string) || '';
    return worldMap[world] || 'Aventure';
  }

  return undefined;
});

const description = computed(() => {
  const routeName = route.name as string;

  if (routeName === 'home') return 'Choisissez votre univers !';
  if (routeName === 'character-step') {
    const action = route.query.action as string;
    if (action === 'levelup') return 'Montée de niveau';
    return 'Création de personnage';
  }
  if (routeName === 'game') {
    return gameStore.isInitializing ? 'Initialisation...' : 'Session active';
  }

  return undefined;
});
</script>

<style scoped></style>

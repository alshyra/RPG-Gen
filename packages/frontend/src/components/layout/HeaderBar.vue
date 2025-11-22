<template>
  <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between p-2 gap-2 min-h-14">
    <!-- Title - centered on desktop, top on mobile -->
    <div class="text-center lg:absolute lg:left-1/2 lg:-translate-x-1/2 order-first lg:order-none">
      <h1 class="text-xl lg:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        RPG Gemini
      </h1>
    </div>

    <!-- Subtitle and description - below title on mobile, left side on desktop -->
    <div
      v-if="subtitle && description"
      class="flex-none text-center lg:text-left"
    >
      <h2 class="text-lg lg:text-xl font-semibold">
        {{ subtitle }}
      </h2>
      <p class="text-xs lg:text-sm text-slate-400">
        {{ description }}
      </p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';

const route = useRoute();
const gameStore = useGameStore();

const worldMap: Record<string, string> = {
  dnd: 'Dungeons & Dragons',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
};

const subtitle = computed(() => {
  const routeName = route.name as string;

  if (routeName === 'home') return 'Bienvenue Aventurier';
  if (routeName === 'character-step') {
    const world = (route.params.world as string) || '';
    return worldMap[world] || 'Créateur de personnage';
  }
  if (routeName === 'game') {
    const worldParam = (route.params.world as string) || (route.query.world as string) || '';
    const worldFromStore = gameStore.session?.world || '';
    const worldKey = worldParam || worldFromStore || '';
    return worldMap[worldKey] || gameStore.session?.worldName || 'Aventure';
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

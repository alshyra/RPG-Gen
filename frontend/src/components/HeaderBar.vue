<template>
  <header class="mb-6 flex items-stretch">
    <div class="flex-1">
      <h2 class="text-xl font-semibold">{{ worldName }}</h2>
      <p class="text-sm text-slate-400">{{ initializing ? 'Initialisation...' : 'Session active' }}</p>
    </div>
    <div class="flex-1">
      <h1 class="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">RPG Gemini</h1>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

const world = ref((route.params.world as string) || '');
const worldName = ref('—');
const map: any = { dnd: 'Dungeons & Dragons', vtm: 'Vampire: The Masquerade', cyberpunk: 'Cyberpunk' };
worldName.value = map[world.value as string] || (world.value as string);
const initializing = ref(false);

</script>

<style scoped>
</style>

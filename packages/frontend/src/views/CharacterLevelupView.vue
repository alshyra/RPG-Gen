<template>
  <div class="p-4">
    <CharacterLevelup />
  </div>
</template>

<script setup lang="ts">
// Levelup view is now purely presentational — component handles route and store access
// CharacterLevelup will manage data loading via the composable
import CharacterLevelup from '../components/character-stats/CharacterLevelup.vue';

// no local vars required — levelup component reads route + store

// character data and loading are handled in the CharacterLevelup component through the composable
</script>

<style scoped></style>

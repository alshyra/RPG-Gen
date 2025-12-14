<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
    <div class="min-w-0">
      <div class="text-sm font-semibold truncate">
        {{ name }}
      </div>
      <div class="text-xs text-slate-400 truncate">
        {{ info }}
      </div>
    </div>
    <div class="text-sm flex items-center gap-2 whitespace-nowrap">
      <CharacterHealth :hp="hp" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CharacterHealth from './CharacterHealth.vue';
defineProps<{
  name?: string;
  info?: string;
  hp?: string | number;
}>();
</script>

<style scoped></style>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-center p-4">
    <div class="max-w-lg w-full bg-slate-900/95 border border-slate-700 rounded-md p-6 flex flex-col items-center gap-4">
      <UiLoader />
      <div class="text-lg font-semibold">
        {{ title }}
      </div>
      <div class="text-sm text-slate-400">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiLoader from './UiLoader.vue';
import { defineProps } from 'vue';

const props = defineProps<{
  title?: string;
  subtitle?: string;
}>();
const title = props.title ?? 'Patientez…';
const subtitle = props.subtitle ?? '';
</script>

<style scoped>
/* keep small default styles but rely on tailwind for most visuals */
</style>

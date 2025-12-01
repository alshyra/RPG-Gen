<template>
  <div class="w-full">
    <div class="flex items-center gap-2">
      <span
        v-if="label"
        class="text-xs text-slate-400 whitespace-nowrap"
      >
        {{ label }}
      </span>
      <div class="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
        <div
          class="bg-linear-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
          :style="{ width: `${percentage}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  percentage: number;
  label?: string;
}>();
</script>

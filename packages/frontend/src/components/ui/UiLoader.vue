<template>
  <div class="flex items-center justify-center p-4">
    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
  </div>
</template>

<script setup lang="ts">
// Simple spinner used during API calls / initialization
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

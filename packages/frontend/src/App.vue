<template>
  <div class="app app-bg rounded-lg min-h-screen">
    <div class="flex flex-col justify-between gap-2 lg:gap-0">
      <HeaderBar />
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from './components/layout/HeaderBar.vue';
</script>

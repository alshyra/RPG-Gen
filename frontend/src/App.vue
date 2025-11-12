<template>
  <div class="app app-bg rounded-lg min-h-screen">
    <HeaderBar />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from './components/layout/HeaderBar.vue';
</script>

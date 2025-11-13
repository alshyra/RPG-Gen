<template>
  <div class="app app-bg rounded-lg min-h-screen">
    <div class="flex justify-between items-center">
      <HeaderBar />
      <div class="pr-4">
        <UserProfile />
      </div>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from './components/layout/HeaderBar.vue';
import UserProfile from './components/layout/UserProfile.vue';
</script>

<template>
  <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between p-2 gap-2 min-h-14">
    <div class="flex items-center justify-between w-full">
      <router-link
        :to="{ name: 'home' }"
        class="inline-block"
      >
        <h1 class="text-xl lg:text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500">
          RPG Gemini
        </h1>
      </router-link>
      <UserProfile />
    </div>
  </header>
</template>

<script setup lang="ts">
import UserProfile from './UserProfile.vue';

</script>

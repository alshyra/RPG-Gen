<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-slate-900/70 backdrop-blur-sm border-b border-slate-800">
    <div class="flex items-center justify-between p-3 max-w-7xl mx-auto">
      <div class="flex items-center gap-3">
        <!-- Mobile menu toggle -->
        <UiButton
          variant="ghost"
          class="lg:hidden p-2 bg-slate-800 shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          @click="ui.toggleMenu()"
        >
          <svg
            v-if="!ui.isMenuOpen"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </UiButton>

        <router-link :to="{ name: 'home' }" class="inline-block">
          <h1 class="text-xl lg:text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500">
            RPG Gemini
          </h1>
        </router-link>
      </div>
      <UserProfile />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore';
import UiButton from '../ui/UiButton.vue';
import UserProfile from './UserProfile.vue';

const ui = useUiStore();

</script>

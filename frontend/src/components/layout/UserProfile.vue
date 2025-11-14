<template>
  <div
    v-if="user"
    class="flex items-center gap-3"
  >
    <div class="hidden sm:block text-right">
      <div class="text-sm font-medium text-white">
        {{ user.displayName }}
      </div>
      <div class="text-xs text-slate-400">
        {{ user.email }}
      </div>
    </div>
    
    <div class="relative">
      <button
        class="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 hover:border-indigo-500 transition-colors"
        @click="showMenu = !showMenu"
      >
        <img
          v-if="user.picture"
          :src="user.picture"
          :alt="user.displayName"
          class="w-full h-full object-cover"
        >
        <div
          v-else
          class="w-full h-full bg-slate-700 flex items-center justify-center text-white font-bold"
        >
          {{ user.displayName?.charAt(0).toUpperCase() }}
        </div>
      </button>

      <!-- Dropdown Menu -->
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
      >
        <button
          class="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg"
          @click="handleLogout"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService, type User } from '../../services/authService';

const router = useRouter();
const user = ref<User | null>(null);
const showMenu = ref(false);

onMounted(() => {
  user.value = authService.getUser();
});

const handleLogout = () => {
  authService.logout();
  showMenu.value = false;
  router.push('/login');
};
</script>

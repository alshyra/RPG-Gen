<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="text-center">
      <div
        v-if="loading"
        class="space-y-4"
      >
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
        <p class="text-slate-300">
          Authentification en cours...
        </p>
      </div>
      
      <div
        v-else-if="error"
        class="space-y-4"
      >
        <div class="text-red-500 text-5xl">
          ⚠️
        </div>
        <h2 class="text-xl font-bold text-white">
          Erreur d'authentification
        </h2>
        <p class="text-slate-300">
          {{ error }}
        </p>
        <UiButton @click="goToLogin">
          Réessayer
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import UiButton from '../components/ui/UiButton.vue';

const router = useRouter();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    // Get token from URL query params
    const urlParams = new window.URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      error.value = 'Token manquant';
      loading.value = false;
      return;
    }

    // Save token
    authService.setToken(token);

    // Fetch user profile
    const user = await authService.fetchUserProfile(token);
    if (!user) {
      error.value = 'Impossible de récupérer le profil utilisateur';
      loading.value = false;
      return;
    }

    // Redirect to home (world selector)
    router.push('/home');
  } catch (e) {
    console.error('Auth callback error', e);
    error.value = 'Une erreur est survenue lors de l\'authentification';
    loading.value = false;
  }
});

const goToLogin = () => {
  router.push('/login');
};
</script>

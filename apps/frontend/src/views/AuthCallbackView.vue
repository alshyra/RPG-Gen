<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="text-center">
      <div
        v-if="loading"
        class="space-y-4"
      >
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"
        />
        <p class="text-slate-300">Authentification en cours...</p>
      </div>

      <div
        v-else-if="error"
        class="space-y-4"
      >
        <div class="text-red-500 text-5xl">⚠️</div>
        <h2 class="text-xl font-bold text-white">Erreur d'authentification</h2>
        <p class="text-slate-300">
          {{ error }}
        </p>
        <UiButton @click="goToLogin"> Réessayer </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@rpg-gen/api-client';
import { UiButton } from '@rpg-gen/ui';

const router = useRouter();
const loading = ref(true);
const error = ref('');

onMounted(() => runAuthFlow());

const runAuthFlow = async () => {
  try {
    const token = getTokenFromUrl();
    if (!token) {
      setError('Token manquant');
      return;
    }

    await saveTokenAndFetchProfile(token);
    router.push('/home');
  } catch (e) {
    handleAuthError(e);
  }
};

const getTokenFromUrl = () => {
  const urlParams = new window.URLSearchParams(window.location.search);
  return urlParams.get('token');
};

const setError = (message: string) => {
  error.value = message;
  loading.value = false;
};

const saveTokenAndFetchProfile = async (token: string) => {
  // Save token to localStorage
  localStorage.setItem('auth_token', token);

  // Fetch user profile to validate token
  try {
    await authApi.getProfile();
  } catch (err) {
    setError('Impossible de récupérer le profil utilisateur');
    throw err;
  }
};

const handleAuthError = (e: unknown) => {
  console.error('Auth callback error', e);
  setError("Une erreur est survenue lors de l'authentification");
};

const goToLogin = () => router.push('/login');
</script>

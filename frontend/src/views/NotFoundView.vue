<template>
  <div class="flex items-center justify-center min-h-[80vh] p-6">
    <div class="max-w-2xl mx-auto text-center">
      <!-- 404 Image -->
      <div class="mb-8">
        <img
          src="/images/404-lost-adventurer.svg"
          alt="Lost Adventurer"
          class="w-64 h-64 mx-auto mb-6 opacity-80"
        >
      </div>

      <!-- 404 Title -->
      <h1 class="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        404
      </h1>

      <!-- Main Message -->
      <h2 class="text-3xl font-bold mb-4 text-slate-200">
        Vous êtes perdu dans les ténèbres...
      </h2>

      <!-- Description -->
      <p class="text-lg text-slate-300 mb-8">
        Cette page n'existe pas dans notre univers. Il semble que vous ayez emprunté un mauvais
        chemin dans votre quête. Peut-être qu'un sort de téléportation vous ramènera à bon port ?
      </p>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-center">
        <UiButton
          variant="primary"
          @click="goHome"
        >
          Retour à l'accueil
        </UiButton>
        <UiButton
          variant="ghost"
          @click="goBack"
        >
          Revenir en arrière
        </UiButton>
      </div>

      <!-- Additional Flavor Text -->
      <div class="mt-12 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p class="text-sm text-slate-400 italic">
          "Même les plus grands aventuriers se perdent parfois. Ce n'est pas la destination qui
          compte, mais le voyage..." — Sage inconnu
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import UiButton from '../components/ui/UiButton.vue';

const router = useRouter();

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.back();
};
</script>

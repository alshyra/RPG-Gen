<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div class="max-w-4xl w-full text-center">
      <!-- Hero Section -->
      <div class="mb-12">
        <h1 class="text-6xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          RPG Gemini
        </h1>
        <p class="text-2xl text-slate-300 mb-8">
          Vivez des aventures épiques générées par l'IA
        </p>
        <p class="text-lg text-slate-400 max-w-2xl mx-auto">
          Un moteur d'aventure assisté par Gemini qui génère des scènes immersives, des PNJ 
          captivants et des images uniques. Créez votre personnage et plongez dans des univers 
          fantastiques illimités.
        </p>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <div class="text-4xl mb-3">
            🎭
          </div>
          <h3 class="text-xl font-bold text-white mb-2">
            Récits générés par IA
          </h3>
          <p class="text-slate-400">
            Chaque aventure est unique, générée en temps réel par l'intelligence artificielle
          </p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <div class="text-4xl mb-3">
            🌍
          </div>
          <h3 class="text-xl font-bold text-white mb-2">
            Univers multiples
          </h3>
          <p class="text-slate-400">
            Explorez D&D, Vampire: The Masquerade, Cyberpunk et bien plus encore
          </p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
          <div class="text-4xl mb-3">
            ⚔️
          </div>
          <h3 class="text-xl font-bold text-white mb-2">
            Création de personnage
          </h3>
          <p class="text-slate-400">
            Créez des personnages détaillés avec stats, compétences et portraits générés
          </p>
        </div>
      </div>

      <!-- CTA Button -->
      <div class="mb-8">
        <button
          class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xl font-bold px-12 py-4 rounded-lg transition-all transform hover:scale-105 shadow-xl"
          @click="startPlaying"
        >
          Commencer à jouer
        </button>
      </div>

      <!-- Info -->
      <div class="text-sm text-slate-500">
        Gratuit • Aucun téléchargement requis • Commencez immédiatement
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const startPlaying = () => {
  router.push({ name: 'login' });
};
</script>

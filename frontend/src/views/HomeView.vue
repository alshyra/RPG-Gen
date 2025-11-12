<template>
  <div class="p-6 max-w-4xl mx-auto">
    <section class="mb-8 text-center">
      <h1 class="text-3xl font-extrabold mb-2">
        RPG Gemini
      </h1>
      <p class="text-slate-300">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton
        univers et commence immédiatement.
      </p>

      <!-- Resume current character if present -->
      <div
        v-if="currentCharacter"
        class="mt-4 mb-6 p-4 bg-slate-800/50 rounded-lg flex items-center justify-between"
      >
        <div class="text-left">
          <div class="text-sm text-slate-300">
            Personnage en cours
          </div>
          <div class="text-lg font-semibold">
            {{ currentCharacter.name || 'Personnage inconnu' }}
          </div>
          <div class="text-xs text-slate-400">
            {{ charSummary }}
          </div>
        </div>
        <div class="flex gap-2">
          <button
            class="btn-primary"
            @click="resumeCharacter"
          >
            Reprendre
          </button>
          <button
            class="btn-ghost"
            @click="clearCurrentCharacter"
          >
            Supprimer
          </button>
        </div>
      </div>

      <WorldSelector @select="onSelect" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import WorldSelector from '../components/game/WorldSelector.vue';
import { characterService } from '../services/characterService';

const router = useRouter();
const currentCharacter = ref<any>(null);
const charSummary = computed(() => {
  if (!currentCharacter.value) return '';
  const classes = currentCharacter.value.classes || [];
  return classes.map((c: any) => (c?.name ? `${c.name} ${c.level}` : '')).filter(Boolean).join(', ');
});

function onSelect(id: string) {
  try { window.sessionStorage.setItem('selected-world', id); } catch {
    //
  }
  characterService.clearCurrentCharacterId()
  router.push({ name: 'character', params: { world: id } });
}

function resumeCharacter() {
  // set current character in localStorage and go to game view
  const saved = characterService.getAllSavedCharacters();
  if (saved.length > 0) {
    characterService.setCurrentCharacterId(saved[0].id);
    router.push({ name: 'game', params: { world: saved[0].data.worldId } });
  }
}

function clearCurrentCharacter() {
  const saved = characterService.getAllSavedCharacters();
  if (saved.length > 0) {
    characterService.deleteCharacter(saved[0].id);
  }
  currentCharacter.value = null;
}

onMounted(() => {
  currentCharacter.value = characterService.getCurrentCharacter();
});
</script>

<style scoped></style>

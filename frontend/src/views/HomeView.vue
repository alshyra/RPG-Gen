<template>
  <div class="p-6 flex flex-col justify-between min-h-[50vh] mt-28">
    <section class="text-center w-3/4 mx-auto mt-10">
      <p class="text-slate-300">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton
        univers et commence immédiatement.
      </p>

      <!-- Resume current character if present -->
      <div
        v-if="currentCharacter"
        class="mt-4 p-4 bg-slate-800/50 rounded-lg flex items-center justify-between"
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
          <UiButton
            variant="primary"
            @click="resumeCharacter"
          >
            Reprendre
          </UiButton>
          <UiButton
            variant="ghost"
            @click="clearCurrentCharacter"
          >
            Supprimer
          </UiButton>
        </div>
      </div>
    </section>

    <div class="max-w-2xl w-full mx-auto">
      <WorldSelector @select="onSelect" />
    </div>

    <div />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import WorldSelector from '../components/game/WorldSelector.vue';
import UiButton from '../components/ui/UiButton.vue';
import { characterServiceApi } from '../services/characterServiceApi';

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
  characterServiceApi.clearCurrentCharacterId()
  router.push({ name: 'character-step', params: { world: id, step: 1 } });
}

async function resumeCharacter() {
  // set current character in localStorage and go to game view
  const saved = await characterServiceApi.getAllSavedCharacters();
  if (saved.length > 0) {
    characterServiceApi.setCurrentCharacterId(saved[0].id);
    router.push({ name: 'game', params: { world: saved[0].data.worldId } });
  }
}

async function clearCurrentCharacter() {
  const saved = await characterServiceApi.getAllSavedCharacters();
  if (saved.length > 0) {
    await characterServiceApi.deleteCharacter(saved[0].id);
  }
  currentCharacter.value = null;
}

onMounted(async () => {
  currentCharacter.value = await characterServiceApi.getCurrentCharacter();
});
</script>

<style scoped></style>

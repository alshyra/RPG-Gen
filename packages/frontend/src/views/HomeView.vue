<template>
  <div class="p-6 flex flex-col justify-between min-h-[50vh] mt-28">
    <section class="text-center w-3/4 mx-auto mt-10">
      <p class="text-slate-300">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton
        univers et commence immédiatement.
      </p>

      <!-- Characters list handled by CharactersGrid component -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-4 text-slate-200">
          Mes personnages
        </h3>
        <CharactersGrid />
      </div>
    </section>

    <div class="max-w-2xl w-full mx-auto mt-8 text-center">
      <p class="text-slate-300 mb-3">Créer un nouveau personnage — uniquement pour D&D.</p>
      <UiButton
        variant="primary"
        :is-loading="creating"
        @click="createDndCharacter"
      >
        Créer un personnage (D&D)
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CharactersGrid from '../components/character/CharactersGrid.vue';
import UiButton from '../components/ui/UiButton.vue';
import { characterServiceApi } from '../apis/characterApi';
import { useRouter } from 'vue-router';

const router = useRouter();
const creating = ref(false);

const createDndCharacter = async () => {
  creating.value = true;
  try {
    const newChar = await characterServiceApi.createCharacter('dnd');
    if (newChar && newChar.characterId) {
      // Navigate to character creation step 1 for the new character
      router.push({ name: 'character-step', params: { characterId: newChar.characterId, step: 1 } });
    }
  } catch (e) {
    console.error('Failed to create DnD character', e);
    window.alert('La création du personnage a échoué.');
  } finally {
    creating.value = false;
  }
};

// character summary logic is handled in the CharactersGrid component

// Character actions are handled inside the CharactersGrid component
</script>

<style scoped></style>

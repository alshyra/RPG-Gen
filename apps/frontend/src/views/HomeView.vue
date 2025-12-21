<template>
  <div class="p-6 flex flex-col justify-between min-h-[50vh] mt-28">
    <section class="text-center w-full mx-auto">
      <p class="text-slate-300 max-w-2xl mx-auto mb-6">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton univers
        et commence immédiatement.
      </p>

      <div class="max-w-4xl w-full mx-auto">
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-6 text-slate-100">Mes personnages</h2>
          <CharactersMenu />
        </div>
      </div>
    </section>

    <div class="max-w-2xl w-full mx-auto mt-8 text-center">
      <UiButton
        variant="primary"
        :is-loading="creating"
        @click="createCharacter"
      >
        + Créer un nouveau personnage
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CharactersMenu from "../components/home/CharactersMenu.vue";
import { showAlert, UiButton } from "@rpg-gen/ui";
import { useCharacter } from "@rpg-gen/api-client";
import { useRouter } from "vue-router";

const router = useRouter();
const creating = ref(false);

const character = useCharacter(undefined);

const createCharacter = async () => {
  creating.value = true;
  try {
    const newChar = await character.create.mutateAsync();
    if (newChar && newChar.characterId) {
      // Navigate to character creation step 1 for the new character
      router.push({
        name: "character-step",
        params: {
          characterId: newChar.characterId,
          step: 1,
        },
      });
    }
  } catch (e) {
    console.error("Failed to create DnD character", e);
    await showAlert("La création du personnage a échoué.");
  } finally {
    creating.value = false;
  }
};
</script>

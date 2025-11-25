<template>
  <div class="p-6 flex flex-col justify-between min-h-[50vh] mt-28">
    <section class="text-center w-3/4 mx-auto mt-10">
      <p class="text-slate-300">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton
        univers et commence immédiatement.
      </p>

      <!-- List of all saved characters -->
      <div
        v-if="characters.length > 0"
        class="mt-6"
      >
        <h3 class="text-lg font-semibold mb-4 text-slate-200">
          Mes personnages
        </h3>
        <div class="space-y-3">
          <div
            v-for="character in characters"
            :key="character.characterId"
            class="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between hover:bg-slate-800/70 transition-colors"
          >
            <div class="text-left flex-1">
              <div class="text-lg font-semibold">
                {{ character.name || 'Personnage inconnu' }}
              </div>
              <div class="text-xs text-slate-400">
                {{ getCharSummary(character) }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                {{ character.world }} • HP: {{ character.hp }}/{{ character.hpMax }} • XP: {{ character.totalXp || 0 }}
              </div>
            </div>
            <div class="flex gap-2">
              <UiButton
                variant="primary"
                @click="resumeCharacter(character)"
              >
                Reprendre
              </UiButton>
              <UiButton
                variant="ghost"
                :is-loading="deletingCharacterId === character.characterId"
                @click="deleteCharacter(character)"
              >
                Supprimer
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Message if no characters -->
      <div
        v-else
        class="mt-6 p-4 bg-slate-800/30 rounded-lg text-slate-400"
      >
        Aucun personnage créé. Sélectionnez un univers ci-dessous pour commencer !
      </div>
    </section>

    <div class="max-w-2xl w-full mx-auto mt-8">
      <WorldSelector />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterDto } from '@rpg-gen/shared';
import { onMounted, ref } from 'vue';
import WorldSelector from '../components/game/WorldSelector.vue';
import UiButton from '../components/ui/UiButton.vue';
import { characterServiceApi } from '../services/characterServiceApi';
import { useRouter } from 'vue-router';

const router = useRouter();
const characters = ref<Partial<CharacterDto>[]>([]);
const deletingCharacterId = ref<string | null>(null);

const getCharSummary = (character: Partial<CharacterDto>): string => {
  const classes = character.classes || [];
  return classes
    .map(character => (character?.name ? `${character.name} Niveau ${character.level}` : ''))
    .filter(Boolean)
    .join(', ');
};

const resumeCharacter = (character: Partial<CharacterDto>) => {
  if (character.state === 'draft') {
    router.push({ name: 'character-step', params: { characterId: character.characterId, step: 1 } });
    return;
  }
  router.push({ name: 'game', params: { characterId: character.characterId } });
};

const deleteCharacter = async (character: Partial<CharacterDto>) => {
  if (!character.characterId) return;
  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce personnage ?')) {
    deletingCharacterId.value = character.characterId;
    try {
      await characterServiceApi.deleteCharacter(character.characterId);
      await loadCharacters();
    } finally {
      deletingCharacterId.value = null;
    }
  }
};

const loadCharacters = async () => {
  const res = await characterServiceApi.getAllSavedCharacters();
  characters.value = res;
};

onMounted(async () => {
  await loadCharacters();
});
</script>

<style scoped></style>

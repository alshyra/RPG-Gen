<template>
  <div class="p-6 flex flex-col justify-between min-h-[50vh] mt-28">
    <section class="text-center w-3/4 mx-auto mt-10">
      <p class="text-slate-300">
        Un moteur d'aventure assisté par Gemini — génère scènes, PNJ, et images. Choisis ton
        univers et commence immédiatement.
      </p>

      <!-- List of all saved characters -->
      <div
        v-if="savedCharacters.length > 0"
        class="mt-6"
      >
        <h3 class="text-lg font-semibold mb-4 text-slate-200">
          Mes personnages
        </h3>
        <div class="space-y-3">
          <div
            v-for="char in savedCharacters"
            :key="char.id"
            class="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between hover:bg-slate-800/70 transition-colors"
          >
            <div class="text-left flex-1">
              <div class="text-lg font-semibold">
                {{ char.data.name || 'Personnage inconnu' }}
              </div>
              <div class="text-xs text-slate-400">
                {{ getCharSummary(char.data) }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                {{ char.data.world || 'D&D' }} • HP: {{ char.data.hp }}/{{ char.data.hpMax }} • XP: {{ char.data.totalXp || 0 }}
              </div>
            </div>
            <div class="flex gap-2">
              <UiButton
                variant="primary"
                @click="resumeCharacter(char.id, char.data.world)"
              >
                Reprendre
              </UiButton>
              <UiButton
                variant="ghost"
                @click="deleteCharacter(char.id)"
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
      <WorldSelector @select="onSelect" />
    </div>

    <div />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import WorldSelector from '../components/game/WorldSelector.vue';
import UiButton from '../components/ui/UiButton.vue';
import { characterServiceApi } from '../services/characterServiceApi';
import type { SavedCharacterEntry, CharacterEntry } from '@shared/types';

const router = useRouter();
const savedCharacters = ref<SavedCharacterEntry[]>([]);

function getCharSummary(character: CharacterEntry): string {
  if (!character) return '';
  const classes = character.classes || [];
  return classes.map((c: any) => (c?.name ? `${c.name} Niveau ${c.level}` : '')).filter(Boolean).join(', ');
}

function onSelect(id: string) {
  try { window.sessionStorage.setItem('selected-world', id); } catch {
    //
  }
  characterServiceApi.clearCurrentCharacterId()
  router.push({ name: 'character-step', params: { world: id, step: 1 } });
}

async function resumeCharacter(characterId: string, world: string) {
  characterServiceApi.setCurrentCharacterId(characterId);
  router.push({ name: 'game', params: { world: world || 'dnd' } });
}

async function deleteCharacter(characterId: string) {
  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce personnage ?')) {
    await characterServiceApi.deleteCharacter(characterId);
    // Refresh the character list
    await loadCharacters();
  }
}

async function loadCharacters() {
  savedCharacters.value = await characterServiceApi.getAllSavedCharacters();
}

onMounted(async () => {
  await loadCharacters();
});
</script>

<style scoped></style>

<template>
  <div
    class="bg-slate-800/50 rounded-lg overflow-hidden hover:bg-slate-800/70 transition-colors flex flex-col relative cursor-pointer"
    role="button"
    tabindex="0"
    :aria-label="`Reprendre ${character.name || 'personnage'}`"
    @click="onResume(character)"
    @keydown.enter="onResume(character)"
  >
    <div class="w-full h-40 bg-slate-700/30 flex items-center justify-center">
      <img
        v-if="character.portrait"
        :src="character.portrait"
        alt="portrait"
        class="w-full h-40 object-cover"
        loading="lazy"
      >
      <div
        v-else
        class="text-slate-400"
      >
        Pas de portrait
      </div>
    </div>

    <div class="p-4 flex-1 flex flex-col justify-between">
      <div>
        <div class="text-lg font-semibold text-slate-100">
          {{ character.name || 'Personnage inconnu' }}
        </div>
        <div class="text-xs text-slate-400">
          {{ getCharSummary(character) }}
        </div>
        <div class="text-xs text-slate-500 mt-1">
          {{ character.world }} • HP: {{ character.hp }}/{{ character.hpMax }} • XP: {{ character.totalXp || 0 }}
        </div>
      </div>

      <div class="mt-3 flex gap-2 justify-end">
        <UiButton
          variant="ghost"
          :is-loading="deletingCharacterId === character.characterId"
          class="absolute top-2 right-2"
          :aria-label="`Supprimer ${character.name || 'personnage'}`"
          @click.stop="onDelete(character)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-slate-200"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 00-2 0v6a1 1 0 102 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z"
              clip-rule="evenodd"
            />
          </svg>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { characterServiceApi } from '@/apis/characterApi';
import UiButton from '@/components/ui/UiButton.vue';
import type { CharacterResponseDto } from '@rpg-gen/shared';
import {
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
const emit = defineEmits<(e: 'deleted', id: string) => void>();

const props = defineProps<{ character: CharacterResponseDto }>();
const { character } = props;
const deletingCharacterId = ref<string | null>(null);

const router = useRouter();

const onResume = (character: CharacterResponseDto) => {
  if (character.state === 'draft') {
    router.push({
      name: 'character-step',
      params: {
        characterId: character.characterId,
        step: 1,
      },
    });
    return;
  }
  router.push({
    name: 'game',
    params: { characterId: character.characterId },
  });
};

const onDelete = async (character: CharacterResponseDto) => {
  if (!character.characterId) return;
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce personnage ?')) return;
  deletingCharacterId.value = character.characterId;
  try {
    await characterServiceApi.deleteCharacter(character.characterId);
    emit('deleted', character.characterId);
  } catch (e) {
    console.error('Failed to delete character', e);
    window.alert('Impossible de supprimer le personnage.');
  } finally {
    deletingCharacterId.value = null;
  }
};

const getCharSummary = (character: Partial<CharacterResponseDto>): string => {
  const classes = character.classes || [];
  return classes
    .map(c => (c?.name ? `${c.name} Niveau ${c.level}` : ''))
    .filter(Boolean)
    .join(', ');
};

</script>

<style scoped></style>

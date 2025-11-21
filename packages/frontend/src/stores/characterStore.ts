import { characterServiceApi } from '@/services/characterServiceApi';
import { CharacterDto } from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

export const useCharacterStore = defineStore('character', () => {
  const route = useRoute();
  const currentCharacterId = computed(() => route.params.characterId as string || undefined);

  const currentCharacter = ref<CharacterDto>();

  const createCharacter = async (world: string) => {
    const newChar = await characterServiceApi.createCharacter({ world });
    currentCharacter.value = newChar;
    return newChar;
  };

  const updateCharacter = async (characterId: string, character: Partial<CharacterDto>) => {
    if (!characterId) return;
    try {
      await characterServiceApi.saveCharacter(characterId, character);
    } catch (e) {
      console.error('Failed to update character', e);
      throw e;
    }
  };

  watch(currentCharacterId, async (id) => {
    if (!id) return;
    const res = await characterServiceApi.getCharacterById(id);
    currentCharacter.value = res || undefined;
  }, { immediate: true });

  return {
    currentCharacter,
    createCharacter,
    updateCharacter,
  };
});

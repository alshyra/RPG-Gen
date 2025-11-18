import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CharacterDto } from '@backend/src/character/dto/character.dto';
import { characterServiceApi } from '@/services/characterServiceApi';

export const useCharacterStore = defineStore('character', () => {
  const currentCharacter = ref<Partial<CharacterDto>>({});

  async function createCharacter(payload: Partial<CharacterDto>): Promise<CharacterDto> {
    const created = await characterServiceApi.createCharacter(payload);
    currentCharacter.value = created;
    return created;
  }

  async function updateCharacter(payload: Partial<CharacterDto>): Promise<void> {
    if (!payload.characterId) throw new Error('Character id required to update');
    // call API and update local state
    await characterServiceApi.updateCharacter(payload as CharacterDto);
    if (currentCharacter.value?.characterId === payload.characterId) {
      currentCharacter.value = { ...currentCharacter.value, ...(payload as Partial<CharacterDto>) } as Partial<CharacterDto>;
    }
  }

  async function fetchCharacterById(characterId: string): Promise<CharacterDto> {
    const c = await characterServiceApi.getCharacterById(characterId);
    currentCharacter.value = c;
    return c;
  }

  return {
    currentCharacter,
    createCharacter,
    updateCharacter,
    fetchCharacterById,
  };
});

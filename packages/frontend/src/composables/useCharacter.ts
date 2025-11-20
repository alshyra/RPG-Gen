import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CharacterDto } from '@rpg/shared';
import { characterServiceApi } from '@/services/characterServiceApi';

/* eslint-disable max-statements */
export const useCharacter = defineStore('character', () => {
  const currentCharacter = ref<Partial<CharacterDto>>({});

  const createCharacter = async (world: 'dnd'): Promise<CharacterDto> => {
    const created = await characterServiceApi.createCharacter({ world });
    currentCharacter.value = created;
    return created;
  };

  const updateCharacter = async (payload: Partial<CharacterDto>): Promise<void> => {
    if (!payload.characterId) throw new Error('Character id required to update');
    // call API and update local state
    await characterServiceApi.updateCharacter(payload as CharacterDto);
  };

  const fetchCharacterById = async (characterId: string): Promise<CharacterDto> => {
    const c = await characterServiceApi.getCharacterById(characterId);
    currentCharacter.value = c;
    return c;
  };

  // Character state helpers moved from game store
  const updateCharacterHp = (delta: number): void => {
    if (!currentCharacter.value) return;
    const hpMax = (currentCharacter.value as CharacterDto).hpMax || 12;
    const currentHp = (currentCharacter.value as CharacterDto).hp || 0;
    const h = Math.max(0, Math.min(hpMax, currentHp + delta));
    (currentCharacter.value as CharacterDto).hp = h;
  };

  const updateCharacterXp = (delta: number): void => {
    if (!currentCharacter.value) return;
    (currentCharacter.value as CharacterDto).totalXp
      = ((currentCharacter.value as CharacterDto).totalXp || 0) + delta;
  };

  const learnSpell = (spell: any): void => {
    if (!currentCharacter.value) return;
    if (!(currentCharacter.value as CharacterDto).spells)
      (currentCharacter.value as CharacterDto).spells = [];
    (currentCharacter.value as CharacterDto).spells!.push(spell);
  };

  const forgetSpell = (spellName: string): void => {
    if (!currentCharacter.value || !(currentCharacter.value as CharacterDto).spells) return;
    (currentCharacter.value as CharacterDto).spells = (
      currentCharacter.value as CharacterDto
    ).spells!.filter((s: any) => s.name !== spellName);
  };

  const addInventoryItem = (item: any): void => {
    if (!currentCharacter.value) return;
    if (!(currentCharacter.value as CharacterDto).inventory)
      (currentCharacter.value as CharacterDto).inventory = [];
    const existing = (currentCharacter.value as CharacterDto).inventory!.find(
      (i: any) => i.name === item.name,
    );
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      (currentCharacter.value as CharacterDto).inventory!.push({
        ...item,
        quantity: item.quantity || 1,
      });
    }
  };

  const removeInventoryItem = (itemName: string, quantity: number = 1): void => {
    if (!currentCharacter.value || !(currentCharacter.value as CharacterDto).inventory) return;
    const item = (currentCharacter.value as CharacterDto).inventory!.find(
      (i: any) => i.name === itemName,
    );
    if (item) {
      item.quantity = (item.quantity || 1) - quantity;
      if (item.quantity <= 0) {
        (currentCharacter.value as CharacterDto).inventory = (
          currentCharacter.value as CharacterDto
        ).inventory!.filter((i: any) => i.name !== itemName);
      }
    }
  };

  const useInventoryItem = (itemName: string): void => {
    if (!currentCharacter.value || !(currentCharacter.value as CharacterDto).inventory) return;
    const item = (currentCharacter.value as CharacterDto).inventory!.find(
      (i: any) => i.name === itemName,
    );
    if (item) {
      item.quantity = (item.quantity || 1) - 1;
      if (item.quantity <= 0) {
        (currentCharacter.value as CharacterDto).inventory = (
          currentCharacter.value as CharacterDto
        ).inventory!.filter((i: any) => i.name !== itemName);
      }
    }
  };

  return {
    currentCharacter,
    createCharacter,
    updateCharacter,
    fetchCharacterById,
    updateCharacterHp,
    updateCharacterXp,
    addInventoryItem,
    removeInventoryItem,
    useInventoryItem,
    learnSpell,
    forgetSpell,
  };
});

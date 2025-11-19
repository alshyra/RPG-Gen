import { useCharacterStore } from '@/composables/useCharacterStore';
import { DnDRulesService } from '@/services/dndRulesService';
import type { CharacterDto, GenderDto } from '@rpg/shared';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

export const ALLOWED_RACES = [
  { id: 'human', name: 'Humain', mods: { Str: 1, Dex: 1, Con: 1, Int: 1, Wis: 1, Cha: 1 } },
  { id: 'dwarf', name: 'Nain', mods: { Con: 2 } },
  { id: 'elf', name: 'Elfe', mods: { Dex: 2 } },
  { id: 'halfling', name: 'Halfelin', mods: { Dex: 2 } },
  { id: 'gnome', name: 'Gnome', mods: { Int: 2 } },
  { id: 'half-elf', name: 'Demi-elfe', mods: { Cha: 2 } },
  { id: 'half-orc', name: 'Demi-orc', mods: { Str: 2, Con: 1 } },
  { id: 'tiefling', name: 'Tieffelin', mods: { Cha: 2, Int: 1 } },
  { id: 'dragonborn', name: 'Drakéide', mods: { Str: 2, Cha: 1 } },
] as const;

export const CLASSES_LIST = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;
export const GENDERS = ['male', 'female'] as const;
export const DEFAULT_RACE = ALLOWED_RACES[0];
export const DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 } as const;

export const isGenderTypeGuard = (value: unknown): value is GenderDto =>
  value === 'male' || value === 'female';

export const useCharacterCreation = () => {
  const route = useRoute();
  const store = useCharacterStore();
  const { currentCharacter } = storeToRefs(store);
  const currentCharacterId = computed(() => {
    const id = route.params.characterId;
    return Array.isArray(id) ? id[0] : id;
  });

  const createCharacter = async (characterData: Partial<CharacterDto>) =>
    await store.createCharacter(characterData);
  const updateCharacter = async (characterData: Partial<CharacterDto>) =>
    await store.updateCharacter(characterData);
  const getCharacterById = async (characterId: string) =>
    await store.fetchCharacterById(characterId);

  // Prepare character for saving by computing derived fields (hp, prof, skills)
  const prepareForSave = (world?: string, worldId?: string) => {
    const name = currentCharacter.value.name || '';
    const baseScores = (currentCharacter.value.scores || DEFAULT_BASE_SCORES) as Record<
      string,
      number
    >;
    const className = currentCharacter.value.classes?.[0]?.name || 'Fighter';
    const raceMods = currentCharacter.value.race?.mods || {};
    const raceInfo = currentCharacter.value.race || undefined;
    const worldInfo = { world, worldId };
    const skillsList = (currentCharacter.value.skills || []).map(s => s.name);

    const newChar = DnDRulesService.prepareNewCharacter(
      name,
      baseScores,
      className,
      raceMods,
      raceInfo,
      worldInfo,
      skillsList,
    );
    currentCharacter.value = { ...currentCharacter.value, ...newChar } as any;
  };

  // Auto-fetch when route ID changes
  watch(
    currentCharacterId,
    async (id) => {
      if (typeof id === 'string' && id.length > 0) {
        currentCharacter.value = await store.fetchCharacterById(id);
      }
    },
    { immediate: true },
  );

  return {
    createCharacter,
    updateCharacter,
    getCharacterById,
    prepareForSave,
    currentCharacterId,
    currentCharacter,
  };
};

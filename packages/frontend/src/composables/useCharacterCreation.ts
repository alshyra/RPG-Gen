// No direct dependency on neighboring composable `useCharacter`.
// `useCharacterCreation` now accepts a `characterStore` as an argument to avoid
// composable-to-composable imports.
import type { CharacterDto, GenderDto, RaceDto } from '@rpg/shared';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

export const ALLOWED_RACES: readonly RaceDto[] = [
  { id: 'human', name: 'Humain', mods: { Str: 1, Dex: 1, Con: 1, Int: 1, Wis: 1, Cha: 1 } },
  { id: 'dwarf', name: 'Nain', mods: { Con: 2 } },
  { id: 'elf', name: 'Elfe', mods: { Dex: 2 } },
  { id: 'halfling', name: 'Halfelin', mods: { Dex: 2 } },
  { id: 'gnome', name: 'Gnome', mods: { Int: 2 } },
  { id: 'half-elf', name: 'Demi-elfe', mods: { Cha: 2 } },
  { id: 'half-orc', name: 'Demi-orc', mods: { Str: 2, Con: 1 } },
  { id: 'tiefling', name: 'Tieffelin', mods: { Cha: 2, Int: 1 } },
  { id: 'dragonborn', name: 'Drakéide', mods: { Str: 2, Cha: 1 } },
];

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

export const useCharacterCreation = (characterStore?: any) => {
  const route = useRoute();
  const store = characterStore;
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
    currentCharacterId,
    currentCharacter,
  };
};

import { ref, computed, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { characterService } from '../services/characterService';
import { DnDRulesService } from '../services/dndRulesService';

interface CreationRace {
  id: string;
  name: string;
  mods: Record<string, number>;
}

interface CreatedCharacter {
  name: string;
  race: CreationRace | null;
  scores: Record<string, number>;
  gender: 'male' | 'female';
  world?: string;
  worldId?: string;
  portrait?: string;
  id?: string;
  hp?: number;
  hpMax?: number;
  totalXp?: number;
  classes?: Array<{ name: string; level: number }>;
  proficiency?: number;
  [key: string]: any;
}

export const useCharacterCreation = (
  world?: string,
  worldId?: string,
  initialCharacter?: CreatedCharacter,
  creationMode: 'create' | 'levelup' = 'create'
) => {
  const router = useRouter();

  // Shared data structures
  const allowedRaces: CreationRace[] = [
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

  const classesList = [
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
  ];

  const genders = ['male', 'female'];
  const defaultRace =
    (allowedRaces.find(r => r.id === 'human') || allowedRaces[0]) as CreationRace;

  // Character state
  const character: Ref<CreatedCharacter> = ref(
    initialCharacter
      ? JSON.parse(JSON.stringify(initialCharacter))
      : { name: '', race: defaultRace, scores: {}, hp: 0, hpMax: 0, classes: [{ name: '', level: 1 }] }
  );

  const primaryClass = ref<string>(classesList[4]); // Fighter
  const secondaryClass = ref<string>('');
  const multiclass = ref<boolean>(false);
  const baseScores = ref<Record<string, number>>({
    Str: 15,
    Dex: 14,
    Con: 13,
    Int: 12,
    Wis: 10,
    Cha: 8,
  });
  const gender = ref<'male' | 'female'>(
    (initialCharacter?.gender as 'male' | 'female') || 'male'
  );
  const selectedSkills = ref<string[]>([]);

  // Computed properties
  const availableSkills = computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value));
  const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));
  const levelUpBudget = computed(() => creationMode === 'levelup' ? 2 : undefined);
  const levelUpInitial = computed(() => {
    if (creationMode === 'levelup') {
      return initialCharacter?.scores || character.value?.scores || {};
    }
    return undefined;
  });
  const proficiencyBonus = computed(() => 2);

  // Helper functions
  const generatePortraitPath = (className: string, raceId: string, genderStr: string): string => {
    try {
      const c = String(className || '').toLowerCase();
      const rId = String(raceId || 'human').toLowerCase();
      const g = String(genderStr || 'male').toLowerCase();
      const baseUrl =
        (import.meta as any).env && (import.meta as any).env.BASE_URL
          ? (import.meta as any).env.BASE_URL
          : '/';
      return `${baseUrl}images/${c}_${rId}_${g}.png`;
    } catch (e) {
      return '';
    }
  };

  const applyRacialAndCompute = (): void => {
    const race: CreationRace | null = character.value.race;
    const raceModifiers = race?.mods || {};

    const calculated = DnDRulesService.prepareNewCharacter(
      character.value.name || 'Unnamed',
      baseScores.value,
      primaryClass.value,
      raceModifiers,
      race,
      { world, worldId }
    );

    Object.assign(character.value, calculated);

    if (multiclass.value && secondaryClass.value) {
      if (!character.value.classes) character.value.classes = [];
      character.value.classes.push({ name: secondaryClass.value, level: 1 });
    }

    character.value.portrait = generatePortraitPath(
      primaryClass.value,
      race?.id || 'human',
      gender.value
    );
  };

  const finalizeCharacter = (skills?: string[]): CreatedCharacter => {
    // Set basic fields
    character.value.gender = gender.value;
    character.value.world = world;
    character.value.worldId = worldId;

    // Generate portrait
    character.value.portrait = generatePortraitPath(
      primaryClass.value,
      character.value.race?.id || 'human',
      gender.value
    );

    // Apply D&D rules
    const calculated = DnDRulesService.prepareNewCharacter(
      character.value.name || 'Unnamed',
      baseScores.value,
      primaryClass.value,
      character.value.race?.mods || {},
      character.value.race,
      { world, worldId },
      skills || []
    );

    return { ...character.value, ...calculated };
  };

  const saveCharacter = (): string => {
    if (world) character.value.world = world;
    if (worldId) character.value.worldId = worldId;
    character.value.gender = gender.value;

    return characterService.saveCharacter(character.value as any);
  };

  const applyAndSave = (): void => {
    applyRacialAndCompute();
    saveCharacter();
    router.push({ name: 'game', params: { world } });
  };

  const loadLatest = (): void => {
    const saved = characterService.getAllSavedCharacters();
    if (saved.length === 0) {
      window.alert('Aucun personnage sauvegardé');
      return;
    }
    const latest = saved[0].data;
    character.value = latest;
    primaryClass.value = latest.classes?.[0]?.name || primaryClass.value;
    secondaryClass.value = latest.classes?.[1]?.name || '';
    baseScores.value = { ...latest.scores };
  };

  const toggleMulticlass = (): void => {
    multiclass.value = !multiclass.value;
  };

  return {
    // State
    character,
    primaryClass,
    secondaryClass,
    multiclass,
    baseScores,
    gender,
    selectedSkills,
    // Computed
    allowedRaces,
    classesList,
    genders,
    availableSkills,
    skillsToChoose,
    levelUpBudget,
    levelUpInitial,
    proficiencyBonus,
    // Methods
    applyRacialAndCompute,
    finalizeCharacter,
    saveCharacter,
    applyAndSave,
    loadLatest,
    toggleMulticlass,
    generatePortraitPath,
  };
};

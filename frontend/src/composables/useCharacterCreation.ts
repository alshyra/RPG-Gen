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

const ALLOWED_RACES: CreationRace[] = [
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

const CLASSES_LIST = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const GENDERS = ['male', 'female'];
const DEFAULT_RACE = ALLOWED_RACES.find(r => r.id === 'human') || ALLOWED_RACES[0];
const DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };

const generatePortraitPath = (className: string, raceId: string, genderStr: string): string => {
  try {
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    return `${baseUrl}images/${String(className || '').toLowerCase()}_${String(raceId || 'human').toLowerCase()}_${String(genderStr || 'male').toLowerCase()}.png`;
  } catch {
    return '';
  }
};

const createMethods = (character: Ref<CreatedCharacter>, primaryClass: Ref<string>, secondaryClass: Ref<string>, multiclass: Ref<boolean>, baseScores: Ref<Record<string, number>>, gender: Ref<'male' | 'female'>, world?: string, worldId?: string) => {
  const applyRacialAndCompute = (): void => {
    const race = character.value.race;
    const calculated = DnDRulesService.prepareNewCharacter(character.value.name || 'Unnamed', baseScores.value, primaryClass.value, race?.mods || {}, race, { world, worldId });
    Object.assign(character.value, calculated);
    if (multiclass.value && secondaryClass.value) {
      if (!character.value.classes) character.value.classes = [];
      character.value.classes.push({ name: secondaryClass.value, level: 1 });
    }
    character.value.portrait = generatePortraitPath(primaryClass.value, character.value.race?.id || 'human', gender.value);
  };

  const finalizeCharacter = (skills?: string[]): CreatedCharacter => {
    character.value.gender = gender.value;
    character.value.world = world;
    character.value.worldId = worldId;
    character.value.portrait = generatePortraitPath(primaryClass.value, character.value.race?.id || 'human', gender.value);
    const calculated = DnDRulesService.prepareNewCharacter(character.value.name || 'Unnamed', baseScores.value, primaryClass.value, character.value.race?.mods || {}, character.value.race, { world, worldId }, skills || []);
    return { ...character.value, ...calculated };
  };

  const saveCharacter = (): string => {
    character.value.world = world;
    character.value.worldId = worldId;
    character.value.gender = gender.value;
    return characterService.saveCharacter(character.value as any);
  };

  const loadLatest = (): void => {
    const saved = characterService.getAllSavedCharacters();
    if (!saved.length) { window.alert('Aucun personnage sauvegardé'); return; }
    const latest = saved[0].data;
    character.value = { ...character.value, ...latest };
    primaryClass.value = latest.classes?.[0]?.name || primaryClass.value;
    secondaryClass.value = latest.classes?.[1]?.name || '';
    baseScores.value = { ...baseScores.value, ...latest.scores };
  };

  return { applyRacialAndCompute, finalizeCharacter, saveCharacter, loadLatest, toggleMulticlass: () => { multiclass.value = !multiclass.value; } };
};

export const useCharacterCreation = (world?: string, worldId?: string, initialCharacter?: CreatedCharacter, creationMode: 'create' | 'levelup' = 'create') => {
  const router = useRouter();
  const character = ref<CreatedCharacter>(initialCharacter ? JSON.parse(JSON.stringify(initialCharacter)) : { name: '', race: DEFAULT_RACE, scores: {}, hp: 0, hpMax: 0, classes: [{ name: '', level: 1 }] });
  const primaryClass = ref(CLASSES_LIST[4]);
  const secondaryClass = ref('');
  const multiclass = ref(false);
  const baseScores = ref({ ...DEFAULT_BASE_SCORES });
  const gender = ref<'male' | 'female'>((initialCharacter?.gender || 'male') as 'male' | 'female');
  const selectedSkills = ref<string[]>([]);
  const methods = createMethods(character, primaryClass, secondaryClass, multiclass, baseScores, gender, world, worldId);
  return { character, primaryClass, secondaryClass, multiclass, baseScores, gender, selectedSkills, allowedRaces: ALLOWED_RACES, classesList: CLASSES_LIST, genders: GENDERS, availableSkills: computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value)), skillsToChoose: computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value)), levelUpBudget: computed(() => creationMode === 'levelup' ? 2 : undefined), levelUpInitial: computed(() => (creationMode === 'levelup' ? (initialCharacter?.scores || character.value?.scores) : undefined)), proficiencyBonus: computed(() => 2), ...methods, applyAndSave: () => { methods.applyRacialAndCompute(); methods.saveCharacter(); router.push({ name: 'game', params: { world } }); }, generatePortraitPath };
};

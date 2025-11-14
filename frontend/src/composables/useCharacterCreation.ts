import { ref, computed, Ref } from "vue";
import { useRouter } from "vue-router";
import { characterServiceApi } from "../services/characterServiceApi";
import { DnDRulesService } from "../services/dndRulesService";

interface CreationRace {
  id: string;
  name: string;
  mods: Record<string, number>;
}

interface CreatedCharacter {
  name: string;
  race: CreationRace | null;
  scores: Record<string, number>;
  gender: "male" | "female";
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
  { id: "human", name: "Humain", mods: { Str: 1, Dex: 1, Con: 1, Int: 1, Wis: 1, Cha: 1 } },
  { id: "dwarf", name: "Nain", mods: { Con: 2 } },
  { id: "elf", name: "Elfe", mods: { Dex: 2 } },
  { id: "halfling", name: "Halfelin", mods: { Dex: 2 } },
  { id: "gnome", name: "Gnome", mods: { Int: 2 } },
  { id: "half-elf", name: "Demi-elfe", mods: { Cha: 2 } },
  { id: "half-orc", name: "Demi-orc", mods: { Str: 2, Con: 1 } },
  { id: "tiefling", name: "Tieffelin", mods: { Cha: 2, Int: 1 } },
  { id: "dragonborn", name: "Drakéide", mods: { Str: 2, Cha: 1 } },
];

const CLASSES_LIST = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];
const GENDERS = ["male", "female"];
const DEFAULT_RACE = ALLOWED_RACES[0];
const DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };

const generatePortraitPath = (className: string, raceId: string, genderStr: string): string => {
  try {
    const baseUrl = (import.meta as any).env?.BASE_URL || "/";
    return `${baseUrl}images/${String(className || "").toLowerCase()}_${String(
      raceId || "human"
    ).toLowerCase()}_${String(genderStr || "male").toLowerCase()}.png`;
  } catch {
    return "";
  }
};

const createMethods = (
  character: Ref<CreatedCharacter>,
  primaryClass: Ref<string>,
  secondaryClass: Ref<string>,
  multiclass: Ref<boolean>,
  baseScores: Ref<Record<string, number>>,
  gender: Ref<"male" | "female">,
  world?: string,
  worldId?: string
) => {
  const applyRacialAndCompute = (): void => {
    const race = character.value.race;
    const calculated = DnDRulesService.prepareNewCharacter(
      character.value.name || "Unnamed",
      baseScores.value,
      primaryClass.value,
      race?.mods || {},
      race,
      { world, worldId }
    );
    character.value = { ...character.value, ...calculated };
    if (multiclass.value && secondaryClass.value) {
      if (!character.value.classes) character.value.classes = [];
      character.value.classes.push({ name: secondaryClass.value, level: 1 });
    }
    character.value.portrait = generatePortraitPath(
      primaryClass.value,
      character.value.race?.id || "human",
      gender.value
    );
  };

  const finalizeCharacter = (skills?: string[]): CreatedCharacter => {
    character.value.gender = gender.value;
    character.value.world = world;
    character.value.worldId = worldId;
    character.value.portrait = generatePortraitPath(
      primaryClass.value,
      character.value.race?.id || "human",
      gender.value
    );
    const calculated = DnDRulesService.prepareNewCharacter(
      character.value.name || "Unnamed",
      baseScores.value,
      primaryClass.value,
      character.value.race?.mods || {},
      character.value.race,
      { world, worldId },
      skills || []
    );
    return { ...character.value, ...calculated };
  };

  const saveCharacter = async (): Promise<string> => {
    character.value.world = world;
    character.value.worldId = worldId;
    character.value.gender = gender.value;
    return await characterServiceApi.saveCharacter(character.value as any);
  };

  const loadLatest = async (): Promise<void> => {
    const saved = await characterServiceApi.getAllSavedCharacters();
    if (!saved.length) {
      window.alert("Aucun personnage sauvegardé");
      return;
    }
    const latest = saved[0].data;
    character.value = { ...character.value, ...latest };
    primaryClass.value = latest.classes?.[0]?.name || primaryClass.value;
    secondaryClass.value = latest.classes?.[1]?.name || "";
    baseScores.value = { ...baseScores.value, ...latest.scores };
  };

  return {
    applyRacialAndCompute,
    finalizeCharacter,
    saveCharacter,
    loadLatest,
    toggleMulticlass: () => {
      multiclass.value = !multiclass.value;
    },
  };
};

const initializeCharacterRefs = (initialCharacter?: CreatedCharacter) => ({
  character: ref<CreatedCharacter>(
    initialCharacter
      ? JSON.parse(JSON.stringify(initialCharacter))
      : {
          name: "",
          race: DEFAULT_RACE,
          scores: {},
          hp: 0,
          hpMax: 0,
          classes: [{ name: "", level: 1 }],
        }
  ),
  primaryClass: ref(CLASSES_LIST[4]),
  secondaryClass: ref(""),
  multiclass: ref(false),
  baseScores: ref({ ...DEFAULT_BASE_SCORES }),
  gender: ref<"male" | "female">((initialCharacter?.gender || "male") as "male" | "female"),
  selectedSkills: ref<string[]>([]),
  avatarDescription: ref(""),
  generatedAvatar: ref<string | null>(null),
  isGeneratingAvatar: ref(false),
});

const DRAFT_KEY = "rpg-character-draft";

const saveDraft = (state: {
  character: CreatedCharacter;
  primaryClass: string;
  secondaryClass: string;
  multiclass: boolean;
  baseScores: Record<string, number>;
  gender: "male" | "female";
  selectedSkills: string[];
  avatarDescription: string;
  generatedAvatar: string | null;
  world?: string;
  worldId?: string;
  currentStep?: number;
}): void => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save character draft:", e);
  }
};

const loadDraft = (): Omit<ReturnType<typeof initializeCharacterRefs>, never> | null => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    return {
      character: ref(data.character),
      primaryClass: ref(data.primaryClass),
      secondaryClass: ref(data.secondaryClass),
      multiclass: ref(data.multiclass),
      baseScores: ref(data.baseScores),
      gender: ref(data.gender),
      selectedSkills: ref(data.selectedSkills),
      avatarDescription: ref(data.avatarDescription),
      generatedAvatar: ref(data.generatedAvatar),
      isGeneratingAvatar: ref(false),
    };
  } catch (e) {
    console.error("Failed to load character draft:", e);
    return null;
  }
};

const getDraftCurrentStep = (): number => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return 0;
    const data = JSON.parse(saved);
    return data.currentStep ?? 0;
  } catch (e) {
    return 0;
  }
};

const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error("Failed to clear character draft:", e);
  }
};

export const useCharacterCreation = (
  world?: string,
  worldId?: string,
  initialCharacter?: CreatedCharacter,
  creationMode: "create" | "levelup" = "create"
) => {
  const router = useRouter();

  // Try to load draft if in create mode (not levelup)
  const draftRefs = creationMode === "create" ? loadDraft() : null;

  const {
    character,
    primaryClass,
    secondaryClass,
    multiclass,
    baseScores,
    gender,
    selectedSkills,
    avatarDescription,
    generatedAvatar,
    isGeneratingAvatar,
  } = draftRefs || initializeCharacterRefs(initialCharacter);

  const methods = createMethods(
    character,
    primaryClass,
    secondaryClass,
    multiclass,
    baseScores,
    gender,
    world,
    worldId
  );

  // Auto-save draft when creation state changes (debounced)
  const draftState = computed(() => ({
    character: character.value,
    primaryClass: primaryClass.value,
    secondaryClass: secondaryClass.value,
    multiclass: multiclass.value,
    baseScores: baseScores.value,
    gender: gender.value,
    selectedSkills: selectedSkills.value,
    avatarDescription: avatarDescription.value,
    generatedAvatar: generatedAvatar.value,
    world,
    worldId,
  }));

  // No more auto-watch - we'll save on demand from components
  // This avoids the arrow function size issue and makes saves more explicit

  const applyAndSave = async () => {
    methods.applyRacialAndCompute();
    // If we have a generated avatar, use it; otherwise keep the portrait path
    if (generatedAvatar.value) {
      character.value.portrait = generatedAvatar.value;
    }
    await methods.saveCharacter();
    clearDraft(); // Clear draft after successful save
    router.push({ name: "game", params: { world } });
  };

  const saveDraftWithStep = (currentStep: number): void => {
    const fullDraftState = {
      ...draftState.value,
      currentStep,
    };
    saveDraft(fullDraftState);
  };

  const saveDraftNow = (): void => {
    saveDraft(draftState.value);
  };

  return {
    character,
    primaryClass,
    secondaryClass,
    multiclass,
    baseScores,
    gender,
    selectedSkills,
    avatarDescription,
    generatedAvatar,
    isGeneratingAvatar,
    allowedRaces: ALLOWED_RACES,
    classesList: CLASSES_LIST,
    genders: GENDERS,
    availableSkills: computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value)),
    skillsToChoose: computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value)),
    levelUpBudget: computed(() => (creationMode === "levelup" ? 2 : undefined)),
    levelUpInitial: computed(() =>
      creationMode === "levelup" ? initialCharacter?.scores || character.value?.scores : undefined
    ),
    proficiencyBonus: computed(() => 2),
    ...methods,
    applyAndSave,
    generatePortraitPath,
    clearDraft, // Export clear function for manual cleanup if needed
    getDraftCurrentStep, // Export to restore step on refresh
    saveDraftWithStep, // Export to save step when navigating
    saveDraftNow, // Export to save draft on demand from components
  };
};

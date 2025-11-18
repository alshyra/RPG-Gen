<template>
  <div class="p-2 lg:p-4 rounded-md max-w-4xl mx-auto h-full overflow-y-auto">
    <!-- Header with restore draft button -->
    <div class="flex justify-between mb-3 lg:mb-4">
      <div class="flex-1">
        <h2 class="text-base lg:text-lg font-semibold">
          Création de personnage
        </h2>
      </div>
    </div>

    <!-- Progress indicator - compact on mobile -->
    <div class="flex justify-between mb-4 lg:mb-8">
      <div
        v-for="(s, i) in steps"
        :key="i"
        :class="['flex-1 text-center pb-2 px-1 lg:px-2', i <= currentStep ? 'border-b-2 border-indigo-600' : 'border-b border-slate-600']"
      >
        <div
          :class="['text-xs lg:text-base font-medium', i === currentStep ? 'text-indigo-400' : i < currentStep ? 'text-green-400' : 'text-slate-500']"
        >
          <span class="hidden sm:inline">{{ s }}</span>
          <span class="sm:hidden">{{ i + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Steps -->
    <StepBasicInfo
      v-if="currentStep === 0"
      :character="character"
      :gender="gender"
      :world="world"
      :genders="genders"
      @update:character="updateCharacter($event); saveDraftNow()"
      @update:gender="(g: any) => { gender = g; saveDraftNow(); }"
    />

    <StepRaceClass
      v-if="currentStep === 1"
      :character="character"
      :primary-class="primaryClass"
      :allowed-races="allowedRaces"
      :class-list="classesList"
      @update:character="updateCharacter($event); saveDraftNow()"
      @update:primary-class="primaryClass = $event; saveDraftNow()"
    />

    <StepAbilityScores
      v-if="currentStep === 2"
      :base-scores="baseScores"
      @update:base-scores="(scores: any) => { baseScores = scores; saveDraftNow(); }"
    />

    <StepSkills v-if="currentStep === 3" />

    <StepAvatar
      v-if="currentStep === 4"
      :is-generating="isGeneratingAvatar"
    />

    <!-- Navigation buttons -->
    <div class="flex justify-end gap-2 mt-4 lg:mt-6 sticky bottom-0 bg-slate-900/95 py-3 -mx-2 px-2 lg:mx-0 lg:px-0 lg:bg-transparent lg:static">
      <UiButton
        variant="ghost"
        :disabled="currentStep === 0"
        @click="previousStep"
      >
        Retour
      </UiButton>
      <UiButton
        v-if="currentStep < steps.length - 1"
        variant="primary"
        :disabled="!canProceed"
        @click="nextStep"
      >
        Suivant
      </UiButton>
      <UiButton
        v-if="currentStep === steps.length - 1"
        variant="primary"
        @click="finishCreation"
      >
        Terminer
      </UiButton>
    </div>

    <!-- Character Preview - collapsible on mobile -->
    <details class="mt-4 lg:mt-8">
      <summary class="cursor-pointer p-3 lg:p-4 bg-slate-900 rounded border border-slate-700 hover:bg-slate-800 transition-colors">
        <span class="font-bold">Aperçu du personnage</span>
      </summary>
      <CharacterPreview
        :character="character"
        :gender="gender"
        :primary-class="primaryClass"
        :base-scores="baseScores"
        :selected-skills="selectedSkills"
        :current-step="currentStep"
      />
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import UiButton from '../ui/UiButton.vue';
import StepBasicInfo from './steps/StepBasicInfo.vue';
import StepRaceClass from './steps/StepRaceClass.vue';
import StepAbilityScores from './steps/StepAbilityScores.vue';
import StepSkills from './steps/StepSkills.vue';
import StepAvatar from './steps/StepAvatar.vue';
import CharacterPreview from './CharacterPreview.vue';
import { useCharacterCreation } from '../../composables/useCharacterCreation';

const props = defineProps<{ world?: string; worldId?: string }>();
const router = useRouter();
const route = useRoute();

const steps = ['Informations', 'Race & Classe', 'Capacités', 'Compétences', 'Avatar'];

// Use character creation composable
const {
  character,
  primaryClass,
  baseScores,
  gender,
  selectedSkills,
  physicalDescription,
  generatedAvatar,
  isGeneratingAvatar,
  allowedRaces,
  classesList,
  genders,
  availableSkills,
  skillsToChoose,
  applyRacialAndCompute,
  applyAndSave,
  saveCharacter,
} = useCharacterCreation(props.world, props.worldId);

const currentStep = computed({
  get: () => {
    const routeStep = parseInt(route.params.step as string, 10);
    return Math.min(routeStep - 1, steps.length - 1);
  },
  set: (value: number) => {
    router.push({ name: 'character-step', params: { step: value + 1 } });
  },
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return character.value.name?.trim();
    case 1:
      return character.value.race && primaryClass.value;
    case 2:
      return true;
    case 3:
      return selectedSkills.value.length === skillsToChoose.value;
    case 4:
      return true;
    default:
      return false;
  }
});

const nextStep = async () => {
  if (currentStep.value >= steps.length - 1) return;

  currentStep.value++;

  // Auto-generate avatar when entering the avatar step (step 4)
  if (currentStep.value === 4 && physicalDescription.value.trim() && !generatedAvatar.value) {
    await generateAvatar();
  }
};

const previousStep = () => {
  if (currentStep.value <= 0) return;

  currentStep.value--;
};

const updateCharacter = (updates: Record<string, unknown>) => character.value = { ...character.value, ...updates };

const requestAvatar = async (charId: string) => {
  // New API: POST /api/image/:characterId/generate-avatar — server will fetch saved character and description
  const response = await axios.post(`/api/image/${charId}/generate-avatar`);

  generatedAvatar.value = response.data.imageUrl;
};

const persistPhysicalDescription = async () => {
  // Ensure computed fields are applied before persisting
  applyRacialAndCompute();
  character.value.physicalDescription = physicalDescription.value;
  const charId = await saveCharacter();
  (character.value as any).characterId = charId;
  return charId;
};

const requestAndApplyAvatar = async (charId: string) => {
  await requestAvatar(charId);
  if (generatedAvatar.value) {
    character.value.portrait = generatedAvatar.value;
    await saveCharacter();
    saveDraftNow();
  }
};

const generateAvatar = async () => {
  if (!physicalDescription.value.trim()) return;

  isGeneratingAvatar.value = true;
  try {
    // Persist the description and computed fields and get the server id
    const charId = await persistPhysicalDescription();
    if (!charId) throw new Error('Failed to save character before avatar generation');
    await requestAndApplyAvatar(charId);
  } catch (error) {
    console.error('Avatar generation error:', error);
  } finally {
    isGeneratingAvatar.value = false;
  }
};

const finishCreation = async () => {
  if (physicalDescription.value.trim() && !generatedAvatar.value && !isGeneratingAvatar.value) {
    await generateAvatar();
  }
  await applyAndSave();
};
</script>

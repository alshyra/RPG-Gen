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
    <StepBasicInfo v-if="currentStep === 0" />

    <StepRaceClass v-if="currentStep === 1" />

    <StepAbilityScores v-if="currentStep === 2" />

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
import { DnDRulesService } from '@/services/dndRulesService';
// AbilityScoresDto unused in the wizard; individual steps use it instead
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DEFAULT_BASE_SCORES, useCharacterCreation } from '../../composables/useCharacterCreation';
import { useWizardStore } from '@/composables/useWizardStore';
import UiButton from '../ui/UiButton.vue';
import CharacterPreview from './CharacterPreview.vue';
import StepAbilityScores from './steps/StepAbilityScores.vue';
import StepAvatar from './steps/StepAvatar.vue';
import StepBasicInfo from './steps/StepBasicInfo.vue';
import StepRaceClass from './steps/StepRaceClass.vue';
import StepSkills from './steps/StepSkills.vue';

const props = defineProps<{ world?: string; worldId?: string }>();
const router = useRouter();
const route = useRoute();

const steps = ['Informations', 'Race & Classe', 'Capacités', 'Compétences', 'Avatar'];

// Use character creation composable
const { currentCharacter, prepareForSave } = useCharacterCreation();

// Small local adapters to match the older API the Wizard expects
const character = currentCharacter;
const primaryClass = computed(() => currentCharacter.value.classes?.[0]?.name || '');
const baseScores = computed(() => currentCharacter.value.scores || DEFAULT_BASE_SCORES);
const gender = computed(() => (currentCharacter.value.gender || ''));
const selectedSkills = computed(() => (currentCharacter.value.skills || []).map(s => s.name));
const isGeneratingAvatar = ref(false);
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

const wizard = useWizardStore();
const currentStep = computed({
  get: () => Math.min(wizard.currentStep - 1, steps.length - 1),
  set: (value: number) => wizard.setStep(value + 1),
});

const routeStepInit = parseInt(route.params.step as string, 10);
if (!isNaN(routeStepInit) && routeStepInit >= 1 && routeStepInit <= steps.length) {
  wizard.setStep(routeStepInit);
}

watch(
  () => wizard.currentStep,
  (val: number) => router.push({ name: 'character-step', params: { step: val } }),
);

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
  if (wizard.currentStep >= steps.length) return;
  wizard.next();
};

const previousStep = () => {
  if (wizard.currentStep <= 1) return;
  wizard.prev();
};

const finishCreation = async () =>
  prepareForSave(props.world, props.worldId);

</script>

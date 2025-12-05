<template>
  <div class="p-2 lg:p-4 rounded-md max-w-4xl mx-auto h-full flex flex-col max-h-screen overflow-hidden">
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

    <!-- Loading states: show a full-page overlay for finalizing creation, otherwise a small inline loader while fetching -->
    <FullPageLoader
      v-if="isLoading"
      :title="loadingTitle"
      :subtitle="loadingSubtitle"
    />

    <div
      v-else-if="route.params.characterId && !currentCharacter"
      class="py-16"
    >
      <UiLoader />
    </div>

    <!-- Steps -->
    <div class="flex-1 overflow-auto">
      <div class="h-full">
        <div class="h-full">
          <StepBasicInfo v-if="currentStep === 0" />
        </div>
        <div class="h-full">
          <StepAbilityScores v-if="currentStep === 1" />
        </div>
        <div class="h-full">
          <StepSkills v-if="currentStep === 2" />
        </div>
        <div class="h-full">
          <StepSpells v-if="currentStep === 3" />
        </div>
        <div class="h-full">
          <StepInventory v-if="currentStep === 4" />
        </div>
        <div class="h-full">
          <StepAvatar v-if="currentStep === 5" />
        </div>
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="flex justify-end gap-2 mt-4 lg:mt-6 fixed bottom-0 left-0 right-0 bg-slate-900/95 py-3 px-2 lg:px-4 z-10">
      <div class="max-w-4xl w-full mx-auto flex justify-end gap-2">
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
          :is-loading="isLoading"
          :disabled="isLoading"
          @click="finishCreation"
        >
          Terminer
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FullPageLoader from '@/components/ui/FullPageLoader.vue';
import { characterApi } from '@/apis/characterApi';
import { conversationService } from '@/apis/conversationApi';
import { DnDRulesService } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import {
  computed, ref,
} from 'vue';
import {
  useRoute, useRouter,
} from 'vue-router';
import UiButton from '../ui/UiButton.vue';
import UiLoader from '../ui/UiLoader.vue';
import StepAbilityScores from './steps/StepAbilityScores.vue';
import StepAvatar from './steps/StepAvatar.vue';
import StepBasicInfo from './steps/StepBasicInfo.vue';
import StepInventory from './steps/StepInventory.vue';
import StepSpells from './steps/StepSpells.vue';
import StepSkills from './steps/StepSkills.vue';

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const loadingTitle = ref('');
const loadingSubtitle = ref('');
const steps = [
  'Informations',
  'Classe et Capacités',
  'Compétences',
  'Sorts',
  'Inventaire',
  'Avatar',
];

const characterStore = useCharacterStore();
const { updateCharacter } = characterStore;
const { currentCharacter } = storeToRefs(characterStore);
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(currentCharacter.value?.classes?.[0]?.name || ''));

// Get current step from route, or from draft if no route param
const currentStep = computed({
  get: () => {
    const routeStep = parseInt(route.params.step as string, 10);
    if (isNaN(routeStep)) return 0;

    return Math.min(routeStep - 1, steps.length - 1);
  },
  set: (value: number) => {
    const charId = (route.params.characterId as string) || currentCharacter.value?.characterId;
    router.push({
      name: 'character-step',
      params: {
        characterId: charId,
        step: value + 1,
      },
    });
  },
});

const chosenSkills = computed(() => (currentCharacter.value?.skills || [])
  .filter(skill => !!skill.proficient).length || 0);

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return currentCharacter.value?.name?.trim();
    case 1:
      return currentCharacter.value?.race && currentCharacter.value?.classes?.[0];
    case 2:
      return chosenSkills.value === skillsToChoose.value;
    case 3:
      return true;
    case 4:
      return true;
    case 5:
      return true;
    default:
      return false;
  }
});

const nextStep = async () => {
  if (currentStep.value >= steps.length - 1) return;
  currentStep.value++;
};

const previousStep = () => {
  if (currentStep.value <= 0) return;
  currentStep.value--;
};

// --- helper functions extracted from finishCreation for readability ---
const saveFinalCharacter = async () => {
  console.log('Finishing character creation for', currentCharacter.value);
  if (!currentCharacter.value
    || !currentCharacter.value.classes?.[0].name
    || !currentCharacter.value.scores?.Con
  ) return;
  const hpMax = DnDRulesService.calculateHpForLevel1(currentCharacter.value.classes[0].name, currentCharacter.value.scores.Con);
  await updateCharacter(currentCharacter.value.characterId, {
    ...currentCharacter.value,
    state: 'created',
    hpMax,
    hp: hpMax,
    skills: currentCharacter.value.skills,
    spells: currentCharacter.value.spells,
    ...(currentCharacter.value.inventory ? { inventory: currentCharacter.value.inventory } : {}),
  });
};

const generateAndApplyAvatar = async () => {
  try {
    const imageUrl = await characterApi.generateAvatar(currentCharacter.value!.characterId);
    try {
      const refreshed = await characterApi.getCharacterById(currentCharacter.value!.characterId);
      if (refreshed) currentCharacter.value = refreshed;
      else currentCharacter.value!.portrait = imageUrl;
    } catch {
      currentCharacter.value!.portrait = imageUrl;
    }
  } catch (e) {
    console.warn('Avatar generation failed — continuing to game', e);
  }
};

const initConversationForCharacter = async () => {
  try {
    loadingTitle.value = 'Création de l\'univers...';
    loadingSubtitle.value = 'Préparation du premier prompt du Maître de Jeu...';
    if (currentCharacter.value) await conversationService.startGame(currentCharacter.value);
  } catch (e) {
    console.warn('Failed to initialize conversation/history', e);
  }
};

const navigateToGame = async () => {
  await router.push({
    name: 'game',
    params: { characterId: currentCharacter.value!.characterId },
  });
};

const finishCreation = async () => {
  if (!currentCharacter.value
    || !currentCharacter.value.classes?.[0].name
    || !currentCharacter.value.scores?.Con
  ) return;

  isLoading.value = true;
  loadingTitle.value = 'Invocation de votre avatar...';
  loadingSubtitle.value = 'Génération de l\'image et préparation du monde de jeu...';

  await saveFinalCharacter();
  await generateAndApplyAvatar();
  await initConversationForCharacter();
  await navigateToGame();

  isLoading.value = false;
};

</script>

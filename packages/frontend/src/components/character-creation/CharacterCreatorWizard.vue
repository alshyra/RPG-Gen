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
    <StepBasicInfo v-if="currentStep === 0" />

    <StepRaceClass v-if="currentStep === 1" />

    <StepAbilityScores v-if="currentStep === 2" />

    <StepSkills v-if="currentStep === 3" />

    <StepInventory v-if="currentStep === 4" />

    <StepAvatar v-if="currentStep === 5" />

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
        :is-loading="isLoading"
        :disabled="isLoading"
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
      <CharacterPreview />
    </details>
  </div>
</template>

<script setup lang="ts">
import { characterServiceApi } from '@/services/characterServiceApi';
import { conversationService } from '@/services/conversationService';
import { DnDRulesService } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import UiButton from '../ui/UiButton.vue';
import UiLoader from '../ui/UiLoader.vue';
import CharacterPreview from './CharacterPreview.vue';
import FullPageLoader from '@/components/ui/FullPageLoader.vue';
import StepAbilityScores from './steps/StepAbilityScores.vue';
import StepAvatar from './steps/StepAvatar.vue';
import StepBasicInfo from './steps/StepBasicInfo.vue';
import StepInventory from './steps/StepInventory.vue';
import StepRaceClass from './steps/StepRaceClass.vue';
import StepSkills from './steps/StepSkills.vue';

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const loadingTitle = ref('');
const loadingSubtitle = ref('');
const steps = ['Informations', 'Race & Classe', 'Capacités', 'Compétences', 'Inventaire', 'Avatar'];

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
    router.push({ name: 'character-step', params: { characterId: charId, step: value + 1 } });
  },
});

const chosenSkills = computed(() => (currentCharacter.value?.skills || []).filter(skill => !!skill.proficient).length || 0);

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return currentCharacter.value?.name?.trim();
    case 1:
      return currentCharacter.value?.race && currentCharacter.value?.classes?.[0];
    case 2:
      return true;
    case 3:
      return chosenSkills.value === skillsToChoose.value;
    case 4:
      // Inventory is optional during creation — allow proceeding
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
  const hpMax = DnDRulesService.calculateHpForLevel1(currentCharacter.value!.classes![0].name!, currentCharacter.value!.scores!.Con!);
  await updateCharacter(currentCharacter.value!.characterId, {
    ...currentCharacter.value,
    state: 'created',
    hpMax,
    hp: hpMax,
    skills: currentCharacter.value!.skills,
    ...(currentCharacter.value!.inventory ? { inventory: currentCharacter.value!.inventory } : {}),
  });
};

const generateAndApplyAvatar = async () => {
  try {
    const imageUrl = await characterServiceApi.generateAvatar(currentCharacter.value!.characterId);
    console.log('Avatar generated');
    try {
      const refreshed = await characterServiceApi.getCharacterById(currentCharacter.value!.characterId);
      if (refreshed) currentCharacter.value = refreshed as any;
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
  await router.push({ name: 'game', params: { characterId: currentCharacter.value!.characterId } });
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

<template>
  <div
    class="p-2 lg:p-4 rounded-md max-w-4xl mx-auto h-full flex flex-col max-h-[calc(100vh-120px)] overflow-hidden"
  >
    <!-- Header with restore draft button -->
    <div class="flex justify-between mb-3 lg:mb-4">
      <div class="flex-1">
        <h2 class="text-base lg:text-lg font-semibold">Création de personnage</h2>
      </div>
    </div>

    <!-- Progress indicator - compact on mobile -->
    <div class="flex justify-between mb-4 lg:mb-8">
      <div
        v-for="(s, i) in steps"
        :key="i"
        :class="[
          'flex-1 text-center pb-2 px-1 lg:px-2',
          i <= currentStep ? 'border-b-2 border-indigo-600' : 'border-b border-slate-600',
        ]"
      >
        <div
          :class="[
            'text-xs lg:text-base font-medium',
            i === currentStep
              ? 'text-indigo-400'
              : i < currentStep
                ? 'text-green-400'
                : 'text-slate-500',
          ]"
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

    <!-- Steps - Simplified 4-step flow -->
    <div class="flex-1 overflow-auto">
      <div class="h-full">
        <!-- Step 1: Basic Info (name, gender) -->
        <div class="h-full">
          <StepBasicInfo v-if="currentStep === 0" />
        </div>
        <!-- Step 2: Race Selection -->
        <div class="h-full">
          <StepRaceSelection v-if="currentStep === 1" />
        </div>
        <!-- Step 3: Class Selection (visual cards with auto inventory) -->
        <div class="h-full">
          <StepClassSelection v-if="currentStep === 2" />
        </div>
        <!-- Step 4: Avatar -->
        <div class="h-full">
          <StepAvatar v-if="currentStep === 3" />
        </div>
      </div>
    </div>

    <!-- Navigation buttons -->
    <div
      class="flex justify-end gap-2 mt-4 lg:mt-6 fixed bottom-0 left-0 right-0 bg-slate-900/95 py-3 px-2 lg:px-4 z-10"
    >
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
import { useCharacterId } from "@/composables/useCharacterId";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCharacter, useChat, useImage } from "@rpg-gen/api-client";
import { FullPageLoader, UiButton, UiLoader } from "@rpg-gen/ui";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import StepAvatar from "./steps/StepAvatar.vue";
import StepBasicInfo from "./steps/StepBasicInfo.vue";
import StepRaceSelection from "./steps/StepRaceSelection.vue";
import StepClassSelection from "./steps/StepClassSelection.vue";

const router = useRouter();
const route = useRoute();

const isLoading = ref(false);
const loadingTitle = ref("");
const loadingSubtitle = ref("");

// Simplified 4-step flow (Info -> Race -> Class -> Avatar)
const steps = [
  "Informations",
  "Race",
  "Classe",
  "Avatar",
];

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const chat = useChat(characterId.value, { enabled: false }); // Disable history query during creation
const image = useImage();
const { update, character } = useCharacter(characterId);

// Get current step from route, or from draft if no route param
const currentStep = computed({
  get: () => {
    const routeStep = parseInt(route.params.step as string, 10);
    if (isNaN(routeStep)) return 0;

    return Math.min(routeStep - 1, steps.length - 1);
  },
  set: (value: number) => {
    const charId = (route.params.characterId as string) || currentCharacter?.value?.characterId;
    router.push({
      name: "character-step",
      params: {
        characterId: charId,
        step: value + 1,
      },
    });
  },
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      // Step 1: Name is required
      return currentCharacter?.value?.name?.trim();
    case 1:
      // Step 2: Race must be selected
      return !!currentCharacter?.value?.raceId;
    case 2:
      // Step 3: Class must be selected
      return !!currentCharacter?.value?.className;
    case 3:
      // Step 4: Avatar - always can proceed
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
  console.log("Finishing character creation for", currentCharacter);
  if (!currentCharacter || !currentCharacter?.value?.className) return;
  
  // In the new system, HP is already set by selectClass API
  // We just need to mark the character as created
  await update.mutateAsync({
    ...currentCharacter.value,
    state: "created",
  });
};

const generateAndApplyAvatar = async () => {
  try {
    if (!currentCharacter?.value?.characterId) return;
    await image.generateAvatar.mutateAsync({ characterId: currentCharacter.value.characterId });
    // Refetch character to get the updated portrait
    await character.refetch();
  } catch (e) {
    console.warn("Avatar generation failed — continuing to game", e);
  }
};

const initConversationForCharacter = async () => {
  try {
    loadingTitle.value = "Création de l'univers...";
    loadingSubtitle.value = "Préparation du premier prompt du Maître de Jeu...";
    if (currentCharacter?.value?.characterId) {
      await chat.history.refetch();
    }
  } catch (e) {
    console.warn("Failed to initialize conversation/history", e);
  }
};

const navigateToGame = async () => {
  if (!currentCharacter?.value?.characterId) return;
  await router.push({
    name: "game",
    params: { characterId: currentCharacter.value.characterId },
  });
};

const finishCreation = async () => {
  if (!currentCharacter || !currentCharacter?.value?.className) return;

  isLoading.value = true;
  loadingTitle.value = "Invocation de votre avatar...";
  loadingSubtitle.value = "Génération de l'image et préparation du monde de jeu...";

  // Generate avatar BEFORE finalizing character state
  // CharacterResponseDto requires a portrait, so we must set it first
  await generateAndApplyAvatar();
  await saveFinalCharacter();
  await initConversationForCharacter();
  await navigateToGame();

  isLoading.value = false;
};
</script>

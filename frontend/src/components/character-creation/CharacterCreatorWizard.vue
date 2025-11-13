<template>
  <div class="p-4 rounded-md max-w-4xl mx-auto">
    <!-- Progress indicator -->
    <div class="flex justify-between mb-8">
      <div
        v-for="(s, i) in steps"
        :key="i"
        :class="['flex-1 text-center pb-2 px-2', i <= currentStep ? 'border-b-2 border-indigo-600' : 'border-b border-slate-600']"
      >
        <div
          :class="['font-medium', i === currentStep ? 'text-indigo-400' : i < currentStep ? 'text-green-400' : 'text-slate-500']"
        >
          {{ s }}
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
      @update:character="character = $event"
      @update:gender="(g: any) => gender = g"
    />

    <StepRaceClass
      v-if="currentStep === 1"
      :character="character"
      :primary-class="primaryClass"
      :allowed-races="allowedRaces"
      :class-list="classesList"
      @update:character="Object.assign(character, $event)"
      @update:primary-class="primaryClass = $event"
    />

    <StepAbilityScores
      v-if="currentStep === 2"
      :base-scores="baseScores"
      @update:base-scores="(scores: any) => Object.assign(baseScores, scores)"
    />

    <StepSkills
      v-if="currentStep === 3"
      :primary-class="primaryClass"
      :selected-skills="selectedSkills"
      :available-skills="availableSkills"
      :skills-to-choose="skillsToChoose"
      @update:selected-skills="selectedSkills = $event"
    />

    <StepAvatar
      v-if="currentStep === 4"
      :character="character"
      :gender="gender"
      :primary-class="primaryClass"
      :generated-avatar="generatedAvatar"
      :is-generating="isGeneratingAvatar"
      :avatar-description="avatarDescription"
      @update:avatar-description="avatarDescription = $event"
      @generate="generateAvatar"
      @regenerate="regenerateAvatar"
    />

    <!-- Navigation buttons -->
    <div class="flex justify-end gap-2 mt-6">
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

    <!-- Character Preview -->
    <CharacterPreview
      :character="character"
      :gender="gender"
      :primary-class="primaryClass"
      :base-scores="baseScores"
      :selected-skills="selectedSkills"
      :current-step="currentStep"
    />
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

// Get current step from route, default to 0
const currentStep = computed({
  get: () => {
    const step = parseInt(route.params.step as string, 10);
    return isNaN(step) ? 0 : Math.min(step - 1, steps.length - 1);
  },
  set: (value: number) => {
    router.push({ name: 'character-step', params: { world: props.world, step: value + 1 } });
  }
});

// Use character creation composable
const {
  character,
  primaryClass,
  baseScores,
  gender,
  selectedSkills,
  avatarDescription,
  generatedAvatar,
  isGeneratingAvatar,
  allowedRaces,
  classesList,
  genders,
  availableSkills,
  skillsToChoose,
  applyAndSave
} = useCharacterCreation(props.world, props.worldId);

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

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

async function generateAvatar() {
  if (!avatarDescription.value.trim()) return;

  isGeneratingAvatar.value = true;
  try {
    const response = await axios.post('/api/image/generate-avatar', {
      character: {
        name: character.value.name,
        gender: gender.value,
        race: character.value.race,
        classes: [{ name: primaryClass.value }]
      },
      description: avatarDescription.value
    });

    generatedAvatar.value = response.data.imageUrl;
  } catch (error) {
    console.error('Avatar generation error:', error);
  } finally {
    isGeneratingAvatar.value = false;
  }
}

function regenerateAvatar() {
  generatedAvatar.value = null;
  generateAvatar();
}

function finishCreation() {
  applyAndSave();
}
</script>

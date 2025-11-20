import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWizard = defineStore('wizard', () => {
  const currentStep = ref(1);
  const totalSteps = ref(5);

  const next = () => {
    if (currentStep.value < totalSteps.value) currentStep.value += 1;
  };
  const prev = () => {
    if (currentStep.value > 1) currentStep.value -= 1;
  };

  return {
    currentStep,
    totalSteps,
    next,
    prev,
  };
});

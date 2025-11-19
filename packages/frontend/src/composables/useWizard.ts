import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWizard = defineStore('wizard', () => {
  const currentStep = ref(1);
  const totalSteps = ref(5);
  const form = ref({
    name: '',
    gender: '',
    race: '',
    class: '',
    abilities: {},
    skills: {},
    avatar: null,
  });

  function setStep(s: number) {
    if (s >= 1 && s <= totalSteps.value) currentStep.value = s;
  }
  function next() {
    if (currentStep.value < totalSteps.value) currentStep.value += 1;
  }
  function prev() {
    if (currentStep.value > 1) currentStep.value -= 1;
  }

  function setFormPartial(partial: Partial<typeof form.value>) {
    form.value = { ...form.value, ...partial };
  }

  function updateBasicInfo(payload: { name?: string; gender?: string }) {
    setFormPartial(payload);
  }

  return { currentStep, totalSteps, form, setStep, next, prev, setFormPartial, updateBasicInfo };
});

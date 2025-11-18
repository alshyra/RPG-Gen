```vue
<template>
  <form @submit.prevent="onSubmit">
    <!-- Form fields for character creation -->
    <UiButton variant="primary" type="submit">Suivant</UiButton>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWizardStore } from '@/composables/wizardStore';

const wizard = useWizardStore();

// initialize local inputs from store state so component is re-entrant
const name = ref(wizard.form.name ?? '');
const gender = ref(wizard.form.gender ?? 'male');

function onSubmit() {
  // instead of emitting a "save" or "next" event, write to the store
  wizard.updateBasicInfo({ name: name.value, gender: gender.value });

  // navigation handled by the wizard store (no parent event required)
  wizard.next();
}
</script>
```
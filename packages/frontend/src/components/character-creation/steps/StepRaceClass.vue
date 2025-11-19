<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Race et Classe
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Race</label>
        <RacePicker :character-store="props.characterStore" />
      </div>

      <div>
        <label class="block font-medium mb-2">Classe</label>
        <UiSelect
          :model-value="currentCharacter.classes?.[0]?.name || ''"
          @update:model-value="updateCharacter({ classes: [{ name: $event, level: 1 }] })"
        >
          <option
            v-for="availableClass in CLASSES_LIST"
            :key="availableClass"
            :value="availableClass"
          >
            {{ availableClass }}
          </option>
        </UiSelect>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RacePicker from '../RacePicker.vue';
import UiSelect from '../../ui/UiSelect.vue';
// receive characterStore from parent wizard to avoid importing neighboring composables
import { CLASSES_LIST, useCharacterCreation } from '@/composables/useCharacterCreation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ characterStore: any }>();
const { currentCharacter } = useCharacterCreation(props.characterStore);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateCharacter = (newCharacter: Partial<Record<string, unknown>>) => (props.characterStore as any).updateCharacter(newCharacter);
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Race et Classe
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Race</label>
        <RacePicker
          :model-value="currentCharacter.race"
          :allowed-races="allowedRaces"
          @update:race="(race: Race | null) => onRaceUpdate(race)"
        />
      </div>

      <div>
        <label class="block font-medium mb-2">Classe</label>
        <UiSelect
          :model-value="currentCharacter.classes?.[0]?.name || ''"
          @update:model-value="updateClass"
        >
          <option
            v-for="c in classList"
            :key="c"
            :value="c"
          >
            {{ c }}
          </option>
        </UiSelect>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterDto as CharacterDto, RaceDto as Race } from '@rpg/shared';
import RacePicker from '../RacePicker.vue';
import UiSelect from '../../ui/UiSelect.vue';

import { useCharacterCreation, ALLOWED_RACES, CLASSES_LIST } from '@/composables/useCharacterCreation';
import { computed } from 'vue';

const { currentCharacter } = useCharacterCreation();

const allowedRaces = computed(() => ALLOWED_RACES as unknown as Race[]);
const classList = computed(() => CLASSES_LIST as unknown as string[]);

// This step is autonomous and relies on the composable to share state with the wizard

const updateCharacter = (newCharacter: Partial<CharacterDto>) => {
  currentCharacter.value = { ...currentCharacter.value, ...newCharacter };
};

const updateClass = (newClass: string) => {
  // set primary class as first class in the array
  const current = currentCharacter.value || {};
  const classes = current.classes ? [...current.classes] : [];
  if (classes.length === 0) classes.push({ name: newClass, level: 1 });
  else classes[0] = { ...classes[0], name: newClass };
  currentCharacter.value = { ...current, classes };
};

const onRaceUpdate = (race: Race | null) => {
  updateCharacter({ ...currentCharacter.value, race: race || undefined });
};
</script>

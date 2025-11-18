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
import type { CharacterDto as CharacterDto } from '@backend/src/character/dto/character.dto';
import type { RaceDto as Race } from '@backend/src/character/dto/character.dto';
import RacePicker from '../RacePicker.vue';
import UiSelect from '../../ui/UiSelect.vue';

import { useCharacterCreation } from '@/composables/useCharacterCreation';

const { currentCharacter } = useCharacterCreation();

interface Props {
  allowedRaces: Race[];
  classList: string[];
}

defineProps<Props>();

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

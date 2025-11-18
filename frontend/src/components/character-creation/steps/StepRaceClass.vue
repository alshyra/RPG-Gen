<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Race et Classe
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Race</label>
        <RacePicker
          :model-value="character.race"
          :allowed-races="allowedRaces"
          @update:race="(race: Race | null) => updateCharacter({ ...character, race })"
        />
      </div>

      <div>
        <label class="block font-medium mb-2">Classe</label>
        <UiSelect
          :model-value="primaryClass"
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
import RacePicker from '../RacePicker.vue';
import UiSelect from '../../ui/UiSelect.vue';

interface Race {
  id: string;
  name: string;
  mods: Record<string, number>;
}

interface Character {
  name: string;
  race: Race | null;
  scores: Record<string, number>;
  [key: string]: any;
}

interface Props {
  character: Character;
  primaryClass: string;
  allowedRaces: Race[];
  classList: string[];
}

interface Emits {
  (e: 'update:character', value: Character): void;
  (e: 'update:primary-class', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const updateCharacter = (newCharacter: Character) => {
  emit('update:character', newCharacter);
};

const updateClass = (newClass: string) => {
  emit('update:primary-class', newClass);
};
</script>

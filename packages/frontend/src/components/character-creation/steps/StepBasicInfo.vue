<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Informations de base
    </h2>

    <div>
      <label class="block font-medium mb-2">Nom du personnage</label>
      <UiInputText
        :model-value="currentCharacter?.name"
        placeholder="Ex: Aragorn"
        @update:model-value="onUpdateName"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Genre</label>
        <UiButtonToggle
          :options="genderOptions"
          :model-value="currentCharacter?.gender"
          @update:model-value="onUpdateGender($event as typeof GENDERS[number])"
        />
      </div>
    </div>
    <div>
      <label class="block font-medium mb-2">Race</label>
      <RacePicker />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiButtonToggle from '@/components/ui/UiButtonToggle.vue';
import UiInputText from '@/components/ui/UiInputText.vue';
import { GENDERS } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { useDebounceFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import RacePicker from '../RacePicker.vue';
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const genderOptions = computed(() =>
  GENDERS.map(g => ({
    value: g,
    label: g === 'male' ? '♂️ Homme' : '♀️ Femme',
  })),
);

const onUpdateName = useDebounceFn(async (name: string) => {
  if (!currentCharacter.value) return;
  currentCharacter.value.name = name;
  const charId = currentCharacter.value.characterId;

  if (!charId) return;

  await characterStore.updateCharacter(charId, { name: name });
}, 300);

const onUpdateGender = async (gender: typeof GENDERS[number]) => {
  if (!currentCharacter.value) return;

  currentCharacter.value.gender = gender;
  const charId = currentCharacter.value.characterId;
  if (!charId) return;

  await characterStore.updateCharacter(charId, { gender: String(gender) });
};

</script>

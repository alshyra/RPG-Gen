<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Informations de base
    </h2>

    <div>
      <label class="block font-medium mb-2">Nom du personnage</label>
      <UiInputText
        :model-value="currentCharacter.name"
        placeholder="Ex: Aragorn"
        @update:model-value="updateCharacterName($event)"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Genre</label>
        <UiButtonToggle
          :options="genderOptions"
          :model-value="currentCharacter?.gender"
          @update:model-value="updateGender($event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputText from '@/components/ui/UiInputText.vue';
import UiButtonToggle from '@/components/ui/UiButtonToggle.vue';
import { useCharacter } from '@/stores/useCharacterStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacter();

const { currentCharacter } = storeToRefs(characterStore);
const GENDERS = ['male', 'female'] as const;
const isGenderTypeGuard = (value: unknown): value is typeof GENDERS[number] =>
  typeof value === 'string' && GENDERS.includes(value as typeof GENDERS[number]);

const updateGender = (newGender: unknown) => {
  if (!isGenderTypeGuard(newGender)) return;
  currentCharacter.value = {
    ...currentCharacter.value,
    gender: newGender,
  };
  characterStore.updateCharacter({ ...currentCharacter.value, gender: newGender });
};

const updateCharacterName = (newName: string) => {
  currentCharacter.value = {
    ...currentCharacter.value,
    name: newName,
  };
  characterStore.updateCharacter({ ...currentCharacter.value, name: newName });
};

const genderOptions = GENDERS.map(g => ({
  value: g,
  label: g === 'male' ? '♂️ Homme' : '♀️ Femme',
}));

</script>

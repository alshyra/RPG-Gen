<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">Informations de base</h2>

    <div>
      <label class="block font-medium mb-2">Nom du personnage</label>
      <UiInputText
        :model-value="currentCharacter?.name"
        placeholder="Ex: Aragorn"
        @update:model-value="onUpdateName"
      />
    </div>

    <div>
      <label class="block font-medium mb-2">Genre</label>
      <UiButtonToggle
        :options="genderOptions"
        :model-value="currentCharacter?.gender"
        @update:model-value="onUpdateGender($event as (typeof GENDERS)[number])"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButtonToggle, UiInputText } from '@rpg-gen/ui';
import { GENDERS } from '@/services/dndRulesService';
import { useDebounceFn } from '@vueuse/core';
import { computed } from 'vue';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCharacter } from '@rpg-gen/api-client';
import { useCharacterId } from '@/composables/useCharacterId';

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const { update } = useCharacter(characterId)

const genderOptions = computed(() =>
  GENDERS.map(g => ({
    value: g,
    label: g === 'male' ? '♂️ Homme' : '♀️ Femme',
  })),
);

const onUpdateName = useDebounceFn(async (name: string) => {
  await update.mutateAsync({ name: name });
}, 300);

const onUpdateGender = async (gender: (typeof GENDERS)[number]) => {
  await update.mutateAsync({ gender: String(gender) });
};
</script>

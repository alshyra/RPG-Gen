<template>
  <label class="block font-medium mb-2">Classe</label>
  <UiSelect
    :model-value="currentCharacter?.classes?.[0]?.name ?? CLASSES_LIST[0]"
    @update:model-value="updateClass($event)"
  >
    <option
      v-for="rpg_classe in CLASSES_LIST"
      :key="rpg_classe"
      :value="rpg_classe"
    >
      {{ rpg_classe }}
    </option>
  </UiSelect>
</template>

<script setup lang="ts">
import { CLASSES_LIST, DnDRulesService } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import UiSelect from '../../ui/UiSelect.vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const updateClass = async (newClass: string) => {
  if (!currentCharacter.value) return;
  if (!currentCharacter.value.characterId) return;
  currentCharacter.value.classes![0] = {
    name: newClass,
    level: 1,
  };

  currentCharacter.value.skills = DnDRulesService.getAvailableSkillsForClass(newClass).map(skill => ({
    name: skill,
    proficient: false,
  }));

  await characterStore.updateCharacter(currentCharacter.value.characterId, {
    classes: currentCharacter.value.classes,
    skills: currentCharacter.value.skills,
  });
};
</script>

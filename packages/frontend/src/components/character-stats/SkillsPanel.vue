<template>
  <div class="space-y-2">
    <div class="font-bold text-sm text-slate-300">
      Compétences
    </div>
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div
        v-for="skill in skills"
        :key="skill.name"
        :class="['px-2 py-1 rounded', skill.proficient ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-800 text-slate-300']"
      >
        <span :class="skill.proficient ? 'font-semibold' : ''">{{ skill.name }}</span>
        <span
          class="text-xs ml-1"
          :class="skill.proficient ? 'text-indigo-200' : 'text-slate-400'"
        >
          {{ skill.modifier > 0 ? '+' : '' }}{{ skill.modifier }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DnDRulesService } from '../../services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const skills = computed(() => {
  if (
    currentCharacter.value == null
    || !currentCharacter.value?.scores
    || !currentCharacter.value.skills?.length
  ) return [];

  return currentCharacter.value.skills.map(skill => ({
    ...skill,
    modifier: DnDRulesService.calculateSkillModifier(
      skill.name!,
      currentCharacter.value!.scores!,
      currentCharacter.value!.proficiency!,
      skill.proficient!,
    ),
  }));
});
</script>

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

interface CharacterData {
  skills?: { name: string; proficient: boolean; modifier: number }[];
  scores?: { [key: string]: number };
  proficiency?: number;
}

const props = defineProps<{ character: CharacterData }>();

const skills = computed(() => {
  if (!props.character.scores || !props.character.skills) return [];

  return props.character.skills.map(skill => ({
    ...skill,
    modifier: DnDRulesService.calculateSkillModifier(
      skill.name,
      props.character.scores || {},
      props.character.proficiency || 2,
      skill.proficient
    )
  }));
});
</script>

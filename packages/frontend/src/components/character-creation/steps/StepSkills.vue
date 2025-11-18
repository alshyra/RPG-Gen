<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Compétences
    </h2>
    <p class="text-slate-400 text-sm">
      Sélectionnez {{ skillsToChoose }} compétences pour votre {{ primaryClass }}
    </p>

    <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
      <label
        v-for="skill in availableSkills"
        :key="skill"
        class="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-slate-800 transition"
      >
        <UiInputCheckbox
          :checked="selectedSkills.includes(skill)"
          :disabled="selectedSkills.length >= skillsToChoose && !selectedSkills.includes(skill)"
          @change="toggleSkill(skill)"
        />
        <span>{{ skill }}</span>
      </label>
    </div>

    <div class="text-sm text-slate-400">
      Sélectionnés: {{ selectedSkills.length }}/{{ skillsToChoose }}
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputCheckbox from '@/components/ui/UiInputCheckbox.vue';
import { useCharacterCreation } from '@/composables/useCharacterCreation';
import { computed } from 'vue';
import { DnDRulesService } from '@/services/dndRulesService';

const { currentCharacter } = useCharacterCreation();

const toggleSkill = (skill: string) => {
  const skills = currentCharacter.value.skills || [];
  const isSelected = skills.some(s => s.name === skill);
  let newSkills;
  if (isSelected) {
    newSkills = skills.filter(s => s.name !== skill);
  } else {
    newSkills = [...skills, { name: skill, proficient: true, modifier: 0 }];
  }
  currentCharacter.value = { ...currentCharacter.value, skills: newSkills };
};

const primaryClass = computed(() => currentCharacter.value.classes?.[0]?.name || '');
const availableSkills = computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value));
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));
const selectedSkills = computed(() => (currentCharacter.value.skills || []).map(s => s.name));
</script>

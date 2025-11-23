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
          :checked="proficientSkills.includes(skill)"
          :disabled="proficientSkills.length >= skillsToChoose && !proficientSkills.includes(skill)"
          @change="toggleSkill(skill)"
        />
        <span>{{ skill }}</span>
      </label>
    </div>

    <div class="text-sm text-slate-400">
      Sélectionnés: {{ proficientSkills.length }}/{{ skillsToChoose }}
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputCheckbox from '@/components/ui/UiInputCheckbox.vue';
import { DnDRulesService } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import type { SkillDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const proficientSkills = computed(() => (currentCharacter.value?.skills || []).filter((s: any) => s.proficient).map((s: any) => s.name));
const availableSkills = computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value));
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

const saveCurrent = async () => {
  if (!currentCharacter.value) return;

  if (!currentCharacter.value.characterId) return;

  await characterStore.updateCharacter(currentCharacter.value.characterId, {
    skills: currentCharacter.value.skills,
  });
};

const computeUpdatedSkills = (skill: string, existingSkills: any[]): SkillDto[] => {
  if (proficientSkills.value.includes(skill)) {
    return existingSkills.map((s: any) => ({ ...s, proficient: s.name !== skill }));
  }
  const present = existingSkills.find((s: any) => s.name === skill);
  if (present) {
    return existingSkills.map((s: any) => (s.name === skill ? { ...s, proficient: true } : s));
  }
  return [...existingSkills, { name: skill, proficient: true, modifier: 0 }];
};

const toggleSkill = async (skill: string) => {
  if (!currentCharacter.value) return;
  const existingSkills = currentCharacter.value.skills || [];
  currentCharacter.value.skills = computeUpdatedSkills(skill, existingSkills);
  await saveCurrent();
};
</script>

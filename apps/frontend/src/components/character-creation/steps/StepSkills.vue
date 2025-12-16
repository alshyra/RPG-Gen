<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">Compétences</h2>

    <p class="text-slate-400 text-sm">
      Sélectionnez {{ skillsToChoose }} compétences pour votre {{ primaryClass }}
    </p>

    <div class="grid grid-cols-2 gap-3 max-h-110 overflow-y-auto p-2">
      <div
        v-for="skill in availableSkills"
        :key="skill"
        class="p-2 rounded transition hover:bg-slate-800"
      >
        <UiInputCheckbox
          size="md"
          :name="`skill-${skill}`"
          :model-value="proficientSkills.includes(skill)"
          :disabled="proficientSkills.length >= skillsToChoose && !proficientSkills.includes(skill)"
          @update:model-value="(val: boolean) => setSkillProficiency(skill, val)"
        >
          <span class="ml-2">{{ skill }}</span>
        </UiInputCheckbox>
      </div>
    </div>

    <div class="text-sm text-slate-400">
      Sélectionnés: {{ proficientSkills.length }}/{{ skillsToChoose }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterId } from '@/composables/useCharacterId';
import { DnDRulesService } from '@/services/dndRulesService';
import { useCharacter } from '@rpg-gen/api-client';
import type { SkillResponseDto } from '@rpg-gen/shared';
import { UiInputCheckbox } from '@rpg-gen/ui';
import { computed } from 'vue';

const characterId = useCharacterId();
const { update, character } = useCharacter(characterId)
const currentCharacter = computed(() => character.data.value);

const primaryClass = computed(() => currentCharacter?.value?.classes?.[0]?.name ?? '');
const proficientSkills = computed(() =>
  (currentCharacter?.value?.skills || []).filter((s: SkillResponseDto) => s.proficient).map((s: SkillResponseDto) => s.name),
);
const availableSkills = computed(() =>
  DnDRulesService.getAvailableSkillsForClass(primaryClass.value),
);
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

const setSkillProficiency = async (skillName: string, isProficient: boolean) => {
  if (!currentCharacter?.value?.skills) return;
  const skills = currentCharacter?.value?.skills.map((skill: SkillResponseDto) =>
    skill.name === skillName
      ? {
          ...skill,
          proficient: isProficient,
        }
      : skill,
  );
  await update.mutateAsync({ skills });
};
</script>

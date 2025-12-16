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
import { UiInputCheckbox } from '@rpg-gen/ui';
import { DnDRulesService } from '@/services/dndRulesService';
import type { SkillResponseDto } from '@rpg-gen/shared';
import { computed } from 'vue';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useCharacter } from '@rpg-gen/api-client';
import { useCharacterId } from '@/composables/useCharacterId';

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();
const { update } = useCharacter(characterId)

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const proficientSkills = computed(() =>
  (currentCharacter.value?.skills || []).filter((s: SkillResponseDto) => s.proficient).map((s: SkillResponseDto) => s.name),
);
const availableSkills = computed(() =>
  DnDRulesService.getAvailableSkillsForClass(primaryClass.value),
);
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

const saveCurrent = async () => {
  if (!currentCharacter.value) return;

  if (!currentCharacter.value.characterId) return;

  await update.mutateAsync({
    skills: currentCharacter.value.skills,
  });
};

const setSkillProficiency = async (skill: string, isProficient: boolean) => {
  if (!currentCharacter.value) return;
  const existingSkills = currentCharacter.value.skills || [];

  // If skill exists, update its proficient flag; otherwise add it when setting true
  const present = existingSkills.find((s: SkillResponseDto) => s.name === skill);
  let updated: SkillResponseDto[];
  if (present) {
    updated = existingSkills.map((skill: SkillResponseDto) =>
      skill.name === skill
        ? {
            ...skill,
            proficient: isProficient,
          }
        : skill,
    );
  } else if (isProficient) {
    updated = [
      ...existingSkills,
      {
        name: skill,
        proficient: true,
        modifier: 0,
      },
    ];
  } else {
    // not present and setting to false — no-op
    updated = existingSkills;
  }

  currentCharacter.value.skills = updated;
  await saveCurrent();
};
</script>

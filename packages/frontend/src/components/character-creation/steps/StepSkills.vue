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
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { DnDRulesService } from '@/services/dndRulesService';
import { computed } from 'vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const primaryClass = computed(() => currentCharacter.value?.classes?.[0]?.name ?? '');
const selectedSkills = computed(() => (currentCharacter.value?.skills || []).filter((s: any) => s.proficient).map((s: any) => s.name));
const availableSkills = computed(() => DnDRulesService.getAvailableSkillsForClass(primaryClass.value));
const skillsToChoose = computed(() => DnDRulesService.getSkillChoicesForClass(primaryClass.value));

const toggleSkill = async (skill: string) => {
  if (!currentCharacter.value) return;

  const existingSkills = currentCharacter.value.skills || [];
  let newSkills: any[];

  if (selectedSkills.value.includes(skill)) {
    newSkills = existingSkills.map((s: any) => ({ ...s, proficient: s.name !== skill }));
  } else {
    // add skill or toggle proficient
    const present = existingSkills.find((s: any) => s.name === skill);
    if (present) {
      newSkills = existingSkills.map((s: any) => (s.name === skill ? { ...s, proficient: true } : s));
    } else {
      newSkills = [...existingSkills, { name: skill, proficient: true, modifier: 0 }];
    }
  }
  currentCharacter.value.skills = newSkills as any;

  if (!currentCharacter.value.characterId) return
  await characterStore.updateCharacter(currentCharacter.value.characterId, { skills: newSkills });
};
</script>

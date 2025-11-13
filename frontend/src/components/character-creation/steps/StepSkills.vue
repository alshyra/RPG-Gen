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

interface Props {
  primaryClass: string;
  selectedSkills: string[];
  availableSkills: string[];
  skillsToChoose: number;
}

interface Emits {
  (e: 'update:selected-skills', value: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toggleSkill = (skill: string) => {
  const newSkills = props.selectedSkills.includes(skill)
    ? props.selectedSkills.filter(s => s !== skill)
    : [...props.selectedSkills, skill];
  emit('update:selected-skills', newSkills);
};
</script>


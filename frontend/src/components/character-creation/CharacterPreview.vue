<script setup lang="ts">
interface Character {
  name: string;
  race: any;
  scores: Record<string, number>;
  [key: string]: any;
}

interface Props {
  character: Character;
  gender: string;
  primaryClass: string;
  baseScores: Record<string, number>;
  selectedSkills: string[];
  currentStep: number;
}

defineProps<Props>();
</script>

<template>
  <div class="p-3 lg:p-4 bg-slate-900/50 rounded-b border-x border-b border-slate-700">
    <div class="text-sm text-slate-300 space-y-1">
      <div><strong>Nom:</strong> {{ character.name || '—' }}</div>
      <div><strong>Genre:</strong> {{ gender }}</div>
      <div><strong>Race:</strong> {{ character.race?.name || '—' }}</div>
      <div><strong>Classe:</strong> {{ primaryClass }}</div>
      <div v-if="currentStep >= 2">
        <strong>Scores:</strong> STR {{ baseScores.Str }} | DEX {{ baseScores.Dex
        }} | CON {{ baseScores.Con }} | INT {{ baseScores.Int }} | WIS {{ baseScores.Wis }} | CHA {{
          baseScores.Cha }}
      </div>
      <div v-if="currentStep >= 3">
        <strong>Compétences:</strong> {{ selectedSkills.join(', ') || '—' }}
      </div>
    </div>
  </div>
</template>

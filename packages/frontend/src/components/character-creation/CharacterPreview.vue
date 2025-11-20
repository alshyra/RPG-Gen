<template>
  <div class="p-3 lg:p-4 bg-slate-900/50 rounded-b border-x border-b border-slate-700">
    <div class="text-sm text-slate-300 space-y-1">
      <div><strong>Nom:</strong> {{ currentCharacter.name || '—' }}</div>
      <div><strong>Genre:</strong> {{ currentCharacter.gender }}</div>
      <div><strong>Race:</strong> {{ currentCharacter.race?.name || '—' }}</div>
      <div><strong>Classe:</strong> {{ currentCharacter.classes?.[0]?.name || '—' }}</div>
      <div v-if="currentCharacter.scores">
        <strong>Scores:</strong> STR {{ currentCharacter.scores.Str }} | DEX {{ currentCharacter.scores.Dex
        }} | CON {{ currentCharacter.scores.Con }} | INT {{ currentCharacter.scores.Int }} | WIS {{ currentCharacter.scores.Wis }} | CHA {{
          currentCharacter.scores.Cha }}
      </div>
      <div v-if="currentCharacter.skills && currentCharacter.skills.length > 0">
        <strong>Compétences:</strong> {{ currentCharacter.skills.map(skill => skill.name).join(', ') || '—' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacter } from '@/composables/useCharacter';
import { storeToRefs } from 'pinia';

const characterStore = useCharacter();
const { currentCharacter } = storeToRefs(characterStore);
</script>

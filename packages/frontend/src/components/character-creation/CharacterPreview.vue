<template>
  <div class="p-3 lg:p-4 bg-slate-900/50 rounded-b border-x border-b border-slate-700">
    <div class="text-sm text-slate-300 space-y-1">
      <div v-if="currentCharacter?.name">
        <strong>Nom:</strong> {{ currentCharacter.name }}
      </div>
      <div v-if="currentCharacter?.gender">
        <strong>Genre:</strong> {{ currentCharacter.gender }}
      </div>
      <div v-if="currentCharacter?.race">
        <strong>Race:</strong> {{ currentCharacter.race?.name }}
      </div>
      <div v-if="currentCharacter?.classes?.length">
        <strong>Classe:</strong> {{ currentCharacter.classes[0].name }}
      </div>
      <div v-if="currentCharacter?.scores">
        <strong>Scores:</strong> STR {{ currentCharacter.scores.Str }} | DEX {{ currentCharacter.scores.Dex
        }} | CON {{ currentCharacter.scores.Con }} | INT {{ currentCharacter.scores.Int }} | WIS {{ currentCharacter.scores.Wis }} | CHA {{
          currentCharacter.scores.Cha }}
      </div>
      <div v-if="currentCharacter?.skills?.length">
        <strong>Compétences:</strong> {{ skills }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const skills = computed(() => (currentCharacter.value?.skills || [])
  .filter((s: any) => s.proficient)
  .map((s: any) => s.name)
  .join(', '));
</script>

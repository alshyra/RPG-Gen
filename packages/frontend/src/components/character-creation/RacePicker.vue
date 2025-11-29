<template>
  <div>
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="allowedRace in allowedRaces"
        :key="allowedRace.id"
        variant="primary"
        :class="['cursor-pointer p-2 rounded border', additionalSelectedClass(allowedRace)]"
        @click.prevent="onRaceUpdate(allowedRace)"
      >
        <div class="font-medium">
          {{ allowedRace.name }}
        </div>
        <div class="text-xs text-slate-400">
          {{ summaryMods(allowedRace.mods) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ALLOWED_RACES } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { RaceResponseDto } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const allowedRaces = computed(() => ALLOWED_RACES);

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const additionalSelectedClass = (allowedRace: RaceResponseDto) =>
  currentCharacter.value?.race?.id === allowedRace.id
    ? 'border-indigo-500 bg-indigo-600/20'
    : 'border-slate-700';

const summaryMods = (mods: RaceResponseDto['mods']) => {
  try {
    return Object
      .entries(mods)
      .map(([attributeName, statAdjustment]) => `${attributeName}${(statAdjustment) >= 0 ? '+' + (statAdjustment) : statAdjustment}`)
      .join(' ');
  } catch { return ''; }
};

const onRaceUpdate = (race: RaceResponseDto) => {
  if (!currentCharacter.value) return;

  currentCharacter.value.race = race;

  if (!currentCharacter.value?.characterId) return;

  characterStore.updateCharacter(currentCharacter.value?.characterId, { race });
};
</script>

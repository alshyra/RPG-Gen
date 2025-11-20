<template>
  <div>
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="allowedRace in allowedRaces"
        :key="allowedRace.id"
        variant="primary"
        :class="['cursor-pointer p-2 rounded border', selected?.id === allowedRace.id ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-700']"
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
import { ALLOWED_RACES, useCharacterCreation } from '@/composables/useCharacterCreation';
import { RaceDto } from '@rpg/shared';
import { computed, ref } from 'vue';

const allowedRaces = computed(() => ALLOWED_RACES);
// receive store from parent wizard
const props = defineProps<{ characterStore: any }>();
const { currentCharacter } = useCharacterCreation(props.characterStore);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateCharacter = (props.characterStore as any).updateCharacter as (p: any) => void;
const selected = ref<RaceDto>();

const summaryMods = (mods: RaceDto['mods']) => {
  try {
    return Object
      .entries(mods)
      .map(([attributeName, statAdjustment]) => `${attributeName}${(statAdjustment) >= 0 ? '+' + (statAdjustment) : statAdjustment}`)
      .join(' ');
  } catch { return ''; }
};

const onRaceUpdate = (race: RaceDto) => {
  selected.value = race;
  updateCharacter({ characterId: currentCharacter.characterId, race });
};
</script>

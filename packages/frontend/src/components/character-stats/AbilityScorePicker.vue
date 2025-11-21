<template>
  <div class="p-2 bg-slate-800/40 rounded">
    <div class="mt-3 grid grid-cols-2 gap-2">
      <div
        v-for="ability in ABILITIES"
        :key="ability"
      >
        <div v-if="currentCharacter?.scores">
          <div class="flex items-baseline justify-between">
            <div class="text-sm font-medium">
              {{ ability }}
            </div>
            <div class="text-xs text-slate-400">
              {{ formatMod(currentCharacter.scores[ability]) }} • PB {{ DnDRulesService.getProficiencyBonus(1) }}
            </div>
          </div>
          <div
            class="mt-1"
            :data-test-id="`ability-score-${ability}`"
          >
            <UiInputNumber
              data-test-id="ability-score"
              :data-test-value="ability"
              :model-value="currentCharacter.scores[ability]"
              :min="8"
              :max="15"
              @update:model-value="(val) => applyPointBuyChange(ability, val)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { ABILITIES, DnDRulesService } from '@/services/dndRulesService';
import { storeToRefs } from 'pinia';
import useAbilityScores from '@/composables/useAbilityScores';
import UiInputNumber from '../ui/UiInputNumber.vue';

const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const { formatMod, applyPointBuyChange } = useAbilityScores();

</script>
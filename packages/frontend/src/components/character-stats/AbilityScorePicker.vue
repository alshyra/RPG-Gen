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
              {{ formatMod(currentCharacter.scores[ability]) }} • PB {{ proficiency }}
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
              :disabled="mode === 'edit'"
              @update:model-value="(val) => applyPointBuyChange(ability, val)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useAbilityScores from '@/composables/useAbilityScores';
import { ABILITIES } from '@/services/dndRulesService';
import { useCharacterStore } from '@/stores/characterStore';
import { storeToRefs } from 'pinia';
import UiInputNumber from '../ui/UiInputNumber.vue';

const props = defineProps<{ mode?: 'edit' | 'levelup' | 'point-buy'; levelUpBudget?: number; proficiency?: number; initialScores?: Record<string, number> }>();
const { mode = 'point-buy', proficiency = 1 } = props;
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);

const { formatMod, applyPointBuyChange } = useAbilityScores();

</script>

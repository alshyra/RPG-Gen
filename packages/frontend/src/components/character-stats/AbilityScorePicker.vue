<template>
  <div class="p-2 bg-slate-800/40 rounded">
    <div class="mt-3 grid grid-cols-2 gap-2">
      <div
        v-for="ability in abilities"
        :key="ability"
      >
        <div class="flex items-baseline justify-between">
          <div class="text-sm font-medium">
            {{ ability }}
          </div>
          <div class="text-xs text-slate-400">
            {{ formatMod(assignedScores[ability]) }} • PB {{ proficiencyBonus }}
          </div>
        </div>
        <div
          class="mt-1"
          :data-test-id="`ability-score-${ability}`"
        >
          <div
            v-if="props.mode === 'edit'"
            class="w-12 text-center font-medium"
          >
            {{ assignedScores[ability] }}
          </div>
          <UiInputNumber
            v-else
            data-test-id="ability-score"
            :data-test-value="ability"
            :model-value="assignedScores[ability]"
            :min="8"
            :max="15"
            @update:model-value="(val) => change(ability, val - assignedScores[ability])"
          />
        </div>
      </div>
    </div>

    <div
      v-if="props.mode !== 'edit'"
      class="mt-2 text-sm"
    >
      Points restants: {{ remainingPoints }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue';
import UiInputNumber from '../ui/UiInputNumber.vue';
import useAbilityRules from '../../composables/useAbilityRules';
import { useCharacterCreation, DEFAULT_BASE_SCORES } from '@/composables/useCharacterCreation';
import type { AbilityScoresDto } from '@rpg/shared';

const props = defineProps<{
  proficiency?: number;
  mode?: 'edit' | 'levelup';
  levelUpBudget?: number;
  initialScores?: Record<string, number>;
}>();

const abilities = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const allocationMethod = ref<'pointbuy' | 'standard' | 'manual'>('pointbuy');

// ability scores assigned to the character - keep synced with the composable
const { currentCharacter } = useCharacterCreation();
const assignedScores = reactive<Record<string, number>>({
  Str: DEFAULT_BASE_SCORES.Str,
  Dex: DEFAULT_BASE_SCORES.Dex,
  Con: DEFAULT_BASE_SCORES.Con,
  Int: DEFAULT_BASE_SCORES.Int,
  Wis: DEFAULT_BASE_SCORES.Wis,
  Cha: DEFAULT_BASE_SCORES.Cha,
});

// more explicit name for the proficiency number
const proficiencyBonus = computed(() => (typeof props.proficiency === 'number' ? props.proficiency : 2));

const { pointsUsed, formatMod, applyPointBuyChange, applyLevelUpChange } = useAbilityRules();

const remainingPoints = computed(() => {
  if (props.mode === 'levelup') {
    // calculate points used as simple increments above initialScores
    const initial = props.initialScores || {};
    const used = abilities.reduce((sum, k) => {
      const base = initial[k] || 0;
      const cur = assignedScores[k] || 0;
      return sum + (cur > base ? cur - base : 0);
    }, 0);
    return (props.levelUpBudget ?? 2) - used;
  }
  return 27 - pointsUsed(assignedScores);
});

const change = (ability: string, delta: number) => {
  if (props.mode === 'edit') return; // locked
  const current = assignedScores[ability] || 8;
  let v = Math.max(8, Math.min(15, current + delta));

  if (props.mode === 'levelup') {
    // allow simple increments up to levelUpBudget (counted as +1 per point above initial)
    const res = applyLevelUpChange(assignedScores, ability, v, props.initialScores, props.levelUpBudget);
    if (res.allowed && res.newAbilities) assignNewAbilities(res.newAbilities);
    return;
  }

  // default: point-buy create mode
  const pRes = applyPointBuyChange(assignedScores, ability, v);
  if (pRes.allowed && pRes.newAbilities) assignNewAbilities(pRes.newAbilities);
};

const assignNewAbilities = (newAbilities: Record<string, number>) => {
  Object.assign(assignedScores, newAbilities);
  // sync with the global character in the store
  currentCharacter.value = { ...currentCharacter.value, scores: { ...(assignedScores as unknown as AbilityScoresDto) } };
};

if (currentCharacter.value && currentCharacter.value.scores) {
  const values = currentCharacter.value.scores as Record<string, number>;
  abilities.forEach((key) => {
    if (values[key] !== undefined) assignedScores[key] = values[key];
  });
  // Always keep the store's scores up-to-date
  currentCharacter.value = { ...currentCharacter.value, scores: { ...(assignedScores as unknown as AbilityScoresDto) } };
} else {
  // write default scores to the store at mount
  currentCharacter.value = { ...currentCharacter.value, scores: { ...(assignedScores as unknown as AbilityScoresDto) } };
}

watch(() => allocationMethod.value, () => {
  currentCharacter.value = { ...currentCharacter.value, scores: { ...(assignedScores as unknown as AbilityScoresDto) } };
});

// Also react to external changes to the character.scores to update the local
// assignedScores template values
watch(
  () => currentCharacter.value?.scores,
  (next) => {
    if (!next) return;
    abilities.forEach((key) => {
      if ((next as Record<string, number>)[key] !== undefined) {
        assignedScores[key] = (next as Record<string, number>)[key];
      }
    });
  },
  { deep: true },
);
</script>

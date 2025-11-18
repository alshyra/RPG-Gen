<template>
  <div class="p-2 bg-slate-800/40 rounded">
    <div class="mt-3 grid grid-cols-2 gap-2">
      <div
        v-for="stat in stats"
        :key="stat"
      >
        <div class="flex items-baseline justify-between">
          <div class="text-sm font-medium">
            {{ stat }}
          </div>
          <div class="text-xs text-slate-400">
            {{ formatMod(assigned[stat]) }} • PB {{ proficiency }}
          </div>
        </div>
        <div
          class="mt-1"
          :data-test-id="`ability-score-${stat}`"
        >
          <div
            v-if="props.mode === 'edit'"
            class="w-12 text-center font-medium"
          >
            {{ assigned[stat] }}
          </div>
          <UiInputNumber
            v-else
            data-test-id="ability-score"
            :data-test-value="stat"
            :model-value="assigned[stat]"
            :min="8"
            :max="15"
            @update:model-value="(val) => change(stat, val - assigned[stat])"
          />
        </div>
      </div>
    </div>

    <div
      v-if="props.mode !== 'edit'"
      class="mt-2 text-sm"
    >
      Points restants: {{ pointsLeft }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue';
import UiInputNumber from '../ui/UiInputNumber.vue';

const props = defineProps<{ modelValue?: Record<string, number>; proficiency?: number; mode?: string; levelUpBudget?: number; initialScores?: Record<string, number> }>();
const emit = defineEmits<{
  (e: 'update:modelValue', val: Record<string, number>): void;
}>();

const stats = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const method = ref('pointbuy');
const assigned = reactive<Record<string, number>>({ Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 });
const proficiency = computed(() => typeof props.proficiency === 'number' ? props.proficiency : 2);

// point-buy cost table
const cost: any = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
function pointsUsed() { let s = 0; for (const k of stats) s += cost[assigned[k]] || 0; return s; }
const pointsLeft = computed(() => {
  if (props.mode === 'levelup') {
    // calculate points used as simple increments above initialScores
    const initial = props.initialScores || {};
    let used = 0;
    for (const k of stats) {
      const base = initial[k] || 0;
      const cur = assigned[k] || 0;
      if (cur > base) used += (cur - base);
    }
    return (props.levelUpBudget ?? 2) - used;
  }
  return 27 - pointsUsed();
});

function change(stat: string, delta: number) {
  if (props.mode === 'edit') return; // locked
  const current = assigned[stat] || 8;
  let v = Math.max(8, Math.min(15, current + delta));

  if (props.mode === 'levelup') {
    // allow simple increments up to levelUpBudget (counted as +1 per point above initial)
    const initial = props.initialScores || {};
    const prevInc = Math.max(0, current - (initial[stat] || 0));
    const newInc = Math.max(0, v - (initial[stat] || 0));
    const usedBefore = Object.keys(assigned).reduce((acc, k) => acc + Math.max(0, (assigned[k] || 8) - (initial[k] || 0)), 0);
    const newUsed = usedBefore - prevInc + newInc;
    if (newUsed > (props.levelUpBudget ?? 2)) return;
    assigned[stat] = v;
    emit('update:modelValue', { ...assigned });
    return;
  }

  // default: point-buy create mode
  const prevCost = cost[current] || 0;
  const newCost = cost[v] || 0;
  const used = pointsUsed();
  const newUsed = used - prevCost + newCost;
  if (newUsed > 27) return; // prevent overspend
  assigned[stat] = v;
  emit('update:modelValue', { ...assigned });
}

function formatMod(n: number): string {
  const m = Math.floor((Number(n) - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

// initialize from props if provided
if (props.modelValue) {
  for (const k of stats) if ((props.modelValue as any)[k]) assigned[k] = (props.modelValue as any)[k];
  emit('update:modelValue', { ...assigned });
} else {
  emit('update:modelValue', { ...assigned });
}

watch(() => method.value, () => { emit('update:modelValue', { ...assigned }); });
</script>

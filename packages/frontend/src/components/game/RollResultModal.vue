<template>
  <UiModal
    :is-open="isOpen"
    @close="close"
  >
    <!-- Rolling Animation Phase -->
    <div
      v-if="isAnimating"
      class="text-center"
    >
      <h2 class="text-2xl font-bold text-amber-400 mb-4">
        🎲 Rolling...
      </h2>
      <div class="flex justify-center gap-4 mb-4">
        <UiDice3D
          v-for="(roll, idx) in rollData.rolls"
          :key="idx"
          :value="clampedDiceValue(roll)"
          :dice-type="diceType"
          :is-rolling="isAnimating"
          :size="100"
          @roll-complete="onDiceRollComplete"
        />
      </div>
      <div class="text-sm text-slate-400 animate-pulse">
        {{ rollData.diceNotation }}
      </div>
    </div>

    <!-- Result Display Phase -->
    <template v-else>
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-amber-400 mb-2">
          🎲 Roll Result
        </h2>
        <div class="text-sm text-slate-400">
          {{ rollData.diceNotation }}
        </div>
        <div
          v-if="rollData.skillName"
          class="text-xs text-slate-500 mt-1"
        >
          {{ rollData.skillName }}
        </div>
        <div
          v-if="rollData.advantage && rollData.advantage !== 'none'"
          class="text-xs font-semibold mt-1"
          :class="rollData.advantage === 'advantage' ? 'text-green-400' : 'text-red-400'"
        >
          {{ rollData.advantage === 'advantage' ? '↑ ADVANTAGE' : '↓ DISADVANTAGE' }}
        </div>
      </div>

      <!-- 3D Dice Display (static after animation) -->
      <div class="flex justify-center gap-4 mb-4">
        <UiDice3D
          v-for="(roll, idx) in rollData.rolls"
          :key="idx"
          :value="clampedDiceValue(roll)"
          :dice-type="diceType"
          :is-rolling="false"
          :size="80"
        />
      </div>

      <!-- Rolls Display -->
      <div class="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div class="flex justify-center gap-2 mb-4">
          <div
            v-for="(roll, idx) in rollData.rolls"
            :key="idx"
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border-2',
              isDiscardedRoll(roll) ? 'bg-slate-800 text-slate-500 border-slate-600 line-through' : 'bg-slate-600 text-amber-300 border-amber-400'
            ]"
          >
            {{ roll }}
          </div>
        </div>

        <!-- Calculation -->
        <div class="text-center text-sm space-y-2">
          <div
            v-if="rollData.advantage && rollData.advantage !== 'none'"
            class="text-slate-300"
          >
            {{ rollData.advantage === 'advantage' ? 'Kept best' : 'Kept worst' }}: {{ rollData.keptRoll }} <span class="text-slate-500">(dé)</span>
          </div>
          <div
            v-else
            class="text-slate-300"
          >
            {{ rollData.rolls.join(' + ') }} <span class="text-slate-500">(dé)</span>
          </div>
          <div
            v-if="rollData.bonus !== 0"
            class="text-slate-300"
          >
            + {{ rollData.bonus }} <span class="text-slate-500">(bonus)</span>
          </div>
          <div class="border-t border-slate-600 pt-2 mt-2">
            <div
              :class="['text-xl font-bold', isCriticalSuccess ? 'text-green-400' : isCriticalFailure ? 'text-red-400' : 'text-green-400']"
            >
              Total: {{ rollData.total }}
            </div>
            <div
              v-if="isCriticalSuccess"
              class="text-green-400 text-sm font-semibold"
            >
              ✨ CRITICAL SUCCESS ✨
            </div>
            <div
              v-if="isCriticalFailure"
              class="text-red-400 text-sm font-semibold"
            >
              💀 CRITICAL FAILURE 💀
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          @click="confirm"
        >
          Send Result
        </button>
        <button
          class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          @click="handleReroll"
        >
          Reroll
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import UiModal from '../ui/UiModal.vue';
import UiDice3D from '../ui/UiDice3D.vue';
import { useGameStore } from '@/stores/gameStore';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface Emits {
  confirm: [];
  reroll: [];
  close: [];
}

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<Emits>();

// Animation state
const isAnimating = ref(false);
const completedDice = ref(0);

// Get data from store
const gameStore = useGameStore();
const rollData = computed(() => gameStore.rollData);

// Parse dice notation to determine dice type (e.g., "1d20" -> "d20", "2d6" -> "d6")
const diceType = computed<DiceType>(() => {
  const notation = rollData.value.diceNotation || '1d20';
  const match = notation.match(/d(\d+)/i);
  if (match) {
    const faces = parseInt(match[1], 10);
    if ([4, 6, 8, 10, 12, 20].includes(faces)) {
      return `d${faces}` as DiceType;
    }
  }
  return 'd20'; // Default to d20
});

// Get max value for current dice type
const diceMax = computed(() => parseInt(diceType.value.slice(1), 10));

// Check if first roll (d20 for checks) is max or 1
const firstRoll = computed(() => rollData.value.keptRoll || rollData.value.rolls[0] || 0);
const isCriticalSuccess = computed(() => firstRoll.value === diceMax.value);
const isCriticalFailure = computed(() => firstRoll.value === 1);

// Clamp roll value to valid range for the dice type
const clampedDiceValue = (roll: number): number => Math.max(1, Math.min(diceMax.value, roll));

const isDiscardedRoll = (roll: number) => {
  if (!rollData.value.discardedRoll || !rollData.value.advantage || rollData.value.advantage === 'none') return false;
  if (rollData.value.rolls[0] === rollData.value.rolls[1]) return false;
  return roll === rollData.value.discardedRoll;
};

const onDiceRollComplete = () => {
  completedDice.value++;
  if (completedDice.value >= rollData.value.rolls.length) {
    isAnimating.value = false;
  }
};

// Start animation when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && rollData.value.rolls.length > 0) {
      isAnimating.value = true;
      completedDice.value = 0;
    }
  },
);

const confirm = () => emit('confirm');
const handleReroll = () => {
  isAnimating.value = true;
  completedDice.value = 0;
  emit('reroll');
};
const close = () => emit('close');
</script>

<style scoped></style>

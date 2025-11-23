<template>
  <UiModal
    :is-open="isOpen"
    @close="close"
  >
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

    <!-- Inspiration Options (shown only for normal 1d20 rolls without advantage) -->
    <div
      v-if="showInspirationOptions && canUseInspiration"
      class="bg-purple-900/30 rounded-lg p-3 mb-4 border border-purple-500"
    >
      <div class="text-center text-sm text-purple-300 mb-2">
        ✨ Use Inspiration Point? ({{ inspirationPoints }} available)
      </div>
      <div class="flex gap-2">
        <button
          class="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition"
          @click="useAdvantage"
        >
          ↑ Advantage
        </button>
        <button
          class="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition"
          @click="useDisadvantage"
        >
          ↓ Disadvantage
        </button>
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
        @click="reroll"
      >
        Reroll
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiModal from '../ui/UiModal.vue';

interface Emits {
  confirm: [];
  reroll: [];
  close: [];
  useAdvantage: [];
  useDisadvantage: [];
}

import type { RollModalData } from '@rpg-gen/shared';

const props = defineProps<{
  isOpen: boolean;
  rollData: RollModalData;
  inspirationPoints?: number;
  showInspirationOptions?: boolean;
}>();

console.log(props.rollData);

const emit = defineEmits<Emits>();

// Check if first roll (d20 for checks) is 20 or 1
const firstRoll = computed(() => props.rollData.keptRoll || props.rollData.rolls[0] || 0);
const isCriticalSuccess = computed(() => firstRoll.value === 20);
const isCriticalFailure = computed(() => firstRoll.value === 1);
const canUseInspiration = computed(() => (props.inspirationPoints || 0) > 0);

const isDiscardedRoll = (roll: number) => {
  if (!props.rollData.discardedRoll) return false;
  return roll === props.rollData.discardedRoll;
};

const confirm = () => emit('confirm');
const reroll = () => emit('reroll');
const close = () => emit('close');
const useAdvantage = () => emit('useAdvantage');
const useDisadvantage = () => emit('useDisadvantage');
</script>

<style scoped></style>

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
        {{ diceNotation }}
      </div>
      <div
        v-if="skillName"
        class="text-xs text-slate-500 mt-1"
      >
        {{ skillName }}
      </div>
    </div>

    <!-- Rolls Display -->
    <div class="bg-slate-700/50 rounded-lg p-4 mb-6">
      <div class="flex justify-center gap-2 mb-4">
        <div
          v-for="(roll, idx) in rolls"
          :key="idx"
          class="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center text-lg font-bold text-amber-300 border-2 border-amber-400"
        >
          {{ roll }}
        </div>
      </div>

      <!-- Calculation -->
      <div class="text-center text-sm space-y-2">
        <div class="text-slate-300">
          {{ rolls.join(' + ') }} <span class="text-slate-500">(dé)</span>
        </div>
        <div
          v-if="bonus !== 0"
          class="text-slate-300"
        >
          + {{ bonus }} <span class="text-slate-500">(bonus)</span>
        </div>
        <div class="border-t border-slate-600 pt-2 mt-2">
          <div
            :class="['text-xl font-bold', isCriticalSuccess ? 'text-green-400' : isCriticalFailure ? 'text-red-400' : 'text-green-400']"
          >
            Total: {{ total }}
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

interface Props {
  isOpen: boolean;
  skillName: string;
  diceNotation: string;
  rolls: number[];
  bonus: number;
  total: number;
}

interface Emits {
  confirm: [];
  reroll: [];
  close: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Check if first roll (d20 for checks) is 20 or 1
const firstRoll = computed(() => props.rolls[0] || 0);
const isCriticalSuccess = computed(() => firstRoll.value === 20);
const isCriticalFailure = computed(() => firstRoll.value === 1);

const confirm = () => emit('confirm');
const reroll = () => emit('reroll');
const close = () => emit('close');
</script>

<style scoped></style>
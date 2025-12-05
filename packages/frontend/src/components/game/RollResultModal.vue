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
        v-if="rollData.target !== undefined && rollData.targetAc !== undefined && rollData.targetAc !== null"
        class="mt-2"
      >
        <div class="text-sm font-semibold">
          Target: {{ rollData.target ?? 'Unknown' }} — AC: {{ rollData.targetAc }}
        </div>
      </div>
      <div
        v-if="rollData.skillName"
        class="text-xs text-slate-500 mt-1"
      >
        {{ rollData.skillName }}
      </div>
      <div
        v-if="(rollData.advantage ?? (rollData.advantage === undefined ? undefined : rollData.advantage)) && (rollData.advantage ?? 'none') !== 'none'"
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
          v-for="(roll, idx) in (rollData.rolls ?? [])"
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
          v-if="(rollData.advantage ?? 'none') && (rollData.advantage ?? 'none') !== 'none'"
          class="text-slate-300"
        >
          {{ (rollData.advantage ?? 'none') === 'advantage' ? 'Kept best' : 'Kept worst' }}: {{ rollData.keptRoll }} <span class="text-slate-500">(dé)</span>
        </div>
        <div
          v-else
          class="text-slate-300"
        >
          {{ (rollData.rolls ?? []).join(' + ') }} <span class="text-slate-500">(dé)</span>
        </div>
        <div
          v-if="(rollData.bonus ?? 0) !== 0"
          class="text-slate-300"
        >
          + {{ rollData.bonus ?? 0 }} <span class="text-slate-500">(bonus)</span>
        </div>
        <div class="border-t border-slate-600 pt-2 mt-2">
          <div :class="['text-xl font-bold', isCriticalSuccess ? 'text-green-400' : isCriticalFailure ? 'text-red-400' : 'text-green-400']">
            Total: {{ rollData.total ?? 0 }}
          </div>
          <div
            v-if="hasTarget"
            class="mt-1"
          >
            <span :class="hasHit ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'">
              {{ hasHit ? 'HIT' : 'MISS' }}
            </span>
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
        class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
        :disabled="gameStore.sending"
        @click="confirm"
      >
        <span v-if="gameStore.sending">Sending...</span>
        <span v-else>Send Result</span>
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
import { useGameStore } from '@/stores/gameStore';

interface Emits {
  confirm: [];
  reroll: [];
  close: [];
}

defineProps<{ isOpen: boolean }>();

const emit = defineEmits<Emits>();

// Get data from store
const gameStore = useGameStore();
const rollData = computed(() => gameStore.rollData);

// Check if first roll (d20 for checks) is 20 or 1
const firstRoll = computed(() => (rollData.value.keptRoll ?? ((rollData.value.rolls ?? [])[0])) ?? 0);
const isCriticalSuccess = computed(() => firstRoll.value === 20);
const isCriticalFailure = computed(() => firstRoll.value === 1);

const isDiscardedRoll = (roll: number) => {
  if (!rollData.value.discardedRoll || !(rollData.value.advantage ?? 'none') || (rollData.value.advantage ?? 'none') === 'none') return false;
  // For advantage/disadvantage, we have exactly 2 rolls
  // If both rolls are the same value, neither should be marked as discarded
  const rolls = rollData.value.rolls ?? [];
  if (rolls[0] === rolls[1]) return false;
  return roll === rollData.value.discardedRoll;
};

const hasTarget = computed(() => typeof (rollData.value?.targetAc) === 'number' && rollData.value?.targetAc !== null);
const hasHit = computed(() => {
  if (!hasTarget.value) return false;
  const total = (rollData.value?.total ?? 0);
  const ac = (rollData.value?.targetAc ?? 0);
  return total >= ac;
});

const confirm = () => emit('confirm');
const reroll = () => emit('reroll');
const close = () => emit('close');
</script>

<style scoped></style>

<template>
  <div class="min-h-screen bg-slate-900 p-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-amber-400 mb-8 text-center">
        🎲 3D D20 Dice Demo
      </h1>

      <div class="bg-slate-800 rounded-lg p-8 mb-6">
        <h2 class="text-xl text-white mb-4 text-center">
          Click "Roll" to see the dice animation
        </h2>

        <div class="flex justify-center gap-6 mb-6">
          <UiDice3D
            v-for="(die, idx) in diceValues"
            :key="idx"
            :value="die"
            :is-rolling="isRolling"
            :size="120"
            @roll-complete="onRollComplete"
          />
        </div>

        <div class="text-center text-white mb-4">
          <span class="text-slate-400">Current values:</span>
          <span class="text-amber-300 font-bold ml-2">
            {{ diceValues.join(', ') }}
          </span>
        </div>

        <div class="flex justify-center gap-4">
          <button
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            :disabled="isRolling"
            @click="rollDice"
          >
            {{ isRolling ? 'Rolling...' : 'Roll D20 🎲' }}
          </button>

          <button
            class="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg transition"
            @click="addDie"
          >
            Add Die +
          </button>

          <button
            v-if="diceValues.length > 1"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition"
            @click="removeDie"
          >
            Remove Die -
          </button>
        </div>
      </div>

      <div class="text-center text-slate-400 text-sm">
        This component uses Three.js to render realistic 3D D20 dice with rolling animation.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UiDice3D from '../components/ui/UiDice3D.vue';

const diceValues = ref([12, 7]);
const isRolling = ref(false);
let completedCount = 0;

const rollDice = () => {
  isRolling.value = true;
  completedCount = 0;
  // Generate random values for each D20 (1-20)
  diceValues.value = diceValues.value.map(() => Math.floor(Math.random() * 20) + 1);
};

const onRollComplete = () => {
  completedCount++;
  if (completedCount >= diceValues.value.length) {
    isRolling.value = false;
  }
};

const addDie = () => {
  if (diceValues.value.length < 5) {
    diceValues.value.push(Math.floor(Math.random() * 20) + 1);
  }
};

const removeDie = () => {
  if (diceValues.value.length > 1) {
    diceValues.value.pop();
  }
};
</script>

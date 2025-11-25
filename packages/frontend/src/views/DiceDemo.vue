<template>
  <div class="min-h-screen bg-slate-900 p-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-amber-400 mb-8 text-center">
        🎲 3D Dice Demo
      </h1>

      <div class="bg-slate-800 rounded-lg p-8 mb-6">
        <h2 class="text-xl text-white mb-4 text-center">
          Select dice type and click "Roll"
        </h2>

        <!-- Dice Type Selector -->
        <div class="flex justify-center gap-2 mb-6">
          <button
            v-for="dt in diceTypes"
            :key="dt"
            :class="[
              'px-4 py-2 rounded-lg font-bold transition',
              selectedDiceType === dt ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            ]"
            @click="selectDiceType(dt)"
          >
            {{ dt.toUpperCase() }}
          </button>
        </div>

        <div class="flex justify-center gap-6 mb-6 flex-wrap">
          <UiDice3D
            v-for="(die, idx) in diceValues"
            :key="idx"
            :value="die"
            :dice-type="selectedDiceType"
            :is-rolling="isRolling"
            :size="120"
            @roll-complete="onRollComplete"
          />
        </div>

        <div class="text-center text-white mb-4">
          <span class="text-slate-400">{{ selectedDiceType.toUpperCase() }} values:</span>
          <span class="text-amber-300 font-bold ml-2">
            {{ diceValues.join(', ') }}
          </span>
        </div>

        <div class="flex justify-center gap-4 flex-wrap">
          <button
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition"
            :disabled="isRolling"
            @click="rollDice"
          >
            {{ isRolling ? 'Rolling...' : `Roll ${selectedDiceType.toUpperCase()} 🎲` }}
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
        This component uses Three.js to render realistic 3D dice (D4, D6, D8, D10, D12, D20) with rolling animation.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UiDice3D from '../components/ui/UiDice3D.vue';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

const diceTypes: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
const selectedDiceType = ref<DiceType>('d20');
const diceValues = ref([12, 7]);
const isRolling = ref(false);
let completedCount = 0;

const getDiceMax = (dt: DiceType): number => parseInt(dt.slice(1), 10);

const selectDiceType = (dt: DiceType) => {
  selectedDiceType.value = dt;
  const max = getDiceMax(dt);
  diceValues.value = diceValues.value.map(() => Math.floor(Math.random() * max) + 1);
};

const rollDice = () => {
  isRolling.value = true;
  completedCount = 0;
  const max = getDiceMax(selectedDiceType.value);
  diceValues.value = diceValues.value.map(() => Math.floor(Math.random() * max) + 1);
};

const onRollComplete = () => {
  completedCount++;
  if (completedCount >= diceValues.value.length) {
    isRolling.value = false;
  }
};

const addDie = () => {
  if (diceValues.value.length < 5) {
    const max = getDiceMax(selectedDiceType.value);
    diceValues.value.push(Math.floor(Math.random() * max) + 1);
  }
};

const removeDie = () => {
  if (diceValues.value.length > 1) {
    diceValues.value.pop();
  }
};
</script>

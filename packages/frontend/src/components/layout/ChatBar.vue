<template>
  <div
    class="bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40 rounded-lg p-3 border border-slate-700"
  >
    <div class="flex items-center gap-2">
      <!-- Message input -->
      <input
        v-model="playerText"
        type="text"
        placeholder="Parle à l'IA..."
        class="input flex-1 min-h-10"
        :disabled="isRolling"
        @keydown.enter.prevent="send"
      >

      <!-- Dice Roll / Send button -->
      <div class="flex gap-2 flex-shrink-0">
        <DiceRoll
          :pending-instruction="pendingInstruction"
          expr="1d20"
          @send="send"
        />
      </div>
    </div>

    <!-- Status indicators (compact) -->
    <div
      v-if="isThinking || isRolling"
      class="mt-2 flex items-center gap-3 text-xs"
    >
      <div
        v-if="isThinking"
        class="text-slate-400 flex items-center gap-1"
      >
        <span class="animate-pulse">⏳</span>
        <span>Réflexion en cours...</span>
      </div>
      <div
        v-if="isRolling && pendingInstruction?.roll"
        class="bg-amber-900/50 text-amber-200 px-2 py-1 rounded border border-amber-700/50"
      >
        🎲 {{ pendingInstruction.roll.dices }}{{ pendingInstruction.roll.modifier ? ` +
                ${pendingInstruction.roll.modifier}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DiceRoll from '../game/DiceRoll.vue';
import { type GameInstruction } from '@rpg-gen/shared';

interface Props {
  playerText: string;
  pendingInstruction: GameInstruction | null;
  isThinking?: boolean;
}

interface Emits {
  (e: 'update:playerText', value: string): void;
  (e: 'send'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isThinking: false,
});

const emit = defineEmits<Emits>();

const playerText = computed({
  get: () => props.playerText,
  set: (value: string) => emit('update:playerText', value),
});

const isRolling = computed(() => !!props.pendingInstruction?.roll);

const send = () => emit('send');
// rolled events are handled centrally via store.latestRoll — no local rebroadcast
</script>

<style scoped>
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}
</style>

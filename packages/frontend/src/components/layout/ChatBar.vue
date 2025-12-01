<template>
  <div
    :class="[
      'bg-linear-to-t from-slate-950 via-slate-900/80 to-slate-900/40 p-3 border border-slate-700',
      connectedTop ? 'rounded-b-lg' : 'rounded-lg'
    ]"
  >
    <div class="relative flex items-center gap-2">
      <!-- Command and argument suggestions dropdown -->
      <CommandSuggestions
        ref="suggestionsRef"
        :input-text="playerText"
        @select-command="handleCommandSelect"
        @select-argument="handleArgumentSelect"
      />

      <!-- Message input -->
      <input
        ref="inputRef"
        v-model="playerText"
        type="text"
        placeholder="Parle à l'IA..."
        class="input flex-1 min-h-10"
        :disabled="isRolling"
        @keydown="handleKeydown"
        @blur="handleBlur"
      >

      <!-- Dice Roll / Send button -->
      <div class="flex gap-2 shrink-0">
        <DiceRoll
          :pending-instruction="gameStore.pendingInstruction?.type === 'roll' ? gameStore.pendingInstruction : null"
          :expr="pendingDiceExpr"
          @send="send"
        />
      </div>
    </div>

    <!-- Status indicators (compact) -->
    <div
      v-if="gameStore.isInitializing || isRolling"
      class="mt-2 flex items-center gap-3 text-xs"
    >
      <div
        v-if="gameStore.isInitializing"
        class="text-slate-400 flex items-center gap-1"
      >
        <span class="animate-pulse">⏳</span>
        <span>Réflexion en cours...</span>
      </div>
      <div
        v-if="isRolling && gameStore.pendingInstruction?.type === 'roll'"
        class="bg-amber-900/50 text-amber-200 px-2 py-1 rounded border border-amber-700/50"
      >
        {{ pendingRollText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { connectedTop = false } = defineProps<{ connectedTop?: boolean }>();
import { useGameStore } from '@/stores/gameStore';
import {
  computed, ref,
} from 'vue';
import DiceRoll from '../game/DiceRoll.vue';
import CommandSuggestions from './CommandSuggestions.vue';

/** Delay in ms before hiding suggestions on blur to allow click events to process */
const SUGGESTION_BLUR_DELAY_MS = 150;

type Emits = (e: 'send') => void;

const emit = defineEmits<Emits>();
const gameStore = useGameStore();

const inputRef = ref<HTMLInputElement | null>(null);
const suggestionsRef = ref<InstanceType<typeof CommandSuggestions> | null>(null);
const showSuggestions = ref(true);

const playerText = computed({
  get: () => gameStore.playerText,
  set: (value: string) => { gameStore.playerText = value; },
});

const isRolling = computed(() => gameStore.pendingInstruction?.type === 'roll');

// Get the dice expression from pending instruction, or default to 1d20
const pendingDiceExpr = computed(() => {
  const p = gameStore.pendingInstruction;
  if (p && p.type === 'roll' && p.dices) {
    return p.dices;
  }
  return '1d20';
});

const pendingRollText = computed(() => {
  const p = gameStore.pendingInstruction;
  if (!p || p.type !== 'roll') return '';
  const modifier = typeof p.modifier === 'string' || typeof p.modifier === 'number' ? p.modifier : (p.modifier ? JSON.stringify(p.modifier) : '');
  return `🎲 ${p.dices}${modifier ? ` +${modifier}` : ''}`;
});

const handleCommandSelect = (command: string) => {
  playerText.value = `/${command} `;
  inputRef.value?.focus();
};

const handleArgumentSelect = (command: string, argument: string) => {
  playerText.value = `/${command} ${argument}`;
  inputRef.value?.focus();
};

const handleKeydown = (event: KeyboardEvent) => {
  const hasSuggestions = suggestionsRef.value?.hasSuggestions;

  if (showSuggestions.value && hasSuggestions) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        suggestionsRef.value?.navigateDown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        suggestionsRef.value?.navigateUp();
        break;
      case 'Tab':
      case 'Enter':
        event.preventDefault();
        suggestionsRef.value?.selectCurrent();
        break;
      case 'Escape':
        event.preventDefault();
        showSuggestions.value = false;
        break;
    }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    send();
  }
};

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, SUGGESTION_BLUR_DELAY_MS);
};

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

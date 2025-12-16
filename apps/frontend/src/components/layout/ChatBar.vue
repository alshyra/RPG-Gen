<template>
  <div
    :class="[
      'bg-linear-to-t from-slate-950 via-slate-900/80 to-slate-900/40 p-3 border border-slate-700',
      connectedTop ? 'rounded-b-lg' : 'rounded-lg',
    ]"
  >
    <!-- Error message with retry button (if available) -->
    <div
      v-if="hasFailedMessage"
      class="mb-3 p-2 bg-red-900/30 border border-red-700/50 rounded text-sm text-red-200 flex items-center justify-between"
    >
      <span>{{ gameStore.lastFailedMessage?.error }}</span>
      <button
        @click="handleRetry"
        class="ml-2 px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs whitespace-nowrap transition-colors"
        :disabled="gameStore.sending"
      >
        {{ gameStore.sending ? '⏳' : '🔄 Renvoyer' }}
      </button>
    </div>

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
        :disabled="isRolling || gameStore.sending"
      />

      <!-- Dice Roll / Send button -->
      <div class="flex gap-2 shrink-0">
        <DiceRoll
          :pending-instruction="
            gameStore.pendingInstruction?.type === 'roll' ? gameStore.pendingInstruction : null
          "
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
const { connectedTop = false, hasFailedMessage = false } = defineProps<{
  connectedTop?: boolean;
  hasFailedMessage?: boolean;
}>();
import { useGameStore } from '@/stores/gameStore';
import { computed, ref } from 'vue';
import DiceRoll from '../game/DiceRoll.vue';

type Emits = {
  send: [];
  retry: [];
};

const emit = defineEmits<Emits>();
const gameStore = useGameStore();

const inputRef = ref<HTMLInputElement | null>(null);

const playerText = computed({
  get: () => gameStore.playerText,
  set: (value: string) => {
    gameStore.playerText = value;
  },
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
  const label = p.modifierLabel ?? '';
  const value = p.modifierValue ?? 0;
  const modDisplay = label ? ` (${label})` : value ? ` +${value}` : '';
  return `🎲 ${p.dices}${modDisplay}`;
});

const handleCommandSelect = (command: string) => {
  playerText.value = `/${command} `;
  inputRef.value?.focus();
};

const handleArgumentSelect = (command: string, argument: string) => {
  playerText.value = `/${command} ${argument}`;
  inputRef.value?.focus();
};

const send = () => emit('send');

const handleRetry = () => emit('retry');

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

<template>
  <div
    class="bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40 rounded-lg p-3 border border-slate-700"
  >
    <div class="relative flex items-center gap-2">
      <!-- Command suggestions dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10"
      >
        <ul class="py-1">
          <li
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.command"
            :class="[
              'px-3 py-2 cursor-pointer transition-colors',
              index === selectedIndex
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-700 text-slate-200'
            ]"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <div class="flex items-center gap-2">
              <span class="font-mono text-sm font-medium">/{{ suggestion.command }}</span>
              <span class="text-slate-400 text-sm">{{ suggestion.description }}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              {{ suggestion.usage }}
            </div>
          </li>
        </ul>
      </div>

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
      <div class="flex gap-2 flex-shrink-0">
        <DiceRoll
          :pending-instruction="gameStore.pendingInstruction"
          expr="1d20"
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
        v-if="isRolling && gameStore.pendingInstruction?.roll"
        class="bg-amber-900/50 text-amber-200 px-2 py-1 rounded border border-amber-700/50"
      >
        🎲 {{ gameStore.pendingInstruction.roll.dices }}{{ gameStore.pendingInstruction.roll.modifier ? ` +
                ${gameStore.pendingInstruction.roll.modifier}` : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DiceRoll from '../game/DiceRoll.vue';
import { useGameStore } from '@/stores/gameStore';
import { getCommandSuggestions, type CommandDefinition } from '@/utils/chatCommands';

interface Emits {
  (e: 'send'): void;
}

const emit = defineEmits<Emits>();
const gameStore = useGameStore();

const inputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);
const showSuggestions = ref(false);

const playerText = computed({
  get: () => gameStore.playerText,
  set: (value: string) => { gameStore.playerText = value; },
});

const isRolling = computed(() => !!gameStore.pendingInstruction?.roll);

const suggestions = computed(() => getCommandSuggestions(playerText.value));

// Watch for changes to update suggestion visibility
watch(suggestions, (newSuggestions) => {
  showSuggestions.value = newSuggestions.length > 0;
  // Reset selection when suggestions change
  if (selectedIndex.value >= newSuggestions.length) {
    selectedIndex.value = 0;
  }
});

const selectSuggestion = (suggestion: CommandDefinition) => {
  playerText.value = `/${suggestion.command} `;
  showSuggestions.value = false;
  // Focus input after selecting
  inputRef.value?.focus();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (showSuggestions.value && suggestions.value.length > 0) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex.value = (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
        break;
      case 'Tab':
      case 'Enter':
        if (suggestions.value[selectedIndex.value]) {
          event.preventDefault();
          selectSuggestion(suggestions.value[selectedIndex.value]);
        }
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
  // Delay hiding to allow click events to process
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
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

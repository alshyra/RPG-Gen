<template>
  <div
    class="bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40 rounded-lg p-3 border border-slate-700"
  >
    <div class="relative flex items-center gap-2">
      <!-- Command suggestions dropdown -->
      <div
        v-if="showSuggestions && suggestionResult.commandSuggestions.length > 0"
        class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10"
      >
        <ul class="py-1">
          <li
            v-for="(suggestion, index) in suggestionResult.commandSuggestions"
            :key="suggestion.command"
            :class="[
              'px-3 py-2 cursor-pointer transition-colors',
              index === selectedIndex
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-700 text-slate-200'
            ]"
            @click="selectCommandSuggestion(suggestion)"
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

      <!-- Argument suggestions dropdown (spells/items) -->
      <div
        v-if="showSuggestions && suggestionResult.argumentSuggestions.length > 0"
        class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto"
      >
        <ul class="py-1">
          <li
            v-for="(suggestion, index) in suggestionResult.argumentSuggestions"
            :key="suggestion.name"
            :class="[
              'px-3 py-2 cursor-pointer transition-colors',
              index === selectedIndex
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-700 text-slate-200'
            ]"
            @click="selectArgumentSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ suggestion.type === 'spell' ? '✨' : '🎒' }}</span>
              <span class="font-medium text-sm">{{ suggestion.name }}</span>
              <span
                v-if="suggestion.description"
                class="text-slate-400 text-sm"
              >{{ suggestion.description }}</span>
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
import { useCharacterStore } from '@/stores/characterStore';
import {
  getAllSuggestions,
  type CommandDefinition,
  type ArgumentSuggestion,
} from '@/utils/chatCommands';

/** Delay in ms before hiding suggestions on blur to allow click events to process */
const SUGGESTION_BLUR_DELAY_MS = 150;

interface Emits {
  (e: 'send'): void;
}

const emit = defineEmits<Emits>();
const gameStore = useGameStore();
const characterStore = useCharacterStore();

const inputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);
const showSuggestions = ref(false);

const playerText = computed({
  get: () => gameStore.playerText,
  set: (value: string) => { gameStore.playerText = value; },
});

const isRolling = computed(() => !!gameStore.pendingInstruction?.roll);

// Calculate character's total level from all classes
const characterLevel = computed(() => {
  const classes = characterStore.currentCharacter?.classes || [];
  return classes.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
});

const suggestionResult = computed(() => getAllSuggestions(
  playerText.value,
  characterStore.currentCharacter?.spells || [],
  characterStore.currentCharacter?.inventory || [],
  characterLevel.value,
));

const totalSuggestions = computed(() =>
  suggestionResult.value.commandSuggestions.length
  + suggestionResult.value.argumentSuggestions.length,
);

// Watch for changes to update suggestion visibility
watch(totalSuggestions, (newTotal) => {
  showSuggestions.value = newTotal > 0;
  // Reset selection when suggestions change
  if (selectedIndex.value >= newTotal) {
    selectedIndex.value = 0;
  }
});

const selectCommandSuggestion = (suggestion: CommandDefinition) => {
  playerText.value = `/${suggestion.command} `;
  showSuggestions.value = false;
  selectedIndex.value = 0;
  // Focus input after selecting
  inputRef.value?.focus();
};

const selectArgumentSuggestion = (suggestion: ArgumentSuggestion) => {
  const { activeCommand } = suggestionResult.value;
  if (activeCommand) {
    playerText.value = `/${activeCommand} ${suggestion.name}`;
  }
  showSuggestions.value = false;
  selectedIndex.value = 0;
  // Focus input after selecting
  inputRef.value?.focus();
};

const handleKeydown = (event: KeyboardEvent) => {
  const { commandSuggestions, argumentSuggestions } = suggestionResult.value;
  const hasSuggestions = commandSuggestions.length > 0 || argumentSuggestions.length > 0;

  if (showSuggestions.value && hasSuggestions) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex.value = (selectedIndex.value + 1) % totalSuggestions.value;
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex.value = (selectedIndex.value - 1 + totalSuggestions.value) % totalSuggestions.value;
        break;
      case 'Tab':
      case 'Enter':
        event.preventDefault();
        if (commandSuggestions.length > 0) {
          selectCommandSuggestion(commandSuggestions[selectedIndex.value]);
        } else if (argumentSuggestions.length > 0) {
          selectArgumentSuggestion(argumentSuggestions[selectedIndex.value]);
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

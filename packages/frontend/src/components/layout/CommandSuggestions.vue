<template>
  <!-- Command suggestions dropdown -->
  <div
    v-if="suggestionResult.commandSuggestions.length > 0"
    class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10"
  >
    <ul class="py-1">
      <li
        v-for="(suggestion, index) in suggestionResult.commandSuggestions"
        :key="suggestion.command"
        :class="getItemClass(index)"
        @click="selectCommand(suggestion)"
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
    v-if="suggestionResult.argumentSuggestions.length > 0"
    class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto"
  >
    <ul class="py-1">
      <li
        v-for="(suggestion, index) in suggestionResult.argumentSuggestions"
        :key="suggestion.name"
        :class="getItemClass(index)"
        @click="selectArgument(suggestion)"
        @mouseenter="selectedIndex = index"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm">{{ getArgumentIcon(suggestion.type) }}</span>
          <span class="font-medium text-sm">{{ suggestion.name }}</span>
          <span
            v-if="suggestion.description"
            class="text-slate-400 text-sm"
          >{{ suggestion.description }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import {
  getAllSuggestions,
  type ArgumentSuggestion,
  type CommandDefinition,
} from '@/utils/chatCommands';
import { computed, ref, watch } from 'vue';

interface Props {
  inputText: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'selectCommand', command: string): void;
  (e: 'selectArgument', command: string, argument: string): void;
}>();

const characterStore = useCharacterStore();
const combatStore = useCombatStore();

const selectedIndex = ref(0);

// Calculate character's total level from all classes
const characterLevel = computed(() => {
  const classes = characterStore.currentCharacter?.classes || [];
  return classes.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
});

const suggestionResult = computed(() => getAllSuggestions(
  props.inputText,
  characterStore.currentCharacter?.spells || [],
  characterStore.currentCharacter?.inventory || [],
  characterLevel.value,
  // pass current valid targets (enemy names) for /attack suggestions
  combatStore.validTargets || [],
));

const totalSuggestions = computed(() => suggestionResult.value.commandSuggestions.length
  + suggestionResult.value.argumentSuggestions.length);

// Reset selection when suggestions change
watch(totalSuggestions, (newTotal) => {
  if (selectedIndex.value >= newTotal) {
    selectedIndex.value = 0;
  }
});

const selectCommand = (suggestion: CommandDefinition) => {
  emit('selectCommand', suggestion.command);
  selectedIndex.value = 0;
};

const selectArgument = (suggestion: ArgumentSuggestion) => {
  const { activeCommand } = suggestionResult.value;
  if (activeCommand) {
    emit('selectArgument', activeCommand, suggestion.name);
  }
  selectedIndex.value = 0;
};

// Helper methods to keep template clean
const getItemClass = (index: number): string[] => [
  'px-3 py-2 cursor-pointer transition-colors',
  index === selectedIndex.value
    ? 'bg-purple-600 text-white'
    : 'hover:bg-slate-700 text-slate-200',
];

const getArgumentIcon = (type: 'spell' | 'item' | 'target'): string => {
  if (type === 'spell') return '✨';
  if (type === 'item') return '🎒';
  return '⚔️';
};

// Expose methods for keyboard navigation from parent
const navigateUp = () => {
  if (totalSuggestions.value > 0) {
    selectedIndex.value = (selectedIndex.value - 1 + totalSuggestions.value) % totalSuggestions.value;
  }
};

const navigateDown = () => {
  if (totalSuggestions.value > 0) {
    selectedIndex.value = (selectedIndex.value + 1) % totalSuggestions.value;
  }
};

const selectCurrent = () => {
  const { commandSuggestions, argumentSuggestions } = suggestionResult.value;
  if (commandSuggestions.length > 0) {
    selectCommand(commandSuggestions[selectedIndex.value]);
  } else if (argumentSuggestions.length > 0) {
    selectArgument(argumentSuggestions[selectedIndex.value]);
  }
};

const hasSuggestions = computed(() => totalSuggestions.value > 0);

defineExpose({
  navigateUp,
  navigateDown,
  selectCurrent,
  hasSuggestions,
});
</script>

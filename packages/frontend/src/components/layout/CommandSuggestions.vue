<template>
  <!-- Command suggestions dropdown -->
  <div
    v-if="commandSuggestions.length > 0"
    class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10"
  >
    <ul class="py-1">
      <li
        v-for="(suggestion, index) in commandSuggestions"
        :key="suggestion.command"
        :class="[
          'px-3 py-2 cursor-pointer transition-colors',
          index === selectedIndex
            ? 'bg-purple-600 text-white'
            : 'hover:bg-slate-700 text-slate-200'
        ]"
        @click="$emit('selectCommand', suggestion)"
        @mouseenter="$emit('update:selectedIndex', index)"
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
    v-if="argumentSuggestions.length > 0"
    class="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto"
  >
    <ul class="py-1">
      <li
        v-for="(suggestion, index) in argumentSuggestions"
        :key="suggestion.name"
        :class="[
          'px-3 py-2 cursor-pointer transition-colors',
          index === selectedIndex
            ? 'bg-purple-600 text-white'
            : 'hover:bg-slate-700 text-slate-200'
        ]"
        @click="$emit('selectArgument', suggestion)"
        @mouseenter="$emit('update:selectedIndex', index)"
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
</template>

<script setup lang="ts">
import type { CommandDefinition, ArgumentSuggestion } from '@/utils/chatCommands';

interface Props {
  commandSuggestions: CommandDefinition[];
  argumentSuggestions: ArgumentSuggestion[];
  selectedIndex: number;
}

defineProps<Props>();

defineEmits<{
  (e: 'selectCommand', suggestion: CommandDefinition): void;
  (e: 'selectArgument', suggestion: ArgumentSuggestion): void;
  (e: 'update:selectedIndex', index: number): void;
}>();
</script>

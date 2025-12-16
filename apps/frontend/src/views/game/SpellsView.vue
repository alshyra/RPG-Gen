<template>
  <div class="p-2">
    <div class="card p-3">
      <h2 class="font-bold text-slate-200 mb-2">Sorts</h2>
      <div
        v-if="!hasSpells"
        class="text-xs text-slate-400"
      >
        Aucun sort appris.
      </div>
      <ul
        v-else
        class="space-y-2"
      >
        <li
          v-for="spell in spells"
          :key="spell.name"
          class="p-2 bg-slate-800/40 rounded border border-slate-700/30 hover:bg-slate-700/40 transition-colors"
        >
          <div class="font-medium text-slate-100">
            {{ spell.name }} <span class="text-xs text-slate-300">Niv {{ spell.level }}</span>
          </div>
          <div
            v-if="spell.description"
            class="text-xs text-slate-400 mt-1"
          >
            {{ spell.description }}
          </div>
          <div class="mt-2">
            <button
              class="text-xs px-2 py-1 bg-purple-600/50 hover:bg-purple-600 rounded text-purple-100 transition-colors"
              @click="onCastSpell(spell.name)"
            >
              Lancer
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { computed } from 'vue';

const currentCharacter = useCurrentCharacter();

const spells = computed(() => currentCharacter?.value?.spells || []);
const hasSpells = computed(() => spells.value.length > 0);

const onCastSpell = (_spellName: string) => {
  throw new Error("Not implemented: cast spell");
};
</script>

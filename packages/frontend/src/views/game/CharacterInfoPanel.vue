<template>
  <!-- Left: character info panel - floating on mobile -->
  <aside
    :class="[
      'lg:col-span-3 lg:row-span-2 flex flex-col gap-2 min-h-0 overflow-hidden',
      'fixed lg:relative top-0 bottom-24 lg:inset-y-0 left-0 w-80 lg:w-auto z-50',
      'bg-slate-900 lg:bg-transparent',
      'transition-transform duration-300 ease-in-out',
      ui.isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div
      v-if="currentCharacter"
      class="p-2 lg:p-0 h-full flex flex-col gap-2 overflow-hidden"
    >
      <CharacterPortrait class="shrink-0" />
      <div class="card flex-1 overflow-auto min-h-0">
        <AbilityScores
          class="mt-3"
        />
        <div class="border-t border-slate-600 mt-3" />
        <nav class="p-3 space-y-2">
          <UiButton
            variant="ghost"
            :to="{ name: 'game' , params: { characterId: currentCharacter.characterId }}"
            class="w-full text-left px-3 py-2"
          >
            Messages
          </UiButton>
          <UiButton
            variant="ghost"
            :to="{ name: 'game-inventory', params: { characterId: currentCharacter.characterId }}"
            class="w-full text-left px-3 py-2"
          >
            Inventaire
          </UiButton>
          <UiButton
            variant="ghost"
            :to="{ name: 'game-skills', params: { characterId: currentCharacter.characterId }}"
            class="w-full text-left px-3 py-2"
          >
            Compétences
          </UiButton>
          <UiButton
            variant="ghost"
            :to="{ name: 'game-spells', params: { characterId: currentCharacter.characterId }}"
            class="w-full text-left px-3 py-2"
          >
            Sorts
          </UiButton>
          <UiButton
            variant="ghost"
            :to="{ name: 'game-quest', params: { characterId: currentCharacter.characterId }}"
            class="w-full text-left px-3 py-2"
          >
            Journal
          </UiButton>
        </nav>
      </div>
    </div>
  </aside>
</template>
<script setup lang="ts">
import AbilityScores from '@/components/character-stats/AbilityScores.vue';
import CharacterPortrait from '@/components/character/CharacterPortrait.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useUiStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const characterStore = useCharacterStore();
const ui = useUiStore();

const { currentCharacter } = storeToRefs(characterStore);

</script>

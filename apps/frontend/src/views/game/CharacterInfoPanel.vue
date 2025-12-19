<template>
  <!-- Left: character info panel - floating on mobile -->
  <aside
    :class="[
      'lg:col-span-3 max-w-[350px]',
      'min-h-0 overflow-hidden',
      'max-lg:fixed lg:relative top-0 bottom-24 lg:inset-y-0 left-0 z-50',
      'bg-slate-900 rounded-lg lg:bg-transparent',
      'transition-transform duration-300 ease-in-out',
      ui.isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div
      v-if="currentCharacter"
      class="p-2 lg:p-0 max-w-[350px] h-full flex flex-col gap-2 overflow-hidden"
    >
      <CharacterPortrait class="shrink-0" />
      <div class="card flex-1 overflow-auto min-h-0">
        <AbilityScores class="mt-3" />
        <div class="border-t border-slate-600 mt-3" />
        <nav class="p-3 space-y-2">
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-message', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            Messages
          </AppRouterButton>
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-inventory', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            Inventaire
          </AppRouterButton>
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-skills', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            Compétences
          </AppRouterButton>
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-spells', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            Sorts
          </AppRouterButton>
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-talents', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            ⭐ Talents
          </AppRouterButton>
          <AppRouterButton
            :disabled="!isInCombat"
            variant="ghost"
            :to="
              isInCombat
                ? { name: 'game-combat', params: { characterId: currentCharacter.characterId } }
                : undefined
            "
            class="w-full text-left px-3 py-2"
            :class="!isInCombat && 'opacity-50 cursor-not-allowed'"
          >
            Combat
          </AppRouterButton>
          <AppRouterButton
            variant="ghost"
            :to="{ name: 'game-quest', params: { characterId: currentCharacter.characterId } }"
            class="w-full text-left px-3 py-2"
          >
            Journal
          </AppRouterButton>
        </nav>
      </div>
    </div>
  </aside>
</template>
<script setup lang="ts">
import AppRouterButton from '@/components/AppRouterButton.vue';
import AbilityScores from '@/components/character-stats/AbilityScores.vue';
import CharacterPortrait from '@/components/character/CharacterPortrait.vue';
import { useCharacterId } from '@/composables/useCharacterId';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { useUiStore } from '@/stores/uiStore';
import { useCombat } from '@rpg-gen/api-client';

const ui = useUiStore();

const characterId = useCharacterId();
const currentCharacter = useCurrentCharacter();
const { isInCombat } = useCombat(characterId);
</script>

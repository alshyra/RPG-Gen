<template>
  <div class="flex flex-col min-h-[calc(100vh-4rem)] p-2 lg:p-4 gap-2 pb-24">
    <!-- Backdrop for mobile sidebar (controlled by ui store) -->
    <div
      v-if="ui.isMenuOpen"
      class="lg:hidden fixed inset-0 bg-black/50 z-30"
      @click="ui.setMenu(false)"
    />

    <!-- Main content area (fills remaining space) -->
    <div
      class="grid lg:grid-cols-12 gap-2 flex-1 min-h-0"
      style="grid-template-rows: 1fr auto;"
    >
      <div class="lg:col-span-3">
        <!-- Desktop : fixed/sticky left panel so it doesn't scroll with the main content -->
        <div class="lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-250px)] lg:z-10">
          <CharacterInfoPanel />
        </div>
      </div>
      <!-- Center: messages (or detail views via child routes) -->
      <main class="lg:col-span-9 flex flex-col min-h-0 overflow-hidden">
        <!-- Only this inner area scrolls; header/other siblings stay fixed -->
        <div
          class="flex-1 min-h-0 overflow-auto"
          :style="{ maxHeight: contentMaxHeight }"
        >
          <router-view />
        </div>
      </main>
    </div>
    <!-- Death modal -->
    <DeathModal
      :is-open="characterStore.showDeathModal"
      @confirm="onDeathConfirm"
      @close="() => (characterStore.showDeathModal = false)"
    />

    <!-- Roll confirmation modal (shows when store.showRollModal is true) -->
    <RollModal />

    <div class="fixed bottom-4 inset-x-4 max-w-5xl mx-auto z-30 pointer-events-none">
      <div class="pointer-events-none">
        <div :class="[ 'w-full h-16 bg-linear-to-t from-slate-900/95 to-transparent backdrop-blur-sm', inCombat ? 'rounded-b-lg' : 'rounded-lg' ]" />
      </div>
    </div>

    <div class="fixed bottom-4 inset-x-4 max-w-5xl mx-auto z-50 pointer-events-none">
      <CombatPanel v-if="inCombat" />
      <div class="pointer-events-auto">
        <ChatBar
          :connected-top="inCombat"
          @send="handleSendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCombatStore } from '@/stores/combatStore';
import { useUiStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import {
  computed, onMounted,
} from 'vue';
import {
  useRoute, useRouter,
} from 'vue-router';
import { characterApi } from '../apis/characterApi';
import CombatPanel from '../components/game/combat-panel/CombatPanel.vue';
import DeathModal from '../components/game/DeathModal.vue';
import RollModal from '../components/game/RollModal.vue';
import ChatBar from '../components/layout/ChatBar.vue';
import { useCombat } from '../composables/useCombat';
import { useGameCommands } from '../composables/useGameCommands';
import { useGameMessages } from '../composables/useGameMessages';
import { useGameSession } from '../composables/useGameSession';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { isCommand } from '../utils/chatCommands';
import CharacterInfoPanel from './game/CharacterInfoPanel.vue';

// State
const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();
const characterStore = useCharacterStore();
const combatStore = useCombatStore();

const ui = useUiStore();
const characterId = computed(() => route.params.characterId as string);

// Composables
const { startGame } = useGameSession();
const { sendMessage } = useGameMessages();
const { handleInput } = useGameCommands();
const combat = useCombat();
const {
  inCombat,
} = storeToRefs(combatStore);
const { pendingInstruction } = storeToRefs(gameStore);

// Ensure rolls watcher / handlers are active for the whole view
// (useGameRolls registers a watch on latestRoll and exposes confirm/reroll)
import { useGameRolls } from '@/composables/useGameRolls';
useGameRolls();

// Replace bottom padding with a max-height so content never scrolls under the fixed bars.
// Keep different values for combat/non-combat states.
const contentMaxHeight = computed(() => {
  if (pendingInstruction.value?.type === 'roll') {
    return 'calc(100vh - 200px)';
  }
  if (inCombat.value) {
    return 'calc(100vh - 12rem)';
  }
  return 'calc(100vh - 160px)';
});

/**
 * Handle sending a message - either as a command or regular message
 */
const handleSendMessage = async () => {
  const input = gameStore.playerText.trim();
  if (!input) return;

  if (isCommand(input)) {
    gameStore.playerText = '';
    await handleInput(input);
  } else {
    await sendMessage();
  }
};

// Load on mount
onMounted(async () => {
  try {
    await startGame();
    // After session started, check backend combat status and initialize the combat store
    try {
      const wasInCombat = await combat.checkCombatStatus();
      // Use console.log so messages appear even when DevTools filters out debug/verbose level
      console.log('[GameView] combat status at startup', { wasInCombat });
    } catch (err) {
      console.warn('Failed to load combat status at startup', err);
    }
  } catch (e) {
    gameStore.appendMessage('system', `Error: ${String(e)}`);
  }
});

// messages auto-scroll moved to MessagesView

// Handle character death
const onDeathConfirm = async () => {
  if (!characterStore.currentCharacter?.characterId) return;
  await characterApi.killCharacter(characterId.value, characterStore.currentCharacter.world);
  characterStore.showDeathModal = false;
  router.push('/');
};
</script>

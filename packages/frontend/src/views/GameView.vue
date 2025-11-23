<template>
  <div class="flex flex-col h-[88vh] p-2 lg:p-4 gap-2">
    <!-- Mobile Menu Toggle Button (only visible on mobile) -->
    <UiButton
      variant="ghost"
      class="lg:hidden fixed top-16 left-2 z-50 !p-2 bg-slate-800 border border-slate-600 shadow-lg"
      @click="toggleSidebar"
    >
      <svg
        v-if="!isSidebarOpen"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <svg
        v-else
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </UiButton>

    <!-- Backdrop for mobile sidebar -->
    <div
      v-if="isSidebarOpen"
      class="lg:hidden fixed inset-0 bg-black/50 z-30"
      @click="toggleSidebar"
    />

    <!-- Main content area (fills remaining space) -->
    <div
      class="grid lg:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden"
      style="grid-template-rows: 1fr auto;"
    >
      <!-- Left: character info panel - floating on mobile -->
      <aside
        :class="[
          'lg:col-span-3 lg:row-span-2 flex flex-col gap-2 min-h-0 overflow-hidden',
          'fixed lg:relative inset-y-0 left-0 w-80 lg:w-auto z-40',
          'bg-slate-900 lg:bg-transparent',
          'transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        ]"
      >
        <div class="p-2 lg:p-0 h-full flex flex-col gap-2 overflow-hidden">
          <CharacterPortrait class="shrink-0" />
          <div class="card flex-1 overflow-auto min-h-0">
            <AbilityScores
              :character="characterStore.currentCharacter"
              class="mt-3"
            />
            <div class="border-t border-slate-600 mt-3" />
            <SkillsPanel
              class="mt-3"
            />
          </div>
        </div>
      </aside>

      <!-- Center: messages (scrollable) -->
      <main class="lg:col-span-9 flex flex-col min-h-0 overflow-hidden">
        <div
          ref="messagesPane"
          class="flex-1 overflow-auto"
        >
          <div class="space-y-3 p-2">
            <div
              v-for="(m, idx) in gameStore.messages"
              :key="idx"
              class="p-2 lg:p-3 rounded-md bg-slate-800/60 border border-slate-700/40"
            >
              <div class="text-xs text-slate-400 font-medium">
                {{ m.role }}
              </div>
              <UiMarkdown :text="m.text" />
            </div>
          </div>
        </div>
      </main>

      <!-- Chat Bar (aligned with messages in grid) -->
      <div class="lg:col-start-4 lg:col-span-9">
        <ChatBar
          :player-text="gameStore.playerText"
          :pending-instruction="gameStore.pendingInstruction"
          :is-thinking="gameStore.isInitializing"
          @update:player-text="(v) => (gameStore.playerText = v)"
          @send="sendMessage"
        />
      </div>

      <!-- Right: roll modal - hidden on mobile, shown as overlay -->
      <aside class="hidden lg:block lg:col-span-3 lg:row-span-1">
        <RollResultModal
          :is-open="gameStore.showRollModal"
          :roll-data="rollData"
          @confirm="confirmRoll"
          @close="() => (gameStore.showRollModal = false)"
        />
      </aside>
    </div>

    <!-- Roll modal overlay for mobile -->
    <div
      v-if="gameStore.showRollModal"
      class="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div class="w-full max-w-md">
        <RollResultModal
          :is-open="true"
          :roll-data="rollData"
          @confirm="confirmRoll"
          @close="() => (gameStore.showRollModal = false)"
        />
      </div>
    </div>

    <!-- Death modal -->
    <DeathModal
      :is-open="characterStore.showDeathModal"
      @confirm="onDeathConfirm"
      @close="() => (characterStore.showDeathModal = false)"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AbilityScores from '../components/character-stats/AbilityScores.vue';
import SkillsPanel from '../components/character-stats/SkillsPanel.vue';
import CharacterPortrait from '../components/character/CharacterPortrait.vue';
import DeathModal from '../components/game/DeathModal.vue';
import RollResultModal from '../components/game/RollResultModal.vue';
import ChatBar from '../components/layout/ChatBar.vue';
import UiButton from '../components/ui/UiButton.vue';
import UiMarkdown from '../components/ui/UiMarkdown.vue';
import { useGameMessages } from '../composables/useGameMessages';
import { useGameRolls } from '../composables/useGameRolls';
import { useGameSession } from '../composables/useGameSession';
import { characterServiceApi } from '../services/characterServiceApi';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';

// State
const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();
const characterStore = useCharacterStore();
const isSidebarOpen = ref(false);
const characterId = computed(() => route.params.characterId as string);

// Composables
const { startGame } = useGameSession();
const { sendMessage } = useGameMessages();
const { rollData, confirmRoll } = useGameRolls();

// DOM refs
const messagesPane = ref<any>(null);

// Toggle sidebar for mobile
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Load on mount
onMounted(async () => {
  try {
    await startGame();
  } catch (e) {
    gameStore.appendMessage('Error', String(e));
  }
});

// auto-scroll to bottom when messages change
watch(
  () => gameStore.messages,
  () => {
    if (messagesPane.value) {
      setTimeout(() => {
        messagesPane.value!.scrollTop = messagesPane.value!.scrollHeight;
      }, 50);
    }
  },
  { deep: true },
);

// Handle character death
const onDeathConfirm = async () => {
  if (!characterStore.currentCharacter?.characterId) return;
  await characterServiceApi.killCharacter(characterId.value, characterStore.currentCharacter.world);
  characterStore.showDeathModal = false;
  router.push('/');
};
</script>

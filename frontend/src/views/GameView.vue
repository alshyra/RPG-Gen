<template>
  <div class="flex flex-col h-[94vh] p-4 gap-2">
    <!-- Main content area (fills remaining space) -->
    <div
      class="grid lg:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden"
      style="grid-template-rows: 1fr auto;"
    >
      <!-- Left: character info panel -->
      <aside class="lg:col-span-3 lg:row-span-2 flex flex-col gap-2 min-h-0 overflow-hidden">
        <CharacterPortrait
          :character="gameStore.session.character"
          class="flex-shrink-0"
        />
        <div class="card flex-1 overflow-auto min-h-0">
          <AbilityScores
            :character="gameStore.session.character"
            class="mt-3"
          />
          <div class="border-t border-slate-600 mt-3" />
          <SkillsPanel
            v-if="gameStore.session.character"
            :character="gameStore.session.character"
            class="mt-3"
          />
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
              class="p-3 rounded-md bg-slate-800/60 border border-slate-700/40"
            >
              <div class="text-xs text-slate-400 font-medium">
                {{ m.role }}
              </div>
              <MarkdownVue :text="m.text" />
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
          @update:player-text="gameStore.setPlayerText($event)"
          @send="sendMessage"
          @rolled="onDiceRolled"
        />
      </div>

      <!-- Right: roll modal -->
      <aside class="lg:col-span-3 lg:row-span-1">
        <RollResultModal
          :is-open="gameStore.showRollModal"
          :skill-name="rollData.skillName"
          :dice-notation="rollData.diceNotation"
          :rolls="rollData.rolls"
          :bonus="rollData.bonus"
          :total="rollData.total"
          @confirm="confirmRoll"
          @reroll="rerollDice"
          @close="gameStore.setRollModalVisible(false)"
        />
      </aside>
    </div>

    <!-- Death modal -->
    <DeathModal
      :is-open="gameStore.showDeathModal"
      :character="gameStore.session.character"
      @confirm="onDeathConfirm"
      @close="gameStore.setDeathModalVisible(false)"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { useGameSession } from '../composables/useGameSession';
import { useGameMessages } from '../composables/useGameMessages';
import { useGameRolls } from '../composables/useGameRolls';
import RollResultModal from '../components/game/RollResultModal.vue';
import DeathModal from '../components/game/DeathModal.vue';
import ChatBar from '../components/layout/ChatBar.vue';
import CharacterPortrait from '../components/character/CharacterPortrait.vue';
import AbilityScores from '../components/character-stats/AbilityScores.vue';
import SkillsPanel from '../components/character-stats/SkillsPanel.vue';
import MarkdownVue from '../ui/markdown.vue';
import { characterService } from '../services/characterService';
import { gameEngine } from '../services/gameEngine';

// State
const router = useRouter();
const gameStore = useGameStore();

// Composables
const { initSession } = useGameSession();
const { sendMessage } = useGameMessages();
const { rollData, onDiceRolled, confirmRoll, rerollDice } = useGameRolls();

// DOM refs
const messagesPane = ref<any>(null);

// Load on mount
onMounted(async () => {
  try {
    await initSession();
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
  { deep: true }
);

// Handle character death
const onDeathConfirm = () => {
  if (!gameStore.session.character?.id) return;
  characterService.killCharacter(gameStore.session.character.id, gameStore.session.worldName);
  gameEngine.clearSession();
  gameStore.setDeathModalVisible(false);
  router.push('/');
};
</script>

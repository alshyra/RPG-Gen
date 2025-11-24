import { rollDice } from '@/services/diceService';
import type { ChatMessage, DiceThrowDto, GameInstruction, RollModalData } from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

// eslint-disable-next-line max-statements
export const useGameStore = defineStore('gameStore', () => {
  const rolls = ref<Array<DiceThrowDto>>([]);
  const latestRoll = ref<DiceThrowDto | null>(null);
  const rollData = ref<RollModalData>({
    rolls: [],
    total: 0,
    bonus: 0,
    diceNotation: '',
    skillName: '',
  });

  // Minimal game session/message/pending instruction state used across app
  const messages = ref<ChatMessage[]>([]);
  const pendingInstruction = ref<GameInstruction | null>(null);
  const playerText = ref('');
  const isInitializing = ref(false);
  const sending = ref(false);
  const showRollModal = ref(false);

  const doRoll = async (expr: string, advantage?: 'advantage' | 'disadvantage' | 'none') => {
    // Call diceService which uses the backend API and returns the roll result
    const res: DiceThrowDto = await rollDice(expr, advantage);
    const payload: DiceThrowDto = { rolls: res.rolls, mod: res.mod, total: res.total, advantage: res.advantage, keptRoll: res.keptRoll, discardedRoll: res.discardedRoll };
    rolls.value.push(payload);
    latestRoll.value = payload;
    return payload;
  };

  // Basic helpers expected by many composables / components
  const appendMessage = (role: string, text: string) => messages.value.push({ role, text, timestamp: Date.now() } as ChatMessage);

  const updateMessages = (list: Array<{ role: string; text: string }>) => {
    messages.value = list as unknown as ChatMessage[];
  };

  return {
    // roll API
    rolls,
    latestRoll,
    rollData,
    doRoll,

    // session / UI state
    messages,
    pendingInstruction,
    playerText,
    isInitializing,
    showRollModal,

    // helpers
    appendMessage,
    // status
    sending,
    updateMessages,
  };
});

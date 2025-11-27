import { rollDice } from '@/apis/diceApi';
import { ChatMessageDto, DiceThrowDto, GameInstructionDto } from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

type DisplayRole = 'user' | 'assistant' | 'system' | 'System' | 'GM' | 'Player' | 'Error';
type RollModalData = {
  dices: string;
  modifier: number;
  description: string;
  advantage: 'advantage' | 'disadvantage' | 'none';
  show: boolean;
};
type StoredRole = 'user' | 'assistant' | 'system';

// Map display roles to stored roles
const toStoredRole = (role: DisplayRole): StoredRole => {
  if (role === 'GM' || role === 'assistant') return 'assistant';
  if (role === 'Player' || role === 'user') return 'user';
  return 'system';
};

export const useGameStore = defineStore('gameStore', () => {
  const rolls = ref<Array<DiceThrowDto>>([]);
  const latestRoll = ref<DiceThrowDto | null>(null);
  const rollData = ref<RollModalData>({
    dices: '',
    modifier: 0,
    description: '',
    advantage: 'none',
    show: false,
  });

  // Minimal game session/message/pending instruction state used across app
  const messages = ref<ChatMessageDto[]>([]);
  const pendingInstruction = ref<GameInstructionDto | null>(null);
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
  // Accepts display roles (GM, Player, System, Error) and maps them to stored roles
  const appendMessage = (role: DisplayRole, text: string) => messages.value.push({ role: toStoredRole(role), text, timestamp: Date.now() });

  const updateMessages = (list: Array<{ role: DisplayRole; text: string }>) => {
    messages.value = list.map(m => ({ role: toStoredRole(m.role), text: m.text, timestamp: Date.now() }));
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

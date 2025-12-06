import { diceApi } from '@/apis/diceApi';
import type {
  ChatMessageDto,
  DiceResultDto,
  GameInstructionDto,
} from '@rpg-gen/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

type DisplayRole = 'user' | 'assistant' | 'system';
interface RollModalData {
  diceNotation?: string;
  rolls?: number[];
  bonus?: number | null;
  total?: number | null;
  skillName?: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  keptRoll?: number | null;
  discardedRoll?: number | null;
  // meta coming from pending instruction (attack/damage)
  action?: string;
  target?: string;
  targetAc?: number | null;
  show?: boolean;
}
type StoredRole = 'user' | 'assistant' | 'system';

// Map display roles to stored roles
function toStoredRole(role: DisplayRole): StoredRole {
  if (role === 'assistant') return 'assistant';
  if (role === 'user') return 'user';
  return 'system';
}

export const useGameStore = defineStore('gameStore', () => {
  const rolls = ref<DiceResultDto[]>([]);
  const latestRoll = ref<DiceResultDto | null>(null);
  const rollData = ref<RollModalData>({});

  // Minimal game session/message/pending instruction state used across app
  const messages = ref<(ChatMessageDto & { timestamp?: number })[]>([]);
  const pendingInstruction = ref<GameInstructionDto | null>(null);
  const playerText = ref('');
  const isInitializing = ref(false);
  const sending = ref(false);
  const showRollModal = ref(false);

  const doRoll = async (expr: string, advantage?: 'advantage' | 'disadvantage' | 'none') => {
    // Call diceService which uses the backend API and returns the roll result
    const diceResultDto = await diceApi.roll(expr, advantage);
    rolls.value.push(diceResultDto);
    latestRoll.value = diceResultDto;
    return diceResultDto;
  };

  // Basic helpers expected by many composables / components
  // Accepts display roles (GM, Player, System, Error) and maps them to stored roles
  const appendMessage = (role: DisplayRole, narrative: string) => messages.value.push({
    role: toStoredRole(role),
    narrative,
    timestamp: Date.now(),
  });

  const updateMessages = (list: {
    role: DisplayRole;
    narrative: string;
  }[]) => {
    messages.value = list.map(m => ({
      role: toStoredRole(m.role),
      narrative: m.narrative,
      timestamp: Date.now(),
    }));
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

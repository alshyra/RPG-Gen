import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CharacterEntry, GameInstruction, GameMessage } from "@shared/types";

export interface GameSession {
  world: string;
  worldName: string;
  character: CharacterEntry | null;
}

const createActions = (s: any, m: any, p: any, pi: any, sr: any, dm: any, c: any) => ({
  setWorld: (world: string, name: string) => {
    s.value.world = world;
    s.value.worldName = name;
  },
  setCharacter: (character: CharacterEntry | null) => {
    s.value.character = character;
  },
  appendMessage: (role: string, text: string) => {
    m.value.push({ role, text });
  },
  updateMessages: (newMessages: GameMessage[]) => {
    m.value = newMessages;
  },
  clearMessages: () => {
    m.value = [];
  },
  setPlayerText: (text: string) => {
    p.value = text;
  },
  clearPlayerText: () => {
    p.value = "";
  },
  updateCharacterHp: (delta: number) => {
    if (s.value.character) {
      const h = Math.max(0, Math.min(c.value, s.value.character.hp + delta));
      s.value.character.hp = h;
    }
  },
  updateCharacterXp: (delta: number) => {
    if (s.value.character) s.value.character.totalXp = (s.value.character.totalXp || 0) + delta;
  },
  setPendingInstruction: (instruction: GameInstruction | null) => {
    pi.value = instruction;
  },
  setInitializing: (value: boolean) => {
    s.initializing = value;
  },
  setSending: (value: boolean) => {
    s.sending = value;
  },
  setRollModalVisible: (value: boolean) => {
    sr.value = value;
  },
  setDeathModalVisible: (value: boolean) => {
    dm.value = value;
  },
  reset: () => {
    m.value = [];
    p.value = "";
    pi.value = null;
    sr.value = false;
    dm.value = false;
  },
});

const gameStoreSession = ref<GameSession>({ world: "", worldName: "—", character: null });
const gameStoreMessages = ref<GameMessage[]>([]);
const gameStorePlayerText = ref("");
const gameStoreIsInitializing = ref(false);
const gameStoreIsSending = ref(false);
const gameStorePendingInstruction = ref<GameInstruction | null>(null);
const gameStoreShowRollModal = ref(false);
const gameStoreShowDeathModal = ref(false);

export const useGameStore = defineStore("game", () => {
  const charHpMax = computed(() => gameStoreSession.value.character?.hpMax || 12);
  const isDead = computed(() => (gameStoreSession.value.character?.hp || 0) === 0);
  const lastMessage = computed(
    () => gameStoreMessages.value[gameStoreMessages.value.length - 1] || null
  );
  const actions = createActions(
    gameStoreSession,
    gameStoreMessages,
    gameStorePlayerText,
    gameStorePendingInstruction,
    gameStoreShowRollModal,
    gameStoreShowDeathModal,
    charHpMax
  );
  return {
    session: gameStoreSession,
    messages: gameStoreMessages,
    playerText: gameStorePlayerText,
    isInitializing: gameStoreIsInitializing,
    isSending: gameStoreIsSending,
    pendingInstruction: gameStorePendingInstruction,
    showRollModal: gameStoreShowRollModal,
    showDeathModal: gameStoreShowDeathModal,
    charHpMax,
    isDead,
    lastMessage,
    ...actions,
  };
});

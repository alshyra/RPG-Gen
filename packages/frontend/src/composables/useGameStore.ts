import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CharacterDto } from '@rpg/shared';
import type { GameInstruction } from '@rpg/shared';
import { characterServiceApi } from '@/services/characterServiceApi';
import { gameEngine } from '@/services/gameEngine';
import { useRouter } from 'vue-router';

export interface GameSession {
  world: string;
  worldName: string;
  character: CharacterDto | null;
}

const createActions = (s: any, p: any, pi: any, sr: any, dm: any) => ({
  setWorld: (world: string, name: string) => {
    s.value.world = world;
    s.value.worldName = name;
  },
  setCharacter: (character: CharacterDto | null) => {
    s.value.character = character;
  },
  setPlayerText: (text: string) => {
    p.value = text;
  },
  clearPlayerText: () => {
    p.value = '';
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
    p.value = '';
    pi.value = null;
    sr.value = false;
    dm.value = false;
  },
});

const gameStoreSession = ref<GameSession>({ world: '', worldName: '—', character: null });
const gameStorePlayerText = ref('');
const gameStoreIsInitializing = ref(false);
const gameStoreIsSending = ref(false);
const gameStorePendingInstruction = ref<GameInstruction | null>(null);
const gameStoreShowRollModal = ref(false);
const gameStoreShowDeathModal = ref(false);

export const useGameStore = defineStore('game', () => {
  const router = useRouter();
  const charHpMax = computed(() => gameStoreSession.value.character?.hpMax || 12);
  const isDead = computed(() => (gameStoreSession.value.character?.hp || 0) === 0);
  const lastMessage = computed(() => null);
  const actions = createActions(
    gameStoreSession,
    gameStorePlayerText,
    gameStorePendingInstruction,
    gameStoreShowRollModal,
    gameStoreShowDeathModal,
  );

  const confirmDeath = async () => {
    if (!gameStoreSession.value.character?.characterId) return;
    await characterServiceApi.killCharacter(
      gameStoreSession.value.character.characterId,
      gameStoreSession.value.worldName,
    );
    gameEngine.endGame();
    gameStoreShowDeathModal.value = false;
    router.push('/');
  };

  return {
    session: gameStoreSession,
    playerText: gameStorePlayerText,
    isInitializing: gameStoreIsInitializing,
    isSending: gameStoreIsSending,
    pendingInstruction: gameStorePendingInstruction,
    showRollModal: gameStoreShowRollModal,
    showDeathModal: gameStoreShowDeathModal,
    charHpMax,
    isDead,
    lastMessage,
    confirmDeath,
    ...actions,
  };
});

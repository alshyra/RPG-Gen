import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CharacterDto } from '@rpg/shared';
import type { GameInstruction } from '@rpg/shared';
import { characterServiceApi } from '@/services/characterServiceApi';
import { gameEngine } from '@/services/gameEngine';
import { useRouter, useRoute } from 'vue-router';

export interface GameSession {
  world: string;
  worldName: string;
  character: CharacterDto | null;
}

const worldMap: Record<string, string> = {
  dnd: 'Dungeons & Dragons',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
};

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

export const useGame = defineStore('game', () => {
  const router = useRouter();
  const route = useRoute();
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

  // Merged from useGame
  const processInitialMessages = (messages: any[], processInstructions: any): any[] =>
    messages.map((msg, i) => {
      const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
      if ((msg as any).instructions && i === messages.length - 1) {
        processInstructions((msg as any).instructions);
      } else if ((msg as any).instructions) {
        (msg as any).instructions?.forEach((instr: any) => {
          if (!instr.roll) {
            processInstructions([instr]);
          }
        });
      }
      return { role, text: msg.text };
    });

  const initializeGame = async (char: CharacterDto, processInstructions: any) => {
    try {
      actions.setCharacter(char);
      if (isDead.value) actions.setDeathModalVisible(true);
      const { messages: initialMessages } = await gameEngine.startGame(char.characterId);
      // Import store dynamically to avoid circular dependency
      const { useConversationMessages } = await import('./useConversationMessages');
      const conversation = useConversationMessages();
      if (initialMessages?.length)
        conversation.updateMessages(processInitialMessages(initialMessages, processInstructions));
    } catch (e: any) {
      const { useConversationMessages } = await import('./useConversationMessages');
      const conversation = useConversationMessages();
      conversation.appendMessage('Error', e?.response?.data?.error || e.message);
    }
  };

  const startGame = async (characterId: string, processInstructions: any): Promise<void> => {
    const char = await characterServiceApi.getCharacterById(characterId);

    actions.setWorld(
      (route.params.world as string) || '',
      worldMap[route.params.world as string] || (route.params.world as string),
    );
    actions.setInitializing(true);
    await initializeGame(char, processInstructions);
    actions.setInitializing(false);
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
    startGame,
    ...actions,
  };
});

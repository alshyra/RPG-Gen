import { useRoute } from 'vue-router';
import { useGameStore } from './useGameStore';
import { useConversationStore } from '@/composables/useConversationStore';
import type { CharacterDto as CharacterDto } from '@rpg/shared';
import { characterServiceApi } from '../services/characterServiceApi';
import { gameEngine } from '../services/gameEngine';
import { useConversation } from './useConversation';

const worldMap: Record<string, string> = {
  dnd: 'Dungeons & Dragons',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
};

const processInitialMessages = (messages: any[], processInstructions: any): any[] =>
  messages.map((msg, i) => {
    const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
    if ((msg as any).instructions && i === messages.length - 1) {
      processInstructions((msg as any).instructions);
    } else if ((msg as any).instructions) {
      // For non-last messages, just process without setting pending instruction
      (msg as any).instructions?.forEach((instr: any) => {
        if (!instr.roll) {
          processInstructions([instr]);
        }
      });
    }
    return { role, text: msg.text };
  });

export const useGameSession = () => {
  const route = useRoute();
  const gameStore = useGameStore();
  const { processInstructions } = useConversation();

  const initializeGame = async (char: CharacterDto) => {
    try {
      gameStore.setCharacter(char);
      if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      const { messages: initialMessages } = await gameEngine.startGame(char.characterId);
      const conversation = useConversationStore();
      if (initialMessages?.length)
        conversation.updateMessages(processInitialMessages(initialMessages, processInstructions));
    } catch (e: any) {
      const conversation = useConversationStore();
      conversation.appendMessage('Error', e?.response?.data?.error || e.message);
    }
  };
  const startGame = async (characterId: string): Promise<void> => {
    const char = await characterServiceApi.getCharacterById(characterId);

    gameStore.setWorld(
      (route.params.world as string) || '',
      worldMap[route.params.world as string] || (route.params.world as string),
    );
    gameStore.setInitializing(true);
    await initializeGame(char);
    gameStore.setInitializing(false);
  };

  return { startGame };
};

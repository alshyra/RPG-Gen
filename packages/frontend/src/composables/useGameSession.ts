import { useRoute } from 'vue-router';
import { useGameStore } from './gameStore';
import { useUiStore } from '@/composables/uiStore';
import { useConversationStore } from '@/composables/conversationStore';
import { useCharacterStore } from '@/composables/characterStore';
import type { CharacterDto as CharacterDto } from '@rpg/shared';
import { characterServiceApi } from '../services/characterServiceApi';
import { gameEngine } from '../services/gameEngine';

const worldMap: Record<string, string> = {
  dnd: 'Dungeons & Dragons',
  vtm: 'Vampire: The Masquerade',
  cyberpunk: 'Cyberpunk',
};

const processInstructionInMessage = (instr: any, isLastMessage: boolean, gameStore: any): void => {
  if (instr.roll) {
    if (isLastMessage) gameStore.setPendingInstruction(instr);
    const conversation = useConversationStore();
    conversation.appendMessage(
      'System',
      `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
    );
  } else if (instr.xp) {
    const conversation = useConversationStore();
    const characterStore = useCharacterStore();
    conversation.appendMessage('System', `✨ Gained ${instr.xp} XP`);
    // Centralized UI notification so other parts of the app (toast, status) can react
    const uiStore = useUiStore();
    uiStore.notify(`Gagné ${instr.xp} XP`);
    characterStore.updateCharacterXp(instr.xp);
  } else if (instr.hp) {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    const conversation = useConversationStore();
    const characterStore = useCharacterStore();
    conversation.appendMessage('System', `❤️ HP changed: ${hpChange}`);
    const uiStore = useUiStore();
    uiStore.notify(`HP ${hpChange}`);
    characterStore.updateCharacterHp(instr.hp);
  }
};

const processInitialMessages = (messages: any[], gameStore: any): any[] =>
  messages.map((msg, i) => {
    const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
    (msg as any).instructions?.forEach((instr: any) =>
      processInstructionInMessage(instr, i === messages.length - 1, gameStore),
    );
    return { role, text: msg.text };
  });

export const useGameSession = () => {
  const route = useRoute();
  const gameStore = useGameStore();

  const initializeGame = async (char: CharacterDto) => {
    try {
      gameStore.setCharacter(char);
      if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      const { messages: initialMessages } = await gameEngine.startGame(char.characterId);
      const conversation = useConversationStore();
      if (initialMessages?.length)
        conversation.updateMessages(processInitialMessages(initialMessages, gameStore));
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

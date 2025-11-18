import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import type { CharacterDto as CharacterDto } from '@backend/src/character/dto/character.dto';
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
    gameStore.appendMessage(
      'System',
      `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`,
    );
  } else if (instr.xp) {
    gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
  } else if (instr.hp) {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
  }
};

const processHistoryMessages = (history: any[], gameStore: any): any[] =>
  history.map((msg, i) => {
    const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
    (msg as any).instructions?.forEach((instr: any) =>
      processInstructionInMessage(instr, i === history.length - 1, gameStore),
    );
    return { role, text: msg.text };
  });

export function useGameSession() {
  const route = useRoute();
  const gameStore = useGameStore();

  const initializeGame = async (char: CharacterDto) => {
    try {
      gameStore.setCharacter(char);
      if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      const { messages: history } = await gameEngine.startGame(char.characterId);
      if (history?.length) gameStore.updateMessages(processHistoryMessages(history, gameStore));
    } catch (e: any) {
      gameStore.appendMessage('Error', e?.response?.data?.error || e.message);
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
}

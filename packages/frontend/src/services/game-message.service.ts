import { gameEngine } from '@/services/gameEngine';
import { useGame } from '@/composables/useGame';

export const sendGameMessage = async (
  characterId: string,
  appendMessage: (role: string, text: string) => void,
  processInstructions?: (instructions?: any[]) => void,
) => {
  const gameStore = useGame();
  if (!gameStore.playerText) return;
  appendMessage('Player', gameStore.playerText);
  appendMessage('System', '...thinking...');
  gameStore.setSending(true);
  try {
    const response = await gameEngine.sendMessage(characterId, gameStore.playerText);
    gameStore.clearPlayerText();
    appendMessage('GM', response.text);
    processInstructions?.(response.instructions);
  } catch (e: any) {
    appendMessage('Error', e?.message || 'Failed to send message');
  } finally {
    gameStore.setSending(false);
  }
};

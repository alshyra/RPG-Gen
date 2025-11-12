import { useGameStore } from '../stores/gameStore';
import { gameEngine } from '../services/gameEngine';

export function useGameMessages() {
  const gameStore = useGameStore();

  const handleMessageResponse = (response: any): void => {
    gameStore.messages.pop();
    gameStore.appendMessage('GM', response.text);
    processInstructions(response.instructions);
  };

  const handleMessageError = (e: any): void => {
    gameStore.messages.pop();
    gameStore.appendMessage('Error', e?.message || 'Failed to send message');
  };

  const sendMessage = async (): Promise<void> => {
    if (!gameStore.playerText) return;
    gameStore.appendMessage('Player', gameStore.playerText);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.setSending(true);
    try {
      const response = await gameEngine.sendMessage(gameStore.playerText);
      gameStore.clearPlayerText();
      handleMessageResponse(response);
    } catch (e: any) {
      handleMessageError(e);
    } finally {
      gameStore.setSending(false);
    }
  };

  const handleRollInstruction = (instr: any): void => {
    gameStore.setPendingInstruction(instr);
    gameStore.appendMessage('System', `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`);
  };

  const handleXpInstruction = (instr: any): void => {
    gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
    gameStore.updateCharacterXp(instr.xp);
  };

  const handleHpInstruction = (instr: any): void => {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
    gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
    gameStore.updateCharacterHp(instr.hp);
    if (gameStore.isDead) gameStore.setDeathModalVisible(true);
  };

  const processInstructions = (instructions: any[]): void => {
    instructions.forEach((instr) => {
      if (instr.roll) handleRollInstruction(instr);
      else if (instr.xp) handleXpInstruction(instr);
      else if (instr.hp) handleHpInstruction(instr);
    });
  };

  return {
    sendMessage,
    processInstructions
  };
}

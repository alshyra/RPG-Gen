import { useGameStore } from '../stores/gameStore';
import { gameEngine } from '../services/gameEngine';

export function useGameMessages() {
  const gameStore = useGameStore();

  /**
   * Send user message to backend and handle response
   */
  async function sendMessage() {
    if (!gameStore.playerText) return;

    gameStore.appendMessage('Player', gameStore.playerText);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.setSending(true);

    try {
      const msgText = gameStore.playerText;
      gameStore.clearPlayerText();
      const response = await gameEngine.sendMessage(msgText);

      // Remove "thinking" message
      gameStore.messages.pop();
      gameStore.appendMessage('GM', response.text);

      // Handle game instructions (roll, xp, hp)
      processInstructions(response.instructions);
    } catch (e: any) {
      gameStore.messages.pop();
      gameStore.appendMessage('Error', e?.message || 'Failed to send message');
    } finally {
      gameStore.setSending(false);
    }
  }

  /**
   * Process game instructions (rolls, XP gains, HP changes)
   */
  function processInstructions(instructions: any[]) {
    for (const instr of instructions) {
      if (instr.roll) {
        gameStore.setPendingInstruction(instr);
        gameStore.appendMessage(
          'System',
          `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`
        );
      } else if (instr.xp) {
        gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
        gameStore.updateCharacterXp(instr.xp);
      } else if (instr.hp) {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
        gameStore.updateCharacterHp(instr.hp);
        if (gameStore.isDead) gameStore.setDeathModalVisible(true);
      }
    }
  }

  return {
    sendMessage,
    processInstructions
  };
}

import { useGameStore } from '../stores/gameStore';
import { gameEngine } from '../services/gameEngine';

// eslint-disable-next-line max-statements
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

  const handleSpellInstruction = (instr: any): void => {
    if (instr.spell.action === 'learn') {
      gameStore.appendMessage('System', `📖 Learned spell: ${instr.spell.name} (Level ${instr.spell.level})`);
      gameStore.learnSpell(instr.spell);
    } else if (instr.spell.action === 'cast') {
      gameStore.appendMessage('System', `✨ Cast spell: ${instr.spell.name}`);
    } else if (instr.spell.action === 'forget') {
      gameStore.appendMessage('System', `🚫 Forgot spell: ${instr.spell.name}`);
      gameStore.forgetSpell(instr.spell.name);
    }
  };

  const handleInventoryInstruction = (instr: any): void => {
    if (instr.inventory.action === 'add') {
      const qty = instr.inventory.quantity || 1;
      gameStore.appendMessage('System', `🎒 Added to inventory: ${instr.inventory.name} (x${qty})`);
      gameStore.addInventoryItem(instr.inventory);
    } else if (instr.inventory.action === 'remove') {
      const qty = instr.inventory.quantity || 1;
      gameStore.appendMessage('System', `🗑️ Removed from inventory: ${instr.inventory.name} (x${qty})`);
      gameStore.removeInventoryItem(instr.inventory.name, qty);
    } else if (instr.inventory.action === 'use') {
      gameStore.appendMessage('System', `⚡ Used item: ${instr.inventory.name}`);
      gameStore.useInventoryItem(instr.inventory.name);
    }
  };

  const processInstructions = (instructions: any[]): void => {
    instructions.forEach((instr) => {
      if (instr.roll) handleRollInstruction(instr);
      else if (instr.xp) handleXpInstruction(instr);
      else if (instr.hp) handleHpInstruction(instr);
      else if (instr.spell) handleSpellInstruction(instr);
      else if (instr.inventory) handleInventoryInstruction(instr);
    });
  };

  return {
    sendMessage,
    processInstructions,
  };
}

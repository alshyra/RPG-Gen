import { useGameStore } from '../stores/gameStore';
import { useCharacterStore } from '../stores/characterStore';
import { conversationService } from '../services/conversationService';
import type { GameInstruction, GameResponse } from '@rpg-gen/shared';

export function useGameMessages() {
  const gameStore = useGameStore();

  const handleMessageResponse = (response: GameResponse): void => {
    gameStore.messages.pop();
    gameStore.appendMessage('GM', response.text);
    processInstructions(response.instructions);
  };

  const handleMessageError = (e: Error | unknown): void => {
    gameStore.messages.pop();
    const message = e instanceof Error ? e.message : 'Failed to send message';
    gameStore.appendMessage('Error', message);
  };

  const sendMessage = async (): Promise<void> => {
    if (!gameStore.playerText) return;
    const messageText = gameStore.playerText;
    gameStore.playerText = '';
    gameStore.appendMessage('Player', messageText);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.sending = true;
    try {
      const response = await conversationService.sendMessage(messageText);
      handleMessageResponse(response);
    } catch (e: unknown) {
      handleMessageError(e);
    } finally {
      gameStore.sending = false;
    }
  };

  const handleRollInstruction = (instr: GameInstruction): void => {
    gameStore.pendingInstruction = instr;
    if (instr.roll) {
      gameStore.appendMessage('System', `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`);
    }
  };

  const handleXpInstruction = (instr: GameInstruction): void => {
    const characterStore = useCharacterStore();
    if (instr.xp !== undefined) {
      gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
      characterStore.updateXp(instr.xp);
    }
  };

  const handleHpInstruction = (instr: GameInstruction): void => {
    if (instr.hp !== undefined) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
      const characterStore = useCharacterStore();
      characterStore.updateHp(instr.hp);
      if (characterStore.isDead) characterStore.showDeathModal = true;
    }
  };

  const handleSpellInstruction = (instr: GameInstruction): void => {
    if (!instr.spell) return;
    if (instr.spell.action === 'learn') {
      gameStore.appendMessage('System', `📖 Learned spell: ${instr.spell.name} (Level ${instr.spell.level})`);
      useCharacterStore().learnSpell(instr.spell);
    } else if (instr.spell.action === 'cast') {
      gameStore.appendMessage('System', `✨ Cast spell: ${instr.spell.name}`);
    } else if (instr.spell.action === 'forget') {
      gameStore.appendMessage('System', `🚫 Forgot spell: ${instr.spell.name}`);
      useCharacterStore().forgetSpell(instr.spell.name);
    }
  };

  const handleInventoryInstruction = (instr: GameInstruction): void => {
    if (!instr.inventory) return;
    if (instr.inventory.action === 'add') {
      const qty = instr.inventory.quantity || 1;
      gameStore.appendMessage('System', `🎒 Added to inventory: ${instr.inventory.name} (x${qty})`);
      useCharacterStore().addInventoryItem(instr.inventory);
    } else if (instr.inventory.action === 'remove') {
      const qty = instr.inventory.quantity || 1;
      gameStore.appendMessage('System', `🗑️ Removed from inventory: ${instr.inventory.name} (x${qty})`);
      useCharacterStore().removeInventoryItem(instr.inventory.name, qty);
    } else if (instr.inventory.action === 'use') {
      gameStore.appendMessage('System', `⚡ Used item: ${instr.inventory.name}`);
      useCharacterStore().useInventoryItem(instr.inventory.name);
    }
  };

  const processInstructions = (instructions: GameInstruction[]): void => {
    instructions.forEach((instr) => {
      if (instr.roll) handleRollInstruction(instr);
      else if (instr.xp !== undefined) handleXpInstruction(instr);
      else if (instr.hp !== undefined) handleHpInstruction(instr);
      else if (instr.spell) handleSpellInstruction(instr);
      else if (instr.inventory) handleInventoryInstruction(instr);
    });
  };

  return {
    sendMessage,
    processInstructions,
  };
}

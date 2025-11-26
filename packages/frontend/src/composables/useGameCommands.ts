import { useGameStore } from '../stores/gameStore';
import { useCharacterStore } from '../stores/characterStore';
import { conversationService } from '../apis/conversationApi';
import { combatService } from '../services/combatService';
import { parseCommand, type ParsedCommand } from '../utils/chatCommands';

export function useGameCommands() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();

  /**
   * Insert a command into the chat input
   */
  const insertCommand = (command: string) => {
    gameStore.playerText = command;
  };

  /**
   * Execute a parsed command
   */
  const executeCommand = async (command: ParsedCommand): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    switch (command.type) {
      case 'cast':
        await executeCastCommand(command.target);
        break;
      case 'use':
        await executeUseCommand(command.target);
        break;
      case 'equip':
        await executeEquipCommand(command.target);
        break;
      case 'attack':
        await executeAttackCommand(command.target);
        break;
    }
  };

  /**
   * Execute a cast spell command
   */
  const executeCastCommand = async (spellName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const spell = character.spells?.find(
      s => s.name.toLowerCase() === spellName.toLowerCase(),
    );

    if (!spell) {
      gameStore.appendMessage('System', `❌ Spell not found: ${spellName}`);
      return;
    }

    gameStore.appendMessage('Player', `I cast ${spell.name}!`);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.sending = true;

    try {
      const response = await conversationService.sendMessage(`I cast the spell ${spell.name}`);
      gameStore.messages.pop();
      gameStore.appendMessage('GM', response.text);
      processInstructions(response.instructions);
    } catch {
      gameStore.messages.pop();
      gameStore.appendMessage('System', `❌ Failed to cast spell: ${spell.name}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Execute a use item command
  /**
   * Execute a use item command
   */
  const executeUseCommand = async (itemName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const item = character.inventory?.find(
      i => (i.name ?? '').toLowerCase() === itemName.toLowerCase(),
    );

    if (!item) {
      gameStore.appendMessage('System', `❌ Item not found: ${itemName}`);
      return;
    }

    gameStore.appendMessage('Player', `I use ${item.name}!`);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.sending = true;

    try {
      const response = await conversationService.sendMessage(`I use the item ${item.name}`);
      gameStore.messages.pop();
      gameStore.appendMessage('GM', response.text);
      processInstructions(response.instructions);
    } catch {
      gameStore.messages.pop();
      gameStore.appendMessage('System', `❌ Failed to use item: ${item.name}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Execute an equip item command
   */
  const executeEquipCommand = async (itemName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const item = character.inventory?.find(
      i => (i.name ?? '').toLowerCase() === itemName.toLowerCase(),
    );

    if (!item) {
      gameStore.appendMessage('System', `❌ Item not found: ${itemName}`);
      return;
    }

    gameStore.appendMessage('Player', `I equip ${item.name}!`);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.sending = true;

    try {
      const response = await conversationService.sendMessage(`I equip the item ${item.name}`);
      gameStore.messages.pop();
      gameStore.appendMessage('GM', response.text);
      processInstructions(response.instructions);
    } catch {
      gameStore.messages.pop();
      gameStore.appendMessage('System', `❌ Failed to equip item: ${item.name}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Execute an attack command - uses backend combat system when in combat
   */
  const executeAttackCommand = async (target: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    gameStore.appendMessage('Player', `J'attaque ${target}!`);
    gameStore.sending = true;

    try {
      // Check if we're in combat mode
      const statusResponse = await combatService.getStatus(character.characterId);

      if (statusResponse.inCombat) {
        // Use backend combat system
        const attackResponse = await combatService.attack(character.characterId, target);

        // Display combat narrative
        gameStore.appendMessage('GM', attackResponse.narrative);

        // Process any instructions (HP changes, XP, etc.)
        if (attackResponse.instructions) {
          processInstructions(attackResponse.instructions);
        }

        // Handle combat end
        if (attackResponse.combatEnded) {
          if (attackResponse.victory) {
            gameStore.appendMessage('System', '🏆 Combat terminé - Victoire!');
          } else if (attackResponse.defeat) {
            gameStore.appendMessage('System', '💀 Combat terminé - Défaite...');
          }
        }
      } else {
        // Not in combat, send to Gemini for narrative handling
        gameStore.appendMessage('System', '...thinking...');
        const response = await conversationService.sendMessage(`I attack ${target}`);
        gameStore.messages.pop();
        gameStore.appendMessage('GM', response.text);
        processInstructions(response.instructions);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to attack';
      gameStore.appendMessage('System', `❌ Erreur: ${errorMsg}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Process game instructions from the response
   * This mirrors the logic from useGameMessages
   */
  const processInstructions = (instructions: unknown[]): void => {
    if (!Array.isArray(instructions)) return;

    instructions.forEach((item: unknown) => {
      const instr = item as Record<string, unknown>;
      if (instr.roll && typeof instr.roll === 'object') {
        const roll = instr.roll as { dices?: string; modifier?: number | string };
        gameStore.pendingInstruction = instr;
        gameStore.appendMessage('System', `🎲 Roll needed: ${roll.dices}${roll.modifier ? ` + ${roll.modifier}` : ''}`);
      } else if (typeof instr.xp === 'number') {
        gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
        characterStore.updateXp(instr.xp);
      } else if (typeof instr.hp === 'number') {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
        characterStore.updateHp(instr.hp);
        if (characterStore.isDead) characterStore.showDeathModal = true;
      } else if (instr.spell && typeof instr.spell === 'object') {
        const spell = instr.spell as { action?: string; name?: string; level?: number };
        if (spell.action === 'learn') {
          gameStore.appendMessage('System', `📖 Learned spell: ${spell.name} (Level ${spell.level})`);
          characterStore.learnSpell(instr.spell as { name: string; level?: number; meta: Record<string, unknown> });
        } else if (spell.action === 'cast') {
          gameStore.appendMessage('System', `✨ Cast spell: ${spell.name}`);
        } else if (spell.action === 'forget') {
          gameStore.appendMessage('System', `🚫 Forgot spell: ${spell.name}`);
          characterStore.forgetSpell(spell.name || '');
        }
      } else if (instr.inventory && typeof instr.inventory === 'object') {
        const inventory = instr.inventory as { action?: string; name?: string; quantity?: number };
        if (inventory.action === 'add') {
          const qty = inventory.quantity || 1;
          gameStore.appendMessage('System', `🎒 Added to inventory: ${inventory.name} (x${qty})`);
          characterStore.addInventoryItem(instr.inventory as { name: string; qty: number });
        } else if (inventory.action === 'remove') {
          const qty = inventory.quantity || 1;
          gameStore.appendMessage('System', `🗑️ Removed from inventory: ${inventory.name} (x${qty})`);
          characterStore.removeInventoryItem(inventory.name, qty);
        } else if (inventory.action === 'use') {
          gameStore.appendMessage('System', `⚡ Used item: ${inventory.name}`);
          characterStore.useInventoryItem(inventory.name || '');
        }
      } else if (instr.combat_start && Array.isArray(instr.combat_start)) {
        // Combat start handled by useGameMessages, just show message
        const enemies = instr.combat_start as { name: string }[];
        const enemyNames = enemies.map(e => e.name).join(', ');
        gameStore.appendMessage('System', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);
      } else if (instr.combat_end && typeof instr.combat_end === 'object') {
        const combatEnd = instr.combat_end as { victory: boolean; xp_gained: number; enemies_defeated: string[] };
        if (combatEnd.victory) {
          gameStore.appendMessage('System', '🏆 Victoire!');
          if (combatEnd.enemies_defeated?.length > 0) {
            gameStore.appendMessage('System', `⚔️ Ennemis vaincus: ${combatEnd.enemies_defeated.join(', ')}`);
          }
          if (combatEnd.xp_gained > 0) {
            characterStore.updateXp(combatEnd.xp_gained);
          }
        } else {
          gameStore.appendMessage('System', '💀 Combat terminé.');
        }
      }
    });
  };

  /**
   * Handle input that might be a command or a regular message
   * Returns true if it was a command that was handled
   */
  const handleInput = async (input: string): Promise<boolean> => {
    const command = parseCommand(input);
    if (command) {
      await executeCommand(command);
      return true;
    }
    return false;
  };

  return {
    insertCommand,
    executeCommand,
    handleInput,
  };
}

import { conversationService } from '../apis/conversationApi';
import { isCombatEndInstruction, isCombatStartInstruction } from '../apis/combatTypes';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { parseCommand, type ParsedCommand } from '../utils/chatCommands';
import { useCombat } from './useCombat';

export function useGameCommands() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const combat = useCombat();

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
      gameStore.appendMessage('GM', response.narrative);
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
      gameStore.appendMessage('GM', response.narrative);
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
      gameStore.appendMessage('GM', response.narrative);
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

    // Check if we're in combat mode (use store first, then check backend)
    if (combatStore.inCombat) {
      await combat.executeAttack(target);
      return;
    }

    // Not in store, check backend status
    const isInCombat = await combat.checkCombatStatus();
    if (isInCombat) {
      await combat.executeAttack(target);
      return;
    }

    // Not in combat, send to Gemini for narrative handling
    gameStore.appendMessage('Player', `J'attaque ${target}!`);
    gameStore.appendMessage('System', '...thinking...');
    gameStore.sending = true;

    try {
      const response = await conversationService.sendMessage(`I attack ${target}`);
      gameStore.messages.pop();
      gameStore.appendMessage('GM', response.narrative);
      processInstructions(response.instructions);
    } catch (err) {
      gameStore.messages.pop();
      const errorMsg = err instanceof Error ? err.message : 'Failed to attack';
      gameStore.appendMessage('System', `❌ Erreur: ${errorMsg}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Process game instructions from the response
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
      } else if (isCombatStartInstruction(item)) {
        // Combat start - delegate to combat composable
        combat.initializeCombat(item);
      } else if (isCombatEndInstruction(item)) {
        // Combat end - delegate to combat composable
        combat.handleCombatEnd(
          item.combat_end.victory,
          item.combat_end.xp_gained,
          item.combat_end.enemies_defeated,
        );
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

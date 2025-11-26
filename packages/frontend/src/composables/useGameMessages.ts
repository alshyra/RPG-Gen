import type { GameInstruction, GameResponse } from '@rpg-gen/shared';
import { conversationService } from '../apis/conversationApi';
import { combatService } from '../services/combatService';
import type { CombatStartInstruction } from '../services/combatTypes';
import {
  isCombatEndInstruction,
  isCombatStartInstruction,
  type CombatEndInstruction
} from '../services/combatTypes';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';

export function useGameMessages() {
  const gameStore = useGameStore();
  const combat = useCombat();

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
      useCharacterStore().forgetSpell(instr.spell.name || '');
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
      useCharacterStore().useInventoryItem(instr.inventory.name || '');
    }
  };

  const handleCombatStartInstruction = async (instr: CombatStartInstruction): Promise<void> => {
    const characterStore = useCharacterStore();
    const character = characterStore.currentCharacter;
    if (!character) return;

    const enemies = instr.combat_start;
    const enemyNames = enemies.map(e => e.name).join(', ');
    gameStore.appendMessage('System', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      const combatState = await combatService.startCombat(character.characterId, instr);

      if (combatState.narrative) {
        gameStore.appendMessage('System', combatState.narrative);
      }

      // Display initiative order
      const initiativeOrder = combatState.turnOrder
        .map(c => `${c.name} (${c.initiative})`)
        .join(' → ');
      gameStore.appendMessage('System', `📋 Ordre d'initiative: ${initiativeOrder}`);
      gameStore.appendMessage('System', 'Utilisez /attack [nom_ennemi] pour attaquer.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start combat';
      gameStore.appendMessage('System', `❌ Erreur de combat: ${errorMsg}`);
    }
  };

  const handleCombatEndInstruction = (instr: CombatEndInstruction): void => {
    const { victory, xp_gained, enemies_defeated } = instr.combat_end;

    if (victory) {
      gameStore.appendMessage('System', '🏆 Victoire!');
      if (enemies_defeated.length > 0) {
        gameStore.appendMessage('System', `⚔️ Ennemis vaincus: ${enemies_defeated.join(', ')}`);
      }
      if (xp_gained > 0) {
        gameStore.appendMessage('System', `✨ XP gagnés: ${xp_gained}`);
        useCharacterStore().updateXp(xp_gained);
      }
    } else {
      gameStore.appendMessage('System', '💀 Combat terminé.');
    }
  };

  const processInstructions = (instructions: unknown[]): void => {
    if (!Array.isArray(instructions)) return;

    instructions.forEach((item) => {
      const instr = item as Record<string, unknown>;
      if (instr.roll) {
        handleRollInstruction(instr);
      } else if (typeof instr.xp === 'number') {
        handleXpInstruction(instr as { xp: number });
      } else if (typeof instr.hp === 'number') {
        handleHpInstruction(instr as { hp: number });
      } else if (instr.spell) {
        handleSpellInstruction(instr);
      } else if (instr.inventory) {
        handleInventoryInstruction(instr);
      } else if (isCombatStartInstruction(item)) {
        // Delegate to combat composable
        combat.initializeCombat(item);
      } else if (isCombatEndInstruction(item)) {
        // Delegate to combat composable
        combat.handleCombatEnd(
          item.combat_end.victory,
          item.combat_end.xp_gained,
          item.combat_end.enemies_defeated,
        );
      }
    });
  };

  return {
    sendMessage,
    processInstructions,
  };
}

import { useGameStore } from '../stores/gameStore';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';

/**
 * Composable for combat-specific actions and state management
 */
export function useCombat() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();

  /**
   * Initialize combat from a combat_start instruction
   */
  const initializeCombat = async (instruction: CombatStartInstruction): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const enemyNames = instruction.combat_start.map(e => e.name).join(', ');
    gameStore.appendMessage('System', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      const combatState = await combatStore.startCombat(character.characterId, instruction);

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

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    gameStore.appendMessage('Player', `J'attaque ${target}!`);
    gameStore.sending = true;

    try {
      const attackResponse = await combatService.attack(character.characterId, target);

      // Update combat store with results
      combatStore.updateFromTurnResult(attackResponse);

      // Display combat narrative
      gameStore.appendMessage('GM', attackResponse.narrative);

      // Process any instructions (HP changes, XP, etc.)
      if (attackResponse.instructions) {
        processAttackInstructions(attackResponse.instructions);
      }

      // Handle combat end
      if (attackResponse.combatEnded) {
        if (attackResponse.victory) {
          gameStore.appendMessage('System', '🏆 Combat terminé - Victoire!');
        } else if (attackResponse.defeat) {
          gameStore.appendMessage('System', '💀 Combat terminé - Défaite...');
        }
        combatStore.clearCombat();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to attack';
      gameStore.appendMessage('System', `❌ Erreur: ${errorMsg}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Process instructions from attack response
   */
  const processAttackInstructions = (instructions: unknown[]): void => {
    if (!Array.isArray(instructions)) return;

    instructions.forEach((item: unknown) => {
      const instr = item as Record<string, unknown>;
      if (typeof instr.xp === 'number') {
        gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
        characterStore.updateXp(instr.xp);
      } else if (typeof instr.hp === 'number') {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
        characterStore.updateHp(instr.hp);
        if (characterStore.isDead) characterStore.showDeathModal = true;
      }
    });
  };

  /**
   * Handle combat end instruction
   */
  const handleCombatEnd = (victory: boolean, xpGained: number, enemiesDefeated: string[]): void => {
    if (victory) {
      gameStore.appendMessage('System', '🏆 Victoire!');
      if (enemiesDefeated.length > 0) {
        gameStore.appendMessage('System', `⚔️ Ennemis vaincus: ${enemiesDefeated.join(', ')}`);
      }
      if (xpGained > 0) {
        gameStore.appendMessage('System', `✨ XP gagnés: ${xpGained}`);
        characterStore.updateXp(xpGained);
      }
    } else {
      gameStore.appendMessage('System', '💀 Combat terminé.');
    }
    combatStore.clearCombat();
  };

  /**
   * Flee from combat
   */
  const fleeCombat = async (): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    try {
      await combatService.endCombat(character.characterId);
      gameStore.appendMessage('System', '🏃 Vous avez fui le combat.');
      combatStore.clearCombat();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to flee';
      gameStore.appendMessage('System', `❌ Erreur: ${errorMsg}`);
    }
  };

  /**
   * Check if currently in combat
   */
  const checkCombatStatus = async (): Promise<boolean> => {
    const character = characterStore.currentCharacter;
    if (!character) return false;

    try {
      const status = await combatStore.fetchStatus(character.characterId);
      return status.inCombat;
    } catch {
      return false;
    }
  };

  return {
    // State (from store)
    inCombat: combatStore.inCombat,
    enemies: combatStore.enemies,
    aliveEnemies: combatStore.aliveEnemies,
    validTargets: combatStore.validTargets,
    currentTarget: combatStore.currentTarget,
    roundNumber: combatStore.roundNumber,

    // Actions
    initializeCombat,
    executeAttack,
    handleCombatEnd,
    fleeCombat,
    checkCombatStatus,
    setTarget: combatStore.setTarget,
  };
}
